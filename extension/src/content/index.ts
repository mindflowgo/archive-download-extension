/**
 * Content Script (Isolated World) for Archive Downloader
 * Manages automation, page cycling, verification, canvas capture, and text fetching.
 */

import { BookInfo, DownloaderConfig, ProgressState, ExtensionMessage, BridgeMessage } from '../types';
import { FloatingPill } from './pill';
import { parseDjvuXmlToText, buildBookMarkdown, PageTextEntry } from '../utils/markdown-builder';
import { compileJpegsToPdf, PdfImageInput } from '../utils/pdf-builder';
import { formatSubdir, formatPageFilename, sanitizeFilename } from '../utils/sanitizer';
import { getActiveProvider, BookProvider, ArchiveProvider, HathiTrustProvider } from '../providers';

(function initContentScript() {
  console.log('[ArchiveDownloader] Initialized on', window.location.href);

  const provider: BookProvider | null = getActiveProvider();
  if (!provider) {
    console.log('[ArchiveDownloader] No matching book provider for', window.location.href);
    return;
  }
  console.log(`[ArchiveDownloader] Active provider: ${provider.siteName} (${provider.siteId})`);

  // State
  let bookInfo: BookInfo | null = null;
  let isRunning = false;
  let isPaused = false;
  let stopRequested = false;
  let currentPage = provider.defaultStartPage;
  let downloadedPages = 0;
  let failedPages = 0;
  let currentRetryCount = 0;
  let lastDimensions = { width: 0, height: 0 };
  let collectedImages: PdfImageInput[] = [];
  let collectedTexts: PageTextEntry[] = [];
  let isEndOfBook = false;

  interface HttpErrorInfo {
    statusCode: number;
    url: string;
    timestamp: number;
    retryAfter?: number;
  }

  let lastHttpError: HttpErrorInfo | null = null;
  let consecutiveErrorCount = 0;

  function onHttpErrorReceived(statusCode: number, url: string, retryAfter?: number) {
    const isBookRelated =
      url.includes('imgsrv') ||
      url.includes('BookReader') ||
      url.includes('/cgi/pt') ||
      url.includes('details') ||
      url.includes('hathitrust.org') ||
      url.includes('archive.org');

    if (!isBookRelated) return;

    console.warn(`[ArchiveDownloader] HTTP error ${statusCode} detected for ${url}`);
    lastHttpError = {
      statusCode,
      url,
      timestamp: Date.now(),
      retryAfter,
    };
  }

  // Load saved settings from localStorage first
  const localSavePath = localStorage.getItem('archive_downloader_save_path');
  const localFolderPattern = localStorage.getItem('archive_downloader_folder_pattern');
  const localStartPage = localStorage.getItem('archive_downloader_start_page');
  const localEndPage = localStorage.getItem('archive_downloader_end_page');
  const localMaxHeight = localStorage.getItem('archive_downloader_max_height');

  let initialStartPage = provider.defaultStartPage;
  if (localStartPage !== null) {
    const parsed = parseInt(localStartPage, 10);
    if (!isNaN(parsed) && parsed >= provider.defaultStartPage) {
      initialStartPage = parsed;
    }
  }

  const defaultConfig: DownloaderConfig = {
    baseDir: localSavePath || 'ArchiveBooks',
    folderPattern: localFolderPattern || '{title}_{id}',
    saveImages: false,
    generatePdf: true,
    saveTextMd: true,
    imageQuality: 0.75,
    maxPageHeight: localMaxHeight !== null ? Math.max(0, parseInt(localMaxHeight, 10)) : 0,
    pageDelayMs: 500,
    pageChangeTimeoutMs: 10000,
    maxRetries: 10,
    autoSinglePage: true,
    startPage: initialStartPage,
    endPage: localEndPage !== null ? Math.max(0, parseInt(localEndPage, 10)) : 0,
    deleteImagesOnComplete: true,
  };

  let config: DownloaderConfig = { ...defaultConfig };

  function saveConfig(updated: Partial<DownloaderConfig>) {
    config = { ...config, ...updated };
    if (config.baseDir) {
      localStorage.setItem('archive_downloader_save_path', config.baseDir);
    }
    if (config.folderPattern) {
      localStorage.setItem('archive_downloader_folder_pattern', config.folderPattern);
    }
    if (typeof config.startPage === 'number') {
      localStorage.setItem('archive_downloader_start_page', String(config.startPage));
    }
    if (typeof config.endPage === 'number') {
      localStorage.setItem('archive_downloader_end_page', String(config.endPage));
    }
    if (typeof config.maxPageHeight === 'number') {
      localStorage.setItem('archive_downloader_max_height', String(config.maxPageHeight));
    }
    chrome.storage.sync.set({ downloaderConfig: config });
    pill.setConfig(config);
  }

  // Load user config from chrome.storage
  chrome.storage.sync.get(['liberatorConfig', 'downloaderConfig'], (res) => {
    const saved = res.downloaderConfig || res.liberatorConfig;
    if (saved) {
      const localPath = localStorage.getItem('archive_downloader_save_path');
      config = {
        ...defaultConfig,
        ...saved,
        ...(localPath ? { baseDir: localPath } : {}),
      };
      pill.setConfig(config);
    }
  });

  // Floating Pill UI with full callbacks
  const pill = new FloatingPill({
    onStart: () => startDownload(),
    onPause: () => pauseDownload(),
    onResume: () => resumeDownload(),
    onStop: () => handleStopRequest(),
    onSaveSettings: (newSettings) => {
      saveConfig(newSettings);
      console.log('[ArchiveDownloader] Settings saved to localStorage:', newSettings);
      broadcastState({
        status: isRunning ? (isPaused ? 'paused' : 'downloading') : 'idle',
        statusText: 'Settings saved to localStorage',
      });
    },
    onSwitchMode: () => enforceSinglePageMode(),
    onViewFile: () => {
      console.log('[ArchiveDownloader] Opening downloaded file in Finder/Explorer...');
      chrome.runtime.sendMessage({ type: 'OPEN_DOWNLOAD' });
    },
  });

  if (pill.shouldRender()) {
    pill.render();
    pill.setConfig(config);
  }

  async function refreshBookInfo() {
    const detected = await provider.detectBookInfo();
    if (detected) {
      bookInfo = detected;
      if (provider instanceof ArchiveProvider) {
        provider.setBookInfo(bookInfo);
      }
      pill.updateProgress(
        bookInfo.currentLeaf ?? provider.defaultStartPage,
        bookInfo.totalPages,
        'Ready',
        'normal',
        isPaused,
        isRunning,
        bookInfo.currentMode ?? 1,
        lastDimensions
      );
      broadcastState();
    }
  }

  // Bridge listener for MAIN world events (HTTP error interception & Archive.org BookReader)
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.direction !== 'FROM_BRIDGE') {
      return;
    }

    const msg = event.data as BridgeMessage;

    // Intercept any non-200 HTTP status (429, 500, 401, etc.)
    if (msg.event === 'HTTP_ERROR') {
      onHttpErrorReceived(msg.statusCode, msg.url, msg.retryAfter);
      return;
    }

    // Forward HathiTrust page announcements, images, and OCR text to provider
    if (provider instanceof HathiTrustProvider) {
      if (msg.event === 'PAGE_LOAD_ANNOUNCED') {
        provider.onPageLoadAnnounced(msg.seq, msg.isVisible, msg.isLoaded);
        return;
      } else if (msg.event === 'PAGE_IMAGE_READY') {
        provider.onPageImageReady(msg.seq, msg.blobUrl);
        return;
      } else if (msg.event === 'PAGE_TEXT_READY') {
        provider.onPageTextReady(msg.seq, msg.html);
        return;
      }
    }

    if (msg.event === 'BOOK_INFO') {
      bookInfo = msg.data;
      if (provider instanceof ArchiveProvider) {
        provider.setBookInfo(bookInfo);
      }

      const domCurrent = provider.getCurrentPage();
      if (domCurrent !== null && (!bookInfo.totalPages || domCurrent > (bookInfo.currentLeaf ?? 0))) {
        bookInfo.currentLeaf = domCurrent;
      }

      pill.updateProgress(
        bookInfo.currentLeaf ?? 0,
        bookInfo.totalPages,
        'Ready',
        'normal',
        isPaused,
        isRunning,
        bookInfo.currentMode,
        lastDimensions
      );
      broadcastState();
    } else if (msg.event === 'MODE_CHANGED') {
      if (bookInfo) {
        bookInfo.currentMode = msg.mode;
        pill.updateProgress(
          currentPage,
          bookInfo.totalPages,
          '1-Page Mode Active',
          'normal',
          isPaused,
          isRunning,
          msg.mode,
          lastDimensions
        );
      }
    }
  });

  // Initial detection
  refreshBookInfo();
  setTimeout(() => refreshBookInfo(), 800);

  // Network connection listeners
  window.addEventListener('offline', () => {
    console.warn('[ArchiveDownloader] Network connection lost (offline)');
    if (isRunning && !isPaused) {
      isPaused = true;
      pill.updateProgress(
        currentPage,
        bookInfo?.totalPages || 0,
        'Offline - Paused',
        'offline',
        true,
        true,
        bookInfo?.currentMode || 1,
        lastDimensions
      );
      broadcastState({ status: 'offline', isOffline: true });
    }
  });

  window.addEventListener('online', () => {
    console.log('[ArchiveDownloader] Network connection restored (online)');
    if (isRunning && isPaused) {
      pill.updateProgress(
        currentPage,
        bookInfo?.totalPages || 0,
        'Online - Click CONTINUE',
        'stalled',
        true,
        true,
        bookInfo?.currentMode || 1,
        lastDimensions
      );
      broadcastState({ status: 'stalled', isOffline: false });
    }
  });

  // Helpers
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  function broadcastState(extra: Partial<ProgressState> = {}) {
    const total = bookInfo?.totalPages || config.endPage || 1;
    let statusType: 'normal' | 'retrying' | 'offline' | 'stalled' | 'complete' = 'normal';

    if (extra.status === 'stalled') statusType = 'stalled';
    else if (extra.status === 'retrying') statusType = 'retrying';
    else if (!navigator.onLine) statusType = 'offline';
    else if (extra.status === 'complete') statusType = 'complete';

    const state: ProgressState = {
      status: isRunning ? (isPaused ? (statusType === 'stalled' ? 'stalled' : 'paused') : 'downloading') : (extra.status || 'idle'),
      currentPage,
      totalPages: total,
      downloadedPages,
      failedPages,
      retryCount: currentRetryCount,
      statusText: isPaused ? (statusType === 'stalled' ? 'Stalled - Click CONTINUE' : 'Paused') : (isRunning ? `Capturing page ${currentPage}` : 'Ready'),
      bookInfo: bookInfo || undefined,
      isPaused,
      isOffline: !navigator.onLine,
      imageDimensions: lastDimensions,
      ...extra,
    };

    pill.updateProgress(
      currentPage,
      total,
      state.statusText,
      statusType,
      isPaused,
      isRunning,
      bookInfo?.currentMode || 1,
      lastDimensions
    );

    chrome.runtime.sendMessage({ type: 'STATE_UPDATE', state }).catch(() => {});
  }

  /**
   * Enforces 1-page view mode via provider if supported.
   */
  async function enforceSinglePageMode(): Promise<boolean> {
    if (provider.enforceSinglePageMode) {
      console.log(`[ArchiveDownloader] Enforcing single-page mode on ${provider.siteName}...`);
      return await provider.enforceSinglePageMode();
    }
    return true;
  }

  /**
   * Captures image from DOM element to JPEG Data URL using an offscreen canvas.
   * Proportianally downscales if maxPageHeight > 0 and height > maxPageHeight.
   * If canvas is tainted by cross-origin resources, cleanly recovers via blob fetch/background proxy.
   */
  async function captureImageToDataUrl(img: HTMLImageElement, quality = 0.75, maxPageHeight = 0): Promise<string> {
    let width = img.naturalWidth || img.width || 0;
    let height = img.naturalHeight || img.height || 0;

    if (maxPageHeight > 0 && height > maxPageHeight) {
      const scale = maxPageHeight / height;
      width = Math.round(width * scale);
      height = maxPageHeight;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not obtain canvas 2D context');

      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', quality);
    } catch (err: any) {
      // Tainted canvas recovery (cross-origin CDN or protected pages)
      if (err.name === 'SecurityError' || String(err).includes('Tainted') || String(err).includes('SecurityError')) {
        console.warn(`[ArchiveDownloader] Canvas tainted for ${img.src}. Recovering via clean blob fetch...`);
        return await fetchCleanDataUrl(img.src, quality, maxPageHeight);
      }
      throw err;
    }
  }

  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function scaleDataUrl(dataUrl: string, quality = 0.75, maxPageHeight = 0): Promise<string> {
    if (maxPageHeight <= 0) return dataUrl;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (height > maxPageHeight) {
          const scale = maxPageHeight / height;
          width = Math.round(width * scale);
          height = maxPageHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async function fetchCleanDataUrl(url: string, quality = 0.75, maxPageHeight = 0): Promise<string> {
    let blob: Blob | null = null;

    // 1. Local fetch (fast path for blob: and CORS-enabled endpoints)
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        blob = await res.blob();
      }
    } catch (e) {}

    // 2. Background service worker fetch (immune to CORS restrictions with host_permissions)
    if (!blob) {
      try {
        const bgRes: any = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'FETCH_IMAGE_DATA_URL', url },
            (response) => resolve(response || { success: false })
          );
        });
        if (bgRes && bgRes.success && bgRes.dataUrl) {
          if (maxPageHeight <= 0) {
            return bgRes.dataUrl;
          }
          return await scaleDataUrl(bgRes.dataUrl, quality, maxPageHeight);
        }
      } catch (e) {}
    }

    if (blob) {
      if (maxPageHeight <= 0) {
        return await blobToDataUrl(blob);
      }
      try {
        const bitmap = await createImageBitmap(blob);
        let width = bitmap.width;
        let height = bitmap.height;
        if (maxPageHeight > 0 && height > maxPageHeight) {
          const scale = maxPageHeight / height;
          width = Math.round(width * scale);
          height = maxPageHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', quality);
        }
      } catch (e) {}
      return await blobToDataUrl(blob);
    }

    throw new Error(`Failed to export image from ${url}`);
  }

  /**
   * Handles non-200 HTTP responses (429, 500, 502, 503, 401, 403, etc.)
   * - 401/403: Pauses download to let user authenticate or renew loan
   * - 429 & 5xx: Initiates exponential backoff with live countdown and increases pacing
   */
  async function handleHttpErrorBackoff(err: HttpErrorInfo, targetPageNum: number) {
    consecutiveErrorCount++;

    // 401 / 403: Auth/Forbidden
    if (err.statusCode === 401 || err.statusCode === 403) {
      console.error(`[ArchiveDownloader] Access restricted (HTTP ${err.statusCode}) on ${err.url}. Pausing.`);
      isPaused = true;
      broadcastState({
        status: 'paused',
        statusText: `Access restricted (HTTP ${err.statusCode}). Please check login or loan status.`,
      });
      return;
    }

    // Rate Limiting (429) & Server Errors (500, 502, 503, 504)
    // If the server explicitly specifies Retry-After, honor it.
    // Otherwise fallback to exponential backoff: 10s, 20s, 40s, capped at 60s.
    const isServerRequested = typeof err.retryAfter === 'number' && !isNaN(err.retryAfter) && err.retryAfter > 0;
    const baseSeconds = isServerRequested
      ? err.retryAfter
      : Math.min(10 * Math.pow(2, Math.max(0, consecutiveErrorCount - 1)), 60);

    // Automatically increase inter-page pacing delay to prevent recurring errors
    const prevDelay = config.pageDelayMs;
    config.pageDelayMs = Math.min(Math.max(config.pageDelayMs, 1500) + 500, 5000);
    if (config.pageDelayMs !== prevDelay) {
      console.log(`[ArchiveDownloader] Increased page pacing delay to ${config.pageDelayMs}ms.`);
    }

    let label = err.statusCode === 429
      ? 'Rate Limited'
      : (err.statusCode >= 500 ? `Server Error (${err.statusCode})` : `HTTP ${err.statusCode}`);

    if (isServerRequested) {
      label += ' (server asked)';
    }

    console.warn(`[ArchiveDownloader] ${label} on ${err.url}. Backing off for ${Math.round(baseSeconds)}s...`);

    for (let remaining = Math.round(baseSeconds); remaining > 0; remaining--) {
      if (stopRequested) return;
      while (isPaused || !navigator.onLine) {
        if (stopRequested) return;
        await sleep(500);
      }

      // Display in minutes if more than 120s, otherwise in seconds
      const timeStr = remaining > 120
        ? `${Math.round(remaining / 60)}m`
        : `${remaining}s`;

      broadcastState({
        status: 'retrying',
        retryCount: consecutiveErrorCount,
        statusText: `${timeStr} Retrying: ${label}.`,
      });
      await sleep(1000);
    }

    // Backoff complete! Re-navigate to targetPageNum so reader re-fetches cleanly
    console.log(`[ArchiveDownloader] Backoff completed. Re-requesting page ${targetPageNum}...`);
    await provider.triggerPageFlip(targetPageNum);
    await sleep(800);
  }

  /**
   * Fast Page Turn & Wait Engine:
   * 1. Triggers page flip via provider.
   * 2. Polls at high frequency (100ms) and returns the new image immediately once visible.
   * 3. Rejects page load if any non-200 HTTP response (429, 500, 401, etc.) was received.
   */
  async function turnAndGetNextImage(
    lastSrc: string,
    targetPageNum: number
  ): Promise<HTMLImageElement | null> {
    let retryAttempt = 0;
    isEndOfBook = false;

    while (retryAttempt <= config.maxRetries) {
      if (stopRequested) return null;

      // Handle pause / offline
      while (isPaused || !navigator.onLine) {
        if (stopRequested) return null;
        await sleep(500);
      }

      // 1. Check if reader is already at end of book
      const totalPages = bookInfo?.totalPages || 0;
      if (provider.isAtEndOfBook && provider.isAtEndOfBook(targetPageNum, totalPages)) {
        console.log(`[ArchiveDownloader] End of book reached at page ${targetPageNum}.`);
        isEndOfBook = true;
        return null;
      }

      const domPageBefore = provider.getCurrentPage();
      if (totalPages > 0 && domPageBefore !== null && domPageBefore >= totalPages && targetPageNum > totalPages) {
        console.log(`[ArchiveDownloader] End of book reached at page ${domPageBefore}.`);
        isEndOfBook = true;
        return null;
      }

      // 2. Trigger page flip or check if already turned
      const alreadyTurned = domPageBefore !== null && domPageBefore >= targetPageNum;

      if (retryAttempt > 0) {
        console.log(`[ArchiveDownloader] Retry ${retryAttempt}: re-triggering flip to page ${targetPageNum}...`);
        await provider.triggerPageFlip(targetPageNum);
        if (retryAttempt >= 2 && provider.navigateToPage) {
          // Direct navigation fallback on repeated stall
          await provider.navigateToPage(targetPageNum);
        }
      } else if (!alreadyTurned) {
        console.log(`[ArchiveDownloader] Flipping to page ${targetPageNum} (attempt 1/${config.maxRetries + 1})...`);
        await provider.triggerPageFlip(targetPageNum);
      } else {
        console.log(`[ArchiveDownloader] DOM indicates page is already on sequence/leaf ${domPageBefore}. Waiting for image.`);
      }

      // 3. Fast poll with HTTP error rejection
      const checkStart = Date.now();
      const timeoutMs = 5000; // 5 seconds max per flip attempt
      let nudged = false;

      while (Date.now() - checkStart < timeoutMs) {
        if (stopRequested) return null;
        while (isPaused || !navigator.onLine) {
          if (stopRequested) return null;
          await sleep(500);
        }

        // CRITICAL: Reject page load if an HTTP error (429, 500, 401, etc.) occurred!
        if (lastHttpError && (Date.now() - lastHttpError.timestamp < 10000)) {
          const err = lastHttpError;
          lastHttpError = null; // consume error
          console.warn(`[ArchiveDownloader] Page ${targetPageNum} load rejected due to HTTP ${err.statusCode} on ${err.url}`);

          // Initiate backoff
          await handleHttpErrorBackoff(err, targetPageNum);

          // Restart polling after backoff
          break;
        }

        // If waiting more than 1500ms without the image appearing, send a nudge flip
        if (!nudged && Date.now() - checkStart > 1500) {
          nudged = true;
          console.log(`[ArchiveDownloader] Image not yet confirmed after 1.5s. Re-triggering flip for page ${targetPageNum}...`);
          await provider.triggerPageFlip(targetPageNum);
        }

        await sleep(100);

        const activeImg = provider.getActivePageImage(300, targetPageNum);
        if (activeImg && activeImg.complete && activeImg.naturalWidth >= 300) {
          // Double check no pending HTTP error before accepting image
          if (lastHttpError && (Date.now() - lastHttpError.timestamp < 3000)) {
            continue; // Do not accept image when error is pending!
          }

          // As soon as the image is visible with a new src (or confirmed matching targetPageNum), return it!
          const isTargetSeq = activeImg.dataset.seq === String(targetPageNum);
          if (activeImg.src && (activeImg.src !== lastSrc || isTargetSeq)) {
            currentRetryCount = 0;
            consecutiveErrorCount = 0;
            console.log(`[ArchiveDownloader] Page ${targetPageNum} visible (${activeImg.naturalWidth}x${activeImg.naturalHeight}px)!`);
            return activeImg;
          }
        }
      }

      // If timed out or backed off without page changing:
      retryAttempt++;
      currentRetryCount = retryAttempt;
      console.warn(
        `[ArchiveDownloader] Page did NOT change after flip attempt ${retryAttempt} for page ${targetPageNum}. Retrying...`
      );

      broadcastState({
        status: 'retrying',
        retryCount: retryAttempt,
        statusText: `Retrying page turn (${retryAttempt}/${config.maxRetries})...`,
      });

      // Quick backoff delay on initial retries: 1s, 2s, 3s... (max 5s)
      const backoffSec = Math.min(retryAttempt, 5);
      await sleep(backoffSec * 1000);
    }

    console.error(`[ArchiveDownloader] Failed to flip to page ${targetPageNum} after ${config.maxRetries} attempts.`);
    return null;
  }

  /**
   * Main download and capture orchestration loop
   */
  async function startDownload(userConfig?: Partial<DownloaderConfig>) {
    if (isRunning && !isPaused) return;

    if (isPaused) {
      resumeDownload();
      return;
    }

    isRunning = true;
    isPaused = false;
    stopRequested = false;
    currentRetryCount = 0;
    downloadedPages = 0;
    failedPages = 0;
    collectedImages = [];
    collectedTexts = [];

    if (userConfig) {
      config = { ...config, ...userConfig };
    }

    // Refresh book detection
    await refreshBookInfo();

    const totalPages = bookInfo?.totalPages || config.endPage || 500;
    const startP = typeof config.startPage === 'number'
      ? Math.max(provider.defaultStartPage, config.startPage)
      : provider.defaultStartPage;

    const maxBookPage = provider.siteId === 'archive' && provider.defaultStartPage === 0
      ? Math.max(0, totalPages - 1)
      : totalPages;

    const endP = config.endPage > 0
      ? config.endPage
      : maxBookPage;

    const bookTitle = bookInfo?.bookTitle || `${provider.siteName} Book`;
    const bookId = bookInfo?.bookId || 'book';
    const subDir = formatSubdir(config.baseDir, config.folderPattern, bookTitle, bookId);

    console.log(`[ArchiveDownloader] Starting download: pages ${startP} to ${endP} into '${subDir}'`);

    // Step 1: Ensure Single-Page Mode if configured and supported
    if (config.autoSinglePage && provider.enforceSinglePageMode) {
      broadcastState({ status: 'ensuring_mode', statusText: 'Switching to 1-page mode...' });
      await enforceSinglePageMode();
      await sleep(600);
    }

    // Step 2: Always navigate to the starting page
    broadcastState({
      status: 'downloading',
      currentPage: startP,
      statusText: `Navigating to page ${startP}...`,
    });
    console.log(`[ArchiveDownloader] Navigating to starting page/leaf ${startP}...`);
    await provider.navigateToPage(startP);

    // Give reader time to load and render startP
    await sleep(1200);

    let lastImgSrc = '';
    let currentImg: HTMLImageElement | null = null;

    for (let pageNum = startP; pageNum <= endP; pageNum++) {
      if (stopRequested) break;

      currentPage = pageNum;
      broadcastState({
        status: 'downloading',
        currentPage,
        statusText: `Capturing page ${pageNum}`,
      });

      // For the first page (or recovery), wait for the image to be ready
      if (!currentImg) {
        const waitImageStart = Date.now();
        while (Date.now() - waitImageStart < 15000) {
          if (stopRequested) break;
          while (isPaused || !navigator.onLine) {
            if (stopRequested) break;
            await sleep(500);
          }

          currentImg = provider.getActivePageImage(300, pageNum);
          if (currentImg) break;
          await sleep(150);
        }
      }

      if (!currentImg) {
        console.warn(`[ArchiveDownloader] Page ${pageNum} image timed out.`);
        failedPages++;
      } else {
        try {
          lastImgSrc = currentImg.src;

          // 1. Capture Image to DataURL (with optional maxPageHeight constraint and tainted canvas recovery)
          const dataUrl = await captureImageToDataUrl(currentImg, config.imageQuality, config.maxPageHeight);

          // Calculate final page dimensions after downscaling (if maxPageHeight not defined or 0 => use original size)
          let pageW = currentImg.naturalWidth || currentImg.width || 0;
          let pageH = currentImg.naturalHeight || currentImg.height || 0;
          if (config.maxPageHeight && config.maxPageHeight > 0 && pageH > config.maxPageHeight) {
            pageW = Math.round(pageW * (config.maxPageHeight / pageH));
            pageH = config.maxPageHeight;
          }
          const dimensions = { width: pageW, height: pageH };
          lastDimensions = dimensions;

          // Store for PDF compiler (deduplicate by pageNum)
          if (config.generatePdf) {
            const existingIdx = collectedImages.findIndex(i => i.pageNum === pageNum);
            if (existingIdx >= 0) {
              collectedImages[existingIdx] = {
                pageNum,
                data: dataUrl,
                width: pageW,
                height: pageH,
              };
            } else {
              collectedImages.push({
                pageNum,
                data: dataUrl,
                width: pageW,
                height: pageH,
              });
            }
          }

          downloadedPages = collectedImages.length;

          // Save individual image file
          if (config.saveImages) {
            chrome.runtime.sendMessage({
              type: 'DOWNLOAD_PAGE_IMAGE',
              bookTitle,
              pageNum,
              totalPages: endP,
              dataUrl,
              subDir,
            });
          }

          // 2. Extract OCR text if enabled, verifying no HTTP errors occurred
          if (config.saveTextMd) {
            try {
              let text = await provider.extractPageText(pageNum, currentImg);
              if (lastHttpError && (Date.now() - lastHttpError.timestamp < 3000)) {
                const err = lastHttpError;
                lastHttpError = null;
                console.warn(`[ArchiveDownloader] OCR text fetch for page ${pageNum} encountered HTTP ${err.statusCode}`);
                await handleHttpErrorBackoff(err, pageNum);
                text = await provider.extractPageText(pageNum, currentImg);
              }

              const existingTextIdx = collectedTexts.findIndex(t => t.pageNum === pageNum);
              if (existingTextIdx >= 0) {
                collectedTexts[existingTextIdx] = { pageNum, leafIndex: pageNum, text };
              } else {
                collectedTexts.push({ pageNum, leafIndex: pageNum, text });
              }
            } catch (err: any) {
              console.warn(`[ArchiveDownloader] Could not extract text for page ${pageNum}:`, err);
            }
          }

          broadcastState({
            currentPage: pageNum,
            downloadedPages,
            currentThumbnail: dataUrl,
            statusText: `Capturing page ${pageNum}`,
            imageDimensions: dimensions,
          });

        } catch (err: any) {
          failedPages++;
          console.error(`[ArchiveDownloader] Error processing page ${pageNum}:`, err);
        }
      }

      // Turn page if not the last page
      if (pageNum < endP && !stopRequested) {
        const nextImg = await turnAndGetNextImage(lastImgSrc, pageNum + 1);
        if (!nextImg) {
          if (isEndOfBook) {
            console.log(`[ArchiveDownloader] Reached end of book at page ${pageNum}. Finalizing.`);
            break;
          }

          // Failed after retries: prompt user to save captured pages!
          console.warn(`[ArchiveDownloader] Could not turn past page ${pageNum}. Prompting user to save.`);
          const count = collectedImages.length || downloadedPages;
          if (count > 0) {
            await handleStopRequest(`Cannot continue past page ${pageNum}. Save all ${count} pages downloaded so far?`);
          }
          break;
        }

        // We already have the next page's verified image ready!
        currentImg = nextImg;

        // Synchronize page counter if viewer is ahead (Archive.org leaf-jumping)
        if (provider.siteId !== 'hathitrust') {
          const domPageNow = provider.getCurrentPage();
          if (domPageNow !== null && domPageNow > pageNum) {
            pageNum = domPageNow - 1; // pageNum++ in the for-loop will set pageNum = domPageNow
          }
        }

        // Delay between pages
        if (config.pageDelayMs > 0) {
          await sleep(config.pageDelayMs);
        }
      }
    }

    // Wrap-up: Generate PDF and Markdown files
    if (!stopRequested && downloadedPages > 0) {
      await finalizeBook(subDir, bookTitle);
    }

    isRunning = false;
    broadcastState({
      status: stopRequested ? 'idle' : 'complete',
      statusText: stopRequested ? 'Stopped by user' : `Completed! Saved ${downloadedPages} pages.`,
    });
  }

  /**
   * Compiles and triggers download for the final PDF and Markdown text document.
   */
  async function finalizeBook(subDir: string, bookTitle: string) {
    // 1. Compile PDF
    if (config.generatePdf && collectedImages.length > 0) {
      broadcastState({ status: 'compiling_pdf', statusText: 'Compiling PDF document...' });
      console.log('[ArchiveDownloader] Assembling PDF from', collectedImages.length, 'pages...');

      try {
        const pdfBytes = compileJpegsToPdf(collectedImages, {
          title: bookTitle,
          author: bookInfo?.author || provider.siteName,
          creator: 'Archive Downloader',
        });

        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);

        chrome.runtime.sendMessage({
          type: 'SAVE_FINAL_FILES',
          bookTitle,
          subDir,
          pdfBlobUrl,
        });

        console.log('[ArchiveDownloader] PDF compiled and sent for download!');
      } catch (err) {
        console.error('[ArchiveDownloader] Failed to compile PDF:', err);
      }
    }

    // 2. Save Markdown text
    if (config.saveTextMd) {
      broadcastState({ status: 'saving_text', statusText: 'Saving Markdown text...' });
      console.log('[ArchiveDownloader] Assembling Markdown from', collectedTexts.length, 'page texts...');

      const mdContent = buildBookMarkdown(
        {
          title: bookTitle,
          bookId: bookInfo?.bookId || 'book',
          author: bookInfo?.author,
          publisher: bookInfo?.publisher,
          year: bookInfo?.year,
          sourceUrl: window.location.href,
          totalPages: bookInfo?.totalPages || currentPage,
        },
        collectedTexts
      );

      chrome.runtime.sendMessage({
        type: 'SAVE_FINAL_FILES',
        bookTitle,
        subDir,
        markdownContent: mdContent,
      });

      console.log('[ArchiveDownloader] Markdown generated and sent for download!');
    }
  }

  function pauseDownload() {
    isPaused = true;
    broadcastState({ status: 'paused', statusText: 'Download paused' });
  }

  function resumeDownload() {
    isPaused = false;
    broadcastState({ status: 'downloading', statusText: `Resuming page ${currentPage}...` });
  }

  async function savePartialAndComplete(count: number) {
    stopRequested = true;
    isPaused = false;
    broadcastState({
      status: 'compiling_pdf',
      statusText: `Saving ${count} captured pages...`,
    });

    const bookTitle = bookInfo?.bookTitle || `${provider.siteName} Book`;
    const bookId = bookInfo?.bookId || 'book';
    const subDir = formatSubdir(config.baseDir, config.folderPattern, bookTitle, bookId);

    await finalizeBook(subDir, bookTitle);

    isRunning = false;
    broadcastState({
      status: 'complete',
      downloadedPages: count,
      statusText: `Completed! Saved ${count} pages.`,
    });
  }

  async function handleStopRequest(customMessage?: string) {
    if (!isRunning) {
      stopDownload();
      return;
    }

    const count = collectedImages.length || downloadedPages;
    if (count > 0) {
      // Temporarily pause the download cycle while user decides
      isPaused = true;
      broadcastState({
        status: 'paused',
        statusText: customMessage || `Paused: Save ${count} pages?`,
      });

      pill.showStopPrompt(
        count,
        async () => {
          // YES: Save everything and treat like complete!
          console.log(`[ArchiveDownloader] User confirmed saving ${count} pages.`);
          await savePartialAndComplete(count);
        },
        () => {
          // DISCARD
          console.log('[ArchiveDownloader] User discarded downloads on stop.');
          stopDownload();
        },
        () => {
          // CANCEL / RESUME
          console.log('[ArchiveDownloader] Resuming download...');
          resumeDownload();
        },
        customMessage
      );
    } else {
      stopDownload();
    }
  }

  function stopDownload() {
    stopRequested = true;
    isRunning = false;
    isPaused = false;
    collectedImages = [];
    collectedTexts = [];
    broadcastState({ status: 'idle', statusText: 'Download stopped' });
  }

  // Handle messages from Popup or Background Service Worker
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_STATE': {
        broadcastState();
        sendResponse({ success: true, bookInfo });
        break;
      }

      case 'START_DOWNLOAD': {
        startDownload(message.config);
        sendResponse({ success: true });
        break;
      }

      case 'PAUSE_DOWNLOAD': {
        pauseDownload();
        sendResponse({ success: true });
        break;
      }

      case 'RESUME_DOWNLOAD': {
        resumeDownload();
        sendResponse({ success: true });
        break;
      }

      case 'STOP_AND_SAVE': {
        const count = collectedImages.length || downloadedPages;
        if (isRunning && count > 0) {
          savePartialAndComplete(count);
        } else {
          stopDownload();
        }
        sendResponse({ success: true });
        break;
      }

      case 'STOP_DOWNLOAD': {
        if (message.saveCollected) {
          const count = collectedImages.length || downloadedPages;
          if (isRunning && count > 0) {
            savePartialAndComplete(count);
            sendResponse({ success: true });
            break;
          }
        }
        stopDownload();
        sendResponse({ success: true });
        break;
      }

      case 'SWITCH_TO_SINGLE_PAGE': {
        enforceSinglePageMode();
        sendResponse({ success: true });
        break;
      }

      case 'SAVE_CONFIG': {
        saveConfig(message.config);
        sendResponse({ success: true, config });
        break;
      }

      case 'GET_CONFIG': {
        sendResponse({ success: true, config });
        break;
      }

      case 'HTTP_ERROR_DETECTED': {
        onHttpErrorReceived(message.statusCode, message.url, message.retryAfter);
        sendResponse({ success: true });
        break;
      }
    }
    return true;
  });
})();
