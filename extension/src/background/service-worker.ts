/**
 * Background Service Worker for Archive Downloader
 * Manages file downloads, image cleanup on complete, and opening downloaded files.
 */

import { ExtensionMessage, ProgressState } from '../types';
import { sanitizeFilename, formatPageFilename } from '../utils/sanitizer';

let activeState: ProgressState | null = null;
let currentBookImageIds: number[] = [];
let lastPdfDownloadId: number | null = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ArchiveDownloader] Extension installed.');
  chrome.action.setBadgeText({ text: '' });
});

function parseRetryAfterHeader(h: string | null | undefined): number | undefined {
  if (!h) return undefined;
  const trimmed = h.trim();
  const parsedInt = parseInt(trimmed, 10);
  if (!isNaN(parsedInt) && /^\d+$/.test(trimmed)) {
    return parsedInt > 0 ? parsedInt : undefined;
  }
  const dateMs = Date.parse(trimmed);
  if (!isNaN(dateMs)) {
    const diffSec = Math.round((dateMs - Date.now()) / 1000);
    return diffSec > 0 ? diffSec : undefined;
  }
  return undefined;
}

// Monitor network requests for HTTP error statuses (400, 401, 403, 429, 500, 502, 503, etc.)
if (chrome.webRequest && chrome.webRequest.onHeadersReceived) {
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      if (details.statusCode >= 400) {
        console.warn(`[ArchiveDownloader] HTTP error ${details.statusCode} intercepted on ${details.url}`);
        let retryAfter: number | undefined;
        if (details.responseHeaders) {
          const retryHeader = details.responseHeaders.find(h => h.name.toLowerCase() === 'retry-after');
          if (retryHeader && retryHeader.value) {
            retryAfter = parseRetryAfterHeader(retryHeader.value);
          }
        }

        if (details.tabId >= 0) {
          chrome.tabs.sendMessage(details.tabId, {
            type: 'HTTP_ERROR_DETECTED',
            url: details.url,
            statusCode: details.statusCode,
            retryAfter,
          }).catch(() => {});
        }
      }
    },
    {
      urls: [
        'https://*.archive.org/*',
        'https://archive.org/*',
        'https://*.hathitrust.org/*',
        'https://babel.hathitrust.org/*',
      ],
    },
    ['responseHeaders']
  );
}

// Message Dispatcher
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'STATE_UPDATE': {
      activeState = message.state;
      updateBadge(activeState);
      break;
    }

    case 'DOWNLOAD_PAGE_IMAGE': {
      const { pageNum, totalPages, dataUrl, subDir } = message;
      const filename = `${subDir}/pages/${formatPageFilename(pageNum, totalPages, 'jpg')}`;

      chrome.downloads.download(
        {
          url: dataUrl,
          filename,
          conflictAction: 'overwrite',
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('[ArchiveDownloader] Download failed for page', pageNum, chrome.runtime.lastError.message);
          } else if (downloadId) {
            currentBookImageIds.push(downloadId);
          }
        }
      );
      sendResponse({ success: true });
      break;
    }

    case 'SAVE_FINAL_FILES': {
      const { bookTitle, subDir, pdfBlobUrl, markdownContent } = message;
      const safeTitle = sanitizeFilename(bookTitle, 'book');

      // 1. Download PDF if provided
      if (pdfBlobUrl) {
        const pdfFilename = `${subDir}/${safeTitle}.pdf`;
        chrome.downloads.download({
          url: pdfBlobUrl,
          filename: pdfFilename,
          conflictAction: 'overwrite',
          saveAs: false,
        }, (id) => {
          if (chrome.runtime.lastError) {
            console.error('[ArchiveDownloader] Failed to save PDF:', chrome.runtime.lastError.message);
          } else if (id) {
            lastPdfDownloadId = id;
            if (activeState) {
              activeState.pdfDownloadId = id;
            }
            console.log('[ArchiveDownloader] PDF saved to:', pdfFilename, '(downloadId:', id, ')');

            // Once PDF is saved, delete individual image files if cleanup is desired
            cleanupImages();
          }
        });
      }

      // 2. Download Markdown file if provided
      if (markdownContent) {
        const mdDataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdownContent);
        const mdFilename = `${subDir}/${safeTitle}.md`;
        chrome.downloads.download({
          url: mdDataUrl,
          filename: mdFilename,
          conflictAction: 'overwrite',
          saveAs: false,
        }, (id) => {
          if (chrome.runtime.lastError) {
            console.error('[ArchiveDownloader] Failed to save Markdown:', chrome.runtime.lastError.message);
          } else {
            console.log('[ArchiveDownloader] Markdown saved to:', mdFilename);
          }
        });
      }

      // 3. Save info.json for resume/reference
      const infoData = {
        bookTitle,
        subDir,
        pdfFile: `${safeTitle}.pdf`,
        mdFile: `${safeTitle}.md`,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      const infoUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(infoData, null, 2));
      chrome.downloads.download({
        url: infoUrl,
        filename: `${subDir}/info.json`,
        conflictAction: 'overwrite',
        saveAs: false,
      });

      sendResponse({ success: true, pdfDownloadId: lastPdfDownloadId });
      break;
    }

    case 'OPEN_DOWNLOAD': {
      if (lastPdfDownloadId) {
        console.log('[ArchiveDownloader] Opening file in Finder/Explorer for downloadId:', lastPdfDownloadId);
        chrome.downloads.show(lastPdfDownloadId);
      } else {
        // Fallback: search recent downloads
        chrome.downloads.search({ limit: 1, orderBy: ['-startTime'] }, (items) => {
          if (items && items[0]) {
            chrome.downloads.show(items[0].id);
          }
        });
      }
      sendResponse({ success: true });
      break;
    }

    case 'CLEANUP_IMAGES': {
      cleanupImages();
      sendResponse({ success: true });
      break;
    }

    case 'FETCH_IMAGE_DATA_URL': {
      const { url } = message;
      (async () => {
        let res: Response | null = null;
        try {
          res = await fetch(url, { credentials: 'include' });
        } catch (e) {
          // MV3 background service workers may hit CORS origin mismatch when sending credentials from chrome-extension://
          // Falling back to uncredentialed fetch succeeds under extension host_permissions
          res = await fetch(url);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
          binary += String.fromCharCode.apply(null, chunk as any);
        }
        const base64 = btoa(binary);
        const mime = blob.type || 'image/jpeg';
        return `data:${mime};base64,${base64}`;
      })()
        .then((dataUrl) => {
          sendResponse({ success: true, dataUrl });
        })
        .catch((err) => {
          console.warn('[ArchiveDownloader] Background image fetch failed for:', url, err);
          sendResponse({ success: false, error: String(err) });
        });
      return true;
    }

    case 'GET_STATE': {
      sendResponse({ success: true, state: activeState });
      break;
    }
  }

  return true;
});

/**
 * Removes individual downloaded page images from disk upon completion, leaving only the PDF and MD.
 */
function cleanupImages() {
  if (currentBookImageIds.length === 0) return;

  console.log(`[ArchiveDownloader] Cleaning up ${currentBookImageIds.length} temporary page images...`);
  const idsToDelete = [...currentBookImageIds];
  currentBookImageIds = [];

  for (const id of idsToDelete) {
    chrome.downloads.removeFile(id, () => {
      if (chrome.runtime.lastError) {
        // Fallback: erase from download history
        chrome.downloads.erase({ id });
      }
    });
  }
}

function updateBadge(state: ProgressState) {
  if (!state) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  switch (state.status) {
    case 'downloading': {
      const text = state.currentPage > 0 ? String(state.currentPage) : '';
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color: '#3ea6ff' });
      break;
    }
    case 'retrying': {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
      break;
    }
    case 'paused':
    case 'stalled': {
      chrome.action.setBadgeText({ text: '❚❚' });
      chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
      break;
    }
    case 'offline': {
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      break;
    }
    case 'complete': {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      break;
    }
    default:
      chrome.action.setBadgeText({ text: '' });
      break;
  }
}
