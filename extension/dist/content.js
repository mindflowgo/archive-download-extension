// extension/src/content/pill.ts
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

// extension/src/utils/markdown-builder.ts
function parseDjvuXmlToText(xmlString) {
  if (!xmlString || typeof xmlString !== "string")
    return "";
  const paragraphMatches = xmlString.match(/<PARAGRAPH[\s\S]*?<\/PARAGRAPH>/gi);
  if (!paragraphMatches || paragraphMatches.length === 0) {
    const words = Array.from(xmlString.matchAll(/<WORD[^>]*>([\s\S]*?)<\/WORD>/gi)).map((m) => decodeXmlEntities(m[1].trim())).filter(Boolean);
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

// extension/src/utils/pdf-builder.ts
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

// extension/src/utils/sanitizer.ts
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

// extension/src/providers/archive-provider.ts
class ArchiveProvider {
  siteId = "archive";
  siteName = "Archive.org";
  defaultStartPage = 0;
  bookInfo = null;
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
    const currentSpan = document.querySelector(".BRcurrentpage") || document.querySelector('[role="status"]');
    if (currentSpan && currentSpan.textContent) {
      const match = currentSpan.textContent.match(/\((\d+)(?:\s*-\s*\d+)?\s*\/\s*(\d+)\)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      const simpleMatch = currentSpan.textContent.match(/\((\d+)\s*\//);
      if (simpleMatch) {
        return parseInt(simpleMatch[1], 10);
      }
      const slashMatch = currentSpan.textContent.match(/\/\s*(\d+)/);
      if (slashMatch) {
        return parseInt(slashMatch[1], 10);
      }
    }
    return null;
  }
  async enforceSinglePageMode() {
    console.log("[ArchiveDownloader] Enforcing single-page mode on Archive.org...");
    this.postToBridge("SWITCH_MODE_1");
    const onePageBtn = document.querySelector('button[title*="One-page" i], button[aria-label*="One-page" i], button.one-page, .BRpageview1');
    if (onePageBtn && !onePageBtn.classList.contains("active") && onePageBtn.getAttribute("aria-pressed") !== "true") {
      onePageBtn.click();
    }
    return true;
  }
  async navigateToPage(pageNum) {
    console.log(`[ArchiveDownloader] Navigating to Archive leaf ${pageNum}...`);
    this.postToBridge("JUMP_PAGE", { leafIndex: pageNum });
    if (pageNum === 0) {
      const firstBtn = document.querySelector('button[title*="First page" i], button[aria-label*="First page" i], button.navfirst, .book-flip-first');
      if (firstBtn)
        firstBtn.click();
      const homeEvent = { bubbles: true, cancelable: true, key: "Home", code: "Home" };
      document.body.dispatchEvent(new KeyboardEvent("keydown", homeEvent));
      window.dispatchEvent(new KeyboardEvent("keydown", homeEvent));
    }
    return true;
  }
  triggerPageFlip(targetPageNum) {
    this.postToBridge("FLIP_NEXT");
    const nextBtn = document.querySelector('button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right');
    if (nextBtn) {
      try {
        nextBtn.click();
      } catch (e) {}
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
  }
  getActivePageImage(minWidth = 300, targetPageNum) {
    const images = Array.from(document.querySelectorAll(".BRpageimage, .BRpage img, img.BRpageimage"));
    const valid = images.filter((img) => img.complete && img.naturalWidth >= minWidth && img.src);
    if (valid.length === 0)
      return null;
    const visible = valid.find((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50 && rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
    });
    return visible || valid[0];
  }
  async extractPageText(pageNum) {
    if (!this.bookInfo || !this.bookInfo.server || !this.bookInfo.bookPath) {
      return "";
    }
    const leafIndex = pageNum;
    const url = `https://${this.bookInfo.server}/BookReader/BookReaderGetTextWrapper.php?path=${encodeURIComponent(this.bookInfo.bookPath)}_djvu.xml&mode=djvu_xml&page=${leafIndex}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include"
      });
      if (!response.ok)
        return "";
      const xml = await response.text();
      return parseDjvuXmlToText(xml);
    } catch (err) {
      console.warn(`[ArchiveDownloader] Could not fetch text for leaf ${leafIndex}:`, err);
      return "";
    }
  }
  isAtEndOfBook(currentPage, totalPages) {
    const nextBtn = document.querySelector('button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right');
    const isNextDisabled = nextBtn && (nextBtn.disabled || nextBtn.getAttribute("aria-disabled") === "true" || nextBtn.classList.contains("disabled"));
    const domLeaf = this.getCurrentPage();
    return Boolean(isNextDisabled || totalPages > 0 && domLeaf !== null && domLeaf >= totalPages);
  }
  postToBridge(action, extraData = {}) {
    window.postMessage({ direction: "TO_BRIDGE", action, ...extraData }, "*");
  }
  extractPageInfoFromDom() {
    const pageEl = document.querySelector(".BRcurrentpage") || document.querySelector('[role="status"]');
    if (pageEl && pageEl.textContent) {
      const match = pageEl.textContent.match(/\((\d+)\s*\/\s*(\d+)\)/);
      if (match) {
        return {
          current: parseInt(match[1], 10),
          total: parseInt(match[2], 10)
        };
      }
    }
    return null;
  }
}

// extension/src/providers/hathitrust-provider.ts
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

// extension/src/providers/index.ts
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

// extension/src/content/index.ts
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
    pageDelayMs: 500,
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
  function captureImageToDataUrl(img, quality = 0.75, maxPageHeight = 0) {
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (maxPageHeight > 0 && height > maxPageHeight) {
      const scale = maxPageHeight / height;
      width = Math.round(width * scale);
      height = maxPageHeight;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Could not obtain canvas 2D context");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
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
      if (!alreadyTurned) {
        console.log(`[ArchiveDownloader] Flipping to page ${targetPageNum} (attempt ${retryAttempt + 1}/${config.maxRetries + 1})...`);
        await provider.triggerPageFlip(targetPageNum);
      } else {
        console.log(`[ArchiveDownloader] DOM indicates page is already on sequence/leaf ${domPageBefore}. Waiting for image.`);
      }
      const checkStart = Date.now();
      const timeoutMs = 5000;
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
        await sleep(100);
        const activeImg = provider.getActivePageImage(300, targetPageNum);
        if (activeImg && activeImg.complete && activeImg.naturalWidth >= 300) {
          if (lastHttpError && Date.now() - lastHttpError.timestamp < 3000) {
            continue;
          }
          const isTargetSeq = activeImg.dataset.seq === String(targetPageNum);
          if (activeImg.src && (activeImg.src !== lastSrc || isTargetSeq)) {
            currentRetryCount = 0;
            consecutiveErrorCount = 0;
            console.log(`[ArchiveDownloader] Page ${targetPageNum} visible (${activeImg.naturalWidth}x${activeImg.naturalHeight}px)!`);
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
        try {
          lastImgSrc = currentImg.src;
          const dataUrl = captureImageToDataUrl(currentImg, config.imageQuality, config.maxPageHeight);
          let pageW = currentImg.naturalWidth;
          let pageH = currentImg.naturalHeight;
          if (config.maxPageHeight > 0 && pageH > config.maxPageHeight) {
            pageW = Math.round(pageW * (config.maxPageHeight / pageH));
            pageH = config.maxPageHeight;
          }
          lastDimensions = { width: pageW, height: pageH };
          if (config.generatePdf) {
            const existingIdx = collectedImages.findIndex((i) => i.pageNum === pageNum);
            if (existingIdx >= 0) {
              collectedImages[existingIdx] = {
                pageNum,
                data: dataUrl,
                width: pageW,
                height: pageH
              };
            } else {
              collectedImages.push({
                pageNum,
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
              pageNum,
              totalPages: endP,
              dataUrl,
              subDir
            });
          }
          if (config.saveTextMd) {
            try {
              let text = await provider.extractPageText(pageNum, currentImg);
              if (lastHttpError && Date.now() - lastHttpError.timestamp < 3000) {
                const err = lastHttpError;
                lastHttpError = null;
                console.warn(`[ArchiveDownloader] OCR text fetch for page ${pageNum} encountered HTTP ${err.statusCode}`);
                await handleHttpErrorBackoff(err, pageNum);
                text = await provider.extractPageText(pageNum, currentImg);
              }
              const existingTextIdx = collectedTexts.findIndex((t) => t.pageNum === pageNum);
              if (existingTextIdx >= 0) {
                collectedTexts[existingTextIdx] = { pageNum, leafIndex: pageNum, text };
              } else {
                collectedTexts.push({ pageNum, leafIndex: pageNum, text });
              }
            } catch (err) {
              console.warn(`[ArchiveDownloader] Could not extract text for page ${pageNum}:`, err);
            }
          }
          broadcastState({
            currentPage: pageNum,
            downloadedPages,
            currentThumbnail: dataUrl,
            statusText: `Capturing page ${pageNum}`,
            imageDimensions: dimensions
          });
        } catch (err) {
          failedPages++;
          console.error(`[ArchiveDownloader] Error processing page ${pageNum}:`, err);
        }
      }
      if (pageNum < endP && !stopRequested) {
        const nextImg = await turnAndGetNextImage(lastImgSrc, pageNum + 1);
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
        if (config.pageDelayMs > 0) {
          await sleep(config.pageDelayMs);
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

//# debugId=5D87151F1B64736D64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvcGlsbC50cyIsICIuLi9zcmMvdXRpbHMvbWFya2Rvd24tYnVpbGRlci50cyIsICIuLi9zcmMvdXRpbHMvcGRmLWJ1aWxkZXIudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0aXplci50cyIsICIuLi9zcmMvcHJvdmlkZXJzL2FyY2hpdmUtcHJvdmlkZXIudHMiLCAiLi4vc3JjL3Byb3ZpZGVycy9oYXRoaXRydXN0LXByb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcm92aWRlcnMvaW5kZXgudHMiLCAiLi4vc3JjL2NvbnRlbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiLyoqXG4gKiBGbG9hdGluZyBQcm9ncmVzcyBQaWxsIE92ZXJsYXkgZm9yIEFyY2hpdmUub3JnXG4gKiBPTkxZIGFwcGVhcnMgb24gaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLypcbiAqXG4gKiBGZWF0dXJlczpcbiAqIC0gQ29nIGljb24gYnV0dG9uICjimpkpIHRvIG9wZW4gZXhwYW5kYWJsZSBpbi1wYWdlIFNldHRpbmdzIHRyYXlcbiAqIC0gU2V0dGluZ3MgKHNhdmUgcGF0aCwgZm9sZGVyIHBhdHRlcm4sIHN0YXJ0L2VuZCBwYWdlcykgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlXG4gKiAtIFNxdWFyZSwgZnVsbC1oZWlnaHQgYnV0dG9ucyB3aXRoIG5vIGN1cnZhdHVyZSAoanVzdCBsaW5lIG91dGxpbmUpXG4gKiAtIFvinJVdIGJ1dHRvbiB0aGF0IHNocmlua3MgcGlsbCB0byBhIHNtYWxsIGRvY2tlZCBib29rIGljb24gb24gdGhlIGZhciBsZWZ0IGVkZ2Ugb2YgdGhlIHNjcmVlblxuICogLSBDbGlja2luZyB0aGUgZG9ja2VkIGJvb2sgaWNvbiByZXN0b3JlcyB0aGUgcGlsbFxuICogLSBJbWFnZSBkaW1lbnNpb25zIGluIHNtYWxsIGdyZXkgbGV0dGVycyBiZWxvdyBzdGF0dXM6XG4gKiAgIFwiQ2FwdHVyaW5nIHBhZ2UgMTRcIlxuICogICBcIihpbWFnZTogMjU4MCB4IDM5MTUpXCJcbiAqIC0gW0NPTlRJTlVFXSBidXR0b24gd2hlbiBzdGFsbGVkIG9yIGNvbm5lY3Rpb24gZHJvcHNcbiAqIC0gSW50ZXJhY3RpdmUgU3RvcCBjb25maXJtYXRpb24gcHJvbXB0IHRvIHNhdmUgY2FwdHVyZWQgcGFnZXMgc28gZmFyXG4gKiAtIFwiRG93bmxvYWRlZDogVmlldyBGaWxlc1wiIGJ1dHRvbiBvbiBjb21wbGV0aW9uIHRoYXQgb3BlbnMgdGhlIGRvd25sb2FkZWQgZmlsZS9mb2xkZXJcbiAqL1xuXG5pbXBvcnQgeyBEb3dubG9hZGVyQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpbGxDYWxsYmFja3Mge1xuICBvblN0YXJ0PzogKCkgPT4gdm9pZDtcbiAgb25QYXVzZT86ICgpID0+IHZvaWQ7XG4gIG9uUmVzdW1lPzogKCkgPT4gdm9pZDtcbiAgb25TdG9wPzogKCkgPT4gdm9pZDtcbiAgb25TYXZlU2V0dGluZ3M/OiAoc2V0dGluZ3M6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pID0+IHZvaWQ7XG4gIG9uU3dpdGNoTW9kZT86ICgpID0+IHZvaWQ7XG4gIG9uVmlld0ZpbGU/OiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgRmxvYXRpbmdQaWxsIHtcbiAgcHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNEb2NrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc1NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzQ29uZmlybWluZ1N0b3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFBpbGxDYWxsYmFja3MgPSB7fTtcbiAgcHJpdmF0ZSBjdXJyZW50Q29uZmlnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+ID0ge307XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzOiBQaWxsQ2FsbGJhY2tzID0ge30pIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgfVxuXG4gIHB1YmxpYyBzaG91bGRSZW5kZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNBcmNoaXZlID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluY2x1ZGVzKCcvZGV0YWlscy8nKTtcbiAgICBjb25zdCBpc0JhYmVsID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnYmFiZWwuaGF0aGl0cnVzdC5vcmcnIHx8XG4gICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzQXJjaGl2ZSB8fCBpc0JhYmVsO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkUmVuZGVyKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwaWxsLmlkID0gJ2FyY2hpdmUtZG93bmxvYWRlci1waWxsJztcbiAgICBwaWxsLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgI2FyY2hpdmUtZG93bmxvYWRlci1waWxsIHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiAxNHB4O1xuICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE4LCAxOCwgMTgsIDAuOTYpO1xuICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICAtd2Via2l0LWJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgOHB4IDMycHggcmdiYSgwLCAwLCAwLCAwLjY1KTtcbiAgICAgICAgICBjb2xvcjogI2YxZjFmMTtcbiAgICAgICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBlYXNlLCBvcGFjaXR5IDAuMjVzIGVhc2U7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgbWF4LXdpZHRoOiA5NXZ3O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBEb2NrZWQgdG8gZmFyIGxlZnQgb2Ygd2luZG93ICovXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCB7XG4gICAgICAgICAgbGVmdDogMCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRvcDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRyYW5zZm9ybTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIGJvcmRlci1sZWZ0OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMCA2cHggNnB4IDAgIWltcG9ydGFudDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICBib3gtc2hhZG93OiAycHggNHB4IDE2cHggcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtbWFpbi1ib2R5LFxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtc2V0dGluZ3MtcGFuZWwge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgfVxuXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCAucGlsbC1kb2NrLWljb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIGltZyB7XG4gICAgICAgICAgd2lkdGg6IDI0cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLW1haW4tYm9keSB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDQ4cHg7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBDb2cgc2V0dGluZ3MgYnV0dG9uIHJlcGxhY2luZyB0aGUgc3RhdGljIGxvZ28gKi9cbiAgICAgICAgLnBpbGwtY29nLWJ0biB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTNweDtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMsIGNvbG9yIDAuMTVzLCB0cmFuc2Zvcm0gMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtY29nLWJ0bi5hY3RpdmUge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcbiAgICAgICAgICBjb2xvcjogIzNlYTZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZ1bGwgaGVpZ2h0IGJ1dHRvbnMgd2l0aCBOTyBjdXJ2YXR1cmUgKGJvcmRlci1yYWRpdXM6IDApLCBvdXRsaW5lZCBvbmx5ICovXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4ge1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgcGFkZGluZzogMCAxNHB4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA2cHg7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1wcmltYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzI5ODllNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWNvbnRpbnVlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjU5ZTBiO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1jb250aW51ZTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Q5NzcwNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLXZpZXctZmlsZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzEwYjk4MTtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tdmlldy1maWxlOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMDU5NjY5O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tZGFuZ2VyIHtcbiAgICAgICAgICBjb2xvcjogI2Y4NzE3MTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWRhbmdlcjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNDgsIDExMywgMTEzLCAwLjIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tbW9kZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y1OWUwYjtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAqL1xuICAgICAgICAucGlsbC1jb25maXJtLWJhciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNSwgMjUsIDI1LCAwLjk4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvbmZpcm0tdGV4dCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGNvbG9yOiAjZjU5ZTBiO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdGF0dXMgJiBJbWFnZSBEaW1lbnNpb25zIFNlY3Rpb24gKi9cbiAgICAgICAgLnBpbGwtc3RhdHVzLXNlY3Rpb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgbWluLXdpZHRoOiAxNzBweDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTgpO1xuICAgICAgICAgIGdhcDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBtYXgtd2lkdGg6IDIyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQud2FybmluZyB7XG4gICAgICAgICAgY29sb3I6ICNmNTllMGI7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5lcnJvciB7XG4gICAgICAgICAgY29sb3I6ICNlZjQ0NDQ7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5jb21wbGV0ZSB7XG4gICAgICAgICAgY29sb3I6ICMxMGI5ODE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTbWFsbCBncmV5IGltYWdlIGRpbWVuc2lvbnMgKi9cbiAgICAgICAgLnBpbGwtZGltZW5zaW9ucy10ZXh0IHtcbiAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgY29sb3I6ICM4ODg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtcHJvZ3Jlc3MtdHJhY2sge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogM3B4O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1wcm9ncmVzcy1maWxsIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgd2lkdGg6IDAlO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMzZWE2ZmY7XG4gICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmlnaHQgU2lkZSBDb3VudGVyICgwLzUxNSBwYWdlcykgKi9cbiAgICAgICAgLnBpbGwtY291bnRlci1ib3gge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogW3hdIENsb3NlL1NocmluayBCdXR0b24gKi9cbiAgICAgICAgLnBpbGwtY2xvc2UtYnRuIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGNvbG9yOiAjODg4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNsb3NlLWJ0bjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5ICovXG4gICAgICAgIC5waWxsLXNldHRpbmdzLXBhbmVsIHtcbiAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE0LCAxNCwgMTQsIDAuOTgpO1xuICAgICAgICAgIHBhZGRpbmc6IDEycHggMTZweDtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmdzLWhlYWRlciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIHBhZGRpbmctYm90dG9tOiA2cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy10aXRsZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xuICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludC5zaG93IHtcbiAgICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3MtZ3JpZCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cgbGFiZWwge1xuICAgICAgICAgIGNvbG9yOiAjYWFhO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLXJvdy1oYWxmIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgICAgICAgIGdhcDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctcm93LWhhbGYgPiBkaXYge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctaW5wdXQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyNDI0MjQ7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBwYWRkaW5nOiA1cHggOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAwLjE1cztcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIG1heC13aWR0aDogMjYwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWlucHV0OmZvY3VzIHtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICMzZWE2ZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy1mb290ZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWJ0biB7XG4gICAgICAgICAgcGFkZGluZzogNXB4IDEycHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNjY2M7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMTVzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctYnRuLmJ0bi1zYXZlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG4uYnRuLXNhdmU6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyOTg5ZTY7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG5cbiAgICAgIDwhLS0gRG9ja2VkIFNtYWxsIEljb24gKFZpc2libGUgd2hlbiBtaW5pbWl6ZWQgdG8gZmFyIGxlZnQpIC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtZG9jay1pY29uXCIgaWQ9XCJwaWxsRG9ja0ljb25cIiB0aXRsZT1cIk9wZW4gQXJjaGl2ZSBEb3dubG9hZGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPVwiJHtjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ljb25zL2ljb240OC5wbmcnKX1cIiBhbHQ9XCJBcmNoaXZlIERvd25sb2FkZXJcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gTWFpbiBCb2R5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtbWFpbi1ib2R5XCI+XG4gICAgICAgIDwhLS0gQ29nIHNldHRpbmdzIGJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtY29nLWJ0blwiIGlkPVwicGlsbENvZ0J0blwiIHRpdGxlPVwiRWRpdCBTZXR0aW5ncyAoU2F2ZSBwYXRoLCBwYXR0ZXJuLCBwYWdlcylcIj7impk8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtY29uZmlybS1iYXJcIiBpZD1cInBpbGxDb25maXJtQmFyXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGlsbC1jb25maXJtLXRleHRcIiBpZD1cInBpbGxDb25maXJtVGV4dFwiPlNhdmUgY2FwdHVyZWQgcGFnZXM/PC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXZpZXctZmlsZVwiIGlkPVwicGlsbENvbmZpcm1TYXZlQnRuXCI+4pyUIFllcywgU2F2ZSBGaWxlczwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLWRhbmdlclwiIGlkPVwicGlsbENvbmZpcm1EaXNjYXJkQnRuXCI+RGlzY2FyZDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxDb25maXJtQ2FuY2VsQnRuXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gU3RhcnQgRG93bmxvYWQgQnV0dG9uIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1wcmltYXJ5XCIgaWQ9XCJwaWxsU3RhcnRCdG5cIj5cbiAgICAgICAgICDilrYgU3RhcnQgRG93bmxvYWRcbiAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgPCEtLSBDb250aW51ZSBCdXR0b24gKHdoZW4gc3RhbGxlZCAvIG9mZmxpbmUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1jb250aW51ZVwiIGlkPVwicGlsbENvbnRpbnVlQnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIOKWtiBDT05USU5VRVxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIFZpZXcgRmlsZSBCdXR0b24gKHdoZW4gY29tcGxldGUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi12aWV3LWZpbGVcIiBpZD1cInBpbGxWaWV3RmlsZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinJQgVmlldyBGaWxlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gRHluYW1pYyBDb250cm9scyAoYWN0aXZlIGR1cmluZyBkb3dubG9hZCkgLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxQYXVzZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinZrinZogUGF1c2VcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXByaW1hcnlcIiBpZD1cInBpbGxSZXN1bWVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAg4pa2IFJlc3VtZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tZGFuZ2VyXCIgaWQ9XCJwaWxsU3RvcEJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDil7wgU3RvcFxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIDEtUGFnZSBNb2RlIEJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tbW9kZVwiIGlkPVwicGlsbE1vZGVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgdGl0bGU9XCJTd2l0Y2ggdG8gMS1QYWdlIFZpZXdcIj5cbiAgICAgICAgICDimqEgMS1QYWdlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gU3RhdHVzICYgSW1hZ2UgRGltZW5zaW9ucyAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc3RhdHVzLXNlY3Rpb25cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc3RhdHVzLXRleHRcIiBpZD1cInBpbGxTdGF0dXNUZXh0XCI+UmVhZHk8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJwaWxsLWRpbWVuc2lvbnMtdGV4dFwiIGlkPVwicGlsbERpbWVuc2lvbnNUZXh0XCI+KGltYWdlOiAtIHggLSk8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtcHJvZ3Jlc3MtdHJhY2tcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXByb2dyZXNzLWZpbGxcIiBpZD1cInBpbGxQcm9ncmVzc0ZpbGxcIj48L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBSaWdodCBTaWRlIENvdW50ZXI6IDAvNTE1IHBhZ2VzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1jb3VudGVyLWJveFwiIGlkPVwicGlsbENvdW50ZXJcIj5cbiAgICAgICAgICAwLzAgcGFnZXNcbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBbeF0gU2hyaW5rIHRvIExlZnQgU2lkZSBCdXR0b24gLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWNsb3NlLWJ0blwiIGlkPVwicGlsbENsb3NlQnRuXCIgdGl0bGU9XCJTaHJpbmsgdG8gbGVmdCBlZGdlIG9mIHNjcmVlblwiPuKclTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtcGFuZWxcIiBpZD1cInBpbGxTZXR0aW5nc1BhbmVsXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtdGl0bGVcIj7impkgRG93bmxvYWRlciBTZXR0aW5nczwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludFwiIGlkPVwicGlsbFNldHRpbmdzU2F2ZWRIaW50XCI+U2F2ZWQgdG8gbG9jYWxTdG9yYWdlPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtZ3JpZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXNldHRpbmctcm93XCI+XG4gICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdTYXZlUGF0aFwiPlNhdmUgU3ViZGlyZWN0b3J5OjwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInBpbGxTZXR0aW5nU2F2ZVBhdGhcIiBjbGFzcz1cInBpbGwtc2V0dGluZy1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiQXJjaGl2ZUJvb2tzXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvd1wiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInBpbGxTZXR0aW5nUGF0dGVyblwiPkZvbGRlciBQYXR0ZXJuOjwvbGFiZWw+XG4gICAgICAgICAgICA8c2VsZWN0IGlkPVwicGlsbFNldHRpbmdQYXR0ZXJuXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInt0aXRsZX1fe2lkfVwiPnt0aXRsZX1fe2lkfTwvb3B0aW9uPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwie3RpdGxlfVwiPnt0aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIntpZH1cIj57aWR9PC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvdyBwaWxsLXNldHRpbmctcm93LWhhbGZcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ1N0YXJ0UGFnZVwiPlN0YXJ0IFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nU3RhcnRQYWdlXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgdmFsdWU9XCIwXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdFbmRQYWdlXCI+RW5kIFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nRW5kUGFnZVwiIGNsYXNzPVwicGlsbC1zZXR0aW5nLWlucHV0XCIgbWluPVwiMFwiIHBsYWNlaG9sZGVyPVwiQWxsXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZy1yb3dcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ01heEhlaWdodFwiPk1heCBQYWdlIEhlaWdodDo8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nTWF4SGVpZ2h0XCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgc3RlcD1cIjUwXCIgcGxhY2Vob2xkZXI9XCJlLmcuIDEwMDAgKDAgPSBmdWxsKVwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1mb290ZXJcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1zZXR0aW5nLWJ0biBidG4tc2F2ZVwiIGlkPVwicGlsbFNldHRpbmdTYXZlQnRuXCI+8J+SviBTYXZlIFNldHRpbmdzPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtc2V0dGluZy1idG4gYnRuLWNsb3NlXCIgaWQ9XCJwaWxsU2V0dGluZ0Nsb3NlQnRuXCI+Q2xvc2U8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwaWxsKTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHBpbGw7XG5cbiAgICAvLyBBdHRhY2ggY2FsbGJhY2tzXG4gICAgY29uc3Qgc3RhcnRCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RhcnRCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzdGFydEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0YXJ0Py4oKSk7XG5cbiAgICBjb25zdCBjb250aW51ZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnRpbnVlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uUmVzdW1lPy4oKSk7XG5cbiAgICBjb25zdCB2aWV3RmlsZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHZpZXdGaWxlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uVmlld0ZpbGU/LigpKTtcblxuICAgIGNvbnN0IHBhdXNlQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFBhdXNlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcGF1c2VCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25QYXVzZT8uKCkpO1xuXG4gICAgY29uc3QgcmVzdW1lQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFJlc3VtZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHJlc3VtZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblJlc3VtZT8uKCkpO1xuXG4gICAgY29uc3Qgc3RvcEJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTdG9wQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgc3RvcEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0b3A/LigpKTtcblxuICAgIGNvbnN0IG1vZGVCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsTW9kZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIG1vZGVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25Td2l0Y2hNb2RlPy4oKSk7XG5cbiAgICAvLyBDb2cgYnV0dG9uIHRvIHRvZ2dsZSBzZXR0aW5ncyB0cmF5XG4gICAgY29uc3QgY29nQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvZ0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKCkpO1xuXG4gICAgLy8gU2F2ZSBTZXR0aW5ncyBidXR0b25cbiAgICBjb25zdCBzYXZlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1NhdmVCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzYXZlU2V0dGluZ3NCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZVBhdGhJbnB1dCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU2F2ZVBhdGgnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nUGF0dGVybicpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgY29uc3Qgc3RhcnRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1N0YXJ0UGFnZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0VuZFBhZ2UnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgbWF4SGVpZ2h0SW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICAgIGNvbnN0IGJhc2VEaXIgPSBzYXZlUGF0aElucHV0Py52YWx1ZS50cmltKCkgfHwgJ0FyY2hpdmVCb29rcyc7XG4gICAgICBjb25zdCBmb2xkZXJQYXR0ZXJuID0gcGF0dGVyblNlbGVjdD8udmFsdWUgfHwgJ3t0aXRsZX1fe2lkfSc7XG4gICAgICBjb25zdCBzdGFydFBhZ2UgPSBzdGFydFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoc3RhcnRQYWdlSW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuICAgICAgY29uc3QgZW5kUGFnZSA9IGVuZFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoZW5kUGFnZUlucHV0LnZhbHVlLCAxMCkpIDogMDtcbiAgICAgIGNvbnN0IG1heFBhZ2VIZWlnaHQgPSBtYXhIZWlnaHRJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobWF4SGVpZ2h0SW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblNhdmVTZXR0aW5ncz8uKHtcbiAgICAgICAgYmFzZURpcixcbiAgICAgICAgZm9sZGVyUGF0dGVybixcbiAgICAgICAgc3RhcnRQYWdlLFxuICAgICAgICBlbmRQYWdlLFxuICAgICAgICBtYXhQYWdlSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGhpbnQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ3NTYXZlZEhpbnQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmIChoaW50KSB7XG4gICAgICAgIGhpbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGhpbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpLCAyNTAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3NlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0Nsb3NlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY2xvc2VTZXR0aW5nc0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKSk7XG5cbiAgICAvLyBbeF0gY2xvc2UvZG9jayBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDbG9zZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNsb3NlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuZG9ja1RvTGVmdCgpKTtcblxuICAgIC8vIERvY2tlZCBpY29uIGNsaWNrIHRvIGV4cGFuZFxuICAgIGNvbnN0IGRvY2tJY29uID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbERvY2tJY29uJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgZG9ja0ljb24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy51bmRvY2tGcm9tTGVmdCgpKTtcblxuICAgIC8vIFBvcHVsYXRlIGluaXRpYWwgaW5wdXRzIGlmIGNvbmZpZyBleGlzdHNcbiAgICB0aGlzLnNldENvbmZpZyh0aGlzLmN1cnJlbnRDb25maWcpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZVNldHRpbmdzKG9wZW4/OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMuaXNTZXR0aW5nc09wZW4gPSB0eXBlb2Ygb3BlbiA9PT0gJ2Jvb2xlYW4nID8gb3BlbiA6ICF0aGlzLmlzU2V0dGluZ3NPcGVuO1xuXG4gICAgY29uc3QgcGFuZWwgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdzUGFuZWwnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb2dCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBhbmVsKSB7XG4gICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gdGhpcy5pc1NldHRpbmdzT3BlbiA/ICdmbGV4JyA6ICdub25lJztcbiAgICB9XG4gICAgaWYgKGNvZ0J0bikge1xuICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc09wZW4pIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRDb25maWcoY2ZnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50Q29uZmlnID0geyAuLi50aGlzLmN1cnJlbnRDb25maWcsIC4uLmNmZyB9O1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHNhdmVQYXRoSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdTYXZlUGF0aCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKHNhdmVQYXRoSW5wdXQgJiYgY2ZnLmJhc2VEaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2F2ZVBhdGhJbnB1dC52YWx1ZSA9IGNmZy5iYXNlRGlyO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdHRlcm5TZWxlY3QgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdQYXR0ZXJuJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgaWYgKHBhdHRlcm5TZWxlY3QgJiYgY2ZnLmZvbGRlclBhdHRlcm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IGNmZy5mb2xkZXJQYXR0ZXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0UGFnZUlucHV0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU3RhcnRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoc3RhcnRQYWdlSW5wdXQgJiYgY2ZnLnN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdGFydFBhZ2VJbnB1dC52YWx1ZSA9IFN0cmluZyhjZmcuc3RhcnRQYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdFbmRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoZW5kUGFnZUlucHV0ICYmIGNmZy5lbmRQYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZFBhZ2VJbnB1dC52YWx1ZSA9IGNmZy5lbmRQYWdlID4gMCA/IFN0cmluZyhjZmcuZW5kUGFnZSkgOiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBtYXhIZWlnaHRJbnB1dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKG1heEhlaWdodElucHV0ICYmIGNmZy5tYXhQYWdlSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1heEhlaWdodElucHV0LnZhbHVlID0gY2ZnLm1heFBhZ2VIZWlnaHQgPiAwID8gU3RyaW5nKGNmZy5tYXhQYWdlSGVpZ2h0KSA6ICcnO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzaG93U3RvcFByb21wdChcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG9uU2F2ZTogKCkgPT4gdm9pZCxcbiAgICBvbkRpc2NhcmQ6ICgpID0+IHZvaWQsXG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgY3VzdG9tTWVzc2FnZT86IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gdHJ1ZTtcblxuICAgIGNvbnN0IGNvbmZpcm1CYXIgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb25maXJtVGV4dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ29uZmlybVRleHQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBzYXZlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtU2F2ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnN0IGRpc2NhcmRCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1EaXNjYXJkQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtQ2FuY2VsQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIG5vcm1hbCBidXR0b25zIGFuZCBzdGF0dXMgd2hpbGUgY29uZmlybWluZ1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUoZmFsc2UpO1xuXG4gICAgaWYgKGNvbmZpcm1UZXh0KSB7XG4gICAgICBjb25maXJtVGV4dC50ZXh0Q29udGVudCA9IGN1c3RvbU1lc3NhZ2UgfHwgYFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2A7XG4gICAgfVxuICAgIGlmIChjb25maXJtQmFyKSB7XG4gICAgICBjb25maXJtQmFyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgIHRoaXMuaXNDb25maXJtaW5nU3RvcCA9IGZhbHNlO1xuICAgICAgaWYgKGNvbmZpcm1CYXIpIGNvbmZpcm1CYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNsZWFudXAoKTtcbiAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICBkaXNjYXJkQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkRpc2NhcmQoKTtcbiAgICB9O1xuXG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkNhbmNlbCgpO1xuICAgIH07XG4gIH1cblxuICBwdWJsaWMgaGlkZVN0b3BQcm9tcHQoKTogdm9pZCB7XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gZmFsc2U7XG4gICAgY29uc3QgY29uZmlybUJhciA9IHRoaXMuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY29uZmlybUJhcikgY29uZmlybUJhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIHNldFN0YW5kYXJkQ29udHJvbHNWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICAgICcjcGlsbFN0YXJ0QnRuLCAjcGlsbENvbnRpbnVlQnRuLCAjcGlsbFZpZXdGaWxlQnRuLCAjcGlsbFBhdXNlQnRuLCAjcGlsbFJlc3VtZUJ0biwgI3BpbGxTdG9wQnRuLCAjcGlsbE1vZGVCdG4sIC5waWxsLXN0YXR1cy1zZWN0aW9uLCAjcGlsbENvdW50ZXInXG4gICAgKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyAnJyA6ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkb2NrVG9MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gdHJ1ZTtcbiAgICB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdkb2NrZWQtbGVmdCcpO1xuICB9XG5cbiAgcHVibGljIHVuZG9ja0Zyb21MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnZG9ja2VkLWxlZnQnKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVQcm9ncmVzcyhcbiAgICBjdXJyZW50UGFnZTogbnVtYmVyLFxuICAgIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgICBzdGF0dXNUZXh0OiBzdHJpbmcsXG4gICAgc3RhdHVzVHlwZTogc3RyaW5nID0gJ25vcm1hbCcsXG4gICAgaXNQYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIgPSAxLFxuICAgIGltYWdlRGltZW5zaW9ucz86IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDb25maXJtaW5nU3RvcCkgcmV0dXJuOyAvLyBEbyBub3Qgb3ZlcndyaXRlIGNvbmZpcm1hdGlvbiBwcm9tcHRcblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGFydEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGNvbnRpbnVlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHZpZXdGaWxlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBhdXNlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxQYXVzZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHJlc3VtZUJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUmVzdW1lQnRuJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RvcEJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RvcEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IG1vZGVCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbE1vZGVCdG4nKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIGNvbnN0IGNvdW50ZXJFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ291bnRlcicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGZpbGxFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUHJvZ3Jlc3NGaWxsJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RhdHVzVGV4dEVsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGF0dXNUZXh0JykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgZGltZW5zaW9uc0VsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxEaW1lbnNpb25zVGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gMS1wYWdlIHN3aXRjaCBidXR0b25cbiAgICBpZiAobW9kZUJ0bikge1xuICAgICAgbW9kZUJ0bi5zdHlsZS5kaXNwbGF5ID0gY3VycmVudE1vZGUgIT09IDEgJiYgIWlzQWN0aXZlID8gJ2ZsZXgnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIFJpZ2h0IFNpZGUgQ291bnRlclxuICAgIGlmIChjb3VudGVyRWwpIHtcbiAgICAgIGlmICh0b3RhbFBhZ2VzID4gMCkge1xuICAgICAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgUGFnZSAke2N1cnJlbnRQYWdlfS8ke3RvdGFsUGFnZXN9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgMC8ke3RvdGFsUGFnZXN9IHBhZ2VzYDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY291bnRlckVsLnRleHRDb250ZW50ID0gJ0RldGVjdGluZyBwYWdlcy4uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvZ3Jlc3MgYmFyIGZpbGxcbiAgICBpZiAoZmlsbEVsICYmIHRvdGFsUGFnZXMgPiAwKSB7XG4gICAgICBjb25zdCBwY3QgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQoKChjdXJyZW50UGFnZSArIDEpIC8gdG90YWxQYWdlcykgKiAxMDApKTtcbiAgICAgIGZpbGxFbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgICB9XG5cbiAgICAvLyBTdGF0dXMgdGV4dCAmIGNsYXNzXG4gICAgaWYgKHN0YXR1c1RleHRFbCkge1xuICAgICAgc3RhdHVzVGV4dEVsLnRleHRDb250ZW50ID0gc3RhdHVzVGV4dDtcbiAgICAgIHN0YXR1c1RleHRFbC5jbGFzc05hbWUgPSBgcGlsbC1zdGF0dXMtdGV4dCAke3N0YXR1c1R5cGV9YDtcbiAgICB9XG5cbiAgICAvLyBJbWFnZSBEaW1lbnNpb25zOiAoaW1hZ2U6IDI1ODAgeCAzOTE1KVxuICAgIGlmIChkaW1lbnNpb25zRWwpIHtcbiAgICAgIGlmIChpbWFnZURpbWVuc2lvbnMgJiYgaW1hZ2VEaW1lbnNpb25zLndpZHRoID4gMCAmJiBpbWFnZURpbWVuc2lvbnMuaGVpZ2h0ID4gMCkge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAke2ltYWdlRGltZW5zaW9ucy53aWR0aH0geCAke2ltYWdlRGltZW5zaW9ucy5oZWlnaHR9KWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAtIHggLSlgO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJ1dHRvbnMgVmlzaWJpbGl0eVxuICAgIHN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29udGludWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB2aWV3RmlsZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmVzdW1lQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgaWYgKHN0YXR1c1R5cGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIC8vIENvbXBsZXRlZDogc2hvdyBcIkRvd25sb2FkZWQ6IFZpZXcgRmlsZXNcIlxuICAgICAgdmlld0ZpbGVCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9IGVsc2UgaWYgKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyB8fCBzdGF0dXNUeXBlID09PSAnb2ZmbGluZScgfHwgKGlzUGF1c2VkICYmIHN0YXR1c1R5cGUgPT09ICdyZXRyeWluZycpKSB7XG4gICAgICAvLyBTdGFsbGVkIC8gb2ZmbGluZSAvIG1heCByZXRyaWVzIGhpdDogc2hvdyBDT05USU5VRSArIFN0b3BcbiAgICAgIGNvbnRpbnVlQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfSBlbHNlIGlmIChpc0FjdGl2ZSkge1xuICAgICAgLy8gQ3VycmVudGx5IGFjdGl2ZVxuICAgICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICAgIHJlc3VtZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWRsZVxuICAgICAgc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgdGhpcy5jb250YWluZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwKICAgICIvKipcbiAqIFV0aWxpdGllcyBmb3IgZXh0cmFjdGluZyBPQ1IgdGV4dCBmcm9tIERKVlUgWE1MIGFuZCBjb21waWxpbmcgTWFya2Rvd24gZG9jdW1lbnRzXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlVGV4dEVudHJ5IHtcbiAgcGFnZU51bTogbnVtYmVyO1xuICBsZWFmSW5kZXg6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tNZXRhZGF0YSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvb2tJZDogc3RyaW5nO1xuICBhdXRob3I/OiBzdHJpbmc7XG4gIHB1Ymxpc2hlcj86IHN0cmluZztcbiAgeWVhcj86IHN0cmluZztcbiAgc291cmNlVXJsPzogc3RyaW5nO1xuICB0b3RhbFBhZ2VzPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFN0cmlwcyBESlZVIFhNTCBpbnRvIGNsZWFuLCBzdHJ1Y3R1cmVkIHBsYWluIHRleHQgZm9yIGEgc2luZ2xlIHBhZ2UuXG4gKiBSb2J1c3RseSBwYXJzZXMgUEFSQUdSQVBILCBMSU5FLCBhbmQgV09SRCBlbGVtZW50cy5cbiAqIFdvcmtzIHNlYW1sZXNzbHkgaW4gYm90aCBicm93c2VyIGFuZCBOb2RlL0J1biB0ZXN0IGVudmlyb25tZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGp2dVhtbFRvVGV4dCh4bWxTdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgheG1sU3RyaW5nIHx8IHR5cGVvZiB4bWxTdHJpbmcgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgLy8gRXh0cmFjdCBhbGwgUEFSQUdSQVBIIGJsb2Nrc1xuICBjb25zdCBwYXJhZ3JhcGhNYXRjaGVzID0geG1sU3RyaW5nLm1hdGNoKC88UEFSQUdSQVBIW1xcc1xcU10qPzxcXC9QQVJBR1JBUEg+L2dpKTtcbiAgaWYgKCFwYXJhZ3JhcGhNYXRjaGVzIHx8IHBhcmFncmFwaE1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gSWYgbm8gUEFSQUdSQVBIIHRhZ3MsIHRyeSBleHRyYWN0aW5nIHdvcmRzIGRpcmVjdGx5XG4gICAgY29uc3Qgd29yZHMgPSBBcnJheS5mcm9tKHhtbFN0cmluZy5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKVxuICAgICAgLm1hcChtID0+IGRlY29kZVhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgcmV0dXJuIHdvcmRzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIGNvbnN0IHBhcmFncmFwaHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBwYXJCbG9jayBvZiBwYXJhZ3JhcGhNYXRjaGVzKSB7XG4gICAgLy8gRXh0cmFjdCBhbGwgTElORSBibG9ja3MgaW5zaWRlIHRoaXMgUEFSQUdSQVBIXG4gICAgY29uc3QgbGluZU1hdGNoZXMgPSBwYXJCbG9jay5tYXRjaCgvPExJTkVbXFxzXFxTXSo/PFxcL0xJTkU+L2dpKTtcbiAgICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChsaW5lTWF0Y2hlcyAmJiBsaW5lTWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGxpbmVCbG9jayBvZiBsaW5lTWF0Y2hlcykge1xuICAgICAgICAvLyBFeHRyYWN0IGFsbCBXT1JEIGNvbnRlbnRzIGluc2lkZSB0aGlzIExJTkVcbiAgICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKGxpbmVCbG9jay5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKTtcbiAgICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAgIC5tYXAobSA9PiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobVsxXS50cmltKCkpKVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsaW5lcy5wdXNoKHdvcmRzLmpvaW4oJyAnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRmFsbGJhY2s6IHdvcmRzIGRpcmVjdGx5IGluIHBhcmFncmFwaFxuICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKHBhckJsb2NrLm1hdGNoQWxsKC88V09SRFtePl0qPihbXFxzXFxTXSo/KTxcXC9XT1JEPi9naSkpO1xuICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAubWFwKG0gPT4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCh3b3Jkcy5qb2luKCcgJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhZ3JhcGhzLnB1c2goZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKGxpbmVzLmpvaW4oJ1xcbicpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gZGVjb2RlIGFsbCBIVE1MIGFuZCBYTUwgZW50aXRpZXMgaW50byBwcm9wZXIgVVRGLTggY2hhcmFjdGVycy5cbiAqIEhhbmRsZXMgbnVtZXJpYyBkZWNpbWFsIChlLmcuICYjODIxMjsgLT4g4oCUKSwgaGV4ICgmI3gyMDE0OyksIGFuZCBuYW1lZCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXRleHQgfHwgdHlwZW9mIHRleHQgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgcmV0dXJuIHRleHRcbiAgICAvLyAxLiBEZWNpbWFsIG51bWVyaWMgZW50aXRpZXM6ICYjODIxMjsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiMoXFxkKyk7L2csIChfLCBkZWMpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChkZWMsIDEwKTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMi4gSGV4YWRlY2ltYWwgbnVtZXJpYyBlbnRpdGllczogJiN4MjAxNDsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiN4KFswLTlhLWZBLUZdKyk7L2csIChfLCBoZXgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChoZXgsIDE2KTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMy4gTmFtZWQgZW50aXRpZXNcbiAgICAucmVwbGFjZSgvJm1kYXNoOy9nLCAn4oCUJylcbiAgICAucmVwbGFjZSgvJm5kYXNoOy9nLCAn4oCTJylcbiAgICAucmVwbGFjZSgvJmhlbGxpcDsvZywgJ+KApicpXG4gICAgLnJlcGxhY2UoLyZsc3F1bzsvZywgJ+KAmCcpXG4gICAgLnJlcGxhY2UoLyZyc3F1bzsvZywgJ+KAmScpXG4gICAgLnJlcGxhY2UoLyZsZHF1bzsvZywgJ+KAnCcpXG4gICAgLnJlcGxhY2UoLyZyZHF1bzsvZywgJ+KAnScpXG4gICAgLnJlcGxhY2UoLyZuYnNwOy9nLCAnICcpXG4gICAgLnJlcGxhY2UoLyZidWxsOy9nLCAn4oCiJylcbiAgICAucmVwbGFjZSgvJmNlbnQ7L2csICfCoicpXG4gICAgLnJlcGxhY2UoLyZwb3VuZDsvZywgJ8KjJylcbiAgICAucmVwbGFjZSgvJnllbjsvZywgJ8KlJylcbiAgICAucmVwbGFjZSgvJmV1cm87L2csICfigqwnKVxuICAgIC5yZXBsYWNlKC8mY29weTsvZywgJ8KpJylcbiAgICAucmVwbGFjZSgvJnJlZzsvZywgJ8KuJylcbiAgICAucmVwbGFjZSgvJmRlZzsvZywgJ8KwJylcbiAgICAucmVwbGFjZSgvJnBsdXNtbjsvZywgJ8KxJylcbiAgICAucmVwbGFjZSgvJnRpbWVzOy9nLCAnw5cnKVxuICAgIC5yZXBsYWNlKC8mZGl2aWRlOy9nLCAnw7cnKVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAucmVwbGFjZSgvJmFwb3M7L2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7IC8vIGRlY29kZSAmYW1wOyBsYXN0XG59XG5cbi8qKlxuICogU3RyaXBzIEhhdGhpVHJ1c3QgPGZpZ2NhcHRpb24+IG1hcmt1cCBpbnRvIGNsZWFuLCBmb3JtYXR0ZWQgTWFya2Rvd24vdGV4dC5cbiAqIEhhbmRsZXMgYm90aCBET00gRWxlbWVudCBpbnB1dHMgKGluIGJyb3dzZXIpIGFuZCByYXcgSFRNTCBzdHJpbmdzIChpbiB0ZXN0cykuXG4gKiBFeHRyYWN0cyB3b3JkIHNwYW5zLCBwcmVzZXJ2ZXMgcGFyYWdyYXBoIGJyZWFrcywgYW5kIGRlY29kZXMgSFRNTCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGlucHV0OiBzdHJpbmcgfCBhbnkpOiBzdHJpbmcge1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG5cbiAgLy8gSWYgRE9NIEVsZW1lbnQgaW4gYnJvd3NlciBlbnZpcm9ubWVudFxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0JyAmJiBpbnB1dC5ub2RlVHlwZSkge1xuICAgIGNvbnN0IGVsID0gaW5wdXQgYXMgRWxlbWVudDtcbiAgICBjb25zdCBwRWxlbWVudHMgPSBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ3AsIC5vY3JfcGFyJykpO1xuXG4gICAgaWYgKHBFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwYXJhZ3JhcGhzID0gcEVsZW1lbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKHAucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCwgLm9jcl9saW5lJykpO1xuICAgICAgICBpZiAoc3BhbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBzcGFuc1xuICAgICAgICAgICAgLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyA8cD4gdGFncywgY2hlY2sgZm9yIGxpbmUgZWxlbWVudHNcbiAgICBjb25zdCBsaW5lcyA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnLm9jcl9saW5lLCBkaXYnKSk7XG4gICAgaWYgKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxpbmVUZXh0cyA9IGxpbmVzLm1hcChsaW5lID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKGxpbmUucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCcpKTtcbiAgICAgICAgaWYgKHNwYW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGxpbmUudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobGluZVRleHRzLmpvaW4oJ1xcbicpKTtcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjazogZXh0cmFjdCBhbGwgc3BhbnMgb3IgdGV4dCBkaXJlY3RseVxuICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShlbC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xuICAgIGlmIChzcGFucy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXModGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcygoZWwudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9bIFxcdF0rL2csICcgJykpO1xuICB9XG5cbiAgLy8gSWYgaW5wdXQgaXMgYW4gSFRNTCBzdHJpbmdcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICBsZXQgY2xlYW4gPSBpbnB1dDtcblxuICAgIC8vIENoZWNrIGZvciA8cD4gb3IgPGRpdiBjbGFzcz1cIm9jcl9wYXJcIj4gcGFyYWdyYXBoc1xuICAgIGNvbnN0IHBNYXRjaGVzID0gY2xlYW4ubWF0Y2goLzwoPzpwfGRpdiBjbGFzcz1cIm9jcl9wYXJcIilbXj5dKj4oW1xcc1xcU10qPyk8XFwvKD86cHxkaXYpPi9naSk7XG4gICAgaWYgKHBNYXRjaGVzICYmIHBNYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHBhcmFncmFwaHMgPSBwTWF0Y2hlcy5tYXAocEJsb2NrID0+IHtcbiAgICAgICAgcmV0dXJuIHBCbG9ja1xuICAgICAgICAgIC5yZXBsYWNlKC88YnJcXHMqXFwvPz4vZ2ksICdcXG4nKVxuICAgICAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgICAgICAucmVwbGFjZSgvWyBcXHRcXHJcXG5dKy9nLCAnICcpXG4gICAgICAgICAgLnRyaW0oKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2Ugc3RyaXAgdGFncywgcHJlc2VydmluZyA8YnI+IGFzIGxpbmUgYnJlYWtzXG4gICAgY29uc3QgdGV4dCA9IGNsZWFuXG4gICAgICAucmVwbGFjZSgvPGJyXFxzKlxcLz8+L2dpLCAnXFxuJylcbiAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF0rL2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9cXG5cXHMqXFxuKy9nLCAnXFxuXFxuJylcbiAgICAgIC50cmltKCk7XG5cbiAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIEFzc2VtYmxlcyBtdWx0aXBsZSBwYWdlIHRleHRzIGFuZCBib29rIG1ldGFkYXRhIGludG8gYSBjbGVhbiwgY29tcGxldGUgTWFya2Rvd24gZG9jdW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEJvb2tNYXJrZG93bihcbiAgbWV0YWRhdGE6IEJvb2tNZXRhZGF0YSxcbiAgcGFnZXM6IFBhZ2VUZXh0RW50cnlbXVxuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gVGl0bGUgYW5kIEhlYWRlclxuICBwYXJ0cy5wdXNoKGAjICR7bWV0YWRhdGEudGl0bGUgfHwgJ1VudGl0bGVkIEJvb2snfVxcbmApO1xuXG4gIGNvbnN0IG1ldGFMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKG1ldGFkYXRhLmF1dGhvcikgbWV0YUxpbmVzLnB1c2goYC0gKipBdXRob3I6KiogJHttZXRhZGF0YS5hdXRob3J9YCk7XG4gIGlmIChtZXRhZGF0YS5wdWJsaXNoZXIpIG1ldGFMaW5lcy5wdXNoKGAtICoqUHVibGlzaGVyOioqICR7bWV0YWRhdGEucHVibGlzaGVyfWApO1xuICBpZiAobWV0YWRhdGEueWVhcikgbWV0YUxpbmVzLnB1c2goYC0gKipEYXRlOioqICR7bWV0YWRhdGEueWVhcn1gKTtcblxuICBpZiAobWV0YWRhdGEuYm9va0lkKSB7XG4gICAgaWYgKG1ldGFkYXRhLnNvdXJjZVVybCAmJiBtZXRhZGF0YS5zb3VyY2VVcmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykpIHtcbiAgICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqSGF0aGlUcnVzdCBJZGVudGlmaWVyOioqIFske21ldGFkYXRhLmJvb2tJZH1dKCR7bWV0YWRhdGEuc291cmNlVXJsfSlgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YUxpbmVzLnB1c2goYC0gKipJbnRlcm5ldCBBcmNoaXZlIElkZW50aWZpZXI6KiogWyR7bWV0YWRhdGEuYm9va0lkfV0oaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLyR7bWV0YWRhdGEuYm9va0lkfSlgKTtcbiAgICB9XG4gIH1cblxuICBpZiAobWV0YWRhdGEuc291cmNlVXJsICYmICFtZXRhTGluZXMuc29tZShsID0+IGwuaW5jbHVkZXMobWV0YWRhdGEuc291cmNlVXJsISkpKSB7XG4gICAgbWV0YUxpbmVzLnB1c2goYC0gKipTb3VyY2U6KiogJHttZXRhZGF0YS5zb3VyY2VVcmx9YCk7XG4gIH1cbiAgaWYgKG1ldGFkYXRhLnRvdGFsUGFnZXMpIG1ldGFMaW5lcy5wdXNoKGAtICoqVG90YWwgUGFnZXM6KiogJHttZXRhZGF0YS50b3RhbFBhZ2VzfWApO1xuXG4gIGlmIChtZXRhTGluZXMubGVuZ3RoID4gMCkge1xuICAgIHBhcnRzLnB1c2gobWV0YUxpbmVzLmpvaW4oJ1xcbicpKTtcbiAgICBwYXJ0cy5wdXNoKCdcXG4tLS1cXG4nKTtcbiAgfVxuXG4gIC8vIFNvcnQgcGFnZXMgYnkgcGFnZU51bVxuICBjb25zdCBzb3J0ZWQgPSBbLi4ucGFnZXNdLnNvcnQoKGEsIGIpID0+IGEucGFnZU51bSAtIGIucGFnZU51bSk7XG5cbiAgZm9yIChjb25zdCBwYWdlIG9mIHNvcnRlZCkge1xuICAgIHBhcnRzLnB1c2goYCMjIFBhZ2UgJHtwYWdlLnBhZ2VOdW19XFxuXFxuYCk7XG4gICAgaWYgKHBhZ2UudGV4dCAmJiBwYWdlLnRleHQudHJpbSgpKSB7XG4gICAgICBwYXJ0cy5wdXNoKGAke3BhZ2UudGV4dC50cmltKCl9XFxuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzLnB1c2goYCpbTm8gdGV4dCBvciBpbGx1c3RyYXRpb24gcGFnZV0qXFxuYCk7XG4gICAgfVxuICAgIHBhcnRzLnB1c2goJ1xcbi0tLVxcbicpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJ1xcbicpO1xufVxuXG4iLAogICAgIi8qKlxuICogRmFzdCwgcHVyZSBKYXZhU2NyaXB0IFBERiBjb21waWxlciBmb3IgZW1iZWRkaW5nIEpQRUcgcGFnZSBpbWFnZXMgaW50byBQREYgZG9jdW1lbnRzLlxuICogQ29uZm9ybXMgdG8gUERGIDEuNCBzcGVjaWZpY2F0aW9uLiBaZXJvIGV4dGVybmFsIGJpbmFyeSBkZXBlbmRlbmNpZXMuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBKcGVnSW5mbyB7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBjaGFubmVsczogbnVtYmVyO1xuICBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJztcbiAgYml0czogbnVtYmVyO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHdpZHRoLCBoZWlnaHQsIGFuZCBjb2xvciBzcGFjZSBkaXJlY3RseSBmcm9tIEpQRUcgaGVhZGVyIG1hcmtlcnMgKFNPRjAvU09GMikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRKcGVnSW5mbyhkYXRhOiBVaW50OEFycmF5KTogSnBlZ0luZm8ge1xuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG5cbiAgaWYgKHZpZXcuZ2V0VWludDE2KDApICE9PSAweGZmZDgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIHZhbGlkIEpQRUcgaW1hZ2UgKG1pc3NpbmcgU09JIG1hcmtlcikuJyk7XG4gIH1cblxuICBjb25zdCBTT0ZfTUFSS0VSUyA9IFtcbiAgICAweGZmYzAsIDB4ZmZjMSwgMHhmZmMyLCAweGZmYzMsIDB4ZmZjNSwgMHhmZmM2LCAweGZmYzcsIDB4ZmZjOSwgMHhmZmNhLFxuICAgIDB4ZmZjYiwgMHhmZmNkLCAweGZmY2UsIDB4ZmZjZixcbiAgXTtcblxuICBsZXQgcG9zID0gMjtcbiAgd2hpbGUgKHBvcyA8IGRhdGEubGVuZ3RoIC0gOCkge1xuICAgIGNvbnN0IG1hcmtlciA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgcG9zICs9IDI7XG5cbiAgICBpZiAoU09GX01BUktFUlMuaW5jbHVkZXMobWFya2VyKSkge1xuICAgICAgcG9zICs9IDI7IC8vIHNraXAgbGVuZ3RoXG4gICAgICBjb25zdCBiaXRzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG4gICAgICBjb25zdCBoZWlnaHQgPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb25zdCB3aWR0aCA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgICBwb3MgKz0gMjtcbiAgICAgIGNvbnN0IGNoYW5uZWxzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG5cbiAgICAgIGxldCBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJyA9ICdEZXZpY2VSR0InO1xuICAgICAgaWYgKGNoYW5uZWxzID09PSAxKSBjb2xvclNwYWNlID0gJ0RldmljZUdyYXknO1xuICAgICAgZWxzZSBpZiAoY2hhbm5lbHMgPT09IDQpIGNvbG9yU3BhY2UgPSAnRGV2aWNlQ01ZSyc7XG5cbiAgICAgIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIGNoYW5uZWxzLCBjb2xvclNwYWNlLCBiaXRzIH07XG4gICAgfVxuXG4gICAgY29uc3QgbGVuZ3RoID0gdmlldy5nZXRVaW50MTYocG9zKTtcbiAgICBwb3MgKz0gbGVuZ3RoO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBTT0YgbWFya2VyIGluIEpQRUcgc3RyZWFtLicpO1xufVxuXG4vKipcbiAqIEhlbHBlciB0byBjb252ZXJ0IEJhc2U2NCBEYXRhIFVSTCB0byBVaW50OEFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGF0YVVybFRvQnl0ZXMoZGF0YVVybDogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGNvbW1hSW5kZXggPSBkYXRhVXJsLmluZGV4T2YoJywnKTtcbiAgY29uc3QgYmFzZTY0ID0gY29tbWFJbmRleCA+PSAwID8gZGF0YVVybC5zbGljZShjb21tYUluZGV4ICsgMSkgOiBkYXRhVXJsO1xuICBjb25zdCBiaW5hcnlTdHJpbmcgPSBhdG9iKGJhc2U2NCk7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYmluYXJ5U3RyaW5nLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5U3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgYnl0ZXNbaV0gPSBiaW5hcnlTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gYnl0ZXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmSW1hZ2VJbnB1dCB7XG4gIHBhZ2VOdW06IG51bWJlcjtcbiAgZGF0YTogVWludDhBcnJheSB8IHN0cmluZzsgLy8gVWludDhBcnJheSBvciBEYXRhVVJMXG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBsaXN0IG9mIEpQRUcgaW1hZ2VzIGludG8gYSB2YWxpZCBQREYgZG9jdW1lbnQuXG4gKiBFbWJlZHMgcmF3IEpQRUcgc3RyZWFtcyBkaXJlY3RseSB3aXRob3V0IGRlY29tcHJlc3Npb24gb3IgcmUtZW5jb2RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSnBlZ3NUb1BkZihcbiAgaW1hZ2VzOiBQZGZJbWFnZUlucHV0W10sXG4gIG1ldGFkYXRhOiB7IHRpdGxlPzogc3RyaW5nOyBhdXRob3I/OiBzdHJpbmc7IGNyZWF0b3I/OiBzdHJpbmcgfSA9IHt9XG4pOiBVaW50OEFycmF5IHtcbiAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgUERGOiBObyBpbWFnZXMgcHJvdmlkZWQuJyk7XG4gIH1cblxuICBjb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICBjb25zdCBvZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgY3VycmVudE9mZnNldCA9IDA7XG5cbiAgZnVuY3Rpb24gd3JpdGUoYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICBjaHVua3MucHVzaChieXRlcyk7XG4gICAgY3VycmVudE9mZnNldCArPSBieXRlcy5sZW5ndGg7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZVN0cmluZyhzdHI6IHN0cmluZykge1xuICAgIHdyaXRlKHRleHRFbmNvZGVyLmVuY29kZShzdHIpKTtcbiAgfVxuXG4gIC8vIEhlYWRlclxuICB3cml0ZVN0cmluZygnJVBERi0xLjRcXG4lXFx4RTJcXHhFM1xceENGXFx4RDNcXG4nKTtcblxuICBsZXQgb2JqSWRDb3VudGVyID0gMTtcbiAgZnVuY3Rpb24gc3RhcnRPYmplY3QoKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZCA9IG9iaklkQ291bnRlcisrO1xuICAgIG9mZnNldHNbaWRdID0gY3VycmVudE9mZnNldDtcbiAgICB3cml0ZVN0cmluZyhgJHtpZH0gMCBvYmpcXG5gKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRPYmplY3QoKSB7XG4gICAgd3JpdGVTdHJpbmcoJ2VuZG9ialxcbicpO1xuICB9XG5cbiAgY29uc3QgdG90YWxQYWdlcyA9IGltYWdlcy5sZW5ndGg7XG5cbiAgLy8gUHJlLWNhbGN1bGF0ZSBPYmplY3QgSURzOlxuICAvLyAxOiBDYXRhbG9nXG4gIC8vIDI6IFBhZ2VzXG4gIC8vIDMgKyAoaSAqIDMpOiBQYWdlIG9iamVjdFxuICAvLyA0ICsgKGkgKiAzKTogQ29udGVudCBzdHJlYW1cbiAgLy8gNSArIChpICogMyk6IEltYWdlIFhPYmplY3RcbiAgY29uc3QgY2F0YWxvZ0lkID0gMTtcbiAgY29uc3QgcGFnZXNSb290SWQgPSAyO1xuICBjb25zdCBwYWdlSWRzOiBudW1iZXJbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsUGFnZXM7IGkrKykge1xuICAgIHBhZ2VJZHMucHVzaCgzICsgaSAqIDMpO1xuICB9XG5cbiAgLy8gMS4gQ2F0YWxvZ1xuICBzdGFydE9iamVjdCgpOyAvLyAxXG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL0NhdGFsb2dcXG4gIC9QYWdlcyAke3BhZ2VzUm9vdElkfSAwIFJcXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAyLiBQYWdlcyBSb290XG4gIHN0YXJ0T2JqZWN0KCk7IC8vIDJcbiAgY29uc3Qga2lkc1N0ciA9IHBhZ2VJZHMubWFwKGlkID0+IGAke2lkfSAwIFJgKS5qb2luKCcgJyk7XG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL1BhZ2VzXFxuICAvS2lkcyBbICR7a2lkc1N0cn0gXVxcbiAgL0NvdW50ICR7dG90YWxQYWdlc31cXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAzLiBSZW5kZXIgRWFjaCBQYWdlIChQYWdlLCBDb250ZW50cywgSW1hZ2UgWE9iamVjdClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbFBhZ2VzOyBpKyspIHtcbiAgICBjb25zdCBpdGVtID0gaW1hZ2VzW2ldO1xuICAgIGNvbnN0IGltYWdlQnl0ZXMgPSB0eXBlb2YgaXRlbS5kYXRhID09PSAnc3RyaW5nJyA/IGRhdGFVcmxUb0J5dGVzKGl0ZW0uZGF0YSkgOiBpdGVtLmRhdGE7XG4gICAgY29uc3QgaW5mbyA9IGdldEpwZWdJbmZvKGltYWdlQnl0ZXMpO1xuXG4gICAgY29uc3Qgd2lkdGggPSBpdGVtLndpZHRoIHx8IGluZm8ud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gaXRlbS5oZWlnaHQgfHwgaW5mby5oZWlnaHQ7XG5cbiAgICBjb25zdCBwYWdlT2JqSWQgPSAzICsgaSAqIDM7XG4gICAgY29uc3QgY29udGVudE9iaklkID0gNCArIGkgKiAzO1xuICAgIGNvbnN0IGltYWdlT2JqSWQgPSA1ICsgaSAqIDM7XG5cbiAgICAvLyBQYWdlIE9iamVjdFxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIHBhZ2VPYmpJZFxuICAgIHdyaXRlU3RyaW5nKFxuICAgICAgYDw8XFxuYCArXG4gICAgICBgICAvVHlwZSAvUGFnZVxcbmAgK1xuICAgICAgYCAgL1BhcmVudCAke3BhZ2VzUm9vdElkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9NZWRpYUJveCBbIDAgMCAke3dpZHRofSAke2hlaWdodH0gXVxcbmAgK1xuICAgICAgYCAgL0NvbnRlbnRzICR7Y29udGVudE9iaklkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9SZXNvdXJjZXMgPDxcXG5gICtcbiAgICAgIGAgICAgL1hPYmplY3QgPDwgL0ltJHtpICsgMX0gJHtpbWFnZU9iaklkfSAwIFIgPj5cXG5gICtcbiAgICAgIGAgID4+XFxuYCArXG4gICAgICBgPj5cXG5gXG4gICAgKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIENvbnRlbnQgU3RyZWFtXG4gICAgY29uc3QgY29udGVudFN0cmVhbSA9IGBxXFxuJHt3aWR0aH0gMCAwICR7aGVpZ2h0fSAwIDAgY21cXG4vSW0ke2kgKyAxfSBEb1xcblFcXG5gO1xuICAgIGNvbnN0IGNvbnRlbnRCeXRlcyA9IHRleHRFbmNvZGVyLmVuY29kZShjb250ZW50U3RyZWFtKTtcblxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIGNvbnRlbnRPYmpJZFxuICAgIHdyaXRlU3RyaW5nKGA8PCAvTGVuZ3RoICR7Y29udGVudEJ5dGVzLmxlbmd0aH0gPj5cXG5zdHJlYW1cXG5gKTtcbiAgICB3cml0ZShjb250ZW50Qnl0ZXMpO1xuICAgIHdyaXRlU3RyaW5nKCdcXG5lbmRzdHJlYW1cXG4nKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIEltYWdlIFhPYmplY3RcbiAgICBzdGFydE9iamVjdCgpOyAvLyBpbWFnZU9iaklkXG4gICAgd3JpdGVTdHJpbmcoXG4gICAgICBgPDxcXG5gICtcbiAgICAgIGAgIC9UeXBlIC9YT2JqZWN0XFxuYCArXG4gICAgICBgICAvU3VidHlwZSAvSW1hZ2VcXG5gICtcbiAgICAgIGAgIC9XaWR0aCAke2luZm8ud2lkdGh9XFxuYCArXG4gICAgICBgICAvSGVpZ2h0ICR7aW5mby5oZWlnaHR9XFxuYCArXG4gICAgICBgICAvQ29sb3JTcGFjZSAvJHtpbmZvLmNvbG9yU3BhY2V9XFxuYCArXG4gICAgICBgICAvQml0c1BlckNvbXBvbmVudCAke2luZm8uYml0c31cXG5gICtcbiAgICAgIGAgIC9GaWx0ZXIgL0RDVERlY29kZVxcbmAgK1xuICAgICAgYCAgL0xlbmd0aCAke2ltYWdlQnl0ZXMubGVuZ3RofVxcbmAgK1xuICAgICAgYD4+XFxuc3RyZWFtXFxuYFxuICAgICk7XG4gICAgd3JpdGUoaW1hZ2VCeXRlcyk7XG4gICAgd3JpdGVTdHJpbmcoJ1xcbmVuZHN0cmVhbVxcbicpO1xuICAgIGVuZE9iamVjdCgpO1xuICB9XG5cbiAgLy8gT3B0aW9uYWwgSW5mbyBPYmplY3RcbiAgY29uc3QgaW5mb0lkID0gc3RhcnRPYmplY3QoKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gKG1ldGFkYXRhLnRpdGxlIHx8ICdBcmNoaXZlLm9yZyBCb29rJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICBjb25zdCBzYWZlQXV0aG9yID0gKG1ldGFkYXRhLmF1dGhvciB8fCAnQXJjaGl2ZS5vcmcnKS5yZXBsYWNlKC9bKClcXFxcXS9nLCAnXFxcXCQmJyk7XG4gIGNvbnN0IGNyZWF0b3IgPSAobWV0YWRhdGEuY3JlYXRvciB8fCAnQXJjaGl2ZSBEb3dubG9hZGVyJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICB3cml0ZVN0cmluZyhcbiAgICBgPDxcXG5gICtcbiAgICBgICAvVGl0bGUgKCR7c2FmZVRpdGxlfSlcXG5gICtcbiAgICBgICAvQXV0aG9yICgke3NhZmVBdXRob3J9KVxcbmAgK1xuICAgIGAgIC9DcmVhdG9yICgke2NyZWF0b3J9KVxcbmAgK1xuICAgIGAgIC9Qcm9kdWNlciAoQXJjaGl2ZSBEb3dubG9hZGVyIEV4dGVuc2lvbilcXG5gICtcbiAgICBgICAvQ3JlYXRpb25EYXRlIChEOiR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1stOlRdL2csICcnKS5zbGljZSgwLCAxNCl9WilcXG5gICtcbiAgICBgPj5cXG5gXG4gICk7XG4gIGVuZE9iamVjdCgpO1xuXG4gIC8vIFhSZWYgVGFibGVcbiAgY29uc3Qgc3RhcnRYcmVmID0gY3VycmVudE9mZnNldDtcbiAgY29uc3QgdG90YWxPYmplY3RzID0gb2JqSWRDb3VudGVyOyAvLyAxIHRvIG9iaklkQ291bnRlci0xXG5cbiAgd3JpdGVTdHJpbmcoYHhyZWZcXG4wICR7dG90YWxPYmplY3RzfVxcbmApO1xuICB3cml0ZVN0cmluZygnMDAwMDAwMDAwMCA2NTUzNSBmIFxcbicpO1xuXG4gIGZvciAobGV0IGlkID0gMTsgaWQgPCB0b3RhbE9iamVjdHM7IGlkKyspIHtcbiAgICBjb25zdCBvZmZzZXQgPSBvZmZzZXRzW2lkXSB8fCAwO1xuICAgIGNvbnN0IHBhZGRlZE9mZnNldCA9IFN0cmluZyhvZmZzZXQpLnBhZFN0YXJ0KDEwLCAnMCcpO1xuICAgIHdyaXRlU3RyaW5nKGAke3BhZGRlZE9mZnNldH0gMDAwMDAgbiBcXG5gKTtcbiAgfVxuXG4gIC8vIFRyYWlsZXJcbiAgd3JpdGVTdHJpbmcoXG4gICAgYHRyYWlsZXJcXG5gICtcbiAgICBgPDxcXG5gICtcbiAgICBgICAvU2l6ZSAke3RvdGFsT2JqZWN0c31cXG5gICtcbiAgICBgICAvUm9vdCAke2NhdGFsb2dJZH0gMCBSXFxuYCArXG4gICAgYCAgL0luZm8gJHtpbmZvSWR9IDAgUlxcbmAgK1xuICAgIGA+PlxcbmAgK1xuICAgIGBzdGFydHhyZWZcXG5gICtcbiAgICBgJHtzdGFydFhyZWZ9XFxuYCArXG4gICAgYCUlRU9GXFxuYFxuICApO1xuXG4gIC8vIENvbmNhdGVuYXRlIGFsbCBjaHVua3MgaW50byBmaW5hbCBVaW50OEFycmF5XG4gIGxldCB0b3RhbExlbmd0aCA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB0b3RhbExlbmd0aCArPSBjaHVuay5sZW5ndGg7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRvdGFsTGVuZ3RoKTtcbiAgbGV0IHBvcyA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgcmVzdWx0LnNldChjaHVuaywgcG9zKTtcbiAgICBwb3MgKz0gY2h1bmsubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBBbGlhcyBmb3IgY29tcGlsZUpwZWdzVG9QZGYuXG4gKi9cbmV4cG9ydCBjb25zdCBjb21waWxlSW1hZ2VzVG9QZGYgPSBjb21waWxlSnBlZ3NUb1BkZjtcbiIsCiAgICAiLyoqXG4gKiBGaWxlc3lzdGVtIGFuZCBuYW1pbmcgc2FuaXRpemF0aW9uIHV0aWxpdGllc1xuICovXG5cbi8qKlxuICogU2FuaXRpemVzIGEgc3RyaW5nIGZvciBzYWZlIHVzYWdlIGluIGRpcmVjdG9yeSBvciBmaWxlIG5hbWVzIGFjcm9zcyBtYWNPUywgTGludXgsIGFuZCBXaW5kb3dzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVGaWxlbmFtZShuYW1lOiBzdHJpbmcsIGZhbGxiYWNrID0gJ2Jvb2snKTogc3RyaW5nIHtcbiAgaWYgKCFuYW1lIHx8IHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbGxiYWNrO1xuXG4gIC8vIFJlbW92ZSBvciByZXBsYWNlIGlsbGVnYWwgY2hhcmFjdGVyczogLyBcXCA6ICogPyBcIiA8ID4gfCBhbmQgY29udHJvbCBjaGFyc1xuICBsZXQgY2xlYW5lZCA9IG5hbWVcbiAgICAucmVwbGFjZSgvWzw+OlwiL1xcXFx8PypcXHgwMC1cXHgxRl0vZywgJ18nKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAudHJpbSgpO1xuXG4gIC8vIFN0cmlwIGxlYWRpbmcvdHJhaWxpbmcgZG90cyBhbmQgc3BhY2VzXG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL15cXC4rfFxcLiskL2csICcnKS50cmltKCk7XG5cbiAgLy8gQXZvaWQgcmVzZXJ2ZWQgbmFtZXMgb24gV2luZG93cyAoQ09OLCBQUk4sIEFVWCwgTlVMLCBDT00xLTksIExQVDEtOSlcbiAgY29uc3QgcmVzZXJ2ZWQgPSAvXihDT058UFJOfEFVWHxOVUx8Q09NWzEtOV18TFBUWzEtOV0pJC9pO1xuICBpZiAocmVzZXJ2ZWQudGVzdChjbGVhbmVkKSkge1xuICAgIGNsZWFuZWQgPSBgJHtjbGVhbmVkfV9maWxlYDtcbiAgfVxuXG4gIC8vIENhcCBsZW5ndGggdG8gMTIwIGNoYXJhY3RlcnMgdG8gcHJldmVudCBwYXRoIGxpbWl0IGVycm9yc1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPiAxMjApIHtcbiAgICBjbGVhbmVkID0gY2xlYW5lZC5zdWJzdHJpbmcoMCwgMTIwKS50cmltKCk7XG4gIH1cblxuICByZXR1cm4gY2xlYW5lZCB8fCBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBGb3JtYXRzIGEgc3ViZm9sZGVyIHBhdGggYmFzZWQgb24gdGhlIHVzZXIncyB0ZW1wbGF0ZSBwYXR0ZXJuLlxuICogVGVtcGxhdGVzIHN1cHBvcnRlZDpcbiAqIC0ge3RpdGxlfSAtPiBcIlRoZV9Cb29rX1RpdGxlXCJcbiAqIC0ge2lkfSAtPiBcIm5hZ2hhbW1hZGlsaWJyYXIwMGphbWVcIlxuICogLSB7dGl0bGV9X3tpZH0gLT4gXCJUaGVfQm9va19UaXRsZV9uYWdoYW1tYWRpbGlicmFyMDBqYW1lXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN1YmRpcihcbiAgYmFzZURpcjogc3RyaW5nLFxuICBwYXR0ZXJuOiBzdHJpbmcsXG4gIGJvb2tUaXRsZTogc3RyaW5nLFxuICBib29rSWQ6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgY29uc3Qgc2FmZUJhc2UgPSBzYW5pdGl6ZUZpbGVuYW1lKGJhc2VEaXIsICdBcmNoaXZlQm9va3MnKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gc2FuaXRpemVGaWxlbmFtZShib29rVGl0bGUsICdib29rJyk7XG4gIGNvbnN0IHNhZmVJZCA9IHNhbml0aXplRmlsZW5hbWUoYm9va0lkLCAnaWQnKTtcblxuICBsZXQgZm9sZGVyID0gcGF0dGVybiB8fCAne3RpdGxlfV97aWR9JztcbiAgZm9sZGVyID0gZm9sZGVyLnJlcGxhY2UoL1xce3RpdGxlXFx9L2csIHNhZmVUaXRsZSk7XG4gIGZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXHtpZFxcfS9nLCBzYWZlSWQpO1xuICBmb2xkZXIgPSBzYW5pdGl6ZUZpbGVuYW1lKGZvbGRlciwgc2FmZVRpdGxlKTtcblxuICByZXR1cm4gYCR7c2FmZUJhc2V9LyR7Zm9sZGVyfWA7XG59XG5cbi8qKlxuICogRm9ybWF0cyBhIHBhZ2UgaW1hZ2UgZmlsZW5hbWUgd2l0aCB6ZXJvIHBhZGRpbmcuXG4gKiBFeGFtcGxlOiBcInBhZ2VfMDAxLmpwZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRQYWdlRmlsZW5hbWUoXG4gIHBhZ2VOdW06IG51bWJlcixcbiAgdG90YWxQYWdlczogbnVtYmVyLFxuICBmb3JtYXQgPSAnanBnJ1xuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFkTGVuZ3RoID0gTWF0aC5tYXgoMywgU3RyaW5nKHRvdGFsUGFnZXMpLmxlbmd0aCk7XG4gIGNvbnN0IHBhZGRlZE51bSA9IFN0cmluZyhwYWdlTnVtKS5wYWRTdGFydChwYWRMZW5ndGgsICcwJyk7XG4gIHJldHVybiBgcGFnZV8ke3BhZGRlZE51bX0uJHtmb3JtYXR9YDtcbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCb29rSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlRGp2dVhtbFRvVGV4dCB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuXG5leHBvcnQgY2xhc3MgQXJjaGl2ZVByb3ZpZGVyIGltcGxlbWVudHMgQm9va1Byb3ZpZGVyIHtcbiAgcmVhZG9ubHkgc2l0ZUlkID0gJ2FyY2hpdmUnIGFzIGNvbnN0O1xuICByZWFkb25seSBzaXRlTmFtZSA9ICdBcmNoaXZlLm9yZyc7XG4gIHJlYWRvbmx5IGRlZmF1bHRTdGFydFBhZ2UgPSAwO1xuXG4gIHByaXZhdGUgYm9va0luZm86IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG5cbiAgaXNNYXRjaCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5pbmNsdWRlcygnL2RldGFpbHMvJyk7XG4gIH1cblxuICBzZXRCb29rSW5mbyhpbmZvOiBCb29rSW5mbyB8IG51bGwpIHtcbiAgICB0aGlzLmJvb2tJbmZvID0gaW5mbztcbiAgfVxuXG4gIGFzeW5jIGRldGVjdEJvb2tJbmZvKCk6IFByb21pc2U8Qm9va0luZm8gfCBudWxsPiB7XG4gICAgLy8gUmVxdWVzdCBCb29rUmVhZGVyIGRldGVjdGlvbiBmcm9tIGJyaWRnZSBpbiBNQUlOIHdvcmxkXG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0RFVEVDVF9CT09LJyk7XG5cbiAgICAvLyBBbHNvIGluc3BlY3QgRE9NIGRpcmVjdGx5IGFzIGZhc3QgcGF0aCAvIGZhbGxiYWNrXG4gICAgY29uc3QgZG9tUGFnZSA9IHRoaXMuZXh0cmFjdFBhZ2VJbmZvRnJvbURvbSgpO1xuICAgIGlmIChkb21QYWdlKSB7XG4gICAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LnRpdGxlIHx8ICdBcmNoaXZlIEJvb2snO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvXFwvZGV0YWlsc1xcLyhbXlxcL1xcPyNdKykvKTtcbiAgICAgIGNvbnN0IGJvb2tJZCA9IGlkTWF0Y2ggPyBpZE1hdGNoWzFdIDogJ2Jvb2snO1xuXG4gICAgICBpZiAoIXRoaXMuYm9va0luZm8pIHtcbiAgICAgICAgdGhpcy5ib29rSW5mbyA9IHtcbiAgICAgICAgICBib29rSWQsXG4gICAgICAgICAgYm9va1RpdGxlOiB0aXRsZSxcbiAgICAgICAgICB0b3RhbFBhZ2VzOiBkb21QYWdlLnRvdGFsLFxuICAgICAgICAgIGN1cnJlbnRMZWFmOiBkb21QYWdlLmN1cnJlbnQsXG4gICAgICAgICAgY3VycmVudE1vZGU6IDEsXG4gICAgICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkb21QYWdlLnRvdGFsID4gMCAmJiAoIXRoaXMuYm9va0luZm8udG90YWxQYWdlcyB8fCB0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgPCBkb21QYWdlLnRvdGFsKSkge1xuICAgICAgICAgIHRoaXMuYm9va0luZm8udG90YWxQYWdlcyA9IGRvbVBhZ2UudG90YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ib29rSW5mbztcbiAgfVxuXG4gIGdldEN1cnJlbnRQYWdlKCk6IG51bWJlciB8IG51bGwge1xuICAgIGNvbnN0IGN1cnJlbnRTcGFuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkJSY3VycmVudHBhZ2UnKSB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbcm9sZT1cInN0YXR1c1wiXScpO1xuICAgIGlmIChjdXJyZW50U3BhbiAmJiBjdXJyZW50U3Bhbi50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBjdXJyZW50U3Bhbi50ZXh0Q29udGVudC5tYXRjaCgvXFwoKFxcZCspKD86XFxzKi1cXHMqXFxkKyk/XFxzKlxcL1xccyooXFxkKylcXCkvKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNpbXBsZU1hdGNoID0gY3VycmVudFNwYW4udGV4dENvbnRlbnQubWF0Y2goL1xcKChcXGQrKVxccypcXC8vKTtcbiAgICAgIGlmIChzaW1wbGVNYXRjaCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoc2ltcGxlTWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNsYXNoTWF0Y2ggPSBjdXJyZW50U3Bhbi50ZXh0Q29udGVudC5tYXRjaCgvXFwvXFxzKihcXGQrKS8pO1xuICAgICAgaWYgKHNsYXNoTWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHNsYXNoTWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhc3luYyBlbmZvcmNlU2luZ2xlUGFnZU1vZGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gRW5mb3JjaW5nIHNpbmdsZS1wYWdlIG1vZGUgb24gQXJjaGl2ZS5vcmcuLi4nKTtcbiAgICB0aGlzLnBvc3RUb0JyaWRnZSgnU1dJVENIX01PREVfMScpO1xuXG4gICAgY29uc3Qgb25lUGFnZUJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblt0aXRsZSo9XCJPbmUtcGFnZVwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJPbmUtcGFnZVwiIGldLCBidXR0b24ub25lLXBhZ2UsIC5CUnBhZ2V2aWV3MSdcbiAgICApO1xuICAgIGlmIChvbmVQYWdlQnRuICYmICFvbmVQYWdlQnRuLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykgJiYgb25lUGFnZUJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtcHJlc3NlZCcpICE9PSAndHJ1ZScpIHtcbiAgICAgIG9uZVBhZ2VCdG4uY2xpY2soKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBuYXZpZ2F0ZVRvUGFnZShwYWdlTnVtOiBudW1iZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBOYXZpZ2F0aW5nIHRvIEFyY2hpdmUgbGVhZiAke3BhZ2VOdW19Li4uYCk7XG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0pVTVBfUEFHRScsIHsgbGVhZkluZGV4OiBwYWdlTnVtIH0pO1xuXG4gICAgaWYgKHBhZ2VOdW0gPT09IDApIHtcbiAgICAgIGNvbnN0IGZpcnN0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAgICdidXR0b25bdGl0bGUqPVwiRmlyc3QgcGFnZVwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJGaXJzdCBwYWdlXCIgaV0sIGJ1dHRvbi5uYXZmaXJzdCwgLmJvb2stZmxpcC1maXJzdCdcbiAgICAgICk7XG4gICAgICBpZiAoZmlyc3RCdG4pIGZpcnN0QnRuLmNsaWNrKCk7XG5cbiAgICAgIGNvbnN0IGhvbWVFdmVudCA9IHsgYnViYmxlczogdHJ1ZSwgY2FuY2VsYWJsZTogdHJ1ZSwga2V5OiAnSG9tZScsIGNvZGU6ICdIb21lJyB9O1xuICAgICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgaG9tZUV2ZW50KSk7XG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGhvbWVFdmVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtOiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyAxLiBEaXJlY3QgQm9va1JlYWRlciBBUEkgY2FsbCB2aWEgYnJpZGdlIChtb3N0IHJlbGlhYmxlIGluIE1BSU4gd29ybGQpXG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0ZMSVBfTkVYVCcpO1xuXG4gICAgLy8gMi4gRE9NIGJ1dHRvbiBjbGljayBmYWxsYmFja1xuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgICdidXR0b25bdGl0bGUqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvbi5uYXZuZXh0LCAuYm9vay1mbGlwLXJpZ2h0J1xuICAgICk7XG4gICAgaWYgKG5leHRCdG4pIHtcbiAgICAgIHRyeSB7IG5leHRCdG4uY2xpY2soKTsgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICAvLyAzLiBLZXlib2FyZCBBcnJvd1JpZ2h0IGV2ZW50IChCb29rUmVhZGVyIGdsb2JhbCBsaXN0ZW5lcilcbiAgICBjb25zdCBrZXlFdmVudCA9IHtcbiAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAga2V5OiAnQXJyb3dSaWdodCcsXG4gICAgICBjb2RlOiAnQXJyb3dSaWdodCcsXG4gICAgICBrZXlDb2RlOiAzOSxcbiAgICAgIHdoaWNoOiAzOSxcbiAgICB9O1xuICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGtleUV2ZW50KSk7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICB9XG5cbiAgZ2V0QWN0aXZlUGFnZUltYWdlKG1pbldpZHRoID0gMzAwLCB0YXJnZXRQYWdlTnVtPzogbnVtYmVyKTogSFRNTEltYWdlRWxlbWVudCB8IG51bGwge1xuICAgIGNvbnN0IGltYWdlcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PignLkJScGFnZWltYWdlLCAuQlJwYWdlIGltZywgaW1nLkJScGFnZWltYWdlJykpO1xuICAgIGNvbnN0IHZhbGlkID0gaW1hZ2VzLmZpbHRlcihpbWcgPT4gaW1nLmNvbXBsZXRlICYmIGltZy5uYXR1cmFsV2lkdGggPj0gbWluV2lkdGggJiYgaW1nLnNyYyk7XG5cbiAgICBpZiAodmFsaWQubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIFBpY2sgdGhlIGltYWdlIGN1cnJlbnRseSB2aXNpYmxlIHdpdGhpbiB0aGUgYnJvd3NlciB2aWV3cG9ydFxuICAgIGNvbnN0IHZpc2libGUgPSB2YWxpZC5maW5kKGltZyA9PiB7XG4gICAgICBjb25zdCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHJlY3Qud2lkdGggPiA1MCAmJiByZWN0LmhlaWdodCA+IDUwICYmXG4gICAgICAgICAgICAgcmVjdC50b3AgPCB3aW5kb3cuaW5uZXJIZWlnaHQgJiYgcmVjdC5ib3R0b20gPiAwICYmXG4gICAgICAgICAgICAgcmVjdC5sZWZ0IDwgd2luZG93LmlubmVyV2lkdGggJiYgcmVjdC5yaWdodCA+IDA7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdmlzaWJsZSB8fCB2YWxpZFswXTtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RQYWdlVGV4dChwYWdlTnVtOiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghdGhpcy5ib29rSW5mbyB8fCAhdGhpcy5ib29rSW5mby5zZXJ2ZXIgfHwgIXRoaXMuYm9va0luZm8uYm9va1BhdGgpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBsZWFmSW5kZXggPSBwYWdlTnVtO1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7dGhpcy5ib29rSW5mby5zZXJ2ZXJ9L0Jvb2tSZWFkZXIvQm9va1JlYWRlckdldFRleHRXcmFwcGVyLnBocD9wYXRoPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuYm9va0luZm8uYm9va1BhdGgpfV9kanZ1LnhtbCZtb2RlPWRqdnVfeG1sJnBhZ2U9JHtsZWFmSW5kZXh9YDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnLFxuICAgICAgfSk7XG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSByZXR1cm4gJyc7XG4gICAgICBjb25zdCB4bWwgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICByZXR1cm4gcGFyc2VEanZ1WG1sVG9UZXh0KHhtbCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gQ291bGQgbm90IGZldGNoIHRleHQgZm9yIGxlYWYgJHtsZWFmSW5kZXh9OmAsIGVycik7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9XG5cbiAgaXNBdEVuZE9mQm9vayhjdXJyZW50UGFnZTogbnVtYmVyLCB0b3RhbFBhZ2VzOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b24ubmF2bmV4dCwgLmJvb2stZmxpcC1yaWdodCdcbiAgICApO1xuICAgIGNvbnN0IGlzTmV4dERpc2FibGVkID0gbmV4dEJ0biAmJiAoXG4gICAgICBuZXh0QnRuLmRpc2FibGVkIHx8XG4gICAgICBuZXh0QnRuLmdldEF0dHJpYnV0ZSgnYXJpYS1kaXNhYmxlZCcpID09PSAndHJ1ZScgfHxcbiAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpXG4gICAgKTtcbiAgICBjb25zdCBkb21MZWFmID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpO1xuICAgIHJldHVybiBCb29sZWFuKGlzTmV4dERpc2FibGVkIHx8ICh0b3RhbFBhZ2VzID4gMCAmJiBkb21MZWFmICE9PSBudWxsICYmIGRvbUxlYWYgPj0gdG90YWxQYWdlcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBwb3N0VG9CcmlkZ2UoYWN0aW9uOiBzdHJpbmcsIGV4dHJhRGF0YTogYW55ID0ge30pIHtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoeyBkaXJlY3Rpb246ICdUT19CUklER0UnLCBhY3Rpb24sIC4uLmV4dHJhRGF0YSB9LCAnKicpO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0UGFnZUluZm9Gcm9tRG9tKCk6IHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0gfCBudWxsIHtcbiAgICBjb25zdCBwYWdlRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZScpIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tyb2xlPVwic3RhdHVzXCJdJyk7XG4gICAgaWYgKHBhZ2VFbCAmJiBwYWdlRWwudGV4dENvbnRlbnQpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gcGFnZUVsLnRleHRDb250ZW50Lm1hdGNoKC9cXCgoXFxkKylcXHMqXFwvXFxzKihcXGQrKVxcKS8pO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY3VycmVudDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSxcbiAgICAgICAgICB0b3RhbDogcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCb29rSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0IH0gZnJvbSAnLi4vdXRpbHMvbWFya2Rvd24tYnVpbGRlcic7XG5cbmV4cG9ydCBjbGFzcyBIYXRoaVRydXN0UHJvdmlkZXIgaW1wbGVtZW50cyBCb29rUHJvdmlkZXIge1xuICByZWFkb25seSBzaXRlSWQgPSAnaGF0aGl0cnVzdCcgYXMgY29uc3Q7XG4gIHJlYWRvbmx5IHNpdGVOYW1lID0gJ0hhdGhpVHJ1c3QnO1xuICByZWFkb25seSBkZWZhdWx0U3RhcnRQYWdlID0gMTsgLy8gSGF0aGlUcnVzdCBzZXF1ZW5jZXMgYXJlIDEtYmFzZWRcblxuICBwcml2YXRlIGJvb2tJbmZvOiBCb29rSW5mbyB8IG51bGwgPSBudWxsO1xuXG4gIC8vIFRyYWNraW5nIGxvYWRlZCBzZXF1ZW5jZXMgZnJvbSBNQUlOIHdvcmxkIGJyaWRnZVxuICBwcml2YXRlIGFubm91bmNlZFNlcXVlbmNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBwcml2YXRlIHNlcVRvQmxvYlVybCA9IG5ldyBNYXA8bnVtYmVyLCBzdHJpbmc+KCk7XG4gIHByaXZhdGUgYmxvYlVybFRvU2VxID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBzZXFUb0h0bWwgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIExpc3RlbiBmb3IgYnJpZGdlIG1lc3NhZ2VzICh3b3JsZDogTUFJTilcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ0ZST01fQlJJREdFJykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhO1xuICAgICAgICBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9MT0FEX0FOTk9VTkNFRCcpIHtcbiAgICAgICAgICBpZiAobXNnLmlzTG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmFubm91bmNlZFNlcXVlbmNlcy5hZGQobXNnLnNlcSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBIYXRoaVRydXN0IGFubm91bmNlZCBzZXF1ZW5jZSAke21zZy5zZXF9IGxvYWRlZGApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0lNQUdFX1JFQURZJykge1xuICAgICAgICAgIHRoaXMuc2VxVG9CbG9iVXJsLnNldChtc2cuc2VxLCBtc2cuYmxvYlVybCk7XG4gICAgICAgICAgdGhpcy5ibG9iVXJsVG9TZXEuc2V0KG1zZy5ibG9iVXJsLCBtc2cuc2VxKTtcbiAgICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgICAgdGhpcy5zZXFUb0h0bWwuc2V0KG1zZy5zZXEsIG1zZy5odG1sKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgb25QYWdlTG9hZEFubm91bmNlZChzZXE6IG51bWJlciwgaXNWaXNpYmxlOiBib29sZWFuLCBpc0xvYWRlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChpc0xvYWRlZCkge1xuICAgICAgdGhpcy5hbm5vdW5jZWRTZXF1ZW5jZXMuYWRkKHNlcSk7XG4gICAgfVxuICB9XG5cbiAgb25QYWdlSW1hZ2VSZWFkeShzZXE6IG51bWJlciwgYmxvYlVybDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zZXFUb0Jsb2JVcmwuc2V0KHNlcSwgYmxvYlVybCk7XG4gICAgdGhpcy5ibG9iVXJsVG9TZXEuc2V0KGJsb2JVcmwsIHNlcSk7XG4gIH1cblxuICBvblBhZ2VUZXh0UmVhZHkoc2VxOiBudW1iZXIsIGh0bWw6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc2VxVG9IdG1sLnNldChzZXEsIGh0bWwpO1xuICB9XG5cbiAgZ2V0QmxvYlVybEZvclNlcShzZXE6IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuc2VxVG9CbG9iVXJsLmdldChzZXEpO1xuICB9XG5cbiAgZ2V0Q2FjaGVkSHRtbEZvclNlcShzZXE6IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuc2VxVG9IdG1sLmdldChzZXEpO1xuICB9XG5cbiAgaXNQYWdlQW5ub3VuY2VkKHNlcTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYW5ub3VuY2VkU2VxdWVuY2VzLmhhcyhzZXEpO1xuICB9XG5cbiAgaXNNYXRjaCgpOiBib29sZWFuIHtcbiAgICBjb25zdCBpc0hvc3QgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09ICdiYWJlbC5oYXRoaXRydXN0Lm9yZycgfHxcbiAgICAgICAgICAgICAgICAgICAod2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdoYXRoaXRydXN0Lm9yZycpICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zdGFydHNXaXRoKCcvY2dpL3B0JykpO1xuICAgIHJldHVybiBpc0hvc3Q7XG4gIH1cblxuICBhc3luYyBkZXRlY3RCb29rSW5mbygpOiBQcm9taXNlPEJvb2tJbmZvIHwgbnVsbD4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgY29uc3QgYm9va0lkID0gcGFyYW1zLmdldCgnaWQnKSB8fCAnaGF0aGl0cnVzdF9ib29rJztcblxuICAgIC8vIDEuIERldGVjdCBCb29rIFRpdGxlXG4gICAgbGV0IGJvb2tUaXRsZSA9ICcnO1xuICAgIGNvbnN0IG1ldGFUaXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTE1ldGFFbGVtZW50PignbWV0YVtuYW1lPVwiREMudGl0bGVcIl0sIG1ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScpO1xuICAgIGlmIChtZXRhVGl0bGUgJiYgbWV0YVRpdGxlLmNvbnRlbnQpIHtcbiAgICAgIGJvb2tUaXRsZSA9IG1ldGFUaXRsZS5jb250ZW50LnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKCFib29rVGl0bGUpIHtcbiAgICAgIGNvbnN0IGgxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDEudGl0bGUsIGgxLml0ZW0tdGl0bGUsIGgxJyk7XG4gICAgICBpZiAoaDEgJiYgaDEudGV4dENvbnRlbnQpIHtcbiAgICAgICAgYm9va1RpdGxlID0gaDEudGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWJvb2tUaXRsZSkge1xuICAgICAgYm9va1RpdGxlID0gZG9jdW1lbnQudGl0bGUgPyBkb2N1bWVudC50aXRsZS5yZXBsYWNlKC9bLXxdXFxzKkhhdGhpVHJ1c3QuKi9pLCAnJykudHJpbSgpIDogJ0hhdGhpVHJ1c3QgQm9vayc7XG4gICAgfVxuXG4gICAgLy8gMi4gRGV0ZWN0IFRvdGFsIFBhZ2VzXG4gICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMuZ2V0VG90YWxQYWdlc0Zyb21Eb20oKTtcblxuICAgIC8vIDMuIERldGVjdCBDdXJyZW50IFNlcXVlbmNlXG4gICAgY29uc3QgY3VycmVudFNlcSA9IHRoaXMuZ2V0Q3VycmVudFBhZ2UoKSB8fCAxO1xuXG4gICAgLy8gQ2hlY2sgYXV0aG9yIGFuZCB5ZWFyIGlmIHByZXNlbnQgaW4gbWV0YWRhdGFcbiAgICBjb25zdCBhdXRob3JNZXRhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy5jcmVhdG9yXCJdJyk7XG4gICAgY29uc3QgYXV0aG9yID0gYXV0aG9yTWV0YT8uY29udGVudDtcblxuICAgIGNvbnN0IGRhdGVNZXRhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy5kYXRlXCJdJyk7XG4gICAgY29uc3QgeWVhciA9IGRhdGVNZXRhPy5jb250ZW50O1xuXG4gICAgdGhpcy5ib29rSW5mbyA9IHtcbiAgICAgIGJvb2tJZCxcbiAgICAgIGJvb2tUaXRsZTogYm9va1RpdGxlIHx8ICdIYXRoaVRydXN0IEJvb2snLFxuICAgICAgdG90YWxQYWdlczogdG90YWxQYWdlcyB8fCA1MDAsXG4gICAgICBjdXJyZW50TGVhZjogY3VycmVudFNlcSxcbiAgICAgIGN1cnJlbnRNb2RlOiAxLFxuICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgIGF1dGhvcixcbiAgICAgIHllYXIsXG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEhhdGhpVHJ1c3Qgdm9sdW1lIGRldGVjdGVkOicsIHRoaXMuYm9va0luZm8uYm9va1RpdGxlLCBgKCR7dGhpcy5ib29rSW5mby50b3RhbFBhZ2VzfSBwYWdlcylgKTtcbiAgICByZXR1cm4gdGhpcy5ib29rSW5mbztcbiAgfVxuXG4gIGdldEN1cnJlbnRQYWdlKCk6IG51bWJlciB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDEuIENoZWNrIHRvb2xiYXIgaW5wdXRcbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuICAgIGlmIChzZXFJbnB1dCAmJiBzZXFJbnB1dC52YWx1ZSkge1xuICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoc2VxSW5wdXQudmFsdWUsIDEwKTtcbiAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIC8vIDIuIENoZWNrIFVSTCBzZWFyY2ggcGFyYW1cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpIHtcbiAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICBjb25zdCBzZXEgPSBwYXJhbXMuZ2V0KCdzZXEnKTtcbiAgICAgIGlmIChzZXEpIHtcbiAgICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoc2VxLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIENoZWNrIGRhdGEtc2VxIG9uIGFjdGl2ZSBmaWd1cmUgb3Igc3ByZWFkXG4gICAgY29uc3QgYWN0aXZlRmlnID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LnNwcmVhZCBmaWd1cmVbZGF0YS1zZXFdLCBmaWd1cmVbZGF0YS1zZXFdJyk7XG4gICAgaWYgKGFjdGl2ZUZpZykge1xuICAgICAgY29uc3Qgc2VxQXR0ciA9IGFjdGl2ZUZpZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJyk7XG4gICAgICBpZiAoc2VxQXR0cikge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChzZXFBdHRyLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgbmF2aWdhdGVUb1BhZ2UocGFnZU51bTogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBIYXRoaVRydXN0IHNlcXVlbmNlICR7cGFnZU51bX0uLi5gKTtcbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuXG4gICAgaWYgKHNlcUlucHV0KSB7XG4gICAgICBzZXFJbnB1dC5mb2N1cygpO1xuICAgICAgc2VxSW5wdXQudmFsdWUgPSBTdHJpbmcocGFnZU51bSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgc2VxSW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NoYW5nZScsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG5cbiAgICAgIC8vIERpc3BhdGNoIEVudGVyIGtleWRvd24gZXZlbnRcbiAgICAgIGNvbnN0IGVudGVyRXZlbnQgPSBuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIHtcbiAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAga2V5OiAnRW50ZXInLFxuICAgICAgICBjb2RlOiAnRW50ZXInLFxuICAgICAgICBrZXlDb2RlOiAxMyxcbiAgICAgICAgd2hpY2g6IDEzLFxuICAgICAgfSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KGVudGVyRXZlbnQpO1xuXG4gICAgICAvLyBTdWJtaXQgcGFyZW50IGZvcm0gaWYgcHJlc2VudFxuICAgICAgY29uc3QgZm9ybSA9IHNlcUlucHV0LmNsb3Nlc3QoJ2Zvcm0nKTtcbiAgICAgIGlmIChmb3JtKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmb3JtLnJlcXVlc3RTdWJtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGZvcm0ucmVxdWVzdFN1Ym1pdCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdzdWJtaXQnLCB7IGJ1YmJsZXM6IHRydWUsIGNhbmNlbGFibGU6IHRydWUgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtOiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyAxLiBQcmltYXJ5OiBDbGljayBOZXh0IFBhZ2UgYnV0dG9uXG4gICAgLy8gPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLW91dGxpbmUtZGFya1wiIGFyaWEtbGFiZWw9XCJOZXh0IFBhZ2VcIj48aSBjbGFzcz1cImZhLXNvbGlkIGZhLWFuZ2xlLXJpZ2h0XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjwvYnV0dG9uPlxuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50IHwgSFRNTEFuY2hvckVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblthcmlhLWxhYmVsPVwiTmV4dCBQYWdlXCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIk5leHRcIiBpXSwgYnV0dG9uW3RpdGxlKj1cIk5leHRcIiBpXSwgW2FjY2Vzc2tleT1cIm5cIl0sIGJ1dHRvbi5uZXh0LCBhLmFjdGlvbi1uZXh0LXBhZ2UnXG4gICAgKTtcbiAgICBpZiAobmV4dEJ0bikge1xuICAgICAgY29uc3QgZGlzYWJsZWQgPSAobmV4dEJ0biBhcyBhbnkpLmRpc2FibGVkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLWRpc2FibGVkJykgPT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0QnRuLmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZWQnKTtcbiAgICAgIGlmICghZGlzYWJsZWQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBDbGlja2luZyBIYXRoaVRydXN0IE5leHQgUGFnZSBidXR0b24uLi4nKTtcbiAgICAgICAgICBuZXh0QnRuLmNsaWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIEtleWJvYXJkIEFycm93UmlnaHQgZXZlbnQgKHN0YW5kYXJkIHJlYWRlciBob3RrZXkpXG4gICAgY29uc3Qga2V5RXZlbnQgPSB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgIGtleTogJ0Fycm93UmlnaHQnLFxuICAgICAgY29kZTogJ0Fycm93UmlnaHQnLFxuICAgICAga2V5Q29kZTogMzksXG4gICAgICB3aGljaDogMzksXG4gICAgfTtcbiAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywga2V5RXZlbnQpKTtcblxuICAgIC8vIDMuIEZhbGxiYWNrOiBvbmx5IGlmIE5leHQgYnV0dG9uIGlzIG5vdCBhdmFpbGFibGUsIHVzZSBzZXF1ZW5jZSBpbnB1dFxuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG4gICAgaWYgKHNlcUlucHV0KSB7XG4gICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBGYWxsYmFjayB0byBzZXF1ZW5jZSBpbnB1dCAke3RhcmdldFBhZ2VOdW19Li4uYCk7XG4gICAgICB0aGlzLm5hdmlnYXRlVG9QYWdlKHRhcmdldFBhZ2VOdW0pO1xuICAgIH1cbiAgfVxuXG4gIGdldEFjdGl2ZVBhZ2VJbWFnZShtaW5XaWR0aCA9IDMwMCwgdGFyZ2V0U2VxPzogbnVtYmVyKTogSFRNTEltYWdlRWxlbWVudCB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDEuIElmIHRhcmdldFNlcSBpcyBzcGVjaWZpZWQgKGR1cmluZyBzZXF1ZW50aWFsIGNhcHR1cmUpXG4gICAgaWYgKHR5cGVvZiB0YXJnZXRTZXEgPT09ICdudW1iZXInKSB7XG4gICAgICBjb25zdCBjdXJyZW50U2VxID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgLy8gSWYgdGhlIHJlYWRlciB0b29sYmFyIGhhcyBub3QgcmVhY2hlZCB0YXJnZXRTZXEgeWV0LCB3YWl0IVxuICAgICAgaWYgKGN1cnJlbnRTZXEgIT09IG51bGwgJiYgY3VycmVudFNlcSA8IHRhcmdldFNlcSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYW4gaW1hZ2UgZXhwbGljaXRseSB0YWdnZWQgd2l0aCB0YXJnZXRTZXFcbiAgICAgIGNvbnN0IHRhZ2dlZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEltYWdlRWxlbWVudD4oYGltZ1tkYXRhLXNlcT1cIiR7dGFyZ2V0U2VxfVwiXWApO1xuICAgICAgaWYgKHRhZ2dlZCAmJiB0YWdnZWQuY29tcGxldGUgJiYgdGFnZ2VkLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiB0YWdnZWQuc3JjICYmICF0YWdnZWQuc3JjLmluY2x1ZGVzKCdiYXNlNjQsaVZCT1J3JykpIHtcbiAgICAgICAgcmV0dXJuIHRhZ2dlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyeSBjYW5kaWRhdGUgcGFnZSBpbWFnZXMgaW5zaWRlIG1haW4jbWFpblxuICAgIGNvbnN0IGltYWdlcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PihcbiAgICAgICdtYWluI21haW4gZGV0YWlscyBmaWd1cmUgZGl2LmltYWdlIGltZywgbWFpbiNtYWluIGRldGFpbHMgZmlndXJlIGltZywgbWFpbiNtYWluIGRpdi5zcHJlYWQgZmlndXJlIGRpdi5pbWFnZSBpbWcsIG1haW4jbWFpbiBkaXYuc3ByZWFkIGZpZ3VyZSBpbWcsIG1haW4jbWFpbiBpbWdbc3JjXj1cImJsb2I6XCJdLCBtYWluI21haW4gaW1nJ1xuICAgICkpO1xuXG4gICAgY29uc3QgdmFsaWQgPSBpbWFnZXMuZmlsdGVyKGltZyA9PlxuICAgICAgaW1nLmNvbXBsZXRlICYmXG4gICAgICBpbWcubmF0dXJhbFdpZHRoID49IG1pbldpZHRoICYmXG4gICAgICBpbWcuc3JjICYmXG4gICAgICAhaW1nLnNyYy5pbmNsdWRlcygnYmFzZTY0LGlWQk9SdycpIC8vIElnbm9yZSB0cmFuc3BhcmVudCAxeDEgcGxhY2Vob2xkZXJcbiAgICApO1xuXG4gICAgaWYgKHZhbGlkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICAvLyBQaWNrIGltYWdlIHZpc2libGUgd2l0aGluIGJyb3dzZXIgdmlld3BvcnRcbiAgICBjb25zdCB2aXNpYmxlID0gdmFsaWQuZmluZChpbWcgPT4ge1xuICAgICAgLy8gSWYgaW1hZ2UgaXMgZXhwbGljaXRseSB0YWdnZWQgd2l0aCBhIGRpZmZlcmVudCBzZXF1ZW5jZSwgZG8gbm90IHBpY2sgaXQhXG4gICAgICBpZiAodHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicgJiYgaW1nLmRhdGFzZXQuc2VxICYmIHBhcnNlSW50KGltZy5kYXRhc2V0LnNlcSwgMTApICE9PSB0YXJnZXRTZXEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHJlY3Qud2lkdGggPiA1MCAmJiByZWN0LmhlaWdodCA+IDUwICYmXG4gICAgICAgICAgICAgcmVjdC50b3AgPCB3aW5kb3cuaW5uZXJIZWlnaHQgJiYgcmVjdC5ib3R0b20gPiAwICYmXG4gICAgICAgICAgICAgcmVjdC5sZWZ0IDwgd2luZG93LmlubmVyV2lkdGggJiYgcmVjdC5yaWdodCA+IDA7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjaG9zZW4gPSB2aXNpYmxlIHx8IHZhbGlkWzBdO1xuICAgIGlmIChjaG9zZW4gJiYgdHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNob3Nlbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHRhcmdldFNlcSkpO1xuICAgICAgY2hvc2VuLmRhdGFzZXQuc2VxID0gU3RyaW5nKHRhcmdldFNlcSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNob3NlbjtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RQYWdlVGV4dChwYWdlTnVtOiBudW1iZXIsIGltZz86IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG5cbiAgICAvLyAxLiBDaGVjayBpZiB3ZSBhbHJlYWR5IHJlY2VpdmVkIHRoZSBPQ1IgSFRNTCBmcm9tIHRoZSBuZXR3b3JrIGludGVyY2VwdGlvblxuICAgIGNvbnN0IGNhY2hlZEh0bWwgPSB0aGlzLnNlcVRvSHRtbC5nZXQocGFnZU51bSk7XG4gICAgaWYgKGNhY2hlZEh0bWwpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChjYWNoZWRIdG1sKTtcbiAgICAgIGlmICh0ZXh0ICYmIHRleHQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICAvLyAyLiBRdWVyeSBET00gZm9yIHRhcmdldCBzZXF1ZW5jZSdzIGZpZ2NhcHRpb24sIHJldHJ5aW5nIGJyaWVmbHkgKHVwIHRvIDI1MDBtcylcbiAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0IDwgMjUwMCkge1xuICAgICAgLy8gMmEuIElmIGltZyB3YXMgcGFzc2VkLCBjaGVjayBpdHMgY2xvc2VzdCBmaWd1cmU6XG4gICAgICBpZiAoaW1nKSB7XG4gICAgICAgIGNvbnN0IGZpZ3VyZSA9IGltZy5jbG9zZXN0KCdmaWd1cmUnKTtcbiAgICAgICAgaWYgKGZpZ3VyZSkge1xuICAgICAgICAgIGNvbnN0IGZpZ2NhcHRpb24gPSBmaWd1cmUucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJ2ZpZ2NhcHRpb24nKTtcbiAgICAgICAgICBpZiAoZmlnY2FwdGlvbiAmJiBmaWdjYXB0aW9uLnRleHRDb250ZW50ICYmIGZpZ2NhcHRpb24udGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChmaWdjYXB0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gMmIuIENoZWNrIGV4cGxpY2l0bHkgdGFnZ2VkIGZpZ2NhcHRpb246XG4gICAgICBjb25zdCB0YWdnZWRGaWdjYXB0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICAgIGBmaWd1cmVbZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdIGZpZ2NhcHRpb24sIGZpZ2NhcHRpb25bZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdLCAuc3ByZWFkW2RhdGEtc2VxPVwiJHtwYWdlTnVtfVwiXSBmaWdjYXB0aW9uYFxuICAgICAgKTtcbiAgICAgIGlmICh0YWdnZWRGaWdjYXB0aW9uICYmIHRhZ2dlZEZpZ2NhcHRpb24udGV4dENvbnRlbnQgJiYgdGFnZ2VkRmlnY2FwdGlvbi50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQodGFnZ2VkRmlnY2FwdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIDJjLiBGYWxsYmFjazogY2hlY2sgbWFpbiBzcHJlYWQgZGV0YWlscyBmaWdjYXB0aW9uOlxuICAgICAgY29uc3Qgc3ByZWFkRmlnY2FwdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAnbWFpbiNtYWluIGRldGFpbHMgZmlndXJlIGZpZ2NhcHRpb24sIG1haW4jbWFpbiBmaWd1cmUgZmlnY2FwdGlvbiwgbWFpbiNtYWluIGZpZ2NhcHRpb24nXG4gICAgICApO1xuICAgICAgaWYgKHNwcmVhZEZpZ2NhcHRpb24gJiYgc3ByZWFkRmlnY2FwdGlvbi50ZXh0Q29udGVudCAmJiBzcHJlYWRGaWdjYXB0aW9uLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChzcHJlYWRGaWdjYXB0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8gMmQuIENoZWNrIGlmIG5ldHdvcmsgcmVzcG9uc2UgYXJyaXZlZCB3aGlsZSBwb2xsaW5nOlxuICAgICAgY29uc3QgbGF0ZUh0bWwgPSB0aGlzLnNlcVRvSHRtbC5nZXQocGFnZU51bSk7XG4gICAgICBpZiAobGF0ZUh0bWwpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGxhdGVIdG1sKTtcbiAgICAgICAgaWYgKHRleHQgJiYgdGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgaXNBdEVuZE9mQm9vayhjdXJyZW50UGFnZTogbnVtYmVyLCB0b3RhbFBhZ2VzOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAodG90YWxQYWdlcyA+IDAgJiYgY3VycmVudFBhZ2UgPj0gdG90YWxQYWdlcykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQgfCBIVE1MQW5jaG9yRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW2FyaWEtbGFiZWwqPVwiTmV4dFwiIGldLCBidXR0b25bdGl0bGUqPVwiTmV4dFwiIGldLCBbYWNjZXNza2V5PVwiblwiXSdcbiAgICApO1xuICAgIGlmIChuZXh0QnRuKSB7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IChuZXh0QnRuIGFzIGFueSkuZGlzYWJsZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtZGlzYWJsZWQnKSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpO1xuICAgICAgaWYgKGRpc2FibGVkKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGdldFRvdGFsUGFnZXNGcm9tRG9tKCk6IG51bWJlciB7XG4gICAgLy8gMS4gQ2hlY2sgcGFyZW50IGNvbnRhaW5lciBvZiAjdG9vbGJhci1zZXE6IDxpbnB1dCBpZD1cInRvb2xiYXItc2VxXCI+IC4uLiA8c3Bhbj4vPC9zcGFuPiA8c3Bhbj4yNzI8L3NwYW4+XG4gICAgY29uc3Qgc2VxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbGJhci1zZXEsIGlucHV0W25hbWU9XCJzZXFcIl0nKTtcbiAgICBpZiAoc2VxSW5wdXQpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHNlcUlucHV0LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBwYXJlbnQudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvXFwvXFxzKihcXGQrKS8pO1xuICAgICAgICBpZiAobWF0Y2gpIHJldHVybiBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuXG4gICAgICAgIGNvbnN0IGh0bWxNYXRjaCA9IHBhcmVudC5pbm5lckhUTUwubWF0Y2goL1xcL1xccyo8XFwvc3Bhbj5cXHMqPHNwYW4+XFxzKihcXGQrKS9pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5uZXJIVE1MLm1hdGNoKC9cXC9cXHMqKFxcZCspLyk7XG4gICAgICAgIGlmIChodG1sTWF0Y2gpIHJldHVybiBwYXJzZUludChodG1sTWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWF4QXR0ciA9IHNlcUlucHV0LmdldEF0dHJpYnV0ZSgnbWF4Jyk7XG4gICAgICBpZiAobWF4QXR0cikge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChtYXhBdHRyLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIENoZWNrIHdpbmRvdy5tYW5pZmVzdCBpZiBwcmVzZW50IGluIHBhZ2VcbiAgICBjb25zdCB3ID0gd2luZG93IGFzIGFueTtcbiAgICBpZiAody5tYW5pZmVzdCAmJiB3Lm1hbmlmZXN0LnRvdGFsU2VxKSB7XG4gICAgICBjb25zdCB2YWwgPSBwYXJzZUludCh3Lm1hbmlmZXN0LnRvdGFsU2VxLCAxMCk7XG4gICAgICBpZiAoIWlzTmFOKHZhbCkgJiYgdmFsID4gMCkgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICAvLyAzLiBDaGVjayBnZW5lcmFsIHRleHQgZS5nLiBcIm9mIDI3MlwiIG9yIFwiLyAyNzJcIlxuICAgIGNvbnN0IHBhZ2luZ0VsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhZ2luZywgW2NsYXNzKj1cInBhZ2luZ1wiXSwgW2FyaWEtbGFiZWwqPVwidG90YWwgcGFnZXNcIiBpXScpO1xuICAgIGlmIChwYWdpbmdFbCAmJiBwYWdpbmdFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbSA9IHBhZ2luZ0VsLnRleHRDb250ZW50Lm1hdGNoKC9cXC9cXHMqKFxcZCspLykgfHwgcGFnaW5nRWwudGV4dENvbnRlbnQubWF0Y2goL29mXFxzKyhcXGQrKS9pKTtcbiAgICAgIGlmIChtKSByZXR1cm4gcGFyc2VJbnQobVsxXSwgMTApO1xuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9XG59XG4iLAogICAgImltcG9ydCB7IEJvb2tQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQXJjaGl2ZVByb3ZpZGVyIH0gZnJvbSAnLi9hcmNoaXZlLXByb3ZpZGVyJztcbmltcG9ydCB7IEhhdGhpVHJ1c3RQcm92aWRlciB9IGZyb20gJy4vaGF0aGl0cnVzdC1wcm92aWRlcic7XG5cbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9hcmNoaXZlLXByb3ZpZGVyJztcbmV4cG9ydCAqIGZyb20gJy4vaGF0aGl0cnVzdC1wcm92aWRlcic7XG5cbi8qKlxuICogUmVnaXN0cnkgb2Ygc3VwcG9ydGVkIGJvb2sgc2l0ZSBwcm92aWRlcnMuXG4gKi9cbmNvbnN0IHByb3ZpZGVyczogQm9va1Byb3ZpZGVyW10gPSBbXG4gIG5ldyBBcmNoaXZlUHJvdmlkZXIoKSxcbiAgbmV3IEhhdGhpVHJ1c3RQcm92aWRlcigpLFxuXTtcblxuLyoqXG4gKiBEZXRlY3RzIGFuZCByZXR1cm5zIHRoZSBhY3RpdmUgcHJvdmlkZXIgbWF0Y2hpbmcgdGhlIGN1cnJlbnQgd2VicGFnZS5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgY3VycmVudCBwYWdlIGlzIG5vdCBhIHN1cHBvcnRlZCBib29rIHZpZXdlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVByb3ZpZGVyKCk6IEJvb2tQcm92aWRlciB8IG51bGwge1xuICBmb3IgKGNvbnN0IHByb3ZpZGVyIG9mIHByb3ZpZGVycykge1xuICAgIGlmIChwcm92aWRlci5pc01hdGNoKCkpIHtcbiAgICAgIHJldHVybiBwcm92aWRlcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG4iLAogICAgIi8qKlxuICogQ29udGVudCBTY3JpcHQgKElzb2xhdGVkIFdvcmxkKSBmb3IgQXJjaGl2ZSBEb3dubG9hZGVyXG4gKiBNYW5hZ2VzIGF1dG9tYXRpb24sIHBhZ2UgY3ljbGluZywgdmVyaWZpY2F0aW9uLCBjYW52YXMgY2FwdHVyZSwgYW5kIHRleHQgZmV0Y2hpbmcuXG4gKi9cblxuaW1wb3J0IHsgQm9va0luZm8sIERvd25sb2FkZXJDb25maWcsIFByb2dyZXNzU3RhdGUsIEV4dGVuc2lvbk1lc3NhZ2UsIEJyaWRnZU1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBGbG9hdGluZ1BpbGwgfSBmcm9tICcuL3BpbGwnO1xuaW1wb3J0IHsgcGFyc2VEanZ1WG1sVG9UZXh0LCBidWlsZEJvb2tNYXJrZG93biwgUGFnZVRleHRFbnRyeSB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuaW1wb3J0IHsgY29tcGlsZUpwZWdzVG9QZGYsIFBkZkltYWdlSW5wdXQgfSBmcm9tICcuLi91dGlscy9wZGYtYnVpbGRlcic7XG5pbXBvcnQgeyBmb3JtYXRTdWJkaXIsIGZvcm1hdFBhZ2VGaWxlbmFtZSwgc2FuaXRpemVGaWxlbmFtZSB9IGZyb20gJy4uL3V0aWxzL3Nhbml0aXplcic7XG5pbXBvcnQgeyBnZXRBY3RpdmVQcm92aWRlciwgQm9va1Byb3ZpZGVyLCBBcmNoaXZlUHJvdmlkZXIsIEhhdGhpVHJ1c3RQcm92aWRlciB9IGZyb20gJy4uL3Byb3ZpZGVycyc7XG5cbihmdW5jdGlvbiBpbml0Q29udGVudFNjcmlwdCgpIHtcbiAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gSW5pdGlhbGl6ZWQgb24nLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG5cbiAgY29uc3QgcHJvdmlkZXI6IEJvb2tQcm92aWRlciB8IG51bGwgPSBnZXRBY3RpdmVQcm92aWRlcigpO1xuICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gTm8gbWF0Y2hpbmcgYm9vayBwcm92aWRlciBmb3InLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEFjdGl2ZSBwcm92aWRlcjogJHtwcm92aWRlci5zaXRlTmFtZX0gKCR7cHJvdmlkZXIuc2l0ZUlkfSlgKTtcblxuICAvLyBTdGF0ZVxuICBsZXQgYm9va0luZm86IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG4gIGxldCBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgbGV0IGlzUGF1c2VkID0gZmFsc2U7XG4gIGxldCBzdG9wUmVxdWVzdGVkID0gZmFsc2U7XG4gIGxldCBjdXJyZW50UGFnZSA9IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG4gIGxldCBkb3dubG9hZGVkUGFnZXMgPSAwO1xuICBsZXQgZmFpbGVkUGFnZXMgPSAwO1xuICBsZXQgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICBsZXQgbGFzdERpbWVuc2lvbnMgPSB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfTtcbiAgbGV0IGNvbGxlY3RlZEltYWdlczogUGRmSW1hZ2VJbnB1dFtdID0gW107XG4gIGxldCBjb2xsZWN0ZWRUZXh0czogUGFnZVRleHRFbnRyeVtdID0gW107XG4gIGxldCBpc0VuZE9mQm9vayA9IGZhbHNlO1xuXG4gIGludGVyZmFjZSBIdHRwRXJyb3JJbmZvIHtcbiAgICBzdGF0dXNDb2RlOiBudW1iZXI7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgdGltZXN0YW1wOiBudW1iZXI7XG4gICAgcmV0cnlBZnRlcj86IG51bWJlcjtcbiAgfVxuXG4gIGxldCBsYXN0SHR0cEVycm9yOiBIdHRwRXJyb3JJbmZvIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjb25zZWN1dGl2ZUVycm9yQ291bnQgPSAwO1xuXG4gIGZ1bmN0aW9uIG9uSHR0cEVycm9yUmVjZWl2ZWQoc3RhdHVzQ29kZTogbnVtYmVyLCB1cmw6IHN0cmluZywgcmV0cnlBZnRlcj86IG51bWJlcikge1xuICAgIGNvbnN0IGlzQm9va1JlbGF0ZWQgPVxuICAgICAgdXJsLmluY2x1ZGVzKCdpbWdzcnYnKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCdCb29rUmVhZGVyJykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnL2NnaS9wdCcpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2RldGFpbHMnKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCdoYXRoaXRydXN0Lm9yZycpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2FyY2hpdmUub3JnJyk7XG5cbiAgICBpZiAoIWlzQm9va1JlbGF0ZWQpIHJldHVybjtcblxuICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7c3RhdHVzQ29kZX0gZGV0ZWN0ZWQgZm9yICR7dXJsfWApO1xuICAgIGxhc3RIdHRwRXJyb3IgPSB7XG4gICAgICBzdGF0dXNDb2RlLFxuICAgICAgdXJsLFxuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgcmV0cnlBZnRlcixcbiAgICB9O1xuICB9XG5cbiAgLy8gTG9hZCBzYXZlZCBzZXR0aW5ncyBmcm9tIGxvY2FsU3RvcmFnZSBmaXJzdFxuICBjb25zdCBsb2NhbFNhdmVQYXRoID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zYXZlX3BhdGgnKTtcbiAgY29uc3QgbG9jYWxGb2xkZXJQYXR0ZXJuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9mb2xkZXJfcGF0dGVybicpO1xuICBjb25zdCBsb2NhbFN0YXJ0UGFnZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc3RhcnRfcGFnZScpO1xuICBjb25zdCBsb2NhbEVuZFBhZ2UgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2VuZF9wYWdlJyk7XG4gIGNvbnN0IGxvY2FsTWF4SGVpZ2h0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9tYXhfaGVpZ2h0Jyk7XG5cbiAgbGV0IGluaXRpYWxTdGFydFBhZ2UgPSBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlO1xuICBpZiAobG9jYWxTdGFydFBhZ2UgIT09IG51bGwpIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChsb2NhbFN0YXJ0UGFnZSwgMTApO1xuICAgIGlmICghaXNOYU4ocGFyc2VkKSAmJiBwYXJzZWQgPj0gcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZSkge1xuICAgICAgaW5pdGlhbFN0YXJ0UGFnZSA9IHBhcnNlZDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBkZWZhdWx0Q29uZmlnOiBEb3dubG9hZGVyQ29uZmlnID0ge1xuICAgIGJhc2VEaXI6IGxvY2FsU2F2ZVBhdGggfHwgJ0FyY2hpdmVCb29rcycsXG4gICAgZm9sZGVyUGF0dGVybjogbG9jYWxGb2xkZXJQYXR0ZXJuIHx8ICd7dGl0bGV9X3tpZH0nLFxuICAgIHNhdmVJbWFnZXM6IGZhbHNlLFxuICAgIGdlbmVyYXRlUGRmOiB0cnVlLFxuICAgIHNhdmVUZXh0TWQ6IHRydWUsXG4gICAgaW1hZ2VRdWFsaXR5OiAwLjc1LFxuICAgIG1heFBhZ2VIZWlnaHQ6IGxvY2FsTWF4SGVpZ2h0ICE9PSBudWxsID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobG9jYWxNYXhIZWlnaHQsIDEwKSkgOiAwLFxuICAgIHBhZ2VEZWxheU1zOiA1MDAsXG4gICAgcGFnZUNoYW5nZVRpbWVvdXRNczogMTAwMDAsXG4gICAgbWF4UmV0cmllczogMTAsXG4gICAgYXV0b1NpbmdsZVBhZ2U6IHRydWUsXG4gICAgc3RhcnRQYWdlOiBpbml0aWFsU3RhcnRQYWdlLFxuICAgIGVuZFBhZ2U6IGxvY2FsRW5kUGFnZSAhPT0gbnVsbCA/IE1hdGgubWF4KDAsIHBhcnNlSW50KGxvY2FsRW5kUGFnZSwgMTApKSA6IDAsXG4gICAgZGVsZXRlSW1hZ2VzT25Db21wbGV0ZTogdHJ1ZSxcbiAgfTtcblxuICBsZXQgY29uZmlnOiBEb3dubG9hZGVyQ29uZmlnID0geyAuLi5kZWZhdWx0Q29uZmlnIH07XG5cbiAgZnVuY3Rpb24gc2F2ZUNvbmZpZyh1cGRhdGVkOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KSB7XG4gICAgY29uZmlnID0geyAuLi5jb25maWcsIC4uLnVwZGF0ZWQgfTtcbiAgICBpZiAoY29uZmlnLmJhc2VEaXIpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc2F2ZV9wYXRoJywgY29uZmlnLmJhc2VEaXIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmZvbGRlclBhdHRlcm4pIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZm9sZGVyX3BhdHRlcm4nLCBjb25maWcuZm9sZGVyUGF0dGVybik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29uZmlnLnN0YXJ0UGFnZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc3RhcnRfcGFnZScsIFN0cmluZyhjb25maWcuc3RhcnRQYWdlKSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29uZmlnLmVuZFBhZ2UgPT09ICdudW1iZXInKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2VuZF9wYWdlJywgU3RyaW5nKGNvbmZpZy5lbmRQYWdlKSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29uZmlnLm1heFBhZ2VIZWlnaHQgPT09ICdudW1iZXInKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX21heF9oZWlnaHQnLCBTdHJpbmcoY29uZmlnLm1heFBhZ2VIZWlnaHQpKTtcbiAgICB9XG4gICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoeyBkb3dubG9hZGVyQ29uZmlnOiBjb25maWcgfSk7XG4gICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgfVxuXG4gIC8vIExvYWQgdXNlciBjb25maWcgZnJvbSBjaHJvbWUuc3RvcmFnZVxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChbJ2xpYmVyYXRvckNvbmZpZycsICdkb3dubG9hZGVyQ29uZmlnJ10sIChyZXMpID0+IHtcbiAgICBjb25zdCBzYXZlZCA9IHJlcy5kb3dubG9hZGVyQ29uZmlnIHx8IHJlcy5saWJlcmF0b3JDb25maWc7XG4gICAgaWYgKHNhdmVkKSB7XG4gICAgICBjb25zdCBsb2NhbFBhdGggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX3NhdmVfcGF0aCcpO1xuICAgICAgY29uZmlnID0ge1xuICAgICAgICAuLi5kZWZhdWx0Q29uZmlnLFxuICAgICAgICAuLi5zYXZlZCxcbiAgICAgICAgLi4uKGxvY2FsUGF0aCA/IHsgYmFzZURpcjogbG9jYWxQYXRoIH0gOiB7fSksXG4gICAgICB9O1xuICAgICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEZsb2F0aW5nIFBpbGwgVUkgd2l0aCBmdWxsIGNhbGxiYWNrc1xuICBjb25zdCBwaWxsID0gbmV3IEZsb2F0aW5nUGlsbCh7XG4gICAgb25TdGFydDogKCkgPT4gc3RhcnREb3dubG9hZCgpLFxuICAgIG9uUGF1c2U6ICgpID0+IHBhdXNlRG93bmxvYWQoKSxcbiAgICBvblJlc3VtZTogKCkgPT4gcmVzdW1lRG93bmxvYWQoKSxcbiAgICBvblN0b3A6ICgpID0+IGhhbmRsZVN0b3BSZXF1ZXN0KCksXG4gICAgb25TYXZlU2V0dGluZ3M6IChuZXdTZXR0aW5ncykgPT4ge1xuICAgICAgc2F2ZUNvbmZpZyhuZXdTZXR0aW5ncyk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBTZXR0aW5ncyBzYXZlZCB0byBsb2NhbFN0b3JhZ2U6JywgbmV3U2V0dGluZ3MpO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IGlzUnVubmluZyA/IChpc1BhdXNlZCA/ICdwYXVzZWQnIDogJ2Rvd25sb2FkaW5nJykgOiAnaWRsZScsXG4gICAgICAgIHN0YXR1c1RleHQ6ICdTZXR0aW5ncyBzYXZlZCB0byBsb2NhbFN0b3JhZ2UnLFxuICAgICAgfSk7XG4gICAgfSxcbiAgICBvblN3aXRjaE1vZGU6ICgpID0+IGVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpLFxuICAgIG9uVmlld0ZpbGU6ICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIE9wZW5pbmcgZG93bmxvYWRlZCBmaWxlIGluIEZpbmRlci9FeHBsb3Jlci4uLicpO1xuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiAnT1BFTl9ET1dOTE9BRCcgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgaWYgKHBpbGwuc2hvdWxkUmVuZGVyKCkpIHtcbiAgICBwaWxsLnJlbmRlcigpO1xuICAgIHBpbGwuc2V0Q29uZmlnKGNvbmZpZyk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiByZWZyZXNoQm9va0luZm8oKSB7XG4gICAgY29uc3QgZGV0ZWN0ZWQgPSBhd2FpdCBwcm92aWRlci5kZXRlY3RCb29rSW5mbygpO1xuICAgIGlmIChkZXRlY3RlZCkge1xuICAgICAgYm9va0luZm8gPSBkZXRlY3RlZDtcbiAgICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFyY2hpdmVQcm92aWRlcikge1xuICAgICAgICBwcm92aWRlci5zZXRCb29rSW5mbyhib29rSW5mbyk7XG4gICAgICB9XG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBib29rSW5mby5jdXJyZW50TGVhZiA/PyBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlLFxuICAgICAgICBib29rSW5mby50b3RhbFBhZ2VzLFxuICAgICAgICAnUmVhZHknLFxuICAgICAgICAnbm9ybWFsJyxcbiAgICAgICAgaXNQYXVzZWQsXG4gICAgICAgIGlzUnVubmluZyxcbiAgICAgICAgYm9va0luZm8uY3VycmVudE1vZGUgPz8gMSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJyaWRnZSBsaXN0ZW5lciBmb3IgTUFJTiB3b3JsZCBldmVudHMgKEhUVFAgZXJyb3IgaW50ZXJjZXB0aW9uICYgQXJjaGl2ZS5vcmcgQm9va1JlYWRlcilcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cgfHwgIWV2ZW50LmRhdGEgfHwgZXZlbnQuZGF0YS5kaXJlY3Rpb24gIT09ICdGUk9NX0JSSURHRScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhIGFzIEJyaWRnZU1lc3NhZ2U7XG5cbiAgICAvLyBJbnRlcmNlcHQgYW55IG5vbi0yMDAgSFRUUCBzdGF0dXMgKDQyOSwgNTAwLCA0MDEsIGV0Yy4pXG4gICAgaWYgKG1zZy5ldmVudCA9PT0gJ0hUVFBfRVJST1InKSB7XG4gICAgICBvbkh0dHBFcnJvclJlY2VpdmVkKG1zZy5zdGF0dXNDb2RlLCBtc2cudXJsLCBtc2cucmV0cnlBZnRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRm9yd2FyZCBIYXRoaVRydXN0IHBhZ2UgYW5ub3VuY2VtZW50cywgaW1hZ2VzLCBhbmQgT0NSIHRleHQgdG8gcHJvdmlkZXJcbiAgICBpZiAocHJvdmlkZXIgaW5zdGFuY2VvZiBIYXRoaVRydXN0UHJvdmlkZXIpIHtcbiAgICAgIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0xPQURfQU5OT1VOQ0VEJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VMb2FkQW5ub3VuY2VkKG1zZy5zZXEsIG1zZy5pc1Zpc2libGUsIG1zZy5pc0xvYWRlZCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9JTUFHRV9SRUFEWScpIHtcbiAgICAgICAgcHJvdmlkZXIub25QYWdlSW1hZ2VSZWFkeShtc2cuc2VxLCBtc2cuYmxvYlVybCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9URVhUX1JFQURZJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VUZXh0UmVhZHkobXNnLnNlcSwgbXNnLmh0bWwpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1zZy5ldmVudCA9PT0gJ0JPT0tfSU5GTycpIHtcbiAgICAgIGJvb2tJbmZvID0gbXNnLmRhdGE7XG4gICAgICBpZiAocHJvdmlkZXIgaW5zdGFuY2VvZiBBcmNoaXZlUHJvdmlkZXIpIHtcbiAgICAgICAgcHJvdmlkZXIuc2V0Qm9va0luZm8oYm9va0luZm8pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkb21DdXJyZW50ID0gcHJvdmlkZXIuZ2V0Q3VycmVudFBhZ2UoKTtcbiAgICAgIGlmIChkb21DdXJyZW50ICE9PSBudWxsICYmICghYm9va0luZm8udG90YWxQYWdlcyB8fCBkb21DdXJyZW50ID4gKGJvb2tJbmZvLmN1cnJlbnRMZWFmID8/IDApKSkge1xuICAgICAgICBib29rSW5mby5jdXJyZW50TGVhZiA9IGRvbUN1cnJlbnQ7XG4gICAgICB9XG5cbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID8/IDAsXG4gICAgICAgIGJvb2tJbmZvLnRvdGFsUGFnZXMsXG4gICAgICAgICdSZWFkeScsXG4gICAgICAgICdub3JtYWwnLFxuICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgaXNSdW5uaW5nLFxuICAgICAgICBib29rSW5mby5jdXJyZW50TW9kZSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSgpO1xuICAgIH0gZWxzZSBpZiAobXNnLmV2ZW50ID09PSAnTU9ERV9DSEFOR0VEJykge1xuICAgICAgaWYgKGJvb2tJbmZvKSB7XG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRNb2RlID0gbXNnLm1vZGU7XG4gICAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgICAgY3VycmVudFBhZ2UsXG4gICAgICAgICAgYm9va0luZm8udG90YWxQYWdlcyxcbiAgICAgICAgICAnMS1QYWdlIE1vZGUgQWN0aXZlJyxcbiAgICAgICAgICAnbm9ybWFsJyxcbiAgICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgICBpc1J1bm5pbmcsXG4gICAgICAgICAgbXNnLm1vZGUsXG4gICAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIEluaXRpYWwgZGV0ZWN0aW9uXG4gIHJlZnJlc2hCb29rSW5mbygpO1xuICBzZXRUaW1lb3V0KCgpID0+IHJlZnJlc2hCb29rSW5mbygpLCA4MDApO1xuXG4gIC8vIE5ldHdvcmsgY29ubmVjdGlvbiBsaXN0ZW5lcnNcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCAoKSA9PiB7XG4gICAgY29uc29sZS53YXJuKCdbQXJjaGl2ZURvd25sb2FkZXJdIE5ldHdvcmsgY29ubmVjdGlvbiBsb3N0IChvZmZsaW5lKScpO1xuICAgIGlmIChpc1J1bm5pbmcgJiYgIWlzUGF1c2VkKSB7XG4gICAgICBpc1BhdXNlZCA9IHRydWU7XG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMCxcbiAgICAgICAgJ09mZmxpbmUgLSBQYXVzZWQnLFxuICAgICAgICAnb2ZmbGluZScsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWUsXG4gICAgICAgIGJvb2tJbmZvPy5jdXJyZW50TW9kZSB8fCAxLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnb2ZmbGluZScsIGlzT2ZmbGluZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvbmxpbmUnLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gTmV0d29yayBjb25uZWN0aW9uIHJlc3RvcmVkIChvbmxpbmUpJyk7XG4gICAgaWYgKGlzUnVubmluZyAmJiBpc1BhdXNlZCkge1xuICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgY3VycmVudFBhZ2UsXG4gICAgICAgIGJvb2tJbmZvPy50b3RhbFBhZ2VzIHx8IDAsXG4gICAgICAgICdPbmxpbmUgLSBDbGljayBDT05USU5VRScsXG4gICAgICAgICdzdGFsbGVkJyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgICApO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdzdGFsbGVkJywgaXNPZmZsaW5lOiBmYWxzZSB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEhlbHBlcnNcbiAgY29uc3Qgc2xlZXAgPSAobXM6IG51bWJlcikgPT4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG5cbiAgZnVuY3Rpb24gYnJvYWRjYXN0U3RhdGUoZXh0cmE6IFBhcnRpYWw8UHJvZ3Jlc3NTdGF0ZT4gPSB7fSkge1xuICAgIGNvbnN0IHRvdGFsID0gYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgY29uZmlnLmVuZFBhZ2UgfHwgMTtcbiAgICBsZXQgc3RhdHVzVHlwZTogJ25vcm1hbCcgfCAncmV0cnlpbmcnIHwgJ29mZmxpbmUnIHwgJ3N0YWxsZWQnIHwgJ2NvbXBsZXRlJyA9ICdub3JtYWwnO1xuXG4gICAgaWYgKGV4dHJhLnN0YXR1cyA9PT0gJ3N0YWxsZWQnKSBzdGF0dXNUeXBlID0gJ3N0YWxsZWQnO1xuICAgIGVsc2UgaWYgKGV4dHJhLnN0YXR1cyA9PT0gJ3JldHJ5aW5nJykgc3RhdHVzVHlwZSA9ICdyZXRyeWluZyc7XG4gICAgZWxzZSBpZiAoIW5hdmlnYXRvci5vbkxpbmUpIHN0YXR1c1R5cGUgPSAnb2ZmbGluZSc7XG4gICAgZWxzZSBpZiAoZXh0cmEuc3RhdHVzID09PSAnY29tcGxldGUnKSBzdGF0dXNUeXBlID0gJ2NvbXBsZXRlJztcblxuICAgIGNvbnN0IHN0YXRlOiBQcm9ncmVzc1N0YXRlID0ge1xuICAgICAgc3RhdHVzOiBpc1J1bm5pbmcgPyAoaXNQYXVzZWQgPyAoc3RhdHVzVHlwZSA9PT0gJ3N0YWxsZWQnID8gJ3N0YWxsZWQnIDogJ3BhdXNlZCcpIDogJ2Rvd25sb2FkaW5nJykgOiAoZXh0cmEuc3RhdHVzIHx8ICdpZGxlJyksXG4gICAgICBjdXJyZW50UGFnZSxcbiAgICAgIHRvdGFsUGFnZXM6IHRvdGFsLFxuICAgICAgZG93bmxvYWRlZFBhZ2VzLFxuICAgICAgZmFpbGVkUGFnZXMsXG4gICAgICByZXRyeUNvdW50OiBjdXJyZW50UmV0cnlDb3VudCxcbiAgICAgIHN0YXR1c1RleHQ6IGlzUGF1c2VkID8gKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyA/ICdTdGFsbGVkIC0gQ2xpY2sgQ09OVElOVUUnIDogJ1BhdXNlZCcpIDogKGlzUnVubmluZyA/IGBDYXB0dXJpbmcgcGFnZSAke2N1cnJlbnRQYWdlfWAgOiAnUmVhZHknKSxcbiAgICAgIGJvb2tJbmZvOiBib29rSW5mbyB8fCB1bmRlZmluZWQsXG4gICAgICBpc1BhdXNlZCxcbiAgICAgIGlzT2ZmbGluZTogIW5hdmlnYXRvci5vbkxpbmUsXG4gICAgICBpbWFnZURpbWVuc2lvbnM6IGxhc3REaW1lbnNpb25zLFxuICAgICAgLi4uZXh0cmEsXG4gICAgfTtcblxuICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICBjdXJyZW50UGFnZSxcbiAgICAgIHRvdGFsLFxuICAgICAgc3RhdGUuc3RhdHVzVGV4dCxcbiAgICAgIHN0YXR1c1R5cGUsXG4gICAgICBpc1BhdXNlZCxcbiAgICAgIGlzUnVubmluZyxcbiAgICAgIGJvb2tJbmZvPy5jdXJyZW50TW9kZSB8fCAxLFxuICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICApO1xuXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiAnU1RBVEVfVVBEQVRFJywgc3RhdGUgfSkuY2F0Y2goKCkgPT4ge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZm9yY2VzIDEtcGFnZSB2aWV3IG1vZGUgdmlhIHByb3ZpZGVyIGlmIHN1cHBvcnRlZC5cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAocHJvdmlkZXIuZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBFbmZvcmNpbmcgc2luZ2xlLXBhZ2UgbW9kZSBvbiAke3Byb3ZpZGVyLnNpdGVOYW1lfS4uLmApO1xuICAgICAgcmV0dXJuIGF3YWl0IHByb3ZpZGVyLmVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYXB0dXJlcyBpbWFnZSBmcm9tIERPTSBlbGVtZW50IHRvIEpQRUcgRGF0YSBVUkwgdXNpbmcgYW4gb2Zmc2NyZWVuIGNhbnZhcy5cbiAgICogUHJvcG9ydGlhbmFsbHkgZG93bnNjYWxlcyBpZiBtYXhQYWdlSGVpZ2h0ID4gMCBhbmQgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodC5cbiAgICovXG4gIGZ1bmN0aW9uIGNhcHR1cmVJbWFnZVRvRGF0YVVybChpbWc6IEhUTUxJbWFnZUVsZW1lbnQsIHF1YWxpdHkgPSAwLjc1LCBtYXhQYWdlSGVpZ2h0ID0gMCk6IHN0cmluZyB7XG4gICAgbGV0IHdpZHRoID0gaW1nLm5hdHVyYWxXaWR0aDtcbiAgICBsZXQgaGVpZ2h0ID0gaW1nLm5hdHVyYWxIZWlnaHQ7XG5cbiAgICBpZiAobWF4UGFnZUhlaWdodCA+IDAgJiYgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgY29uc3Qgc2NhbGUgPSBtYXhQYWdlSGVpZ2h0IC8gaGVpZ2h0O1xuICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICB9XG5cbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGlmICghY3R4KSB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBvYnRhaW4gY2FudmFzIDJEIGNvbnRleHQnKTtcblxuICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIHF1YWxpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbm9uLTIwMCBIVFRQIHJlc3BvbnNlcyAoNDI5LCA1MDAsIDUwMiwgNTAzLCA0MDEsIDQwMywgZXRjLilcbiAgICogLSA0MDEvNDAzOiBQYXVzZXMgZG93bmxvYWQgdG8gbGV0IHVzZXIgYXV0aGVudGljYXRlIG9yIHJlbmV3IGxvYW5cbiAgICogLSA0MjkgJiA1eHg6IEluaXRpYXRlcyBleHBvbmVudGlhbCBiYWNrb2ZmIHdpdGggbGl2ZSBjb3VudGRvd24gYW5kIGluY3JlYXNlcyBwYWNpbmdcbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyOiBIdHRwRXJyb3JJbmZvLCB0YXJnZXRQYWdlTnVtOiBudW1iZXIpIHtcbiAgICBjb25zZWN1dGl2ZUVycm9yQ291bnQrKztcblxuICAgIC8vIDQwMSAvIDQwMzogQXV0aC9Gb3JiaWRkZW5cbiAgICBpZiAoZXJyLnN0YXR1c0NvZGUgPT09IDQwMSB8fCBlcnIuc3RhdHVzQ29kZSA9PT0gNDAzKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbQXJjaGl2ZURvd25sb2FkZXJdIEFjY2VzcyByZXN0cmljdGVkIChIVFRQICR7ZXJyLnN0YXR1c0NvZGV9KSBvbiAke2Vyci51cmx9LiBQYXVzaW5nLmApO1xuICAgICAgaXNQYXVzZWQgPSB0cnVlO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgICAgICBzdGF0dXNUZXh0OiBgQWNjZXNzIHJlc3RyaWN0ZWQgKEhUVFAgJHtlcnIuc3RhdHVzQ29kZX0pLiBQbGVhc2UgY2hlY2sgbG9naW4gb3IgbG9hbiBzdGF0dXMuYCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJhdGUgTGltaXRpbmcgKDQyOSkgJiBTZXJ2ZXIgRXJyb3JzICg1MDAsIDUwMiwgNTAzLCA1MDQpXG4gICAgLy8gSWYgdGhlIHNlcnZlciBleHBsaWNpdGx5IHNwZWNpZmllcyBSZXRyeS1BZnRlciwgaG9ub3IgaXQuXG4gICAgLy8gT3RoZXJ3aXNlIGZhbGxiYWNrIHRvIGV4cG9uZW50aWFsIGJhY2tvZmY6IDEwcywgMjBzLCA0MHMsIGNhcHBlZCBhdCA2MHMuXG4gICAgY29uc3QgaXNTZXJ2ZXJSZXF1ZXN0ZWQgPSB0eXBlb2YgZXJyLnJldHJ5QWZ0ZXIgPT09ICdudW1iZXInICYmICFpc05hTihlcnIucmV0cnlBZnRlcikgJiYgZXJyLnJldHJ5QWZ0ZXIgPiAwO1xuICAgIGNvbnN0IGJhc2VTZWNvbmRzID0gaXNTZXJ2ZXJSZXF1ZXN0ZWRcbiAgICAgID8gZXJyLnJldHJ5QWZ0ZXJcbiAgICAgIDogTWF0aC5taW4oMTAgKiBNYXRoLnBvdygyLCBNYXRoLm1heCgwLCBjb25zZWN1dGl2ZUVycm9yQ291bnQgLSAxKSksIDYwKTtcblxuICAgIC8vIEF1dG9tYXRpY2FsbHkgaW5jcmVhc2UgaW50ZXItcGFnZSBwYWNpbmcgZGVsYXkgdG8gcHJldmVudCByZWN1cnJpbmcgZXJyb3JzXG4gICAgY29uc3QgcHJldkRlbGF5ID0gY29uZmlnLnBhZ2VEZWxheU1zO1xuICAgIGNvbmZpZy5wYWdlRGVsYXlNcyA9IE1hdGgubWluKE1hdGgubWF4KGNvbmZpZy5wYWdlRGVsYXlNcywgMTUwMCkgKyA1MDAsIDUwMDApO1xuICAgIGlmIChjb25maWcucGFnZURlbGF5TXMgIT09IHByZXZEZWxheSkge1xuICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gSW5jcmVhc2VkIHBhZ2UgcGFjaW5nIGRlbGF5IHRvICR7Y29uZmlnLnBhZ2VEZWxheU1zfW1zLmApO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IGVyci5zdGF0dXNDb2RlID09PSA0MjlcbiAgICAgID8gJ1JhdGUgTGltaXRlZCdcbiAgICAgIDogKGVyci5zdGF0dXNDb2RlID49IDUwMCA/IGBTZXJ2ZXIgRXJyb3IgKCR7ZXJyLnN0YXR1c0NvZGV9KWAgOiBgSFRUUCAke2Vyci5zdGF0dXNDb2RlfWApO1xuXG4gICAgaWYgKGlzU2VydmVyUmVxdWVzdGVkKSB7XG4gICAgICBsYWJlbCArPSAnIChzZXJ2ZXIgYXNrZWQpJztcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gJHtsYWJlbH0gb24gJHtlcnIudXJsfS4gQmFja2luZyBvZmYgZm9yICR7TWF0aC5yb3VuZChiYXNlU2Vjb25kcyl9cy4uLmApO1xuXG4gICAgZm9yIChsZXQgcmVtYWluaW5nID0gTWF0aC5yb3VuZChiYXNlU2Vjb25kcyk7IHJlbWFpbmluZyA+IDA7IHJlbWFpbmluZy0tKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuO1xuICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm47XG4gICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERpc3BsYXkgaW4gbWludXRlcyBpZiBtb3JlIHRoYW4gMTIwcywgb3RoZXJ3aXNlIGluIHNlY29uZHNcbiAgICAgIGNvbnN0IHRpbWVTdHIgPSByZW1haW5pbmcgPiAxMjBcbiAgICAgICAgPyBgJHtNYXRoLnJvdW5kKHJlbWFpbmluZyAvIDYwKX1tYFxuICAgICAgICA6IGAke3JlbWFpbmluZ31zYDtcblxuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdyZXRyeWluZycsXG4gICAgICAgIHJldHJ5Q291bnQ6IGNvbnNlY3V0aXZlRXJyb3JDb3VudCxcbiAgICAgICAgc3RhdHVzVGV4dDogYCR7dGltZVN0cn0gUmV0cnlpbmc6ICR7bGFiZWx9LmAsXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHNsZWVwKDEwMDApO1xuICAgIH1cblxuICAgIC8vIEJhY2tvZmYgY29tcGxldGUhIFJlLW5hdmlnYXRlIHRvIHRhcmdldFBhZ2VOdW0gc28gcmVhZGVyIHJlLWZldGNoZXMgY2xlYW5seVxuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEJhY2tvZmYgY29tcGxldGVkLiBSZS1yZXF1ZXN0aW5nIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4uLmApO1xuICAgIGF3YWl0IHByb3ZpZGVyLnRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtKTtcbiAgICBhd2FpdCBzbGVlcCg4MDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEZhc3QgUGFnZSBUdXJuICYgV2FpdCBFbmdpbmU6XG4gICAqIDEuIFRyaWdnZXJzIHBhZ2UgZmxpcCB2aWEgcHJvdmlkZXIuXG4gICAqIDIuIFBvbGxzIGF0IGhpZ2ggZnJlcXVlbmN5ICgxMDBtcykgYW5kIHJldHVybnMgdGhlIG5ldyBpbWFnZSBpbW1lZGlhdGVseSBvbmNlIHZpc2libGUuXG4gICAqIDMuIFJlamVjdHMgcGFnZSBsb2FkIGlmIGFueSBub24tMjAwIEhUVFAgcmVzcG9uc2UgKDQyOSwgNTAwLCA0MDEsIGV0Yy4pIHdhcyByZWNlaXZlZC5cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHR1cm5BbmRHZXROZXh0SW1hZ2UoXG4gICAgbGFzdFNyYzogc3RyaW5nLFxuICAgIHRhcmdldFBhZ2VOdW06IG51bWJlclxuICApOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsPiB7XG4gICAgbGV0IHJldHJ5QXR0ZW1wdCA9IDA7XG4gICAgaXNFbmRPZkJvb2sgPSBmYWxzZTtcblxuICAgIHdoaWxlIChyZXRyeUF0dGVtcHQgPD0gY29uZmlnLm1heFJldHJpZXMpIHtcbiAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcblxuICAgICAgLy8gSGFuZGxlIHBhdXNlIC8gb2ZmbGluZVxuICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgYXdhaXQgc2xlZXAoNTAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gMS4gQ2hlY2sgaWYgcmVhZGVyIGlzIGFscmVhZHkgYXQgZW5kIG9mIGJvb2tcbiAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwO1xuICAgICAgaWYgKHByb3ZpZGVyLmlzQXRFbmRPZkJvb2sgJiYgcHJvdmlkZXIuaXNBdEVuZE9mQm9vayh0YXJnZXRQYWdlTnVtLCB0b3RhbFBhZ2VzKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBFbmQgb2YgYm9vayByZWFjaGVkIGF0IHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS5gKTtcbiAgICAgICAgaXNFbmRPZkJvb2sgPSB0cnVlO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG9tUGFnZUJlZm9yZSA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICBpZiAodG90YWxQYWdlcyA+IDAgJiYgZG9tUGFnZUJlZm9yZSAhPT0gbnVsbCAmJiBkb21QYWdlQmVmb3JlID49IHRvdGFsUGFnZXMgJiYgdGFyZ2V0UGFnZU51bSA+IHRvdGFsUGFnZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRW5kIG9mIGJvb2sgcmVhY2hlZCBhdCBwYWdlICR7ZG9tUGFnZUJlZm9yZX0uYCk7XG4gICAgICAgIGlzRW5kT2ZCb29rID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIDIuIENoZWNrIGlmIHRoZSBwYWdlIGhhcyBBTFJFQURZIHR1cm5lZCBmb3J3YXJkIHRvIG9yIHBhc3QgdGFyZ2V0UGFnZU51bVxuICAgICAgY29uc3QgYWxyZWFkeVR1cm5lZCA9IGRvbVBhZ2VCZWZvcmUgIT09IG51bGwgJiYgZG9tUGFnZUJlZm9yZSA+PSB0YXJnZXRQYWdlTnVtO1xuXG4gICAgICBpZiAoIWFscmVhZHlUdXJuZWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRmxpcHBpbmcgdG8gcGFnZSAke3RhcmdldFBhZ2VOdW19IChhdHRlbXB0ICR7cmV0cnlBdHRlbXB0ICsgMX0vJHtjb25maWcubWF4UmV0cmllcyArIDF9KS4uLmApO1xuICAgICAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBET00gaW5kaWNhdGVzIHBhZ2UgaXMgYWxyZWFkeSBvbiBzZXF1ZW5jZS9sZWFmICR7ZG9tUGFnZUJlZm9yZX0uIFdhaXRpbmcgZm9yIGltYWdlLmApO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiBGYXN0IHBvbGwgd2l0aCBIVFRQIGVycm9yIHJlamVjdGlvblxuICAgICAgY29uc3QgY2hlY2tTdGFydCA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCB0aW1lb3V0TXMgPSA1MDAwOyAvLyA1IHNlY29uZHMgbWF4IHBlciBmbGlwIGF0dGVtcHRcblxuICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBjaGVja1N0YXJ0IDwgdGltZW91dE1zKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIHJldHVybiBudWxsO1xuICAgICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDUklUSUNBTDogUmVqZWN0IHBhZ2UgbG9hZCBpZiBhbiBIVFRQIGVycm9yICg0MjksIDUwMCwgNDAxLCBldGMuKSBvY2N1cnJlZCFcbiAgICAgICAgaWYgKGxhc3RIdHRwRXJyb3IgJiYgKERhdGUubm93KCkgLSBsYXN0SHR0cEVycm9yLnRpbWVzdGFtcCA8IDEwMDAwKSkge1xuICAgICAgICAgIGNvbnN0IGVyciA9IGxhc3RIdHRwRXJyb3I7XG4gICAgICAgICAgbGFzdEh0dHBFcnJvciA9IG51bGw7IC8vIGNvbnN1bWUgZXJyb3JcbiAgICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3RhcmdldFBhZ2VOdW19IGxvYWQgcmVqZWN0ZWQgZHVlIHRvIEhUVFAgJHtlcnIuc3RhdHVzQ29kZX0gb24gJHtlcnIudXJsfWApO1xuXG4gICAgICAgICAgLy8gSW5pdGlhdGUgYmFja29mZlxuICAgICAgICAgIGF3YWl0IGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyLCB0YXJnZXRQYWdlTnVtKTtcblxuICAgICAgICAgIC8vIFJlc3RhcnQgcG9sbGluZyBhZnRlciBiYWNrb2ZmXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBzbGVlcCgxMDApO1xuXG4gICAgICAgIGNvbnN0IGFjdGl2ZUltZyA9IHByb3ZpZGVyLmdldEFjdGl2ZVBhZ2VJbWFnZSgzMDAsIHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICBpZiAoYWN0aXZlSW1nICYmIGFjdGl2ZUltZy5jb21wbGV0ZSAmJiBhY3RpdmVJbWcubmF0dXJhbFdpZHRoID49IDMwMCkge1xuICAgICAgICAgIC8vIERvdWJsZSBjaGVjayBubyBwZW5kaW5nIEhUVFAgZXJyb3IgYmVmb3JlIGFjY2VwdGluZyBpbWFnZVxuICAgICAgICAgIGlmIChsYXN0SHR0cEVycm9yICYmIChEYXRlLm5vdygpIC0gbGFzdEh0dHBFcnJvci50aW1lc3RhbXAgPCAzMDAwKSkge1xuICAgICAgICAgICAgY29udGludWU7IC8vIERvIG5vdCBhY2NlcHQgaW1hZ2Ugd2hlbiBlcnJvciBpcyBwZW5kaW5nIVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFzIHNvb24gYXMgdGhlIGltYWdlIGlzIHZpc2libGUgd2l0aCBhIG5ldyBzcmMgKG9yIGNvbmZpcm1lZCBtYXRjaGluZyB0YXJnZXRQYWdlTnVtKSwgcmV0dXJuIGl0IVxuICAgICAgICAgIGNvbnN0IGlzVGFyZ2V0U2VxID0gYWN0aXZlSW1nLmRhdGFzZXQuc2VxID09PSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgICAgaWYgKGFjdGl2ZUltZy5zcmMgJiYgKGFjdGl2ZUltZy5zcmMgIT09IGxhc3RTcmMgfHwgaXNUYXJnZXRTZXEpKSB7XG4gICAgICAgICAgICBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gICAgICAgICAgICBjb25zZWN1dGl2ZUVycm9yQ291bnQgPSAwO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3RhcmdldFBhZ2VOdW19IHZpc2libGUgKCR7YWN0aXZlSW1nLm5hdHVyYWxXaWR0aH14JHthY3RpdmVJbWcubmF0dXJhbEhlaWdodH1weCkhYCk7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlSW1nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aW1lZCBvdXQgb3IgYmFja2VkIG9mZiB3aXRob3V0IHBhZ2UgY2hhbmdpbmc6XG4gICAgICByZXRyeUF0dGVtcHQrKztcbiAgICAgIGN1cnJlbnRSZXRyeUNvdW50ID0gcmV0cnlBdHRlbXB0O1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgW0FyY2hpdmVEb3dubG9hZGVyXSBQYWdlIGRpZCBOT1QgY2hhbmdlIGFmdGVyIGZsaXAgYXR0ZW1wdCAke3JldHJ5QXR0ZW1wdH0gZm9yIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4gUmV0cnlpbmcuLi5gXG4gICAgICApO1xuXG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogJ3JldHJ5aW5nJyxcbiAgICAgICAgcmV0cnlDb3VudDogcmV0cnlBdHRlbXB0LFxuICAgICAgICBzdGF0dXNUZXh0OiBgUmV0cnlpbmcgcGFnZSB0dXJuICgke3JldHJ5QXR0ZW1wdH0vJHtjb25maWcubWF4UmV0cmllc30pLi4uYCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBRdWljayBiYWNrb2ZmIGRlbGF5IG9uIGluaXRpYWwgcmV0cmllczogMXMsIDJzLCAzcy4uLiAobWF4IDVzKVxuICAgICAgY29uc3QgYmFja29mZlNlYyA9IE1hdGgubWluKHJldHJ5QXR0ZW1wdCwgNSk7XG4gICAgICBhd2FpdCBzbGVlcChiYWNrb2ZmU2VjICogMTAwMCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5lcnJvcihgW0FyY2hpdmVEb3dubG9hZGVyXSBGYWlsZWQgdG8gZmxpcCB0byBwYWdlICR7dGFyZ2V0UGFnZU51bX0gYWZ0ZXIgJHtjb25maWcubWF4UmV0cmllc30gYXR0ZW1wdHMuYCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogTWFpbiBkb3dubG9hZCBhbmQgY2FwdHVyZSBvcmNoZXN0cmF0aW9uIGxvb3BcbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHN0YXJ0RG93bmxvYWQodXNlckNvbmZpZz86IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pIHtcbiAgICBpZiAoaXNSdW5uaW5nICYmICFpc1BhdXNlZCkgcmV0dXJuO1xuXG4gICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICByZXN1bWVEb3dubG9hZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlzUnVubmluZyA9IHRydWU7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBzdG9wUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICAgIGRvd25sb2FkZWRQYWdlcyA9IDA7XG4gICAgZmFpbGVkUGFnZXMgPSAwO1xuICAgIGNvbGxlY3RlZEltYWdlcyA9IFtdO1xuICAgIGNvbGxlY3RlZFRleHRzID0gW107XG5cbiAgICBpZiAodXNlckNvbmZpZykge1xuICAgICAgY29uZmlnID0geyAuLi5jb25maWcsIC4uLnVzZXJDb25maWcgfTtcbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIGJvb2sgZGV0ZWN0aW9uXG4gICAgYXdhaXQgcmVmcmVzaEJvb2tJbmZvKCk7XG5cbiAgICBjb25zdCB0b3RhbFBhZ2VzID0gYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgY29uZmlnLmVuZFBhZ2UgfHwgNTAwO1xuICAgIGNvbnN0IHN0YXJ0UCA9IHR5cGVvZiBjb25maWcuc3RhcnRQYWdlID09PSAnbnVtYmVyJ1xuICAgICAgPyBNYXRoLm1heChwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlLCBjb25maWcuc3RhcnRQYWdlKVxuICAgICAgOiBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlO1xuXG4gICAgY29uc3QgbWF4Qm9va1BhZ2UgPSBwcm92aWRlci5zaXRlSWQgPT09ICdhcmNoaXZlJyAmJiBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlID09PSAwXG4gICAgICA/IE1hdGgubWF4KDAsIHRvdGFsUGFnZXMgLSAxKVxuICAgICAgOiB0b3RhbFBhZ2VzO1xuXG4gICAgY29uc3QgZW5kUCA9IGNvbmZpZy5lbmRQYWdlID4gMFxuICAgICAgPyBjb25maWcuZW5kUGFnZVxuICAgICAgOiBtYXhCb29rUGFnZTtcblxuICAgIGNvbnN0IGJvb2tUaXRsZSA9IGJvb2tJbmZvPy5ib29rVGl0bGUgfHwgYCR7cHJvdmlkZXIuc2l0ZU5hbWV9IEJvb2tgO1xuICAgIGNvbnN0IGJvb2tJZCA9IGJvb2tJbmZvPy5ib29rSWQgfHwgJ2Jvb2snO1xuICAgIGNvbnN0IHN1YkRpciA9IGZvcm1hdFN1YmRpcihjb25maWcuYmFzZURpciwgY29uZmlnLmZvbGRlclBhdHRlcm4sIGJvb2tUaXRsZSwgYm9va0lkKTtcblxuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFN0YXJ0aW5nIGRvd25sb2FkOiBwYWdlcyAke3N0YXJ0UH0gdG8gJHtlbmRQfSBpbnRvICcke3N1YkRpcn0nYCk7XG5cbiAgICAvLyBTdGVwIDE6IEVuc3VyZSBTaW5nbGUtUGFnZSBNb2RlIGlmIGNvbmZpZ3VyZWQgYW5kIHN1cHBvcnRlZFxuICAgIGlmIChjb25maWcuYXV0b1NpbmdsZVBhZ2UgJiYgcHJvdmlkZXIuZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKSB7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2Vuc3VyaW5nX21vZGUnLCBzdGF0dXNUZXh0OiAnU3dpdGNoaW5nIHRvIDEtcGFnZSBtb2RlLi4uJyB9KTtcbiAgICAgIGF3YWl0IGVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpO1xuICAgICAgYXdhaXQgc2xlZXAoNjAwKTtcbiAgICB9XG5cbiAgICAvLyBTdGVwIDI6IEFsd2F5cyBuYXZpZ2F0ZSB0byB0aGUgc3RhcnRpbmcgcGFnZVxuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogJ2Rvd25sb2FkaW5nJyxcbiAgICAgIGN1cnJlbnRQYWdlOiBzdGFydFAsXG4gICAgICBzdGF0dXNUZXh0OiBgTmF2aWdhdGluZyB0byBwYWdlICR7c3RhcnRQfS4uLmAsXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBzdGFydGluZyBwYWdlL2xlYWYgJHtzdGFydFB9Li4uYCk7XG4gICAgYXdhaXQgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2Uoc3RhcnRQKTtcblxuICAgIC8vIEdpdmUgcmVhZGVyIHRpbWUgdG8gbG9hZCBhbmQgcmVuZGVyIHN0YXJ0UFxuICAgIGF3YWl0IHNsZWVwKDEyMDApO1xuXG4gICAgbGV0IGxhc3RJbWdTcmMgPSAnJztcbiAgICBsZXQgY3VycmVudEltZzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgcGFnZU51bSA9IHN0YXJ0UDsgcGFnZU51bSA8PSBlbmRQOyBwYWdlTnVtKyspIHtcbiAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSBicmVhaztcblxuICAgICAgY3VycmVudFBhZ2UgPSBwYWdlTnVtO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdkb3dubG9hZGluZycsXG4gICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICBzdGF0dXNUZXh0OiBgQ2FwdHVyaW5nIHBhZ2UgJHtwYWdlTnVtfWAsXG4gICAgICB9KTtcblxuICAgICAgLy8gRm9yIHRoZSBmaXJzdCBwYWdlIChvciByZWNvdmVyeSksIHdhaXQgZm9yIHRoZSBpbWFnZSB0byBiZSByZWFkeVxuICAgICAgaWYgKCFjdXJyZW50SW1nKSB7XG4gICAgICAgIGNvbnN0IHdhaXRJbWFnZVN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd2hpbGUgKERhdGUubm93KCkgLSB3YWl0SW1hZ2VTdGFydCA8IDE1MDAwKSB7XG4gICAgICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIGJyZWFrO1xuICAgICAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIGJyZWFrO1xuICAgICAgICAgICAgYXdhaXQgc2xlZXAoNTAwKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdXJyZW50SW1nID0gcHJvdmlkZXIuZ2V0QWN0aXZlUGFnZUltYWdlKDMwMCwgcGFnZU51bSk7XG4gICAgICAgICAgaWYgKGN1cnJlbnRJbWcpIGJyZWFrO1xuICAgICAgICAgIGF3YWl0IHNsZWVwKDE1MCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFjdXJyZW50SW1nKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBQYWdlICR7cGFnZU51bX0gaW1hZ2UgdGltZWQgb3V0LmApO1xuICAgICAgICBmYWlsZWRQYWdlcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsYXN0SW1nU3JjID0gY3VycmVudEltZy5zcmM7XG5cbiAgICAgICAgICAvLyAxLiBDYXB0dXJlIEltYWdlIHRvIERhdGFVUkwgKHdpdGggb3B0aW9uYWwgbWF4UGFnZUhlaWdodCBjb25zdHJhaW50KVxuICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBjYXB0dXJlSW1hZ2VUb0RhdGFVcmwoY3VycmVudEltZywgY29uZmlnLmltYWdlUXVhbGl0eSwgY29uZmlnLm1heFBhZ2VIZWlnaHQpO1xuXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHBhZ2UgZGltZW5zaW9ucyBhZnRlciBkb3duc2NhbGluZ1xuICAgICAgICAgIGxldCBwYWdlVyA9IGN1cnJlbnRJbWcubmF0dXJhbFdpZHRoO1xuICAgICAgICAgIGxldCBwYWdlSCA9IGN1cnJlbnRJbWcubmF0dXJhbEhlaWdodDtcbiAgICAgICAgICBpZiAoY29uZmlnLm1heFBhZ2VIZWlnaHQgPiAwICYmIHBhZ2VIID4gY29uZmlnLm1heFBhZ2VIZWlnaHQpIHtcbiAgICAgICAgICAgIHBhZ2VXID0gTWF0aC5yb3VuZChwYWdlVyAqIChjb25maWcubWF4UGFnZUhlaWdodCAvIHBhZ2VIKSk7XG4gICAgICAgICAgICBwYWdlSCA9IGNvbmZpZy5tYXhQYWdlSGVpZ2h0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXN0RGltZW5zaW9ucyA9IHsgd2lkdGg6IHBhZ2VXLCBoZWlnaHQ6IHBhZ2VIIH07XG5cbiAgICAgICAgICAvLyBTdG9yZSBmb3IgUERGIGNvbXBpbGVyIChkZWR1cGxpY2F0ZSBieSBwYWdlTnVtKVxuICAgICAgICAgIGlmIChjb25maWcuZ2VuZXJhdGVQZGYpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWR4ID0gY29sbGVjdGVkSW1hZ2VzLmZpbmRJbmRleChpID0+IGkucGFnZU51bSA9PT0gcGFnZU51bSk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdJZHggPj0gMCkge1xuICAgICAgICAgICAgICBjb2xsZWN0ZWRJbWFnZXNbZXhpc3RpbmdJZHhdID0ge1xuICAgICAgICAgICAgICAgIHBhZ2VOdW0sXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YVVybCxcbiAgICAgICAgICAgICAgICB3aWR0aDogcGFnZVcsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYWdlSCxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbGxlY3RlZEltYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBwYWdlTnVtLFxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFVcmwsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHBhZ2VXLFxuICAgICAgICAgICAgICAgIGhlaWdodDogcGFnZUgsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGRvd25sb2FkZWRQYWdlcyA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGg7XG5cbiAgICAgICAgICAvLyBTYXZlIGluZGl2aWR1YWwgaW1hZ2UgZmlsZVxuICAgICAgICAgIGlmIChjb25maWcuc2F2ZUltYWdlcykge1xuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICB0eXBlOiAnRE9XTkxPQURfUEFHRV9JTUFHRScsXG4gICAgICAgICAgICAgIGJvb2tUaXRsZSxcbiAgICAgICAgICAgICAgcGFnZU51bSxcbiAgICAgICAgICAgICAgdG90YWxQYWdlczogZW5kUCxcbiAgICAgICAgICAgICAgZGF0YVVybCxcbiAgICAgICAgICAgICAgc3ViRGlyLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gMi4gRXh0cmFjdCBPQ1IgdGV4dCBpZiBlbmFibGVkLCB2ZXJpZnlpbmcgbm8gSFRUUCBlcnJvcnMgb2NjdXJyZWRcbiAgICAgICAgICBpZiAoY29uZmlnLnNhdmVUZXh0TWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxldCB0ZXh0ID0gYXdhaXQgcHJvdmlkZXIuZXh0cmFjdFBhZ2VUZXh0KHBhZ2VOdW0sIGN1cnJlbnRJbWcpO1xuICAgICAgICAgICAgICBpZiAobGFzdEh0dHBFcnJvciAmJiAoRGF0ZS5ub3coKSAtIGxhc3RIdHRwRXJyb3IudGltZXN0YW1wIDwgMzAwMCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBsYXN0SHR0cEVycm9yO1xuICAgICAgICAgICAgICAgIGxhc3RIdHRwRXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBPQ1IgdGV4dCBmZXRjaCBmb3IgcGFnZSAke3BhZ2VOdW19IGVuY291bnRlcmVkIEhUVFAgJHtlcnIuc3RhdHVzQ29kZX1gKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVyciwgcGFnZU51bSk7XG4gICAgICAgICAgICAgICAgdGV4dCA9IGF3YWl0IHByb3ZpZGVyLmV4dHJhY3RQYWdlVGV4dChwYWdlTnVtLCBjdXJyZW50SW1nKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVGV4dElkeCA9IGNvbGxlY3RlZFRleHRzLmZpbmRJbmRleCh0ID0+IHQucGFnZU51bSA9PT0gcGFnZU51bSk7XG4gICAgICAgICAgICAgIGlmIChleGlzdGluZ1RleHRJZHggPj0gMCkge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZFRleHRzW2V4aXN0aW5nVGV4dElkeF0gPSB7IHBhZ2VOdW0sIGxlYWZJbmRleDogcGFnZU51bSwgdGV4dCB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZFRleHRzLnB1c2goeyBwYWdlTnVtLCBsZWFmSW5kZXg6IHBhZ2VOdW0sIHRleHQgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgZXh0cmFjdCB0ZXh0IGZvciBwYWdlICR7cGFnZU51bX06YCwgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgICAgICBjdXJyZW50UGFnZTogcGFnZU51bSxcbiAgICAgICAgICAgIGRvd25sb2FkZWRQYWdlcyxcbiAgICAgICAgICAgIGN1cnJlbnRUaHVtYm5haWw6IGRhdGFVcmwsXG4gICAgICAgICAgICBzdGF0dXNUZXh0OiBgQ2FwdHVyaW5nIHBhZ2UgJHtwYWdlTnVtfWAsXG4gICAgICAgICAgICBpbWFnZURpbWVuc2lvbnM6IGRpbWVuc2lvbnMsXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICBmYWlsZWRQYWdlcysrO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtBcmNoaXZlRG93bmxvYWRlcl0gRXJyb3IgcHJvY2Vzc2luZyBwYWdlICR7cGFnZU51bX06YCwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUdXJuIHBhZ2UgaWYgbm90IHRoZSBsYXN0IHBhZ2VcbiAgICAgIGlmIChwYWdlTnVtIDwgZW5kUCAmJiAhc3RvcFJlcXVlc3RlZCkge1xuICAgICAgICBjb25zdCBuZXh0SW1nID0gYXdhaXQgdHVybkFuZEdldE5leHRJbWFnZShsYXN0SW1nU3JjLCBwYWdlTnVtICsgMSk7XG4gICAgICAgIGlmICghbmV4dEltZykge1xuICAgICAgICAgIGlmIChpc0VuZE9mQm9vaykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gUmVhY2hlZCBlbmQgb2YgYm9vayBhdCBwYWdlICR7cGFnZU51bX0uIEZpbmFsaXppbmcuYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBGYWlsZWQgYWZ0ZXIgcmV0cmllczogcHJvbXB0IHVzZXIgdG8gc2F2ZSBjYXB0dXJlZCBwYWdlcyFcbiAgICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gQ291bGQgbm90IHR1cm4gcGFzdCBwYWdlICR7cGFnZU51bX0uIFByb21wdGluZyB1c2VyIHRvIHNhdmUuYCk7XG4gICAgICAgICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICAgICAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVTdG9wUmVxdWVzdChgQ2Fubm90IGNvbnRpbnVlIHBhc3QgcGFnZSAke3BhZ2VOdW19LiBTYXZlIGFsbCAke2NvdW50fSBwYWdlcyBkb3dubG9hZGVkIHNvIGZhcj9gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhbHJlYWR5IGhhdmUgdGhlIG5leHQgcGFnZSdzIHZlcmlmaWVkIGltYWdlIHJlYWR5IVxuICAgICAgICBjdXJyZW50SW1nID0gbmV4dEltZztcblxuICAgICAgICAvLyBTeW5jaHJvbml6ZSBwYWdlIGNvdW50ZXIgaWYgdmlld2VyIGlzIGFoZWFkIChBcmNoaXZlLm9yZyBsZWFmLWp1bXBpbmcpXG4gICAgICAgIGlmIChwcm92aWRlci5zaXRlSWQgIT09ICdoYXRoaXRydXN0Jykge1xuICAgICAgICAgIGNvbnN0IGRvbVBhZ2VOb3cgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgICAgIGlmIChkb21QYWdlTm93ICE9PSBudWxsICYmIGRvbVBhZ2VOb3cgPiBwYWdlTnVtKSB7XG4gICAgICAgICAgICBwYWdlTnVtID0gZG9tUGFnZU5vdyAtIDE7IC8vIHBhZ2VOdW0rKyBpbiB0aGUgZm9yLWxvb3Agd2lsbCBzZXQgcGFnZU51bSA9IGRvbVBhZ2VOb3dcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWxheSBiZXR3ZWVuIHBhZ2VzXG4gICAgICAgIGlmIChjb25maWcucGFnZURlbGF5TXMgPiAwKSB7XG4gICAgICAgICAgYXdhaXQgc2xlZXAoY29uZmlnLnBhZ2VEZWxheU1zKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFdyYXAtdXA6IEdlbmVyYXRlIFBERiBhbmQgTWFya2Rvd24gZmlsZXNcbiAgICBpZiAoIXN0b3BSZXF1ZXN0ZWQgJiYgZG93bmxvYWRlZFBhZ2VzID4gMCkge1xuICAgICAgYXdhaXQgZmluYWxpemVCb29rKHN1YkRpciwgYm9va1RpdGxlKTtcbiAgICB9XG5cbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6IHN0b3BSZXF1ZXN0ZWQgPyAnaWRsZScgOiAnY29tcGxldGUnLFxuICAgICAgc3RhdHVzVGV4dDogc3RvcFJlcXVlc3RlZCA/ICdTdG9wcGVkIGJ5IHVzZXInIDogYENvbXBsZXRlZCEgU2F2ZWQgJHtkb3dubG9hZGVkUGFnZXN9IHBhZ2VzLmAsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW5kIHRyaWdnZXJzIGRvd25sb2FkIGZvciB0aGUgZmluYWwgUERGIGFuZCBNYXJrZG93biB0ZXh0IGRvY3VtZW50LlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gZmluYWxpemVCb29rKHN1YkRpcjogc3RyaW5nLCBib29rVGl0bGU6IHN0cmluZykge1xuICAgIC8vIDEuIENvbXBpbGUgUERGXG4gICAgaWYgKGNvbmZpZy5nZW5lcmF0ZVBkZiAmJiBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdjb21waWxpbmdfcGRmJywgc3RhdHVzVGV4dDogJ0NvbXBpbGluZyBQREYgZG9jdW1lbnQuLi4nIH0pO1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gQXNzZW1ibGluZyBQREYgZnJvbScsIGNvbGxlY3RlZEltYWdlcy5sZW5ndGgsICdwYWdlcy4uLicpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwZGZCeXRlcyA9IGNvbXBpbGVKcGVnc1RvUGRmKGNvbGxlY3RlZEltYWdlcywge1xuICAgICAgICAgIHRpdGxlOiBib29rVGl0bGUsXG4gICAgICAgICAgYXV0aG9yOiBib29rSW5mbz8uYXV0aG9yIHx8IHByb3ZpZGVyLnNpdGVOYW1lLFxuICAgICAgICAgIGNyZWF0b3I6ICdBcmNoaXZlIERvd25sb2FkZXInLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBwZGZCbG9iID0gbmV3IEJsb2IoW3BkZkJ5dGVzXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vcGRmJyB9KTtcbiAgICAgICAgY29uc3QgcGRmQmxvYlVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwocGRmQmxvYik7XG5cbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdTQVZFX0ZJTkFMX0ZJTEVTJyxcbiAgICAgICAgICBib29rVGl0bGUsXG4gICAgICAgICAgc3ViRGlyLFxuICAgICAgICAgIHBkZkJsb2JVcmwsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFBERiBjb21waWxlZCBhbmQgc2VudCBmb3IgZG93bmxvYWQhJyk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW0FyY2hpdmVEb3dubG9hZGVyXSBGYWlsZWQgdG8gY29tcGlsZSBQREY6JywgZXJyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBTYXZlIE1hcmtkb3duIHRleHRcbiAgICBpZiAoY29uZmlnLnNhdmVUZXh0TWQpIHtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnc2F2aW5nX3RleHQnLCBzdGF0dXNUZXh0OiAnU2F2aW5nIE1hcmtkb3duIHRleHQuLi4nIH0pO1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gQXNzZW1ibGluZyBNYXJrZG93biBmcm9tJywgY29sbGVjdGVkVGV4dHMubGVuZ3RoLCAncGFnZSB0ZXh0cy4uLicpO1xuXG4gICAgICBjb25zdCBtZENvbnRlbnQgPSBidWlsZEJvb2tNYXJrZG93bihcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiBib29rVGl0bGUsXG4gICAgICAgICAgYm9va0lkOiBib29rSW5mbz8uYm9va0lkIHx8ICdib29rJyxcbiAgICAgICAgICBhdXRob3I6IGJvb2tJbmZvPy5hdXRob3IsXG4gICAgICAgICAgcHVibGlzaGVyOiBib29rSW5mbz8ucHVibGlzaGVyLFxuICAgICAgICAgIHllYXI6IGJvb2tJbmZvPy55ZWFyLFxuICAgICAgICAgIHNvdXJjZVVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgdG90YWxQYWdlczogYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgY3VycmVudFBhZ2UsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbGxlY3RlZFRleHRzXG4gICAgICApO1xuXG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6ICdTQVZFX0ZJTkFMX0ZJTEVTJyxcbiAgICAgICAgYm9va1RpdGxlLFxuICAgICAgICBzdWJEaXIsXG4gICAgICAgIG1hcmtkb3duQ29udGVudDogbWRDb250ZW50LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIE1hcmtkb3duIGdlbmVyYXRlZCBhbmQgc2VudCBmb3IgZG93bmxvYWQhJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF1c2VEb3dubG9hZCgpIHtcbiAgICBpc1BhdXNlZCA9IHRydWU7XG4gICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdwYXVzZWQnLCBzdGF0dXNUZXh0OiAnRG93bmxvYWQgcGF1c2VkJyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc3VtZURvd25sb2FkKCkge1xuICAgIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdkb3dubG9hZGluZycsIHN0YXR1c1RleHQ6IGBSZXN1bWluZyBwYWdlICR7Y3VycmVudFBhZ2V9Li4uYCB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQ6IG51bWJlcikge1xuICAgIHN0b3BSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgc3RhdHVzOiAnY29tcGlsaW5nX3BkZicsXG4gICAgICBzdGF0dXNUZXh0OiBgU2F2aW5nICR7Y291bnR9IGNhcHR1cmVkIHBhZ2VzLi4uYCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJvb2tUaXRsZSA9IGJvb2tJbmZvPy5ib29rVGl0bGUgfHwgYCR7cHJvdmlkZXIuc2l0ZU5hbWV9IEJvb2tgO1xuICAgIGNvbnN0IGJvb2tJZCA9IGJvb2tJbmZvPy5ib29rSWQgfHwgJ2Jvb2snO1xuICAgIGNvbnN0IHN1YkRpciA9IGZvcm1hdFN1YmRpcihjb25maWcuYmFzZURpciwgY29uZmlnLmZvbGRlclBhdHRlcm4sIGJvb2tUaXRsZSwgYm9va0lkKTtcblxuICAgIGF3YWl0IGZpbmFsaXplQm9vayhzdWJEaXIsIGJvb2tUaXRsZSk7XG5cbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6ICdjb21wbGV0ZScsXG4gICAgICBkb3dubG9hZGVkUGFnZXM6IGNvdW50LFxuICAgICAgc3RhdHVzVGV4dDogYENvbXBsZXRlZCEgU2F2ZWQgJHtjb3VudH0gcGFnZXMuYCxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN0b3BSZXF1ZXN0KGN1c3RvbU1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBpZiAoIWlzUnVubmluZykge1xuICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAvLyBUZW1wb3JhcmlseSBwYXVzZSB0aGUgZG93bmxvYWQgY3ljbGUgd2hpbGUgdXNlciBkZWNpZGVzXG4gICAgICBpc1BhdXNlZCA9IHRydWU7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogJ3BhdXNlZCcsXG4gICAgICAgIHN0YXR1c1RleHQ6IGN1c3RvbU1lc3NhZ2UgfHwgYFBhdXNlZDogU2F2ZSAke2NvdW50fSBwYWdlcz9gLFxuICAgICAgfSk7XG5cbiAgICAgIHBpbGwuc2hvd1N0b3BQcm9tcHQoXG4gICAgICAgIGNvdW50LFxuICAgICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgLy8gWUVTOiBTYXZlIGV2ZXJ5dGhpbmcgYW5kIHRyZWF0IGxpa2UgY29tcGxldGUhXG4gICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gVXNlciBjb25maXJtZWQgc2F2aW5nICR7Y291bnR9IHBhZ2VzLmApO1xuICAgICAgICAgIGF3YWl0IHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQpO1xuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLy8gRElTQ0FSRFxuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFVzZXIgZGlzY2FyZGVkIGRvd25sb2FkcyBvbiBzdG9wLicpO1xuICAgICAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLy8gQ0FOQ0VMIC8gUkVTVU1FXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gUmVzdW1pbmcgZG93bmxvYWQuLi4nKTtcbiAgICAgICAgICByZXN1bWVEb3dubG9hZCgpO1xuICAgICAgICB9LFxuICAgICAgICBjdXN0b21NZXNzYWdlXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzdG9wRG93bmxvYWQoKSB7XG4gICAgc3RvcFJlcXVlc3RlZCA9IHRydWU7XG4gICAgaXNSdW5uaW5nID0gZmFsc2U7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBjb2xsZWN0ZWRJbWFnZXMgPSBbXTtcbiAgICBjb2xsZWN0ZWRUZXh0cyA9IFtdO1xuICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnaWRsZScsIHN0YXR1c1RleHQ6ICdEb3dubG9hZCBzdG9wcGVkJyB9KTtcbiAgfVxuXG4gIC8vIEhhbmRsZSBtZXNzYWdlcyBmcm9tIFBvcHVwIG9yIEJhY2tncm91bmQgU2VydmljZSBXb3JrZXJcbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlOiBFeHRlbnNpb25NZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XG4gICAgICBjYXNlICdHRVRfU1RBVEUnOiB7XG4gICAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGJvb2tJbmZvIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RBUlRfRE9XTkxPQUQnOiB7XG4gICAgICAgIHN0YXJ0RG93bmxvYWQobWVzc2FnZS5jb25maWcpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnUEFVU0VfRE9XTkxPQUQnOiB7XG4gICAgICAgIHBhdXNlRG93bmxvYWQoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1JFU1VNRV9ET1dOTE9BRCc6IHtcbiAgICAgICAgcmVzdW1lRG93bmxvYWQoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NUT1BfQU5EX1NBVkUnOiB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCB8fCBkb3dubG9hZGVkUGFnZXM7XG4gICAgICAgIGlmIChpc1J1bm5pbmcgJiYgY291bnQgPiAwKSB7XG4gICAgICAgICAgc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NUT1BfRE9XTkxPQUQnOiB7XG4gICAgICAgIGlmIChtZXNzYWdlLnNhdmVDb2xsZWN0ZWQpIHtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgICAgICAgIGlmIChpc1J1bm5pbmcgJiYgY291bnQgPiAwKSB7XG4gICAgICAgICAgICBzYXZlUGFydGlhbEFuZENvbXBsZXRlKGNvdW50KTtcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTV0lUQ0hfVE9fU0lOR0xFX1BBR0UnOiB7XG4gICAgICAgIGVuZm9yY2VTaW5nbGVQYWdlTW9kZSgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU0FWRV9DT05GSUcnOiB7XG4gICAgICAgIHNhdmVDb25maWcobWVzc2FnZS5jb25maWcpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBjb25maWcgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdHRVRfQ09ORklHJzoge1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBjb25maWcgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdIVFRQX0VSUk9SX0RFVEVDVEVEJzoge1xuICAgICAgICBvbkh0dHBFcnJvclJlY2VpdmVkKG1lc3NhZ2Uuc3RhdHVzQ29kZSwgbWVzc2FnZS51cmwsIG1lc3NhZ2UucmV0cnlBZnRlcik7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59KSgpO1xuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQThCTyxNQUFNLGFBQWE7QUFBQSxFQUNoQixZQUFnQztBQUFBLEVBQ2hDLFdBQVc7QUFBQSxFQUNYLGlCQUFpQjtBQUFBLEVBQ2pCLG1CQUFtQjtBQUFBLEVBQ25CLFlBQTJCLENBQUM7QUFBQSxFQUM1QixnQkFBMkMsQ0FBQztBQUFBLEVBRXBELFdBQVcsQ0FBQyxZQUEyQixDQUFDLEdBQUc7QUFBQSxJQUN6QyxLQUFLLFlBQVk7QUFBQTtBQUFBLEVBR1osWUFBWSxHQUFZO0FBQUEsSUFDN0IsTUFBTSxZQUFZLE9BQU8sU0FBUyxTQUFTLFNBQVMsYUFBYSxLQUMvQyxPQUFPLFNBQVMsU0FBUyxTQUFTLFdBQVc7QUFBQSxJQUMvRCxNQUFNLFVBQVUsT0FBTyxTQUFTLGFBQWEsMEJBQzVCLE9BQU8sU0FBUyxTQUFTLFNBQVMsZ0JBQWdCLEtBQUssT0FBTyxTQUFTLFNBQVMsV0FBVyxTQUFTO0FBQUEsSUFDckgsT0FBTyxhQUFhO0FBQUE7QUFBQSxFQUdmLE1BQU0sR0FBUztBQUFBLElBQ3BCLElBQUksQ0FBQyxLQUFLLGFBQWE7QUFBQSxNQUFHO0FBQUEsSUFDMUIsSUFBSSxLQUFLO0FBQUEsTUFBVztBQUFBLElBRXBCLE1BQU0sT0FBTyxTQUFTLGNBQWMsS0FBSztBQUFBLElBQ3pDLEtBQUssS0FBSztBQUFBLElBQ1YsS0FBSyxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxvQkEyWUQsT0FBTyxRQUFRLE9BQU8sa0JBQWtCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBMEd4RCxTQUFTLEtBQUssWUFBWSxJQUFJO0FBQUEsSUFDOUIsS0FBSyxZQUFZO0FBQUEs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QUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLG1CQUFtQjtBQUFBLFFBQ3RCLGVBQWU7QUFBQSxRQUNmLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBLFdBRUssaUJBQWlCO0FBQUEsUUFDcEIsTUFBTSxRQUFRLGdCQUFnQixVQUFVO0FBQUEsUUFDeEMsSUFBSSxhQUFhLFFBQVEsR0FBRztBQUFBLFVBQzFCLHVCQUF1QixLQUFLO0FBQUEsUUFDOUIsRUFBTztBQUFBLFVBQ0wsYUFBYTtBQUFBO0FBQUEsUUFFZixhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLGlCQUFpQjtBQUFBLFFBQ3BCLElBQUksUUFBUSxlQUFlO0FBQUEsVUFDekIsTUFBTSxRQUFRLGdCQUFnQixVQUFVO0FBQUEsVUFDeEMsSUFBSSxhQUFhLFFBQVEsR0FBRztBQUFBLFlBQzFCLHVCQUF1QixLQUFLO0FBQUEsWUFDNUIsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsWUFDOUI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsYUFBYTtBQUFBLFFBQ2IsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyx5QkFBeUI7QUFBQSxRQUM1QixzQkFBc0I7QUFBQSxRQUN0QixhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLGVBQWU7QUFBQSxRQUNsQixXQUFXLFFBQVEsTUFBTTtBQUFBLFFBQ3pCLGFBQWEsRUFBRSxTQUFTLE1BQU0sT0FBTyxDQUFDO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQUEsV0FFSyxjQUFjO0FBQUEsUUFDakIsYUFBYSxFQUFFLFNBQVMsTUFBTSxPQUFPLENBQUM7QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFBQSxXQUVLLHVCQUF1QjtBQUFBLFFBQzFCLG9CQUFvQixRQUFRLFlBQVksUUFBUSxLQUFLLFFBQVEsVUFBVTtBQUFBLFFBQ3ZFLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBO0FBQUEsSUFFRixPQUFPO0FBQUEsR0FDUjtBQUFBLEdBQ0E7IiwKICAiZGVidWdJZCI6ICI1RDg3MTUxRjFCNjQ3MzZENjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
