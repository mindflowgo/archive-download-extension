/**
 * Popup Script for Archive Downloader
 * Manages user controls, settings, and live state updates.
 */

import { BookInfo, DownloaderConfig, ProgressState } from '../types';

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const statusDot = document.getElementById('statusDot') as HTMLElement;
  const statusText = document.getElementById('statusText') as HTMLElement;
  const bookTitle = document.getElementById('bookTitle') as HTMLElement;
  const bookTotalPages = document.getElementById('bookTotalPages') as HTMLElement;
  const bookViewMode = document.getElementById('bookViewMode') as HTMLElement;
  const enforceModeBtn = document.getElementById('enforceModeBtn') as HTMLButtonElement;

  const startPageInput = document.getElementById('startPageInput') as HTMLInputElement;
  const endPageInput = document.getElementById('endPageInput') as HTMLInputElement;

  const progressSection = document.getElementById('progressSection') as HTMLElement;
  const progressCounter = document.getElementById('progressCounter') as HTMLElement;
  const progressPct = document.getElementById('progressPct') as HTMLElement;
  const progressBarFill = document.getElementById('progressBarFill') as HTMLElement;
  const progressDetail = document.getElementById('progressDetail') as HTMLElement;
  const progressDimensions = document.getElementById('progressDimensions') as HTMLElement;
  const thumbnailContainer = document.getElementById('thumbnailContainer') as HTMLElement;
  const thumbnailImg = document.getElementById('thumbnailImg') as HTMLImageElement;

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
  const viewFileBtn = document.getElementById('viewFileBtn') as HTMLButtonElement;
  const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
  const resumeBtn = document.getElementById('resumeBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;

  const settingsToggle = document.getElementById('settingsToggle') as HTMLElement;
  const settingsBody = document.getElementById('settingsBody') as HTMLElement;
  const settingsArrow = document.getElementById('settingsArrow') as HTMLElement;
  const baseDirInput = document.getElementById('baseDirInput') as HTMLInputElement;
  const folderPatternSelect = document.getElementById('folderPatternSelect') as HTMLSelectElement;
  const saveImagesCheck = document.getElementById('saveImagesCheck') as HTMLInputElement;
  const generatePdfCheck = document.getElementById('generatePdfCheck') as HTMLInputElement;
  const saveTextMdCheck = document.getElementById('saveTextMdCheck') as HTMLInputElement;
  const autoSinglePageCheck = document.getElementById('autoSinglePageCheck') as HTMLInputElement;

  const qualitySlider = document.getElementById('qualitySlider') as HTMLInputElement;
  const qualityVal = document.getElementById('qualityVal') as HTMLElement;
  const maxPageHeightInput = document.getElementById('maxPageHeightInput') as HTMLInputElement;
  const delaySlider = document.getElementById('delaySlider') as HTMLInputElement;
  const delayVal = document.getElementById('delayVal') as HTMLElement;
  const retriesSlider = document.getElementById('retriesSlider') as HTMLInputElement;
  const retriesVal = document.getElementById('retriesVal') as HTMLElement;
  const saveSettingsBtn = document.getElementById('saveSettingsBtn') as HTMLButtonElement;

  const logBox = document.getElementById('logBox') as HTMLElement;
  const clearLogBtn = document.getElementById('clearLogBtn') as HTMLButtonElement;

  let currentTabId: number | null = null;
  let activeBook: BookInfo | null = null;
  let currentState: ProgressState | null = null;

  function appendLog(text: string, type: 'info' | 'ok' | 'warn' | 'err' = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${text}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  clearLogBtn.addEventListener('click', () => {
    logBox.innerHTML = '';
  });

  // Settings Accordion
  let settingsOpen = false;
  settingsToggle.addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    settingsBody.style.display = settingsOpen ? 'flex' : 'none';
    settingsArrow.textContent = settingsOpen ? '▾' : '▸';
  });

  // Sliders display values
  qualitySlider.addEventListener('input', () => {
    qualityVal.textContent = `${qualitySlider.value}%`;
  });
  delaySlider.addEventListener('input', () => {
    delayVal.textContent = `${delaySlider.value}ms`;
  });
  retriesSlider.addEventListener('input', () => {
    retriesVal.textContent = retriesSlider.value;
  });

  // Load Saved Settings
  chrome.storage.sync.get(['downloaderConfig', 'liberatorConfig'], (res) => {
    const cfg: DownloaderConfig = res.downloaderConfig || res.liberatorConfig;
    if (cfg) {
      baseDirInput.value = cfg.baseDir || 'ArchiveBooks';
      folderPatternSelect.value = cfg.folderPattern || '{title}_{id}';
      saveImagesCheck.checked = Boolean(cfg.saveImages);
      generatePdfCheck.checked = cfg.generatePdf !== false;
      saveTextMdCheck.checked = cfg.saveTextMd !== false;
      autoSinglePageCheck.checked = cfg.autoSinglePage !== false;

      const q = Math.round((cfg.imageQuality || 0.75) * 100);
      qualitySlider.value = String(q);
      qualityVal.textContent = `${q}%`;

      if (cfg.maxPageHeight !== undefined) {
        maxPageHeightInput.value = cfg.maxPageHeight > 0 ? String(cfg.maxPageHeight) : '';
      }

      delaySlider.value = String(cfg.pageDelayMs || 500);
      delayVal.textContent = `${delaySlider.value}ms`;

      retriesSlider.value = String(cfg.maxRetries || 10);
      retriesVal.textContent = retriesSlider.value;
    }
  });

  function getFormConfig(): Partial<DownloaderConfig> {
    return {
      baseDir: baseDirInput.value.trim() || 'ArchiveBooks',
      folderPattern: folderPatternSelect.value,
      saveImages: saveImagesCheck.checked,
      generatePdf: generatePdfCheck.checked,
      saveTextMd: saveTextMdCheck.checked,
      autoSinglePage: autoSinglePageCheck.checked,
      imageQuality: Number(qualitySlider.value) / 100,
      maxPageHeight: maxPageHeightInput.value !== '' ? Math.max(0, parseInt(maxPageHeightInput.value, 10)) : 0,
      pageDelayMs: Number(delaySlider.value),
      maxRetries: Number(retriesSlider.value),
      startPage: startPageInput.value !== '' ? Math.max(0, parseInt(startPageInput.value, 10)) : 0,
      endPage: endPageInput.value !== '' ? Math.max(0, parseInt(endPageInput.value, 10)) : 0,
      deleteImagesOnComplete: true,
    };
  }

  saveSettingsBtn.addEventListener('click', () => {
    const config = getFormConfig();
    chrome.storage.sync.set({ downloaderConfig: config }, () => {
      appendLog('Settings saved.', 'ok');
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { type: 'SAVE_CONFIG', config });
      }
    });
  });

  // Query Active Tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    statusText.textContent = 'No tab';
    return;
  }
  currentTabId = tab.id;

  const isSupportedSite = tab.url && (tab.url.includes('archive.org') || tab.url.includes('babel.hathitrust.org'));
  if (!isSupportedSite) {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Unsupported site';
    bookTitle.textContent = 'Please navigate to Archive.org or HathiTrust';
    startBtn.disabled = true;
    return;
  }

  // Request Book Info from Content Script
  function refreshTabState() {
    if (!currentTabId) return;
    chrome.tabs.sendMessage(currentTabId, { type: 'GET_STATE' }, (res) => {
      if (chrome.runtime.lastError || !res) {
        statusDot.className = 'status-dot warning';
        statusText.textContent = 'Reader loading...';
        bookTitle.textContent = 'Waiting for book viewer...';
        return;
      }

      if (res.bookInfo) {
        updateBookUI(res.bookInfo);
      }
    });
  }

  refreshTabState();

  function updateBookUI(info: BookInfo) {
    activeBook = info;
    bookTitle.textContent = info.bookTitle || 'Untitled Book';
    bookTitle.title = info.bookTitle;

    bookTotalPages.textContent = info.totalPages > 0 ? `${info.totalPages} pages` : 'Detecting...';
    if (info.totalPages > 0 && !endPageInput.value) {
      endPageInput.value = String(info.totalPages);
    }

    if (info.currentMode === 1) {
      bookViewMode.textContent = '1-Page View (Active)';
      bookViewMode.style.color = 'var(--accent-green)';
      enforceModeBtn.style.display = 'none';
    } else {
      bookViewMode.textContent = info.currentMode === 2 ? '2-Page View' : (info.currentMode === 3 ? 'Thumbnails' : 'Multi-page');
      bookViewMode.style.color = 'var(--accent-yellow)';
      enforceModeBtn.style.display = 'block';
    }

    statusDot.className = 'status-dot active';
    statusText.textContent = 'Ready';
    startBtn.disabled = false;
  }

  // Handle incoming STATE_UPDATE messages from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATE_UPDATE') {
      const state: ProgressState = message.state;
      handleStateUpdate(state);
    }
  });

  function handleStateUpdate(state: ProgressState) {
    currentState = state;
    if (state.bookInfo) {
      updateBookUI(state.bookInfo);
    }

    // Update Status Badge
    switch (state.status) {
      case 'downloading':
        statusDot.className = 'status-dot active';
        statusText.textContent = 'Downloading';
        break;
      case 'retrying':
        statusDot.className = 'status-dot warning';
        statusText.textContent = `Retrying (${state.retryCount})`;
        break;
      case 'paused':
        statusDot.className = 'status-dot';
        statusText.textContent = 'Paused';
        break;
      case 'stalled':
      case 'offline':
        statusDot.className = 'status-dot error';
        statusText.textContent = state.status === 'offline' ? 'Offline' : 'Stalled';
        break;
      case 'complete':
        statusDot.className = 'status-dot complete';
        statusText.textContent = 'Complete';
        break;
      default:
        statusDot.className = 'status-dot active';
        statusText.textContent = 'Ready';
        break;
    }

    // Progress Section
    if (state.status === 'downloading' || state.status === 'retrying' || state.status === 'paused' || state.status === 'stalled' || state.status === 'complete') {
      progressSection.style.display = 'block';
      const pct = state.totalPages > 0 ? Math.min(100, Math.round(((state.currentPage + 1) / state.totalPages) * 100)) : 0;
      progressCounter.textContent = `Page ${state.currentPage} of ${state.totalPages}`;
      progressPct.textContent = `${pct}%`;
      progressBarFill.style.width = `${pct}%`;
      progressDetail.textContent = state.statusText;

      // Image Dimensions
      if (state.imageDimensions && state.imageDimensions.width > 0) {
        progressDimensions.textContent = `(image: ${state.imageDimensions.width} x ${state.imageDimensions.height})`;
      } else {
        progressDimensions.textContent = `(image: - x -)`;
      }

      // Thumbnail
      if (state.currentThumbnail) {
        thumbnailContainer.style.display = 'flex';
        thumbnailImg.src = state.currentThumbnail;
      }

      // Buttons
      startBtn.style.display = 'none';
      continueBtn.style.display = 'none';
      viewFileBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
      stopBtn.style.display = 'none';

      if (state.status === 'complete') {
        viewFileBtn.style.display = 'flex';
        appendLog(`Download complete! ${state.downloadedPages} pages saved.`, 'ok');
      } else if (state.status === 'stalled' || state.status === 'offline') {
        continueBtn.style.display = 'flex';
        stopBtn.style.display = 'flex';
      } else if (state.status === 'downloading' || state.status === 'retrying') {
        pauseBtn.style.display = 'flex';
        stopBtn.style.display = 'flex';
      } else if (state.status === 'paused') {
        resumeBtn.style.display = 'flex';
        stopBtn.style.display = 'flex';
      }
    }

    if (state.statusText) {
      appendLog(state.statusText, state.status === 'retrying' ? 'warn' : (state.status === 'complete' ? 'ok' : 'info'));
    }
  }

  // Button Listeners
  startBtn.addEventListener('click', () => {
    if (!currentTabId) return;
    const config = getFormConfig();
    appendLog(`Starting download: pages ${config.startPage} to ${config.endPage || 'end'}...`, 'info');
    chrome.tabs.sendMessage(currentTabId, { type: 'START_DOWNLOAD', config });
  });

  continueBtn.addEventListener('click', () => {
    if (!currentTabId) return;
    appendLog('Resuming download after stall...', 'info');
    chrome.tabs.sendMessage(currentTabId, { type: 'RESUME_DOWNLOAD' });
  });

  viewFileBtn.addEventListener('click', () => {
    appendLog('Opening file in Finder/Explorer...', 'ok');
    chrome.runtime.sendMessage({ type: 'OPEN_DOWNLOAD' });
  });

  pauseBtn.addEventListener('click', () => {
    if (!currentTabId) return;
    chrome.tabs.sendMessage(currentTabId, { type: 'PAUSE_DOWNLOAD' });
    appendLog('Download paused.', 'warn');
  });

  resumeBtn.addEventListener('click', () => {
    if (!currentTabId) return;
    chrome.tabs.sendMessage(currentTabId, { type: 'RESUME_DOWNLOAD' });
    appendLog('Download resumed.', 'info');
  });

  stopBtn.addEventListener('click', () => {
    if (!currentTabId) return;

    if (currentState && (currentState.downloadedPages > 0 || currentState.status === 'downloading')) {
      const count = currentState.downloadedPages || 0;
      const save = window.confirm(
        `Save all ${count} pages downloaded so far?\n\n- Click OK to compile PDF/MD and save files\n- Click Cancel to discard`
      );
      if (save) {
        appendLog(`Stopping and saving ${count} pages...`, 'ok');
        chrome.tabs.sendMessage(currentTabId, { type: 'STOP_AND_SAVE' });
        return;
      }
    }

    chrome.tabs.sendMessage(currentTabId, { type: 'STOP_DOWNLOAD' });
    appendLog('Download stopped.', 'err');
    startBtn.style.display = 'flex';
    continueBtn.style.display = 'none';
    viewFileBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'none';
    stopBtn.style.display = 'none';
  });

  enforceModeBtn.addEventListener('click', () => {
    if (!currentTabId) return;
    appendLog('Switching book viewer to 1-page mode...', 'info');
    chrome.tabs.sendMessage(currentTabId, { type: 'SWITCH_TO_SINGLE_PAGE' }, () => {
      setTimeout(refreshTabState, 800);
    });
  });
});
