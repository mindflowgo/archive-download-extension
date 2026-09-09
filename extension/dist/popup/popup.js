// extension/src/popup/popup.ts
document.addEventListener("DOMContentLoaded", async () => {
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const bookTitle = document.getElementById("bookTitle");
  const bookTotalPages = document.getElementById("bookTotalPages");
  const bookViewMode = document.getElementById("bookViewMode");
  const enforceModeBtn = document.getElementById("enforceModeBtn");
  const startPageInput = document.getElementById("startPageInput");
  const endPageInput = document.getElementById("endPageInput");
  const progressSection = document.getElementById("progressSection");
  const progressCounter = document.getElementById("progressCounter");
  const progressPct = document.getElementById("progressPct");
  const progressBarFill = document.getElementById("progressBarFill");
  const progressDetail = document.getElementById("progressDetail");
  const progressDimensions = document.getElementById("progressDimensions");
  const thumbnailContainer = document.getElementById("thumbnailContainer");
  const thumbnailImg = document.getElementById("thumbnailImg");
  const startBtn = document.getElementById("startBtn");
  const continueBtn = document.getElementById("continueBtn");
  const viewFileBtn = document.getElementById("viewFileBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const stopBtn = document.getElementById("stopBtn");
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsBody = document.getElementById("settingsBody");
  const settingsArrow = document.getElementById("settingsArrow");
  const baseDirInput = document.getElementById("baseDirInput");
  const folderPatternSelect = document.getElementById("folderPatternSelect");
  const saveImagesCheck = document.getElementById("saveImagesCheck");
  const generatePdfCheck = document.getElementById("generatePdfCheck");
  const saveTextMdCheck = document.getElementById("saveTextMdCheck");
  const autoSinglePageCheck = document.getElementById("autoSinglePageCheck");
  const qualitySlider = document.getElementById("qualitySlider");
  const qualityVal = document.getElementById("qualityVal");
  const maxPageHeightInput = document.getElementById("maxPageHeightInput");
  const delaySlider = document.getElementById("delaySlider");
  const delayVal = document.getElementById("delayVal");
  const retriesSlider = document.getElementById("retriesSlider");
  const retriesVal = document.getElementById("retriesVal");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const logBox = document.getElementById("logBox");
  const clearLogBtn = document.getElementById("clearLogBtn");
  let currentTabId = null;
  let activeBook = null;
  let currentState = null;
  function appendLog(text, type = "info") {
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${text}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }
  clearLogBtn.addEventListener("click", () => {
    logBox.innerHTML = "";
  });
  let settingsOpen = false;
  settingsToggle.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    settingsBody.style.display = settingsOpen ? "flex" : "none";
    settingsArrow.textContent = settingsOpen ? "▾" : "▸";
  });
  qualitySlider.addEventListener("input", () => {
    qualityVal.textContent = `${qualitySlider.value}%`;
  });
  delaySlider.addEventListener("input", () => {
    delayVal.textContent = `${delaySlider.value}ms`;
  });
  retriesSlider.addEventListener("input", () => {
    retriesVal.textContent = retriesSlider.value;
  });
  chrome.storage.sync.get(["downloaderConfig", "liberatorConfig"], (res) => {
    const cfg = res.downloaderConfig || res.liberatorConfig;
    if (cfg) {
      baseDirInput.value = cfg.baseDir || "ArchiveBooks";
      folderPatternSelect.value = cfg.folderPattern || "{title}_{id}";
      saveImagesCheck.checked = Boolean(cfg.saveImages);
      generatePdfCheck.checked = cfg.generatePdf !== false;
      saveTextMdCheck.checked = cfg.saveTextMd !== false;
      autoSinglePageCheck.checked = cfg.autoSinglePage !== false;
      const q = Math.round((cfg.imageQuality || 0.75) * 100);
      qualitySlider.value = String(q);
      qualityVal.textContent = `${q}%`;
      if (cfg.maxPageHeight !== undefined) {
        maxPageHeightInput.value = cfg.maxPageHeight > 0 ? String(cfg.maxPageHeight) : "";
      }
      delaySlider.value = String(cfg.pageDelayMs || 500);
      delayVal.textContent = `${delaySlider.value}ms`;
      retriesSlider.value = String(cfg.maxRetries || 10);
      retriesVal.textContent = retriesSlider.value;
    }
  });
  function getFormConfig() {
    return {
      baseDir: baseDirInput.value.trim() || "ArchiveBooks",
      folderPattern: folderPatternSelect.value,
      saveImages: saveImagesCheck.checked,
      generatePdf: generatePdfCheck.checked,
      saveTextMd: saveTextMdCheck.checked,
      autoSinglePage: autoSinglePageCheck.checked,
      imageQuality: Number(qualitySlider.value) / 100,
      maxPageHeight: maxPageHeightInput.value !== "" ? Math.max(0, parseInt(maxPageHeightInput.value, 10)) : 0,
      pageDelayMs: Number(delaySlider.value),
      maxRetries: Number(retriesSlider.value),
      startPage: startPageInput.value !== "" ? Math.max(0, parseInt(startPageInput.value, 10)) : 0,
      endPage: endPageInput.value !== "" ? Math.max(0, parseInt(endPageInput.value, 10)) : 0,
      deleteImagesOnComplete: true
    };
  }
  saveSettingsBtn.addEventListener("click", () => {
    const config = getFormConfig();
    chrome.storage.sync.set({ downloaderConfig: config }, () => {
      appendLog("Settings saved.", "ok");
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { type: "SAVE_CONFIG", config });
      }
    });
  });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    statusText.textContent = "No tab";
    return;
  }
  currentTabId = tab.id;
  const isSupportedSite = tab.url && (tab.url.includes("archive.org") || tab.url.includes("babel.hathitrust.org"));
  if (!isSupportedSite) {
    statusDot.className = "status-dot";
    statusText.textContent = "Unsupported site";
    bookTitle.textContent = "Please navigate to Archive.org or HathiTrust";
    startBtn.disabled = true;
    return;
  }
  function refreshTabState() {
    if (!currentTabId)
      return;
    chrome.tabs.sendMessage(currentTabId, { type: "GET_STATE" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        statusDot.className = "status-dot warning";
        statusText.textContent = "Reader loading...";
        bookTitle.textContent = "Waiting for book viewer...";
        return;
      }
      if (res.bookInfo) {
        updateBookUI(res.bookInfo);
      }
    });
  }
  refreshTabState();
  function updateBookUI(info) {
    activeBook = info;
    bookTitle.textContent = info.bookTitle || "Untitled Book";
    bookTitle.title = info.bookTitle;
    bookTotalPages.textContent = info.totalPages > 0 ? `${info.totalPages} pages` : "Detecting...";
    if (info.totalPages > 0 && !endPageInput.value) {
      endPageInput.value = String(info.totalPages);
    }
    if (info.currentMode === 1) {
      bookViewMode.textContent = "1-Page View (Active)";
      bookViewMode.style.color = "var(--accent-green)";
      enforceModeBtn.style.display = "none";
    } else {
      bookViewMode.textContent = info.currentMode === 2 ? "2-Page View" : info.currentMode === 3 ? "Thumbnails" : "Multi-page";
      bookViewMode.style.color = "var(--accent-yellow)";
      enforceModeBtn.style.display = "block";
    }
    statusDot.className = "status-dot active";
    statusText.textContent = "Ready";
    startBtn.disabled = false;
  }
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATE_UPDATE") {
      const state = message.state;
      handleStateUpdate(state);
    }
  });
  function handleStateUpdate(state) {
    currentState = state;
    if (state.bookInfo) {
      updateBookUI(state.bookInfo);
    }
    switch (state.status) {
      case "downloading":
        statusDot.className = "status-dot active";
        statusText.textContent = "Downloading";
        break;
      case "retrying":
        statusDot.className = "status-dot warning";
        statusText.textContent = `Retrying (${state.retryCount})`;
        break;
      case "paused":
        statusDot.className = "status-dot";
        statusText.textContent = "Paused";
        break;
      case "stalled":
      case "offline":
        statusDot.className = "status-dot error";
        statusText.textContent = state.status === "offline" ? "Offline" : "Stalled";
        break;
      case "complete":
        statusDot.className = "status-dot complete";
        statusText.textContent = "Complete";
        break;
      default:
        statusDot.className = "status-dot active";
        statusText.textContent = "Ready";
        break;
    }
    if (state.status === "downloading" || state.status === "retrying" || state.status === "paused" || state.status === "stalled" || state.status === "complete") {
      progressSection.style.display = "block";
      const pct = state.totalPages > 0 ? Math.min(100, Math.round((state.currentPage + 1) / state.totalPages * 100)) : 0;
      progressCounter.textContent = `Page ${state.currentPage} of ${state.totalPages}`;
      progressPct.textContent = `${pct}%`;
      progressBarFill.style.width = `${pct}%`;
      progressDetail.textContent = state.statusText;
      if (state.imageDimensions && state.imageDimensions.width > 0) {
        progressDimensions.textContent = `(image: ${state.imageDimensions.width} x ${state.imageDimensions.height})`;
      } else {
        progressDimensions.textContent = `(image: - x -)`;
      }
      if (state.currentThumbnail) {
        thumbnailContainer.style.display = "flex";
        thumbnailImg.src = state.currentThumbnail;
      }
      startBtn.style.display = "none";
      continueBtn.style.display = "none";
      viewFileBtn.style.display = "none";
      pauseBtn.style.display = "none";
      resumeBtn.style.display = "none";
      stopBtn.style.display = "none";
      if (state.status === "complete") {
        viewFileBtn.style.display = "flex";
        appendLog(`Download complete! ${state.downloadedPages} pages saved.`, "ok");
      } else if (state.status === "stalled" || state.status === "offline") {
        continueBtn.style.display = "flex";
        stopBtn.style.display = "flex";
      } else if (state.status === "downloading" || state.status === "retrying") {
        pauseBtn.style.display = "flex";
        stopBtn.style.display = "flex";
      } else if (state.status === "paused") {
        resumeBtn.style.display = "flex";
        stopBtn.style.display = "flex";
      }
    }
    if (state.statusText) {
      appendLog(state.statusText, state.status === "retrying" ? "warn" : state.status === "complete" ? "ok" : "info");
    }
  }
  startBtn.addEventListener("click", () => {
    if (!currentTabId)
      return;
    const config = getFormConfig();
    appendLog(`Starting download: pages ${config.startPage} to ${config.endPage || "end"}...`, "info");
    chrome.tabs.sendMessage(currentTabId, { type: "START_DOWNLOAD", config });
  });
  continueBtn.addEventListener("click", () => {
    if (!currentTabId)
      return;
    appendLog("Resuming download after stall...", "info");
    chrome.tabs.sendMessage(currentTabId, { type: "RESUME_DOWNLOAD" });
  });
  viewFileBtn.addEventListener("click", () => {
    appendLog("Opening file in Finder/Explorer...", "ok");
    chrome.runtime.sendMessage({ type: "OPEN_DOWNLOAD" });
  });
  pauseBtn.addEventListener("click", () => {
    if (!currentTabId)
      return;
    chrome.tabs.sendMessage(currentTabId, { type: "PAUSE_DOWNLOAD" });
    appendLog("Download paused.", "warn");
  });
  resumeBtn.addEventListener("click", () => {
    if (!currentTabId)
      return;
    chrome.tabs.sendMessage(currentTabId, { type: "RESUME_DOWNLOAD" });
    appendLog("Download resumed.", "info");
  });
  stopBtn.addEventListener("click", () => {
    if (!currentTabId)
      return;
    if (currentState && (currentState.downloadedPages > 0 || currentState.status === "downloading")) {
      const count = currentState.downloadedPages || 0;
      const save = window.confirm(`Save all ${count} pages downloaded so far?

- Click OK to compile PDF/MD and save files
- Click Cancel to discard`);
      if (save) {
        appendLog(`Stopping and saving ${count} pages...`, "ok");
        chrome.tabs.sendMessage(currentTabId, { type: "STOP_AND_SAVE" });
        return;
      }
    }
    chrome.tabs.sendMessage(currentTabId, { type: "STOP_DOWNLOAD" });
    appendLog("Download stopped.", "err");
    startBtn.style.display = "flex";
    continueBtn.style.display = "none";
    viewFileBtn.style.display = "none";
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "none";
    stopBtn.style.display = "none";
  });
  enforceModeBtn.addEventListener("click", () => {
    if (!currentTabId)
      return;
    appendLog("Switching book viewer to 1-page mode...", "info");
    chrome.tabs.sendMessage(currentTabId, { type: "SWITCH_TO_SINGLE_PAGE" }, () => {
      setTimeout(refreshTabState, 800);
    });
  });
});

//# debugId=80D2B9ED760B6E5564756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL3BvcHVwL3BvcHVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIi8qKlxuICogUG9wdXAgU2NyaXB0IGZvciBBcmNoaXZlIERvd25sb2FkZXJcbiAqIE1hbmFnZXMgdXNlciBjb250cm9scywgc2V0dGluZ3MsIGFuZCBsaXZlIHN0YXRlIHVwZGF0ZXMuXG4gKi9cblxuaW1wb3J0IHsgQm9va0luZm8sIERvd25sb2FkZXJDb25maWcsIFByb2dyZXNzU3RhdGUgfSBmcm9tICcuLi90eXBlcyc7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBhc3luYyAoKSA9PiB7XG4gIC8vIERPTSBFbGVtZW50c1xuICBjb25zdCBzdGF0dXNEb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzRG90JykgYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IHN0YXR1c1RleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzVGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBib29rVGl0bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9va1RpdGxlJykgYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IGJvb2tUb3RhbFBhZ2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jvb2tUb3RhbFBhZ2VzJykgYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IGJvb2tWaWV3TW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib29rVmlld01vZGUnKSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgZW5mb3JjZU1vZGVCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZW5mb3JjZU1vZGVCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcblxuICBjb25zdCBzdGFydFBhZ2VJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGFydFBhZ2VJbnB1dCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IGVuZFBhZ2VJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbmRQYWdlSW5wdXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXG4gIGNvbnN0IHByb2dyZXNzU2VjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzc1NlY3Rpb24nKSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgcHJvZ3Jlc3NDb3VudGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2dyZXNzQ291bnRlcicpIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBwcm9ncmVzc1BjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzc1BjdCcpIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBwcm9ncmVzc0JhckZpbGwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZ3Jlc3NCYXJGaWxsJykgYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IHByb2dyZXNzRGV0YWlsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2dyZXNzRGV0YWlsJykgYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IHByb2dyZXNzRGltZW5zaW9ucyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzc0RpbWVuc2lvbnMnKSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgdGh1bWJuYWlsQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RodW1ibmFpbENvbnRhaW5lcicpIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCB0aHVtYm5haWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGh1bWJuYWlsSW1nJykgYXMgSFRNTEltYWdlRWxlbWVudDtcblxuICBjb25zdCBzdGFydEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGFydEJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICBjb25zdCBjb250aW51ZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250aW51ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICBjb25zdCB2aWV3RmlsZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3RmlsZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICBjb25zdCBwYXVzZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXVzZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICBjb25zdCByZXN1bWVCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdW1lQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIGNvbnN0IHN0b3BCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RvcEJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuXG4gIGNvbnN0IHNldHRpbmdzVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NldHRpbmdzVG9nZ2xlJykgYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IHNldHRpbmdzQm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXR0aW5nc0JvZHknKSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3Qgc2V0dGluZ3NBcnJvdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXR0aW5nc0Fycm93JykgYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IGJhc2VEaXJJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYXNlRGlySW5wdXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBmb2xkZXJQYXR0ZXJuU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZvbGRlclBhdHRlcm5TZWxlY3QnKSBhcyBIVE1MU2VsZWN0RWxlbWVudDtcbiAgY29uc3Qgc2F2ZUltYWdlc0NoZWNrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NhdmVJbWFnZXNDaGVjaycpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IGdlbmVyYXRlUGRmQ2hlY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2VuZXJhdGVQZGZDaGVjaycpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IHNhdmVUZXh0TWRDaGVjayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzYXZlVGV4dE1kQ2hlY2snKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBhdXRvU2luZ2xlUGFnZUNoZWNrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG9TaW5nbGVQYWdlQ2hlY2snKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXG4gIGNvbnN0IHF1YWxpdHlTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXVhbGl0eVNsaWRlcicpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gIGNvbnN0IHF1YWxpdHlWYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXVhbGl0eVZhbCcpIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBtYXhQYWdlSGVpZ2h0SW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWF4UGFnZUhlaWdodElucHV0JykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgY29uc3QgZGVsYXlTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsYXlTbGlkZXInKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCBkZWxheVZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxheVZhbCcpIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCByZXRyaWVzU2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JldHJpZXNTbGlkZXInKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICBjb25zdCByZXRyaWVzVmFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JldHJpZXNWYWwnKSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3Qgc2F2ZVNldHRpbmdzQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NhdmVTZXR0aW5nc0J0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuXG4gIGNvbnN0IGxvZ0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dCb3gnKSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgY2xlYXJMb2dCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xlYXJMb2dCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcblxuICBsZXQgY3VycmVudFRhYklkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgbGV0IGFjdGl2ZUJvb2s6IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50U3RhdGU6IFByb2dyZXNzU3RhdGUgfCBudWxsID0gbnVsbDtcblxuICBmdW5jdGlvbiBhcHBlbmRMb2codGV4dDogc3RyaW5nLCB0eXBlOiAnaW5mbycgfCAnb2snIHwgJ3dhcm4nIHwgJ2VycicgPSAnaW5mbycpIHtcbiAgICBjb25zdCBlbnRyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVudHJ5LmNsYXNzTmFtZSA9IGBsb2ctZW50cnkgJHt0eXBlfWA7XG4gICAgY29uc3QgdGltZSA9IG5ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCk7XG4gICAgZW50cnkudGV4dENvbnRlbnQgPSBgWyR7dGltZX1dICR7dGV4dH1gO1xuICAgIGxvZ0JveC5hcHBlbmRDaGlsZChlbnRyeSk7XG4gICAgbG9nQm94LnNjcm9sbFRvcCA9IGxvZ0JveC5zY3JvbGxIZWlnaHQ7XG4gIH1cblxuICBjbGVhckxvZ0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBsb2dCb3guaW5uZXJIVE1MID0gJyc7XG4gIH0pO1xuXG4gIC8vIFNldHRpbmdzIEFjY29yZGlvblxuICBsZXQgc2V0dGluZ3NPcGVuID0gZmFsc2U7XG4gIHNldHRpbmdzVG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIHNldHRpbmdzT3BlbiA9ICFzZXR0aW5nc09wZW47XG4gICAgc2V0dGluZ3NCb2R5LnN0eWxlLmRpc3BsYXkgPSBzZXR0aW5nc09wZW4gPyAnZmxleCcgOiAnbm9uZSc7XG4gICAgc2V0dGluZ3NBcnJvdy50ZXh0Q29udGVudCA9IHNldHRpbmdzT3BlbiA/ICfilr4nIDogJ+KWuCc7XG4gIH0pO1xuXG4gIC8vIFNsaWRlcnMgZGlzcGxheSB2YWx1ZXNcbiAgcXVhbGl0eVNsaWRlci5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsICgpID0+IHtcbiAgICBxdWFsaXR5VmFsLnRleHRDb250ZW50ID0gYCR7cXVhbGl0eVNsaWRlci52YWx1ZX0lYDtcbiAgfSk7XG4gIGRlbGF5U2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKCkgPT4ge1xuICAgIGRlbGF5VmFsLnRleHRDb250ZW50ID0gYCR7ZGVsYXlTbGlkZXIudmFsdWV9bXNgO1xuICB9KTtcbiAgcmV0cmllc1NsaWRlci5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsICgpID0+IHtcbiAgICByZXRyaWVzVmFsLnRleHRDb250ZW50ID0gcmV0cmllc1NsaWRlci52YWx1ZTtcbiAgfSk7XG5cbiAgLy8gTG9hZCBTYXZlZCBTZXR0aW5nc1xuICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChbJ2Rvd25sb2FkZXJDb25maWcnLCAnbGliZXJhdG9yQ29uZmlnJ10sIChyZXMpID0+IHtcbiAgICBjb25zdCBjZmc6IERvd25sb2FkZXJDb25maWcgPSByZXMuZG93bmxvYWRlckNvbmZpZyB8fCByZXMubGliZXJhdG9yQ29uZmlnO1xuICAgIGlmIChjZmcpIHtcbiAgICAgIGJhc2VEaXJJbnB1dC52YWx1ZSA9IGNmZy5iYXNlRGlyIHx8ICdBcmNoaXZlQm9va3MnO1xuICAgICAgZm9sZGVyUGF0dGVyblNlbGVjdC52YWx1ZSA9IGNmZy5mb2xkZXJQYXR0ZXJuIHx8ICd7dGl0bGV9X3tpZH0nO1xuICAgICAgc2F2ZUltYWdlc0NoZWNrLmNoZWNrZWQgPSBCb29sZWFuKGNmZy5zYXZlSW1hZ2VzKTtcbiAgICAgIGdlbmVyYXRlUGRmQ2hlY2suY2hlY2tlZCA9IGNmZy5nZW5lcmF0ZVBkZiAhPT0gZmFsc2U7XG4gICAgICBzYXZlVGV4dE1kQ2hlY2suY2hlY2tlZCA9IGNmZy5zYXZlVGV4dE1kICE9PSBmYWxzZTtcbiAgICAgIGF1dG9TaW5nbGVQYWdlQ2hlY2suY2hlY2tlZCA9IGNmZy5hdXRvU2luZ2xlUGFnZSAhPT0gZmFsc2U7XG5cbiAgICAgIGNvbnN0IHEgPSBNYXRoLnJvdW5kKChjZmcuaW1hZ2VRdWFsaXR5IHx8IDAuNzUpICogMTAwKTtcbiAgICAgIHF1YWxpdHlTbGlkZXIudmFsdWUgPSBTdHJpbmcocSk7XG4gICAgICBxdWFsaXR5VmFsLnRleHRDb250ZW50ID0gYCR7cX0lYDtcblxuICAgICAgaWYgKGNmZy5tYXhQYWdlSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbWF4UGFnZUhlaWdodElucHV0LnZhbHVlID0gY2ZnLm1heFBhZ2VIZWlnaHQgPiAwID8gU3RyaW5nKGNmZy5tYXhQYWdlSGVpZ2h0KSA6ICcnO1xuICAgICAgfVxuXG4gICAgICBkZWxheVNsaWRlci52YWx1ZSA9IFN0cmluZyhjZmcucGFnZURlbGF5TXMgfHwgNTAwKTtcbiAgICAgIGRlbGF5VmFsLnRleHRDb250ZW50ID0gYCR7ZGVsYXlTbGlkZXIudmFsdWV9bXNgO1xuXG4gICAgICByZXRyaWVzU2xpZGVyLnZhbHVlID0gU3RyaW5nKGNmZy5tYXhSZXRyaWVzIHx8IDEwKTtcbiAgICAgIHJldHJpZXNWYWwudGV4dENvbnRlbnQgPSByZXRyaWVzU2xpZGVyLnZhbHVlO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gZ2V0Rm9ybUNvbmZpZygpOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+IHtcbiAgICByZXR1cm4ge1xuICAgICAgYmFzZURpcjogYmFzZURpcklucHV0LnZhbHVlLnRyaW0oKSB8fCAnQXJjaGl2ZUJvb2tzJyxcbiAgICAgIGZvbGRlclBhdHRlcm46IGZvbGRlclBhdHRlcm5TZWxlY3QudmFsdWUsXG4gICAgICBzYXZlSW1hZ2VzOiBzYXZlSW1hZ2VzQ2hlY2suY2hlY2tlZCxcbiAgICAgIGdlbmVyYXRlUGRmOiBnZW5lcmF0ZVBkZkNoZWNrLmNoZWNrZWQsXG4gICAgICBzYXZlVGV4dE1kOiBzYXZlVGV4dE1kQ2hlY2suY2hlY2tlZCxcbiAgICAgIGF1dG9TaW5nbGVQYWdlOiBhdXRvU2luZ2xlUGFnZUNoZWNrLmNoZWNrZWQsXG4gICAgICBpbWFnZVF1YWxpdHk6IE51bWJlcihxdWFsaXR5U2xpZGVyLnZhbHVlKSAvIDEwMCxcbiAgICAgIG1heFBhZ2VIZWlnaHQ6IG1heFBhZ2VIZWlnaHRJbnB1dC52YWx1ZSAhPT0gJycgPyBNYXRoLm1heCgwLCBwYXJzZUludChtYXhQYWdlSGVpZ2h0SW5wdXQudmFsdWUsIDEwKSkgOiAwLFxuICAgICAgcGFnZURlbGF5TXM6IE51bWJlcihkZWxheVNsaWRlci52YWx1ZSksXG4gICAgICBtYXhSZXRyaWVzOiBOdW1iZXIocmV0cmllc1NsaWRlci52YWx1ZSksXG4gICAgICBzdGFydFBhZ2U6IHN0YXJ0UGFnZUlucHV0LnZhbHVlICE9PSAnJyA/IE1hdGgubWF4KDAsIHBhcnNlSW50KHN0YXJ0UGFnZUlucHV0LnZhbHVlLCAxMCkpIDogMCxcbiAgICAgIGVuZFBhZ2U6IGVuZFBhZ2VJbnB1dC52YWx1ZSAhPT0gJycgPyBNYXRoLm1heCgwLCBwYXJzZUludChlbmRQYWdlSW5wdXQudmFsdWUsIDEwKSkgOiAwLFxuICAgICAgZGVsZXRlSW1hZ2VzT25Db21wbGV0ZTogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgc2F2ZVNldHRpbmdzQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IGdldEZvcm1Db25maWcoKTtcbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IGRvd25sb2FkZXJDb25maWc6IGNvbmZpZyB9LCAoKSA9PiB7XG4gICAgICBhcHBlbmRMb2coJ1NldHRpbmdzIHNhdmVkLicsICdvaycpO1xuICAgICAgaWYgKGN1cnJlbnRUYWJJZCkge1xuICAgICAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZShjdXJyZW50VGFiSWQsIHsgdHlwZTogJ1NBVkVfQ09ORklHJywgY29uZmlnIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICAvLyBRdWVyeSBBY3RpdmUgVGFiXG4gIGNvbnN0IFt0YWJdID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSk7XG4gIGlmICghdGFiIHx8ICF0YWIuaWQpIHtcbiAgICBzdGF0dXNUZXh0LnRleHRDb250ZW50ID0gJ05vIHRhYic7XG4gICAgcmV0dXJuO1xuICB9XG4gIGN1cnJlbnRUYWJJZCA9IHRhYi5pZDtcblxuICBjb25zdCBpc1N1cHBvcnRlZFNpdGUgPSB0YWIudXJsICYmICh0YWIudXJsLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpIHx8IHRhYi51cmwuaW5jbHVkZXMoJ2JhYmVsLmhhdGhpdHJ1c3Qub3JnJykpO1xuICBpZiAoIWlzU3VwcG9ydGVkU2l0ZSkge1xuICAgIHN0YXR1c0RvdC5jbGFzc05hbWUgPSAnc3RhdHVzLWRvdCc7XG4gICAgc3RhdHVzVGV4dC50ZXh0Q29udGVudCA9ICdVbnN1cHBvcnRlZCBzaXRlJztcbiAgICBib29rVGl0bGUudGV4dENvbnRlbnQgPSAnUGxlYXNlIG5hdmlnYXRlIHRvIEFyY2hpdmUub3JnIG9yIEhhdGhpVHJ1c3QnO1xuICAgIHN0YXJ0QnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBSZXF1ZXN0IEJvb2sgSW5mbyBmcm9tIENvbnRlbnQgU2NyaXB0XG4gIGZ1bmN0aW9uIHJlZnJlc2hUYWJTdGF0ZSgpIHtcbiAgICBpZiAoIWN1cnJlbnRUYWJJZCkgcmV0dXJuO1xuICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGN1cnJlbnRUYWJJZCwgeyB0eXBlOiAnR0VUX1NUQVRFJyB9LCAocmVzKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yIHx8ICFyZXMpIHtcbiAgICAgICAgc3RhdHVzRG90LmNsYXNzTmFtZSA9ICdzdGF0dXMtZG90IHdhcm5pbmcnO1xuICAgICAgICBzdGF0dXNUZXh0LnRleHRDb250ZW50ID0gJ1JlYWRlciBsb2FkaW5nLi4uJztcbiAgICAgICAgYm9va1RpdGxlLnRleHRDb250ZW50ID0gJ1dhaXRpbmcgZm9yIGJvb2sgdmlld2VyLi4uJztcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzLmJvb2tJbmZvKSB7XG4gICAgICAgIHVwZGF0ZUJvb2tVSShyZXMuYm9va0luZm8pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVmcmVzaFRhYlN0YXRlKCk7XG5cbiAgZnVuY3Rpb24gdXBkYXRlQm9va1VJKGluZm86IEJvb2tJbmZvKSB7XG4gICAgYWN0aXZlQm9vayA9IGluZm87XG4gICAgYm9va1RpdGxlLnRleHRDb250ZW50ID0gaW5mby5ib29rVGl0bGUgfHwgJ1VudGl0bGVkIEJvb2snO1xuICAgIGJvb2tUaXRsZS50aXRsZSA9IGluZm8uYm9va1RpdGxlO1xuXG4gICAgYm9va1RvdGFsUGFnZXMudGV4dENvbnRlbnQgPSBpbmZvLnRvdGFsUGFnZXMgPiAwID8gYCR7aW5mby50b3RhbFBhZ2VzfSBwYWdlc2AgOiAnRGV0ZWN0aW5nLi4uJztcbiAgICBpZiAoaW5mby50b3RhbFBhZ2VzID4gMCAmJiAhZW5kUGFnZUlucHV0LnZhbHVlKSB7XG4gICAgICBlbmRQYWdlSW5wdXQudmFsdWUgPSBTdHJpbmcoaW5mby50b3RhbFBhZ2VzKTtcbiAgICB9XG5cbiAgICBpZiAoaW5mby5jdXJyZW50TW9kZSA9PT0gMSkge1xuICAgICAgYm9va1ZpZXdNb2RlLnRleHRDb250ZW50ID0gJzEtUGFnZSBWaWV3IChBY3RpdmUpJztcbiAgICAgIGJvb2tWaWV3TW9kZS5zdHlsZS5jb2xvciA9ICd2YXIoLS1hY2NlbnQtZ3JlZW4pJztcbiAgICAgIGVuZm9yY2VNb2RlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJvb2tWaWV3TW9kZS50ZXh0Q29udGVudCA9IGluZm8uY3VycmVudE1vZGUgPT09IDIgPyAnMi1QYWdlIFZpZXcnIDogKGluZm8uY3VycmVudE1vZGUgPT09IDMgPyAnVGh1bWJuYWlscycgOiAnTXVsdGktcGFnZScpO1xuICAgICAgYm9va1ZpZXdNb2RlLnN0eWxlLmNvbG9yID0gJ3ZhcigtLWFjY2VudC15ZWxsb3cpJztcbiAgICAgIGVuZm9yY2VNb2RlQnRuLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIH1cblxuICAgIHN0YXR1c0RvdC5jbGFzc05hbWUgPSAnc3RhdHVzLWRvdCBhY3RpdmUnO1xuICAgIHN0YXR1c1RleHQudGV4dENvbnRlbnQgPSAnUmVhZHknO1xuICAgIHN0YXJ0QnRuLmRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICAvLyBIYW5kbGUgaW5jb21pbmcgU1RBVEVfVVBEQVRFIG1lc3NhZ2VzIGZyb20gY29udGVudCBzY3JpcHRcbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlKSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ1NUQVRFX1VQREFURScpIHtcbiAgICAgIGNvbnN0IHN0YXRlOiBQcm9ncmVzc1N0YXRlID0gbWVzc2FnZS5zdGF0ZTtcbiAgICAgIGhhbmRsZVN0YXRlVXBkYXRlKHN0YXRlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZVN0YXRlVXBkYXRlKHN0YXRlOiBQcm9ncmVzc1N0YXRlKSB7XG4gICAgY3VycmVudFN0YXRlID0gc3RhdGU7XG4gICAgaWYgKHN0YXRlLmJvb2tJbmZvKSB7XG4gICAgICB1cGRhdGVCb29rVUkoc3RhdGUuYm9va0luZm8pO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBTdGF0dXMgQmFkZ2VcbiAgICBzd2l0Y2ggKHN0YXRlLnN0YXR1cykge1xuICAgICAgY2FzZSAnZG93bmxvYWRpbmcnOlxuICAgICAgICBzdGF0dXNEb3QuY2xhc3NOYW1lID0gJ3N0YXR1cy1kb3QgYWN0aXZlJztcbiAgICAgICAgc3RhdHVzVGV4dC50ZXh0Q29udGVudCA9ICdEb3dubG9hZGluZyc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmV0cnlpbmcnOlxuICAgICAgICBzdGF0dXNEb3QuY2xhc3NOYW1lID0gJ3N0YXR1cy1kb3Qgd2FybmluZyc7XG4gICAgICAgIHN0YXR1c1RleHQudGV4dENvbnRlbnQgPSBgUmV0cnlpbmcgKCR7c3RhdGUucmV0cnlDb3VudH0pYDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwYXVzZWQnOlxuICAgICAgICBzdGF0dXNEb3QuY2xhc3NOYW1lID0gJ3N0YXR1cy1kb3QnO1xuICAgICAgICBzdGF0dXNUZXh0LnRleHRDb250ZW50ID0gJ1BhdXNlZCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RhbGxlZCc6XG4gICAgICBjYXNlICdvZmZsaW5lJzpcbiAgICAgICAgc3RhdHVzRG90LmNsYXNzTmFtZSA9ICdzdGF0dXMtZG90IGVycm9yJztcbiAgICAgICAgc3RhdHVzVGV4dC50ZXh0Q29udGVudCA9IHN0YXRlLnN0YXR1cyA9PT0gJ29mZmxpbmUnID8gJ09mZmxpbmUnIDogJ1N0YWxsZWQnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NvbXBsZXRlJzpcbiAgICAgICAgc3RhdHVzRG90LmNsYXNzTmFtZSA9ICdzdGF0dXMtZG90IGNvbXBsZXRlJztcbiAgICAgICAgc3RhdHVzVGV4dC50ZXh0Q29udGVudCA9ICdDb21wbGV0ZSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3RhdHVzRG90LmNsYXNzTmFtZSA9ICdzdGF0dXMtZG90IGFjdGl2ZSc7XG4gICAgICAgIHN0YXR1c1RleHQudGV4dENvbnRlbnQgPSAnUmVhZHknO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBQcm9ncmVzcyBTZWN0aW9uXG4gICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gJ2Rvd25sb2FkaW5nJyB8fCBzdGF0ZS5zdGF0dXMgPT09ICdyZXRyeWluZycgfHwgc3RhdGUuc3RhdHVzID09PSAncGF1c2VkJyB8fCBzdGF0ZS5zdGF0dXMgPT09ICdzdGFsbGVkJyB8fCBzdGF0ZS5zdGF0dXMgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIHByb2dyZXNzU2VjdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIGNvbnN0IHBjdCA9IHN0YXRlLnRvdGFsUGFnZXMgPiAwID8gTWF0aC5taW4oMTAwLCBNYXRoLnJvdW5kKCgoc3RhdGUuY3VycmVudFBhZ2UgKyAxKSAvIHN0YXRlLnRvdGFsUGFnZXMpICogMTAwKSkgOiAwO1xuICAgICAgcHJvZ3Jlc3NDb3VudGVyLnRleHRDb250ZW50ID0gYFBhZ2UgJHtzdGF0ZS5jdXJyZW50UGFnZX0gb2YgJHtzdGF0ZS50b3RhbFBhZ2VzfWA7XG4gICAgICBwcm9ncmVzc1BjdC50ZXh0Q29udGVudCA9IGAke3BjdH0lYDtcbiAgICAgIHByb2dyZXNzQmFyRmlsbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgICAgIHByb2dyZXNzRGV0YWlsLnRleHRDb250ZW50ID0gc3RhdGUuc3RhdHVzVGV4dDtcblxuICAgICAgLy8gSW1hZ2UgRGltZW5zaW9uc1xuICAgICAgaWYgKHN0YXRlLmltYWdlRGltZW5zaW9ucyAmJiBzdGF0ZS5pbWFnZURpbWVuc2lvbnMud2lkdGggPiAwKSB7XG4gICAgICAgIHByb2dyZXNzRGltZW5zaW9ucy50ZXh0Q29udGVudCA9IGAoaW1hZ2U6ICR7c3RhdGUuaW1hZ2VEaW1lbnNpb25zLndpZHRofSB4ICR7c3RhdGUuaW1hZ2VEaW1lbnNpb25zLmhlaWdodH0pYDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb2dyZXNzRGltZW5zaW9ucy50ZXh0Q29udGVudCA9IGAoaW1hZ2U6IC0geCAtKWA7XG4gICAgICB9XG5cbiAgICAgIC8vIFRodW1ibmFpbFxuICAgICAgaWYgKHN0YXRlLmN1cnJlbnRUaHVtYm5haWwpIHtcbiAgICAgICAgdGh1bWJuYWlsQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICAgIHRodW1ibmFpbEltZy5zcmMgPSBzdGF0ZS5jdXJyZW50VGh1bWJuYWlsO1xuICAgICAgfVxuXG4gICAgICAvLyBCdXR0b25zXG4gICAgICBzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgY29udGludWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHZpZXdGaWxlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBwYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgcmVzdW1lQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgICAgdmlld0ZpbGVCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgYXBwZW5kTG9nKGBEb3dubG9hZCBjb21wbGV0ZSEgJHtzdGF0ZS5kb3dubG9hZGVkUGFnZXN9IHBhZ2VzIHNhdmVkLmAsICdvaycpO1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdzdGFsbGVkJyB8fCBzdGF0ZS5zdGF0dXMgPT09ICdvZmZsaW5lJykge1xuICAgICAgICBjb250aW51ZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICB9IGVsc2UgaWYgKHN0YXRlLnN0YXR1cyA9PT0gJ2Rvd25sb2FkaW5nJyB8fCBzdGF0ZS5zdGF0dXMgPT09ICdyZXRyeWluZycpIHtcbiAgICAgICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdwYXVzZWQnKSB7XG4gICAgICAgIHJlc3VtZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnN0YXR1c1RleHQpIHtcbiAgICAgIGFwcGVuZExvZyhzdGF0ZS5zdGF0dXNUZXh0LCBzdGF0ZS5zdGF0dXMgPT09ICdyZXRyeWluZycgPyAnd2FybicgOiAoc3RhdGUuc3RhdHVzID09PSAnY29tcGxldGUnID8gJ29rJyA6ICdpbmZvJykpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJ1dHRvbiBMaXN0ZW5lcnNcbiAgc3RhcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgaWYgKCFjdXJyZW50VGFiSWQpIHJldHVybjtcbiAgICBjb25zdCBjb25maWcgPSBnZXRGb3JtQ29uZmlnKCk7XG4gICAgYXBwZW5kTG9nKGBTdGFydGluZyBkb3dubG9hZDogcGFnZXMgJHtjb25maWcuc3RhcnRQYWdlfSB0byAke2NvbmZpZy5lbmRQYWdlIHx8ICdlbmQnfS4uLmAsICdpbmZvJyk7XG4gICAgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UoY3VycmVudFRhYklkLCB7IHR5cGU6ICdTVEFSVF9ET1dOTE9BRCcsIGNvbmZpZyB9KTtcbiAgfSk7XG5cbiAgY29udGludWVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgaWYgKCFjdXJyZW50VGFiSWQpIHJldHVybjtcbiAgICBhcHBlbmRMb2coJ1Jlc3VtaW5nIGRvd25sb2FkIGFmdGVyIHN0YWxsLi4uJywgJ2luZm8nKTtcbiAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZShjdXJyZW50VGFiSWQsIHsgdHlwZTogJ1JFU1VNRV9ET1dOTE9BRCcgfSk7XG4gIH0pO1xuXG4gIHZpZXdGaWxlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIGFwcGVuZExvZygnT3BlbmluZyBmaWxlIGluIEZpbmRlci9FeHBsb3Jlci4uLicsICdvaycpO1xuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogJ09QRU5fRE9XTkxPQUQnIH0pO1xuICB9KTtcblxuICBwYXVzZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBpZiAoIWN1cnJlbnRUYWJJZCkgcmV0dXJuO1xuICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGN1cnJlbnRUYWJJZCwgeyB0eXBlOiAnUEFVU0VfRE9XTkxPQUQnIH0pO1xuICAgIGFwcGVuZExvZygnRG93bmxvYWQgcGF1c2VkLicsICd3YXJuJyk7XG4gIH0pO1xuXG4gIHJlc3VtZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBpZiAoIWN1cnJlbnRUYWJJZCkgcmV0dXJuO1xuICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGN1cnJlbnRUYWJJZCwgeyB0eXBlOiAnUkVTVU1FX0RPV05MT0FEJyB9KTtcbiAgICBhcHBlbmRMb2coJ0Rvd25sb2FkIHJlc3VtZWQuJywgJ2luZm8nKTtcbiAgfSk7XG5cbiAgc3RvcEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBpZiAoIWN1cnJlbnRUYWJJZCkgcmV0dXJuO1xuXG4gICAgaWYgKGN1cnJlbnRTdGF0ZSAmJiAoY3VycmVudFN0YXRlLmRvd25sb2FkZWRQYWdlcyA+IDAgfHwgY3VycmVudFN0YXRlLnN0YXR1cyA9PT0gJ2Rvd25sb2FkaW5nJykpIHtcbiAgICAgIGNvbnN0IGNvdW50ID0gY3VycmVudFN0YXRlLmRvd25sb2FkZWRQYWdlcyB8fCAwO1xuICAgICAgY29uc3Qgc2F2ZSA9IHdpbmRvdy5jb25maXJtKFxuICAgICAgICBgU2F2ZSBhbGwgJHtjb3VudH0gcGFnZXMgZG93bmxvYWRlZCBzbyBmYXI/XFxuXFxuLSBDbGljayBPSyB0byBjb21waWxlIFBERi9NRCBhbmQgc2F2ZSBmaWxlc1xcbi0gQ2xpY2sgQ2FuY2VsIHRvIGRpc2NhcmRgXG4gICAgICApO1xuICAgICAgaWYgKHNhdmUpIHtcbiAgICAgICAgYXBwZW5kTG9nKGBTdG9wcGluZyBhbmQgc2F2aW5nICR7Y291bnR9IHBhZ2VzLi4uYCwgJ29rJyk7XG4gICAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGN1cnJlbnRUYWJJZCwgeyB0eXBlOiAnU1RPUF9BTkRfU0FWRScgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZShjdXJyZW50VGFiSWQsIHsgdHlwZTogJ1NUT1BfRE9XTkxPQUQnIH0pO1xuICAgIGFwcGVuZExvZygnRG93bmxvYWQgc3RvcHBlZC4nLCAnZXJyJyk7XG4gICAgc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICBjb250aW51ZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHZpZXdGaWxlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICByZXN1bWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIH0pO1xuXG4gIGVuZm9yY2VNb2RlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIGlmICghY3VycmVudFRhYklkKSByZXR1cm47XG4gICAgYXBwZW5kTG9nKCdTd2l0Y2hpbmcgYm9vayB2aWV3ZXIgdG8gMS1wYWdlIG1vZGUuLi4nLCAnaW5mbycpO1xuICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGN1cnJlbnRUYWJJZCwgeyB0eXBlOiAnU1dJVENIX1RPX1NJTkdMRV9QQUdFJyB9LCAoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KHJlZnJlc2hUYWJTdGF0ZSwgODAwKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFPQSxTQUFTLGlCQUFpQixvQkFBb0IsWUFBWTtBQUFBLEVBRXhELE1BQU0sWUFBWSxTQUFTLGVBQWUsV0FBVztBQUFBLEVBQ3JELE1BQU0sYUFBYSxTQUFTLGVBQWUsWUFBWTtBQUFBLEVBQ3ZELE1BQU0sWUFBWSxTQUFTLGVBQWUsV0FBVztBQUFBLEVBQ3JELE1BQU0saUJBQWlCLFNBQVMsZUFBZSxnQkFBZ0I7QUFBQSxFQUMvRCxNQUFNLGVBQWUsU0FBUyxlQUFlLGNBQWM7QUFBQSxFQUMzRCxNQUFNLGlCQUFpQixTQUFTLGVBQWUsZ0JBQWdCO0FBQUEsRUFFL0QsTUFBTSxpQkFBaUIsU0FBUyxlQUFlLGdCQUFnQjtBQUFBLEVBQy9ELE1BQU0sZUFBZSxTQUFTLGVBQWUsY0FBYztBQUFBLEVBRTNELE1BQU0sa0JBQWtCLFNBQVMsZUFBZSxpQkFBaUI7QUFBQSxFQUNqRSxNQUFNLGtCQUFrQixTQUFTLGVBQWUsaUJBQWlCO0FBQUEsRUFDakUsTUFBTSxjQUFjLFNBQVMsZUFBZSxhQUFhO0FBQUEsRUFDekQsTUFBTSxrQkFBa0IsU0FBUyxlQUFlLGlCQUFpQjtBQUFBLEVBQ2pFLE1BQU0saUJBQWlCLFNBQVMsZUFBZSxnQkFBZ0I7QUFBQSxFQUMvRCxNQUFNLHFCQUFxQixTQUFTLGVBQWUsb0JBQW9CO0FBQUEsRUFDdkUsTUFBTSxxQkFBcUIsU0FBUyxlQUFlLG9CQUFvQjtBQUFBLEVBQ3ZFLE1BQU0sZUFBZSxTQUFTLGVBQWUsY0FBYztBQUFBLEVBRTNELE1BQU0sV0FBVyxTQUFTLGVBQWUsVUFBVTtBQUFBLEVBQ25ELE1BQU0sY0FBYyxTQUFTLGVBQWUsYUFBYTtBQUFBLEVBQ3pELE1BQU0sY0FBYyxTQUFTLGVBQWUsYUFBYTtBQUFBLEVB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
