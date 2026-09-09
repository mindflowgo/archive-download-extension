// src/content/pill.ts
class FloatingPill {
  container = null;
  isDocked = false;
  isSettingsOpen = false;
  isConfirmingStop = false;
  callbacks = {};
  currentConfig = {};
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
  }
  shouldRender() {
    const isArchive = window.location.hostname.includes("archive.org") && window.location.pathname.includes("/details/");
    const isBabel = window.location.hostname === "babel.hathitrust.org" || window.location.hostname.includes("hathitrust.org") && window.location.pathname.startsWith("/cgi/pt");
    return isArchive || isBabel;
  }
  render() {
    if (!this.shouldRender())
      return;
    if (this.container)
      return;
    const pill = document.createElement("div");
    pill.id = "archive-downloader-pill";
    pill.innerHTML = `
      <style>
        #archive-downloader-pill {
          position: fixed;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2147483647;
          background: rgba(18, 18, 18, 0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.65);
          color: #f1f1f1;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          transition: transform 0.25s ease, opacity 0.25s ease;
          user-select: none;
          max-width: 95vw;
          overflow: hidden;
        }

        /* Docked to far left of window */
        #archive-downloader-pill.docked-left {
          left: 0 !important;
          top: 40px !important;
          transform: none !important;
          height: 40px !important;
          border-left: none !important;
          border-radius: 0 6px 6px 0 !important;
          cursor: pointer !important;
          box-shadow: 2px 4px 16px rgba(0, 0, 0, 0.7) !important;
        }

        #archive-downloader-pill.docked-left .pill-main-body,
        #archive-downloader-pill.docked-left .pill-settings-panel {
          display: none !important;
        }

        #archive-downloader-pill.docked-left .pill-dock-icon {
          display: flex !important;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
        }

        .pill-dock-icon {
          display: none;
        }

        .pill-dock-icon img {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          display: block;
        }

        .pill-main-body {
          display: flex;
          align-items: stretch;
          height: 48px;
          width: 100%;
        }

        /* Cog settings button replacing the static logo */
        .pill-cog-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 13px;
          font-size: 16px;
          border: none;
          border-right: 1px solid rgba(255, 255, 255, 0.18);
          background: transparent;
          color: #aaa;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, transform 0.2s;
        }

        .pill-cog-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          transform: rotate(30deg);
        }

        .pill-cog-btn.active {
          background: rgba(255, 255, 255, 0.2);
          color: #3ea6ff;
        }

        /* Full height buttons with NO curvature (border-radius: 0), outlined only */
        .pill-action-btn {
          height: 100%;
          border-radius: 0 !important;
          border: none;
          border-right: 1px solid rgba(255, 255, 255, 0.18);
          background: transparent;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          padding: 0 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }

        .pill-action-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .pill-action-btn.btn-primary {
          background: #3ea6ff;
          color: #000;
        }

        .pill-action-btn.btn-primary:hover {
          background: #2989e6;
        }

        .pill-action-btn.btn-continue {
          background: #f59e0b;
          color: #000;
          font-weight: 800;
        }

        .pill-action-btn.btn-continue:hover {
          background: #d97706;
        }

        .pill-action-btn.btn-view-file {
          background: #10b981;
          color: #000;
          font-weight: 800;
        }

        .pill-action-btn.btn-view-file:hover {
          background: #059669;
        }

        .pill-action-btn.btn-danger {
          color: #f87171;
        }

        .pill-action-btn.btn-danger:hover {
          background: rgba(248, 113, 113, 0.2);
        }

        .pill-action-btn.btn-mode {
          background: #f59e0b;
          color: #000;
        }

        /* Inline Confirmation Bar for Stop Action */
        .pill-confirm-bar {
          display: flex;
          align-items: stretch;
          height: 100%;
          background: rgba(25, 25, 25, 0.98);
        }

        .pill-confirm-text {
          display: flex;
          align-items: center;
          padding: 0 14px;
          font-weight: 600;
          color: #f59e0b;
          font-size: 12px;
          white-space: nowrap;
          border-right: 1px solid rgba(255, 255, 255, 0.18);
        }

        /* Status & Image Dimensions Section */
        .pill-status-section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 14px;
          min-width: 170px;
          border-right: 1px solid rgba(255, 255, 255, 0.18);
          gap: 2px;
        }

        .pill-status-text {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }

        .pill-status-text.warning {
          color: #f59e0b;
        }

        .pill-status-text.error {
          color: #ef4444;
        }

        .pill-status-text.complete {
          color: #10b981;
        }

        /* Small grey image dimensions */
        .pill-dimensions-text {
          font-size: 10px;
          color: #888;
          line-height: 1.1;
          white-space: nowrap;
        }

        .pill-progress-track {
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 2px;
        }

        .pill-progress-fill {
          height: 100%;
          width: 0%;
          background: #3ea6ff;
          transition: width 0.2s ease;
        }

        /* Right Side Counter (0/515 pages) */
        .pill-counter-box {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 700;
          color: #aaa;
          white-space: nowrap;
          border-right: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* [x] Close/Shrink Button */
        .pill-close-btn {
          height: 100%;
          border: none;
          background: transparent;
          color: #888;
          font-size: 14px;
          font-weight: bold;
          padding: 0 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .pill-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        /* Expandable Settings Tray */
        .pill-settings-panel {
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(14, 14, 14, 0.98);
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 12px;
        }

        .pill-settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 6px;
        }

        .pill-settings-title {
          font-weight: 700;
          color: #fff;
          font-size: 12px;
          letter-spacing: 0.3px;
        }

        .pill-settings-saved-hint {
          font-size: 10px;
          color: #10b981;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .pill-settings-saved-hint.show {
          opacity: 1;
        }

        .pill-settings-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pill-setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .pill-setting-row label {
          color: #aaa;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .pill-setting-row-half {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 20px;
        }

        .pill-setting-row-half > div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pill-setting-input {
          background: #242424;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          color: #fff;
          padding: 5px 8px;
          font-size: 11px;
          outline: none;
          transition: border-color 0.15s;
          flex: 1;
          max-width: 260px;
        }

        .pill-setting-input:focus {
          border-color: #3ea6ff;
        }

        .pill-settings-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 4px;
        }

        .pill-setting-btn {
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 3px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          color: #ccc;
          transition: all 0.15s;
        }

        .pill-setting-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .pill-setting-btn.btn-save {
          background: #3ea6ff;
          color: #000;
          border: none;
          font-weight: 700;
        }

        .pill-setting-btn.btn-save:hover {
          background: #2989e6;
        }
      </style>

      <!-- Docked Small Icon (Visible when minimized to far left) -->
      <div class="pill-dock-icon" id="pillDockIcon" title="Open Archive Downloader">
        <img src="${chrome.runtime.getURL("icons/icon48.png")}" alt="Archive Downloader" />
      </div>

      <!-- Main Body -->
      <div class="pill-main-body">
        <!-- Cog settings button -->
        <button class="pill-cog-btn" id="pillCogBtn" title="Edit Settings (Save path, pattern, pages)">⚙</button>

        <!-- Inline Confirmation Bar for Stop Action -->
        <div class="pill-confirm-bar" id="pillConfirmBar" style="display: none;">
          <span class="pill-confirm-text" id="pillConfirmText">Save captured pages?</span>
          <button class="pill-action-btn btn-view-file" id="pillConfirmSaveBtn">✔ Yes, Save Files</button>
          <button class="pill-action-btn btn-danger" id="pillConfirmDiscardBtn">Discard</button>
          <button class="pill-action-btn" id="pillConfirmCancelBtn">Cancel</button>
        </div>

        <!-- Start Download Button -->
        <button class="pill-action-btn btn-primary" id="pillStartBtn">
          ▶ Start Download
        </button>

        <!-- Continue Button (when stalled / offline) -->
        <button class="pill-action-btn btn-continue" id="pillContinueBtn" style="display: none;">
          ▶ CONTINUE
        </button>

        <!-- View File Button (when complete) -->
        <button class="pill-action-btn btn-view-file" id="pillViewFileBtn" style="display: none;">
          ✔ View File
        </button>

        <!-- Dynamic Controls (active during download) -->
        <button class="pill-action-btn" id="pillPauseBtn" style="display: none;">
          ❚❚ Pause
        </button>
        <button class="pill-action-btn btn-primary" id="pillResumeBtn" style="display: none;">
          ▶ Resume
        </button>
        <button class="pill-action-btn btn-danger" id="pillStopBtn" style="display: none;">
          ◼ Stop
        </button>

        <!-- 1-Page Mode Button -->
        <button class="pill-action-btn btn-mode" id="pillModeBtn" style="display: none;" title="Switch to 1-Page View">
          ⚡ 1-Page
        </button>

        <!-- Status & Image Dimensions -->
        <div class="pill-status-section">
          <span class="pill-status-text" id="pillStatusText">Ready</span>
          <span class="pill-dimensions-text" id="pillDimensionsText">(image: - x -)</span>
          <div class="pill-progress-track">
            <div class="pill-progress-fill" id="pillProgressFill"></div>
          </div>
        </div>

        <!-- Right Side Counter: 0/515 pages -->
        <div class="pill-counter-box" id="pillCounter">
          0/0 pages
        </div>

        <!-- [x] Shrink to Left Side Button -->
        <button class="pill-close-btn" id="pillCloseBtn" title="Shrink to left edge of screen">✕</button>
      </div>

      <!-- Expandable Settings Tray -->
      <div class="pill-settings-panel" id="pillSettingsPanel" style="display: none;">
        <div class="pill-settings-header">
          <span class="pill-settings-title">⚙ Downloader Settings</span>
          <span class="pill-settings-saved-hint" id="pillSettingsSavedHint">Saved to localStorage</span>
        </div>
        <div class="pill-settings-grid">
          <div class="pill-setting-row">
            <label for="pillSettingSavePath">Save Subdirectory:</label>
            <input type="text" id="pillSettingSavePath" class="pill-setting-input" placeholder="ArchiveBooks" />
          </div>
          <div class="pill-setting-row">
            <label for="pillSettingPattern">Folder Pattern:</label>
            <select id="pillSettingPattern" class="pill-setting-input">
              <option value="{title}_{id}">{title}_{id}</option>
              <option value="{title}">{title}</option>
              <option value="{id}">{id}</option>
            </select>
          </div>
          <div class="pill-setting-row pill-setting-row-half">
            <div>
              <label for="pillSettingStartPage">Start Page:</label>
              <input type="number" id="pillSettingStartPage" class="pill-setting-input" min="0" value="0" style="width: 70px;" />
            </div>
            <div>
              <label for="pillSettingEndPage">End Page:</label>
              <input type="number" id="pillSettingEndPage" class="pill-setting-input" min="0" placeholder="All" style="width: 70px;" />
            </div>
          </div>
          <div class="pill-setting-row">
            <label for="pillSettingMaxHeight">Max Page Height:</label>
            <input type="number" id="pillSettingMaxHeight" class="pill-setting-input" min="0" step="50" placeholder="e.g. 1000 (0 = full)" />
          </div>
        </div>
        <div class="pill-settings-footer">
          <button class="pill-setting-btn btn-save" id="pillSettingSaveBtn">\uD83D\uDCBE Save Settings</button>
          <button class="pill-setting-btn btn-close" id="pillSettingCloseBtn">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(pill);
    this.container = pill;
    const startBtn = pill.querySelector("#pillStartBtn");
    startBtn?.addEventListener("click", () => this.callbacks.onStart?.());
    const continueBtn = pill.querySelector("#pillContinueBtn");
    continueBtn?.addEventListener("click", () => this.callbacks.onResume?.());
    const viewFileBtn = pill.querySelector("#pillViewFileBtn");
    viewFileBtn?.addEventListener("click", () => this.callbacks.onViewFile?.());
    const pauseBtn = pill.querySelector("#pillPauseBtn");
    pauseBtn?.addEventListener("click", () => this.callbacks.onPause?.());
    const resumeBtn = pill.querySelector("#pillResumeBtn");
    resumeBtn?.addEventListener("click", () => this.callbacks.onResume?.());
    const stopBtn = pill.querySelector("#pillStopBtn");
    stopBtn?.addEventListener("click", () => this.callbacks.onStop?.());
    const modeBtn = pill.querySelector("#pillModeBtn");
    modeBtn?.addEventListener("click", () => this.callbacks.onSwitchMode?.());
    const cogBtn = pill.querySelector("#pillCogBtn");
    cogBtn?.addEventListener("click", () => this.toggleSettings());
    const saveSettingsBtn = pill.querySelector("#pillSettingSaveBtn");
    saveSettingsBtn?.addEventListener("click", () => {
      const savePathInput = pill.querySelector("#pillSettingSavePath");
      const patternSelect = pill.querySelector("#pillSettingPattern");
      const startPageInput = pill.querySelector("#pillSettingStartPage");
      const endPageInput = pill.querySelector("#pillSettingEndPage");
      const maxHeightInput = pill.querySelector("#pillSettingMaxHeight");
      const baseDir = savePathInput?.value.trim() || "ArchiveBooks";
      const folderPattern = patternSelect?.value || "{title}_{id}";
      const startPage = startPageInput?.value !== "" ? Math.max(0, parseInt(startPageInput.value, 10)) : 0;
      const endPage = endPageInput?.value !== "" ? Math.max(0, parseInt(endPageInput.value, 10)) : 0;
      const maxPageHeight = maxHeightInput?.value !== "" ? Math.max(0, parseInt(maxHeightInput.value, 10)) : 0;
      this.callbacks.onSaveSettings?.({
        baseDir,
        folderPattern,
        startPage,
        endPage,
        maxPageHeight
      });
      const hint = pill.querySelector("#pillSettingsSavedHint");
      if (hint) {
        hint.classList.add("show");
        setTimeout(() => hint.classList.remove("show"), 2500);
      }
    });
    const closeSettingsBtn = pill.querySelector("#pillSettingCloseBtn");
    closeSettingsBtn?.addEventListener("click", () => this.toggleSettings(false));
    const closeBtn = pill.querySelector("#pillCloseBtn");
    closeBtn?.addEventListener("click", () => this.dockToLeft());
    const dockIcon = pill.querySelector("#pillDockIcon");
    dockIcon?.addEventListener("click", () => this.undockFromLeft());
    this.setConfig(this.currentConfig);
  }
  toggleSettings(open) {
    if (!this.container)
      return;
    this.isSettingsOpen = typeof open === "boolean" ? open : !this.isSettingsOpen;
    const panel = this.container.querySelector("#pillSettingsPanel");
    const cogBtn = this.container.querySelector("#pillCogBtn");
    if (panel) {
      panel.style.display = this.isSettingsOpen ? "flex" : "none";
    }
    if (cogBtn) {
      if (this.isSettingsOpen) {
        cogBtn.classList.add("active");
      } else {
        cogBtn.classList.remove("active");
      }
    }
  }
  setConfig(cfg) {
    this.currentConfig = { ...this.currentConfig, ...cfg };
    if (!this.container)
      return;
    const savePathInput = this.container.querySelector("#pillSettingSavePath");
    if (savePathInput && cfg.baseDir !== undefined) {
      savePathInput.value = cfg.baseDir;
    }
    const patternSelect = this.container.querySelector("#pillSettingPattern");
    if (patternSelect && cfg.folderPattern !== undefined) {
      patternSelect.value = cfg.folderPattern;
    }
    const startPageInput = this.container.querySelector("#pillSettingStartPage");
    if (startPageInput && cfg.startPage !== undefined) {
      startPageInput.value = String(cfg.startPage);
    }
    const endPageInput = this.container.querySelector("#pillSettingEndPage");
    if (endPageInput && cfg.endPage !== undefined) {
      endPageInput.value = cfg.endPage > 0 ? String(cfg.endPage) : "";
    }
    const maxHeightInput = this.container.querySelector("#pillSettingMaxHeight");
    if (maxHeightInput && cfg.maxPageHeight !== undefined) {
      maxHeightInput.value = cfg.maxPageHeight > 0 ? String(cfg.maxPageHeight) : "";
    }
  }
  showStopPrompt(count, onSave, onDiscard, onCancel, customMessage) {
    if (!this.container)
      return;
    this.isConfirmingStop = true;
    const confirmBar = this.container.querySelector("#pillConfirmBar");
    const confirmText = this.container.querySelector("#pillConfirmText");
    const saveBtn = this.container.querySelector("#pillConfirmSaveBtn");
    const discardBtn = this.container.querySelector("#pillConfirmDiscardBtn");
    const cancelBtn = this.container.querySelector("#pillConfirmCancelBtn");
    this.setStandardControlsVisible(false);
    if (confirmText) {
      confirmText.textContent = customMessage || `Save all ${count} pages downloaded so far?`;
    }
    if (confirmBar) {
      confirmBar.style.display = "flex";
    }
    const cleanup = () => {
      this.isConfirmingStop = false;
      if (confirmBar)
        confirmBar.style.display = "none";
      this.setStandardControlsVisible(true);
    };
    saveBtn.onclick = () => {
      cleanup();
      onSave();
    };
    discardBtn.onclick = () => {
      cleanup();
      onDiscard();
    };
    cancelBtn.onclick = () => {
      cleanup();
      onCancel();
    };
  }
  hideStopPrompt() {
    this.isConfirmingStop = false;
    const confirmBar = this.container?.querySelector("#pillConfirmBar");
    if (confirmBar)
      confirmBar.style.display = "none";
    this.setStandardControlsVisible(true);
  }
  setStandardControlsVisible(visible) {
    if (!this.container)
      return;
    const elements = this.container.querySelectorAll("#pillStartBtn, #pillContinueBtn, #pillViewFileBtn, #pillPauseBtn, #pillResumeBtn, #pillStopBtn, #pillModeBtn, .pill-status-section, #pillCounter");
    elements.forEach((el) => {
      el.style.display = visible ? "" : "none";
    });
  }
  dockToLeft() {
    if (!this.container)
      return;
    this.isDocked = true;
    this.toggleSettings(false);
    this.container.classList.add("docked-left");
  }
  undockFromLeft() {
    if (!this.container)
      return;
    this.isDocked = false;
    this.container.classList.remove("docked-left");
  }
  updateProgress(currentPage, totalPages, statusText, statusType = "normal", isPaused = false, isActive = false, currentMode = 1, imageDimensions) {
    if (!this.container)
      return;
    if (this.isConfirmingStop)
      return;
    const startBtn = this.container.querySelector("#pillStartBtn");
    const continueBtn = this.container.querySelector("#pillContinueBtn");
    const viewFileBtn = this.container.querySelector("#pillViewFileBtn");
    const pauseBtn = this.container.querySelector("#pillPauseBtn");
    const resumeBtn = this.container.querySelector("#pillResumeBtn");
    const stopBtn = this.container.querySelector("#pillStopBtn");
    const modeBtn = this.container.querySelector("#pillModeBtn");
    const counterEl = this.container.querySelector("#pillCounter");
    const fillEl = this.container.querySelector("#pillProgressFill");
    const statusTextEl = this.container.querySelector("#pillStatusText");
    const dimensionsEl = this.container.querySelector("#pillDimensionsText");
    if (modeBtn) {
      modeBtn.style.display = currentMode !== 1 && !isActive ? "flex" : "none";
    }
    if (counterEl) {
      if (totalPages > 0) {
        if (isActive) {
          counterEl.textContent = `Page ${currentPage}/${totalPages}`;
        } else {
          counterEl.textContent = `0/${totalPages} pages`;
        }
      } else {
        counterEl.textContent = "Detecting pages...";
      }
    }
    if (fillEl && totalPages > 0) {
      const pct = Math.min(100, Math.round((currentPage + 1) / totalPages * 100));
      fillEl.style.width = `${pct}%`;
    }
    if (statusTextEl) {
      statusTextEl.textContent = statusText;
      statusTextEl.className = `pill-status-text ${statusType}`;
    }
    if (dimensionsEl) {
      if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
        dimensionsEl.textContent = `(image: ${imageDimensions.width} x ${imageDimensions.height})`;
      } else {
        dimensionsEl.textContent = `(image: - x -)`;
      }
    }
    startBtn.style.display = "none";
    continueBtn.style.display = "none";
    viewFileBtn.style.display = "none";
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "none";
    stopBtn.style.display = "none";
    if (statusType === "complete") {
      viewFileBtn.style.display = "flex";
    } else if (statusType === "stalled" || statusType === "offline" || isPaused && statusType === "retrying") {
      continueBtn.style.display = "flex";
      stopBtn.style.display = "flex";
    } else if (isActive) {
      stopBtn.style.display = "flex";
      if (isPaused) {
        resumeBtn.style.display = "flex";
      } else {
        pauseBtn.style.display = "flex";
      }
    } else {
      startBtn.style.display = "flex";
    }
  }
  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// src/utils/markdown-builder.ts
function parseDjvuXmlToText(xmlString) {
  if (!xmlString || typeof xmlString !== "string")
    return "";
  const paragraphMatches = xmlString.match(/<PARAGRAPH[\s\S]*?<\/PARAGRAPH>/gi);
  if (!paragraphMatches || paragraphMatches.length === 0) {
    const words = Array.from(xmlString.matchAll(/<WORD[^>]*>([\s\S]*?)<\/WORD>/gi)).map((m) => decodeHtmlAndXmlEntities(m[1].trim())).filter(Boolean);
    return words.join(" ");
  }
  const paragraphs = [];
  for (const parBlock of paragraphMatches) {
    const lineMatches = parBlock.match(/<LINE[\s\S]*?<\/LINE>/gi);
    const lines = [];
    if (lineMatches && lineMatches.length > 0) {
      for (const lineBlock of lineMatches) {
        const wordMatches = Array.from(lineBlock.matchAll(/<WORD[^>]*>([\s\S]*?)<\/WORD>/gi));
        const words = wordMatches.map((m) => decodeHtmlAndXmlEntities(m[1].trim())).filter(Boolean);
        if (words.length > 0) {
          lines.push(words.join(" "));
        }
      }
    } else {
      const wordMatches = Array.from(parBlock.matchAll(/<WORD[^>]*>([\s\S]*?)<\/WORD>/gi));
      const words = wordMatches.map((m) => decodeHtmlAndXmlEntities(m[1].trim())).filter(Boolean);
      if (words.length > 0) {
        lines.push(words.join(" "));
      }
    }
    if (lines.length > 0) {
      paragraphs.push(decodeHtmlAndXmlEntities(lines.join(`
`)));
    }
  }
  return decodeHtmlAndXmlEntities(paragraphs.join(`

`));
}
function decodeHtmlAndXmlEntities(text) {
  if (!text || typeof text !== "string")
    return "";
  return text.replace(/&#(\d+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      return String.fromCodePoint(code);
    } catch {
      return _;
    }
  }).replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return String.fromCodePoint(code);
    } catch {
      return _;
    }
  }).replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&hellip;/g, "…").replace(/&lsquo;/g, "‘").replace(/&rsquo;/g, "’").replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”").replace(/&nbsp;/g, " ").replace(/&bull;/g, "•").replace(/&cent;/g, "¢").replace(/&pound;/g, "£").replace(/&yen;/g, "¥").replace(/&euro;/g, "€").replace(/&copy;/g, "©").replace(/&reg;/g, "®").replace(/&deg;/g, "°").replace(/&plusmn;/g, "±").replace(/&times;/g, "×").replace(/&divide;/g, "÷").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function parseHathiFigcaptionToText(input) {
  if (!input)
    return "";
  if (typeof input === "object" && input.nodeType) {
    const el = input;
    const pElements = Array.from(el.querySelectorAll("p, .ocr_par"));
    if (pElements.length > 0) {
      const paragraphs = pElements.map((p) => {
        const spans2 = Array.from(p.querySelectorAll("span, .ocrx_word, .ocr_line"));
        if (spans2.length > 0) {
          return spans2.map((s) => (s.textContent || "").trim()).filter(Boolean).join(" ");
        }
        return (p.textContent || "").trim().replace(/\s+/g, " ");
      }).filter(Boolean);
      return decodeHtmlAndXmlEntities(paragraphs.join(`

`));
    }
    const lines = Array.from(el.querySelectorAll(".ocr_line, div"));
    if (lines.length > 0) {
      const lineTexts = lines.map((line) => {
        const spans2 = Array.from(line.querySelectorAll("span, .ocrx_word"));
        if (spans2.length > 0) {
          return spans2.map((s) => (s.textContent || "").trim()).filter(Boolean).join(" ");
        }
        return (line.textContent || "").trim().replace(/\s+/g, " ");
      }).filter(Boolean);
      return decodeHtmlAndXmlEntities(lineTexts.join(`
`));
    }
    const spans = Array.from(el.querySelectorAll("span"));
    if (spans.length > 0) {
      const text = spans.map((s) => (s.textContent || "").trim()).filter(Boolean).join(" ");
      return decodeHtmlAndXmlEntities(text);
    }
    return decodeHtmlAndXmlEntities((el.textContent || "").trim().replace(/[ \t]+/g, " "));
  }
  if (typeof input === "string") {
    let clean = input;
    const pMatches = clean.match(/<(?:p|div class="ocr_par")[^>]*>([\s\S]*?)<\/(?:p|div)>/gi);
    if (pMatches && pMatches.length > 0) {
      const paragraphs = pMatches.map((pBlock) => {
        return pBlock.replace(/<br\s*\/?>/gi, `
`).replace(/<[^>]+>/g, " ").replace(/[ \t\r\n]+/g, " ").trim();
      }).filter(Boolean);
      return decodeHtmlAndXmlEntities(paragraphs.join(`

`));
    }
    const text = clean.replace(/<br\s*\/?>/gi, `
`).replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, `

`).trim();
    return decodeHtmlAndXmlEntities(text);
  }
  return "";
}
function buildBookMarkdown(metadata, pages) {
  const parts = [];
  parts.push(`# ${metadata.title || "Untitled Book"}
`);
  const metaLines = [];
  if (metadata.author)
    metaLines.push(`- **Author:** ${metadata.author}`);
  if (metadata.publisher)
    metaLines.push(`- **Publisher:** ${metadata.publisher}`);
  if (metadata.year)
    metaLines.push(`- **Date:** ${metadata.year}`);
  if (metadata.bookId) {
    if (metadata.sourceUrl && metadata.sourceUrl.includes("hathitrust.org")) {
      metaLines.push(`- **HathiTrust Identifier:** [${metadata.bookId}](${metadata.sourceUrl})`);
    } else {
      metaLines.push(`- **Internet Archive Identifier:** [${metadata.bookId}](https://archive.org/details/${metadata.bookId})`);
    }
  }
  if (metadata.sourceUrl && !metaLines.some((l) => l.includes(metadata.sourceUrl))) {
    metaLines.push(`- **Source:** ${metadata.sourceUrl}`);
  }
  if (metadata.totalPages)
    metaLines.push(`- **Total Pages:** ${metadata.totalPages}`);
  if (metaLines.length > 0) {
    parts.push(metaLines.join(`
`));
    parts.push(`
---
`);
  }
  const sorted = [...pages].sort((a, b) => a.pageNum - b.pageNum);
  for (const page of sorted) {
    parts.push(`## Page ${page.pageNum}

`);
    if (page.text && page.text.trim()) {
      parts.push(`${page.text.trim()}
`);
    } else {
      parts.push(`*[No text or illustration page]*
`);
    }
    parts.push(`
---
`);
  }
  return parts.join(`
`);
}

// src/utils/pdf-builder.ts
function getJpegInfo(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (view.getUint16(0) !== 65496) {
    throw new Error("Not a valid JPEG image (missing SOI marker).");
  }
  const SOF_MARKERS = [
    65472,
    65473,
    65474,
    65475,
    65477,
    65478,
    65479,
    65481,
    65482,
    65483,
    65485,
    65486,
    65487
  ];
  let pos = 2;
  while (pos < data.length - 8) {
    const marker = view.getUint16(pos);
    pos += 2;
    if (SOF_MARKERS.includes(marker)) {
      pos += 2;
      const bits = view.getUint8(pos++);
      const height = view.getUint16(pos);
      pos += 2;
      const width = view.getUint16(pos);
      pos += 2;
      const channels = view.getUint8(pos++);
      let colorSpace = "DeviceRGB";
      if (channels === 1)
        colorSpace = "DeviceGray";
      else if (channels === 4)
        colorSpace = "DeviceCMYK";
      return { width, height, channels, colorSpace, bits };
    }
    const length = view.getUint16(pos);
    pos += length;
  }
  throw new Error("Could not find SOF marker in JPEG stream.");
}
function dataUrlToBytes(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0;i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function compileJpegsToPdf(images, metadata = {}) {
  if (images.length === 0) {
    throw new Error("Cannot create PDF: No images provided.");
  }
  const textEncoder = new TextEncoder;
  const chunks = [];
  const offsets = [];
  let currentOffset = 0;
  function write(bytes) {
    chunks.push(bytes);
    currentOffset += bytes.length;
  }
  function writeString(str) {
    write(textEncoder.encode(str));
  }
  writeString(`%PDF-1.4
%âãÏÓ
`);
  let objIdCounter = 1;
  function startObject() {
    const id = objIdCounter++;
    offsets[id] = currentOffset;
    writeString(`${id} 0 obj
`);
    return id;
  }
  function endObject() {
    writeString(`endobj
`);
  }
  const totalPages = images.length;
  const catalogId = 1;
  const pagesRootId = 2;
  const pageIds = [];
  for (let i = 0;i < totalPages; i++) {
    pageIds.push(3 + i * 3);
  }
  startObject();
  writeString(`<<
  /Type /Catalog
  /Pages ${pagesRootId} 0 R
>>
`);
  endObject();
  startObject();
  const kidsStr = pageIds.map((id) => `${id} 0 R`).join(" ");
  writeString(`<<
  /Type /Pages
  /Kids [ ${kidsStr} ]
  /Count ${totalPages}
>>
`);
  endObject();
  for (let i = 0;i < totalPages; i++) {
    const item = images[i];
    const imageBytes = typeof item.data === "string" ? dataUrlToBytes(item.data) : item.data;
    const info = getJpegInfo(imageBytes);
    const width = item.width || info.width;
    const height = item.height || info.height;
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;
    startObject();
    writeString(`<<
` + `  /Type /Page
` + `  /Parent ${pagesRootId} 0 R
` + `  /MediaBox [ 0 0 ${width} ${height} ]
` + `  /Contents ${contentObjId} 0 R
` + `  /Resources <<
` + `    /XObject << /Im${i + 1} ${imageObjId} 0 R >>
` + `  >>
` + `>>
`);
    endObject();
    const contentStream = `q
${width} 0 0 ${height} 0 0 cm
/Im${i + 1} Do
Q
`;
    const contentBytes = textEncoder.encode(contentStream);
    startObject();
    writeString(`<< /Length ${contentBytes.length} >>
stream
`);
    write(contentBytes);
    writeString(`
endstream
`);
    endObject();
    startObject();
    writeString(`<<
` + `  /Type /XObject
` + `  /Subtype /Image
` + `  /Width ${info.width}
` + `  /Height ${info.height}
` + `  /ColorSpace /${info.colorSpace}
` + `  /BitsPerComponent ${info.bits}
` + `  /Filter /DCTDecode
` + `  /Length ${imageBytes.length}
` + `>>
stream
`);
    write(imageBytes);
    writeString(`
endstream
`);
    endObject();
  }
  const infoId = startObject();
  const safeTitle = (metadata.title || "Archive.org Book").replace(/[()\\]/g, "\\$&");
  const safeAuthor = (metadata.author || "Archive.org").replace(/[()\\]/g, "\\$&");
  const creator = (metadata.creator || "Archive Downloader").replace(/[()\\]/g, "\\$&");
  writeString(`<<
` + `  /Title (${safeTitle})
` + `  /Author (${safeAuthor})
` + `  /Creator (${creator})
` + `  /Producer (Archive Downloader Extension)
` + `  /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}Z)
` + `>>
`);
  endObject();
  const startXref = currentOffset;
  const totalObjects = objIdCounter;
  writeString(`xref
0 ${totalObjects}
`);
  writeString(`0000000000 65535 f 
`);
  for (let id = 1;id < totalObjects; id++) {
    const offset = offsets[id] || 0;
    const paddedOffset = String(offset).padStart(10, "0");
    writeString(`${paddedOffset} 00000 n 
`);
  }
  writeString(`trailer
` + `<<
` + `  /Size ${totalObjects}
` + `  /Root ${catalogId} 0 R
` + `  /Info ${infoId} 0 R
` + `>>
` + `startxref
` + `${startXref}
` + `%%EOF
`);
  let totalLength = 0;
  for (const chunk of chunks)
    totalLength += chunk.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

// src/utils/sanitizer.ts
function sanitizeFilename(name, fallback = "book") {
  if (!name || typeof name !== "string")
    return fallback;
  let cleaned = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/^\.+|\.+$/g, "").trim();
  const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reserved.test(cleaned)) {
    cleaned = `${cleaned}_file`;
  }
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 120).trim();
  }
  return cleaned || fallback;
}
function formatSubdir(baseDir, pattern, bookTitle, bookId) {
  const safeBase = sanitizeFilename(baseDir, "ArchiveBooks");
  const safeTitle = sanitizeFilename(bookTitle, "book");
  const safeId = sanitizeFilename(bookId, "id");
  let folder = pattern || "{title}_{id}";
  folder = folder.replace(/\{title\}/g, safeTitle);
  folder = folder.replace(/\{id\}/g, safeId);
  folder = sanitizeFilename(folder, safeTitle);
  return `${safeBase}/${folder}`;
}

// src/providers/archive-provider.ts
function parseArchiveImageUrlPage(src) {
  if (!src)
    return null;
  const fileMatch = src.match(/[?&]file=[^&]*?[_\-\.](\d+)\.(?:tif|jp2|jpg|jpeg|png)/i);
  if (fileMatch) {
    const num = parseInt(fileMatch[1], 10);
    if (!isNaN(num))
      return num;
  }
  const genericMatch = src.match(/[_\-\.](\d{3,6})\.(?:tif|jp2|jpg|jpeg|png)(?:[?&#]|$)/i);
  if (genericMatch) {
    const num = parseInt(genericMatch[1], 10);
    if (!isNaN(num))
      return num;
  }
  const paramMatch = src.match(/[?&](?:page|leaf)=(\d+)/i);
  if (paramMatch) {
    const num = parseInt(paramMatch[1], 10);
    if (!isNaN(num))
      return num;
  }
  return null;
}
function isImageLoaded(img, minWidth = 200) {
  if (!img)
    return false;
  if (!img.src || img.src.startsWith("data:image/gif") || img.src === "about:blank")
    return false;
  return Boolean(img.complete && (img.naturalWidth >= minWidth || img.width >= minWidth));
}
function parseArchiveDomPage(text) {
  if (!text)
    return null;
  const match = text.match(/\((\d+)(?:\s*-\s*\d+)?\s*\/\s*(\d+)\)/);
  if (match) {
    return {
      current: parseInt(match[1], 10),
      total: parseInt(match[2], 10)
    };
  }
  const slashMatch = text.match(/(\d+)(?:\s*-\s*\d+)?\s*\/\s*(\d+)/);
  if (slashMatch) {
    return {
      current: parseInt(slashMatch[1], 10),
      total: parseInt(slashMatch[2], 10)
    };
  }
  const ofMatch = text.match(/(\d+)\s+of\s+(\d+)/i);
  if (ofMatch) {
    return {
      current: parseInt(ofMatch[1], 10),
      total: parseInt(ofMatch[2], 10)
    };
  }
  const pageMatch = text.match(/page\s*—?\s*(\d+)/i);
  if (pageMatch) {
    return {
      current: parseInt(pageMatch[1], 10),
      total: 0
    };
  }
  return null;
}

class ArchiveProvider {
  siteId = "archive";
  siteName = "Archive.org";
  defaultStartPage = 0;
  bookInfo = null;
  textCache = new Map;
  detectedOffset = null;
  onArchiveTextReady(page, xml) {
    const text = parseDjvuXmlToText(xml);
    if (text) {
      this.textCache.set(page, text);
    }
  }
  isMatch() {
    return window.location.hostname.includes("archive.org") && window.location.pathname.includes("/details/");
  }
  setBookInfo(info) {
    this.bookInfo = info;
  }
  async detectBookInfo() {
    this.postToBridge("DETECT_BOOK");
    const domPage = this.extractPageInfoFromDom();
    if (domPage) {
      const title = document.title || "Archive Book";
      const idMatch = window.location.pathname.match(/\/details\/([^\/\?#]+)/);
      const bookId = idMatch ? idMatch[1] : "book";
      if (!this.bookInfo) {
        this.bookInfo = {
          bookId,
          bookTitle: title,
          totalPages: domPage.total,
          currentLeaf: domPage.current,
          currentMode: 1,
          sourceUrl: window.location.href
        };
      } else {
        if (domPage.total > 0 && (!this.bookInfo.totalPages || this.bookInfo.totalPages < domPage.total)) {
          this.bookInfo.totalPages = domPage.total;
        }
      }
    }
    return this.bookInfo;
  }
  getCurrentPage() {
    const currentSpan = document.querySelector('.BRcurrentpage, [role="status"], .page-number, .BRpager-counter');
    if (currentSpan && currentSpan.textContent) {
      const parsed = parseArchiveDomPage(currentSpan.textContent);
      if (parsed && typeof parsed.current === "number") {
        return parsed.current;
      }
    }
    const visibleContainer = document.querySelector(".BRpagecontainer.BRpage-visible, .BRpagecontainer--hasSelection, .BRpage.active");
    if (visibleContainer) {
      const idxAttr = visibleContainer.getAttribute("data-index") || visibleContainer.getAttribute("data-page");
      if (idxAttr) {
        const val = parseInt(idxAttr, 10);
        if (!isNaN(val))
          return val;
      }
    }
    const pageInput = document.querySelector('input.BRpageinput, input.page-number-input, input[name="page"]');
    if (pageInput && pageInput.value) {
      const val = parseInt(pageInput.value, 10);
      if (!isNaN(val))
        return val;
    }
    return null;
  }
  async enforceSinglePageMode() {
    console.log("[ArchiveDownloader] Enforcing single-page mode on Archive.org...");
    this.postToBridge("SWITCH_MODE_1");
    const onePageBtn = document.querySelector('button[title*="One-page" i], button[aria-label*="One-page" i], button.one-page, .BRpageview1, button[data-mode="1"], [aria-label*="1-page" i], .BRicon_onepage, .view-mode-1up');
    if (onePageBtn && !onePageBtn.classList.contains("active") && onePageBtn.getAttribute("aria-pressed") !== "true") {
      try {
        onePageBtn.click();
      } catch (e) {}
    }
    return true;
  }
  async navigateToPage(pageNum) {
    console.log(`[ArchiveDownloader] Navigating to Archive leaf ${pageNum}...`);
    this.postToBridge("JUMP_PAGE", { leafIndex: pageNum });
    if (pageNum === 0) {
      const firstBtn = document.querySelector('button[title*="First page" i], button[aria-label*="First page" i], button.navfirst, .book-flip-first, .BRnavfirst, [aria-label="First page" i]');
      if (firstBtn) {
        try {
          firstBtn.click();
        } catch (e) {}
      }
      const homeEvent = { bubbles: true, cancelable: true, key: "Home", code: "Home", keyCode: 36, which: 36 };
      document.body.dispatchEvent(new KeyboardEvent("keydown", homeEvent));
      window.dispatchEvent(new KeyboardEvent("keydown", homeEvent));
    }
    return true;
  }
  triggerPageFlip(targetPageNum) {
    this.postToBridge("FLIP_NEXT", { targetPage: targetPageNum });
    const nextBtn = document.querySelector('button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right, .BRnavnext, [aria-label="Next page" i], [data-action="next-page" i], .BRicon_flip_right, button.page-next');
    if (nextBtn) {
      try {
        nextBtn.click();
      } catch (e) {}
    }
  }
  getActivePageImage(minWidth = 200, targetPageNum) {
    const visibleContainers = Array.from(document.querySelectorAll(".BRpagecontainer.BRpage-visible, .BRpagecontainer--hasSelection, .BRpage.active, .BRpageview"));
    for (const container of visibleContainers) {
      if (!container || container.tagName === "IMG" || typeof container.querySelectorAll !== "function")
        continue;
      const imgs = Array.from(container.querySelectorAll('img.BRpageimage, img[class*="BRpage"], img[src*="BookReaderImages.php"], img'));
      for (const img of imgs) {
        if (isImageLoaded(img, minWidth)) {
          if (typeof targetPageNum === "number") {
            img.dataset.seq = String(targetPageNum);
            const fileNum = parseArchiveImageUrlPage(img.src);
            if (fileNum !== null) {
              this.detectedOffset = fileNum - targetPageNum;
            }
          }
          return img;
        }
      }
    }
    if (typeof targetPageNum === "number") {
      const targetSelectors = [
        `.BRpagecontainer[data-index="${targetPageNum}"] img.BRpageimage`,
        `.BRpagecontainer[data-index="${targetPageNum}"] img`,
        `.pagediv${targetPageNum} img.BRpageimage`,
        `.pagediv${targetPageNum} img`,
        `[data-index="${targetPageNum}"] img.BRpageimage`,
        `[data-index="${targetPageNum}"] img`,
        `[data-page-num="n${targetPageNum}"] img`,
        `.BRpage[data-page="${targetPageNum}"] img`,
        `.BRpage[data-leaf="${targetPageNum}"] img`,
        `#pagediv${targetPageNum} img`,
        `#page${targetPageNum} img`
      ];
      for (const sel of targetSelectors) {
        const el = document.querySelector(sel);
        if (isImageLoaded(el, minWidth)) {
          el.dataset.seq = String(targetPageNum);
          const fileNum = parseArchiveImageUrlPage(el.src);
          if (fileNum !== null) {
            this.detectedOffset = fileNum - targetPageNum;
          }
          return el;
        }
      }
      const containerCheck = document.querySelector(`.BRpagecontainer[data-index="${targetPageNum}"], .pagediv${targetPageNum}, [data-index="${targetPageNum}"]`);
      if (containerCheck) {
        return null;
      }
    }
    const allImages = Array.from(document.querySelectorAll('img.BRpageimage, .BRpagecontainer img, .BRpage img, img[src*="BookReaderImages.php"], img[src*="/BookReader/"], .book-page img')).filter((img) => isImageLoaded(img, minWidth));
    if (allImages.length === 0)
      return null;
    if (typeof targetPageNum === "number") {
      const filtered = allImages.filter((img) => {
        const fileNum = parseArchiveImageUrlPage(img.src);
        if (fileNum === null)
          return true;
        const offset = this.detectedOffset ?? 0;
        return fileNum >= targetPageNum + offset;
      });
      if (filtered.length === 0)
        return null;
      const exactMatch = filtered.find((img) => {
        const fn = parseArchiveImageUrlPage(img.src);
        return fn === targetPageNum || this.detectedOffset !== null && fn === targetPageNum + this.detectedOffset;
      });
      const chosen2 = exactMatch || filtered[filtered.length - 1];
      chosen2.dataset.seq = String(targetPageNum);
      return chosen2;
    }
    let bestImg = null;
    let maxVisibleArea = 0;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
    const winH = typeof window !== "undefined" ? window.innerHeight : 1080;
    for (const img of allImages) {
      const rect = img.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, winW) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, winH) - Math.max(rect.top, 0));
      const area = visibleWidth * visibleHeight;
      if (area > maxVisibleArea && visibleWidth > 50 && visibleHeight > 50) {
        maxVisibleArea = area;
        bestImg = img;
      }
    }
    const chosen = bestImg || allImages[allImages.length - 1] || null;
    if (chosen && typeof targetPageNum === "number") {
      chosen.dataset.seq = String(targetPageNum);
    }
    return chosen;
  }
  async extractPageText(pageNum, img) {
    if (this.textCache.has(pageNum)) {
      return this.textCache.get(pageNum);
    }
    for (let i = 0;i < 4; i++) {
      if (this.textCache.has(pageNum)) {
        return this.textCache.get(pageNum);
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    if (this.textCache.has(pageNum)) {
      return this.textCache.get(pageNum);
    }
    let server = this.bookInfo?.server || "";
    let bookPath = this.bookInfo?.bookPath || "";
    const candidateSrc = img?.src || this.getActivePageImage(300, pageNum)?.src;
    if ((!server || !bookPath) && candidateSrc && candidateSrc.includes("BookReaderImages.php")) {
      try {
        const u = new URL(candidateSrc);
        if (!server)
          server = u.host;
        const zipParam = u.searchParams.get("zip");
        const idParam = u.searchParams.get("id");
        if (!bookPath) {
          if (zipParam) {
            bookPath = zipParam.replace(/_[a-zA-Z0-9]+\.zip$/i, "");
          } else if (idParam) {
            bookPath = `/0/items/${idParam}/${idParam}`;
          }
        }
        if (this.bookInfo) {
          if (!this.bookInfo.server && server)
            this.bookInfo.server = server;
          if (!this.bookInfo.bookPath && bookPath)
            this.bookInfo.bookPath = bookPath;
        }
      } catch (e) {}
    }
    if (!server || !bookPath) {
      return "";
    }
    const leafIndex = pageNum;
    const url = `https://${server}/BookReader/BookReaderGetTextWrapper.php?path=${encodeURIComponent(bookPath)}_djvu.xml&mode=djvu_xml&page=${leafIndex}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include"
      });
      if (!response.ok)
        return "";
      const xml = await response.text();
      const text = parseDjvuXmlToText(xml);
      this.textCache.set(leafIndex, text);
      return text;
    } catch (err) {
      console.warn(`[ArchiveDownloader] Could not fetch text for leaf ${leafIndex}:`, err);
      return "";
    }
  }
  isAtEndOfBook(currentPage, totalPages) {
    const nextBtn = document.querySelector('button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right, .BRnavnext, [aria-label="Next page" i], [data-action="next-page" i]');
    const isNextDisabled = nextBtn && (nextBtn.disabled || nextBtn.getAttribute("aria-disabled") === "true" || nextBtn.classList.contains("disabled"));
    const domLeaf = this.getCurrentPage();
    return Boolean(isNextDisabled || totalPages > 0 && domLeaf !== null && domLeaf >= totalPages && currentPage >= totalPages);
  }
  postToBridge(action, extraData = {}) {
    window.postMessage({ direction: "TO_BRIDGE", action, ...extraData }, "*");
  }
  extractPageInfoFromDom() {
    const pageEl = document.querySelector('.BRcurrentpage, [role="status"]');
    if (pageEl && pageEl.textContent) {
      const parsed = parseArchiveDomPage(pageEl.textContent);
      if (parsed)
        return parsed;
    }
    return null;
  }
}

// src/providers/hathitrust-provider.ts
class HathiTrustProvider {
  siteId = "hathitrust";
  siteName = "HathiTrust";
  defaultStartPage = 1;
  bookInfo = null;
  announcedSequences = new Set;
  seqToBlobUrl = new Map;
  blobUrlToSeq = new Map;
  seqToHtml = new Map;
  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("message", (event) => {
        if (event.source !== window || !event.data || event.data.direction !== "FROM_BRIDGE") {
          return;
        }
        const msg = event.data;
        if (msg.event === "PAGE_LOAD_ANNOUNCED") {
          if (msg.isLoaded) {
            this.announcedSequences.add(msg.seq);
            console.log(`[ArchiveDownloader] HathiTrust announced sequence ${msg.seq} loaded`);
          }
        } else if (msg.event === "PAGE_IMAGE_READY") {
          this.seqToBlobUrl.set(msg.seq, msg.blobUrl);
          this.blobUrlToSeq.set(msg.blobUrl, msg.seq);
        } else if (msg.event === "PAGE_TEXT_READY") {
          this.seqToHtml.set(msg.seq, msg.html);
        }
      });
    }
  }
  onPageLoadAnnounced(seq, isVisible, isLoaded) {
    if (isLoaded) {
      this.announcedSequences.add(seq);
    }
  }
  onPageImageReady(seq, blobUrl) {
    this.seqToBlobUrl.set(seq, blobUrl);
    this.blobUrlToSeq.set(blobUrl, seq);
  }
  onPageTextReady(seq, html) {
    this.seqToHtml.set(seq, html);
  }
  getBlobUrlForSeq(seq) {
    return this.seqToBlobUrl.get(seq);
  }
  getCachedHtmlForSeq(seq) {
    return this.seqToHtml.get(seq);
  }
  isPageAnnounced(seq) {
    return this.announcedSequences.has(seq);
  }
  isMatch() {
    const isHost = window.location.hostname === "babel.hathitrust.org" || window.location.hostname.includes("hathitrust.org") && window.location.pathname.startsWith("/cgi/pt");
    return isHost;
  }
  async detectBookInfo() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("id") || "hathitrust_book";
    let bookTitle = "";
    const metaTitle = document.querySelector('meta[name="DC.title"], meta[property="og:title"]');
    if (metaTitle && metaTitle.content) {
      bookTitle = metaTitle.content.trim();
    }
    if (!bookTitle) {
      const h1 = document.querySelector("h1.title, h1.item-title, h1");
      if (h1 && h1.textContent) {
        bookTitle = h1.textContent.trim();
      }
    }
    if (!bookTitle) {
      bookTitle = document.title ? document.title.replace(/[-|]\s*HathiTrust.*/i, "").trim() : "HathiTrust Book";
    }
    const totalPages = this.getTotalPagesFromDom();
    const currentSeq = this.getCurrentPage() || 1;
    const authorMeta = document.querySelector('meta[name="DC.creator"]');
    const author = authorMeta?.content;
    const dateMeta = document.querySelector('meta[name="DC.date"]');
    const year = dateMeta?.content;
    this.bookInfo = {
      bookId,
      bookTitle: bookTitle || "HathiTrust Book",
      totalPages: totalPages || 500,
      currentLeaf: currentSeq,
      currentMode: 1,
      sourceUrl: window.location.href,
      author,
      year
    };
    console.log("[ArchiveDownloader] HathiTrust volume detected:", this.bookInfo.bookTitle, `(${this.bookInfo.totalPages} pages)`);
    return this.bookInfo;
  }
  getCurrentPage() {
    if (typeof document === "undefined")
      return null;
    const seqInput = document.querySelector('#toolbar-seq, input[name="seq"]');
    if (seqInput && seqInput.value) {
      const val = parseInt(seqInput.value, 10);
      if (!isNaN(val) && val > 0)
        return val;
    }
    if (typeof window !== "undefined" && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const seq = params.get("seq");
      if (seq) {
        const val = parseInt(seq, 10);
        if (!isNaN(val) && val > 0)
          return val;
      }
    }
    const activeFig = document.querySelector("div.spread figure[data-seq], figure[data-seq]");
    if (activeFig) {
      const seqAttr = activeFig.getAttribute("data-seq");
      if (seqAttr) {
        const val = parseInt(seqAttr, 10);
        if (!isNaN(val) && val > 0)
          return val;
      }
    }
    return null;
  }
  async navigateToPage(pageNum) {
    console.log(`[ArchiveDownloader] Navigating to HathiTrust sequence ${pageNum}...`);
    const seqInput = document.querySelector('#toolbar-seq, input[name="seq"]');
    if (seqInput) {
      seqInput.focus();
      seqInput.value = String(pageNum);
      seqInput.dispatchEvent(new Event("input", { bubbles: true }));
      seqInput.dispatchEvent(new Event("change", { bubbles: true }));
      const enterEvent = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13
      });
      seqInput.dispatchEvent(enterEvent);
      const form = seqInput.closest("form");
      if (form) {
        try {
          if (typeof form.requestSubmit === "function") {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          }
        } catch (e) {}
      }
      return true;
    }
    return false;
  }
  triggerPageFlip(targetPageNum) {
    const nextBtn = document.querySelector('button[aria-label="Next Page" i], button[aria-label*="Next" i], button[title*="Next" i], [accesskey="n"], button.next, a.action-next-page');
    if (nextBtn) {
      const disabled = nextBtn.disabled || nextBtn.getAttribute("aria-disabled") === "true" || nextBtn.classList.contains("disabled");
      if (!disabled) {
        try {
          console.log("[ArchiveDownloader] Clicking HathiTrust Next Page button...");
          nextBtn.click();
          return;
        } catch (e) {}
      }
    }
    const keyEvent = {
      bubbles: true,
      cancelable: true,
      key: "ArrowRight",
      code: "ArrowRight",
      keyCode: 39,
      which: 39
    };
    document.body.dispatchEvent(new KeyboardEvent("keydown", keyEvent));
    window.dispatchEvent(new KeyboardEvent("keydown", keyEvent));
    const seqInput = document.querySelector('#toolbar-seq, input[name="seq"]');
    if (seqInput) {
      console.log(`[ArchiveDownloader] Fallback to sequence input ${targetPageNum}...`);
      this.navigateToPage(targetPageNum);
    }
  }
  getActivePageImage(minWidth = 300, targetSeq) {
    if (typeof document === "undefined")
      return null;
    if (typeof targetSeq === "number") {
      const currentSeq = this.getCurrentPage();
      if (currentSeq !== null && currentSeq < targetSeq) {
        return null;
      }
      const tagged = document.querySelector(`img[data-seq="${targetSeq}"]`);
      if (tagged && tagged.complete && tagged.naturalWidth >= minWidth && tagged.src && !tagged.src.includes("base64,iVBORw")) {
        return tagged;
      }
    }
    const images = Array.from(document.querySelectorAll('main#main details figure div.image img, main#main details figure img, main#main div.spread figure div.image img, main#main div.spread figure img, main#main img[src^="blob:"], main#main img'));
    const valid = images.filter((img) => img.complete && img.naturalWidth >= minWidth && img.src && !img.src.includes("base64,iVBORw"));
    if (valid.length === 0)
      return null;
    const visible = valid.find((img) => {
      if (typeof targetSeq === "number" && img.dataset.seq && parseInt(img.dataset.seq, 10) !== targetSeq) {
        return false;
      }
      const rect = img.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50 && rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
    });
    const chosen = visible || valid[0];
    if (chosen && typeof targetSeq === "number") {
      chosen.setAttribute("data-seq", String(targetSeq));
      chosen.dataset.seq = String(targetSeq);
    }
    return chosen;
  }
  async extractPageText(pageNum, img) {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const start = Date.now();
    const cachedHtml = this.seqToHtml.get(pageNum);
    if (cachedHtml) {
      const text = parseHathiFigcaptionToText(cachedHtml);
      if (text && text.trim().length > 0) {
        return text;
      }
    }
    if (typeof document === "undefined") {
      return "";
    }
    while (Date.now() - start < 2500) {
      if (img) {
        const figure = img.closest("figure");
        if (figure) {
          const figcaption = figure.querySelector("figcaption");
          if (figcaption && figcaption.textContent && figcaption.textContent.trim().length > 0) {
            return parseHathiFigcaptionToText(figcaption);
          }
        }
      }
      const taggedFigcaption = document.querySelector(`figure[data-seq="${pageNum}"] figcaption, figcaption[data-seq="${pageNum}"], .spread[data-seq="${pageNum}"] figcaption`);
      if (taggedFigcaption && taggedFigcaption.textContent && taggedFigcaption.textContent.trim().length > 0) {
        return parseHathiFigcaptionToText(taggedFigcaption);
      }
      const spreadFigcaption = document.querySelector("main#main details figure figcaption, main#main figure figcaption, main#main figcaption");
      if (spreadFigcaption && spreadFigcaption.textContent && spreadFigcaption.textContent.trim().length > 0) {
        return parseHathiFigcaptionToText(spreadFigcaption);
      }
      const lateHtml = this.seqToHtml.get(pageNum);
      if (lateHtml) {
        const text = parseHathiFigcaptionToText(lateHtml);
        if (text && text.trim().length > 0) {
          return text;
        }
      }
      await sleep(100);
    }
    return "";
  }
  isAtEndOfBook(currentPage, totalPages) {
    if (totalPages > 0 && currentPage >= totalPages) {
      return true;
    }
    const nextBtn = document.querySelector('button[aria-label*="Next" i], button[title*="Next" i], [accesskey="n"]');
    if (nextBtn) {
      const disabled = nextBtn.disabled || nextBtn.getAttribute("aria-disabled") === "true" || nextBtn.classList.contains("disabled");
      if (disabled)
        return true;
    }
    return false;
  }
  getTotalPagesFromDom() {
    const seqInput = document.querySelector('#toolbar-seq, input[name="seq"]');
    if (seqInput) {
      const parent = seqInput.parentElement;
      if (parent) {
        const text = parent.textContent || "";
        const match = text.match(/\/\s*(\d+)/);
        if (match)
          return parseInt(match[1], 10);
        const htmlMatch = parent.innerHTML.match(/\/\s*<\/span>\s*<span>\s*(\d+)/i) || parent.innerHTML.match(/\/\s*(\d+)/);
        if (htmlMatch)
          return parseInt(htmlMatch[1], 10);
      }
      const maxAttr = seqInput.getAttribute("max");
      if (maxAttr) {
        const val = parseInt(maxAttr, 10);
        if (!isNaN(val) && val > 0)
          return val;
      }
    }
    const w = window;
    if (w.manifest && w.manifest.totalSeq) {
      const val = parseInt(w.manifest.totalSeq, 10);
      if (!isNaN(val) && val > 0)
        return val;
    }
    const pagingEl = document.querySelector('.paging, [class*="paging"], [aria-label*="total pages" i]');
    if (pagingEl && pagingEl.textContent) {
      const m = pagingEl.textContent.match(/\/\s*(\d+)/) || pagingEl.textContent.match(/of\s+(\d+)/i);
      if (m)
        return parseInt(m[1], 10);
    }
    return 0;
  }
}

// src/providers/index.ts
var providers = [
  new ArchiveProvider,
  new HathiTrustProvider
];
function getActiveProvider() {
  for (const provider of providers) {
    if (provider.isMatch()) {
      return provider;
    }
  }
  return null;
}

// src/content/index.ts
(function initContentScript() {
  console.log("[ArchiveDownloader] Initialized on", window.location.href);
  const provider = getActiveProvider();
  if (!provider) {
    console.log("[ArchiveDownloader] No matching book provider for", window.location.href);
    return;
  }
  console.log(`[ArchiveDownloader] Active provider: ${provider.siteName} (${provider.siteId})`);
  let bookInfo = null;
  let isRunning = false;
  let isPaused = false;
  let stopRequested = false;
  let currentPage = provider.defaultStartPage;
  let downloadedPages = 0;
  let failedPages = 0;
  let currentRetryCount = 0;
  let lastDimensions = { width: 0, height: 0 };
  let collectedImages = [];
  let collectedTexts = [];
  let isEndOfBook = false;
  let isSiteTainted = false;
  let lastHttpError = null;
  let consecutiveErrorCount = 0;
  function onHttpErrorReceived(statusCode, url, retryAfter) {
    const isBookRelated = url.includes("imgsrv") || url.includes("BookReader") || url.includes("/cgi/pt") || url.includes("details") || url.includes("hathitrust.org") || url.includes("archive.org");
    if (!isBookRelated)
      return;
    console.warn(`[ArchiveDownloader] HTTP error ${statusCode} detected for ${url}`);
    lastHttpError = {
      statusCode,
      url,
      timestamp: Date.now(),
      retryAfter
    };
  }
  const localSavePath = localStorage.getItem("archive_downloader_save_path");
  const localFolderPattern = localStorage.getItem("archive_downloader_folder_pattern");
  const localStartPage = localStorage.getItem("archive_downloader_start_page");
  const localEndPage = localStorage.getItem("archive_downloader_end_page");
  const localMaxHeight = localStorage.getItem("archive_downloader_max_height");
  let initialStartPage = provider.defaultStartPage;
  if (localStartPage !== null) {
    const parsed = parseInt(localStartPage, 10);
    if (!isNaN(parsed) && parsed >= provider.defaultStartPage) {
      initialStartPage = parsed;
    }
  }
  const defaultConfig = {
    baseDir: localSavePath || "ArchiveBooks",
    folderPattern: localFolderPattern || "{title}_{id}",
    saveImages: false,
    generatePdf: true,
    saveTextMd: true,
    imageQuality: 0.75,
    maxPageHeight: localMaxHeight !== null ? Math.max(0, parseInt(localMaxHeight, 10)) : 0,
    pageDelayMs: 200,
    pageChangeTimeoutMs: 1e4,
    maxRetries: 10,
    autoSinglePage: true,
    startPage: initialStartPage,
    endPage: localEndPage !== null ? Math.max(0, parseInt(localEndPage, 10)) : 0,
    deleteImagesOnComplete: true
  };
  let config = { ...defaultConfig };
  function saveConfig(updated) {
    config = { ...config, ...updated };
    if (config.baseDir) {
      localStorage.setItem("archive_downloader_save_path", config.baseDir);
    }
    if (config.folderPattern) {
      localStorage.setItem("archive_downloader_folder_pattern", config.folderPattern);
    }
    if (typeof config.startPage === "number") {
      localStorage.setItem("archive_downloader_start_page", String(config.startPage));
    }
    if (typeof config.endPage === "number") {
      localStorage.setItem("archive_downloader_end_page", String(config.endPage));
    }
    if (typeof config.maxPageHeight === "number") {
      localStorage.setItem("archive_downloader_max_height", String(config.maxPageHeight));
    }
    chrome.storage.sync.set({ downloaderConfig: config });
    pill.setConfig(config);
  }
  chrome.storage.sync.get(["liberatorConfig", "downloaderConfig"], (res) => {
    const saved = res.downloaderConfig || res.liberatorConfig;
    if (saved) {
      const localPath = localStorage.getItem("archive_downloader_save_path");
      config = {
        ...defaultConfig,
        ...saved,
        ...localPath ? { baseDir: localPath } : {}
      };
      pill.setConfig(config);
    }
  });
  const pill = new FloatingPill({
    onStart: () => startDownload(),
    onPause: () => pauseDownload(),
    onResume: () => resumeDownload(),
    onStop: () => handleStopRequest(),
    onSaveSettings: (newSettings) => {
      saveConfig(newSettings);
      console.log("[ArchiveDownloader] Settings saved to localStorage:", newSettings);
      broadcastState({
        status: isRunning ? isPaused ? "paused" : "downloading" : "idle",
        statusText: "Settings saved to localStorage"
      });
    },
    onSwitchMode: () => enforceSinglePageMode(),
    onViewFile: () => {
      console.log("[ArchiveDownloader] Opening downloaded file in Finder/Explorer...");
      chrome.runtime.sendMessage({ type: "OPEN_DOWNLOAD" });
    }
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
      pill.updateProgress(bookInfo.currentLeaf ?? provider.defaultStartPage, bookInfo.totalPages, "Ready", "normal", isPaused, isRunning, bookInfo.currentMode ?? 1, lastDimensions);
      broadcastState();
    }
  }
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.direction !== "FROM_BRIDGE") {
      return;
    }
    const msg = event.data;
    if (msg.event === "HTTP_ERROR") {
      onHttpErrorReceived(msg.statusCode, msg.url, msg.retryAfter);
      return;
    }
    if (provider instanceof HathiTrustProvider) {
      if (msg.event === "PAGE_LOAD_ANNOUNCED") {
        provider.onPageLoadAnnounced(msg.seq, msg.isVisible, msg.isLoaded);
        return;
      } else if (msg.event === "PAGE_IMAGE_READY") {
        provider.onPageImageReady(msg.seq, msg.blobUrl);
        return;
      } else if (msg.event === "PAGE_TEXT_READY") {
        provider.onPageTextReady(msg.seq, msg.html);
        return;
      }
    }
    if (provider instanceof ArchiveProvider) {
      if (msg.event === "ARCHIVE_TEXT_READY") {
        provider.onArchiveTextReady(msg.page, msg.xml);
        return;
      }
    }
    if (msg.event === "BOOK_INFO") {
      bookInfo = msg.data;
      if (provider instanceof ArchiveProvider) {
        provider.setBookInfo(bookInfo);
      }
      const domCurrent = provider.getCurrentPage();
      if (domCurrent !== null && (!bookInfo.totalPages || domCurrent > (bookInfo.currentLeaf ?? 0))) {
        bookInfo.currentLeaf = domCurrent;
      }
      pill.updateProgress(bookInfo.currentLeaf ?? 0, bookInfo.totalPages, "Ready", "normal", isPaused, isRunning, bookInfo.currentMode, lastDimensions);
      broadcastState();
    } else if (msg.event === "MODE_CHANGED") {
      if (bookInfo) {
        bookInfo.currentMode = msg.mode;
        pill.updateProgress(currentPage, bookInfo.totalPages, "1-Page Mode Active", "normal", isPaused, isRunning, msg.mode, lastDimensions);
      }
    }
  });
  refreshBookInfo();
  setTimeout(() => refreshBookInfo(), 800);
  window.addEventListener("offline", () => {
    console.warn("[ArchiveDownloader] Network connection lost (offline)");
    if (isRunning && !isPaused) {
      isPaused = true;
      pill.updateProgress(currentPage, bookInfo?.totalPages || 0, "Offline - Paused", "offline", true, true, bookInfo?.currentMode || 1, lastDimensions);
      broadcastState({ status: "offline", isOffline: true });
    }
  });
  window.addEventListener("online", () => {
    console.log("[ArchiveDownloader] Network connection restored (online)");
    if (isRunning && isPaused) {
      pill.updateProgress(currentPage, bookInfo?.totalPages || 0, "Online - Click CONTINUE", "stalled", true, true, bookInfo?.currentMode || 1, lastDimensions);
      broadcastState({ status: "stalled", isOffline: false });
    }
  });
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function broadcastState(extra = {}) {
    const total = bookInfo?.totalPages || config.endPage || 1;
    let statusType = "normal";
    if (extra.status === "stalled")
      statusType = "stalled";
    else if (extra.status === "retrying")
      statusType = "retrying";
    else if (!navigator.onLine)
      statusType = "offline";
    else if (extra.status === "complete")
      statusType = "complete";
    const state = {
      status: isRunning ? isPaused ? statusType === "stalled" ? "stalled" : "paused" : "downloading" : extra.status || "idle",
      currentPage,
      totalPages: total,
      downloadedPages,
      failedPages,
      retryCount: currentRetryCount,
      statusText: isPaused ? statusType === "stalled" ? "Stalled - Click CONTINUE" : "Paused" : isRunning ? `Capturing page ${currentPage}` : "Ready",
      bookInfo: bookInfo || undefined,
      isPaused,
      isOffline: !navigator.onLine,
      imageDimensions: lastDimensions,
      ...extra
    };
    pill.updateProgress(currentPage, total, state.statusText, statusType, isPaused, isRunning, bookInfo?.currentMode || 1, lastDimensions);
    chrome.runtime.sendMessage({ type: "STATE_UPDATE", state }).catch(() => {});
  }
  async function enforceSinglePageMode() {
    if (provider.enforceSinglePageMode) {
      console.log(`[ArchiveDownloader] Enforcing single-page mode on ${provider.siteName}...`);
      return await provider.enforceSinglePageMode();
    }
    return true;
  }
  async function captureImageToDataUrl(img, quality = 0.75, maxPageHeight = 0) {
    if (isSiteTainted) {
      return await fetchCleanDataUrl(img.src, quality, maxPageHeight);
    }
    if (img.src && img.src.includes("archive.org") && !img.src.startsWith(window.location.origin)) {
      isSiteTainted = true;
      return await fetchCleanDataUrl(img.src, quality, maxPageHeight);
    }
    let width = img.naturalWidth || img.width || 0;
    let height = img.naturalHeight || img.height || 0;
    if (maxPageHeight > 0 && height > maxPageHeight) {
      const scale = maxPageHeight / height;
      width = Math.round(width * scale);
      height = maxPageHeight;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx)
        throw new Error("Could not obtain canvas 2D context");
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", quality);
    } catch (err) {
      if (err.name === "SecurityError" || String(err).includes("Tainted") || String(err).includes("SecurityError")) {
        if (!isSiteTainted) {
          isSiteTainted = true;
          console.log("[ArchiveDownloader] Cross-origin scan detected. Enabling fast background fetch for all subsequent pages.");
        }
        return await fetchCleanDataUrl(img.src, quality, maxPageHeight);
      }
      throw err;
    }
  }
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader;
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  async function scaleDataUrl(dataUrl, quality = 0.75, maxPageHeight = 0) {
    if (maxPageHeight <= 0)
      return dataUrl;
    return new Promise((resolve) => {
      const img = new Image;
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (height > maxPageHeight) {
          const scale = maxPageHeight / height;
          width = Math.round(width * scale);
          height = maxPageHeight;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx)
          return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
  async function fetchCleanDataUrl(url, quality = 0.75, maxPageHeight = 0) {
    let blob = null;
    if (!isSiteTainted) {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (e) {}
    }
    if (!blob) {
      try {
        const bgRes = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "FETCH_IMAGE_DATA_URL", url }, (response) => resolve(response || { success: false }));
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
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          return canvas.toDataURL("image/jpeg", quality);
        }
      } catch (e) {}
      return await blobToDataUrl(blob);
    }
    throw new Error(`Failed to export image from ${url}`);
  }
  async function handleHttpErrorBackoff(err, targetPageNum) {
    consecutiveErrorCount++;
    if (err.statusCode === 401 || err.statusCode === 403) {
      console.error(`[ArchiveDownloader] Access restricted (HTTP ${err.statusCode}) on ${err.url}. Pausing.`);
      isPaused = true;
      broadcastState({
        status: "paused",
        statusText: `Access restricted (HTTP ${err.statusCode}). Please check login or loan status.`
      });
      return;
    }
    const isServerRequested = typeof err.retryAfter === "number" && !isNaN(err.retryAfter) && err.retryAfter > 0;
    const baseSeconds = isServerRequested ? err.retryAfter : Math.min(10 * Math.pow(2, Math.max(0, consecutiveErrorCount - 1)), 60);
    const prevDelay = config.pageDelayMs;
    config.pageDelayMs = Math.min(Math.max(config.pageDelayMs, 1500) + 500, 5000);
    if (config.pageDelayMs !== prevDelay) {
      console.log(`[ArchiveDownloader] Increased page pacing delay to ${config.pageDelayMs}ms.`);
    }
    let label = err.statusCode === 429 ? "Rate Limited" : err.statusCode >= 500 ? `Server Error (${err.statusCode})` : `HTTP ${err.statusCode}`;
    if (isServerRequested) {
      label += " (server asked)";
    }
    console.warn(`[ArchiveDownloader] ${label} on ${err.url}. Backing off for ${Math.round(baseSeconds)}s...`);
    for (let remaining = Math.round(baseSeconds);remaining > 0; remaining--) {
      if (stopRequested)
        return;
      while (isPaused || !navigator.onLine) {
        if (stopRequested)
          return;
        await sleep(500);
      }
      const timeStr = remaining > 120 ? `${Math.round(remaining / 60)}m` : `${remaining}s`;
      broadcastState({
        status: "retrying",
        retryCount: consecutiveErrorCount,
        statusText: `${timeStr} Retrying: ${label}.`
      });
      await sleep(1000);
    }
    console.log(`[ArchiveDownloader] Backoff completed. Re-requesting page ${targetPageNum}...`);
    await provider.triggerPageFlip(targetPageNum);
    await sleep(800);
  }
  async function turnAndGetNextImage(lastSrc, targetPageNum) {
    let retryAttempt = 0;
    isEndOfBook = false;
    while (retryAttempt <= config.maxRetries) {
      if (stopRequested)
        return null;
      while (isPaused || !navigator.onLine) {
        if (stopRequested)
          return null;
        await sleep(500);
      }
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
      const alreadyTurned = domPageBefore !== null && domPageBefore >= targetPageNum;
      if (retryAttempt > 0) {
        console.log(`[ArchiveDownloader] Retry ${retryAttempt}: re-triggering flip to page ${targetPageNum}...`);
        await provider.triggerPageFlip(targetPageNum);
        if (retryAttempt >= 2 && provider.navigateToPage) {
          await provider.navigateToPage(targetPageNum);
        }
      } else if (!alreadyTurned) {
        console.log(`[ArchiveDownloader] Flipping to page ${targetPageNum} (attempt 1/${config.maxRetries + 1})...`);
        await provider.triggerPageFlip(targetPageNum);
      } else {
        console.log(`[ArchiveDownloader] DOM indicates page is already on sequence/leaf ${domPageBefore}. Waiting for image.`);
      }
      const checkStart = Date.now();
      const timeoutMs = 5000;
      let nudged = false;
      while (Date.now() - checkStart < timeoutMs) {
        if (stopRequested)
          return null;
        while (isPaused || !navigator.onLine) {
          if (stopRequested)
            return null;
          await sleep(500);
        }
        if (lastHttpError && Date.now() - lastHttpError.timestamp < 1e4) {
          const err = lastHttpError;
          lastHttpError = null;
          console.warn(`[ArchiveDownloader] Page ${targetPageNum} load rejected due to HTTP ${err.statusCode} on ${err.url}`);
          await handleHttpErrorBackoff(err, targetPageNum);
          break;
        }
        if (!nudged && Date.now() - checkStart > 1000) {
          nudged = true;
          console.log(`[ArchiveDownloader] Image not yet confirmed after 1.0s. Nudging flip/jump to page ${targetPageNum}...`);
          await provider.triggerPageFlip(targetPageNum);
          if (provider.navigateToPage) {
            await provider.navigateToPage(targetPageNum);
          }
        }
        await sleep(50);
        const activeImg = provider.getActivePageImage(200, targetPageNum);
        if (activeImg && activeImg.complete && (activeImg.naturalWidth >= 200 || activeImg.width >= 200) && activeImg.src) {
          if (lastHttpError && Date.now() - lastHttpError.timestamp < 3000) {
            continue;
          }
          const isNewSrc = !lastSrc || activeImg.src !== lastSrc;
          if (isNewSrc) {
            currentRetryCount = 0;
            consecutiveErrorCount = 0;
            activeImg.dataset.seq = String(targetPageNum);
            const domNow = provider.getCurrentPage();
            const leafInfo = domNow !== null ? ` [DOM page ${domNow}]` : "";
            console.log(`[ArchiveDownloader] Page ${targetPageNum} image loaded${leafInfo} (${activeImg.naturalWidth}x${activeImg.naturalHeight}px)!`);
            return activeImg;
          }
        }
      }
      retryAttempt++;
      currentRetryCount = retryAttempt;
      console.warn(`[ArchiveDownloader] Page did NOT change after flip attempt ${retryAttempt} for page ${targetPageNum}. Retrying...`);
      broadcastState({
        status: "retrying",
        retryCount: retryAttempt,
        statusText: `Retrying page turn (${retryAttempt}/${config.maxRetries})...`
      });
      const backoffSec = Math.min(retryAttempt, 5);
      await sleep(backoffSec * 1000);
    }
    console.error(`[ArchiveDownloader] Failed to flip to page ${targetPageNum} after ${config.maxRetries} attempts.`);
    return null;
  }
  async function startDownload(userConfig) {
    if (isRunning && !isPaused)
      return;
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
    await refreshBookInfo();
    const totalPages = bookInfo?.totalPages || config.endPage || 500;
    const startP = typeof config.startPage === "number" ? Math.max(provider.defaultStartPage, config.startPage) : provider.defaultStartPage;
    const maxBookPage = provider.siteId === "archive" && provider.defaultStartPage === 0 ? Math.max(0, totalPages - 1) : totalPages;
    const endP = config.endPage > 0 ? config.endPage : maxBookPage;
    const bookTitle = bookInfo?.bookTitle || `${provider.siteName} Book`;
    const bookId = bookInfo?.bookId || "book";
    const subDir = formatSubdir(config.baseDir, config.folderPattern, bookTitle, bookId);
    console.log(`[ArchiveDownloader] Starting download: pages ${startP} to ${endP} into '${subDir}'`);
    if (config.autoSinglePage && provider.enforceSinglePageMode) {
      broadcastState({ status: "ensuring_mode", statusText: "Switching to 1-page mode..." });
      await enforceSinglePageMode();
      await sleep(600);
    }
    broadcastState({
      status: "downloading",
      currentPage: startP,
      statusText: `Navigating to page ${startP}...`
    });
    console.log(`[ArchiveDownloader] Navigating to starting page/leaf ${startP}...`);
    await provider.navigateToPage(startP);
    await sleep(1200);
    let lastImgSrc = "";
    let currentImg = null;
    for (let pageNum = startP;pageNum <= endP; pageNum++) {
      if (stopRequested)
        break;
      currentPage = pageNum;
      broadcastState({
        status: "downloading",
        currentPage,
        statusText: `Capturing page ${pageNum}`
      });
      if (!currentImg) {
        const waitImageStart = Date.now();
        while (Date.now() - waitImageStart < 15000) {
          if (stopRequested)
            break;
          while (isPaused || !navigator.onLine) {
            if (stopRequested)
              break;
            await sleep(500);
          }
          currentImg = provider.getActivePageImage(200, pageNum);
          if (currentImg)
            break;
          await sleep(100);
        }
      }
      if (!currentImg) {
        console.warn(`[ArchiveDownloader] Page ${pageNum} image timed out.`);
        failedPages++;
      } else {
        const pageToProcess = pageNum;
        const pageImg = currentImg;
        const pageImgSrc = currentImg.src;
        lastImgSrc = pageImgSrc;
        let pageW = pageImg.naturalWidth || pageImg.width || 0;
        let pageH = pageImg.naturalHeight || pageImg.height || 0;
        if (config.maxPageHeight && config.maxPageHeight > 0 && pageH > config.maxPageHeight) {
          pageW = Math.round(pageW * (config.maxPageHeight / pageH));
          pageH = config.maxPageHeight;
        }
        const dimensions = { width: pageW, height: pageH };
        lastDimensions = dimensions;
        const nextTurnPromise = pageNum < endP && !stopRequested ? turnAndGetNextImage(pageImgSrc, pageNum + 1) : null;
        const capturePromise = (async () => {
          try {
            const [dataUrl, text] = await Promise.all([
              captureImageToDataUrl(pageImg, config.imageQuality, config.maxPageHeight),
              config.saveTextMd ? (async () => {
                try {
                  let t = await provider.extractPageText(pageToProcess, pageImg);
                  if (lastHttpError && Date.now() - lastHttpError.timestamp < 3000) {
                    const err = lastHttpError;
                    lastHttpError = null;
                    console.warn(`[ArchiveDownloader] OCR text fetch for page ${pageToProcess} encountered HTTP ${err.statusCode}`);
                    await handleHttpErrorBackoff(err, pageToProcess);
                    t = await provider.extractPageText(pageToProcess, pageImg);
                  }
                  return t;
                } catch (err) {
                  console.warn(`[ArchiveDownloader] Could not extract text for page ${pageToProcess}:`, err);
                  return "";
                }
              })() : Promise.resolve("")
            ]);
            if (config.generatePdf) {
              const existingIdx = collectedImages.findIndex((i) => i.pageNum === pageToProcess);
              if (existingIdx >= 0) {
                collectedImages[existingIdx] = {
                  pageNum: pageToProcess,
                  data: dataUrl,
                  width: pageW,
                  height: pageH
                };
              } else {
                collectedImages.push({
                  pageNum: pageToProcess,
                  data: dataUrl,
                  width: pageW,
                  height: pageH
                });
              }
            }
            downloadedPages = collectedImages.length;
            if (config.saveImages) {
              chrome.runtime.sendMessage({
                type: "DOWNLOAD_PAGE_IMAGE",
                bookTitle,
                pageNum: pageToProcess,
                totalPages: endP,
                dataUrl,
                subDir
              });
            }
            if (config.saveTextMd && text) {
              const existingTextIdx = collectedTexts.findIndex((t) => t.pageNum === pageToProcess);
              if (existingTextIdx >= 0) {
                collectedTexts[existingTextIdx] = { pageNum: pageToProcess, leafIndex: pageToProcess, text };
              } else {
                collectedTexts.push({ pageNum: pageToProcess, leafIndex: pageToProcess, text });
              }
            }
            broadcastState({
              currentPage: pageToProcess,
              downloadedPages,
              currentThumbnail: dataUrl,
              statusText: `Capturing page ${pageToProcess}`,
              imageDimensions: dimensions
            });
          } catch (err) {
            failedPages++;
            console.error(`[ArchiveDownloader] Error processing page ${pageToProcess}:`, err);
          }
        })();
        await capturePromise;
        if (nextTurnPromise) {
          const nextImg = await nextTurnPromise;
          if (!nextImg) {
            if (isEndOfBook) {
              console.log(`[ArchiveDownloader] Reached end of book at page ${pageNum}. Finalizing.`);
              break;
            }
            console.warn(`[ArchiveDownloader] Could not turn past page ${pageNum}. Prompting user to save.`);
            const count = collectedImages.length || downloadedPages;
            if (count > 0) {
              await handleStopRequest(`Cannot continue past page ${pageNum}. Save all ${count} pages downloaded so far?`);
            }
            break;
          }
          currentImg = nextImg;
          if (provider.siteId !== "hathitrust") {
            const domPageNow = provider.getCurrentPage();
            if (domPageNow !== null && domPageNow > pageNum) {
              pageNum = domPageNow - 1;
            }
          }
        }
      }
    }
    if (!stopRequested && downloadedPages > 0) {
      await finalizeBook(subDir, bookTitle);
    }
    isRunning = false;
    broadcastState({
      status: stopRequested ? "idle" : "complete",
      statusText: stopRequested ? "Stopped by user" : `Completed! Saved ${downloadedPages} pages.`
    });
  }
  async function finalizeBook(subDir, bookTitle) {
    if (config.generatePdf && collectedImages.length > 0) {
      broadcastState({ status: "compiling_pdf", statusText: "Compiling PDF document..." });
      console.log("[ArchiveDownloader] Assembling PDF from", collectedImages.length, "pages...");
      try {
        const pdfBytes = compileJpegsToPdf(collectedImages, {
          title: bookTitle,
          author: bookInfo?.author || provider.siteName,
          creator: "Archive Downloader"
        });
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        chrome.runtime.sendMessage({
          type: "SAVE_FINAL_FILES",
          bookTitle,
          subDir,
          pdfBlobUrl
        });
        console.log("[ArchiveDownloader] PDF compiled and sent for download!");
      } catch (err) {
        console.error("[ArchiveDownloader] Failed to compile PDF:", err);
      }
    }
    if (config.saveTextMd) {
      broadcastState({ status: "saving_text", statusText: "Saving Markdown text..." });
      console.log("[ArchiveDownloader] Assembling Markdown from", collectedTexts.length, "page texts...");
      const mdContent = buildBookMarkdown({
        title: bookTitle,
        bookId: bookInfo?.bookId || "book",
        author: bookInfo?.author,
        publisher: bookInfo?.publisher,
        year: bookInfo?.year,
        sourceUrl: window.location.href,
        totalPages: bookInfo?.totalPages || currentPage
      }, collectedTexts);
      chrome.runtime.sendMessage({
        type: "SAVE_FINAL_FILES",
        bookTitle,
        subDir,
        markdownContent: mdContent
      });
      console.log("[ArchiveDownloader] Markdown generated and sent for download!");
    }
  }
  function pauseDownload() {
    isPaused = true;
    broadcastState({ status: "paused", statusText: "Download paused" });
  }
  function resumeDownload() {
    isPaused = false;
    broadcastState({ status: "downloading", statusText: `Resuming page ${currentPage}...` });
  }
  async function savePartialAndComplete(count) {
    stopRequested = true;
    isPaused = false;
    broadcastState({
      status: "compiling_pdf",
      statusText: `Saving ${count} captured pages...`
    });
    const bookTitle = bookInfo?.bookTitle || `${provider.siteName} Book`;
    const bookId = bookInfo?.bookId || "book";
    const subDir = formatSubdir(config.baseDir, config.folderPattern, bookTitle, bookId);
    await finalizeBook(subDir, bookTitle);
    isRunning = false;
    broadcastState({
      status: "complete",
      downloadedPages: count,
      statusText: `Completed! Saved ${count} pages.`
    });
  }
  async function handleStopRequest(customMessage) {
    if (!isRunning) {
      stopDownload();
      return;
    }
    const count = collectedImages.length || downloadedPages;
    if (count > 0) {
      isPaused = true;
      broadcastState({
        status: "paused",
        statusText: customMessage || `Paused: Save ${count} pages?`
      });
      pill.showStopPrompt(count, async () => {
        console.log(`[ArchiveDownloader] User confirmed saving ${count} pages.`);
        await savePartialAndComplete(count);
      }, () => {
        console.log("[ArchiveDownloader] User discarded downloads on stop.");
        stopDownload();
      }, () => {
        console.log("[ArchiveDownloader] Resuming download...");
        resumeDownload();
      }, customMessage);
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
    broadcastState({ status: "idle", statusText: "Download stopped" });
  }
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case "GET_STATE": {
        broadcastState();
        sendResponse({ success: true, bookInfo });
        break;
      }
      case "START_DOWNLOAD": {
        startDownload(message.config);
        sendResponse({ success: true });
        break;
      }
      case "PAUSE_DOWNLOAD": {
        pauseDownload();
        sendResponse({ success: true });
        break;
      }
      case "RESUME_DOWNLOAD": {
        resumeDownload();
        sendResponse({ success: true });
        break;
      }
      case "STOP_AND_SAVE": {
        const count = collectedImages.length || downloadedPages;
        if (isRunning && count > 0) {
          savePartialAndComplete(count);
        } else {
          stopDownload();
        }
        sendResponse({ success: true });
        break;
      }
      case "STOP_DOWNLOAD": {
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
      case "SWITCH_TO_SINGLE_PAGE": {
        enforceSinglePageMode();
        sendResponse({ success: true });
        break;
      }
      case "SAVE_CONFIG": {
        saveConfig(message.config);
        sendResponse({ success: true, config });
        break;
      }
      case "GET_CONFIG": {
        sendResponse({ success: true, config });
        break;
      }
      case "HTTP_ERROR_DETECTED": {
        onHttpErrorReceived(message.statusCode, message.url, message.retryAfter);
        sendResponse({ success: true });
        break;
      }
    }
    return true;
  });
})();

//# debugId=7283B6FA29A410A364756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvcGlsbC50cyIsICIuLi9zcmMvdXRpbHMvbWFya2Rvd24tYnVpbGRlci50cyIsICIuLi9zcmMvdXRpbHMvcGRmLWJ1aWxkZXIudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0aXplci50cyIsICIuLi9zcmMvcHJvdmlkZXJzL2FyY2hpdmUtcHJvdmlkZXIudHMiLCAiLi4vc3JjL3Byb3ZpZGVycy9oYXRoaXRydXN0LXByb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcm92aWRlcnMvaW5kZXgudHMiLCAiLi4vc3JjL2NvbnRlbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiLyoqXG4gKiBGbG9hdGluZyBQcm9ncmVzcyBQaWxsIE92ZXJsYXkgZm9yIEFyY2hpdmUub3JnXG4gKiBPTkxZIGFwcGVhcnMgb24gaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLypcbiAqXG4gKiBGZWF0dXJlczpcbiAqIC0gQ29nIGljb24gYnV0dG9uICjimpkpIHRvIG9wZW4gZXhwYW5kYWJsZSBpbi1wYWdlIFNldHRpbmdzIHRyYXlcbiAqIC0gU2V0dGluZ3MgKHNhdmUgcGF0aCwgZm9sZGVyIHBhdHRlcm4sIHN0YXJ0L2VuZCBwYWdlcykgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlXG4gKiAtIFNxdWFyZSwgZnVsbC1oZWlnaHQgYnV0dG9ucyB3aXRoIG5vIGN1cnZhdHVyZSAoanVzdCBsaW5lIG91dGxpbmUpXG4gKiAtIFvinJVdIGJ1dHRvbiB0aGF0IHNocmlua3MgcGlsbCB0byBhIHNtYWxsIGRvY2tlZCBib29rIGljb24gb24gdGhlIGZhciBsZWZ0IGVkZ2Ugb2YgdGhlIHNjcmVlblxuICogLSBDbGlja2luZyB0aGUgZG9ja2VkIGJvb2sgaWNvbiByZXN0b3JlcyB0aGUgcGlsbFxuICogLSBJbWFnZSBkaW1lbnNpb25zIGluIHNtYWxsIGdyZXkgbGV0dGVycyBiZWxvdyBzdGF0dXM6XG4gKiAgIFwiQ2FwdHVyaW5nIHBhZ2UgMTRcIlxuICogICBcIihpbWFnZTogMjU4MCB4IDM5MTUpXCJcbiAqIC0gW0NPTlRJTlVFXSBidXR0b24gd2hlbiBzdGFsbGVkIG9yIGNvbm5lY3Rpb24gZHJvcHNcbiAqIC0gSW50ZXJhY3RpdmUgU3RvcCBjb25maXJtYXRpb24gcHJvbXB0IHRvIHNhdmUgY2FwdHVyZWQgcGFnZXMgc28gZmFyXG4gKiAtIFwiRG93bmxvYWRlZDogVmlldyBGaWxlc1wiIGJ1dHRvbiBvbiBjb21wbGV0aW9uIHRoYXQgb3BlbnMgdGhlIGRvd25sb2FkZWQgZmlsZS9mb2xkZXJcbiAqL1xuXG5pbXBvcnQgeyBEb3dubG9hZGVyQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpbGxDYWxsYmFja3Mge1xuICBvblN0YXJ0PzogKCkgPT4gdm9pZDtcbiAgb25QYXVzZT86ICgpID0+IHZvaWQ7XG4gIG9uUmVzdW1lPzogKCkgPT4gdm9pZDtcbiAgb25TdG9wPzogKCkgPT4gdm9pZDtcbiAgb25TYXZlU2V0dGluZ3M/OiAoc2V0dGluZ3M6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pID0+IHZvaWQ7XG4gIG9uU3dpdGNoTW9kZT86ICgpID0+IHZvaWQ7XG4gIG9uVmlld0ZpbGU/OiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgRmxvYXRpbmdQaWxsIHtcbiAgcHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNEb2NrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc1NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzQ29uZmlybWluZ1N0b3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFBpbGxDYWxsYmFja3MgPSB7fTtcbiAgcHJpdmF0ZSBjdXJyZW50Q29uZmlnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+ID0ge307XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzOiBQaWxsQ2FsbGJhY2tzID0ge30pIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgfVxuXG4gIHB1YmxpYyBzaG91bGRSZW5kZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNBcmNoaXZlID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluY2x1ZGVzKCcvZGV0YWlscy8nKTtcbiAgICBjb25zdCBpc0JhYmVsID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnYmFiZWwuaGF0aGl0cnVzdC5vcmcnIHx8XG4gICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzQXJjaGl2ZSB8fCBpc0JhYmVsO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkUmVuZGVyKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwaWxsLmlkID0gJ2FyY2hpdmUtZG93bmxvYWRlci1waWxsJztcbiAgICBwaWxsLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgI2FyY2hpdmUtZG93bmxvYWRlci1waWxsIHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiAxNHB4O1xuICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE4LCAxOCwgMTgsIDAuOTYpO1xuICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICAtd2Via2l0LWJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgOHB4IDMycHggcmdiYSgwLCAwLCAwLCAwLjY1KTtcbiAgICAgICAgICBjb2xvcjogI2YxZjFmMTtcbiAgICAgICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBlYXNlLCBvcGFjaXR5IDAuMjVzIGVhc2U7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgbWF4LXdpZHRoOiA5NXZ3O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBEb2NrZWQgdG8gZmFyIGxlZnQgb2Ygd2luZG93ICovXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCB7XG4gICAgICAgICAgbGVmdDogMCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRvcDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRyYW5zZm9ybTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIGJvcmRlci1sZWZ0OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMCA2cHggNnB4IDAgIWltcG9ydGFudDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICBib3gtc2hhZG93OiAycHggNHB4IDE2cHggcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtbWFpbi1ib2R5LFxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtc2V0dGluZ3MtcGFuZWwge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgfVxuXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCAucGlsbC1kb2NrLWljb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIGltZyB7XG4gICAgICAgICAgd2lkdGg6IDI0cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLW1haW4tYm9keSB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDQ4cHg7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBDb2cgc2V0dGluZ3MgYnV0dG9uIHJlcGxhY2luZyB0aGUgc3RhdGljIGxvZ28gKi9cbiAgICAgICAgLnBpbGwtY29nLWJ0biB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTNweDtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMsIGNvbG9yIDAuMTVzLCB0cmFuc2Zvcm0gMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtY29nLWJ0bi5hY3RpdmUge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcbiAgICAgICAgICBjb2xvcjogIzNlYTZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZ1bGwgaGVpZ2h0IGJ1dHRvbnMgd2l0aCBOTyBjdXJ2YXR1cmUgKGJvcmRlci1yYWRpdXM6IDApLCBvdXRsaW5lZCBvbmx5ICovXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4ge1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgcGFkZGluZzogMCAxNHB4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA2cHg7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1wcmltYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzI5ODllNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWNvbnRpbnVlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjU5ZTBiO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1jb250aW51ZTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Q5NzcwNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLXZpZXctZmlsZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzEwYjk4MTtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tdmlldy1maWxlOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMDU5NjY5O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tZGFuZ2VyIHtcbiAgICAgICAgICBjb2xvcjogI2Y4NzE3MTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWRhbmdlcjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNDgsIDExMywgMTEzLCAwLjIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tbW9kZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y1OWUwYjtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAqL1xuICAgICAgICAucGlsbC1jb25maXJtLWJhciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNSwgMjUsIDI1LCAwLjk4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvbmZpcm0tdGV4dCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGNvbG9yOiAjZjU5ZTBiO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdGF0dXMgJiBJbWFnZSBEaW1lbnNpb25zIFNlY3Rpb24gKi9cbiAgICAgICAgLnBpbGwtc3RhdHVzLXNlY3Rpb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgbWluLXdpZHRoOiAxNzBweDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTgpO1xuICAgICAgICAgIGdhcDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBtYXgtd2lkdGg6IDIyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQud2FybmluZyB7XG4gICAgICAgICAgY29sb3I6ICNmNTllMGI7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5lcnJvciB7XG4gICAgICAgICAgY29sb3I6ICNlZjQ0NDQ7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5jb21wbGV0ZSB7XG4gICAgICAgICAgY29sb3I6ICMxMGI5ODE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTbWFsbCBncmV5IGltYWdlIGRpbWVuc2lvbnMgKi9cbiAgICAgICAgLnBpbGwtZGltZW5zaW9ucy10ZXh0IHtcbiAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgY29sb3I6ICM4ODg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtcHJvZ3Jlc3MtdHJhY2sge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogM3B4O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1wcm9ncmVzcy1maWxsIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgd2lkdGg6IDAlO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMzZWE2ZmY7XG4gICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmlnaHQgU2lkZSBDb3VudGVyICgwLzUxNSBwYWdlcykgKi9cbiAgICAgICAgLnBpbGwtY291bnRlci1ib3gge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogW3hdIENsb3NlL1NocmluayBCdXR0b24gKi9cbiAgICAgICAgLnBpbGwtY2xvc2UtYnRuIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGNvbG9yOiAjODg4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNsb3NlLWJ0bjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5ICovXG4gICAgICAgIC5waWxsLXNldHRpbmdzLXBhbmVsIHtcbiAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE0LCAxNCwgMTQsIDAuOTgpO1xuICAgICAgICAgIHBhZGRpbmc6IDEycHggMTZweDtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmdzLWhlYWRlciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIHBhZGRpbmctYm90dG9tOiA2cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy10aXRsZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xuICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludC5zaG93IHtcbiAgICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3MtZ3JpZCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cgbGFiZWwge1xuICAgICAgICAgIGNvbG9yOiAjYWFhO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLXJvdy1oYWxmIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgICAgICAgIGdhcDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctcm93LWhhbGYgPiBkaXYge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctaW5wdXQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyNDI0MjQ7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBwYWRkaW5nOiA1cHggOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAwLjE1cztcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIG1heC13aWR0aDogMjYwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWlucHV0OmZvY3VzIHtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICMzZWE2ZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy1mb290ZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWJ0biB7XG4gICAgICAgICAgcGFkZGluZzogNXB4IDEycHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNjY2M7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMTVzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctYnRuLmJ0bi1zYXZlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG4uYnRuLXNhdmU6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyOTg5ZTY7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG5cbiAgICAgIDwhLS0gRG9ja2VkIFNtYWxsIEljb24gKFZpc2libGUgd2hlbiBtaW5pbWl6ZWQgdG8gZmFyIGxlZnQpIC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtZG9jay1pY29uXCIgaWQ9XCJwaWxsRG9ja0ljb25cIiB0aXRsZT1cIk9wZW4gQXJjaGl2ZSBEb3dubG9hZGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPVwiJHtjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ljb25zL2ljb240OC5wbmcnKX1cIiBhbHQ9XCJBcmNoaXZlIERvd25sb2FkZXJcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gTWFpbiBCb2R5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtbWFpbi1ib2R5XCI+XG4gICAgICAgIDwhLS0gQ29nIHNldHRpbmdzIGJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtY29nLWJ0blwiIGlkPVwicGlsbENvZ0J0blwiIHRpdGxlPVwiRWRpdCBTZXR0aW5ncyAoU2F2ZSBwYXRoLCBwYXR0ZXJuLCBwYWdlcylcIj7impk8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtY29uZmlybS1iYXJcIiBpZD1cInBpbGxDb25maXJtQmFyXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGlsbC1jb25maXJtLXRleHRcIiBpZD1cInBpbGxDb25maXJtVGV4dFwiPlNhdmUgY2FwdHVyZWQgcGFnZXM/PC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXZpZXctZmlsZVwiIGlkPVwicGlsbENvbmZpcm1TYXZlQnRuXCI+4pyUIFllcywgU2F2ZSBGaWxlczwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLWRhbmdlclwiIGlkPVwicGlsbENvbmZpcm1EaXNjYXJkQnRuXCI+RGlzY2FyZDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxDb25maXJtQ2FuY2VsQnRuXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gU3RhcnQgRG93bmxvYWQgQnV0dG9uIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1wcmltYXJ5XCIgaWQ9XCJwaWxsU3RhcnRCdG5cIj5cbiAgICAgICAgICDilrYgU3RhcnQgRG93bmxvYWRcbiAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgPCEtLSBDb250aW51ZSBCdXR0b24gKHdoZW4gc3RhbGxlZCAvIG9mZmxpbmUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1jb250aW51ZVwiIGlkPVwicGlsbENvbnRpbnVlQnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIOKWtiBDT05USU5VRVxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIFZpZXcgRmlsZSBCdXR0b24gKHdoZW4gY29tcGxldGUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi12aWV3LWZpbGVcIiBpZD1cInBpbGxWaWV3RmlsZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinJQgVmlldyBGaWxlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gRHluYW1pYyBDb250cm9scyAoYWN0aXZlIGR1cmluZyBkb3dubG9hZCkgLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxQYXVzZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinZrinZogUGF1c2VcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXByaW1hcnlcIiBpZD1cInBpbGxSZXN1bWVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAg4pa2IFJlc3VtZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tZGFuZ2VyXCIgaWQ9XCJwaWxsU3RvcEJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDil7wgU3RvcFxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIDEtUGFnZSBNb2RlIEJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tbW9kZVwiIGlkPVwicGlsbE1vZGVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgdGl0bGU9XCJTd2l0Y2ggdG8gMS1QYWdlIFZpZXdcIj5cbiAgICAgICAgICDimqEgMS1QYWdlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gU3RhdHVzICYgSW1hZ2UgRGltZW5zaW9ucyAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc3RhdHVzLXNlY3Rpb25cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc3RhdHVzLXRleHRcIiBpZD1cInBpbGxTdGF0dXNUZXh0XCI+UmVhZHk8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJwaWxsLWRpbWVuc2lvbnMtdGV4dFwiIGlkPVwicGlsbERpbWVuc2lvbnNUZXh0XCI+KGltYWdlOiAtIHggLSk8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtcHJvZ3Jlc3MtdHJhY2tcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXByb2dyZXNzLWZpbGxcIiBpZD1cInBpbGxQcm9ncmVzc0ZpbGxcIj48L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBSaWdodCBTaWRlIENvdW50ZXI6IDAvNTE1IHBhZ2VzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1jb3VudGVyLWJveFwiIGlkPVwicGlsbENvdW50ZXJcIj5cbiAgICAgICAgICAwLzAgcGFnZXNcbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBbeF0gU2hyaW5rIHRvIExlZnQgU2lkZSBCdXR0b24gLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWNsb3NlLWJ0blwiIGlkPVwicGlsbENsb3NlQnRuXCIgdGl0bGU9XCJTaHJpbmsgdG8gbGVmdCBlZGdlIG9mIHNjcmVlblwiPuKclTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtcGFuZWxcIiBpZD1cInBpbGxTZXR0aW5nc1BhbmVsXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtdGl0bGVcIj7impkgRG93bmxvYWRlciBTZXR0aW5nczwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludFwiIGlkPVwicGlsbFNldHRpbmdzU2F2ZWRIaW50XCI+U2F2ZWQgdG8gbG9jYWxTdG9yYWdlPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtZ3JpZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXNldHRpbmctcm93XCI+XG4gICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdTYXZlUGF0aFwiPlNhdmUgU3ViZGlyZWN0b3J5OjwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInBpbGxTZXR0aW5nU2F2ZVBhdGhcIiBjbGFzcz1cInBpbGwtc2V0dGluZy1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiQXJjaGl2ZUJvb2tzXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvd1wiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInBpbGxTZXR0aW5nUGF0dGVyblwiPkZvbGRlciBQYXR0ZXJuOjwvbGFiZWw+XG4gICAgICAgICAgICA8c2VsZWN0IGlkPVwicGlsbFNldHRpbmdQYXR0ZXJuXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInt0aXRsZX1fe2lkfVwiPnt0aXRsZX1fe2lkfTwvb3B0aW9uPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwie3RpdGxlfVwiPnt0aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIntpZH1cIj57aWR9PC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvdyBwaWxsLXNldHRpbmctcm93LWhhbGZcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ1N0YXJ0UGFnZVwiPlN0YXJ0IFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nU3RhcnRQYWdlXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgdmFsdWU9XCIwXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdFbmRQYWdlXCI+RW5kIFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nRW5kUGFnZVwiIGNsYXNzPVwicGlsbC1zZXR0aW5nLWlucHV0XCIgbWluPVwiMFwiIHBsYWNlaG9sZGVyPVwiQWxsXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZy1yb3dcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ01heEhlaWdodFwiPk1heCBQYWdlIEhlaWdodDo8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nTWF4SGVpZ2h0XCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgc3RlcD1cIjUwXCIgcGxhY2Vob2xkZXI9XCJlLmcuIDEwMDAgKDAgPSBmdWxsKVwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1mb290ZXJcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1zZXR0aW5nLWJ0biBidG4tc2F2ZVwiIGlkPVwicGlsbFNldHRpbmdTYXZlQnRuXCI+8J+SviBTYXZlIFNldHRpbmdzPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtc2V0dGluZy1idG4gYnRuLWNsb3NlXCIgaWQ9XCJwaWxsU2V0dGluZ0Nsb3NlQnRuXCI+Q2xvc2U8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwaWxsKTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHBpbGw7XG5cbiAgICAvLyBBdHRhY2ggY2FsbGJhY2tzXG4gICAgY29uc3Qgc3RhcnRCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RhcnRCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzdGFydEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0YXJ0Py4oKSk7XG5cbiAgICBjb25zdCBjb250aW51ZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnRpbnVlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uUmVzdW1lPy4oKSk7XG5cbiAgICBjb25zdCB2aWV3RmlsZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHZpZXdGaWxlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uVmlld0ZpbGU/LigpKTtcblxuICAgIGNvbnN0IHBhdXNlQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFBhdXNlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcGF1c2VCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25QYXVzZT8uKCkpO1xuXG4gICAgY29uc3QgcmVzdW1lQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFJlc3VtZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHJlc3VtZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblJlc3VtZT8uKCkpO1xuXG4gICAgY29uc3Qgc3RvcEJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTdG9wQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgc3RvcEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0b3A/LigpKTtcblxuICAgIGNvbnN0IG1vZGVCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsTW9kZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIG1vZGVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25Td2l0Y2hNb2RlPy4oKSk7XG5cbiAgICAvLyBDb2cgYnV0dG9uIHRvIHRvZ2dsZSBzZXR0aW5ncyB0cmF5XG4gICAgY29uc3QgY29nQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvZ0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKCkpO1xuXG4gICAgLy8gU2F2ZSBTZXR0aW5ncyBidXR0b25cbiAgICBjb25zdCBzYXZlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1NhdmVCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzYXZlU2V0dGluZ3NCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZVBhdGhJbnB1dCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU2F2ZVBhdGgnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nUGF0dGVybicpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgY29uc3Qgc3RhcnRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1N0YXJ0UGFnZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0VuZFBhZ2UnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgbWF4SGVpZ2h0SW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICAgIGNvbnN0IGJhc2VEaXIgPSBzYXZlUGF0aElucHV0Py52YWx1ZS50cmltKCkgfHwgJ0FyY2hpdmVCb29rcyc7XG4gICAgICBjb25zdCBmb2xkZXJQYXR0ZXJuID0gcGF0dGVyblNlbGVjdD8udmFsdWUgfHwgJ3t0aXRsZX1fe2lkfSc7XG4gICAgICBjb25zdCBzdGFydFBhZ2UgPSBzdGFydFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoc3RhcnRQYWdlSW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuICAgICAgY29uc3QgZW5kUGFnZSA9IGVuZFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoZW5kUGFnZUlucHV0LnZhbHVlLCAxMCkpIDogMDtcbiAgICAgIGNvbnN0IG1heFBhZ2VIZWlnaHQgPSBtYXhIZWlnaHRJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobWF4SGVpZ2h0SW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblNhdmVTZXR0aW5ncz8uKHtcbiAgICAgICAgYmFzZURpcixcbiAgICAgICAgZm9sZGVyUGF0dGVybixcbiAgICAgICAgc3RhcnRQYWdlLFxuICAgICAgICBlbmRQYWdlLFxuICAgICAgICBtYXhQYWdlSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGhpbnQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ3NTYXZlZEhpbnQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmIChoaW50KSB7XG4gICAgICAgIGhpbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGhpbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpLCAyNTAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3NlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0Nsb3NlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY2xvc2VTZXR0aW5nc0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKSk7XG5cbiAgICAvLyBbeF0gY2xvc2UvZG9jayBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDbG9zZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNsb3NlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuZG9ja1RvTGVmdCgpKTtcblxuICAgIC8vIERvY2tlZCBpY29uIGNsaWNrIHRvIGV4cGFuZFxuICAgIGNvbnN0IGRvY2tJY29uID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbERvY2tJY29uJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgZG9ja0ljb24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy51bmRvY2tGcm9tTGVmdCgpKTtcblxuICAgIC8vIFBvcHVsYXRlIGluaXRpYWwgaW5wdXRzIGlmIGNvbmZpZyBleGlzdHNcbiAgICB0aGlzLnNldENvbmZpZyh0aGlzLmN1cnJlbnRDb25maWcpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZVNldHRpbmdzKG9wZW4/OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMuaXNTZXR0aW5nc09wZW4gPSB0eXBlb2Ygb3BlbiA9PT0gJ2Jvb2xlYW4nID8gb3BlbiA6ICF0aGlzLmlzU2V0dGluZ3NPcGVuO1xuXG4gICAgY29uc3QgcGFuZWwgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdzUGFuZWwnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb2dCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBhbmVsKSB7XG4gICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gdGhpcy5pc1NldHRpbmdzT3BlbiA/ICdmbGV4JyA6ICdub25lJztcbiAgICB9XG4gICAgaWYgKGNvZ0J0bikge1xuICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc09wZW4pIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRDb25maWcoY2ZnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50Q29uZmlnID0geyAuLi50aGlzLmN1cnJlbnRDb25maWcsIC4uLmNmZyB9O1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHNhdmVQYXRoSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdTYXZlUGF0aCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKHNhdmVQYXRoSW5wdXQgJiYgY2ZnLmJhc2VEaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2F2ZVBhdGhJbnB1dC52YWx1ZSA9IGNmZy5iYXNlRGlyO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdHRlcm5TZWxlY3QgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdQYXR0ZXJuJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgaWYgKHBhdHRlcm5TZWxlY3QgJiYgY2ZnLmZvbGRlclBhdHRlcm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IGNmZy5mb2xkZXJQYXR0ZXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0UGFnZUlucHV0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU3RhcnRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoc3RhcnRQYWdlSW5wdXQgJiYgY2ZnLnN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdGFydFBhZ2VJbnB1dC52YWx1ZSA9IFN0cmluZyhjZmcuc3RhcnRQYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdFbmRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoZW5kUGFnZUlucHV0ICYmIGNmZy5lbmRQYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZFBhZ2VJbnB1dC52YWx1ZSA9IGNmZy5lbmRQYWdlID4gMCA/IFN0cmluZyhjZmcuZW5kUGFnZSkgOiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBtYXhIZWlnaHRJbnB1dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKG1heEhlaWdodElucHV0ICYmIGNmZy5tYXhQYWdlSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1heEhlaWdodElucHV0LnZhbHVlID0gY2ZnLm1heFBhZ2VIZWlnaHQgPiAwID8gU3RyaW5nKGNmZy5tYXhQYWdlSGVpZ2h0KSA6ICcnO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzaG93U3RvcFByb21wdChcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG9uU2F2ZTogKCkgPT4gdm9pZCxcbiAgICBvbkRpc2NhcmQ6ICgpID0+IHZvaWQsXG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgY3VzdG9tTWVzc2FnZT86IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gdHJ1ZTtcblxuICAgIGNvbnN0IGNvbmZpcm1CYXIgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb25maXJtVGV4dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ29uZmlybVRleHQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBzYXZlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtU2F2ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnN0IGRpc2NhcmRCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1EaXNjYXJkQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtQ2FuY2VsQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIG5vcm1hbCBidXR0b25zIGFuZCBzdGF0dXMgd2hpbGUgY29uZmlybWluZ1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUoZmFsc2UpO1xuXG4gICAgaWYgKGNvbmZpcm1UZXh0KSB7XG4gICAgICBjb25maXJtVGV4dC50ZXh0Q29udGVudCA9IGN1c3RvbU1lc3NhZ2UgfHwgYFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2A7XG4gICAgfVxuICAgIGlmIChjb25maXJtQmFyKSB7XG4gICAgICBjb25maXJtQmFyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgIHRoaXMuaXNDb25maXJtaW5nU3RvcCA9IGZhbHNlO1xuICAgICAgaWYgKGNvbmZpcm1CYXIpIGNvbmZpcm1CYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNsZWFudXAoKTtcbiAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICBkaXNjYXJkQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkRpc2NhcmQoKTtcbiAgICB9O1xuXG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkNhbmNlbCgpO1xuICAgIH07XG4gIH1cblxuICBwdWJsaWMgaGlkZVN0b3BQcm9tcHQoKTogdm9pZCB7XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gZmFsc2U7XG4gICAgY29uc3QgY29uZmlybUJhciA9IHRoaXMuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY29uZmlybUJhcikgY29uZmlybUJhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIHNldFN0YW5kYXJkQ29udHJvbHNWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICAgICcjcGlsbFN0YXJ0QnRuLCAjcGlsbENvbnRpbnVlQnRuLCAjcGlsbFZpZXdGaWxlQnRuLCAjcGlsbFBhdXNlQnRuLCAjcGlsbFJlc3VtZUJ0biwgI3BpbGxTdG9wQnRuLCAjcGlsbE1vZGVCdG4sIC5waWxsLXN0YXR1cy1zZWN0aW9uLCAjcGlsbENvdW50ZXInXG4gICAgKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyAnJyA6ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkb2NrVG9MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gdHJ1ZTtcbiAgICB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdkb2NrZWQtbGVmdCcpO1xuICB9XG5cbiAgcHVibGljIHVuZG9ja0Zyb21MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnZG9ja2VkLWxlZnQnKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVQcm9ncmVzcyhcbiAgICBjdXJyZW50UGFnZTogbnVtYmVyLFxuICAgIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgICBzdGF0dXNUZXh0OiBzdHJpbmcsXG4gICAgc3RhdHVzVHlwZTogc3RyaW5nID0gJ25vcm1hbCcsXG4gICAgaXNQYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIgPSAxLFxuICAgIGltYWdlRGltZW5zaW9ucz86IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDb25maXJtaW5nU3RvcCkgcmV0dXJuOyAvLyBEbyBub3Qgb3ZlcndyaXRlIGNvbmZpcm1hdGlvbiBwcm9tcHRcblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGFydEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGNvbnRpbnVlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHZpZXdGaWxlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBhdXNlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxQYXVzZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHJlc3VtZUJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUmVzdW1lQnRuJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RvcEJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RvcEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IG1vZGVCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbE1vZGVCdG4nKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIGNvbnN0IGNvdW50ZXJFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ291bnRlcicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGZpbGxFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUHJvZ3Jlc3NGaWxsJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RhdHVzVGV4dEVsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGF0dXNUZXh0JykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgZGltZW5zaW9uc0VsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxEaW1lbnNpb25zVGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gMS1wYWdlIHN3aXRjaCBidXR0b25cbiAgICBpZiAobW9kZUJ0bikge1xuICAgICAgbW9kZUJ0bi5zdHlsZS5kaXNwbGF5ID0gY3VycmVudE1vZGUgIT09IDEgJiYgIWlzQWN0aXZlID8gJ2ZsZXgnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIFJpZ2h0IFNpZGUgQ291bnRlclxuICAgIGlmIChjb3VudGVyRWwpIHtcbiAgICAgIGlmICh0b3RhbFBhZ2VzID4gMCkge1xuICAgICAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgUGFnZSAke2N1cnJlbnRQYWdlfS8ke3RvdGFsUGFnZXN9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgMC8ke3RvdGFsUGFnZXN9IHBhZ2VzYDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY291bnRlckVsLnRleHRDb250ZW50ID0gJ0RldGVjdGluZyBwYWdlcy4uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvZ3Jlc3MgYmFyIGZpbGxcbiAgICBpZiAoZmlsbEVsICYmIHRvdGFsUGFnZXMgPiAwKSB7XG4gICAgICBjb25zdCBwY3QgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQoKChjdXJyZW50UGFnZSArIDEpIC8gdG90YWxQYWdlcykgKiAxMDApKTtcbiAgICAgIGZpbGxFbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgICB9XG5cbiAgICAvLyBTdGF0dXMgdGV4dCAmIGNsYXNzXG4gICAgaWYgKHN0YXR1c1RleHRFbCkge1xuICAgICAgc3RhdHVzVGV4dEVsLnRleHRDb250ZW50ID0gc3RhdHVzVGV4dDtcbiAgICAgIHN0YXR1c1RleHRFbC5jbGFzc05hbWUgPSBgcGlsbC1zdGF0dXMtdGV4dCAke3N0YXR1c1R5cGV9YDtcbiAgICB9XG5cbiAgICAvLyBJbWFnZSBEaW1lbnNpb25zOiAoaW1hZ2U6IDI1ODAgeCAzOTE1KVxuICAgIGlmIChkaW1lbnNpb25zRWwpIHtcbiAgICAgIGlmIChpbWFnZURpbWVuc2lvbnMgJiYgaW1hZ2VEaW1lbnNpb25zLndpZHRoID4gMCAmJiBpbWFnZURpbWVuc2lvbnMuaGVpZ2h0ID4gMCkge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAke2ltYWdlRGltZW5zaW9ucy53aWR0aH0geCAke2ltYWdlRGltZW5zaW9ucy5oZWlnaHR9KWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAtIHggLSlgO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJ1dHRvbnMgVmlzaWJpbGl0eVxuICAgIHN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29udGludWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB2aWV3RmlsZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmVzdW1lQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgaWYgKHN0YXR1c1R5cGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIC8vIENvbXBsZXRlZDogc2hvdyBcIkRvd25sb2FkZWQ6IFZpZXcgRmlsZXNcIlxuICAgICAgdmlld0ZpbGVCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9IGVsc2UgaWYgKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyB8fCBzdGF0dXNUeXBlID09PSAnb2ZmbGluZScgfHwgKGlzUGF1c2VkICYmIHN0YXR1c1R5cGUgPT09ICdyZXRyeWluZycpKSB7XG4gICAgICAvLyBTdGFsbGVkIC8gb2ZmbGluZSAvIG1heCByZXRyaWVzIGhpdDogc2hvdyBDT05USU5VRSArIFN0b3BcbiAgICAgIGNvbnRpbnVlQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfSBlbHNlIGlmIChpc0FjdGl2ZSkge1xuICAgICAgLy8gQ3VycmVudGx5IGFjdGl2ZVxuICAgICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICAgIHJlc3VtZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWRsZVxuICAgICAgc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgdGhpcy5jb250YWluZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwKICAgICIvKipcbiAqIFV0aWxpdGllcyBmb3IgZXh0cmFjdGluZyBPQ1IgdGV4dCBmcm9tIERKVlUgWE1MIGFuZCBjb21waWxpbmcgTWFya2Rvd24gZG9jdW1lbnRzXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlVGV4dEVudHJ5IHtcbiAgcGFnZU51bTogbnVtYmVyO1xuICBsZWFmSW5kZXg6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tNZXRhZGF0YSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvb2tJZDogc3RyaW5nO1xuICBhdXRob3I/OiBzdHJpbmc7XG4gIHB1Ymxpc2hlcj86IHN0cmluZztcbiAgeWVhcj86IHN0cmluZztcbiAgc291cmNlVXJsPzogc3RyaW5nO1xuICB0b3RhbFBhZ2VzPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFN0cmlwcyBESlZVIFhNTCBpbnRvIGNsZWFuLCBzdHJ1Y3R1cmVkIHBsYWluIHRleHQgZm9yIGEgc2luZ2xlIHBhZ2UuXG4gKiBSb2J1c3RseSBwYXJzZXMgUEFSQUdSQVBILCBMSU5FLCBhbmQgV09SRCBlbGVtZW50cy5cbiAqIFdvcmtzIHNlYW1sZXNzbHkgaW4gYm90aCBicm93c2VyIGFuZCBOb2RlL0J1biB0ZXN0IGVudmlyb25tZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGp2dVhtbFRvVGV4dCh4bWxTdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgheG1sU3RyaW5nIHx8IHR5cGVvZiB4bWxTdHJpbmcgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgLy8gRXh0cmFjdCBhbGwgUEFSQUdSQVBIIGJsb2Nrc1xuICBjb25zdCBwYXJhZ3JhcGhNYXRjaGVzID0geG1sU3RyaW5nLm1hdGNoKC88UEFSQUdSQVBIW1xcc1xcU10qPzxcXC9QQVJBR1JBUEg+L2dpKTtcbiAgaWYgKCFwYXJhZ3JhcGhNYXRjaGVzIHx8IHBhcmFncmFwaE1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gSWYgbm8gUEFSQUdSQVBIIHRhZ3MsIHRyeSBleHRyYWN0aW5nIHdvcmRzIGRpcmVjdGx5XG4gICAgY29uc3Qgd29yZHMgPSBBcnJheS5mcm9tKHhtbFN0cmluZy5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKVxuICAgICAgLm1hcChtID0+IGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhtWzFdLnRyaW0oKSkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIHJldHVybiB3b3Jkcy5qb2luKCcgJyk7XG4gIH1cblxuICBjb25zdCBwYXJhZ3JhcGhzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgcGFyQmxvY2sgb2YgcGFyYWdyYXBoTWF0Y2hlcykge1xuICAgIC8vIEV4dHJhY3QgYWxsIExJTkUgYmxvY2tzIGluc2lkZSB0aGlzIFBBUkFHUkFQSFxuICAgIGNvbnN0IGxpbmVNYXRjaGVzID0gcGFyQmxvY2subWF0Y2goLzxMSU5FW1xcc1xcU10qPzxcXC9MSU5FPi9naSk7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAobGluZU1hdGNoZXMgJiYgbGluZU1hdGNoZXMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChjb25zdCBsaW5lQmxvY2sgb2YgbGluZU1hdGNoZXMpIHtcbiAgICAgICAgLy8gRXh0cmFjdCBhbGwgV09SRCBjb250ZW50cyBpbnNpZGUgdGhpcyBMSU5FXG4gICAgICAgIGNvbnN0IHdvcmRNYXRjaGVzID0gQXJyYXkuZnJvbShsaW5lQmxvY2subWF0Y2hBbGwoLzxXT1JEW14+XSo+KFtcXHNcXFNdKj8pPFxcL1dPUkQ+L2dpKSk7XG4gICAgICAgIGNvbnN0IHdvcmRzID0gd29yZE1hdGNoZXNcbiAgICAgICAgICAubWFwKG0gPT4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICAgIGlmICh3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbGluZXMucHVzaCh3b3Jkcy5qb2luKCcgJykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZhbGxiYWNrOiB3b3JkcyBkaXJlY3RseSBpbiBwYXJhZ3JhcGhcbiAgICAgIGNvbnN0IHdvcmRNYXRjaGVzID0gQXJyYXkuZnJvbShwYXJCbG9jay5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKTtcbiAgICAgIGNvbnN0IHdvcmRzID0gd29yZE1hdGNoZXNcbiAgICAgICAgLm1hcChtID0+IGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhtWzFdLnRyaW0oKSkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIGlmICh3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2god29yZHMuam9pbignICcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGluZXMubGVuZ3RoID4gMCkge1xuICAgICAgcGFyYWdyYXBocy5wdXNoKGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhsaW5lcy5qb2luKCdcXG4nKSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMocGFyYWdyYXBocy5qb2luKCdcXG5cXG4nKSk7XG59XG5cbi8qKlxuICogSGVscGVyIHRvIGRlY29kZSBhbGwgSFRNTCBhbmQgWE1MIGVudGl0aWVzIGludG8gcHJvcGVyIFVURi04IGNoYXJhY3RlcnMuXG4gKiBIYW5kbGVzIG51bWVyaWMgZGVjaW1hbCAoZS5nLiAmIzgyMTI7IC0+IOKAlCksIGhleCAoJiN4MjAxNDspLCBhbmQgbmFtZWQgZW50aXRpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCF0ZXh0IHx8IHR5cGVvZiB0ZXh0ICE9PSAnc3RyaW5nJykgcmV0dXJuICcnO1xuXG4gIHJldHVybiB0ZXh0XG4gICAgLy8gMS4gRGVjaW1hbCBudW1lcmljIGVudGl0aWVzOiAmIzgyMTI7IC0+ICfigJQnXG4gICAgLnJlcGxhY2UoLyYjKFxcZCspOy9nLCAoXywgZGVjKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb2RlID0gcGFyc2VJbnQoZGVjLCAxMCk7XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gXztcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIDIuIEhleGFkZWNpbWFsIG51bWVyaWMgZW50aXRpZXM6ICYjeDIwMTQ7IC0+ICfigJQnXG4gICAgLnJlcGxhY2UoLyYjeChbMC05YS1mQS1GXSspOy9nLCAoXywgaGV4KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb2RlID0gcGFyc2VJbnQoaGV4LCAxNik7XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gXztcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIDMuIE5hbWVkIGVudGl0aWVzXG4gICAgLnJlcGxhY2UoLyZtZGFzaDsvZywgJ+KAlCcpXG4gICAgLnJlcGxhY2UoLyZuZGFzaDsvZywgJ+KAkycpXG4gICAgLnJlcGxhY2UoLyZoZWxsaXA7L2csICfigKYnKVxuICAgIC5yZXBsYWNlKC8mbHNxdW87L2csICfigJgnKVxuICAgIC5yZXBsYWNlKC8mcnNxdW87L2csICfigJknKVxuICAgIC5yZXBsYWNlKC8mbGRxdW87L2csICfigJwnKVxuICAgIC5yZXBsYWNlKC8mcmRxdW87L2csICfigJ0nKVxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgJyAnKVxuICAgIC5yZXBsYWNlKC8mYnVsbDsvZywgJ+KAoicpXG4gICAgLnJlcGxhY2UoLyZjZW50Oy9nLCAnwqInKVxuICAgIC5yZXBsYWNlKC8mcG91bmQ7L2csICfCoycpXG4gICAgLnJlcGxhY2UoLyZ5ZW47L2csICfCpScpXG4gICAgLnJlcGxhY2UoLyZldXJvOy9nLCAn4oKsJylcbiAgICAucmVwbGFjZSgvJmNvcHk7L2csICfCqScpXG4gICAgLnJlcGxhY2UoLyZyZWc7L2csICfCricpXG4gICAgLnJlcGxhY2UoLyZkZWc7L2csICfCsCcpXG4gICAgLnJlcGxhY2UoLyZwbHVzbW47L2csICfCsScpXG4gICAgLnJlcGxhY2UoLyZ0aW1lczsvZywgJ8OXJylcbiAgICAucmVwbGFjZSgvJmRpdmlkZTsvZywgJ8O3JylcbiAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgLnJlcGxhY2UoLyZhcG9zOy9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgLnJlcGxhY2UoLyZndDsvZywgJz4nKVxuICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpOyAvLyBkZWNvZGUgJmFtcDsgbGFzdFxufVxuXG4vKipcbiAqIFN0cmlwcyBIYXRoaVRydXN0IDxmaWdjYXB0aW9uPiBtYXJrdXAgaW50byBjbGVhbiwgZm9ybWF0dGVkIE1hcmtkb3duL3RleHQuXG4gKiBIYW5kbGVzIGJvdGggRE9NIEVsZW1lbnQgaW5wdXRzIChpbiBicm93c2VyKSBhbmQgcmF3IEhUTUwgc3RyaW5ncyAoaW4gdGVzdHMpLlxuICogRXh0cmFjdHMgd29yZCBzcGFucywgcHJlc2VydmVzIHBhcmFncmFwaCBicmVha3MsIGFuZCBkZWNvZGVzIEhUTUwgZW50aXRpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChpbnB1dDogc3RyaW5nIHwgYW55KTogc3RyaW5nIHtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuICcnO1xuXG4gIC8vIElmIERPTSBFbGVtZW50IGluIGJyb3dzZXIgZW52aXJvbm1lbnRcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiYgaW5wdXQubm9kZVR5cGUpIHtcbiAgICBjb25zdCBlbCA9IGlucHV0IGFzIEVsZW1lbnQ7XG4gICAgY29uc3QgcEVsZW1lbnRzID0gQXJyYXkuZnJvbShlbC5xdWVyeVNlbGVjdG9yQWxsKCdwLCAub2NyX3BhcicpKTtcblxuICAgIGlmIChwRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcGFyYWdyYXBocyA9IHBFbGVtZW50cy5tYXAocCA9PiB7XG4gICAgICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShwLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4sIC5vY3J4X3dvcmQsIC5vY3JfbGluZScpKTtcbiAgICAgICAgaWYgKHNwYW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gc3BhbnNcbiAgICAgICAgICAgIC5tYXAocyA9PiAocy50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpKVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHAudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMocGFyYWdyYXBocy5qb2luKCdcXG5cXG4nKSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gPHA+IHRhZ3MsIGNoZWNrIGZvciBsaW5lIGVsZW1lbnRzXG4gICAgY29uc3QgbGluZXMgPSBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5vY3JfbGluZSwgZGl2JykpO1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBsaW5lVGV4dHMgPSBsaW5lcy5tYXAobGluZSA9PiB7XG4gICAgICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShsaW5lLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4sIC5vY3J4X3dvcmQnKSk7XG4gICAgICAgIGlmIChzcGFucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHNwYW5zLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpLmZpbHRlcihCb29sZWFuKS5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChsaW5lLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgfSkuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKGxpbmVUZXh0cy5qb2luKCdcXG4nKSk7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2s6IGV4dHJhY3QgYWxsIHNwYW5zIG9yIHRleHQgZGlyZWN0bHlcbiAgICBjb25zdCBzcGFucyA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnc3BhbicpKTtcbiAgICBpZiAoc3BhbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNwYW5zLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpLmZpbHRlcihCb29sZWFuKS5qb2luKCcgJyk7XG4gICAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKHRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMoKGVsLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkucmVwbGFjZSgvWyBcXHRdKy9nLCAnICcpKTtcbiAgfVxuXG4gIC8vIElmIGlucHV0IGlzIGFuIEhUTUwgc3RyaW5nXG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgbGV0IGNsZWFuID0gaW5wdXQ7XG5cbiAgICAvLyBDaGVjayBmb3IgPHA+IG9yIDxkaXYgY2xhc3M9XCJvY3JfcGFyXCI+IHBhcmFncmFwaHNcbiAgICBjb25zdCBwTWF0Y2hlcyA9IGNsZWFuLm1hdGNoKC88KD86cHxkaXYgY2xhc3M9XCJvY3JfcGFyXCIpW14+XSo+KFtcXHNcXFNdKj8pPFxcLyg/OnB8ZGl2KT4vZ2kpO1xuICAgIGlmIChwTWF0Y2hlcyAmJiBwTWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwYXJhZ3JhcGhzID0gcE1hdGNoZXMubWFwKHBCbG9jayA9PiB7XG4gICAgICAgIHJldHVybiBwQmxvY2tcbiAgICAgICAgICAucmVwbGFjZSgvPGJyXFxzKlxcLz8+L2dpLCAnXFxuJylcbiAgICAgICAgICAucmVwbGFjZSgvPFtePl0rPi9nLCAnICcpXG4gICAgICAgICAgLnJlcGxhY2UoL1sgXFx0XFxyXFxuXSsvZywgJyAnKVxuICAgICAgICAgIC50cmltKCk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMocGFyYWdyYXBocy5qb2luKCdcXG5cXG4nKSk7XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIHN0cmlwIHRhZ3MsIHByZXNlcnZpbmcgPGJyPiBhcyBsaW5lIGJyZWFrc1xuICAgIGNvbnN0IHRleHQgPSBjbGVhblxuICAgICAgLnJlcGxhY2UoLzxiclxccypcXC8/Pi9naSwgJ1xcbicpXG4gICAgICAucmVwbGFjZSgvPFtePl0rPi9nLCAnICcpXG4gICAgICAucmVwbGFjZSgvWyBcXHRdKy9nLCAnICcpXG4gICAgICAucmVwbGFjZSgvXFxuXFxzKlxcbisvZywgJ1xcblxcbicpXG4gICAgICAudHJpbSgpO1xuXG4gICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyh0ZXh0KTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBBc3NlbWJsZXMgbXVsdGlwbGUgcGFnZSB0ZXh0cyBhbmQgYm9vayBtZXRhZGF0YSBpbnRvIGEgY2xlYW4sIGNvbXBsZXRlIE1hcmtkb3duIGRvY3VtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRCb29rTWFya2Rvd24oXG4gIG1ldGFkYXRhOiBCb29rTWV0YWRhdGEsXG4gIHBhZ2VzOiBQYWdlVGV4dEVudHJ5W11cbik6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIFRpdGxlIGFuZCBIZWFkZXJcbiAgcGFydHMucHVzaChgIyAke21ldGFkYXRhLnRpdGxlIHx8ICdVbnRpdGxlZCBCb29rJ31cXG5gKTtcblxuICBjb25zdCBtZXRhTGluZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChtZXRhZGF0YS5hdXRob3IpIG1ldGFMaW5lcy5wdXNoKGAtICoqQXV0aG9yOioqICR7bWV0YWRhdGEuYXV0aG9yfWApO1xuICBpZiAobWV0YWRhdGEucHVibGlzaGVyKSBtZXRhTGluZXMucHVzaChgLSAqKlB1Ymxpc2hlcjoqKiAke21ldGFkYXRhLnB1Ymxpc2hlcn1gKTtcbiAgaWYgKG1ldGFkYXRhLnllYXIpIG1ldGFMaW5lcy5wdXNoKGAtICoqRGF0ZToqKiAke21ldGFkYXRhLnllYXJ9YCk7XG5cbiAgaWYgKG1ldGFkYXRhLmJvb2tJZCkge1xuICAgIGlmIChtZXRhZGF0YS5zb3VyY2VVcmwgJiYgbWV0YWRhdGEuc291cmNlVXJsLmluY2x1ZGVzKCdoYXRoaXRydXN0Lm9yZycpKSB7XG4gICAgICBtZXRhTGluZXMucHVzaChgLSAqKkhhdGhpVHJ1c3QgSWRlbnRpZmllcjoqKiBbJHttZXRhZGF0YS5ib29rSWR9XSgke21ldGFkYXRhLnNvdXJjZVVybH0pYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqSW50ZXJuZXQgQXJjaGl2ZSBJZGVudGlmaWVyOioqIFske21ldGFkYXRhLmJvb2tJZH1dKGh0dHBzOi8vYXJjaGl2ZS5vcmcvZGV0YWlscy8ke21ldGFkYXRhLmJvb2tJZH0pYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG1ldGFkYXRhLnNvdXJjZVVybCAmJiAhbWV0YUxpbmVzLnNvbWUobCA9PiBsLmluY2x1ZGVzKG1ldGFkYXRhLnNvdXJjZVVybCEpKSkge1xuICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqU291cmNlOioqICR7bWV0YWRhdGEuc291cmNlVXJsfWApO1xuICB9XG4gIGlmIChtZXRhZGF0YS50b3RhbFBhZ2VzKSBtZXRhTGluZXMucHVzaChgLSAqKlRvdGFsIFBhZ2VzOioqICR7bWV0YWRhdGEudG90YWxQYWdlc31gKTtcblxuICBpZiAobWV0YUxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICBwYXJ0cy5wdXNoKG1ldGFMaW5lcy5qb2luKCdcXG4nKSk7XG4gICAgcGFydHMucHVzaCgnXFxuLS0tXFxuJyk7XG4gIH1cblxuICAvLyBTb3J0IHBhZ2VzIGJ5IHBhZ2VOdW1cbiAgY29uc3Qgc29ydGVkID0gWy4uLnBhZ2VzXS5zb3J0KChhLCBiKSA9PiBhLnBhZ2VOdW0gLSBiLnBhZ2VOdW0pO1xuXG4gIGZvciAoY29uc3QgcGFnZSBvZiBzb3J0ZWQpIHtcbiAgICBwYXJ0cy5wdXNoKGAjIyBQYWdlICR7cGFnZS5wYWdlTnVtfVxcblxcbmApO1xuICAgIGlmIChwYWdlLnRleHQgJiYgcGFnZS50ZXh0LnRyaW0oKSkge1xuICAgICAgcGFydHMucHVzaChgJHtwYWdlLnRleHQudHJpbSgpfVxcbmApO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJ0cy5wdXNoKGAqW05vIHRleHQgb3IgaWxsdXN0cmF0aW9uIHBhZ2VdKlxcbmApO1xuICAgIH1cbiAgICBwYXJ0cy5wdXNoKCdcXG4tLS1cXG4nKTtcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCdcXG4nKTtcbn1cblxuIiwKICAgICIvKipcbiAqIEZhc3QsIHB1cmUgSmF2YVNjcmlwdCBQREYgY29tcGlsZXIgZm9yIGVtYmVkZGluZyBKUEVHIHBhZ2UgaW1hZ2VzIGludG8gUERGIGRvY3VtZW50cy5cbiAqIENvbmZvcm1zIHRvIFBERiAxLjQgc3BlY2lmaWNhdGlvbi4gWmVybyBleHRlcm5hbCBiaW5hcnkgZGVwZW5kZW5jaWVzLlxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgSnBlZ0luZm8ge1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgY2hhbm5lbHM6IG51bWJlcjtcbiAgY29sb3JTcGFjZTogJ0RldmljZUdyYXknIHwgJ0RldmljZVJHQicgfCAnRGV2aWNlQ01ZSyc7XG4gIGJpdHM6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyB3aWR0aCwgaGVpZ2h0LCBhbmQgY29sb3Igc3BhY2UgZGlyZWN0bHkgZnJvbSBKUEVHIGhlYWRlciBtYXJrZXJzIChTT0YwL1NPRjIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SnBlZ0luZm8oZGF0YTogVWludDhBcnJheSk6IEpwZWdJbmZvIHtcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhkYXRhLmJ1ZmZlciwgZGF0YS5ieXRlT2Zmc2V0LCBkYXRhLmJ5dGVMZW5ndGgpO1xuXG4gIGlmICh2aWV3LmdldFVpbnQxNigwKSAhPT0gMHhmZmQ4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSB2YWxpZCBKUEVHIGltYWdlIChtaXNzaW5nIFNPSSBtYXJrZXIpLicpO1xuICB9XG5cbiAgY29uc3QgU09GX01BUktFUlMgPSBbXG4gICAgMHhmZmMwLCAweGZmYzEsIDB4ZmZjMiwgMHhmZmMzLCAweGZmYzUsIDB4ZmZjNiwgMHhmZmM3LCAweGZmYzksIDB4ZmZjYSxcbiAgICAweGZmY2IsIDB4ZmZjZCwgMHhmZmNlLCAweGZmY2YsXG4gIF07XG5cbiAgbGV0IHBvcyA9IDI7XG4gIHdoaWxlIChwb3MgPCBkYXRhLmxlbmd0aCAtIDgpIHtcbiAgICBjb25zdCBtYXJrZXIgPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgIHBvcyArPSAyO1xuXG4gICAgaWYgKFNPRl9NQVJLRVJTLmluY2x1ZGVzKG1hcmtlcikpIHtcbiAgICAgIHBvcyArPSAyOyAvLyBza2lwIGxlbmd0aFxuICAgICAgY29uc3QgYml0cyA9IHZpZXcuZ2V0VWludDgocG9zKyspO1xuICAgICAgY29uc3QgaGVpZ2h0ID0gdmlldy5nZXRVaW50MTYocG9zKTtcbiAgICAgIHBvcyArPSAyO1xuICAgICAgY29uc3Qgd2lkdGggPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb25zdCBjaGFubmVscyA9IHZpZXcuZ2V0VWludDgocG9zKyspO1xuXG4gICAgICBsZXQgY29sb3JTcGFjZTogJ0RldmljZUdyYXknIHwgJ0RldmljZVJHQicgfCAnRGV2aWNlQ01ZSycgPSAnRGV2aWNlUkdCJztcbiAgICAgIGlmIChjaGFubmVscyA9PT0gMSkgY29sb3JTcGFjZSA9ICdEZXZpY2VHcmF5JztcbiAgICAgIGVsc2UgaWYgKGNoYW5uZWxzID09PSA0KSBjb2xvclNwYWNlID0gJ0RldmljZUNNWUsnO1xuXG4gICAgICByZXR1cm4geyB3aWR0aCwgaGVpZ2h0LCBjaGFubmVscywgY29sb3JTcGFjZSwgYml0cyB9O1xuICAgIH1cblxuICAgIGNvbnN0IGxlbmd0aCA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgcG9zICs9IGxlbmd0aDtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgU09GIG1hcmtlciBpbiBKUEVHIHN0cmVhbS4nKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gY29udmVydCBCYXNlNjQgRGF0YSBVUkwgdG8gVWludDhBcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGFVcmxUb0J5dGVzKGRhdGFVcmw6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBjb21tYUluZGV4ID0gZGF0YVVybC5pbmRleE9mKCcsJyk7XG4gIGNvbnN0IGJhc2U2NCA9IGNvbW1hSW5kZXggPj0gMCA/IGRhdGFVcmwuc2xpY2UoY29tbWFJbmRleCArIDEpIDogZGF0YVVybDtcbiAgY29uc3QgYmluYXJ5U3RyaW5nID0gYXRvYihiYXNlNjQpO1xuICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJpbmFyeVN0cmluZy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmFyeVN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgIGJ5dGVzW2ldID0gYmluYXJ5U3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gIH1cbiAgcmV0dXJuIGJ5dGVzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBkZkltYWdlSW5wdXQge1xuICBwYWdlTnVtOiBudW1iZXI7XG4gIGRhdGE6IFVpbnQ4QXJyYXkgfCBzdHJpbmc7IC8vIFVpbnQ4QXJyYXkgb3IgRGF0YVVSTFxuICB3aWR0aD86IG51bWJlcjtcbiAgaGVpZ2h0PzogbnVtYmVyO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGEgbGlzdCBvZiBKUEVHIGltYWdlcyBpbnRvIGEgdmFsaWQgUERGIGRvY3VtZW50LlxuICogRW1iZWRzIHJhdyBKUEVHIHN0cmVhbXMgZGlyZWN0bHkgd2l0aG91dCBkZWNvbXByZXNzaW9uIG9yIHJlLWVuY29kaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUpwZWdzVG9QZGYoXG4gIGltYWdlczogUGRmSW1hZ2VJbnB1dFtdLFxuICBtZXRhZGF0YTogeyB0aXRsZT86IHN0cmluZzsgYXV0aG9yPzogc3RyaW5nOyBjcmVhdG9yPzogc3RyaW5nIH0gPSB7fVxuKTogVWludDhBcnJheSB7XG4gIGlmIChpbWFnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIFBERjogTm8gaW1hZ2VzIHByb3ZpZGVkLicpO1xuICB9XG5cbiAgY29uc3QgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgY29uc3QgY2h1bmtzOiBVaW50OEFycmF5W10gPSBbXTtcbiAgY29uc3Qgb2Zmc2V0czogbnVtYmVyW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRPZmZzZXQgPSAwO1xuXG4gIGZ1bmN0aW9uIHdyaXRlKGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgY2h1bmtzLnB1c2goYnl0ZXMpO1xuICAgIGN1cnJlbnRPZmZzZXQgKz0gYnl0ZXMubGVuZ3RoO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGVTdHJpbmcoc3RyOiBzdHJpbmcpIHtcbiAgICB3cml0ZSh0ZXh0RW5jb2Rlci5lbmNvZGUoc3RyKSk7XG4gIH1cblxuICAvLyBIZWFkZXJcbiAgd3JpdGVTdHJpbmcoJyVQREYtMS40XFxuJVxceEUyXFx4RTNcXHhDRlxceEQzXFxuJyk7XG5cbiAgbGV0IG9iaklkQ291bnRlciA9IDE7XG4gIGZ1bmN0aW9uIHN0YXJ0T2JqZWN0KCk6IG51bWJlciB7XG4gICAgY29uc3QgaWQgPSBvYmpJZENvdW50ZXIrKztcbiAgICBvZmZzZXRzW2lkXSA9IGN1cnJlbnRPZmZzZXQ7XG4gICAgd3JpdGVTdHJpbmcoYCR7aWR9IDAgb2JqXFxuYCk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kT2JqZWN0KCkge1xuICAgIHdyaXRlU3RyaW5nKCdlbmRvYmpcXG4nKTtcbiAgfVxuXG4gIGNvbnN0IHRvdGFsUGFnZXMgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIC8vIFByZS1jYWxjdWxhdGUgT2JqZWN0IElEczpcbiAgLy8gMTogQ2F0YWxvZ1xuICAvLyAyOiBQYWdlc1xuICAvLyAzICsgKGkgKiAzKTogUGFnZSBvYmplY3RcbiAgLy8gNCArIChpICogMyk6IENvbnRlbnQgc3RyZWFtXG4gIC8vIDUgKyAoaSAqIDMpOiBJbWFnZSBYT2JqZWN0XG4gIGNvbnN0IGNhdGFsb2dJZCA9IDE7XG4gIGNvbnN0IHBhZ2VzUm9vdElkID0gMjtcbiAgY29uc3QgcGFnZUlkczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbFBhZ2VzOyBpKyspIHtcbiAgICBwYWdlSWRzLnB1c2goMyArIGkgKiAzKTtcbiAgfVxuXG4gIC8vIDEuIENhdGFsb2dcbiAgc3RhcnRPYmplY3QoKTsgLy8gMVxuICB3cml0ZVN0cmluZyhgPDxcXG4gIC9UeXBlIC9DYXRhbG9nXFxuICAvUGFnZXMgJHtwYWdlc1Jvb3RJZH0gMCBSXFxuPj5cXG5gKTtcbiAgZW5kT2JqZWN0KCk7XG5cbiAgLy8gMi4gUGFnZXMgUm9vdFxuICBzdGFydE9iamVjdCgpOyAvLyAyXG4gIGNvbnN0IGtpZHNTdHIgPSBwYWdlSWRzLm1hcChpZCA9PiBgJHtpZH0gMCBSYCkuam9pbignICcpO1xuICB3cml0ZVN0cmluZyhgPDxcXG4gIC9UeXBlIC9QYWdlc1xcbiAgL0tpZHMgWyAke2tpZHNTdHJ9IF1cXG4gIC9Db3VudCAke3RvdGFsUGFnZXN9XFxuPj5cXG5gKTtcbiAgZW5kT2JqZWN0KCk7XG5cbiAgLy8gMy4gUmVuZGVyIEVhY2ggUGFnZSAoUGFnZSwgQ29udGVudHMsIEltYWdlIFhPYmplY3QpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxQYWdlczsgaSsrKSB7XG4gICAgY29uc3QgaXRlbSA9IGltYWdlc1tpXTtcbiAgICBjb25zdCBpbWFnZUJ5dGVzID0gdHlwZW9mIGl0ZW0uZGF0YSA9PT0gJ3N0cmluZycgPyBkYXRhVXJsVG9CeXRlcyhpdGVtLmRhdGEpIDogaXRlbS5kYXRhO1xuICAgIGNvbnN0IGluZm8gPSBnZXRKcGVnSW5mbyhpbWFnZUJ5dGVzKTtcblxuICAgIGNvbnN0IHdpZHRoID0gaXRlbS53aWR0aCB8fCBpbmZvLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IGl0ZW0uaGVpZ2h0IHx8IGluZm8uaGVpZ2h0O1xuXG4gICAgY29uc3QgcGFnZU9iaklkID0gMyArIGkgKiAzO1xuICAgIGNvbnN0IGNvbnRlbnRPYmpJZCA9IDQgKyBpICogMztcbiAgICBjb25zdCBpbWFnZU9iaklkID0gNSArIGkgKiAzO1xuXG4gICAgLy8gUGFnZSBPYmplY3RcbiAgICBzdGFydE9iamVjdCgpOyAvLyBwYWdlT2JqSWRcbiAgICB3cml0ZVN0cmluZyhcbiAgICAgIGA8PFxcbmAgK1xuICAgICAgYCAgL1R5cGUgL1BhZ2VcXG5gICtcbiAgICAgIGAgIC9QYXJlbnQgJHtwYWdlc1Jvb3RJZH0gMCBSXFxuYCArXG4gICAgICBgICAvTWVkaWFCb3ggWyAwIDAgJHt3aWR0aH0gJHtoZWlnaHR9IF1cXG5gICtcbiAgICAgIGAgIC9Db250ZW50cyAke2NvbnRlbnRPYmpJZH0gMCBSXFxuYCArXG4gICAgICBgICAvUmVzb3VyY2VzIDw8XFxuYCArXG4gICAgICBgICAgIC9YT2JqZWN0IDw8IC9JbSR7aSArIDF9ICR7aW1hZ2VPYmpJZH0gMCBSID4+XFxuYCArXG4gICAgICBgICA+PlxcbmAgK1xuICAgICAgYD4+XFxuYFxuICAgICk7XG4gICAgZW5kT2JqZWN0KCk7XG5cbiAgICAvLyBDb250ZW50IFN0cmVhbVxuICAgIGNvbnN0IGNvbnRlbnRTdHJlYW0gPSBgcVxcbiR7d2lkdGh9IDAgMCAke2hlaWdodH0gMCAwIGNtXFxuL0ltJHtpICsgMX0gRG9cXG5RXFxuYDtcbiAgICBjb25zdCBjb250ZW50Qnl0ZXMgPSB0ZXh0RW5jb2Rlci5lbmNvZGUoY29udGVudFN0cmVhbSk7XG5cbiAgICBzdGFydE9iamVjdCgpOyAvLyBjb250ZW50T2JqSWRcbiAgICB3cml0ZVN0cmluZyhgPDwgL0xlbmd0aCAke2NvbnRlbnRCeXRlcy5sZW5ndGh9ID4+XFxuc3RyZWFtXFxuYCk7XG4gICAgd3JpdGUoY29udGVudEJ5dGVzKTtcbiAgICB3cml0ZVN0cmluZygnXFxuZW5kc3RyZWFtXFxuJyk7XG4gICAgZW5kT2JqZWN0KCk7XG5cbiAgICAvLyBJbWFnZSBYT2JqZWN0XG4gICAgc3RhcnRPYmplY3QoKTsgLy8gaW1hZ2VPYmpJZFxuICAgIHdyaXRlU3RyaW5nKFxuICAgICAgYDw8XFxuYCArXG4gICAgICBgICAvVHlwZSAvWE9iamVjdFxcbmAgK1xuICAgICAgYCAgL1N1YnR5cGUgL0ltYWdlXFxuYCArXG4gICAgICBgICAvV2lkdGggJHtpbmZvLndpZHRofVxcbmAgK1xuICAgICAgYCAgL0hlaWdodCAke2luZm8uaGVpZ2h0fVxcbmAgK1xuICAgICAgYCAgL0NvbG9yU3BhY2UgLyR7aW5mby5jb2xvclNwYWNlfVxcbmAgK1xuICAgICAgYCAgL0JpdHNQZXJDb21wb25lbnQgJHtpbmZvLmJpdHN9XFxuYCArXG4gICAgICBgICAvRmlsdGVyIC9EQ1REZWNvZGVcXG5gICtcbiAgICAgIGAgIC9MZW5ndGggJHtpbWFnZUJ5dGVzLmxlbmd0aH1cXG5gICtcbiAgICAgIGA+PlxcbnN0cmVhbVxcbmBcbiAgICApO1xuICAgIHdyaXRlKGltYWdlQnl0ZXMpO1xuICAgIHdyaXRlU3RyaW5nKCdcXG5lbmRzdHJlYW1cXG4nKTtcbiAgICBlbmRPYmplY3QoKTtcbiAgfVxuXG4gIC8vIE9wdGlvbmFsIEluZm8gT2JqZWN0XG4gIGNvbnN0IGluZm9JZCA9IHN0YXJ0T2JqZWN0KCk7XG4gIGNvbnN0IHNhZmVUaXRsZSA9IChtZXRhZGF0YS50aXRsZSB8fCAnQXJjaGl2ZS5vcmcgQm9vaycpLnJlcGxhY2UoL1soKVxcXFxdL2csICdcXFxcJCYnKTtcbiAgY29uc3Qgc2FmZUF1dGhvciA9IChtZXRhZGF0YS5hdXRob3IgfHwgJ0FyY2hpdmUub3JnJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICBjb25zdCBjcmVhdG9yID0gKG1ldGFkYXRhLmNyZWF0b3IgfHwgJ0FyY2hpdmUgRG93bmxvYWRlcicpLnJlcGxhY2UoL1soKVxcXFxdL2csICdcXFxcJCYnKTtcbiAgd3JpdGVTdHJpbmcoXG4gICAgYDw8XFxuYCArXG4gICAgYCAgL1RpdGxlICgke3NhZmVUaXRsZX0pXFxuYCArXG4gICAgYCAgL0F1dGhvciAoJHtzYWZlQXV0aG9yfSlcXG5gICtcbiAgICBgICAvQ3JlYXRvciAoJHtjcmVhdG9yfSlcXG5gICtcbiAgICBgICAvUHJvZHVjZXIgKEFyY2hpdmUgRG93bmxvYWRlciBFeHRlbnNpb24pXFxuYCArXG4gICAgYCAgL0NyZWF0aW9uRGF0ZSAoRDoke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bLTpUXS9nLCAnJykuc2xpY2UoMCwgMTQpfVopXFxuYCArXG4gICAgYD4+XFxuYFxuICApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyBYUmVmIFRhYmxlXG4gIGNvbnN0IHN0YXJ0WHJlZiA9IGN1cnJlbnRPZmZzZXQ7XG4gIGNvbnN0IHRvdGFsT2JqZWN0cyA9IG9iaklkQ291bnRlcjsgLy8gMSB0byBvYmpJZENvdW50ZXItMVxuXG4gIHdyaXRlU3RyaW5nKGB4cmVmXFxuMCAke3RvdGFsT2JqZWN0c31cXG5gKTtcbiAgd3JpdGVTdHJpbmcoJzAwMDAwMDAwMDAgNjU1MzUgZiBcXG4nKTtcblxuICBmb3IgKGxldCBpZCA9IDE7IGlkIDwgdG90YWxPYmplY3RzOyBpZCsrKSB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gb2Zmc2V0c1tpZF0gfHwgMDtcbiAgICBjb25zdCBwYWRkZWRPZmZzZXQgPSBTdHJpbmcob2Zmc2V0KS5wYWRTdGFydCgxMCwgJzAnKTtcbiAgICB3cml0ZVN0cmluZyhgJHtwYWRkZWRPZmZzZXR9IDAwMDAwIG4gXFxuYCk7XG4gIH1cblxuICAvLyBUcmFpbGVyXG4gIHdyaXRlU3RyaW5nKFxuICAgIGB0cmFpbGVyXFxuYCArXG4gICAgYDw8XFxuYCArXG4gICAgYCAgL1NpemUgJHt0b3RhbE9iamVjdHN9XFxuYCArXG4gICAgYCAgL1Jvb3QgJHtjYXRhbG9nSWR9IDAgUlxcbmAgK1xuICAgIGAgIC9JbmZvICR7aW5mb0lkfSAwIFJcXG5gICtcbiAgICBgPj5cXG5gICtcbiAgICBgc3RhcnR4cmVmXFxuYCArXG4gICAgYCR7c3RhcnRYcmVmfVxcbmAgK1xuICAgIGAlJUVPRlxcbmBcbiAgKTtcblxuICAvLyBDb25jYXRlbmF0ZSBhbGwgY2h1bmtzIGludG8gZmluYWwgVWludDhBcnJheVxuICBsZXQgdG90YWxMZW5ndGggPSAwO1xuICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykgdG90YWxMZW5ndGggKz0gY2h1bmsubGVuZ3RoO1xuICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh0b3RhbExlbmd0aCk7XG4gIGxldCBwb3MgPSAwO1xuICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgIHJlc3VsdC5zZXQoY2h1bmssIHBvcyk7XG4gICAgcG9zICs9IGNodW5rLmxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIGNvbXBpbGVKcGVnc1RvUGRmLlxuICovXG5leHBvcnQgY29uc3QgY29tcGlsZUltYWdlc1RvUGRmID0gY29tcGlsZUpwZWdzVG9QZGY7XG4iLAogICAgIi8qKlxuICogRmlsZXN5c3RlbSBhbmQgbmFtaW5nIHNhbml0aXphdGlvbiB1dGlsaXRpZXNcbiAqL1xuXG4vKipcbiAqIFNhbml0aXplcyBhIHN0cmluZyBmb3Igc2FmZSB1c2FnZSBpbiBkaXJlY3Rvcnkgb3IgZmlsZSBuYW1lcyBhY3Jvc3MgbWFjT1MsIExpbnV4LCBhbmQgV2luZG93cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplRmlsZW5hbWUobmFtZTogc3RyaW5nLCBmYWxsYmFjayA9ICdib29rJyk6IHN0cmluZyB7XG4gIGlmICghbmFtZSB8fCB0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxsYmFjaztcblxuICAvLyBSZW1vdmUgb3IgcmVwbGFjZSBpbGxlZ2FsIGNoYXJhY3RlcnM6IC8gXFwgOiAqID8gXCIgPCA+IHwgYW5kIGNvbnRyb2wgY2hhcnNcbiAgbGV0IGNsZWFuZWQgPSBuYW1lXG4gICAgLnJlcGxhY2UoL1s8PjpcIi9cXFxcfD8qXFx4MDAtXFx4MUZdL2csICdfJylcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpXG4gICAgLnRyaW0oKTtcblxuICAvLyBTdHJpcCBsZWFkaW5nL3RyYWlsaW5nIGRvdHMgYW5kIHNwYWNlc1xuICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9eXFwuK3xcXC4rJC9nLCAnJykudHJpbSgpO1xuXG4gIC8vIEF2b2lkIHJlc2VydmVkIG5hbWVzIG9uIFdpbmRvd3MgKENPTiwgUFJOLCBBVVgsIE5VTCwgQ09NMS05LCBMUFQxLTkpXG4gIGNvbnN0IHJlc2VydmVkID0gL14oQ09OfFBSTnxBVVh8TlVMfENPTVsxLTldfExQVFsxLTldKSQvaTtcbiAgaWYgKHJlc2VydmVkLnRlc3QoY2xlYW5lZCkpIHtcbiAgICBjbGVhbmVkID0gYCR7Y2xlYW5lZH1fZmlsZWA7XG4gIH1cblxuICAvLyBDYXAgbGVuZ3RoIHRvIDEyMCBjaGFyYWN0ZXJzIHRvIHByZXZlbnQgcGF0aCBsaW1pdCBlcnJvcnNcbiAgaWYgKGNsZWFuZWQubGVuZ3RoID4gMTIwKSB7XG4gICAgY2xlYW5lZCA9IGNsZWFuZWQuc3Vic3RyaW5nKDAsIDEyMCkudHJpbSgpO1xuICB9XG5cbiAgcmV0dXJuIGNsZWFuZWQgfHwgZmFsbGJhY2s7XG59XG5cbi8qKlxuICogRm9ybWF0cyBhIHN1YmZvbGRlciBwYXRoIGJhc2VkIG9uIHRoZSB1c2VyJ3MgdGVtcGxhdGUgcGF0dGVybi5cbiAqIFRlbXBsYXRlcyBzdXBwb3J0ZWQ6XG4gKiAtIHt0aXRsZX0gLT4gXCJUaGVfQm9va19UaXRsZVwiXG4gKiAtIHtpZH0gLT4gXCJuYWdoYW1tYWRpbGlicmFyMDBqYW1lXCJcbiAqIC0ge3RpdGxlfV97aWR9IC0+IFwiVGhlX0Jvb2tfVGl0bGVfbmFnaGFtbWFkaWxpYnJhcjAwamFtZVwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdWJkaXIoXG4gIGJhc2VEaXI6IHN0cmluZyxcbiAgcGF0dGVybjogc3RyaW5nLFxuICBib29rVGl0bGU6IHN0cmluZyxcbiAgYm9va0lkOiBzdHJpbmdcbik6IHN0cmluZyB7XG4gIGNvbnN0IHNhZmVCYXNlID0gc2FuaXRpemVGaWxlbmFtZShiYXNlRGlyLCAnQXJjaGl2ZUJvb2tzJyk7XG4gIGNvbnN0IHNhZmVUaXRsZSA9IHNhbml0aXplRmlsZW5hbWUoYm9va1RpdGxlLCAnYm9vaycpO1xuICBjb25zdCBzYWZlSWQgPSBzYW5pdGl6ZUZpbGVuYW1lKGJvb2tJZCwgJ2lkJyk7XG5cbiAgbGV0IGZvbGRlciA9IHBhdHRlcm4gfHwgJ3t0aXRsZX1fe2lkfSc7XG4gIGZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXHt0aXRsZVxcfS9nLCBzYWZlVGl0bGUpO1xuICBmb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFx7aWRcXH0vZywgc2FmZUlkKTtcbiAgZm9sZGVyID0gc2FuaXRpemVGaWxlbmFtZShmb2xkZXIsIHNhZmVUaXRsZSk7XG5cbiAgcmV0dXJuIGAke3NhZmVCYXNlfS8ke2ZvbGRlcn1gO1xufVxuXG4vKipcbiAqIEZvcm1hdHMgYSBwYWdlIGltYWdlIGZpbGVuYW1lIHdpdGggemVybyBwYWRkaW5nLlxuICogRXhhbXBsZTogXCJwYWdlXzAwMS5qcGdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0UGFnZUZpbGVuYW1lKFxuICBwYWdlTnVtOiBudW1iZXIsXG4gIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgZm9ybWF0ID0gJ2pwZydcbik6IHN0cmluZyB7XG4gIGNvbnN0IHBhZExlbmd0aCA9IE1hdGgubWF4KDMsIFN0cmluZyh0b3RhbFBhZ2VzKS5sZW5ndGgpO1xuICBjb25zdCBwYWRkZWROdW0gPSBTdHJpbmcocGFnZU51bSkucGFkU3RhcnQocGFkTGVuZ3RoLCAnMCcpO1xuICByZXR1cm4gYHBhZ2VfJHtwYWRkZWROdW19LiR7Zm9ybWF0fWA7XG59XG4iLAogICAgImltcG9ydCB7IEJvb2tQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQm9va0luZm8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBwYXJzZURqdnVYbWxUb1RleHQgfSBmcm9tICcuLi91dGlscy9tYXJrZG93bi1idWlsZGVyJztcblxuLyoqXG4gKiBFeHRyYWN0cyBwYWdlL2xlYWYgbnVtYmVyIGZyb20gQXJjaGl2ZS5vcmcgaW1hZ2UgVVJMcyAoZS5nLiBfMDAzMC50aWYgLT4gMzApLlxuICogRXhhbXBsZTogZmlsZT1wcmluY2lwbGVzdGVhY2gwMW51dHRnb29nX3RpZi9wcmluY2lwbGVzdGVhY2gwMW51dHRnb29nXzAwMzAudGlmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFyY2hpdmVJbWFnZVVybFBhZ2Uoc3JjOiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKCFzcmMpIHJldHVybiBudWxsO1xuICAvLyAxLiBCb29rUmVhZGVySW1hZ2VzLnBocCBmaWxlIHBhcmFtZXRlcjogZS5nLiBmaWxlPS4uLl8wMDMwLnRpZiBvciBmaWxlPS4uLi0wMDMwLmpwMlxuICBjb25zdCBmaWxlTWF0Y2ggPSBzcmMubWF0Y2goL1s/Jl1maWxlPVteJl0qP1tfXFwtXFwuXShcXGQrKVxcLig/OnRpZnxqcDJ8anBnfGpwZWd8cG5nKS9pKTtcbiAgaWYgKGZpbGVNYXRjaCkge1xuICAgIGNvbnN0IG51bSA9IHBhcnNlSW50KGZpbGVNYXRjaFsxXSwgMTApO1xuICAgIGlmICghaXNOYU4obnVtKSkgcmV0dXJuIG51bTtcbiAgfVxuICAvLyAyLiBHZW5lcmljIGxlYWYgZmlsZW5hbWUgaW4gVVJMIHBhdGg6IGUuZy4gL3ByaW5jaXBsZXN0ZWFjaDAxbnV0dGdvb2dfMDAzMC50aWZcbiAgY29uc3QgZ2VuZXJpY01hdGNoID0gc3JjLm1hdGNoKC9bX1xcLVxcLl0oXFxkezMsNn0pXFwuKD86dGlmfGpwMnxqcGd8anBlZ3xwbmcpKD86Wz8mI118JCkvaSk7XG4gIGlmIChnZW5lcmljTWF0Y2gpIHtcbiAgICBjb25zdCBudW0gPSBwYXJzZUludChnZW5lcmljTWF0Y2hbMV0sIDEwKTtcbiAgICBpZiAoIWlzTmFOKG51bSkpIHJldHVybiBudW07XG4gIH1cbiAgLy8gMy4gRXhwbGljaXQgcGFnZS9sZWFmIHF1ZXJ5IHBhcmFtZXRlcnM6ID9wYWdlPTMwIG9yICZsZWFmPTMwXG4gIGNvbnN0IHBhcmFtTWF0Y2ggPSBzcmMubWF0Y2goL1s/Jl0oPzpwYWdlfGxlYWYpPShcXGQrKS9pKTtcbiAgaWYgKHBhcmFtTWF0Y2gpIHtcbiAgICBjb25zdCBudW0gPSBwYXJzZUludChwYXJhbU1hdGNoWzFdLCAxMCk7XG4gICAgaWYgKCFpc05hTihudW0pKSByZXR1cm4gbnVtO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGFuIGltYWdlIGVsZW1lbnQgaXMgZnVsbHkgbG9hZGVkLCBkZWNvZGVkLCBhbmQgcmVwcmVzZW50cyBhIHJlYWwgcGFnZSBzY2FuLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbWFnZUxvYWRlZChpbWc6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkLCBtaW5XaWR0aCA9IDIwMCk6IGJvb2xlYW4ge1xuICBpZiAoIWltZykgcmV0dXJuIGZhbHNlO1xuICBpZiAoIWltZy5zcmMgfHwgaW1nLnNyYy5zdGFydHNXaXRoKCdkYXRhOmltYWdlL2dpZicpIHx8IGltZy5zcmMgPT09ICdhYm91dDpibGFuaycpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIEJvb2xlYW4oaW1nLmNvbXBsZXRlICYmIChpbWcubmF0dXJhbFdpZHRoID49IG1pbldpZHRoIHx8IGltZy53aWR0aCA+PSBtaW5XaWR0aCkpO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIGN1cnJlbnQgYW5kIHRvdGFsIHBhZ2UgZnJvbSBBcmNoaXZlLm9yZyBET00gaW5kaWNhdG9ycy5cbiAqIEV4YW1wbGU6IDxzcGFuIGNsYXNzPVwiQlJjdXJyZW50cGFnZVwiIHJvbGU9XCJzdGF0dXNcIj5QYWdlIOKAlCAoNTcvMzg0KTwvc3Bhbj4gLT4geyBjdXJyZW50OiA1NywgdG90YWw6IDM4NCB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFyY2hpdmVEb21QYWdlKHRleHQ6IHN0cmluZyk6IHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0gfCBudWxsIHtcbiAgaWYgKCF0ZXh0KSByZXR1cm4gbnVsbDtcbiAgLy8gMS4gKDU3LzM4NCkgb3IgKDU3IC0gNTgvMzg0KSBlLmcuIFwiUGFnZSDigJQgKDU3LzM4NClcIiBvciBcIlBhZ2VzICgxIC0gMi81MTUpXCJcbiAgY29uc3QgbWF0Y2ggPSB0ZXh0Lm1hdGNoKC9cXCgoXFxkKykoPzpcXHMqLVxccypcXGQrKT9cXHMqXFwvXFxzKihcXGQrKVxcKS8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY3VycmVudDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiBwYXJzZUludChtYXRjaFsyXSwgMTApLFxuICAgIH07XG4gIH1cbiAgLy8gMi4gU2ltcGxlIHNsYXNoIHdpdGggb3Igd2l0aG91dCBwYXJlbnRoZXNlczogNTcvMzg0IG9yICg1NyAvIDM4NClcbiAgY29uc3Qgc2xhc2hNYXRjaCA9IHRleHQubWF0Y2goLyhcXGQrKSg/OlxccyotXFxzKlxcZCspP1xccypcXC9cXHMqKFxcZCspLyk7XG4gIGlmIChzbGFzaE1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQ6IHBhcnNlSW50KHNsYXNoTWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiBwYXJzZUludChzbGFzaE1hdGNoWzJdLCAxMCksXG4gICAgfTtcbiAgfVxuICAvLyAzLiBcIlBhZ2UgNDIgb2YgMzAwXCJcbiAgY29uc3Qgb2ZNYXRjaCA9IHRleHQubWF0Y2goLyhcXGQrKVxccytvZlxccysoXFxkKykvaSk7XG4gIGlmIChvZk1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQ6IHBhcnNlSW50KG9mTWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiBwYXJzZUludChvZk1hdGNoWzJdLCAxMCksXG4gICAgfTtcbiAgfVxuICAvLyA0LiBcIlBhZ2UgNTdcIiBvciBcIlBhZ2Ug4oCUIDU3XCJcbiAgY29uc3QgcGFnZU1hdGNoID0gdGV4dC5tYXRjaCgvcGFnZVxccyrigJQ/XFxzKihcXGQrKS9pKTtcbiAgaWYgKHBhZ2VNYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBjdXJyZW50OiBwYXJzZUludChwYWdlTWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiAwLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBBcmNoaXZlUHJvdmlkZXIgaW1wbGVtZW50cyBCb29rUHJvdmlkZXIge1xuICByZWFkb25seSBzaXRlSWQgPSAnYXJjaGl2ZScgYXMgY29uc3Q7XG4gIHJlYWRvbmx5IHNpdGVOYW1lID0gJ0FyY2hpdmUub3JnJztcbiAgcmVhZG9ubHkgZGVmYXVsdFN0YXJ0UGFnZSA9IDA7XG5cbiAgcHJpdmF0ZSBib29rSW5mbzogQm9va0luZm8gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0ZXh0Q2FjaGUgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuICBwcml2YXRlIGRldGVjdGVkT2Zmc2V0OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBvbkFyY2hpdmVUZXh0UmVhZHkocGFnZTogbnVtYmVyLCB4bWw6IHN0cmluZykge1xuICAgIGNvbnN0IHRleHQgPSBwYXJzZURqdnVYbWxUb1RleHQoeG1sKTtcbiAgICBpZiAodGV4dCkge1xuICAgICAgdGhpcy50ZXh0Q2FjaGUuc2V0KHBhZ2UsIHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIGlzTWF0Y2goKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKSAmJiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuaW5jbHVkZXMoJy9kZXRhaWxzLycpO1xuICB9XG5cbiAgc2V0Qm9va0luZm8oaW5mbzogQm9va0luZm8gfCBudWxsKSB7XG4gICAgdGhpcy5ib29rSW5mbyA9IGluZm87XG4gIH1cblxuICBhc3luYyBkZXRlY3RCb29rSW5mbygpOiBQcm9taXNlPEJvb2tJbmZvIHwgbnVsbD4ge1xuICAgIC8vIFJlcXVlc3QgQm9va1JlYWRlciBkZXRlY3Rpb24gZnJvbSBicmlkZ2UgaW4gTUFJTiB3b3JsZFxuICAgIHRoaXMucG9zdFRvQnJpZGdlKCdERVRFQ1RfQk9PSycpO1xuXG4gICAgLy8gQWxzbyBpbnNwZWN0IERPTSBkaXJlY3RseSBhcyBmYXN0IHBhdGggLyBmYWxsYmFja1xuICAgIGNvbnN0IGRvbVBhZ2UgPSB0aGlzLmV4dHJhY3RQYWdlSW5mb0Zyb21Eb20oKTtcbiAgICBpZiAoZG9tUGFnZSkge1xuICAgICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC50aXRsZSB8fCAnQXJjaGl2ZSBCb29rJztcbiAgICAgIGNvbnN0IGlkTWF0Y2ggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubWF0Y2goL1xcL2RldGFpbHNcXC8oW15cXC9cXD8jXSspLyk7XG4gICAgICBjb25zdCBib29rSWQgPSBpZE1hdGNoID8gaWRNYXRjaFsxXSA6ICdib29rJztcblxuICAgICAgaWYgKCF0aGlzLmJvb2tJbmZvKSB7XG4gICAgICAgIHRoaXMuYm9va0luZm8gPSB7XG4gICAgICAgICAgYm9va0lkLFxuICAgICAgICAgIGJvb2tUaXRsZTogdGl0bGUsXG4gICAgICAgICAgdG90YWxQYWdlczogZG9tUGFnZS50b3RhbCxcbiAgICAgICAgICBjdXJyZW50TGVhZjogZG9tUGFnZS5jdXJyZW50LFxuICAgICAgICAgIGN1cnJlbnRNb2RlOiAxLFxuICAgICAgICAgIHNvdXJjZVVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZG9tUGFnZS50b3RhbCA+IDAgJiYgKCF0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgfHwgdGhpcy5ib29rSW5mby50b3RhbFBhZ2VzIDwgZG9tUGFnZS50b3RhbCkpIHtcbiAgICAgICAgICB0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgPSBkb21QYWdlLnRvdGFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYm9va0luZm87XG4gIH1cblxuICBnZXRDdXJyZW50UGFnZSgpOiBudW1iZXIgfCBudWxsIHtcbiAgICAvLyAxLiBDaGVjayBzdGF0dXMgLyBwYWdlIGluZGljYXRvciBzcGFucyBhY3Jvc3MgQm9va1JlYWRlciB2ZXJzaW9ucyAoYXV0aG9yaXRhdGl2ZTogLkJSY3VycmVudHBhZ2UpXG4gICAgY29uc3QgY3VycmVudFNwYW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0sIC5wYWdlLW51bWJlciwgLkJScGFnZXItY291bnRlcicpO1xuICAgIGlmIChjdXJyZW50U3BhbiAmJiBjdXJyZW50U3Bhbi50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VBcmNoaXZlRG9tUGFnZShjdXJyZW50U3Bhbi50ZXh0Q29udGVudCk7XG4gICAgICBpZiAocGFyc2VkICYmIHR5cGVvZiBwYXJzZWQuY3VycmVudCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlZC5jdXJyZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIFZpc2libGUgLyBzZWxlY3RlZCBwYWdlIGNvbnRhaW5lciBpbiBET01cbiAgICBjb25zdCB2aXNpYmxlQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICcuQlJwYWdlY29udGFpbmVyLkJScGFnZS12aXNpYmxlLCAuQlJwYWdlY29udGFpbmVyLS1oYXNTZWxlY3Rpb24sIC5CUnBhZ2UuYWN0aXZlJ1xuICAgICk7XG4gICAgaWYgKHZpc2libGVDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IGlkeEF0dHIgPSB2aXNpYmxlQ29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1pbmRleCcpIHx8IHZpc2libGVDb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXBhZ2UnKTtcbiAgICAgIGlmIChpZHhBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KGlkeEF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIENoZWNrIGlucHV0IGZpZWxkcyB1c2VkIGZvciBwYWdlIGp1bXBpbmdcbiAgICBjb25zdCBwYWdlSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dC5CUnBhZ2VpbnB1dCwgaW5wdXQucGFnZS1udW1iZXItaW5wdXQsIGlucHV0W25hbWU9XCJwYWdlXCJdJyk7XG4gICAgaWYgKHBhZ2VJbnB1dCAmJiBwYWdlSW5wdXQudmFsdWUpIHtcbiAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHBhZ2VJbnB1dC52YWx1ZSwgMTApO1xuICAgICAgaWYgKCFpc05hTih2YWwpKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uIEFyY2hpdmUub3JnLi4uJyk7XG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ1NXSVRDSF9NT0RFXzEnKTtcblxuICAgIC8vIEFjY29tbW9kYXRlIG11bHRpcGxlIGJ1dHRvbiBzZWxlY3RvcnMgYWNyb3NzIEJvb2tSZWFkZXIgdmVyc2lvbnNcbiAgICBjb25zdCBvbmVQYWdlQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvbi5vbmUtcGFnZSwgLkJScGFnZXZpZXcxLCBidXR0b25bZGF0YS1tb2RlPVwiMVwiXSwgW2FyaWEtbGFiZWwqPVwiMS1wYWdlXCIgaV0sIC5CUmljb25fb25lcGFnZSwgLnZpZXctbW9kZS0xdXAnXG4gICAgKTtcbiAgICBpZiAob25lUGFnZUJ0biAmJiAhb25lUGFnZUJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpICYmIG9uZVBhZ2VCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnKSAhPT0gJ3RydWUnKSB7XG4gICAgICB0cnkgeyBvbmVQYWdlQnRuLmNsaWNrKCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgbmF2aWdhdGVUb1BhZ2UocGFnZU51bTogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBBcmNoaXZlIGxlYWYgJHtwYWdlTnVtfS4uLmApO1xuICAgIHRoaXMucG9zdFRvQnJpZGdlKCdKVU1QX1BBR0UnLCB7IGxlYWZJbmRleDogcGFnZU51bSB9KTtcblxuICAgIGlmIChwYWdlTnVtID09PSAwKSB7XG4gICAgICBjb25zdCBmaXJzdEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgICAnYnV0dG9uW3RpdGxlKj1cIkZpcnN0IHBhZ2VcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmlyc3QgcGFnZVwiIGldLCBidXR0b24ubmF2Zmlyc3QsIC5ib29rLWZsaXAtZmlyc3QsIC5CUm5hdmZpcnN0LCBbYXJpYS1sYWJlbD1cIkZpcnN0IHBhZ2VcIiBpXSdcbiAgICAgICk7XG4gICAgICBpZiAoZmlyc3RCdG4pIHtcbiAgICAgICAgdHJ5IHsgZmlyc3RCdG4uY2xpY2soKTsgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cblxuICAgICAgY29uc3QgaG9tZUV2ZW50ID0geyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBrZXk6ICdIb21lJywgY29kZTogJ0hvbWUnLCBrZXlDb2RlOiAzNiwgd2hpY2g6IDM2IH07XG4gICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBob21lRXZlbnQpKTtcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgaG9tZUV2ZW50KSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW06IG51bWJlcik6IHZvaWQge1xuICAgIC8vIDEuIERpcmVjdCBCb29rUmVhZGVyIEFQSSBjYWxsIHZpYSBicmlkZ2UgKG1vc3QgcmVsaWFibGUgaW4gTUFJTiB3b3JsZCwgc3VwcG9ydHMgYnIuanVtcFRvSW5kZXggJiB2ZXJzaW9ucylcbiAgICB0aGlzLnBvc3RUb0JyaWRnZSgnRkxJUF9ORVhUJywgeyB0YXJnZXRQYWdlOiB0YXJnZXRQYWdlTnVtIH0pO1xuXG4gICAgLy8gMi4gRE9NIGJ1dHRvbiBjbGljayBmYWxsYmFjayBhY3Jvc3MgbXVsdGlwbGUgQm9va1JlYWRlciB2ZXJzaW9ucyAob25seSBpZiBuZWVkZWQpXG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblt0aXRsZSo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uLm5hdm5leHQsIC5ib29rLWZsaXAtcmlnaHQsIC5CUm5hdm5leHQsIFthcmlhLWxhYmVsPVwiTmV4dCBwYWdlXCIgaV0sIFtkYXRhLWFjdGlvbj1cIm5leHQtcGFnZVwiIGldLCAuQlJpY29uX2ZsaXBfcmlnaHQsIGJ1dHRvbi5wYWdlLW5leHQnXG4gICAgKTtcbiAgICBpZiAobmV4dEJ0bikge1xuICAgICAgdHJ5IHsgbmV4dEJ0bi5jbGljaygpOyB9IGNhdGNoIChlKSB7fVxuICAgIH1cbiAgfVxuXG4gIGdldEFjdGl2ZVBhZ2VJbWFnZShtaW5XaWR0aCA9IDIwMCwgdGFyZ2V0UGFnZU51bT86IG51bWJlcik6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsIHtcbiAgICAvLyAxLiBQcmlvcml0eSAjMTogQWN0aXZlbHkgdmlzaWJsZSBwYWdlIGNvbnRhaW5lciBpbiB0aGUgQm9va1JlYWRlciBET01cbiAgICBjb25zdCB2aXNpYmxlQ29udGFpbmVycyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXG4gICAgICAnLkJScGFnZWNvbnRhaW5lci5CUnBhZ2UtdmlzaWJsZSwgLkJScGFnZWNvbnRhaW5lci0taGFzU2VsZWN0aW9uLCAuQlJwYWdlLmFjdGl2ZSwgLkJScGFnZXZpZXcnXG4gICAgKSk7XG4gICAgZm9yIChjb25zdCBjb250YWluZXIgb2YgdmlzaWJsZUNvbnRhaW5lcnMpIHtcbiAgICAgIGlmICghY29udGFpbmVyIHx8IChjb250YWluZXIgYXMgYW55KS50YWdOYW1lID09PSAnSU1HJyB8fCB0eXBlb2YgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwgIT09ICdmdW5jdGlvbicpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgaW1ncyA9IEFycmF5LmZyb20oY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEltYWdlRWxlbWVudD4oXG4gICAgICAgICdpbWcuQlJwYWdlaW1hZ2UsIGltZ1tjbGFzcyo9XCJCUnBhZ2VcIl0sIGltZ1tzcmMqPVwiQm9va1JlYWRlckltYWdlcy5waHBcIl0sIGltZydcbiAgICAgICkpO1xuICAgICAgZm9yIChjb25zdCBpbWcgb2YgaW1ncykge1xuICAgICAgICBpZiAoaXNJbWFnZUxvYWRlZChpbWcsIG1pbldpZHRoKSkge1xuICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0UGFnZU51bSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGltZy5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVOdW0gPSBwYXJzZUFyY2hpdmVJbWFnZVVybFBhZ2UoaW1nLnNyYyk7XG4gICAgICAgICAgICBpZiAoZmlsZU51bSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aGlzLmRldGVjdGVkT2Zmc2V0ID0gZmlsZU51bSAtIHRhcmdldFBhZ2VOdW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpbWc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBQcmlvcml0eSAjMjogQ29udGFpbmVyIG1hdGNoaW5nIHRhcmdldFBhZ2VOdW0gaWYgc3BlY2lmaWVkXG4gICAgaWYgKHR5cGVvZiB0YXJnZXRQYWdlTnVtID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgdGFyZ2V0U2VsZWN0b3JzID0gW1xuICAgICAgICBgLkJScGFnZWNvbnRhaW5lcltkYXRhLWluZGV4PVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWcuQlJwYWdlaW1hZ2VgLFxuICAgICAgICBgLkJScGFnZWNvbnRhaW5lcltkYXRhLWluZGV4PVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWdgLFxuICAgICAgICBgLnBhZ2VkaXYke3RhcmdldFBhZ2VOdW19IGltZy5CUnBhZ2VpbWFnZWAsXG4gICAgICAgIGAucGFnZWRpdiR7dGFyZ2V0UGFnZU51bX0gaW1nYCxcbiAgICAgICAgYFtkYXRhLWluZGV4PVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWcuQlJwYWdlaW1hZ2VgLFxuICAgICAgICBgW2RhdGEtaW5kZXg9XCIke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGBbZGF0YS1wYWdlLW51bT1cIm4ke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGAuQlJwYWdlW2RhdGEtcGFnZT1cIiR7dGFyZ2V0UGFnZU51bX1cIl0gaW1nYCxcbiAgICAgICAgYC5CUnBhZ2VbZGF0YS1sZWFmPVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWdgLFxuICAgICAgICBgI3BhZ2VkaXYke3RhcmdldFBhZ2VOdW19IGltZ2AsXG4gICAgICAgIGAjcGFnZSR7dGFyZ2V0UGFnZU51bX0gaW1nYCxcbiAgICAgIF07XG4gICAgICBmb3IgKGNvbnN0IHNlbCBvZiB0YXJnZXRTZWxlY3RvcnMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbWFnZUVsZW1lbnQ+KHNlbCk7XG4gICAgICAgIGlmIChpc0ltYWdlTG9hZGVkKGVsLCBtaW5XaWR0aCkpIHtcbiAgICAgICAgICBlbC5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICBjb25zdCBmaWxlTnVtID0gcGFyc2VBcmNoaXZlSW1hZ2VVcmxQYWdlKGVsLnNyYyk7XG4gICAgICAgICAgaWYgKGZpbGVOdW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZzZXQgPSBmaWxlTnVtIC0gdGFyZ2V0UGFnZU51bTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRhcmdldCBjb250YWluZXIgZXhpc3RzIGluIERPTSBidXQgaXRzIGltYWdlIGlzIG5vdCB5ZXQgbG9hZGVkLFxuICAgICAgLy8gd2FpdCBmb3IgaXQgcmF0aGVyIHRoYW4gZ3JhYmJpbmcgYW4gb2xkIG9mZnNjcmVlbiBpbWFnZVxuICAgICAgY29uc3QgY29udGFpbmVyQ2hlY2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICBgLkJScGFnZWNvbnRhaW5lcltkYXRhLWluZGV4PVwiJHt0YXJnZXRQYWdlTnVtfVwiXSwgLnBhZ2VkaXYke3RhcmdldFBhZ2VOdW19LCBbZGF0YS1pbmRleD1cIiR7dGFyZ2V0UGFnZU51bX1cIl1gXG4gICAgICApO1xuICAgICAgaWYgKGNvbnRhaW5lckNoZWNrKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIFByaW9yaXR5ICMzOiBBbnkgY2FuZGlkYXRlIGJvb2sgc2NhbiBpbWFnZSBhY3Jvc3MgdGhlIERPTSB0aGF0IGlzIGxvYWRlZFxuICAgIGNvbnN0IGFsbEltYWdlcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PihcbiAgICAgICdpbWcuQlJwYWdlaW1hZ2UsIC5CUnBhZ2Vjb250YWluZXIgaW1nLCAuQlJwYWdlIGltZywgaW1nW3NyYyo9XCJCb29rUmVhZGVySW1hZ2VzLnBocFwiXSwgaW1nW3NyYyo9XCIvQm9va1JlYWRlci9cIl0sIC5ib29rLXBhZ2UgaW1nJ1xuICAgICkpLmZpbHRlcihpbWcgPT4gaXNJbWFnZUxvYWRlZChpbWcsIG1pbldpZHRoKSk7XG5cbiAgICBpZiAoYWxsSW1hZ2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICAvLyBJZiB0YXJnZXRQYWdlTnVtIGlzIHNwZWNpZmllZCwgZG9uJ3QgcmV0dXJuIGFuIGltYWdlIHdob3NlIFVSTCBiZWxvbmdzIHRvIGFuIGVhcmxpZXIgcGFnZVxuICAgIGlmICh0eXBlb2YgdGFyZ2V0UGFnZU51bSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnN0IGZpbHRlcmVkID0gYWxsSW1hZ2VzLmZpbHRlcihpbWcgPT4ge1xuICAgICAgICBjb25zdCBmaWxlTnVtID0gcGFyc2VBcmNoaXZlSW1hZ2VVcmxQYWdlKGltZy5zcmMpO1xuICAgICAgICBpZiAoZmlsZU51bSA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZGV0ZWN0ZWRPZmZzZXQgPz8gMDtcbiAgICAgICAgcmV0dXJuIGZpbGVOdW0gPj0gdGFyZ2V0UGFnZU51bSArIG9mZnNldDtcbiAgICAgIH0pO1xuICAgICAgaWYgKGZpbHRlcmVkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCBleGFjdE1hdGNoID0gZmlsdGVyZWQuZmluZChpbWcgPT4ge1xuICAgICAgICBjb25zdCBmbiA9IHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZShpbWcuc3JjKTtcbiAgICAgICAgcmV0dXJuIGZuID09PSB0YXJnZXRQYWdlTnVtIHx8ICh0aGlzLmRldGVjdGVkT2Zmc2V0ICE9PSBudWxsICYmIGZuID09PSB0YXJnZXRQYWdlTnVtICsgdGhpcy5kZXRlY3RlZE9mZnNldCk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGNob3NlbiA9IGV4YWN0TWF0Y2ggfHwgZmlsdGVyZWRbZmlsdGVyZWQubGVuZ3RoIC0gMV07XG4gICAgICBjaG9zZW4uZGF0YXNldC5zZXEgPSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICByZXR1cm4gY2hvc2VuO1xuICAgIH1cblxuICAgIC8vIFBpY2sgdGhlIGltYWdlIHdpdGggdGhlIGxhcmdlc3QgdmlzaWJsZSBhcmVhIGluIHRoZSB2aWV3cG9ydFxuICAgIGxldCBiZXN0SW1nOiBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IG1heFZpc2libGVBcmVhID0gMDtcbiAgICBjb25zdCB3aW5XID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuaW5uZXJXaWR0aCA6IDE5MjA7XG4gICAgY29uc3Qgd2luSCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmlubmVySGVpZ2h0IDogMTA4MDtcblxuICAgIGZvciAoY29uc3QgaW1nIG9mIGFsbEltYWdlcykge1xuICAgICAgY29uc3QgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHZpc2libGVXaWR0aCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QucmlnaHQsIHdpblcpIC0gTWF0aC5tYXgocmVjdC5sZWZ0LCAwKSk7XG4gICAgICBjb25zdCB2aXNpYmxlSGVpZ2h0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5ib3R0b20sIHdpbkgpIC0gTWF0aC5tYXgocmVjdC50b3AsIDApKTtcbiAgICAgIGNvbnN0IGFyZWEgPSB2aXNpYmxlV2lkdGggKiB2aXNpYmxlSGVpZ2h0O1xuXG4gICAgICBpZiAoYXJlYSA+IG1heFZpc2libGVBcmVhICYmIHZpc2libGVXaWR0aCA+IDUwICYmIHZpc2libGVIZWlnaHQgPiA1MCkge1xuICAgICAgICBtYXhWaXNpYmxlQXJlYSA9IGFyZWE7XG4gICAgICAgIGJlc3RJbWcgPSBpbWc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY2hvc2VuID0gYmVzdEltZyB8fCBhbGxJbWFnZXNbYWxsSW1hZ2VzLmxlbmd0aCAtIDFdIHx8IG51bGw7XG4gICAgaWYgKGNob3NlbiAmJiB0eXBlb2YgdGFyZ2V0UGFnZU51bSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNob3Nlbi5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICB9XG4gICAgcmV0dXJuIGNob3NlbjtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RQYWdlVGV4dChwYWdlTnVtOiBudW1iZXIsIGltZz86IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyAxLiBDaGVjayBpZiBpbnRlcmNlcHRlZCBmcm9tIEJvb2tSZWFkZXIncyBuZXR3b3JrIGNhbGxcbiAgICBpZiAodGhpcy50ZXh0Q2FjaGUuaGFzKHBhZ2VOdW0pKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0Q2FjaGUuZ2V0KHBhZ2VOdW0pITtcbiAgICB9XG5cbiAgICAvLyAyLiBXYWl0IGJyaWVmbHkgKHVwIHRvIDIwMG1zKSBpbiBjYXNlIEJvb2tSZWFkZXIncyBiYWNrZ3JvdW5kIHJlcXVlc3QgaXMgY3VycmVudGx5IGluLWZsaWdodFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy50ZXh0Q2FjaGUuaGFzKHBhZ2VOdW0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHRDYWNoZS5nZXQocGFnZU51bSkhO1xuICAgICAgfVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnRleHRDYWNoZS5oYXMocGFnZU51bSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnRleHRDYWNoZS5nZXQocGFnZU51bSkhO1xuICAgIH1cblxuICAgIC8vIDMuIERlcml2ZSBzZXJ2ZXIgYW5kIGJvb2tQYXRoIGZyb20gYm9va0luZm8gb3IgZHluYW1pY2FsbHkgZnJvbSBhY3RpdmUgcGFnZSBpbWFnZSBVUkxcbiAgICBsZXQgc2VydmVyID0gdGhpcy5ib29rSW5mbz8uc2VydmVyIHx8ICcnO1xuICAgIGxldCBib29rUGF0aCA9IHRoaXMuYm9va0luZm8/LmJvb2tQYXRoIHx8ICcnO1xuXG4gICAgY29uc3QgY2FuZGlkYXRlU3JjID0gaW1nPy5zcmMgfHwgdGhpcy5nZXRBY3RpdmVQYWdlSW1hZ2UoMzAwLCBwYWdlTnVtKT8uc3JjO1xuICAgIGlmICgoIXNlcnZlciB8fCAhYm9va1BhdGgpICYmIGNhbmRpZGF0ZVNyYyAmJiBjYW5kaWRhdGVTcmMuaW5jbHVkZXMoJ0Jvb2tSZWFkZXJJbWFnZXMucGhwJykpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKGNhbmRpZGF0ZVNyYyk7XG4gICAgICAgIGlmICghc2VydmVyKSBzZXJ2ZXIgPSB1Lmhvc3Q7XG4gICAgICAgIGNvbnN0IHppcFBhcmFtID0gdS5zZWFyY2hQYXJhbXMuZ2V0KCd6aXAnKTtcbiAgICAgICAgY29uc3QgaWRQYXJhbSA9IHUuc2VhcmNoUGFyYW1zLmdldCgnaWQnKTtcbiAgICAgICAgaWYgKCFib29rUGF0aCkge1xuICAgICAgICAgIGlmICh6aXBQYXJhbSkge1xuICAgICAgICAgICAgYm9va1BhdGggPSB6aXBQYXJhbS5yZXBsYWNlKC9fW2EtekEtWjAtOV0rXFwuemlwJC9pLCAnJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpZFBhcmFtKSB7XG4gICAgICAgICAgICBib29rUGF0aCA9IGAvMC9pdGVtcy8ke2lkUGFyYW19LyR7aWRQYXJhbX1gO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5ib29rSW5mbykge1xuICAgICAgICAgIGlmICghdGhpcy5ib29rSW5mby5zZXJ2ZXIgJiYgc2VydmVyKSB0aGlzLmJvb2tJbmZvLnNlcnZlciA9IHNlcnZlcjtcbiAgICAgICAgICBpZiAoIXRoaXMuYm9va0luZm8uYm9va1BhdGggJiYgYm9va1BhdGgpIHRoaXMuYm9va0luZm8uYm9va1BhdGggPSBib29rUGF0aDtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBpZiAoIXNlcnZlciB8fCAhYm9va1BhdGgpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBsZWFmSW5kZXggPSBwYWdlTnVtO1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7c2VydmVyfS9Cb29rUmVhZGVyL0Jvb2tSZWFkZXJHZXRUZXh0V3JhcHBlci5waHA/cGF0aD0ke2VuY29kZVVSSUNvbXBvbmVudChib29rUGF0aCl9X2RqdnUueG1sJm1vZGU9ZGp2dV94bWwmcGFnZT0ke2xlYWZJbmRleH1gO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScsXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiAnJztcbiAgICAgIGNvbnN0IHhtbCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIGNvbnN0IHRleHQgPSBwYXJzZURqdnVYbWxUb1RleHQoeG1sKTtcbiAgICAgIHRoaXMudGV4dENhY2hlLnNldChsZWFmSW5kZXgsIHRleHQpO1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gQ291bGQgbm90IGZldGNoIHRleHQgZm9yIGxlYWYgJHtsZWFmSW5kZXh9OmAsIGVycik7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9XG5cbiAgaXNBdEVuZE9mQm9vayhjdXJyZW50UGFnZTogbnVtYmVyLCB0b3RhbFBhZ2VzOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b24ubmF2bmV4dCwgLmJvb2stZmxpcC1yaWdodCwgLkJSbmF2bmV4dCwgW2FyaWEtbGFiZWw9XCJOZXh0IHBhZ2VcIiBpXSwgW2RhdGEtYWN0aW9uPVwibmV4dC1wYWdlXCIgaV0nXG4gICAgKTtcbiAgICBjb25zdCBpc05leHREaXNhYmxlZCA9IG5leHRCdG4gJiYgKFxuICAgICAgbmV4dEJ0bi5kaXNhYmxlZCB8fFxuICAgICAgbmV4dEJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtZGlzYWJsZWQnKSA9PT0gJ3RydWUnIHx8XG4gICAgICBuZXh0QnRuLmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZWQnKVxuICAgICk7XG4gICAgY29uc3QgZG9tTGVhZiA9IHRoaXMuZ2V0Q3VycmVudFBhZ2UoKTtcbiAgICByZXR1cm4gQm9vbGVhbihpc05leHREaXNhYmxlZCB8fCAodG90YWxQYWdlcyA+IDAgJiYgZG9tTGVhZiAhPT0gbnVsbCAmJiBkb21MZWFmID49IHRvdGFsUGFnZXMgJiYgY3VycmVudFBhZ2UgPj0gdG90YWxQYWdlcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBwb3N0VG9CcmlkZ2UoYWN0aW9uOiBzdHJpbmcsIGV4dHJhRGF0YTogYW55ID0ge30pIHtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoeyBkaXJlY3Rpb246ICdUT19CUklER0UnLCBhY3Rpb24sIC4uLmV4dHJhRGF0YSB9LCAnKicpO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0UGFnZUluZm9Gcm9tRG9tKCk6IHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0gfCBudWxsIHtcbiAgICBjb25zdCBwYWdlRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0nKTtcbiAgICBpZiAocGFnZUVsICYmIHBhZ2VFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VBcmNoaXZlRG9tUGFnZShwYWdlRWwudGV4dENvbnRlbnQpO1xuICAgICAgaWYgKHBhcnNlZCkgcmV0dXJuIHBhcnNlZDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCb29rSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0IH0gZnJvbSAnLi4vdXRpbHMvbWFya2Rvd24tYnVpbGRlcic7XG5cbmV4cG9ydCBjbGFzcyBIYXRoaVRydXN0UHJvdmlkZXIgaW1wbGVtZW50cyBCb29rUHJvdmlkZXIge1xuICByZWFkb25seSBzaXRlSWQgPSAnaGF0aGl0cnVzdCcgYXMgY29uc3Q7XG4gIHJlYWRvbmx5IHNpdGVOYW1lID0gJ0hhdGhpVHJ1c3QnO1xuICByZWFkb25seSBkZWZhdWx0U3RhcnRQYWdlID0gMTsgLy8gSGF0aGlUcnVzdCBzZXF1ZW5jZXMgYXJlIDEtYmFzZWRcblxuICBwcml2YXRlIGJvb2tJbmZvOiBCb29rSW5mbyB8IG51bGwgPSBudWxsO1xuXG4gIC8vIFRyYWNraW5nIGxvYWRlZCBzZXF1ZW5jZXMgZnJvbSBNQUlOIHdvcmxkIGJyaWRnZVxuICBwcml2YXRlIGFubm91bmNlZFNlcXVlbmNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBwcml2YXRlIHNlcVRvQmxvYlVybCA9IG5ldyBNYXA8bnVtYmVyLCBzdHJpbmc+KCk7XG4gIHByaXZhdGUgYmxvYlVybFRvU2VxID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBzZXFUb0h0bWwgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIExpc3RlbiBmb3IgYnJpZGdlIG1lc3NhZ2VzICh3b3JsZDogTUFJTilcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ0ZST01fQlJJREdFJykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhO1xuICAgICAgICBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9MT0FEX0FOTk9VTkNFRCcpIHtcbiAgICAgICAgICBpZiAobXNnLmlzTG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmFubm91bmNlZFNlcXVlbmNlcy5hZGQobXNnLnNlcSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBIYXRoaVRydXN0IGFubm91bmNlZCBzZXF1ZW5jZSAke21zZy5zZXF9IGxvYWRlZGApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0lNQUdFX1JFQURZJykge1xuICAgICAgICAgIHRoaXMuc2VxVG9CbG9iVXJsLnNldChtc2cuc2VxLCBtc2cuYmxvYlVybCk7XG4gICAgICAgICAgdGhpcy5ibG9iVXJsVG9TZXEuc2V0KG1zZy5ibG9iVXJsLCBtc2cuc2VxKTtcbiAgICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgICAgdGhpcy5zZXFUb0h0bWwuc2V0KG1zZy5zZXEsIG1zZy5odG1sKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgb25QYWdlTG9hZEFubm91bmNlZChzZXE6IG51bWJlciwgaXNWaXNpYmxlOiBib29sZWFuLCBpc0xvYWRlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChpc0xvYWRlZCkge1xuICAgICAgdGhpcy5hbm5vdW5jZWRTZXF1ZW5jZXMuYWRkKHNlcSk7XG4gICAgfVxuICB9XG5cbiAgb25QYWdlSW1hZ2VSZWFkeShzZXE6IG51bWJlciwgYmxvYlVybDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zZXFUb0Jsb2JVcmwuc2V0KHNlcSwgYmxvYlVybCk7XG4gICAgdGhpcy5ibG9iVXJsVG9TZXEuc2V0KGJsb2JVcmwsIHNlcSk7XG4gIH1cblxuICBvblBhZ2VUZXh0UmVhZHkoc2VxOiBudW1iZXIsIGh0bWw6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc2VxVG9IdG1sLnNldChzZXEsIGh0bWwpO1xuICB9XG5cbiAgZ2V0QmxvYlVybEZvclNlcShzZXE6IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuc2VxVG9CbG9iVXJsLmdldChzZXEpO1xuICB9XG5cbiAgZ2V0Q2FjaGVkSHRtbEZvclNlcShzZXE6IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuc2VxVG9IdG1sLmdldChzZXEpO1xuICB9XG5cbiAgaXNQYWdlQW5ub3VuY2VkKHNlcTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYW5ub3VuY2VkU2VxdWVuY2VzLmhhcyhzZXEpO1xuICB9XG5cbiAgaXNNYXRjaCgpOiBib29sZWFuIHtcbiAgICBjb25zdCBpc0hvc3QgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09ICdiYWJlbC5oYXRoaXRydXN0Lm9yZycgfHxcbiAgICAgICAgICAgICAgICAgICAod2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdoYXRoaXRydXN0Lm9yZycpICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zdGFydHNXaXRoKCcvY2dpL3B0JykpO1xuICAgIHJldHVybiBpc0hvc3Q7XG4gIH1cblxuICBhc3luYyBkZXRlY3RCb29rSW5mbygpOiBQcm9taXNlPEJvb2tJbmZvIHwgbnVsbD4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgY29uc3QgYm9va0lkID0gcGFyYW1zLmdldCgnaWQnKSB8fCAnaGF0aGl0cnVzdF9ib29rJztcblxuICAgIC8vIDEuIERldGVjdCBCb29rIFRpdGxlXG4gICAgbGV0IGJvb2tUaXRsZSA9ICcnO1xuICAgIGNvbnN0IG1ldGFUaXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTE1ldGFFbGVtZW50PignbWV0YVtuYW1lPVwiREMudGl0bGVcIl0sIG1ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScpO1xuICAgIGlmIChtZXRhVGl0bGUgJiYgbWV0YVRpdGxlLmNvbnRlbnQpIHtcbiAgICAgIGJvb2tUaXRsZSA9IG1ldGFUaXRsZS5jb250ZW50LnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKCFib29rVGl0bGUpIHtcbiAgICAgIGNvbnN0IGgxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDEudGl0bGUsIGgxLml0ZW0tdGl0bGUsIGgxJyk7XG4gICAgICBpZiAoaDEgJiYgaDEudGV4dENvbnRlbnQpIHtcbiAgICAgICAgYm9va1RpdGxlID0gaDEudGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWJvb2tUaXRsZSkge1xuICAgICAgYm9va1RpdGxlID0gZG9jdW1lbnQudGl0bGUgPyBkb2N1bWVudC50aXRsZS5yZXBsYWNlKC9bLXxdXFxzKkhhdGhpVHJ1c3QuKi9pLCAnJykudHJpbSgpIDogJ0hhdGhpVHJ1c3QgQm9vayc7XG4gICAgfVxuXG4gICAgLy8gMi4gRGV0ZWN0IFRvdGFsIFBhZ2VzXG4gICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMuZ2V0VG90YWxQYWdlc0Zyb21Eb20oKTtcblxuICAgIC8vIDMuIERldGVjdCBDdXJyZW50IFNlcXVlbmNlXG4gICAgY29uc3QgY3VycmVudFNlcSA9IHRoaXMuZ2V0Q3VycmVudFBhZ2UoKSB8fCAxO1xuXG4gICAgLy8gQ2hlY2sgYXV0aG9yIGFuZCB5ZWFyIGlmIHByZXNlbnQgaW4gbWV0YWRhdGFcbiAgICBjb25zdCBhdXRob3JNZXRhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy5jcmVhdG9yXCJdJyk7XG4gICAgY29uc3QgYXV0aG9yID0gYXV0aG9yTWV0YT8uY29udGVudDtcblxuICAgIGNvbnN0IGRhdGVNZXRhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy5kYXRlXCJdJyk7XG4gICAgY29uc3QgeWVhciA9IGRhdGVNZXRhPy5jb250ZW50O1xuXG4gICAgdGhpcy5ib29rSW5mbyA9IHtcbiAgICAgIGJvb2tJZCxcbiAgICAgIGJvb2tUaXRsZTogYm9va1RpdGxlIHx8ICdIYXRoaVRydXN0IEJvb2snLFxuICAgICAgdG90YWxQYWdlczogdG90YWxQYWdlcyB8fCA1MDAsXG4gICAgICBjdXJyZW50TGVhZjogY3VycmVudFNlcSxcbiAgICAgIGN1cnJlbnRNb2RlOiAxLFxuICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgIGF1dGhvcixcbiAgICAgIHllYXIsXG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEhhdGhpVHJ1c3Qgdm9sdW1lIGRldGVjdGVkOicsIHRoaXMuYm9va0luZm8uYm9va1RpdGxlLCBgKCR7dGhpcy5ib29rSW5mby50b3RhbFBhZ2VzfSBwYWdlcylgKTtcbiAgICByZXR1cm4gdGhpcy5ib29rSW5mbztcbiAgfVxuXG4gIGdldEN1cnJlbnRQYWdlKCk6IG51bWJlciB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDEuIENoZWNrIHRvb2xiYXIgaW5wdXRcbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuICAgIGlmIChzZXFJbnB1dCAmJiBzZXFJbnB1dC52YWx1ZSkge1xuICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoc2VxSW5wdXQudmFsdWUsIDEwKTtcbiAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIC8vIDIuIENoZWNrIFVSTCBzZWFyY2ggcGFyYW1cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpIHtcbiAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICBjb25zdCBzZXEgPSBwYXJhbXMuZ2V0KCdzZXEnKTtcbiAgICAgIGlmIChzZXEpIHtcbiAgICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoc2VxLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIENoZWNrIGRhdGEtc2VxIG9uIGFjdGl2ZSBmaWd1cmUgb3Igc3ByZWFkXG4gICAgY29uc3QgYWN0aXZlRmlnID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LnNwcmVhZCBmaWd1cmVbZGF0YS1zZXFdLCBmaWd1cmVbZGF0YS1zZXFdJyk7XG4gICAgaWYgKGFjdGl2ZUZpZykge1xuICAgICAgY29uc3Qgc2VxQXR0ciA9IGFjdGl2ZUZpZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJyk7XG4gICAgICBpZiAoc2VxQXR0cikge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChzZXFBdHRyLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgbmF2aWdhdGVUb1BhZ2UocGFnZU51bTogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBIYXRoaVRydXN0IHNlcXVlbmNlICR7cGFnZU51bX0uLi5gKTtcbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuXG4gICAgaWYgKHNlcUlucHV0KSB7XG4gICAgICBzZXFJbnB1dC5mb2N1cygpO1xuICAgICAgc2VxSW5wdXQudmFsdWUgPSBTdHJpbmcocGFnZU51bSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgc2VxSW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NoYW5nZScsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG5cbiAgICAgIC8vIERpc3BhdGNoIEVudGVyIGtleWRvd24gZXZlbnRcbiAgICAgIGNvbnN0IGVudGVyRXZlbnQgPSBuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIHtcbiAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAga2V5OiAnRW50ZXInLFxuICAgICAgICBjb2RlOiAnRW50ZXInLFxuICAgICAgICBrZXlDb2RlOiAxMyxcbiAgICAgICAgd2hpY2g6IDEzLFxuICAgICAgfSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KGVudGVyRXZlbnQpO1xuXG4gICAgICAvLyBTdWJtaXQgcGFyZW50IGZvcm0gaWYgcHJlc2VudFxuICAgICAgY29uc3QgZm9ybSA9IHNlcUlucHV0LmNsb3Nlc3QoJ2Zvcm0nKTtcbiAgICAgIGlmIChmb3JtKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmb3JtLnJlcXVlc3RTdWJtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGZvcm0ucmVxdWVzdFN1Ym1pdCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdzdWJtaXQnLCB7IGJ1YmJsZXM6IHRydWUsIGNhbmNlbGFibGU6IHRydWUgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtOiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyAxLiBQcmltYXJ5OiBDbGljayBOZXh0IFBhZ2UgYnV0dG9uXG4gICAgLy8gPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLW91dGxpbmUtZGFya1wiIGFyaWEtbGFiZWw9XCJOZXh0IFBhZ2VcIj48aSBjbGFzcz1cImZhLXNvbGlkIGZhLWFuZ2xlLXJpZ2h0XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjwvYnV0dG9uPlxuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50IHwgSFRNTEFuY2hvckVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblthcmlhLWxhYmVsPVwiTmV4dCBQYWdlXCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIk5leHRcIiBpXSwgYnV0dG9uW3RpdGxlKj1cIk5leHRcIiBpXSwgW2FjY2Vzc2tleT1cIm5cIl0sIGJ1dHRvbi5uZXh0LCBhLmFjdGlvbi1uZXh0LXBhZ2UnXG4gICAgKTtcbiAgICBpZiAobmV4dEJ0bikge1xuICAgICAgY29uc3QgZGlzYWJsZWQgPSAobmV4dEJ0biBhcyBhbnkpLmRpc2FibGVkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLWRpc2FibGVkJykgPT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0QnRuLmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZWQnKTtcbiAgICAgIGlmICghZGlzYWJsZWQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBDbGlja2luZyBIYXRoaVRydXN0IE5leHQgUGFnZSBidXR0b24uLi4nKTtcbiAgICAgICAgICBuZXh0QnRuLmNsaWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIEtleWJvYXJkIEFycm93UmlnaHQgZXZlbnQgKHN0YW5kYXJkIHJlYWRlciBob3RrZXkpXG4gICAgY29uc3Qga2V5RXZlbnQgPSB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgIGtleTogJ0Fycm93UmlnaHQnLFxuICAgICAgY29kZTogJ0Fycm93UmlnaHQnLFxuICAgICAga2V5Q29kZTogMzksXG4gICAgICB3aGljaDogMzksXG4gICAgfTtcbiAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywga2V5RXZlbnQpKTtcblxuICAgIC8vIDMuIEZhbGxiYWNrOiBvbmx5IGlmIE5leHQgYnV0dG9uIGlzIG5vdCBhdmFpbGFibGUsIHVzZSBzZXF1ZW5jZSBpbnB1dFxuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG4gICAgaWYgKHNlcUlucHV0KSB7XG4gICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBGYWxsYmFjayB0byBzZXF1ZW5jZSBpbnB1dCAke3RhcmdldFBhZ2VOdW19Li4uYCk7XG4gICAgICB0aGlzLm5hdmlnYXRlVG9QYWdlKHRhcmdldFBhZ2VOdW0pO1xuICAgIH1cbiAgfVxuXG4gIGdldEFjdGl2ZVBhZ2VJbWFnZShtaW5XaWR0aCA9IDMwMCwgdGFyZ2V0U2VxPzogbnVtYmVyKTogSFRNTEltYWdlRWxlbWVudCB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDEuIElmIHRhcmdldFNlcSBpcyBzcGVjaWZpZWQgKGR1cmluZyBzZXF1ZW50aWFsIGNhcHR1cmUpXG4gICAgaWYgKHR5cGVvZiB0YXJnZXRTZXEgPT09ICdudW1iZXInKSB7XG4gICAgICBjb25zdCBjdXJyZW50U2VxID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgLy8gSWYgdGhlIHJlYWRlciB0b29sYmFyIGhhcyBub3QgcmVhY2hlZCB0YXJnZXRTZXEgeWV0LCB3YWl0IVxuICAgICAgaWYgKGN1cnJlbnRTZXEgIT09IG51bGwgJiYgY3VycmVudFNlcSA8IHRhcmdldFNlcSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYW4gaW1hZ2UgZXhwbGljaXRseSB0YWdnZWQgd2l0aCB0YXJnZXRTZXFcbiAgICAgIGNvbnN0IHRhZ2dlZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEltYWdlRWxlbWVudD4oYGltZ1tkYXRhLXNlcT1cIiR7dGFyZ2V0U2VxfVwiXWApO1xuICAgICAgaWYgKHRhZ2dlZCAmJiB0YWdnZWQuY29tcGxldGUgJiYgdGFnZ2VkLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiB0YWdnZWQuc3JjICYmICF0YWdnZWQuc3JjLmluY2x1ZGVzKCdiYXNlNjQsaVZCT1J3JykpIHtcbiAgICAgICAgcmV0dXJuIHRhZ2dlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyeSBjYW5kaWRhdGUgcGFnZSBpbWFnZXMgaW5zaWRlIG1haW4jbWFpblxuICAgIGNvbnN0IGltYWdlcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PihcbiAgICAgICdtYWluI21haW4gZGV0YWlscyBmaWd1cmUgZGl2LmltYWdlIGltZywgbWFpbiNtYWluIGRldGFpbHMgZmlndXJlIGltZywgbWFpbiNtYWluIGRpdi5zcHJlYWQgZmlndXJlIGRpdi5pbWFnZSBpbWcsIG1haW4jbWFpbiBkaXYuc3ByZWFkIGZpZ3VyZSBpbWcsIG1haW4jbWFpbiBpbWdbc3JjXj1cImJsb2I6XCJdLCBtYWluI21haW4gaW1nJ1xuICAgICkpO1xuXG4gICAgY29uc3QgdmFsaWQgPSBpbWFnZXMuZmlsdGVyKGltZyA9PlxuICAgICAgaW1nLmNvbXBsZXRlICYmXG4gICAgICBpbWcubmF0dXJhbFdpZHRoID49IG1pbldpZHRoICYmXG4gICAgICBpbWcuc3JjICYmXG4gICAgICAhaW1nLnNyYy5pbmNsdWRlcygnYmFzZTY0LGlWQk9SdycpIC8vIElnbm9yZSB0cmFuc3BhcmVudCAxeDEgcGxhY2Vob2xkZXJcbiAgICApO1xuXG4gICAgaWYgKHZhbGlkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICAvLyBQaWNrIGltYWdlIHZpc2libGUgd2l0aGluIGJyb3dzZXIgdmlld3BvcnRcbiAgICBjb25zdCB2aXNpYmxlID0gdmFsaWQuZmluZChpbWcgPT4ge1xuICAgICAgLy8gSWYgaW1hZ2UgaXMgZXhwbGljaXRseSB0YWdnZWQgd2l0aCBhIGRpZmZlcmVudCBzZXF1ZW5jZSwgZG8gbm90IHBpY2sgaXQhXG4gICAgICBpZiAodHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicgJiYgaW1nLmRhdGFzZXQuc2VxICYmIHBhcnNlSW50KGltZy5kYXRhc2V0LnNlcSwgMTApICE9PSB0YXJnZXRTZXEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHJlY3Qud2lkdGggPiA1MCAmJiByZWN0LmhlaWdodCA+IDUwICYmXG4gICAgICAgICAgICAgcmVjdC50b3AgPCB3aW5kb3cuaW5uZXJIZWlnaHQgJiYgcmVjdC5ib3R0b20gPiAwICYmXG4gICAgICAgICAgICAgcmVjdC5sZWZ0IDwgd2luZG93LmlubmVyV2lkdGggJiYgcmVjdC5yaWdodCA+IDA7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjaG9zZW4gPSB2aXNpYmxlIHx8IHZhbGlkWzBdO1xuICAgIGlmIChjaG9zZW4gJiYgdHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNob3Nlbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHRhcmdldFNlcSkpO1xuICAgICAgY2hvc2VuLmRhdGFzZXQuc2VxID0gU3RyaW5nKHRhcmdldFNlcSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNob3NlbjtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RQYWdlVGV4dChwYWdlTnVtOiBudW1iZXIsIGltZz86IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG5cbiAgICAvLyAxLiBDaGVjayBpZiB3ZSBhbHJlYWR5IHJlY2VpdmVkIHRoZSBPQ1IgSFRNTCBmcm9tIHRoZSBuZXR3b3JrIGludGVyY2VwdGlvblxuICAgIGNvbnN0IGNhY2hlZEh0bWwgPSB0aGlzLnNlcVRvSHRtbC5nZXQocGFnZU51bSk7XG4gICAgaWYgKGNhY2hlZEh0bWwpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChjYWNoZWRIdG1sKTtcbiAgICAgIGlmICh0ZXh0ICYmIHRleHQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICAvLyAyLiBRdWVyeSBET00gZm9yIHRhcmdldCBzZXF1ZW5jZSdzIGZpZ2NhcHRpb24sIHJldHJ5aW5nIGJyaWVmbHkgKHVwIHRvIDI1MDBtcylcbiAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0IDwgMjUwMCkge1xuICAgICAgLy8gMmEuIElmIGltZyB3YXMgcGFzc2VkLCBjaGVjayBpdHMgY2xvc2VzdCBmaWd1cmU6XG4gICAgICBpZiAoaW1nKSB7XG4gICAgICAgIGNvbnN0IGZpZ3VyZSA9IGltZy5jbG9zZXN0KCdmaWd1cmUnKTtcbiAgICAgICAgaWYgKGZpZ3VyZSkge1xuICAgICAgICAgIGNvbnN0IGZpZ2NhcHRpb24gPSBmaWd1cmUucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJ2ZpZ2NhcHRpb24nKTtcbiAgICAgICAgICBpZiAoZmlnY2FwdGlvbiAmJiBmaWdjYXB0aW9uLnRleHRDb250ZW50ICYmIGZpZ2NhcHRpb24udGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChmaWdjYXB0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gMmIuIENoZWNrIGV4cGxpY2l0bHkgdGFnZ2VkIGZpZ2NhcHRpb246XG4gICAgICBjb25zdCB0YWdnZWRGaWdjYXB0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICAgIGBmaWd1cmVbZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdIGZpZ2NhcHRpb24sIGZpZ2NhcHRpb25bZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdLCAuc3ByZWFkW2RhdGEtc2VxPVwiJHtwYWdlTnVtfVwiXSBmaWdjYXB0aW9uYFxuICAgICAgKTtcbiAgICAgIGlmICh0YWdnZWRGaWdjYXB0aW9uICYmIHRhZ2dlZEZpZ2NhcHRpb24udGV4dENvbnRlbnQgJiYgdGFnZ2VkRmlnY2FwdGlvbi50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQodGFnZ2VkRmlnY2FwdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIDJjLiBGYWxsYmFjazogY2hlY2sgbWFpbiBzcHJlYWQgZGV0YWlscyBmaWdjYXB0aW9uOlxuICAgICAgY29uc3Qgc3ByZWFkRmlnY2FwdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAnbWFpbiNtYWluIGRldGFpbHMgZmlndXJlIGZpZ2NhcHRpb24sIG1haW4jbWFpbiBmaWd1cmUgZmlnY2FwdGlvbiwgbWFpbiNtYWluIGZpZ2NhcHRpb24nXG4gICAgICApO1xuICAgICAgaWYgKHNwcmVhZEZpZ2NhcHRpb24gJiYgc3ByZWFkRmlnY2FwdGlvbi50ZXh0Q29udGVudCAmJiBzcHJlYWRGaWdjYXB0aW9uLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChzcHJlYWRGaWdjYXB0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8gMmQuIENoZWNrIGlmIG5ldHdvcmsgcmVzcG9uc2UgYXJyaXZlZCB3aGlsZSBwb2xsaW5nOlxuICAgICAgY29uc3QgbGF0ZUh0bWwgPSB0aGlzLnNlcVRvSHRtbC5nZXQocGFnZU51bSk7XG4gICAgICBpZiAobGF0ZUh0bWwpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGxhdGVIdG1sKTtcbiAgICAgICAgaWYgKHRleHQgJiYgdGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgaXNBdEVuZE9mQm9vayhjdXJyZW50UGFnZTogbnVtYmVyLCB0b3RhbFBhZ2VzOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAodG90YWxQYWdlcyA+IDAgJiYgY3VycmVudFBhZ2UgPj0gdG90YWxQYWdlcykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQgfCBIVE1MQW5jaG9yRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW2FyaWEtbGFiZWwqPVwiTmV4dFwiIGldLCBidXR0b25bdGl0bGUqPVwiTmV4dFwiIGldLCBbYWNjZXNza2V5PVwiblwiXSdcbiAgICApO1xuICAgIGlmIChuZXh0QnRuKSB7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IChuZXh0QnRuIGFzIGFueSkuZGlzYWJsZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtZGlzYWJsZWQnKSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpO1xuICAgICAgaWYgKGRpc2FibGVkKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGdldFRvdGFsUGFnZXNGcm9tRG9tKCk6IG51bWJlciB7XG4gICAgLy8gMS4gQ2hlY2sgcGFyZW50IGNvbnRhaW5lciBvZiAjdG9vbGJhci1zZXE6IDxpbnB1dCBpZD1cInRvb2xiYXItc2VxXCI+IC4uLiA8c3Bhbj4vPC9zcGFuPiA8c3Bhbj4yNzI8L3NwYW4+XG4gICAgY29uc3Qgc2VxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbGJhci1zZXEsIGlucHV0W25hbWU9XCJzZXFcIl0nKTtcbiAgICBpZiAoc2VxSW5wdXQpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHNlcUlucHV0LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBwYXJlbnQudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvXFwvXFxzKihcXGQrKS8pO1xuICAgICAgICBpZiAobWF0Y2gpIHJldHVybiBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuXG4gICAgICAgIGNvbnN0IGh0bWxNYXRjaCA9IHBhcmVudC5pbm5lckhUTUwubWF0Y2goL1xcL1xccyo8XFwvc3Bhbj5cXHMqPHNwYW4+XFxzKihcXGQrKS9pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5uZXJIVE1MLm1hdGNoKC9cXC9cXHMqKFxcZCspLyk7XG4gICAgICAgIGlmIChodG1sTWF0Y2gpIHJldHVybiBwYXJzZUludChodG1sTWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWF4QXR0ciA9IHNlcUlucHV0LmdldEF0dHJpYnV0ZSgnbWF4Jyk7XG4gICAgICBpZiAobWF4QXR0cikge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChtYXhBdHRyLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIENoZWNrIHdpbmRvdy5tYW5pZmVzdCBpZiBwcmVzZW50IGluIHBhZ2VcbiAgICBjb25zdCB3ID0gd2luZG93IGFzIGFueTtcbiAgICBpZiAody5tYW5pZmVzdCAmJiB3Lm1hbmlmZXN0LnRvdGFsU2VxKSB7XG4gICAgICBjb25zdCB2YWwgPSBwYXJzZUludCh3Lm1hbmlmZXN0LnRvdGFsU2VxLCAxMCk7XG4gICAgICBpZiAoIWlzTmFOKHZhbCkgJiYgdmFsID4gMCkgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICAvLyAzLiBDaGVjayBnZW5lcmFsIHRleHQgZS5nLiBcIm9mIDI3MlwiIG9yIFwiLyAyNzJcIlxuICAgIGNvbnN0IHBhZ2luZ0VsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhZ2luZywgW2NsYXNzKj1cInBhZ2luZ1wiXSwgW2FyaWEtbGFiZWwqPVwidG90YWwgcGFnZXNcIiBpXScpO1xuICAgIGlmIChwYWdpbmdFbCAmJiBwYWdpbmdFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbSA9IHBhZ2luZ0VsLnRleHRDb250ZW50Lm1hdGNoKC9cXC9cXHMqKFxcZCspLykgfHwgcGFnaW5nRWwudGV4dENvbnRlbnQubWF0Y2goL29mXFxzKyhcXGQrKS9pKTtcbiAgICAgIGlmIChtKSByZXR1cm4gcGFyc2VJbnQobVsxXSwgMTApO1xuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9XG59XG4iLAogICAgImltcG9ydCB7IEJvb2tQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQXJjaGl2ZVByb3ZpZGVyIH0gZnJvbSAnLi9hcmNoaXZlLXByb3ZpZGVyJztcbmltcG9ydCB7IEhhdGhpVHJ1c3RQcm92aWRlciB9IGZyb20gJy4vaGF0aGl0cnVzdC1wcm92aWRlcic7XG5cbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9hcmNoaXZlLXByb3ZpZGVyJztcbmV4cG9ydCAqIGZyb20gJy4vaGF0aGl0cnVzdC1wcm92aWRlcic7XG5cbi8qKlxuICogUmVnaXN0cnkgb2Ygc3VwcG9ydGVkIGJvb2sgc2l0ZSBwcm92aWRlcnMuXG4gKi9cbmNvbnN0IHByb3ZpZGVyczogQm9va1Byb3ZpZGVyW10gPSBbXG4gIG5ldyBBcmNoaXZlUHJvdmlkZXIoKSxcbiAgbmV3IEhhdGhpVHJ1c3RQcm92aWRlcigpLFxuXTtcblxuLyoqXG4gKiBEZXRlY3RzIGFuZCByZXR1cm5zIHRoZSBhY3RpdmUgcHJvdmlkZXIgbWF0Y2hpbmcgdGhlIGN1cnJlbnQgd2VicGFnZS5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgY3VycmVudCBwYWdlIGlzIG5vdCBhIHN1cHBvcnRlZCBib29rIHZpZXdlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVByb3ZpZGVyKCk6IEJvb2tQcm92aWRlciB8IG51bGwge1xuICBmb3IgKGNvbnN0IHByb3ZpZGVyIG9mIHByb3ZpZGVycykge1xuICAgIGlmIChwcm92aWRlci5pc01hdGNoKCkpIHtcbiAgICAgIHJldHVybiBwcm92aWRlcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG4iLAogICAgIi8qKlxuICogQ29udGVudCBTY3JpcHQgKElzb2xhdGVkIFdvcmxkKSBmb3IgQXJjaGl2ZSBEb3dubG9hZGVyXG4gKiBNYW5hZ2VzIGF1dG9tYXRpb24sIHBhZ2UgY3ljbGluZywgdmVyaWZpY2F0aW9uLCBjYW52YXMgY2FwdHVyZSwgYW5kIHRleHQgZmV0Y2hpbmcuXG4gKi9cblxuaW1wb3J0IHsgQm9va0luZm8sIERvd25sb2FkZXJDb25maWcsIFByb2dyZXNzU3RhdGUsIEV4dGVuc2lvbk1lc3NhZ2UsIEJyaWRnZU1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBGbG9hdGluZ1BpbGwgfSBmcm9tICcuL3BpbGwnO1xuaW1wb3J0IHsgcGFyc2VEanZ1WG1sVG9UZXh0LCBidWlsZEJvb2tNYXJrZG93biwgUGFnZVRleHRFbnRyeSB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuaW1wb3J0IHsgY29tcGlsZUpwZWdzVG9QZGYsIFBkZkltYWdlSW5wdXQgfSBmcm9tICcuLi91dGlscy9wZGYtYnVpbGRlcic7XG5pbXBvcnQgeyBmb3JtYXRTdWJkaXIsIGZvcm1hdFBhZ2VGaWxlbmFtZSwgc2FuaXRpemVGaWxlbmFtZSB9IGZyb20gJy4uL3V0aWxzL3Nhbml0aXplcic7XG5pbXBvcnQgeyBnZXRBY3RpdmVQcm92aWRlciwgQm9va1Byb3ZpZGVyLCBBcmNoaXZlUHJvdmlkZXIsIEhhdGhpVHJ1c3RQcm92aWRlciwgcGFyc2VBcmNoaXZlSW1hZ2VVcmxQYWdlLCBwYXJzZUFyY2hpdmVEb21QYWdlIH0gZnJvbSAnLi4vcHJvdmlkZXJzJztcblxuKGZ1bmN0aW9uIGluaXRDb250ZW50U2NyaXB0KCkge1xuICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBJbml0aWFsaXplZCBvbicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblxuICBjb25zdCBwcm92aWRlcjogQm9va1Byb3ZpZGVyIHwgbnVsbCA9IGdldEFjdGl2ZVByb3ZpZGVyKCk7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBObyBtYXRjaGluZyBib29rIHByb3ZpZGVyIGZvcicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gQWN0aXZlIHByb3ZpZGVyOiAke3Byb3ZpZGVyLnNpdGVOYW1lfSAoJHtwcm92aWRlci5zaXRlSWR9KWApO1xuXG4gIC8vIFN0YXRlXG4gIGxldCBib29rSW5mbzogQm9va0luZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGlzUnVubmluZyA9IGZhbHNlO1xuICBsZXQgaXNQYXVzZWQgPSBmYWxzZTtcbiAgbGV0IHN0b3BSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgbGV0IGN1cnJlbnRQYWdlID0gcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZTtcbiAgbGV0IGRvd25sb2FkZWRQYWdlcyA9IDA7XG4gIGxldCBmYWlsZWRQYWdlcyA9IDA7XG4gIGxldCBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gIGxldCBsYXN0RGltZW5zaW9ucyA9IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xuICBsZXQgY29sbGVjdGVkSW1hZ2VzOiBQZGZJbWFnZUlucHV0W10gPSBbXTtcbiAgbGV0IGNvbGxlY3RlZFRleHRzOiBQYWdlVGV4dEVudHJ5W10gPSBbXTtcbiAgbGV0IGlzRW5kT2ZCb29rID0gZmFsc2U7XG4gIGxldCBpc1NpdGVUYWludGVkID0gZmFsc2U7XG5cbiAgaW50ZXJmYWNlIEh0dHBFcnJvckluZm8ge1xuICAgIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgICB1cmw6IHN0cmluZztcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgICByZXRyeUFmdGVyPzogbnVtYmVyO1xuICB9XG5cbiAgbGV0IGxhc3RIdHRwRXJyb3I6IEh0dHBFcnJvckluZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGNvbnNlY3V0aXZlRXJyb3JDb3VudCA9IDA7XG5cbiAgZnVuY3Rpb24gb25IdHRwRXJyb3JSZWNlaXZlZChzdGF0dXNDb2RlOiBudW1iZXIsIHVybDogc3RyaW5nLCByZXRyeUFmdGVyPzogbnVtYmVyKSB7XG4gICAgY29uc3QgaXNCb29rUmVsYXRlZCA9XG4gICAgICB1cmwuaW5jbHVkZXMoJ2ltZ3NydicpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ0Jvb2tSZWFkZXInKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCcvY2dpL3B0JykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnZGV0YWlscycpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKTtcblxuICAgIGlmICghaXNCb29rUmVsYXRlZCkgcmV0dXJuO1xuXG4gICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIEhUVFAgZXJyb3IgJHtzdGF0dXNDb2RlfSBkZXRlY3RlZCBmb3IgJHt1cmx9YCk7XG4gICAgbGFzdEh0dHBFcnJvciA9IHtcbiAgICAgIHN0YXR1c0NvZGUsXG4gICAgICB1cmwsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICByZXRyeUFmdGVyLFxuICAgIH07XG4gIH1cblxuICAvLyBMb2FkIHNhdmVkIHNldHRpbmdzIGZyb20gbG9jYWxTdG9yYWdlIGZpcnN0XG4gIGNvbnN0IGxvY2FsU2F2ZVBhdGggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX3NhdmVfcGF0aCcpO1xuICBjb25zdCBsb2NhbEZvbGRlclBhdHRlcm4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2ZvbGRlcl9wYXR0ZXJuJyk7XG4gIGNvbnN0IGxvY2FsU3RhcnRQYWdlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJyk7XG4gIGNvbnN0IGxvY2FsRW5kUGFnZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnKTtcbiAgY29uc3QgbG9jYWxNYXhIZWlnaHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX21heF9oZWlnaHQnKTtcblxuICBsZXQgaW5pdGlhbFN0YXJ0UGFnZSA9IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG4gIGlmIChsb2NhbFN0YXJ0UGFnZSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KGxvY2FsU3RhcnRQYWdlLCAxMCk7XG4gICAgaWYgKCFpc05hTihwYXJzZWQpICYmIHBhcnNlZCA+PSBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlKSB7XG4gICAgICBpbml0aWFsU3RhcnRQYWdlID0gcGFyc2VkO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRlZmF1bHRDb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7XG4gICAgYmFzZURpcjogbG9jYWxTYXZlUGF0aCB8fCAnQXJjaGl2ZUJvb2tzJyxcbiAgICBmb2xkZXJQYXR0ZXJuOiBsb2NhbEZvbGRlclBhdHRlcm4gfHwgJ3t0aXRsZX1fe2lkfScsXG4gICAgc2F2ZUltYWdlczogZmFsc2UsXG4gICAgZ2VuZXJhdGVQZGY6IHRydWUsXG4gICAgc2F2ZVRleHRNZDogdHJ1ZSxcbiAgICBpbWFnZVF1YWxpdHk6IDAuNzUsXG4gICAgbWF4UGFnZUhlaWdodDogbG9jYWxNYXhIZWlnaHQgIT09IG51bGwgPyBNYXRoLm1heCgwLCBwYXJzZUludChsb2NhbE1heEhlaWdodCwgMTApKSA6IDAsXG4gICAgcGFnZURlbGF5TXM6IDIwMCxcbiAgICBwYWdlQ2hhbmdlVGltZW91dE1zOiAxMDAwMCxcbiAgICBtYXhSZXRyaWVzOiAxMCxcbiAgICBhdXRvU2luZ2xlUGFnZTogdHJ1ZSxcbiAgICBzdGFydFBhZ2U6IGluaXRpYWxTdGFydFBhZ2UsXG4gICAgZW5kUGFnZTogbG9jYWxFbmRQYWdlICE9PSBudWxsID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobG9jYWxFbmRQYWdlLCAxMCkpIDogMCxcbiAgICBkZWxldGVJbWFnZXNPbkNvbXBsZXRlOiB0cnVlLFxuICB9O1xuXG4gIGxldCBjb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7IC4uLmRlZmF1bHRDb25maWcgfTtcblxuICBmdW5jdGlvbiBzYXZlQ29uZmlnKHVwZGF0ZWQ6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pIHtcbiAgICBjb25maWcgPSB7IC4uLmNvbmZpZywgLi4udXBkYXRlZCB9O1xuICAgIGlmIChjb25maWcuYmFzZURpcikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zYXZlX3BhdGgnLCBjb25maWcuYmFzZURpcik7XG4gICAgfVxuICAgIGlmIChjb25maWcuZm9sZGVyUGF0dGVybikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9mb2xkZXJfcGF0dGVybicsIGNvbmZpZy5mb2xkZXJQYXR0ZXJuKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuc3RhcnRQYWdlID09PSAnbnVtYmVyJykge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJywgU3RyaW5nKGNvbmZpZy5zdGFydFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuZW5kUGFnZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnLCBTdHJpbmcoY29uZmlnLmVuZFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcubWF4UGFnZUhlaWdodCA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfbWF4X2hlaWdodCcsIFN0cmluZyhjb25maWcubWF4UGFnZUhlaWdodCkpO1xuICAgIH1cbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IGRvd25sb2FkZXJDb25maWc6IGNvbmZpZyB9KTtcbiAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICB9XG5cbiAgLy8gTG9hZCB1c2VyIGNvbmZpZyBmcm9tIGNocm9tZS5zdG9yYWdlXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFsnbGliZXJhdG9yQ29uZmlnJywgJ2Rvd25sb2FkZXJDb25maWcnXSwgKHJlcykgPT4ge1xuICAgIGNvbnN0IHNhdmVkID0gcmVzLmRvd25sb2FkZXJDb25maWcgfHwgcmVzLmxpYmVyYXRvckNvbmZpZztcbiAgICBpZiAoc2F2ZWQpIHtcbiAgICAgIGNvbnN0IGxvY2FsUGF0aCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc2F2ZV9wYXRoJyk7XG4gICAgICBjb25maWcgPSB7XG4gICAgICAgIC4uLmRlZmF1bHRDb25maWcsXG4gICAgICAgIC4uLnNhdmVkLFxuICAgICAgICAuLi4obG9jYWxQYXRoID8geyBiYXNlRGlyOiBsb2NhbFBhdGggfSA6IHt9KSxcbiAgICAgIH07XG4gICAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gRmxvYXRpbmcgUGlsbCBVSSB3aXRoIGZ1bGwgY2FsbGJhY2tzXG4gIGNvbnN0IHBpbGwgPSBuZXcgRmxvYXRpbmdQaWxsKHtcbiAgICBvblN0YXJ0OiAoKSA9PiBzdGFydERvd25sb2FkKCksXG4gICAgb25QYXVzZTogKCkgPT4gcGF1c2VEb3dubG9hZCgpLFxuICAgIG9uUmVzdW1lOiAoKSA9PiByZXN1bWVEb3dubG9hZCgpLFxuICAgIG9uU3RvcDogKCkgPT4gaGFuZGxlU3RvcFJlcXVlc3QoKSxcbiAgICBvblNhdmVTZXR0aW5nczogKG5ld1NldHRpbmdzKSA9PiB7XG4gICAgICBzYXZlQ29uZmlnKG5ld1NldHRpbmdzKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFNldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZTonLCBuZXdTZXR0aW5ncyk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogaXNSdW5uaW5nID8gKGlzUGF1c2VkID8gJ3BhdXNlZCcgOiAnZG93bmxvYWRpbmcnKSA6ICdpZGxlJyxcbiAgICAgICAgc3RhdHVzVGV4dDogJ1NldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZScsXG4gICAgICB9KTtcbiAgICB9LFxuICAgIG9uU3dpdGNoTW9kZTogKCkgPT4gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCksXG4gICAgb25WaWV3RmlsZTogKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gT3BlbmluZyBkb3dubG9hZGVkIGZpbGUgaW4gRmluZGVyL0V4cGxvcmVyLi4uJyk7XG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdPUEVOX0RPV05MT0FEJyB9KTtcbiAgICB9LFxuICB9KTtcblxuICBpZiAocGlsbC5zaG91bGRSZW5kZXIoKSkge1xuICAgIHBpbGwucmVuZGVyKCk7XG4gICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hCb29rSW5mbygpIHtcbiAgICBjb25zdCBkZXRlY3RlZCA9IGF3YWl0IHByb3ZpZGVyLmRldGVjdEJvb2tJbmZvKCk7XG4gICAgaWYgKGRldGVjdGVkKSB7XG4gICAgICBib29rSW5mbyA9IGRldGVjdGVkO1xuICAgICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJjaGl2ZVByb3ZpZGVyKSB7XG4gICAgICAgIHByb3ZpZGVyLnNldEJvb2tJbmZvKGJvb2tJbmZvKTtcbiAgICAgIH1cbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID8/IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UsXG4gICAgICAgIGJvb2tJbmZvLnRvdGFsUGFnZXMsXG4gICAgICAgICdSZWFkeScsXG4gICAgICAgICdub3JtYWwnLFxuICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgaXNSdW5uaW5nLFxuICAgICAgICBib29rSW5mby5jdXJyZW50TW9kZSA/PyAxLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQnJpZGdlIGxpc3RlbmVyIGZvciBNQUlOIHdvcmxkIGV2ZW50cyAoSFRUUCBlcnJvciBpbnRlcmNlcHRpb24gJiBBcmNoaXZlLm9yZyBCb29rUmVhZGVyKVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ0ZST01fQlJJREdFJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGEgYXMgQnJpZGdlTWVzc2FnZTtcblxuICAgIC8vIEludGVyY2VwdCBhbnkgbm9uLTIwMCBIVFRQIHN0YXR1cyAoNDI5LCA1MDAsIDQwMSwgZXRjLilcbiAgICBpZiAobXNnLmV2ZW50ID09PSAnSFRUUF9FUlJPUicpIHtcbiAgICAgIG9uSHR0cEVycm9yUmVjZWl2ZWQobXNnLnN0YXR1c0NvZGUsIG1zZy51cmwsIG1zZy5yZXRyeUFmdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3J3YXJkIEhhdGhpVHJ1c3QgcGFnZSBhbm5vdW5jZW1lbnRzLCBpbWFnZXMsIGFuZCBPQ1IgdGV4dCB0byBwcm92aWRlclxuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEhhdGhpVHJ1c3RQcm92aWRlcikge1xuICAgICAgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfTE9BRF9BTk5PVU5DRUQnKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZUxvYWRBbm5vdW5jZWQobXNnLnNlcSwgbXNnLmlzVmlzaWJsZSwgbXNnLmlzTG9hZGVkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0lNQUdFX1JFQURZJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VJbWFnZVJlYWR5KG1zZy5zZXEsIG1zZy5ibG9iVXJsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZVRleHRSZWFkeShtc2cuc2VxLCBtc2cuaHRtbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3J3YXJkIEFyY2hpdmUub3JnIE9DUiB0ZXh0IHRvIEFyY2hpdmVQcm92aWRlclxuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFyY2hpdmVQcm92aWRlcikge1xuICAgICAgaWYgKG1zZy5ldmVudCA9PT0gJ0FSQ0hJVkVfVEVYVF9SRUFEWScpIHtcbiAgICAgICAgcHJvdmlkZXIub25BcmNoaXZlVGV4dFJlYWR5KG1zZy5wYWdlLCBtc2cueG1sKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtc2cuZXZlbnQgPT09ICdCT09LX0lORk8nKSB7XG4gICAgICBib29rSW5mbyA9IG1zZy5kYXRhO1xuICAgICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJjaGl2ZVByb3ZpZGVyKSB7XG4gICAgICAgIHByb3ZpZGVyLnNldEJvb2tJbmZvKGJvb2tJbmZvKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG9tQ3VycmVudCA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICBpZiAoZG9tQ3VycmVudCAhPT0gbnVsbCAmJiAoIWJvb2tJbmZvLnRvdGFsUGFnZXMgfHwgZG9tQ3VycmVudCA+IChib29rSW5mby5jdXJyZW50TGVhZiA/PyAwKSkpIHtcbiAgICAgICAgYm9va0luZm8uY3VycmVudExlYWYgPSBkb21DdXJyZW50O1xuICAgICAgfVxuXG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBib29rSW5mby5jdXJyZW50TGVhZiA/PyAwLFxuICAgICAgICBib29rSW5mby50b3RhbFBhZ2VzLFxuICAgICAgICAnUmVhZHknLFxuICAgICAgICAnbm9ybWFsJyxcbiAgICAgICAgaXNQYXVzZWQsXG4gICAgICAgIGlzUnVubmluZyxcbiAgICAgICAgYm9va0luZm8uY3VycmVudE1vZGUsXG4gICAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgICApO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoKTtcbiAgICB9IGVsc2UgaWYgKG1zZy5ldmVudCA9PT0gJ01PREVfQ0hBTkdFRCcpIHtcbiAgICAgIGlmIChib29rSW5mbykge1xuICAgICAgICBib29rSW5mby5jdXJyZW50TW9kZSA9IG1zZy5tb2RlO1xuICAgICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICAgIGJvb2tJbmZvLnRvdGFsUGFnZXMsXG4gICAgICAgICAgJzEtUGFnZSBNb2RlIEFjdGl2ZScsXG4gICAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgICAgaXNQYXVzZWQsXG4gICAgICAgICAgaXNSdW5uaW5nLFxuICAgICAgICAgIG1zZy5tb2RlLFxuICAgICAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBJbml0aWFsIGRldGVjdGlvblxuICByZWZyZXNoQm9va0luZm8oKTtcbiAgc2V0VGltZW91dCgoKSA9PiByZWZyZXNoQm9va0luZm8oKSwgODAwKTtcblxuICAvLyBOZXR3b3JrIGNvbm5lY3Rpb24gbGlzdGVuZXJzXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgKCkgPT4ge1xuICAgIGNvbnNvbGUud2FybignW0FyY2hpdmVEb3dubG9hZGVyXSBOZXR3b3JrIGNvbm5lY3Rpb24gbG9zdCAob2ZmbGluZSknKTtcbiAgICBpZiAoaXNSdW5uaW5nICYmICFpc1BhdXNlZCkge1xuICAgICAgaXNQYXVzZWQgPSB0cnVlO1xuICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgY3VycmVudFBhZ2UsXG4gICAgICAgIGJvb2tJbmZvPy50b3RhbFBhZ2VzIHx8IDAsXG4gICAgICAgICdPZmZsaW5lIC0gUGF1c2VkJyxcbiAgICAgICAgJ29mZmxpbmUnLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlLFxuICAgICAgICBib29rSW5mbz8uY3VycmVudE1vZGUgfHwgMSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ29mZmxpbmUnLCBpc09mZmxpbmU6IHRydWUgfSk7XG4gICAgfVxuICB9KTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIE5ldHdvcmsgY29ubmVjdGlvbiByZXN0b3JlZCAob25saW5lKScpO1xuICAgIGlmIChpc1J1bm5pbmcgJiYgaXNQYXVzZWQpIHtcbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwLFxuICAgICAgICAnT25saW5lIC0gQ2xpY2sgQ09OVElOVUUnLFxuICAgICAgICAnc3RhbGxlZCcsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWUsXG4gICAgICAgIGJvb2tJbmZvPy5jdXJyZW50TW9kZSB8fCAxLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnc3RhbGxlZCcsIGlzT2ZmbGluZTogZmFsc2UgfSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBIZWxwZXJzXG4gIGNvbnN0IHNsZWVwID0gKG1zOiBudW1iZXIpID0+IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xuXG4gIGZ1bmN0aW9uIGJyb2FkY2FzdFN0YXRlKGV4dHJhOiBQYXJ0aWFsPFByb2dyZXNzU3RhdGU+ID0ge30pIHtcbiAgICBjb25zdCB0b3RhbCA9IGJvb2tJbmZvPy50b3RhbFBhZ2VzIHx8IGNvbmZpZy5lbmRQYWdlIHx8IDE7XG4gICAgbGV0IHN0YXR1c1R5cGU6ICdub3JtYWwnIHwgJ3JldHJ5aW5nJyB8ICdvZmZsaW5lJyB8ICdzdGFsbGVkJyB8ICdjb21wbGV0ZScgPSAnbm9ybWFsJztcblxuICAgIGlmIChleHRyYS5zdGF0dXMgPT09ICdzdGFsbGVkJykgc3RhdHVzVHlwZSA9ICdzdGFsbGVkJztcbiAgICBlbHNlIGlmIChleHRyYS5zdGF0dXMgPT09ICdyZXRyeWluZycpIHN0YXR1c1R5cGUgPSAncmV0cnlpbmcnO1xuICAgIGVsc2UgaWYgKCFuYXZpZ2F0b3Iub25MaW5lKSBzdGF0dXNUeXBlID0gJ29mZmxpbmUnO1xuICAgIGVsc2UgaWYgKGV4dHJhLnN0YXR1cyA9PT0gJ2NvbXBsZXRlJykgc3RhdHVzVHlwZSA9ICdjb21wbGV0ZSc7XG5cbiAgICBjb25zdCBzdGF0ZTogUHJvZ3Jlc3NTdGF0ZSA9IHtcbiAgICAgIHN0YXR1czogaXNSdW5uaW5nID8gKGlzUGF1c2VkID8gKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyA/ICdzdGFsbGVkJyA6ICdwYXVzZWQnKSA6ICdkb3dubG9hZGluZycpIDogKGV4dHJhLnN0YXR1cyB8fCAnaWRsZScpLFxuICAgICAgY3VycmVudFBhZ2UsXG4gICAgICB0b3RhbFBhZ2VzOiB0b3RhbCxcbiAgICAgIGRvd25sb2FkZWRQYWdlcyxcbiAgICAgIGZhaWxlZFBhZ2VzLFxuICAgICAgcmV0cnlDb3VudDogY3VycmVudFJldHJ5Q291bnQsXG4gICAgICBzdGF0dXNUZXh0OiBpc1BhdXNlZCA/IChzdGF0dXNUeXBlID09PSAnc3RhbGxlZCcgPyAnU3RhbGxlZCAtIENsaWNrIENPTlRJTlVFJyA6ICdQYXVzZWQnKSA6IChpc1J1bm5pbmcgPyBgQ2FwdHVyaW5nIHBhZ2UgJHtjdXJyZW50UGFnZX1gIDogJ1JlYWR5JyksXG4gICAgICBib29rSW5mbzogYm9va0luZm8gfHwgdW5kZWZpbmVkLFxuICAgICAgaXNQYXVzZWQsXG4gICAgICBpc09mZmxpbmU6ICFuYXZpZ2F0b3Iub25MaW5lLFxuICAgICAgaW1hZ2VEaW1lbnNpb25zOiBsYXN0RGltZW5zaW9ucyxcbiAgICAgIC4uLmV4dHJhLFxuICAgIH07XG5cbiAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgY3VycmVudFBhZ2UsXG4gICAgICB0b3RhbCxcbiAgICAgIHN0YXRlLnN0YXR1c1RleHQsXG4gICAgICBzdGF0dXNUeXBlLFxuICAgICAgaXNQYXVzZWQsXG4gICAgICBpc1J1bm5pbmcsXG4gICAgICBib29rSW5mbz8uY3VycmVudE1vZGUgfHwgMSxcbiAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgKTtcblxuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogJ1NUQVRFX1VQREFURScsIHN0YXRlIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmZvcmNlcyAxLXBhZ2UgdmlldyBtb2RlIHZpYSBwcm92aWRlciBpZiBzdXBwb3J0ZWQuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBlbmZvcmNlU2luZ2xlUGFnZU1vZGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHByb3ZpZGVyLmVuZm9yY2VTaW5nbGVQYWdlTW9kZSkge1xuICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRW5mb3JjaW5nIHNpbmdsZS1wYWdlIG1vZGUgb24gJHtwcm92aWRlci5zaXRlTmFtZX0uLi5gKTtcbiAgICAgIHJldHVybiBhd2FpdCBwcm92aWRlci5lbmZvcmNlU2luZ2xlUGFnZU1vZGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2FwdHVyZXMgaW1hZ2UgZnJvbSBET00gZWxlbWVudCB0byBKUEVHIERhdGEgVVJMIHVzaW5nIGFuIG9mZnNjcmVlbiBjYW52YXMuXG4gICAqIFByb3BvcnRpYW5hbGx5IGRvd25zY2FsZXMgaWYgbWF4UGFnZUhlaWdodCA+IDAgYW5kIGhlaWdodCA+IG1heFBhZ2VIZWlnaHQuXG4gICAqIElmIGNhbnZhcyBpcyB0YWludGVkIGJ5IGNyb3NzLW9yaWdpbiByZXNvdXJjZXMsIGZsYWdzIGlzU2l0ZVRhaW50ZWQgYW5kIGNsZWFubHkgcmVjb3ZlcnMgdmlhIGJhY2tncm91bmQgcHJveHkuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBjYXB0dXJlSW1hZ2VUb0RhdGFVcmwoaW1nOiBIVE1MSW1hZ2VFbGVtZW50LCBxdWFsaXR5ID0gMC43NSwgbWF4UGFnZUhlaWdodCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIEZhc3QgcGF0aDogaWYgc2l0ZSBpcyBhbHJlYWR5IGtub3duIHRvIHVzZSBjcm9zcy1vcmlnaW4vdGFpbnRlZCBpbWFnZXMsIGJ5cGFzcyBjYW52YXMgZW50aXJlbHkhXG4gICAgaWYgKGlzU2l0ZVRhaW50ZWQpIHtcbiAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvLyBQcm9hY3RpdmVseSBkZXRlY3QgQXJjaGl2ZS5vcmcgY3Jvc3Mtb3JpZ2luIHN0b3JhZ2Ugbm9kZXMgKGlhKi51cy5hcmNoaXZlLm9yZyAhPSBhcmNoaXZlLm9yZylcbiAgICBpZiAoaW1nLnNyYyAmJiBpbWcuc3JjLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmICFpbWcuc3JjLnN0YXJ0c1dpdGgod2luZG93LmxvY2F0aW9uLm9yaWdpbikpIHtcbiAgICAgIGlzU2l0ZVRhaW50ZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGF3YWl0IGZldGNoQ2xlYW5EYXRhVXJsKGltZy5zcmMsIHF1YWxpdHksIG1heFBhZ2VIZWlnaHQpO1xuICAgIH1cblxuICAgIGxldCB3aWR0aCA9IGltZy5uYXR1cmFsV2lkdGggfHwgaW1nLndpZHRoIHx8IDA7XG4gICAgbGV0IGhlaWdodCA9IGltZy5uYXR1cmFsSGVpZ2h0IHx8IGltZy5oZWlnaHQgfHwgMDtcblxuICAgIGlmIChtYXhQYWdlSGVpZ2h0ID4gMCAmJiBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0KSB7XG4gICAgICBjb25zdCBzY2FsZSA9IG1heFBhZ2VIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICB3aWR0aCA9IE1hdGgucm91bmQod2lkdGggKiBzY2FsZSk7XG4gICAgICBoZWlnaHQgPSBtYXhQYWdlSGVpZ2h0O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgaWYgKCFjdHgpIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IG9idGFpbiBjYW52YXMgMkQgY29udGV4dCcpO1xuXG4gICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIHF1YWxpdHkpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAvLyBUYWludGVkIGNhbnZhcyByZWNvdmVyeSAoY3Jvc3Mtb3JpZ2luIENETiBvciBwcm90ZWN0ZWQgcGFnZXMpXG4gICAgICBpZiAoZXJyLm5hbWUgPT09ICdTZWN1cml0eUVycm9yJyB8fCBTdHJpbmcoZXJyKS5pbmNsdWRlcygnVGFpbnRlZCcpIHx8IFN0cmluZyhlcnIpLmluY2x1ZGVzKCdTZWN1cml0eUVycm9yJykpIHtcbiAgICAgICAgaWYgKCFpc1NpdGVUYWludGVkKSB7XG4gICAgICAgICAgaXNTaXRlVGFpbnRlZCA9IHRydWU7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gQ3Jvc3Mtb3JpZ2luIHNjYW4gZGV0ZWN0ZWQuIEVuYWJsaW5nIGZhc3QgYmFja2dyb3VuZCBmZXRjaCBmb3IgYWxsIHN1YnNlcXVlbnQgcGFnZXMuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoQ2xlYW5EYXRhVXJsKGltZy5zcmMsIHF1YWxpdHksIG1heFBhZ2VIZWlnaHQpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJsb2JUb0RhdGFVcmwoYmxvYjogQmxvYik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIub25sb2FkZW5kID0gKCkgPT4gcmVzb2x2ZShyZWFkZXIucmVzdWx0IGFzIHN0cmluZyk7XG4gICAgICByZWFkZXIub25lcnJvciA9IHJlamVjdDtcbiAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gc2NhbGVEYXRhVXJsKGRhdGFVcmw6IHN0cmluZywgcXVhbGl0eSA9IDAuNzUsIG1heFBhZ2VIZWlnaHQgPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAobWF4UGFnZUhlaWdodCA8PSAwKSByZXR1cm4gZGF0YVVybDtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgbGV0IHdpZHRoID0gaW1nLm5hdHVyYWxXaWR0aDtcbiAgICAgICAgbGV0IGhlaWdodCA9IGltZy5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgICAgIGNvbnN0IHNjYWxlID0gbWF4UGFnZUhlaWdodCAvIGhlaWdodDtcbiAgICAgICAgICB3aWR0aCA9IE1hdGgucm91bmQod2lkdGggKiBzY2FsZSk7XG4gICAgICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBpZiAoIWN0eCkgcmV0dXJuIHJlc29sdmUoZGF0YVVybCk7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgcmVzb2x2ZShjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgcXVhbGl0eSkpO1xuICAgICAgfTtcbiAgICAgIGltZy5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZShkYXRhVXJsKTtcbiAgICAgIGltZy5zcmMgPSBkYXRhVXJsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gZmV0Y2hDbGVhbkRhdGFVcmwodXJsOiBzdHJpbmcsIHF1YWxpdHkgPSAwLjc1LCBtYXhQYWdlSGVpZ2h0ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IGJsb2I6IEJsb2IgfCBudWxsID0gbnVsbDtcblxuICAgIC8vIDEuIElmIHNpdGUgaXMgTk9UIG1hcmtlZCB0YWludGVkLCB0cnkgbG9jYWwgZmV0Y2ggZmlyc3QgKGZhc3QgZm9yIGJsb2I6IGFuZCBDT1JTLWVuYWJsZWQgZW5kcG9pbnRzKVxuICAgIGlmICghaXNTaXRlVGFpbnRlZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7IGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSk7XG4gICAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgICBibG9iID0gYXdhaXQgcmVzLmJsb2IoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICAvLyAyLiBCYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyIGZldGNoIChpbW11bmUgdG8gQ09SUyByZXN0cmljdGlvbnMgd2l0aCBob3N0X3Blcm1pc3Npb25zKVxuICAgIGlmICghYmxvYikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYmdSZXM6IGFueSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgICB7IHR5cGU6ICdGRVRDSF9JTUFHRV9EQVRBX1VSTCcsIHVybCB9LFxuICAgICAgICAgICAgKHJlc3BvbnNlKSA9PiByZXNvbHZlKHJlc3BvbnNlIHx8IHsgc3VjY2VzczogZmFsc2UgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGJnUmVzICYmIGJnUmVzLnN1Y2Nlc3MgJiYgYmdSZXMuZGF0YVVybCkge1xuICAgICAgICAgIGlmIChtYXhQYWdlSGVpZ2h0IDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiBiZ1Jlcy5kYXRhVXJsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYXdhaXQgc2NhbGVEYXRhVXJsKGJnUmVzLmRhdGFVcmwsIHF1YWxpdHksIG1heFBhZ2VIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cblxuICAgIGlmIChibG9iKSB7XG4gICAgICBpZiAobWF4UGFnZUhlaWdodCA8PSAwKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBibG9iVG9EYXRhVXJsKGJsb2IpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYml0bWFwID0gYXdhaXQgY3JlYXRlSW1hZ2VCaXRtYXAoYmxvYik7XG4gICAgICAgIGxldCB3aWR0aCA9IGJpdG1hcC53aWR0aDtcbiAgICAgICAgbGV0IGhlaWdodCA9IGJpdG1hcC5oZWlnaHQ7XG4gICAgICAgIGlmIChtYXhQYWdlSGVpZ2h0ID4gMCAmJiBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0KSB7XG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSBtYXhQYWdlSGVpZ2h0IC8gaGVpZ2h0O1xuICAgICAgICAgIHdpZHRoID0gTWF0aC5yb3VuZCh3aWR0aCAqIHNjYWxlKTtcbiAgICAgICAgICBoZWlnaHQgPSBtYXhQYWdlSGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGlmIChjdHgpIHtcbiAgICAgICAgICBjdHguZHJhd0ltYWdlKGJpdG1hcCwgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCBxdWFsaXR5KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIHJldHVybiBhd2FpdCBibG9iVG9EYXRhVXJsKGJsb2IpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGV4cG9ydCBpbWFnZSBmcm9tICR7dXJsfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbm9uLTIwMCBIVFRQIHJlc3BvbnNlcyAoNDI5LCA1MDAsIDUwMiwgNTAzLCA0MDEsIDQwMywgZXRjLilcbiAgICogLSA0MDEvNDAzOiBQYXVzZXMgZG93bmxvYWQgdG8gbGV0IHVzZXIgYXV0aGVudGljYXRlIG9yIHJlbmV3IGxvYW5cbiAgICogLSA0MjkgJiA1eHg6IEluaXRpYXRlcyBleHBvbmVudGlhbCBiYWNrb2ZmIHdpdGggbGl2ZSBjb3VudGRvd24gYW5kIGluY3JlYXNlcyBwYWNpbmdcbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyOiBIdHRwRXJyb3JJbmZvLCB0YXJnZXRQYWdlTnVtOiBudW1iZXIpIHtcbiAgICBjb25zZWN1dGl2ZUVycm9yQ291bnQrKztcblxuICAgIC8vIDQwMSAvIDQwMzogQXV0aC9Gb3JiaWRkZW5cbiAgICBpZiAoZXJyLnN0YXR1c0NvZGUgPT09IDQwMSB8fCBlcnIuc3RhdHVzQ29kZSA9PT0gNDAzKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbQXJjaGl2ZURvd25sb2FkZXJdIEFjY2VzcyByZXN0cmljdGVkIChIVFRQICR7ZXJyLnN0YXR1c0NvZGV9KSBvbiAke2Vyci51cmx9LiBQYXVzaW5nLmApO1xuICAgICAgaXNQYXVzZWQgPSB0cnVlO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgICAgICBzdGF0dXNUZXh0OiBgQWNjZXNzIHJlc3RyaWN0ZWQgKEhUVFAgJHtlcnIuc3RhdHVzQ29kZX0pLiBQbGVhc2UgY2hlY2sgbG9naW4gb3IgbG9hbiBzdGF0dXMuYCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJhdGUgTGltaXRpbmcgKDQyOSkgJiBTZXJ2ZXIgRXJyb3JzICg1MDAsIDUwMiwgNTAzLCA1MDQpXG4gICAgLy8gSWYgdGhlIHNlcnZlciBleHBsaWNpdGx5IHNwZWNpZmllcyBSZXRyeS1BZnRlciwgaG9ub3IgaXQuXG4gICAgLy8gT3RoZXJ3aXNlIGZhbGxiYWNrIHRvIGV4cG9uZW50aWFsIGJhY2tvZmY6IDEwcywgMjBzLCA0MHMsIGNhcHBlZCBhdCA2MHMuXG4gICAgY29uc3QgaXNTZXJ2ZXJSZXF1ZXN0ZWQgPSB0eXBlb2YgZXJyLnJldHJ5QWZ0ZXIgPT09ICdudW1iZXInICYmICFpc05hTihlcnIucmV0cnlBZnRlcikgJiYgZXJyLnJldHJ5QWZ0ZXIgPiAwO1xuICAgIGNvbnN0IGJhc2VTZWNvbmRzID0gaXNTZXJ2ZXJSZXF1ZXN0ZWRcbiAgICAgID8gZXJyLnJldHJ5QWZ0ZXJcbiAgICAgIDogTWF0aC5taW4oMTAgKiBNYXRoLnBvdygyLCBNYXRoLm1heCgwLCBjb25zZWN1dGl2ZUVycm9yQ291bnQgLSAxKSksIDYwKTtcblxuICAgIC8vIEF1dG9tYXRpY2FsbHkgaW5jcmVhc2UgaW50ZXItcGFnZSBwYWNpbmcgZGVsYXkgdG8gcHJldmVudCByZWN1cnJpbmcgZXJyb3JzXG4gICAgY29uc3QgcHJldkRlbGF5ID0gY29uZmlnLnBhZ2VEZWxheU1zO1xuICAgIGNvbmZpZy5wYWdlRGVsYXlNcyA9IE1hdGgubWluKE1hdGgubWF4KGNvbmZpZy5wYWdlRGVsYXlNcywgMTUwMCkgKyA1MDAsIDUwMDApO1xuICAgIGlmIChjb25maWcucGFnZURlbGF5TXMgIT09IHByZXZEZWxheSkge1xuICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gSW5jcmVhc2VkIHBhZ2UgcGFjaW5nIGRlbGF5IHRvICR7Y29uZmlnLnBhZ2VEZWxheU1zfW1zLmApO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IGVyci5zdGF0dXNDb2RlID09PSA0MjlcbiAgICAgID8gJ1JhdGUgTGltaXRlZCdcbiAgICAgIDogKGVyci5zdGF0dXNDb2RlID49IDUwMCA/IGBTZXJ2ZXIgRXJyb3IgKCR7ZXJyLnN0YXR1c0NvZGV9KWAgOiBgSFRUUCAke2Vyci5zdGF0dXNDb2RlfWApO1xuXG4gICAgaWYgKGlzU2VydmVyUmVxdWVzdGVkKSB7XG4gICAgICBsYWJlbCArPSAnIChzZXJ2ZXIgYXNrZWQpJztcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gJHtsYWJlbH0gb24gJHtlcnIudXJsfS4gQmFja2luZyBvZmYgZm9yICR7TWF0aC5yb3VuZChiYXNlU2Vjb25kcyl9cy4uLmApO1xuXG4gICAgZm9yIChsZXQgcmVtYWluaW5nID0gTWF0aC5yb3VuZChiYXNlU2Vjb25kcyk7IHJlbWFpbmluZyA+IDA7IHJlbWFpbmluZy0tKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuO1xuICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm47XG4gICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERpc3BsYXkgaW4gbWludXRlcyBpZiBtb3JlIHRoYW4gMTIwcywgb3RoZXJ3aXNlIGluIHNlY29uZHNcbiAgICAgIGNvbnN0IHRpbWVTdHIgPSByZW1haW5pbmcgPiAxMjBcbiAgICAgICAgPyBgJHtNYXRoLnJvdW5kKHJlbWFpbmluZyAvIDYwKX1tYFxuICAgICAgICA6IGAke3JlbWFpbmluZ31zYDtcblxuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdyZXRyeWluZycsXG4gICAgICAgIHJldHJ5Q291bnQ6IGNvbnNlY3V0aXZlRXJyb3JDb3VudCxcbiAgICAgICAgc3RhdHVzVGV4dDogYCR7dGltZVN0cn0gUmV0cnlpbmc6ICR7bGFiZWx9LmAsXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHNsZWVwKDEwMDApO1xuICAgIH1cblxuICAgIC8vIEJhY2tvZmYgY29tcGxldGUhIFJlLW5hdmlnYXRlIHRvIHRhcmdldFBhZ2VOdW0gc28gcmVhZGVyIHJlLWZldGNoZXMgY2xlYW5seVxuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEJhY2tvZmYgY29tcGxldGVkLiBSZS1yZXF1ZXN0aW5nIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4uLmApO1xuICAgIGF3YWl0IHByb3ZpZGVyLnRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtKTtcbiAgICBhd2FpdCBzbGVlcCg4MDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEZhc3QgUGFnZSBUdXJuICYgV2FpdCBFbmdpbmU6XG4gICAqIDEuIFRyaWdnZXJzIHBhZ2UgZmxpcCB2aWEgcHJvdmlkZXIuXG4gICAqIDIuIFBvbGxzIGF0IGhpZ2ggZnJlcXVlbmN5ICgxMDBtcykgYW5kIHJldHVybnMgdGhlIG5ldyBpbWFnZSBpbW1lZGlhdGVseSBvbmNlIHZpc2libGUuXG4gICAqIDMuIFJlamVjdHMgcGFnZSBsb2FkIGlmIGFueSBub24tMjAwIEhUVFAgcmVzcG9uc2UgKDQyOSwgNTAwLCA0MDEsIGV0Yy4pIHdhcyByZWNlaXZlZC5cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHR1cm5BbmRHZXROZXh0SW1hZ2UoXG4gICAgbGFzdFNyYzogc3RyaW5nLFxuICAgIHRhcmdldFBhZ2VOdW06IG51bWJlclxuICApOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsPiB7XG4gICAgbGV0IHJldHJ5QXR0ZW1wdCA9IDA7XG4gICAgaXNFbmRPZkJvb2sgPSBmYWxzZTtcblxuICAgIHdoaWxlIChyZXRyeUF0dGVtcHQgPD0gY29uZmlnLm1heFJldHJpZXMpIHtcbiAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcblxuICAgICAgLy8gSGFuZGxlIHBhdXNlIC8gb2ZmbGluZVxuICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgYXdhaXQgc2xlZXAoNTAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gMS4gQ2hlY2sgaWYgcmVhZGVyIGlzIGFscmVhZHkgYXQgZW5kIG9mIGJvb2tcbiAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwO1xuICAgICAgaWYgKHByb3ZpZGVyLmlzQXRFbmRPZkJvb2sgJiYgcHJvdmlkZXIuaXNBdEVuZE9mQm9vayh0YXJnZXRQYWdlTnVtLCB0b3RhbFBhZ2VzKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBFbmQgb2YgYm9vayByZWFjaGVkIGF0IHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS5gKTtcbiAgICAgICAgaXNFbmRPZkJvb2sgPSB0cnVlO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG9tUGFnZUJlZm9yZSA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICBpZiAodG90YWxQYWdlcyA+IDAgJiYgZG9tUGFnZUJlZm9yZSAhPT0gbnVsbCAmJiBkb21QYWdlQmVmb3JlID49IHRvdGFsUGFnZXMgJiYgdGFyZ2V0UGFnZU51bSA+IHRvdGFsUGFnZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRW5kIG9mIGJvb2sgcmVhY2hlZCBhdCBwYWdlICR7ZG9tUGFnZUJlZm9yZX0uYCk7XG4gICAgICAgIGlzRW5kT2ZCb29rID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIDIuIFRyaWdnZXIgcGFnZSBmbGlwIG9yIGNoZWNrIGlmIGFscmVhZHkgdHVybmVkXG4gICAgICBjb25zdCBhbHJlYWR5VHVybmVkID0gZG9tUGFnZUJlZm9yZSAhPT0gbnVsbCAmJiBkb21QYWdlQmVmb3JlID49IHRhcmdldFBhZ2VOdW07XG5cbiAgICAgIGlmIChyZXRyeUF0dGVtcHQgPiAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFJldHJ5ICR7cmV0cnlBdHRlbXB0fTogcmUtdHJpZ2dlcmluZyBmbGlwIHRvIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4uLmApO1xuICAgICAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgIGlmIChyZXRyeUF0dGVtcHQgPj0gMiAmJiBwcm92aWRlci5uYXZpZ2F0ZVRvUGFnZSkge1xuICAgICAgICAgIC8vIERpcmVjdCBuYXZpZ2F0aW9uIGZhbGxiYWNrIG9uIHJlcGVhdGVkIHN0YWxsXG4gICAgICAgICAgYXdhaXQgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2UodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIWFscmVhZHlUdXJuZWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRmxpcHBpbmcgdG8gcGFnZSAke3RhcmdldFBhZ2VOdW19IChhdHRlbXB0IDEvJHtjb25maWcubWF4UmV0cmllcyArIDF9KS4uLmApO1xuICAgICAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBET00gaW5kaWNhdGVzIHBhZ2UgaXMgYWxyZWFkeSBvbiBzZXF1ZW5jZS9sZWFmICR7ZG9tUGFnZUJlZm9yZX0uIFdhaXRpbmcgZm9yIGltYWdlLmApO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiBGYXN0IHBvbGwgd2l0aCBIVFRQIGVycm9yIHJlamVjdGlvblxuICAgICAgY29uc3QgY2hlY2tTdGFydCA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCB0aW1lb3V0TXMgPSA1MDAwOyAvLyA1IHNlY29uZHMgbWF4IHBlciBmbGlwIGF0dGVtcHRcbiAgICAgIGxldCBudWRnZWQgPSBmYWxzZTtcblxuICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBjaGVja1N0YXJ0IDwgdGltZW91dE1zKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIHJldHVybiBudWxsO1xuICAgICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDUklUSUNBTDogUmVqZWN0IHBhZ2UgbG9hZCBpZiBhbiBIVFRQIGVycm9yICg0MjksIDUwMCwgNDAxLCBldGMuKSBvY2N1cnJlZCFcbiAgICAgICAgaWYgKGxhc3RIdHRwRXJyb3IgJiYgKERhdGUubm93KCkgLSBsYXN0SHR0cEVycm9yLnRpbWVzdGFtcCA8IDEwMDAwKSkge1xuICAgICAgICAgIGNvbnN0IGVyciA9IGxhc3RIdHRwRXJyb3I7XG4gICAgICAgICAgbGFzdEh0dHBFcnJvciA9IG51bGw7IC8vIGNvbnN1bWUgZXJyb3JcbiAgICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3RhcmdldFBhZ2VOdW19IGxvYWQgcmVqZWN0ZWQgZHVlIHRvIEhUVFAgJHtlcnIuc3RhdHVzQ29kZX0gb24gJHtlcnIudXJsfWApO1xuXG4gICAgICAgICAgLy8gSW5pdGlhdGUgYmFja29mZlxuICAgICAgICAgIGF3YWl0IGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyLCB0YXJnZXRQYWdlTnVtKTtcblxuICAgICAgICAgIC8vIFJlc3RhcnQgcG9sbGluZyBhZnRlciBiYWNrb2ZmXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3YWl0aW5nIG1vcmUgdGhhbiAxMDAwbXMgd2l0aG91dCB0aGUgaW1hZ2UgYXBwZWFyaW5nLCBzZW5kIGEgbnVkZ2UgZmxpcCBhbmQgZGlyZWN0IGp1bXBcbiAgICAgICAgaWYgKCFudWRnZWQgJiYgRGF0ZS5ub3coKSAtIGNoZWNrU3RhcnQgPiAxMDAwKSB7XG4gICAgICAgICAgbnVkZ2VkID0gdHJ1ZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBJbWFnZSBub3QgeWV0IGNvbmZpcm1lZCBhZnRlciAxLjBzLiBOdWRnaW5nIGZsaXAvanVtcCB0byBwYWdlICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICAgICAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgICAgaWYgKHByb3ZpZGVyLm5hdmlnYXRlVG9QYWdlKSB7XG4gICAgICAgICAgICBhd2FpdCBwcm92aWRlci5uYXZpZ2F0ZVRvUGFnZSh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBzbGVlcCg1MCk7XG5cbiAgICAgICAgY29uc3QgYWN0aXZlSW1nID0gcHJvdmlkZXIuZ2V0QWN0aXZlUGFnZUltYWdlKDIwMCwgdGFyZ2V0UGFnZU51bSk7XG4gICAgICAgIGlmIChhY3RpdmVJbWcgJiYgYWN0aXZlSW1nLmNvbXBsZXRlICYmIChhY3RpdmVJbWcubmF0dXJhbFdpZHRoID49IDIwMCB8fCBhY3RpdmVJbWcud2lkdGggPj0gMjAwKSAmJiBhY3RpdmVJbWcuc3JjKSB7XG4gICAgICAgICAgLy8gRG91YmxlIGNoZWNrIG5vIHBlbmRpbmcgSFRUUCBlcnJvciBiZWZvcmUgYWNjZXB0aW5nIGltYWdlXG4gICAgICAgICAgaWYgKGxhc3RIdHRwRXJyb3IgJiYgKERhdGUubm93KCkgLSBsYXN0SHR0cEVycm9yLnRpbWVzdGFtcCA8IDMwMDApKSB7XG4gICAgICAgICAgICBjb250aW51ZTsgLy8gRG8gbm90IGFjY2VwdCBpbWFnZSB3aGVuIGVycm9yIGlzIHBlbmRpbmchXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaXNOZXdTcmMgPSAhbGFzdFNyYyB8fCBhY3RpdmVJbWcuc3JjICE9PSBsYXN0U3JjO1xuICAgICAgICAgIGlmIChpc05ld1NyYykge1xuICAgICAgICAgICAgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICAgICAgICAgICAgY29uc2VjdXRpdmVFcnJvckNvdW50ID0gMDtcbiAgICAgICAgICAgIGFjdGl2ZUltZy5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICAgIGNvbnN0IGRvbU5vdyA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICAgICAgICBjb25zdCBsZWFmSW5mbyA9IGRvbU5vdyAhPT0gbnVsbCA/IGAgW0RPTSBwYWdlICR7ZG9tTm93fV1gIDogJyc7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBQYWdlICR7dGFyZ2V0UGFnZU51bX0gaW1hZ2UgbG9hZGVkJHtsZWFmSW5mb30gKCR7YWN0aXZlSW1nLm5hdHVyYWxXaWR0aH14JHthY3RpdmVJbWcubmF0dXJhbEhlaWdodH1weCkhYCk7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlSW1nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aW1lZCBvdXQgb3IgYmFja2VkIG9mZiB3aXRob3V0IHBhZ2UgY2hhbmdpbmc6XG4gICAgICByZXRyeUF0dGVtcHQrKztcbiAgICAgIGN1cnJlbnRSZXRyeUNvdW50ID0gcmV0cnlBdHRlbXB0O1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgW0FyY2hpdmVEb3dubG9hZGVyXSBQYWdlIGRpZCBOT1QgY2hhbmdlIGFmdGVyIGZsaXAgYXR0ZW1wdCAke3JldHJ5QXR0ZW1wdH0gZm9yIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4gUmV0cnlpbmcuLi5gXG4gICAgICApO1xuXG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogJ3JldHJ5aW5nJyxcbiAgICAgICAgcmV0cnlDb3VudDogcmV0cnlBdHRlbXB0LFxuICAgICAgICBzdGF0dXNUZXh0OiBgUmV0cnlpbmcgcGFnZSB0dXJuICgke3JldHJ5QXR0ZW1wdH0vJHtjb25maWcubWF4UmV0cmllc30pLi4uYCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBRdWljayBiYWNrb2ZmIGRlbGF5IG9uIGluaXRpYWwgcmV0cmllczogMXMsIDJzLCAzcy4uLiAobWF4IDVzKVxuICAgICAgY29uc3QgYmFja29mZlNlYyA9IE1hdGgubWluKHJldHJ5QXR0ZW1wdCwgNSk7XG4gICAgICBhd2FpdCBzbGVlcChiYWNrb2ZmU2VjICogMTAwMCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5lcnJvcihgW0FyY2hpdmVEb3dubG9hZGVyXSBGYWlsZWQgdG8gZmxpcCB0byBwYWdlICR7dGFyZ2V0UGFnZU51bX0gYWZ0ZXIgJHtjb25maWcubWF4UmV0cmllc30gYXR0ZW1wdHMuYCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogTWFpbiBkb3dubG9hZCBhbmQgY2FwdHVyZSBvcmNoZXN0cmF0aW9uIGxvb3BcbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0RG93bmxvYWQodXNlckNvbmZpZz86IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pIHtcbiAgICBpZiAoaXNSdW5uaW5nICYmICFpc1BhdXNlZCkgcmV0dXJuO1xuXG4gICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICByZXN1bWVEb3dubG9hZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlzUnVubmluZyA9IHRydWU7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBzdG9wUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICAgIGRvd25sb2FkZWRQYWdlcyA9IDA7XG4gICAgZmFpbGVkUGFnZXMgPSAwO1xuICAgIGNvbGxlY3RlZEltYWdlcyA9IFtdO1xuICAgIGNvbGxlY3RlZFRleHRzID0gW107XG5cbiAgICBpZiAodXNlckNvbmZpZykge1xuICAgICAgY29uZmlnID0geyAuLi5jb25maWcsIC4uLnVzZXJDb25maWcgfTtcbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIGJvb2sgZGV0ZWN0aW9uXG4gICAgYXdhaXQgcmVmcmVzaEJvb2tJbmZvKCk7XG5cbiAgICBjb25zdCB0b3RhbFBhZ2VzID0gYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgY29uZmlnLmVuZFBhZ2UgfHwgNTAwO1xuICAgIGNvbnN0IHN0YXJ0UCA9IHR5cGVvZiBjb25maWcuc3RhcnRQYWdlID09PSAnbnVtYmVyJ1xuICAgICAgPyBNYXRoLm1heChwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlLCBjb25maWcuc3RhcnRQYWdlKVxuICAgICAgOiBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlO1xuXG4gICAgY29uc3QgbWF4Qm9va1BhZ2UgPSBwcm92aWRlci5zaXRlSWQgPT09ICdhcmNoaXZlJyAmJiBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlID09PSAwXG4gICAgICA/IE1hdGgubWF4KDAsIHRvdGFsUGFnZXMgLSAxKVxuICAgICAgOiB0b3RhbFBhZ2VzO1xuXG4gICAgY29uc3QgZW5kUCA9IGNvbmZpZy5lbmRQYWdlID4gMFxuICAgICAgPyBjb25maWcuZW5kUGFnZVxuICAgICAgOiBtYXhCb29rUGFnZTtcblxuICAgIGNvbnN0IGJvb2tUaXRsZSA9IGJvb2tJbmZvPy5ib29rVGl0bGUgfHwgYCR7cHJvdmlkZXIuc2l0ZU5hbWV9IEJvb2tgO1xuICAgIGNvbnN0IGJvb2tJZCA9IGJvb2tJbmZvPy5ib29rSWQgfHwgJ2Jvb2snO1xuICAgIGNvbnN0IHN1YkRpciA9IGZvcm1hdFN1YmRpcihjb25maWcuYmFzZURpciwgY29uZmlnLmZvbGRlclBhdHRlcm4sIGJvb2tUaXRsZSwgYm9va0lkKTtcblxuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFN0YXJ0aW5nIGRvd25sb2FkOiBwYWdlcyAke3N0YXJ0UH0gdG8gJHtlbmRQfSBpbnRvICcke3N1YkRpcn0nYCk7XG5cbiAgICAvLyBTdGVwIDE6IEVuc3VyZSBTaW5nbGUtUGFnZSBNb2RlIGlmIGNvbmZpZ3VyZWQgYW5kIHN1cHBvcnRlZFxuICAgIGlmIChjb25maWcuYXV0b1NpbmdsZVBhZ2UgJiYgcHJvdmlkZXIuZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKSB7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2Vuc3VyaW5nX21vZGUnLCBzdGF0dXNUZXh0OiAnU3dpdGNoaW5nIHRvIDEtcGFnZSBtb2RlLi4uJyB9KTtcbiAgICAgIGF3YWl0IGVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpO1xuICAgICAgYXdhaXQgc2xlZXAoNjAwKTtcbiAgICB9XG5cbiAgICAvLyBTdGVwIDI6IEFsd2F5cyBuYXZpZ2F0ZSB0byB0aGUgc3RhcnRpbmcgcGFnZVxuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogJ2Rvd25sb2FkaW5nJyxcbiAgICAgIGN1cnJlbnRQYWdlOiBzdGFydFAsXG4gICAgICBzdGF0dXNUZXh0OiBgTmF2aWdhdGluZyB0byBwYWdlICR7c3RhcnRQfS4uLmAsXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBzdGFydGluZyBwYWdlL2xlYWYgJHtzdGFydFB9Li4uYCk7XG4gICAgYXdhaXQgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2Uoc3RhcnRQKTtcblxuICAgIC8vIEdpdmUgcmVhZGVyIHRpbWUgdG8gbG9hZCBhbmQgcmVuZGVyIHN0YXJ0UFxuICAgIGF3YWl0IHNsZWVwKDEyMDApO1xuXG4gICAgbGV0IGxhc3RJbWdTcmMgPSAnJztcbiAgICBsZXQgY3VycmVudEltZzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgcGFnZU51bSA9IHN0YXJ0UDsgcGFnZU51bSA8PSBlbmRQOyBwYWdlTnVtKyspIHtcbiAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSBicmVhaztcblxuICAgICAgY3VycmVudFBhZ2UgPSBwYWdlTnVtO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdkb3dubG9hZGluZycsXG4gICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICBzdGF0dXNUZXh0OiBgQ2FwdHVyaW5nIHBhZ2UgJHtwYWdlTnVtfWAsXG4gICAgICB9KTtcblxuICAgICAgLy8gRm9yIHRoZSBmaXJzdCBwYWdlIChvciByZWNvdmVyeSksIHdhaXQgZm9yIHRoZSBpbWFnZSB0byBiZSByZWFkeVxuICAgICAgaWYgKCFjdXJyZW50SW1nKSB7XG4gICAgICAgIGNvbnN0IHdhaXRJbWFnZVN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd2hpbGUgKERhdGUubm93KCkgLSB3YWl0SW1hZ2VTdGFydCA8IDE1MDAwKSB7XG4gICAgICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIGJyZWFrO1xuICAgICAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIGJyZWFrO1xuICAgICAgICAgICAgYXdhaXQgc2xlZXAoNTAwKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdXJyZW50SW1nID0gcHJvdmlkZXIuZ2V0QWN0aXZlUGFnZUltYWdlKDIwMCwgcGFnZU51bSk7XG4gICAgICAgICAgaWYgKGN1cnJlbnRJbWcpIGJyZWFrO1xuICAgICAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFjdXJyZW50SW1nKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBQYWdlICR7cGFnZU51bX0gaW1hZ2UgdGltZWQgb3V0LmApO1xuICAgICAgICBmYWlsZWRQYWdlcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcGFnZVRvUHJvY2VzcyA9IHBhZ2VOdW07XG4gICAgICAgIGNvbnN0IHBhZ2VJbWcgPSBjdXJyZW50SW1nO1xuICAgICAgICBjb25zdCBwYWdlSW1nU3JjID0gY3VycmVudEltZy5zcmM7XG4gICAgICAgIGxhc3RJbWdTcmMgPSBwYWdlSW1nU3JjO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBmaW5hbCBwYWdlIGRpbWVuc2lvbnNcbiAgICAgICAgbGV0IHBhZ2VXID0gcGFnZUltZy5uYXR1cmFsV2lkdGggfHwgcGFnZUltZy53aWR0aCB8fCAwO1xuICAgICAgICBsZXQgcGFnZUggPSBwYWdlSW1nLm5hdHVyYWxIZWlnaHQgfHwgcGFnZUltZy5oZWlnaHQgfHwgMDtcbiAgICAgICAgaWYgKGNvbmZpZy5tYXhQYWdlSGVpZ2h0ICYmIGNvbmZpZy5tYXhQYWdlSGVpZ2h0ID4gMCAmJiBwYWdlSCA+IGNvbmZpZy5tYXhQYWdlSGVpZ2h0KSB7XG4gICAgICAgICAgcGFnZVcgPSBNYXRoLnJvdW5kKHBhZ2VXICogKGNvbmZpZy5tYXhQYWdlSGVpZ2h0IC8gcGFnZUgpKTtcbiAgICAgICAgICBwYWdlSCA9IGNvbmZpZy5tYXhQYWdlSGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSB7IHdpZHRoOiBwYWdlVywgaGVpZ2h0OiBwYWdlSCB9O1xuICAgICAgICBsYXN0RGltZW5zaW9ucyA9IGRpbWVuc2lvbnM7XG5cbiAgICAgICAgLy8gR1JBQiBORVhUIFBBR0UgSU1NRURJQVRFTFk6IFRyaWdnZXIgdGhlIGZsaXAgdG8gcGFnZU51bSArIDEgcmlnaHQgbm93IVxuICAgICAgICBjb25zdCBuZXh0VHVyblByb21pc2UgPSAocGFnZU51bSA8IGVuZFAgJiYgIXN0b3BSZXF1ZXN0ZWQpXG4gICAgICAgICAgPyB0dXJuQW5kR2V0TmV4dEltYWdlKHBhZ2VJbWdTcmMsIHBhZ2VOdW0gKyAxKVxuICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICAvLyBDb25jdXJyZW50bHkgY2FwdHVyZSBpbWFnZSBkYXRhIGFuZCBleHRyYWN0IE9DUiB0ZXh0IGZvciBwYWdlVG9Qcm9jZXNzXG4gICAgICAgIGNvbnN0IGNhcHR1cmVQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgW2RhdGFVcmwsIHRleHRdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICBjYXB0dXJlSW1hZ2VUb0RhdGFVcmwocGFnZUltZywgY29uZmlnLmltYWdlUXVhbGl0eSwgY29uZmlnLm1heFBhZ2VIZWlnaHQpLFxuICAgICAgICAgICAgICBjb25maWcuc2F2ZVRleHRNZCA/IChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIGxldCB0ID0gYXdhaXQgcHJvdmlkZXIuZXh0cmFjdFBhZ2VUZXh0KHBhZ2VUb1Byb2Nlc3MsIHBhZ2VJbWcpO1xuICAgICAgICAgICAgICAgICAgaWYgKGxhc3RIdHRwRXJyb3IgJiYgKERhdGUubm93KCkgLSBsYXN0SHR0cEVycm9yLnRpbWVzdGFtcCA8IDMwMDApKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGxhc3RIdHRwRXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RIdHRwRXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gT0NSIHRleHQgZmV0Y2ggZm9yIHBhZ2UgJHtwYWdlVG9Qcm9jZXNzfSBlbmNvdW50ZXJlZCBIVFRQICR7ZXJyLnN0YXR1c0NvZGV9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyLCBwYWdlVG9Qcm9jZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgdCA9IGF3YWl0IHByb3ZpZGVyLmV4dHJhY3RQYWdlVGV4dChwYWdlVG9Qcm9jZXNzLCBwYWdlSW1nKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gQ291bGQgbm90IGV4dHJhY3QgdGV4dCBmb3IgcGFnZSAke3BhZ2VUb1Byb2Nlc3N9OmAsIGVycik7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSgpIDogUHJvbWlzZS5yZXNvbHZlKCcnKSxcbiAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICAvLyBTdG9yZSBmb3IgUERGIGNvbXBpbGVyIChkZWR1cGxpY2F0ZSBieSBwYWdlTnVtKVxuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZW5lcmF0ZVBkZikge1xuICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ0lkeCA9IGNvbGxlY3RlZEltYWdlcy5maW5kSW5kZXgoaSA9PiBpLnBhZ2VOdW0gPT09IHBhZ2VUb1Byb2Nlc3MpO1xuICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdJZHggPj0gMCkge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZEltYWdlc1tleGlzdGluZ0lkeF0gPSB7XG4gICAgICAgICAgICAgICAgICBwYWdlTnVtOiBwYWdlVG9Qcm9jZXNzLFxuICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVVybCxcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiBwYWdlVyxcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFnZUgsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0ZWRJbWFnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBwYWdlTnVtOiBwYWdlVG9Qcm9jZXNzLFxuICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVVybCxcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiBwYWdlVyxcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFnZUgsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG93bmxvYWRlZFBhZ2VzID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gU2F2ZSBpbmRpdmlkdWFsIGltYWdlIGZpbGUgaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zYXZlSW1hZ2VzKSB7XG4gICAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnRE9XTkxPQURfUEFHRV9JTUFHRScsXG4gICAgICAgICAgICAgICAgYm9va1RpdGxlLFxuICAgICAgICAgICAgICAgIHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsXG4gICAgICAgICAgICAgICAgdG90YWxQYWdlczogZW5kUCxcbiAgICAgICAgICAgICAgICBkYXRhVXJsLFxuICAgICAgICAgICAgICAgIHN1YkRpcixcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIE9DUiB0ZXh0XG4gICAgICAgICAgICBpZiAoY29uZmlnLnNhdmVUZXh0TWQgJiYgdGV4dCkge1xuICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1RleHRJZHggPSBjb2xsZWN0ZWRUZXh0cy5maW5kSW5kZXgodCA9PiB0LnBhZ2VOdW0gPT09IHBhZ2VUb1Byb2Nlc3MpO1xuICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdUZXh0SWR4ID49IDApIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0ZWRUZXh0c1tleGlzdGluZ1RleHRJZHhdID0geyBwYWdlTnVtOiBwYWdlVG9Qcm9jZXNzLCBsZWFmSW5kZXg6IHBhZ2VUb1Byb2Nlc3MsIHRleHQgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0ZWRUZXh0cy5wdXNoKHsgcGFnZU51bTogcGFnZVRvUHJvY2VzcywgbGVhZkluZGV4OiBwYWdlVG9Qcm9jZXNzLCB0ZXh0IH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgICAgICAgY3VycmVudFBhZ2U6IHBhZ2VUb1Byb2Nlc3MsXG4gICAgICAgICAgICAgIGRvd25sb2FkZWRQYWdlcyxcbiAgICAgICAgICAgICAgY3VycmVudFRodW1ibmFpbDogZGF0YVVybCxcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogYENhcHR1cmluZyBwYWdlICR7cGFnZVRvUHJvY2Vzc31gLFxuICAgICAgICAgICAgICBpbWFnZURpbWVuc2lvbnM6IGRpbWVuc2lvbnMsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICBmYWlsZWRQYWdlcysrO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0FyY2hpdmVEb3dubG9hZGVyXSBFcnJvciBwcm9jZXNzaW5nIHBhZ2UgJHtwYWdlVG9Qcm9jZXNzfTpgLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcblxuICAgICAgICAvLyBBd2FpdCBjdXJyZW50IHBhZ2UgY2FwdHVyZSBhbmQgc3RvcmFnZVxuICAgICAgICBhd2FpdCBjYXB0dXJlUHJvbWlzZTtcblxuICAgICAgICAvLyBJZiBub3QgdGhlIGxhc3QgcGFnZSwgd2FpdCBmb3IgdGhlIG5leHQgcGFnZSBmbGlwIHRvIHJlc29sdmVcbiAgICAgICAgaWYgKG5leHRUdXJuUHJvbWlzZSkge1xuICAgICAgICAgIGNvbnN0IG5leHRJbWcgPSBhd2FpdCBuZXh0VHVyblByb21pc2U7XG4gICAgICAgICAgaWYgKCFuZXh0SW1nKSB7XG4gICAgICAgICAgICBpZiAoaXNFbmRPZkJvb2spIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gUmVhY2hlZCBlbmQgb2YgYm9vayBhdCBwYWdlICR7cGFnZU51bX0uIEZpbmFsaXppbmcuYCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGYWlsZWQgYWZ0ZXIgcmV0cmllczogcHJvbXB0IHVzZXIgdG8gc2F2ZSBjYXB0dXJlZCBwYWdlcyFcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgdHVybiBwYXN0IHBhZ2UgJHtwYWdlTnVtfS4gUHJvbXB0aW5nIHVzZXIgdG8gc2F2ZS5gKTtcbiAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCB8fCBkb3dubG9hZGVkUGFnZXM7XG4gICAgICAgICAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZVN0b3BSZXF1ZXN0KGBDYW5ub3QgY29udGludWUgcGFzdCBwYWdlICR7cGFnZU51bX0uIFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTmV4dCBwYWdlIGlzIHJlYWR5IGZvciB0aGUgbmV4dCBpdGVyYXRpb24hXG4gICAgICAgICAgY3VycmVudEltZyA9IG5leHRJbWc7XG5cbiAgICAgICAgICAvLyBTeW5jaHJvbml6ZSBwYWdlIGNvdW50ZXIgaWYgdmlld2VyIGlzIGFoZWFkIChBcmNoaXZlLm9yZyBsZWFmLWp1bXBpbmcpXG4gICAgICAgICAgaWYgKHByb3ZpZGVyLnNpdGVJZCAhPT0gJ2hhdGhpdHJ1c3QnKSB7XG4gICAgICAgICAgICBjb25zdCBkb21QYWdlTm93ID0gcHJvdmlkZXIuZ2V0Q3VycmVudFBhZ2UoKTtcbiAgICAgICAgICAgIGlmIChkb21QYWdlTm93ICE9PSBudWxsICYmIGRvbVBhZ2VOb3cgPiBwYWdlTnVtKSB7XG4gICAgICAgICAgICAgIHBhZ2VOdW0gPSBkb21QYWdlTm93IC0gMTsgLy8gcGFnZU51bSsrIGluIHRoZSBmb3ItbG9vcCB3aWxsIHNldCBwYWdlTnVtID0gZG9tUGFnZU5vd1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFdyYXAtdXA6IEdlbmVyYXRlIFBERiBhbmQgTWFya2Rvd24gZmlsZXNcbiAgICBpZiAoIXN0b3BSZXF1ZXN0ZWQgJiYgZG93bmxvYWRlZFBhZ2VzID4gMCkge1xuICAgICAgYXdhaXQgZmluYWxpemVCb29rKHN1YkRpciwgYm9va1RpdGxlKTtcbiAgICB9XG5cbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6IHN0b3BSZXF1ZXN0ZWQgPyAnaWRsZScgOiAnY29tcGxldGUnLFxuICAgICAgc3RhdHVzVGV4dDogc3RvcFJlcXVlc3RlZCA/ICdTdG9wcGVkIGJ5IHVzZXInIDogYENvbXBsZXRlZCEgU2F2ZWQgJHtkb3dubG9hZGVkUGFnZXN9IHBhZ2VzLmAsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW5kIHRyaWdnZXJzIGRvd25sb2FkIGZvciB0aGUgZmluYWwgUERGIGFuZCBNYXJrZG93biB0ZXh0IGRvY3VtZW50LlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gZmluYWxpemVCb29rKHN1YkRpcjogc3RyaW5nLCBib29rVGl0bGU6IHN0cmluZykge1xuICAgIC8vIDEuIENvbXBpbGUgUERGXG4gICAgaWYgKGNvbmZpZy5nZW5lcmF0ZVBkZiAmJiBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdjb21waWxpbmdfcGRmJywgc3RhdHVzVGV4dDogJ0NvbXBpbGluZyBQREYgZG9jdW1lbnQuLi4nIH0pO1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gQXNzZW1ibGluZyBQREYgZnJvbScsIGNvbGxlY3RlZEltYWdlcy5sZW5ndGgsICdwYWdlcy4uLicpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwZGZCeXRlcyA9IGNvbXBpbGVKcGVnc1RvUGRmKGNvbGxlY3RlZEltYWdlcywge1xuICAgICAgICAgIHRpdGxlOiBib29rVGl0bGUsXG4gICAgICAgICAgYXV0aG9yOiBib29rSW5mbz8uYXV0aG9yIHx8IHByb3ZpZGVyLnNpdGVOYW1lLFxuICAgICAgICAgIGNyZWF0b3I6ICdBcmNoaXZlIERvd25sb2FkZXInLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBwZGZCbG9iID0gbmV3IEJsb2IoW3BkZkJ5dGVzXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vcGRmJyB9KTtcbiAgICAgICAgY29uc3QgcGRmQmxvYlVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwocGRmQmxvYik7XG5cbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdTQVZFX0ZJTkFMX0ZJTEVTJyxcbiAgICAgICAgICBib29rVGl0bGUsXG4gICAgICAgICAgc3ViRGlyLFxuICAgICAgICAgIHBkZkJsb2JVcmwsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFBERiBjb21waWxlZCBhbmQgc2VudCBmb3IgZG93bmxvYWQhJyk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW0FyY2hpdmVEb3dubG9hZGVyXSBGYWlsZWQgdG8gY29tcGlsZSBQREY6JywgZXJyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBTYXZlIE1hcmtkb3duIHRleHRcbiAgICBpZiAoY29uZmlnLnNhdmVUZXh0TWQpIHtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnc2F2aW5nX3RleHQnLCBzdGF0dXNUZXh0OiAnU2F2aW5nIE1hcmtkb3duIHRleHQuLi4nIH0pO1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gQXNzZW1ibGluZyBNYXJrZG93biBmcm9tJywgY29sbGVjdGVkVGV4dHMubGVuZ3RoLCAncGFnZSB0ZXh0cy4uLicpO1xuXG4gICAgICBjb25zdCBtZENvbnRlbnQgPSBidWlsZEJvb2tNYXJrZG93bihcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiBib29rVGl0bGUsXG4gICAgICAgICAgYm9va0lkOiBib29rSW5mbz8uYm9va0lkIHx8ICdib29rJyxcbiAgICAgICAgICBhdXRob3I6IGJvb2tJbmZvPy5hdXRob3IsXG4gICAgICAgICAgcHVibGlzaGVyOiBib29rSW5mbz8ucHVibGlzaGVyLFxuICAgICAgICAgIHllYXI6IGJvb2tJbmZvPy55ZWFyLFxuICAgICAgICAgIHNvdXJjZVVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgdG90YWxQYWdlczogYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgY3VycmVudFBhZ2UsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbGxlY3RlZFRleHRzXG4gICAgICApO1xuXG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdTQVZFX0ZJTkFMX0ZJTEVTJyxcbiAgICAgICAgYm9va1RpdGxlLFxuICAgICAgICBzdWJEaXIsXG4gICAgICAgIG1hcmtkb3duQ29udGVudDogbWRDb250ZW50LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIE1hcmtkb3duIGdlbmVyYXRlZCBhbmQgc2VudCBmb3IgZG93bmxvYWQhJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF1c2VEb3dubG9hZCgpIHtcbiAgICBpc1BhdXNlZCA9IHRydWU7XG4gICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdwYXVzZWQnLCBzdGF0dXNUZXh0OiAnRG93bmxvYWQgcGF1c2VkJyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc3VtZURvd25sb2FkKCkge1xuICAgIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdkb3dubG9hZGluZycsIHN0YXR1c1RleHQ6IGBSZXN1bWluZyBwYWdlICR7Y3VycmVudFBhZ2V9Li4uYCB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQ6IG51bWJlcikge1xuICAgIHN0b3BSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgc3RhdHVzOiAnY29tcGlsaW5nX3BkZicsXG4gICAgICBzdGF0dXNUZXh0OiBgU2F2aW5nICR7Y291bnR9IGNhcHR1cmVkIHBhZ2VzLi4uYCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJvb2tUaXRsZSA9IGJvb2tJbmZvPy5ib29rVGl0bGUgfHwgYCR7cHJvdmlkZXIuc2l0ZU5hbWV9IEJvb2tgO1xuICAgIGNvbnN0IGJvb2tJZCA9IGJvb2tJbmZvPy5ib29rSWQgfHwgJ2Jvb2snO1xuICAgIGNvbnN0IHN1YkRpciA9IGZvcm1hdFN1YmRpcihjb25maWcuYmFzZURpciwgY29uZmlnLmZvbGRlclBhdHRlcm4sIGJvb2tUaXRsZSwgYm9va0lkKTtcblxuICAgIGF3YWl0IGZpbmFsaXplQm9vayhzdWJEaXIsIGJvb2tUaXRsZSk7XG5cbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6ICdjb21wbGV0ZScsXG4gICAgICBkb3dubG9hZGVkUGFnZXM6IGNvdW50LFxuICAgICAgc3RhdHVzVGV4dDogYENvbXBsZXRlZCEgU2F2ZWQgJHtjb3VudH0gcGFnZXMuYCxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN0b3BSZXF1ZXN0KGN1c3RvbU1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBpZiAoIWlzUnVubmluZykge1xuICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAvLyBUZW1wb3JhcmlseSBwYXVzZSB0aGUgZG93bmxvYWQgY3ljbGUgd2hpbGUgdXNlciBkZWNpZGVzXG4gICAgICBpc1BhdXNlZCA9IHRydWU7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogJ3BhdXNlZCcsXG4gICAgICAgIHN0YXR1c1RleHQ6IGN1c3RvbU1lc3NhZ2UgfHwgYFBhdXNlZDogU2F2ZSAke2NvdW50fSBwYWdlcz9gLFxuICAgICAgfSk7XG5cbiAgICAgIHBpbGwuc2hvd1N0b3BQcm9tcHQoXG4gICAgICAgIGNvdW50LFxuICAgICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgLy8gWUVTOiBTYXZlIGV2ZXJ5dGhpbmcgYW5kIHRyZWF0IGxpa2UgY29tcGxldGUhXG4gICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gVXNlciBjb25maXJtZWQgc2F2aW5nICR7Y291bnR9IHBhZ2VzLmApO1xuICAgICAgICAgIGF3YWl0IHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQpO1xuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLy8gRElTQ0FSRFxuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFVzZXIgZGlzY2FyZGVkIGRvd25sb2FkcyBvbiBzdG9wLicpO1xuICAgICAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLy8gQ0FOQ0VMIC8gUkVTVU1FXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gUmVzdW1pbmcgZG93bmxvYWQuLi4nKTtcbiAgICAgICAgICByZXN1bWVEb3dubG9hZCgpO1xuICAgICAgICB9LFxuICAgICAgICBjdXN0b21NZXNzYWdlXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzdG9wRG93bmxvYWQoKSB7XG4gICAgc3RvcFJlcXVlc3RlZCA9IHRydWU7XG4gICAgaXNSdW5uaW5nID0gZmFsc2U7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBjb2xsZWN0ZWRJbWFnZXMgPSBbXTtcbiAgICBjb2xsZWN0ZWRUZXh0cyA9IFtdO1xuICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnaWRsZScsIHN0YXR1c1RleHQ6ICdEb3dubG9hZCBzdG9wcGVkJyB9KTtcbiAgfVxuXG4gIC8vIEhhbmRsZSBtZXNzYWdlcyBmcm9tIFBvcHVwIG9yIEJhY2tncm91bmQgU2VydmljZSBXb3JrZXJcbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlOiBFeHRlbnNpb25NZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XG4gICAgICBjYXNlICdHRVRfU1RBVEUnOiB7XG4gICAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGJvb2tJbmZvIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RBUlRfRE9XTkxPQUQnOiB7XG4gICAgICAgIHN0YXJ0RG93bmxvYWQobWVzc2FnZS5jb25maWcpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnUEFVU0VfRE9XTkxPQUQnOiB7XG4gICAgICAgIHBhdXNlRG93bmxvYWQoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1JFU1VNRV9ET1dOTE9BRCc6IHtcbiAgICAgICAgcmVzdW1lRG93bmxvYWQoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NUT1BfQU5EX1NBVkUnOiB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCB8fCBkb3dubG9hZGVkUGFnZXM7XG4gICAgICAgIGlmIChpc1J1bm5pbmcgJiYgY291bnQgPiAwKSB7XG4gICAgICAgICAgc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NUT1BfRE9XTkxPQUQnOiB7XG4gICAgICAgIGlmIChtZXNzYWdlLnNhdmVDb2xsZWN0ZWQpIHtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgICAgICAgIGlmIChpc1J1bm5pbmcgJiYgY291bnQgPiAwKSB7XG4gICAgICAgICAgICBzYXZlUGFydGlhbEFuZENvbXBsZXRlKGNvdW50KTtcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTV0lUQ0hfVE9fU0lOR0xFX1BBR0UnOiB7XG4gICAgICAgIGVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU0FWRV9DT05GSUcnOiB7XG4gICAgICAgIHNhdmVDb25maWcobWVzc2FnZS5jb25maWcpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBjb25maWcgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdHRVRfQ09ORklHJzoge1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBjb25maWcgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdIVFRQX0VSUk9SX0RFVEVDVEVEJzoge1xuICAgICAgICBvbkh0dHBFcnJvclJlY2VpdmVkKG1lc3NhZ2Uuc3RhdHVzQ29kZSwgbWVzc2FnZS51cmwsIG1lc3NhZ2UucmV0cnlBZnRlcik7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59KSgpO1xuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQThCTyxNQUFNLGFBQWE7QUFBQSxFQUNoQixZQUFnQztBQUFBLEVBQ2hDLFdBQVc7QUFBQSxFQUNYLGlCQUFpQjtBQUFBLEVBQ2pCLG1CQUFtQjtBQUFBLEVBQ25CLFlBQTJCLENBQUM7QUFBQSxFQUM1QixnQkFBMkMsQ0FBQztBQUFBLEVBRXBELFdBQVcsQ0FBQyxZQUEyQixDQUFDLEdBQUc7QUFBQSxJQUN6QyxLQUFLLFlBQVk7QUFBQTtBQUFBLEVBR1osWUFBWSxHQUFZO0FBQUEsSUFDN0IsTUFBTSxZQUFZLE9BQU8sU0FBUyxTQUFTLFNBQVMsYUFBYSxLQUMvQyxPQUFPLFNBQVMsU0FBUyxTQUFTLFdBQVc7QUFBQSxJQUMvRCxNQUFNLFVBQVUsT0FBTyxTQUFTLGFBQWEsMEJBQzVCLE9BQU8sU0FBUyxTQUFTLFNBQVMsZ0JBQWdCLEtBQUssT0FBTyxTQUFTLFNBQVMsV0FBVyxTQUFTO0FBQUEsSUFDckgsT0FBTyxhQUFhO0FBQUE7QUFBQSxFQUdmLE1BQU0sR0FBUztBQUFBLElBQ3BCLElBQUksQ0FBQyxLQUFLLGFBQWE7QUFBQSxNQUFHO0FBQUEsSUFDMUIsSUFBSSxLQUFLO0FBQUEsTUFBVztBQUFBLElBRXBCLE1BQU0sT0FBTyxTQUFTLGNBQWMsS0FBSztBQUFBLElBQ3pDLEtBQUssS0FBSztBQUFBLElBQ1YsS0FBSyxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxvQkEyWUQsT0FBTyxRQUFRLE9BQU8sa0JBQWtCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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VTtBQUFBLFVBQ3hDLElBQUksYUFBYSxRQUFRLEdBQUc7QUFBQSxZQUMxQix1QkFBdUIsS0FBSztBQUFBLFlBQzVCLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFlBQzlCO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBLGFBQWE7QUFBQSxRQUNiLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBLFdBRUsseUJBQXlCO0FBQUEsUUFDNUIsc0JBQXNCO0FBQUEsUUFDdEIsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyxlQUFlO0FBQUEsUUFDbEIsV0FBVyxRQUFRLE1BQU07QUFBQSxRQUN6QixhQUFhLEVBQUUsU0FBUyxNQUFNLE9BQU8sQ0FBQztBQUFBLFFBQ3RDO0FBQUEsTUFDRjtBQUFBLFdBRUssY0FBYztBQUFBLFFBQ2pCLGFBQWEsRUFBRSxTQUFTLE1BQU0sT0FBTyxDQUFDO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQUEsV0FFSyx1QkFBdUI7QUFBQSxRQUMxQixvQkFBb0IsUUFBUSxZQUFZLFFBQVEsS0FBSyxRQUFRLFVBQVU7QUFBQSxRQUN2RSxhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQTtBQUFBLElBRUYsT0FBTztBQUFBLEdBQ1I7QUFBQSxHQUNBOyIsCiAgImRlYnVnSWQiOiAiNzI4M0I2RkEyOUE0MTBBMzY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
