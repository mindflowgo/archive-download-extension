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
  const simpleMatch = text.match(/\((\d+)\s*\//);
  if (simpleMatch) {
    return {
      current: parseInt(simpleMatch[1], 10),
      total: 0
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
    const pageInput = document.querySelector('input.BRpageinput, input.page-number-input, input[name="page"]');
    if (pageInput && pageInput.value) {
      const val = parseInt(pageInput.value, 10);
      if (!isNaN(val))
        return val;
    }
    const activeContainer = document.querySelector(".BRpagecontainer.BRpage-visible, .BRpage.active, .BRpagecontainer[data-index]");
    if (activeContainer) {
      const idxAttr = activeContainer.getAttribute("data-index") || activeContainer.getAttribute("data-page");
      if (idxAttr) {
        const val = parseInt(idxAttr, 10);
        if (!isNaN(val))
          return val;
      }
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
    for (const key of ["ArrowRight", "PageDown"]) {
      const keyEvent = {
        bubbles: true,
        cancelable: true,
        key,
        code: key,
        keyCode: key === "ArrowRight" ? 39 : 34,
        which: key === "ArrowRight" ? 39 : 34
      };
      document.body.dispatchEvent(new KeyboardEvent("keydown", keyEvent));
      window.dispatchEvent(new KeyboardEvent("keydown", keyEvent));
    }
  }
  getActivePageImage(minWidth = 300, targetPageNum) {
    const imageSelectors = [
      ".BRpagecontainer img",
      "img.BRpageimage",
      ".BRpage img",
      ".BRpageview img",
      'img[class*="BRpage"]',
      'img[src*="BookReaderImages.php"]',
      'img[src*="/BookReader/"]',
      'img[src*="scale="]',
      'img[src*="zip="]',
      ".book-page img"
    ];
    const images = Array.from(document.querySelectorAll(imageSelectors.join(", ")));
    const valid = images.filter((img) => img.complete && img.naturalWidth >= minWidth && img.src);
    if (valid.length === 0)
      return null;
    if (typeof targetPageNum === "number") {
      for (const img of valid) {
        const pageFromUrl = parseArchiveImageUrlPage(img.src);
        if (pageFromUrl !== null && pageFromUrl === targetPageNum) {
          img.dataset.seq = String(targetPageNum);
          return img;
        }
      }
      const targetSelectors = [
        `.BRpagecontainer[data-index="${targetPageNum}"] img`,
        `.pagediv${targetPageNum} img`,
        `[data-index="${targetPageNum}"] img`,
        `.BRpage[data-page="${targetPageNum}"] img`,
        `.BRpage[data-leaf="${targetPageNum}"] img`,
        `#pagediv${targetPageNum} img`,
        `#page${targetPageNum} img`
      ];
      for (const sel of targetSelectors) {
        const el = document.querySelector(sel);
        if (el && el.complete && el.naturalWidth >= minWidth && el.src) {
          const pageFromUrl = parseArchiveImageUrlPage(el.src);
          if (pageFromUrl === null || pageFromUrl === targetPageNum) {
            el.dataset.seq = String(targetPageNum);
            return el;
          }
        }
      }
      let bestCandidate = null;
      let maxArea = 0;
      const winW2 = typeof window !== "undefined" ? window.innerWidth : 1920;
      const winH2 = typeof window !== "undefined" ? window.innerHeight : 1080;
      for (const img of valid) {
        const pageFromUrl = parseArchiveImageUrlPage(img.src);
        if (pageFromUrl !== null && pageFromUrl !== targetPageNum) {
          continue;
        }
        const rect = img.getBoundingClientRect();
        const visibleWidth = Math.max(0, Math.min(rect.right, winW2) - Math.max(rect.left, 0));
        const visibleHeight = Math.max(0, Math.min(rect.bottom, winH2) - Math.max(rect.top, 0));
        const area = visibleWidth * visibleHeight;
        if (area > maxArea && visibleWidth > 50 && visibleHeight > 50) {
          maxArea = area;
          bestCandidate = img;
        }
      }
      if (bestCandidate) {
        bestCandidate.dataset.seq = String(targetPageNum);
        return bestCandidate;
      }
      const fallback = valid[valid.length - 1];
      if (fallback) {
        const pageFromUrl = parseArchiveImageUrlPage(fallback.src);
        if (pageFromUrl === null || pageFromUrl === targetPageNum) {
          fallback.dataset.seq = String(targetPageNum);
          return fallback;
        }
      }
      return null;
    }
    let bestImg = null;
    let maxVisibleArea = 0;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1920;
    const winH = typeof window !== "undefined" ? window.innerHeight : 1080;
    for (const img of valid) {
      const rect = img.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, winW) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, winH) - Math.max(rect.top, 0));
      const area = visibleWidth * visibleHeight;
      if (area > maxVisibleArea && visibleWidth > 50 && visibleHeight > 50) {
        maxVisibleArea = area;
        bestImg = img;
      }
    }
    return bestImg || valid[valid.length - 1] || null;
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
          const parsedUrlPage = parseArchiveImageUrlPage(activeImg.src);
          if (parsedUrlPage !== null && parsedUrlPage === targetPageNum) {
            currentRetryCount = 0;
            consecutiveErrorCount = 0;
            console.log(`[ArchiveDownloader] Page ${targetPageNum} verified from URL (${activeImg.naturalWidth}x${activeImg.naturalHeight}px, leaf ${parsedUrlPage})!`);
            return activeImg;
          }
          if (parsedUrlPage !== null && parsedUrlPage !== targetPageNum) {
            continue;
          }
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

//# debugId=BECB82B808D1510664756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvcGlsbC50cyIsICIuLi9zcmMvdXRpbHMvbWFya2Rvd24tYnVpbGRlci50cyIsICIuLi9zcmMvdXRpbHMvcGRmLWJ1aWxkZXIudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0aXplci50cyIsICIuLi9zcmMvcHJvdmlkZXJzL2FyY2hpdmUtcHJvdmlkZXIudHMiLCAiLi4vc3JjL3Byb3ZpZGVycy9oYXRoaXRydXN0LXByb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcm92aWRlcnMvaW5kZXgudHMiLCAiLi4vc3JjL2NvbnRlbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiLyoqXG4gKiBGbG9hdGluZyBQcm9ncmVzcyBQaWxsIE92ZXJsYXkgZm9yIEFyY2hpdmUub3JnXG4gKiBPTkxZIGFwcGVhcnMgb24gaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLypcbiAqXG4gKiBGZWF0dXJlczpcbiAqIC0gQ29nIGljb24gYnV0dG9uICjimpkpIHRvIG9wZW4gZXhwYW5kYWJsZSBpbi1wYWdlIFNldHRpbmdzIHRyYXlcbiAqIC0gU2V0dGluZ3MgKHNhdmUgcGF0aCwgZm9sZGVyIHBhdHRlcm4sIHN0YXJ0L2VuZCBwYWdlcykgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlXG4gKiAtIFNxdWFyZSwgZnVsbC1oZWlnaHQgYnV0dG9ucyB3aXRoIG5vIGN1cnZhdHVyZSAoanVzdCBsaW5lIG91dGxpbmUpXG4gKiAtIFvinJVdIGJ1dHRvbiB0aGF0IHNocmlua3MgcGlsbCB0byBhIHNtYWxsIGRvY2tlZCBib29rIGljb24gb24gdGhlIGZhciBsZWZ0IGVkZ2Ugb2YgdGhlIHNjcmVlblxuICogLSBDbGlja2luZyB0aGUgZG9ja2VkIGJvb2sgaWNvbiByZXN0b3JlcyB0aGUgcGlsbFxuICogLSBJbWFnZSBkaW1lbnNpb25zIGluIHNtYWxsIGdyZXkgbGV0dGVycyBiZWxvdyBzdGF0dXM6XG4gKiAgIFwiQ2FwdHVyaW5nIHBhZ2UgMTRcIlxuICogICBcIihpbWFnZTogMjU4MCB4IDM5MTUpXCJcbiAqIC0gW0NPTlRJTlVFXSBidXR0b24gd2hlbiBzdGFsbGVkIG9yIGNvbm5lY3Rpb24gZHJvcHNcbiAqIC0gSW50ZXJhY3RpdmUgU3RvcCBjb25maXJtYXRpb24gcHJvbXB0IHRvIHNhdmUgY2FwdHVyZWQgcGFnZXMgc28gZmFyXG4gKiAtIFwiRG93bmxvYWRlZDogVmlldyBGaWxlc1wiIGJ1dHRvbiBvbiBjb21wbGV0aW9uIHRoYXQgb3BlbnMgdGhlIGRvd25sb2FkZWQgZmlsZS9mb2xkZXJcbiAqL1xuXG5pbXBvcnQgeyBEb3dubG9hZGVyQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpbGxDYWxsYmFja3Mge1xuICBvblN0YXJ0PzogKCkgPT4gdm9pZDtcbiAgb25QYXVzZT86ICgpID0+IHZvaWQ7XG4gIG9uUmVzdW1lPzogKCkgPT4gdm9pZDtcbiAgb25TdG9wPzogKCkgPT4gdm9pZDtcbiAgb25TYXZlU2V0dGluZ3M/OiAoc2V0dGluZ3M6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pID0+IHZvaWQ7XG4gIG9uU3dpdGNoTW9kZT86ICgpID0+IHZvaWQ7XG4gIG9uVmlld0ZpbGU/OiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgRmxvYXRpbmdQaWxsIHtcbiAgcHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNEb2NrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc1NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzQ29uZmlybWluZ1N0b3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFBpbGxDYWxsYmFja3MgPSB7fTtcbiAgcHJpdmF0ZSBjdXJyZW50Q29uZmlnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+ID0ge307XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzOiBQaWxsQ2FsbGJhY2tzID0ge30pIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgfVxuXG4gIHB1YmxpYyBzaG91bGRSZW5kZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNBcmNoaXZlID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluY2x1ZGVzKCcvZGV0YWlscy8nKTtcbiAgICBjb25zdCBpc0JhYmVsID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnYmFiZWwuaGF0aGl0cnVzdC5vcmcnIHx8XG4gICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzQXJjaGl2ZSB8fCBpc0JhYmVsO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkUmVuZGVyKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwaWxsLmlkID0gJ2FyY2hpdmUtZG93bmxvYWRlci1waWxsJztcbiAgICBwaWxsLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgI2FyY2hpdmUtZG93bmxvYWRlci1waWxsIHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiAxNHB4O1xuICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE4LCAxOCwgMTgsIDAuOTYpO1xuICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICAtd2Via2l0LWJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgOHB4IDMycHggcmdiYSgwLCAwLCAwLCAwLjY1KTtcbiAgICAgICAgICBjb2xvcjogI2YxZjFmMTtcbiAgICAgICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBlYXNlLCBvcGFjaXR5IDAuMjVzIGVhc2U7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgbWF4LXdpZHRoOiA5NXZ3O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBEb2NrZWQgdG8gZmFyIGxlZnQgb2Ygd2luZG93ICovXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCB7XG4gICAgICAgICAgbGVmdDogMCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRvcDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRyYW5zZm9ybTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIGJvcmRlci1sZWZ0OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMCA2cHggNnB4IDAgIWltcG9ydGFudDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICBib3gtc2hhZG93OiAycHggNHB4IDE2cHggcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtbWFpbi1ib2R5LFxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtc2V0dGluZ3MtcGFuZWwge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgfVxuXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCAucGlsbC1kb2NrLWljb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIGltZyB7XG4gICAgICAgICAgd2lkdGg6IDI0cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLW1haW4tYm9keSB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDQ4cHg7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBDb2cgc2V0dGluZ3MgYnV0dG9uIHJlcGxhY2luZyB0aGUgc3RhdGljIGxvZ28gKi9cbiAgICAgICAgLnBpbGwtY29nLWJ0biB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTNweDtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMsIGNvbG9yIDAuMTVzLCB0cmFuc2Zvcm0gMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtY29nLWJ0bi5hY3RpdmUge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcbiAgICAgICAgICBjb2xvcjogIzNlYTZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZ1bGwgaGVpZ2h0IGJ1dHRvbnMgd2l0aCBOTyBjdXJ2YXR1cmUgKGJvcmRlci1yYWRpdXM6IDApLCBvdXRsaW5lZCBvbmx5ICovXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4ge1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgcGFkZGluZzogMCAxNHB4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA2cHg7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1wcmltYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzI5ODllNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWNvbnRpbnVlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjU5ZTBiO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1jb250aW51ZTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Q5NzcwNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLXZpZXctZmlsZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzEwYjk4MTtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tdmlldy1maWxlOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMDU5NjY5O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tZGFuZ2VyIHtcbiAgICAgICAgICBjb2xvcjogI2Y4NzE3MTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWRhbmdlcjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNDgsIDExMywgMTEzLCAwLjIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tbW9kZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y1OWUwYjtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAqL1xuICAgICAgICAucGlsbC1jb25maXJtLWJhciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNSwgMjUsIDI1LCAwLjk4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvbmZpcm0tdGV4dCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGNvbG9yOiAjZjU5ZTBiO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdGF0dXMgJiBJbWFnZSBEaW1lbnNpb25zIFNlY3Rpb24gKi9cbiAgICAgICAgLnBpbGwtc3RhdHVzLXNlY3Rpb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgbWluLXdpZHRoOiAxNzBweDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTgpO1xuICAgICAgICAgIGdhcDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBtYXgtd2lkdGg6IDIyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQud2FybmluZyB7XG4gICAgICAgICAgY29sb3I6ICNmNTllMGI7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5lcnJvciB7XG4gICAgICAgICAgY29sb3I6ICNlZjQ0NDQ7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5jb21wbGV0ZSB7XG4gICAgICAgICAgY29sb3I6ICMxMGI5ODE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTbWFsbCBncmV5IGltYWdlIGRpbWVuc2lvbnMgKi9cbiAgICAgICAgLnBpbGwtZGltZW5zaW9ucy10ZXh0IHtcbiAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgY29sb3I6ICM4ODg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtcHJvZ3Jlc3MtdHJhY2sge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogM3B4O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1wcm9ncmVzcy1maWxsIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgd2lkdGg6IDAlO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMzZWE2ZmY7XG4gICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmlnaHQgU2lkZSBDb3VudGVyICgwLzUxNSBwYWdlcykgKi9cbiAgICAgICAgLnBpbGwtY291bnRlci1ib3gge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogW3hdIENsb3NlL1NocmluayBCdXR0b24gKi9cbiAgICAgICAgLnBpbGwtY2xvc2UtYnRuIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGNvbG9yOiAjODg4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNsb3NlLWJ0bjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5ICovXG4gICAgICAgIC5waWxsLXNldHRpbmdzLXBhbmVsIHtcbiAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE0LCAxNCwgMTQsIDAuOTgpO1xuICAgICAgICAgIHBhZGRpbmc6IDEycHggMTZweDtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmdzLWhlYWRlciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIHBhZGRpbmctYm90dG9tOiA2cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy10aXRsZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xuICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludC5zaG93IHtcbiAgICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3MtZ3JpZCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cgbGFiZWwge1xuICAgICAgICAgIGNvbG9yOiAjYWFhO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLXJvdy1oYWxmIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgICAgICAgIGdhcDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctcm93LWhhbGYgPiBkaXYge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctaW5wdXQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyNDI0MjQ7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBwYWRkaW5nOiA1cHggOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAwLjE1cztcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIG1heC13aWR0aDogMjYwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWlucHV0OmZvY3VzIHtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICMzZWE2ZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy1mb290ZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWJ0biB7XG4gICAgICAgICAgcGFkZGluZzogNXB4IDEycHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNjY2M7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMTVzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctYnRuLmJ0bi1zYXZlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG4uYnRuLXNhdmU6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyOTg5ZTY7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG5cbiAgICAgIDwhLS0gRG9ja2VkIFNtYWxsIEljb24gKFZpc2libGUgd2hlbiBtaW5pbWl6ZWQgdG8gZmFyIGxlZnQpIC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtZG9jay1pY29uXCIgaWQ9XCJwaWxsRG9ja0ljb25cIiB0aXRsZT1cIk9wZW4gQXJjaGl2ZSBEb3dubG9hZGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPVwiJHtjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ljb25zL2ljb240OC5wbmcnKX1cIiBhbHQ9XCJBcmNoaXZlIERvd25sb2FkZXJcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gTWFpbiBCb2R5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtbWFpbi1ib2R5XCI+XG4gICAgICAgIDwhLS0gQ29nIHNldHRpbmdzIGJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtY29nLWJ0blwiIGlkPVwicGlsbENvZ0J0blwiIHRpdGxlPVwiRWRpdCBTZXR0aW5ncyAoU2F2ZSBwYXRoLCBwYXR0ZXJuLCBwYWdlcylcIj7impk8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtY29uZmlybS1iYXJcIiBpZD1cInBpbGxDb25maXJtQmFyXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGlsbC1jb25maXJtLXRleHRcIiBpZD1cInBpbGxDb25maXJtVGV4dFwiPlNhdmUgY2FwdHVyZWQgcGFnZXM/PC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXZpZXctZmlsZVwiIGlkPVwicGlsbENvbmZpcm1TYXZlQnRuXCI+4pyUIFllcywgU2F2ZSBGaWxlczwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLWRhbmdlclwiIGlkPVwicGlsbENvbmZpcm1EaXNjYXJkQnRuXCI+RGlzY2FyZDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxDb25maXJtQ2FuY2VsQnRuXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gU3RhcnQgRG93bmxvYWQgQnV0dG9uIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1wcmltYXJ5XCIgaWQ9XCJwaWxsU3RhcnRCdG5cIj5cbiAgICAgICAgICDilrYgU3RhcnQgRG93bmxvYWRcbiAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgPCEtLSBDb250aW51ZSBCdXR0b24gKHdoZW4gc3RhbGxlZCAvIG9mZmxpbmUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1jb250aW51ZVwiIGlkPVwicGlsbENvbnRpbnVlQnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIOKWtiBDT05USU5VRVxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIFZpZXcgRmlsZSBCdXR0b24gKHdoZW4gY29tcGxldGUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi12aWV3LWZpbGVcIiBpZD1cInBpbGxWaWV3RmlsZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinJQgVmlldyBGaWxlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gRHluYW1pYyBDb250cm9scyAoYWN0aXZlIGR1cmluZyBkb3dubG9hZCkgLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxQYXVzZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinZrinZogUGF1c2VcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXByaW1hcnlcIiBpZD1cInBpbGxSZXN1bWVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAg4pa2IFJlc3VtZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tZGFuZ2VyXCIgaWQ9XCJwaWxsU3RvcEJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDil7wgU3RvcFxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIDEtUGFnZSBNb2RlIEJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tbW9kZVwiIGlkPVwicGlsbE1vZGVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgdGl0bGU9XCJTd2l0Y2ggdG8gMS1QYWdlIFZpZXdcIj5cbiAgICAgICAgICDimqEgMS1QYWdlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gU3RhdHVzICYgSW1hZ2UgRGltZW5zaW9ucyAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc3RhdHVzLXNlY3Rpb25cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc3RhdHVzLXRleHRcIiBpZD1cInBpbGxTdGF0dXNUZXh0XCI+UmVhZHk8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJwaWxsLWRpbWVuc2lvbnMtdGV4dFwiIGlkPVwicGlsbERpbWVuc2lvbnNUZXh0XCI+KGltYWdlOiAtIHggLSk8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtcHJvZ3Jlc3MtdHJhY2tcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXByb2dyZXNzLWZpbGxcIiBpZD1cInBpbGxQcm9ncmVzc0ZpbGxcIj48L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBSaWdodCBTaWRlIENvdW50ZXI6IDAvNTE1IHBhZ2VzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1jb3VudGVyLWJveFwiIGlkPVwicGlsbENvdW50ZXJcIj5cbiAgICAgICAgICAwLzAgcGFnZXNcbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBbeF0gU2hyaW5rIHRvIExlZnQgU2lkZSBCdXR0b24gLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWNsb3NlLWJ0blwiIGlkPVwicGlsbENsb3NlQnRuXCIgdGl0bGU9XCJTaHJpbmsgdG8gbGVmdCBlZGdlIG9mIHNjcmVlblwiPuKclTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtcGFuZWxcIiBpZD1cInBpbGxTZXR0aW5nc1BhbmVsXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtdGl0bGVcIj7impkgRG93bmxvYWRlciBTZXR0aW5nczwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludFwiIGlkPVwicGlsbFNldHRpbmdzU2F2ZWRIaW50XCI+U2F2ZWQgdG8gbG9jYWxTdG9yYWdlPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtZ3JpZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXNldHRpbmctcm93XCI+XG4gICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdTYXZlUGF0aFwiPlNhdmUgU3ViZGlyZWN0b3J5OjwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInBpbGxTZXR0aW5nU2F2ZVBhdGhcIiBjbGFzcz1cInBpbGwtc2V0dGluZy1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiQXJjaGl2ZUJvb2tzXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvd1wiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInBpbGxTZXR0aW5nUGF0dGVyblwiPkZvbGRlciBQYXR0ZXJuOjwvbGFiZWw+XG4gICAgICAgICAgICA8c2VsZWN0IGlkPVwicGlsbFNldHRpbmdQYXR0ZXJuXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInt0aXRsZX1fe2lkfVwiPnt0aXRsZX1fe2lkfTwvb3B0aW9uPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwie3RpdGxlfVwiPnt0aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIntpZH1cIj57aWR9PC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvdyBwaWxsLXNldHRpbmctcm93LWhhbGZcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ1N0YXJ0UGFnZVwiPlN0YXJ0IFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nU3RhcnRQYWdlXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgdmFsdWU9XCIwXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdFbmRQYWdlXCI+RW5kIFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nRW5kUGFnZVwiIGNsYXNzPVwicGlsbC1zZXR0aW5nLWlucHV0XCIgbWluPVwiMFwiIHBsYWNlaG9sZGVyPVwiQWxsXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZy1yb3dcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ01heEhlaWdodFwiPk1heCBQYWdlIEhlaWdodDo8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nTWF4SGVpZ2h0XCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgc3RlcD1cIjUwXCIgcGxhY2Vob2xkZXI9XCJlLmcuIDEwMDAgKDAgPSBmdWxsKVwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1mb290ZXJcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1zZXR0aW5nLWJ0biBidG4tc2F2ZVwiIGlkPVwicGlsbFNldHRpbmdTYXZlQnRuXCI+8J+SviBTYXZlIFNldHRpbmdzPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtc2V0dGluZy1idG4gYnRuLWNsb3NlXCIgaWQ9XCJwaWxsU2V0dGluZ0Nsb3NlQnRuXCI+Q2xvc2U8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwaWxsKTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHBpbGw7XG5cbiAgICAvLyBBdHRhY2ggY2FsbGJhY2tzXG4gICAgY29uc3Qgc3RhcnRCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RhcnRCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzdGFydEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0YXJ0Py4oKSk7XG5cbiAgICBjb25zdCBjb250aW51ZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnRpbnVlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uUmVzdW1lPy4oKSk7XG5cbiAgICBjb25zdCB2aWV3RmlsZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHZpZXdGaWxlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uVmlld0ZpbGU/LigpKTtcblxuICAgIGNvbnN0IHBhdXNlQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFBhdXNlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcGF1c2VCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25QYXVzZT8uKCkpO1xuXG4gICAgY29uc3QgcmVzdW1lQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFJlc3VtZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHJlc3VtZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblJlc3VtZT8uKCkpO1xuXG4gICAgY29uc3Qgc3RvcEJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTdG9wQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgc3RvcEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0b3A/LigpKTtcblxuICAgIGNvbnN0IG1vZGVCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsTW9kZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIG1vZGVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25Td2l0Y2hNb2RlPy4oKSk7XG5cbiAgICAvLyBDb2cgYnV0dG9uIHRvIHRvZ2dsZSBzZXR0aW5ncyB0cmF5XG4gICAgY29uc3QgY29nQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvZ0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKCkpO1xuXG4gICAgLy8gU2F2ZSBTZXR0aW5ncyBidXR0b25cbiAgICBjb25zdCBzYXZlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1NhdmVCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzYXZlU2V0dGluZ3NCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZVBhdGhJbnB1dCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU2F2ZVBhdGgnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nUGF0dGVybicpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgY29uc3Qgc3RhcnRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1N0YXJ0UGFnZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0VuZFBhZ2UnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgbWF4SGVpZ2h0SW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICAgIGNvbnN0IGJhc2VEaXIgPSBzYXZlUGF0aElucHV0Py52YWx1ZS50cmltKCkgfHwgJ0FyY2hpdmVCb29rcyc7XG4gICAgICBjb25zdCBmb2xkZXJQYXR0ZXJuID0gcGF0dGVyblNlbGVjdD8udmFsdWUgfHwgJ3t0aXRsZX1fe2lkfSc7XG4gICAgICBjb25zdCBzdGFydFBhZ2UgPSBzdGFydFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoc3RhcnRQYWdlSW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuICAgICAgY29uc3QgZW5kUGFnZSA9IGVuZFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoZW5kUGFnZUlucHV0LnZhbHVlLCAxMCkpIDogMDtcbiAgICAgIGNvbnN0IG1heFBhZ2VIZWlnaHQgPSBtYXhIZWlnaHRJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobWF4SGVpZ2h0SW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblNhdmVTZXR0aW5ncz8uKHtcbiAgICAgICAgYmFzZURpcixcbiAgICAgICAgZm9sZGVyUGF0dGVybixcbiAgICAgICAgc3RhcnRQYWdlLFxuICAgICAgICBlbmRQYWdlLFxuICAgICAgICBtYXhQYWdlSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGhpbnQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ3NTYXZlZEhpbnQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmIChoaW50KSB7XG4gICAgICAgIGhpbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGhpbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpLCAyNTAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3NlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0Nsb3NlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY2xvc2VTZXR0aW5nc0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKSk7XG5cbiAgICAvLyBbeF0gY2xvc2UvZG9jayBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDbG9zZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNsb3NlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuZG9ja1RvTGVmdCgpKTtcblxuICAgIC8vIERvY2tlZCBpY29uIGNsaWNrIHRvIGV4cGFuZFxuICAgIGNvbnN0IGRvY2tJY29uID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbERvY2tJY29uJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgZG9ja0ljb24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy51bmRvY2tGcm9tTGVmdCgpKTtcblxuICAgIC8vIFBvcHVsYXRlIGluaXRpYWwgaW5wdXRzIGlmIGNvbmZpZyBleGlzdHNcbiAgICB0aGlzLnNldENvbmZpZyh0aGlzLmN1cnJlbnRDb25maWcpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZVNldHRpbmdzKG9wZW4/OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMuaXNTZXR0aW5nc09wZW4gPSB0eXBlb2Ygb3BlbiA9PT0gJ2Jvb2xlYW4nID8gb3BlbiA6ICF0aGlzLmlzU2V0dGluZ3NPcGVuO1xuXG4gICAgY29uc3QgcGFuZWwgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdzUGFuZWwnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb2dCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBhbmVsKSB7XG4gICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gdGhpcy5pc1NldHRpbmdzT3BlbiA/ICdmbGV4JyA6ICdub25lJztcbiAgICB9XG4gICAgaWYgKGNvZ0J0bikge1xuICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc09wZW4pIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRDb25maWcoY2ZnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50Q29uZmlnID0geyAuLi50aGlzLmN1cnJlbnRDb25maWcsIC4uLmNmZyB9O1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHNhdmVQYXRoSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdTYXZlUGF0aCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKHNhdmVQYXRoSW5wdXQgJiYgY2ZnLmJhc2VEaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2F2ZVBhdGhJbnB1dC52YWx1ZSA9IGNmZy5iYXNlRGlyO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdHRlcm5TZWxlY3QgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdQYXR0ZXJuJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgaWYgKHBhdHRlcm5TZWxlY3QgJiYgY2ZnLmZvbGRlclBhdHRlcm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IGNmZy5mb2xkZXJQYXR0ZXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0UGFnZUlucHV0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU3RhcnRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoc3RhcnRQYWdlSW5wdXQgJiYgY2ZnLnN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdGFydFBhZ2VJbnB1dC52YWx1ZSA9IFN0cmluZyhjZmcuc3RhcnRQYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdFbmRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoZW5kUGFnZUlucHV0ICYmIGNmZy5lbmRQYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZFBhZ2VJbnB1dC52YWx1ZSA9IGNmZy5lbmRQYWdlID4gMCA/IFN0cmluZyhjZmcuZW5kUGFnZSkgOiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBtYXhIZWlnaHRJbnB1dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKG1heEhlaWdodElucHV0ICYmIGNmZy5tYXhQYWdlSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1heEhlaWdodElucHV0LnZhbHVlID0gY2ZnLm1heFBhZ2VIZWlnaHQgPiAwID8gU3RyaW5nKGNmZy5tYXhQYWdlSGVpZ2h0KSA6ICcnO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzaG93U3RvcFByb21wdChcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG9uU2F2ZTogKCkgPT4gdm9pZCxcbiAgICBvbkRpc2NhcmQ6ICgpID0+IHZvaWQsXG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgY3VzdG9tTWVzc2FnZT86IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gdHJ1ZTtcblxuICAgIGNvbnN0IGNvbmZpcm1CYXIgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb25maXJtVGV4dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ29uZmlybVRleHQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBzYXZlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtU2F2ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnN0IGRpc2NhcmRCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1EaXNjYXJkQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtQ2FuY2VsQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIG5vcm1hbCBidXR0b25zIGFuZCBzdGF0dXMgd2hpbGUgY29uZmlybWluZ1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUoZmFsc2UpO1xuXG4gICAgaWYgKGNvbmZpcm1UZXh0KSB7XG4gICAgICBjb25maXJtVGV4dC50ZXh0Q29udGVudCA9IGN1c3RvbU1lc3NhZ2UgfHwgYFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2A7XG4gICAgfVxuICAgIGlmIChjb25maXJtQmFyKSB7XG4gICAgICBjb25maXJtQmFyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgIHRoaXMuaXNDb25maXJtaW5nU3RvcCA9IGZhbHNlO1xuICAgICAgaWYgKGNvbmZpcm1CYXIpIGNvbmZpcm1CYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNsZWFudXAoKTtcbiAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICBkaXNjYXJkQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkRpc2NhcmQoKTtcbiAgICB9O1xuXG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkNhbmNlbCgpO1xuICAgIH07XG4gIH1cblxuICBwdWJsaWMgaGlkZVN0b3BQcm9tcHQoKTogdm9pZCB7XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gZmFsc2U7XG4gICAgY29uc3QgY29uZmlybUJhciA9IHRoaXMuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY29uZmlybUJhcikgY29uZmlybUJhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIHNldFN0YW5kYXJkQ29udHJvbHNWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICAgICcjcGlsbFN0YXJ0QnRuLCAjcGlsbENvbnRpbnVlQnRuLCAjcGlsbFZpZXdGaWxlQnRuLCAjcGlsbFBhdXNlQnRuLCAjcGlsbFJlc3VtZUJ0biwgI3BpbGxTdG9wQnRuLCAjcGlsbE1vZGVCdG4sIC5waWxsLXN0YXR1cy1zZWN0aW9uLCAjcGlsbENvdW50ZXInXG4gICAgKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyAnJyA6ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkb2NrVG9MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gdHJ1ZTtcbiAgICB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdkb2NrZWQtbGVmdCcpO1xuICB9XG5cbiAgcHVibGljIHVuZG9ja0Zyb21MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnZG9ja2VkLWxlZnQnKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVQcm9ncmVzcyhcbiAgICBjdXJyZW50UGFnZTogbnVtYmVyLFxuICAgIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgICBzdGF0dXNUZXh0OiBzdHJpbmcsXG4gICAgc3RhdHVzVHlwZTogc3RyaW5nID0gJ25vcm1hbCcsXG4gICAgaXNQYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIgPSAxLFxuICAgIGltYWdlRGltZW5zaW9ucz86IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDb25maXJtaW5nU3RvcCkgcmV0dXJuOyAvLyBEbyBub3Qgb3ZlcndyaXRlIGNvbmZpcm1hdGlvbiBwcm9tcHRcblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGFydEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGNvbnRpbnVlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHZpZXdGaWxlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBhdXNlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxQYXVzZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHJlc3VtZUJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUmVzdW1lQnRuJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RvcEJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RvcEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IG1vZGVCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbE1vZGVCdG4nKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIGNvbnN0IGNvdW50ZXJFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ291bnRlcicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGZpbGxFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUHJvZ3Jlc3NGaWxsJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RhdHVzVGV4dEVsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGF0dXNUZXh0JykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgZGltZW5zaW9uc0VsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxEaW1lbnNpb25zVGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gMS1wYWdlIHN3aXRjaCBidXR0b25cbiAgICBpZiAobW9kZUJ0bikge1xuICAgICAgbW9kZUJ0bi5zdHlsZS5kaXNwbGF5ID0gY3VycmVudE1vZGUgIT09IDEgJiYgIWlzQWN0aXZlID8gJ2ZsZXgnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIFJpZ2h0IFNpZGUgQ291bnRlclxuICAgIGlmIChjb3VudGVyRWwpIHtcbiAgICAgIGlmICh0b3RhbFBhZ2VzID4gMCkge1xuICAgICAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgUGFnZSAke2N1cnJlbnRQYWdlfS8ke3RvdGFsUGFnZXN9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgMC8ke3RvdGFsUGFnZXN9IHBhZ2VzYDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY291bnRlckVsLnRleHRDb250ZW50ID0gJ0RldGVjdGluZyBwYWdlcy4uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvZ3Jlc3MgYmFyIGZpbGxcbiAgICBpZiAoZmlsbEVsICYmIHRvdGFsUGFnZXMgPiAwKSB7XG4gICAgICBjb25zdCBwY3QgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQoKChjdXJyZW50UGFnZSArIDEpIC8gdG90YWxQYWdlcykgKiAxMDApKTtcbiAgICAgIGZpbGxFbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgICB9XG5cbiAgICAvLyBTdGF0dXMgdGV4dCAmIGNsYXNzXG4gICAgaWYgKHN0YXR1c1RleHRFbCkge1xuICAgICAgc3RhdHVzVGV4dEVsLnRleHRDb250ZW50ID0gc3RhdHVzVGV4dDtcbiAgICAgIHN0YXR1c1RleHRFbC5jbGFzc05hbWUgPSBgcGlsbC1zdGF0dXMtdGV4dCAke3N0YXR1c1R5cGV9YDtcbiAgICB9XG5cbiAgICAvLyBJbWFnZSBEaW1lbnNpb25zOiAoaW1hZ2U6IDI1ODAgeCAzOTE1KVxuICAgIGlmIChkaW1lbnNpb25zRWwpIHtcbiAgICAgIGlmIChpbWFnZURpbWVuc2lvbnMgJiYgaW1hZ2VEaW1lbnNpb25zLndpZHRoID4gMCAmJiBpbWFnZURpbWVuc2lvbnMuaGVpZ2h0ID4gMCkge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAke2ltYWdlRGltZW5zaW9ucy53aWR0aH0geCAke2ltYWdlRGltZW5zaW9ucy5oZWlnaHR9KWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAtIHggLSlgO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJ1dHRvbnMgVmlzaWJpbGl0eVxuICAgIHN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29udGludWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB2aWV3RmlsZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmVzdW1lQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgaWYgKHN0YXR1c1R5cGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIC8vIENvbXBsZXRlZDogc2hvdyBcIkRvd25sb2FkZWQ6IFZpZXcgRmlsZXNcIlxuICAgICAgdmlld0ZpbGVCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9IGVsc2UgaWYgKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyB8fCBzdGF0dXNUeXBlID09PSAnb2ZmbGluZScgfHwgKGlzUGF1c2VkICYmIHN0YXR1c1R5cGUgPT09ICdyZXRyeWluZycpKSB7XG4gICAgICAvLyBTdGFsbGVkIC8gb2ZmbGluZSAvIG1heCByZXRyaWVzIGhpdDogc2hvdyBDT05USU5VRSArIFN0b3BcbiAgICAgIGNvbnRpbnVlQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfSBlbHNlIGlmIChpc0FjdGl2ZSkge1xuICAgICAgLy8gQ3VycmVudGx5IGFjdGl2ZVxuICAgICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICAgIHJlc3VtZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWRsZVxuICAgICAgc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgdGhpcy5jb250YWluZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwKICAgICIvKipcbiAqIFV0aWxpdGllcyBmb3IgZXh0cmFjdGluZyBPQ1IgdGV4dCBmcm9tIERKVlUgWE1MIGFuZCBjb21waWxpbmcgTWFya2Rvd24gZG9jdW1lbnRzXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlVGV4dEVudHJ5IHtcbiAgcGFnZU51bTogbnVtYmVyO1xuICBsZWFmSW5kZXg6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tNZXRhZGF0YSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvb2tJZDogc3RyaW5nO1xuICBhdXRob3I/OiBzdHJpbmc7XG4gIHB1Ymxpc2hlcj86IHN0cmluZztcbiAgeWVhcj86IHN0cmluZztcbiAgc291cmNlVXJsPzogc3RyaW5nO1xuICB0b3RhbFBhZ2VzPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFN0cmlwcyBESlZVIFhNTCBpbnRvIGNsZWFuLCBzdHJ1Y3R1cmVkIHBsYWluIHRleHQgZm9yIGEgc2luZ2xlIHBhZ2UuXG4gKiBSb2J1c3RseSBwYXJzZXMgUEFSQUdSQVBILCBMSU5FLCBhbmQgV09SRCBlbGVtZW50cy5cbiAqIFdvcmtzIHNlYW1sZXNzbHkgaW4gYm90aCBicm93c2VyIGFuZCBOb2RlL0J1biB0ZXN0IGVudmlyb25tZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGp2dVhtbFRvVGV4dCh4bWxTdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgheG1sU3RyaW5nIHx8IHR5cGVvZiB4bWxTdHJpbmcgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgLy8gRXh0cmFjdCBhbGwgUEFSQUdSQVBIIGJsb2Nrc1xuICBjb25zdCBwYXJhZ3JhcGhNYXRjaGVzID0geG1sU3RyaW5nLm1hdGNoKC88UEFSQUdSQVBIW1xcc1xcU10qPzxcXC9QQVJBR1JBUEg+L2dpKTtcbiAgaWYgKCFwYXJhZ3JhcGhNYXRjaGVzIHx8IHBhcmFncmFwaE1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gSWYgbm8gUEFSQUdSQVBIIHRhZ3MsIHRyeSBleHRyYWN0aW5nIHdvcmRzIGRpcmVjdGx5XG4gICAgY29uc3Qgd29yZHMgPSBBcnJheS5mcm9tKHhtbFN0cmluZy5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKVxuICAgICAgLm1hcChtID0+IGRlY29kZVhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgcmV0dXJuIHdvcmRzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIGNvbnN0IHBhcmFncmFwaHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBwYXJCbG9jayBvZiBwYXJhZ3JhcGhNYXRjaGVzKSB7XG4gICAgLy8gRXh0cmFjdCBhbGwgTElORSBibG9ja3MgaW5zaWRlIHRoaXMgUEFSQUdSQVBIXG4gICAgY29uc3QgbGluZU1hdGNoZXMgPSBwYXJCbG9jay5tYXRjaCgvPExJTkVbXFxzXFxTXSo/PFxcL0xJTkU+L2dpKTtcbiAgICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChsaW5lTWF0Y2hlcyAmJiBsaW5lTWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGxpbmVCbG9jayBvZiBsaW5lTWF0Y2hlcykge1xuICAgICAgICAvLyBFeHRyYWN0IGFsbCBXT1JEIGNvbnRlbnRzIGluc2lkZSB0aGlzIExJTkVcbiAgICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKGxpbmVCbG9jay5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKTtcbiAgICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAgIC5tYXAobSA9PiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobVsxXS50cmltKCkpKVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsaW5lcy5wdXNoKHdvcmRzLmpvaW4oJyAnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRmFsbGJhY2s6IHdvcmRzIGRpcmVjdGx5IGluIHBhcmFncmFwaFxuICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKHBhckJsb2NrLm1hdGNoQWxsKC88V09SRFtePl0qPihbXFxzXFxTXSo/KTxcXC9XT1JEPi9naSkpO1xuICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAubWFwKG0gPT4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCh3b3Jkcy5qb2luKCcgJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhZ3JhcGhzLnB1c2goZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKGxpbmVzLmpvaW4oJ1xcbicpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gZGVjb2RlIGFsbCBIVE1MIGFuZCBYTUwgZW50aXRpZXMgaW50byBwcm9wZXIgVVRGLTggY2hhcmFjdGVycy5cbiAqIEhhbmRsZXMgbnVtZXJpYyBkZWNpbWFsIChlLmcuICYjODIxMjsgLT4g4oCUKSwgaGV4ICgmI3gyMDE0OyksIGFuZCBuYW1lZCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXRleHQgfHwgdHlwZW9mIHRleHQgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgcmV0dXJuIHRleHRcbiAgICAvLyAxLiBEZWNpbWFsIG51bWVyaWMgZW50aXRpZXM6ICYjODIxMjsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiMoXFxkKyk7L2csIChfLCBkZWMpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChkZWMsIDEwKTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMi4gSGV4YWRlY2ltYWwgbnVtZXJpYyBlbnRpdGllczogJiN4MjAxNDsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiN4KFswLTlhLWZBLUZdKyk7L2csIChfLCBoZXgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChoZXgsIDE2KTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMy4gTmFtZWQgZW50aXRpZXNcbiAgICAucmVwbGFjZSgvJm1kYXNoOy9nLCAn4oCUJylcbiAgICAucmVwbGFjZSgvJm5kYXNoOy9nLCAn4oCTJylcbiAgICAucmVwbGFjZSgvJmhlbGxpcDsvZywgJ+KApicpXG4gICAgLnJlcGxhY2UoLyZsc3F1bzsvZywgJ+KAmCcpXG4gICAgLnJlcGxhY2UoLyZyc3F1bzsvZywgJ+KAmScpXG4gICAgLnJlcGxhY2UoLyZsZHF1bzsvZywgJ+KAnCcpXG4gICAgLnJlcGxhY2UoLyZyZHF1bzsvZywgJ+KAnScpXG4gICAgLnJlcGxhY2UoLyZuYnNwOy9nLCAnICcpXG4gICAgLnJlcGxhY2UoLyZidWxsOy9nLCAn4oCiJylcbiAgICAucmVwbGFjZSgvJmNlbnQ7L2csICfCoicpXG4gICAgLnJlcGxhY2UoLyZwb3VuZDsvZywgJ8KjJylcbiAgICAucmVwbGFjZSgvJnllbjsvZywgJ8KlJylcbiAgICAucmVwbGFjZSgvJmV1cm87L2csICfigqwnKVxuICAgIC5yZXBsYWNlKC8mY29weTsvZywgJ8KpJylcbiAgICAucmVwbGFjZSgvJnJlZzsvZywgJ8KuJylcbiAgICAucmVwbGFjZSgvJmRlZzsvZywgJ8KwJylcbiAgICAucmVwbGFjZSgvJnBsdXNtbjsvZywgJ8KxJylcbiAgICAucmVwbGFjZSgvJnRpbWVzOy9nLCAnw5cnKVxuICAgIC5yZXBsYWNlKC8mZGl2aWRlOy9nLCAnw7cnKVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAucmVwbGFjZSgvJmFwb3M7L2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7IC8vIGRlY29kZSAmYW1wOyBsYXN0XG59XG5cbi8qKlxuICogU3RyaXBzIEhhdGhpVHJ1c3QgPGZpZ2NhcHRpb24+IG1hcmt1cCBpbnRvIGNsZWFuLCBmb3JtYXR0ZWQgTWFya2Rvd24vdGV4dC5cbiAqIEhhbmRsZXMgYm90aCBET00gRWxlbWVudCBpbnB1dHMgKGluIGJyb3dzZXIpIGFuZCByYXcgSFRNTCBzdHJpbmdzIChpbiB0ZXN0cykuXG4gKiBFeHRyYWN0cyB3b3JkIHNwYW5zLCBwcmVzZXJ2ZXMgcGFyYWdyYXBoIGJyZWFrcywgYW5kIGRlY29kZXMgSFRNTCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGlucHV0OiBzdHJpbmcgfCBhbnkpOiBzdHJpbmcge1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG5cbiAgLy8gSWYgRE9NIEVsZW1lbnQgaW4gYnJvd3NlciBlbnZpcm9ubWVudFxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0JyAmJiBpbnB1dC5ub2RlVHlwZSkge1xuICAgIGNvbnN0IGVsID0gaW5wdXQgYXMgRWxlbWVudDtcbiAgICBjb25zdCBwRWxlbWVudHMgPSBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ3AsIC5vY3JfcGFyJykpO1xuXG4gICAgaWYgKHBFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwYXJhZ3JhcGhzID0gcEVsZW1lbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKHAucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCwgLm9jcl9saW5lJykpO1xuICAgICAgICBpZiAoc3BhbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBzcGFuc1xuICAgICAgICAgICAgLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyA8cD4gdGFncywgY2hlY2sgZm9yIGxpbmUgZWxlbWVudHNcbiAgICBjb25zdCBsaW5lcyA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnLm9jcl9saW5lLCBkaXYnKSk7XG4gICAgaWYgKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxpbmVUZXh0cyA9IGxpbmVzLm1hcChsaW5lID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKGxpbmUucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCcpKTtcbiAgICAgICAgaWYgKHNwYW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGxpbmUudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobGluZVRleHRzLmpvaW4oJ1xcbicpKTtcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjazogZXh0cmFjdCBhbGwgc3BhbnMgb3IgdGV4dCBkaXJlY3RseVxuICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShlbC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xuICAgIGlmIChzcGFucy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXModGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcygoZWwudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9bIFxcdF0rL2csICcgJykpO1xuICB9XG5cbiAgLy8gSWYgaW5wdXQgaXMgYW4gSFRNTCBzdHJpbmdcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICBsZXQgY2xlYW4gPSBpbnB1dDtcblxuICAgIC8vIENoZWNrIGZvciA8cD4gb3IgPGRpdiBjbGFzcz1cIm9jcl9wYXJcIj4gcGFyYWdyYXBoc1xuICAgIGNvbnN0IHBNYXRjaGVzID0gY2xlYW4ubWF0Y2goLzwoPzpwfGRpdiBjbGFzcz1cIm9jcl9wYXJcIilbXj5dKj4oW1xcc1xcU10qPyk8XFwvKD86cHxkaXYpPi9naSk7XG4gICAgaWYgKHBNYXRjaGVzICYmIHBNYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHBhcmFncmFwaHMgPSBwTWF0Y2hlcy5tYXAocEJsb2NrID0+IHtcbiAgICAgICAgcmV0dXJuIHBCbG9ja1xuICAgICAgICAgIC5yZXBsYWNlKC88YnJcXHMqXFwvPz4vZ2ksICdcXG4nKVxuICAgICAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgICAgICAucmVwbGFjZSgvWyBcXHRcXHJcXG5dKy9nLCAnICcpXG4gICAgICAgICAgLnRyaW0oKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2Ugc3RyaXAgdGFncywgcHJlc2VydmluZyA8YnI+IGFzIGxpbmUgYnJlYWtzXG4gICAgY29uc3QgdGV4dCA9IGNsZWFuXG4gICAgICAucmVwbGFjZSgvPGJyXFxzKlxcLz8+L2dpLCAnXFxuJylcbiAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF0rL2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9cXG5cXHMqXFxuKy9nLCAnXFxuXFxuJylcbiAgICAgIC50cmltKCk7XG5cbiAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIEFzc2VtYmxlcyBtdWx0aXBsZSBwYWdlIHRleHRzIGFuZCBib29rIG1ldGFkYXRhIGludG8gYSBjbGVhbiwgY29tcGxldGUgTWFya2Rvd24gZG9jdW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEJvb2tNYXJrZG93bihcbiAgbWV0YWRhdGE6IEJvb2tNZXRhZGF0YSxcbiAgcGFnZXM6IFBhZ2VUZXh0RW50cnlbXVxuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gVGl0bGUgYW5kIEhlYWRlclxuICBwYXJ0cy5wdXNoKGAjICR7bWV0YWRhdGEudGl0bGUgfHwgJ1VudGl0bGVkIEJvb2snfVxcbmApO1xuXG4gIGNvbnN0IG1ldGFMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKG1ldGFkYXRhLmF1dGhvcikgbWV0YUxpbmVzLnB1c2goYC0gKipBdXRob3I6KiogJHttZXRhZGF0YS5hdXRob3J9YCk7XG4gIGlmIChtZXRhZGF0YS5wdWJsaXNoZXIpIG1ldGFMaW5lcy5wdXNoKGAtICoqUHVibGlzaGVyOioqICR7bWV0YWRhdGEucHVibGlzaGVyfWApO1xuICBpZiAobWV0YWRhdGEueWVhcikgbWV0YUxpbmVzLnB1c2goYC0gKipEYXRlOioqICR7bWV0YWRhdGEueWVhcn1gKTtcblxuICBpZiAobWV0YWRhdGEuYm9va0lkKSB7XG4gICAgaWYgKG1ldGFkYXRhLnNvdXJjZVVybCAmJiBtZXRhZGF0YS5zb3VyY2VVcmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykpIHtcbiAgICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqSGF0aGlUcnVzdCBJZGVudGlmaWVyOioqIFske21ldGFkYXRhLmJvb2tJZH1dKCR7bWV0YWRhdGEuc291cmNlVXJsfSlgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YUxpbmVzLnB1c2goYC0gKipJbnRlcm5ldCBBcmNoaXZlIElkZW50aWZpZXI6KiogWyR7bWV0YWRhdGEuYm9va0lkfV0oaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLyR7bWV0YWRhdGEuYm9va0lkfSlgKTtcbiAgICB9XG4gIH1cblxuICBpZiAobWV0YWRhdGEuc291cmNlVXJsICYmICFtZXRhTGluZXMuc29tZShsID0+IGwuaW5jbHVkZXMobWV0YWRhdGEuc291cmNlVXJsISkpKSB7XG4gICAgbWV0YUxpbmVzLnB1c2goYC0gKipTb3VyY2U6KiogJHttZXRhZGF0YS5zb3VyY2VVcmx9YCk7XG4gIH1cbiAgaWYgKG1ldGFkYXRhLnRvdGFsUGFnZXMpIG1ldGFMaW5lcy5wdXNoKGAtICoqVG90YWwgUGFnZXM6KiogJHttZXRhZGF0YS50b3RhbFBhZ2VzfWApO1xuXG4gIGlmIChtZXRhTGluZXMubGVuZ3RoID4gMCkge1xuICAgIHBhcnRzLnB1c2gobWV0YUxpbmVzLmpvaW4oJ1xcbicpKTtcbiAgICBwYXJ0cy5wdXNoKCdcXG4tLS1cXG4nKTtcbiAgfVxuXG4gIC8vIFNvcnQgcGFnZXMgYnkgcGFnZU51bVxuICBjb25zdCBzb3J0ZWQgPSBbLi4ucGFnZXNdLnNvcnQoKGEsIGIpID0+IGEucGFnZU51bSAtIGIucGFnZU51bSk7XG5cbiAgZm9yIChjb25zdCBwYWdlIG9mIHNvcnRlZCkge1xuICAgIHBhcnRzLnB1c2goYCMjIFBhZ2UgJHtwYWdlLnBhZ2VOdW19XFxuXFxuYCk7XG4gICAgaWYgKHBhZ2UudGV4dCAmJiBwYWdlLnRleHQudHJpbSgpKSB7XG4gICAgICBwYXJ0cy5wdXNoKGAke3BhZ2UudGV4dC50cmltKCl9XFxuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzLnB1c2goYCpbTm8gdGV4dCBvciBpbGx1c3RyYXRpb24gcGFnZV0qXFxuYCk7XG4gICAgfVxuICAgIHBhcnRzLnB1c2goJ1xcbi0tLVxcbicpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJ1xcbicpO1xufVxuXG4iLAogICAgIi8qKlxuICogRmFzdCwgcHVyZSBKYXZhU2NyaXB0IFBERiBjb21waWxlciBmb3IgZW1iZWRkaW5nIEpQRUcgcGFnZSBpbWFnZXMgaW50byBQREYgZG9jdW1lbnRzLlxuICogQ29uZm9ybXMgdG8gUERGIDEuNCBzcGVjaWZpY2F0aW9uLiBaZXJvIGV4dGVybmFsIGJpbmFyeSBkZXBlbmRlbmNpZXMuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBKcGVnSW5mbyB7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBjaGFubmVsczogbnVtYmVyO1xuICBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJztcbiAgYml0czogbnVtYmVyO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHdpZHRoLCBoZWlnaHQsIGFuZCBjb2xvciBzcGFjZSBkaXJlY3RseSBmcm9tIEpQRUcgaGVhZGVyIG1hcmtlcnMgKFNPRjAvU09GMikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRKcGVnSW5mbyhkYXRhOiBVaW50OEFycmF5KTogSnBlZ0luZm8ge1xuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG5cbiAgaWYgKHZpZXcuZ2V0VWludDE2KDApICE9PSAweGZmZDgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIHZhbGlkIEpQRUcgaW1hZ2UgKG1pc3NpbmcgU09JIG1hcmtlcikuJyk7XG4gIH1cblxuICBjb25zdCBTT0ZfTUFSS0VSUyA9IFtcbiAgICAweGZmYzAsIDB4ZmZjMSwgMHhmZmMyLCAweGZmYzMsIDB4ZmZjNSwgMHhmZmM2LCAweGZmYzcsIDB4ZmZjOSwgMHhmZmNhLFxuICAgIDB4ZmZjYiwgMHhmZmNkLCAweGZmY2UsIDB4ZmZjZixcbiAgXTtcblxuICBsZXQgcG9zID0gMjtcbiAgd2hpbGUgKHBvcyA8IGRhdGEubGVuZ3RoIC0gOCkge1xuICAgIGNvbnN0IG1hcmtlciA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgcG9zICs9IDI7XG5cbiAgICBpZiAoU09GX01BUktFUlMuaW5jbHVkZXMobWFya2VyKSkge1xuICAgICAgcG9zICs9IDI7IC8vIHNraXAgbGVuZ3RoXG4gICAgICBjb25zdCBiaXRzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG4gICAgICBjb25zdCBoZWlnaHQgPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb25zdCB3aWR0aCA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgICBwb3MgKz0gMjtcbiAgICAgIGNvbnN0IGNoYW5uZWxzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG5cbiAgICAgIGxldCBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJyA9ICdEZXZpY2VSR0InO1xuICAgICAgaWYgKGNoYW5uZWxzID09PSAxKSBjb2xvclNwYWNlID0gJ0RldmljZUdyYXknO1xuICAgICAgZWxzZSBpZiAoY2hhbm5lbHMgPT09IDQpIGNvbG9yU3BhY2UgPSAnRGV2aWNlQ01ZSyc7XG5cbiAgICAgIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIGNoYW5uZWxzLCBjb2xvclNwYWNlLCBiaXRzIH07XG4gICAgfVxuXG4gICAgY29uc3QgbGVuZ3RoID0gdmlldy5nZXRVaW50MTYocG9zKTtcbiAgICBwb3MgKz0gbGVuZ3RoO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBTT0YgbWFya2VyIGluIEpQRUcgc3RyZWFtLicpO1xufVxuXG4vKipcbiAqIEhlbHBlciB0byBjb252ZXJ0IEJhc2U2NCBEYXRhIFVSTCB0byBVaW50OEFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGF0YVVybFRvQnl0ZXMoZGF0YVVybDogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGNvbW1hSW5kZXggPSBkYXRhVXJsLmluZGV4T2YoJywnKTtcbiAgY29uc3QgYmFzZTY0ID0gY29tbWFJbmRleCA+PSAwID8gZGF0YVVybC5zbGljZShjb21tYUluZGV4ICsgMSkgOiBkYXRhVXJsO1xuICBjb25zdCBiaW5hcnlTdHJpbmcgPSBhdG9iKGJhc2U2NCk7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYmluYXJ5U3RyaW5nLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5U3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgYnl0ZXNbaV0gPSBiaW5hcnlTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gYnl0ZXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmSW1hZ2VJbnB1dCB7XG4gIHBhZ2VOdW06IG51bWJlcjtcbiAgZGF0YTogVWludDhBcnJheSB8IHN0cmluZzsgLy8gVWludDhBcnJheSBvciBEYXRhVVJMXG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBsaXN0IG9mIEpQRUcgaW1hZ2VzIGludG8gYSB2YWxpZCBQREYgZG9jdW1lbnQuXG4gKiBFbWJlZHMgcmF3IEpQRUcgc3RyZWFtcyBkaXJlY3RseSB3aXRob3V0IGRlY29tcHJlc3Npb24gb3IgcmUtZW5jb2RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSnBlZ3NUb1BkZihcbiAgaW1hZ2VzOiBQZGZJbWFnZUlucHV0W10sXG4gIG1ldGFkYXRhOiB7IHRpdGxlPzogc3RyaW5nOyBhdXRob3I/OiBzdHJpbmc7IGNyZWF0b3I/OiBzdHJpbmcgfSA9IHt9XG4pOiBVaW50OEFycmF5IHtcbiAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgUERGOiBObyBpbWFnZXMgcHJvdmlkZWQuJyk7XG4gIH1cblxuICBjb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICBjb25zdCBvZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgY3VycmVudE9mZnNldCA9IDA7XG5cbiAgZnVuY3Rpb24gd3JpdGUoYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICBjaHVua3MucHVzaChieXRlcyk7XG4gICAgY3VycmVudE9mZnNldCArPSBieXRlcy5sZW5ndGg7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZVN0cmluZyhzdHI6IHN0cmluZykge1xuICAgIHdyaXRlKHRleHRFbmNvZGVyLmVuY29kZShzdHIpKTtcbiAgfVxuXG4gIC8vIEhlYWRlclxuICB3cml0ZVN0cmluZygnJVBERi0xLjRcXG4lXFx4RTJcXHhFM1xceENGXFx4RDNcXG4nKTtcblxuICBsZXQgb2JqSWRDb3VudGVyID0gMTtcbiAgZnVuY3Rpb24gc3RhcnRPYmplY3QoKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZCA9IG9iaklkQ291bnRlcisrO1xuICAgIG9mZnNldHNbaWRdID0gY3VycmVudE9mZnNldDtcbiAgICB3cml0ZVN0cmluZyhgJHtpZH0gMCBvYmpcXG5gKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRPYmplY3QoKSB7XG4gICAgd3JpdGVTdHJpbmcoJ2VuZG9ialxcbicpO1xuICB9XG5cbiAgY29uc3QgdG90YWxQYWdlcyA9IGltYWdlcy5sZW5ndGg7XG5cbiAgLy8gUHJlLWNhbGN1bGF0ZSBPYmplY3QgSURzOlxuICAvLyAxOiBDYXRhbG9nXG4gIC8vIDI6IFBhZ2VzXG4gIC8vIDMgKyAoaSAqIDMpOiBQYWdlIG9iamVjdFxuICAvLyA0ICsgKGkgKiAzKTogQ29udGVudCBzdHJlYW1cbiAgLy8gNSArIChpICogMyk6IEltYWdlIFhPYmplY3RcbiAgY29uc3QgY2F0YWxvZ0lkID0gMTtcbiAgY29uc3QgcGFnZXNSb290SWQgPSAyO1xuICBjb25zdCBwYWdlSWRzOiBudW1iZXJbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsUGFnZXM7IGkrKykge1xuICAgIHBhZ2VJZHMucHVzaCgzICsgaSAqIDMpO1xuICB9XG5cbiAgLy8gMS4gQ2F0YWxvZ1xuICBzdGFydE9iamVjdCgpOyAvLyAxXG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL0NhdGFsb2dcXG4gIC9QYWdlcyAke3BhZ2VzUm9vdElkfSAwIFJcXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAyLiBQYWdlcyBSb290XG4gIHN0YXJ0T2JqZWN0KCk7IC8vIDJcbiAgY29uc3Qga2lkc1N0ciA9IHBhZ2VJZHMubWFwKGlkID0+IGAke2lkfSAwIFJgKS5qb2luKCcgJyk7XG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL1BhZ2VzXFxuICAvS2lkcyBbICR7a2lkc1N0cn0gXVxcbiAgL0NvdW50ICR7dG90YWxQYWdlc31cXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAzLiBSZW5kZXIgRWFjaCBQYWdlIChQYWdlLCBDb250ZW50cywgSW1hZ2UgWE9iamVjdClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbFBhZ2VzOyBpKyspIHtcbiAgICBjb25zdCBpdGVtID0gaW1hZ2VzW2ldO1xuICAgIGNvbnN0IGltYWdlQnl0ZXMgPSB0eXBlb2YgaXRlbS5kYXRhID09PSAnc3RyaW5nJyA/IGRhdGFVcmxUb0J5dGVzKGl0ZW0uZGF0YSkgOiBpdGVtLmRhdGE7XG4gICAgY29uc3QgaW5mbyA9IGdldEpwZWdJbmZvKGltYWdlQnl0ZXMpO1xuXG4gICAgY29uc3Qgd2lkdGggPSBpdGVtLndpZHRoIHx8IGluZm8ud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gaXRlbS5oZWlnaHQgfHwgaW5mby5oZWlnaHQ7XG5cbiAgICBjb25zdCBwYWdlT2JqSWQgPSAzICsgaSAqIDM7XG4gICAgY29uc3QgY29udGVudE9iaklkID0gNCArIGkgKiAzO1xuICAgIGNvbnN0IGltYWdlT2JqSWQgPSA1ICsgaSAqIDM7XG5cbiAgICAvLyBQYWdlIE9iamVjdFxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIHBhZ2VPYmpJZFxuICAgIHdyaXRlU3RyaW5nKFxuICAgICAgYDw8XFxuYCArXG4gICAgICBgICAvVHlwZSAvUGFnZVxcbmAgK1xuICAgICAgYCAgL1BhcmVudCAke3BhZ2VzUm9vdElkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9NZWRpYUJveCBbIDAgMCAke3dpZHRofSAke2hlaWdodH0gXVxcbmAgK1xuICAgICAgYCAgL0NvbnRlbnRzICR7Y29udGVudE9iaklkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9SZXNvdXJjZXMgPDxcXG5gICtcbiAgICAgIGAgICAgL1hPYmplY3QgPDwgL0ltJHtpICsgMX0gJHtpbWFnZU9iaklkfSAwIFIgPj5cXG5gICtcbiAgICAgIGAgID4+XFxuYCArXG4gICAgICBgPj5cXG5gXG4gICAgKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIENvbnRlbnQgU3RyZWFtXG4gICAgY29uc3QgY29udGVudFN0cmVhbSA9IGBxXFxuJHt3aWR0aH0gMCAwICR7aGVpZ2h0fSAwIDAgY21cXG4vSW0ke2kgKyAxfSBEb1xcblFcXG5gO1xuICAgIGNvbnN0IGNvbnRlbnRCeXRlcyA9IHRleHRFbmNvZGVyLmVuY29kZShjb250ZW50U3RyZWFtKTtcblxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIGNvbnRlbnRPYmpJZFxuICAgIHdyaXRlU3RyaW5nKGA8PCAvTGVuZ3RoICR7Y29udGVudEJ5dGVzLmxlbmd0aH0gPj5cXG5zdHJlYW1cXG5gKTtcbiAgICB3cml0ZShjb250ZW50Qnl0ZXMpO1xuICAgIHdyaXRlU3RyaW5nKCdcXG5lbmRzdHJlYW1cXG4nKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIEltYWdlIFhPYmplY3RcbiAgICBzdGFydE9iamVjdCgpOyAvLyBpbWFnZU9iaklkXG4gICAgd3JpdGVTdHJpbmcoXG4gICAgICBgPDxcXG5gICtcbiAgICAgIGAgIC9UeXBlIC9YT2JqZWN0XFxuYCArXG4gICAgICBgICAvU3VidHlwZSAvSW1hZ2VcXG5gICtcbiAgICAgIGAgIC9XaWR0aCAke2luZm8ud2lkdGh9XFxuYCArXG4gICAgICBgICAvSGVpZ2h0ICR7aW5mby5oZWlnaHR9XFxuYCArXG4gICAgICBgICAvQ29sb3JTcGFjZSAvJHtpbmZvLmNvbG9yU3BhY2V9XFxuYCArXG4gICAgICBgICAvQml0c1BlckNvbXBvbmVudCAke2luZm8uYml0c31cXG5gICtcbiAgICAgIGAgIC9GaWx0ZXIgL0RDVERlY29kZVxcbmAgK1xuICAgICAgYCAgL0xlbmd0aCAke2ltYWdlQnl0ZXMubGVuZ3RofVxcbmAgK1xuICAgICAgYD4+XFxuc3RyZWFtXFxuYFxuICAgICk7XG4gICAgd3JpdGUoaW1hZ2VCeXRlcyk7XG4gICAgd3JpdGVTdHJpbmcoJ1xcbmVuZHN0cmVhbVxcbicpO1xuICAgIGVuZE9iamVjdCgpO1xuICB9XG5cbiAgLy8gT3B0aW9uYWwgSW5mbyBPYmplY3RcbiAgY29uc3QgaW5mb0lkID0gc3RhcnRPYmplY3QoKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gKG1ldGFkYXRhLnRpdGxlIHx8ICdBcmNoaXZlLm9yZyBCb29rJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICBjb25zdCBzYWZlQXV0aG9yID0gKG1ldGFkYXRhLmF1dGhvciB8fCAnQXJjaGl2ZS5vcmcnKS5yZXBsYWNlKC9bKClcXFxcXS9nLCAnXFxcXCQmJyk7XG4gIGNvbnN0IGNyZWF0b3IgPSAobWV0YWRhdGEuY3JlYXRvciB8fCAnQXJjaGl2ZSBEb3dubG9hZGVyJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICB3cml0ZVN0cmluZyhcbiAgICBgPDxcXG5gICtcbiAgICBgICAvVGl0bGUgKCR7c2FmZVRpdGxlfSlcXG5gICtcbiAgICBgICAvQXV0aG9yICgke3NhZmVBdXRob3J9KVxcbmAgK1xuICAgIGAgIC9DcmVhdG9yICgke2NyZWF0b3J9KVxcbmAgK1xuICAgIGAgIC9Qcm9kdWNlciAoQXJjaGl2ZSBEb3dubG9hZGVyIEV4dGVuc2lvbilcXG5gICtcbiAgICBgICAvQ3JlYXRpb25EYXRlIChEOiR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1stOlRdL2csICcnKS5zbGljZSgwLCAxNCl9WilcXG5gICtcbiAgICBgPj5cXG5gXG4gICk7XG4gIGVuZE9iamVjdCgpO1xuXG4gIC8vIFhSZWYgVGFibGVcbiAgY29uc3Qgc3RhcnRYcmVmID0gY3VycmVudE9mZnNldDtcbiAgY29uc3QgdG90YWxPYmplY3RzID0gb2JqSWRDb3VudGVyOyAvLyAxIHRvIG9iaklkQ291bnRlci0xXG5cbiAgd3JpdGVTdHJpbmcoYHhyZWZcXG4wICR7dG90YWxPYmplY3RzfVxcbmApO1xuICB3cml0ZVN0cmluZygnMDAwMDAwMDAwMCA2NTUzNSBmIFxcbicpO1xuXG4gIGZvciAobGV0IGlkID0gMTsgaWQgPCB0b3RhbE9iamVjdHM7IGlkKyspIHtcbiAgICBjb25zdCBvZmZzZXQgPSBvZmZzZXRzW2lkXSB8fCAwO1xuICAgIGNvbnN0IHBhZGRlZE9mZnNldCA9IFN0cmluZyhvZmZzZXQpLnBhZFN0YXJ0KDEwLCAnMCcpO1xuICAgIHdyaXRlU3RyaW5nKGAke3BhZGRlZE9mZnNldH0gMDAwMDAgbiBcXG5gKTtcbiAgfVxuXG4gIC8vIFRyYWlsZXJcbiAgd3JpdGVTdHJpbmcoXG4gICAgYHRyYWlsZXJcXG5gICtcbiAgICBgPDxcXG5gICtcbiAgICBgICAvU2l6ZSAke3RvdGFsT2JqZWN0c31cXG5gICtcbiAgICBgICAvUm9vdCAke2NhdGFsb2dJZH0gMCBSXFxuYCArXG4gICAgYCAgL0luZm8gJHtpbmZvSWR9IDAgUlxcbmAgK1xuICAgIGA+PlxcbmAgK1xuICAgIGBzdGFydHhyZWZcXG5gICtcbiAgICBgJHtzdGFydFhyZWZ9XFxuYCArXG4gICAgYCUlRU9GXFxuYFxuICApO1xuXG4gIC8vIENvbmNhdGVuYXRlIGFsbCBjaHVua3MgaW50byBmaW5hbCBVaW50OEFycmF5XG4gIGxldCB0b3RhbExlbmd0aCA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB0b3RhbExlbmd0aCArPSBjaHVuay5sZW5ndGg7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRvdGFsTGVuZ3RoKTtcbiAgbGV0IHBvcyA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgcmVzdWx0LnNldChjaHVuaywgcG9zKTtcbiAgICBwb3MgKz0gY2h1bmsubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBBbGlhcyBmb3IgY29tcGlsZUpwZWdzVG9QZGYuXG4gKi9cbmV4cG9ydCBjb25zdCBjb21waWxlSW1hZ2VzVG9QZGYgPSBjb21waWxlSnBlZ3NUb1BkZjtcbiIsCiAgICAiLyoqXG4gKiBGaWxlc3lzdGVtIGFuZCBuYW1pbmcgc2FuaXRpemF0aW9uIHV0aWxpdGllc1xuICovXG5cbi8qKlxuICogU2FuaXRpemVzIGEgc3RyaW5nIGZvciBzYWZlIHVzYWdlIGluIGRpcmVjdG9yeSBvciBmaWxlIG5hbWVzIGFjcm9zcyBtYWNPUywgTGludXgsIGFuZCBXaW5kb3dzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVGaWxlbmFtZShuYW1lOiBzdHJpbmcsIGZhbGxiYWNrID0gJ2Jvb2snKTogc3RyaW5nIHtcbiAgaWYgKCFuYW1lIHx8IHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbGxiYWNrO1xuXG4gIC8vIFJlbW92ZSBvciByZXBsYWNlIGlsbGVnYWwgY2hhcmFjdGVyczogLyBcXCA6ICogPyBcIiA8ID4gfCBhbmQgY29udHJvbCBjaGFyc1xuICBsZXQgY2xlYW5lZCA9IG5hbWVcbiAgICAucmVwbGFjZSgvWzw+OlwiL1xcXFx8PypcXHgwMC1cXHgxRl0vZywgJ18nKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAudHJpbSgpO1xuXG4gIC8vIFN0cmlwIGxlYWRpbmcvdHJhaWxpbmcgZG90cyBhbmQgc3BhY2VzXG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL15cXC4rfFxcLiskL2csICcnKS50cmltKCk7XG5cbiAgLy8gQXZvaWQgcmVzZXJ2ZWQgbmFtZXMgb24gV2luZG93cyAoQ09OLCBQUk4sIEFVWCwgTlVMLCBDT00xLTksIExQVDEtOSlcbiAgY29uc3QgcmVzZXJ2ZWQgPSAvXihDT058UFJOfEFVWHxOVUx8Q09NWzEtOV18TFBUWzEtOV0pJC9pO1xuICBpZiAocmVzZXJ2ZWQudGVzdChjbGVhbmVkKSkge1xuICAgIGNsZWFuZWQgPSBgJHtjbGVhbmVkfV9maWxlYDtcbiAgfVxuXG4gIC8vIENhcCBsZW5ndGggdG8gMTIwIGNoYXJhY3RlcnMgdG8gcHJldmVudCBwYXRoIGxpbWl0IGVycm9yc1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPiAxMjApIHtcbiAgICBjbGVhbmVkID0gY2xlYW5lZC5zdWJzdHJpbmcoMCwgMTIwKS50cmltKCk7XG4gIH1cblxuICByZXR1cm4gY2xlYW5lZCB8fCBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBGb3JtYXRzIGEgc3ViZm9sZGVyIHBhdGggYmFzZWQgb24gdGhlIHVzZXIncyB0ZW1wbGF0ZSBwYXR0ZXJuLlxuICogVGVtcGxhdGVzIHN1cHBvcnRlZDpcbiAqIC0ge3RpdGxlfSAtPiBcIlRoZV9Cb29rX1RpdGxlXCJcbiAqIC0ge2lkfSAtPiBcIm5hZ2hhbW1hZGlsaWJyYXIwMGphbWVcIlxuICogLSB7dGl0bGV9X3tpZH0gLT4gXCJUaGVfQm9va19UaXRsZV9uYWdoYW1tYWRpbGlicmFyMDBqYW1lXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN1YmRpcihcbiAgYmFzZURpcjogc3RyaW5nLFxuICBwYXR0ZXJuOiBzdHJpbmcsXG4gIGJvb2tUaXRsZTogc3RyaW5nLFxuICBib29rSWQ6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgY29uc3Qgc2FmZUJhc2UgPSBzYW5pdGl6ZUZpbGVuYW1lKGJhc2VEaXIsICdBcmNoaXZlQm9va3MnKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gc2FuaXRpemVGaWxlbmFtZShib29rVGl0bGUsICdib29rJyk7XG4gIGNvbnN0IHNhZmVJZCA9IHNhbml0aXplRmlsZW5hbWUoYm9va0lkLCAnaWQnKTtcblxuICBsZXQgZm9sZGVyID0gcGF0dGVybiB8fCAne3RpdGxlfV97aWR9JztcbiAgZm9sZGVyID0gZm9sZGVyLnJlcGxhY2UoL1xce3RpdGxlXFx9L2csIHNhZmVUaXRsZSk7XG4gIGZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXHtpZFxcfS9nLCBzYWZlSWQpO1xuICBmb2xkZXIgPSBzYW5pdGl6ZUZpbGVuYW1lKGZvbGRlciwgc2FmZVRpdGxlKTtcblxuICByZXR1cm4gYCR7c2FmZUJhc2V9LyR7Zm9sZGVyfWA7XG59XG5cbi8qKlxuICogRm9ybWF0cyBhIHBhZ2UgaW1hZ2UgZmlsZW5hbWUgd2l0aCB6ZXJvIHBhZGRpbmcuXG4gKiBFeGFtcGxlOiBcInBhZ2VfMDAxLmpwZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRQYWdlRmlsZW5hbWUoXG4gIHBhZ2VOdW06IG51bWJlcixcbiAgdG90YWxQYWdlczogbnVtYmVyLFxuICBmb3JtYXQgPSAnanBnJ1xuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFkTGVuZ3RoID0gTWF0aC5tYXgoMywgU3RyaW5nKHRvdGFsUGFnZXMpLmxlbmd0aCk7XG4gIGNvbnN0IHBhZGRlZE51bSA9IFN0cmluZyhwYWdlTnVtKS5wYWRTdGFydChwYWRMZW5ndGgsICcwJyk7XG4gIHJldHVybiBgcGFnZV8ke3BhZGRlZE51bX0uJHtmb3JtYXR9YDtcbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCb29rSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlRGp2dVhtbFRvVGV4dCB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuXG4vKipcbiAqIEV4dHJhY3RzIHBhZ2UvbGVhZiBudW1iZXIgZnJvbSBBcmNoaXZlLm9yZyBpbWFnZSBVUkxzIChlLmcuIF8wMDMwLnRpZiAtPiAzMCkuXG4gKiBFeGFtcGxlOiBmaWxlPXByaW5jaXBsZXN0ZWFjaDAxbnV0dGdvb2dfdGlmL3ByaW5jaXBsZXN0ZWFjaDAxbnV0dGdvb2dfMDAzMC50aWZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZShzcmM6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXNyYykgcmV0dXJuIG51bGw7XG4gIC8vIDEuIEJvb2tSZWFkZXJJbWFnZXMucGhwIGZpbGUgcGFyYW1ldGVyOiBlLmcuIGZpbGU9Li4uXzAwMzAudGlmIG9yIGZpbGU9Li4uLTAwMzAuanAyXG4gIGNvbnN0IGZpbGVNYXRjaCA9IHNyYy5tYXRjaCgvWz8mXWZpbGU9W14mXSo/W19cXC1cXC5dKFxcZCspXFwuKD86dGlmfGpwMnxqcGd8anBlZ3xwbmcpL2kpO1xuICBpZiAoZmlsZU1hdGNoKSB7XG4gICAgY29uc3QgbnVtID0gcGFyc2VJbnQoZmlsZU1hdGNoWzFdLCAxMCk7XG4gICAgaWYgKCFpc05hTihudW0pKSByZXR1cm4gbnVtO1xuICB9XG4gIC8vIDIuIEdlbmVyaWMgbGVhZiBmaWxlbmFtZSBpbiBVUkwgcGF0aDogZS5nLiAvcHJpbmNpcGxlc3RlYWNoMDFudXR0Z29vZ18wMDMwLnRpZlxuICBjb25zdCBnZW5lcmljTWF0Y2ggPSBzcmMubWF0Y2goL1tfXFwtXFwuXShcXGR7Myw2fSlcXC4oPzp0aWZ8anAyfGpwZ3xqcGVnfHBuZykoPzpbPyYjXXwkKS9pKTtcbiAgaWYgKGdlbmVyaWNNYXRjaCkge1xuICAgIGNvbnN0IG51bSA9IHBhcnNlSW50KGdlbmVyaWNNYXRjaFsxXSwgMTApO1xuICAgIGlmICghaXNOYU4obnVtKSkgcmV0dXJuIG51bTtcbiAgfVxuICAvLyAzLiBFeHBsaWNpdCBwYWdlL2xlYWYgcXVlcnkgcGFyYW1ldGVyczogP3BhZ2U9MzAgb3IgJmxlYWY9MzBcbiAgY29uc3QgcGFyYW1NYXRjaCA9IHNyYy5tYXRjaCgvWz8mXSg/OnBhZ2V8bGVhZik9KFxcZCspL2kpO1xuICBpZiAocGFyYW1NYXRjaCkge1xuICAgIGNvbnN0IG51bSA9IHBhcnNlSW50KHBhcmFtTWF0Y2hbMV0sIDEwKTtcbiAgICBpZiAoIWlzTmFOKG51bSkpIHJldHVybiBudW07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgY3VycmVudCBhbmQgdG90YWwgcGFnZSBmcm9tIEFyY2hpdmUub3JnIERPTSBpbmRpY2F0b3JzLlxuICogRXhhbXBsZTogPHNwYW4gY2xhc3M9XCJCUmN1cnJlbnRwYWdlXCIgcm9sZT1cInN0YXR1c1wiPlBhZ2Ug4oCUICg1Ny8zODQpPC9zcGFuPiAtPiB7IGN1cnJlbnQ6IDU3LCB0b3RhbDogMzg0IH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQXJjaGl2ZURvbVBhZ2UodGV4dDogc3RyaW5nKTogeyBjdXJyZW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfSB8IG51bGwge1xuICBpZiAoIXRleHQpIHJldHVybiBudWxsO1xuICAvLyAxLiAoNTcvMzg0KSBvciAoNTcgLSA1OC8zODQpIGUuZy4gXCJQYWdlIOKAlCAoNTcvMzg0KVwiIG9yIFwiUGFnZXMgKDEgLSAyLzUxNSlcIlxuICBjb25zdCBtYXRjaCA9IHRleHQubWF0Y2goL1xcKChcXGQrKSg/OlxccyotXFxzKlxcZCspP1xccypcXC9cXHMqKFxcZCspXFwpLyk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBjdXJyZW50OiBwYXJzZUludChtYXRjaFsxXSwgMTApLFxuICAgICAgdG90YWw6IHBhcnNlSW50KG1hdGNoWzJdLCAxMCksXG4gICAgfTtcbiAgfVxuICAvLyAyLiBTaW1wbGUgc2xhc2g6ICg1NyAvIC4uLilcbiAgY29uc3Qgc2ltcGxlTWF0Y2ggPSB0ZXh0Lm1hdGNoKC9cXCgoXFxkKylcXHMqXFwvLyk7XG4gIGlmIChzaW1wbGVNYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBjdXJyZW50OiBwYXJzZUludChzaW1wbGVNYXRjaFsxXSwgMTApLFxuICAgICAgdG90YWw6IDAsXG4gICAgfTtcbiAgfVxuICAvLyAzLiBcIlBhZ2UgNDIgb2YgMzAwXCJcbiAgY29uc3Qgb2ZNYXRjaCA9IHRleHQubWF0Y2goLyhcXGQrKVxccytvZlxccysoXFxkKykvaSk7XG4gIGlmIChvZk1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQ6IHBhcnNlSW50KG9mTWF0Y2hbMV0sIDEwKSxcbiAgICAgIHRvdGFsOiBwYXJzZUludChvZk1hdGNoWzJdLCAxMCksXG4gICAgfTtcbiAgfVxuICAvLyA0LiBcIlBhZ2UgNTdcIlxuICBjb25zdCBwYWdlTWF0Y2ggPSB0ZXh0Lm1hdGNoKC9wYWdlXFxzKuKAlD9cXHMqKFxcZCspL2kpO1xuICBpZiAocGFnZU1hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQ6IHBhcnNlSW50KHBhZ2VNYXRjaFsxXSwgMTApLFxuICAgICAgdG90YWw6IDAsXG4gICAgfTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIEFyY2hpdmVQcm92aWRlciBpbXBsZW1lbnRzIEJvb2tQcm92aWRlciB7XG4gIHJlYWRvbmx5IHNpdGVJZCA9ICdhcmNoaXZlJyBhcyBjb25zdDtcbiAgcmVhZG9ubHkgc2l0ZU5hbWUgPSAnQXJjaGl2ZS5vcmcnO1xuICByZWFkb25seSBkZWZhdWx0U3RhcnRQYWdlID0gMDtcblxuICBwcml2YXRlIGJvb2tJbmZvOiBCb29rSW5mbyB8IG51bGwgPSBudWxsO1xuXG4gIGlzTWF0Y2goKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZS5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKSAmJiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuaW5jbHVkZXMoJy9kZXRhaWxzLycpO1xuICB9XG5cbiAgc2V0Qm9va0luZm8oaW5mbzogQm9va0luZm8gfCBudWxsKSB7XG4gICAgdGhpcy5ib29rSW5mbyA9IGluZm87XG4gIH1cblxuICBhc3luYyBkZXRlY3RCb29rSW5mbygpOiBQcm9taXNlPEJvb2tJbmZvIHwgbnVsbD4ge1xuICAgIC8vIFJlcXVlc3QgQm9va1JlYWRlciBkZXRlY3Rpb24gZnJvbSBicmlkZ2UgaW4gTUFJTiB3b3JsZFxuICAgIHRoaXMucG9zdFRvQnJpZGdlKCdERVRFQ1RfQk9PSycpO1xuXG4gICAgLy8gQWxzbyBpbnNwZWN0IERPTSBkaXJlY3RseSBhcyBmYXN0IHBhdGggLyBmYWxsYmFja1xuICAgIGNvbnN0IGRvbVBhZ2UgPSB0aGlzLmV4dHJhY3RQYWdlSW5mb0Zyb21Eb20oKTtcbiAgICBpZiAoZG9tUGFnZSkge1xuICAgICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC50aXRsZSB8fCAnQXJjaGl2ZSBCb29rJztcbiAgICAgIGNvbnN0IGlkTWF0Y2ggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUubWF0Y2goL1xcL2RldGFpbHNcXC8oW15cXC9cXD8jXSspLyk7XG4gICAgICBjb25zdCBib29rSWQgPSBpZE1hdGNoID8gaWRNYXRjaFsxXSA6ICdib29rJztcblxuICAgICAgaWYgKCF0aGlzLmJvb2tJbmZvKSB7XG4gICAgICAgIHRoaXMuYm9va0luZm8gPSB7XG4gICAgICAgICAgYm9va0lkLFxuICAgICAgICAgIGJvb2tUaXRsZTogdGl0bGUsXG4gICAgICAgICAgdG90YWxQYWdlczogZG9tUGFnZS50b3RhbCxcbiAgICAgICAgICBjdXJyZW50TGVhZjogZG9tUGFnZS5jdXJyZW50LFxuICAgICAgICAgIGN1cnJlbnRNb2RlOiAxLFxuICAgICAgICAgIHNvdXJjZVVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZG9tUGFnZS50b3RhbCA+IDAgJiYgKCF0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgfHwgdGhpcy5ib29rSW5mby50b3RhbFBhZ2VzIDwgZG9tUGFnZS50b3RhbCkpIHtcbiAgICAgICAgICB0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgPSBkb21QYWdlLnRvdGFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYm9va0luZm87XG4gIH1cblxuICBnZXRDdXJyZW50UGFnZSgpOiBudW1iZXIgfCBudWxsIHtcbiAgICAvLyAxLiBDaGVjayBzdGF0dXMgLyBwYWdlIGluZGljYXRvciBzcGFucyBhY3Jvc3MgQm9va1JlYWRlciB2ZXJzaW9uc1xuICAgIGNvbnN0IGN1cnJlbnRTcGFuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkJSY3VycmVudHBhZ2UsIFtyb2xlPVwic3RhdHVzXCJdLCAucGFnZS1udW1iZXIsIC5CUnBhZ2VyLWNvdW50ZXInKTtcbiAgICBpZiAoY3VycmVudFNwYW4gJiYgY3VycmVudFNwYW4udGV4dENvbnRlbnQpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlQXJjaGl2ZURvbVBhZ2UoY3VycmVudFNwYW4udGV4dENvbnRlbnQpO1xuICAgICAgaWYgKHBhcnNlZCAmJiB0eXBlb2YgcGFyc2VkLmN1cnJlbnQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBwYXJzZWQuY3VycmVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBDaGVjayBpbnB1dCBmaWVsZHMgdXNlZCBmb3IgcGFnZSBqdW1waW5nXG4gICAgY29uc3QgcGFnZUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignaW5wdXQuQlJwYWdlaW5wdXQsIGlucHV0LnBhZ2UtbnVtYmVyLWlucHV0LCBpbnB1dFtuYW1lPVwicGFnZVwiXScpO1xuICAgIGlmIChwYWdlSW5wdXQgJiYgcGFnZUlucHV0LnZhbHVlKSB7XG4gICAgICBjb25zdCB2YWwgPSBwYXJzZUludChwYWdlSW5wdXQudmFsdWUsIDEwKTtcbiAgICAgIGlmICghaXNOYU4odmFsKSkgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICAvLyAzLiBBY3RpdmUgcGFnZSBjb250YWluZXIgaW4gRE9NXG4gICAgY29uc3QgYWN0aXZlQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkJScGFnZWNvbnRhaW5lci5CUnBhZ2UtdmlzaWJsZSwgLkJScGFnZS5hY3RpdmUsIC5CUnBhZ2Vjb250YWluZXJbZGF0YS1pbmRleF0nKTtcbiAgICBpZiAoYWN0aXZlQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBpZHhBdHRyID0gYWN0aXZlQ29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1pbmRleCcpIHx8IGFjdGl2ZUNvbnRhaW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGFnZScpO1xuICAgICAgaWYgKGlkeEF0dHIpIHtcbiAgICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoaWR4QXR0ciwgMTApO1xuICAgICAgICBpZiAoIWlzTmFOKHZhbCkpIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhc3luYyBlbmZvcmNlU2luZ2xlUGFnZU1vZGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gRW5mb3JjaW5nIHNpbmdsZS1wYWdlIG1vZGUgb24gQXJjaGl2ZS5vcmcuLi4nKTtcbiAgICB0aGlzLnBvc3RUb0JyaWRnZSgnU1dJVENIX01PREVfMScpO1xuXG4gICAgLy8gQWNjb21tb2RhdGUgbXVsdGlwbGUgYnV0dG9uIHNlbGVjdG9ycyBhY3Jvc3MgQm9va1JlYWRlciB2ZXJzaW9uc1xuICAgIGNvbnN0IG9uZVBhZ2VCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgICdidXR0b25bdGl0bGUqPVwiT25lLXBhZ2VcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiT25lLXBhZ2VcIiBpXSwgYnV0dG9uLm9uZS1wYWdlLCAuQlJwYWdldmlldzEsIGJ1dHRvbltkYXRhLW1vZGU9XCIxXCJdLCBbYXJpYS1sYWJlbCo9XCIxLXBhZ2VcIiBpXSwgLkJSaWNvbl9vbmVwYWdlLCAudmlldy1tb2RlLTF1cCdcbiAgICApO1xuICAgIGlmIChvbmVQYWdlQnRuICYmICFvbmVQYWdlQnRuLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykgJiYgb25lUGFnZUJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtcHJlc3NlZCcpICE9PSAndHJ1ZScpIHtcbiAgICAgIHRyeSB7IG9uZVBhZ2VCdG4uY2xpY2soKTsgfSBjYXRjaCAoZSkge31cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBuYXZpZ2F0ZVRvUGFnZShwYWdlTnVtOiBudW1iZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBOYXZpZ2F0aW5nIHRvIEFyY2hpdmUgbGVhZiAke3BhZ2VOdW19Li4uYCk7XG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0pVTVBfUEFHRScsIHsgbGVhZkluZGV4OiBwYWdlTnVtIH0pO1xuXG4gICAgaWYgKHBhZ2VOdW0gPT09IDApIHtcbiAgICAgIGNvbnN0IGZpcnN0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAgICdidXR0b25bdGl0bGUqPVwiRmlyc3QgcGFnZVwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJGaXJzdCBwYWdlXCIgaV0sIGJ1dHRvbi5uYXZmaXJzdCwgLmJvb2stZmxpcC1maXJzdCwgLkJSbmF2Zmlyc3QsIFthcmlhLWxhYmVsPVwiRmlyc3QgcGFnZVwiIGldJ1xuICAgICAgKTtcbiAgICAgIGlmIChmaXJzdEJ0bikge1xuICAgICAgICB0cnkgeyBmaXJzdEJ0bi5jbGljaygpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuXG4gICAgICBjb25zdCBob21lRXZlbnQgPSB7IGJ1YmJsZXM6IHRydWUsIGNhbmNlbGFibGU6IHRydWUsIGtleTogJ0hvbWUnLCBjb2RlOiAnSG9tZScsIGtleUNvZGU6IDM2LCB3aGljaDogMzYgfTtcbiAgICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGhvbWVFdmVudCkpO1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBob21lRXZlbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICB0cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bTogbnVtYmVyKTogdm9pZCB7XG4gICAgLy8gMS4gRGlyZWN0IEJvb2tSZWFkZXIgQVBJIGNhbGwgdmlhIGJyaWRnZSAobW9zdCByZWxpYWJsZSBpbiBNQUlOIHdvcmxkLCBzdXBwb3J0cyBici5uZXh0KCkgJiB2ZXJzaW9ucylcbiAgICB0aGlzLnBvc3RUb0JyaWRnZSgnRkxJUF9ORVhUJywgeyB0YXJnZXRQYWdlOiB0YXJnZXRQYWdlTnVtIH0pO1xuXG4gICAgLy8gMi4gRE9NIGJ1dHRvbiBjbGljayBmYWxsYmFjayBhY3Jvc3MgbXVsdGlwbGUgQm9va1JlYWRlciB2ZXJzaW9uc1xuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgICdidXR0b25bdGl0bGUqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvbi5uYXZuZXh0LCAuYm9vay1mbGlwLXJpZ2h0LCAuQlJuYXZuZXh0LCBbYXJpYS1sYWJlbD1cIk5leHQgcGFnZVwiIGldLCBbZGF0YS1hY3Rpb249XCJuZXh0LXBhZ2VcIiBpXSwgLkJSaWNvbl9mbGlwX3JpZ2h0LCBidXR0b24ucGFnZS1uZXh0J1xuICAgICk7XG4gICAgaWYgKG5leHRCdG4pIHtcbiAgICAgIHRyeSB7IG5leHRCdG4uY2xpY2soKTsgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICAvLyAzLiBLZXlib2FyZCBBcnJvd1JpZ2h0ICYgUGFnZURvd24gZXZlbnRzIGFjcm9zcyBCb29rUmVhZGVyIHZlcnNpb25zXG4gICAgZm9yIChjb25zdCBrZXkgb2YgWydBcnJvd1JpZ2h0JywgJ1BhZ2VEb3duJ10pIHtcbiAgICAgIGNvbnN0IGtleUV2ZW50ID0ge1xuICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICBrZXksXG4gICAgICAgIGNvZGU6IGtleSxcbiAgICAgICAga2V5Q29kZToga2V5ID09PSAnQXJyb3dSaWdodCcgPyAzOSA6IDM0LFxuICAgICAgICB3aGljaDoga2V5ID09PSAnQXJyb3dSaWdodCcgPyAzOSA6IDM0LFxuICAgICAgfTtcbiAgICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGtleUV2ZW50KSk7XG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGtleUV2ZW50KSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QWN0aXZlUGFnZUltYWdlKG1pbldpZHRoID0gMzAwLCB0YXJnZXRQYWdlTnVtPzogbnVtYmVyKTogSFRNTEltYWdlRWxlbWVudCB8IG51bGwge1xuICAgIC8vIDEuIFF1ZXJ5IGFsbCBjYW5kaWRhdGUgcGFnZSBpbWFnZXMgYWNyb3NzIGFsbCBCb29rUmVhZGVyIHZlcnNpb25zXG4gICAgY29uc3QgaW1hZ2VTZWxlY3RvcnMgPSBbXG4gICAgICAnLkJScGFnZWNvbnRhaW5lciBpbWcnLFxuICAgICAgJ2ltZy5CUnBhZ2VpbWFnZScsXG4gICAgICAnLkJScGFnZSBpbWcnLFxuICAgICAgJy5CUnBhZ2V2aWV3IGltZycsXG4gICAgICAnaW1nW2NsYXNzKj1cIkJScGFnZVwiXScsXG4gICAgICAnaW1nW3NyYyo9XCJCb29rUmVhZGVySW1hZ2VzLnBocFwiXScsXG4gICAgICAnaW1nW3NyYyo9XCIvQm9va1JlYWRlci9cIl0nLFxuICAgICAgJ2ltZ1tzcmMqPVwic2NhbGU9XCJdJyxcbiAgICAgICdpbWdbc3JjKj1cInppcD1cIl0nLFxuICAgICAgJy5ib29rLXBhZ2UgaW1nJyxcbiAgICBdO1xuICAgIGNvbnN0IGltYWdlcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PihpbWFnZVNlbGVjdG9ycy5qb2luKCcsICcpKSk7XG4gICAgY29uc3QgdmFsaWQgPSBpbWFnZXMuZmlsdGVyKGltZyA9PiBpbWcuY29tcGxldGUgJiYgaW1nLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiBpbWcuc3JjKTtcblxuICAgIGlmICh2YWxpZC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gICAgLy8gMi4gSWYgdGFyZ2V0UGFnZU51bSBpcyBzcGVjaWZpZWQsIGZpbmQgdGhlIGltYWdlIHZlcmlmaWVkIGZvciB0aGlzIHNwZWNpZmljIHBhZ2VcbiAgICBpZiAodHlwZW9mIHRhcmdldFBhZ2VOdW0gPT09ICdudW1iZXInKSB7XG4gICAgICAvLyAyYS4gRGlyZWN0IFVSTCBmaWxlbmFtZSB2ZXJpZmljYXRpb246IGUuZy4gZmlsZT0uLi5fMDAzMC50aWYgPT4gMzAgPT09IHRhcmdldFBhZ2VOdW0hXG4gICAgICBmb3IgKGNvbnN0IGltZyBvZiB2YWxpZCkge1xuICAgICAgICBjb25zdCBwYWdlRnJvbVVybCA9IHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZShpbWcuc3JjKTtcbiAgICAgICAgaWYgKHBhZ2VGcm9tVXJsICE9PSBudWxsICYmIHBhZ2VGcm9tVXJsID09PSB0YXJnZXRQYWdlTnVtKSB7XG4gICAgICAgICAgaW1nLmRhdGFzZXQuc2VxID0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgIHJldHVybiBpbWc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gMmIuIERpcmVjdCBUYXJnZXQgQ29udGFpbmVyIExvb2t1cDogLkJScGFnZWNvbnRhaW5lcltkYXRhLWluZGV4PVwiMzBcIl0gaW1nXG4gICAgICBjb25zdCB0YXJnZXRTZWxlY3RvcnMgPSBbXG4gICAgICAgIGAuQlJwYWdlY29udGFpbmVyW2RhdGEtaW5kZXg9XCIke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGAucGFnZWRpdiR7dGFyZ2V0UGFnZU51bX0gaW1nYCxcbiAgICAgICAgYFtkYXRhLWluZGV4PVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWdgLFxuICAgICAgICBgLkJScGFnZVtkYXRhLXBhZ2U9XCIke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGAuQlJwYWdlW2RhdGEtbGVhZj1cIiR7dGFyZ2V0UGFnZU51bX1cIl0gaW1nYCxcbiAgICAgICAgYCNwYWdlZGl2JHt0YXJnZXRQYWdlTnVtfSBpbWdgLFxuICAgICAgICBgI3BhZ2Uke3RhcmdldFBhZ2VOdW19IGltZ2AsXG4gICAgICBdO1xuICAgICAgZm9yIChjb25zdCBzZWwgb2YgdGFyZ2V0U2VsZWN0b3JzKSB7XG4gICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW1hZ2VFbGVtZW50PihzZWwpO1xuICAgICAgICBpZiAoZWwgJiYgZWwuY29tcGxldGUgJiYgZWwubmF0dXJhbFdpZHRoID49IG1pbldpZHRoICYmIGVsLnNyYykge1xuICAgICAgICAgIGNvbnN0IHBhZ2VGcm9tVXJsID0gcGFyc2VBcmNoaXZlSW1hZ2VVcmxQYWdlKGVsLnNyYyk7XG4gICAgICAgICAgaWYgKHBhZ2VGcm9tVXJsID09PSBudWxsIHx8IHBhZ2VGcm9tVXJsID09PSB0YXJnZXRQYWdlTnVtKSB7XG4gICAgICAgICAgICBlbC5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gMmMuIEluc3BlY3Qgdmlld3BvcnQgaW1hZ2VzOlxuICAgICAgLy8gQ1JJVElDQUw6IFJlamVjdCBhbnkgaW1hZ2Ugd2hvc2UgVVJMIGV4cGxpY2l0bHkgYmVsb25ncyB0byBhIGRpZmZlcmVudCBwYWdlIVxuICAgICAgbGV0IGJlc3RDYW5kaWRhdGU6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgIGxldCBtYXhBcmVhID0gMDtcbiAgICAgIGNvbnN0IHdpblcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5pbm5lcldpZHRoIDogMTkyMDtcbiAgICAgIGNvbnN0IHdpbkggPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5pbm5lckhlaWdodCA6IDEwODA7XG5cbiAgICAgIGZvciAoY29uc3QgaW1nIG9mIHZhbGlkKSB7XG4gICAgICAgIGNvbnN0IHBhZ2VGcm9tVXJsID0gcGFyc2VBcmNoaXZlSW1hZ2VVcmxQYWdlKGltZy5zcmMpO1xuICAgICAgICBpZiAocGFnZUZyb21VcmwgIT09IG51bGwgJiYgcGFnZUZyb21VcmwgIT09IHRhcmdldFBhZ2VOdW0pIHtcbiAgICAgICAgICBjb250aW51ZTsgLy8gU2tpcCBpbWFnZSBmcm9tIGEgZGlmZmVyZW50IHBhZ2UgKGUuZy4gcHJldmlvdXMgcGFnZSBzdGlsbCB2aXNpYmxlKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgdmlzaWJsZVdpZHRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5yaWdodCwgd2luVykgLSBNYXRoLm1heChyZWN0LmxlZnQsIDApKTtcbiAgICAgICAgY29uc3QgdmlzaWJsZUhlaWdodCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QuYm90dG9tLCB3aW5IKSAtIE1hdGgubWF4KHJlY3QudG9wLCAwKSk7XG4gICAgICAgIGNvbnN0IGFyZWEgPSB2aXNpYmxlV2lkdGggKiB2aXNpYmxlSGVpZ2h0O1xuXG4gICAgICAgIGlmIChhcmVhID4gbWF4QXJlYSAmJiB2aXNpYmxlV2lkdGggPiA1MCAmJiB2aXNpYmxlSGVpZ2h0ID4gNTApIHtcbiAgICAgICAgICBtYXhBcmVhID0gYXJlYTtcbiAgICAgICAgICBiZXN0Q2FuZGlkYXRlID0gaW1nO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChiZXN0Q2FuZGlkYXRlKSB7XG4gICAgICAgIGJlc3RDYW5kaWRhdGUuZGF0YXNldC5zZXEgPSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgIHJldHVybiBiZXN0Q2FuZGlkYXRlO1xuICAgICAgfVxuXG4gICAgICAvLyBGYWxsYmFjazogSWYgbm8gaW1hZ2Ugc3BlY2lmaWNhbGx5IGhhcyBhIGNvbnRyYWRpY3RvcnkgVVJMLCByZXR1cm4gbmV3ZXN0IERPTSBpbWFnZVxuICAgICAgY29uc3QgZmFsbGJhY2sgPSB2YWxpZFt2YWxpZC5sZW5ndGggLSAxXTtcbiAgICAgIGlmIChmYWxsYmFjaykge1xuICAgICAgICBjb25zdCBwYWdlRnJvbVVybCA9IHBhcnNlQXJjaGl2ZUltYWdlVXJsUGFnZShmYWxsYmFjay5zcmMpO1xuICAgICAgICBpZiAocGFnZUZyb21VcmwgPT09IG51bGwgfHwgcGFnZUZyb21VcmwgPT09IHRhcmdldFBhZ2VOdW0pIHtcbiAgICAgICAgICBmYWxsYmFjay5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICByZXR1cm4gZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGFyZ2V0IHBhZ2UgaW1hZ2Ugbm90IHlldCBsb2FkZWQgaW4gRE9NXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyAzLiBGYWxsYmFjayB3aGVuIG5vIHRhcmdldFBhZ2VOdW0gaXMgc3BlY2lmaWVkOiBQaWNrIHRoZSBsYXJnZXN0IHZpc2libGUgaW1hZ2UgaW4gdmlld3BvcnRcbiAgICBsZXQgYmVzdEltZzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgIGxldCBtYXhWaXNpYmxlQXJlYSA9IDA7XG4gICAgY29uc3Qgd2luVyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmlubmVyV2lkdGggOiAxOTIwO1xuICAgIGNvbnN0IHdpbkggPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5pbm5lckhlaWdodCA6IDEwODA7XG5cbiAgICBmb3IgKGNvbnN0IGltZyBvZiB2YWxpZCkge1xuICAgICAgY29uc3QgcmVjdCA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHZpc2libGVXaWR0aCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QucmlnaHQsIHdpblcpIC0gTWF0aC5tYXgocmVjdC5sZWZ0LCAwKSk7XG4gICAgICBjb25zdCB2aXNpYmxlSGVpZ2h0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5ib3R0b20sIHdpbkgpIC0gTWF0aC5tYXgocmVjdC50b3AsIDApKTtcbiAgICAgIGNvbnN0IGFyZWEgPSB2aXNpYmxlV2lkdGggKiB2aXNpYmxlSGVpZ2h0O1xuXG4gICAgICBpZiAoYXJlYSA+IG1heFZpc2libGVBcmVhICYmIHZpc2libGVXaWR0aCA+IDUwICYmIHZpc2libGVIZWlnaHQgPiA1MCkge1xuICAgICAgICBtYXhWaXNpYmxlQXJlYSA9IGFyZWE7XG4gICAgICAgIGJlc3RJbWcgPSBpbWc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGJlc3RJbWcgfHwgdmFsaWRbdmFsaWQubGVuZ3RoIC0gMV0gfHwgbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RQYWdlVGV4dChwYWdlTnVtOiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghdGhpcy5ib29rSW5mbyB8fCAhdGhpcy5ib29rSW5mby5zZXJ2ZXIgfHwgIXRoaXMuYm9va0luZm8uYm9va1BhdGgpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBsZWFmSW5kZXggPSBwYWdlTnVtO1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovLyR7dGhpcy5ib29rSW5mby5zZXJ2ZXJ9L0Jvb2tSZWFkZXIvQm9va1JlYWRlckdldFRleHRXcmFwcGVyLnBocD9wYXRoPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuYm9va0luZm8uYm9va1BhdGgpfV9kanZ1LnhtbCZtb2RlPWRqdnVfeG1sJnBhZ2U9JHtsZWFmSW5kZXh9YDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnLFxuICAgICAgfSk7XG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSByZXR1cm4gJyc7XG4gICAgICBjb25zdCB4bWwgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICByZXR1cm4gcGFyc2VEanZ1WG1sVG9UZXh0KHhtbCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gQ291bGQgbm90IGZldGNoIHRleHQgZm9yIGxlYWYgJHtsZWFmSW5kZXh9OmAsIGVycik7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9XG5cbiAgaXNBdEVuZE9mQm9vayhjdXJyZW50UGFnZTogbnVtYmVyLCB0b3RhbFBhZ2VzOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b24ubmF2bmV4dCwgLmJvb2stZmxpcC1yaWdodCwgLkJSbmF2bmV4dCwgW2FyaWEtbGFiZWw9XCJOZXh0IHBhZ2VcIiBpXSwgW2RhdGEtYWN0aW9uPVwibmV4dC1wYWdlXCIgaV0nXG4gICAgKTtcbiAgICBjb25zdCBpc05leHREaXNhYmxlZCA9IG5leHRCdG4gJiYgKFxuICAgICAgbmV4dEJ0bi5kaXNhYmxlZCB8fFxuICAgICAgbmV4dEJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtZGlzYWJsZWQnKSA9PT0gJ3RydWUnIHx8XG4gICAgICBuZXh0QnRuLmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZWQnKVxuICAgICk7XG4gICAgY29uc3QgZG9tTGVhZiA9IHRoaXMuZ2V0Q3VycmVudFBhZ2UoKTtcbiAgICByZXR1cm4gQm9vbGVhbihpc05leHREaXNhYmxlZCB8fCAodG90YWxQYWdlcyA+IDAgJiYgZG9tTGVhZiAhPT0gbnVsbCAmJiBkb21MZWFmID49IHRvdGFsUGFnZXMgJiYgY3VycmVudFBhZ2UgPj0gdG90YWxQYWdlcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBwb3N0VG9CcmlkZ2UoYWN0aW9uOiBzdHJpbmcsIGV4dHJhRGF0YTogYW55ID0ge30pIHtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoeyBkaXJlY3Rpb246ICdUT19CUklER0UnLCBhY3Rpb24sIC4uLmV4dHJhRGF0YSB9LCAnKicpO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0UGFnZUluZm9Gcm9tRG9tKCk6IHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0gfCBudWxsIHtcbiAgICBjb25zdCBwYWdlRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0nKTtcbiAgICBpZiAocGFnZUVsICYmIHBhZ2VFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VBcmNoaXZlRG9tUGFnZShwYWdlRWwudGV4dENvbnRlbnQpO1xuICAgICAgaWYgKHBhcnNlZCkgcmV0dXJuIHBhcnNlZDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCb29rSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0IH0gZnJvbSAnLi4vdXRpbHMvbWFya2Rvd24tYnVpbGRlcic7XG5cbmV4cG9ydCBjbGFzcyBIYXRoaVRydXN0UHJvdmlkZXIgaW1wbGVtZW50cyBCb29rUHJvdmlkZXIge1xuICByZWFkb25seSBzaXRlSWQgPSAnaGF0aGl0cnVzdCcgYXMgY29uc3Q7XG4gIHJlYWRvbmx5IHNpdGVOYW1lID0gJ0hhdGhpVHJ1c3QnO1xuICByZWFkb25seSBkZWZhdWx0U3RhcnRQYWdlID0gMTsgLy8gSGF0aGlUcnVzdCBzZXF1ZW5jZXMgYXJlIDEtYmFzZWRcblxuICBwcml2YXRlIGJvb2tJbmZvOiBCb29rSW5mbyB8IG51bGwgPSBudWxsO1xuXG4gIC8vIFRyYWNraW5nIGxvYWRlZCBzZXF1ZW5jZXMgZnJvbSBNQUlOIHdvcmxkIGJyaWRnZVxuICBwcml2YXRlIGFubm91bmNlZFNlcXVlbmNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBwcml2YXRlIHNlcVRvQmxvYlVybCA9IG5ldyBNYXA8bnVtYmVyLCBzdHJpbmc+KCk7XG4gIHByaXZhdGUgYmxvYlVybFRvU2VxID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBzZXFUb0h0bWwgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIExpc3RlbiBmb3IgYnJpZGdlIG1lc3NhZ2VzICh3b3JsZDogTUFJTilcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ0ZST01fQlJJREdFJykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhO1xuICAgICAgICBpZiAobXNnLmV2ZW50ID09PSAnUEFHRV9MT0FEX0FOTk9VTkNFRCcpIHtcbiAgICAgICAgICBpZiAobXNnLmlzTG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmFubm91bmNlZFNlcXVlbmNlcy5hZGQobXNnLnNlcSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBIYXRoaVRydXN0IGFubm91bmNlZCBzZXF1ZW5jZSAke21zZy5zZXF9IGxvYWRlZGApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0lNQUdFX1JFQURZJykge1xuICAgICAgICAgIHRoaXMuc2VxVG9CbG9iVXJsLnNldChtc2cuc2VxLCBtc2cuYmxvYlVybCk7XG4gICAgICAgICAgdGhpcy5ibG9iVXJsVG9TZXEuc2V0KG1zZy5ibG9iVXJsLCBtc2cuc2VxKTtcbiAgICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgICAgdGhpcy5zZXFUb0h0bWwuc2V0KG1zZy5zZXEsIG1zZy5odG1sKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgb25QYWdlTG9hZEFubm91bmNlZChzZXE6IG51bWJlciwgaXNWaXNpYmxlOiBib29sZWFuLCBpc0xvYWRlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChpc0xvYWRlZCkge1xuICAgICAgdGhpcy5hbm5vdW5jZWRTZXF1ZW5jZXMuYWRkKHNlcSk7XG4gICAgfVxuICB9XG5cbiAgb25QYWdlSW1hZ2VSZWFkeShzZXE6IG51bWJlciwgYmxvYlVybDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zZXFUb0Jsb2JVcmwuc2V0KHNlcSwgYmxvYlVybCk7XG4gICAgdGhpcy5ibG9iVXJsVG9TZXEuc2V0KGJsb2JVcmwsIHNlcSk7XG4gIH1cblxuICBvblBhZ2VUZXh0UmVhZHkoc2VxOiBudW1iZXIsIGh0bWw6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc2VxVG9IdG1sLnNldChzZXEsIGh0bWwpO1xuICB9XG5cbiAgZ2V0QmxvYlVybEZvclNlcShzZXE6IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuc2VxVG9CbG9iVXJsLmdldChzZXEpO1xuICB9XG5cbiAgZ2V0Q2FjaGVkSHRtbEZvclNlcShzZXE6IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuc2VxVG9IdG1sLmdldChzZXEpO1xuICB9XG5cbiAgaXNQYWdlQW5ub3VuY2VkKHNlcTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYW5ub3VuY2VkU2VxdWVuY2VzLmhhcyhzZXEpO1xuICB9XG5cbiAgaXNNYXRjaCgpOiBib29sZWFuIHtcbiAgICBjb25zdCBpc0hvc3QgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09ICdiYWJlbC5oYXRoaXRydXN0Lm9yZycgfHxcbiAgICAgICAgICAgICAgICAgICAod2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdoYXRoaXRydXN0Lm9yZycpICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zdGFydHNXaXRoKCcvY2dpL3B0JykpO1xuICAgIHJldHVybiBpc0hvc3Q7XG4gIH1cblxuICBhc3luYyBkZXRlY3RCb29rSW5mbygpOiBQcm9taXNlPEJvb2tJbmZvIHwgbnVsbD4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgY29uc3QgYm9va0lkID0gcGFyYW1zLmdldCgnaWQnKSB8fCAnaGF0aGl0cnVzdF9ib29rJztcblxuICAgIC8vIDEuIERldGVjdCBCb29rIFRpdGxlXG4gICAgbGV0IGJvb2tUaXRsZSA9ICcnO1xuICAgIGNvbnN0IG1ldGFUaXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTE1ldGFFbGVtZW50PignbWV0YVtuYW1lPVwiREMudGl0bGVcIl0sIG1ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScpO1xuICAgIGlmIChtZXRhVGl0bGUgJiYgbWV0YVRpdGxlLmNvbnRlbnQpIHtcbiAgICAgIGJvb2tUaXRsZSA9IG1ldGFUaXRsZS5jb250ZW50LnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKCFib29rVGl0bGUpIHtcbiAgICAgIGNvbnN0IGgxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDEudGl0bGUsIGgxLml0ZW0tdGl0bGUsIGgxJyk7XG4gICAgICBpZiAoaDEgJiYgaDEudGV4dENvbnRlbnQpIHtcbiAgICAgICAgYm9va1RpdGxlID0gaDEudGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWJvb2tUaXRsZSkge1xuICAgICAgYm9va1RpdGxlID0gZG9jdW1lbnQudGl0bGUgPyBkb2N1bWVudC50aXRsZS5yZXBsYWNlKC9bLXxdXFxzKkhhdGhpVHJ1c3QuKi9pLCAnJykudHJpbSgpIDogJ0hhdGhpVHJ1c3QgQm9vayc7XG4gICAgfVxuXG4gICAgLy8gMi4gRGV0ZWN0IFRvdGFsIFBhZ2VzXG4gICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMuZ2V0VG90YWxQYWdlc0Zyb21Eb20oKTtcblxuICAgIC8vIDMuIERldGVjdCBDdXJyZW50IFNlcXVlbmNlXG4gICAgY29uc3QgY3VycmVudFNlcSA9IHRoaXMuZ2V0Q3VycmVudFBhZ2UoKSB8fCAxO1xuXG4gICAgLy8gQ2hlY2sgYXV0aG9yIGFuZCB5ZWFyIGlmIHByZXNlbnQgaW4gbWV0YWRhdGFcbiAgICBjb25zdCBhdXRob3JNZXRhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy5jcmVhdG9yXCJdJyk7XG4gICAgY29uc3QgYXV0aG9yID0gYXV0aG9yTWV0YT8uY29udGVudDtcblxuICAgIGNvbnN0IGRhdGVNZXRhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy5kYXRlXCJdJyk7XG4gICAgY29uc3QgeWVhciA9IGRhdGVNZXRhPy5jb250ZW50O1xuXG4gICAgdGhpcy5ib29rSW5mbyA9IHtcbiAgICAgIGJvb2tJZCxcbiAgICAgIGJvb2tUaXRsZTogYm9va1RpdGxlIHx8ICdIYXRoaVRydXN0IEJvb2snLFxuICAgICAgdG90YWxQYWdlczogdG90YWxQYWdlcyB8fCA1MDAsXG4gICAgICBjdXJyZW50TGVhZjogY3VycmVudFNlcSxcbiAgICAgIGN1cnJlbnRNb2RlOiAxLFxuICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgIGF1dGhvcixcbiAgICAgIHllYXIsXG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEhhdGhpVHJ1c3Qgdm9sdW1lIGRldGVjdGVkOicsIHRoaXMuYm9va0luZm8uYm9va1RpdGxlLCBgKCR7dGhpcy5ib29rSW5mby50b3RhbFBhZ2VzfSBwYWdlcylgKTtcbiAgICByZXR1cm4gdGhpcy5ib29rSW5mbztcbiAgfVxuXG4gIGdldEN1cnJlbnRQYWdlKCk6IG51bWJlciB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDEuIENoZWNrIHRvb2xiYXIgaW5wdXRcbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuICAgIGlmIChzZXFJbnB1dCAmJiBzZXFJbnB1dC52YWx1ZSkge1xuICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoc2VxSW5wdXQudmFsdWUsIDEwKTtcbiAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIC8vIDIuIENoZWNrIFVSTCBzZWFyY2ggcGFyYW1cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpIHtcbiAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICBjb25zdCBzZXEgPSBwYXJhbXMuZ2V0KCdzZXEnKTtcbiAgICAgIGlmIChzZXEpIHtcbiAgICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQoc2VxLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIENoZWNrIGRhdGEtc2VxIG9uIGFjdGl2ZSBmaWd1cmUgb3Igc3ByZWFkXG4gICAgY29uc3QgYWN0aXZlRmlnID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2LnNwcmVhZCBmaWd1cmVbZGF0YS1zZXFdLCBmaWd1cmVbZGF0YS1zZXFdJyk7XG4gICAgaWYgKGFjdGl2ZUZpZykge1xuICAgICAgY29uc3Qgc2VxQXR0ciA9IGFjdGl2ZUZpZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJyk7XG4gICAgICBpZiAoc2VxQXR0cikge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChzZXFBdHRyLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgbmF2aWdhdGVUb1BhZ2UocGFnZU51bTogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBIYXRoaVRydXN0IHNlcXVlbmNlICR7cGFnZU51bX0uLi5gKTtcbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuXG4gICAgaWYgKHNlcUlucHV0KSB7XG4gICAgICBzZXFJbnB1dC5mb2N1cygpO1xuICAgICAgc2VxSW5wdXQudmFsdWUgPSBTdHJpbmcocGFnZU51bSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgc2VxSW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NoYW5nZScsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG5cbiAgICAgIC8vIERpc3BhdGNoIEVudGVyIGtleWRvd24gZXZlbnRcbiAgICAgIGNvbnN0IGVudGVyRXZlbnQgPSBuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIHtcbiAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAga2V5OiAnRW50ZXInLFxuICAgICAgICBjb2RlOiAnRW50ZXInLFxuICAgICAgICBrZXlDb2RlOiAxMyxcbiAgICAgICAgd2hpY2g6IDEzLFxuICAgICAgfSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KGVudGVyRXZlbnQpO1xuXG4gICAgICAvLyBTdWJtaXQgcGFyZW50IGZvcm0gaWYgcHJlc2VudFxuICAgICAgY29uc3QgZm9ybSA9IHNlcUlucHV0LmNsb3Nlc3QoJ2Zvcm0nKTtcbiAgICAgIGlmIChmb3JtKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmb3JtLnJlcXVlc3RTdWJtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGZvcm0ucmVxdWVzdFN1Ym1pdCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdzdWJtaXQnLCB7IGJ1YmJsZXM6IHRydWUsIGNhbmNlbGFibGU6IHRydWUgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtOiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyAxLiBQcmltYXJ5OiBDbGljayBOZXh0IFBhZ2UgYnV0dG9uXG4gICAgLy8gPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLW91dGxpbmUtZGFya1wiIGFyaWEtbGFiZWw9XCJOZXh0IFBhZ2VcIj48aSBjbGFzcz1cImZhLXNvbGlkIGZhLWFuZ2xlLXJpZ2h0XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjwvYnV0dG9uPlxuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50IHwgSFRNTEFuY2hvckVsZW1lbnQ+KFxuICAgICAgJ2J1dHRvblthcmlhLWxhYmVsPVwiTmV4dCBQYWdlXCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIk5leHRcIiBpXSwgYnV0dG9uW3RpdGxlKj1cIk5leHRcIiBpXSwgW2FjY2Vzc2tleT1cIm5cIl0sIGJ1dHRvbi5uZXh0LCBhLmFjdGlvbi1uZXh0LXBhZ2UnXG4gICAgKTtcbiAgICBpZiAobmV4dEJ0bikge1xuICAgICAgY29uc3QgZGlzYWJsZWQgPSAobmV4dEJ0biBhcyBhbnkpLmRpc2FibGVkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLWRpc2FibGVkJykgPT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0QnRuLmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZWQnKTtcbiAgICAgIGlmICghZGlzYWJsZWQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBDbGlja2luZyBIYXRoaVRydXN0IE5leHQgUGFnZSBidXR0b24uLi4nKTtcbiAgICAgICAgICBuZXh0QnRuLmNsaWNrKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIEtleWJvYXJkIEFycm93UmlnaHQgZXZlbnQgKHN0YW5kYXJkIHJlYWRlciBob3RrZXkpXG4gICAgY29uc3Qga2V5RXZlbnQgPSB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgIGtleTogJ0Fycm93UmlnaHQnLFxuICAgICAgY29kZTogJ0Fycm93UmlnaHQnLFxuICAgICAga2V5Q29kZTogMzksXG4gICAgICB3aGljaDogMzksXG4gICAgfTtcbiAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywga2V5RXZlbnQpKTtcblxuICAgIC8vIDMuIEZhbGxiYWNrOiBvbmx5IGlmIE5leHQgYnV0dG9uIGlzIG5vdCBhdmFpbGFibGUsIHVzZSBzZXF1ZW5jZSBpbnB1dFxuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG4gICAgaWYgKHNlcUlucHV0KSB7XG4gICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBGYWxsYmFjayB0byBzZXF1ZW5jZSBpbnB1dCAke3RhcmdldFBhZ2VOdW19Li4uYCk7XG4gICAgICB0aGlzLm5hdmlnYXRlVG9QYWdlKHRhcmdldFBhZ2VOdW0pO1xuICAgIH1cbiAgfVxuXG4gIGdldEFjdGl2ZVBhZ2VJbWFnZShtaW5XaWR0aCA9IDMwMCwgdGFyZ2V0U2VxPzogbnVtYmVyKTogSFRNTEltYWdlRWxlbWVudCB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDEuIElmIHRhcmdldFNlcSBpcyBzcGVjaWZpZWQgKGR1cmluZyBzZXF1ZW50aWFsIGNhcHR1cmUpXG4gICAgaWYgKHR5cGVvZiB0YXJnZXRTZXEgPT09ICdudW1iZXInKSB7XG4gICAgICBjb25zdCBjdXJyZW50U2VxID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgLy8gSWYgdGhlIHJlYWRlciB0b29sYmFyIGhhcyBub3QgcmVhY2hlZCB0YXJnZXRTZXEgeWV0LCB3YWl0IVxuICAgICAgaWYgKGN1cnJlbnRTZXEgIT09IG51bGwgJiYgY3VycmVudFNlcSA8IHRhcmdldFNlcSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYW4gaW1hZ2UgZXhwbGljaXRseSB0YWdnZWQgd2l0aCB0YXJnZXRTZXFcbiAgICAgIGNvbnN0IHRhZ2dlZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEltYWdlRWxlbWVudD4oYGltZ1tkYXRhLXNlcT1cIiR7dGFyZ2V0U2VxfVwiXWApO1xuICAgICAgaWYgKHRhZ2dlZCAmJiB0YWdnZWQuY29tcGxldGUgJiYgdGFnZ2VkLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiB0YWdnZWQuc3JjICYmICF0YWdnZWQuc3JjLmluY2x1ZGVzKCdiYXNlNjQsaVZCT1J3JykpIHtcbiAgICAgICAgcmV0dXJuIHRhZ2dlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyeSBjYW5kaWRhdGUgcGFnZSBpbWFnZXMgaW5zaWRlIG1haW4jbWFpblxuICAgIGNvbnN0IGltYWdlcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MSW1hZ2VFbGVtZW50PihcbiAgICAgICdtYWluI21haW4gZGV0YWlscyBmaWd1cmUgZGl2LmltYWdlIGltZywgbWFpbiNtYWluIGRldGFpbHMgZmlndXJlIGltZywgbWFpbiNtYWluIGRpdi5zcHJlYWQgZmlndXJlIGRpdi5pbWFnZSBpbWcsIG1haW4jbWFpbiBkaXYuc3ByZWFkIGZpZ3VyZSBpbWcsIG1haW4jbWFpbiBpbWdbc3JjXj1cImJsb2I6XCJdLCBtYWluI21haW4gaW1nJ1xuICAgICkpO1xuXG4gICAgY29uc3QgdmFsaWQgPSBpbWFnZXMuZmlsdGVyKGltZyA9PlxuICAgICAgaW1nLmNvbXBsZXRlICYmXG4gICAgICBpbWcubmF0dXJhbFdpZHRoID49IG1pbldpZHRoICYmXG4gICAgICBpbWcuc3JjICYmXG4gICAgICAhaW1nLnNyYy5pbmNsdWRlcygnYmFzZTY0LGlWQk9SdycpIC8vIElnbm9yZSB0cmFuc3BhcmVudCAxeDEgcGxhY2Vob2xkZXJcbiAgICApO1xuXG4gICAgaWYgKHZhbGlkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICAvLyBQaWNrIGltYWdlIHZpc2libGUgd2l0aGluIGJyb3dzZXIgdmlld3BvcnRcbiAgICBjb25zdCB2aXNpYmxlID0gdmFsaWQuZmluZChpbWcgPT4ge1xuICAgICAgLy8gSWYgaW1hZ2UgaXMgZXhwbGljaXRseSB0YWdnZWQgd2l0aCBhIGRpZmZlcmVudCBzZXF1ZW5jZSwgZG8gbm90IHBpY2sgaXQhXG4gICAgICBpZiAodHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicgJiYgaW1nLmRhdGFzZXQuc2VxICYmIHBhcnNlSW50KGltZy5kYXRhc2V0LnNlcSwgMTApICE9PSB0YXJnZXRTZXEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZWN0ID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHJlY3Qud2lkdGggPiA1MCAmJiByZWN0LmhlaWdodCA+IDUwICYmXG4gICAgICAgICAgICAgcmVjdC50b3AgPCB3aW5kb3cuaW5uZXJIZWlnaHQgJiYgcmVjdC5ib3R0b20gPiAwICYmXG4gICAgICAgICAgICAgcmVjdC5sZWZ0IDwgd2luZG93LmlubmVyV2lkdGggJiYgcmVjdC5yaWdodCA+IDA7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjaG9zZW4gPSB2aXNpYmxlIHx8IHZhbGlkWzBdO1xuICAgIGlmIChjaG9zZW4gJiYgdHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNob3Nlbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHRhcmdldFNlcSkpO1xuICAgICAgY2hvc2VuLmRhdGFzZXQuc2VxID0gU3RyaW5nKHRhcmdldFNlcSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNob3NlbjtcbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RQYWdlVGV4dChwYWdlTnVtOiBudW1iZXIsIGltZz86IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG5cbiAgICAvLyAxLiBDaGVjayBpZiB3ZSBhbHJlYWR5IHJlY2VpdmVkIHRoZSBPQ1IgSFRNTCBmcm9tIHRoZSBuZXR3b3JrIGludGVyY2VwdGlvblxuICAgIGNvbnN0IGNhY2hlZEh0bWwgPSB0aGlzLnNlcVRvSHRtbC5nZXQocGFnZU51bSk7XG4gICAgaWYgKGNhY2hlZEh0bWwpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChjYWNoZWRIdG1sKTtcbiAgICAgIGlmICh0ZXh0ICYmIHRleHQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICAvLyAyLiBRdWVyeSBET00gZm9yIHRhcmdldCBzZXF1ZW5jZSdzIGZpZ2NhcHRpb24sIHJldHJ5aW5nIGJyaWVmbHkgKHVwIHRvIDI1MDBtcylcbiAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0IDwgMjUwMCkge1xuICAgICAgLy8gMmEuIElmIGltZyB3YXMgcGFzc2VkLCBjaGVjayBpdHMgY2xvc2VzdCBmaWd1cmU6XG4gICAgICBpZiAoaW1nKSB7XG4gICAgICAgIGNvbnN0IGZpZ3VyZSA9IGltZy5jbG9zZXN0KCdmaWd1cmUnKTtcbiAgICAgICAgaWYgKGZpZ3VyZSkge1xuICAgICAgICAgIGNvbnN0IGZpZ2NhcHRpb24gPSBmaWd1cmUucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJ2ZpZ2NhcHRpb24nKTtcbiAgICAgICAgICBpZiAoZmlnY2FwdGlvbiAmJiBmaWdjYXB0aW9uLnRleHRDb250ZW50ICYmIGZpZ2NhcHRpb24udGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChmaWdjYXB0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gMmIuIENoZWNrIGV4cGxpY2l0bHkgdGFnZ2VkIGZpZ2NhcHRpb246XG4gICAgICBjb25zdCB0YWdnZWRGaWdjYXB0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICAgIGBmaWd1cmVbZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdIGZpZ2NhcHRpb24sIGZpZ2NhcHRpb25bZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdLCAuc3ByZWFkW2RhdGEtc2VxPVwiJHtwYWdlTnVtfVwiXSBmaWdjYXB0aW9uYFxuICAgICAgKTtcbiAgICAgIGlmICh0YWdnZWRGaWdjYXB0aW9uICYmIHRhZ2dlZEZpZ2NhcHRpb24udGV4dENvbnRlbnQgJiYgdGFnZ2VkRmlnY2FwdGlvbi50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQodGFnZ2VkRmlnY2FwdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIDJjLiBGYWxsYmFjazogY2hlY2sgbWFpbiBzcHJlYWQgZGV0YWlscyBmaWdjYXB0aW9uOlxuICAgICAgY29uc3Qgc3ByZWFkRmlnY2FwdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAnbWFpbiNtYWluIGRldGFpbHMgZmlndXJlIGZpZ2NhcHRpb24sIG1haW4jbWFpbiBmaWd1cmUgZmlnY2FwdGlvbiwgbWFpbiNtYWluIGZpZ2NhcHRpb24nXG4gICAgICApO1xuICAgICAgaWYgKHNwcmVhZEZpZ2NhcHRpb24gJiYgc3ByZWFkRmlnY2FwdGlvbi50ZXh0Q29udGVudCAmJiBzcHJlYWRGaWdjYXB0aW9uLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dChzcHJlYWRGaWdjYXB0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8gMmQuIENoZWNrIGlmIG5ldHdvcmsgcmVzcG9uc2UgYXJyaXZlZCB3aGlsZSBwb2xsaW5nOlxuICAgICAgY29uc3QgbGF0ZUh0bWwgPSB0aGlzLnNlcVRvSHRtbC5nZXQocGFnZU51bSk7XG4gICAgICBpZiAobGF0ZUh0bWwpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGxhdGVIdG1sKTtcbiAgICAgICAgaWYgKHRleHQgJiYgdGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgaXNBdEVuZE9mQm9vayhjdXJyZW50UGFnZTogbnVtYmVyLCB0b3RhbFBhZ2VzOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAodG90YWxQYWdlcyA+IDAgJiYgY3VycmVudFBhZ2UgPj0gdG90YWxQYWdlcykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQgfCBIVE1MQW5jaG9yRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW2FyaWEtbGFiZWwqPVwiTmV4dFwiIGldLCBidXR0b25bdGl0bGUqPVwiTmV4dFwiIGldLCBbYWNjZXNza2V5PVwiblwiXSdcbiAgICApO1xuICAgIGlmIChuZXh0QnRuKSB7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IChuZXh0QnRuIGFzIGFueSkuZGlzYWJsZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtZGlzYWJsZWQnKSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpO1xuICAgICAgaWYgKGRpc2FibGVkKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGdldFRvdGFsUGFnZXNGcm9tRG9tKCk6IG51bWJlciB7XG4gICAgLy8gMS4gQ2hlY2sgcGFyZW50IGNvbnRhaW5lciBvZiAjdG9vbGJhci1zZXE6IDxpbnB1dCBpZD1cInRvb2xiYXItc2VxXCI+IC4uLiA8c3Bhbj4vPC9zcGFuPiA8c3Bhbj4yNzI8L3NwYW4+XG4gICAgY29uc3Qgc2VxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbGJhci1zZXEsIGlucHV0W25hbWU9XCJzZXFcIl0nKTtcbiAgICBpZiAoc2VxSW5wdXQpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHNlcUlucHV0LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBwYXJlbnQudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvXFwvXFxzKihcXGQrKS8pO1xuICAgICAgICBpZiAobWF0Y2gpIHJldHVybiBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuXG4gICAgICAgIGNvbnN0IGh0bWxNYXRjaCA9IHBhcmVudC5pbm5lckhUTUwubWF0Y2goL1xcL1xccyo8XFwvc3Bhbj5cXHMqPHNwYW4+XFxzKihcXGQrKS9pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5uZXJIVE1MLm1hdGNoKC9cXC9cXHMqKFxcZCspLyk7XG4gICAgICAgIGlmIChodG1sTWF0Y2gpIHJldHVybiBwYXJzZUludChodG1sTWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWF4QXR0ciA9IHNlcUlucHV0LmdldEF0dHJpYnV0ZSgnbWF4Jyk7XG4gICAgICBpZiAobWF4QXR0cikge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChtYXhBdHRyLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIENoZWNrIHdpbmRvdy5tYW5pZmVzdCBpZiBwcmVzZW50IGluIHBhZ2VcbiAgICBjb25zdCB3ID0gd2luZG93IGFzIGFueTtcbiAgICBpZiAody5tYW5pZmVzdCAmJiB3Lm1hbmlmZXN0LnRvdGFsU2VxKSB7XG4gICAgICBjb25zdCB2YWwgPSBwYXJzZUludCh3Lm1hbmlmZXN0LnRvdGFsU2VxLCAxMCk7XG4gICAgICBpZiAoIWlzTmFOKHZhbCkgJiYgdmFsID4gMCkgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICAvLyAzLiBDaGVjayBnZW5lcmFsIHRleHQgZS5nLiBcIm9mIDI3MlwiIG9yIFwiLyAyNzJcIlxuICAgIGNvbnN0IHBhZ2luZ0VsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhZ2luZywgW2NsYXNzKj1cInBhZ2luZ1wiXSwgW2FyaWEtbGFiZWwqPVwidG90YWwgcGFnZXNcIiBpXScpO1xuICAgIGlmIChwYWdpbmdFbCAmJiBwYWdpbmdFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbSA9IHBhZ2luZ0VsLnRleHRDb250ZW50Lm1hdGNoKC9cXC9cXHMqKFxcZCspLykgfHwgcGFnaW5nRWwudGV4dENvbnRlbnQubWF0Y2goL29mXFxzKyhcXGQrKS9pKTtcbiAgICAgIGlmIChtKSByZXR1cm4gcGFyc2VJbnQobVsxXSwgMTApO1xuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9XG59XG4iLAogICAgImltcG9ydCB7IEJvb2tQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQXJjaGl2ZVByb3ZpZGVyIH0gZnJvbSAnLi9hcmNoaXZlLXByb3ZpZGVyJztcbmltcG9ydCB7IEhhdGhpVHJ1c3RQcm92aWRlciB9IGZyb20gJy4vaGF0aGl0cnVzdC1wcm92aWRlcic7XG5cbmV4cG9ydCAqIGZyb20gJy4vdHlwZXMnO1xuZXhwb3J0ICogZnJvbSAnLi9hcmNoaXZlLXByb3ZpZGVyJztcbmV4cG9ydCAqIGZyb20gJy4vaGF0aGl0cnVzdC1wcm92aWRlcic7XG5cbi8qKlxuICogUmVnaXN0cnkgb2Ygc3VwcG9ydGVkIGJvb2sgc2l0ZSBwcm92aWRlcnMuXG4gKi9cbmNvbnN0IHByb3ZpZGVyczogQm9va1Byb3ZpZGVyW10gPSBbXG4gIG5ldyBBcmNoaXZlUHJvdmlkZXIoKSxcbiAgbmV3IEhhdGhpVHJ1c3RQcm92aWRlcigpLFxuXTtcblxuLyoqXG4gKiBEZXRlY3RzIGFuZCByZXR1cm5zIHRoZSBhY3RpdmUgcHJvdmlkZXIgbWF0Y2hpbmcgdGhlIGN1cnJlbnQgd2VicGFnZS5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgY3VycmVudCBwYWdlIGlzIG5vdCBhIHN1cHBvcnRlZCBib29rIHZpZXdlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVByb3ZpZGVyKCk6IEJvb2tQcm92aWRlciB8IG51bGwge1xuICBmb3IgKGNvbnN0IHByb3ZpZGVyIG9mIHByb3ZpZGVycykge1xuICAgIGlmIChwcm92aWRlci5pc01hdGNoKCkpIHtcbiAgICAgIHJldHVybiBwcm92aWRlcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG4iLAogICAgIi8qKlxuICogQ29udGVudCBTY3JpcHQgKElzb2xhdGVkIFdvcmxkKSBmb3IgQXJjaGl2ZSBEb3dubG9hZGVyXG4gKiBNYW5hZ2VzIGF1dG9tYXRpb24sIHBhZ2UgY3ljbGluZywgdmVyaWZpY2F0aW9uLCBjYW52YXMgY2FwdHVyZSwgYW5kIHRleHQgZmV0Y2hpbmcuXG4gKi9cblxuaW1wb3J0IHsgQm9va0luZm8sIERvd25sb2FkZXJDb25maWcsIFByb2dyZXNzU3RhdGUsIEV4dGVuc2lvbk1lc3NhZ2UsIEJyaWRnZU1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBGbG9hdGluZ1BpbGwgfSBmcm9tICcuL3BpbGwnO1xuaW1wb3J0IHsgcGFyc2VEanZ1WG1sVG9UZXh0LCBidWlsZEJvb2tNYXJrZG93biwgUGFnZVRleHRFbnRyeSB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuaW1wb3J0IHsgY29tcGlsZUpwZWdzVG9QZGYsIFBkZkltYWdlSW5wdXQgfSBmcm9tICcuLi91dGlscy9wZGYtYnVpbGRlcic7XG5pbXBvcnQgeyBmb3JtYXRTdWJkaXIsIGZvcm1hdFBhZ2VGaWxlbmFtZSwgc2FuaXRpemVGaWxlbmFtZSB9IGZyb20gJy4uL3V0aWxzL3Nhbml0aXplcic7XG5pbXBvcnQgeyBnZXRBY3RpdmVQcm92aWRlciwgQm9va1Byb3ZpZGVyLCBBcmNoaXZlUHJvdmlkZXIsIEhhdGhpVHJ1c3RQcm92aWRlciwgcGFyc2VBcmNoaXZlSW1hZ2VVcmxQYWdlLCBwYXJzZUFyY2hpdmVEb21QYWdlIH0gZnJvbSAnLi4vcHJvdmlkZXJzJztcblxuKGZ1bmN0aW9uIGluaXRDb250ZW50U2NyaXB0KCkge1xuICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBJbml0aWFsaXplZCBvbicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblxuICBjb25zdCBwcm92aWRlcjogQm9va1Byb3ZpZGVyIHwgbnVsbCA9IGdldEFjdGl2ZVByb3ZpZGVyKCk7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBObyBtYXRjaGluZyBib29rIHByb3ZpZGVyIGZvcicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gQWN0aXZlIHByb3ZpZGVyOiAke3Byb3ZpZGVyLnNpdGVOYW1lfSAoJHtwcm92aWRlci5zaXRlSWR9KWApO1xuXG4gIC8vIFN0YXRlXG4gIGxldCBib29rSW5mbzogQm9va0luZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGlzUnVubmluZyA9IGZhbHNlO1xuICBsZXQgaXNQYXVzZWQgPSBmYWxzZTtcbiAgbGV0IHN0b3BSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgbGV0IGN1cnJlbnRQYWdlID0gcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZTtcbiAgbGV0IGRvd25sb2FkZWRQYWdlcyA9IDA7XG4gIGxldCBmYWlsZWRQYWdlcyA9IDA7XG4gIGxldCBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gIGxldCBsYXN0RGltZW5zaW9ucyA9IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xuICBsZXQgY29sbGVjdGVkSW1hZ2VzOiBQZGZJbWFnZUlucHV0W10gPSBbXTtcbiAgbGV0IGNvbGxlY3RlZFRleHRzOiBQYWdlVGV4dEVudHJ5W10gPSBbXTtcbiAgbGV0IGlzRW5kT2ZCb29rID0gZmFsc2U7XG4gIGxldCBpc1NpdGVUYWludGVkID0gZmFsc2U7XG5cbiAgaW50ZXJmYWNlIEh0dHBFcnJvckluZm8ge1xuICAgIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgICB1cmw6IHN0cmluZztcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgICByZXRyeUFmdGVyPzogbnVtYmVyO1xuICB9XG5cbiAgbGV0IGxhc3RIdHRwRXJyb3I6IEh0dHBFcnJvckluZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGNvbnNlY3V0aXZlRXJyb3JDb3VudCA9IDA7XG5cbiAgZnVuY3Rpb24gb25IdHRwRXJyb3JSZWNlaXZlZChzdGF0dXNDb2RlOiBudW1iZXIsIHVybDogc3RyaW5nLCByZXRyeUFmdGVyPzogbnVtYmVyKSB7XG4gICAgY29uc3QgaXNCb29rUmVsYXRlZCA9XG4gICAgICB1cmwuaW5jbHVkZXMoJ2ltZ3NydicpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ0Jvb2tSZWFkZXInKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCcvY2dpL3B0JykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnZGV0YWlscycpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKTtcblxuICAgIGlmICghaXNCb29rUmVsYXRlZCkgcmV0dXJuO1xuXG4gICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIEhUVFAgZXJyb3IgJHtzdGF0dXNDb2RlfSBkZXRlY3RlZCBmb3IgJHt1cmx9YCk7XG4gICAgbGFzdEh0dHBFcnJvciA9IHtcbiAgICAgIHN0YXR1c0NvZGUsXG4gICAgICB1cmwsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICByZXRyeUFmdGVyLFxuICAgIH07XG4gIH1cblxuICAvLyBMb2FkIHNhdmVkIHNldHRpbmdzIGZyb20gbG9jYWxTdG9yYWdlIGZpcnN0XG4gIGNvbnN0IGxvY2FsU2F2ZVBhdGggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX3NhdmVfcGF0aCcpO1xuICBjb25zdCBsb2NhbEZvbGRlclBhdHRlcm4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2ZvbGRlcl9wYXR0ZXJuJyk7XG4gIGNvbnN0IGxvY2FsU3RhcnRQYWdlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJyk7XG4gIGNvbnN0IGxvY2FsRW5kUGFnZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnKTtcbiAgY29uc3QgbG9jYWxNYXhIZWlnaHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX21heF9oZWlnaHQnKTtcblxuICBsZXQgaW5pdGlhbFN0YXJ0UGFnZSA9IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG4gIGlmIChsb2NhbFN0YXJ0UGFnZSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KGxvY2FsU3RhcnRQYWdlLCAxMCk7XG4gICAgaWYgKCFpc05hTihwYXJzZWQpICYmIHBhcnNlZCA+PSBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlKSB7XG4gICAgICBpbml0aWFsU3RhcnRQYWdlID0gcGFyc2VkO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRlZmF1bHRDb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7XG4gICAgYmFzZURpcjogbG9jYWxTYXZlUGF0aCB8fCAnQXJjaGl2ZUJvb2tzJyxcbiAgICBmb2xkZXJQYXR0ZXJuOiBsb2NhbEZvbGRlclBhdHRlcm4gfHwgJ3t0aXRsZX1fe2lkfScsXG4gICAgc2F2ZUltYWdlczogZmFsc2UsXG4gICAgZ2VuZXJhdGVQZGY6IHRydWUsXG4gICAgc2F2ZVRleHRNZDogdHJ1ZSxcbiAgICBpbWFnZVF1YWxpdHk6IDAuNzUsXG4gICAgbWF4UGFnZUhlaWdodDogbG9jYWxNYXhIZWlnaHQgIT09IG51bGwgPyBNYXRoLm1heCgwLCBwYXJzZUludChsb2NhbE1heEhlaWdodCwgMTApKSA6IDAsXG4gICAgcGFnZURlbGF5TXM6IDIwMCxcbiAgICBwYWdlQ2hhbmdlVGltZW91dE1zOiAxMDAwMCxcbiAgICBtYXhSZXRyaWVzOiAxMCxcbiAgICBhdXRvU2luZ2xlUGFnZTogdHJ1ZSxcbiAgICBzdGFydFBhZ2U6IGluaXRpYWxTdGFydFBhZ2UsXG4gICAgZW5kUGFnZTogbG9jYWxFbmRQYWdlICE9PSBudWxsID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobG9jYWxFbmRQYWdlLCAxMCkpIDogMCxcbiAgICBkZWxldGVJbWFnZXNPbkNvbXBsZXRlOiB0cnVlLFxuICB9O1xuXG4gIGxldCBjb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7IC4uLmRlZmF1bHRDb25maWcgfTtcblxuICBmdW5jdGlvbiBzYXZlQ29uZmlnKHVwZGF0ZWQ6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pIHtcbiAgICBjb25maWcgPSB7IC4uLmNvbmZpZywgLi4udXBkYXRlZCB9O1xuICAgIGlmIChjb25maWcuYmFzZURpcikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zYXZlX3BhdGgnLCBjb25maWcuYmFzZURpcik7XG4gICAgfVxuICAgIGlmIChjb25maWcuZm9sZGVyUGF0dGVybikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9mb2xkZXJfcGF0dGVybicsIGNvbmZpZy5mb2xkZXJQYXR0ZXJuKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuc3RhcnRQYWdlID09PSAnbnVtYmVyJykge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJywgU3RyaW5nKGNvbmZpZy5zdGFydFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuZW5kUGFnZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnLCBTdHJpbmcoY29uZmlnLmVuZFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcubWF4UGFnZUhlaWdodCA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfbWF4X2hlaWdodCcsIFN0cmluZyhjb25maWcubWF4UGFnZUhlaWdodCkpO1xuICAgIH1cbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IGRvd25sb2FkZXJDb25maWc6IGNvbmZpZyB9KTtcbiAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICB9XG5cbiAgLy8gTG9hZCB1c2VyIGNvbmZpZyBmcm9tIGNocm9tZS5zdG9yYWdlXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFsnbGliZXJhdG9yQ29uZmlnJywgJ2Rvd25sb2FkZXJDb25maWcnXSwgKHJlcykgPT4ge1xuICAgIGNvbnN0IHNhdmVkID0gcmVzLmRvd25sb2FkZXJDb25maWcgfHwgcmVzLmxpYmVyYXRvckNvbmZpZztcbiAgICBpZiAoc2F2ZWQpIHtcbiAgICAgIGNvbnN0IGxvY2FsUGF0aCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc2F2ZV9wYXRoJyk7XG4gICAgICBjb25maWcgPSB7XG4gICAgICAgIC4uLmRlZmF1bHRDb25maWcsXG4gICAgICAgIC4uLnNhdmVkLFxuICAgICAgICAuLi4obG9jYWxQYXRoID8geyBiYXNlRGlyOiBsb2NhbFBhdGggfSA6IHt9KSxcbiAgICAgIH07XG4gICAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gRmxvYXRpbmcgUGlsbCBVSSB3aXRoIGZ1bGwgY2FsbGJhY2tzXG4gIGNvbnN0IHBpbGwgPSBuZXcgRmxvYXRpbmdQaWxsKHtcbiAgICBvblN0YXJ0OiAoKSA9PiBzdGFydERvd25sb2FkKCksXG4gICAgb25QYXVzZTogKCkgPT4gcGF1c2VEb3dubG9hZCgpLFxuICAgIG9uUmVzdW1lOiAoKSA9PiByZXN1bWVEb3dubG9hZCgpLFxuICAgIG9uU3RvcDogKCkgPT4gaGFuZGxlU3RvcFJlcXVlc3QoKSxcbiAgICBvblNhdmVTZXR0aW5nczogKG5ld1NldHRpbmdzKSA9PiB7XG4gICAgICBzYXZlQ29uZmlnKG5ld1NldHRpbmdzKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFNldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZTonLCBuZXdTZXR0aW5ncyk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogaXNSdW5uaW5nID8gKGlzUGF1c2VkID8gJ3BhdXNlZCcgOiAnZG93bmxvYWRpbmcnKSA6ICdpZGxlJyxcbiAgICAgICAgc3RhdHVzVGV4dDogJ1NldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZScsXG4gICAgICB9KTtcbiAgICB9LFxuICAgIG9uU3dpdGNoTW9kZTogKCkgPT4gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCksXG4gICAgb25WaWV3RmlsZTogKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gT3BlbmluZyBkb3dubG9hZGVkIGZpbGUgaW4gRmluZGVyL0V4cGxvcmVyLi4uJyk7XG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdPUEVOX0RPV05MT0FEJyB9KTtcbiAgICB9LFxuICB9KTtcblxuICBpZiAocGlsbC5zaG91bGRSZW5kZXIoKSkge1xuICAgIHBpbGwucmVuZGVyKCk7XG4gICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hCb29rSW5mbygpIHtcbiAgICBjb25zdCBkZXRlY3RlZCA9IGF3YWl0IHByb3ZpZGVyLmRldGVjdEJvb2tJbmZvKCk7XG4gICAgaWYgKGRldGVjdGVkKSB7XG4gICAgICBib29rSW5mbyA9IGRldGVjdGVkO1xuICAgICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJjaGl2ZVByb3ZpZGVyKSB7XG4gICAgICAgIHByb3ZpZGVyLnNldEJvb2tJbmZvKGJvb2tJbmZvKTtcbiAgICAgIH1cbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID8/IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UsXG4gICAgICAgIGJvb2tJbmZvLnRvdGFsUGFnZXMsXG4gICAgICAgICdSZWFkeScsXG4gICAgICAgICdub3JtYWwnLFxuICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgaXNSdW5uaW5nLFxuICAgICAgICBib29rSW5mby5jdXJyZW50TW9kZSA/PyAxLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQnJpZGdlIGxpc3RlbmVyIGZvciBNQUlOIHdvcmxkIGV2ZW50cyAoSFRUUCBlcnJvciBpbnRlcmNlcHRpb24gJiBBcmNoaXZlLm9yZyBCb29rUmVhZGVyKVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ0ZST01fQlJJREdFJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGEgYXMgQnJpZGdlTWVzc2FnZTtcblxuICAgIC8vIEludGVyY2VwdCBhbnkgbm9uLTIwMCBIVFRQIHN0YXR1cyAoNDI5LCA1MDAsIDQwMSwgZXRjLilcbiAgICBpZiAobXNnLmV2ZW50ID09PSAnSFRUUF9FUlJPUicpIHtcbiAgICAgIG9uSHR0cEVycm9yUmVjZWl2ZWQobXNnLnN0YXR1c0NvZGUsIG1zZy51cmwsIG1zZy5yZXRyeUFmdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3J3YXJkIEhhdGhpVHJ1c3QgcGFnZSBhbm5vdW5jZW1lbnRzLCBpbWFnZXMsIGFuZCBPQ1IgdGV4dCB0byBwcm92aWRlclxuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEhhdGhpVHJ1c3RQcm92aWRlcikge1xuICAgICAgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfTE9BRF9BTk5PVU5DRUQnKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZUxvYWRBbm5vdW5jZWQobXNnLnNlcSwgbXNnLmlzVmlzaWJsZSwgbXNnLmlzTG9hZGVkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0lNQUdFX1JFQURZJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VJbWFnZVJlYWR5KG1zZy5zZXEsIG1zZy5ibG9iVXJsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZVRleHRSZWFkeShtc2cuc2VxLCBtc2cuaHRtbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXNnLmV2ZW50ID09PSAnQk9PS19JTkZPJykge1xuICAgICAgYm9va0luZm8gPSBtc2cuZGF0YTtcbiAgICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFyY2hpdmVQcm92aWRlcikge1xuICAgICAgICBwcm92aWRlci5zZXRCb29rSW5mbyhib29rSW5mbyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvbUN1cnJlbnQgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgaWYgKGRvbUN1cnJlbnQgIT09IG51bGwgJiYgKCFib29rSW5mby50b3RhbFBhZ2VzIHx8IGRvbUN1cnJlbnQgPiAoYm9va0luZm8uY3VycmVudExlYWYgPz8gMCkpKSB7XG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID0gZG9tQ3VycmVudDtcbiAgICAgIH1cblxuICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgYm9va0luZm8uY3VycmVudExlYWYgPz8gMCxcbiAgICAgICAgYm9va0luZm8udG90YWxQYWdlcyxcbiAgICAgICAgJ1JlYWR5JyxcbiAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgIGlzUGF1c2VkLFxuICAgICAgICBpc1J1bm5pbmcsXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRNb2RlLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdNT0RFX0NIQU5HRUQnKSB7XG4gICAgICBpZiAoYm9va0luZm8pIHtcbiAgICAgICAgYm9va0luZm8uY3VycmVudE1vZGUgPSBtc2cubW9kZTtcbiAgICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgICBib29rSW5mby50b3RhbFBhZ2VzLFxuICAgICAgICAgICcxLVBhZ2UgTW9kZSBBY3RpdmUnLFxuICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgIGlzUGF1c2VkLFxuICAgICAgICAgIGlzUnVubmluZyxcbiAgICAgICAgICBtc2cubW9kZSxcbiAgICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSW5pdGlhbCBkZXRlY3Rpb25cbiAgcmVmcmVzaEJvb2tJbmZvKCk7XG4gIHNldFRpbWVvdXQoKCkgPT4gcmVmcmVzaEJvb2tJbmZvKCksIDgwMCk7XG5cbiAgLy8gTmV0d29yayBjb25uZWN0aW9uIGxpc3RlbmVyc1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLndhcm4oJ1tBcmNoaXZlRG93bmxvYWRlcl0gTmV0d29yayBjb25uZWN0aW9uIGxvc3QgKG9mZmxpbmUpJyk7XG4gICAgaWYgKGlzUnVubmluZyAmJiAhaXNQYXVzZWQpIHtcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwLFxuICAgICAgICAnT2ZmbGluZSAtIFBhdXNlZCcsXG4gICAgICAgICdvZmZsaW5lJyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgICApO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdvZmZsaW5lJywgaXNPZmZsaW5lOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBOZXR3b3JrIGNvbm5lY3Rpb24gcmVzdG9yZWQgKG9ubGluZSknKTtcbiAgICBpZiAoaXNSdW5uaW5nICYmIGlzUGF1c2VkKSB7XG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMCxcbiAgICAgICAgJ09ubGluZSAtIENsaWNrIENPTlRJTlVFJyxcbiAgICAgICAgJ3N0YWxsZWQnLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlLFxuICAgICAgICBib29rSW5mbz8uY3VycmVudE1vZGUgfHwgMSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3N0YWxsZWQnLCBpc09mZmxpbmU6IGZhbHNlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGVscGVyc1xuICBjb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcblxuICBmdW5jdGlvbiBicm9hZGNhc3RTdGF0ZShleHRyYTogUGFydGlhbDxQcm9ncmVzc1N0YXRlPiA9IHt9KSB7XG4gICAgY29uc3QgdG90YWwgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjb25maWcuZW5kUGFnZSB8fCAxO1xuICAgIGxldCBzdGF0dXNUeXBlOiAnbm9ybWFsJyB8ICdyZXRyeWluZycgfCAnb2ZmbGluZScgfCAnc3RhbGxlZCcgfCAnY29tcGxldGUnID0gJ25vcm1hbCc7XG5cbiAgICBpZiAoZXh0cmEuc3RhdHVzID09PSAnc3RhbGxlZCcpIHN0YXR1c1R5cGUgPSAnc3RhbGxlZCc7XG4gICAgZWxzZSBpZiAoZXh0cmEuc3RhdHVzID09PSAncmV0cnlpbmcnKSBzdGF0dXNUeXBlID0gJ3JldHJ5aW5nJztcbiAgICBlbHNlIGlmICghbmF2aWdhdG9yLm9uTGluZSkgc3RhdHVzVHlwZSA9ICdvZmZsaW5lJztcbiAgICBlbHNlIGlmIChleHRyYS5zdGF0dXMgPT09ICdjb21wbGV0ZScpIHN0YXR1c1R5cGUgPSAnY29tcGxldGUnO1xuXG4gICAgY29uc3Qgc3RhdGU6IFByb2dyZXNzU3RhdGUgPSB7XG4gICAgICBzdGF0dXM6IGlzUnVubmluZyA/IChpc1BhdXNlZCA/IChzdGF0dXNUeXBlID09PSAnc3RhbGxlZCcgPyAnc3RhbGxlZCcgOiAncGF1c2VkJykgOiAnZG93bmxvYWRpbmcnKSA6IChleHRyYS5zdGF0dXMgfHwgJ2lkbGUnKSxcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWxQYWdlczogdG90YWwsXG4gICAgICBkb3dubG9hZGVkUGFnZXMsXG4gICAgICBmYWlsZWRQYWdlcyxcbiAgICAgIHJldHJ5Q291bnQ6IGN1cnJlbnRSZXRyeUNvdW50LFxuICAgICAgc3RhdHVzVGV4dDogaXNQYXVzZWQgPyAoc3RhdHVzVHlwZSA9PT0gJ3N0YWxsZWQnID8gJ1N0YWxsZWQgLSBDbGljayBDT05USU5VRScgOiAnUGF1c2VkJykgOiAoaXNSdW5uaW5nID8gYENhcHR1cmluZyBwYWdlICR7Y3VycmVudFBhZ2V9YCA6ICdSZWFkeScpLFxuICAgICAgYm9va0luZm86IGJvb2tJbmZvIHx8IHVuZGVmaW5lZCxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNPZmZsaW5lOiAhbmF2aWdhdG9yLm9uTGluZSxcbiAgICAgIGltYWdlRGltZW5zaW9uczogbGFzdERpbWVuc2lvbnMsXG4gICAgICAuLi5leHRyYSxcbiAgICB9O1xuXG4gICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWwsXG4gICAgICBzdGF0ZS5zdGF0dXNUZXh0LFxuICAgICAgc3RhdHVzVHlwZSxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNSdW5uaW5nLFxuICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICBsYXN0RGltZW5zaW9uc1xuICAgICk7XG5cbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdTVEFURV9VUERBVEUnLCBzdGF0ZSB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRW5mb3JjZXMgMS1wYWdlIHZpZXcgbW9kZSB2aWEgcHJvdmlkZXIgaWYgc3VwcG9ydGVkLlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChwcm92aWRlci5lbmZvcmNlU2luZ2xlUGFnZU1vZGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uICR7cHJvdmlkZXIuc2l0ZU5hbWV9Li4uYCk7XG4gICAgICByZXR1cm4gYXdhaXQgcHJvdmlkZXIuZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhcHR1cmVzIGltYWdlIGZyb20gRE9NIGVsZW1lbnQgdG8gSlBFRyBEYXRhIFVSTCB1c2luZyBhbiBvZmZzY3JlZW4gY2FudmFzLlxuICAgKiBQcm9wb3J0aWFuYWxseSBkb3duc2NhbGVzIGlmIG1heFBhZ2VIZWlnaHQgPiAwIGFuZCBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0LlxuICAgKiBJZiBjYW52YXMgaXMgdGFpbnRlZCBieSBjcm9zcy1vcmlnaW4gcmVzb3VyY2VzLCBmbGFncyBpc1NpdGVUYWludGVkIGFuZCBjbGVhbmx5IHJlY292ZXJzIHZpYSBiYWNrZ3JvdW5kIHByb3h5LlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gY2FwdHVyZUltYWdlVG9EYXRhVXJsKGltZzogSFRNTEltYWdlRWxlbWVudCwgcXVhbGl0eSA9IDAuNzUsIG1heFBhZ2VIZWlnaHQgPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBGYXN0IHBhdGg6IGlmIHNpdGUgaXMgYWxyZWFkeSBrbm93biB0byB1c2UgY3Jvc3Mtb3JpZ2luL3RhaW50ZWQgaW1hZ2VzLCBieXBhc3MgY2FudmFzIGVudGlyZWx5IVxuICAgIGlmIChpc1NpdGVUYWludGVkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgZmV0Y2hDbGVhbkRhdGFVcmwoaW1nLnNyYywgcXVhbGl0eSwgbWF4UGFnZUhlaWdodCk7XG4gICAgfVxuXG4gICAgLy8gUHJvYWN0aXZlbHkgZGV0ZWN0IEFyY2hpdmUub3JnIGNyb3NzLW9yaWdpbiBzdG9yYWdlIG5vZGVzIChpYSoudXMuYXJjaGl2ZS5vcmcgIT0gYXJjaGl2ZS5vcmcpXG4gICAgaWYgKGltZy5zcmMgJiYgaW1nLnNyYy5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKSAmJiAhaW1nLnNyYy5zdGFydHNXaXRoKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pKSB7XG4gICAgICBpc1NpdGVUYWludGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICB9XG5cbiAgICBsZXQgd2lkdGggPSBpbWcubmF0dXJhbFdpZHRoIHx8IGltZy53aWR0aCB8fCAwO1xuICAgIGxldCBoZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodCB8fCBpbWcuaGVpZ2h0IHx8IDA7XG5cbiAgICBpZiAobWF4UGFnZUhlaWdodCA+IDAgJiYgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgY29uc3Qgc2NhbGUgPSBtYXhQYWdlSGVpZ2h0IC8gaGVpZ2h0O1xuICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgIGlmICghY3R4KSB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBvYnRhaW4gY2FudmFzIDJEIGNvbnRleHQnKTtcblxuICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCBxdWFsaXR5KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgLy8gVGFpbnRlZCBjYW52YXMgcmVjb3ZlcnkgKGNyb3NzLW9yaWdpbiBDRE4gb3IgcHJvdGVjdGVkIHBhZ2VzKVxuICAgICAgaWYgKGVyci5uYW1lID09PSAnU2VjdXJpdHlFcnJvcicgfHwgU3RyaW5nKGVycikuaW5jbHVkZXMoJ1RhaW50ZWQnKSB8fCBTdHJpbmcoZXJyKS5pbmNsdWRlcygnU2VjdXJpdHlFcnJvcicpKSB7XG4gICAgICAgIGlmICghaXNTaXRlVGFpbnRlZCkge1xuICAgICAgICAgIGlzU2l0ZVRhaW50ZWQgPSB0cnVlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIENyb3NzLW9yaWdpbiBzY2FuIGRldGVjdGVkLiBFbmFibGluZyBmYXN0IGJhY2tncm91bmQgZmV0Y2ggZm9yIGFsbCBzdWJzZXF1ZW50IHBhZ2VzLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBibG9iVG9EYXRhVXJsKGJsb2I6IEJsb2IpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHJlc29sdmUocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNjYWxlRGF0YVVybChkYXRhVXJsOiBzdHJpbmcsIHF1YWxpdHkgPSAwLjc1LCBtYXhQYWdlSGVpZ2h0ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKG1heFBhZ2VIZWlnaHQgPD0gMCkgcmV0dXJuIGRhdGFVcmw7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIGxldCB3aWR0aCA9IGltZy5uYXR1cmFsV2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodDtcbiAgICAgICAgaWYgKGhlaWdodCA+IG1heFBhZ2VIZWlnaHQpIHtcbiAgICAgICAgICBjb25zdCBzY2FsZSA9IG1heFBhZ2VIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgICAgIGhlaWdodCA9IG1heFBhZ2VIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgaWYgKCFjdHgpIHJldHVybiByZXNvbHZlKGRhdGFVcmwpO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIHJlc29sdmUoY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIHF1YWxpdHkpKTtcbiAgICAgIH07XG4gICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlc29sdmUoZGF0YVVybCk7XG4gICAgICBpbWcuc3JjID0gZGF0YVVybDtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGZldGNoQ2xlYW5EYXRhVXJsKHVybDogc3RyaW5nLCBxdWFsaXR5ID0gMC43NSwgbWF4UGFnZUhlaWdodCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBibG9iOiBCbG9iIHwgbnVsbCA9IG51bGw7XG5cbiAgICAvLyAxLiBJZiBzaXRlIGlzIE5PVCBtYXJrZWQgdGFpbnRlZCwgdHJ5IGxvY2FsIGZldGNoIGZpcnN0IChmYXN0IGZvciBibG9iOiBhbmQgQ09SUy1lbmFibGVkIGVuZHBvaW50cylcbiAgICBpZiAoIWlzU2l0ZVRhaW50ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgeyBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH0pO1xuICAgICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgICAgYmxvYiA9IGF3YWl0IHJlcy5ibG9iKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgLy8gMi4gQmFja2dyb3VuZCBzZXJ2aWNlIHdvcmtlciBmZXRjaCAoaW1tdW5lIHRvIENPUlMgcmVzdHJpY3Rpb25zIHdpdGggaG9zdF9wZXJtaXNzaW9ucylcbiAgICBpZiAoIWJsb2IpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJnUmVzOiBhbnkgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICAgICAgeyB0eXBlOiAnRkVUQ0hfSU1BR0VfREFUQV9VUkwnLCB1cmwgfSxcbiAgICAgICAgICAgIChyZXNwb25zZSkgPT4gcmVzb2x2ZShyZXNwb25zZSB8fCB7IHN1Y2Nlc3M6IGZhbHNlIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChiZ1JlcyAmJiBiZ1Jlcy5zdWNjZXNzICYmIGJnUmVzLmRhdGFVcmwpIHtcbiAgICAgICAgICBpZiAobWF4UGFnZUhlaWdodCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYmdSZXMuZGF0YVVybDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHNjYWxlRGF0YVVybChiZ1Jlcy5kYXRhVXJsLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBpZiAoYmxvYikge1xuICAgICAgaWYgKG1heFBhZ2VIZWlnaHQgPD0gMCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgYmxvYlRvRGF0YVVybChibG9iKTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJpdG1hcCA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGJsb2IpO1xuICAgICAgICBsZXQgd2lkdGggPSBiaXRtYXAud2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBiaXRtYXAuaGVpZ2h0O1xuICAgICAgICBpZiAobWF4UGFnZUhlaWdodCA+IDAgJiYgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgICAgIGNvbnN0IHNjYWxlID0gbWF4UGFnZUhlaWdodCAvIGhlaWdodDtcbiAgICAgICAgICB3aWR0aCA9IE1hdGgucm91bmQod2lkdGggKiBzY2FsZSk7XG4gICAgICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBpZiAoY3R4KSB7XG4gICAgICAgICAgY3R4LmRyYXdJbWFnZShiaXRtYXAsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgcXVhbGl0eSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICByZXR1cm4gYXdhaXQgYmxvYlRvRGF0YVVybChibG9iKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBleHBvcnQgaW1hZ2UgZnJvbSAke3VybH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG5vbi0yMDAgSFRUUCByZXNwb25zZXMgKDQyOSwgNTAwLCA1MDIsIDUwMywgNDAxLCA0MDMsIGV0Yy4pXG4gICAqIC0gNDAxLzQwMzogUGF1c2VzIGRvd25sb2FkIHRvIGxldCB1c2VyIGF1dGhlbnRpY2F0ZSBvciByZW5ldyBsb2FuXG4gICAqIC0gNDI5ICYgNXh4OiBJbml0aWF0ZXMgZXhwb25lbnRpYWwgYmFja29mZiB3aXRoIGxpdmUgY291bnRkb3duIGFuZCBpbmNyZWFzZXMgcGFjaW5nXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVycjogSHR0cEVycm9ySW5mbywgdGFyZ2V0UGFnZU51bTogbnVtYmVyKSB7XG4gICAgY29uc2VjdXRpdmVFcnJvckNvdW50Kys7XG5cbiAgICAvLyA0MDEgLyA0MDM6IEF1dGgvRm9yYmlkZGVuXG4gICAgaWYgKGVyci5zdGF0dXNDb2RlID09PSA0MDEgfHwgZXJyLnN0YXR1c0NvZGUgPT09IDQwMykge1xuICAgICAgY29uc29sZS5lcnJvcihgW0FyY2hpdmVEb3dubG9hZGVyXSBBY2Nlc3MgcmVzdHJpY3RlZCAoSFRUUCAke2Vyci5zdGF0dXNDb2RlfSkgb24gJHtlcnIudXJsfS4gUGF1c2luZy5gKTtcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICAgICAgc3RhdHVzVGV4dDogYEFjY2VzcyByZXN0cmljdGVkIChIVFRQICR7ZXJyLnN0YXR1c0NvZGV9KS4gUGxlYXNlIGNoZWNrIGxvZ2luIG9yIGxvYW4gc3RhdHVzLmAsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSYXRlIExpbWl0aW5nICg0MjkpICYgU2VydmVyIEVycm9ycyAoNTAwLCA1MDIsIDUwMywgNTA0KVxuICAgIC8vIElmIHRoZSBzZXJ2ZXIgZXhwbGljaXRseSBzcGVjaWZpZXMgUmV0cnktQWZ0ZXIsIGhvbm9yIGl0LlxuICAgIC8vIE90aGVyd2lzZSBmYWxsYmFjayB0byBleHBvbmVudGlhbCBiYWNrb2ZmOiAxMHMsIDIwcywgNDBzLCBjYXBwZWQgYXQgNjBzLlxuICAgIGNvbnN0IGlzU2VydmVyUmVxdWVzdGVkID0gdHlwZW9mIGVyci5yZXRyeUFmdGVyID09PSAnbnVtYmVyJyAmJiAhaXNOYU4oZXJyLnJldHJ5QWZ0ZXIpICYmIGVyci5yZXRyeUFmdGVyID4gMDtcbiAgICBjb25zdCBiYXNlU2Vjb25kcyA9IGlzU2VydmVyUmVxdWVzdGVkXG4gICAgICA/IGVyci5yZXRyeUFmdGVyXG4gICAgICA6IE1hdGgubWluKDEwICogTWF0aC5wb3coMiwgTWF0aC5tYXgoMCwgY29uc2VjdXRpdmVFcnJvckNvdW50IC0gMSkpLCA2MCk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGluY3JlYXNlIGludGVyLXBhZ2UgcGFjaW5nIGRlbGF5IHRvIHByZXZlbnQgcmVjdXJyaW5nIGVycm9yc1xuICAgIGNvbnN0IHByZXZEZWxheSA9IGNvbmZpZy5wYWdlRGVsYXlNcztcbiAgICBjb25maWcucGFnZURlbGF5TXMgPSBNYXRoLm1pbihNYXRoLm1heChjb25maWcucGFnZURlbGF5TXMsIDE1MDApICsgNTAwLCA1MDAwKTtcbiAgICBpZiAoY29uZmlnLnBhZ2VEZWxheU1zICE9PSBwcmV2RGVsYXkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEluY3JlYXNlZCBwYWdlIHBhY2luZyBkZWxheSB0byAke2NvbmZpZy5wYWdlRGVsYXlNc31tcy5gKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBlcnIuc3RhdHVzQ29kZSA9PT0gNDI5XG4gICAgICA/ICdSYXRlIExpbWl0ZWQnXG4gICAgICA6IChlcnIuc3RhdHVzQ29kZSA+PSA1MDAgPyBgU2VydmVyIEVycm9yICgke2Vyci5zdGF0dXNDb2RlfSlgIDogYEhUVFAgJHtlcnIuc3RhdHVzQ29kZX1gKTtcblxuICAgIGlmIChpc1NlcnZlclJlcXVlc3RlZCkge1xuICAgICAgbGFiZWwgKz0gJyAoc2VydmVyIGFza2VkKSc7XG4gICAgfVxuXG4gICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdICR7bGFiZWx9IG9uICR7ZXJyLnVybH0uIEJhY2tpbmcgb2ZmIGZvciAke01hdGgucm91bmQoYmFzZVNlY29uZHMpfXMuLi5gKTtcblxuICAgIGZvciAobGV0IHJlbWFpbmluZyA9IE1hdGgucm91bmQoYmFzZVNlY29uZHMpOyByZW1haW5pbmcgPiAwOyByZW1haW5pbmctLSkge1xuICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIHJldHVybjtcbiAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuO1xuICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgfVxuXG4gICAgICAvLyBEaXNwbGF5IGluIG1pbnV0ZXMgaWYgbW9yZSB0aGFuIDEyMHMsIG90aGVyd2lzZSBpbiBzZWNvbmRzXG4gICAgICBjb25zdCB0aW1lU3RyID0gcmVtYWluaW5nID4gMTIwXG4gICAgICAgID8gYCR7TWF0aC5yb3VuZChyZW1haW5pbmcgLyA2MCl9bWBcbiAgICAgICAgOiBgJHtyZW1haW5pbmd9c2A7XG5cbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncmV0cnlpbmcnLFxuICAgICAgICByZXRyeUNvdW50OiBjb25zZWN1dGl2ZUVycm9yQ291bnQsXG4gICAgICAgIHN0YXR1c1RleHQ6IGAke3RpbWVTdHJ9IFJldHJ5aW5nOiAke2xhYmVsfS5gLFxuICAgICAgfSk7XG4gICAgICBhd2FpdCBzbGVlcCgxMDAwKTtcbiAgICB9XG5cbiAgICAvLyBCYWNrb2ZmIGNvbXBsZXRlISBSZS1uYXZpZ2F0ZSB0byB0YXJnZXRQYWdlTnVtIHNvIHJlYWRlciByZS1mZXRjaGVzIGNsZWFubHlcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBCYWNrb2ZmIGNvbXBsZXRlZC4gUmUtcmVxdWVzdGluZyBwYWdlICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgYXdhaXQgc2xlZXAoODAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGYXN0IFBhZ2UgVHVybiAmIFdhaXQgRW5naW5lOlxuICAgKiAxLiBUcmlnZ2VycyBwYWdlIGZsaXAgdmlhIHByb3ZpZGVyLlxuICAgKiAyLiBQb2xscyBhdCBoaWdoIGZyZXF1ZW5jeSAoMTAwbXMpIGFuZCByZXR1cm5zIHRoZSBuZXcgaW1hZ2UgaW1tZWRpYXRlbHkgb25jZSB2aXNpYmxlLlxuICAgKiAzLiBSZWplY3RzIHBhZ2UgbG9hZCBpZiBhbnkgbm9uLTIwMCBIVFRQIHJlc3BvbnNlICg0MjksIDUwMCwgNDAxLCBldGMuKSB3YXMgcmVjZWl2ZWQuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiB0dXJuQW5kR2V0TmV4dEltYWdlKFxuICAgIGxhc3RTcmM6IHN0cmluZyxcbiAgICB0YXJnZXRQYWdlTnVtOiBudW1iZXJcbiAgKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbD4ge1xuICAgIGxldCByZXRyeUF0dGVtcHQgPSAwO1xuICAgIGlzRW5kT2ZCb29rID0gZmFsc2U7XG5cbiAgICB3aGlsZSAocmV0cnlBdHRlbXB0IDw9IGNvbmZpZy5tYXhSZXRyaWVzKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG5cbiAgICAgIC8vIEhhbmRsZSBwYXVzZSAvIG9mZmxpbmVcbiAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG4gICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIDEuIENoZWNrIGlmIHJlYWRlciBpcyBhbHJlYWR5IGF0IGVuZCBvZiBib29rXG4gICAgICBjb25zdCB0b3RhbFBhZ2VzID0gYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMDtcbiAgICAgIGlmIChwcm92aWRlci5pc0F0RW5kT2ZCb29rICYmIHByb3ZpZGVyLmlzQXRFbmRPZkJvb2sodGFyZ2V0UGFnZU51bSwgdG90YWxQYWdlcykpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRW5kIG9mIGJvb2sgcmVhY2hlZCBhdCBwYWdlICR7dGFyZ2V0UGFnZU51bX0uYCk7XG4gICAgICAgIGlzRW5kT2ZCb29rID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvbVBhZ2VCZWZvcmUgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgaWYgKHRvdGFsUGFnZXMgPiAwICYmIGRvbVBhZ2VCZWZvcmUgIT09IG51bGwgJiYgZG9tUGFnZUJlZm9yZSA+PSB0b3RhbFBhZ2VzICYmIHRhcmdldFBhZ2VOdW0gPiB0b3RhbFBhZ2VzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVuZCBvZiBib29rIHJlYWNoZWQgYXQgcGFnZSAke2RvbVBhZ2VCZWZvcmV9LmApO1xuICAgICAgICBpc0VuZE9mQm9vayA9IHRydWU7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyAyLiBUcmlnZ2VyIHBhZ2UgZmxpcCBvciBjaGVjayBpZiBhbHJlYWR5IHR1cm5lZFxuICAgICAgY29uc3QgYWxyZWFkeVR1cm5lZCA9IGRvbVBhZ2VCZWZvcmUgIT09IG51bGwgJiYgZG9tUGFnZUJlZm9yZSA+PSB0YXJnZXRQYWdlTnVtO1xuXG4gICAgICBpZiAocmV0cnlBdHRlbXB0ID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBSZXRyeSAke3JldHJ5QXR0ZW1wdH06IHJlLXRyaWdnZXJpbmcgZmxpcCB0byBwYWdlICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICBpZiAocmV0cnlBdHRlbXB0ID49IDIgJiYgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2UpIHtcbiAgICAgICAgICAvLyBEaXJlY3QgbmF2aWdhdGlvbiBmYWxsYmFjayBvbiByZXBlYXRlZCBzdGFsbFxuICAgICAgICAgIGF3YWl0IHByb3ZpZGVyLm5hdmlnYXRlVG9QYWdlKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFhbHJlYWR5VHVybmVkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZsaXBwaW5nIHRvIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfSAoYXR0ZW1wdCAxLyR7Y29uZmlnLm1heFJldHJpZXMgKyAxfSkuLi5gKTtcbiAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRE9NIGluZGljYXRlcyBwYWdlIGlzIGFscmVhZHkgb24gc2VxdWVuY2UvbGVhZiAke2RvbVBhZ2VCZWZvcmV9LiBXYWl0aW5nIGZvciBpbWFnZS5gKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gRmFzdCBwb2xsIHdpdGggSFRUUCBlcnJvciByZWplY3Rpb25cbiAgICAgIGNvbnN0IGNoZWNrU3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgdGltZW91dE1zID0gNTAwMDsgLy8gNSBzZWNvbmRzIG1heCBwZXIgZmxpcCBhdHRlbXB0XG4gICAgICBsZXQgbnVkZ2VkID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gY2hlY2tTdGFydCA8IHRpbWVvdXRNcykge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG4gICAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ1JJVElDQUw6IFJlamVjdCBwYWdlIGxvYWQgaWYgYW4gSFRUUCBlcnJvciAoNDI5LCA1MDAsIDQwMSwgZXRjLikgb2NjdXJyZWQhXG4gICAgICAgIGlmIChsYXN0SHR0cEVycm9yICYmIChEYXRlLm5vdygpIC0gbGFzdEh0dHBFcnJvci50aW1lc3RhbXAgPCAxMDAwMCkpIHtcbiAgICAgICAgICBjb25zdCBlcnIgPSBsYXN0SHR0cEVycm9yO1xuICAgICAgICAgIGxhc3RIdHRwRXJyb3IgPSBudWxsOyAvLyBjb25zdW1lIGVycm9yXG4gICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHt0YXJnZXRQYWdlTnVtfSBsb2FkIHJlamVjdGVkIGR1ZSB0byBIVFRQICR7ZXJyLnN0YXR1c0NvZGV9IG9uICR7ZXJyLnVybH1gKTtcblxuICAgICAgICAgIC8vIEluaXRpYXRlIGJhY2tvZmZcbiAgICAgICAgICBhd2FpdCBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVyciwgdGFyZ2V0UGFnZU51bSk7XG5cbiAgICAgICAgICAvLyBSZXN0YXJ0IHBvbGxpbmcgYWZ0ZXIgYmFja29mZlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2FpdGluZyBtb3JlIHRoYW4gMTAwMG1zIHdpdGhvdXQgdGhlIGltYWdlIGFwcGVhcmluZywgc2VuZCBhIG51ZGdlIGZsaXAgYW5kIGRpcmVjdCBqdW1wXG4gICAgICAgIGlmICghbnVkZ2VkICYmIERhdGUubm93KCkgLSBjaGVja1N0YXJ0ID4gMTAwMCkge1xuICAgICAgICAgIG51ZGdlZCA9IHRydWU7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gSW1hZ2Ugbm90IHlldCBjb25maXJtZWQgYWZ0ZXIgMS4wcy4gTnVkZ2luZyBmbGlwL2p1bXAgdG8gcGFnZSAke3RhcmdldFBhZ2VOdW19Li4uYCk7XG4gICAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgIGlmIChwcm92aWRlci5uYXZpZ2F0ZVRvUGFnZSkge1xuICAgICAgICAgICAgYXdhaXQgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2UodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgc2xlZXAoNTApO1xuXG4gICAgICAgIGNvbnN0IGFjdGl2ZUltZyA9IHByb3ZpZGVyLmdldEFjdGl2ZVBhZ2VJbWFnZSgzMDAsIHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICBpZiAoYWN0aXZlSW1nICYmIGFjdGl2ZUltZy5jb21wbGV0ZSAmJiBhY3RpdmVJbWcubmF0dXJhbFdpZHRoID49IDMwMCAmJiBhY3RpdmVJbWcuc3JjKSB7XG4gICAgICAgICAgLy8gRG91YmxlIGNoZWNrIG5vIHBlbmRpbmcgSFRUUCBlcnJvciBiZWZvcmUgYWNjZXB0aW5nIGltYWdlXG4gICAgICAgICAgaWYgKGxhc3RIdHRwRXJyb3IgJiYgKERhdGUubm93KCkgLSBsYXN0SHR0cEVycm9yLnRpbWVzdGFtcCA8IDMwMDApKSB7XG4gICAgICAgICAgICBjb250aW51ZTsgLy8gRG8gbm90IGFjY2VwdCBpbWFnZSB3aGVuIGVycm9yIGlzIHBlbmRpbmchXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaXNOZXdTcmMgPSAhbGFzdFNyYyB8fCBhY3RpdmVJbWcuc3JjICE9PSBsYXN0U3JjO1xuICAgICAgICAgIGNvbnN0IHBhcnNlZFVybFBhZ2UgPSBwYXJzZUFyY2hpdmVJbWFnZVVybFBhZ2UoYWN0aXZlSW1nLnNyYyk7XG5cbiAgICAgICAgICAvLyAxLiBQcmltYXJ5IHZlcmlmaWNhdGlvbjogSW1hZ2UgVVJMIGV4cGxpY2l0bHkgY29udGFpbnMgdGFyZ2V0UGFnZU51bSAoZS5nLiBfMDAzMC50aWYgLT4gMzApXG4gICAgICAgICAgaWYgKHBhcnNlZFVybFBhZ2UgIT09IG51bGwgJiYgcGFyc2VkVXJsUGFnZSA9PT0gdGFyZ2V0UGFnZU51bSkge1xuICAgICAgICAgICAgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICAgICAgICAgICAgY29uc2VjdXRpdmVFcnJvckNvdW50ID0gMDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHt0YXJnZXRQYWdlTnVtfSB2ZXJpZmllZCBmcm9tIFVSTCAoJHthY3RpdmVJbWcubmF0dXJhbFdpZHRofXgke2FjdGl2ZUltZy5uYXR1cmFsSGVpZ2h0fXB4LCBsZWFmICR7cGFyc2VkVXJsUGFnZX0pIWApO1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUltZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZiB0aGUgVVJMIGV4cGxpY2l0bHkgY29udGFpbnMgYSBESUZGRVJFTlQgcGFnZSBudW1iZXIgKGUuZy4gc3RpbGwgc2hvd2luZyBfMDAyOS50aWYpLCByZWplY3QgaXQhXG4gICAgICAgICAgaWYgKHBhcnNlZFVybFBhZ2UgIT09IG51bGwgJiYgcGFyc2VkVXJsUGFnZSAhPT0gdGFyZ2V0UGFnZU51bSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gMi4gU2Vjb25kYXJ5IHZlcmlmaWNhdGlvbjogQ29udGFpbmVyL2RhdGFzZXQgZXhwbGljaXRseSBtYXRjaGVzIHRhcmdldFBhZ2VOdW0gQU5EIGltYWdlIHNyYyBoYXMgY2hhbmdlZFxuICAgICAgICAgIGNvbnN0IGlzVGFyZ2V0U2VxID0gYWN0aXZlSW1nLmRhdGFzZXQuc2VxID09PSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgICAgaWYgKGlzTmV3U3JjICYmIGlzVGFyZ2V0U2VxKSB7XG4gICAgICAgICAgICBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gICAgICAgICAgICBjb25zZWN1dGl2ZUVycm9yQ291bnQgPSAwO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3RhcmdldFBhZ2VOdW19IHZpc2libGUgKCR7YWN0aXZlSW1nLm5hdHVyYWxXaWR0aH14JHthY3RpdmVJbWcubmF0dXJhbEhlaWdodH1weCkhYCk7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlSW1nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDMuIFRlcnRpYXJ5IHZlcmlmaWNhdGlvbjogRE9NIHN0YXR1cyBpbmRpY2F0b3IgKGUuZy4gUGFnZSDigJQgKDU3LzM4NCkpIGNvbmZpcm1zIHRhcmdldFBhZ2VOdW0gQU5EIGltYWdlIHNyYyBjaGFuZ2VkXG4gICAgICAgICAgY29uc3QgZG9tTm93ID0gcHJvdmlkZXIuZ2V0Q3VycmVudFBhZ2UoKTtcbiAgICAgICAgICBpZiAoZG9tTm93ICE9PSBudWxsICYmIGRvbU5vdyA+PSB0YXJnZXRQYWdlTnVtICYmIGlzTmV3U3JjKSB7XG4gICAgICAgICAgICBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gICAgICAgICAgICBjb25zZWN1dGl2ZUVycm9yQ291bnQgPSAwO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3RhcmdldFBhZ2VOdW19IHZpc2libGUgW0RPTSBzdGF0dXMgJHtkb21Ob3d9XSAoJHthY3RpdmVJbWcubmF0dXJhbFdpZHRofXgke2FjdGl2ZUltZy5uYXR1cmFsSGVpZ2h0fXB4KSFgKTtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVJbWc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRpbWVkIG91dCBvciBiYWNrZWQgb2ZmIHdpdGhvdXQgcGFnZSBjaGFuZ2luZzpcbiAgICAgIHJldHJ5QXR0ZW1wdCsrO1xuICAgICAgY3VycmVudFJldHJ5Q291bnQgPSByZXRyeUF0dGVtcHQ7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgZGlkIE5PVCBjaGFuZ2UgYWZ0ZXIgZmxpcCBhdHRlbXB0ICR7cmV0cnlBdHRlbXB0fSBmb3IgcGFnZSAke3RhcmdldFBhZ2VOdW19LiBSZXRyeWluZy4uLmBcbiAgICAgICk7XG5cbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncmV0cnlpbmcnLFxuICAgICAgICByZXRyeUNvdW50OiByZXRyeUF0dGVtcHQsXG4gICAgICAgIHN0YXR1c1RleHQ6IGBSZXRyeWluZyBwYWdlIHR1cm4gKCR7cmV0cnlBdHRlbXB0fS8ke2NvbmZpZy5tYXhSZXRyaWVzfSkuLi5gLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFF1aWNrIGJhY2tvZmYgZGVsYXkgb24gaW5pdGlhbCByZXRyaWVzOiAxcywgMnMsIDNzLi4uIChtYXggNXMpXG4gICAgICBjb25zdCBiYWNrb2ZmU2VjID0gTWF0aC5taW4ocmV0cnlBdHRlbXB0LCA1KTtcbiAgICAgIGF3YWl0IHNsZWVwKGJhY2tvZmZTZWMgKiAxMDAwKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmVycm9yKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZhaWxlZCB0byBmbGlwIHRvIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfSBhZnRlciAke2NvbmZpZy5tYXhSZXRyaWVzfSBhdHRlbXB0cy5gKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWluIGRvd25sb2FkIGFuZCBjYXB0dXJlIG9yY2hlc3RyYXRpb24gbG9vcFxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gc3RhcnREb3dubG9hZCh1c2VyQ29uZmlnPzogUGFydGlhbDxEb3dubG9hZGVyQ29uZmlnPikge1xuICAgIGlmIChpc1J1bm5pbmcgJiYgIWlzUGF1c2VkKSByZXR1cm47XG5cbiAgICBpZiAoaXNQYXVzZWQpIHtcbiAgICAgIHJlc3VtZURvd25sb2FkKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaXNSdW5uaW5nID0gdHJ1ZTtcbiAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIHN0b3BSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gICAgZG93bmxvYWRlZFBhZ2VzID0gMDtcbiAgICBmYWlsZWRQYWdlcyA9IDA7XG4gICAgY29sbGVjdGVkSW1hZ2VzID0gW107XG4gICAgY29sbGVjdGVkVGV4dHMgPSBbXTtcblxuICAgIGlmICh1c2VyQ29uZmlnKSB7XG4gICAgICBjb25maWcgPSB7IC4uLmNvbmZpZywgLi4udXNlckNvbmZpZyB9O1xuICAgIH1cblxuICAgIC8vIFJlZnJlc2ggYm9vayBkZXRlY3Rpb25cbiAgICBhd2FpdCByZWZyZXNoQm9va0luZm8oKTtcblxuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjb25maWcuZW5kUGFnZSB8fCA1MDA7XG4gICAgY29uc3Qgc3RhcnRQID0gdHlwZW9mIGNvbmZpZy5zdGFydFBhZ2UgPT09ICdudW1iZXInXG4gICAgICA/IE1hdGgubWF4KHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UsIGNvbmZpZy5zdGFydFBhZ2UpXG4gICAgICA6IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG5cbiAgICBjb25zdCBtYXhCb29rUGFnZSA9IHByb3ZpZGVyLnNpdGVJZCA9PT0gJ2FyY2hpdmUnICYmIHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UgPT09IDBcbiAgICAgID8gTWF0aC5tYXgoMCwgdG90YWxQYWdlcyAtIDEpXG4gICAgICA6IHRvdGFsUGFnZXM7XG5cbiAgICBjb25zdCBlbmRQID0gY29uZmlnLmVuZFBhZ2UgPiAwXG4gICAgICA/IGNvbmZpZy5lbmRQYWdlXG4gICAgICA6IG1heEJvb2tQYWdlO1xuXG4gICAgY29uc3QgYm9va1RpdGxlID0gYm9va0luZm8/LmJvb2tUaXRsZSB8fCBgJHtwcm92aWRlci5zaXRlTmFtZX0gQm9va2A7XG4gICAgY29uc3QgYm9va0lkID0gYm9va0luZm8/LmJvb2tJZCB8fCAnYm9vayc7XG4gICAgY29uc3Qgc3ViRGlyID0gZm9ybWF0U3ViZGlyKGNvbmZpZy5iYXNlRGlyLCBjb25maWcuZm9sZGVyUGF0dGVybiwgYm9va1RpdGxlLCBib29rSWQpO1xuXG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gU3RhcnRpbmcgZG93bmxvYWQ6IHBhZ2VzICR7c3RhcnRQfSB0byAke2VuZFB9IGludG8gJyR7c3ViRGlyfSdgKTtcblxuICAgIC8vIFN0ZXAgMTogRW5zdXJlIFNpbmdsZS1QYWdlIE1vZGUgaWYgY29uZmlndXJlZCBhbmQgc3VwcG9ydGVkXG4gICAgaWYgKGNvbmZpZy5hdXRvU2luZ2xlUGFnZSAmJiBwcm92aWRlci5lbmZvcmNlU2luZ2xlUGFnZU1vZGUpIHtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnZW5zdXJpbmdfbW9kZScsIHN0YXR1c1RleHQ6ICdTd2l0Y2hpbmcgdG8gMS1wYWdlIG1vZGUuLi4nIH0pO1xuICAgICAgYXdhaXQgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgICBhd2FpdCBzbGVlcCg2MDApO1xuICAgIH1cblxuICAgIC8vIFN0ZXAgMjogQWx3YXlzIG5hdmlnYXRlIHRvIHRoZSBzdGFydGluZyBwYWdlXG4gICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgc3RhdHVzOiAnZG93bmxvYWRpbmcnLFxuICAgICAgY3VycmVudFBhZ2U6IHN0YXJ0UCxcbiAgICAgIHN0YXR1c1RleHQ6IGBOYXZpZ2F0aW5nIHRvIHBhZ2UgJHtzdGFydFB9Li4uYCxcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBOYXZpZ2F0aW5nIHRvIHN0YXJ0aW5nIHBhZ2UvbGVhZiAke3N0YXJ0UH0uLi5gKTtcbiAgICBhd2FpdCBwcm92aWRlci5uYXZpZ2F0ZVRvUGFnZShzdGFydFApO1xuXG4gICAgLy8gR2l2ZSByZWFkZXIgdGltZSB0byBsb2FkIGFuZCByZW5kZXIgc3RhcnRQXG4gICAgYXdhaXQgc2xlZXAoMTIwMCk7XG5cbiAgICBsZXQgbGFzdEltZ1NyYyA9ICcnO1xuICAgIGxldCBjdXJyZW50SW1nOiBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBwYWdlTnVtID0gc3RhcnRQOyBwYWdlTnVtIDw9IGVuZFA7IHBhZ2VOdW0rKykge1xuICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIGJyZWFrO1xuXG4gICAgICBjdXJyZW50UGFnZSA9IHBhZ2VOdW07XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogJ2Rvd25sb2FkaW5nJyxcbiAgICAgICAgY3VycmVudFBhZ2UsXG4gICAgICAgIHN0YXR1c1RleHQ6IGBDYXB0dXJpbmcgcGFnZSAke3BhZ2VOdW19YCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBGb3IgdGhlIGZpcnN0IHBhZ2UgKG9yIHJlY292ZXJ5KSwgd2FpdCBmb3IgdGhlIGltYWdlIHRvIGJlIHJlYWR5XG4gICAgICBpZiAoIWN1cnJlbnRJbWcpIHtcbiAgICAgICAgY29uc3Qgd2FpdEltYWdlU3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHdhaXRJbWFnZVN0YXJ0IDwgMTUwMDApIHtcbiAgICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgYnJlYWs7XG4gICAgICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgYnJlYWs7XG4gICAgICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGN1cnJlbnRJbWcgPSBwcm92aWRlci5nZXRBY3RpdmVQYWdlSW1hZ2UoMzAwLCBwYWdlTnVtKTtcbiAgICAgICAgICBpZiAoY3VycmVudEltZykgYnJlYWs7XG4gICAgICAgICAgYXdhaXQgc2xlZXAoMTUwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWN1cnJlbnRJbWcpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHtwYWdlTnVtfSBpbWFnZSB0aW1lZCBvdXQuYCk7XG4gICAgICAgIGZhaWxlZFBhZ2VzKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwYWdlVG9Qcm9jZXNzID0gcGFnZU51bTtcbiAgICAgICAgY29uc3QgcGFnZUltZyA9IGN1cnJlbnRJbWc7XG4gICAgICAgIGNvbnN0IHBhZ2VJbWdTcmMgPSBjdXJyZW50SW1nLnNyYztcbiAgICAgICAgbGFzdEltZ1NyYyA9IHBhZ2VJbWdTcmM7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHBhZ2UgZGltZW5zaW9uc1xuICAgICAgICBsZXQgcGFnZVcgPSBwYWdlSW1nLm5hdHVyYWxXaWR0aCB8fCBwYWdlSW1nLndpZHRoIHx8IDA7XG4gICAgICAgIGxldCBwYWdlSCA9IHBhZ2VJbWcubmF0dXJhbEhlaWdodCB8fCBwYWdlSW1nLmhlaWdodCB8fCAwO1xuICAgICAgICBpZiAoY29uZmlnLm1heFBhZ2VIZWlnaHQgJiYgY29uZmlnLm1heFBhZ2VIZWlnaHQgPiAwICYmIHBhZ2VIID4gY29uZmlnLm1heFBhZ2VIZWlnaHQpIHtcbiAgICAgICAgICBwYWdlVyA9IE1hdGgucm91bmQocGFnZVcgKiAoY29uZmlnLm1heFBhZ2VIZWlnaHQgLyBwYWdlSCkpO1xuICAgICAgICAgIHBhZ2VIID0gY29uZmlnLm1heFBhZ2VIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGltZW5zaW9ucyA9IHsgd2lkdGg6IHBhZ2VXLCBoZWlnaHQ6IHBhZ2VIIH07XG4gICAgICAgIGxhc3REaW1lbnNpb25zID0gZGltZW5zaW9ucztcblxuICAgICAgICAvLyBHUkFCIE5FWFQgUEFHRSBJTU1FRElBVEVMWTogVHJpZ2dlciB0aGUgZmxpcCB0byBwYWdlTnVtICsgMSByaWdodCBub3chXG4gICAgICAgIGNvbnN0IG5leHRUdXJuUHJvbWlzZSA9IChwYWdlTnVtIDwgZW5kUCAmJiAhc3RvcFJlcXVlc3RlZClcbiAgICAgICAgICA/IHR1cm5BbmRHZXROZXh0SW1hZ2UocGFnZUltZ1NyYywgcGFnZU51bSArIDEpXG4gICAgICAgICAgOiBudWxsO1xuXG4gICAgICAgIC8vIENvbmN1cnJlbnRseSBjYXB0dXJlIGltYWdlIGRhdGEgYW5kIGV4dHJhY3QgT0NSIHRleHQgZm9yIHBhZ2VUb1Byb2Nlc3NcbiAgICAgICAgY29uc3QgY2FwdHVyZVByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBbZGF0YVVybCwgdGV4dF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgIGNhcHR1cmVJbWFnZVRvRGF0YVVybChwYWdlSW1nLCBjb25maWcuaW1hZ2VRdWFsaXR5LCBjb25maWcubWF4UGFnZUhlaWdodCksXG4gICAgICAgICAgICAgIGNvbmZpZy5zYXZlVGV4dE1kID8gKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgbGV0IHQgPSBhd2FpdCBwcm92aWRlci5leHRyYWN0UGFnZVRleHQocGFnZVRvUHJvY2VzcywgcGFnZUltZyk7XG4gICAgICAgICAgICAgICAgICBpZiAobGFzdEh0dHBFcnJvciAmJiAoRGF0ZS5ub3coKSAtIGxhc3RIdHRwRXJyb3IudGltZXN0YW1wIDwgMzAwMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbGFzdEh0dHBFcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgbGFzdEh0dHBFcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBPQ1IgdGV4dCBmZXRjaCBmb3IgcGFnZSAke3BhZ2VUb1Byb2Nlc3N9IGVuY291bnRlcmVkIEhUVFAgJHtlcnIuc3RhdHVzQ29kZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlSHR0cEVycm9yQmFja29mZihlcnIsIHBhZ2VUb1Byb2Nlc3MpO1xuICAgICAgICAgICAgICAgICAgICB0ID0gYXdhaXQgcHJvdmlkZXIuZXh0cmFjdFBhZ2VUZXh0KHBhZ2VUb1Byb2Nlc3MsIHBhZ2VJbWcpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgZXh0cmFjdCB0ZXh0IGZvciBwYWdlICR7cGFnZVRvUHJvY2Vzc306YCwgZXJyKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKCkgOiBQcm9taXNlLnJlc29sdmUoJycpLFxuICAgICAgICAgICAgXSk7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIGZvciBQREYgY29tcGlsZXIgKGRlZHVwbGljYXRlIGJ5IHBhZ2VOdW0pXG4gICAgICAgICAgICBpZiAoY29uZmlnLmdlbmVyYXRlUGRmKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSWR4ID0gY29sbGVjdGVkSW1hZ2VzLmZpbmRJbmRleChpID0+IGkucGFnZU51bSA9PT0gcGFnZVRvUHJvY2Vzcyk7XG4gICAgICAgICAgICAgIGlmIChleGlzdGluZ0lkeCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkSW1hZ2VzW2V4aXN0aW5nSWR4XSA9IHtcbiAgICAgICAgICAgICAgICAgIHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsXG4gICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhVXJsLFxuICAgICAgICAgICAgICAgICAgd2lkdGg6IHBhZ2VXLFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYWdlSCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZEltYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsXG4gICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhVXJsLFxuICAgICAgICAgICAgICAgICAgd2lkdGg6IHBhZ2VXLFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYWdlSCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb3dubG9hZGVkUGFnZXMgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICAvLyBTYXZlIGluZGl2aWR1YWwgaW1hZ2UgZmlsZSBpZiBjb25maWd1cmVkXG4gICAgICAgICAgICBpZiAoY29uZmlnLnNhdmVJbWFnZXMpIHtcbiAgICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdET1dOTE9BRF9QQUdFX0lNQUdFJyxcbiAgICAgICAgICAgICAgICBib29rVGl0bGUsXG4gICAgICAgICAgICAgICAgcGFnZU51bTogcGFnZVRvUHJvY2VzcyxcbiAgICAgICAgICAgICAgICB0b3RhbFBhZ2VzOiBlbmRQLFxuICAgICAgICAgICAgICAgIGRhdGFVcmwsXG4gICAgICAgICAgICAgICAgc3ViRGlyLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3RvcmUgT0NSIHRleHRcbiAgICAgICAgICAgIGlmIChjb25maWcuc2F2ZVRleHRNZCAmJiB0ZXh0KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVGV4dElkeCA9IGNvbGxlY3RlZFRleHRzLmZpbmRJbmRleCh0ID0+IHQucGFnZU51bSA9PT0gcGFnZVRvUHJvY2Vzcyk7XG4gICAgICAgICAgICAgIGlmIChleGlzdGluZ1RleHRJZHggPj0gMCkge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZFRleHRzW2V4aXN0aW5nVGV4dElkeF0gPSB7IHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsIGxlYWZJbmRleDogcGFnZVRvUHJvY2VzcywgdGV4dCB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RlZFRleHRzLnB1c2goeyBwYWdlTnVtOiBwYWdlVG9Qcm9jZXNzLCBsZWFmSW5kZXg6IHBhZ2VUb1Byb2Nlc3MsIHRleHQgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICAgICAgICBjdXJyZW50UGFnZTogcGFnZVRvUHJvY2VzcyxcbiAgICAgICAgICAgICAgZG93bmxvYWRlZFBhZ2VzLFxuICAgICAgICAgICAgICBjdXJyZW50VGh1bWJuYWlsOiBkYXRhVXJsLFxuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiBgQ2FwdHVyaW5nIHBhZ2UgJHtwYWdlVG9Qcm9jZXNzfWAsXG4gICAgICAgICAgICAgIGltYWdlRGltZW5zaW9uczogZGltZW5zaW9ucyxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGZhaWxlZFBhZ2VzKys7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVycm9yIHByb2Nlc3NpbmcgcGFnZSAke3BhZ2VUb1Byb2Nlc3N9OmAsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KSgpO1xuXG4gICAgICAgIC8vIEF3YWl0IGN1cnJlbnQgcGFnZSBjYXB0dXJlIGFuZCBzdG9yYWdlXG4gICAgICAgIGF3YWl0IGNhcHR1cmVQcm9taXNlO1xuXG4gICAgICAgIC8vIElmIG5vdCB0aGUgbGFzdCBwYWdlLCB3YWl0IGZvciB0aGUgbmV4dCBwYWdlIGZsaXAgdG8gcmVzb2x2ZVxuICAgICAgICBpZiAobmV4dFR1cm5Qcm9taXNlKSB7XG4gICAgICAgICAgY29uc3QgbmV4dEltZyA9IGF3YWl0IG5leHRUdXJuUHJvbWlzZTtcbiAgICAgICAgICBpZiAoIW5leHRJbWcpIHtcbiAgICAgICAgICAgIGlmIChpc0VuZE9mQm9vaykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBSZWFjaGVkIGVuZCBvZiBib29rIGF0IHBhZ2UgJHtwYWdlTnVtfS4gRmluYWxpemluZy5gKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZhaWxlZCBhZnRlciByZXRyaWVzOiBwcm9tcHQgdXNlciB0byBzYXZlIGNhcHR1cmVkIHBhZ2VzIVxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIENvdWxkIG5vdCB0dXJuIHBhc3QgcGFnZSAke3BhZ2VOdW19LiBQcm9tcHRpbmcgdXNlciB0byBzYXZlLmApO1xuICAgICAgICAgICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICAgICAgICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlU3RvcFJlcXVlc3QoYENhbm5vdCBjb250aW51ZSBwYXN0IHBhZ2UgJHtwYWdlTnVtfS4gU2F2ZSBhbGwgJHtjb3VudH0gcGFnZXMgZG93bmxvYWRlZCBzbyBmYXI/YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBOZXh0IHBhZ2UgaXMgcmVhZHkgZm9yIHRoZSBuZXh0IGl0ZXJhdGlvbiFcbiAgICAgICAgICBjdXJyZW50SW1nID0gbmV4dEltZztcblxuICAgICAgICAgIC8vIFN5bmNocm9uaXplIHBhZ2UgY291bnRlciBpZiB2aWV3ZXIgaXMgYWhlYWQgKEFyY2hpdmUub3JnIGxlYWYtanVtcGluZylcbiAgICAgICAgICBpZiAocHJvdmlkZXIuc2l0ZUlkICE9PSAnaGF0aGl0cnVzdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGRvbVBhZ2VOb3cgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgICAgICAgaWYgKGRvbVBhZ2VOb3cgIT09IG51bGwgJiYgZG9tUGFnZU5vdyA+IHBhZ2VOdW0pIHtcbiAgICAgICAgICAgICAgcGFnZU51bSA9IGRvbVBhZ2VOb3cgLSAxOyAvLyBwYWdlTnVtKysgaW4gdGhlIGZvci1sb29wIHdpbGwgc2V0IHBhZ2VOdW0gPSBkb21QYWdlTm93XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gV3JhcC11cDogR2VuZXJhdGUgUERGIGFuZCBNYXJrZG93biBmaWxlc1xuICAgIGlmICghc3RvcFJlcXVlc3RlZCAmJiBkb3dubG9hZGVkUGFnZXMgPiAwKSB7XG4gICAgICBhd2FpdCBmaW5hbGl6ZUJvb2soc3ViRGlyLCBib29rVGl0bGUpO1xuICAgIH1cblxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogc3RvcFJlcXVlc3RlZCA/ICdpZGxlJyA6ICdjb21wbGV0ZScsXG4gICAgICBzdGF0dXNUZXh0OiBzdG9wUmVxdWVzdGVkID8gJ1N0b3BwZWQgYnkgdXNlcicgOiBgQ29tcGxldGVkISBTYXZlZCAke2Rvd25sb2FkZWRQYWdlc30gcGFnZXMuYCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlcyBhbmQgdHJpZ2dlcnMgZG93bmxvYWQgZm9yIHRoZSBmaW5hbCBQREYgYW5kIE1hcmtkb3duIHRleHQgZG9jdW1lbnQuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBmaW5hbGl6ZUJvb2soc3ViRGlyOiBzdHJpbmcsIGJvb2tUaXRsZTogc3RyaW5nKSB7XG4gICAgLy8gMS4gQ29tcGlsZSBQREZcbiAgICBpZiAoY29uZmlnLmdlbmVyYXRlUGRmICYmIGNvbGxlY3RlZEltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2NvbXBpbGluZ19wZGYnLCBzdGF0dXNUZXh0OiAnQ29tcGlsaW5nIFBERiBkb2N1bWVudC4uLicgfSk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBBc3NlbWJsaW5nIFBERiBmcm9tJywgY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCwgJ3BhZ2VzLi4uJyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBkZkJ5dGVzID0gY29tcGlsZUpwZWdzVG9QZGYoY29sbGVjdGVkSW1hZ2VzLCB7XG4gICAgICAgICAgdGl0bGU6IGJvb2tUaXRsZSxcbiAgICAgICAgICBhdXRob3I6IGJvb2tJbmZvPy5hdXRob3IgfHwgcHJvdmlkZXIuc2l0ZU5hbWUsXG4gICAgICAgICAgY3JlYXRvcjogJ0FyY2hpdmUgRG93bmxvYWRlcicsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBkZkJsb2IgPSBuZXcgQmxvYihbcGRmQnl0ZXNdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9wZGYnIH0pO1xuICAgICAgICBjb25zdCBwZGZCbG9iVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChwZGZCbG9iKTtcblxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ1NBVkVfRklOQUxfRklMRVMnLFxuICAgICAgICAgIGJvb2tUaXRsZSxcbiAgICAgICAgICBzdWJEaXIsXG4gICAgICAgICAgcGRmQmxvYlVybCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gUERGIGNvbXBpbGVkIGFuZCBzZW50IGZvciBkb3dubG9hZCEnKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbQXJjaGl2ZURvd25sb2FkZXJdIEZhaWxlZCB0byBjb21waWxlIFBERjonLCBlcnIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIFNhdmUgTWFya2Rvd24gdGV4dFxuICAgIGlmIChjb25maWcuc2F2ZVRleHRNZCkge1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdzYXZpbmdfdGV4dCcsIHN0YXR1c1RleHQ6ICdTYXZpbmcgTWFya2Rvd24gdGV4dC4uLicgfSk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBBc3NlbWJsaW5nIE1hcmtkb3duIGZyb20nLCBjb2xsZWN0ZWRUZXh0cy5sZW5ndGgsICdwYWdlIHRleHRzLi4uJyk7XG5cbiAgICAgIGNvbnN0IG1kQ29udGVudCA9IGJ1aWxkQm9va01hcmtkb3duKFxuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6IGJvb2tUaXRsZSxcbiAgICAgICAgICBib29rSWQ6IGJvb2tJbmZvPy5ib29rSWQgfHwgJ2Jvb2snLFxuICAgICAgICAgIGF1dGhvcjogYm9va0luZm8/LmF1dGhvcixcbiAgICAgICAgICBwdWJsaXNoZXI6IGJvb2tJbmZvPy5wdWJsaXNoZXIsXG4gICAgICAgICAgeWVhcjogYm9va0luZm8/LnllYXIsXG4gICAgICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgICB0b3RhbFBhZ2VzOiBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjdXJyZW50UGFnZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29sbGVjdGVkVGV4dHNcbiAgICAgICk7XG5cbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ1NBVkVfRklOQUxfRklMRVMnLFxuICAgICAgICBib29rVGl0bGUsXG4gICAgICAgIHN1YkRpcixcbiAgICAgICAgbWFya2Rvd25Db250ZW50OiBtZENvbnRlbnQsXG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gTWFya2Rvd24gZ2VuZXJhdGVkIGFuZCBzZW50IGZvciBkb3dubG9hZCEnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwYXVzZURvd25sb2FkKCkge1xuICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3BhdXNlZCcsIHN0YXR1c1RleHQ6ICdEb3dubG9hZCBwYXVzZWQnIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzdW1lRG93bmxvYWQoKSB7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2Rvd25sb2FkaW5nJywgc3RhdHVzVGV4dDogYFJlc3VtaW5nIHBhZ2UgJHtjdXJyZW50UGFnZX0uLi5gIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudDogbnVtYmVyKSB7XG4gICAgc3RvcFJlcXVlc3RlZCA9IHRydWU7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6ICdjb21waWxpbmdfcGRmJyxcbiAgICAgIHN0YXR1c1RleHQ6IGBTYXZpbmcgJHtjb3VudH0gY2FwdHVyZWQgcGFnZXMuLi5gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYm9va1RpdGxlID0gYm9va0luZm8/LmJvb2tUaXRsZSB8fCBgJHtwcm92aWRlci5zaXRlTmFtZX0gQm9va2A7XG4gICAgY29uc3QgYm9va0lkID0gYm9va0luZm8/LmJvb2tJZCB8fCAnYm9vayc7XG4gICAgY29uc3Qgc3ViRGlyID0gZm9ybWF0U3ViZGlyKGNvbmZpZy5iYXNlRGlyLCBjb25maWcuZm9sZGVyUGF0dGVybiwgYm9va1RpdGxlLCBib29rSWQpO1xuXG4gICAgYXdhaXQgZmluYWxpemVCb29rKHN1YkRpciwgYm9va1RpdGxlKTtcblxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogJ2NvbXBsZXRlJyxcbiAgICAgIGRvd25sb2FkZWRQYWdlczogY291bnQsXG4gICAgICBzdGF0dXNUZXh0OiBgQ29tcGxldGVkISBTYXZlZCAke2NvdW50fSBwYWdlcy5gLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3RvcFJlcXVlc3QoY3VzdG9tTWVzc2FnZT86IHN0cmluZykge1xuICAgIGlmICghaXNSdW5uaW5nKSB7XG4gICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgIC8vIFRlbXBvcmFyaWx5IHBhdXNlIHRoZSBkb3dubG9hZCBjeWNsZSB3aGlsZSB1c2VyIGRlY2lkZXNcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICAgICAgc3RhdHVzVGV4dDogY3VzdG9tTWVzc2FnZSB8fCBgUGF1c2VkOiBTYXZlICR7Y291bnR9IHBhZ2VzP2AsXG4gICAgICB9KTtcblxuICAgICAgcGlsbC5zaG93U3RvcFByb21wdChcbiAgICAgICAgY291bnQsXG4gICAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAvLyBZRVM6IFNhdmUgZXZlcnl0aGluZyBhbmQgdHJlYXQgbGlrZSBjb21wbGV0ZSFcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBVc2VyIGNvbmZpcm1lZCBzYXZpbmcgJHtjb3VudH0gcGFnZXMuYCk7XG4gICAgICAgICAgYXdhaXQgc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudCk7XG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBESVNDQVJEXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gVXNlciBkaXNjYXJkZWQgZG93bmxvYWRzIG9uIHN0b3AuJyk7XG4gICAgICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBDQU5DRUwgLyBSRVNVTUVcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBSZXN1bWluZyBkb3dubG9hZC4uLicpO1xuICAgICAgICAgIHJlc3VtZURvd25sb2FkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3BEb3dubG9hZCgpIHtcbiAgICBzdG9wUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIGNvbGxlY3RlZEltYWdlcyA9IFtdO1xuICAgIGNvbGxlY3RlZFRleHRzID0gW107XG4gICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdpZGxlJywgc3RhdHVzVGV4dDogJ0Rvd25sb2FkIHN0b3BwZWQnIH0pO1xuICB9XG5cbiAgLy8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gUG9wdXAgb3IgQmFja2dyb3VuZCBTZXJ2aWNlIFdvcmtlclxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IEV4dGVuc2lvbk1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ0dFVF9TVEFURSc6IHtcbiAgICAgICAgYnJvYWRjYXN0U3RhdGUoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgYm9va0luZm8gfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTVEFSVF9ET1dOTE9BRCc6IHtcbiAgICAgICAgc3RhcnREb3dubG9hZChtZXNzYWdlLmNvbmZpZyk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdQQVVTRV9ET1dOTE9BRCc6IHtcbiAgICAgICAgcGF1c2VEb3dubG9hZCgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnUkVTVU1FX0RPV05MT0FEJzoge1xuICAgICAgICByZXN1bWVEb3dubG9hZCgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RPUF9BTkRfU0FWRSc6IHtcbiAgICAgICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICAgICAgaWYgKGlzUnVubmluZyAmJiBjb3VudCA+IDApIHtcbiAgICAgICAgICBzYXZlUGFydGlhbEFuZENvbXBsZXRlKGNvdW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgICAgfVxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RPUF9ET1dOTE9BRCc6IHtcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc2F2ZUNvbGxlY3RlZCkge1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCB8fCBkb3dubG9hZGVkUGFnZXM7XG4gICAgICAgICAgaWYgKGlzUnVubmluZyAmJiBjb3VudCA+IDApIHtcbiAgICAgICAgICAgIHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQpO1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NXSVRDSF9UT19TSU5HTEVfUEFHRSc6IHtcbiAgICAgICAgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTQVZFX0NPTkZJRyc6IHtcbiAgICAgICAgc2F2ZUNvbmZpZyhtZXNzYWdlLmNvbmZpZyk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0dFVF9DT05GSUcnOiB7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0hUVFBfRVJST1JfREVURUNURUQnOiB7XG4gICAgICAgIG9uSHR0cEVycm9yUmVjZWl2ZWQobWVzc2FnZS5zdGF0dXNDb2RlLCBtZXNzYWdlLnVybCwgbWVzc2FnZS5yZXRyeUFmdGVyKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn0pKCk7XG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBOEJPLE1BQU0sYUFBYTtBQUFBLEVBQ2hCLFlBQWdDO0FBQUEsRUFDaEMsV0FBVztBQUFBLEVBQ1gsaUJBQWlCO0FBQUEsRUFDakIsbUJBQW1CO0FBQUEsRUFDbkIsWUFBMkIsQ0FBQztBQUFBLEVBQzVCLGdCQUEyQyxDQUFDO0FBQUEsRUFFcEQsV0FBVyxDQUFDLFlBQTJCLENBQUMsR0FBRztBQUFBLElBQ3pDLEtBQUssWUFBWTtBQUFBO0FBQUEsRUFHWixZQUFZLEdBQVk7QUFBQSxJQUM3QixNQUFNLFlBQVksT0FBTyxTQUFTLFNBQVMsU0FBUyxhQUFhLEtBQy9DLE9BQU8sU0FBUyxTQUFTLFNBQVMsV0FBVztBQUFBLElBQy9ELE1BQU0sVUFBVSxPQUFPLFNBQVMsYUFBYSwwQkFDNUIsT0FBTyxTQUFTLFNBQVMsU0FBUyxnQkFBZ0IsS0FBSyxPQUFPLFNBQVMsU0FBUyxXQUFXLFNBQVM7QUFBQSxJQUNySCxPQUFPLGFBQWE7QUFBQTtBQUFBLEVBR2YsTUFBTSxHQUFTO0FBQUEsSUFDcEIsSUFBSSxDQUFDLEtBQUssYUFBYTtBQUFBLE1BQUc7QUFBQSxJQUMxQixJQUFJLEtBQUs7QUFBQSxNQUFXO0FBQUEsSUFFcEIsTUFBTSxPQUFPLFNBQVMsY0FBYyxLQUFLO0FBQUEsSUFDekMsS0FBSyxLQUFLO0FBQUEsSUFDVixLQUFLLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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LE1BQU0sU0FBUyxDQUFDO0FBQUEsUUFDeEM7QUFBQSxNQUNGO0FBQUEsV0FFSyxrQkFBa0I7QUFBQSxRQUNyQixjQUFjLFFBQVEsTUFBTTtBQUFBLFFBQzVCLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBLFdBRUssa0JBQWtCO0FBQUEsUUFDckIsY0FBYztBQUFBLFFBQ2QsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyxtQkFBbUI7QUFBQSxRQUN0QixlQUFlO0FBQUEsUUFDZixhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLGlCQUFpQjtBQUFBLFFBQ3BCLE1BQU0sUUFBUSxnQkFBZ0IsVUFBVTtBQUFBLFFBQ3hDLElBQUksYUFBYSxRQUFRLEdBQUc7QUFBQSxVQUMxQix1QkFBdUIsS0FBSztBQUFBLFFBQzlCLEVBQU87QUFBQSxVQUNMLGFBQWE7QUFBQTtBQUFBLFFBRWYsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyxpQkFBaUI7QUFBQSxRQUNwQixJQUFJLFFBQVEsZUFBZTtBQUFBLFVBQ3pCLE1BQU0sUUFBUSxnQkFBZ0IsVUFBVTtBQUFBLFVBQ3hDLElBQUksYUFBYSxRQUFRLEdBQUc7QUFBQSxZQUMxQix1QkFBdUIsS0FBSztBQUFBLFlBQzVCLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFlBQzlCO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBLGFBQWE7QUFBQSxRQUNiLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBLFdBRUsseUJBQXlCO0FBQUEsUUFDNUIsc0JBQXNCO0FBQUEsUUFDdEIsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyxlQUFlO0FBQUEsUUFDbEIsV0FBVyxRQUFRLE1BQU07QUFBQSxRQUN6QixhQUFhLEVBQUUsU0FBUyxNQUFNLE9BQU8sQ0FBQztBQUFBLFFBQ3RDO0FBQUEsTUFDRjtBQUFBLFdBRUssY0FBYztBQUFBLFFBQ2pCLGFBQWEsRUFBRSxTQUFTLE1BQU0sT0FBTyxDQUFDO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQUEsV0FFSyx1QkFBdUI7QUFBQSxRQUMxQixvQkFBb0IsUUFBUSxZQUFZLFFBQVEsS0FBSyxRQUFRLFVBQVU7QUFBQSxRQUN2RSxhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQTtBQUFBLElBRUYsT0FBTztBQUFBLEdBQ1I7QUFBQSxHQUNBOyIsCiAgImRlYnVnSWQiOiAiQkVDQjgyQjgwOEQxNTEwNjY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
