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
    const currentSpan = document.querySelector('.BRcurrentpage, [role="status"], .page-number, .BRpager-counter');
    if (currentSpan && currentSpan.textContent) {
      const match = currentSpan.textContent.match(/\((\d+)(?:\s*-\s*\d+)?\s*\/\s*(\d+)\)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      const simpleMatch = currentSpan.textContent.match(/\((\d+)\s*\//);
      if (simpleMatch) {
        return parseInt(simpleMatch[1], 10);
      }
      const ofMatch = currentSpan.textContent.match(/(\d+)\s+of\s+(\d+)/i);
      if (ofMatch) {
        return parseInt(ofMatch[1], 10);
      }
      const slashMatch = currentSpan.textContent.match(/\/\s*(\d+)/);
      if (slashMatch) {
        return parseInt(slashMatch[1], 10);
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
    if (typeof targetPageNum === "number") {
      const targetSelectors = [
        `.BRpagecontainer[data-index="${targetPageNum}"] img`,
        `.pagediv${targetPageNum} img`,
        `[data-index="${targetPageNum}"] img`,
        `.BRpage[data-page="${targetPageNum}"] img`,
        `.BRpage[data-leaf="${targetPageNum}"] img`,
        `#pagediv${targetPageNum} img`,
        `#page${targetPageNum} img`,
        `img[data-seq="${targetPageNum}"]`
      ];
      for (const sel of targetSelectors) {
        const el = document.querySelector(sel);
        if (el && el.complete && el.naturalWidth >= minWidth && el.src) {
          el.dataset.seq = String(targetPageNum);
          return el;
        }
      }
    }
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
      const match = valid.find((img) => {
        if (img.dataset.seq === String(targetPageNum))
          return true;
        const container = img.closest(".BRpagecontainer, .BRpage, [data-index], [data-page]");
        if (container) {
          const idx = container.getAttribute("data-index") || container.getAttribute("data-page") || container.getAttribute("data-leaf");
          if (idx === String(targetPageNum))
            return true;
          if (container.classList.contains(`pagediv${targetPageNum}`) || container.classList.contains(`p${targetPageNum}`))
            return true;
        }
        return false;
      });
      if (match) {
        match.dataset.seq = String(targetPageNum);
        return match;
      }
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
    if (bestImg) {
      if (typeof targetPageNum === "number") {
        bestImg.dataset.seq = String(targetPageNum);
      }
      return bestImg;
    }
    const fallback = valid[valid.length - 1];
    if (fallback && typeof targetPageNum === "number") {
      fallback.dataset.seq = String(targetPageNum);
    }
    return fallback;
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
        if (!nudged && Date.now() - checkStart > 1500) {
          nudged = true;
          console.log(`[ArchiveDownloader] Image not yet confirmed after 1.5s. Re-triggering flip for page ${targetPageNum}...`);
          await provider.triggerPageFlip(targetPageNum);
        }
        await sleep(50);
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

//# debugId=EE078FBED5E7159D64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvcGlsbC50cyIsICIuLi9zcmMvdXRpbHMvbWFya2Rvd24tYnVpbGRlci50cyIsICIuLi9zcmMvdXRpbHMvcGRmLWJ1aWxkZXIudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0aXplci50cyIsICIuLi9zcmMvcHJvdmlkZXJzL2FyY2hpdmUtcHJvdmlkZXIudHMiLCAiLi4vc3JjL3Byb3ZpZGVycy9oYXRoaXRydXN0LXByb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcm92aWRlcnMvaW5kZXgudHMiLCAiLi4vc3JjL2NvbnRlbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiLyoqXG4gKiBGbG9hdGluZyBQcm9ncmVzcyBQaWxsIE92ZXJsYXkgZm9yIEFyY2hpdmUub3JnXG4gKiBPTkxZIGFwcGVhcnMgb24gaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLypcbiAqXG4gKiBGZWF0dXJlczpcbiAqIC0gQ29nIGljb24gYnV0dG9uICjimpkpIHRvIG9wZW4gZXhwYW5kYWJsZSBpbi1wYWdlIFNldHRpbmdzIHRyYXlcbiAqIC0gU2V0dGluZ3MgKHNhdmUgcGF0aCwgZm9sZGVyIHBhdHRlcm4sIHN0YXJ0L2VuZCBwYWdlcykgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlXG4gKiAtIFNxdWFyZSwgZnVsbC1oZWlnaHQgYnV0dG9ucyB3aXRoIG5vIGN1cnZhdHVyZSAoanVzdCBsaW5lIG91dGxpbmUpXG4gKiAtIFvinJVdIGJ1dHRvbiB0aGF0IHNocmlua3MgcGlsbCB0byBhIHNtYWxsIGRvY2tlZCBib29rIGljb24gb24gdGhlIGZhciBsZWZ0IGVkZ2Ugb2YgdGhlIHNjcmVlblxuICogLSBDbGlja2luZyB0aGUgZG9ja2VkIGJvb2sgaWNvbiByZXN0b3JlcyB0aGUgcGlsbFxuICogLSBJbWFnZSBkaW1lbnNpb25zIGluIHNtYWxsIGdyZXkgbGV0dGVycyBiZWxvdyBzdGF0dXM6XG4gKiAgIFwiQ2FwdHVyaW5nIHBhZ2UgMTRcIlxuICogICBcIihpbWFnZTogMjU4MCB4IDM5MTUpXCJcbiAqIC0gW0NPTlRJTlVFXSBidXR0b24gd2hlbiBzdGFsbGVkIG9yIGNvbm5lY3Rpb24gZHJvcHNcbiAqIC0gSW50ZXJhY3RpdmUgU3RvcCBjb25maXJtYXRpb24gcHJvbXB0IHRvIHNhdmUgY2FwdHVyZWQgcGFnZXMgc28gZmFyXG4gKiAtIFwiRG93bmxvYWRlZDogVmlldyBGaWxlc1wiIGJ1dHRvbiBvbiBjb21wbGV0aW9uIHRoYXQgb3BlbnMgdGhlIGRvd25sb2FkZWQgZmlsZS9mb2xkZXJcbiAqL1xuXG5pbXBvcnQgeyBEb3dubG9hZGVyQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpbGxDYWxsYmFja3Mge1xuICBvblN0YXJ0PzogKCkgPT4gdm9pZDtcbiAgb25QYXVzZT86ICgpID0+IHZvaWQ7XG4gIG9uUmVzdW1lPzogKCkgPT4gdm9pZDtcbiAgb25TdG9wPzogKCkgPT4gdm9pZDtcbiAgb25TYXZlU2V0dGluZ3M/OiAoc2V0dGluZ3M6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pID0+IHZvaWQ7XG4gIG9uU3dpdGNoTW9kZT86ICgpID0+IHZvaWQ7XG4gIG9uVmlld0ZpbGU/OiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgRmxvYXRpbmdQaWxsIHtcbiAgcHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNEb2NrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc1NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzQ29uZmlybWluZ1N0b3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFBpbGxDYWxsYmFja3MgPSB7fTtcbiAgcHJpdmF0ZSBjdXJyZW50Q29uZmlnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+ID0ge307XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzOiBQaWxsQ2FsbGJhY2tzID0ge30pIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgfVxuXG4gIHB1YmxpYyBzaG91bGRSZW5kZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNBcmNoaXZlID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluY2x1ZGVzKCcvZGV0YWlscy8nKTtcbiAgICBjb25zdCBpc0JhYmVsID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnYmFiZWwuaGF0aGl0cnVzdC5vcmcnIHx8XG4gICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzQXJjaGl2ZSB8fCBpc0JhYmVsO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkUmVuZGVyKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwaWxsLmlkID0gJ2FyY2hpdmUtZG93bmxvYWRlci1waWxsJztcbiAgICBwaWxsLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgI2FyY2hpdmUtZG93bmxvYWRlci1waWxsIHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiAxNHB4O1xuICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE4LCAxOCwgMTgsIDAuOTYpO1xuICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICAtd2Via2l0LWJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgOHB4IDMycHggcmdiYSgwLCAwLCAwLCAwLjY1KTtcbiAgICAgICAgICBjb2xvcjogI2YxZjFmMTtcbiAgICAgICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBlYXNlLCBvcGFjaXR5IDAuMjVzIGVhc2U7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgbWF4LXdpZHRoOiA5NXZ3O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBEb2NrZWQgdG8gZmFyIGxlZnQgb2Ygd2luZG93ICovXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCB7XG4gICAgICAgICAgbGVmdDogMCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRvcDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRyYW5zZm9ybTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIGJvcmRlci1sZWZ0OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMCA2cHggNnB4IDAgIWltcG9ydGFudDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICBib3gtc2hhZG93OiAycHggNHB4IDE2cHggcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtbWFpbi1ib2R5LFxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtc2V0dGluZ3MtcGFuZWwge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgfVxuXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCAucGlsbC1kb2NrLWljb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIGltZyB7XG4gICAgICAgICAgd2lkdGg6IDI0cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLW1haW4tYm9keSB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDQ4cHg7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBDb2cgc2V0dGluZ3MgYnV0dG9uIHJlcGxhY2luZyB0aGUgc3RhdGljIGxvZ28gKi9cbiAgICAgICAgLnBpbGwtY29nLWJ0biB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTNweDtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMsIGNvbG9yIDAuMTVzLCB0cmFuc2Zvcm0gMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtY29nLWJ0bi5hY3RpdmUge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcbiAgICAgICAgICBjb2xvcjogIzNlYTZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZ1bGwgaGVpZ2h0IGJ1dHRvbnMgd2l0aCBOTyBjdXJ2YXR1cmUgKGJvcmRlci1yYWRpdXM6IDApLCBvdXRsaW5lZCBvbmx5ICovXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4ge1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgcGFkZGluZzogMCAxNHB4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA2cHg7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1wcmltYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzI5ODllNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWNvbnRpbnVlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjU5ZTBiO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1jb250aW51ZTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Q5NzcwNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLXZpZXctZmlsZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzEwYjk4MTtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tdmlldy1maWxlOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMDU5NjY5O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tZGFuZ2VyIHtcbiAgICAgICAgICBjb2xvcjogI2Y4NzE3MTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWRhbmdlcjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNDgsIDExMywgMTEzLCAwLjIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tbW9kZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y1OWUwYjtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAqL1xuICAgICAgICAucGlsbC1jb25maXJtLWJhciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNSwgMjUsIDI1LCAwLjk4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvbmZpcm0tdGV4dCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGNvbG9yOiAjZjU5ZTBiO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdGF0dXMgJiBJbWFnZSBEaW1lbnNpb25zIFNlY3Rpb24gKi9cbiAgICAgICAgLnBpbGwtc3RhdHVzLXNlY3Rpb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgbWluLXdpZHRoOiAxNzBweDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTgpO1xuICAgICAgICAgIGdhcDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBtYXgtd2lkdGg6IDIyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQud2FybmluZyB7XG4gICAgICAgICAgY29sb3I6ICNmNTllMGI7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5lcnJvciB7XG4gICAgICAgICAgY29sb3I6ICNlZjQ0NDQ7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5jb21wbGV0ZSB7XG4gICAgICAgICAgY29sb3I6ICMxMGI5ODE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTbWFsbCBncmV5IGltYWdlIGRpbWVuc2lvbnMgKi9cbiAgICAgICAgLnBpbGwtZGltZW5zaW9ucy10ZXh0IHtcbiAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgY29sb3I6ICM4ODg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtcHJvZ3Jlc3MtdHJhY2sge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogM3B4O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1wcm9ncmVzcy1maWxsIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgd2lkdGg6IDAlO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMzZWE2ZmY7XG4gICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmlnaHQgU2lkZSBDb3VudGVyICgwLzUxNSBwYWdlcykgKi9cbiAgICAgICAgLnBpbGwtY291bnRlci1ib3gge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogW3hdIENsb3NlL1NocmluayBCdXR0b24gKi9cbiAgICAgICAgLnBpbGwtY2xvc2UtYnRuIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGNvbG9yOiAjODg4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNsb3NlLWJ0bjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5ICovXG4gICAgICAgIC5waWxsLXNldHRpbmdzLXBhbmVsIHtcbiAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE0LCAxNCwgMTQsIDAuOTgpO1xuICAgICAgICAgIHBhZGRpbmc6IDEycHggMTZweDtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmdzLWhlYWRlciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIHBhZGRpbmctYm90dG9tOiA2cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy10aXRsZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xuICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludC5zaG93IHtcbiAgICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3MtZ3JpZCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cgbGFiZWwge1xuICAgICAgICAgIGNvbG9yOiAjYWFhO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLXJvdy1oYWxmIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgICAgICAgIGdhcDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctcm93LWhhbGYgPiBkaXYge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctaW5wdXQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyNDI0MjQ7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBwYWRkaW5nOiA1cHggOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAwLjE1cztcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIG1heC13aWR0aDogMjYwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWlucHV0OmZvY3VzIHtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICMzZWE2ZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy1mb290ZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWJ0biB7XG4gICAgICAgICAgcGFkZGluZzogNXB4IDEycHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNjY2M7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMTVzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctYnRuLmJ0bi1zYXZlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG4uYnRuLXNhdmU6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyOTg5ZTY7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG5cbiAgICAgIDwhLS0gRG9ja2VkIFNtYWxsIEljb24gKFZpc2libGUgd2hlbiBtaW5pbWl6ZWQgdG8gZmFyIGxlZnQpIC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtZG9jay1pY29uXCIgaWQ9XCJwaWxsRG9ja0ljb25cIiB0aXRsZT1cIk9wZW4gQXJjaGl2ZSBEb3dubG9hZGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPVwiJHtjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ljb25zL2ljb240OC5wbmcnKX1cIiBhbHQ9XCJBcmNoaXZlIERvd25sb2FkZXJcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gTWFpbiBCb2R5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtbWFpbi1ib2R5XCI+XG4gICAgICAgIDwhLS0gQ29nIHNldHRpbmdzIGJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtY29nLWJ0blwiIGlkPVwicGlsbENvZ0J0blwiIHRpdGxlPVwiRWRpdCBTZXR0aW5ncyAoU2F2ZSBwYXRoLCBwYXR0ZXJuLCBwYWdlcylcIj7impk8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtY29uZmlybS1iYXJcIiBpZD1cInBpbGxDb25maXJtQmFyXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGlsbC1jb25maXJtLXRleHRcIiBpZD1cInBpbGxDb25maXJtVGV4dFwiPlNhdmUgY2FwdHVyZWQgcGFnZXM/PC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXZpZXctZmlsZVwiIGlkPVwicGlsbENvbmZpcm1TYXZlQnRuXCI+4pyUIFllcywgU2F2ZSBGaWxlczwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLWRhbmdlclwiIGlkPVwicGlsbENvbmZpcm1EaXNjYXJkQnRuXCI+RGlzY2FyZDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxDb25maXJtQ2FuY2VsQnRuXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gU3RhcnQgRG93bmxvYWQgQnV0dG9uIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1wcmltYXJ5XCIgaWQ9XCJwaWxsU3RhcnRCdG5cIj5cbiAgICAgICAgICDilrYgU3RhcnQgRG93bmxvYWRcbiAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgPCEtLSBDb250aW51ZSBCdXR0b24gKHdoZW4gc3RhbGxlZCAvIG9mZmxpbmUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1jb250aW51ZVwiIGlkPVwicGlsbENvbnRpbnVlQnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIOKWtiBDT05USU5VRVxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIFZpZXcgRmlsZSBCdXR0b24gKHdoZW4gY29tcGxldGUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi12aWV3LWZpbGVcIiBpZD1cInBpbGxWaWV3RmlsZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinJQgVmlldyBGaWxlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gRHluYW1pYyBDb250cm9scyAoYWN0aXZlIGR1cmluZyBkb3dubG9hZCkgLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxQYXVzZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinZrinZogUGF1c2VcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXByaW1hcnlcIiBpZD1cInBpbGxSZXN1bWVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAg4pa2IFJlc3VtZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tZGFuZ2VyXCIgaWQ9XCJwaWxsU3RvcEJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDil7wgU3RvcFxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIDEtUGFnZSBNb2RlIEJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tbW9kZVwiIGlkPVwicGlsbE1vZGVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgdGl0bGU9XCJTd2l0Y2ggdG8gMS1QYWdlIFZpZXdcIj5cbiAgICAgICAgICDimqEgMS1QYWdlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gU3RhdHVzICYgSW1hZ2UgRGltZW5zaW9ucyAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc3RhdHVzLXNlY3Rpb25cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc3RhdHVzLXRleHRcIiBpZD1cInBpbGxTdGF0dXNUZXh0XCI+UmVhZHk8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJwaWxsLWRpbWVuc2lvbnMtdGV4dFwiIGlkPVwicGlsbERpbWVuc2lvbnNUZXh0XCI+KGltYWdlOiAtIHggLSk8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtcHJvZ3Jlc3MtdHJhY2tcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXByb2dyZXNzLWZpbGxcIiBpZD1cInBpbGxQcm9ncmVzc0ZpbGxcIj48L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBSaWdodCBTaWRlIENvdW50ZXI6IDAvNTE1IHBhZ2VzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1jb3VudGVyLWJveFwiIGlkPVwicGlsbENvdW50ZXJcIj5cbiAgICAgICAgICAwLzAgcGFnZXNcbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBbeF0gU2hyaW5rIHRvIExlZnQgU2lkZSBCdXR0b24gLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWNsb3NlLWJ0blwiIGlkPVwicGlsbENsb3NlQnRuXCIgdGl0bGU9XCJTaHJpbmsgdG8gbGVmdCBlZGdlIG9mIHNjcmVlblwiPuKclTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtcGFuZWxcIiBpZD1cInBpbGxTZXR0aW5nc1BhbmVsXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtdGl0bGVcIj7impkgRG93bmxvYWRlciBTZXR0aW5nczwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludFwiIGlkPVwicGlsbFNldHRpbmdzU2F2ZWRIaW50XCI+U2F2ZWQgdG8gbG9jYWxTdG9yYWdlPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtZ3JpZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXNldHRpbmctcm93XCI+XG4gICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdTYXZlUGF0aFwiPlNhdmUgU3ViZGlyZWN0b3J5OjwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInBpbGxTZXR0aW5nU2F2ZVBhdGhcIiBjbGFzcz1cInBpbGwtc2V0dGluZy1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiQXJjaGl2ZUJvb2tzXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvd1wiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInBpbGxTZXR0aW5nUGF0dGVyblwiPkZvbGRlciBQYXR0ZXJuOjwvbGFiZWw+XG4gICAgICAgICAgICA8c2VsZWN0IGlkPVwicGlsbFNldHRpbmdQYXR0ZXJuXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInt0aXRsZX1fe2lkfVwiPnt0aXRsZX1fe2lkfTwvb3B0aW9uPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwie3RpdGxlfVwiPnt0aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIntpZH1cIj57aWR9PC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvdyBwaWxsLXNldHRpbmctcm93LWhhbGZcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ1N0YXJ0UGFnZVwiPlN0YXJ0IFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nU3RhcnRQYWdlXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgdmFsdWU9XCIwXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdFbmRQYWdlXCI+RW5kIFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nRW5kUGFnZVwiIGNsYXNzPVwicGlsbC1zZXR0aW5nLWlucHV0XCIgbWluPVwiMFwiIHBsYWNlaG9sZGVyPVwiQWxsXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZy1yb3dcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ01heEhlaWdodFwiPk1heCBQYWdlIEhlaWdodDo8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nTWF4SGVpZ2h0XCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgc3RlcD1cIjUwXCIgcGxhY2Vob2xkZXI9XCJlLmcuIDEwMDAgKDAgPSBmdWxsKVwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1mb290ZXJcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1zZXR0aW5nLWJ0biBidG4tc2F2ZVwiIGlkPVwicGlsbFNldHRpbmdTYXZlQnRuXCI+8J+SviBTYXZlIFNldHRpbmdzPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtc2V0dGluZy1idG4gYnRuLWNsb3NlXCIgaWQ9XCJwaWxsU2V0dGluZ0Nsb3NlQnRuXCI+Q2xvc2U8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwaWxsKTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHBpbGw7XG5cbiAgICAvLyBBdHRhY2ggY2FsbGJhY2tzXG4gICAgY29uc3Qgc3RhcnRCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RhcnRCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzdGFydEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0YXJ0Py4oKSk7XG5cbiAgICBjb25zdCBjb250aW51ZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnRpbnVlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uUmVzdW1lPy4oKSk7XG5cbiAgICBjb25zdCB2aWV3RmlsZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHZpZXdGaWxlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uVmlld0ZpbGU/LigpKTtcblxuICAgIGNvbnN0IHBhdXNlQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFBhdXNlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcGF1c2VCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25QYXVzZT8uKCkpO1xuXG4gICAgY29uc3QgcmVzdW1lQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFJlc3VtZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHJlc3VtZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblJlc3VtZT8uKCkpO1xuXG4gICAgY29uc3Qgc3RvcEJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTdG9wQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgc3RvcEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0b3A/LigpKTtcblxuICAgIGNvbnN0IG1vZGVCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsTW9kZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIG1vZGVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25Td2l0Y2hNb2RlPy4oKSk7XG5cbiAgICAvLyBDb2cgYnV0dG9uIHRvIHRvZ2dsZSBzZXR0aW5ncyB0cmF5XG4gICAgY29uc3QgY29nQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvZ0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKCkpO1xuXG4gICAgLy8gU2F2ZSBTZXR0aW5ncyBidXR0b25cbiAgICBjb25zdCBzYXZlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1NhdmVCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzYXZlU2V0dGluZ3NCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZVBhdGhJbnB1dCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU2F2ZVBhdGgnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nUGF0dGVybicpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgY29uc3Qgc3RhcnRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1N0YXJ0UGFnZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0VuZFBhZ2UnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgbWF4SGVpZ2h0SW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICAgIGNvbnN0IGJhc2VEaXIgPSBzYXZlUGF0aElucHV0Py52YWx1ZS50cmltKCkgfHwgJ0FyY2hpdmVCb29rcyc7XG4gICAgICBjb25zdCBmb2xkZXJQYXR0ZXJuID0gcGF0dGVyblNlbGVjdD8udmFsdWUgfHwgJ3t0aXRsZX1fe2lkfSc7XG4gICAgICBjb25zdCBzdGFydFBhZ2UgPSBzdGFydFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoc3RhcnRQYWdlSW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuICAgICAgY29uc3QgZW5kUGFnZSA9IGVuZFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoZW5kUGFnZUlucHV0LnZhbHVlLCAxMCkpIDogMDtcbiAgICAgIGNvbnN0IG1heFBhZ2VIZWlnaHQgPSBtYXhIZWlnaHRJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobWF4SGVpZ2h0SW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblNhdmVTZXR0aW5ncz8uKHtcbiAgICAgICAgYmFzZURpcixcbiAgICAgICAgZm9sZGVyUGF0dGVybixcbiAgICAgICAgc3RhcnRQYWdlLFxuICAgICAgICBlbmRQYWdlLFxuICAgICAgICBtYXhQYWdlSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGhpbnQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ3NTYXZlZEhpbnQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmIChoaW50KSB7XG4gICAgICAgIGhpbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGhpbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpLCAyNTAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3NlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0Nsb3NlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY2xvc2VTZXR0aW5nc0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKSk7XG5cbiAgICAvLyBbeF0gY2xvc2UvZG9jayBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDbG9zZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNsb3NlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuZG9ja1RvTGVmdCgpKTtcblxuICAgIC8vIERvY2tlZCBpY29uIGNsaWNrIHRvIGV4cGFuZFxuICAgIGNvbnN0IGRvY2tJY29uID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbERvY2tJY29uJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgZG9ja0ljb24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy51bmRvY2tGcm9tTGVmdCgpKTtcblxuICAgIC8vIFBvcHVsYXRlIGluaXRpYWwgaW5wdXRzIGlmIGNvbmZpZyBleGlzdHNcbiAgICB0aGlzLnNldENvbmZpZyh0aGlzLmN1cnJlbnRDb25maWcpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZVNldHRpbmdzKG9wZW4/OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMuaXNTZXR0aW5nc09wZW4gPSB0eXBlb2Ygb3BlbiA9PT0gJ2Jvb2xlYW4nID8gb3BlbiA6ICF0aGlzLmlzU2V0dGluZ3NPcGVuO1xuXG4gICAgY29uc3QgcGFuZWwgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdzUGFuZWwnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb2dCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBhbmVsKSB7XG4gICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gdGhpcy5pc1NldHRpbmdzT3BlbiA/ICdmbGV4JyA6ICdub25lJztcbiAgICB9XG4gICAgaWYgKGNvZ0J0bikge1xuICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc09wZW4pIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRDb25maWcoY2ZnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50Q29uZmlnID0geyAuLi50aGlzLmN1cnJlbnRDb25maWcsIC4uLmNmZyB9O1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHNhdmVQYXRoSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdTYXZlUGF0aCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKHNhdmVQYXRoSW5wdXQgJiYgY2ZnLmJhc2VEaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2F2ZVBhdGhJbnB1dC52YWx1ZSA9IGNmZy5iYXNlRGlyO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdHRlcm5TZWxlY3QgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdQYXR0ZXJuJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgaWYgKHBhdHRlcm5TZWxlY3QgJiYgY2ZnLmZvbGRlclBhdHRlcm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IGNmZy5mb2xkZXJQYXR0ZXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0UGFnZUlucHV0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU3RhcnRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoc3RhcnRQYWdlSW5wdXQgJiYgY2ZnLnN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdGFydFBhZ2VJbnB1dC52YWx1ZSA9IFN0cmluZyhjZmcuc3RhcnRQYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdFbmRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoZW5kUGFnZUlucHV0ICYmIGNmZy5lbmRQYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZFBhZ2VJbnB1dC52YWx1ZSA9IGNmZy5lbmRQYWdlID4gMCA/IFN0cmluZyhjZmcuZW5kUGFnZSkgOiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBtYXhIZWlnaHRJbnB1dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKG1heEhlaWdodElucHV0ICYmIGNmZy5tYXhQYWdlSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1heEhlaWdodElucHV0LnZhbHVlID0gY2ZnLm1heFBhZ2VIZWlnaHQgPiAwID8gU3RyaW5nKGNmZy5tYXhQYWdlSGVpZ2h0KSA6ICcnO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzaG93U3RvcFByb21wdChcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG9uU2F2ZTogKCkgPT4gdm9pZCxcbiAgICBvbkRpc2NhcmQ6ICgpID0+IHZvaWQsXG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgY3VzdG9tTWVzc2FnZT86IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gdHJ1ZTtcblxuICAgIGNvbnN0IGNvbmZpcm1CYXIgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb25maXJtVGV4dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ29uZmlybVRleHQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBzYXZlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtU2F2ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnN0IGRpc2NhcmRCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1EaXNjYXJkQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtQ2FuY2VsQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIG5vcm1hbCBidXR0b25zIGFuZCBzdGF0dXMgd2hpbGUgY29uZmlybWluZ1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUoZmFsc2UpO1xuXG4gICAgaWYgKGNvbmZpcm1UZXh0KSB7XG4gICAgICBjb25maXJtVGV4dC50ZXh0Q29udGVudCA9IGN1c3RvbU1lc3NhZ2UgfHwgYFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2A7XG4gICAgfVxuICAgIGlmIChjb25maXJtQmFyKSB7XG4gICAgICBjb25maXJtQmFyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgIHRoaXMuaXNDb25maXJtaW5nU3RvcCA9IGZhbHNlO1xuICAgICAgaWYgKGNvbmZpcm1CYXIpIGNvbmZpcm1CYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNsZWFudXAoKTtcbiAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICBkaXNjYXJkQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkRpc2NhcmQoKTtcbiAgICB9O1xuXG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkNhbmNlbCgpO1xuICAgIH07XG4gIH1cblxuICBwdWJsaWMgaGlkZVN0b3BQcm9tcHQoKTogdm9pZCB7XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gZmFsc2U7XG4gICAgY29uc3QgY29uZmlybUJhciA9IHRoaXMuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY29uZmlybUJhcikgY29uZmlybUJhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIHNldFN0YW5kYXJkQ29udHJvbHNWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICAgICcjcGlsbFN0YXJ0QnRuLCAjcGlsbENvbnRpbnVlQnRuLCAjcGlsbFZpZXdGaWxlQnRuLCAjcGlsbFBhdXNlQnRuLCAjcGlsbFJlc3VtZUJ0biwgI3BpbGxTdG9wQnRuLCAjcGlsbE1vZGVCdG4sIC5waWxsLXN0YXR1cy1zZWN0aW9uLCAjcGlsbENvdW50ZXInXG4gICAgKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyAnJyA6ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkb2NrVG9MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gdHJ1ZTtcbiAgICB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdkb2NrZWQtbGVmdCcpO1xuICB9XG5cbiAgcHVibGljIHVuZG9ja0Zyb21MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnZG9ja2VkLWxlZnQnKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVQcm9ncmVzcyhcbiAgICBjdXJyZW50UGFnZTogbnVtYmVyLFxuICAgIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgICBzdGF0dXNUZXh0OiBzdHJpbmcsXG4gICAgc3RhdHVzVHlwZTogc3RyaW5nID0gJ25vcm1hbCcsXG4gICAgaXNQYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIgPSAxLFxuICAgIGltYWdlRGltZW5zaW9ucz86IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDb25maXJtaW5nU3RvcCkgcmV0dXJuOyAvLyBEbyBub3Qgb3ZlcndyaXRlIGNvbmZpcm1hdGlvbiBwcm9tcHRcblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGFydEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGNvbnRpbnVlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHZpZXdGaWxlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBhdXNlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxQYXVzZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHJlc3VtZUJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUmVzdW1lQnRuJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RvcEJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RvcEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IG1vZGVCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbE1vZGVCdG4nKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIGNvbnN0IGNvdW50ZXJFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ291bnRlcicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGZpbGxFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUHJvZ3Jlc3NGaWxsJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RhdHVzVGV4dEVsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGF0dXNUZXh0JykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgZGltZW5zaW9uc0VsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxEaW1lbnNpb25zVGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gMS1wYWdlIHN3aXRjaCBidXR0b25cbiAgICBpZiAobW9kZUJ0bikge1xuICAgICAgbW9kZUJ0bi5zdHlsZS5kaXNwbGF5ID0gY3VycmVudE1vZGUgIT09IDEgJiYgIWlzQWN0aXZlID8gJ2ZsZXgnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIFJpZ2h0IFNpZGUgQ291bnRlclxuICAgIGlmIChjb3VudGVyRWwpIHtcbiAgICAgIGlmICh0b3RhbFBhZ2VzID4gMCkge1xuICAgICAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgUGFnZSAke2N1cnJlbnRQYWdlfS8ke3RvdGFsUGFnZXN9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgMC8ke3RvdGFsUGFnZXN9IHBhZ2VzYDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY291bnRlckVsLnRleHRDb250ZW50ID0gJ0RldGVjdGluZyBwYWdlcy4uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvZ3Jlc3MgYmFyIGZpbGxcbiAgICBpZiAoZmlsbEVsICYmIHRvdGFsUGFnZXMgPiAwKSB7XG4gICAgICBjb25zdCBwY3QgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQoKChjdXJyZW50UGFnZSArIDEpIC8gdG90YWxQYWdlcykgKiAxMDApKTtcbiAgICAgIGZpbGxFbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgICB9XG5cbiAgICAvLyBTdGF0dXMgdGV4dCAmIGNsYXNzXG4gICAgaWYgKHN0YXR1c1RleHRFbCkge1xuICAgICAgc3RhdHVzVGV4dEVsLnRleHRDb250ZW50ID0gc3RhdHVzVGV4dDtcbiAgICAgIHN0YXR1c1RleHRFbC5jbGFzc05hbWUgPSBgcGlsbC1zdGF0dXMtdGV4dCAke3N0YXR1c1R5cGV9YDtcbiAgICB9XG5cbiAgICAvLyBJbWFnZSBEaW1lbnNpb25zOiAoaW1hZ2U6IDI1ODAgeCAzOTE1KVxuICAgIGlmIChkaW1lbnNpb25zRWwpIHtcbiAgICAgIGlmIChpbWFnZURpbWVuc2lvbnMgJiYgaW1hZ2VEaW1lbnNpb25zLndpZHRoID4gMCAmJiBpbWFnZURpbWVuc2lvbnMuaGVpZ2h0ID4gMCkge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAke2ltYWdlRGltZW5zaW9ucy53aWR0aH0geCAke2ltYWdlRGltZW5zaW9ucy5oZWlnaHR9KWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAtIHggLSlgO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJ1dHRvbnMgVmlzaWJpbGl0eVxuICAgIHN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29udGludWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB2aWV3RmlsZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmVzdW1lQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgaWYgKHN0YXR1c1R5cGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIC8vIENvbXBsZXRlZDogc2hvdyBcIkRvd25sb2FkZWQ6IFZpZXcgRmlsZXNcIlxuICAgICAgdmlld0ZpbGVCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9IGVsc2UgaWYgKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyB8fCBzdGF0dXNUeXBlID09PSAnb2ZmbGluZScgfHwgKGlzUGF1c2VkICYmIHN0YXR1c1R5cGUgPT09ICdyZXRyeWluZycpKSB7XG4gICAgICAvLyBTdGFsbGVkIC8gb2ZmbGluZSAvIG1heCByZXRyaWVzIGhpdDogc2hvdyBDT05USU5VRSArIFN0b3BcbiAgICAgIGNvbnRpbnVlQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfSBlbHNlIGlmIChpc0FjdGl2ZSkge1xuICAgICAgLy8gQ3VycmVudGx5IGFjdGl2ZVxuICAgICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICAgIHJlc3VtZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWRsZVxuICAgICAgc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgdGhpcy5jb250YWluZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwKICAgICIvKipcbiAqIFV0aWxpdGllcyBmb3IgZXh0cmFjdGluZyBPQ1IgdGV4dCBmcm9tIERKVlUgWE1MIGFuZCBjb21waWxpbmcgTWFya2Rvd24gZG9jdW1lbnRzXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlVGV4dEVudHJ5IHtcbiAgcGFnZU51bTogbnVtYmVyO1xuICBsZWFmSW5kZXg6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tNZXRhZGF0YSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvb2tJZDogc3RyaW5nO1xuICBhdXRob3I/OiBzdHJpbmc7XG4gIHB1Ymxpc2hlcj86IHN0cmluZztcbiAgeWVhcj86IHN0cmluZztcbiAgc291cmNlVXJsPzogc3RyaW5nO1xuICB0b3RhbFBhZ2VzPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFN0cmlwcyBESlZVIFhNTCBpbnRvIGNsZWFuLCBzdHJ1Y3R1cmVkIHBsYWluIHRleHQgZm9yIGEgc2luZ2xlIHBhZ2UuXG4gKiBSb2J1c3RseSBwYXJzZXMgUEFSQUdSQVBILCBMSU5FLCBhbmQgV09SRCBlbGVtZW50cy5cbiAqIFdvcmtzIHNlYW1sZXNzbHkgaW4gYm90aCBicm93c2VyIGFuZCBOb2RlL0J1biB0ZXN0IGVudmlyb25tZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGp2dVhtbFRvVGV4dCh4bWxTdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgheG1sU3RyaW5nIHx8IHR5cGVvZiB4bWxTdHJpbmcgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgLy8gRXh0cmFjdCBhbGwgUEFSQUdSQVBIIGJsb2Nrc1xuICBjb25zdCBwYXJhZ3JhcGhNYXRjaGVzID0geG1sU3RyaW5nLm1hdGNoKC88UEFSQUdSQVBIW1xcc1xcU10qPzxcXC9QQVJBR1JBUEg+L2dpKTtcbiAgaWYgKCFwYXJhZ3JhcGhNYXRjaGVzIHx8IHBhcmFncmFwaE1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gSWYgbm8gUEFSQUdSQVBIIHRhZ3MsIHRyeSBleHRyYWN0aW5nIHdvcmRzIGRpcmVjdGx5XG4gICAgY29uc3Qgd29yZHMgPSBBcnJheS5mcm9tKHhtbFN0cmluZy5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKVxuICAgICAgLm1hcChtID0+IGRlY29kZVhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgcmV0dXJuIHdvcmRzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIGNvbnN0IHBhcmFncmFwaHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBwYXJCbG9jayBvZiBwYXJhZ3JhcGhNYXRjaGVzKSB7XG4gICAgLy8gRXh0cmFjdCBhbGwgTElORSBibG9ja3MgaW5zaWRlIHRoaXMgUEFSQUdSQVBIXG4gICAgY29uc3QgbGluZU1hdGNoZXMgPSBwYXJCbG9jay5tYXRjaCgvPExJTkVbXFxzXFxTXSo/PFxcL0xJTkU+L2dpKTtcbiAgICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChsaW5lTWF0Y2hlcyAmJiBsaW5lTWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGxpbmVCbG9jayBvZiBsaW5lTWF0Y2hlcykge1xuICAgICAgICAvLyBFeHRyYWN0IGFsbCBXT1JEIGNvbnRlbnRzIGluc2lkZSB0aGlzIExJTkVcbiAgICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKGxpbmVCbG9jay5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKTtcbiAgICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAgIC5tYXAobSA9PiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobVsxXS50cmltKCkpKVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsaW5lcy5wdXNoKHdvcmRzLmpvaW4oJyAnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRmFsbGJhY2s6IHdvcmRzIGRpcmVjdGx5IGluIHBhcmFncmFwaFxuICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKHBhckJsb2NrLm1hdGNoQWxsKC88V09SRFtePl0qPihbXFxzXFxTXSo/KTxcXC9XT1JEPi9naSkpO1xuICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAubWFwKG0gPT4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCh3b3Jkcy5qb2luKCcgJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhZ3JhcGhzLnB1c2goZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKGxpbmVzLmpvaW4oJ1xcbicpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gZGVjb2RlIGFsbCBIVE1MIGFuZCBYTUwgZW50aXRpZXMgaW50byBwcm9wZXIgVVRGLTggY2hhcmFjdGVycy5cbiAqIEhhbmRsZXMgbnVtZXJpYyBkZWNpbWFsIChlLmcuICYjODIxMjsgLT4g4oCUKSwgaGV4ICgmI3gyMDE0OyksIGFuZCBuYW1lZCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXRleHQgfHwgdHlwZW9mIHRleHQgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgcmV0dXJuIHRleHRcbiAgICAvLyAxLiBEZWNpbWFsIG51bWVyaWMgZW50aXRpZXM6ICYjODIxMjsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiMoXFxkKyk7L2csIChfLCBkZWMpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChkZWMsIDEwKTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMi4gSGV4YWRlY2ltYWwgbnVtZXJpYyBlbnRpdGllczogJiN4MjAxNDsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiN4KFswLTlhLWZBLUZdKyk7L2csIChfLCBoZXgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChoZXgsIDE2KTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMy4gTmFtZWQgZW50aXRpZXNcbiAgICAucmVwbGFjZSgvJm1kYXNoOy9nLCAn4oCUJylcbiAgICAucmVwbGFjZSgvJm5kYXNoOy9nLCAn4oCTJylcbiAgICAucmVwbGFjZSgvJmhlbGxpcDsvZywgJ+KApicpXG4gICAgLnJlcGxhY2UoLyZsc3F1bzsvZywgJ+KAmCcpXG4gICAgLnJlcGxhY2UoLyZyc3F1bzsvZywgJ+KAmScpXG4gICAgLnJlcGxhY2UoLyZsZHF1bzsvZywgJ+KAnCcpXG4gICAgLnJlcGxhY2UoLyZyZHF1bzsvZywgJ+KAnScpXG4gICAgLnJlcGxhY2UoLyZuYnNwOy9nLCAnICcpXG4gICAgLnJlcGxhY2UoLyZidWxsOy9nLCAn4oCiJylcbiAgICAucmVwbGFjZSgvJmNlbnQ7L2csICfCoicpXG4gICAgLnJlcGxhY2UoLyZwb3VuZDsvZywgJ8KjJylcbiAgICAucmVwbGFjZSgvJnllbjsvZywgJ8KlJylcbiAgICAucmVwbGFjZSgvJmV1cm87L2csICfigqwnKVxuICAgIC5yZXBsYWNlKC8mY29weTsvZywgJ8KpJylcbiAgICAucmVwbGFjZSgvJnJlZzsvZywgJ8KuJylcbiAgICAucmVwbGFjZSgvJmRlZzsvZywgJ8KwJylcbiAgICAucmVwbGFjZSgvJnBsdXNtbjsvZywgJ8KxJylcbiAgICAucmVwbGFjZSgvJnRpbWVzOy9nLCAnw5cnKVxuICAgIC5yZXBsYWNlKC8mZGl2aWRlOy9nLCAnw7cnKVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAucmVwbGFjZSgvJmFwb3M7L2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7IC8vIGRlY29kZSAmYW1wOyBsYXN0XG59XG5cbi8qKlxuICogU3RyaXBzIEhhdGhpVHJ1c3QgPGZpZ2NhcHRpb24+IG1hcmt1cCBpbnRvIGNsZWFuLCBmb3JtYXR0ZWQgTWFya2Rvd24vdGV4dC5cbiAqIEhhbmRsZXMgYm90aCBET00gRWxlbWVudCBpbnB1dHMgKGluIGJyb3dzZXIpIGFuZCByYXcgSFRNTCBzdHJpbmdzIChpbiB0ZXN0cykuXG4gKiBFeHRyYWN0cyB3b3JkIHNwYW5zLCBwcmVzZXJ2ZXMgcGFyYWdyYXBoIGJyZWFrcywgYW5kIGRlY29kZXMgSFRNTCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGlucHV0OiBzdHJpbmcgfCBhbnkpOiBzdHJpbmcge1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG5cbiAgLy8gSWYgRE9NIEVsZW1lbnQgaW4gYnJvd3NlciBlbnZpcm9ubWVudFxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0JyAmJiBpbnB1dC5ub2RlVHlwZSkge1xuICAgIGNvbnN0IGVsID0gaW5wdXQgYXMgRWxlbWVudDtcbiAgICBjb25zdCBwRWxlbWVudHMgPSBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ3AsIC5vY3JfcGFyJykpO1xuXG4gICAgaWYgKHBFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwYXJhZ3JhcGhzID0gcEVsZW1lbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKHAucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCwgLm9jcl9saW5lJykpO1xuICAgICAgICBpZiAoc3BhbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBzcGFuc1xuICAgICAgICAgICAgLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyA8cD4gdGFncywgY2hlY2sgZm9yIGxpbmUgZWxlbWVudHNcbiAgICBjb25zdCBsaW5lcyA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnLm9jcl9saW5lLCBkaXYnKSk7XG4gICAgaWYgKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxpbmVUZXh0cyA9IGxpbmVzLm1hcChsaW5lID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKGxpbmUucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCcpKTtcbiAgICAgICAgaWYgKHNwYW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGxpbmUudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobGluZVRleHRzLmpvaW4oJ1xcbicpKTtcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjazogZXh0cmFjdCBhbGwgc3BhbnMgb3IgdGV4dCBkaXJlY3RseVxuICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShlbC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xuICAgIGlmIChzcGFucy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXModGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcygoZWwudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9bIFxcdF0rL2csICcgJykpO1xuICB9XG5cbiAgLy8gSWYgaW5wdXQgaXMgYW4gSFRNTCBzdHJpbmdcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICBsZXQgY2xlYW4gPSBpbnB1dDtcblxuICAgIC8vIENoZWNrIGZvciA8cD4gb3IgPGRpdiBjbGFzcz1cIm9jcl9wYXJcIj4gcGFyYWdyYXBoc1xuICAgIGNvbnN0IHBNYXRjaGVzID0gY2xlYW4ubWF0Y2goLzwoPzpwfGRpdiBjbGFzcz1cIm9jcl9wYXJcIilbXj5dKj4oW1xcc1xcU10qPyk8XFwvKD86cHxkaXYpPi9naSk7XG4gICAgaWYgKHBNYXRjaGVzICYmIHBNYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHBhcmFncmFwaHMgPSBwTWF0Y2hlcy5tYXAocEJsb2NrID0+IHtcbiAgICAgICAgcmV0dXJuIHBCbG9ja1xuICAgICAgICAgIC5yZXBsYWNlKC88YnJcXHMqXFwvPz4vZ2ksICdcXG4nKVxuICAgICAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgICAgICAucmVwbGFjZSgvWyBcXHRcXHJcXG5dKy9nLCAnICcpXG4gICAgICAgICAgLnRyaW0oKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2Ugc3RyaXAgdGFncywgcHJlc2VydmluZyA8YnI+IGFzIGxpbmUgYnJlYWtzXG4gICAgY29uc3QgdGV4dCA9IGNsZWFuXG4gICAgICAucmVwbGFjZSgvPGJyXFxzKlxcLz8+L2dpLCAnXFxuJylcbiAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF0rL2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9cXG5cXHMqXFxuKy9nLCAnXFxuXFxuJylcbiAgICAgIC50cmltKCk7XG5cbiAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIEFzc2VtYmxlcyBtdWx0aXBsZSBwYWdlIHRleHRzIGFuZCBib29rIG1ldGFkYXRhIGludG8gYSBjbGVhbiwgY29tcGxldGUgTWFya2Rvd24gZG9jdW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEJvb2tNYXJrZG93bihcbiAgbWV0YWRhdGE6IEJvb2tNZXRhZGF0YSxcbiAgcGFnZXM6IFBhZ2VUZXh0RW50cnlbXVxuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gVGl0bGUgYW5kIEhlYWRlclxuICBwYXJ0cy5wdXNoKGAjICR7bWV0YWRhdGEudGl0bGUgfHwgJ1VudGl0bGVkIEJvb2snfVxcbmApO1xuXG4gIGNvbnN0IG1ldGFMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKG1ldGFkYXRhLmF1dGhvcikgbWV0YUxpbmVzLnB1c2goYC0gKipBdXRob3I6KiogJHttZXRhZGF0YS5hdXRob3J9YCk7XG4gIGlmIChtZXRhZGF0YS5wdWJsaXNoZXIpIG1ldGFMaW5lcy5wdXNoKGAtICoqUHVibGlzaGVyOioqICR7bWV0YWRhdGEucHVibGlzaGVyfWApO1xuICBpZiAobWV0YWRhdGEueWVhcikgbWV0YUxpbmVzLnB1c2goYC0gKipEYXRlOioqICR7bWV0YWRhdGEueWVhcn1gKTtcblxuICBpZiAobWV0YWRhdGEuYm9va0lkKSB7XG4gICAgaWYgKG1ldGFkYXRhLnNvdXJjZVVybCAmJiBtZXRhZGF0YS5zb3VyY2VVcmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykpIHtcbiAgICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqSGF0aGlUcnVzdCBJZGVudGlmaWVyOioqIFske21ldGFkYXRhLmJvb2tJZH1dKCR7bWV0YWRhdGEuc291cmNlVXJsfSlgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YUxpbmVzLnB1c2goYC0gKipJbnRlcm5ldCBBcmNoaXZlIElkZW50aWZpZXI6KiogWyR7bWV0YWRhdGEuYm9va0lkfV0oaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLyR7bWV0YWRhdGEuYm9va0lkfSlgKTtcbiAgICB9XG4gIH1cblxuICBpZiAobWV0YWRhdGEuc291cmNlVXJsICYmICFtZXRhTGluZXMuc29tZShsID0+IGwuaW5jbHVkZXMobWV0YWRhdGEuc291cmNlVXJsISkpKSB7XG4gICAgbWV0YUxpbmVzLnB1c2goYC0gKipTb3VyY2U6KiogJHttZXRhZGF0YS5zb3VyY2VVcmx9YCk7XG4gIH1cbiAgaWYgKG1ldGFkYXRhLnRvdGFsUGFnZXMpIG1ldGFMaW5lcy5wdXNoKGAtICoqVG90YWwgUGFnZXM6KiogJHttZXRhZGF0YS50b3RhbFBhZ2VzfWApO1xuXG4gIGlmIChtZXRhTGluZXMubGVuZ3RoID4gMCkge1xuICAgIHBhcnRzLnB1c2gobWV0YUxpbmVzLmpvaW4oJ1xcbicpKTtcbiAgICBwYXJ0cy5wdXNoKCdcXG4tLS1cXG4nKTtcbiAgfVxuXG4gIC8vIFNvcnQgcGFnZXMgYnkgcGFnZU51bVxuICBjb25zdCBzb3J0ZWQgPSBbLi4ucGFnZXNdLnNvcnQoKGEsIGIpID0+IGEucGFnZU51bSAtIGIucGFnZU51bSk7XG5cbiAgZm9yIChjb25zdCBwYWdlIG9mIHNvcnRlZCkge1xuICAgIHBhcnRzLnB1c2goYCMjIFBhZ2UgJHtwYWdlLnBhZ2VOdW19XFxuXFxuYCk7XG4gICAgaWYgKHBhZ2UudGV4dCAmJiBwYWdlLnRleHQudHJpbSgpKSB7XG4gICAgICBwYXJ0cy5wdXNoKGAke3BhZ2UudGV4dC50cmltKCl9XFxuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzLnB1c2goYCpbTm8gdGV4dCBvciBpbGx1c3RyYXRpb24gcGFnZV0qXFxuYCk7XG4gICAgfVxuICAgIHBhcnRzLnB1c2goJ1xcbi0tLVxcbicpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJ1xcbicpO1xufVxuXG4iLAogICAgIi8qKlxuICogRmFzdCwgcHVyZSBKYXZhU2NyaXB0IFBERiBjb21waWxlciBmb3IgZW1iZWRkaW5nIEpQRUcgcGFnZSBpbWFnZXMgaW50byBQREYgZG9jdW1lbnRzLlxuICogQ29uZm9ybXMgdG8gUERGIDEuNCBzcGVjaWZpY2F0aW9uLiBaZXJvIGV4dGVybmFsIGJpbmFyeSBkZXBlbmRlbmNpZXMuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBKcGVnSW5mbyB7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBjaGFubmVsczogbnVtYmVyO1xuICBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJztcbiAgYml0czogbnVtYmVyO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHdpZHRoLCBoZWlnaHQsIGFuZCBjb2xvciBzcGFjZSBkaXJlY3RseSBmcm9tIEpQRUcgaGVhZGVyIG1hcmtlcnMgKFNPRjAvU09GMikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRKcGVnSW5mbyhkYXRhOiBVaW50OEFycmF5KTogSnBlZ0luZm8ge1xuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG5cbiAgaWYgKHZpZXcuZ2V0VWludDE2KDApICE9PSAweGZmZDgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIHZhbGlkIEpQRUcgaW1hZ2UgKG1pc3NpbmcgU09JIG1hcmtlcikuJyk7XG4gIH1cblxuICBjb25zdCBTT0ZfTUFSS0VSUyA9IFtcbiAgICAweGZmYzAsIDB4ZmZjMSwgMHhmZmMyLCAweGZmYzMsIDB4ZmZjNSwgMHhmZmM2LCAweGZmYzcsIDB4ZmZjOSwgMHhmZmNhLFxuICAgIDB4ZmZjYiwgMHhmZmNkLCAweGZmY2UsIDB4ZmZjZixcbiAgXTtcblxuICBsZXQgcG9zID0gMjtcbiAgd2hpbGUgKHBvcyA8IGRhdGEubGVuZ3RoIC0gOCkge1xuICAgIGNvbnN0IG1hcmtlciA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgcG9zICs9IDI7XG5cbiAgICBpZiAoU09GX01BUktFUlMuaW5jbHVkZXMobWFya2VyKSkge1xuICAgICAgcG9zICs9IDI7IC8vIHNraXAgbGVuZ3RoXG4gICAgICBjb25zdCBiaXRzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG4gICAgICBjb25zdCBoZWlnaHQgPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb25zdCB3aWR0aCA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgICBwb3MgKz0gMjtcbiAgICAgIGNvbnN0IGNoYW5uZWxzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG5cbiAgICAgIGxldCBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJyA9ICdEZXZpY2VSR0InO1xuICAgICAgaWYgKGNoYW5uZWxzID09PSAxKSBjb2xvclNwYWNlID0gJ0RldmljZUdyYXknO1xuICAgICAgZWxzZSBpZiAoY2hhbm5lbHMgPT09IDQpIGNvbG9yU3BhY2UgPSAnRGV2aWNlQ01ZSyc7XG5cbiAgICAgIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIGNoYW5uZWxzLCBjb2xvclNwYWNlLCBiaXRzIH07XG4gICAgfVxuXG4gICAgY29uc3QgbGVuZ3RoID0gdmlldy5nZXRVaW50MTYocG9zKTtcbiAgICBwb3MgKz0gbGVuZ3RoO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBTT0YgbWFya2VyIGluIEpQRUcgc3RyZWFtLicpO1xufVxuXG4vKipcbiAqIEhlbHBlciB0byBjb252ZXJ0IEJhc2U2NCBEYXRhIFVSTCB0byBVaW50OEFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGF0YVVybFRvQnl0ZXMoZGF0YVVybDogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGNvbW1hSW5kZXggPSBkYXRhVXJsLmluZGV4T2YoJywnKTtcbiAgY29uc3QgYmFzZTY0ID0gY29tbWFJbmRleCA+PSAwID8gZGF0YVVybC5zbGljZShjb21tYUluZGV4ICsgMSkgOiBkYXRhVXJsO1xuICBjb25zdCBiaW5hcnlTdHJpbmcgPSBhdG9iKGJhc2U2NCk7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYmluYXJ5U3RyaW5nLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5U3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgYnl0ZXNbaV0gPSBiaW5hcnlTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gYnl0ZXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmSW1hZ2VJbnB1dCB7XG4gIHBhZ2VOdW06IG51bWJlcjtcbiAgZGF0YTogVWludDhBcnJheSB8IHN0cmluZzsgLy8gVWludDhBcnJheSBvciBEYXRhVVJMXG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBsaXN0IG9mIEpQRUcgaW1hZ2VzIGludG8gYSB2YWxpZCBQREYgZG9jdW1lbnQuXG4gKiBFbWJlZHMgcmF3IEpQRUcgc3RyZWFtcyBkaXJlY3RseSB3aXRob3V0IGRlY29tcHJlc3Npb24gb3IgcmUtZW5jb2RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSnBlZ3NUb1BkZihcbiAgaW1hZ2VzOiBQZGZJbWFnZUlucHV0W10sXG4gIG1ldGFkYXRhOiB7IHRpdGxlPzogc3RyaW5nOyBhdXRob3I/OiBzdHJpbmc7IGNyZWF0b3I/OiBzdHJpbmcgfSA9IHt9XG4pOiBVaW50OEFycmF5IHtcbiAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgUERGOiBObyBpbWFnZXMgcHJvdmlkZWQuJyk7XG4gIH1cblxuICBjb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICBjb25zdCBvZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgY3VycmVudE9mZnNldCA9IDA7XG5cbiAgZnVuY3Rpb24gd3JpdGUoYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICBjaHVua3MucHVzaChieXRlcyk7XG4gICAgY3VycmVudE9mZnNldCArPSBieXRlcy5sZW5ndGg7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZVN0cmluZyhzdHI6IHN0cmluZykge1xuICAgIHdyaXRlKHRleHRFbmNvZGVyLmVuY29kZShzdHIpKTtcbiAgfVxuXG4gIC8vIEhlYWRlclxuICB3cml0ZVN0cmluZygnJVBERi0xLjRcXG4lXFx4RTJcXHhFM1xceENGXFx4RDNcXG4nKTtcblxuICBsZXQgb2JqSWRDb3VudGVyID0gMTtcbiAgZnVuY3Rpb24gc3RhcnRPYmplY3QoKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZCA9IG9iaklkQ291bnRlcisrO1xuICAgIG9mZnNldHNbaWRdID0gY3VycmVudE9mZnNldDtcbiAgICB3cml0ZVN0cmluZyhgJHtpZH0gMCBvYmpcXG5gKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRPYmplY3QoKSB7XG4gICAgd3JpdGVTdHJpbmcoJ2VuZG9ialxcbicpO1xuICB9XG5cbiAgY29uc3QgdG90YWxQYWdlcyA9IGltYWdlcy5sZW5ndGg7XG5cbiAgLy8gUHJlLWNhbGN1bGF0ZSBPYmplY3QgSURzOlxuICAvLyAxOiBDYXRhbG9nXG4gIC8vIDI6IFBhZ2VzXG4gIC8vIDMgKyAoaSAqIDMpOiBQYWdlIG9iamVjdFxuICAvLyA0ICsgKGkgKiAzKTogQ29udGVudCBzdHJlYW1cbiAgLy8gNSArIChpICogMyk6IEltYWdlIFhPYmplY3RcbiAgY29uc3QgY2F0YWxvZ0lkID0gMTtcbiAgY29uc3QgcGFnZXNSb290SWQgPSAyO1xuICBjb25zdCBwYWdlSWRzOiBudW1iZXJbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsUGFnZXM7IGkrKykge1xuICAgIHBhZ2VJZHMucHVzaCgzICsgaSAqIDMpO1xuICB9XG5cbiAgLy8gMS4gQ2F0YWxvZ1xuICBzdGFydE9iamVjdCgpOyAvLyAxXG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL0NhdGFsb2dcXG4gIC9QYWdlcyAke3BhZ2VzUm9vdElkfSAwIFJcXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAyLiBQYWdlcyBSb290XG4gIHN0YXJ0T2JqZWN0KCk7IC8vIDJcbiAgY29uc3Qga2lkc1N0ciA9IHBhZ2VJZHMubWFwKGlkID0+IGAke2lkfSAwIFJgKS5qb2luKCcgJyk7XG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL1BhZ2VzXFxuICAvS2lkcyBbICR7a2lkc1N0cn0gXVxcbiAgL0NvdW50ICR7dG90YWxQYWdlc31cXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAzLiBSZW5kZXIgRWFjaCBQYWdlIChQYWdlLCBDb250ZW50cywgSW1hZ2UgWE9iamVjdClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbFBhZ2VzOyBpKyspIHtcbiAgICBjb25zdCBpdGVtID0gaW1hZ2VzW2ldO1xuICAgIGNvbnN0IGltYWdlQnl0ZXMgPSB0eXBlb2YgaXRlbS5kYXRhID09PSAnc3RyaW5nJyA/IGRhdGFVcmxUb0J5dGVzKGl0ZW0uZGF0YSkgOiBpdGVtLmRhdGE7XG4gICAgY29uc3QgaW5mbyA9IGdldEpwZWdJbmZvKGltYWdlQnl0ZXMpO1xuXG4gICAgY29uc3Qgd2lkdGggPSBpdGVtLndpZHRoIHx8IGluZm8ud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gaXRlbS5oZWlnaHQgfHwgaW5mby5oZWlnaHQ7XG5cbiAgICBjb25zdCBwYWdlT2JqSWQgPSAzICsgaSAqIDM7XG4gICAgY29uc3QgY29udGVudE9iaklkID0gNCArIGkgKiAzO1xuICAgIGNvbnN0IGltYWdlT2JqSWQgPSA1ICsgaSAqIDM7XG5cbiAgICAvLyBQYWdlIE9iamVjdFxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIHBhZ2VPYmpJZFxuICAgIHdyaXRlU3RyaW5nKFxuICAgICAgYDw8XFxuYCArXG4gICAgICBgICAvVHlwZSAvUGFnZVxcbmAgK1xuICAgICAgYCAgL1BhcmVudCAke3BhZ2VzUm9vdElkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9NZWRpYUJveCBbIDAgMCAke3dpZHRofSAke2hlaWdodH0gXVxcbmAgK1xuICAgICAgYCAgL0NvbnRlbnRzICR7Y29udGVudE9iaklkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9SZXNvdXJjZXMgPDxcXG5gICtcbiAgICAgIGAgICAgL1hPYmplY3QgPDwgL0ltJHtpICsgMX0gJHtpbWFnZU9iaklkfSAwIFIgPj5cXG5gICtcbiAgICAgIGAgID4+XFxuYCArXG4gICAgICBgPj5cXG5gXG4gICAgKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIENvbnRlbnQgU3RyZWFtXG4gICAgY29uc3QgY29udGVudFN0cmVhbSA9IGBxXFxuJHt3aWR0aH0gMCAwICR7aGVpZ2h0fSAwIDAgY21cXG4vSW0ke2kgKyAxfSBEb1xcblFcXG5gO1xuICAgIGNvbnN0IGNvbnRlbnRCeXRlcyA9IHRleHRFbmNvZGVyLmVuY29kZShjb250ZW50U3RyZWFtKTtcblxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIGNvbnRlbnRPYmpJZFxuICAgIHdyaXRlU3RyaW5nKGA8PCAvTGVuZ3RoICR7Y29udGVudEJ5dGVzLmxlbmd0aH0gPj5cXG5zdHJlYW1cXG5gKTtcbiAgICB3cml0ZShjb250ZW50Qnl0ZXMpO1xuICAgIHdyaXRlU3RyaW5nKCdcXG5lbmRzdHJlYW1cXG4nKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIEltYWdlIFhPYmplY3RcbiAgICBzdGFydE9iamVjdCgpOyAvLyBpbWFnZU9iaklkXG4gICAgd3JpdGVTdHJpbmcoXG4gICAgICBgPDxcXG5gICtcbiAgICAgIGAgIC9UeXBlIC9YT2JqZWN0XFxuYCArXG4gICAgICBgICAvU3VidHlwZSAvSW1hZ2VcXG5gICtcbiAgICAgIGAgIC9XaWR0aCAke2luZm8ud2lkdGh9XFxuYCArXG4gICAgICBgICAvSGVpZ2h0ICR7aW5mby5oZWlnaHR9XFxuYCArXG4gICAgICBgICAvQ29sb3JTcGFjZSAvJHtpbmZvLmNvbG9yU3BhY2V9XFxuYCArXG4gICAgICBgICAvQml0c1BlckNvbXBvbmVudCAke2luZm8uYml0c31cXG5gICtcbiAgICAgIGAgIC9GaWx0ZXIgL0RDVERlY29kZVxcbmAgK1xuICAgICAgYCAgL0xlbmd0aCAke2ltYWdlQnl0ZXMubGVuZ3RofVxcbmAgK1xuICAgICAgYD4+XFxuc3RyZWFtXFxuYFxuICAgICk7XG4gICAgd3JpdGUoaW1hZ2VCeXRlcyk7XG4gICAgd3JpdGVTdHJpbmcoJ1xcbmVuZHN0cmVhbVxcbicpO1xuICAgIGVuZE9iamVjdCgpO1xuICB9XG5cbiAgLy8gT3B0aW9uYWwgSW5mbyBPYmplY3RcbiAgY29uc3QgaW5mb0lkID0gc3RhcnRPYmplY3QoKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gKG1ldGFkYXRhLnRpdGxlIHx8ICdBcmNoaXZlLm9yZyBCb29rJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICBjb25zdCBzYWZlQXV0aG9yID0gKG1ldGFkYXRhLmF1dGhvciB8fCAnQXJjaGl2ZS5vcmcnKS5yZXBsYWNlKC9bKClcXFxcXS9nLCAnXFxcXCQmJyk7XG4gIGNvbnN0IGNyZWF0b3IgPSAobWV0YWRhdGEuY3JlYXRvciB8fCAnQXJjaGl2ZSBEb3dubG9hZGVyJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICB3cml0ZVN0cmluZyhcbiAgICBgPDxcXG5gICtcbiAgICBgICAvVGl0bGUgKCR7c2FmZVRpdGxlfSlcXG5gICtcbiAgICBgICAvQXV0aG9yICgke3NhZmVBdXRob3J9KVxcbmAgK1xuICAgIGAgIC9DcmVhdG9yICgke2NyZWF0b3J9KVxcbmAgK1xuICAgIGAgIC9Qcm9kdWNlciAoQXJjaGl2ZSBEb3dubG9hZGVyIEV4dGVuc2lvbilcXG5gICtcbiAgICBgICAvQ3JlYXRpb25EYXRlIChEOiR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1stOlRdL2csICcnKS5zbGljZSgwLCAxNCl9WilcXG5gICtcbiAgICBgPj5cXG5gXG4gICk7XG4gIGVuZE9iamVjdCgpO1xuXG4gIC8vIFhSZWYgVGFibGVcbiAgY29uc3Qgc3RhcnRYcmVmID0gY3VycmVudE9mZnNldDtcbiAgY29uc3QgdG90YWxPYmplY3RzID0gb2JqSWRDb3VudGVyOyAvLyAxIHRvIG9iaklkQ291bnRlci0xXG5cbiAgd3JpdGVTdHJpbmcoYHhyZWZcXG4wICR7dG90YWxPYmplY3RzfVxcbmApO1xuICB3cml0ZVN0cmluZygnMDAwMDAwMDAwMCA2NTUzNSBmIFxcbicpO1xuXG4gIGZvciAobGV0IGlkID0gMTsgaWQgPCB0b3RhbE9iamVjdHM7IGlkKyspIHtcbiAgICBjb25zdCBvZmZzZXQgPSBvZmZzZXRzW2lkXSB8fCAwO1xuICAgIGNvbnN0IHBhZGRlZE9mZnNldCA9IFN0cmluZyhvZmZzZXQpLnBhZFN0YXJ0KDEwLCAnMCcpO1xuICAgIHdyaXRlU3RyaW5nKGAke3BhZGRlZE9mZnNldH0gMDAwMDAgbiBcXG5gKTtcbiAgfVxuXG4gIC8vIFRyYWlsZXJcbiAgd3JpdGVTdHJpbmcoXG4gICAgYHRyYWlsZXJcXG5gICtcbiAgICBgPDxcXG5gICtcbiAgICBgICAvU2l6ZSAke3RvdGFsT2JqZWN0c31cXG5gICtcbiAgICBgICAvUm9vdCAke2NhdGFsb2dJZH0gMCBSXFxuYCArXG4gICAgYCAgL0luZm8gJHtpbmZvSWR9IDAgUlxcbmAgK1xuICAgIGA+PlxcbmAgK1xuICAgIGBzdGFydHhyZWZcXG5gICtcbiAgICBgJHtzdGFydFhyZWZ9XFxuYCArXG4gICAgYCUlRU9GXFxuYFxuICApO1xuXG4gIC8vIENvbmNhdGVuYXRlIGFsbCBjaHVua3MgaW50byBmaW5hbCBVaW50OEFycmF5XG4gIGxldCB0b3RhbExlbmd0aCA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB0b3RhbExlbmd0aCArPSBjaHVuay5sZW5ndGg7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRvdGFsTGVuZ3RoKTtcbiAgbGV0IHBvcyA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgcmVzdWx0LnNldChjaHVuaywgcG9zKTtcbiAgICBwb3MgKz0gY2h1bmsubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBBbGlhcyBmb3IgY29tcGlsZUpwZWdzVG9QZGYuXG4gKi9cbmV4cG9ydCBjb25zdCBjb21waWxlSW1hZ2VzVG9QZGYgPSBjb21waWxlSnBlZ3NUb1BkZjtcbiIsCiAgICAiLyoqXG4gKiBGaWxlc3lzdGVtIGFuZCBuYW1pbmcgc2FuaXRpemF0aW9uIHV0aWxpdGllc1xuICovXG5cbi8qKlxuICogU2FuaXRpemVzIGEgc3RyaW5nIGZvciBzYWZlIHVzYWdlIGluIGRpcmVjdG9yeSBvciBmaWxlIG5hbWVzIGFjcm9zcyBtYWNPUywgTGludXgsIGFuZCBXaW5kb3dzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVGaWxlbmFtZShuYW1lOiBzdHJpbmcsIGZhbGxiYWNrID0gJ2Jvb2snKTogc3RyaW5nIHtcbiAgaWYgKCFuYW1lIHx8IHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbGxiYWNrO1xuXG4gIC8vIFJlbW92ZSBvciByZXBsYWNlIGlsbGVnYWwgY2hhcmFjdGVyczogLyBcXCA6ICogPyBcIiA8ID4gfCBhbmQgY29udHJvbCBjaGFyc1xuICBsZXQgY2xlYW5lZCA9IG5hbWVcbiAgICAucmVwbGFjZSgvWzw+OlwiL1xcXFx8PypcXHgwMC1cXHgxRl0vZywgJ18nKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAudHJpbSgpO1xuXG4gIC8vIFN0cmlwIGxlYWRpbmcvdHJhaWxpbmcgZG90cyBhbmQgc3BhY2VzXG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL15cXC4rfFxcLiskL2csICcnKS50cmltKCk7XG5cbiAgLy8gQXZvaWQgcmVzZXJ2ZWQgbmFtZXMgb24gV2luZG93cyAoQ09OLCBQUk4sIEFVWCwgTlVMLCBDT00xLTksIExQVDEtOSlcbiAgY29uc3QgcmVzZXJ2ZWQgPSAvXihDT058UFJOfEFVWHxOVUx8Q09NWzEtOV18TFBUWzEtOV0pJC9pO1xuICBpZiAocmVzZXJ2ZWQudGVzdChjbGVhbmVkKSkge1xuICAgIGNsZWFuZWQgPSBgJHtjbGVhbmVkfV9maWxlYDtcbiAgfVxuXG4gIC8vIENhcCBsZW5ndGggdG8gMTIwIGNoYXJhY3RlcnMgdG8gcHJldmVudCBwYXRoIGxpbWl0IGVycm9yc1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPiAxMjApIHtcbiAgICBjbGVhbmVkID0gY2xlYW5lZC5zdWJzdHJpbmcoMCwgMTIwKS50cmltKCk7XG4gIH1cblxuICByZXR1cm4gY2xlYW5lZCB8fCBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBGb3JtYXRzIGEgc3ViZm9sZGVyIHBhdGggYmFzZWQgb24gdGhlIHVzZXIncyB0ZW1wbGF0ZSBwYXR0ZXJuLlxuICogVGVtcGxhdGVzIHN1cHBvcnRlZDpcbiAqIC0ge3RpdGxlfSAtPiBcIlRoZV9Cb29rX1RpdGxlXCJcbiAqIC0ge2lkfSAtPiBcIm5hZ2hhbW1hZGlsaWJyYXIwMGphbWVcIlxuICogLSB7dGl0bGV9X3tpZH0gLT4gXCJUaGVfQm9va19UaXRsZV9uYWdoYW1tYWRpbGlicmFyMDBqYW1lXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN1YmRpcihcbiAgYmFzZURpcjogc3RyaW5nLFxuICBwYXR0ZXJuOiBzdHJpbmcsXG4gIGJvb2tUaXRsZTogc3RyaW5nLFxuICBib29rSWQ6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgY29uc3Qgc2FmZUJhc2UgPSBzYW5pdGl6ZUZpbGVuYW1lKGJhc2VEaXIsICdBcmNoaXZlQm9va3MnKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gc2FuaXRpemVGaWxlbmFtZShib29rVGl0bGUsICdib29rJyk7XG4gIGNvbnN0IHNhZmVJZCA9IHNhbml0aXplRmlsZW5hbWUoYm9va0lkLCAnaWQnKTtcblxuICBsZXQgZm9sZGVyID0gcGF0dGVybiB8fCAne3RpdGxlfV97aWR9JztcbiAgZm9sZGVyID0gZm9sZGVyLnJlcGxhY2UoL1xce3RpdGxlXFx9L2csIHNhZmVUaXRsZSk7XG4gIGZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXHtpZFxcfS9nLCBzYWZlSWQpO1xuICBmb2xkZXIgPSBzYW5pdGl6ZUZpbGVuYW1lKGZvbGRlciwgc2FmZVRpdGxlKTtcblxuICByZXR1cm4gYCR7c2FmZUJhc2V9LyR7Zm9sZGVyfWA7XG59XG5cbi8qKlxuICogRm9ybWF0cyBhIHBhZ2UgaW1hZ2UgZmlsZW5hbWUgd2l0aCB6ZXJvIHBhZGRpbmcuXG4gKiBFeGFtcGxlOiBcInBhZ2VfMDAxLmpwZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRQYWdlRmlsZW5hbWUoXG4gIHBhZ2VOdW06IG51bWJlcixcbiAgdG90YWxQYWdlczogbnVtYmVyLFxuICBmb3JtYXQgPSAnanBnJ1xuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFkTGVuZ3RoID0gTWF0aC5tYXgoMywgU3RyaW5nKHRvdGFsUGFnZXMpLmxlbmd0aCk7XG4gIGNvbnN0IHBhZGRlZE51bSA9IFN0cmluZyhwYWdlTnVtKS5wYWRTdGFydChwYWRMZW5ndGgsICcwJyk7XG4gIHJldHVybiBgcGFnZV8ke3BhZGRlZE51bX0uJHtmb3JtYXR9YDtcbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCb29rSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlRGp2dVhtbFRvVGV4dCB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuXG5leHBvcnQgY2xhc3MgQXJjaGl2ZVByb3ZpZGVyIGltcGxlbWVudHMgQm9va1Byb3ZpZGVyIHtcbiAgcmVhZG9ubHkgc2l0ZUlkID0gJ2FyY2hpdmUnIGFzIGNvbnN0O1xuICByZWFkb25seSBzaXRlTmFtZSA9ICdBcmNoaXZlLm9yZyc7XG4gIHJlYWRvbmx5IGRlZmF1bHRTdGFydFBhZ2UgPSAwO1xuXG4gIHByaXZhdGUgYm9va0luZm86IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG5cbiAgaXNNYXRjaCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5pbmNsdWRlcygnL2RldGFpbHMvJyk7XG4gIH1cblxuICBzZXRCb29rSW5mbyhpbmZvOiBCb29rSW5mbyB8IG51bGwpIHtcbiAgICB0aGlzLmJvb2tJbmZvID0gaW5mbztcbiAgfVxuXG4gIGFzeW5jIGRldGVjdEJvb2tJbmZvKCk6IFByb21pc2U8Qm9va0luZm8gfCBudWxsPiB7XG4gICAgLy8gUmVxdWVzdCBCb29rUmVhZGVyIGRldGVjdGlvbiBmcm9tIGJyaWRnZSBpbiBNQUlOIHdvcmxkXG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0RFVEVDVF9CT09LJyk7XG5cbiAgICAvLyBBbHNvIGluc3BlY3QgRE9NIGRpcmVjdGx5IGFzIGZhc3QgcGF0aCAvIGZhbGxiYWNrXG4gICAgY29uc3QgZG9tUGFnZSA9IHRoaXMuZXh0cmFjdFBhZ2VJbmZvRnJvbURvbSgpO1xuICAgIGlmIChkb21QYWdlKSB7XG4gICAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LnRpdGxlIHx8ICdBcmNoaXZlIEJvb2snO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvXFwvZGV0YWlsc1xcLyhbXlxcL1xcPyNdKykvKTtcbiAgICAgIGNvbnN0IGJvb2tJZCA9IGlkTWF0Y2ggPyBpZE1hdGNoWzFdIDogJ2Jvb2snO1xuXG4gICAgICBpZiAoIXRoaXMuYm9va0luZm8pIHtcbiAgICAgICAgdGhpcy5ib29rSW5mbyA9IHtcbiAgICAgICAgICBib29rSWQsXG4gICAgICAgICAgYm9va1RpdGxlOiB0aXRsZSxcbiAgICAgICAgICB0b3RhbFBhZ2VzOiBkb21QYWdlLnRvdGFsLFxuICAgICAgICAgIGN1cnJlbnRMZWFmOiBkb21QYWdlLmN1cnJlbnQsXG4gICAgICAgICAgY3VycmVudE1vZGU6IDEsXG4gICAgICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkb21QYWdlLnRvdGFsID4gMCAmJiAoIXRoaXMuYm9va0luZm8udG90YWxQYWdlcyB8fCB0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgPCBkb21QYWdlLnRvdGFsKSkge1xuICAgICAgICAgIHRoaXMuYm9va0luZm8udG90YWxQYWdlcyA9IGRvbVBhZ2UudG90YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ib29rSW5mbztcbiAgfVxuXG4gIGdldEN1cnJlbnRQYWdlKCk6IG51bWJlciB8IG51bGwge1xuICAgIC8vIDEuIENoZWNrIHN0YXR1cyAvIHBhZ2UgaW5kaWNhdG9yIHNwYW5zIGFjcm9zcyBCb29rUmVhZGVyIHZlcnNpb25zXG4gICAgY29uc3QgY3VycmVudFNwYW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0sIC5wYWdlLW51bWJlciwgLkJScGFnZXItY291bnRlcicpO1xuICAgIGlmIChjdXJyZW50U3BhbiAmJiBjdXJyZW50U3Bhbi50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBjdXJyZW50U3Bhbi50ZXh0Q29udGVudC5tYXRjaCgvXFwoKFxcZCspKD86XFxzKi1cXHMqXFxkKyk/XFxzKlxcL1xccyooXFxkKylcXCkvKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNpbXBsZU1hdGNoID0gY3VycmVudFNwYW4udGV4dENvbnRlbnQubWF0Y2goL1xcKChcXGQrKVxccypcXC8vKTtcbiAgICAgIGlmIChzaW1wbGVNYXRjaCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoc2ltcGxlTWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG9mTWF0Y2ggPSBjdXJyZW50U3Bhbi50ZXh0Q29udGVudC5tYXRjaCgvKFxcZCspXFxzK29mXFxzKyhcXGQrKS9pKTtcbiAgICAgIGlmIChvZk1hdGNoKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChvZk1hdGNoWzFdLCAxMCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzbGFzaE1hdGNoID0gY3VycmVudFNwYW4udGV4dENvbnRlbnQubWF0Y2goL1xcL1xccyooXFxkKykvKTtcbiAgICAgIGlmIChzbGFzaE1hdGNoKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChzbGFzaE1hdGNoWzFdLCAxMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gQ2hlY2sgaW5wdXQgZmllbGRzIHVzZWQgZm9yIHBhZ2UganVtcGluZ1xuICAgIGNvbnN0IHBhZ2VJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJ2lucHV0LkJScGFnZWlucHV0LCBpbnB1dC5wYWdlLW51bWJlci1pbnB1dCwgaW5wdXRbbmFtZT1cInBhZ2VcIl0nKTtcbiAgICBpZiAocGFnZUlucHV0ICYmIHBhZ2VJbnB1dC52YWx1ZSkge1xuICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQocGFnZUlucHV0LnZhbHVlLCAxMCk7XG4gICAgICBpZiAoIWlzTmFOKHZhbCkpIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgLy8gMy4gQWN0aXZlIHBhZ2UgY29udGFpbmVyIGluIERPTVxuICAgIGNvbnN0IGFjdGl2ZUNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5CUnBhZ2Vjb250YWluZXIuQlJwYWdlLXZpc2libGUsIC5CUnBhZ2UuYWN0aXZlLCAuQlJwYWdlY29udGFpbmVyW2RhdGEtaW5kZXhdJyk7XG4gICAgaWYgKGFjdGl2ZUNvbnRhaW5lcikge1xuICAgICAgY29uc3QgaWR4QXR0ciA9IGFjdGl2ZUNvbnRhaW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtaW5kZXgnKSB8fCBhY3RpdmVDb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXBhZ2UnKTtcbiAgICAgIGlmIChpZHhBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KGlkeEF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uIEFyY2hpdmUub3JnLi4uJyk7XG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ1NXSVRDSF9NT0RFXzEnKTtcblxuICAgIC8vIEFjY29tbW9kYXRlIG11bHRpcGxlIGJ1dHRvbiBzZWxlY3RvcnMgYWNyb3NzIEJvb2tSZWFkZXIgdmVyc2lvbnNcbiAgICBjb25zdCBvbmVQYWdlQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvbi5vbmUtcGFnZSwgLkJScGFnZXZpZXcxLCBidXR0b25bZGF0YS1tb2RlPVwiMVwiXSwgW2FyaWEtbGFiZWwqPVwiMS1wYWdlXCIgaV0sIC5CUmljb25fb25lcGFnZSwgLnZpZXctbW9kZS0xdXAnXG4gICAgKTtcbiAgICBpZiAob25lUGFnZUJ0biAmJiAhb25lUGFnZUJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpICYmIG9uZVBhZ2VCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnKSAhPT0gJ3RydWUnKSB7XG4gICAgICB0cnkgeyBvbmVQYWdlQnRuLmNsaWNrKCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgbmF2aWdhdGVUb1BhZ2UocGFnZU51bTogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBBcmNoaXZlIGxlYWYgJHtwYWdlTnVtfS4uLmApO1xuICAgIHRoaXMucG9zdFRvQnJpZGdlKCdKVU1QX1BBR0UnLCB7IGxlYWZJbmRleDogcGFnZU51bSB9KTtcblxuICAgIGlmIChwYWdlTnVtID09PSAwKSB7XG4gICAgICBjb25zdCBmaXJzdEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgICAnYnV0dG9uW3RpdGxlKj1cIkZpcnN0IHBhZ2VcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmlyc3QgcGFnZVwiIGldLCBidXR0b24ubmF2Zmlyc3QsIC5ib29rLWZsaXAtZmlyc3QsIC5CUm5hdmZpcnN0LCBbYXJpYS1sYWJlbD1cIkZpcnN0IHBhZ2VcIiBpXSdcbiAgICAgICk7XG4gICAgICBpZiAoZmlyc3RCdG4pIHtcbiAgICAgICAgdHJ5IHsgZmlyc3RCdG4uY2xpY2soKTsgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cblxuICAgICAgY29uc3QgaG9tZUV2ZW50ID0geyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBrZXk6ICdIb21lJywgY29kZTogJ0hvbWUnLCBrZXlDb2RlOiAzNiwgd2hpY2g6IDM2IH07XG4gICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBob21lRXZlbnQpKTtcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgaG9tZUV2ZW50KSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW06IG51bWJlcik6IHZvaWQge1xuICAgIC8vIDEuIERpcmVjdCBCb29rUmVhZGVyIEFQSSBjYWxsIHZpYSBicmlkZ2UgKG1vc3QgcmVsaWFibGUgaW4gTUFJTiB3b3JsZCwgc3VwcG9ydHMgYnIubmV4dCgpICYgdmVyc2lvbnMpXG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0ZMSVBfTkVYVCcsIHsgdGFyZ2V0UGFnZTogdGFyZ2V0UGFnZU51bSB9KTtcblxuICAgIC8vIDIuIERPTSBidXR0b24gY2xpY2sgZmFsbGJhY2sgYWNyb3NzIG11bHRpcGxlIEJvb2tSZWFkZXIgdmVyc2lvbnNcbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b24ubmF2bmV4dCwgLmJvb2stZmxpcC1yaWdodCwgLkJSbmF2bmV4dCwgW2FyaWEtbGFiZWw9XCJOZXh0IHBhZ2VcIiBpXSwgW2RhdGEtYWN0aW9uPVwibmV4dC1wYWdlXCIgaV0sIC5CUmljb25fZmxpcF9yaWdodCwgYnV0dG9uLnBhZ2UtbmV4dCdcbiAgICApO1xuICAgIGlmIChuZXh0QnRuKSB7XG4gICAgICB0cnkgeyBuZXh0QnRuLmNsaWNrKCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgLy8gMy4gS2V5Ym9hcmQgQXJyb3dSaWdodCAmIFBhZ2VEb3duIGV2ZW50cyBhY3Jvc3MgQm9va1JlYWRlciB2ZXJzaW9uc1xuICAgIGZvciAoY29uc3Qga2V5IG9mIFsnQXJyb3dSaWdodCcsICdQYWdlRG93biddKSB7XG4gICAgICBjb25zdCBrZXlFdmVudCA9IHtcbiAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAga2V5LFxuICAgICAgICBjb2RlOiBrZXksXG4gICAgICAgIGtleUNvZGU6IGtleSA9PT0gJ0Fycm93UmlnaHQnID8gMzkgOiAzNCxcbiAgICAgICAgd2hpY2g6IGtleSA9PT0gJ0Fycm93UmlnaHQnID8gMzkgOiAzNCxcbiAgICAgIH07XG4gICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICAgIH1cbiAgfVxuXG4gIGdldEFjdGl2ZVBhZ2VJbWFnZShtaW5XaWR0aCA9IDMwMCwgdGFyZ2V0UGFnZU51bT86IG51bWJlcik6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsIHtcbiAgICAvLyAxLiBEaXJlY3QgVGFyZ2V0IENvbnRhaW5lciBMb29rdXAgKHN1cHBvcnRzIG1vZGVybiAmIGxlZ2FjeSBCb29rUmVhZGVyIHZlcnNpb25zKVxuICAgIGlmICh0eXBlb2YgdGFyZ2V0UGFnZU51bSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnN0IHRhcmdldFNlbGVjdG9ycyA9IFtcbiAgICAgICAgYC5CUnBhZ2Vjb250YWluZXJbZGF0YS1pbmRleD1cIiR7dGFyZ2V0UGFnZU51bX1cIl0gaW1nYCxcbiAgICAgICAgYC5wYWdlZGl2JHt0YXJnZXRQYWdlTnVtfSBpbWdgLFxuICAgICAgICBgW2RhdGEtaW5kZXg9XCIke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGAuQlJwYWdlW2RhdGEtcGFnZT1cIiR7dGFyZ2V0UGFnZU51bX1cIl0gaW1nYCxcbiAgICAgICAgYC5CUnBhZ2VbZGF0YS1sZWFmPVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWdgLFxuICAgICAgICBgI3BhZ2VkaXYke3RhcmdldFBhZ2VOdW19IGltZ2AsXG4gICAgICAgIGAjcGFnZSR7dGFyZ2V0UGFnZU51bX0gaW1nYCxcbiAgICAgICAgYGltZ1tkYXRhLXNlcT1cIiR7dGFyZ2V0UGFnZU51bX1cIl1gLFxuICAgICAgXTtcbiAgICAgIGZvciAoY29uc3Qgc2VsIG9mIHRhcmdldFNlbGVjdG9ycykge1xuICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEltYWdlRWxlbWVudD4oc2VsKTtcbiAgICAgICAgaWYgKGVsICYmIGVsLmNvbXBsZXRlICYmIGVsLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiBlbC5zcmMpIHtcbiAgICAgICAgICBlbC5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBRdWVyeSBhbGwgY2FuZGlkYXRlIHBhZ2UgaW1hZ2VzIGFjcm9zcyBhbGwgQm9va1JlYWRlciB2ZXJzaW9uc1xuICAgIGNvbnN0IGltYWdlU2VsZWN0b3JzID0gW1xuICAgICAgJy5CUnBhZ2Vjb250YWluZXIgaW1nJyxcbiAgICAgICdpbWcuQlJwYWdlaW1hZ2UnLFxuICAgICAgJy5CUnBhZ2UgaW1nJyxcbiAgICAgICcuQlJwYWdldmlldyBpbWcnLFxuICAgICAgJ2ltZ1tjbGFzcyo9XCJCUnBhZ2VcIl0nLFxuICAgICAgJ2ltZ1tzcmMqPVwiQm9va1JlYWRlckltYWdlcy5waHBcIl0nLFxuICAgICAgJ2ltZ1tzcmMqPVwiL0Jvb2tSZWFkZXIvXCJdJyxcbiAgICAgICdpbWdbc3JjKj1cInNjYWxlPVwiXScsXG4gICAgICAnaW1nW3NyYyo9XCJ6aXA9XCJdJyxcbiAgICAgICcuYm9vay1wYWdlIGltZycsXG4gICAgXTtcbiAgICBjb25zdCBpbWFnZXMgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEltYWdlRWxlbWVudD4oaW1hZ2VTZWxlY3RvcnMuam9pbignLCAnKSkpO1xuICAgIGNvbnN0IHZhbGlkID0gaW1hZ2VzLmZpbHRlcihpbWcgPT4gaW1nLmNvbXBsZXRlICYmIGltZy5uYXR1cmFsV2lkdGggPj0gbWluV2lkdGggJiYgaW1nLnNyYyk7XG5cbiAgICBpZiAodmFsaWQubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDMuIElmIHRhcmdldFBhZ2VOdW0gaXMgc3BlY2lmaWVkLCBmaW5kIGFueSBpbWFnZSB3aG9zZSBwYXJlbnQvY29udGFpbmVyIG9yIGRhdGFzZXQgbWF0Y2hlcyB0YXJnZXRQYWdlTnVtXG4gICAgaWYgKHR5cGVvZiB0YXJnZXRQYWdlTnVtID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgbWF0Y2ggPSB2YWxpZC5maW5kKGltZyA9PiB7XG4gICAgICAgIGlmIChpbWcuZGF0YXNldC5zZXEgPT09IFN0cmluZyh0YXJnZXRQYWdlTnVtKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGltZy5jbG9zZXN0KCcuQlJwYWdlY29udGFpbmVyLCAuQlJwYWdlLCBbZGF0YS1pbmRleF0sIFtkYXRhLXBhZ2VdJyk7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICBjb25zdCBpZHggPSBjb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLWluZGV4JykgfHwgY29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1wYWdlJykgfHwgY29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1sZWFmJyk7XG4gICAgICAgICAgaWYgKGlkeCA9PT0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBpZiAoY29udGFpbmVyLmNsYXNzTGlzdC5jb250YWlucyhgcGFnZWRpdiR7dGFyZ2V0UGFnZU51bX1gKSB8fCBjb250YWluZXIuY2xhc3NMaXN0LmNvbnRhaW5zKGBwJHt0YXJnZXRQYWdlTnVtfWApKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBtYXRjaC5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDQuIFZpZXdwb3J0IHZpc2liaWxpdHkgc2NvcmluZzogUGljayB0aGUgaW1hZ2Ugd2l0aCB0aGUgbGFyZ2VzdCB2aXNpYmxlIGFyZWEgb24gc2NyZWVuXG4gICAgbGV0IGJlc3RJbWc6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbWF4VmlzaWJsZUFyZWEgPSAwO1xuICAgIGNvbnN0IHdpblcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5pbm5lcldpZHRoIDogMTkyMDtcbiAgICBjb25zdCB3aW5IID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiAxMDgwO1xuXG4gICAgZm9yIChjb25zdCBpbWcgb2YgdmFsaWQpIHtcbiAgICAgIGNvbnN0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCB2aXNpYmxlV2lkdGggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LnJpZ2h0LCB3aW5XKSAtIE1hdGgubWF4KHJlY3QubGVmdCwgMCkpO1xuICAgICAgY29uc3QgdmlzaWJsZUhlaWdodCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QuYm90dG9tLCB3aW5IKSAtIE1hdGgubWF4KHJlY3QudG9wLCAwKSk7XG4gICAgICBjb25zdCBhcmVhID0gdmlzaWJsZVdpZHRoICogdmlzaWJsZUhlaWdodDtcblxuICAgICAgaWYgKGFyZWEgPiBtYXhWaXNpYmxlQXJlYSAmJiB2aXNpYmxlV2lkdGggPiA1MCAmJiB2aXNpYmxlSGVpZ2h0ID4gNTApIHtcbiAgICAgICAgbWF4VmlzaWJsZUFyZWEgPSBhcmVhO1xuICAgICAgICBiZXN0SW1nID0gaW1nO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChiZXN0SW1nKSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldFBhZ2VOdW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGJlc3RJbWcuZGF0YXNldC5zZXEgPSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmVzdEltZztcbiAgICB9XG5cbiAgICAvLyA1LiBGYWxsYmFjazogTGF0ZXN0IHZhbGlkIGltYWdlIGluIERPTSBvcmRlciAobmV3ZXN0IHBhZ2UpXG4gICAgY29uc3QgZmFsbGJhY2sgPSB2YWxpZFt2YWxpZC5sZW5ndGggLSAxXTtcbiAgICBpZiAoZmFsbGJhY2sgJiYgdHlwZW9mIHRhcmdldFBhZ2VOdW0gPT09ICdudW1iZXInKSB7XG4gICAgICBmYWxsYmFjay5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgYXN5bmMgZXh0cmFjdFBhZ2VUZXh0KHBhZ2VOdW06IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLmJvb2tJbmZvIHx8ICF0aGlzLmJvb2tJbmZvLnNlcnZlciB8fCAhdGhpcy5ib29rSW5mby5ib29rUGF0aCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGNvbnN0IGxlYWZJbmRleCA9IHBhZ2VOdW07XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vJHt0aGlzLmJvb2tJbmZvLnNlcnZlcn0vQm9va1JlYWRlci9Cb29rUmVhZGVyR2V0VGV4dFdyYXBwZXIucGhwP3BhdGg9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5ib29rSW5mby5ib29rUGF0aCl9X2RqdnUueG1sJm1vZGU9ZGp2dV94bWwmcGFnZT0ke2xlYWZJbmRleH1gO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScsXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiAnJztcbiAgICAgIGNvbnN0IHhtbCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIHJldHVybiBwYXJzZURqdnVYbWxUb1RleHQoeG1sKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgZmV0Y2ggdGV4dCBmb3IgbGVhZiAke2xlYWZJbmRleH06YCwgZXJyKTtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1cblxuICBpc0F0RW5kT2ZCb29rKGN1cnJlbnRQYWdlOiBudW1iZXIsIHRvdGFsUGFnZXM6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgICdidXR0b25bdGl0bGUqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvbi5uYXZuZXh0LCAuYm9vay1mbGlwLXJpZ2h0LCAuQlJuYXZuZXh0LCBbYXJpYS1sYWJlbD1cIk5leHQgcGFnZVwiIGldLCBbZGF0YS1hY3Rpb249XCJuZXh0LXBhZ2VcIiBpXSdcbiAgICApO1xuICAgIGNvbnN0IGlzTmV4dERpc2FibGVkID0gbmV4dEJ0biAmJiAoXG4gICAgICBuZXh0QnRuLmRpc2FibGVkIHx8XG4gICAgICBuZXh0QnRuLmdldEF0dHJpYnV0ZSgnYXJpYS1kaXNhYmxlZCcpID09PSAndHJ1ZScgfHxcbiAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpXG4gICAgKTtcbiAgICBjb25zdCBkb21MZWFmID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpO1xuICAgIHJldHVybiBCb29sZWFuKGlzTmV4dERpc2FibGVkIHx8ICh0b3RhbFBhZ2VzID4gMCAmJiBkb21MZWFmICE9PSBudWxsICYmIGRvbUxlYWYgPj0gdG90YWxQYWdlcyAmJiBjdXJyZW50UGFnZSA+PSB0b3RhbFBhZ2VzKSk7XG4gIH1cblxuICBwcml2YXRlIHBvc3RUb0JyaWRnZShhY3Rpb246IHN0cmluZywgZXh0cmFEYXRhOiBhbnkgPSB7fSkge1xuICAgIHdpbmRvdy5wb3N0TWVzc2FnZSh7IGRpcmVjdGlvbjogJ1RPX0JSSURHRScsIGFjdGlvbiwgLi4uZXh0cmFEYXRhIH0sICcqJyk7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RQYWdlSW5mb0Zyb21Eb20oKTogeyBjdXJyZW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfSB8IG51bGwge1xuICAgIGNvbnN0IHBhZ2VFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5CUmN1cnJlbnRwYWdlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW3JvbGU9XCJzdGF0dXNcIl0nKTtcbiAgICBpZiAocGFnZUVsICYmIHBhZ2VFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYWdlRWwudGV4dENvbnRlbnQubWF0Y2goL1xcKChcXGQrKVxccypcXC9cXHMqKFxcZCspXFwpLyk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjdXJyZW50OiBwYXJzZUludChtYXRjaFsxXSwgMTApLFxuICAgICAgICAgIHRvdGFsOiBwYXJzZUludChtYXRjaFsyXSwgMTApLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwKICAgICJpbXBvcnQgeyBCb29rUHJvdmlkZXIgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IEJvb2tJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQgfSBmcm9tICcuLi91dGlscy9tYXJrZG93bi1idWlsZGVyJztcblxuZXhwb3J0IGNsYXNzIEhhdGhpVHJ1c3RQcm92aWRlciBpbXBsZW1lbnRzIEJvb2tQcm92aWRlciB7XG4gIHJlYWRvbmx5IHNpdGVJZCA9ICdoYXRoaXRydXN0JyBhcyBjb25zdDtcbiAgcmVhZG9ubHkgc2l0ZU5hbWUgPSAnSGF0aGlUcnVzdCc7XG4gIHJlYWRvbmx5IGRlZmF1bHRTdGFydFBhZ2UgPSAxOyAvLyBIYXRoaVRydXN0IHNlcXVlbmNlcyBhcmUgMS1iYXNlZFxuXG4gIHByaXZhdGUgYm9va0luZm86IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gVHJhY2tpbmcgbG9hZGVkIHNlcXVlbmNlcyBmcm9tIE1BSU4gd29ybGQgYnJpZGdlXG4gIHByaXZhdGUgYW5ub3VuY2VkU2VxdWVuY2VzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIHByaXZhdGUgc2VxVG9CbG9iVXJsID0gbmV3IE1hcDxudW1iZXIsIHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBibG9iVXJsVG9TZXEgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBwcml2YXRlIHNlcVRvSHRtbCA9IG5ldyBNYXA8bnVtYmVyLCBzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gTGlzdGVuIGZvciBicmlkZ2UgbWVzc2FnZXMgKHdvcmxkOiBNQUlOKVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSAhPT0gd2luZG93IHx8ICFldmVudC5kYXRhIHx8IGV2ZW50LmRhdGEuZGlyZWN0aW9uICE9PSAnRlJPTV9CUklER0UnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGE7XG4gICAgICAgIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0xPQURfQU5OT1VOQ0VEJykge1xuICAgICAgICAgIGlmIChtc2cuaXNMb2FkZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYW5ub3VuY2VkU2VxdWVuY2VzLmFkZChtc2cuc2VxKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEhhdGhpVHJ1c3QgYW5ub3VuY2VkIHNlcXVlbmNlICR7bXNnLnNlcX0gbG9hZGVkYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfSU1BR0VfUkVBRFknKSB7XG4gICAgICAgICAgdGhpcy5zZXFUb0Jsb2JVcmwuc2V0KG1zZy5zZXEsIG1zZy5ibG9iVXJsKTtcbiAgICAgICAgICB0aGlzLmJsb2JVcmxUb1NlcS5zZXQobXNnLmJsb2JVcmwsIG1zZy5zZXEpO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfVEVYVF9SRUFEWScpIHtcbiAgICAgICAgICB0aGlzLnNlcVRvSHRtbC5zZXQobXNnLnNlcSwgbXNnLmh0bWwpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBvblBhZ2VMb2FkQW5ub3VuY2VkKHNlcTogbnVtYmVyLCBpc1Zpc2libGU6IGJvb2xlYW4sIGlzTG9hZGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKGlzTG9hZGVkKSB7XG4gICAgICB0aGlzLmFubm91bmNlZFNlcXVlbmNlcy5hZGQoc2VxKTtcbiAgICB9XG4gIH1cblxuICBvblBhZ2VJbWFnZVJlYWR5KHNlcTogbnVtYmVyLCBibG9iVXJsOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNlcVRvQmxvYlVybC5zZXQoc2VxLCBibG9iVXJsKTtcbiAgICB0aGlzLmJsb2JVcmxUb1NlcS5zZXQoYmxvYlVybCwgc2VxKTtcbiAgfVxuXG4gIG9uUGFnZVRleHRSZWFkeShzZXE6IG51bWJlciwgaHRtbDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zZXFUb0h0bWwuc2V0KHNlcSwgaHRtbCk7XG4gIH1cblxuICBnZXRCbG9iVXJsRm9yU2VxKHNlcTogbnVtYmVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5zZXFUb0Jsb2JVcmwuZ2V0KHNlcSk7XG4gIH1cblxuICBnZXRDYWNoZWRIdG1sRm9yU2VxKHNlcTogbnVtYmVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5zZXFUb0h0bWwuZ2V0KHNlcSk7XG4gIH1cblxuICBpc1BhZ2VBbm5vdW5jZWQoc2VxOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hbm5vdW5jZWRTZXF1ZW5jZXMuaGFzKHNlcSk7XG4gIH1cblxuICBpc01hdGNoKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlzSG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2JhYmVsLmhhdGhpdHJ1c3Qub3JnJyB8fFxuICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzSG9zdDtcbiAgfVxuXG4gIGFzeW5jIGRldGVjdEJvb2tJbmZvKCk6IFByb21pc2U8Qm9va0luZm8gfCBudWxsPiB7XG4gICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgICBjb25zdCBib29rSWQgPSBwYXJhbXMuZ2V0KCdpZCcpIHx8ICdoYXRoaXRydXN0X2Jvb2snO1xuXG4gICAgLy8gMS4gRGV0ZWN0IEJvb2sgVGl0bGVcbiAgICBsZXQgYm9va1RpdGxlID0gJyc7XG4gICAgY29uc3QgbWV0YVRpdGxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy50aXRsZVwiXSwgbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJyk7XG4gICAgaWYgKG1ldGFUaXRsZSAmJiBtZXRhVGl0bGUuY29udGVudCkge1xuICAgICAgYm9va1RpdGxlID0gbWV0YVRpdGxlLmNvbnRlbnQudHJpbSgpO1xuICAgIH1cbiAgICBpZiAoIWJvb2tUaXRsZSkge1xuICAgICAgY29uc3QgaDEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoMS50aXRsZSwgaDEuaXRlbS10aXRsZSwgaDEnKTtcbiAgICAgIGlmIChoMSAmJiBoMS50ZXh0Q29udGVudCkge1xuICAgICAgICBib29rVGl0bGUgPSBoMS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghYm9va1RpdGxlKSB7XG4gICAgICBib29rVGl0bGUgPSBkb2N1bWVudC50aXRsZSA/IGRvY3VtZW50LnRpdGxlLnJlcGxhY2UoL1stfF1cXHMqSGF0aGlUcnVzdC4qL2ksICcnKS50cmltKCkgOiAnSGF0aGlUcnVzdCBCb29rJztcbiAgICB9XG5cbiAgICAvLyAyLiBEZXRlY3QgVG90YWwgUGFnZXNcbiAgICBjb25zdCB0b3RhbFBhZ2VzID0gdGhpcy5nZXRUb3RhbFBhZ2VzRnJvbURvbSgpO1xuXG4gICAgLy8gMy4gRGV0ZWN0IEN1cnJlbnQgU2VxdWVuY2VcbiAgICBjb25zdCBjdXJyZW50U2VxID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpIHx8IDE7XG5cbiAgICAvLyBDaGVjayBhdXRob3IgYW5kIHllYXIgaWYgcHJlc2VudCBpbiBtZXRhZGF0YVxuICAgIGNvbnN0IGF1dGhvck1ldGEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxNZXRhRWxlbWVudD4oJ21ldGFbbmFtZT1cIkRDLmNyZWF0b3JcIl0nKTtcbiAgICBjb25zdCBhdXRob3IgPSBhdXRob3JNZXRhPy5jb250ZW50O1xuXG4gICAgY29uc3QgZGF0ZU1ldGEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxNZXRhRWxlbWVudD4oJ21ldGFbbmFtZT1cIkRDLmRhdGVcIl0nKTtcbiAgICBjb25zdCB5ZWFyID0gZGF0ZU1ldGE/LmNvbnRlbnQ7XG5cbiAgICB0aGlzLmJvb2tJbmZvID0ge1xuICAgICAgYm9va0lkLFxuICAgICAgYm9va1RpdGxlOiBib29rVGl0bGUgfHwgJ0hhdGhpVHJ1c3QgQm9vaycsXG4gICAgICB0b3RhbFBhZ2VzOiB0b3RhbFBhZ2VzIHx8IDUwMCxcbiAgICAgIGN1cnJlbnRMZWFmOiBjdXJyZW50U2VxLFxuICAgICAgY3VycmVudE1vZGU6IDEsXG4gICAgICBzb3VyY2VVcmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgYXV0aG9yLFxuICAgICAgeWVhcixcbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gSGF0aGlUcnVzdCB2b2x1bWUgZGV0ZWN0ZWQ6JywgdGhpcy5ib29rSW5mby5ib29rVGl0bGUsIGAoJHt0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXN9IHBhZ2VzKWApO1xuICAgIHJldHVybiB0aGlzLmJvb2tJbmZvO1xuICB9XG5cbiAgZ2V0Q3VycmVudFBhZ2UoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBudWxsO1xuXG4gICAgLy8gMS4gQ2hlY2sgdG9vbGJhciBpbnB1dFxuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG4gICAgaWYgKHNlcUlucHV0ICYmIHNlcUlucHV0LnZhbHVlKSB7XG4gICAgICBjb25zdCB2YWwgPSBwYXJzZUludChzZXFJbnB1dC52YWx1ZSwgMTApO1xuICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgLy8gMi4gQ2hlY2sgVVJMIHNlYXJjaCBwYXJhbVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYXRpb24gJiYgd2luZG93LmxvY2F0aW9uLnNlYXJjaCkge1xuICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgICAgIGNvbnN0IHNlcSA9IHBhcmFtcy5nZXQoJ3NlcScpO1xuICAgICAgaWYgKHNlcSkge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChzZXEsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMy4gQ2hlY2sgZGF0YS1zZXEgb24gYWN0aXZlIGZpZ3VyZSBvciBzcHJlYWRcbiAgICBjb25zdCBhY3RpdmVGaWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYuc3ByZWFkIGZpZ3VyZVtkYXRhLXNlcV0sIGZpZ3VyZVtkYXRhLXNlcV0nKTtcbiAgICBpZiAoYWN0aXZlRmlnKSB7XG4gICAgICBjb25zdCBzZXFBdHRyID0gYWN0aXZlRmlnLmdldEF0dHJpYnV0ZSgnZGF0YS1zZXEnKTtcbiAgICAgIGlmIChzZXFBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHNlcUF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhc3luYyBuYXZpZ2F0ZVRvUGFnZShwYWdlTnVtOiBudW1iZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBOYXZpZ2F0aW5nIHRvIEhhdGhpVHJ1c3Qgc2VxdWVuY2UgJHtwYWdlTnVtfS4uLmApO1xuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG5cbiAgICBpZiAoc2VxSW5wdXQpIHtcbiAgICAgIHNlcUlucHV0LmZvY3VzKCk7XG4gICAgICBzZXFJbnB1dC52YWx1ZSA9IFN0cmluZyhwYWdlTnVtKTtcbiAgICAgIHNlcUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2hhbmdlJywgeyBidWJibGVzOiB0cnVlIH0pKTtcblxuICAgICAgLy8gRGlzcGF0Y2ggRW50ZXIga2V5ZG93biBldmVudFxuICAgICAgY29uc3QgZW50ZXJFdmVudCA9IG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywge1xuICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICBrZXk6ICdFbnRlcicsXG4gICAgICAgIGNvZGU6ICdFbnRlcicsXG4gICAgICAgIGtleUNvZGU6IDEzLFxuICAgICAgICB3aGljaDogMTMsXG4gICAgICB9KTtcbiAgICAgIHNlcUlucHV0LmRpc3BhdGNoRXZlbnQoZW50ZXJFdmVudCk7XG5cbiAgICAgIC8vIFN1Ym1pdCBwYXJlbnQgZm9ybSBpZiBwcmVzZW50XG4gICAgICBjb25zdCBmb3JtID0gc2VxSW5wdXQuY2xvc2VzdCgnZm9ybScpO1xuICAgICAgaWYgKGZvcm0pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGZvcm0ucmVxdWVzdFN1Ym1pdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgZm9ybS5yZXF1ZXN0U3VibWl0KCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm0uZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3N1Ym1pdCcsIHsgYnViYmxlczogdHJ1ZSwgY2FuY2VsYWJsZTogdHJ1ZSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW06IG51bWJlcik6IHZvaWQge1xuICAgIC8vIDEuIFByaW1hcnk6IENsaWNrIE5leHQgUGFnZSBidXR0b25cbiAgICAvLyA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tb3V0bGluZS1kYXJrXCIgYXJpYS1sYWJlbD1cIk5leHQgUGFnZVwiPjxpIGNsYXNzPVwiZmEtc29saWQgZmEtYW5nbGUtcmlnaHRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PC9idXR0b24+XG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQgfCBIVE1MQW5jaG9yRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW2FyaWEtbGFiZWw9XCJOZXh0IFBhZ2VcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiTmV4dFwiIGldLCBidXR0b25bdGl0bGUqPVwiTmV4dFwiIGldLCBbYWNjZXNza2V5PVwiblwiXSwgYnV0dG9uLm5leHQsIGEuYWN0aW9uLW5leHQtcGFnZSdcbiAgICApO1xuICAgIGlmIChuZXh0QnRuKSB7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IChuZXh0QnRuIGFzIGFueSkuZGlzYWJsZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtZGlzYWJsZWQnKSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpO1xuICAgICAgaWYgKCFkaXNhYmxlZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIENsaWNraW5nIEhhdGhpVHJ1c3QgTmV4dCBQYWdlIGJ1dHRvbi4uLicpO1xuICAgICAgICAgIG5leHRCdG4uY2xpY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gS2V5Ym9hcmQgQXJyb3dSaWdodCBldmVudCAoc3RhbmRhcmQgcmVhZGVyIGhvdGtleSlcbiAgICBjb25zdCBrZXlFdmVudCA9IHtcbiAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAga2V5OiAnQXJyb3dSaWdodCcsXG4gICAgICBjb2RlOiAnQXJyb3dSaWdodCcsXG4gICAgICBrZXlDb2RlOiAzOSxcbiAgICAgIHdoaWNoOiAzOSxcbiAgICB9O1xuICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGtleUV2ZW50KSk7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuXG4gICAgLy8gMy4gRmFsbGJhY2s6IG9ubHkgaWYgTmV4dCBidXR0b24gaXMgbm90IGF2YWlsYWJsZSwgdXNlIHNlcXVlbmNlIGlucHV0XG4gICAgY29uc3Qgc2VxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbGJhci1zZXEsIGlucHV0W25hbWU9XCJzZXFcIl0nKTtcbiAgICBpZiAoc2VxSW5wdXQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZhbGxiYWNrIHRvIHNlcXVlbmNlIGlucHV0ICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICAgIHRoaXMubmF2aWdhdGVUb1BhZ2UodGFyZ2V0UGFnZU51bSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QWN0aXZlUGFnZUltYWdlKG1pbldpZHRoID0gMzAwLCB0YXJnZXRTZXE/OiBudW1iZXIpOiBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbCB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBudWxsO1xuXG4gICAgLy8gMS4gSWYgdGFyZ2V0U2VxIGlzIHNwZWNpZmllZCAoZHVyaW5nIHNlcXVlbnRpYWwgY2FwdHVyZSlcbiAgICBpZiAodHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTZXEgPSB0aGlzLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICAvLyBJZiB0aGUgcmVhZGVyIHRvb2xiYXIgaGFzIG5vdCByZWFjaGVkIHRhcmdldFNlcSB5ZXQsIHdhaXQhXG4gICAgICBpZiAoY3VycmVudFNlcSAhPT0gbnVsbCAmJiBjdXJyZW50U2VxIDwgdGFyZ2V0U2VxKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbiBpbWFnZSBleHBsaWNpdGx5IHRhZ2dlZCB3aXRoIHRhcmdldFNlcVxuICAgICAgY29uc3QgdGFnZ2VkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW1hZ2VFbGVtZW50PihgaW1nW2RhdGEtc2VxPVwiJHt0YXJnZXRTZXF9XCJdYCk7XG4gICAgICBpZiAodGFnZ2VkICYmIHRhZ2dlZC5jb21wbGV0ZSAmJiB0YWdnZWQubmF0dXJhbFdpZHRoID49IG1pbldpZHRoICYmIHRhZ2dlZC5zcmMgJiYgIXRhZ2dlZC5zcmMuaW5jbHVkZXMoJ2Jhc2U2NCxpVkJPUncnKSkge1xuICAgICAgICByZXR1cm4gdGFnZ2VkO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJ5IGNhbmRpZGF0ZSBwYWdlIGltYWdlcyBpbnNpZGUgbWFpbiNtYWluXG4gICAgY29uc3QgaW1hZ2VzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbWFnZUVsZW1lbnQ+KFxuICAgICAgJ21haW4jbWFpbiBkZXRhaWxzIGZpZ3VyZSBkaXYuaW1hZ2UgaW1nLCBtYWluI21haW4gZGV0YWlscyBmaWd1cmUgaW1nLCBtYWluI21haW4gZGl2LnNwcmVhZCBmaWd1cmUgZGl2LmltYWdlIGltZywgbWFpbiNtYWluIGRpdi5zcHJlYWQgZmlndXJlIGltZywgbWFpbiNtYWluIGltZ1tzcmNePVwiYmxvYjpcIl0sIG1haW4jbWFpbiBpbWcnXG4gICAgKSk7XG5cbiAgICBjb25zdCB2YWxpZCA9IGltYWdlcy5maWx0ZXIoaW1nID0+XG4gICAgICBpbWcuY29tcGxldGUgJiZcbiAgICAgIGltZy5uYXR1cmFsV2lkdGggPj0gbWluV2lkdGggJiZcbiAgICAgIGltZy5zcmMgJiZcbiAgICAgICFpbWcuc3JjLmluY2x1ZGVzKCdiYXNlNjQsaVZCT1J3JykgLy8gSWdub3JlIHRyYW5zcGFyZW50IDF4MSBwbGFjZWhvbGRlclxuICAgICk7XG5cbiAgICBpZiAodmFsaWQubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIFBpY2sgaW1hZ2UgdmlzaWJsZSB3aXRoaW4gYnJvd3NlciB2aWV3cG9ydFxuICAgIGNvbnN0IHZpc2libGUgPSB2YWxpZC5maW5kKGltZyA9PiB7XG4gICAgICAvLyBJZiBpbWFnZSBpcyBleHBsaWNpdGx5IHRhZ2dlZCB3aXRoIGEgZGlmZmVyZW50IHNlcXVlbmNlLCBkbyBub3QgcGljayBpdCFcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0U2VxID09PSAnbnVtYmVyJyAmJiBpbWcuZGF0YXNldC5zZXEgJiYgcGFyc2VJbnQoaW1nLmRhdGFzZXQuc2VxLCAxMCkgIT09IHRhcmdldFNlcSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICByZXR1cm4gcmVjdC53aWR0aCA+IDUwICYmIHJlY3QuaGVpZ2h0ID4gNTAgJiZcbiAgICAgICAgICAgICByZWN0LnRvcCA8IHdpbmRvdy5pbm5lckhlaWdodCAmJiByZWN0LmJvdHRvbSA+IDAgJiZcbiAgICAgICAgICAgICByZWN0LmxlZnQgPCB3aW5kb3cuaW5uZXJXaWR0aCAmJiByZWN0LnJpZ2h0ID4gMDtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNob3NlbiA9IHZpc2libGUgfHwgdmFsaWRbMF07XG4gICAgaWYgKGNob3NlbiAmJiB0eXBlb2YgdGFyZ2V0U2VxID09PSAnbnVtYmVyJykge1xuICAgICAgY2hvc2VuLnNldEF0dHJpYnV0ZSgnZGF0YS1zZXEnLCBTdHJpbmcodGFyZ2V0U2VxKSk7XG4gICAgICBjaG9zZW4uZGF0YXNldC5zZXEgPSBTdHJpbmcodGFyZ2V0U2VxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hvc2VuO1xuICB9XG5cbiAgYXN5bmMgZXh0cmFjdFBhZ2VUZXh0KHBhZ2VOdW06IG51bWJlciwgaW1nPzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNsZWVwID0gKG1zOiBudW1iZXIpID0+IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcblxuICAgIC8vIDEuIENoZWNrIGlmIHdlIGFscmVhZHkgcmVjZWl2ZWQgdGhlIE9DUiBIVE1MIGZyb20gdGhlIG5ldHdvcmsgaW50ZXJjZXB0aW9uXG4gICAgY29uc3QgY2FjaGVkSHRtbCA9IHRoaXMuc2VxVG9IdG1sLmdldChwYWdlTnVtKTtcbiAgICBpZiAoY2FjaGVkSHRtbCkge1xuICAgICAgY29uc3QgdGV4dCA9IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGNhY2hlZEh0bWwpO1xuICAgICAgaWYgKHRleHQgJiYgdGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIC8vIDIuIFF1ZXJ5IERPTSBmb3IgdGFyZ2V0IHNlcXVlbmNlJ3MgZmlnY2FwdGlvbiwgcmV0cnlpbmcgYnJpZWZseSAodXAgdG8gMjUwMG1zKVxuICAgIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnQgPCAyNTAwKSB7XG4gICAgICAvLyAyYS4gSWYgaW1nIHdhcyBwYXNzZWQsIGNoZWNrIGl0cyBjbG9zZXN0IGZpZ3VyZTpcbiAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgY29uc3QgZmlndXJlID0gaW1nLmNsb3Nlc3QoJ2ZpZ3VyZScpO1xuICAgICAgICBpZiAoZmlndXJlKSB7XG4gICAgICAgICAgY29uc3QgZmlnY2FwdGlvbiA9IGZpZ3VyZS5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignZmlnY2FwdGlvbicpO1xuICAgICAgICAgIGlmIChmaWdjYXB0aW9uICYmIGZpZ2NhcHRpb24udGV4dENvbnRlbnQgJiYgZmlnY2FwdGlvbi50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGZpZ2NhcHRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyAyYi4gQ2hlY2sgZXhwbGljaXRseSB0YWdnZWQgZmlnY2FwdGlvbjpcbiAgICAgIGNvbnN0IHRhZ2dlZEZpZ2NhcHRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICAgICAgYGZpZ3VyZVtkYXRhLXNlcT1cIiR7cGFnZU51bX1cIl0gZmlnY2FwdGlvbiwgZmlnY2FwdGlvbltkYXRhLXNlcT1cIiR7cGFnZU51bX1cIl0sIC5zcHJlYWRbZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdIGZpZ2NhcHRpb25gXG4gICAgICApO1xuICAgICAgaWYgKHRhZ2dlZEZpZ2NhcHRpb24gJiYgdGFnZ2VkRmlnY2FwdGlvbi50ZXh0Q29udGVudCAmJiB0YWdnZWRGaWdjYXB0aW9uLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dCh0YWdnZWRGaWdjYXB0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8gMmMuIEZhbGxiYWNrOiBjaGVjayBtYWluIHNwcmVhZCBkZXRhaWxzIGZpZ2NhcHRpb246XG4gICAgICBjb25zdCBzcHJlYWRGaWdjYXB0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICAgICdtYWluI21haW4gZGV0YWlscyBmaWd1cmUgZmlnY2FwdGlvbiwgbWFpbiNtYWluIGZpZ3VyZSBmaWdjYXB0aW9uLCBtYWluI21haW4gZmlnY2FwdGlvbidcbiAgICAgICk7XG4gICAgICBpZiAoc3ByZWFkRmlnY2FwdGlvbiAmJiBzcHJlYWRGaWdjYXB0aW9uLnRleHRDb250ZW50ICYmIHNwcmVhZEZpZ2NhcHRpb24udGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KHNwcmVhZEZpZ2NhcHRpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyAyZC4gQ2hlY2sgaWYgbmV0d29yayByZXNwb25zZSBhcnJpdmVkIHdoaWxlIHBvbGxpbmc6XG4gICAgICBjb25zdCBsYXRlSHRtbCA9IHRoaXMuc2VxVG9IdG1sLmdldChwYWdlTnVtKTtcbiAgICAgIGlmIChsYXRlSHRtbCkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQobGF0ZUh0bWwpO1xuICAgICAgICBpZiAodGV4dCAmJiB0ZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2xlZXAoMTAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBpc0F0RW5kT2ZCb29rKGN1cnJlbnRQYWdlOiBudW1iZXIsIHRvdGFsUGFnZXM6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICh0b3RhbFBhZ2VzID4gMCAmJiBjdXJyZW50UGFnZSA+PSB0b3RhbFBhZ2VzKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudCB8IEhUTUxBbmNob3JFbGVtZW50PihcbiAgICAgICdidXR0b25bYXJpYS1sYWJlbCo9XCJOZXh0XCIgaV0sIGJ1dHRvblt0aXRsZSo9XCJOZXh0XCIgaV0sIFthY2Nlc3NrZXk9XCJuXCJdJ1xuICAgICk7XG4gICAgaWYgKG5leHRCdG4pIHtcbiAgICAgIGNvbnN0IGRpc2FibGVkID0gKG5leHRCdG4gYXMgYW55KS5kaXNhYmxlZCB8fFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0QnRuLmdldEF0dHJpYnV0ZSgnYXJpYS1kaXNhYmxlZCcpID09PSAndHJ1ZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2Rpc2FibGVkJyk7XG4gICAgICBpZiAoZGlzYWJsZWQpIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VG90YWxQYWdlc0Zyb21Eb20oKTogbnVtYmVyIHtcbiAgICAvLyAxLiBDaGVjayBwYXJlbnQgY29udGFpbmVyIG9mICN0b29sYmFyLXNlcTogPGlucHV0IGlkPVwidG9vbGJhci1zZXFcIj4gLi4uIDxzcGFuPi88L3NwYW4+IDxzcGFuPjI3Mjwvc3Bhbj5cbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuICAgIGlmIChzZXFJbnB1dCkge1xuICAgICAgY29uc3QgcGFyZW50ID0gc2VxSW5wdXQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHBhcmVudC50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSB0ZXh0Lm1hdGNoKC9cXC9cXHMqKFxcZCspLyk7XG4gICAgICAgIGlmIChtYXRjaCkgcmV0dXJuIHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG5cbiAgICAgICAgY29uc3QgaHRtbE1hdGNoID0gcGFyZW50LmlubmVySFRNTC5tYXRjaCgvXFwvXFxzKjxcXC9zcGFuPlxccyo8c3Bhbj5cXHMqKFxcZCspL2kpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbm5lckhUTUwubWF0Y2goL1xcL1xccyooXFxkKykvKTtcbiAgICAgICAgaWYgKGh0bWxNYXRjaCkgcmV0dXJuIHBhcnNlSW50KGh0bWxNYXRjaFsxXSwgMTApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtYXhBdHRyID0gc2VxSW5wdXQuZ2V0QXR0cmlidXRlKCdtYXgnKTtcbiAgICAgIGlmIChtYXhBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KG1heEF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gQ2hlY2sgd2luZG93Lm1hbmlmZXN0IGlmIHByZXNlbnQgaW4gcGFnZVxuICAgIGNvbnN0IHcgPSB3aW5kb3cgYXMgYW55O1xuICAgIGlmICh3Lm1hbmlmZXN0ICYmIHcubWFuaWZlc3QudG90YWxTZXEpIHtcbiAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHcubWFuaWZlc3QudG90YWxTZXEsIDEwKTtcbiAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIC8vIDMuIENoZWNrIGdlbmVyYWwgdGV4dCBlLmcuIFwib2YgMjcyXCIgb3IgXCIvIDI3MlwiXG4gICAgY29uc3QgcGFnaW5nRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFnaW5nLCBbY2xhc3MqPVwicGFnaW5nXCJdLCBbYXJpYS1sYWJlbCo9XCJ0b3RhbCBwYWdlc1wiIGldJyk7XG4gICAgaWYgKHBhZ2luZ0VsICYmIHBhZ2luZ0VsLnRleHRDb250ZW50KSB7XG4gICAgICBjb25zdCBtID0gcGFnaW5nRWwudGV4dENvbnRlbnQubWF0Y2goL1xcL1xccyooXFxkKykvKSB8fCBwYWdpbmdFbC50ZXh0Q29udGVudC5tYXRjaCgvb2ZcXHMrKFxcZCspL2kpO1xuICAgICAgaWYgKG0pIHJldHVybiBwYXJzZUludChtWzFdLCAxMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBBcmNoaXZlUHJvdmlkZXIgfSBmcm9tICcuL2FyY2hpdmUtcHJvdmlkZXInO1xuaW1wb3J0IHsgSGF0aGlUcnVzdFByb3ZpZGVyIH0gZnJvbSAnLi9oYXRoaXRydXN0LXByb3ZpZGVyJztcblxuZXhwb3J0ICogZnJvbSAnLi90eXBlcyc7XG5leHBvcnQgKiBmcm9tICcuL2FyY2hpdmUtcHJvdmlkZXInO1xuZXhwb3J0ICogZnJvbSAnLi9oYXRoaXRydXN0LXByb3ZpZGVyJztcblxuLyoqXG4gKiBSZWdpc3RyeSBvZiBzdXBwb3J0ZWQgYm9vayBzaXRlIHByb3ZpZGVycy5cbiAqL1xuY29uc3QgcHJvdmlkZXJzOiBCb29rUHJvdmlkZXJbXSA9IFtcbiAgbmV3IEFyY2hpdmVQcm92aWRlcigpLFxuICBuZXcgSGF0aGlUcnVzdFByb3ZpZGVyKCksXG5dO1xuXG4vKipcbiAqIERldGVjdHMgYW5kIHJldHVybnMgdGhlIGFjdGl2ZSBwcm92aWRlciBtYXRjaGluZyB0aGUgY3VycmVudCB3ZWJwYWdlLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBjdXJyZW50IHBhZ2UgaXMgbm90IGEgc3VwcG9ydGVkIGJvb2sgdmlld2VyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlUHJvdmlkZXIoKTogQm9va1Byb3ZpZGVyIHwgbnVsbCB7XG4gIGZvciAoY29uc3QgcHJvdmlkZXIgb2YgcHJvdmlkZXJzKSB7XG4gICAgaWYgKHByb3ZpZGVyLmlzTWF0Y2goKSkge1xuICAgICAgcmV0dXJuIHByb3ZpZGVyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsCiAgICAiLyoqXG4gKiBDb250ZW50IFNjcmlwdCAoSXNvbGF0ZWQgV29ybGQpIGZvciBBcmNoaXZlIERvd25sb2FkZXJcbiAqIE1hbmFnZXMgYXV0b21hdGlvbiwgcGFnZSBjeWNsaW5nLCB2ZXJpZmljYXRpb24sIGNhbnZhcyBjYXB0dXJlLCBhbmQgdGV4dCBmZXRjaGluZy5cbiAqL1xuXG5pbXBvcnQgeyBCb29rSW5mbywgRG93bmxvYWRlckNvbmZpZywgUHJvZ3Jlc3NTdGF0ZSwgRXh0ZW5zaW9uTWVzc2FnZSwgQnJpZGdlTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IEZsb2F0aW5nUGlsbCB9IGZyb20gJy4vcGlsbCc7XG5pbXBvcnQgeyBwYXJzZURqdnVYbWxUb1RleHQsIGJ1aWxkQm9va01hcmtkb3duLCBQYWdlVGV4dEVudHJ5IH0gZnJvbSAnLi4vdXRpbHMvbWFya2Rvd24tYnVpbGRlcic7XG5pbXBvcnQgeyBjb21waWxlSnBlZ3NUb1BkZiwgUGRmSW1hZ2VJbnB1dCB9IGZyb20gJy4uL3V0aWxzL3BkZi1idWlsZGVyJztcbmltcG9ydCB7IGZvcm1hdFN1YmRpciwgZm9ybWF0UGFnZUZpbGVuYW1lLCBzYW5pdGl6ZUZpbGVuYW1lIH0gZnJvbSAnLi4vdXRpbHMvc2FuaXRpemVyJztcbmltcG9ydCB7IGdldEFjdGl2ZVByb3ZpZGVyLCBCb29rUHJvdmlkZXIsIEFyY2hpdmVQcm92aWRlciwgSGF0aGlUcnVzdFByb3ZpZGVyIH0gZnJvbSAnLi4vcHJvdmlkZXJzJztcblxuKGZ1bmN0aW9uIGluaXRDb250ZW50U2NyaXB0KCkge1xuICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBJbml0aWFsaXplZCBvbicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblxuICBjb25zdCBwcm92aWRlcjogQm9va1Byb3ZpZGVyIHwgbnVsbCA9IGdldEFjdGl2ZVByb3ZpZGVyKCk7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBObyBtYXRjaGluZyBib29rIHByb3ZpZGVyIGZvcicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gQWN0aXZlIHByb3ZpZGVyOiAke3Byb3ZpZGVyLnNpdGVOYW1lfSAoJHtwcm92aWRlci5zaXRlSWR9KWApO1xuXG4gIC8vIFN0YXRlXG4gIGxldCBib29rSW5mbzogQm9va0luZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGlzUnVubmluZyA9IGZhbHNlO1xuICBsZXQgaXNQYXVzZWQgPSBmYWxzZTtcbiAgbGV0IHN0b3BSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgbGV0IGN1cnJlbnRQYWdlID0gcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZTtcbiAgbGV0IGRvd25sb2FkZWRQYWdlcyA9IDA7XG4gIGxldCBmYWlsZWRQYWdlcyA9IDA7XG4gIGxldCBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gIGxldCBsYXN0RGltZW5zaW9ucyA9IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xuICBsZXQgY29sbGVjdGVkSW1hZ2VzOiBQZGZJbWFnZUlucHV0W10gPSBbXTtcbiAgbGV0IGNvbGxlY3RlZFRleHRzOiBQYWdlVGV4dEVudHJ5W10gPSBbXTtcbiAgbGV0IGlzRW5kT2ZCb29rID0gZmFsc2U7XG4gIGxldCBpc1NpdGVUYWludGVkID0gZmFsc2U7XG5cbiAgaW50ZXJmYWNlIEh0dHBFcnJvckluZm8ge1xuICAgIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgICB1cmw6IHN0cmluZztcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgICByZXRyeUFmdGVyPzogbnVtYmVyO1xuICB9XG5cbiAgbGV0IGxhc3RIdHRwRXJyb3I6IEh0dHBFcnJvckluZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGNvbnNlY3V0aXZlRXJyb3JDb3VudCA9IDA7XG5cbiAgZnVuY3Rpb24gb25IdHRwRXJyb3JSZWNlaXZlZChzdGF0dXNDb2RlOiBudW1iZXIsIHVybDogc3RyaW5nLCByZXRyeUFmdGVyPzogbnVtYmVyKSB7XG4gICAgY29uc3QgaXNCb29rUmVsYXRlZCA9XG4gICAgICB1cmwuaW5jbHVkZXMoJ2ltZ3NydicpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ0Jvb2tSZWFkZXInKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCcvY2dpL3B0JykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnZGV0YWlscycpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKTtcblxuICAgIGlmICghaXNCb29rUmVsYXRlZCkgcmV0dXJuO1xuXG4gICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIEhUVFAgZXJyb3IgJHtzdGF0dXNDb2RlfSBkZXRlY3RlZCBmb3IgJHt1cmx9YCk7XG4gICAgbGFzdEh0dHBFcnJvciA9IHtcbiAgICAgIHN0YXR1c0NvZGUsXG4gICAgICB1cmwsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICByZXRyeUFmdGVyLFxuICAgIH07XG4gIH1cblxuICAvLyBMb2FkIHNhdmVkIHNldHRpbmdzIGZyb20gbG9jYWxTdG9yYWdlIGZpcnN0XG4gIGNvbnN0IGxvY2FsU2F2ZVBhdGggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX3NhdmVfcGF0aCcpO1xuICBjb25zdCBsb2NhbEZvbGRlclBhdHRlcm4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2ZvbGRlcl9wYXR0ZXJuJyk7XG4gIGNvbnN0IGxvY2FsU3RhcnRQYWdlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJyk7XG4gIGNvbnN0IGxvY2FsRW5kUGFnZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnKTtcbiAgY29uc3QgbG9jYWxNYXhIZWlnaHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX21heF9oZWlnaHQnKTtcblxuICBsZXQgaW5pdGlhbFN0YXJ0UGFnZSA9IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG4gIGlmIChsb2NhbFN0YXJ0UGFnZSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KGxvY2FsU3RhcnRQYWdlLCAxMCk7XG4gICAgaWYgKCFpc05hTihwYXJzZWQpICYmIHBhcnNlZCA+PSBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlKSB7XG4gICAgICBpbml0aWFsU3RhcnRQYWdlID0gcGFyc2VkO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRlZmF1bHRDb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7XG4gICAgYmFzZURpcjogbG9jYWxTYXZlUGF0aCB8fCAnQXJjaGl2ZUJvb2tzJyxcbiAgICBmb2xkZXJQYXR0ZXJuOiBsb2NhbEZvbGRlclBhdHRlcm4gfHwgJ3t0aXRsZX1fe2lkfScsXG4gICAgc2F2ZUltYWdlczogZmFsc2UsXG4gICAgZ2VuZXJhdGVQZGY6IHRydWUsXG4gICAgc2F2ZVRleHRNZDogdHJ1ZSxcbiAgICBpbWFnZVF1YWxpdHk6IDAuNzUsXG4gICAgbWF4UGFnZUhlaWdodDogbG9jYWxNYXhIZWlnaHQgIT09IG51bGwgPyBNYXRoLm1heCgwLCBwYXJzZUludChsb2NhbE1heEhlaWdodCwgMTApKSA6IDAsXG4gICAgcGFnZURlbGF5TXM6IDIwMCxcbiAgICBwYWdlQ2hhbmdlVGltZW91dE1zOiAxMDAwMCxcbiAgICBtYXhSZXRyaWVzOiAxMCxcbiAgICBhdXRvU2luZ2xlUGFnZTogdHJ1ZSxcbiAgICBzdGFydFBhZ2U6IGluaXRpYWxTdGFydFBhZ2UsXG4gICAgZW5kUGFnZTogbG9jYWxFbmRQYWdlICE9PSBudWxsID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobG9jYWxFbmRQYWdlLCAxMCkpIDogMCxcbiAgICBkZWxldGVJbWFnZXNPbkNvbXBsZXRlOiB0cnVlLFxuICB9O1xuXG4gIGxldCBjb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7IC4uLmRlZmF1bHRDb25maWcgfTtcblxuICBmdW5jdGlvbiBzYXZlQ29uZmlnKHVwZGF0ZWQ6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pIHtcbiAgICBjb25maWcgPSB7IC4uLmNvbmZpZywgLi4udXBkYXRlZCB9O1xuICAgIGlmIChjb25maWcuYmFzZURpcikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zYXZlX3BhdGgnLCBjb25maWcuYmFzZURpcik7XG4gICAgfVxuICAgIGlmIChjb25maWcuZm9sZGVyUGF0dGVybikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9mb2xkZXJfcGF0dGVybicsIGNvbmZpZy5mb2xkZXJQYXR0ZXJuKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuc3RhcnRQYWdlID09PSAnbnVtYmVyJykge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJywgU3RyaW5nKGNvbmZpZy5zdGFydFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuZW5kUGFnZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnLCBTdHJpbmcoY29uZmlnLmVuZFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcubWF4UGFnZUhlaWdodCA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfbWF4X2hlaWdodCcsIFN0cmluZyhjb25maWcubWF4UGFnZUhlaWdodCkpO1xuICAgIH1cbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IGRvd25sb2FkZXJDb25maWc6IGNvbmZpZyB9KTtcbiAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICB9XG5cbiAgLy8gTG9hZCB1c2VyIGNvbmZpZyBmcm9tIGNocm9tZS5zdG9yYWdlXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFsnbGliZXJhdG9yQ29uZmlnJywgJ2Rvd25sb2FkZXJDb25maWcnXSwgKHJlcykgPT4ge1xuICAgIGNvbnN0IHNhdmVkID0gcmVzLmRvd25sb2FkZXJDb25maWcgfHwgcmVzLmxpYmVyYXRvckNvbmZpZztcbiAgICBpZiAoc2F2ZWQpIHtcbiAgICAgIGNvbnN0IGxvY2FsUGF0aCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc2F2ZV9wYXRoJyk7XG4gICAgICBjb25maWcgPSB7XG4gICAgICAgIC4uLmRlZmF1bHRDb25maWcsXG4gICAgICAgIC4uLnNhdmVkLFxuICAgICAgICAuLi4obG9jYWxQYXRoID8geyBiYXNlRGlyOiBsb2NhbFBhdGggfSA6IHt9KSxcbiAgICAgIH07XG4gICAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gRmxvYXRpbmcgUGlsbCBVSSB3aXRoIGZ1bGwgY2FsbGJhY2tzXG4gIGNvbnN0IHBpbGwgPSBuZXcgRmxvYXRpbmdQaWxsKHtcbiAgICBvblN0YXJ0OiAoKSA9PiBzdGFydERvd25sb2FkKCksXG4gICAgb25QYXVzZTogKCkgPT4gcGF1c2VEb3dubG9hZCgpLFxuICAgIG9uUmVzdW1lOiAoKSA9PiByZXN1bWVEb3dubG9hZCgpLFxuICAgIG9uU3RvcDogKCkgPT4gaGFuZGxlU3RvcFJlcXVlc3QoKSxcbiAgICBvblNhdmVTZXR0aW5nczogKG5ld1NldHRpbmdzKSA9PiB7XG4gICAgICBzYXZlQ29uZmlnKG5ld1NldHRpbmdzKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFNldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZTonLCBuZXdTZXR0aW5ncyk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogaXNSdW5uaW5nID8gKGlzUGF1c2VkID8gJ3BhdXNlZCcgOiAnZG93bmxvYWRpbmcnKSA6ICdpZGxlJyxcbiAgICAgICAgc3RhdHVzVGV4dDogJ1NldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZScsXG4gICAgICB9KTtcbiAgICB9LFxuICAgIG9uU3dpdGNoTW9kZTogKCkgPT4gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCksXG4gICAgb25WaWV3RmlsZTogKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gT3BlbmluZyBkb3dubG9hZGVkIGZpbGUgaW4gRmluZGVyL0V4cGxvcmVyLi4uJyk7XG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdPUEVOX0RPV05MT0FEJyB9KTtcbiAgICB9LFxuICB9KTtcblxuICBpZiAocGlsbC5zaG91bGRSZW5kZXIoKSkge1xuICAgIHBpbGwucmVuZGVyKCk7XG4gICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hCb29rSW5mbygpIHtcbiAgICBjb25zdCBkZXRlY3RlZCA9IGF3YWl0IHByb3ZpZGVyLmRldGVjdEJvb2tJbmZvKCk7XG4gICAgaWYgKGRldGVjdGVkKSB7XG4gICAgICBib29rSW5mbyA9IGRldGVjdGVkO1xuICAgICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJjaGl2ZVByb3ZpZGVyKSB7XG4gICAgICAgIHByb3ZpZGVyLnNldEJvb2tJbmZvKGJvb2tJbmZvKTtcbiAgICAgIH1cbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID8/IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UsXG4gICAgICAgIGJvb2tJbmZvLnRvdGFsUGFnZXMsXG4gICAgICAgICdSZWFkeScsXG4gICAgICAgICdub3JtYWwnLFxuICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgaXNSdW5uaW5nLFxuICAgICAgICBib29rSW5mby5jdXJyZW50TW9kZSA/PyAxLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQnJpZGdlIGxpc3RlbmVyIGZvciBNQUlOIHdvcmxkIGV2ZW50cyAoSFRUUCBlcnJvciBpbnRlcmNlcHRpb24gJiBBcmNoaXZlLm9yZyBCb29rUmVhZGVyKVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ0ZST01fQlJJREdFJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGEgYXMgQnJpZGdlTWVzc2FnZTtcblxuICAgIC8vIEludGVyY2VwdCBhbnkgbm9uLTIwMCBIVFRQIHN0YXR1cyAoNDI5LCA1MDAsIDQwMSwgZXRjLilcbiAgICBpZiAobXNnLmV2ZW50ID09PSAnSFRUUF9FUlJPUicpIHtcbiAgICAgIG9uSHR0cEVycm9yUmVjZWl2ZWQobXNnLnN0YXR1c0NvZGUsIG1zZy51cmwsIG1zZy5yZXRyeUFmdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3J3YXJkIEhhdGhpVHJ1c3QgcGFnZSBhbm5vdW5jZW1lbnRzLCBpbWFnZXMsIGFuZCBPQ1IgdGV4dCB0byBwcm92aWRlclxuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEhhdGhpVHJ1c3RQcm92aWRlcikge1xuICAgICAgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfTE9BRF9BTk5PVU5DRUQnKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZUxvYWRBbm5vdW5jZWQobXNnLnNlcSwgbXNnLmlzVmlzaWJsZSwgbXNnLmlzTG9hZGVkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0lNQUdFX1JFQURZJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VJbWFnZVJlYWR5KG1zZy5zZXEsIG1zZy5ibG9iVXJsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZVRleHRSZWFkeShtc2cuc2VxLCBtc2cuaHRtbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXNnLmV2ZW50ID09PSAnQk9PS19JTkZPJykge1xuICAgICAgYm9va0luZm8gPSBtc2cuZGF0YTtcbiAgICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFyY2hpdmVQcm92aWRlcikge1xuICAgICAgICBwcm92aWRlci5zZXRCb29rSW5mbyhib29rSW5mbyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvbUN1cnJlbnQgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgaWYgKGRvbUN1cnJlbnQgIT09IG51bGwgJiYgKCFib29rSW5mby50b3RhbFBhZ2VzIHx8IGRvbUN1cnJlbnQgPiAoYm9va0luZm8uY3VycmVudExlYWYgPz8gMCkpKSB7XG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID0gZG9tQ3VycmVudDtcbiAgICAgIH1cblxuICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgYm9va0luZm8uY3VycmVudExlYWYgPz8gMCxcbiAgICAgICAgYm9va0luZm8udG90YWxQYWdlcyxcbiAgICAgICAgJ1JlYWR5JyxcbiAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgIGlzUGF1c2VkLFxuICAgICAgICBpc1J1bm5pbmcsXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRNb2RlLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdNT0RFX0NIQU5HRUQnKSB7XG4gICAgICBpZiAoYm9va0luZm8pIHtcbiAgICAgICAgYm9va0luZm8uY3VycmVudE1vZGUgPSBtc2cubW9kZTtcbiAgICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgICBib29rSW5mby50b3RhbFBhZ2VzLFxuICAgICAgICAgICcxLVBhZ2UgTW9kZSBBY3RpdmUnLFxuICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgIGlzUGF1c2VkLFxuICAgICAgICAgIGlzUnVubmluZyxcbiAgICAgICAgICBtc2cubW9kZSxcbiAgICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSW5pdGlhbCBkZXRlY3Rpb25cbiAgcmVmcmVzaEJvb2tJbmZvKCk7XG4gIHNldFRpbWVvdXQoKCkgPT4gcmVmcmVzaEJvb2tJbmZvKCksIDgwMCk7XG5cbiAgLy8gTmV0d29yayBjb25uZWN0aW9uIGxpc3RlbmVyc1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLndhcm4oJ1tBcmNoaXZlRG93bmxvYWRlcl0gTmV0d29yayBjb25uZWN0aW9uIGxvc3QgKG9mZmxpbmUpJyk7XG4gICAgaWYgKGlzUnVubmluZyAmJiAhaXNQYXVzZWQpIHtcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwLFxuICAgICAgICAnT2ZmbGluZSAtIFBhdXNlZCcsXG4gICAgICAgICdvZmZsaW5lJyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgICApO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdvZmZsaW5lJywgaXNPZmZsaW5lOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBOZXR3b3JrIGNvbm5lY3Rpb24gcmVzdG9yZWQgKG9ubGluZSknKTtcbiAgICBpZiAoaXNSdW5uaW5nICYmIGlzUGF1c2VkKSB7XG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMCxcbiAgICAgICAgJ09ubGluZSAtIENsaWNrIENPTlRJTlVFJyxcbiAgICAgICAgJ3N0YWxsZWQnLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlLFxuICAgICAgICBib29rSW5mbz8uY3VycmVudE1vZGUgfHwgMSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3N0YWxsZWQnLCBpc09mZmxpbmU6IGZhbHNlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGVscGVyc1xuICBjb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcblxuICBmdW5jdGlvbiBicm9hZGNhc3RTdGF0ZShleHRyYTogUGFydGlhbDxQcm9ncmVzc1N0YXRlPiA9IHt9KSB7XG4gICAgY29uc3QgdG90YWwgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjb25maWcuZW5kUGFnZSB8fCAxO1xuICAgIGxldCBzdGF0dXNUeXBlOiAnbm9ybWFsJyB8ICdyZXRyeWluZycgfCAnb2ZmbGluZScgfCAnc3RhbGxlZCcgfCAnY29tcGxldGUnID0gJ25vcm1hbCc7XG5cbiAgICBpZiAoZXh0cmEuc3RhdHVzID09PSAnc3RhbGxlZCcpIHN0YXR1c1R5cGUgPSAnc3RhbGxlZCc7XG4gICAgZWxzZSBpZiAoZXh0cmEuc3RhdHVzID09PSAncmV0cnlpbmcnKSBzdGF0dXNUeXBlID0gJ3JldHJ5aW5nJztcbiAgICBlbHNlIGlmICghbmF2aWdhdG9yLm9uTGluZSkgc3RhdHVzVHlwZSA9ICdvZmZsaW5lJztcbiAgICBlbHNlIGlmIChleHRyYS5zdGF0dXMgPT09ICdjb21wbGV0ZScpIHN0YXR1c1R5cGUgPSAnY29tcGxldGUnO1xuXG4gICAgY29uc3Qgc3RhdGU6IFByb2dyZXNzU3RhdGUgPSB7XG4gICAgICBzdGF0dXM6IGlzUnVubmluZyA/IChpc1BhdXNlZCA/IChzdGF0dXNUeXBlID09PSAnc3RhbGxlZCcgPyAnc3RhbGxlZCcgOiAncGF1c2VkJykgOiAnZG93bmxvYWRpbmcnKSA6IChleHRyYS5zdGF0dXMgfHwgJ2lkbGUnKSxcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWxQYWdlczogdG90YWwsXG4gICAgICBkb3dubG9hZGVkUGFnZXMsXG4gICAgICBmYWlsZWRQYWdlcyxcbiAgICAgIHJldHJ5Q291bnQ6IGN1cnJlbnRSZXRyeUNvdW50LFxuICAgICAgc3RhdHVzVGV4dDogaXNQYXVzZWQgPyAoc3RhdHVzVHlwZSA9PT0gJ3N0YWxsZWQnID8gJ1N0YWxsZWQgLSBDbGljayBDT05USU5VRScgOiAnUGF1c2VkJykgOiAoaXNSdW5uaW5nID8gYENhcHR1cmluZyBwYWdlICR7Y3VycmVudFBhZ2V9YCA6ICdSZWFkeScpLFxuICAgICAgYm9va0luZm86IGJvb2tJbmZvIHx8IHVuZGVmaW5lZCxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNPZmZsaW5lOiAhbmF2aWdhdG9yLm9uTGluZSxcbiAgICAgIGltYWdlRGltZW5zaW9uczogbGFzdERpbWVuc2lvbnMsXG4gICAgICAuLi5leHRyYSxcbiAgICB9O1xuXG4gICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWwsXG4gICAgICBzdGF0ZS5zdGF0dXNUZXh0LFxuICAgICAgc3RhdHVzVHlwZSxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNSdW5uaW5nLFxuICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICBsYXN0RGltZW5zaW9uc1xuICAgICk7XG5cbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdTVEFURV9VUERBVEUnLCBzdGF0ZSB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRW5mb3JjZXMgMS1wYWdlIHZpZXcgbW9kZSB2aWEgcHJvdmlkZXIgaWYgc3VwcG9ydGVkLlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChwcm92aWRlci5lbmZvcmNlU2luZ2xlUGFnZU1vZGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uICR7cHJvdmlkZXIuc2l0ZU5hbWV9Li4uYCk7XG4gICAgICByZXR1cm4gYXdhaXQgcHJvdmlkZXIuZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhcHR1cmVzIGltYWdlIGZyb20gRE9NIGVsZW1lbnQgdG8gSlBFRyBEYXRhIFVSTCB1c2luZyBhbiBvZmZzY3JlZW4gY2FudmFzLlxuICAgKiBQcm9wb3J0aWFuYWxseSBkb3duc2NhbGVzIGlmIG1heFBhZ2VIZWlnaHQgPiAwIGFuZCBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0LlxuICAgKiBJZiBjYW52YXMgaXMgdGFpbnRlZCBieSBjcm9zcy1vcmlnaW4gcmVzb3VyY2VzLCBmbGFncyBpc1NpdGVUYWludGVkIGFuZCBjbGVhbmx5IHJlY292ZXJzIHZpYSBiYWNrZ3JvdW5kIHByb3h5LlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gY2FwdHVyZUltYWdlVG9EYXRhVXJsKGltZzogSFRNTEltYWdlRWxlbWVudCwgcXVhbGl0eSA9IDAuNzUsIG1heFBhZ2VIZWlnaHQgPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBGYXN0IHBhdGg6IGlmIHNpdGUgaXMgYWxyZWFkeSBrbm93biB0byB1c2UgY3Jvc3Mtb3JpZ2luL3RhaW50ZWQgaW1hZ2VzLCBieXBhc3MgY2FudmFzIGVudGlyZWx5IVxuICAgIGlmIChpc1NpdGVUYWludGVkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgZmV0Y2hDbGVhbkRhdGFVcmwoaW1nLnNyYywgcXVhbGl0eSwgbWF4UGFnZUhlaWdodCk7XG4gICAgfVxuXG4gICAgLy8gUHJvYWN0aXZlbHkgZGV0ZWN0IEFyY2hpdmUub3JnIGNyb3NzLW9yaWdpbiBzdG9yYWdlIG5vZGVzIChpYSoudXMuYXJjaGl2ZS5vcmcgIT0gYXJjaGl2ZS5vcmcpXG4gICAgaWYgKGltZy5zcmMgJiYgaW1nLnNyYy5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKSAmJiAhaW1nLnNyYy5zdGFydHNXaXRoKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pKSB7XG4gICAgICBpc1NpdGVUYWludGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICB9XG5cbiAgICBsZXQgd2lkdGggPSBpbWcubmF0dXJhbFdpZHRoIHx8IGltZy53aWR0aCB8fCAwO1xuICAgIGxldCBoZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodCB8fCBpbWcuaGVpZ2h0IHx8IDA7XG5cbiAgICBpZiAobWF4UGFnZUhlaWdodCA+IDAgJiYgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgY29uc3Qgc2NhbGUgPSBtYXhQYWdlSGVpZ2h0IC8gaGVpZ2h0O1xuICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgIGlmICghY3R4KSB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBvYnRhaW4gY2FudmFzIDJEIGNvbnRleHQnKTtcblxuICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCBxdWFsaXR5KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgLy8gVGFpbnRlZCBjYW52YXMgcmVjb3ZlcnkgKGNyb3NzLW9yaWdpbiBDRE4gb3IgcHJvdGVjdGVkIHBhZ2VzKVxuICAgICAgaWYgKGVyci5uYW1lID09PSAnU2VjdXJpdHlFcnJvcicgfHwgU3RyaW5nKGVycikuaW5jbHVkZXMoJ1RhaW50ZWQnKSB8fCBTdHJpbmcoZXJyKS5pbmNsdWRlcygnU2VjdXJpdHlFcnJvcicpKSB7XG4gICAgICAgIGlmICghaXNTaXRlVGFpbnRlZCkge1xuICAgICAgICAgIGlzU2l0ZVRhaW50ZWQgPSB0cnVlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIENyb3NzLW9yaWdpbiBzY2FuIGRldGVjdGVkLiBFbmFibGluZyBmYXN0IGJhY2tncm91bmQgZmV0Y2ggZm9yIGFsbCBzdWJzZXF1ZW50IHBhZ2VzLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBibG9iVG9EYXRhVXJsKGJsb2I6IEJsb2IpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHJlc29sdmUocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNjYWxlRGF0YVVybChkYXRhVXJsOiBzdHJpbmcsIHF1YWxpdHkgPSAwLjc1LCBtYXhQYWdlSGVpZ2h0ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKG1heFBhZ2VIZWlnaHQgPD0gMCkgcmV0dXJuIGRhdGFVcmw7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIGxldCB3aWR0aCA9IGltZy5uYXR1cmFsV2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodDtcbiAgICAgICAgaWYgKGhlaWdodCA+IG1heFBhZ2VIZWlnaHQpIHtcbiAgICAgICAgICBjb25zdCBzY2FsZSA9IG1heFBhZ2VIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgICAgIGhlaWdodCA9IG1heFBhZ2VIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgaWYgKCFjdHgpIHJldHVybiByZXNvbHZlKGRhdGFVcmwpO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIHJlc29sdmUoY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIHF1YWxpdHkpKTtcbiAgICAgIH07XG4gICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlc29sdmUoZGF0YVVybCk7XG4gICAgICBpbWcuc3JjID0gZGF0YVVybDtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGZldGNoQ2xlYW5EYXRhVXJsKHVybDogc3RyaW5nLCBxdWFsaXR5ID0gMC43NSwgbWF4UGFnZUhlaWdodCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBibG9iOiBCbG9iIHwgbnVsbCA9IG51bGw7XG5cbiAgICAvLyAxLiBJZiBzaXRlIGlzIE5PVCBtYXJrZWQgdGFpbnRlZCwgdHJ5IGxvY2FsIGZldGNoIGZpcnN0IChmYXN0IGZvciBibG9iOiBhbmQgQ09SUy1lbmFibGVkIGVuZHBvaW50cylcbiAgICBpZiAoIWlzU2l0ZVRhaW50ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgeyBjcmVkZW50aWFsczogJ2luY2x1ZGUnIH0pO1xuICAgICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgICAgYmxvYiA9IGF3YWl0IHJlcy5ibG9iKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgLy8gMi4gQmFja2dyb3VuZCBzZXJ2aWNlIHdvcmtlciBmZXRjaCAoaW1tdW5lIHRvIENPUlMgcmVzdHJpY3Rpb25zIHdpdGggaG9zdF9wZXJtaXNzaW9ucylcbiAgICBpZiAoIWJsb2IpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJnUmVzOiBhbnkgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICAgICAgeyB0eXBlOiAnRkVUQ0hfSU1BR0VfREFUQV9VUkwnLCB1cmwgfSxcbiAgICAgICAgICAgIChyZXNwb25zZSkgPT4gcmVzb2x2ZShyZXNwb25zZSB8fCB7IHN1Y2Nlc3M6IGZhbHNlIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChiZ1JlcyAmJiBiZ1Jlcy5zdWNjZXNzICYmIGJnUmVzLmRhdGFVcmwpIHtcbiAgICAgICAgICBpZiAobWF4UGFnZUhlaWdodCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYmdSZXMuZGF0YVVybDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHNjYWxlRGF0YVVybChiZ1Jlcy5kYXRhVXJsLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBpZiAoYmxvYikge1xuICAgICAgaWYgKG1heFBhZ2VIZWlnaHQgPD0gMCkge1xuICAgICAgICByZXR1cm4gYXdhaXQgYmxvYlRvRGF0YVVybChibG9iKTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJpdG1hcCA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGJsb2IpO1xuICAgICAgICBsZXQgd2lkdGggPSBiaXRtYXAud2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBiaXRtYXAuaGVpZ2h0O1xuICAgICAgICBpZiAobWF4UGFnZUhlaWdodCA+IDAgJiYgaGVpZ2h0ID4gbWF4UGFnZUhlaWdodCkge1xuICAgICAgICAgIGNvbnN0IHNjYWxlID0gbWF4UGFnZUhlaWdodCAvIGhlaWdodDtcbiAgICAgICAgICB3aWR0aCA9IE1hdGgucm91bmQod2lkdGggKiBzY2FsZSk7XG4gICAgICAgICAgaGVpZ2h0ID0gbWF4UGFnZUhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBpZiAoY3R4KSB7XG4gICAgICAgICAgY3R4LmRyYXdJbWFnZShiaXRtYXAsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgcXVhbGl0eSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICByZXR1cm4gYXdhaXQgYmxvYlRvRGF0YVVybChibG9iKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBleHBvcnQgaW1hZ2UgZnJvbSAke3VybH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG5vbi0yMDAgSFRUUCByZXNwb25zZXMgKDQyOSwgNTAwLCA1MDIsIDUwMywgNDAxLCA0MDMsIGV0Yy4pXG4gICAqIC0gNDAxLzQwMzogUGF1c2VzIGRvd25sb2FkIHRvIGxldCB1c2VyIGF1dGhlbnRpY2F0ZSBvciByZW5ldyBsb2FuXG4gICAqIC0gNDI5ICYgNXh4OiBJbml0aWF0ZXMgZXhwb25lbnRpYWwgYmFja29mZiB3aXRoIGxpdmUgY291bnRkb3duIGFuZCBpbmNyZWFzZXMgcGFjaW5nXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVycjogSHR0cEVycm9ySW5mbywgdGFyZ2V0UGFnZU51bTogbnVtYmVyKSB7XG4gICAgY29uc2VjdXRpdmVFcnJvckNvdW50Kys7XG5cbiAgICAvLyA0MDEgLyA0MDM6IEF1dGgvRm9yYmlkZGVuXG4gICAgaWYgKGVyci5zdGF0dXNDb2RlID09PSA0MDEgfHwgZXJyLnN0YXR1c0NvZGUgPT09IDQwMykge1xuICAgICAgY29uc29sZS5lcnJvcihgW0FyY2hpdmVEb3dubG9hZGVyXSBBY2Nlc3MgcmVzdHJpY3RlZCAoSFRUUCAke2Vyci5zdGF0dXNDb2RlfSkgb24gJHtlcnIudXJsfS4gUGF1c2luZy5gKTtcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICAgICAgc3RhdHVzVGV4dDogYEFjY2VzcyByZXN0cmljdGVkIChIVFRQICR7ZXJyLnN0YXR1c0NvZGV9KS4gUGxlYXNlIGNoZWNrIGxvZ2luIG9yIGxvYW4gc3RhdHVzLmAsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSYXRlIExpbWl0aW5nICg0MjkpICYgU2VydmVyIEVycm9ycyAoNTAwLCA1MDIsIDUwMywgNTA0KVxuICAgIC8vIElmIHRoZSBzZXJ2ZXIgZXhwbGljaXRseSBzcGVjaWZpZXMgUmV0cnktQWZ0ZXIsIGhvbm9yIGl0LlxuICAgIC8vIE90aGVyd2lzZSBmYWxsYmFjayB0byBleHBvbmVudGlhbCBiYWNrb2ZmOiAxMHMsIDIwcywgNDBzLCBjYXBwZWQgYXQgNjBzLlxuICAgIGNvbnN0IGlzU2VydmVyUmVxdWVzdGVkID0gdHlwZW9mIGVyci5yZXRyeUFmdGVyID09PSAnbnVtYmVyJyAmJiAhaXNOYU4oZXJyLnJldHJ5QWZ0ZXIpICYmIGVyci5yZXRyeUFmdGVyID4gMDtcbiAgICBjb25zdCBiYXNlU2Vjb25kcyA9IGlzU2VydmVyUmVxdWVzdGVkXG4gICAgICA/IGVyci5yZXRyeUFmdGVyXG4gICAgICA6IE1hdGgubWluKDEwICogTWF0aC5wb3coMiwgTWF0aC5tYXgoMCwgY29uc2VjdXRpdmVFcnJvckNvdW50IC0gMSkpLCA2MCk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGluY3JlYXNlIGludGVyLXBhZ2UgcGFjaW5nIGRlbGF5IHRvIHByZXZlbnQgcmVjdXJyaW5nIGVycm9yc1xuICAgIGNvbnN0IHByZXZEZWxheSA9IGNvbmZpZy5wYWdlRGVsYXlNcztcbiAgICBjb25maWcucGFnZURlbGF5TXMgPSBNYXRoLm1pbihNYXRoLm1heChjb25maWcucGFnZURlbGF5TXMsIDE1MDApICsgNTAwLCA1MDAwKTtcbiAgICBpZiAoY29uZmlnLnBhZ2VEZWxheU1zICE9PSBwcmV2RGVsYXkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEluY3JlYXNlZCBwYWdlIHBhY2luZyBkZWxheSB0byAke2NvbmZpZy5wYWdlRGVsYXlNc31tcy5gKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBlcnIuc3RhdHVzQ29kZSA9PT0gNDI5XG4gICAgICA/ICdSYXRlIExpbWl0ZWQnXG4gICAgICA6IChlcnIuc3RhdHVzQ29kZSA+PSA1MDAgPyBgU2VydmVyIEVycm9yICgke2Vyci5zdGF0dXNDb2RlfSlgIDogYEhUVFAgJHtlcnIuc3RhdHVzQ29kZX1gKTtcblxuICAgIGlmIChpc1NlcnZlclJlcXVlc3RlZCkge1xuICAgICAgbGFiZWwgKz0gJyAoc2VydmVyIGFza2VkKSc7XG4gICAgfVxuXG4gICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdICR7bGFiZWx9IG9uICR7ZXJyLnVybH0uIEJhY2tpbmcgb2ZmIGZvciAke01hdGgucm91bmQoYmFzZVNlY29uZHMpfXMuLi5gKTtcblxuICAgIGZvciAobGV0IHJlbWFpbmluZyA9IE1hdGgucm91bmQoYmFzZVNlY29uZHMpOyByZW1haW5pbmcgPiAwOyByZW1haW5pbmctLSkge1xuICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIHJldHVybjtcbiAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuO1xuICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgfVxuXG4gICAgICAvLyBEaXNwbGF5IGluIG1pbnV0ZXMgaWYgbW9yZSB0aGFuIDEyMHMsIG90aGVyd2lzZSBpbiBzZWNvbmRzXG4gICAgICBjb25zdCB0aW1lU3RyID0gcmVtYWluaW5nID4gMTIwXG4gICAgICAgID8gYCR7TWF0aC5yb3VuZChyZW1haW5pbmcgLyA2MCl9bWBcbiAgICAgICAgOiBgJHtyZW1haW5pbmd9c2A7XG5cbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncmV0cnlpbmcnLFxuICAgICAgICByZXRyeUNvdW50OiBjb25zZWN1dGl2ZUVycm9yQ291bnQsXG4gICAgICAgIHN0YXR1c1RleHQ6IGAke3RpbWVTdHJ9IFJldHJ5aW5nOiAke2xhYmVsfS5gLFxuICAgICAgfSk7XG4gICAgICBhd2FpdCBzbGVlcCgxMDAwKTtcbiAgICB9XG5cbiAgICAvLyBCYWNrb2ZmIGNvbXBsZXRlISBSZS1uYXZpZ2F0ZSB0byB0YXJnZXRQYWdlTnVtIHNvIHJlYWRlciByZS1mZXRjaGVzIGNsZWFubHlcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBCYWNrb2ZmIGNvbXBsZXRlZC4gUmUtcmVxdWVzdGluZyBwYWdlICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgYXdhaXQgc2xlZXAoODAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGYXN0IFBhZ2UgVHVybiAmIFdhaXQgRW5naW5lOlxuICAgKiAxLiBUcmlnZ2VycyBwYWdlIGZsaXAgdmlhIHByb3ZpZGVyLlxuICAgKiAyLiBQb2xscyBhdCBoaWdoIGZyZXF1ZW5jeSAoMTAwbXMpIGFuZCByZXR1cm5zIHRoZSBuZXcgaW1hZ2UgaW1tZWRpYXRlbHkgb25jZSB2aXNpYmxlLlxuICAgKiAzLiBSZWplY3RzIHBhZ2UgbG9hZCBpZiBhbnkgbm9uLTIwMCBIVFRQIHJlc3BvbnNlICg0MjksIDUwMCwgNDAxLCBldGMuKSB3YXMgcmVjZWl2ZWQuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiB0dXJuQW5kR2V0TmV4dEltYWdlKFxuICAgIGxhc3RTcmM6IHN0cmluZyxcbiAgICB0YXJnZXRQYWdlTnVtOiBudW1iZXJcbiAgKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbD4ge1xuICAgIGxldCByZXRyeUF0dGVtcHQgPSAwO1xuICAgIGlzRW5kT2ZCb29rID0gZmFsc2U7XG5cbiAgICB3aGlsZSAocmV0cnlBdHRlbXB0IDw9IGNvbmZpZy5tYXhSZXRyaWVzKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG5cbiAgICAgIC8vIEhhbmRsZSBwYXVzZSAvIG9mZmxpbmVcbiAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG4gICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIDEuIENoZWNrIGlmIHJlYWRlciBpcyBhbHJlYWR5IGF0IGVuZCBvZiBib29rXG4gICAgICBjb25zdCB0b3RhbFBhZ2VzID0gYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMDtcbiAgICAgIGlmIChwcm92aWRlci5pc0F0RW5kT2ZCb29rICYmIHByb3ZpZGVyLmlzQXRFbmRPZkJvb2sodGFyZ2V0UGFnZU51bSwgdG90YWxQYWdlcykpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRW5kIG9mIGJvb2sgcmVhY2hlZCBhdCBwYWdlICR7dGFyZ2V0UGFnZU51bX0uYCk7XG4gICAgICAgIGlzRW5kT2ZCb29rID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvbVBhZ2VCZWZvcmUgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgaWYgKHRvdGFsUGFnZXMgPiAwICYmIGRvbVBhZ2VCZWZvcmUgIT09IG51bGwgJiYgZG9tUGFnZUJlZm9yZSA+PSB0b3RhbFBhZ2VzICYmIHRhcmdldFBhZ2VOdW0gPiB0b3RhbFBhZ2VzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVuZCBvZiBib29rIHJlYWNoZWQgYXQgcGFnZSAke2RvbVBhZ2VCZWZvcmV9LmApO1xuICAgICAgICBpc0VuZE9mQm9vayA9IHRydWU7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyAyLiBUcmlnZ2VyIHBhZ2UgZmxpcCBvciBjaGVjayBpZiBhbHJlYWR5IHR1cm5lZFxuICAgICAgY29uc3QgYWxyZWFkeVR1cm5lZCA9IGRvbVBhZ2VCZWZvcmUgIT09IG51bGwgJiYgZG9tUGFnZUJlZm9yZSA+PSB0YXJnZXRQYWdlTnVtO1xuXG4gICAgICBpZiAocmV0cnlBdHRlbXB0ID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBSZXRyeSAke3JldHJ5QXR0ZW1wdH06IHJlLXRyaWdnZXJpbmcgZmxpcCB0byBwYWdlICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICBpZiAocmV0cnlBdHRlbXB0ID49IDIgJiYgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2UpIHtcbiAgICAgICAgICAvLyBEaXJlY3QgbmF2aWdhdGlvbiBmYWxsYmFjayBvbiByZXBlYXRlZCBzdGFsbFxuICAgICAgICAgIGF3YWl0IHByb3ZpZGVyLm5hdmlnYXRlVG9QYWdlKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFhbHJlYWR5VHVybmVkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZsaXBwaW5nIHRvIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfSAoYXR0ZW1wdCAxLyR7Y29uZmlnLm1heFJldHJpZXMgKyAxfSkuLi5gKTtcbiAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRE9NIGluZGljYXRlcyBwYWdlIGlzIGFscmVhZHkgb24gc2VxdWVuY2UvbGVhZiAke2RvbVBhZ2VCZWZvcmV9LiBXYWl0aW5nIGZvciBpbWFnZS5gKTtcbiAgICAgIH1cblxuICAgICAgLy8gMy4gRmFzdCBwb2xsIHdpdGggSFRUUCBlcnJvciByZWplY3Rpb25cbiAgICAgIGNvbnN0IGNoZWNrU3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgdGltZW91dE1zID0gNTAwMDsgLy8gNSBzZWNvbmRzIG1heCBwZXIgZmxpcCBhdHRlbXB0XG4gICAgICBsZXQgbnVkZ2VkID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gY2hlY2tTdGFydCA8IHRpbWVvdXRNcykge1xuICAgICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuIG51bGw7XG4gICAgICAgIHdoaWxlIChpc1BhdXNlZCB8fCAhbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICBhd2FpdCBzbGVlcCg1MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ1JJVElDQUw6IFJlamVjdCBwYWdlIGxvYWQgaWYgYW4gSFRUUCBlcnJvciAoNDI5LCA1MDAsIDQwMSwgZXRjLikgb2NjdXJyZWQhXG4gICAgICAgIGlmIChsYXN0SHR0cEVycm9yICYmIChEYXRlLm5vdygpIC0gbGFzdEh0dHBFcnJvci50aW1lc3RhbXAgPCAxMDAwMCkpIHtcbiAgICAgICAgICBjb25zdCBlcnIgPSBsYXN0SHR0cEVycm9yO1xuICAgICAgICAgIGxhc3RIdHRwRXJyb3IgPSBudWxsOyAvLyBjb25zdW1lIGVycm9yXG4gICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHt0YXJnZXRQYWdlTnVtfSBsb2FkIHJlamVjdGVkIGR1ZSB0byBIVFRQICR7ZXJyLnN0YXR1c0NvZGV9IG9uICR7ZXJyLnVybH1gKTtcblxuICAgICAgICAgIC8vIEluaXRpYXRlIGJhY2tvZmZcbiAgICAgICAgICBhd2FpdCBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVyciwgdGFyZ2V0UGFnZU51bSk7XG5cbiAgICAgICAgICAvLyBSZXN0YXJ0IHBvbGxpbmcgYWZ0ZXIgYmFja29mZlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2FpdGluZyBtb3JlIHRoYW4gMTUwMG1zIHdpdGhvdXQgdGhlIGltYWdlIGFwcGVhcmluZywgc2VuZCBhIG51ZGdlIGZsaXBcbiAgICAgICAgaWYgKCFudWRnZWQgJiYgRGF0ZS5ub3coKSAtIGNoZWNrU3RhcnQgPiAxNTAwKSB7XG4gICAgICAgICAgbnVkZ2VkID0gdHJ1ZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBJbWFnZSBub3QgeWV0IGNvbmZpcm1lZCBhZnRlciAxLjVzLiBSZS10cmlnZ2VyaW5nIGZsaXAgZm9yIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4uLmApO1xuICAgICAgICAgIGF3YWl0IHByb3ZpZGVyLnRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHNsZWVwKDUwKTtcblxuICAgICAgICBjb25zdCBhY3RpdmVJbWcgPSBwcm92aWRlci5nZXRBY3RpdmVQYWdlSW1hZ2UoMzAwLCB0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgaWYgKGFjdGl2ZUltZyAmJiBhY3RpdmVJbWcuY29tcGxldGUgJiYgYWN0aXZlSW1nLm5hdHVyYWxXaWR0aCA+PSAzMDApIHtcbiAgICAgICAgICAvLyBEb3VibGUgY2hlY2sgbm8gcGVuZGluZyBIVFRQIGVycm9yIGJlZm9yZSBhY2NlcHRpbmcgaW1hZ2VcbiAgICAgICAgICBpZiAobGFzdEh0dHBFcnJvciAmJiAoRGF0ZS5ub3coKSAtIGxhc3RIdHRwRXJyb3IudGltZXN0YW1wIDwgMzAwMCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBEbyBub3QgYWNjZXB0IGltYWdlIHdoZW4gZXJyb3IgaXMgcGVuZGluZyFcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBcyBzb29uIGFzIHRoZSBpbWFnZSBpcyB2aXNpYmxlIHdpdGggYSBuZXcgc3JjIChvciBjb25maXJtZWQgbWF0Y2hpbmcgdGFyZ2V0UGFnZU51bSksIHJldHVybiBpdCFcbiAgICAgICAgICBjb25zdCBpc1RhcmdldFNlcSA9IGFjdGl2ZUltZy5kYXRhc2V0LnNlcSA9PT0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgIGlmIChhY3RpdmVJbWcuc3JjICYmIChhY3RpdmVJbWcuc3JjICE9PSBsYXN0U3JjIHx8IGlzVGFyZ2V0U2VxKSkge1xuICAgICAgICAgICAgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICAgICAgICAgICAgY29uc2VjdXRpdmVFcnJvckNvdW50ID0gMDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHt0YXJnZXRQYWdlTnVtfSB2aXNpYmxlICgke2FjdGl2ZUltZy5uYXR1cmFsV2lkdGh9eCR7YWN0aXZlSW1nLm5hdHVyYWxIZWlnaHR9cHgpIWApO1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUltZztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGltZWQgb3V0IG9yIGJhY2tlZCBvZmYgd2l0aG91dCBwYWdlIGNoYW5naW5nOlxuICAgICAgcmV0cnlBdHRlbXB0Kys7XG4gICAgICBjdXJyZW50UmV0cnlDb3VudCA9IHJldHJ5QXR0ZW1wdDtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSBkaWQgTk9UIGNoYW5nZSBhZnRlciBmbGlwIGF0dGVtcHQgJHtyZXRyeUF0dGVtcHR9IGZvciBwYWdlICR7dGFyZ2V0UGFnZU51bX0uIFJldHJ5aW5nLi4uYFxuICAgICAgKTtcblxuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdyZXRyeWluZycsXG4gICAgICAgIHJldHJ5Q291bnQ6IHJldHJ5QXR0ZW1wdCxcbiAgICAgICAgc3RhdHVzVGV4dDogYFJldHJ5aW5nIHBhZ2UgdHVybiAoJHtyZXRyeUF0dGVtcHR9LyR7Y29uZmlnLm1heFJldHJpZXN9KS4uLmAsXG4gICAgICB9KTtcblxuICAgICAgLy8gUXVpY2sgYmFja29mZiBkZWxheSBvbiBpbml0aWFsIHJldHJpZXM6IDFzLCAycywgM3MuLi4gKG1heCA1cylcbiAgICAgIGNvbnN0IGJhY2tvZmZTZWMgPSBNYXRoLm1pbihyZXRyeUF0dGVtcHQsIDUpO1xuICAgICAgYXdhaXQgc2xlZXAoYmFja29mZlNlYyAqIDEwMDApO1xuICAgIH1cblxuICAgIGNvbnNvbGUuZXJyb3IoYFtBcmNoaXZlRG93bmxvYWRlcl0gRmFpbGVkIHRvIGZsaXAgdG8gcGFnZSAke3RhcmdldFBhZ2VOdW19IGFmdGVyICR7Y29uZmlnLm1heFJldHJpZXN9IGF0dGVtcHRzLmApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIE1haW4gZG93bmxvYWQgYW5kIGNhcHR1cmUgb3JjaGVzdHJhdGlvbiBsb29wXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBzdGFydERvd25sb2FkKHVzZXJDb25maWc/OiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KSB7XG4gICAgaWYgKGlzUnVubmluZyAmJiAhaXNQYXVzZWQpIHJldHVybjtcblxuICAgIGlmIChpc1BhdXNlZCkge1xuICAgICAgcmVzdW1lRG93bmxvYWQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpc1J1bm5pbmcgPSB0cnVlO1xuICAgIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgc3RvcFJlcXVlc3RlZCA9IGZhbHNlO1xuICAgIGN1cnJlbnRSZXRyeUNvdW50ID0gMDtcbiAgICBkb3dubG9hZGVkUGFnZXMgPSAwO1xuICAgIGZhaWxlZFBhZ2VzID0gMDtcbiAgICBjb2xsZWN0ZWRJbWFnZXMgPSBbXTtcbiAgICBjb2xsZWN0ZWRUZXh0cyA9IFtdO1xuXG4gICAgaWYgKHVzZXJDb25maWcpIHtcbiAgICAgIGNvbmZpZyA9IHsgLi4uY29uZmlnLCAuLi51c2VyQ29uZmlnIH07XG4gICAgfVxuXG4gICAgLy8gUmVmcmVzaCBib29rIGRldGVjdGlvblxuICAgIGF3YWl0IHJlZnJlc2hCb29rSW5mbygpO1xuXG4gICAgY29uc3QgdG90YWxQYWdlcyA9IGJvb2tJbmZvPy50b3RhbFBhZ2VzIHx8IGNvbmZpZy5lbmRQYWdlIHx8IDUwMDtcbiAgICBjb25zdCBzdGFydFAgPSB0eXBlb2YgY29uZmlnLnN0YXJ0UGFnZSA9PT0gJ251bWJlcidcbiAgICAgID8gTWF0aC5tYXgocHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZSwgY29uZmlnLnN0YXJ0UGFnZSlcbiAgICAgIDogcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZTtcblxuICAgIGNvbnN0IG1heEJvb2tQYWdlID0gcHJvdmlkZXIuc2l0ZUlkID09PSAnYXJjaGl2ZScgJiYgcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZSA9PT0gMFxuICAgICAgPyBNYXRoLm1heCgwLCB0b3RhbFBhZ2VzIC0gMSlcbiAgICAgIDogdG90YWxQYWdlcztcblxuICAgIGNvbnN0IGVuZFAgPSBjb25maWcuZW5kUGFnZSA+IDBcbiAgICAgID8gY29uZmlnLmVuZFBhZ2VcbiAgICAgIDogbWF4Qm9va1BhZ2U7XG5cbiAgICBjb25zdCBib29rVGl0bGUgPSBib29rSW5mbz8uYm9va1RpdGxlIHx8IGAke3Byb3ZpZGVyLnNpdGVOYW1lfSBCb29rYDtcbiAgICBjb25zdCBib29rSWQgPSBib29rSW5mbz8uYm9va0lkIHx8ICdib29rJztcbiAgICBjb25zdCBzdWJEaXIgPSBmb3JtYXRTdWJkaXIoY29uZmlnLmJhc2VEaXIsIGNvbmZpZy5mb2xkZXJQYXR0ZXJuLCBib29rVGl0bGUsIGJvb2tJZCk7XG5cbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBTdGFydGluZyBkb3dubG9hZDogcGFnZXMgJHtzdGFydFB9IHRvICR7ZW5kUH0gaW50byAnJHtzdWJEaXJ9J2ApO1xuXG4gICAgLy8gU3RlcCAxOiBFbnN1cmUgU2luZ2xlLVBhZ2UgTW9kZSBpZiBjb25maWd1cmVkIGFuZCBzdXBwb3J0ZWRcbiAgICBpZiAoY29uZmlnLmF1dG9TaW5nbGVQYWdlICYmIHByb3ZpZGVyLmVuZm9yY2VTaW5nbGVQYWdlTW9kZSkge1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdlbnN1cmluZ19tb2RlJywgc3RhdHVzVGV4dDogJ1N3aXRjaGluZyB0byAxLXBhZ2UgbW9kZS4uLicgfSk7XG4gICAgICBhd2FpdCBlbmZvcmNlU2luZ2xlUGFnZU1vZGUoKTtcbiAgICAgIGF3YWl0IHNsZWVwKDYwMCk7XG4gICAgfVxuXG4gICAgLy8gU3RlcCAyOiBBbHdheXMgbmF2aWdhdGUgdG8gdGhlIHN0YXJ0aW5nIHBhZ2VcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6ICdkb3dubG9hZGluZycsXG4gICAgICBjdXJyZW50UGFnZTogc3RhcnRQLFxuICAgICAgc3RhdHVzVGV4dDogYE5hdmlnYXRpbmcgdG8gcGFnZSAke3N0YXJ0UH0uLi5gLFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIE5hdmlnYXRpbmcgdG8gc3RhcnRpbmcgcGFnZS9sZWFmICR7c3RhcnRQfS4uLmApO1xuICAgIGF3YWl0IHByb3ZpZGVyLm5hdmlnYXRlVG9QYWdlKHN0YXJ0UCk7XG5cbiAgICAvLyBHaXZlIHJlYWRlciB0aW1lIHRvIGxvYWQgYW5kIHJlbmRlciBzdGFydFBcbiAgICBhd2FpdCBzbGVlcCgxMjAwKTtcblxuICAgIGxldCBsYXN0SW1nU3JjID0gJyc7XG4gICAgbGV0IGN1cnJlbnRJbWc6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgIGZvciAobGV0IHBhZ2VOdW0gPSBzdGFydFA7IHBhZ2VOdW0gPD0gZW5kUDsgcGFnZU51bSsrKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgYnJlYWs7XG5cbiAgICAgIGN1cnJlbnRQYWdlID0gcGFnZU51bTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAnZG93bmxvYWRpbmcnLFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgc3RhdHVzVGV4dDogYENhcHR1cmluZyBwYWdlICR7cGFnZU51bX1gLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEZvciB0aGUgZmlyc3QgcGFnZSAob3IgcmVjb3ZlcnkpLCB3YWl0IGZvciB0aGUgaW1hZ2UgdG8gYmUgcmVhZHlcbiAgICAgIGlmICghY3VycmVudEltZykge1xuICAgICAgICBjb25zdCB3YWl0SW1hZ2VTdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gd2FpdEltYWdlU3RhcnQgPCAxNTAwMCkge1xuICAgICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSBicmVhaztcbiAgICAgICAgICB3aGlsZSAoaXNQYXVzZWQgfHwgIW5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSBicmVhaztcbiAgICAgICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudEltZyA9IHByb3ZpZGVyLmdldEFjdGl2ZVBhZ2VJbWFnZSgzMDAsIHBhZ2VOdW0pO1xuICAgICAgICAgIGlmIChjdXJyZW50SW1nKSBicmVhaztcbiAgICAgICAgICBhd2FpdCBzbGVlcCgxNTApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghY3VycmVudEltZykge1xuICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3BhZ2VOdW19IGltYWdlIHRpbWVkIG91dC5gKTtcbiAgICAgICAgZmFpbGVkUGFnZXMrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBhZ2VUb1Byb2Nlc3MgPSBwYWdlTnVtO1xuICAgICAgICBjb25zdCBwYWdlSW1nID0gY3VycmVudEltZztcbiAgICAgICAgY29uc3QgcGFnZUltZ1NyYyA9IGN1cnJlbnRJbWcuc3JjO1xuICAgICAgICBsYXN0SW1nU3JjID0gcGFnZUltZ1NyYztcblxuICAgICAgICAvLyBDYWxjdWxhdGUgZmluYWwgcGFnZSBkaW1lbnNpb25zXG4gICAgICAgIGxldCBwYWdlVyA9IHBhZ2VJbWcubmF0dXJhbFdpZHRoIHx8IHBhZ2VJbWcud2lkdGggfHwgMDtcbiAgICAgICAgbGV0IHBhZ2VIID0gcGFnZUltZy5uYXR1cmFsSGVpZ2h0IHx8IHBhZ2VJbWcuaGVpZ2h0IHx8IDA7XG4gICAgICAgIGlmIChjb25maWcubWF4UGFnZUhlaWdodCAmJiBjb25maWcubWF4UGFnZUhlaWdodCA+IDAgJiYgcGFnZUggPiBjb25maWcubWF4UGFnZUhlaWdodCkge1xuICAgICAgICAgIHBhZ2VXID0gTWF0aC5yb3VuZChwYWdlVyAqIChjb25maWcubWF4UGFnZUhlaWdodCAvIHBhZ2VIKSk7XG4gICAgICAgICAgcGFnZUggPSBjb25maWcubWF4UGFnZUhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkaW1lbnNpb25zID0geyB3aWR0aDogcGFnZVcsIGhlaWdodDogcGFnZUggfTtcbiAgICAgICAgbGFzdERpbWVuc2lvbnMgPSBkaW1lbnNpb25zO1xuXG4gICAgICAgIC8vIEdSQUIgTkVYVCBQQUdFIElNTUVESUFURUxZOiBUcmlnZ2VyIHRoZSBmbGlwIHRvIHBhZ2VOdW0gKyAxIHJpZ2h0IG5vdyFcbiAgICAgICAgY29uc3QgbmV4dFR1cm5Qcm9taXNlID0gKHBhZ2VOdW0gPCBlbmRQICYmICFzdG9wUmVxdWVzdGVkKVxuICAgICAgICAgID8gdHVybkFuZEdldE5leHRJbWFnZShwYWdlSW1nU3JjLCBwYWdlTnVtICsgMSlcbiAgICAgICAgICA6IG51bGw7XG5cbiAgICAgICAgLy8gQ29uY3VycmVudGx5IGNhcHR1cmUgaW1hZ2UgZGF0YSBhbmQgZXh0cmFjdCBPQ1IgdGV4dCBmb3IgcGFnZVRvUHJvY2Vzc1xuICAgICAgICBjb25zdCBjYXB0dXJlUHJvbWlzZSA9IChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IFtkYXRhVXJsLCB0ZXh0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgY2FwdHVyZUltYWdlVG9EYXRhVXJsKHBhZ2VJbWcsIGNvbmZpZy5pbWFnZVF1YWxpdHksIGNvbmZpZy5tYXhQYWdlSGVpZ2h0KSxcbiAgICAgICAgICAgICAgY29uZmlnLnNhdmVUZXh0TWQgPyAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBsZXQgdCA9IGF3YWl0IHByb3ZpZGVyLmV4dHJhY3RQYWdlVGV4dChwYWdlVG9Qcm9jZXNzLCBwYWdlSW1nKTtcbiAgICAgICAgICAgICAgICAgIGlmIChsYXN0SHR0cEVycm9yICYmIChEYXRlLm5vdygpIC0gbGFzdEh0dHBFcnJvci50aW1lc3RhbXAgPCAzMDAwKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBsYXN0SHR0cEVycm9yO1xuICAgICAgICAgICAgICAgICAgICBsYXN0SHR0cEVycm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIE9DUiB0ZXh0IGZldGNoIGZvciBwYWdlICR7cGFnZVRvUHJvY2Vzc30gZW5jb3VudGVyZWQgSFRUUCAke2Vyci5zdGF0dXNDb2RlfWApO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVIdHRwRXJyb3JCYWNrb2ZmKGVyciwgcGFnZVRvUHJvY2Vzcyk7XG4gICAgICAgICAgICAgICAgICAgIHQgPSBhd2FpdCBwcm92aWRlci5leHRyYWN0UGFnZVRleHQocGFnZVRvUHJvY2VzcywgcGFnZUltZyk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdDtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIENvdWxkIG5vdCBleHRyYWN0IHRleHQgZm9yIHBhZ2UgJHtwYWdlVG9Qcm9jZXNzfTpgLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkoKSA6IFByb21pc2UucmVzb2x2ZSgnJyksXG4gICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgLy8gU3RvcmUgZm9yIFBERiBjb21waWxlciAoZGVkdXBsaWNhdGUgYnkgcGFnZU51bSlcbiAgICAgICAgICAgIGlmIChjb25maWcuZ2VuZXJhdGVQZGYpIHtcbiAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdJZHggPSBjb2xsZWN0ZWRJbWFnZXMuZmluZEluZGV4KGkgPT4gaS5wYWdlTnVtID09PSBwYWdlVG9Qcm9jZXNzKTtcbiAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nSWR4ID49IDApIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0ZWRJbWFnZXNbZXhpc3RpbmdJZHhdID0ge1xuICAgICAgICAgICAgICAgICAgcGFnZU51bTogcGFnZVRvUHJvY2VzcyxcbiAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFVcmwsXG4gICAgICAgICAgICAgICAgICB3aWR0aDogcGFnZVcsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhZ2VILFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkSW1hZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgcGFnZU51bTogcGFnZVRvUHJvY2VzcyxcbiAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFVcmwsXG4gICAgICAgICAgICAgICAgICB3aWR0aDogcGFnZVcsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhZ2VILFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvd25sb2FkZWRQYWdlcyA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGg7XG5cbiAgICAgICAgICAgIC8vIFNhdmUgaW5kaXZpZHVhbCBpbWFnZSBmaWxlIGlmIGNvbmZpZ3VyZWRcbiAgICAgICAgICAgIGlmIChjb25maWcuc2F2ZUltYWdlcykge1xuICAgICAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0RPV05MT0FEX1BBR0VfSU1BR0UnLFxuICAgICAgICAgICAgICAgIGJvb2tUaXRsZSxcbiAgICAgICAgICAgICAgICBwYWdlTnVtOiBwYWdlVG9Qcm9jZXNzLFxuICAgICAgICAgICAgICAgIHRvdGFsUGFnZXM6IGVuZFAsXG4gICAgICAgICAgICAgICAgZGF0YVVybCxcbiAgICAgICAgICAgICAgICBzdWJEaXIsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdG9yZSBPQ1IgdGV4dFxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zYXZlVGV4dE1kICYmIHRleHQpIHtcbiAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdUZXh0SWR4ID0gY29sbGVjdGVkVGV4dHMuZmluZEluZGV4KHQgPT4gdC5wYWdlTnVtID09PSBwYWdlVG9Qcm9jZXNzKTtcbiAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGV4dElkeCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkVGV4dHNbZXhpc3RpbmdUZXh0SWR4XSA9IHsgcGFnZU51bTogcGFnZVRvUHJvY2VzcywgbGVhZkluZGV4OiBwYWdlVG9Qcm9jZXNzLCB0ZXh0IH07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkVGV4dHMucHVzaCh7IHBhZ2VOdW06IHBhZ2VUb1Byb2Nlc3MsIGxlYWZJbmRleDogcGFnZVRvUHJvY2VzcywgdGV4dCB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiBwYWdlVG9Qcm9jZXNzLFxuICAgICAgICAgICAgICBkb3dubG9hZGVkUGFnZXMsXG4gICAgICAgICAgICAgIGN1cnJlbnRUaHVtYm5haWw6IGRhdGFVcmwsXG4gICAgICAgICAgICAgIHN0YXR1c1RleHQ6IGBDYXB0dXJpbmcgcGFnZSAke3BhZ2VUb1Byb2Nlc3N9YCxcbiAgICAgICAgICAgICAgaW1hZ2VEaW1lbnNpb25zOiBkaW1lbnNpb25zLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgZmFpbGVkUGFnZXMrKztcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtBcmNoaXZlRG93bmxvYWRlcl0gRXJyb3IgcHJvY2Vzc2luZyBwYWdlICR7cGFnZVRvUHJvY2Vzc306YCwgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG5cbiAgICAgICAgLy8gQXdhaXQgY3VycmVudCBwYWdlIGNhcHR1cmUgYW5kIHN0b3JhZ2VcbiAgICAgICAgYXdhaXQgY2FwdHVyZVByb21pc2U7XG5cbiAgICAgICAgLy8gSWYgbm90IHRoZSBsYXN0IHBhZ2UsIHdhaXQgZm9yIHRoZSBuZXh0IHBhZ2UgZmxpcCB0byByZXNvbHZlXG4gICAgICAgIGlmIChuZXh0VHVyblByb21pc2UpIHtcbiAgICAgICAgICBjb25zdCBuZXh0SW1nID0gYXdhaXQgbmV4dFR1cm5Qcm9taXNlO1xuICAgICAgICAgIGlmICghbmV4dEltZykge1xuICAgICAgICAgICAgaWYgKGlzRW5kT2ZCb29rKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFJlYWNoZWQgZW5kIG9mIGJvb2sgYXQgcGFnZSAke3BhZ2VOdW19LiBGaW5hbGl6aW5nLmApO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmFpbGVkIGFmdGVyIHJldHJpZXM6IHByb21wdCB1c2VyIHRvIHNhdmUgY2FwdHVyZWQgcGFnZXMhXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gQ291bGQgbm90IHR1cm4gcGFzdCBwYWdlICR7cGFnZU51bX0uIFByb21wdGluZyB1c2VyIHRvIHNhdmUuYCk7XG4gICAgICAgICAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgICAgICAgICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVTdG9wUmVxdWVzdChgQ2Fubm90IGNvbnRpbnVlIHBhc3QgcGFnZSAke3BhZ2VOdW19LiBTYXZlIGFsbCAke2NvdW50fSBwYWdlcyBkb3dubG9hZGVkIHNvIGZhcj9gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE5leHQgcGFnZSBpcyByZWFkeSBmb3IgdGhlIG5leHQgaXRlcmF0aW9uIVxuICAgICAgICAgIGN1cnJlbnRJbWcgPSBuZXh0SW1nO1xuXG4gICAgICAgICAgLy8gU3luY2hyb25pemUgcGFnZSBjb3VudGVyIGlmIHZpZXdlciBpcyBhaGVhZCAoQXJjaGl2ZS5vcmcgbGVhZi1qdW1waW5nKVxuICAgICAgICAgIGlmIChwcm92aWRlci5zaXRlSWQgIT09ICdoYXRoaXRydXN0Jykge1xuICAgICAgICAgICAgY29uc3QgZG9tUGFnZU5vdyA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICAgICAgICBpZiAoZG9tUGFnZU5vdyAhPT0gbnVsbCAmJiBkb21QYWdlTm93ID4gcGFnZU51bSkge1xuICAgICAgICAgICAgICBwYWdlTnVtID0gZG9tUGFnZU5vdyAtIDE7IC8vIHBhZ2VOdW0rKyBpbiB0aGUgZm9yLWxvb3Agd2lsbCBzZXQgcGFnZU51bSA9IGRvbVBhZ2VOb3dcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXcmFwLXVwOiBHZW5lcmF0ZSBQREYgYW5kIE1hcmtkb3duIGZpbGVzXG4gICAgaWYgKCFzdG9wUmVxdWVzdGVkICYmIGRvd25sb2FkZWRQYWdlcyA+IDApIHtcbiAgICAgIGF3YWl0IGZpbmFsaXplQm9vayhzdWJEaXIsIGJvb2tUaXRsZSk7XG4gICAgfVxuXG4gICAgaXNSdW5uaW5nID0gZmFsc2U7XG4gICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBzdG9wUmVxdWVzdGVkID8gJ2lkbGUnIDogJ2NvbXBsZXRlJyxcbiAgICAgIHN0YXR1c1RleHQ6IHN0b3BSZXF1ZXN0ZWQgPyAnU3RvcHBlZCBieSB1c2VyJyA6IGBDb21wbGV0ZWQhIFNhdmVkICR7ZG93bmxvYWRlZFBhZ2VzfSBwYWdlcy5gLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGVzIGFuZCB0cmlnZ2VycyBkb3dubG9hZCBmb3IgdGhlIGZpbmFsIFBERiBhbmQgTWFya2Rvd24gdGV4dCBkb2N1bWVudC5cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGZpbmFsaXplQm9vayhzdWJEaXI6IHN0cmluZywgYm9va1RpdGxlOiBzdHJpbmcpIHtcbiAgICAvLyAxLiBDb21waWxlIFBERlxuICAgIGlmIChjb25maWcuZ2VuZXJhdGVQZGYgJiYgY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnY29tcGlsaW5nX3BkZicsIHN0YXR1c1RleHQ6ICdDb21waWxpbmcgUERGIGRvY3VtZW50Li4uJyB9KTtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEFzc2VtYmxpbmcgUERGIGZyb20nLCBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoLCAncGFnZXMuLi4nKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGRmQnl0ZXMgPSBjb21waWxlSnBlZ3NUb1BkZihjb2xsZWN0ZWRJbWFnZXMsIHtcbiAgICAgICAgICB0aXRsZTogYm9va1RpdGxlLFxuICAgICAgICAgIGF1dGhvcjogYm9va0luZm8/LmF1dGhvciB8fCBwcm92aWRlci5zaXRlTmFtZSxcbiAgICAgICAgICBjcmVhdG9yOiAnQXJjaGl2ZSBEb3dubG9hZGVyJyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcGRmQmxvYiA9IG5ldyBCbG9iKFtwZGZCeXRlc10sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL3BkZicgfSk7XG4gICAgICAgIGNvbnN0IHBkZkJsb2JVcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHBkZkJsb2IpO1xuXG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnU0FWRV9GSU5BTF9GSUxFUycsXG4gICAgICAgICAgYm9va1RpdGxlLFxuICAgICAgICAgIHN1YkRpcixcbiAgICAgICAgICBwZGZCbG9iVXJsLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBQREYgY29tcGlsZWQgYW5kIHNlbnQgZm9yIGRvd25sb2FkIScpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tBcmNoaXZlRG93bmxvYWRlcl0gRmFpbGVkIHRvIGNvbXBpbGUgUERGOicsIGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gU2F2ZSBNYXJrZG93biB0ZXh0XG4gICAgaWYgKGNvbmZpZy5zYXZlVGV4dE1kKSB7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3NhdmluZ190ZXh0Jywgc3RhdHVzVGV4dDogJ1NhdmluZyBNYXJrZG93biB0ZXh0Li4uJyB9KTtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEFzc2VtYmxpbmcgTWFya2Rvd24gZnJvbScsIGNvbGxlY3RlZFRleHRzLmxlbmd0aCwgJ3BhZ2UgdGV4dHMuLi4nKTtcblxuICAgICAgY29uc3QgbWRDb250ZW50ID0gYnVpbGRCb29rTWFya2Rvd24oXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogYm9va1RpdGxlLFxuICAgICAgICAgIGJvb2tJZDogYm9va0luZm8/LmJvb2tJZCB8fCAnYm9vaycsXG4gICAgICAgICAgYXV0aG9yOiBib29rSW5mbz8uYXV0aG9yLFxuICAgICAgICAgIHB1Ymxpc2hlcjogYm9va0luZm8/LnB1Ymxpc2hlcixcbiAgICAgICAgICB5ZWFyOiBib29rSW5mbz8ueWVhcixcbiAgICAgICAgICBzb3VyY2VVcmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgICAgIHRvdGFsUGFnZXM6IGJvb2tJbmZvPy50b3RhbFBhZ2VzIHx8IGN1cnJlbnRQYWdlLFxuICAgICAgICB9LFxuICAgICAgICBjb2xsZWN0ZWRUZXh0c1xuICAgICAgKTtcblxuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnU0FWRV9GSU5BTF9GSUxFUycsXG4gICAgICAgIGJvb2tUaXRsZSxcbiAgICAgICAgc3ViRGlyLFxuICAgICAgICBtYXJrZG93bkNvbnRlbnQ6IG1kQ29udGVudCxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBNYXJrZG93biBnZW5lcmF0ZWQgYW5kIHNlbnQgZm9yIGRvd25sb2FkIScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhdXNlRG93bmxvYWQoKSB7XG4gICAgaXNQYXVzZWQgPSB0cnVlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAncGF1c2VkJywgc3RhdHVzVGV4dDogJ0Rvd25sb2FkIHBhdXNlZCcgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXN1bWVEb3dubG9hZCgpIHtcbiAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHsgc3RhdHVzOiAnZG93bmxvYWRpbmcnLCBzdGF0dXNUZXh0OiBgUmVzdW1pbmcgcGFnZSAke2N1cnJlbnRQYWdlfS4uLmAgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBzYXZlUGFydGlhbEFuZENvbXBsZXRlKGNvdW50OiBudW1iZXIpIHtcbiAgICBzdG9wUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogJ2NvbXBpbGluZ19wZGYnLFxuICAgICAgc3RhdHVzVGV4dDogYFNhdmluZyAke2NvdW50fSBjYXB0dXJlZCBwYWdlcy4uLmAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBib29rVGl0bGUgPSBib29rSW5mbz8uYm9va1RpdGxlIHx8IGAke3Byb3ZpZGVyLnNpdGVOYW1lfSBCb29rYDtcbiAgICBjb25zdCBib29rSWQgPSBib29rSW5mbz8uYm9va0lkIHx8ICdib29rJztcbiAgICBjb25zdCBzdWJEaXIgPSBmb3JtYXRTdWJkaXIoY29uZmlnLmJhc2VEaXIsIGNvbmZpZy5mb2xkZXJQYXR0ZXJuLCBib29rVGl0bGUsIGJvb2tJZCk7XG5cbiAgICBhd2FpdCBmaW5hbGl6ZUJvb2soc3ViRGlyLCBib29rVGl0bGUpO1xuXG4gICAgaXNSdW5uaW5nID0gZmFsc2U7XG4gICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgc3RhdHVzOiAnY29tcGxldGUnLFxuICAgICAgZG93bmxvYWRlZFBhZ2VzOiBjb3VudCxcbiAgICAgIHN0YXR1c1RleHQ6IGBDb21wbGV0ZWQhIFNhdmVkICR7Y291bnR9IHBhZ2VzLmAsXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVTdG9wUmVxdWVzdChjdXN0b21NZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgaWYgKCFpc1J1bm5pbmcpIHtcbiAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCB8fCBkb3dubG9hZGVkUGFnZXM7XG4gICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgLy8gVGVtcG9yYXJpbHkgcGF1c2UgdGhlIGRvd25sb2FkIGN5Y2xlIHdoaWxlIHVzZXIgZGVjaWRlc1xuICAgICAgaXNQYXVzZWQgPSB0cnVlO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgICAgICBzdGF0dXNUZXh0OiBjdXN0b21NZXNzYWdlIHx8IGBQYXVzZWQ6IFNhdmUgJHtjb3VudH0gcGFnZXM/YCxcbiAgICAgIH0pO1xuXG4gICAgICBwaWxsLnNob3dTdG9wUHJvbXB0KFxuICAgICAgICBjb3VudCxcbiAgICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIC8vIFlFUzogU2F2ZSBldmVyeXRoaW5nIGFuZCB0cmVhdCBsaWtlIGNvbXBsZXRlIVxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFVzZXIgY29uZmlybWVkIHNhdmluZyAke2NvdW50fSBwYWdlcy5gKTtcbiAgICAgICAgICBhd2FpdCBzYXZlUGFydGlhbEFuZENvbXBsZXRlKGNvdW50KTtcbiAgICAgICAgfSxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIC8vIERJU0NBUkRcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBVc2VyIGRpc2NhcmRlZCBkb3dubG9hZHMgb24gc3RvcC4nKTtcbiAgICAgICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIC8vIENBTkNFTCAvIFJFU1VNRVxuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFJlc3VtaW5nIGRvd25sb2FkLi4uJyk7XG4gICAgICAgICAgcmVzdW1lRG93bmxvYWQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgY3VzdG9tTWVzc2FnZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcERvd25sb2FkKCkge1xuICAgIHN0b3BSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgY29sbGVjdGVkSW1hZ2VzID0gW107XG4gICAgY29sbGVjdGVkVGV4dHMgPSBbXTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2lkbGUnLCBzdGF0dXNUZXh0OiAnRG93bmxvYWQgc3RvcHBlZCcgfSk7XG4gIH1cblxuICAvLyBIYW5kbGUgbWVzc2FnZXMgZnJvbSBQb3B1cCBvciBCYWNrZ3JvdW5kIFNlcnZpY2UgV29ya2VyXG4gIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZTogRXh0ZW5zaW9uTWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgICAgY2FzZSAnR0VUX1NUQVRFJzoge1xuICAgICAgICBicm9hZGNhc3RTdGF0ZSgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBib29rSW5mbyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NUQVJUX0RPV05MT0FEJzoge1xuICAgICAgICBzdGFydERvd25sb2FkKG1lc3NhZ2UuY29uZmlnKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1BBVVNFX0RPV05MT0FEJzoge1xuICAgICAgICBwYXVzZURvd25sb2FkKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdSRVNVTUVfRE9XTkxPQUQnOiB7XG4gICAgICAgIHJlc3VtZURvd25sb2FkKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTVE9QX0FORF9TQVZFJzoge1xuICAgICAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgICAgICBpZiAoaXNSdW5uaW5nICYmIGNvdW50ID4gMCkge1xuICAgICAgICAgIHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgICAgICB9XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTVE9QX0RPV05MT0FEJzoge1xuICAgICAgICBpZiAobWVzc2FnZS5zYXZlQ29sbGVjdGVkKSB7XG4gICAgICAgICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICAgICAgICBpZiAoaXNSdW5uaW5nICYmIGNvdW50ID4gMCkge1xuICAgICAgICAgICAgc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudCk7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1dJVENIX1RPX1NJTkdMRV9QQUdFJzoge1xuICAgICAgICBlbmZvcmNlU2luZ2xlUGFnZU1vZGUoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NBVkVfQ09ORklHJzoge1xuICAgICAgICBzYXZlQ29uZmlnKG1lc3NhZ2UuY29uZmlnKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgY29uZmlnIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnR0VUX0NPTkZJRyc6IHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgY29uZmlnIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnSFRUUF9FUlJPUl9ERVRFQ1RFRCc6IHtcbiAgICAgICAgb25IdHRwRXJyb3JSZWNlaXZlZChtZXNzYWdlLnN0YXR1c0NvZGUsIG1lc3NhZ2UudXJsLCBtZXNzYWdlLnJldHJ5QWZ0ZXIpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xufSkoKTtcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUE4Qk8sTUFBTSxhQUFhO0FBQUEsRUFDaEIsWUFBZ0M7QUFBQSxFQUNoQyxXQUFXO0FBQUEsRUFDWCxpQkFBaUI7QUFBQSxFQUNqQixtQkFBbUI7QUFBQSxFQUNuQixZQUEyQixDQUFDO0FBQUEsRUFDNUIsZ0JBQTJDLENBQUM7QUFBQSxFQUVwRCxXQUFXLENBQUMsWUFBMkIsQ0FBQyxHQUFHO0FBQUEsSUFDekMsS0FBSyxZQUFZO0FBQUE7QUFBQSxFQUdaLFlBQVksR0FBWTtBQUFBLElBQzdCLE1BQU0sWUFBWSxPQUFPLFNBQVMsU0FBUyxTQUFTLGFBQWEsS0FDL0MsT0FBTyxTQUFTLFNBQVMsU0FBUyxXQUFXO0FBQUEsSUFDL0QsTUFBTSxVQUFVLE9BQU8sU0FBUyxhQUFhLDBCQUM1QixPQUFPLFNBQVMsU0FBUyxTQUFTLGdCQUFnQixLQUFLLE9BQU8sU0FBUyxTQUFTLFdBQVcsU0FBUztBQUFBLElBQ3JILE9BQU8sYUFBYTtBQUFBO0FBQUEsRUFHZixNQUFNLEdBQVM7QUFBQSxJQUNwQixJQUFJLENBQUMsS0FBSyxhQUFhO0FBQUEsTUFBRztBQUFBLElBQzFCLElBQUksS0FBSztBQUFBLE1BQVc7QUFBQSxJQUVwQixNQUFNLE9BQU8sU0FBUyxjQUFjLEtBQUs7QUFBQSxJQUN6QyxLQUFLLEtBQUs7QUFBQSxJQUNWLEtBQUssWUFBWTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsb0JBMllELE9BQU8sUUFBUSxPQUFPLGtCQUFrQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQTBHeEQsU0FBUyxL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QUEsWUFDOUI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsYUFBYTtBQUFBLFFBQ2IsYUFBYSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsV0FFSyx5QkFBeUI7QUFBQSxRQUM1QixzQkFBc0I7QUFBQSxRQUN0QixhQUFhLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxXQUVLLGVBQWU7QUFBQSxRQUNsQixXQUFXLFFBQVEsTUFBTTtBQUFBLFFBQ3pCLGFBQWEsRUFBRSxTQUFTLE1BQU0sT0FBTyxDQUFDO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQUEsV0FFSyxjQUFjO0FBQUEsUUFDakIsYUFBYSxFQUFFLFNBQVMsTUFBTSxPQUFPLENBQUM7QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFBQSxXQUVLLHVCQUF1QjtBQUFBLFFBQzFCLG9CQUFvQixRQUFRLFlBQVksUUFBUSxLQUFLLFFBQVEsVUFBVTtBQUFBLFFBQ3ZFLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBO0FBQUEsSUFFRixPQUFPO0FBQUEsR0FDUjtBQUFBLEdBQ0E7IiwKICAiZGVidWdJZCI6ICJFRTA3OEZCRUQ1RTcxNTlENjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
