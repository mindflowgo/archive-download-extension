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
  getActivePageImage(minWidth = 300, targetPageNum) {
    if (typeof targetPageNum === "number") {
      const targetSelectors = [
        `.BRpagecontainer[data-index="${targetPageNum}"] img`,
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
        if (el) {
          if (el.complete && el.naturalWidth >= minWidth && el.src) {
            el.dataset.seq = String(targetPageNum);
            const fileNum = parseArchiveImageUrlPage(el.src);
            if (fileNum !== null) {
              this.detectedOffset = fileNum - targetPageNum;
            }
            return el;
          }
          return null;
        }
      }
      const domPage = this.getCurrentPage();
      if (domPage !== null && domPage === targetPageNum) {
        const visibleContainers = Array.from(document.querySelectorAll(".BRpagecontainer.BRpage-visible, .BRpagecontainer--hasSelection, .BRpage.active"));
        for (const cont of visibleContainers) {
          const img = cont.querySelector('img.BRpageimage, img[class*="BRpage"], img');
          if (img && img.complete && img.naturalWidth >= minWidth && img.src) {
            img.dataset.seq = String(targetPageNum);
            const fileNum = parseArchiveImageUrlPage(img.src);
            if (fileNum !== null) {
              this.detectedOffset = fileNum - targetPageNum;
            }
            return img;
          }
        }
      }
      const allImages = Array.from(document.querySelectorAll('img.BRpageimage, .BRpagecontainer img, .BRpage img, img[src*="BookReaderImages.php"]')).filter((img) => img.complete && img.naturalWidth >= minWidth && img.src);
      for (const img of allImages) {
        const fileNum = parseArchiveImageUrlPage(img.src);
        if (fileNum !== null) {
          const matchesCalibrated = this.detectedOffset !== null && fileNum === targetPageNum + this.detectedOffset;
          const matchesDefault = this.detectedOffset === null && (fileNum === targetPageNum || fileNum === targetPageNum + 1);
          if (matchesCalibrated || matchesDefault) {
            img.dataset.seq = String(targetPageNum);
            if (this.detectedOffset === null) {
              this.detectedOffset = fileNum - targetPageNum;
            }
            return img;
          }
        }
      }
      const fallback = allImages[allImages.length - 1];
      if (fallback) {
        const fileNum = parseArchiveImageUrlPage(fallback.src);
        if (fileNum === null || (this.detectedOffset !== null ? fileNum === targetPageNum + this.detectedOffset : fileNum === targetPageNum || fileNum === targetPageNum + 1)) {
          fallback.dataset.seq = String(targetPageNum);
          return fallback;
        }
      }
      return null;
    }
    const candidateSelectors = [
      ".BRpagecontainer img",
      "img.BRpageimage",
      ".BRpage img",
      ".BRpageview img",
      'img[src*="BookReaderImages.php"]',
      'img[src*="/BookReader/"]',
      ".book-page img"
    ];
    const images = Array.from(document.querySelectorAll(candidateSelectors.join(", "))).filter((img) => img.complete && img.naturalWidth >= minWidth && img.src);
    if (images.length === 0)
      return null;
    let bestImg = null;
    let maxVisibleArea = 0;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
    const winH = typeof window !== "undefined" ? window.innerHeight : 1080;
    for (const img of images) {
      const rect = img.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, winW) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, winH) - Math.max(rect.top, 0));
      const area = visibleWidth * visibleHeight;
      if (area > maxVisibleArea && visibleWidth > 50 && visibleHeight > 50) {
        maxVisibleArea = area;
        bestImg = img;
      }
    }
    return bestImg || images[images.length - 1] || null;
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
        const activeImg = provider.getActivePageImage(300, targetPageNum);
        if (activeImg && activeImg.complete && activeImg.naturalWidth >= 300 && activeImg.src) {
          if (lastHttpError && Date.now() - lastHttpError.timestamp < 3000) {
            continue;
          }
          const isNewSrc = !lastSrc || activeImg.src !== lastSrc;
          const isTargetSeq = activeImg.dataset.seq === String(targetPageNum);
          if (isNewSrc && isTargetSeq) {
            currentRetryCount = 0;
            consecutiveErrorCount = 0;
            console.log(`[ArchiveDownloader] Page ${targetPageNum} visible (${activeImg.naturalWidth}x${activeImg.naturalHeight}px)!`);
            return activeImg;
          }
          const domNow = provider.getCurrentPage();
          if (domNow !== null && domNow >= targetPageNum && isNewSrc) {
            currentRetryCount = 0;
            consecutiveErrorCount = 0;
            console.log(`[ArchiveDownloader] Page ${targetPageNum} visible [DOM status ${domNow}] (${activeImg.naturalWidth}x${activeImg.naturalHeight}px)!`);
            return activeImg;
          }
          const parsedUrlPage = parseArchiveImageUrlPage(activeImg.src);
          if (isNewSrc && parsedUrlPage !== null && (parsedUrlPage === targetPageNum || parsedUrlPage === targetPageNum + 1)) {
            currentRetryCount = 0;
            consecutiveErrorCount = 0;
            console.log(`[ArchiveDownloader] Page ${targetPageNum} verified from URL (${activeImg.naturalWidth}x${activeImg.naturalHeight}px, leaf ${parsedUrlPage})!`);
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
          currentImg = provider.getActivePageImage(300, pageNum);
          if (currentImg)
            break;
          await sleep(150);
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

//# debugId=AA5EDE075E22FE3964756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvcGlsbC50cyIsICIuLi9zcmMvdXRpbHMvbWFya2Rvd24tYnVpbGRlci50cyIsICIuLi9zcmMvdXRpbHMvcGRmLWJ1aWxkZXIudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0aXplci50cyIsICIuLi9zcmMvcHJvdmlkZXJzL2FyY2hpdmUtcHJvdmlkZXIudHMiLCAiLi4vc3JjL3Byb3ZpZGVycy9oYXRoaXRydXN0LXByb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcm92aWRlcnMvaW5kZXgudHMiLCAiLi4vc3JjL2NvbnRlbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiLyoqXG4gKiBGbG9hdGluZyBQcm9ncmVzcyBQaWxsIE92ZXJsYXkgZm9yIEFyY2hpdmUub3JnXG4gKiBPTkxZIGFwcGVhcnMgb24gaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLypcbiAqXG4gKiBGZWF0dXJlczpcbiAqIC0gQ29nIGljb24gYnV0dG9uICjimpkpIHRvIG9wZW4gZXhwYW5kYWJsZSBpbi1wYWdlIFNldHRpbmdzIHRyYXlcbiAqIC0gU2V0dGluZ3MgKHNhdmUgcGF0aCwgZm9sZGVyIHBhdHRlcm4sIHN0YXJ0L2VuZCBwYWdlcykgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlXG4gKiAtIFNxdWFyZSwgZnVsbC1oZWlnaHQgYnV0dG9ucyB3aXRoIG5vIGN1cnZhdHVyZSAoanVzdCBsaW5lIG91dGxpbmUpXG4gKiAtIFvinJVdIGJ1dHRvbiB0aGF0IHNocmlua3MgcGlsbCB0byBhIHNtYWxsIGRvY2tlZCBib29rIGljb24gb24gdGhlIGZhciBsZWZ0IGVkZ2Ugb2YgdGhlIHNjcmVlblxuICogLSBDbGlja2luZyB0aGUgZG9ja2VkIGJvb2sgaWNvbiByZXN0b3JlcyB0aGUgcGlsbFxuICogLSBJbWFnZSBkaW1lbnNpb25zIGluIHNtYWxsIGdyZXkgbGV0dGVycyBiZWxvdyBzdGF0dXM6XG4gKiAgIFwiQ2FwdHVyaW5nIHBhZ2UgMTRcIlxuICogICBcIihpbWFnZTogMjU4MCB4IDM5MTUpXCJcbiAqIC0gW0NPTlRJTlVFXSBidXR0b24gd2hlbiBzdGFsbGVkIG9yIGNvbm5lY3Rpb24gZHJvcHNcbiAqIC0gSW50ZXJhY3RpdmUgU3RvcCBjb25maXJtYXRpb24gcHJvbXB0IHRvIHNhdmUgY2FwdHVyZWQgcGFnZXMgc28gZmFyXG4gKiAtIFwiRG93bmxvYWRlZDogVmlldyBGaWxlc1wiIGJ1dHRvbiBvbiBjb21wbGV0aW9uIHRoYXQgb3BlbnMgdGhlIGRvd25sb2FkZWQgZmlsZS9mb2xkZXJcbiAqL1xuXG5pbXBvcnQgeyBEb3dubG9hZGVyQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpbGxDYWxsYmFja3Mge1xuICBvblN0YXJ0PzogKCkgPT4gdm9pZDtcbiAgb25QYXVzZT86ICgpID0+IHZvaWQ7XG4gIG9uUmVzdW1lPzogKCkgPT4gdm9pZDtcbiAgb25TdG9wPzogKCkgPT4gdm9pZDtcbiAgb25TYXZlU2V0dGluZ3M/OiAoc2V0dGluZ3M6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pID0+IHZvaWQ7XG4gIG9uU3dpdGNoTW9kZT86ICgpID0+IHZvaWQ7XG4gIG9uVmlld0ZpbGU/OiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgRmxvYXRpbmdQaWxsIHtcbiAgcHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNEb2NrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc1NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzQ29uZmlybWluZ1N0b3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFBpbGxDYWxsYmFja3MgPSB7fTtcbiAgcHJpdmF0ZSBjdXJyZW50Q29uZmlnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+ID0ge307XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzOiBQaWxsQ2FsbGJhY2tzID0ge30pIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgfVxuXG4gIHB1YmxpYyBzaG91bGRSZW5kZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNBcmNoaXZlID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluY2x1ZGVzKCcvZGV0YWlscy8nKTtcbiAgICBjb25zdCBpc0JhYmVsID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnYmFiZWwuaGF0aGl0cnVzdC5vcmcnIHx8XG4gICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzQXJjaGl2ZSB8fCBpc0JhYmVsO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkUmVuZGVyKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwaWxsLmlkID0gJ2FyY2hpdmUtZG93bmxvYWRlci1waWxsJztcbiAgICBwaWxsLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgI2FyY2hpdmUtZG93bmxvYWRlci1waWxsIHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiAxNHB4O1xuICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE4LCAxOCwgMTgsIDAuOTYpO1xuICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICAtd2Via2l0LWJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgOHB4IDMycHggcmdiYSgwLCAwLCAwLCAwLjY1KTtcbiAgICAgICAgICBjb2xvcjogI2YxZjFmMTtcbiAgICAgICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBlYXNlLCBvcGFjaXR5IDAuMjVzIGVhc2U7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgbWF4LXdpZHRoOiA5NXZ3O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBEb2NrZWQgdG8gZmFyIGxlZnQgb2Ygd2luZG93ICovXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCB7XG4gICAgICAgICAgbGVmdDogMCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRvcDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRyYW5zZm9ybTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIGJvcmRlci1sZWZ0OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMCA2cHggNnB4IDAgIWltcG9ydGFudDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICBib3gtc2hhZG93OiAycHggNHB4IDE2cHggcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtbWFpbi1ib2R5LFxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtc2V0dGluZ3MtcGFuZWwge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgfVxuXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCAucGlsbC1kb2NrLWljb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIGltZyB7XG4gICAgICAgICAgd2lkdGg6IDI0cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLW1haW4tYm9keSB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDQ4cHg7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBDb2cgc2V0dGluZ3MgYnV0dG9uIHJlcGxhY2luZyB0aGUgc3RhdGljIGxvZ28gKi9cbiAgICAgICAgLnBpbGwtY29nLWJ0biB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTNweDtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMsIGNvbG9yIDAuMTVzLCB0cmFuc2Zvcm0gMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtY29nLWJ0bi5hY3RpdmUge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcbiAgICAgICAgICBjb2xvcjogIzNlYTZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZ1bGwgaGVpZ2h0IGJ1dHRvbnMgd2l0aCBOTyBjdXJ2YXR1cmUgKGJvcmRlci1yYWRpdXM6IDApLCBvdXRsaW5lZCBvbmx5ICovXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4ge1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgcGFkZGluZzogMCAxNHB4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA2cHg7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1wcmltYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzI5ODllNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWNvbnRpbnVlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjU5ZTBiO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1jb250aW51ZTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Q5NzcwNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLXZpZXctZmlsZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzEwYjk4MTtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tdmlldy1maWxlOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMDU5NjY5O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tZGFuZ2VyIHtcbiAgICAgICAgICBjb2xvcjogI2Y4NzE3MTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWRhbmdlcjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNDgsIDExMywgMTEzLCAwLjIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tbW9kZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y1OWUwYjtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAqL1xuICAgICAgICAucGlsbC1jb25maXJtLWJhciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNSwgMjUsIDI1LCAwLjk4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvbmZpcm0tdGV4dCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGNvbG9yOiAjZjU5ZTBiO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdGF0dXMgJiBJbWFnZSBEaW1lbnNpb25zIFNlY3Rpb24gKi9cbiAgICAgICAgLnBpbGwtc3RhdHVzLXNlY3Rpb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgbWluLXdpZHRoOiAxNzBweDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTgpO1xuICAgICAgICAgIGdhcDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBtYXgtd2lkdGg6IDIyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQud2FybmluZyB7XG4gICAgICAgICAgY29sb3I6ICNmNTllMGI7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5lcnJvciB7XG4gICAgICAgICAgY29sb3I6ICNlZjQ0NDQ7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5jb21wbGV0ZSB7XG4gICAgICAgICAgY29sb3I6ICMxMGI5ODE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTbWFsbCBncmV5IGltYWdlIGRpbWVuc2lvbnMgKi9cbiAgICAgICAgLnBpbGwtZGltZW5zaW9ucy10ZXh0IHtcbiAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgY29sb3I6ICM4ODg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtcHJvZ3Jlc3MtdHJhY2sge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogM3B4O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1wcm9ncmVzcy1maWxsIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgd2lkdGg6IDAlO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMzZWE2ZmY7XG4gICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmlnaHQgU2lkZSBDb3VudGVyICgwLzUxNSBwYWdlcykgKi9cbiAgICAgICAgLnBpbGwtY291bnRlci1ib3gge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogW3hdIENsb3NlL1NocmluayBCdXR0b24gKi9cbiAgICAgICAgLnBpbGwtY2xvc2UtYnRuIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGNvbG9yOiAjODg4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNsb3NlLWJ0bjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5ICovXG4gICAgICAgIC5waWxsLXNldHRpbmdzLXBhbmVsIHtcbiAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE0LCAxNCwgMTQsIDAuOTgpO1xuICAgICAgICAgIHBhZGRpbmc6IDEycHggMTZweDtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmdzLWhlYWRlciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIHBhZGRpbmctYm90dG9tOiA2cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy10aXRsZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xuICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludC5zaG93IHtcbiAgICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3MtZ3JpZCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cgbGFiZWwge1xuICAgICAgICAgIGNvbG9yOiAjYWFhO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLXJvdy1oYWxmIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgICAgICAgIGdhcDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctcm93LWhhbGYgPiBkaXYge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctaW5wdXQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyNDI0MjQ7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBwYWRkaW5nOiA1cHggOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAwLjE1cztcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIG1heC13aWR0aDogMjYwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWlucHV0OmZvY3VzIHtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICMzZWE2ZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy1mb290ZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWJ0biB7XG4gICAgICAgICAgcGFkZGluZzogNXB4IDEycHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNjY2M7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMTVzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctYnRuLmJ0bi1zYXZlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG4uYnRuLXNhdmU6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyOTg5ZTY7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG5cbiAgICAgIDwhLS0gRG9ja2VkIFNtYWxsIEljb24gKFZpc2libGUgd2hlbiBtaW5pbWl6ZWQgdG8gZmFyIGxlZnQpIC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtZG9jay1pY29uXCIgaWQ9XCJwaWxsRG9ja0ljb25cIiB0aXRsZT1cIk9wZW4gQXJjaGl2ZSBEb3dubG9hZGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPVwiJHtjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ljb25zL2ljb240OC5wbmcnKX1cIiBhbHQ9XCJBcmNoaXZlIERvd25sb2FkZXJcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gTWFpbiBCb2R5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtbWFpbi1ib2R5XCI+XG4gICAgICAgIDwhLS0gQ29nIHNldHRpbmdzIGJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtY29nLWJ0blwiIGlkPVwicGlsbENvZ0J0blwiIHRpdGxlPVwiRWRpdCBTZXR0aW5ncyAoU2F2ZSBwYXRoLCBwYXR0ZXJuLCBwYWdlcylcIj7impk8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtY29uZmlybS1iYXJcIiBpZD1cInBpbGxDb25maXJtQmFyXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGlsbC1jb25maXJtLXRleHRcIiBpZD1cInBpbGxDb25maXJtVGV4dFwiPlNhdmUgY2FwdHVyZWQgcGFnZXM/PC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXZpZXctZmlsZVwiIGlkPVwicGlsbENvbmZpcm1TYXZlQnRuXCI+4pyUIFllcywgU2F2ZSBGaWxlczwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLWRhbmdlclwiIGlkPVwicGlsbENvbmZpcm1EaXNjYXJkQnRuXCI+RGlzY2FyZDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxDb25maXJtQ2FuY2VsQnRuXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gU3RhcnQgRG93bmxvYWQgQnV0dG9uIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1wcmltYXJ5XCIgaWQ9XCJwaWxsU3RhcnRCdG5cIj5cbiAgICAgICAgICDilrYgU3RhcnQgRG93bmxvYWRcbiAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgPCEtLSBDb250aW51ZSBCdXR0b24gKHdoZW4gc3RhbGxlZCAvIG9mZmxpbmUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1jb250aW51ZVwiIGlkPVwicGlsbENvbnRpbnVlQnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIOKWtiBDT05USU5VRVxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIFZpZXcgRmlsZSBCdXR0b24gKHdoZW4gY29tcGxldGUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi12aWV3LWZpbGVcIiBpZD1cInBpbGxWaWV3RmlsZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinJQgVmlldyBGaWxlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gRHluYW1pYyBDb250cm9scyAoYWN0aXZlIGR1cmluZyBkb3dubG9hZCkgLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxQYXVzZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinZrinZogUGF1c2VcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXByaW1hcnlcIiBpZD1cInBpbGxSZXN1bWVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAg4pa2IFJlc3VtZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tZGFuZ2VyXCIgaWQ9XCJwaWxsU3RvcEJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDil7wgU3RvcFxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIDEtUGFnZSBNb2RlIEJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tbW9kZVwiIGlkPVwicGlsbE1vZGVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgdGl0bGU9XCJTd2l0Y2ggdG8gMS1QYWdlIFZpZXdcIj5cbiAgICAgICAgICDimqEgMS1QYWdlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gU3RhdHVzICYgSW1hZ2UgRGltZW5zaW9ucyAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc3RhdHVzLXNlY3Rpb25cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc3RhdHVzLXRleHRcIiBpZD1cInBpbGxTdGF0dXNUZXh0XCI+UmVhZHk8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJwaWxsLWRpbWVuc2lvbnMtdGV4dFwiIGlkPVwicGlsbERpbWVuc2lvbnNUZXh0XCI+KGltYWdlOiAtIHggLSk8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtcHJvZ3Jlc3MtdHJhY2tcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXByb2dyZXNzLWZpbGxcIiBpZD1cInBpbGxQcm9ncmVzc0ZpbGxcIj48L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBSaWdodCBTaWRlIENvdW50ZXI6IDAvNTE1IHBhZ2VzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1jb3VudGVyLWJveFwiIGlkPVwicGlsbENvdW50ZXJcIj5cbiAgICAgICAgICAwLzAgcGFnZXNcbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBbeF0gU2hyaW5rIHRvIExlZnQgU2lkZSBCdXR0b24gLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWNsb3NlLWJ0blwiIGlkPVwicGlsbENsb3NlQnRuXCIgdGl0bGU9XCJTaHJpbmsgdG8gbGVmdCBlZGdlIG9mIHNjcmVlblwiPuKclTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtcGFuZWxcIiBpZD1cInBpbGxTZXR0aW5nc1BhbmVsXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtdGl0bGVcIj7impkgRG93bmxvYWRlciBTZXR0aW5nczwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludFwiIGlkPVwicGlsbFNldHRpbmdzU2F2ZWRIaW50XCI+U2F2ZWQgdG8gbG9jYWxTdG9yYWdlPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtZ3JpZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXNldHRpbmctcm93XCI+XG4gICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdTYXZlUGF0aFwiPlNhdmUgU3ViZGlyZWN0b3J5OjwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInBpbGxTZXR0aW5nU2F2ZVBhdGhcIiBjbGFzcz1cInBpbGwtc2V0dGluZy1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiQXJjaGl2ZUJvb2tzXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvd1wiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInBpbGxTZXR0aW5nUGF0dGVyblwiPkZvbGRlciBQYXR0ZXJuOjwvbGFiZWw+XG4gICAgICAgICAgICA8c2VsZWN0IGlkPVwicGlsbFNldHRpbmdQYXR0ZXJuXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInt0aXRsZX1fe2lkfVwiPnt0aXRsZX1fe2lkfTwvb3B0aW9uPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwie3RpdGxlfVwiPnt0aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIntpZH1cIj57aWR9PC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvdyBwaWxsLXNldHRpbmctcm93LWhhbGZcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ1N0YXJ0UGFnZVwiPlN0YXJ0IFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nU3RhcnRQYWdlXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgdmFsdWU9XCIwXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdFbmRQYWdlXCI+RW5kIFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nRW5kUGFnZVwiIGNsYXNzPVwicGlsbC1zZXR0aW5nLWlucHV0XCIgbWluPVwiMFwiIHBsYWNlaG9sZGVyPVwiQWxsXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZy1yb3dcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ01heEhlaWdodFwiPk1heCBQYWdlIEhlaWdodDo8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nTWF4SGVpZ2h0XCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgc3RlcD1cIjUwXCIgcGxhY2Vob2xkZXI9XCJlLmcuIDEwMDAgKDAgPSBmdWxsKVwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1mb290ZXJcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1zZXR0aW5nLWJ0biBidG4tc2F2ZVwiIGlkPVwicGlsbFNldHRpbmdTYXZlQnRuXCI+8J+SviBTYXZlIFNldHRpbmdzPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtc2V0dGluZy1idG4gYnRuLWNsb3NlXCIgaWQ9XCJwaWxsU2V0dGluZ0Nsb3NlQnRuXCI+Q2xvc2U8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwaWxsKTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHBpbGw7XG5cbiAgICAvLyBBdHRhY2ggY2FsbGJhY2tzXG4gICAgY29uc3Qgc3RhcnRCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RhcnRCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzdGFydEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0YXJ0Py4oKSk7XG5cbiAgICBjb25zdCBjb250aW51ZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnRpbnVlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uUmVzdW1lPy4oKSk7XG5cbiAgICBjb25zdCB2aWV3RmlsZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHZpZXdGaWxlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uVmlld0ZpbGU/LigpKTtcblxuICAgIGNvbnN0IHBhdXNlQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFBhdXNlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcGF1c2VCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25QYXVzZT8uKCkpO1xuXG4gICAgY29uc3QgcmVzdW1lQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFJlc3VtZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHJlc3VtZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblJlc3VtZT8uKCkpO1xuXG4gICAgY29uc3Qgc3RvcEJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTdG9wQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgc3RvcEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0b3A/LigpKTtcblxuICAgIGNvbnN0IG1vZGVCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsTW9kZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIG1vZGVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25Td2l0Y2hNb2RlPy4oKSk7XG5cbiAgICAvLyBDb2cgYnV0dG9uIHRvIHRvZ2dsZSBzZXR0aW5ncyB0cmF5XG4gICAgY29uc3QgY29nQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvZ0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKCkpO1xuXG4gICAgLy8gU2F2ZSBTZXR0aW5ncyBidXR0b25cbiAgICBjb25zdCBzYXZlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1NhdmVCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzYXZlU2V0dGluZ3NCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZVBhdGhJbnB1dCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU2F2ZVBhdGgnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nUGF0dGVybicpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgY29uc3Qgc3RhcnRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1N0YXJ0UGFnZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0VuZFBhZ2UnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgbWF4SGVpZ2h0SW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICAgIGNvbnN0IGJhc2VEaXIgPSBzYXZlUGF0aElucHV0Py52YWx1ZS50cmltKCkgfHwgJ0FyY2hpdmVCb29rcyc7XG4gICAgICBjb25zdCBmb2xkZXJQYXR0ZXJuID0gcGF0dGVyblNlbGVjdD8udmFsdWUgfHwgJ3t0aXRsZX1fe2lkfSc7XG4gICAgICBjb25zdCBzdGFydFBhZ2UgPSBzdGFydFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoc3RhcnRQYWdlSW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuICAgICAgY29uc3QgZW5kUGFnZSA9IGVuZFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoZW5kUGFnZUlucHV0LnZhbHVlLCAxMCkpIDogMDtcbiAgICAgIGNvbnN0IG1heFBhZ2VIZWlnaHQgPSBtYXhIZWlnaHRJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobWF4SGVpZ2h0SW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblNhdmVTZXR0aW5ncz8uKHtcbiAgICAgICAgYmFzZURpcixcbiAgICAgICAgZm9sZGVyUGF0dGVybixcbiAgICAgICAgc3RhcnRQYWdlLFxuICAgICAgICBlbmRQYWdlLFxuICAgICAgICBtYXhQYWdlSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGhpbnQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ3NTYXZlZEhpbnQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmIChoaW50KSB7XG4gICAgICAgIGhpbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGhpbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpLCAyNTAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3NlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0Nsb3NlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY2xvc2VTZXR0aW5nc0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKSk7XG5cbiAgICAvLyBbeF0gY2xvc2UvZG9jayBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDbG9zZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNsb3NlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuZG9ja1RvTGVmdCgpKTtcblxuICAgIC8vIERvY2tlZCBpY29uIGNsaWNrIHRvIGV4cGFuZFxuICAgIGNvbnN0IGRvY2tJY29uID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbERvY2tJY29uJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgZG9ja0ljb24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy51bmRvY2tGcm9tTGVmdCgpKTtcblxuICAgIC8vIFBvcHVsYXRlIGluaXRpYWwgaW5wdXRzIGlmIGNvbmZpZyBleGlzdHNcbiAgICB0aGlzLnNldENvbmZpZyh0aGlzLmN1cnJlbnRDb25maWcpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZVNldHRpbmdzKG9wZW4/OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMuaXNTZXR0aW5nc09wZW4gPSB0eXBlb2Ygb3BlbiA9PT0gJ2Jvb2xlYW4nID8gb3BlbiA6ICF0aGlzLmlzU2V0dGluZ3NPcGVuO1xuXG4gICAgY29uc3QgcGFuZWwgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdzUGFuZWwnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb2dCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBhbmVsKSB7XG4gICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gdGhpcy5pc1NldHRpbmdzT3BlbiA/ICdmbGV4JyA6ICdub25lJztcbiAgICB9XG4gICAgaWYgKGNvZ0J0bikge1xuICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc09wZW4pIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRDb25maWcoY2ZnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50Q29uZmlnID0geyAuLi50aGlzLmN1cnJlbnRDb25maWcsIC4uLmNmZyB9O1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHNhdmVQYXRoSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdTYXZlUGF0aCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKHNhdmVQYXRoSW5wdXQgJiYgY2ZnLmJhc2VEaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2F2ZVBhdGhJbnB1dC52YWx1ZSA9IGNmZy5iYXNlRGlyO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdHRlcm5TZWxlY3QgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdQYXR0ZXJuJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgaWYgKHBhdHRlcm5TZWxlY3QgJiYgY2ZnLmZvbGRlclBhdHRlcm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IGNmZy5mb2xkZXJQYXR0ZXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0UGFnZUlucHV0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU3RhcnRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoc3RhcnRQYWdlSW5wdXQgJiYgY2ZnLnN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdGFydFBhZ2VJbnB1dC52YWx1ZSA9IFN0cmluZyhjZmcuc3RhcnRQYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdFbmRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoZW5kUGFnZUlucHV0ICYmIGNmZy5lbmRQYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZFBhZ2VJbnB1dC52YWx1ZSA9IGNmZy5lbmRQYWdlID4gMCA/IFN0cmluZyhjZmcuZW5kUGFnZSkgOiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBtYXhIZWlnaHRJbnB1dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKG1heEhlaWdodElucHV0ICYmIGNmZy5tYXhQYWdlSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1heEhlaWdodElucHV0LnZhbHVlID0gY2ZnLm1heFBhZ2VIZWlnaHQgPiAwID8gU3RyaW5nKGNmZy5tYXhQYWdlSGVpZ2h0KSA6ICcnO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzaG93U3RvcFByb21wdChcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG9uU2F2ZTogKCkgPT4gdm9pZCxcbiAgICBvbkRpc2NhcmQ6ICgpID0+IHZvaWQsXG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgY3VzdG9tTWVzc2FnZT86IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gdHJ1ZTtcblxuICAgIGNvbnN0IGNvbmZpcm1CYXIgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb25maXJtVGV4dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ29uZmlybVRleHQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBzYXZlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtU2F2ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnN0IGRpc2NhcmRCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1EaXNjYXJkQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtQ2FuY2VsQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIG5vcm1hbCBidXR0b25zIGFuZCBzdGF0dXMgd2hpbGUgY29uZmlybWluZ1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUoZmFsc2UpO1xuXG4gICAgaWYgKGNvbmZpcm1UZXh0KSB7XG4gICAgICBjb25maXJtVGV4dC50ZXh0Q29udGVudCA9IGN1c3RvbU1lc3NhZ2UgfHwgYFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2A7XG4gICAgfVxuICAgIGlmIChjb25maXJtQmFyKSB7XG4gICAgICBjb25maXJtQmFyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgIHRoaXMuaXNDb25maXJtaW5nU3RvcCA9IGZhbHNlO1xuICAgICAgaWYgKGNvbmZpcm1CYXIpIGNvbmZpcm1CYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNsZWFudXAoKTtcbiAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICBkaXNjYXJkQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkRpc2NhcmQoKTtcbiAgICB9O1xuXG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkNhbmNlbCgpO1xuICAgIH07XG4gIH1cblxuICBwdWJsaWMgaGlkZVN0b3BQcm9tcHQoKTogdm9pZCB7XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gZmFsc2U7XG4gICAgY29uc3QgY29uZmlybUJhciA9IHRoaXMuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY29uZmlybUJhcikgY29uZmlybUJhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIHNldFN0YW5kYXJkQ29udHJvbHNWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICAgICcjcGlsbFN0YXJ0QnRuLCAjcGlsbENvbnRpbnVlQnRuLCAjcGlsbFZpZXdGaWxlQnRuLCAjcGlsbFBhdXNlQnRuLCAjcGlsbFJlc3VtZUJ0biwgI3BpbGxTdG9wQnRuLCAjcGlsbE1vZGVCdG4sIC5waWxsLXN0YXR1cy1zZWN0aW9uLCAjcGlsbENvdW50ZXInXG4gICAgKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyAnJyA6ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkb2NrVG9MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gdHJ1ZTtcbiAgICB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdkb2NrZWQtbGVmdCcpO1xuICB9XG5cbiAgcHVibGljIHVuZG9ja0Zyb21MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnZG9ja2VkLWxlZnQnKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVQcm9ncmVzcyhcbiAgICBjdXJyZW50UGFnZTogbnVtYmVyLFxuICAgIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgICBzdGF0dXNUZXh0OiBzdHJpbmcsXG4gICAgc3RhdHVzVHlwZTogc3RyaW5nID0gJ25vcm1hbCcsXG4gICAgaXNQYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIgPSAxLFxuICAgIGltYWdlRGltZW5zaW9ucz86IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDb25maXJtaW5nU3RvcCkgcmV0dXJuOyAvLyBEbyBub3Qgb3ZlcndyaXRlIGNvbmZpcm1hdGlvbiBwcm9tcHRcblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGFydEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGNvbnRpbnVlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHZpZXdGaWxlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBhdXNlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxQYXVzZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHJlc3VtZUJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUmVzdW1lQnRuJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RvcEJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RvcEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IG1vZGVCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbE1vZGVCdG4nKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIGNvbnN0IGNvdW50ZXJFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ291bnRlcicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGZpbGxFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUHJvZ3Jlc3NGaWxsJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RhdHVzVGV4dEVsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGF0dXNUZXh0JykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgZGltZW5zaW9uc0VsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxEaW1lbnNpb25zVGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gMS1wYWdlIHN3aXRjaCBidXR0b25cbiAgICBpZiAobW9kZUJ0bikge1xuICAgICAgbW9kZUJ0bi5zdHlsZS5kaXNwbGF5ID0gY3VycmVudE1vZGUgIT09IDEgJiYgIWlzQWN0aXZlID8gJ2ZsZXgnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIFJpZ2h0IFNpZGUgQ291bnRlclxuICAgIGlmIChjb3VudGVyRWwpIHtcbiAgICAgIGlmICh0b3RhbFBhZ2VzID4gMCkge1xuICAgICAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgUGFnZSAke2N1cnJlbnRQYWdlfS8ke3RvdGFsUGFnZXN9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgMC8ke3RvdGFsUGFnZXN9IHBhZ2VzYDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY291bnRlckVsLnRleHRDb250ZW50ID0gJ0RldGVjdGluZyBwYWdlcy4uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvZ3Jlc3MgYmFyIGZpbGxcbiAgICBpZiAoZmlsbEVsICYmIHRvdGFsUGFnZXMgPiAwKSB7XG4gICAgICBjb25zdCBwY3QgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQoKChjdXJyZW50UGFnZSArIDEpIC8gdG90YWxQYWdlcykgKiAxMDApKTtcbiAgICAgIGZpbGxFbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgICB9XG5cbiAgICAvLyBTdGF0dXMgdGV4dCAmIGNsYXNzXG4gICAgaWYgKHN0YXR1c1RleHRFbCkge1xuICAgICAgc3RhdHVzVGV4dEVsLnRleHRDb250ZW50ID0gc3RhdHVzVGV4dDtcbiAgICAgIHN0YXR1c1RleHRFbC5jbGFzc05hbWUgPSBgcGlsbC1zdGF0dXMtdGV4dCAke3N0YXR1c1R5cGV9YDtcbiAgICB9XG5cbiAgICAvLyBJbWFnZSBEaW1lbnNpb25zOiAoaW1hZ2U6IDI1ODAgeCAzOTE1KVxuICAgIGlmIChkaW1lbnNpb25zRWwpIHtcbiAgICAgIGlmIChpbWFnZURpbWVuc2lvbnMgJiYgaW1hZ2VEaW1lbnNpb25zLndpZHRoID4gMCAmJiBpbWFnZURpbWVuc2lvbnMuaGVpZ2h0ID4gMCkge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAke2ltYWdlRGltZW5zaW9ucy53aWR0aH0geCAke2ltYWdlRGltZW5zaW9ucy5oZWlnaHR9KWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAtIHggLSlgO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJ1dHRvbnMgVmlzaWJpbGl0eVxuICAgIHN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29udGludWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB2aWV3RmlsZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmVzdW1lQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgaWYgKHN0YXR1c1R5cGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIC8vIENvbXBsZXRlZDogc2hvdyBcIkRvd25sb2FkZWQ6IFZpZXcgRmlsZXNcIlxuICAgICAgdmlld0ZpbGVCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9IGVsc2UgaWYgKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyB8fCBzdGF0dXNUeXBlID09PSAnb2ZmbGluZScgfHwgKGlzUGF1c2VkICYmIHN0YXR1c1R5cGUgPT09ICdyZXRyeWluZycpKSB7XG4gICAgICAvLyBTdGFsbGVkIC8gb2ZmbGluZSAvIG1heCByZXRyaWVzIGhpdDogc2hvdyBDT05USU5VRSArIFN0b3BcbiAgICAgIGNvbnRpbnVlQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfSBlbHNlIGlmIChpc0FjdGl2ZSkge1xuICAgICAgLy8gQ3VycmVudGx5IGFjdGl2ZVxuICAgICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICAgIHJlc3VtZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWRsZVxuICAgICAgc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgdGhpcy5jb250YWluZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwKICAgICIvKipcbiAqIFV0aWxpdGllcyBmb3IgZXh0cmFjdGluZyBPQ1IgdGV4dCBmcm9tIERKVlUgWE1MIGFuZCBjb21waWxpbmcgTWFya2Rvd24gZG9jdW1lbnRzXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlVGV4dEVudHJ5IHtcbiAgcGFnZU51bTogbnVtYmVyO1xuICBsZWFmSW5kZXg6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tNZXRhZGF0YSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvb2tJZDogc3RyaW5nO1xuICBhdXRob3I/OiBzdHJpbmc7XG4gIHB1Ymxpc2hlcj86IHN0cmluZztcbiAgeWVhcj86IHN0cmluZztcbiAgc291cmNlVXJsPzogc3RyaW5nO1xuICB0b3RhbFBhZ2VzPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFN0cmlwcyBESlZVIFhNTCBpbnRvIGNsZWFuLCBzdHJ1Y3R1cmVkIHBsYWluIHRleHQgZm9yIGEgc2luZ2xlIHBhZ2UuXG4gKiBSb2J1c3RseSBwYXJzZXMgUEFSQUdSQVBILCBMSU5FLCBhbmQgV09SRCBlbGVtZW50cy5cbiAqIFdvcmtzIHNlYW1sZXNzbHkgaW4gYm90aCBicm93c2VyIGFuZCBOb2RlL0J1biB0ZXN0IGVudmlyb25tZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGp2dVhtbFRvVGV4dCh4bWxTdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgheG1sU3RyaW5nIHx8IHR5cGVvZiB4bWxTdHJpbmcgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgLy8gRXh0cmFjdCBhbGwgUEFSQUdSQVBIIGJsb2Nrc1xuICBjb25zdCBwYXJhZ3JhcGhNYXRjaGVzID0geG1sU3RyaW5nLm1hdGNoKC88UEFSQUdSQVBIW1xcc1xcU10qPzxcXC9QQVJBR1JBUEg+L2dpKTtcbiAgaWYgKCFwYXJhZ3JhcGhNYXRjaGVzIHx8IHBhcmFncmFwaE1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gSWYgbm8gUEFSQUdSQVBIIHRhZ3MsIHRyeSBleHRyYWN0aW5nIHdvcmRzIGRpcmVjdGx5XG4gICAgY29uc3Qgd29yZHMgPSBBcnJheS5mcm9tKHhtbFN0cmluZy5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKVxuICAgICAgLm1hcChtID0+IGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhtWzFdLnRyaW0oKSkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIHJldHVybiB3b3Jkcy5qb2luKCcgJyk7XG4gIH1cblxuICBjb25zdCBwYXJhZ3JhcGhzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgcGFyQmxvY2sgb2YgcGFyYWdyYXBoTWF0Y2hlcykge1xuICAgIC8vIEV4dHJhY3QgYWxsIExJTkUgYmxvY2tzIGluc2lkZSB0aGlzIFBBUkFHUkFQSFxuICAgIGNvbnN0IGxpbmVNYXRjaGVzID0gcGFyQmxvY2subWF0Y2goLzxMSU5FW1xcc1xcU10qPzxcXC9MSU5FPi9naSk7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAobGluZU1hdGNoZXMgJiYgbGluZU1hdGNoZXMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChjb25zdCBsaW5lQmxvY2sgb2YgbGluZU1hdGNoZXMpIHtcbiAgICAgICAgLy8gRXh0cmFjdCBhbGwgV09SRCBjb250ZW50cyBpbnNpZGUgdGhpcyBMSU5FXG4gICAgICAgIGNvbnN0IHdvcmRNYXRjaGVzID0gQXJyYXkuZnJvbShsaW5lQmxvY2subWF0Y2hBbGwoLzxXT1JEW14+XSo+KFtcXHNcXFNdKj8pPFxcL1dPUkQ+L2dpKSk7XG4gICAgICAgIGNvbnN0IHdvcmRzID0gd29yZE1hdGNoZXNcbiAgICAgICAgICAubWFwKG0gPT4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICAgIGlmICh3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbGluZXMucHVzaCh3b3Jkcy5qb2luKCcgJykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZhbGxiYWNrOiB3b3JkcyBkaXJlY3RseSBpbiBwYXJhZ3JhcGhcbiAgICAgIGNvbnN0IHdvcmRNYXRjaGVzID0gQXJyYXkuZnJvbShwYXJCbG9jay5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKTtcbiAgICAgIGNvbnN0IHdvcmRzID0gd29yZE1hdGNoZXNcbiAgICAgICAgLm1hcChtID0+IGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhtWzFdLnRyaW0oKSkpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIGlmICh3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2god29yZHMuam9pbignICcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGluZXMubGVuZ3RoID4gMCkge1xuICAgICAgcGFyYWdyYXBocy5wdXNoKGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhsaW5lcy5qb2luKCdcXG4nKSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMocGFyYWdyYXBocy5qb2luKCdcXG5cXG4nKSk7XG59XG5cbi8qKlxuICogSGVscGVyIHRvIGRlY29kZSBhbGwgSFRNTCBhbmQgWE1MIGVudGl0aWVzIGludG8gcHJvcGVyIFVURi04IGNoYXJhY3RlcnMuXG4gKiBIYW5kbGVzIG51bWVyaWMgZGVjaW1hbCAoZS5nLiAmIzgyMTI7IC0+IOKAlCksIGhleCAoJiN4MjAxNDspLCBhbmQgbmFtZWQgZW50aXRpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCF0ZXh0IHx8IHR5cGVvZiB0ZXh0ICE9PSAnc3RyaW5nJykgcmV0dXJuICcnO1xuXG4gIHJldHVybiB0ZXh0XG4gICAgLy8gMS4gRGVjaW1hbCBudW1lcmljIGVudGl0aWVzOiAmIzgyMTI7IC0+ICfigJQnXG4gICAgLnJlcGxhY2UoLyYjKFxcZCspOy9nLCAoXywgZGVjKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb2RlID0gcGFyc2VJbnQoZGVjLCAxMCk7XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gXztcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIDIuIEhleGFkZWNpbWFsIG51bWVyaWMgZW50aXRpZXM6ICYjeDIwMTQ7IC0+ICfigJQnXG4gICAgLnJlcGxhY2UoLyYjeChbMC05YS1mQS1GXSspOy9nLCAoXywgaGV4KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb2RlID0gcGFyc2VJbnQoaGV4LCAxNik7XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gXztcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIDMuIE5hbWVkIGVudGl0aWVzXG4gICAgLnJlcGxhY2UoLyZtZGFzaDsvZywgJ+KAlCcpXG4gICAgLnJlcGxhY2UoLyZuZGFzaDsvZywgJ+KAkycpXG4gICAgLnJlcGxhY2UoLyZoZWxsaXA7L2csICfigKYnKVxuICAgIC5yZXBsYWNlKC8mbHNxdW87L2csICfigJgnKVxuICAgIC5yZXBsYWNlKC8mcnNxdW87L2csICfigJknKVxuICAgIC5yZXBsYWNlKC8mbGRxdW87L2csICfigJwnKVxuICAgIC5yZXBsYWNlKC8mcmRxdW87L2csICfigJ0nKVxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgJyAnKVxuICAgIC5yZXBsYWNlKC8mYnVsbDsvZywgJ+KAoicpXG4gICAgLnJlcGxhY2UoLyZjZW50Oy9nLCAnwqInKVxuICAgIC5yZXBsYWNlKC8mcG91bmQ7L2csICfCoycpXG4gICAgLnJlcGxhY2UoLyZ5ZW47L2csICfCpScpXG4gICAgLnJlcGxhY2UoLyZldXJvOy9nLCAn4oKsJylcbiAgICAucmVwbGFjZSgvJmNvcHk7L2csICfCqScpXG4gICAgLnJlcGxhY2UoLyZyZWc7L2csICfCricpXG4gICAgLnJlcGxhY2UoLyZkZWc7L2csICfCsCcpXG4gICAgLnJlcGxhY2UoLyZwbHVzbW47L2csICfCsScpXG4gICAgLnJlcGxhY2UoLyZ0aW1lczsvZywgJ8OXJylcbiAgICAucmVwbGFjZSgvJmRpdmlkZTsvZywgJ8O3JylcbiAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgLnJlcGxhY2UoLyZhcG9zOy9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgLnJlcGxhY2UoLyZndDsvZywgJz4nKVxuICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpOyAvLyBkZWNvZGUgJmFtcDsgbGFzdFxufVxuXG4vKipcbiAqIFN0cmlwcyBIYXRoaVRydXN0IDxmaWdjYXB0aW9uPiBtYXJrdXAgaW50byBjbGVhbiwgZm9ybWF0dGVkIE1hcmtkb3duL3RleHQuXG4gKiBIYW5kbGVzIGJvdGggRE9NIEVsZW1lbnQgaW5wdXRzIChpbiBicm93c2VyKSBhbmQgcmF3IEhUTUwgc3RyaW5ncyAoaW4gdGVzdHMpLlxuICogRXh0cmFjdHMgd29yZCBzcGFucywgcHJlc2VydmVzIHBhcmFncmFwaCBicmVha3MsIGFuZCBkZWNvZGVzIEhUTUwgZW50aXRpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChpbnB1dDogc3RyaW5nIHwgYW55KTogc3RyaW5nIHtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuICcnO1xuXG4gIC8vIElmIERPTSBFbGVtZW50IGluIGJyb3dzZXIgZW52aXJvbm1lbnRcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiYgaW5wdXQubm9kZVR5cGUpIHtcbiAgICBjb25zdCBlbCA9IGlucHV0IGFzIEVsZW1lbnQ7XG4gICAgY29uc3QgcEVsZW1lbnRzID0gQXJyYXkuZnJvbShlbC5xdWVyeVNlbGVjdG9yQWxsKCdwLCAub2NyX3BhcicpKTtcblxuICAgIGlmIChwRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcGFyYWdyYXBocyA9IHBFbGVtZW50cy5tYXAocCA9PiB7XG4gICAgICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShwLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4sIC5vY3J4X3dvcmQsIC5vY3JfbGluZScpKTtcbiAgICAgICAgaWYgKHNwYW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gc3BhbnNcbiAgICAgICAgICAgIC5tYXAocyA9PiAocy50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpKVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHAudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMocGFyYWdyYXBocy5qb2luKCdcXG5cXG4nKSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gPHA+IHRhZ3MsIGNoZWNrIGZvciBsaW5lIGVsZW1lbnRzXG4gICAgY29uc3QgbGluZXMgPSBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5vY3JfbGluZSwgZGl2JykpO1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBsaW5lVGV4dHMgPSBsaW5lcy5tYXAobGluZSA9PiB7XG4gICAgICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShsaW5lLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4sIC5vY3J4X3dvcmQnKSk7XG4gICAgICAgIGlmIChzcGFucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHNwYW5zLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpLmZpbHRlcihCb29sZWFuKS5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChsaW5lLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgfSkuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKGxpbmVUZXh0cy5qb2luKCdcXG4nKSk7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2s6IGV4dHJhY3QgYWxsIHNwYW5zIG9yIHRleHQgZGlyZWN0bHlcbiAgICBjb25zdCBzcGFucyA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnc3BhbicpKTtcbiAgICBpZiAoc3BhbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgdGV4dCA9IHNwYW5zLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpLmZpbHRlcihCb29sZWFuKS5qb2luKCcgJyk7XG4gICAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKHRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMoKGVsLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkucmVwbGFjZSgvWyBcXHRdKy9nLCAnICcpKTtcbiAgfVxuXG4gIC8vIElmIGlucHV0IGlzIGFuIEhUTUwgc3RyaW5nXG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgbGV0IGNsZWFuID0gaW5wdXQ7XG5cbiAgICAvLyBDaGVjayBmb3IgPHA+IG9yIDxkaXYgY2xhc3M9XCJvY3JfcGFyXCI+IHBhcmFncmFwaHNcbiAgICBjb25zdCBwTWF0Y2hlcyA9IGNsZWFuLm1hdGNoKC88KD86cHxkaXYgY2xhc3M9XCJvY3JfcGFyXCIpW14+XSo+KFtcXHNcXFNdKj8pPFxcLyg/OnB8ZGl2KT4vZ2kpO1xuICAgIGlmIChwTWF0Y2hlcyAmJiBwTWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwYXJhZ3JhcGhzID0gcE1hdGNoZXMubWFwKHBCbG9jayA9PiB7XG4gICAgICAgIHJldHVybiBwQmxvY2tcbiAgICAgICAgICAucmVwbGFjZSgvPGJyXFxzKlxcLz8+L2dpLCAnXFxuJylcbiAgICAgICAgICAucmVwbGFjZSgvPFtePl0rPi9nLCAnICcpXG4gICAgICAgICAgLnJlcGxhY2UoL1sgXFx0XFxyXFxuXSsvZywgJyAnKVxuICAgICAgICAgIC50cmltKCk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMocGFyYWdyYXBocy5qb2luKCdcXG5cXG4nKSk7XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIHN0cmlwIHRhZ3MsIHByZXNlcnZpbmcgPGJyPiBhcyBsaW5lIGJyZWFrc1xuICAgIGNvbnN0IHRleHQgPSBjbGVhblxuICAgICAgLnJlcGxhY2UoLzxiclxccypcXC8/Pi9naSwgJ1xcbicpXG4gICAgICAucmVwbGFjZSgvPFtePl0rPi9nLCAnICcpXG4gICAgICAucmVwbGFjZSgvWyBcXHRdKy9nLCAnICcpXG4gICAgICAucmVwbGFjZSgvXFxuXFxzKlxcbisvZywgJ1xcblxcbicpXG4gICAgICAudHJpbSgpO1xuXG4gICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyh0ZXh0KTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBBc3NlbWJsZXMgbXVsdGlwbGUgcGFnZSB0ZXh0cyBhbmQgYm9vayBtZXRhZGF0YSBpbnRvIGEgY2xlYW4sIGNvbXBsZXRlIE1hcmtkb3duIGRvY3VtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRCb29rTWFya2Rvd24oXG4gIG1ldGFkYXRhOiBCb29rTWV0YWRhdGEsXG4gIHBhZ2VzOiBQYWdlVGV4dEVudHJ5W11cbik6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIFRpdGxlIGFuZCBIZWFkZXJcbiAgcGFydHMucHVzaChgIyAke21ldGFkYXRhLnRpdGxlIHx8ICdVbnRpdGxlZCBCb29rJ31cXG5gKTtcblxuICBjb25zdCBtZXRhTGluZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChtZXRhZGF0YS5hdXRob3IpIG1ldGFMaW5lcy5wdXNoKGAtICoqQXV0aG9yOioqICR7bWV0YWRhdGEuYXV0aG9yfWApO1xuICBpZiAobWV0YWRhdGEucHVibGlzaGVyKSBtZXRhTGluZXMucHVzaChgLSAqKlB1Ymxpc2hlcjoqKiAke21ldGFkYXRhLnB1Ymxpc2hlcn1gKTtcbiAgaWYgKG1ldGFkYXRhLnllYXIpIG1ldGFMaW5lcy5wdXNoKGAtICoqRGF0ZToqKiAke21ldGFkYXRhLnllYXJ9YCk7XG5cbiAgaWYgKG1ldGFkYXRhLmJvb2tJZCkge1xuICAgIGlmIChtZXRhZGF0YS5zb3VyY2VVcmwgJiYgbWV0YWRhdGEuc291cmNlVXJsLmluY2x1ZGVzKCdoYXRoaXRydXN0Lm9yZycpKSB7XG4gICAgICBtZXRhTGluZXMucHVzaChgLSAqKkhhdGhpVHJ1c3QgSWRlbnRpZmllcjoqKiBbJHttZXRhZGF0YS5ib29rSWR9XSgke21ldGFkYXRhLnNvdXJjZVVybH0pYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqSW50ZXJuZXQgQXJjaGl2ZSBJZGVudGlmaWVyOioqIFske21ldGFkYXRhLmJvb2tJZH1dKGh0dHBzOi8vYXJjaGl2ZS5vcmcvZGV0YWlscy8ke21ldGFkYXRhLmJvb2tJZH0pYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG1ldGFkYXRhLnNvdXJjZVVybCAmJiAhbWV0YUxpbmVzLnNvbWUobCA9PiBsLmluY2x1ZGVzKG1ldGFkYXRhLnNvdXJjZVVybCEpKSkge1xuICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqU291cmNlOioqICR7bWV0YWRhdGEuc291cmNlVXJsfWApO1xuICB9XG4gIGlmIChtZXRhZGF0YS50b3RhbFBhZ2VzKSBtZXRhTGluZXMucHVzaChgLSAqKlRvdGFsIFBhZ2VzOioqICR7bWV0YWRhdGEudG90YWxQYWdlc31gKTtcblxuICBpZiAobWV0YUxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICBwYXJ0cy5wdXNoKG1ldGFMaW5lcy5qb2luKCdcXG4nKSk7XG4gICAgcGFydHMucHVzaCgnXFxuLS0tXFxuJyk7XG4gIH1cblxuICAvLyBTb3J0IHBhZ2VzIGJ5IHBhZ2VOdW1cbiAgY29uc3Qgc29ydGVkID0gWy4uLnBhZ2VzXS5zb3J0KChhLCBiKSA9PiBhLnBhZ2VOdW0gLSBiLnBhZ2VOdW0pO1xuXG4gIGZvciAoY29uc3QgcGFnZSBvZiBzb3J0ZWQpIHtcbiAgICBwYXJ0cy5wdXNoKGAjIyBQYWdlICR7cGFnZS5wYWdlTnVtfVxcblxcbmApO1xuICAgIGlmIChwYWdlLnRleHQgJiYgcGFnZS50ZXh0LnRyaW0oKSkge1xuICAgICAgcGFydHMucHVzaChgJHtwYWdlLnRleHQudHJpbSgpfVxcbmApO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJ0cy5wdXNoKGAqW05vIHRleHQgb3IgaWxsdXN0cmF0aW9uIHBhZ2VdKlxcbmApO1xuICAgIH1cbiAgICBwYXJ0cy5wdXNoKCdcXG4tLS1cXG4nKTtcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCdcXG4nKTtcbn1cblxuIiwKICAgICIvKipcbiAqIEZhc3QsIHB1cmUgSmF2YVNjcmlwdCBQREYgY29tcGlsZXIgZm9yIGVtYmVkZGluZyBKUEVHIHBhZ2UgaW1hZ2VzIGludG8gUERGIGRvY3VtZW50cy5cbiAqIENvbmZvcm1zIHRvIFBERiAxLjQgc3BlY2lmaWNhdGlvbi4gWmVybyBleHRlcm5hbCBiaW5hcnkgZGVwZW5kZW5jaWVzLlxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgSnBlZ0luZm8ge1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgY2hhbm5lbHM6IG51bWJlcjtcbiAgY29sb3JTcGFjZTogJ0RldmljZUdyYXknIHwgJ0RldmljZVJHQicgfCAnRGV2aWNlQ01ZSyc7XG4gIGJpdHM6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyB3aWR0aCwgaGVpZ2h0LCBhbmQgY29sb3Igc3BhY2UgZGlyZWN0bHkgZnJvbSBKUEVHIGhlYWRlciBtYXJrZXJzIChTT0YwL1NPRjIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SnBlZ0luZm8oZGF0YTogVWludDhBcnJheSk6IEpwZWdJbmZvIHtcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhkYXRhLmJ1ZmZlciwgZGF0YS5ieXRlT2Zmc2V0LCBkYXRhLmJ5dGVMZW5ndGgpO1xuXG4gIGlmICh2aWV3LmdldFVpbnQxNigwKSAhPT0gMHhmZmQ4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSB2YWxpZCBKUEVHIGltYWdlIChtaXNzaW5nIFNPSSBtYXJrZXIpLicpO1xuICB9XG5cbiAgY29uc3QgU09GX01BUktFUlMgPSBbXG4gICAgMHhmZmMwLCAweGZmYzEsIDB4ZmZjMiwgMHhmZmMzLCAweGZmYzUsIDB4ZmZjNiwgMHhmZmM3LCAweGZmYzksIDB4ZmZjYSxcbiAgICAweGZmY2IsIDB4ZmZjZCwgMHhmZmNlLCAweGZmY2YsXG4gIF07XG5cbiAgbGV0IHBvcyA9IDI7XG4gIHdoaWxlIChwb3MgPCBkYXRhLmxlbmd0aCAtIDgpIHtcbiAgICBjb25zdCBtYXJrZXIgPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgIHBvcyArPSAyO1xuXG4gICAgaWYgKFNPRl9NQVJLRVJTLmluY2x1ZGVzKG1hcmtlcikpIHtcbiAgICAgIHBvcyArPSAyOyAvLyBza2lwIGxlbmd0aFxuICAgICAgY29uc3QgYml0cyA9IHZpZXcuZ2V0VWludDgocG9zKyspO1xuICAgICAgY29uc3QgaGVpZ2h0ID0gdmlldy5nZXRVaW50MTYocG9zKTtcbiAgICAgIHBvcyArPSAyO1xuICAgICAgY29uc3Qgd2lkdGggPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb25zdCBjaGFubmVscyA9IHZpZXcuZ2V0VWludDgocG9zKyspO1xuXG4gICAgICBsZXQgY29sb3JTcGFjZTogJ0RldmljZUdyYXknIHwgJ0RldmljZVJHQicgfCAnRGV2aWNlQ01ZSycgPSAnRGV2aWNlUkdCJztcbiAgICAgIGlmIChjaGFubmVscyA9PT0gMSkgY29sb3JTcGFjZSA9ICdEZXZpY2VHcmF5JztcbiAgICAgIGVsc2UgaWYgKGNoYW5uZWxzID09PSA0KSBjb2xvclNwYWNlID0gJ0RldmljZUNNWUsnO1xuXG4gICAgICByZXR1cm4geyB3aWR0aCwgaGVpZ2h0LCBjaGFubmVscywgY29sb3JTcGFjZSwgYml0cyB9O1xuICAgIH1cblxuICAgIGNvbnN0IGxlbmd0aCA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgcG9zICs9IGxlbmd0aDtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgU09GIG1hcmtlciBpbiBKUEVHIHN0cmVhbS4nKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gY29udmVydCBCYXNlNjQgRGF0YSBVUkwgdG8gVWludDhBcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGFVcmxUb0J5dGVzKGRhdGFVcmw6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBjb21tYUluZGV4ID0gZGF0YVVybC5pbmRleE9mKCcsJyk7XG4gIGNvbnN0IGJhc2U2NCA9IGNvbW1hSW5kZXggPj0gMCA/IGRhdGFVcmwuc2xpY2UoY29tbWFJbmRleCArIDEpIDogZGF0YVVybDtcbiAgY29uc3QgYmluYXJ5U3RyaW5nID0gYXRvYihiYXNlNjQpO1xuICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJpbmFyeVN0cmluZy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmFyeVN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgIGJ5dGVzW2ldID0gYmluYXJ5U3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gIH1cbiAgcmV0dXJuIGJ5dGVzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBkZkltYWdlSW5wdXQge1xuICBwYWdlTnVtOiBudW1iZXI7XG4gIGRhdGE6IFVpbnQ4QXJyYXkgfCBzdHJpbmc7IC8vIFVpbnQ4QXJyYXkgb3IgRGF0YVVSTFxuICB3aWR0aD86IG51bWJlcjtcbiAgaGVpZ2h0PzogbnVtYmVyO1xufVxuXG4vKipcbiAqIENvbXBpbGVzIGEgbGlzdCBvZiBKUEVHIGltYWdlcyBpbnRvIGEgdmFsaWQgUERGIGRvY3VtZW50LlxuICogRW1iZWRzIHJhdyBKUEVHIHN0cmVhbXMgZGlyZWN0bHkgd2l0aG91dCBkZWNvbXByZXNzaW9uIG9yIHJlLWVuY29kaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUpwZWdzVG9QZGYoXG4gIGltYWdlczogUGRmSW1hZ2VJbnB1dFtdLFxuICBtZXRhZGF0YTogeyB0aXRsZT86IHN0cmluZzsgYXV0aG9yPzogc3RyaW5nOyBjcmVhdG9yPzogc3RyaW5nIH0gPSB7fVxuKTogVWludDhBcnJheSB7XG4gIGlmIChpbWFnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIFBERjogTm8gaW1hZ2VzIHByb3ZpZGVkLicpO1xuICB9XG5cbiAgY29uc3QgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgY29uc3QgY2h1bmtzOiBVaW50OEFycmF5W10gPSBbXTtcbiAgY29uc3Qgb2Zmc2V0czogbnVtYmVyW10gPSBbXTtcbiAgbGV0IGN1cnJlbnRPZmZzZXQgPSAwO1xuXG4gIGZ1bmN0aW9uIHdyaXRlKGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgY2h1bmtzLnB1c2goYnl0ZXMpO1xuICAgIGN1cnJlbnRPZmZzZXQgKz0gYnl0ZXMubGVuZ3RoO1xuICB9XG5cbiAgZnVuY3Rpb24gd3JpdGVTdHJpbmcoc3RyOiBzdHJpbmcpIHtcbiAgICB3cml0ZSh0ZXh0RW5jb2Rlci5lbmNvZGUoc3RyKSk7XG4gIH1cblxuICAvLyBIZWFkZXJcbiAgd3JpdGVTdHJpbmcoJyVQREYtMS40XFxuJVxceEUyXFx4RTNcXHhDRlxceEQzXFxuJyk7XG5cbiAgbGV0IG9iaklkQ291bnRlciA9IDE7XG4gIGZ1bmN0aW9uIHN0YXJ0T2JqZWN0KCk6IG51bWJlciB7XG4gICAgY29uc3QgaWQgPSBvYmpJZENvdW50ZXIrKztcbiAgICBvZmZzZXRzW2lkXSA9IGN1cnJlbnRPZmZzZXQ7XG4gICAgd3JpdGVTdHJpbmcoYCR7aWR9IDAgb2JqXFxuYCk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kT2JqZWN0KCkge1xuICAgIHdyaXRlU3RyaW5nKCdlbmRvYmpcXG4nKTtcbiAgfVxuXG4gIGNvbnN0IHRvdGFsUGFnZXMgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIC8vIFByZS1jYWxjdWxhdGUgT2JqZWN0IElEczpcbiAgLy8gMTogQ2F0YWxvZ1xuICAvLyAyOiBQYWdlc1xuICAvLyAzICsgKGkgKiAzKTogUGFnZSBvYmplY3RcbiAgLy8gNCArIChpICogMyk6IENvbnRlbnQgc3RyZWFtXG4gIC8vIDUgKyAoaSAqIDMpOiBJbWFnZSBYT2JqZWN0XG4gIGNvbnN0IGNhdGFsb2dJZCA9IDE7XG4gIGNvbnN0IHBhZ2VzUm9vdElkID0gMjtcbiAgY29uc3QgcGFnZUlkczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbFBhZ2VzOyBpKyspIHtcbiAgICBwYWdlSWRzLnB1c2goMyArIGkgKiAzKTtcbiAgfVxuXG4gIC8vIDEuIENhdGFsb2dcbiAgc3RhcnRPYmplY3QoKTsgLy8gMVxuICB3cml0ZVN0cmluZyhgPDxcXG4gIC9UeXBlIC9DYXRhbG9nXFxuICAvUGFnZXMgJHtwYWdlc1Jvb3RJZH0gMCBSXFxuPj5cXG5gKTtcbiAgZW5kT2JqZWN0KCk7XG5cbiAgLy8gMi4gUGFnZXMgUm9vdFxuICBzdGFydE9iamVjdCgpOyAvLyAyXG4gIGNvbnN0IGtpZHNTdHIgPSBwYWdlSWRzLm1hcChpZCA9PiBgJHtpZH0gMCBSYCkuam9pbignICcpO1xuICB3cml0ZVN0cmluZyhgPDxcXG4gIC9UeXBlIC9QYWdlc1xcbiAgL0tpZHMgWyAke2tpZHNTdHJ9IF1cXG4gIC9Db3VudCAke3RvdGFsUGFnZXN9XFxuPj5cXG5gKTtcbiAgZW5kT2JqZWN0KCk7XG5cbiAgLy8gMy4gUmVuZGVyIEVhY2ggUGFnZSAoUGFnZSwgQ29udGVudHMsIEltYWdlIFhPYmplY3QpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxQYWdlczsgaSsrKSB7XG4gICAgY29uc3QgaXRlbSA9IGltYWdlc1tpXTtcbiAgICBjb25zdCBpbWFnZUJ5dGVzID0gdHlwZW9mIGl0ZW0uZGF0YSA9PT0gJ3N0cmluZycgPyBkYXRhVXJsVG9CeXRlcyhpdGVtLmRhdGEpIDogaXRlbS5kYXRhO1xuICAgIGNvbnN0IGluZm8gPSBnZXRKcGVnSW5mbyhpbWFnZUJ5dGVzKTtcblxuICAgIGNvbnN0IHdpZHRoID0gaXRlbS53aWR0aCB8fCBpbmZvLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IGl0ZW0uaGVpZ2h0IHx8IGluZm8uaGVpZ2h0O1xuXG4gICAgY29uc3QgcGFnZU9iaklkID0gMyArIGkgKiAzO1xuICAgIGNvbnN0IGNvbnRlbnRPYmpJZCA9IDQgKyBpICogMztcbiAgICBjb25zdCBpbWFnZU9iaklkID0gNSArIGkgKiAzO1xuXG4gICAgLy8gUGFnZSBPYmplY3RcbiAgICBzdGFydE9iamVjdCgpOyAvLyBwYWdlT2JqSWRcbiAgICB3cml0ZVN0cmluZyhcbiAgICAgIGA8PFxcbmAgK1xuICAgICAgYCAgL1R5cGUgL1BhZ2VcXG5gICtcbiAgICAgIGAgIC9QYXJlbnQgJHtwYWdlc1Jvb3RJZH0gMCBSXFxuYCArXG4gICAgICBgICAvTWVkaWFCb3ggWyAwIDAgJHt3aWR0aH0gJHtoZWlnaHR9IF1cXG5gICtcbiAgICAgIGAgIC9Db250ZW50cyAke2NvbnRlbnRPYmpJZH0gMCBSXFxuYCArXG4gICAgICBgICAvUmVzb3VyY2VzIDw8XFxuYCArXG4gICAgICBgICAgIC9YT2JqZWN0IDw8IC9JbSR7aSArIDF9ICR7aW1hZ2VPYmpJZH0gMCBSID4+XFxuYCArXG4gICAgICBgICA+PlxcbmAgK1xuICAgICAgYD4+XFxuYFxuICAgICk7XG4gICAgZW5kT2JqZWN0KCk7XG5cbiAgICAvLyBDb250ZW50IFN0cmVhbVxuICAgIGNvbnN0IGNvbnRlbnRTdHJlYW0gPSBgcVxcbiR7d2lkdGh9IDAgMCAke2hlaWdodH0gMCAwIGNtXFxuL0ltJHtpICsgMX0gRG9cXG5RXFxuYDtcbiAgICBjb25zdCBjb250ZW50Qnl0ZXMgPSB0ZXh0RW5jb2Rlci5lbmNvZGUoY29udGVudFN0cmVhbSk7XG5cbiAgICBzdGFydE9iamVjdCgpOyAvLyBjb250ZW50T2JqSWRcbiAgICB3cml0ZVN0cmluZyhgPDwgL0xlbmd0aCAke2NvbnRlbnRCeXRlcy5sZW5ndGh9ID4+XFxuc3RyZWFtXFxuYCk7XG4gICAgd3JpdGUoY29udGVudEJ5dGVzKTtcbiAgICB3cml0ZVN0cmluZygnXFxuZW5kc3RyZWFtXFxuJyk7XG4gICAgZW5kT2JqZWN0KCk7XG5cbiAgICAvLyBJbWFnZSBYT2JqZWN0XG4gICAgc3RhcnRPYmplY3QoKTsgLy8gaW1hZ2VPYmpJZFxuICAgIHdyaXRlU3RyaW5nKFxuICAgICAgYDw8XFxuYCArXG4gICAgICBgICAvVHlwZSAvWE9iamVjdFxcbmAgK1xuICAgICAgYCAgL1N1YnR5cGUgL0ltYWdlXFxuYCArXG4gICAgICBgICAvV2lkdGggJHtpbmZvLndpZHRofVxcbmAgK1xuICAgICAgYCAgL0hlaWdodCAke2luZm8uaGVpZ2h0fVxcbmAgK1xuICAgICAgYCAgL0NvbG9yU3BhY2UgLyR7aW5mby5jb2xvclNwYWNlfVxcbmAgK1xuICAgICAgYCAgL0JpdHNQZXJDb21wb25lbnQgJHtpbmZvLmJpdHN9XFxuYCArXG4gICAgICBgICAvRmlsdGVyIC9EQ1REZWNvZGVcXG5gICtcbiAgICAgIGAgIC9MZW5ndGggJHtpbWFnZUJ5dGVzLmxlbmd0aH1cXG5gICtcbiAgICAgIGA+PlxcbnN0cmVhbVxcbmBcbiAgICApO1xuICAgIHdyaXRlKGltYWdlQnl0ZXMpO1xuICAgIHdyaXRlU3RyaW5nKCdcXG5lbmRzdHJlYW1cXG4nKTtcbiAgICBlbmRPYmplY3QoKTtcbiAgfVxuXG4gIC8vIE9wdGlvbmFsIEluZm8gT2JqZWN0XG4gIGNvbnN0IGluZm9JZCA9IHN0YXJ0T2JqZWN0KCk7XG4gIGNvbnN0IHNhZmVUaXRsZSA9IChtZXRhZGF0YS50aXRsZSB8fCAnQXJjaGl2ZS5vcmcgQm9vaycpLnJlcGxhY2UoL1soKVxcXFxdL2csICdcXFxcJCYnKTtcbiAgY29uc3Qgc2FmZUF1dGhvciA9IChtZXRhZGF0YS5hdXRob3IgfHwgJ0FyY2hpdmUub3JnJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICBjb25zdCBjcmVhdG9yID0gKG1ldGFkYXRhLmNyZWF0b3IgfHwgJ0FyY2hpdmUgRG93bmxvYWRlcicpLnJlcGxhY2UoL1soKVxcXFxdL2csICdcXFxcJCYnKTtcbiAgd3JpdGVTdHJpbmcoXG4gICAgYDw8XFxuYCArXG4gICAgYCAgL1RpdGxlICgke3NhZmVUaXRsZX0pXFxuYCArXG4gICAgYCAgL0F1dGhvciAoJHtzYWZlQXV0aG9yfSlcXG5gICtcbiAgICBgICAvQ3JlYXRvciAoJHtjcmVhdG9yfSlcXG5gICtcbiAgICBgICAvUHJvZHVjZXIgKEFyY2hpdmUgRG93bmxvYWRlciBFeHRlbnNpb24pXFxuYCArXG4gICAgYCAgL0NyZWF0aW9uRGF0ZSAoRDoke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bLTpUXS9nLCAnJykuc2xpY2UoMCwgMTQpfVopXFxuYCArXG4gICAgYD4+XFxuYFxuICApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyBYUmVmIFRhYmxlXG4gIGNvbnN0IHN0YXJ0WHJlZiA9IGN1cnJlbnRPZmZzZXQ7XG4gIGNvbnN0IHRvdGFsT2JqZWN0cyA9IG9iaklkQ291bnRlcjsgLy8gMSB0byBvYmpJZENvdW50ZXItMVxuXG4gIHdyaXRlU3RyaW5nKGB4cmVmXFxuMCAke3RvdGFsT2JqZWN0c31cXG5gKTtcbiAgd3JpdGVTdHJpbmcoJzAwMDAwMDAwMDAgNjU1MzUgZiBcXG4nKTtcblxuICBmb3IgKGxldCBpZCA9IDE7IGlkIDwgdG90YWxPYmplY3RzOyBpZCsrKSB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gb2Zmc2V0c1tpZF0gfHwgMDtcbiAgICBjb25zdCBwYWRkZWRPZmZzZXQgPSBTdHJpbmcob2Zmc2V0KS5wYWRTdGFydCgxMCwgJzAnKTtcbiAgICB3cml0ZVN0cmluZyhgJHtwYWRkZWRPZmZzZXR9IDAwMDAwIG4gXFxuYCk7XG4gIH1cblxuICAvLyBUcmFpbGVyXG4gIHdyaXRlU3RyaW5nKFxuICAgIGB0cmFpbGVyXFxuYCArXG4gICAgYDw8XFxuYCArXG4gICAgYCAgL1NpemUgJHt0b3RhbE9iamVjdHN9XFxuYCArXG4gICAgYCAgL1Jvb3QgJHtjYXRhbG9nSWR9IDAgUlxcbmAgK1xuICAgIGAgIC9JbmZvICR7aW5mb0lkfSAwIFJcXG5gICtcbiAgICBgPj5cXG5gICtcbiAgICBgc3RhcnR4cmVmXFxuYCArXG4gICAgYCR7c3RhcnRYcmVmfVxcbmAgK1xuICAgIGAlJUVPRlxcbmBcbiAgKTtcblxuICAvLyBDb25jYXRlbmF0ZSBhbGwgY2h1bmtzIGludG8gZmluYWwgVWludDhBcnJheVxuICBsZXQgdG90YWxMZW5ndGggPSAwO1xuICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykgdG90YWxMZW5ndGggKz0gY2h1bmsubGVuZ3RoO1xuICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh0b3RhbExlbmd0aCk7XG4gIGxldCBwb3MgPSAwO1xuICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgIHJlc3VsdC5zZXQoY2h1bmssIHBvcyk7XG4gICAgcG9zICs9IGNodW5rLmxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIGNvbXBpbGVKcGVnc1RvUGRmLlxuICovXG5leHBvcnQgY29uc3QgY29tcGlsZUltYWdlc1RvUGRmID0gY29tcGlsZUpwZWdzVG9QZGY7XG4iLAogICAgIi8qKlxuICogRmlsZXN5c3RlbSBhbmQgbmFtaW5nIHNhbml0aXphdGlvbiB1dGlsaXRpZXNcbiAqL1xuXG4vKipcbiAqIFNhbml0aXplcyBhIHN0cmluZyBmb3Igc2FmZSB1c2FnZSBpbiBkaXJlY3Rvcnkgb3IgZmlsZSBuYW1lcyBhY3Jvc3MgbWFjT1MsIExpbnV4LCBhbmQgV2luZG93cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplRmlsZW5hbWUobmFtZTogc3RyaW5nLCBmYWxsYmFjayA9ICdib29rJyk6IHN0cmluZyB7XG4gIGlmICghbmFtZSB8fCB0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxsYmFjaztcblxuICAvLyBSZW1vdmUgb3IgcmVwbGFjZSBpbGxlZ2FsIGNoYXJhY3RlcnM6IC8gXFwgOiAqID8gXCIgPCA+IHwgYW5kIGNvbnRyb2wgY2hhcnNcbiAgbGV0IGNsZWFuZWQgPSBuYW1lXG4gICAgLnJlcGxhY2UoL1s8PjpcIi9cXFxcfD8qXFx4MDAtXFx4MUZdL2csICdfJylcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpXG4gICAgLnRyaW0oKTtcblxuICAvLyBTdHJpcCBsZWFkaW5nL3RyYWlsaW5nIGRvdHMgYW5kIHNwYWNlc1xuICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9eXFwuK3xcXC4rJC9nLCAnJykudHJpbSgpO1xuXG4gIC8vIEF2b2lkIHJlc2VydmVkIG5hbWVzIG9uIFdpbmRvd3MgKENPTiwgUFJOLCBBVVgsIE5VTCwgQ09NMS05LCBMUFQxLTkpXG4gIGNvbnN0IHJlc2VydmVkID0gL14oQ09OfFBSTnxBVVh8TlVMfENPTVsxLTldfExQVFsxLTldKSQvaTtcbiAgaWYgKHJlc2VydmVkLnRlc3QoY2xlYW5lZCkpIHtcbiAgICBjbGVhbmVkID0gYCR7Y2xlYW5lZH1fZmlsZWA7XG4gIH1cblxuICAvLyBDYXAgbGVuZ3RoIHRvIDEyMCBjaGFyYWN0ZXJzIHRvIHByZXZlbnQgcGF0aCBsaW1pdCBlcnJvcnNcbiAgaWYgKGNsZWFuZWQubGVuZ3RoID4gMTIwKSB7XG4gICAgY2xlYW5lZCA9IGNsZWFuZWQuc3Vic3RyaW5nKDAsIDEyMCkudHJpbSgpO1xuICB9XG5cbiAgcmV0dXJuIGNsZWFuZWQgfHwgZmFsbGJhY2s7XG59XG5cbi8qKlxuICogRm9ybWF0cyBhIHN1YmZvbGRlciBwYXRoIGJhc2VkIG9uIHRoZSB1c2VyJ3MgdGVtcGxhdGUgcGF0dGVybi5cbiAqIFRlbXBsYXRlcyBzdXBwb3J0ZWQ6XG4gKiAtIHt0aXRsZX0gLT4gXCJUaGVfQm9va19UaXRsZVwiXG4gKiAtIHtpZH0gLT4gXCJuYWdoYW1tYWRpbGlicmFyMDBqYW1lXCJcbiAqIC0ge3RpdGxlfV97aWR9IC0+IFwiVGhlX0Jvb2tfVGl0bGVfbmFnaGFtbWFkaWxpYnJhcjAwamFtZVwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdWJkaXIoXG4gIGJhc2VEaXI6IHN0cmluZyxcbiAgcGF0dGVybjogc3RyaW5nLFxuICBib29rVGl0bGU6IHN0cmluZyxcbiAgYm9va0lkOiBzdHJpbmdcbik6IHN0cmluZyB7XG4gIGNvbnN0IHNhZmVCYXNlID0gc2FuaXRpemVGaWxlbmFtZShiYXNlRGlyLCAnQXJjaGl2ZUJvb2tzJyk7XG4gIGNvbnN0IHNhZmVUaXRsZSA9IHNhbml0aXplRmlsZW5hbWUoYm9va1RpdGxlLCAnYm9vaycpO1xuICBjb25zdCBzYWZlSWQgPSBzYW5pdGl6ZUZpbGVuYW1lKGJvb2tJZCwgJ2lkJyk7XG5cbiAgbGV0IGZvbGRlciA9IHBhdHRlcm4gfHwgJ3t0aXRsZX1fe2lkfSc7XG4gIGZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXHt0aXRsZVxcfS9nLCBzYWZlVGl0bGUpO1xuICBmb2xkZXIgPSBmb2xkZXIucmVwbGFjZSgvXFx7aWRcXH0vZywgc2FmZUlkKTtcbiAgZm9sZGVyID0gc2FuaXRpemVGaWxlbmFtZShmb2xkZXIsIHNhZmVUaXRsZSk7XG5cbiAgcmV0dXJuIGAke3NhZmVCYXNlfS8ke2ZvbGRlcn1gO1xufVxuXG4vKipcbiAqIEZvcm1hdHMgYSBwYWdlIGltYWdlIGZpbGVuYW1lIHdpdGggemVybyBwYWRkaW5nLlxuICogRXhhbXBsZTogXCJwYWdlXzAwMS5qcGdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0UGFnZUZpbGVuYW1lKFxuICBwYWdlTnVtOiBudW1iZXIsXG4gIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgZm9ybWF0ID0gJ2pwZydcbik6IHN0cmluZyB7XG4gIGNvbnN0IHBhZExlbmd0aCA9IE1hdGgubWF4KDMsIFN0cmluZyh0b3RhbFBhZ2VzKS5sZW5ndGgpO1xuICBjb25zdCBwYWRkZWROdW0gPSBTdHJpbmcocGFnZU51bSkucGFkU3RhcnQocGFkTGVuZ3RoLCAnMCcpO1xuICByZXR1cm4gYHBhZ2VfJHtwYWRkZWROdW19LiR7Zm9ybWF0fWA7XG59XG4iLAogICAgImltcG9ydCB7IEJvb2tQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQm9va0luZm8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBwYXJzZURqdnVYbWxUb1RleHQgfSBmcm9tICcuLi91dGlscy9tYXJrZG93bi1idWlsZGVyJztcblxuLyoqXG4gKiBFeHRyYWN0cyBwYWdlL2xlYWYgbnVtYmVyIGZyb20gQXJjaGl2ZS5vcmcgaW1hZ2UgVVJMcyAoZS5nLiBfMDAzMC50aWYgLT4gMzApLlxuICogRXhhbXBsZTogZmlsZT1wcmluY2lwbGVzdGVhY2gwMW51dHRnb29nX3RpZi9wcmluY2lwbGVzdGVhY2gwMW51dHRnb29nXzAwMzAudGlmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFyY2hpdmVJbWFnZVVybFBhZ2Uoc3JjOiBzdHJpbmcpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKCFzcmMpIHJldHVybiBudWxsO1xuICAvLyAxLiBCb29rUmVhZGVySW1hZ2VzLnBocCBmaWxlIHBhcmFtZXRlcjogZS5nLiBmaWxlPS4uLl8wMDMwLnRpZiBvciBmaWxlPS4uLi0wMDMwLmpwMlxuICBjb25zdCBmaWxlTWF0Y2ggPSBzcmMubWF0Y2goL1s/Jl1maWxlPVteJl0qP1tfXFwtXFwuXShcXGQrKVxcLig/OnRpZnxqcDJ8anBnfGpwZWd8cG5nKS9pKTtcbiAgaWYgKGZpbGVNYXRjaCkge1xuICAgIGNvbnN0IG51bSA9IHBhcnNlSW50KGZpbGVNYXRjaFsxXSwgMTApO1xuICAgIGlmICghaXNOYU4obnVtKSkgcmV0dXJuIG51bTtcbiAgfVxuICAvLyAyLiBHZW5lcmljIGxlYWYgZmlsZW5hbWUgaW4gVVJMIHBhdGg6IGUuZy4gL3ByaW5jaXBsZXN0ZWFjaDAxbnV0dGdvb2dfMDAzMC50aWZcbiAgY29uc3QgZ2VuZXJpY01hdGNoID0gc3JjLm1hdGNoKC9bX1xcLVxcLl0oXFxkezMsNn0pXFwuKD86dGlmfGpwMnxqcGd8anBlZ3xwbmcpKD86Wz8mI118JCkvaSk7XG4gIGlmIChnZW5lcmljTWF0Y2gpIHtcbiAgICBjb25zdCBudW0gPSBwYXJzZUludChnZW5lcmljTWF0Y2hbMV0sIDEwKTtcbiAgICBpZiAoIWlzTmFOKG51bSkpIHJldHVybiBudW07XG4gIH1cbiAgLy8gMy4gRXhwbGljaXQgcGFnZS9sZWFmIHF1ZXJ5IHBhcmFtZXRlcnM6ID9wYWdlPTMwIG9yICZsZWFmPTMwXG4gIGNvbnN0IHBhcmFtTWF0Y2ggPSBzcmMubWF0Y2goL1s/Jl0oPzpwYWdlfGxlYWYpPShcXGQrKS9pKTtcbiAgaWYgKHBhcmFtTWF0Y2gpIHtcbiAgICBjb25zdCBudW0gPSBwYXJzZUludChwYXJhbU1hdGNoWzFdLCAxMCk7XG4gICAgaWYgKCFpc05hTihudW0pKSByZXR1cm4gbnVtO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIGN1cnJlbnQgYW5kIHRvdGFsIHBhZ2UgZnJvbSBBcmNoaXZlLm9yZyBET00gaW5kaWNhdG9ycy5cbiAqIEV4YW1wbGU6IDxzcGFuIGNsYXNzPVwiQlJjdXJyZW50cGFnZVwiIHJvbGU9XCJzdGF0dXNcIj5QYWdlIOKAlCAoNTcvMzg0KTwvc3Bhbj4gLT4geyBjdXJyZW50OiA1NywgdG90YWw6IDM4NCB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFyY2hpdmVEb21QYWdlKHRleHQ6IHN0cmluZyk6IHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0gfCBudWxsIHtcbiAgaWYgKCF0ZXh0KSByZXR1cm4gbnVsbDtcbiAgLy8gMS4gKDU3LzM4NCkgb3IgKDU3IC0gNTgvMzg0KSBlLmcuIFwiUGFnZSDigJQgKDU3LzM4NClcIiBvciBcIlBhZ2VzICgxIC0gMi81MTUpXCJcbiAgY29uc3QgbWF0Y2ggPSB0ZXh0Lm1hdGNoKC9cXCgoXFxkKykoPzpcXHMqLVxccypcXGQrKT9cXHMqXFwvXFxzKihcXGQrKVxcKS8pO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY3VycmVudDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiBwYXJzZUludChtYXRjaFsyXSwgMTApLFxuICAgIH07XG4gIH1cbiAgLy8gMi4gU2ltcGxlIHNsYXNoIHdpdGggb3Igd2l0aG91dCBwYXJlbnRoZXNlczogNTcvMzg0IG9yICg1NyAvIDM4NClcbiAgY29uc3Qgc2xhc2hNYXRjaCA9IHRleHQubWF0Y2goLyhcXGQrKSg/OlxccyotXFxzKlxcZCspP1xccypcXC9cXHMqKFxcZCspLyk7XG4gIGlmIChzbGFzaE1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQ6IHBhcnNlSW50KHNsYXNoTWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiBwYXJzZUludChzbGFzaE1hdGNoWzJdLCAxMCksXG4gICAgfTtcbiAgfVxuICAvLyAzLiBcIlBhZ2UgNDIgb2YgMzAwXCJcbiAgY29uc3Qgb2ZNYXRjaCA9IHRleHQubWF0Y2goLyhcXGQrKVxccytvZlxccysoXFxkKykvaSk7XG4gIGlmIChvZk1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQ6IHBhcnNlSW50KG9mTWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiBwYXJzZUludChvZk1hdGNoWzJdLCAxMCksXG4gICAgfTtcbiAgfVxuICAvLyA0LiBcIlBhZ2UgNTdcIiBvciBcIlBhZ2Ug4oCUIDU3XCJcbiAgY29uc3QgcGFnZU1hdGNoID0gdGV4dC5tYXRjaCgvcGFnZVxccyrigJQ/XFxzKihcXGQrKS9pKTtcbiAgaWYgKHBhZ2VNYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBjdXJyZW50OiBwYXJzZUludChwYWdlTWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiAwLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBBcmNoaXZlUHJvdmlkZXIgaW1wbGVtZW50cyBCb29rUHJvdmlkZXIge1xuICByZWFkb25seSBzaXRlSWQgPSAnYXJjaGl2ZScgYXMgY29uc3Q7XG4gIHJlYWRvbmx5IHNpdGVOYW1lID0gJ0FyY2hpdmUub3JnJztcbiAgcmVhZG9ubHkgZGVmYXVsdFN0YXJ0UGFnZSA9IDA7XG5cbiAgcHJpdmF0ZSBib29rSW5mbzogQm9va0luZm8gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0ZXh0Q2FjaGUgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuICBwcml2YXRlIGRldGVjdGVkT2Zmc2V0OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBvbkFyY2hpdmVUZXh0UmVhZHkocGFnZTogbnVtYmVyLCB4bWw6IHN0cmluZykge1xuICAgIGNvbnN0IHRleHQgPSBwYXJzZURqdnVYbWxUb1RleHQoeG1sKTtcbiAgICBpZiAodGV4dCkge1xuICAgICAgdGhpcy50ZXh0Q2FjaGUuc2V0KHBhZ2UsIHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIGlzTWF0Y2goKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKSAmJiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuaW5jbHVkZXMoJy9kZXRhaWxzLycpO1xuICB9XG5cbiAgc2V0Qm9va0luZm8oaW5mbzogQm9va0luZm8gfCBudWxsKSB7XG4gICAgdGhpcy5ib29rSW5mbyA9IGluZm87XG4gIH1cblxuICBhc3luYyBkZXRlY3RCb29rSW5mbygpOiBQcm9taXNlPEJvb2tJbmZvIHwgbnVsbD4ge1xuICAgIC8vIFJlcXVlc3QgQm9va1JlYWRlciBkZXRlY3Rpb24gZnJvbSBicmlkZ2UgaW4gTUFJTiB3b3JsZFxuICAgIHRoaXMucG9zdFRvQnJpZGdlKCdERVRFQ1RfQk9PSycpO1xuXG4gICAgLy8gQWxzbyBpbnNwZWN0IERPTSBkaXJlY3RseSBhcyBmYXN0IHBhdGggLyBmYWxsYmFja1xuICAgIGNvbnN0IGRvbVBhZ2UgPSB0aGlzLmV4dHJhY3RQYWdlSW5mb0Zyb21Eb20oKTtcbiAgICBpZiAoZG9tUGFnZSkge1xuICAgICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC50aXRsZSB8fCAnQXJjaGl2ZSBCb29rJztcbiAgICAgIGNvbnN0IGlkTWF0Y2ggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubWF0Y2goL1xcL2RldGFpbHNcXC8oW15cXC9cXD8jXSspLyk7XG4gICAgICBjb25zdCBib29rSWQgPSBpZE1hdGNoID8gaWRNYXRjaFsxXSA6ICdib29rJztcblxuICAgICAgaWYgKCF0aGlzLmJvb2tJbmZvKSB7XG4gICAgICAgIHRoaXMuYm9va0luZm8gPSB7XG4gICAgICAgICAgYm9va0lkLFxuICAgICAgICAgIGJvb2tUaXRsZTogdGl0bGUsXG4gICAgICAgICAgdG90YWxQYWdlczogZG9tUGFnZS50b3RhbCxcbiAgICAgICAgICBjdXJyZW50TGVhZjogZG9tUGFnZS5jdXJyZW50LFxuICAgICAgICAgIGN1cnJlbnRNb2RlOiAxLFxuICAgICAgICAgIHNvdXJjZVVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZG9tUGFnZS50b3RhbCA+IDAgJiYgKCF0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgfHwgdGhpcy5ib29rSW5mby50b3RhbFBhZ2VzIDwgZG9tUGFnZS50b3RhbCkpIHtcbiAgICAgICAgICB0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgPSBkb21QYWdlLnRvdGFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYm9va0luZm87XG4gIH1cblxuICBnZXRDdXJyZW50UGFnZSgpOiBudW1iZXIgfCBudWxsIHtcbiAgICAvLyAxLiBDaGVjayBzdGF0dXMgLyBwYWdlIGluZGljYXRvciBzcGFucyBhY3Jvc3MgQm9va1JlYWRlciB2ZXJzaW9ucyAoYXV0aG9yaXRhdGl2ZTogLkJSY3VycmVudHBhZ2UpXG4gICAgY29uc3QgY3VycmVudFNwYW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0sIC5wYWdlLW51bWJlciwgLkJScGFnZXItY291bnRlcicpO1xuICAgIGlmIChjdXJyZW50U3BhbiAmJiBjdXJyZW50U3Bhbi50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VBcmNoaXZlRG9tUGFnZShjdXJyZW50U3Bhbi50ZXh0Q29udGVudCk7XG4gICAgICBpZiAocGFyc2VkICYmIHR5cGVvZiBwYXJzZWQuY3VycmVudCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlZC5jdXJyZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIFZpc2libGUgLyBzZWxlY3RlZCBwYWdlIGNvbnRhaW5lciBpbiBET01cbiAgICBjb25zdCB2aXNpYmxlQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICcuQlJwYWdlY29udGFpbmVyLkJScGFnZS12aXNpYmxlLCAuQlJwYWdlY29udGFpbmVyLS1oYXNTZWxlY3Rpb24sIC5CUnBhZ2UuYWN0aXZlJ1xuICAgICk7XG4gICAgaWYgKHZpc2libGVDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IGlkeEF0dHIgPSB2aXNpYmxlQ29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1pbmRleCcpIHx8IHZpc2libGVDb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXBhZ2UnKTtcbiAgICAgIGlmIChpZHhBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KGlkeEF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIENoZWNrIGlucHV0IGZpZWxkcyB1c2VkIGZvciBwYWdlIGp1bXBpbmdcbiAgICBjb25zdCBwYWdlSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dC5CUnBhZ2VpbnB1dCwgaW5wdXQucGFnZS1udW1iZXItaW5wdXQsIGlucHV0W25hbWU9XCJwYWdlXCJdJyk7XG4gICAgaWYgKHBhZ2VJbnB1dCAmJiBwYWdlSW5wdXQudmFsdWUpIHtcbiAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHBhZ2VJbnB1dC52YWx1ZSwgMTApO1xuICAgICAgaWYgKCFpc05hTih2YWwpKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uIEFyY2hpdmUub3JnLi4uJyk7XG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ1NXSVRDSF9NT0RFXzEnKTtcblxuICAgIC8vIEFjY29tbW9kYXRlIG11bHRpcGxlIGJ1dHRvbiBzZWxlY3RvcnMgYWNyb3NzIEJvb2tSZWFkZXIgdmVyc2lvbnNcbiAgICBjb25zdCBvbmVQYWdlQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvbi5vbmUtcGFnZSwgLkJScGFnZXZpZXcxLCBidXR0b25bZGF0YS1tb2RlPVwiMVwiXSwgW2FyaWEtbGFiZWwqPVwiMS1wYWdlXCIgaV0sIC5CUmljb25fb25lcGFnZSwgLnZpZXctbW9kZS0xdXAnXG4gICAgKTtcbiAgICBpZiAob25lUGFnZUJ0biAmJiAhb25lUGFnZUJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpICYmIG9uZVBhZ2VCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnKSAhPT0gJ3RydWUnKSB7XG4gICAgICB0cnkgeyBvbmVQYWdlQnRuLmNsaWNrKCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgbmF2aWdhdGVUb1BhZ2UocGFnZU51bTogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBBcmNoaXZlIGxlYWYgJHtwYWdlTnVtfS4uLmApO1xuICAgIHRoaXMucG9zdFRvQnJpZGdlKCdKVU1QX1BBR0UnLCB7IGxlYWZJbmRleDogcGFnZU51bSB9KTtcblxuICAgIGlmIChwYWdlTnVtID09PSAwKSB7XG4gICAgICBjb25zdCBmaXJzdEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgICAnYnV0dG9uW3RpdGxlKj1cIkZpcnN0IHBhZ2VcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmlyc3QgcGFnZVwiIGldLCBidXR0b24ubmF2Zmlyc3QsIC5ib29rLWZsaXAtZmlyc3QsIC5CUm5hdmZpcnN0LCBbYXJpYS1sYWJlbD1cIkZpcnN0IHBhZ2VcIiBpXSdcbiAgICAgICk7XG4gICAgICBpZiAoZmlyc3RCdG4pIHtcbiAgICAgICAgdHJ5IHsgZmlyc3RCdG4uY2xpY2soKTsgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cblxuICAgICAgY29uc3QgaG9tZUV2ZW50ID0geyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBrZXk6ICdIb21lJywgY29kZTogJ0hvbWUnLCBrZXlDb2RlOiAzNiwgd2hpY2g6IDM2IH07XG4gICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBob21lRXZlbnQpKTtcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgaG9tZUV2ZW50KSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW06IG51bWJlcik6IHZvaWQge1xuICAgIC8vIDEuIERpcmVjdCBCb29rUmVhZGVyIEFQSSBjYWxsIHZpYSBicmlkZ2UgKG1vc3QgcmVsaWFibGUgaW4gTUFJTiB3b3JsZCwgc3VwcG9ydHMgYnIuanVtcFRvSW5kZXggJiB2ZXJzaW9ucylcbiAgICB0aGlzLnBvc3RUb0JyaWRnZSgnRkxJUF9ORVhUJywgeyB0YXJnZXRQYWdlOiB0YXJnZXRQYWdlTnVtIH0pO1xuXG4gICAgLy8gMi4gRE9NIGJ1dHRvbiBjbGljayBmYWxsYmFjayBhY3Jvc3MgbXVsdGlwbGUgQm9va1JlYWRlciB2ZXJzaW9ucyAob25seSBpZiBuZWVkZWQpXG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblt0aXRsZSo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uLm5hdm5leHQsIC5ib29rLWZsaXAtcmlnaHQsIC5CUm5hdm5leHQsIFthcmlhLWxhYmVsPVwiTmV4dCBwYWdlXCIgaV0sIFtkYXRhLWFjdGlvbj1cIm5leHQtcGFnZVwiIGldLCAuQlJpY29uX2ZsaXBfcmlnaHQsIGJ1dHRvbi5wYWdlLW5leHQnXG4gICAgKTtcbiAgICBpZiAobmV4dEJ0bikge1xuICAgICAgdHJ5IHsgbmV4dEJ0bi5jbGljaygpOyB9IGNhdGNoIChlKSB7fVxuICAgIH1cbiAgfVxuXG4gIGdldEFjdGl2ZVBhZ2VJbWFnZShtaW5XaWR0aCA9IDMwMCwgdGFyZ2V0UGFnZU51bT86IG51bWJlcik6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsIHtcbiAgICAvLyAxLiBJZiB0YXJnZXRQYWdlTnVtIGlzIHNwZWNpZmllZCwgZmluZCB0aGUgaW1hZ2UgdmVyaWZpZWQgZm9yIHRoaXMgc3BlY2lmaWMgcGFnZVxuICAgIGlmICh0eXBlb2YgdGFyZ2V0UGFnZU51bSA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIDFhLiBQcmlvcml0eSAjMTogQXV0aG9yaXRhdGl2ZSBDb250YWluZXIgTG9va3VwIGZvciB0YXJnZXRQYWdlTnVtXG4gICAgICBjb25zdCB0YXJnZXRTZWxlY3RvcnMgPSBbXG4gICAgICAgIGAuQlJwYWdlY29udGFpbmVyW2RhdGEtaW5kZXg9XCIke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGAucGFnZWRpdiR7dGFyZ2V0UGFnZU51bX0gaW1nYCxcbiAgICAgICAgYFtkYXRhLWluZGV4PVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWcuQlJwYWdlaW1hZ2VgLFxuICAgICAgICBgW2RhdGEtaW5kZXg9XCIke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGBbZGF0YS1wYWdlLW51bT1cIm4ke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGAuQlJwYWdlW2RhdGEtcGFnZT1cIiR7dGFyZ2V0UGFnZU51bX1cIl0gaW1nYCxcbiAgICAgICAgYC5CUnBhZ2VbZGF0YS1sZWFmPVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWdgLFxuICAgICAgICBgI3BhZ2VkaXYke3RhcmdldFBhZ2VOdW19IGltZ2AsXG4gICAgICAgIGAjcGFnZSR7dGFyZ2V0UGFnZU51bX0gaW1nYCxcbiAgICAgIF07XG4gICAgICBmb3IgKGNvbnN0IHNlbCBvZiB0YXJnZXRTZWxlY3RvcnMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbWFnZUVsZW1lbnQ+KHNlbCk7XG4gICAgICAgIGlmIChlbCkge1xuICAgICAgICAgIC8vIElmIGltYWdlIGlzIGNvbXBsZXRlIGFuZCBsb2FkZWQgaW5zaWRlIHRhcmdldCBjb250YWluZXIsIElUIElTIFRIRSBUQVJHRVQgSU1BR0UhXG4gICAgICAgICAgaWYgKGVsLmNvbXBsZXRlICYmIGVsLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiBlbC5zcmMpIHtcbiAgICAgICAgICAgIGVsLmRhdGFzZXQuc2VxID0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgICAgLy8gTGVhcm4gZmlsZW5hbWUgb2Zmc2V0IChlLmcuIGxlYWYgMTcgaGF2aW5nIF8wMDE4LnRpZiA9PiBvZmZzZXQgPSAxOCAtIDE3ID0gMSlcbiAgICAgICAgICAgIGNvbnN0IGZpbGVOdW0gPSBwYXJzZUFyY2hpdmVJbWFnZVVybFBhZ2UoZWwuc3JjKTtcbiAgICAgICAgICAgIGlmIChmaWxlTnVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZzZXQgPSBmaWxlTnVtIC0gdGFyZ2V0UGFnZU51bTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQ29udGFpbmVyIGV4aXN0cyBidXQgaW1hZ2UgaXMgc3RpbGwgbG9hZGluZzogcmV0dXJuIG51bGwgc28gY2FsbGVyIHdhaXRzIGZvciBpdCFcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyAxYi4gUHJpb3JpdHkgIzI6IElmIHRhcmdldCBjb250YWluZXIgbm90IHlldCByZW5kZXJlZCBpbiBET00sIGNoZWNrIHZpc2libGUgY29udGFpbmVyIGlmIERPTSBzdGF0dXMgbWF0Y2hlc1xuICAgICAgY29uc3QgZG9tUGFnZSA9IHRoaXMuZ2V0Q3VycmVudFBhZ2UoKTtcbiAgICAgIGlmIChkb21QYWdlICE9PSBudWxsICYmIGRvbVBhZ2UgPT09IHRhcmdldFBhZ2VOdW0pIHtcbiAgICAgICAgY29uc3QgdmlzaWJsZUNvbnRhaW5lcnMgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICcuQlJwYWdlY29udGFpbmVyLkJScGFnZS12aXNpYmxlLCAuQlJwYWdlY29udGFpbmVyLS1oYXNTZWxlY3Rpb24sIC5CUnBhZ2UuYWN0aXZlJ1xuICAgICAgICApKTtcbiAgICAgICAgZm9yIChjb25zdCBjb250IG9mIHZpc2libGVDb250YWluZXJzKSB7XG4gICAgICAgICAgY29uc3QgaW1nID0gY29udC5xdWVyeVNlbGVjdG9yPEhUTUxJbWFnZUVsZW1lbnQ+KCdpbWcuQlJwYWdlaW1hZ2UsIGltZ1tjbGFzcyo9XCJCUnBhZ2VcIl0sIGltZycpO1xuICAgICAgICAgIGlmIChpbWcgJiYgaW1nLmNvbXBsZXRlICYmIGltZy5uYXR1cmFsV2lkdGggPj0gbWluV2lkdGggJiYgaW1nLnNyYykge1xuICAgICAgICAgICAgaW1nLmRhdGFzZXQuc2VxID0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgICAgY29uc3QgZmlsZU51bSA9IHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZShpbWcuc3JjKTtcbiAgICAgICAgICAgIGlmIChmaWxlTnVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXMuZGV0ZWN0ZWRPZmZzZXQgPSBmaWxlTnVtIC0gdGFyZ2V0UGFnZU51bTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbWc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIDFjLiBQcmlvcml0eSAjMzogVVJMIEZpbGVuYW1lIE1hdGNoaW5nIHdpdGggY2FsaWJyYXRlZCBvciBzdGFuZGFyZCBvZmZzZXRcbiAgICAgIGNvbnN0IGFsbEltYWdlcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PihcbiAgICAgICAgJ2ltZy5CUnBhZ2VpbWFnZSwgLkJScGFnZWNvbnRhaW5lciBpbWcsIC5CUnBhZ2UgaW1nLCBpbWdbc3JjKj1cIkJvb2tSZWFkZXJJbWFnZXMucGhwXCJdJ1xuICAgICAgKSkuZmlsdGVyKGltZyA9PiBpbWcuY29tcGxldGUgJiYgaW1nLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiBpbWcuc3JjKTtcblxuICAgICAgZm9yIChjb25zdCBpbWcgb2YgYWxsSW1hZ2VzKSB7XG4gICAgICAgIGNvbnN0IGZpbGVOdW0gPSBwYXJzZUFyY2hpdmVJbWFnZVVybFBhZ2UoaW1nLnNyYyk7XG4gICAgICAgIGlmIChmaWxlTnVtICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2hlc0NhbGlicmF0ZWQgPSB0aGlzLmRldGVjdGVkT2Zmc2V0ICE9PSBudWxsICYmIGZpbGVOdW0gPT09IHRhcmdldFBhZ2VOdW0gKyB0aGlzLmRldGVjdGVkT2Zmc2V0O1xuICAgICAgICAgIGNvbnN0IG1hdGNoZXNEZWZhdWx0ID0gdGhpcy5kZXRlY3RlZE9mZnNldCA9PT0gbnVsbCAmJiAoZmlsZU51bSA9PT0gdGFyZ2V0UGFnZU51bSB8fCBmaWxlTnVtID09PSB0YXJnZXRQYWdlTnVtICsgMSk7XG4gICAgICAgICAgaWYgKG1hdGNoZXNDYWxpYnJhdGVkIHx8IG1hdGNoZXNEZWZhdWx0KSB7XG4gICAgICAgICAgICBpbWcuZGF0YXNldC5zZXEgPSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgICAgICBpZiAodGhpcy5kZXRlY3RlZE9mZnNldCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aGlzLmRldGVjdGVkT2Zmc2V0ID0gZmlsZU51bSAtIHRhcmdldFBhZ2VOdW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW1nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGYWxsYmFjazogSWYgbm8gaW1hZ2Ugc3BlY2lmaWNhbGx5IGhhcyBhIGNvbnRyYWRpY3RvcnkgVVJMLCBjaGVjayBsYXRlc3QgRE9NIGltYWdlXG4gICAgICBjb25zdCBmYWxsYmFjayA9IGFsbEltYWdlc1thbGxJbWFnZXMubGVuZ3RoIC0gMV07XG4gICAgICBpZiAoZmFsbGJhY2spIHtcbiAgICAgICAgY29uc3QgZmlsZU51bSA9IHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZShmYWxsYmFjay5zcmMpO1xuICAgICAgICBpZiAoZmlsZU51bSA9PT0gbnVsbCB8fCAodGhpcy5kZXRlY3RlZE9mZnNldCAhPT0gbnVsbCA/IGZpbGVOdW0gPT09IHRhcmdldFBhZ2VOdW0gKyB0aGlzLmRldGVjdGVkT2Zmc2V0IDogKGZpbGVOdW0gPT09IHRhcmdldFBhZ2VOdW0gfHwgZmlsZU51bSA9PT0gdGFyZ2V0UGFnZU51bSArIDEpKSkge1xuICAgICAgICAgIGZhbGxiYWNrLmRhdGFzZXQuc2VxID0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgIHJldHVybiBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUYXJnZXQgcGFnZSBpbWFnZSBub3QgeWV0IGxvYWRlZCBpbiBET01cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIDIuIEZhbGxiYWNrIHdoZW4gbm8gdGFyZ2V0UGFnZU51bSBpcyBzcGVjaWZpZWQ6IFBpY2sgdGhlIGxhcmdlc3QgdmlzaWJsZSBpbWFnZSBpbiB2aWV3cG9ydFxuICAgIGNvbnN0IGNhbmRpZGF0ZVNlbGVjdG9ycyA9IFtcbiAgICAgICcuQlJwYWdlY29udGFpbmVyIGltZycsXG4gICAgICAnaW1nLkJScGFnZWltYWdlJyxcbiAgICAgICcuQlJwYWdlIGltZycsXG4gICAgICAnLkJScGFnZXZpZXcgaW1nJyxcbiAgICAgICdpbWdbc3JjKj1cIkJvb2tSZWFkZXJJbWFnZXMucGhwXCJdJyxcbiAgICAgICdpbWdbc3JjKj1cIi9Cb29rUmVhZGVyL1wiXScsXG4gICAgICAnLmJvb2stcGFnZSBpbWcnLFxuICAgIF07XG4gICAgY29uc3QgaW1hZ2VzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbWFnZUVsZW1lbnQ+KGNhbmRpZGF0ZVNlbGVjdG9ycy5qb2luKCcsICcpKSlcbiAgICAgIC5maWx0ZXIoaW1nID0+IGltZy5jb21wbGV0ZSAmJiBpbWcubmF0dXJhbFdpZHRoID49IG1pbldpZHRoICYmIGltZy5zcmMpO1xuXG4gICAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gICAgbGV0IGJlc3RJbWc6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbWF4VmlzaWJsZUFyZWEgPSAwO1xuICAgIGNvbnN0IHdpblcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5pbm5lcldpZHRoIDogMTkyMDtcbiAgICBjb25zdCB3aW5IID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiAxMDgwO1xuXG4gICAgZm9yIChjb25zdCBpbWcgb2YgaW1hZ2VzKSB7XG4gICAgICBjb25zdCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgdmlzaWJsZVdpZHRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5yaWdodCwgd2luVykgLSBNYXRoLm1heChyZWN0LmxlZnQsIDApKTtcbiAgICAgIGNvbnN0IHZpc2libGVIZWlnaHQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LmJvdHRvbSwgd2luSCkgLSBNYXRoLm1heChyZWN0LnRvcCwgMCkpO1xuICAgICAgY29uc3QgYXJlYSA9IHZpc2libGVXaWR0aCAqIHZpc2libGVIZWlnaHQ7XG5cbiAgICAgIGlmIChhcmVhID4gbWF4VmlzaWJsZUFyZWEgJiYgdmlzaWJsZVdpZHRoID4gNTAgJiYgdmlzaWJsZUhlaWdodCA+IDUwKSB7XG4gICAgICAgIG1heFZpc2libGVBcmVhID0gYXJlYTtcbiAgICAgICAgYmVzdEltZyA9IGltZztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYmVzdEltZyB8fCBpbWFnZXNbaW1hZ2VzLmxlbmd0aCAtIDFdIHx8IG51bGw7XG4gIH1cblxuICBhc3luYyBleHRyYWN0UGFnZVRleHQocGFnZU51bTogbnVtYmVyLCBpbWc/OiBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgLy8gMS4gQ2hlY2sgaWYgaW50ZXJjZXB0ZWQgZnJvbSBCb29rUmVhZGVyJ3MgbmV0d29yayBjYWxsXG4gICAgaWYgKHRoaXMudGV4dENhY2hlLmhhcyhwYWdlTnVtKSkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dENhY2hlLmdldChwYWdlTnVtKSE7XG4gICAgfVxuXG4gICAgLy8gMi4gV2FpdCBicmllZmx5ICh1cCB0byAyMDBtcykgaW4gY2FzZSBCb29rUmVhZGVyJ3MgYmFja2dyb3VuZCByZXF1ZXN0IGlzIGN1cnJlbnRseSBpbi1mbGlnaHRcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgaWYgKHRoaXMudGV4dENhY2hlLmhhcyhwYWdlTnVtKSkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXh0Q2FjaGUuZ2V0KHBhZ2VOdW0pITtcbiAgICAgIH1cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCA1MCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy50ZXh0Q2FjaGUuaGFzKHBhZ2VOdW0pKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0Q2FjaGUuZ2V0KHBhZ2VOdW0pITtcbiAgICB9XG5cbiAgICAvLyAzLiBEZXJpdmUgc2VydmVyIGFuZCBib29rUGF0aCBmcm9tIGJvb2tJbmZvIG9yIGR5bmFtaWNhbGx5IGZyb20gYWN0aXZlIHBhZ2UgaW1hZ2UgVVJMXG4gICAgbGV0IHNlcnZlciA9IHRoaXMuYm9va0luZm8/LnNlcnZlciB8fCAnJztcbiAgICBsZXQgYm9va1BhdGggPSB0aGlzLmJvb2tJbmZvPy5ib29rUGF0aCB8fCAnJztcblxuICAgIGNvbnN0IGNhbmRpZGF0ZVNyYyA9IGltZz8uc3JjIHx8IHRoaXMuZ2V0QWN0aXZlUGFnZUltYWdlKDMwMCwgcGFnZU51bSk/LnNyYztcbiAgICBpZiAoKCFzZXJ2ZXIgfHwgIWJvb2tQYXRoKSAmJiBjYW5kaWRhdGVTcmMgJiYgY2FuZGlkYXRlU3JjLmluY2x1ZGVzKCdCb29rUmVhZGVySW1hZ2VzLnBocCcpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB1ID0gbmV3IFVSTChjYW5kaWRhdGVTcmMpO1xuICAgICAgICBpZiAoIXNlcnZlcikgc2VydmVyID0gdS5ob3N0O1xuICAgICAgICBjb25zdCB6aXBQYXJhbSA9IHUuc2VhcmNoUGFyYW1zLmdldCgnemlwJyk7XG4gICAgICAgIGNvbnN0IGlkUGFyYW0gPSB1LnNlYXJjaFBhcmFtcy5nZXQoJ2lkJyk7XG4gICAgICAgIGlmICghYm9va1BhdGgpIHtcbiAgICAgICAgICBpZiAoemlwUGFyYW0pIHtcbiAgICAgICAgICAgIGJvb2tQYXRoID0gemlwUGFyYW0ucmVwbGFjZSgvX1thLXpBLVowLTldK1xcLnppcCQvaSwgJycpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaWRQYXJhbSkge1xuICAgICAgICAgICAgYm9va1BhdGggPSBgLzAvaXRlbXMvJHtpZFBhcmFtfS8ke2lkUGFyYW19YDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYm9va0luZm8pIHtcbiAgICAgICAgICBpZiAoIXRoaXMuYm9va0luZm8uc2VydmVyICYmIHNlcnZlcikgdGhpcy5ib29rSW5mby5zZXJ2ZXIgPSBzZXJ2ZXI7XG4gICAgICAgICAgaWYgKCF0aGlzLmJvb2tJbmZvLmJvb2tQYXRoICYmIGJvb2tQYXRoKSB0aGlzLmJvb2tJbmZvLmJvb2tQYXRoID0gYm9va1BhdGg7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgaWYgKCFzZXJ2ZXIgfHwgIWJvb2tQYXRoKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgY29uc3QgbGVhZkluZGV4ID0gcGFnZU51bTtcbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly8ke3NlcnZlcn0vQm9va1JlYWRlci9Cb29rUmVhZGVyR2V0VGV4dFdyYXBwZXIucGhwP3BhdGg9JHtlbmNvZGVVUklDb21wb25lbnQoYm9va1BhdGgpfV9kanZ1LnhtbCZtb2RlPWRqdnVfeG1sJnBhZ2U9JHtsZWFmSW5kZXh9YDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnLFxuICAgICAgfSk7XG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSByZXR1cm4gJyc7XG4gICAgICBjb25zdCB4bWwgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICBjb25zdCB0ZXh0ID0gcGFyc2VEanZ1WG1sVG9UZXh0KHhtbCk7XG4gICAgICB0aGlzLnRleHRDYWNoZS5zZXQobGVhZkluZGV4LCB0ZXh0KTtcbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIENvdWxkIG5vdCBmZXRjaCB0ZXh0IGZvciBsZWFmICR7bGVhZkluZGV4fTpgLCBlcnIpO1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfVxuXG4gIGlzQXRFbmRPZkJvb2soY3VycmVudFBhZ2U6IG51bWJlciwgdG90YWxQYWdlczogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblt0aXRsZSo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uLm5hdm5leHQsIC5ib29rLWZsaXAtcmlnaHQsIC5CUm5hdm5leHQsIFthcmlhLWxhYmVsPVwiTmV4dCBwYWdlXCIgaV0sIFtkYXRhLWFjdGlvbj1cIm5leHQtcGFnZVwiIGldJ1xuICAgICk7XG4gICAgY29uc3QgaXNOZXh0RGlzYWJsZWQgPSBuZXh0QnRuICYmIChcbiAgICAgIG5leHRCdG4uZGlzYWJsZWQgfHxcbiAgICAgIG5leHRCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLWRpc2FibGVkJykgPT09ICd0cnVlJyB8fFxuICAgICAgbmV4dEJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2Rpc2FibGVkJylcbiAgICApO1xuICAgIGNvbnN0IGRvbUxlYWYgPSB0aGlzLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgcmV0dXJuIEJvb2xlYW4oaXNOZXh0RGlzYWJsZWQgfHwgKHRvdGFsUGFnZXMgPiAwICYmIGRvbUxlYWYgIT09IG51bGwgJiYgZG9tTGVhZiA+PSB0b3RhbFBhZ2VzICYmIGN1cnJlbnRQYWdlID49IHRvdGFsUGFnZXMpKTtcbiAgfVxuXG4gIHByaXZhdGUgcG9zdFRvQnJpZGdlKGFjdGlvbjogc3RyaW5nLCBleHRyYURhdGE6IGFueSA9IHt9KSB7XG4gICAgd2luZG93LnBvc3RNZXNzYWdlKHsgZGlyZWN0aW9uOiAnVE9fQlJJREdFJywgYWN0aW9uLCAuLi5leHRyYURhdGEgfSwgJyonKTtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdFBhZ2VJbmZvRnJvbURvbSgpOiB7IGN1cnJlbnQ6IG51bWJlcjsgdG90YWw6IG51bWJlciB9IHwgbnVsbCB7XG4gICAgY29uc3QgcGFnZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkJSY3VycmVudHBhZ2UsIFtyb2xlPVwic3RhdHVzXCJdJyk7XG4gICAgaWYgKHBhZ2VFbCAmJiBwYWdlRWwudGV4dENvbnRlbnQpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlQXJjaGl2ZURvbVBhZ2UocGFnZUVsLnRleHRDb250ZW50KTtcbiAgICAgIGlmIChwYXJzZWQpIHJldHVybiBwYXJzZWQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLAogICAgImltcG9ydCB7IEJvb2tQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQm9va0luZm8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dCB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuXG5leHBvcnQgY2xhc3MgSGF0aGlUcnVzdFByb3ZpZGVyIGltcGxlbWVudHMgQm9va1Byb3ZpZGVyIHtcbiAgcmVhZG9ubHkgc2l0ZUlkID0gJ2hhdGhpdHJ1c3QnIGFzIGNvbnN0O1xuICByZWFkb25seSBzaXRlTmFtZSA9ICdIYXRoaVRydXN0JztcbiAgcmVhZG9ubHkgZGVmYXVsdFN0YXJ0UGFnZSA9IDE7IC8vIEhhdGhpVHJ1c3Qgc2VxdWVuY2VzIGFyZSAxLWJhc2VkXG5cbiAgcHJpdmF0ZSBib29rSW5mbzogQm9va0luZm8gfCBudWxsID0gbnVsbDtcblxuICAvLyBUcmFja2luZyBsb2FkZWQgc2VxdWVuY2VzIGZyb20gTUFJTiB3b3JsZCBicmlkZ2VcbiAgcHJpdmF0ZSBhbm5vdW5jZWRTZXF1ZW5jZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBzZXFUb0Jsb2JVcmwgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuICBwcml2YXRlIGJsb2JVcmxUb1NlcSA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIHByaXZhdGUgc2VxVG9IdG1sID0gbmV3IE1hcDxudW1iZXIsIHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBMaXN0ZW4gZm9yIGJyaWRnZSBtZXNzYWdlcyAod29ybGQ6IE1BSU4pXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cgfHwgIWV2ZW50LmRhdGEgfHwgZXZlbnQuZGF0YS5kaXJlY3Rpb24gIT09ICdGUk9NX0JSSURHRScpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbXNnID0gZXZlbnQuZGF0YTtcbiAgICAgICAgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfTE9BRF9BTk5PVU5DRUQnKSB7XG4gICAgICAgICAgaWYgKG1zZy5pc0xvYWRlZCkge1xuICAgICAgICAgICAgdGhpcy5hbm5vdW5jZWRTZXF1ZW5jZXMuYWRkKG1zZy5zZXEpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gSGF0aGlUcnVzdCBhbm5vdW5jZWQgc2VxdWVuY2UgJHttc2cuc2VxfSBsb2FkZWRgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9JTUFHRV9SRUFEWScpIHtcbiAgICAgICAgICB0aGlzLnNlcVRvQmxvYlVybC5zZXQobXNnLnNlcSwgbXNnLmJsb2JVcmwpO1xuICAgICAgICAgIHRoaXMuYmxvYlVybFRvU2VxLnNldChtc2cuYmxvYlVybCwgbXNnLnNlcSk7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9URVhUX1JFQURZJykge1xuICAgICAgICAgIHRoaXMuc2VxVG9IdG1sLnNldChtc2cuc2VxLCBtc2cuaHRtbCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG9uUGFnZUxvYWRBbm5vdW5jZWQoc2VxOiBudW1iZXIsIGlzVmlzaWJsZTogYm9vbGVhbiwgaXNMb2FkZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoaXNMb2FkZWQpIHtcbiAgICAgIHRoaXMuYW5ub3VuY2VkU2VxdWVuY2VzLmFkZChzZXEpO1xuICAgIH1cbiAgfVxuXG4gIG9uUGFnZUltYWdlUmVhZHkoc2VxOiBudW1iZXIsIGJsb2JVcmw6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc2VxVG9CbG9iVXJsLnNldChzZXEsIGJsb2JVcmwpO1xuICAgIHRoaXMuYmxvYlVybFRvU2VxLnNldChibG9iVXJsLCBzZXEpO1xuICB9XG5cbiAgb25QYWdlVGV4dFJlYWR5KHNlcTogbnVtYmVyLCBodG1sOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNlcVRvSHRtbC5zZXQoc2VxLCBodG1sKTtcbiAgfVxuXG4gIGdldEJsb2JVcmxGb3JTZXEoc2VxOiBudW1iZXIpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnNlcVRvQmxvYlVybC5nZXQoc2VxKTtcbiAgfVxuXG4gIGdldENhY2hlZEh0bWxGb3JTZXEoc2VxOiBudW1iZXIpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnNlcVRvSHRtbC5nZXQoc2VxKTtcbiAgfVxuXG4gIGlzUGFnZUFubm91bmNlZChzZXE6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmFubm91bmNlZFNlcXVlbmNlcy5oYXMoc2VxKTtcbiAgfVxuXG4gIGlzTWF0Y2goKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNIb3N0ID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnYmFiZWwuaGF0aGl0cnVzdC5vcmcnIHx8XG4gICAgICAgICAgICAgICAgICAgKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5pbmNsdWRlcygnaGF0aGl0cnVzdC5vcmcnKSAmJiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3RhcnRzV2l0aCgnL2NnaS9wdCcpKTtcbiAgICByZXR1cm4gaXNIb3N0O1xuICB9XG5cbiAgYXN5bmMgZGV0ZWN0Qm9va0luZm8oKTogUHJvbWlzZTxCb29rSW5mbyB8IG51bGw+IHtcbiAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuICAgIGNvbnN0IGJvb2tJZCA9IHBhcmFtcy5nZXQoJ2lkJykgfHwgJ2hhdGhpdHJ1c3RfYm9vayc7XG5cbiAgICAvLyAxLiBEZXRlY3QgQm9vayBUaXRsZVxuICAgIGxldCBib29rVGl0bGUgPSAnJztcbiAgICBjb25zdCBtZXRhVGl0bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxNZXRhRWxlbWVudD4oJ21ldGFbbmFtZT1cIkRDLnRpdGxlXCJdLCBtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKTtcbiAgICBpZiAobWV0YVRpdGxlICYmIG1ldGFUaXRsZS5jb250ZW50KSB7XG4gICAgICBib29rVGl0bGUgPSBtZXRhVGl0bGUuY29udGVudC50cmltKCk7XG4gICAgfVxuICAgIGlmICghYm9va1RpdGxlKSB7XG4gICAgICBjb25zdCBoMSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2gxLnRpdGxlLCBoMS5pdGVtLXRpdGxlLCBoMScpO1xuICAgICAgaWYgKGgxICYmIGgxLnRleHRDb250ZW50KSB7XG4gICAgICAgIGJvb2tUaXRsZSA9IGgxLnRleHRDb250ZW50LnRyaW0oKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFib29rVGl0bGUpIHtcbiAgICAgIGJvb2tUaXRsZSA9IGRvY3VtZW50LnRpdGxlID8gZG9jdW1lbnQudGl0bGUucmVwbGFjZSgvWy18XVxccypIYXRoaVRydXN0LiovaSwgJycpLnRyaW0oKSA6ICdIYXRoaVRydXN0IEJvb2snO1xuICAgIH1cblxuICAgIC8vIDIuIERldGVjdCBUb3RhbCBQYWdlc1xuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSB0aGlzLmdldFRvdGFsUGFnZXNGcm9tRG9tKCk7XG5cbiAgICAvLyAzLiBEZXRlY3QgQ3VycmVudCBTZXF1ZW5jZVxuICAgIGNvbnN0IGN1cnJlbnRTZXEgPSB0aGlzLmdldEN1cnJlbnRQYWdlKCkgfHwgMTtcblxuICAgIC8vIENoZWNrIGF1dGhvciBhbmQgeWVhciBpZiBwcmVzZW50IGluIG1ldGFkYXRhXG4gICAgY29uc3QgYXV0aG9yTWV0YSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTE1ldGFFbGVtZW50PignbWV0YVtuYW1lPVwiREMuY3JlYXRvclwiXScpO1xuICAgIGNvbnN0IGF1dGhvciA9IGF1dGhvck1ldGE/LmNvbnRlbnQ7XG5cbiAgICBjb25zdCBkYXRlTWV0YSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTE1ldGFFbGVtZW50PignbWV0YVtuYW1lPVwiREMuZGF0ZVwiXScpO1xuICAgIGNvbnN0IHllYXIgPSBkYXRlTWV0YT8uY29udGVudDtcblxuICAgIHRoaXMuYm9va0luZm8gPSB7XG4gICAgICBib29rSWQsXG4gICAgICBib29rVGl0bGU6IGJvb2tUaXRsZSB8fCAnSGF0aGlUcnVzdCBCb29rJyxcbiAgICAgIHRvdGFsUGFnZXM6IHRvdGFsUGFnZXMgfHwgNTAwLFxuICAgICAgY3VycmVudExlYWY6IGN1cnJlbnRTZXEsXG4gICAgICBjdXJyZW50TW9kZTogMSxcbiAgICAgIHNvdXJjZVVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICBhdXRob3IsXG4gICAgICB5ZWFyLFxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBIYXRoaVRydXN0IHZvbHVtZSBkZXRlY3RlZDonLCB0aGlzLmJvb2tJbmZvLmJvb2tUaXRsZSwgYCgke3RoaXMuYm9va0luZm8udG90YWxQYWdlc30gcGFnZXMpYCk7XG4gICAgcmV0dXJuIHRoaXMuYm9va0luZm87XG4gIH1cblxuICBnZXRDdXJyZW50UGFnZSgpOiBudW1iZXIgfCBudWxsIHtcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykgcmV0dXJuIG51bGw7XG5cbiAgICAvLyAxLiBDaGVjayB0b29sYmFyIGlucHV0XG4gICAgY29uc3Qgc2VxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbGJhci1zZXEsIGlucHV0W25hbWU9XCJzZXFcIl0nKTtcbiAgICBpZiAoc2VxSW5wdXQgJiYgc2VxSW5wdXQudmFsdWUpIHtcbiAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHNlcUlucHV0LnZhbHVlLCAxMCk7XG4gICAgICBpZiAoIWlzTmFOKHZhbCkgJiYgdmFsID4gMCkgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICAvLyAyLiBDaGVjayBVUkwgc2VhcmNoIHBhcmFtXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhdGlvbiAmJiB3aW5kb3cubG9jYXRpb24uc2VhcmNoKSB7XG4gICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuICAgICAgY29uc3Qgc2VxID0gcGFyYW1zLmdldCgnc2VxJyk7XG4gICAgICBpZiAoc2VxKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHNlcSwgMTApO1xuICAgICAgICBpZiAoIWlzTmFOKHZhbCkgJiYgdmFsID4gMCkgcmV0dXJuIHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAzLiBDaGVjayBkYXRhLXNlcSBvbiBhY3RpdmUgZmlndXJlIG9yIHNwcmVhZFxuICAgIGNvbnN0IGFjdGl2ZUZpZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5zcHJlYWQgZmlndXJlW2RhdGEtc2VxXSwgZmlndXJlW2RhdGEtc2VxXScpO1xuICAgIGlmIChhY3RpdmVGaWcpIHtcbiAgICAgIGNvbnN0IHNlcUF0dHIgPSBhY3RpdmVGaWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNlcScpO1xuICAgICAgaWYgKHNlcUF0dHIpIHtcbiAgICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoc2VxQXR0ciwgMTApO1xuICAgICAgICBpZiAoIWlzTmFOKHZhbCkgJiYgdmFsID4gMCkgcmV0dXJuIHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIG5hdmlnYXRlVG9QYWdlKHBhZ2VOdW06IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIE5hdmlnYXRpbmcgdG8gSGF0aGlUcnVzdCBzZXF1ZW5jZSAke3BhZ2VOdW19Li4uYCk7XG4gICAgY29uc3Qgc2VxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbGJhci1zZXEsIGlucHV0W25hbWU9XCJzZXFcIl0nKTtcblxuICAgIGlmIChzZXFJbnB1dCkge1xuICAgICAgc2VxSW5wdXQuZm9jdXMoKTtcbiAgICAgIHNlcUlucHV0LnZhbHVlID0gU3RyaW5nKHBhZ2VOdW0pO1xuICAgICAgc2VxSW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgIHNlcUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjaGFuZ2UnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuXG4gICAgICAvLyBEaXNwYXRjaCBFbnRlciBrZXlkb3duIGV2ZW50XG4gICAgICBjb25zdCBlbnRlckV2ZW50ID0gbmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCB7XG4gICAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgICAgIGtleTogJ0VudGVyJyxcbiAgICAgICAgY29kZTogJ0VudGVyJyxcbiAgICAgICAga2V5Q29kZTogMTMsXG4gICAgICAgIHdoaWNoOiAxMyxcbiAgICAgIH0pO1xuICAgICAgc2VxSW5wdXQuZGlzcGF0Y2hFdmVudChlbnRlckV2ZW50KTtcblxuICAgICAgLy8gU3VibWl0IHBhcmVudCBmb3JtIGlmIHByZXNlbnRcbiAgICAgIGNvbnN0IGZvcm0gPSBzZXFJbnB1dC5jbG9zZXN0KCdmb3JtJyk7XG4gICAgICBpZiAoZm9ybSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZm9ybS5yZXF1ZXN0U3VibWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBmb3JtLnJlcXVlc3RTdWJtaXQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnc3VibWl0JywgeyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB0cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bTogbnVtYmVyKTogdm9pZCB7XG4gICAgLy8gMS4gUHJpbWFyeTogQ2xpY2sgTmV4dCBQYWdlIGJ1dHRvblxuICAgIC8vIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1vdXRsaW5lLWRhcmtcIiBhcmlhLWxhYmVsPVwiTmV4dCBQYWdlXCI+PGkgY2xhc3M9XCJmYS1zb2xpZCBmYS1hbmdsZS1yaWdodFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT48L2J1dHRvbj5cbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudCB8IEhUTUxBbmNob3JFbGVtZW50PihcbiAgICAgICdidXR0b25bYXJpYS1sYWJlbD1cIk5leHQgUGFnZVwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJOZXh0XCIgaV0sIGJ1dHRvblt0aXRsZSo9XCJOZXh0XCIgaV0sIFthY2Nlc3NrZXk9XCJuXCJdLCBidXR0b24ubmV4dCwgYS5hY3Rpb24tbmV4dC1wYWdlJ1xuICAgICk7XG4gICAgaWYgKG5leHRCdG4pIHtcbiAgICAgIGNvbnN0IGRpc2FibGVkID0gKG5leHRCdG4gYXMgYW55KS5kaXNhYmxlZCB8fFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0QnRuLmdldEF0dHJpYnV0ZSgnYXJpYS1kaXNhYmxlZCcpID09PSAndHJ1ZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2Rpc2FibGVkJyk7XG4gICAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gQ2xpY2tpbmcgSGF0aGlUcnVzdCBOZXh0IFBhZ2UgYnV0dG9uLi4uJyk7XG4gICAgICAgICAgbmV4dEJ0bi5jbGljaygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBLZXlib2FyZCBBcnJvd1JpZ2h0IGV2ZW50IChzdGFuZGFyZCByZWFkZXIgaG90a2V5KVxuICAgIGNvbnN0IGtleUV2ZW50ID0ge1xuICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgICBrZXk6ICdBcnJvd1JpZ2h0JyxcbiAgICAgIGNvZGU6ICdBcnJvd1JpZ2h0JyxcbiAgICAgIGtleUNvZGU6IDM5LFxuICAgICAgd2hpY2g6IDM5LFxuICAgIH07XG4gICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywga2V5RXZlbnQpKTtcbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGtleUV2ZW50KSk7XG5cbiAgICAvLyAzLiBGYWxsYmFjazogb25seSBpZiBOZXh0IGJ1dHRvbiBpcyBub3QgYXZhaWxhYmxlLCB1c2Ugc2VxdWVuY2UgaW5wdXRcbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuICAgIGlmIChzZXFJbnB1dCkge1xuICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRmFsbGJhY2sgdG8gc2VxdWVuY2UgaW5wdXQgJHt0YXJnZXRQYWdlTnVtfS4uLmApO1xuICAgICAgdGhpcy5uYXZpZ2F0ZVRvUGFnZSh0YXJnZXRQYWdlTnVtKTtcbiAgICB9XG4gIH1cblxuICBnZXRBY3RpdmVQYWdlSW1hZ2UobWluV2lkdGggPSAzMDAsIHRhcmdldFNlcT86IG51bWJlcik6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsIHtcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykgcmV0dXJuIG51bGw7XG5cbiAgICAvLyAxLiBJZiB0YXJnZXRTZXEgaXMgc3BlY2lmaWVkIChkdXJpbmcgc2VxdWVudGlhbCBjYXB0dXJlKVxuICAgIGlmICh0eXBlb2YgdGFyZ2V0U2VxID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgY3VycmVudFNlcSA9IHRoaXMuZ2V0Q3VycmVudFBhZ2UoKTtcbiAgICAgIC8vIElmIHRoZSByZWFkZXIgdG9vbGJhciBoYXMgbm90IHJlYWNoZWQgdGFyZ2V0U2VxIHlldCwgd2FpdCFcbiAgICAgIGlmIChjdXJyZW50U2VxICE9PSBudWxsICYmIGN1cnJlbnRTZXEgPCB0YXJnZXRTZXEpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFuIGltYWdlIGV4cGxpY2l0bHkgdGFnZ2VkIHdpdGggdGFyZ2V0U2VxXG4gICAgICBjb25zdCB0YWdnZWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbWFnZUVsZW1lbnQ+KGBpbWdbZGF0YS1zZXE9XCIke3RhcmdldFNlcX1cIl1gKTtcbiAgICAgIGlmICh0YWdnZWQgJiYgdGFnZ2VkLmNvbXBsZXRlICYmIHRhZ2dlZC5uYXR1cmFsV2lkdGggPj0gbWluV2lkdGggJiYgdGFnZ2VkLnNyYyAmJiAhdGFnZ2VkLnNyYy5pbmNsdWRlcygnYmFzZTY0LGlWQk9SdycpKSB7XG4gICAgICAgIHJldHVybiB0YWdnZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcnkgY2FuZGlkYXRlIHBhZ2UgaW1hZ2VzIGluc2lkZSBtYWluI21haW5cbiAgICBjb25zdCBpbWFnZXMgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEltYWdlRWxlbWVudD4oXG4gICAgICAnbWFpbiNtYWluIGRldGFpbHMgZmlndXJlIGRpdi5pbWFnZSBpbWcsIG1haW4jbWFpbiBkZXRhaWxzIGZpZ3VyZSBpbWcsIG1haW4jbWFpbiBkaXYuc3ByZWFkIGZpZ3VyZSBkaXYuaW1hZ2UgaW1nLCBtYWluI21haW4gZGl2LnNwcmVhZCBmaWd1cmUgaW1nLCBtYWluI21haW4gaW1nW3NyY149XCJibG9iOlwiXSwgbWFpbiNtYWluIGltZydcbiAgICApKTtcblxuICAgIGNvbnN0IHZhbGlkID0gaW1hZ2VzLmZpbHRlcihpbWcgPT5cbiAgICAgIGltZy5jb21wbGV0ZSAmJlxuICAgICAgaW1nLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJlxuICAgICAgaW1nLnNyYyAmJlxuICAgICAgIWltZy5zcmMuaW5jbHVkZXMoJ2Jhc2U2NCxpVkJPUncnKSAvLyBJZ25vcmUgdHJhbnNwYXJlbnQgMXgxIHBsYWNlaG9sZGVyXG4gICAgKTtcblxuICAgIGlmICh2YWxpZC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gICAgLy8gUGljayBpbWFnZSB2aXNpYmxlIHdpdGhpbiBicm93c2VyIHZpZXdwb3J0XG4gICAgY29uc3QgdmlzaWJsZSA9IHZhbGlkLmZpbmQoaW1nID0+IHtcbiAgICAgIC8vIElmIGltYWdlIGlzIGV4cGxpY2l0bHkgdGFnZ2VkIHdpdGggYSBkaWZmZXJlbnQgc2VxdWVuY2UsIGRvIG5vdCBwaWNrIGl0IVxuICAgICAgaWYgKHR5cGVvZiB0YXJnZXRTZXEgPT09ICdudW1iZXInICYmIGltZy5kYXRhc2V0LnNlcSAmJiBwYXJzZUludChpbWcuZGF0YXNldC5zZXEsIDEwKSAhPT0gdGFyZ2V0U2VxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHJldHVybiByZWN0LndpZHRoID4gNTAgJiYgcmVjdC5oZWlnaHQgPiA1MCAmJlxuICAgICAgICAgICAgIHJlY3QudG9wIDwgd2luZG93LmlubmVySGVpZ2h0ICYmIHJlY3QuYm90dG9tID4gMCAmJlxuICAgICAgICAgICAgIHJlY3QubGVmdCA8IHdpbmRvdy5pbm5lcldpZHRoICYmIHJlY3QucmlnaHQgPiAwO1xuICAgIH0pO1xuXG4gICAgY29uc3QgY2hvc2VuID0gdmlzaWJsZSB8fCB2YWxpZFswXTtcbiAgICBpZiAoY2hvc2VuICYmIHR5cGVvZiB0YXJnZXRTZXEgPT09ICdudW1iZXInKSB7XG4gICAgICBjaG9zZW4uc2V0QXR0cmlidXRlKCdkYXRhLXNlcScsIFN0cmluZyh0YXJnZXRTZXEpKTtcbiAgICAgIGNob3Nlbi5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRTZXEpO1xuICAgIH1cblxuICAgIHJldHVybiBjaG9zZW47XG4gIH1cblxuICBhc3luYyBleHRyYWN0UGFnZVRleHQocGFnZU51bTogbnVtYmVyLCBpbWc/OiBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2xlZXAgPSAobXM6IG51bWJlcikgPT4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuXG4gICAgLy8gMS4gQ2hlY2sgaWYgd2UgYWxyZWFkeSByZWNlaXZlZCB0aGUgT0NSIEhUTUwgZnJvbSB0aGUgbmV0d29yayBpbnRlcmNlcHRpb25cbiAgICBjb25zdCBjYWNoZWRIdG1sID0gdGhpcy5zZXFUb0h0bWwuZ2V0KHBhZ2VOdW0pO1xuICAgIGlmIChjYWNoZWRIdG1sKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQoY2FjaGVkSHRtbCk7XG4gICAgICBpZiAodGV4dCAmJiB0ZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgLy8gMi4gUXVlcnkgRE9NIGZvciB0YXJnZXQgc2VxdWVuY2UncyBmaWdjYXB0aW9uLCByZXRyeWluZyBicmllZmx5ICh1cCB0byAyNTAwbXMpXG4gICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydCA8IDI1MDApIHtcbiAgICAgIC8vIDJhLiBJZiBpbWcgd2FzIHBhc3NlZCwgY2hlY2sgaXRzIGNsb3Nlc3QgZmlndXJlOlxuICAgICAgaWYgKGltZykge1xuICAgICAgICBjb25zdCBmaWd1cmUgPSBpbWcuY2xvc2VzdCgnZmlndXJlJyk7XG4gICAgICAgIGlmIChmaWd1cmUpIHtcbiAgICAgICAgICBjb25zdCBmaWdjYXB0aW9uID0gZmlndXJlLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCdmaWdjYXB0aW9uJyk7XG4gICAgICAgICAgaWYgKGZpZ2NhcHRpb24gJiYgZmlnY2FwdGlvbi50ZXh0Q29udGVudCAmJiBmaWdjYXB0aW9uLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQoZmlnY2FwdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIDJiLiBDaGVjayBleHBsaWNpdGx5IHRhZ2dlZCBmaWdjYXB0aW9uOlxuICAgICAgY29uc3QgdGFnZ2VkRmlnY2FwdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgICBgZmlndXJlW2RhdGEtc2VxPVwiJHtwYWdlTnVtfVwiXSBmaWdjYXB0aW9uLCBmaWdjYXB0aW9uW2RhdGEtc2VxPVwiJHtwYWdlTnVtfVwiXSwgLnNwcmVhZFtkYXRhLXNlcT1cIiR7cGFnZU51bX1cIl0gZmlnY2FwdGlvbmBcbiAgICAgICk7XG4gICAgICBpZiAodGFnZ2VkRmlnY2FwdGlvbiAmJiB0YWdnZWRGaWdjYXB0aW9uLnRleHRDb250ZW50ICYmIHRhZ2dlZEZpZ2NhcHRpb24udGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KHRhZ2dlZEZpZ2NhcHRpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyAyYy4gRmFsbGJhY2s6IGNoZWNrIG1haW4gc3ByZWFkIGRldGFpbHMgZmlnY2FwdGlvbjpcbiAgICAgIGNvbnN0IHNwcmVhZEZpZ2NhcHRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICAgICAgJ21haW4jbWFpbiBkZXRhaWxzIGZpZ3VyZSBmaWdjYXB0aW9uLCBtYWluI21haW4gZmlndXJlIGZpZ2NhcHRpb24sIG1haW4jbWFpbiBmaWdjYXB0aW9uJ1xuICAgICAgKTtcbiAgICAgIGlmIChzcHJlYWRGaWdjYXB0aW9uICYmIHNwcmVhZEZpZ2NhcHRpb24udGV4dENvbnRlbnQgJiYgc3ByZWFkRmlnY2FwdGlvbi50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQoc3ByZWFkRmlnY2FwdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIDJkLiBDaGVjayBpZiBuZXR3b3JrIHJlc3BvbnNlIGFycml2ZWQgd2hpbGUgcG9sbGluZzpcbiAgICAgIGNvbnN0IGxhdGVIdG1sID0gdGhpcy5zZXFUb0h0bWwuZ2V0KHBhZ2VOdW0pO1xuICAgICAgaWYgKGxhdGVIdG1sKSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChsYXRlSHRtbCk7XG4gICAgICAgIGlmICh0ZXh0ICYmIHRleHQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhd2FpdCBzbGVlcCgxMDApO1xuICAgIH1cblxuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIGlzQXRFbmRPZkJvb2soY3VycmVudFBhZ2U6IG51bWJlciwgdG90YWxQYWdlczogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKHRvdGFsUGFnZXMgPiAwICYmIGN1cnJlbnRQYWdlID49IHRvdGFsUGFnZXMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50IHwgSFRNTEFuY2hvckVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblthcmlhLWxhYmVsKj1cIk5leHRcIiBpXSwgYnV0dG9uW3RpdGxlKj1cIk5leHRcIiBpXSwgW2FjY2Vzc2tleT1cIm5cIl0nXG4gICAgKTtcbiAgICBpZiAobmV4dEJ0bikge1xuICAgICAgY29uc3QgZGlzYWJsZWQgPSAobmV4dEJ0biBhcyBhbnkpLmRpc2FibGVkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLWRpc2FibGVkJykgPT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0QnRuLmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZWQnKTtcbiAgICAgIGlmIChkaXNhYmxlZCkgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUb3RhbFBhZ2VzRnJvbURvbSgpOiBudW1iZXIge1xuICAgIC8vIDEuIENoZWNrIHBhcmVudCBjb250YWluZXIgb2YgI3Rvb2xiYXItc2VxOiA8aW5wdXQgaWQ9XCJ0b29sYmFyLXNlcVwiPiAuLi4gPHNwYW4+Lzwvc3Bhbj4gPHNwYW4+MjcyPC9zcGFuPlxuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG4gICAgaWYgKHNlcUlucHV0KSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBzZXFJbnB1dC5wYXJlbnRFbGVtZW50O1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gcGFyZW50LnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICBjb25zdCBtYXRjaCA9IHRleHQubWF0Y2goL1xcL1xccyooXFxkKykvKTtcbiAgICAgICAgaWYgKG1hdGNoKSByZXR1cm4gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcblxuICAgICAgICBjb25zdCBodG1sTWF0Y2ggPSBwYXJlbnQuaW5uZXJIVE1MLm1hdGNoKC9cXC9cXHMqPFxcL3NwYW4+XFxzKjxzcGFuPlxccyooXFxkKykvaSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LmlubmVySFRNTC5tYXRjaCgvXFwvXFxzKihcXGQrKS8pO1xuICAgICAgICBpZiAoaHRtbE1hdGNoKSByZXR1cm4gcGFyc2VJbnQoaHRtbE1hdGNoWzFdLCAxMCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1heEF0dHIgPSBzZXFJbnB1dC5nZXRBdHRyaWJ1dGUoJ21heCcpO1xuICAgICAgaWYgKG1heEF0dHIpIHtcbiAgICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQobWF4QXR0ciwgMTApO1xuICAgICAgICBpZiAoIWlzTmFOKHZhbCkgJiYgdmFsID4gMCkgcmV0dXJuIHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBDaGVjayB3aW5kb3cubWFuaWZlc3QgaWYgcHJlc2VudCBpbiBwYWdlXG4gICAgY29uc3QgdyA9IHdpbmRvdyBhcyBhbnk7XG4gICAgaWYgKHcubWFuaWZlc3QgJiYgdy5tYW5pZmVzdC50b3RhbFNlcSkge1xuICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQody5tYW5pZmVzdC50b3RhbFNlcSwgMTApO1xuICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgLy8gMy4gQ2hlY2sgZ2VuZXJhbCB0ZXh0IGUuZy4gXCJvZiAyNzJcIiBvciBcIi8gMjcyXCJcbiAgICBjb25zdCBwYWdpbmdFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYWdpbmcsIFtjbGFzcyo9XCJwYWdpbmdcIl0sIFthcmlhLWxhYmVsKj1cInRvdGFsIHBhZ2VzXCIgaV0nKTtcbiAgICBpZiAocGFnaW5nRWwgJiYgcGFnaW5nRWwudGV4dENvbnRlbnQpIHtcbiAgICAgIGNvbnN0IG0gPSBwYWdpbmdFbC50ZXh0Q29udGVudC5tYXRjaCgvXFwvXFxzKihcXGQrKS8pIHx8IHBhZ2luZ0VsLnRleHRDb250ZW50Lm1hdGNoKC9vZlxccysoXFxkKykvaSk7XG4gICAgICBpZiAobSkgcmV0dXJuIHBhcnNlSW50KG1bMV0sIDEwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfVxufVxuIiwKICAgICJpbXBvcnQgeyBCb29rUHJvdmlkZXIgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IEFyY2hpdmVQcm92aWRlciB9IGZyb20gJy4vYXJjaGl2ZS1wcm92aWRlcic7XG5pbXBvcnQgeyBIYXRoaVRydXN0UHJvdmlkZXIgfSBmcm9tICcuL2hhdGhpdHJ1c3QtcHJvdmlkZXInO1xuXG5leHBvcnQgKiBmcm9tICcuL3R5cGVzJztcbmV4cG9ydCAqIGZyb20gJy4vYXJjaGl2ZS1wcm92aWRlcic7XG5leHBvcnQgKiBmcm9tICcuL2hhdGhpdHJ1c3QtcHJvdmlkZXInO1xuXG4vKipcbiAqIFJlZ2lzdHJ5IG9mIHN1cHBvcnRlZCBib29rIHNpdGUgcHJvdmlkZXJzLlxuICovXG5jb25zdCBwcm92aWRlcnM6IEJvb2tQcm92aWRlcltdID0gW1xuICBuZXcgQXJjaGl2ZVByb3ZpZGVyKCksXG4gIG5ldyBIYXRoaVRydXN0UHJvdmlkZXIoKSxcbl07XG5cbi8qKlxuICogRGV0ZWN0cyBhbmQgcmV0dXJucyB0aGUgYWN0aXZlIHByb3ZpZGVyIG1hdGNoaW5nIHRoZSBjdXJyZW50IHdlYnBhZ2UuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIGN1cnJlbnQgcGFnZSBpcyBub3QgYSBzdXBwb3J0ZWQgYm9vayB2aWV3ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVQcm92aWRlcigpOiBCb29rUHJvdmlkZXIgfCBudWxsIHtcbiAgZm9yIChjb25zdCBwcm92aWRlciBvZiBwcm92aWRlcnMpIHtcbiAgICBpZiAocHJvdmlkZXIuaXNNYXRjaCgpKSB7XG4gICAgICByZXR1cm4gcHJvdmlkZXI7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwKICAgICIvKipcbiAqIENvbnRlbnQgU2NyaXB0IChJc29sYXRlZCBXb3JsZCkgZm9yIEFyY2hpdmUgRG93bmxvYWRlclxuICogTWFuYWdlcyBhdXRvbWF0aW9uLCBwYWdlIGN5Y2xpbmcsIHZlcmlmaWNhdGlvbiwgY2FudmFzIGNhcHR1cmUsIGFuZCB0ZXh0IGZldGNoaW5nLlxuICovXG5cbmltcG9ydCB7IEJvb2tJbmZvLCBEb3dubG9hZGVyQ29uZmlnLCBQcm9ncmVzc1N0YXRlLCBFeHRlbnNpb25NZXNzYWdlLCBCcmlkZ2VNZXNzYWdlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgRmxvYXRpbmdQaWxsIH0gZnJvbSAnLi9waWxsJztcbmltcG9ydCB7IHBhcnNlRGp2dVhtbFRvVGV4dCwgYnVpbGRCb29rTWFya2Rvd24sIFBhZ2VUZXh0RW50cnkgfSBmcm9tICcuLi91dGlscy9tYXJrZG93bi1idWlsZGVyJztcbmltcG9ydCB7IGNvbXBpbGVKcGVnc1RvUGRmLCBQZGZJbWFnZUlucHV0IH0gZnJvbSAnLi4vdXRpbHMvcGRmLWJ1aWxkZXInO1xuaW1wb3J0IHsgZm9ybWF0U3ViZGlyLCBmb3JtYXRQYWdlRmlsZW5hbWUsIHNhbml0aXplRmlsZW5hbWUgfSBmcm9tICcuLi91dGlscy9zYW5pdGl6ZXInO1xuaW1wb3J0IHsgZ2V0QWN0aXZlUHJvdmlkZXIsIEJvb2tQcm92aWRlciwgQXJjaGl2ZVByb3ZpZGVyLCBIYXRoaVRydXN0UHJvdmlkZXIsIHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZSwgcGFyc2VBcmNoaXZlRG9tUGFnZSB9IGZyb20gJy4uL3Byb3ZpZGVycyc7XG5cbihmdW5jdGlvbiBpbml0Q29udGVudFNjcmlwdCgpIHtcbiAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gSW5pdGlhbGl6ZWQgb24nLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG5cbiAgY29uc3QgcHJvdmlkZXI6IEJvb2tQcm92aWRlciB8IG51bGwgPSBnZXRBY3RpdmVQcm92aWRlcigpO1xuICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gTm8gbWF0Y2hpbmcgYm9vayBwcm92aWRlciBmb3InLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEFjdGl2ZSBwcm92aWRlcjogJHtwcm92aWRlci5zaXRlTmFtZX0gKCR7cHJvdmlkZXIuc2l0ZUlkfSlgKTtcblxuICAvLyBTdGF0ZVxuICBsZXQgYm9va0luZm86IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG4gIGxldCBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgbGV0IGlzUGF1c2VkID0gZmFsc2U7XG4gIGxldCBzdG9wUmVxdWVzdGVkID0gZmFsc2U7XG4gIGxldCBjdXJyZW50UGFnZSA9IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG4gIGxldCBkb3dubG9hZGVkUGFnZXMgPSAwO1xuICBsZXQgZmFpbGVkUGFnZXMgPSAwO1xuICBsZXQgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICBsZXQgbGFzdERpbWVuc2lvbnMgPSB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfTtcbiAgbGV0IGNvbGxlY3RlZEltYWdlczogUGRmSW1hZ2VJbnB1dFtdID0gW107XG4gIGxldCBjb2xsZWN0ZWRUZXh0czogUGFnZVRleHRFbnRyeVtdID0gW107XG4gIGxldCBpc0VuZE9mQm9vayA9IGZhbHNlO1xuICBsZXQgaXNTaXRlVGFpbnRlZCA9IGZhbHNlO1xuXG4gIGludGVyZmFjZSBIdHRwRXJyb3JJbmZvIHtcbiAgICBzdGF0dXNDb2RlOiBudW1iZXI7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgdGltZXN0YW1wOiBudW1iZXI7XG4gICAgcmV0cnlBZnRlcj86IG51bWJlcjtcbiAgfVxuXG4gIGxldCBsYXN0SHR0cEVycm9yOiBIdHRwRXJyb3JJbmZvIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjb25zZWN1dGl2ZUVycm9yQ291bnQgPSAwO1xuXG4gIGZ1bmN0aW9uIG9uSHR0cEVycm9yUmVjZWl2ZWQoc3RhdHVzQ29kZTogbnVtYmVyLCB1cmw6IHN0cmluZywgcmV0cnlBZnRlcj86IG51bWJlcikge1xuICAgIGNvbnN0IGlzQm9va1JlbGF0ZWQgPVxuICAgICAgdXJsLmluY2x1ZGVzKCdpbWdzcnYnKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCdCb29rUmVhZGVyJykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnL2NnaS9wdCcpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2RldGFpbHMnKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCdoYXRoaXRydXN0Lm9yZycpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2FyY2hpdmUub3JnJyk7XG5cbiAgICBpZiAoIWlzQm9va1JlbGF0ZWQpIHJldHVybjtcblxuICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7c3RhdHVzQ29kZX0gZGV0ZWN0ZWQgZm9yICR7dXJsfWApO1xuICAgIGxhc3RIdHRwRXJyb3IgPSB7XG4gICAgICBzdGF0dXNDb2RlLFxuICAgICAgdXJsLFxuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgcmV0cnlBZnRlcixcbiAgICB9O1xuICB9XG5cbiAgLy8gTG9hZCBzYXZlZCBzZXR0aW5ncyBmcm9tIGxvY2FsU3RvcmFnZSBmaXJzdFxuICBjb25zdCBsb2NhbFNhdmVQYXRoID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zYXZlX3BhdGgnKTtcbiAgY29uc3QgbG9jYWxGb2xkZXJQYXR0ZXJuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9mb2xkZXJfcGF0dGVybicpO1xuICBjb25zdCBsb2NhbFN0YXJ0UGFnZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc3RhcnRfcGFnZScpO1xuICBjb25zdCBsb2NhbEVuZFBhZ2UgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2VuZF9wYWdlJyk7XG4gIGNvbnN0IGxvY2FsTWF4SGVpZ2h0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9tYXhfaGVpZ2h0Jyk7XG5cbiAgbGV0IGluaXRpYWxTdGFydFBhZ2UgPSBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlO1xuICBpZiAobG9jYWxTdGFydFBhZ2UgIT09IG51bGwpIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChsb2NhbFN0YXJ0UGFnZSwgMTApO1xuICAgIGlmICghaXNOYU4ocGFyc2VkKSAmJiBwYXJzZWQgPj0gcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZSkge1xuICAgICAgaW5pdGlhbFN0YXJ0UGFnZSA9IHBhcnNlZDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBkZWZhdWx0Q29uZmlnOiBEb3dubG9hZGVyQ29uZmlnID0ge1xuICAgIGJhc2VEaXI6IGxvY2FsU2F2ZVBhdGggfHwgJ0FyY2hpdmVCb29rcycsXG4gICAgZm9sZGVyUGF0dGVybjogbG9jYWxGb2xkZXJQYXR0ZXJuIHx8ICd7dGl0bGV9X3tpZH0nLFxuICAgIHNhdmVJbWFnZXM6IGZhbHNlLFxuICAgIGdlbmVyYXRlUGRmOiB0cnVlLFxuICAgIHNhdmVUZXh0TWQ6IHRydWUsXG4gICAgaW1hZ2VRdWFsaXR5OiAwLjc1LFxuICAgIG1heFBhZ2VIZWlnaHQ6IGxvY2FsTWF4SGVpZ2h0ICE9PSBudWxsID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobG9jYWxNYXhIZWlnaHQsIDEwKSkgOiAwLFxuICAgIHBhZ2VEZWxheU1zOiAyMDAsXG4gICAgcGFnZUNoYW5nZVRpbWVvdXRNczogMTAwMDAsXG4gICAgbWF4UmV0cmllczogMTAsXG4gICAgYXV0b1NpbmdsZVBhZ2U6IHRydWUsXG4gICAgc3RhcnRQYWdlOiBpbml0aWFsU3RhcnRQYWdlLFxuICAgIGVuZFBhZ2U6IGxvY2FsRW5kUGFnZSAhPT0gbnVsbCA/IE1hdGgubWF4KDAsIHBhcnNlSW50KGxvY2FsRW5kUGFnZSwgMTApKSA6IDAsXG4gICAgZGVsZXRlSW1hZ2VzT25Db21wbGV0ZTogdHJ1ZSxcbiAgfTtcblxuICBsZXQgY29uZmlnOiBEb3dubG9hZGVyQ29uZmlnID0geyAuLi5kZWZhdWx0Q29uZmlnIH07XG5cbiAgZnVuY3Rpb24gc2F2ZUNvbmZpZyh1cGRhdGVkOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KSB7XG4gICAgY29uZmlnID0geyAuLi5jb25maWcsIC4uLnVwZGF0ZWQgfTtcbiAgICBpZiAoY29uZmlnLmJhc2VEaXIpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc2F2ZV9wYXRoJywgY29uZmlnLmJhc2VEaXIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmZvbGRlclBhdHRlcm4pIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZm9sZGVyX3BhdHRlcm4nLCBjb25maWcuZm9sZGVyUGF0dGVybik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29uZmlnLnN0YXJ0UGFnZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc3RhcnRfcGFnZScsIFN0cmluZyhjb25maWcuc3RhcnRQYWdlKSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29uZmlnLmVuZFBhZ2UgPT09ICdudW1iZXInKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2VuZF9wYWdlJywgU3RyaW5nKGNvbmZpZy5lbmRQYWdlKSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29uZmlnLm1heFBhZ2VIZWlnaHQgPT09ICdudW1iZXInKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX21heF9oZWlnaHQnLCBTdHJpbmcoY29uZmlnLm1heFBhZ2VIZWlnaHQpKTtcbiAgICB9XG4gICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoeyBkb3dubG9hZGVyQ29uZmlnOiBjb25maWcgfSk7XG4gICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgfVxuXG4gIC8vIExvYWQgdXNlciBjb25maWcgZnJvbSBjaHJvbWUuc3RvcmFnZVxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChbJ2xpYmVyYXRvckNvbmZpZycsICdkb3dubG9hZGVyQ29uZmlnJ10sIChyZXMpID0+IHtcbiAgICBjb25zdCBzYXZlZCA9IHJlcy5kb3dubG9hZGVyQ29uZmlnIHx8IHJlcy5saWJlcmF0b3JDb25maWc7XG4gICAgaWYgKHNhdmVkKSB7XG4gICAgICBjb25zdCBsb2NhbFBhdGggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX3NhdmVfcGF0aCcpO1xuICAgICAgY29uZmlnID0ge1xuICAgICAgICAuLi5kZWZhdWx0Q29uZmlnLFxuICAgICAgICAuLi5zYXZlZCxcbiAgICAgICAgLi4uKGxvY2FsUGF0aCA/IHsgYmFzZURpcjogbG9jYWxQYXRoIH0gOiB7fSksXG4gICAgICB9O1xuICAgICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEZsb2F0aW5nIFBpbGwgVUkgd2l0aCBmdWxsIGNhbGxiYWNrc1xuICBjb25zdCBwaWxsID0gbmV3IEZsb2F0aW5nUGlsbCh7XG4gICAgb25TdGFydDogKCkgPT4gc3RhcnREb3dubG9hZCgpLFxuICAgIG9uUGF1c2U6ICgpID0+IHBhdXNlRG93bmxvYWQoKSxcbiAgICBvblJlc3VtZTogKCkgPT4gcmVzdW1lRG93bmxvYWQoKSxcbiAgICBvblN0b3A6ICgpID0+IGhhbmRsZVN0b3BSZXF1ZXN0KCksXG4gICAgb25TYXZlU2V0dGluZ3M6IChuZXdTZXR0aW5ncykgPT4ge1xuICAgICAgc2F2ZUNvbmZpZyhuZXdTZXR0aW5ncyk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBTZXR0aW5ncyBzYXZlZCB0byBsb2NhbFN0b3JhZ2U6JywgbmV3U2V0dGluZ3MpO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IGlzUnVubmluZyA/IChpc1BhdXNlZCA/ICdwYXVzZWQnIDogJ2Rvd25sb2FkaW5nJykgOiAnaWRsZScsXG4gICAgICAgIHN0YXR1c1RleHQ6ICdTZXR0aW5ncyBzYXZlZCB0byBsb2NhbFN0b3JhZ2UnLFxuICAgICAgfSk7XG4gICAgfSxcbiAgICBvblN3aXRjaE1vZGU6ICgpID0+IGVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpLFxuICAgIG9uVmlld0ZpbGU6ICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIE9wZW5pbmcgZG93bmxvYWRlZCBmaWxlIGluIEZpbmRlci9FeHBsb3Jlci4uLicpO1xuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiAnT1BFTl9ET1dOTE9BRCcgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgaWYgKHBpbGwuc2hvdWxkUmVuZGVyKCkpIHtcbiAgICBwaWxsLnJlbmRlcigpO1xuICAgIHBpbGwuc2V0Q29uZmlnKGNvbmZpZyk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiByZWZyZXNoQm9va0luZm8oKSB7XG4gICAgY29uc3QgZGV0ZWN0ZWQgPSBhd2FpdCBwcm92aWRlci5kZXRlY3RCb29rSW5mbygpO1xuICAgIGlmIChkZXRlY3RlZCkge1xuICAgICAgYm9va0luZm8gPSBkZXRlY3RlZDtcbiAgICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFyY2hpdmVQcm92aWRlcikge1xuICAgICAgICBwcm92aWRlci5zZXRCb29rSW5mbyhib29rSW5mbyk7XG4gICAgICB9XG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBib29rSW5mby5jdXJyZW50TGVhZiA/PyBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlLFxuICAgICAgICBib29rSW5mby50b3RhbFBhZ2VzLFxuICAgICAgICAnUmVhZHknLFxuICAgICAgICAnbm9ybWFsJyxcbiAgICAgICAgaXNQYXVzZWQsXG4gICAgICAgIGlzUnVubmluZyxcbiAgICAgICAgYm9va0luZm8uY3VycmVudE1vZGUgPz8gMSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJyaWRnZSBsaXN0ZW5lciBmb3IgTUFJTiB3b3JsZCBldmVudHMgKEhUVFAgZXJyb3IgaW50ZXJjZXB0aW9uICYgQXJjaGl2ZS5vcmcgQm9va1JlYWRlcilcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cgfHwgIWV2ZW50LmRhdGEgfHwgZXZlbnQuZGF0YS5kaXJlY3Rpb24gIT09ICdGUk9NX0JSSURHRScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhIGFzIEJyaWRnZU1lc3NhZ2U7XG5cbiAgICAvLyBJbnRlcmNlcHQgYW55IG5vbi0yMDAgSFRUUCBzdGF0dXMgKDQyOSwgNTAwLCA0MDEsIGV0Yy4pXG4gICAgaWYgKG1zZy5ldmVudCA9PT0gJ0hUVFBfRVJST1InKSB7XG4gICAgICBvbkh0dHBFcnJvclJlY2VpdmVkKG1zZy5zdGF0dXNDb2RlLCBtc2cudXJsLCBtc2cucmV0cnlBZnRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRm9yd2FyZCBIYXRoaVRydXN0IHBhZ2UgYW5ub3VuY2VtZW50cywgaW1hZ2VzLCBhbmQgT0NSIHRleHQgdG8gcHJvdmlkZXJcbiAgICBpZiAocHJvdmlkZXIgaW5zdGFuY2VvZiBIYXRoaVRydXN0UHJvdmlkZXIpIHtcbiAgICAgIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0xPQURfQU5OT1VOQ0VEJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VMb2FkQW5ub3VuY2VkKG1zZy5zZXEsIG1zZy5pc1Zpc2libGUsIG1zZy5pc0xvYWRlZCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9JTUFHRV9SRUFEWScpIHtcbiAgICAgICAgcHJvdmlkZXIub25QYWdlSW1hZ2VSZWFkeShtc2cuc2VxLCBtc2cuYmxvYlVybCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9URVhUX1JFQURZJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VUZXh0UmVhZHkobXNnLnNlcSwgbXNnLmh0bWwpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRm9yd2FyZCBBcmNoaXZlLm9yZyBPQ1IgdGV4dCB0byBBcmNoaXZlUHJvdmlkZXJcbiAgICBpZiAocHJvdmlkZXIgaW5zdGFuY2VvZiBBcmNoaXZlUHJvdmlkZXIpIHtcbiAgICAgIGlmIChtc2cuZXZlbnQgPT09ICdBUkNISVZFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uQXJjaGl2ZVRleHRSZWFkeShtc2cucGFnZSwgbXNnLnhtbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXNnLmV2ZW50ID09PSAnQk9PS19JTkZPJykge1xuICAgICAgYm9va0luZm8gPSBtc2cuZGF0YTtcbiAgICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFyY2hpdmVQcm92aWRlcikge1xuICAgICAgICBwcm92aWRlci5zZXRCb29rSW5mbyhib29rSW5mbyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvbUN1cnJlbnQgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgaWYgKGRvbUN1cnJlbnQgIT09IG51bGwgJiYgKCFib29rSW5mby50b3RhbFBhZ2VzIHx8IGRvbUN1cnJlbnQgPiAoYm9va0luZm8uY3VycmVudExlYWYgPz8gMCkpKSB7XG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID0gZG9tQ3VycmVudDtcbiAgICAgIH1cblxuICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgYm9va0luZm8uY3VycmVudExlYWYgPz8gMCxcbiAgICAgICAgYm9va0luZm8udG90YWxQYWdlcyxcbiAgICAgICAgJ1JlYWR5JyxcbiAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgIGlzUGF1c2VkLFxuICAgICAgICBpc1J1bm5pbmcsXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRNb2RlLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdNT0RFX0NIQU5HRUQnKSB7XG4gICAgICBpZiAoYm9va0luZm8pIHtcbiAgICAgICAgYm9va0luZm8uY3VycmVudE1vZGUgPSBtc2cubW9kZTtcbiAgICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgICBib29rSW5mby50b3RhbFBhZ2VzLFxuICAgICAgICAgICcxLVBhZ2UgTW9kZSBBY3RpdmUnLFxuICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgIGlzUGF1c2VkLFxuICAgICAgICAgIGlzUnVubmluZyxcbiAgICAgICAgICBtc2cubW9kZSxcbiAgICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSW5pdGlhbCBkZXRlY3Rpb25cbiAgcmVmcmVzaEJvb2tJbmZvKCk7XG4gIHNldFRpbWVvdXQoKCkgPT4gcmVmcmVzaEJvb2tJbmZvKCksIDgwMCk7XG5cbiAgLy8gTmV0d29yayBjb25uZWN0aW9uIGxpc3RlbmVyc1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLndhcm4oJ1tBcmNoaXZlRG93bmxvYWRlcl0gTmV0d29yayBjb25uZWN0aW9uIGxvc3QgKG9mZmxpbmUpJyk7XG4gICAgaWYgKGlzUnVubmluZyAmJiAhaXNQYXVzZWQpIHtcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwLFxuICAgICAgICAnT2ZmbGluZSAtIFBhdXNlZCcsXG4gICAgICAgICdvZmZsaW5lJyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgICApO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdvZmZsaW5lJywgaXNPZmZsaW5lOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBOZXR3b3JrIGNvbm5lY3Rpb24gcmVzdG9yZWQgKG9ubGluZSknKTtcbiAgICBpZiAoaXNSdW5uaW5nICYmIGlzUGF1c2VkKSB7XG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMCxcbiAgICAgICAgJ09ubGluZSAtIENsaWNrIENPTlRJTlVFJyxcbiAgICAgICAgJ3N0YWxsZWQnLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlLFxuICAgICAgICBib29rSW5mbz8uY3VycmVudE1vZGUgfHwgMSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3N0YWxsZWQnLCBpc09mZmxpbmU6IGZhbHNlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGVscGVyc1xuICBjb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcblxuICBmdW5jdGlvbiBicm9hZGNhc3RTdGF0ZShleHRyYTogUGFydGlhbDxQcm9ncmVzc1N0YXRlPiA9IHt9KSB7XG4gICAgY29uc3QgdG90YWwgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjb25maWcuZW5kUGFnZSB8fCAxO1xuICAgIGxldCBzdGF0dXNUeXBlOiAnbm9ybWFsJyB8ICdyZXRyeWluZycgfCAnb2ZmbGluZScgfCAnc3RhbGxlZCcgfCAnY29tcGxldGUnID0gJ25vcm1hbCc7XG5cbiAgICBpZiAoZXh0cmEuc3RhdHVzID09PSAnc3RhbGxlZCcpIHN0YXR1c1R5cGUgPSAnc3RhbGxlZCc7XG4gICAgZWxzZSBpZiAoZXh0cmEuc3RhdHVzID09PSAncmV0cnlpbmcnKSBzdGF0dXNUeXBlID0gJ3JldHJ5aW5nJztcbiAgICBlbHNlIGlmICghbmF2aWdhdG9yLm9uTGluZSkgc3RhdHVzVHlwZSA9ICdvZmZsaW5lJztcbiAgICBlbHNlIGlmIChleHRyYS5zdGF0dXMgPT09ICdjb21wbGV0ZScpIHN0YXR1c1R5cGUgPSAnY29tcGxldGUnO1xuXG4gICAgY29uc3Qgc3RhdGU6IFByb2dyZXNzU3RhdGUgPSB7XG4gICAgICBzdGF0dXM6IGlzUnVubmluZyA/IChpc1BhdXNlZCA/IChzdGF0dXNUeXBlID09PSAnc3RhbGxlZCcgPyAnc3RhbGxlZCcgOiAncGF1c2VkJykgOiAnZG93bmxvYWRpbmcnKSA6IChleHRyYS5zdGF0dXMgfHwgJ2lkbGUnKSxcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWxQYWdlczogdG90YWwsXG4gICAgICBkb3dubG9hZGVkUGFnZXMsXG4gICAgICBmYWlsZWRQYWdlcyxcbiAgICAgIHJldHJ5Q291bnQ6IGN1cnJlbnRSZXRyeUNvdW50LFxuICAgICAgc3RhdHVzVGV4dDogaXNQYXVzZWQgPyAoc3RhdHVzVHlwZSA9PT0gJ3N0YWxsZWQnID8gJ1N0YWxsZWQgLSBDbGljayBDT05USU5VRScgOiAnUGF1c2VkJykgOiAoaXNSdW5uaW5nID8gYENhcHR1cmluZyBwYWdlICR7Y3VycmVudFBhZ2V9YCA6ICdSZWFkeScpLFxuICAgICAgYm9va0luZm86IGJvb2tJbmZvIHx8IHVuZGVmaW5lZCxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNPZmZsaW5lOiAhbmF2aWdhdG9yLm9uTGluZSxcbiAgICAgIGltYWdlRGltZW5zaW9uczogbGFzdERpbWVuc2lvbnMsXG4gICAgICAuLi5leHRyYSxcbiAgICB9O1xuXG4gICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWwsXG4gICAgICBzdGF0ZS5zdGF0dXNUZXh0LFxuICAgICAgc3RhdHVzVHlwZSxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNSdW5uaW5nLFxuICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICBsYXN0RGltZW5zaW9uc1xuICAgICk7XG5cbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdTVEFURV9VUERBVEUnLCBzdGF0ZSB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRW5mb3JjZXMgMS1wYWdlIHZpZXcgbW9kZSB2aWEgcHJvdmlkZXIgaWYgc3VwcG9ydGVkLlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChwcm92aWRlci5lbmZvcmNlU2luZ2xlUGFnZU1vZGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uICR7cHJvdmlkZXIuc2l0ZU5hbWV9Li4uYCk7XG4gICAgICByZXR1cm4gYXdhaXQgcHJvdmlkZXIuZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhcHR1cmVzIGltYWdlIGZyb20gRE9NIGVsZW1lbnQgdG8gSlBFRyBEYXRhIFVSTCB1c2luZyBhbiBvZmZzY3JlZW4gY2FudmFzLlxuICAgKiBQcm9wb3J0aWFuYWxseSBkb3duc2NhbGVzIGlmIG1heFBhZ2VIZWlnaHQgPiAwIGFuZCBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0LlxuICAgKiBJZiBjYW52YXMgaXMgdGFpbnRlZCBieSBjcm9zcy1vcmlnaW4gcmVzb3VyY2VzLCBmbGFncyBpc1NpdGVUYWludGVkIGFuZCBjbGVhbmx5IHJlY292ZXJzIHZpYSBiYWNrZ3JvdW5kIHByb3h5LlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gY2FwdHVyZUltYWdlVG9EYXRhVXJsKGltZzogSFRNTEltYWdlRWxlbWVudCwgcXVhbGl0eSA9IDAuNzUsIG1heFBhZ2VIZWlnaHQgPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBGYXN0IHBhdGg6IGlmIHNpdGUgaXMgYWxyZWFkeSBrbm93biB0byB1c2UgY3Jvc3Mtb3JpZ2luL3RhaW50ZWQgaW1hZ2VzLCBieXBhc3MgY2FudmFzIGVudGlyZWx5IVxuICAgIGlmIChpc1NpdGVUYWludGVkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgZmV0Y2hDbGVhbkRhdGFVcmwoaW1nLnNyYywgcXVhbGl0eSwgbWF4UGFnZUhlaWdodCk7XG4gICAgfVxuXG4gICAgLy8gUHJvYWN0aXZlbHkgZGV0ZWN0IEFyY2hpdmUub3JnIGNyb3NzLW9yaWdpbiBzdG9yYWdlIG5vZGVzIChpYSoudXMuYXJjaGl2ZS5vcmcgIT0gYXJjaGl2ZS5vcmcpXG4gICAgaWYgKGltZy5zcmMgJiYgaW1nLnNyYy5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKSAmJiAhaW1nLnNyYy5zdGFydHNXaXRoKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pKSB7XG4gICAgICBpc1NpdGVUYWludGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICB9XG5cbiAgICBsZXQgd2lkdGggPSBpbWcubmF0dXJhbFdpZHRoIHx8IGltZy53aWR0aCB8fCAwO1xuICAgIGxldCBoZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodCB8fCBpbWcuaGVpZ2h0IHx8IDA7XG5cbiAgICBpZiAobWF4UGFnZUhlaWdodCA+IDAgJiYgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgY29uc3Qgc2NhbGUgPSBtYXhQYWdlSGVpZ2h0IC8gaGVpZ2h0O1xuICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgIGlmICghY3R4KSB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBvYnRhaW4gY2FudmFzIDJEIGNvbnRleHQnKTtcblxuICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCBxdWFsaXR5KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgLy8gVGFpbnRlZCBjYW52YXMgcmVjb3ZlcnkgKGNyb3NzLW9yaWdpbiBDRE4gb3IgcHJvdGVjdGVkIHBhZ2VzKVxuICAgICAgaWYgKGVyci5uYW1lID09PSAnU2VjdXJpdHlFcnJvcicgfHwgU3RyaW5nKGVycikuaW5jbHVkZXMoJ1RhaW50ZWQnKSB8fCBTdHJpbmcoZXJyKS5pbmNsdWRlcygnU2VjdXJpdHlFcnJvcicpKSB7XG4gICAgICAgIGlmICghaXNTaXRlVGFpbnRlZCkge1xuICAgICAgICAgIGlzU2l0ZVRhaW50ZWQgPSB0cnVlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIENyb3NzLW9yaWdpbiBzY2FuIGRldGVjdGVkLiBFbmFibGluZyBmYXN0IGJhY2tncm91bmQgZmV0Y2ggZm9yIGFsbCBzdWJzZXF1ZW50IHBhZ2VzLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBibG9iVG9EYXRhVXJsKGJsb2I6IEJsb2IpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHJlc29sdmUocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNjYWxlRGF0YVVybChkYXRhVXJsOiBzdHJpbmcsIHF1YWxpdHkgPSAwLjc1LCBtYXhQYWdlSGVpZ2h0ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKG1heFBhZ2VIZWlnaHQgPD0gMCkgcmV0dXJuIGRhdGFVcmw7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIGxldCB3aWR0aCA9IGltZy5uYXR1cmFsV2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodDtcbiAgICAgICAgaWYgKGhlaWdodCA+IG1heFBhZ2VIZWlnaHQpIHtcbiAgICAgICAgICBjb25zdCBzY2FsZSA9IG1heFBhZ2VIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgICAgIGhlaWdodCA9IG1heFBhZ2VIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgaWYgKCFjdHgpIHJldHVybiByZXNvbHZlKGRhdGFVcmwpO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIHJlc29sdmUoY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIHF1YWxpdHkpKTtcbiAgICAgIH07XG4gICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlc29sdmUoZGF0YVVybCk7XG4gICAgICBpbWcuc3JjID0gZGF0YVVybDtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGZldGNoQ2xlYW5EYXRhVXJsKHVybDogc3RyaW5nLCBxdWFsaXR5ID0gMC43NSwgbWF4UGFnZUhlaWdodCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBibG9iOiBCbG9iIHwgbnVsbCA9IG51bGw7XG5cbiAgICAvLyAxLiBJZiBzaXRlIGlzIE5PVCBtYXJrZWQgdGFpbnRlZCwgdHJ5IGxvY2FsIGZldGNoIGZpcnN0IChmYXN0IGZvciBibG9iOiBhbmQgQ09SUy1lbmFibGVkIGVuZHBvaW50cylcbiAgICBpZiAoIWlzU2l0ZVRhaW50ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgeyBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH0pO1xuICAgICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgICAgYmxvYiA9IGF3YWl0IHJlcy5ibG9iKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgLy8gMi4gQmFja2dyb3VuZCBzZXJ2aWNlIHdvcmtlciBmZXRjaCAoaW1tdW5lIHRvIENPUlMgcmVzdHJpY3Rpb25zIHdpdGggaG9zdF9wZXJtaXNzaW9ucylcbiAgICBpZiAoIWJsb2IpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJnUmVzOiBhbnkgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICAgICAgeyB0eXBlOiAnRkVUQ0hfSU1BR0VfREFUQV9VUkwnLCB1cmwgfSxcbiAgICAgICAgICAgIChyZXNwb25zZSkgPT4gcmVzb2x2ZShyZXNwb25zZSB8fCB7IHN1Y2Nlc3M6IGZhbHNlIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChiZ1JlcyAmJiBiZ1Jlcy5zdWNjZXNzICYmIGJnUmVzLmRhdGFVcmwpIHtcbiAgICAgICAgICBpZiAobWF4UGFnZUhlaWdodCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYmdSZXMuZGF0YVVybDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHNjYWxlRGF0YVVybChiZ1Jlcy5kYXRhVXJsLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBpZiAoYmxvYikge1xuICAgICAgaWYgKG1heFBhZ2VIZWlnaHQgPD0gMCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgYmxvYlRvRGF0YVVybChibG9iKTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJpdG1hcCA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGJsb2IpO1xuICAgICAgICBsZXQgd2lkdGggPSBiaXRtYXAud2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBiaXRtYXAuaGVpZ2h0O1xuICAgICAgICBpZiAobWF4UGFnZUhlaWdodCA+IDAgJiYgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgICAgIGNvbnN0IHNjYWxlID0gbWF4UGFnZUhlaWdodCAvIGhlaWdodDtcbiAgICAgICAgICB3aWR0aCA9IE1hdGgucm91bmQod2lkdGggKiBzY2FsZSk7XG4gICAgICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBpZiAoY3R4KSB7XG4gICAgICAgICAgY3R4LmRyYXdJbWFnZShiaXRtYXAsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgcXVhbGl0eSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICByZXR1cm4gYXdhaXQgYmxvYlRvRGF0YVVybChibG9iKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBleHBvcnQgaW1hZ2UgZnJvbSAke3VybH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG5vbi0yMDAgSFRUUCByZXNwb25zZXMgKDQyOSwgNTAwLCA1MDIsIDUwMywgNDAxLCA0MDMsIGV0Yy4pXG4gICAqIC0gNDAxLzQwMzogUGF1c2VzIGRvd25sb2FkIHRvIGxldCB1c2VyIGF1dGhlbnRpY2F0ZSBvciByZW5ldyBsb2FuXG4gICAqIC0gNDI5ICYgNXh4OiBJbml0aWF0ZXMgZXhwb25lbnRpYWwgYmFja29mZiB3aXRoIGxpdmUgY291bnRkb3duIGFuZCBpbmNyZWFzZXMgcGFjaW5nXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVycjogSHR0cEVycm9ySW5mbywgdGFyZ2V0UGFnZU51bTogbnVtYmVyKSB7XG4gICAgY29uc2VjdXRpdmVFcnJvckNvdW50Kys7XG5cbiAgICAvLyA0MDEgLyA0MDM6IEF1dGgvRm9yYmlkZGVuXG4gICAgaWYgKGVyci5zdGF0dXNDb2RlID09PSA0MDEgfHwgZXJyLnN0YXR1c0NvZGUgPT09IDQwMykge1xuICAgICAgY29uc29sZS5lcnJvcihgW0FyY2hpdmVEb3dubG9hZGVyXSBBY2Nlc3MgcmVzdHJpY3RlZCAoSFRUUCAke2Vyci5zdGF0dXNDb2RlfSkgb24gJHtlcnIudXJsfS4gUGF1c2luZy5gKTtcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICAgICAgc3RhdHVzVGV4dDogYEFjY2VzcyByZXN0cmljdGVkIChIVFRQICR7ZXJyLnN0YXR1c0NvZGV9KS4gUGxlYXNlIGNoZWNrIGxvZ2luIG9yIGxvYW4gc3RhdHVzLmAsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSYXRlIExpbWl0aW5nICg0MjkpICYgU2VydmVyIEVycm9ycyAoNTAwLCA1MDIsIDUwMywgNTA0KVxuICAgIC8vIElmIHRoZSBzZXJ2ZXIgZXhwbGljaXRseSBzcGVjaWZpZXMgUmV0cnktQWZ0ZXIsIGhvbm9yIGl0LlxuICAgIC8vIE90aGVyd2lzZSBmYWxsYmFjayB0byBleHBvbmVudGlhbCBiYWNrb2ZmOiAxMHMsIDIwcywgNDBzLCBjYXBwZWQgYXQgNjBzLlxuICAgIGNvbnN0IGlzU2VydmVyUmVxdWVzdGVkID0gdHlwZW9mIGVyci5yZXRyeUFmdGVyID09PSAnbnVtYmVyJyAmJiAhaXNOYU4oZXJyLnJldHJ5QWZ0ZXIpICYmIGVyci5yZXRyeUFmdGVyID4gMDtcbiAgICBjb25zdCBiYXNlU2Vjb25kcyA9IGlzU2VydmVyUmVxdWVzdGVkXG4gICAgICA/IGVyci5yZXRyeUFmdGVyXG4gICAgICA6IE1hdGgubWluKDEwICogTWF0aC5wb3coMiwgTWF0aC5tYXgoMCwgY29uc2VjdXRpdmVFcnJvckNvdW50IC0gMSkpLCA2MCk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGluY3JlYXNlIGludGVyLXBhZ2UgcGFjaW5nIGRlbGF5IHRvIHByZXZlbnQgcmVjdXJyaW5nIGVycm9yc1xuICAgIGNvbnN0IHByZXZEZWxheSA9IGNvbmZpZy5wYWdlRGVsYXlNcztcbiAgICBjb25maWcucGFnZURlbGF5TXMgPSBNYXRoLm1pbihNYXRoLm1heChjb25maWcucGFnZURlbGF5TXMsIDE1MDApICsgNTAwLCA1MDAwKTtcbiAgICBpZiAoY29uZmlnLnBhZ2VEZWxheU1zICE9PSBwcmV2RGVsYXkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEluY3JlYXNlZCBwYWdlIHBhY2luZyBkZWxheSB0byAke2NvbmZpZy5wYWdlRGVsYXlNc31tcy5gKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBlcnIuc3RhdHVzQ29kZSA9PT0gNDI5XG4gICAgICA/ICdSYXRlIExpbWl0ZWQnXG4gICAgICA6IChlcnIuc3RhdHVzQ29kZSA+PSA1MDAgPyBgU2VydmVyIEVycm9yICgke2Vyci5zdGF0dXNDb2RlfSlgIDogYEhUVFAgJHtlcnIuc3RhdHVzQ29kZX1gKTtcblxuICAgIGlmIChpc1NlcnZlclJlcXVlc3RlZCkge1xuICAgICAgbGFiZWwgKz0gJyAoc2VydmVyIGFza2VkKSc7XG4gICAgfVxuXG4gICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdICR7bGFiZWx9IG9uICR7ZXJyLnVybH0uIEJhY2tpbmcgb2ZmIGZvciAke01hdGgucm91bmQoYmFzZVNlY29uZHMpfXMuLi5gKTtcblxuICAgIGZvciAobGV0IHJlbWFpbmluZyA9IE1hdGgucm91bmQoYmFzZVNlY29uZHMpOyByZW1haW5pbmcgPiAwOyByZW1haW5pbmctLSkge1xuICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIHJldHVybjtcbiAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuO1xuICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgfVxuXG4gICAgICAvLyBEaXNwbGF5IGluIG1pbnV0ZXMgaWYgbW9yZSB0aGFuIDEyMHMsIG90aGVyd2lzZSBpbiBzZWNvbmRzXG4gICAgICBjb25zdCB0aW1lU3RyID0gcmVtYWluaW5nID4gMTIwXG4gICAgICAgID8gYCR7TWF0aC5yb3VuZChyZW1haW5pbmcgLyA2MCl9bWBcbiAgICAgICAgOiBgJHtyZW1haW5pbmd9c2A7XG5cbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncmV0cnlpbmcnLFxuICAgICAgICByZXRyeUNvdW50OiBjb25zZWN1dGl2ZUVycm9yQ291bnQsXG4gICAgICAgIHN0YXR1c1RleHQ6IGAke3RpbWVTdHJ9IFJldHJ5aW5nOiAke2xhYmVsfS5gLFxuICAgICAgfSk7XG4gICAgICBhd2FpdCBzbGVlcCgxMDAwKTtcbiAgICB9XG5cbiAgICAvLyBCYWNrb2ZmIGNvbXBsZXRlISBSZS1uYXZpZ2F0ZSB0byB0YXJnZXRQYWdlTnVtIHNvIHJlYWRlciByZS1mZXRjaGVzIGNsZWFubHlcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBCYWNrb2ZmIGNvbXBsZXRlZC4gUmUtcmVxdWVzdGluZyBwYWdlICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgYXdhaXQgc2xlZXAoODAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGYXN0IFBhZ2UgVHVybiAmIFdhaXQgRW5naW5lOlxuICAgKiAxLiBUcmlnZ2VycyBwYWdlIGZsaXAgdmlhIHByb3ZpZGVyLlxuICAgKiAyLiBQb2xscyBhdCBoaWdoIGZyZXF1ZW5jeSAoMTAwbXMpIGFuZCByZXR1cm5zIHRoZSBuZXcgaW1hZ2UgaW1tZWRpYXRlbHkgb25jZSB2aXNpYmxlLlxuICAgKiAzLiBSZWplY3RzIHBhZ2UgbG9hZCBpZiBhbnkgbm9uLTIwMCBIVFRQIHJlc3BvbnNlICg0MjksIDUwMCwgNDAxLCBldGMuKSB3YXMgcmVjZWl2ZWQuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiB0dXJuQW5kR2V0TmV4dEltYWdlKFxuICAgIGxhc3RTcmM6IHN0cmluZyxcbiAgICB0YXJnZXRQYWdlTnVtOiBudW1iZXJcbiAgKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbD4ge1xuICAgIGxldCByZXRyeUF0dGVtcHQgPSAwO1xuICAgIGlzRW5kT2ZCb29rID0gZmFsc2U7XG5cbiAgICB3aGlsZSAocmV0cnlBdHRlbXB0IDw9IGNvbmZpZy5tYXhSZXRyaWVzKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG5cbiAgICAgIC8vIEhhbmRsZSBwYXVzZSAvIG9mZmxpbmVcbiAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG4gICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIDEuIENoZWNrIGlmIHJlYWRlciBpcyBhbHJlYWR5IGF0IGVuZCBvZiBib29rXG4gICAgICBjb25zdCB0b3RhbFBhZ2VzID0gYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMDtcbiAgICAgIGlmIChwcm92aWRlci5pc0F0RW5kT2ZCb29rICYmIHByb3ZpZGVyLmlzQXRFbmRPZkJvb2sodGFyZ2V0UGFnZU51bSwgdG90YWxQYWdlcykpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRW5kIG9mIGJvb2sgcmVhY2hlZCBhdCBwYWdlICR7dGFyZ2V0UGFnZU51bX0uYCk7XG4gICAgICAgIGlzRW5kT2ZCb29rID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvbVBhZ2VCZWZvcmUgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgaWYgKHRvdGFsUGFnZXMgPiAwICYmIGRvbVBhZ2VCZWZvcmUgIT09IG51bGwgJiYgZG9tUGFnZUJlZm9yZSA+PSB0b3RhbFBhZ2VzICYmIHRhcmdldFBhZ2VOdW0gPiB0b3RhbFBhZ2VzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVuZCBvZiBib29rIHJlYWNoZWQgYXQgcGFnZSAke2RvbVBhZ2VCZWZvcmV9LmApO1xuICAgICAgICBpc0VuZE9mQm9vayA9IHRydWU7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyAyLiBUcmlnZ2VyIHBhZ2UgZmxpcCBvciBjaGVjayBpZiBhbHJlYWR5IHR1cm5lZFxuICAgICAgY29uc3QgYWxyZWFkeVR1cm5lZCA9IGRvbVBhZ2VCZWZvcmUgIT09IG51bGwgJiYgZG9tUGFnZUJlZm9yZSA+PSB0YXJnZXRQYWdlTnVtO1xuXG4gICAgICBpZiAocmV0cnlBdHRlbXB0ID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBSZXRyeSAke3JldHJ5QXR0ZW1wdH06IHJlLXRyaWdnZXJpbmcgZmxpcCB0byBwYWdlICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICBpZiAocmV0cnlBdHRlbXB0ID49IDIgJiYgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2UpIHtcbiAgICAgICAgICAvLyBEaXJlY3QgbmF2aWdhdGlvbiBmYWxsYmFjayBvbiByZXBlYXRlZCBzdGFsbFxuICAgICAgICAgIGF3YWl0IHByb3ZpZGVyLm5hdmlnYXRlVG9QYWdlKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFhbHJlYWR5VHVybmVkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZsaXBwaW5nIHRvIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfSAoYXR0ZW1wdCAxLyR7Y29uZmlnLm1heFJldHJpZXMgKyAxfSkuLi5gKTtcbiAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRE9NIGluZGljYXRlcyBwYWdlIGlzIGFscmVhZHkgb24gc2VxdWVuY2UvbGVhZiAke2RvbVBhZ2VCZWZvcmV9LiBXYWl0aW5nIGZvciBpbWFnZS5gKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gRmFzdCBwb2xsIHdpdGggSFRUUCBlcnJvciByZWplY3Rpb25cbiAgICAgIGNvbnN0IGNoZWNrU3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgdGltZW91dE1zID0gNTAwMDsgLy8gNSBzZWNvbmRzIG1heCBwZXIgZmxpcCBhdHRlbXB0XG4gICAgICBsZXQgbnVkZ2VkID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gY2hlY2tTdGFydCA8IHRpbWVvdXRNcykge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG4gICAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ1JJVElDQUw6IFJlamVjdCBwYWdlIGxvYWQgaWYgYW4gSFRUUCBlcnJvciAoNDI5LCA1MDAsIDQwMSwgZXRjLikgb2NjdXJyZWQhXG4gICAgICAgIGlmIChsYXN0SHR0cEVycm9yICYmIChEYXRlLm5vdygpIC0gbGFzdEh0dHBFcnJvci50aW1lc3RhbXAgPCAxMDAwMCkpIHtcbiAgICAgICAgICBjb25zdCBlcnIgPSBsYXN0SHR0cEVycm9yO1xuICAgICAgICAgIGxhc3RIdHRwRXJyb3IgPSBudWxsOyAvLyBjb25zdW1lIGVycm9yXG4gICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHt0YXJnZXRQYWdlTnVtfSBsb2FkIHJlamVjdGVkIGR1ZSB0byBIVFRQICR7ZXJyLnN0YXR1c0NvZGV9IG9uICR7ZXJyLnVybH1gKTtcblxuICAgICAgICAgIC8vIEluaXRpYXRlIGJhY2tvZmZcbiAgICAgICAgICBhd2FpdCBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVyciwgdGFyZ2V0UGFnZU51bSk7XG5cbiAgICAgICAgICAvLyBSZXN0YXJ0IHBvbGxpbmcgYWZ0ZXIgYmFja29mZlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2FpdGluZyBtb3JlIHRoYW4gMTAwMG1zIHdpdGhvdXQgdGhlIGltYWdlIGFwcGVhcmluZywgc2VuZCBhIG51ZGdlIGZsaXAgYW5kIGRpcmVjdCBqdW1wXG4gICAgICAgIGlmICghbnVkZ2VkICYmIERhdGUubm93KCkgLSBjaGVja1N0YXJ0ID4gMTAwMCkge1xuICAgICAgICAgIG51ZGdlZCA9IHRydWU7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gSW1hZ2Ugbm90IHlldCBjb25maXJtZWQgYWZ0ZXIgMS4wcy4gTnVkZ2luZyBmbGlwL2p1bXAgdG8gcGFnZSAke3RhcmdldFBhZ2VOdW19Li4uYCk7XG4gICAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgIGlmIChwcm92aWRlci5uYXZpZ2F0ZVRvUGFnZSkge1xuICAgICAgICAgICAgYXdhaXQgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2UodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgc2xlZXAoNTApO1xuXG4gICAgICAgIGNvbnN0IGFjdGl2ZUltZyA9IHByb3ZpZGVyLmdldEFjdGl2ZVBhZ2VJbWFnZSgzMDAsIHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICBpZiAoYWN0aXZlSW1nICYmIGFjdGl2ZUltZy5jb21wbGV0ZSAmJiBhY3RpdmVJbWcubmF0dXJhbFdpZHRoID49IDMwMCAmJiBhY3RpdmVJbWcuc3JjKSB7XG4gICAgICAgICAgLy8gRG91YmxlIGNoZWNrIG5vIHBlbmRpbmcgSFRUUCBlcnJvciBiZWZvcmUgYWNjZXB0aW5nIGltYWdlXG4gICAgICAgICAgaWYgKGxhc3RIdHRwRXJyb3IgJiYgKERhdGUubm93KCkgLSBsYXN0SHR0cEVycm9yLnRpbWVzdGFtcCA8IDMwMDApKSB7XG4gICAgICAgICAgICBjb250aW51ZTsgLy8gRG8gbm90IGFjY2VwdCBpbWFnZSB3aGVuIGVycm9yIGlzIHBlbmRpbmchXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaXNOZXdTcmMgPSAhbGFzdFNyYyB8fCBhY3RpdmVJbWcuc3JjICE9PSBsYXN0U3JjO1xuXG4gICAgICAgICAgLy8gMS4gQ29udGFpbmVyL2RhdGFzZXQgZXhwbGljaXRseSBtYXRjaGVzIHRhcmdldFBhZ2VOdW0gQU5EIGltYWdlIHNyYyBoYXMgY2hhbmdlZFxuICAgICAgICAgIGNvbnN0IGlzVGFyZ2V0U2VxID0gYWN0aXZlSW1nLmRhdGFzZXQuc2VxID09PSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgICAgaWYgKGlzTmV3U3JjICYmIGlzVGFyZ2V0U2VxKSB7XG4gICAgICAgICAgICBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gICAgICAgICAgICBjb25zZWN1dGl2ZUVycm9yQ291bnQgPSAwO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3RhcmdldFBhZ2VOdW19IHZpc2libGUgKCR7YWN0aXZlSW1nLm5hdHVyYWxXaWR0aH14JHthY3RpdmVJbWcubmF0dXJhbEhlaWdodH1weCkhYCk7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlSW1nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDIuIERPTSBzdGF0dXMgaW5kaWNhdG9yIChlLmcuIFBhZ2Ug4oCUICg1Ny8zODQpKSBjb25maXJtcyB0YXJnZXRQYWdlTnVtIEFORCBpbWFnZSBzcmMgY2hhbmdlZFxuICAgICAgICAgIGNvbnN0IGRvbU5vdyA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICAgICAgaWYgKGRvbU5vdyAhPT0gbnVsbCAmJiBkb21Ob3cgPj0gdGFyZ2V0UGFnZU51bSAmJiBpc05ld1NyYykge1xuICAgICAgICAgICAgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICAgICAgICAgICAgY29uc2VjdXRpdmVFcnJvckNvdW50ID0gMDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHt0YXJnZXRQYWdlTnVtfSB2aXNpYmxlIFtET00gc3RhdHVzICR7ZG9tTm93fV0gKCR7YWN0aXZlSW1nLm5hdHVyYWxXaWR0aH14JHthY3RpdmVJbWcubmF0dXJhbEhlaWdodH1weCkhYCk7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlSW1nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDMuIEltYWdlIFVSTCBjb250YWlucyB0YXJnZXRQYWdlTnVtIG9yIHN0YW5kYXJkICsxIG9mZnNldCAoZS5nLiBfMDAxOC50aWYgZm9yIGxlYWYgMTcpXG4gICAgICAgICAgY29uc3QgcGFyc2VkVXJsUGFnZSA9IHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZShhY3RpdmVJbWcuc3JjKTtcbiAgICAgICAgICBpZiAoaXNOZXdTcmMgJiYgcGFyc2VkVXJsUGFnZSAhPT0gbnVsbCAmJiAocGFyc2VkVXJsUGFnZSA9PT0gdGFyZ2V0UGFnZU51bSB8fCBwYXJzZWRVcmxQYWdlID09PSB0YXJnZXRQYWdlTnVtICsgMSkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRSZXRyeUNvdW50ID0gMDtcbiAgICAgICAgICAgIGNvbnNlY3V0aXZlRXJyb3JDb3VudCA9IDA7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBQYWdlICR7dGFyZ2V0UGFnZU51bX0gdmVyaWZpZWQgZnJvbSBVUkwgKCR7YWN0aXZlSW1nLm5hdHVyYWxXaWR0aH14JHthY3RpdmVJbWcubmF0dXJhbEhlaWdodH1weCwgbGVhZiAke3BhcnNlZFVybFBhZ2V9KSFgKTtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVJbWc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRpbWVkIG91dCBvciBiYWNrZWQgb2ZmIHdpdGhvdXQgcGFnZSBjaGFuZ2luZzpcbiAgICAgIHJldHJ5QXR0ZW1wdCsrO1xuICAgICAgY3VycmVudFJldHJ5Q291bnQgPSByZXRyeUF0dGVtcHQ7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgZGlkIE5PVCBjaGFuZ2UgYWZ0ZXIgZmxpcCBhdHRlbXB0ICR7cmV0cnlBdHRlbXB0fSBmb3IgcGFnZSAke3RhcmdldFBhZ2VOdW19LiBSZXRyeWluZy4uLmBcbiAgICAgICk7XG5cbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncmV0cnlpbmcnLFxuICAgICAgICByZXRyeUNvdW50OiByZXRyeUF0dGVtcHQsXG4gICAgICAgIHN0YXR1c1RleHQ6IGBSZXRyeWluZyBwYWdlIHR1cm4gKCR7cmV0cnlBdHRlbXB0fS8ke2NvbmZpZy5tYXhSZXRyaWVzfSkuLi5gLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFF1aWNrIGJhY2tvZmYgZGVsYXkgb24gaW5pdGlhbCByZXRyaWVzOiAxcywgMnMsIDNzLi4uIChtYXggNXMpXG4gICAgICBjb25zdCBiYWNrb2ZmU2VjID0gTWF0aC5taW4ocmV0cnlBdHRlbXB0LCA1KTtcbiAgICAgIGF3YWl0IHNsZWVwKGJhY2tvZmZTZWMgKiAxMDAwKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmVycm9yKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZhaWxlZCB0byBmbGlwIHRvIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfSBhZnRlciAke2NvbmZpZy5tYXhSZXRyaWVzfSBhdHRlbXB0cy5gKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWluIGRvd25sb2FkIGFuZCBjYXB0dXJlIG9yY2hlc3RyYXRpb24gbG9vcFxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gc3RhcnREb3dubG9hZCh1c2VyQ29uZmlnPzogUGFydGlhbDxEb3dubG9hZGVyQ29uZmlnPikge1xuICAgIGlmIChpc1J1bm5pbmcgJiYgIWlzUGF1c2VkKSByZXR1cm47XG5cbiAgICBpZiAoaXNQYXVzZWQpIHtcbiAgICAgIHJlc3VtZURvd25sb2FkKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaXNSdW5uaW5nID0gdHJ1ZTtcbiAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIHN0b3BSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gICAgZG93bmxvYWRlZFBhZ2VzID0gMDtcbiAgICBmYWlsZWRQYWdlcyA9IDA7XG4gICAgY29sbGVjdGVkSW1hZ2VzID0gW107XG4gICAgY29sbGVjdGVkVGV4dHMgPSBbXTtcblxuICAgIGlmICh1c2VyQ29uZmlnKSB7XG4gICAgICBjb25maWcgPSB7IC4uLmNvbmZpZywgLi4udXNlckNvbmZpZyB9O1xuICAgIH1cblxuICAgIC8vIFJlZnJlc2ggYm9vayBkZXRlY3Rpb25cbiAgICBhd2FpdCByZWZyZXNoQm9va0luZm8oKTtcblxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjb25maWcuZW5kUGFnZSB8fCA1MDA7XG4gICAgY29uc3Qgc3RhcnRQID0gdHlwZW9mIGNvbmZpZy5zdGFydFBhZ2UgPT09ICdudW1iZXInXG4gICAgICA/IE1hdGgubWF4KHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UsIGNvbmZpZy5zdGFydFBhZ2UpXG4gICAgICA6IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG5cbiAgICBjb25zdCBtYXhCb29rUGFnZSA9IHByb3ZpZGVyLnNpdGVJZCA9PT0gJ2FyY2hpdmUnICYmIHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UgPT09IDBcbiAgICAgID8gTWF0aC5tYXgoMCwgdG90YWxQYWdlcyAtIDEpXG4gICAgICA6IHRvdGFsUGFnZXM7XG5cbiAgICBjb25zdCBlbmRQID0gY29uZmlnLmVuZFBhZ2UgPiAwXG4gICAgICA/IGNvbmZpZy5lbmRQYWdlXG4gICAgICA6IG1heEJvb2tQYWdlO1xuXG4gICAgY29uc3QgYm9va1RpdGxlID0gYm9va0luZm8/LmJvb2tUaXRsZSB8fCBgJHtwcm92aWRlci5zaXRlTmFtZX0gQm9va2A7XG4gICAgY29uc3QgYm9va0lkID0gYm9va0luZm8/LmJvb2tJZCB8fCAnYm9vayc7XG4gICAgY29uc3Qgc3ViRGlyID0gZm9ybWF0U3ViZGlyKGNvbmZpZy5iYXNlRGlyLCBjb25maWcuZm9sZGVyUGF0dGVybiwgYm9va1RpdGxlLCBib29rSWQpO1xuXG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gU3RhcnRpbmcgZG93bmxvYWQ6IHBhZ2VzICR7c3RhcnRQfSB0byAke2VuZFB9IGludG8gJyR7c3ViRGlyfSdgKTtcblxuICAgIC8vIFN0ZXAgMTogRW5zdXJlIFNpbmdsZS1QYWdlIE1vZGUgaWYgY29uZmlndXJlZCBhbmQgc3VwcG9ydGVkXG4gICAgaWYgKGNvbmZpZy5hdXRvU2luZ2xlUGFnZSAmJiBwcm92aWRlci5lbmZvcmNlU2luZ2xlUGFnZU1vZGUpIHtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnZW5zdXJpbmdfbW9kZScsIHN0YXR1c1RleHQ6ICdTd2l0Y2hpbmcgdG8gMS1wYWdlIG1vZGUuLi4nIH0pO1xuICAgICAgYXdhaXQgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgICBhd2FpdCBzbGVlcCg2MDApO1xuICAgIH1cblxuICAgIC8vIFN0ZXAgMjogQWx3YXlzIG5hdmlnYXRlIHRvIHRoZSBzdGFydGluZyBwYWdlXG4gICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgc3RhdHVzOiAnZG93bmxvYWRpbmcnLFxuICAgICAgY3VycmVudFBhZ2U6IHN0YXJ0UCxcbiAgICAgIHN0YXR1c1RleHQ6IGBOYXZpZ2F0aW5nIHRvIHBhZ2UgJHtzdGFydFB9Li4uYCxcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBOYXZpZ2F0aW5nIHRvIHN0YXJ0aW5nIHBhZ2UvbGVhZiAke3N0YXJ0UH0uLi5gKTtcbiAgICBhd2FpdCBwcm92aWRlci5uYXZpZ2F0ZVRvUGFnZShzdGFydFApO1xuXG4gICAgLy8gR2l2ZSByZWFkZXIgdGltZSB0byBsb2FkIGFuZCByZW5kZXIgc3RhcnRQXG4gICAgYXdhaXQgc2xlZXAoMTIwMCk7XG5cbiAgICBsZXQgbGFzdEltZ1NyYyA9ICcnO1xuICAgIGxldCBjdXJyZW50SW1nOiBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBwYWdlTnVtID0gc3RhcnRQOyBwYWdlTnVtIDw9IGVuZFA7IHBhZ2VOdW0rKykge1xuICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIGJyZWFrO1xuXG4gICAgICBjdXJyZW50UGFnZSA9IHBhZ2VOdW07XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogJ2Rvd25sb2FkaW5nJyxcbiAgICAgICAgY3VycmVudFBhZ2UsXG4gICAgICAgIHN0YXR1c1RleHQ6IGBDYXB0dXJpbmcgcGFnZSAke3BhZ2VOdW19YCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBGb3IgdGhlIGZpcnN0IHBhZ2UgKG9yIHJlY292ZXJ5KSwgd2FpdCBmb3IgdGhlIGltYWdlIHRvIGJlIHJlYWR5XG4gICAgICBpZiAoIWN1cnJlbnRJbWcpIHtcbiAgICAgICAgY29uc3Qgd2FpdEltYWdlU3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHdhaXRJbWFnZVN0YXJ0IDwgMTUwMDApIHtcbiAgICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgYnJlYWs7XG4gICAgICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgYnJlYWs7XG4gICAgICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGN1cnJlbnRJbWcgPSBwcm92aWRlci5nZXRBY3RpdmVQYWdlSW1hZ2UoMzAwLCBwYWdlTnVtKTtcbiAgICAgICAgICBpZiAoY3VycmVudEltZykgYnJlYWs7XG4gICAgICAgICAgYXdhaXQgc2xlZXAoMTUwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWN1cnJlbnRJbWcpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHtwYWdlTnVtfSBpbWFnZSB0aW1lZCBvdXQuYCk7XG4gICAgICAgIGZhaWxlZFBhZ2VzKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwYWdlVG9Qcm9jZXNzID0gcGFnZU51bTtcbiAgICAgICAgY29uc3QgcGFnZUltZyA9IGN1cnJlbnRJbWc7XG4gICAgICAgIGNvbnN0IHBhZ2VJbWdTcmMgPSBjdXJyZW50SW1nLnNyYztcbiAgICAgICAgbGFzdEltZ1NyYyA9IHBhZ2VJbWdTcmM7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHBhZ2UgZGltZW5zaW9uc1xuICAgICAgICBsZXQgcGFnZVcgPSBwYWdlSW1nLm5hdHVyYWxXaWR0aCB8fCBwYWdlSW1nLndpZHRoIHx8IDA7XG4gICAgICAgIGxldCBwYWdlSCA9IHBhZ2VJbWcubmF0dXJhbEhlaWdodCB8fCBwYWdlSW1nLmhlaWdodCB8fCAwO1xuICAgICAgICBpZiAoY29uZmlnLm1heFBhZ2VIZWlnaHQgJiYgY29uZmlnLm1heFBhZ2VIZWlnaHQgPiAwICYmIHBhZ2VIID4gY29uZmlnLm1heFBhZ2VIZWlnaHQpIHtcbiAgICAgICAgICBwYWdlVyA9IE1hdGgucm91bmQocGFnZVcgKiAoY29uZmlnLm1heFBhZ2VIZWlnaHQgLyBwYWdlSCkpO1xuICAgICAgICAgIHBhZ2VIID0gY29uZmlnLm1heFBhZ2VIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IHsgd2lkdGg6IHBhZ2VXLCBoZWlnaHQ6IHBhZ2VIIH07XG4gICAgICAgIGxhc3REaW1lbnNpb25zID0gZGltZW5zaW9ucztcblxuICAgICAgICAvLyBHUkFCIE5FWFQgUEFHRSBJTU1FRElBVEVMWTogVHJpZ2dlciB0aGUgZmxpcCB0byBwYWdlTnVtICsgMSByaWdodCBub3chXG4gICAgICAgIGNvbnN0IG5leHRUdXJuUHJvbWlzZSA9IChwYWdlTnVtIDwgZW5kUCAmJiAhc3RvcFJlcXVlc3RlZClcbiAgICAgICAgICA/IHR1cm5BbmRHZXROZXh0SW1hZ2UocGFnZUltZ1NyYywgcGFnZU51bSArIDEpXG4gICAgICAgICAgOiBudWxsO1xuXG4gICAgICAgIC8vIENvbmN1cnJlbnRseSBjYXB0dXJlIGltYWdlIGRhdGEgYW5kIGV4dHJhY3QgT0NSIHRleHQgZm9yIHBhZ2VUb1Byb2Nlc3NcbiAgICAgICAgY29uc3QgY2FwdHVyZVByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBbZGF0YVVybCwgdGV4dF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgIGNhcHR1cmVJbWFnZVRvRGF0YVVybChwYWdlSW1nLCBjb25maWcuaW1hZ2VRdWFsaXR5LCBjb25maWcubWF4UGFnZUhlaWdodCksXG4gICAgICAgICAgICAgIGNvbmZpZy5zYXZlVGV4dE1kID8gKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgbGV0IHQgPSBhd2FpdCBwcm92aWRlci5leHRyYWN0UGFnZVRleHQocGFnZVRvUHJvY2VzcywgcGFnZUltZyk7XG4gICAgICAgICAgICAgICAgICBpZiAobGFzdEh0dHBFcnJvciAmJiAoRGF0ZS5ub3coKSAtIGxhc3RIdHRwRXJyb3IudGltZXN0YW1wIDwgMzAwMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbGFzdEh0dHBFcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgbGFzdEh0dHBFcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBPQ1IgdGV4dCBmZXRjaCBmb3IgcGFnZSAke3BhZ2VUb1Byb2Nlc3N9IGVuY291bnRlcmVkIEhUVFAgJHtlcnIuc3RhdHVzQ29kZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlSHR0cEVycm9yQmFja29mZihlcnIsIHBhZ2VUb1Byb2Nlc3MpO1xuICAgICAgICAgICAgICAgICAgICB0ID0gYXdhaXQgcHJvdmlkZXIuZXh0cmFjdFBhZ2VUZXh0KHBhZ2VUb1Byb2Nlc3MsIHBhZ2VJbWcpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgZXh0cmFjdCB0ZXh0IGZvciBwYWdlICR7cGFnZVRvUHJvY2Vzc306YCwgZXJyKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKCkgOiBQcm9taXNlLnJlc29sdmUoJycpLFxuICAgICAgICAgICAgXSk7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIGZvciBQREYgY29tcGlsZXIgKGRlZHVwbGljYXRlIGJ5IHBhZ2VOdW0pXG4gICAgICAgICAgICBpZiAoY29uZmlnLmdlbmVyYXRlUGRmKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWR4ID0gY29sbGVjdGVkSW1hZ2VzLmZpbmRJbmRleChpID0+IGkucGFnZU51bSA9PT0gcGFnZVRvUHJvY2Vzcyk7XG4gICAgICAgICAgICAgIGlmIChleGlzdGluZ0lkeCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkSW1hZ2VzW2V4aXN0aW5nSWR4XSA9IHtcbiAgICAgICAgICAgICAgICAgIHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsXG4gICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhVXJsLFxuICAgICAgICAgICAgICAgICAgd2lkdGg6IHBhZ2VXLFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYWdlSCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZEltYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsXG4gICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhVXJsLFxuICAgICAgICAgICAgICAgICAgd2lkdGg6IHBhZ2VXLFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYWdlSCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb3dubG9hZGVkUGFnZXMgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICAvLyBTYXZlIGluZGl2aWR1YWwgaW1hZ2UgZmlsZSBpZiBjb25maWd1cmVkXG4gICAgICAgICAgICBpZiAoY29uZmlnLnNhdmVJbWFnZXMpIHtcbiAgICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdET1dOTE9BRF9QQUdFX0lNQUdFJyxcbiAgICAgICAgICAgICAgICBib29rVGl0bGUsXG4gICAgICAgICAgICAgICAgcGFnZU51bTogcGFnZVRvUHJvY2VzcyxcbiAgICAgICAgICAgICAgICB0b3RhbFBhZ2VzOiBlbmRQLFxuICAgICAgICAgICAgICAgIGRhdGFVcmwsXG4gICAgICAgICAgICAgICAgc3ViRGlyLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3RvcmUgT0NSIHRleHRcbiAgICAgICAgICAgIGlmIChjb25maWcuc2F2ZVRleHRNZCAmJiB0ZXh0KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVGV4dElkeCA9IGNvbGxlY3RlZFRleHRzLmZpbmRJbmRleCh0ID0+IHQucGFnZU51bSA9PT0gcGFnZVRvUHJvY2Vzcyk7XG4gICAgICAgICAgICAgIGlmIChleGlzdGluZ1RleHRJZHggPj0gMCkge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZFRleHRzW2V4aXN0aW5nVGV4dElkeF0gPSB7IHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsIGxlYWZJbmRleDogcGFnZVRvUHJvY2VzcywgdGV4dCB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZFRleHRzLnB1c2goeyBwYWdlTnVtOiBwYWdlVG9Qcm9jZXNzLCBsZWFmSW5kZXg6IHBhZ2VUb1Byb2Nlc3MsIHRleHQgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICAgICAgICBjdXJyZW50UGFnZTogcGFnZVRvUHJvY2VzcyxcbiAgICAgICAgICAgICAgZG93bmxvYWRlZFBhZ2VzLFxuICAgICAgICAgICAgICBjdXJyZW50VGh1bWJuYWlsOiBkYXRhVXJsLFxuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiBgQ2FwdHVyaW5nIHBhZ2UgJHtwYWdlVG9Qcm9jZXNzfWAsXG4gICAgICAgICAgICAgIGltYWdlRGltZW5zaW9uczogZGltZW5zaW9ucyxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGZhaWxlZFBhZ2VzKys7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVycm9yIHByb2Nlc3NpbmcgcGFnZSAke3BhZ2VUb1Byb2Nlc3N9OmAsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KSgpO1xuXG4gICAgICAgIC8vIEF3YWl0IGN1cnJlbnQgcGFnZSBjYXB0dXJlIGFuZCBzdG9yYWdlXG4gICAgICAgIGF3YWl0IGNhcHR1cmVQcm9taXNlO1xuXG4gICAgICAgIC8vIElmIG5vdCB0aGUgbGFzdCBwYWdlLCB3YWl0IGZvciB0aGUgbmV4dCBwYWdlIGZsaXAgdG8gcmVzb2x2ZVxuICAgICAgICBpZiAobmV4dFR1cm5Qcm9taXNlKSB7XG4gICAgICAgICAgY29uc3QgbmV4dEltZyA9IGF3YWl0IG5leHRUdXJuUHJvbWlzZTtcbiAgICAgICAgICBpZiAoIW5leHRJbWcpIHtcbiAgICAgICAgICAgIGlmIChpc0VuZE9mQm9vaykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBSZWFjaGVkIGVuZCBvZiBib29rIGF0IHBhZ2UgJHtwYWdlTnVtfS4gRmluYWxpemluZy5gKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZhaWxlZCBhZnRlciByZXRyaWVzOiBwcm9tcHQgdXNlciB0byBzYXZlIGNhcHR1cmVkIHBhZ2VzIVxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIENvdWxkIG5vdCB0dXJuIHBhc3QgcGFnZSAke3BhZ2VOdW19LiBQcm9tcHRpbmcgdXNlciB0byBzYXZlLmApO1xuICAgICAgICAgICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICAgICAgICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlU3RvcFJlcXVlc3QoYENhbm5vdCBjb250aW51ZSBwYXN0IHBhZ2UgJHtwYWdlTnVtfS4gU2F2ZSBhbGwgJHtjb3VudH0gcGFnZXMgZG93bmxvYWRlZCBzbyBmYXI/YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBOZXh0IHBhZ2UgaXMgcmVhZHkgZm9yIHRoZSBuZXh0IGl0ZXJhdGlvbiFcbiAgICAgICAgICBjdXJyZW50SW1nID0gbmV4dEltZztcblxuICAgICAgICAgIC8vIFN5bmNocm9uaXplIHBhZ2UgY291bnRlciBpZiB2aWV3ZXIgaXMgYWhlYWQgKEFyY2hpdmUub3JnIGxlYWYtanVtcGluZylcbiAgICAgICAgICBpZiAocHJvdmlkZXIuc2l0ZUlkICE9PSAnaGF0aGl0cnVzdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGRvbVBhZ2VOb3cgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgICAgICAgaWYgKGRvbVBhZ2VOb3cgIT09IG51bGwgJiYgZG9tUGFnZU5vdyA+IHBhZ2VOdW0pIHtcbiAgICAgICAgICAgICAgcGFnZU51bSA9IGRvbVBhZ2VOb3cgLSAxOyAvLyBwYWdlTnVtKysgaW4gdGhlIGZvci1sb29wIHdpbGwgc2V0IHBhZ2VOdW0gPSBkb21QYWdlTm93XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gV3JhcC11cDogR2VuZXJhdGUgUERGIGFuZCBNYXJrZG93biBmaWxlc1xuICAgIGlmICghc3RvcFJlcXVlc3RlZCAmJiBkb3dubG9hZGVkUGFnZXMgPiAwKSB7XG4gICAgICBhd2FpdCBmaW5hbGl6ZUJvb2soc3ViRGlyLCBib29rVGl0bGUpO1xuICAgIH1cblxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogc3RvcFJlcXVlc3RlZCA/ICdpZGxlJyA6ICdjb21wbGV0ZScsXG4gICAgICBzdGF0dXNUZXh0OiBzdG9wUmVxdWVzdGVkID8gJ1N0b3BwZWQgYnkgdXNlcicgOiBgQ29tcGxldGVkISBTYXZlZCAke2Rvd25sb2FkZWRQYWdlc30gcGFnZXMuYCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlcyBhbmQgdHJpZ2dlcnMgZG93bmxvYWQgZm9yIHRoZSBmaW5hbCBQREYgYW5kIE1hcmtkb3duIHRleHQgZG9jdW1lbnQuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBmaW5hbGl6ZUJvb2soc3ViRGlyOiBzdHJpbmcsIGJvb2tUaXRsZTogc3RyaW5nKSB7XG4gICAgLy8gMS4gQ29tcGlsZSBQREZcbiAgICBpZiAoY29uZmlnLmdlbmVyYXRlUGRmICYmIGNvbGxlY3RlZEltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2NvbXBpbGluZ19wZGYnLCBzdGF0dXNUZXh0OiAnQ29tcGlsaW5nIFBERiBkb2N1bWVudC4uLicgfSk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBBc3NlbWJsaW5nIFBERiBmcm9tJywgY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCwgJ3BhZ2VzLi4uJyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBkZkJ5dGVzID0gY29tcGlsZUpwZWdzVG9QZGYoY29sbGVjdGVkSW1hZ2VzLCB7XG4gICAgICAgICAgdGl0bGU6IGJvb2tUaXRsZSxcbiAgICAgICAgICBhdXRob3I6IGJvb2tJbmZvPy5hdXRob3IgfHwgcHJvdmlkZXIuc2l0ZU5hbWUsXG4gICAgICAgICAgY3JlYXRvcjogJ0FyY2hpdmUgRG93bmxvYWRlcicsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBkZkJsb2IgPSBuZXcgQmxvYihbcGRmQnl0ZXNdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9wZGYnIH0pO1xuICAgICAgICBjb25zdCBwZGZCbG9iVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChwZGZCbG9iKTtcblxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ1NBVkVfRklOQUxfRklMRVMnLFxuICAgICAgICAgIGJvb2tUaXRsZSxcbiAgICAgICAgICBzdWJEaXIsXG4gICAgICAgICAgcGRmQmxvYlVybCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gUERGIGNvbXBpbGVkIGFuZCBzZW50IGZvciBkb3dubG9hZCEnKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbQXJjaGl2ZURvd25sb2FkZXJdIEZhaWxlZCB0byBjb21waWxlIFBERjonLCBlcnIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIFNhdmUgTWFya2Rvd24gdGV4dFxuICAgIGlmIChjb25maWcuc2F2ZVRleHRNZCkge1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdzYXZpbmdfdGV4dCcsIHN0YXR1c1RleHQ6ICdTYXZpbmcgTWFya2Rvd24gdGV4dC4uLicgfSk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBBc3NlbWJsaW5nIE1hcmtkb3duIGZyb20nLCBjb2xsZWN0ZWRUZXh0cy5sZW5ndGgsICdwYWdlIHRleHRzLi4uJyk7XG5cbiAgICAgIGNvbnN0IG1kQ29udGVudCA9IGJ1aWxkQm9va01hcmtkb3duKFxuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6IGJvb2tUaXRsZSxcbiAgICAgICAgICBib29rSWQ6IGJvb2tJbmZvPy5ib29rSWQgfHwgJ2Jvb2snLFxuICAgICAgICAgIGF1dGhvcjogYm9va0luZm8/LmF1dGhvcixcbiAgICAgICAgICBwdWJsaXNoZXI6IGJvb2tJbmZvPy5wdWJsaXNoZXIsXG4gICAgICAgICAgeWVhcjogYm9va0luZm8/LnllYXIsXG4gICAgICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgICB0b3RhbFBhZ2VzOiBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjdXJyZW50UGFnZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29sbGVjdGVkVGV4dHNcbiAgICAgICk7XG5cbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ1NBVkVfRklOQUxfRklMRVMnLFxuICAgICAgICBib29rVGl0bGUsXG4gICAgICAgIHN1YkRpcixcbiAgICAgICAgbWFya2Rvd25Db250ZW50OiBtZENvbnRlbnQsXG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gTWFya2Rvd24gZ2VuZXJhdGVkIGFuZCBzZW50IGZvciBkb3dubG9hZCEnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwYXVzZURvd25sb2FkKCkge1xuICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3BhdXNlZCcsIHN0YXR1c1RleHQ6ICdEb3dubG9hZCBwYXVzZWQnIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzdW1lRG93bmxvYWQoKSB7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2Rvd25sb2FkaW5nJywgc3RhdHVzVGV4dDogYFJlc3VtaW5nIHBhZ2UgJHtjdXJyZW50UGFnZX0uLi5gIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudDogbnVtYmVyKSB7XG4gICAgc3RvcFJlcXVlc3RlZCA9IHRydWU7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6ICdjb21waWxpbmdfcGRmJyxcbiAgICAgIHN0YXR1c1RleHQ6IGBTYXZpbmcgJHtjb3VudH0gY2FwdHVyZWQgcGFnZXMuLi5gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYm9va1RpdGxlID0gYm9va0luZm8/LmJvb2tUaXRsZSB8fCBgJHtwcm92aWRlci5zaXRlTmFtZX0gQm9va2A7XG4gICAgY29uc3QgYm9va0lkID0gYm9va0luZm8/LmJvb2tJZCB8fCAnYm9vayc7XG4gICAgY29uc3Qgc3ViRGlyID0gZm9ybWF0U3ViZGlyKGNvbmZpZy5iYXNlRGlyLCBjb25maWcuZm9sZGVyUGF0dGVybiwgYm9va1RpdGxlLCBib29rSWQpO1xuXG4gICAgYXdhaXQgZmluYWxpemVCb29rKHN1YkRpciwgYm9va1RpdGxlKTtcblxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogJ2NvbXBsZXRlJyxcbiAgICAgIGRvd25sb2FkZWRQYWdlczogY291bnQsXG4gICAgICBzdGF0dXNUZXh0OiBgQ29tcGxldGVkISBTYXZlZCAke2NvdW50fSBwYWdlcy5gLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3RvcFJlcXVlc3QoY3VzdG9tTWVzc2FnZT86IHN0cmluZykge1xuICAgIGlmICghaXNSdW5uaW5nKSB7XG4gICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgIC8vIFRlbXBvcmFyaWx5IHBhdXNlIHRoZSBkb3dubG9hZCBjeWNsZSB3aGlsZSB1c2VyIGRlY2lkZXNcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICAgICAgc3RhdHVzVGV4dDogY3VzdG9tTWVzc2FnZSB8fCBgUGF1c2VkOiBTYXZlICR7Y291bnR9IHBhZ2VzP2AsXG4gICAgICB9KTtcblxuICAgICAgcGlsbC5zaG93U3RvcFByb21wdChcbiAgICAgICAgY291bnQsXG4gICAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAvLyBZRVM6IFNhdmUgZXZlcnl0aGluZyBhbmQgdHJlYXQgbGlrZSBjb21wbGV0ZSFcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBVc2VyIGNvbmZpcm1lZCBzYXZpbmcgJHtjb3VudH0gcGFnZXMuYCk7XG4gICAgICAgICAgYXdhaXQgc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudCk7XG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBESVNDQVJEXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gVXNlciBkaXNjYXJkZWQgZG93bmxvYWRzIG9uIHN0b3AuJyk7XG4gICAgICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBDQU5DRUwgLyBSRVNVTUVcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBSZXN1bWluZyBkb3dubG9hZC4uLicpO1xuICAgICAgICAgIHJlc3VtZURvd25sb2FkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3BEb3dubG9hZCgpIHtcbiAgICBzdG9wUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIGNvbGxlY3RlZEltYWdlcyA9IFtdO1xuICAgIGNvbGxlY3RlZFRleHRzID0gW107XG4gICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdpZGxlJywgc3RhdHVzVGV4dDogJ0Rvd25sb2FkIHN0b3BwZWQnIH0pO1xuICB9XG5cbiAgLy8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gUG9wdXAgb3IgQmFja2dyb3VuZCBTZXJ2aWNlIFdvcmtlclxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IEV4dGVuc2lvbk1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ0dFVF9TVEFURSc6IHtcbiAgICAgICAgYnJvYWRjYXN0U3RhdGUoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgYm9va0luZm8gfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTVEFSVF9ET1dOTE9BRCc6IHtcbiAgICAgICAgc3RhcnREb3dubG9hZChtZXNzYWdlLmNvbmZpZyk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdQQVVTRV9ET1dOTE9BRCc6IHtcbiAgICAgICAgcGF1c2VEb3dubG9hZCgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnUkVTVU1FX0RPV05MT0FEJzoge1xuICAgICAgICByZXN1bWVEb3dubG9hZCgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RPUF9BTkRfU0FWRSc6IHtcbiAgICAgICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICAgICAgaWYgKGlzUnVubmluZyAmJiBjb3VudCA+IDApIHtcbiAgICAgICAgICBzYXZlUGFydGlhbEFuZENvbXBsZXRlKGNvdW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgICAgfVxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RPUF9ET1dOTE9BRCc6IHtcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc2F2ZUNvbGxlY3RlZCkge1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCB8fCBkb3dubG9hZGVkUGFnZXM7XG4gICAgICAgICAgaWYgKGlzUnVubmluZyAmJiBjb3VudCA+IDApIHtcbiAgICAgICAgICAgIHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQpO1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NXSVRDSF9UT19TSU5HTEVfUEFHRSc6IHtcbiAgICAgICAgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTQVZFX0NPTkZJRyc6IHtcbiAgICAgICAgc2F2ZUNvbmZpZyhtZXNzYWdlLmNvbmZpZyk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0dFVF9DT05GSUcnOiB7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0hUVFBfRVJST1JfREVURUNURUQnOiB7XG4gICAgICAgIG9uSHR0cEVycm9yUmVjZWl2ZWQobWVzc2FnZS5zdGF0dXNDb2RlLCBtZXNzYWdlLnVybCwgbWVzc2FnZS5yZXRyeUFmdGVyKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn0pKCk7XG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBOEJPLE1BQU0sYUFBYTtBQUFBLEVBQ2hCLFlBQWdDO0FBQUEsRUFDaEMsV0FBVztBQUFBLEVBQ1gsaUJBQWlCO0FBQUEsRUFDakIsbUJBQW1CO0FBQUEsRUFDbkIsWUFBMkIsQ0FBQztBQUFBLEVBQzVCLGdCQUEyQyxDQUFDO0FBQUEsRUFFcEQsV0FBVyxDQUFDLFlBQTJCLENBQUMsR0FBRztBQUFBLElBQ3pDLEtBQUssWUFBWTtBQUFBO0FBQUEsRUFHWixZQUFZLEdBQVk7QUFBQSxJQUM3QixNQUFNLFlBQVksT0FBTyxTQUFTLFNBQVMsU0FBUyxhQUFhLEtBQy9DLE9BQU8sU0FBUyxTQUFTLFNBQVMsV0FBVztBQUFBLElBQy9ELE1BQU0sVUFBVSxPQUFPLFNBQVMsYUFBYSwwQkFDNUIsT0FBTyxTQUFTLFNBQVMsU0FBUyxnQkFBZ0IsS0FBSyxPQUFPLFNBQVMsU0FBUyxXQUFXLFNBQVM7QUFBQSxJQUNySCxPQUFPLGFBQWE7QUFBQTtBQUFBLEVBR2YsTUFBTSxHQUFTO0FBQUEsSUFDcEIsSUFBSSxDQUFDLEtBQUssYUFBYTtBQUFBLE1BQUc7QUFBQSxJQUMxQixJQUFJLEtBQUs7QUFBQSxNQUFXO0FBQUEsSUFFcEIsTUFBTSxPQUFPLFNBQVMsY0FBYyxLQUFLO0FBQUEsSUFDekMsS0FBSyxLQUFLO0FBQUEsSUFDVixLQUFLLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG9CQTJZRCxPQUFPLFFBQVEsT0FBTyxrQkFBa0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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ZUFBZTtBQUFBLFFBQ2YsYUFBYSxFQUFFLFNBQVMsTUFBTSxTQUFTLENBQUM7QUFBQSxRQUN4QztBQUFBLE1BQ0Y7QUFBQSxXQUVLLGtCQUFrQjtBQUFBLFFBQ3JCLGNBQWMsUUFBUSxNQUFNO0FBQUEsUUFDNUIsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyxrQkFBa0I7QUFBQSxRQUNyQixjQUFjO0FBQUEsUUFDZCxhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLG1CQUFtQjtBQUFBLFFBQ3RCLGVBQWU7QUFBQSxRQUNmLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBLFdBRUssaUJBQWlCO0FBQUEsUUFDcEIsTUFBTSxRQUFRLGdCQUFnQixVQUFVO0FBQUEsUUFDeEMsSUFBSSxhQUFhLFFBQVEsR0FBRztBQUFBLFVBQzFCLHVCQUF1QixLQUFLO0FBQUEsUUFDOUIsRUFBTztBQUFBLFVBQ0wsYUFBYTtBQUFBO0FBQUEsUUFFZixhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLGlCQUFpQjtBQUFBLFFBQ3BCLElBQUksUUFBUSxlQUFlO0FBQUEsVUFDekIsTUFBTSxRQUFRLGdCQUFnQixVQUFVO0FBQUEsVUFDeEMsSUFBSSxhQUFhLFFBQVEsR0FBRztBQUFBLFlBQzFCLHVCQUF1QixLQUFLO0FBQUEsWUFDNUIsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsWUFDOUI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsYUFBYTtBQUFBLFFBQ2IsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyx5QkFBeUI7QUFBQSxRQUM1QixzQkFBc0I7QUFBQSxRQUN0QixhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLGVBQWU7QUFBQSxRQUNsQixXQUFXLFFBQVEsTUFBTTtBQUFBLFFBQ3pCLGFBQWEsRUFBRSxTQUFTLE1BQU0sT0FBTyxDQUFDO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQUEsV0FFSyxjQUFjO0FBQUEsUUFDakIsYUFBYSxFQUFFLFNBQVMsTUFBTSxPQUFPLENBQUM7QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFBQSxXQUVLLHVCQUF1QjtBQUFBLFFBQzFCLG9CQUFvQixRQUFRLFlBQVksUUFBUSxLQUFLLFFBQVEsVUFBVTtBQUFBLFFBQ3ZFLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBO0FBQUEsSUFFRixPQUFPO0FBQUEsR0FDUjtBQUFBLEdBQ0E7IiwKICAiZGVidWdJZCI6ICJBQTVFREUwNzVFMjJGRTM5NjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
