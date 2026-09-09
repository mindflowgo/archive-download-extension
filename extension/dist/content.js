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
  async function captureImageToDataUrl(img, quality = 0.75, maxPageHeight = 0) {
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
        console.warn(`[ArchiveDownloader] Canvas tainted for ${img.src}. Recovering via clean blob fetch...`);
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
    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        blob = await res.blob();
      }
    } catch (e) {}
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
          const dataUrl = await captureImageToDataUrl(currentImg, config.imageQuality, config.maxPageHeight);
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

//# debugId=0220F7B0196F636164756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvcGlsbC50cyIsICIuLi9zcmMvdXRpbHMvbWFya2Rvd24tYnVpbGRlci50cyIsICIuLi9zcmMvdXRpbHMvcGRmLWJ1aWxkZXIudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0aXplci50cyIsICIuLi9zcmMvcHJvdmlkZXJzL2FyY2hpdmUtcHJvdmlkZXIudHMiLCAiLi4vc3JjL3Byb3ZpZGVycy9oYXRoaXRydXN0LXByb3ZpZGVyLnRzIiwgIi4uL3NyYy9wcm92aWRlcnMvaW5kZXgudHMiLCAiLi4vc3JjL2NvbnRlbnQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiLyoqXG4gKiBGbG9hdGluZyBQcm9ncmVzcyBQaWxsIE92ZXJsYXkgZm9yIEFyY2hpdmUub3JnXG4gKiBPTkxZIGFwcGVhcnMgb24gaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLypcbiAqXG4gKiBGZWF0dXJlczpcbiAqIC0gQ29nIGljb24gYnV0dG9uICjimpkpIHRvIG9wZW4gZXhwYW5kYWJsZSBpbi1wYWdlIFNldHRpbmdzIHRyYXlcbiAqIC0gU2V0dGluZ3MgKHNhdmUgcGF0aCwgZm9sZGVyIHBhdHRlcm4sIHN0YXJ0L2VuZCBwYWdlcykgc2F2ZWQgdG8gbG9jYWxTdG9yYWdlXG4gKiAtIFNxdWFyZSwgZnVsbC1oZWlnaHQgYnV0dG9ucyB3aXRoIG5vIGN1cnZhdHVyZSAoanVzdCBsaW5lIG91dGxpbmUpXG4gKiAtIFvinJVdIGJ1dHRvbiB0aGF0IHNocmlua3MgcGlsbCB0byBhIHNtYWxsIGRvY2tlZCBib29rIGljb24gb24gdGhlIGZhciBsZWZ0IGVkZ2Ugb2YgdGhlIHNjcmVlblxuICogLSBDbGlja2luZyB0aGUgZG9ja2VkIGJvb2sgaWNvbiByZXN0b3JlcyB0aGUgcGlsbFxuICogLSBJbWFnZSBkaW1lbnNpb25zIGluIHNtYWxsIGdyZXkgbGV0dGVycyBiZWxvdyBzdGF0dXM6XG4gKiAgIFwiQ2FwdHVyaW5nIHBhZ2UgMTRcIlxuICogICBcIihpbWFnZTogMjU4MCB4IDM5MTUpXCJcbiAqIC0gW0NPTlRJTlVFXSBidXR0b24gd2hlbiBzdGFsbGVkIG9yIGNvbm5lY3Rpb24gZHJvcHNcbiAqIC0gSW50ZXJhY3RpdmUgU3RvcCBjb25maXJtYXRpb24gcHJvbXB0IHRvIHNhdmUgY2FwdHVyZWQgcGFnZXMgc28gZmFyXG4gKiAtIFwiRG93bmxvYWRlZDogVmlldyBGaWxlc1wiIGJ1dHRvbiBvbiBjb21wbGV0aW9uIHRoYXQgb3BlbnMgdGhlIGRvd25sb2FkZWQgZmlsZS9mb2xkZXJcbiAqL1xuXG5pbXBvcnQgeyBEb3dubG9hZGVyQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpbGxDYWxsYmFja3Mge1xuICBvblN0YXJ0PzogKCkgPT4gdm9pZDtcbiAgb25QYXVzZT86ICgpID0+IHZvaWQ7XG4gIG9uUmVzdW1lPzogKCkgPT4gdm9pZDtcbiAgb25TdG9wPzogKCkgPT4gdm9pZDtcbiAgb25TYXZlU2V0dGluZ3M/OiAoc2V0dGluZ3M6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pID0+IHZvaWQ7XG4gIG9uU3dpdGNoTW9kZT86ICgpID0+IHZvaWQ7XG4gIG9uVmlld0ZpbGU/OiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgRmxvYXRpbmdQaWxsIHtcbiAgcHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNEb2NrZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBpc1NldHRpbmdzT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzQ29uZmlybWluZ1N0b3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFBpbGxDYWxsYmFja3MgPSB7fTtcbiAgcHJpdmF0ZSBjdXJyZW50Q29uZmlnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+ID0ge307XG5cbiAgY29uc3RydWN0b3IoY2FsbGJhY2tzOiBQaWxsQ2FsbGJhY2tzID0ge30pIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgfVxuXG4gIHB1YmxpYyBzaG91bGRSZW5kZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNBcmNoaXZlID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluY2x1ZGVzKCcvZGV0YWlscy8nKTtcbiAgICBjb25zdCBpc0JhYmVsID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnYmFiZWwuaGF0aGl0cnVzdC5vcmcnIHx8XG4gICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzQXJjaGl2ZSB8fCBpc0JhYmVsO1xuICB9XG5cbiAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2hvdWxkUmVuZGVyKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwaWxsLmlkID0gJ2FyY2hpdmUtZG93bmxvYWRlci1waWxsJztcbiAgICBwaWxsLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgI2FyY2hpdmUtZG93bmxvYWRlci1waWxsIHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiAxNHB4O1xuICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gICAgICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE4LCAxOCwgMTgsIDAuOTYpO1xuICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICAtd2Via2l0LWJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgOHB4IDMycHggcmdiYSgwLCAwLCAwLCAwLjY1KTtcbiAgICAgICAgICBjb2xvcjogI2YxZjFmMTtcbiAgICAgICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBlYXNlLCBvcGFjaXR5IDAuMjVzIGVhc2U7XG4gICAgICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICAgICAgbWF4LXdpZHRoOiA5NXZ3O1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiBEb2NrZWQgdG8gZmFyIGxlZnQgb2Ygd2luZG93ICovXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCB7XG4gICAgICAgICAgbGVmdDogMCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRvcDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIHRyYW5zZm9ybTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIGJvcmRlci1sZWZ0OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMCA2cHggNnB4IDAgIWltcG9ydGFudDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICBib3gtc2hhZG93OiAycHggNHB4IDE2cHggcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtbWFpbi1ib2R5LFxuICAgICAgICAjYXJjaGl2ZS1kb3dubG9hZGVyLXBpbGwuZG9ja2VkLWxlZnQgLnBpbGwtc2V0dGluZ3MtcGFuZWwge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgfVxuXG4gICAgICAgICNhcmNoaXZlLWRvd25sb2FkZXItcGlsbC5kb2NrZWQtbGVmdCAucGlsbC1kb2NrLWljb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtZG9jay1pY29uIGltZyB7XG4gICAgICAgICAgd2lkdGg6IDI0cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLW1haW4tYm9keSB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDQ4cHg7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBDb2cgc2V0dGluZ3MgYnV0dG9uIHJlcGxhY2luZyB0aGUgc3RhdGljIGxvZ28gKi9cbiAgICAgICAgLnBpbGwtY29nLWJ0biB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTNweDtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMsIGNvbG9yIDAuMTVzLCB0cmFuc2Zvcm0gMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMzBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtY29nLWJ0bi5hY3RpdmUge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTtcbiAgICAgICAgICBjb2xvcjogIzNlYTZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEZ1bGwgaGVpZ2h0IGJ1dHRvbnMgd2l0aCBOTyBjdXJ2YXR1cmUgKGJvcmRlci1yYWRpdXM6IDApLCBvdXRsaW5lZCBvbmx5ICovXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4ge1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgcGFkZGluZzogMCAxNHB4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA2cHg7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xMik7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1wcmltYXJ5IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tcHJpbWFyeTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzI5ODllNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWNvbnRpbnVlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjU5ZTBiO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1hY3Rpb24tYnRuLmJ0bi1jb250aW51ZTpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Q5NzcwNjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLXZpZXctZmlsZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzEwYjk4MTtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tdmlldy1maWxlOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMDU5NjY5O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tZGFuZ2VyIHtcbiAgICAgICAgICBjb2xvcjogI2Y4NzE3MTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWFjdGlvbi1idG4uYnRuLWRhbmdlcjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNDgsIDExMywgMTEzLCAwLjIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtYWN0aW9uLWJ0bi5idG4tbW9kZSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y1OWUwYjtcbiAgICAgICAgICBjb2xvcjogIzAwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAqL1xuICAgICAgICAucGlsbC1jb25maXJtLWJhciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogc3RyZXRjaDtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNSwgMjUsIDI1LCAwLjk4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNvbmZpcm0tdGV4dCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIGNvbG9yOiAjZjU5ZTBiO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xOCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTdGF0dXMgJiBJbWFnZSBEaW1lbnNpb25zIFNlY3Rpb24gKi9cbiAgICAgICAgLnBpbGwtc3RhdHVzLXNlY3Rpb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgbWluLXdpZHRoOiAxNzBweDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTgpO1xuICAgICAgICAgIGdhcDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBtYXgtd2lkdGg6IDIyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc3RhdHVzLXRleHQud2FybmluZyB7XG4gICAgICAgICAgY29sb3I6ICNmNTllMGI7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5lcnJvciB7XG4gICAgICAgICAgY29sb3I6ICNlZjQ0NDQ7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zdGF0dXMtdGV4dC5jb21wbGV0ZSB7XG4gICAgICAgICAgY29sb3I6ICMxMGI5ODE7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTbWFsbCBncmV5IGltYWdlIGRpbWVuc2lvbnMgKi9cbiAgICAgICAgLnBpbGwtZGltZW5zaW9ucy10ZXh0IHtcbiAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgY29sb3I6ICM4ODg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtcHJvZ3Jlc3MtdHJhY2sge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogM3B4O1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1wcm9ncmVzcy1maWxsIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgd2lkdGg6IDAlO1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMzZWE2ZmY7XG4gICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmlnaHQgU2lkZSBDb3VudGVyICgwLzUxNSBwYWdlcykgKi9cbiAgICAgICAgLnBpbGwtY291bnRlci1ib3gge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDE0cHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgY29sb3I6ICNhYWE7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogW3hdIENsb3NlL1NocmluayBCdXR0b24gKi9cbiAgICAgICAgLnBpbGwtY2xvc2UtYnRuIHtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGNvbG9yOiAjODg4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLWNsb3NlLWJ0bjpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5ICovXG4gICAgICAgIC5waWxsLXNldHRpbmdzLXBhbmVsIHtcbiAgICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE0LCAxNCwgMTQsIDAuOTgpO1xuICAgICAgICAgIHBhZGRpbmc6IDEycHggMTZweDtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmdzLWhlYWRlciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgIHBhZGRpbmctYm90dG9tOiA2cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy10aXRsZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xuICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludC5zaG93IHtcbiAgICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZ3MtZ3JpZCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1yb3cgbGFiZWwge1xuICAgICAgICAgIGNvbG9yOiAjYWFhO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLXJvdy1oYWxmIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgICAgICAgIGdhcDogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctcm93LWhhbGYgPiBkaXYge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctaW5wdXQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyNDI0MjQ7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICBwYWRkaW5nOiA1cHggOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAwLjE1cztcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgIG1heC13aWR0aDogMjYwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWlucHV0OmZvY3VzIHtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICMzZWE2ZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5ncy1mb290ZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAucGlsbC1zZXR0aW5nLWJ0biB7XG4gICAgICAgICAgcGFkZGluZzogNXB4IDEycHg7XG4gICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgY29sb3I6ICNjY2M7XG4gICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMTVzO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG46aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5waWxsLXNldHRpbmctYnRuLmJ0bi1zYXZlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjM2VhNmZmO1xuICAgICAgICAgIGNvbG9yOiAjMDAwO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnBpbGwtc2V0dGluZy1idG4uYnRuLXNhdmU6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyOTg5ZTY7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG5cbiAgICAgIDwhLS0gRG9ja2VkIFNtYWxsIEljb24gKFZpc2libGUgd2hlbiBtaW5pbWl6ZWQgdG8gZmFyIGxlZnQpIC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtZG9jay1pY29uXCIgaWQ9XCJwaWxsRG9ja0ljb25cIiB0aXRsZT1cIk9wZW4gQXJjaGl2ZSBEb3dubG9hZGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPVwiJHtjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ljb25zL2ljb240OC5wbmcnKX1cIiBhbHQ9XCJBcmNoaXZlIERvd25sb2FkZXJcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gTWFpbiBCb2R5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtbWFpbi1ib2R5XCI+XG4gICAgICAgIDwhLS0gQ29nIHNldHRpbmdzIGJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtY29nLWJ0blwiIGlkPVwicGlsbENvZ0J0blwiIHRpdGxlPVwiRWRpdCBTZXR0aW5ncyAoU2F2ZSBwYXRoLCBwYXR0ZXJuLCBwYWdlcylcIj7impk8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIElubGluZSBDb25maXJtYXRpb24gQmFyIGZvciBTdG9wIEFjdGlvbiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtY29uZmlybS1iYXJcIiBpZD1cInBpbGxDb25maXJtQmFyXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwicGlsbC1jb25maXJtLXRleHRcIiBpZD1cInBpbGxDb25maXJtVGV4dFwiPlNhdmUgY2FwdHVyZWQgcGFnZXM/PC9zcGFuPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXZpZXctZmlsZVwiIGlkPVwicGlsbENvbmZpcm1TYXZlQnRuXCI+4pyUIFllcywgU2F2ZSBGaWxlczwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLWRhbmdlclwiIGlkPVwicGlsbENvbmZpcm1EaXNjYXJkQnRuXCI+RGlzY2FyZDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxDb25maXJtQ2FuY2VsQnRuXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gU3RhcnQgRG93bmxvYWQgQnV0dG9uIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1wcmltYXJ5XCIgaWQ9XCJwaWxsU3RhcnRCdG5cIj5cbiAgICAgICAgICDilrYgU3RhcnQgRG93bmxvYWRcbiAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgPCEtLSBDb250aW51ZSBCdXR0b24gKHdoZW4gc3RhbGxlZCAvIG9mZmxpbmUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi1jb250aW51ZVwiIGlkPVwicGlsbENvbnRpbnVlQnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgIOKWtiBDT05USU5VRVxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIFZpZXcgRmlsZSBCdXR0b24gKHdoZW4gY29tcGxldGUpIC0tPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1hY3Rpb24tYnRuIGJ0bi12aWV3LWZpbGVcIiBpZD1cInBpbGxWaWV3RmlsZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinJQgVmlldyBGaWxlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gRHluYW1pYyBDb250cm9scyAoYWN0aXZlIGR1cmluZyBkb3dubG9hZCkgLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG5cIiBpZD1cInBpbGxQYXVzZUJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDinZrinZogUGF1c2VcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWFjdGlvbi1idG4gYnRuLXByaW1hcnlcIiBpZD1cInBpbGxSZXN1bWVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAg4pa2IFJlc3VtZVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tZGFuZ2VyXCIgaWQ9XCJwaWxsU3RvcEJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICDil7wgU3RvcFxuICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICA8IS0tIDEtUGFnZSBNb2RlIEJ1dHRvbiAtLT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtYWN0aW9uLWJ0biBidG4tbW9kZVwiIGlkPVwicGlsbE1vZGVCdG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgdGl0bGU9XCJTd2l0Y2ggdG8gMS1QYWdlIFZpZXdcIj5cbiAgICAgICAgICDimqEgMS1QYWdlXG4gICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgIDwhLS0gU3RhdHVzICYgSW1hZ2UgRGltZW5zaW9ucyAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc3RhdHVzLXNlY3Rpb25cIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc3RhdHVzLXRleHRcIiBpZD1cInBpbGxTdGF0dXNUZXh0XCI+UmVhZHk8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJwaWxsLWRpbWVuc2lvbnMtdGV4dFwiIGlkPVwicGlsbERpbWVuc2lvbnNUZXh0XCI+KGltYWdlOiAtIHggLSk8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtcHJvZ3Jlc3MtdHJhY2tcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXByb2dyZXNzLWZpbGxcIiBpZD1cInBpbGxQcm9ncmVzc0ZpbGxcIj48L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBSaWdodCBTaWRlIENvdW50ZXI6IDAvNTE1IHBhZ2VzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1jb3VudGVyLWJveFwiIGlkPVwicGlsbENvdW50ZXJcIj5cbiAgICAgICAgICAwLzAgcGFnZXNcbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPCEtLSBbeF0gU2hyaW5rIHRvIExlZnQgU2lkZSBCdXR0b24gLS0+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwaWxsLWNsb3NlLWJ0blwiIGlkPVwicGlsbENsb3NlQnRuXCIgdGl0bGU9XCJTaHJpbmsgdG8gbGVmdCBlZGdlIG9mIHNjcmVlblwiPuKclTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDwhLS0gRXhwYW5kYWJsZSBTZXR0aW5ncyBUcmF5IC0tPlxuICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtcGFuZWxcIiBpZD1cInBpbGxTZXR0aW5nc1BhbmVsXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1oZWFkZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtdGl0bGVcIj7impkgRG93bmxvYWRlciBTZXR0aW5nczwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInBpbGwtc2V0dGluZ3Mtc2F2ZWQtaGludFwiIGlkPVwicGlsbFNldHRpbmdzU2F2ZWRIaW50XCI+U2F2ZWQgdG8gbG9jYWxTdG9yYWdlPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZ3MtZ3JpZFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwaWxsLXNldHRpbmctcm93XCI+XG4gICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdTYXZlUGF0aFwiPlNhdmUgU3ViZGlyZWN0b3J5OjwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInBpbGxTZXR0aW5nU2F2ZVBhdGhcIiBjbGFzcz1cInBpbGwtc2V0dGluZy1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiQXJjaGl2ZUJvb2tzXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvd1wiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInBpbGxTZXR0aW5nUGF0dGVyblwiPkZvbGRlciBQYXR0ZXJuOjwvbGFiZWw+XG4gICAgICAgICAgICA8c2VsZWN0IGlkPVwicGlsbFNldHRpbmdQYXR0ZXJuXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInt0aXRsZX1fe2lkfVwiPnt0aXRsZX1fe2lkfTwvb3B0aW9uPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwie3RpdGxlfVwiPnt0aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIntpZH1cIj57aWR9PC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5nLXJvdyBwaWxsLXNldHRpbmctcm93LWhhbGZcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ1N0YXJ0UGFnZVwiPlN0YXJ0IFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nU3RhcnRQYWdlXCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgdmFsdWU9XCIwXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwicGlsbFNldHRpbmdFbmRQYWdlXCI+RW5kIFBhZ2U6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nRW5kUGFnZVwiIGNsYXNzPVwicGlsbC1zZXR0aW5nLWlucHV0XCIgbWluPVwiMFwiIHBsYWNlaG9sZGVyPVwiQWxsXCIgc3R5bGU9XCJ3aWR0aDogNzBweDtcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBpbGwtc2V0dGluZy1yb3dcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwaWxsU2V0dGluZ01heEhlaWdodFwiPk1heCBQYWdlIEhlaWdodDo8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBpZD1cInBpbGxTZXR0aW5nTWF4SGVpZ2h0XCIgY2xhc3M9XCJwaWxsLXNldHRpbmctaW5wdXRcIiBtaW49XCIwXCIgc3RlcD1cIjUwXCIgcGxhY2Vob2xkZXI9XCJlLmcuIDEwMDAgKDAgPSBmdWxsKVwiIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGlsbC1zZXR0aW5ncy1mb290ZXJcIj5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGlsbC1zZXR0aW5nLWJ0biBidG4tc2F2ZVwiIGlkPVwicGlsbFNldHRpbmdTYXZlQnRuXCI+8J+SviBTYXZlIFNldHRpbmdzPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBpbGwtc2V0dGluZy1idG4gYnRuLWNsb3NlXCIgaWQ9XCJwaWxsU2V0dGluZ0Nsb3NlQnRuXCI+Q2xvc2U8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwaWxsKTtcbiAgICB0aGlzLmNvbnRhaW5lciA9IHBpbGw7XG5cbiAgICAvLyBBdHRhY2ggY2FsbGJhY2tzXG4gICAgY29uc3Qgc3RhcnRCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RhcnRCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzdGFydEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0YXJ0Py4oKSk7XG5cbiAgICBjb25zdCBjb250aW51ZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnRpbnVlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uUmVzdW1lPy4oKSk7XG5cbiAgICBjb25zdCB2aWV3RmlsZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHZpZXdGaWxlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2FsbGJhY2tzLm9uVmlld0ZpbGU/LigpKTtcblxuICAgIGNvbnN0IHBhdXNlQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFBhdXNlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcGF1c2VCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25QYXVzZT8uKCkpO1xuXG4gICAgY29uc3QgcmVzdW1lQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbFJlc3VtZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHJlc3VtZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblJlc3VtZT8uKCkpO1xuXG4gICAgY29uc3Qgc3RvcEJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTdG9wQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgc3RvcEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vblN0b3A/LigpKTtcblxuICAgIGNvbnN0IG1vZGVCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsTW9kZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIG1vZGVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25Td2l0Y2hNb2RlPy4oKSk7XG5cbiAgICAvLyBDb2cgYnV0dG9uIHRvIHRvZ2dsZSBzZXR0aW5ncyB0cmF5XG4gICAgY29uc3QgY29nQnRuID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvZ0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKCkpO1xuXG4gICAgLy8gU2F2ZSBTZXR0aW5ncyBidXR0b25cbiAgICBjb25zdCBzYXZlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1NhdmVCdG4nKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICBzYXZlU2V0dGluZ3NCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2F2ZVBhdGhJbnB1dCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU2F2ZVBhdGgnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nUGF0dGVybicpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgY29uc3Qgc3RhcnRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ1N0YXJ0UGFnZScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0VuZFBhZ2UnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgbWF4SGVpZ2h0SW5wdXQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICAgIGNvbnN0IGJhc2VEaXIgPSBzYXZlUGF0aElucHV0Py52YWx1ZS50cmltKCkgfHwgJ0FyY2hpdmVCb29rcyc7XG4gICAgICBjb25zdCBmb2xkZXJQYXR0ZXJuID0gcGF0dGVyblNlbGVjdD8udmFsdWUgfHwgJ3t0aXRsZX1fe2lkfSc7XG4gICAgICBjb25zdCBzdGFydFBhZ2UgPSBzdGFydFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoc3RhcnRQYWdlSW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuICAgICAgY29uc3QgZW5kUGFnZSA9IGVuZFBhZ2VJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQoZW5kUGFnZUlucHV0LnZhbHVlLCAxMCkpIDogMDtcbiAgICAgIGNvbnN0IG1heFBhZ2VIZWlnaHQgPSBtYXhIZWlnaHRJbnB1dD8udmFsdWUgIT09ICcnID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobWF4SGVpZ2h0SW5wdXQudmFsdWUsIDEwKSkgOiAwO1xuXG4gICAgICB0aGlzLmNhbGxiYWNrcy5vblNhdmVTZXR0aW5ncz8uKHtcbiAgICAgICAgYmFzZURpcixcbiAgICAgICAgZm9sZGVyUGF0dGVybixcbiAgICAgICAgc3RhcnRQYWdlLFxuICAgICAgICBlbmRQYWdlLFxuICAgICAgICBtYXhQYWdlSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGhpbnQgPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ3NTYXZlZEhpbnQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmIChoaW50KSB7XG4gICAgICAgIGhpbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGhpbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpLCAyNTAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3NlU2V0dGluZ3NCdG4gPSBwaWxsLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ0Nsb3NlQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY2xvc2VTZXR0aW5nc0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKSk7XG5cbiAgICAvLyBbeF0gY2xvc2UvZG9jayBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ0biA9IHBpbGwucXVlcnlTZWxlY3RvcignI3BpbGxDbG9zZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNsb3NlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuZG9ja1RvTGVmdCgpKTtcblxuICAgIC8vIERvY2tlZCBpY29uIGNsaWNrIHRvIGV4cGFuZFxuICAgIGNvbnN0IGRvY2tJY29uID0gcGlsbC5xdWVyeVNlbGVjdG9yKCcjcGlsbERvY2tJY29uJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgZG9ja0ljb24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy51bmRvY2tGcm9tTGVmdCgpKTtcblxuICAgIC8vIFBvcHVsYXRlIGluaXRpYWwgaW5wdXRzIGlmIGNvbmZpZyBleGlzdHNcbiAgICB0aGlzLnNldENvbmZpZyh0aGlzLmN1cnJlbnRDb25maWcpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZVNldHRpbmdzKG9wZW4/OiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lcikgcmV0dXJuO1xuICAgIHRoaXMuaXNTZXR0aW5nc09wZW4gPSB0eXBlb2Ygb3BlbiA9PT0gJ2Jvb2xlYW4nID8gb3BlbiA6ICF0aGlzLmlzU2V0dGluZ3NPcGVuO1xuXG4gICAgY29uc3QgcGFuZWwgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdzUGFuZWwnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb2dCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvZ0J0bicpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgaWYgKHBhbmVsKSB7XG4gICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gdGhpcy5pc1NldHRpbmdzT3BlbiA/ICdmbGV4JyA6ICdub25lJztcbiAgICB9XG4gICAgaWYgKGNvZ0J0bikge1xuICAgICAgaWYgKHRoaXMuaXNTZXR0aW5nc09wZW4pIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29nQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRDb25maWcoY2ZnOiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KTogdm9pZCB7XG4gICAgdGhpcy5jdXJyZW50Q29uZmlnID0geyAuLi50aGlzLmN1cnJlbnRDb25maWcsIC4uLmNmZyB9O1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHNhdmVQYXRoSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdTYXZlUGF0aCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKHNhdmVQYXRoSW5wdXQgJiYgY2ZnLmJhc2VEaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2F2ZVBhdGhJbnB1dC52YWx1ZSA9IGNmZy5iYXNlRGlyO1xuICAgIH1cblxuICAgIGNvbnN0IHBhdHRlcm5TZWxlY3QgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdQYXR0ZXJuJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgaWYgKHBhdHRlcm5TZWxlY3QgJiYgY2ZnLmZvbGRlclBhdHRlcm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IGNmZy5mb2xkZXJQYXR0ZXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0UGFnZUlucHV0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTZXR0aW5nU3RhcnRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoc3RhcnRQYWdlSW5wdXQgJiYgY2ZnLnN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdGFydFBhZ2VJbnB1dC52YWx1ZSA9IFN0cmluZyhjZmcuc3RhcnRQYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmRQYWdlSW5wdXQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbFNldHRpbmdFbmRQYWdlJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBpZiAoZW5kUGFnZUlucHV0ICYmIGNmZy5lbmRQYWdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZFBhZ2VJbnB1dC52YWx1ZSA9IGNmZy5lbmRQYWdlID4gMCA/IFN0cmluZyhjZmcuZW5kUGFnZSkgOiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBtYXhIZWlnaHRJbnB1dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU2V0dGluZ01heEhlaWdodCcpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgaWYgKG1heEhlaWdodElucHV0ICYmIGNmZy5tYXhQYWdlSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1heEhlaWdodElucHV0LnZhbHVlID0gY2ZnLm1heFBhZ2VIZWlnaHQgPiAwID8gU3RyaW5nKGNmZy5tYXhQYWdlSGVpZ2h0KSA6ICcnO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzaG93U3RvcFByb21wdChcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG9uU2F2ZTogKCkgPT4gdm9pZCxcbiAgICBvbkRpc2NhcmQ6ICgpID0+IHZvaWQsXG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgY3VzdG9tTWVzc2FnZT86IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gdHJ1ZTtcblxuICAgIGNvbnN0IGNvbmZpcm1CYXIgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBjb25maXJtVGV4dCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ29uZmlybVRleHQnKSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBzYXZlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtU2F2ZUJ0bicpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgIGNvbnN0IGRpc2NhcmRCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1EaXNjYXJkQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb25maXJtQ2FuY2VsQnRuJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5cbiAgICAvLyBIaWRlIG5vcm1hbCBidXR0b25zIGFuZCBzdGF0dXMgd2hpbGUgY29uZmlybWluZ1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUoZmFsc2UpO1xuXG4gICAgaWYgKGNvbmZpcm1UZXh0KSB7XG4gICAgICBjb25maXJtVGV4dC50ZXh0Q29udGVudCA9IGN1c3RvbU1lc3NhZ2UgfHwgYFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2A7XG4gICAgfVxuICAgIGlmIChjb25maXJtQmFyKSB7XG4gICAgICBjb25maXJtQmFyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgIHRoaXMuaXNDb25maXJtaW5nU3RvcCA9IGZhbHNlO1xuICAgICAgaWYgKGNvbmZpcm1CYXIpIGNvbmZpcm1CYXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNsZWFudXAoKTtcbiAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICBkaXNjYXJkQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkRpc2NhcmQoKTtcbiAgICB9O1xuXG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBvbkNhbmNlbCgpO1xuICAgIH07XG4gIH1cblxuICBwdWJsaWMgaGlkZVN0b3BQcm9tcHQoKTogdm9pZCB7XG4gICAgdGhpcy5pc0NvbmZpcm1pbmdTdG9wID0gZmFsc2U7XG4gICAgY29uc3QgY29uZmlybUJhciA9IHRoaXMuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcjcGlsbENvbmZpcm1CYXInKSBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAoY29uZmlybUJhcikgY29uZmlybUJhci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHRoaXMuc2V0U3RhbmRhcmRDb250cm9sc1Zpc2libGUodHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIHNldFN0YW5kYXJkQ29udHJvbHNWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICAgICcjcGlsbFN0YXJ0QnRuLCAjcGlsbENvbnRpbnVlQnRuLCAjcGlsbFZpZXdGaWxlQnRuLCAjcGlsbFBhdXNlQnRuLCAjcGlsbFJlc3VtZUJ0biwgI3BpbGxTdG9wQnRuLCAjcGlsbE1vZGVCdG4sIC5waWxsLXN0YXR1cy1zZWN0aW9uLCAjcGlsbENvdW50ZXInXG4gICAgKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IHZpc2libGUgPyAnJyA6ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkb2NrVG9MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gdHJ1ZTtcbiAgICB0aGlzLnRvZ2dsZVNldHRpbmdzKGZhbHNlKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdkb2NrZWQtbGVmdCcpO1xuICB9XG5cbiAgcHVibGljIHVuZG9ja0Zyb21MZWZ0KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jb250YWluZXIpIHJldHVybjtcbiAgICB0aGlzLmlzRG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnZG9ja2VkLWxlZnQnKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVQcm9ncmVzcyhcbiAgICBjdXJyZW50UGFnZTogbnVtYmVyLFxuICAgIHRvdGFsUGFnZXM6IG51bWJlcixcbiAgICBzdGF0dXNUZXh0OiBzdHJpbmcsXG4gICAgc3RhdHVzVHlwZTogc3RyaW5nID0gJ25vcm1hbCcsXG4gICAgaXNQYXVzZWQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIgPSAxLFxuICAgIGltYWdlRGltZW5zaW9ucz86IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29udGFpbmVyKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaXNDb25maXJtaW5nU3RvcCkgcmV0dXJuOyAvLyBEbyBub3Qgb3ZlcndyaXRlIGNvbmZpcm1hdGlvbiBwcm9tcHRcblxuICAgIGNvbnN0IHN0YXJ0QnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGFydEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGNvbnRpbnVlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxDb250aW51ZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHZpZXdGaWxlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxWaWV3RmlsZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBhdXNlQnRuID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxQYXVzZUJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHJlc3VtZUJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUmVzdW1lQnRuJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RvcEJ0biA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsU3RvcEJ0bicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IG1vZGVCdG4gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcGlsbE1vZGVCdG4nKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIGNvbnN0IGNvdW50ZXJFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsQ291bnRlcicpIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGZpbGxFbCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwaWxsUHJvZ3Jlc3NGaWxsJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3Qgc3RhdHVzVGV4dEVsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxTdGF0dXNUZXh0JykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgZGltZW5zaW9uc0VsID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignI3BpbGxEaW1lbnNpb25zVGV4dCcpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgLy8gMS1wYWdlIHN3aXRjaCBidXR0b25cbiAgICBpZiAobW9kZUJ0bikge1xuICAgICAgbW9kZUJ0bi5zdHlsZS5kaXNwbGF5ID0gY3VycmVudE1vZGUgIT09IDEgJiYgIWlzQWN0aXZlID8gJ2ZsZXgnIDogJ25vbmUnO1xuICAgIH1cblxuICAgIC8vIFJpZ2h0IFNpZGUgQ291bnRlclxuICAgIGlmIChjb3VudGVyRWwpIHtcbiAgICAgIGlmICh0b3RhbFBhZ2VzID4gMCkge1xuICAgICAgICBpZiAoaXNBY3RpdmUpIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgUGFnZSAke2N1cnJlbnRQYWdlfS8ke3RvdGFsUGFnZXN9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudGVyRWwudGV4dENvbnRlbnQgPSBgMC8ke3RvdGFsUGFnZXN9IHBhZ2VzYDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY291bnRlckVsLnRleHRDb250ZW50ID0gJ0RldGVjdGluZyBwYWdlcy4uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvZ3Jlc3MgYmFyIGZpbGxcbiAgICBpZiAoZmlsbEVsICYmIHRvdGFsUGFnZXMgPiAwKSB7XG4gICAgICBjb25zdCBwY3QgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQoKChjdXJyZW50UGFnZSArIDEpIC8gdG90YWxQYWdlcykgKiAxMDApKTtcbiAgICAgIGZpbGxFbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgICB9XG5cbiAgICAvLyBTdGF0dXMgdGV4dCAmIGNsYXNzXG4gICAgaWYgKHN0YXR1c1RleHRFbCkge1xuICAgICAgc3RhdHVzVGV4dEVsLnRleHRDb250ZW50ID0gc3RhdHVzVGV4dDtcbiAgICAgIHN0YXR1c1RleHRFbC5jbGFzc05hbWUgPSBgcGlsbC1zdGF0dXMtdGV4dCAke3N0YXR1c1R5cGV9YDtcbiAgICB9XG5cbiAgICAvLyBJbWFnZSBEaW1lbnNpb25zOiAoaW1hZ2U6IDI1ODAgeCAzOTE1KVxuICAgIGlmIChkaW1lbnNpb25zRWwpIHtcbiAgICAgIGlmIChpbWFnZURpbWVuc2lvbnMgJiYgaW1hZ2VEaW1lbnNpb25zLndpZHRoID4gMCAmJiBpbWFnZURpbWVuc2lvbnMuaGVpZ2h0ID4gMCkge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAke2ltYWdlRGltZW5zaW9ucy53aWR0aH0geCAke2ltYWdlRGltZW5zaW9ucy5oZWlnaHR9KWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaW1lbnNpb25zRWwudGV4dENvbnRlbnQgPSBgKGltYWdlOiAtIHggLSlgO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJ1dHRvbnMgVmlzaWJpbGl0eVxuICAgIHN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgY29udGludWVCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB2aWV3RmlsZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgcmVzdW1lQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgaWYgKHN0YXR1c1R5cGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIC8vIENvbXBsZXRlZDogc2hvdyBcIkRvd25sb2FkZWQ6IFZpZXcgRmlsZXNcIlxuICAgICAgdmlld0ZpbGVCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9IGVsc2UgaWYgKHN0YXR1c1R5cGUgPT09ICdzdGFsbGVkJyB8fCBzdGF0dXNUeXBlID09PSAnb2ZmbGluZScgfHwgKGlzUGF1c2VkICYmIHN0YXR1c1R5cGUgPT09ICdyZXRyeWluZycpKSB7XG4gICAgICAvLyBTdGFsbGVkIC8gb2ZmbGluZSAvIG1heCByZXRyaWVzIGhpdDogc2hvdyBDT05USU5VRSArIFN0b3BcbiAgICAgIGNvbnRpbnVlQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgICBzdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgfSBlbHNlIGlmIChpc0FjdGl2ZSkge1xuICAgICAgLy8gQ3VycmVudGx5IGFjdGl2ZVxuICAgICAgc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgaWYgKGlzUGF1c2VkKSB7XG4gICAgICAgIHJlc3VtZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWRsZVxuICAgICAgc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgdGhpcy5jb250YWluZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuIiwKICAgICIvKipcbiAqIFV0aWxpdGllcyBmb3IgZXh0cmFjdGluZyBPQ1IgdGV4dCBmcm9tIERKVlUgWE1MIGFuZCBjb21waWxpbmcgTWFya2Rvd24gZG9jdW1lbnRzXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlVGV4dEVudHJ5IHtcbiAgcGFnZU51bTogbnVtYmVyO1xuICBsZWFmSW5kZXg6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvb2tNZXRhZGF0YSB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvb2tJZDogc3RyaW5nO1xuICBhdXRob3I/OiBzdHJpbmc7XG4gIHB1Ymxpc2hlcj86IHN0cmluZztcbiAgeWVhcj86IHN0cmluZztcbiAgc291cmNlVXJsPzogc3RyaW5nO1xuICB0b3RhbFBhZ2VzPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFN0cmlwcyBESlZVIFhNTCBpbnRvIGNsZWFuLCBzdHJ1Y3R1cmVkIHBsYWluIHRleHQgZm9yIGEgc2luZ2xlIHBhZ2UuXG4gKiBSb2J1c3RseSBwYXJzZXMgUEFSQUdSQVBILCBMSU5FLCBhbmQgV09SRCBlbGVtZW50cy5cbiAqIFdvcmtzIHNlYW1sZXNzbHkgaW4gYm90aCBicm93c2VyIGFuZCBOb2RlL0J1biB0ZXN0IGVudmlyb25tZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRGp2dVhtbFRvVGV4dCh4bWxTdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgheG1sU3RyaW5nIHx8IHR5cGVvZiB4bWxTdHJpbmcgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgLy8gRXh0cmFjdCBhbGwgUEFSQUdSQVBIIGJsb2Nrc1xuICBjb25zdCBwYXJhZ3JhcGhNYXRjaGVzID0geG1sU3RyaW5nLm1hdGNoKC88UEFSQUdSQVBIW1xcc1xcU10qPzxcXC9QQVJBR1JBUEg+L2dpKTtcbiAgaWYgKCFwYXJhZ3JhcGhNYXRjaGVzIHx8IHBhcmFncmFwaE1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gSWYgbm8gUEFSQUdSQVBIIHRhZ3MsIHRyeSBleHRyYWN0aW5nIHdvcmRzIGRpcmVjdGx5XG4gICAgY29uc3Qgd29yZHMgPSBBcnJheS5mcm9tKHhtbFN0cmluZy5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKVxuICAgICAgLm1hcChtID0+IGRlY29kZVhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgcmV0dXJuIHdvcmRzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIGNvbnN0IHBhcmFncmFwaHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBwYXJCbG9jayBvZiBwYXJhZ3JhcGhNYXRjaGVzKSB7XG4gICAgLy8gRXh0cmFjdCBhbGwgTElORSBibG9ja3MgaW5zaWRlIHRoaXMgUEFSQUdSQVBIXG4gICAgY29uc3QgbGluZU1hdGNoZXMgPSBwYXJCbG9jay5tYXRjaCgvPExJTkVbXFxzXFxTXSo/PFxcL0xJTkU+L2dpKTtcbiAgICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChsaW5lTWF0Y2hlcyAmJiBsaW5lTWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGxpbmVCbG9jayBvZiBsaW5lTWF0Y2hlcykge1xuICAgICAgICAvLyBFeHRyYWN0IGFsbCBXT1JEIGNvbnRlbnRzIGluc2lkZSB0aGlzIExJTkVcbiAgICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKGxpbmVCbG9jay5tYXRjaEFsbCgvPFdPUkRbXj5dKj4oW1xcc1xcU10qPyk8XFwvV09SRD4vZ2kpKTtcbiAgICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAgIC5tYXAobSA9PiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobVsxXS50cmltKCkpKVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsaW5lcy5wdXNoKHdvcmRzLmpvaW4oJyAnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRmFsbGJhY2s6IHdvcmRzIGRpcmVjdGx5IGluIHBhcmFncmFwaFxuICAgICAgY29uc3Qgd29yZE1hdGNoZXMgPSBBcnJheS5mcm9tKHBhckJsb2NrLm1hdGNoQWxsKC88V09SRFtePl0qPihbXFxzXFxTXSo/KTxcXC9XT1JEPi9naSkpO1xuICAgICAgY29uc3Qgd29yZHMgPSB3b3JkTWF0Y2hlc1xuICAgICAgICAubWFwKG0gPT4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKG1bMV0udHJpbSgpKSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgaWYgKHdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCh3b3Jkcy5qb2luKCcgJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYXJhZ3JhcGhzLnB1c2goZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKGxpbmVzLmpvaW4oJ1xcbicpKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gZGVjb2RlIGFsbCBIVE1MIGFuZCBYTUwgZW50aXRpZXMgaW50byBwcm9wZXIgVVRGLTggY2hhcmFjdGVycy5cbiAqIEhhbmRsZXMgbnVtZXJpYyBkZWNpbWFsIChlLmcuICYjODIxMjsgLT4g4oCUKSwgaGV4ICgmI3gyMDE0OyksIGFuZCBuYW1lZCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXRleHQgfHwgdHlwZW9mIHRleHQgIT09ICdzdHJpbmcnKSByZXR1cm4gJyc7XG5cbiAgcmV0dXJuIHRleHRcbiAgICAvLyAxLiBEZWNpbWFsIG51bWVyaWMgZW50aXRpZXM6ICYjODIxMjsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiMoXFxkKyk7L2csIChfLCBkZWMpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChkZWMsIDEwKTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMi4gSGV4YWRlY2ltYWwgbnVtZXJpYyBlbnRpdGllczogJiN4MjAxNDsgLT4gJ+KAlCdcbiAgICAucmVwbGFjZSgvJiN4KFswLTlhLWZBLUZdKyk7L2csIChfLCBoZXgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBwYXJzZUludChoZXgsIDE2KTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBfO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8gMy4gTmFtZWQgZW50aXRpZXNcbiAgICAucmVwbGFjZSgvJm1kYXNoOy9nLCAn4oCUJylcbiAgICAucmVwbGFjZSgvJm5kYXNoOy9nLCAn4oCTJylcbiAgICAucmVwbGFjZSgvJmhlbGxpcDsvZywgJ+KApicpXG4gICAgLnJlcGxhY2UoLyZsc3F1bzsvZywgJ+KAmCcpXG4gICAgLnJlcGxhY2UoLyZyc3F1bzsvZywgJ+KAmScpXG4gICAgLnJlcGxhY2UoLyZsZHF1bzsvZywgJ+KAnCcpXG4gICAgLnJlcGxhY2UoLyZyZHF1bzsvZywgJ+KAnScpXG4gICAgLnJlcGxhY2UoLyZuYnNwOy9nLCAnICcpXG4gICAgLnJlcGxhY2UoLyZidWxsOy9nLCAn4oCiJylcbiAgICAucmVwbGFjZSgvJmNlbnQ7L2csICfCoicpXG4gICAgLnJlcGxhY2UoLyZwb3VuZDsvZywgJ8KjJylcbiAgICAucmVwbGFjZSgvJnllbjsvZywgJ8KlJylcbiAgICAucmVwbGFjZSgvJmV1cm87L2csICfigqwnKVxuICAgIC5yZXBsYWNlKC8mY29weTsvZywgJ8KpJylcbiAgICAucmVwbGFjZSgvJnJlZzsvZywgJ8KuJylcbiAgICAucmVwbGFjZSgvJmRlZzsvZywgJ8KwJylcbiAgICAucmVwbGFjZSgvJnBsdXNtbjsvZywgJ8KxJylcbiAgICAucmVwbGFjZSgvJnRpbWVzOy9nLCAnw5cnKVxuICAgIC5yZXBsYWNlKC8mZGl2aWRlOy9nLCAnw7cnKVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAucmVwbGFjZSgvJmFwb3M7L2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7IC8vIGRlY29kZSAmYW1wOyBsYXN0XG59XG5cbi8qKlxuICogU3RyaXBzIEhhdGhpVHJ1c3QgPGZpZ2NhcHRpb24+IG1hcmt1cCBpbnRvIGNsZWFuLCBmb3JtYXR0ZWQgTWFya2Rvd24vdGV4dC5cbiAqIEhhbmRsZXMgYm90aCBET00gRWxlbWVudCBpbnB1dHMgKGluIGJyb3dzZXIpIGFuZCByYXcgSFRNTCBzdHJpbmdzIChpbiB0ZXN0cykuXG4gKiBFeHRyYWN0cyB3b3JkIHNwYW5zLCBwcmVzZXJ2ZXMgcGFyYWdyYXBoIGJyZWFrcywgYW5kIGRlY29kZXMgSFRNTCBlbnRpdGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGlucHV0OiBzdHJpbmcgfCBhbnkpOiBzdHJpbmcge1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG5cbiAgLy8gSWYgRE9NIEVsZW1lbnQgaW4gYnJvd3NlciBlbnZpcm9ubWVudFxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0JyAmJiBpbnB1dC5ub2RlVHlwZSkge1xuICAgIGNvbnN0IGVsID0gaW5wdXQgYXMgRWxlbWVudDtcbiAgICBjb25zdCBwRWxlbWVudHMgPSBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ3AsIC5vY3JfcGFyJykpO1xuXG4gICAgaWYgKHBFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwYXJhZ3JhcGhzID0gcEVsZW1lbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKHAucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCwgLm9jcl9saW5lJykpO1xuICAgICAgICBpZiAoc3BhbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBzcGFuc1xuICAgICAgICAgICAgLm1hcChzID0+IChzLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkpXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyA8cD4gdGFncywgY2hlY2sgZm9yIGxpbmUgZWxlbWVudHNcbiAgICBjb25zdCBsaW5lcyA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnLm9jcl9saW5lLCBkaXYnKSk7XG4gICAgaWYgKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxpbmVUZXh0cyA9IGxpbmVzLm1hcChsaW5lID0+IHtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBBcnJheS5mcm9tKGxpbmUucXVlcnlTZWxlY3RvckFsbCgnc3BhbiwgLm9jcnhfd29yZCcpKTtcbiAgICAgICAgaWYgKHNwYW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGxpbmUudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXMobGluZVRleHRzLmpvaW4oJ1xcbicpKTtcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjazogZXh0cmFjdCBhbGwgc3BhbnMgb3IgdGV4dCBkaXJlY3RseVxuICAgIGNvbnN0IHNwYW5zID0gQXJyYXkuZnJvbShlbC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xuICAgIGlmIChzcGFucy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gc3BhbnMubWFwKHMgPT4gKHMudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgIHJldHVybiBkZWNvZGVIdG1sQW5kWG1sRW50aXRpZXModGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcygoZWwudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9bIFxcdF0rL2csICcgJykpO1xuICB9XG5cbiAgLy8gSWYgaW5wdXQgaXMgYW4gSFRNTCBzdHJpbmdcbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICBsZXQgY2xlYW4gPSBpbnB1dDtcblxuICAgIC8vIENoZWNrIGZvciA8cD4gb3IgPGRpdiBjbGFzcz1cIm9jcl9wYXJcIj4gcGFyYWdyYXBoc1xuICAgIGNvbnN0IHBNYXRjaGVzID0gY2xlYW4ubWF0Y2goLzwoPzpwfGRpdiBjbGFzcz1cIm9jcl9wYXJcIilbXj5dKj4oW1xcc1xcU10qPyk8XFwvKD86cHxkaXYpPi9naSk7XG4gICAgaWYgKHBNYXRjaGVzICYmIHBNYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHBhcmFncmFwaHMgPSBwTWF0Y2hlcy5tYXAocEJsb2NrID0+IHtcbiAgICAgICAgcmV0dXJuIHBCbG9ja1xuICAgICAgICAgIC5yZXBsYWNlKC88YnJcXHMqXFwvPz4vZ2ksICdcXG4nKVxuICAgICAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgICAgICAucmVwbGFjZSgvWyBcXHRcXHJcXG5dKy9nLCAnICcpXG4gICAgICAgICAgLnRyaW0oKTtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIGRlY29kZUh0bWxBbmRYbWxFbnRpdGllcyhwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpKTtcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2Ugc3RyaXAgdGFncywgcHJlc2VydmluZyA8YnI+IGFzIGxpbmUgYnJlYWtzXG4gICAgY29uc3QgdGV4dCA9IGNsZWFuXG4gICAgICAucmVwbGFjZSgvPGJyXFxzKlxcLz8+L2dpLCAnXFxuJylcbiAgICAgIC5yZXBsYWNlKC88W14+XSs+L2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF0rL2csICcgJylcbiAgICAgIC5yZXBsYWNlKC9cXG5cXHMqXFxuKy9nLCAnXFxuXFxuJylcbiAgICAgIC50cmltKCk7XG5cbiAgICByZXR1cm4gZGVjb2RlSHRtbEFuZFhtbEVudGl0aWVzKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIEFzc2VtYmxlcyBtdWx0aXBsZSBwYWdlIHRleHRzIGFuZCBib29rIG1ldGFkYXRhIGludG8gYSBjbGVhbiwgY29tcGxldGUgTWFya2Rvd24gZG9jdW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEJvb2tNYXJrZG93bihcbiAgbWV0YWRhdGE6IEJvb2tNZXRhZGF0YSxcbiAgcGFnZXM6IFBhZ2VUZXh0RW50cnlbXVxuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gVGl0bGUgYW5kIEhlYWRlclxuICBwYXJ0cy5wdXNoKGAjICR7bWV0YWRhdGEudGl0bGUgfHwgJ1VudGl0bGVkIEJvb2snfVxcbmApO1xuXG4gIGNvbnN0IG1ldGFMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKG1ldGFkYXRhLmF1dGhvcikgbWV0YUxpbmVzLnB1c2goYC0gKipBdXRob3I6KiogJHttZXRhZGF0YS5hdXRob3J9YCk7XG4gIGlmIChtZXRhZGF0YS5wdWJsaXNoZXIpIG1ldGFMaW5lcy5wdXNoKGAtICoqUHVibGlzaGVyOioqICR7bWV0YWRhdGEucHVibGlzaGVyfWApO1xuICBpZiAobWV0YWRhdGEueWVhcikgbWV0YUxpbmVzLnB1c2goYC0gKipEYXRlOioqICR7bWV0YWRhdGEueWVhcn1gKTtcblxuICBpZiAobWV0YWRhdGEuYm9va0lkKSB7XG4gICAgaWYgKG1ldGFkYXRhLnNvdXJjZVVybCAmJiBtZXRhZGF0YS5zb3VyY2VVcmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykpIHtcbiAgICAgIG1ldGFMaW5lcy5wdXNoKGAtICoqSGF0aGlUcnVzdCBJZGVudGlmaWVyOioqIFske21ldGFkYXRhLmJvb2tJZH1dKCR7bWV0YWRhdGEuc291cmNlVXJsfSlgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YUxpbmVzLnB1c2goYC0gKipJbnRlcm5ldCBBcmNoaXZlIElkZW50aWZpZXI6KiogWyR7bWV0YWRhdGEuYm9va0lkfV0oaHR0cHM6Ly9hcmNoaXZlLm9yZy9kZXRhaWxzLyR7bWV0YWRhdGEuYm9va0lkfSlgKTtcbiAgICB9XG4gIH1cblxuICBpZiAobWV0YWRhdGEuc291cmNlVXJsICYmICFtZXRhTGluZXMuc29tZShsID0+IGwuaW5jbHVkZXMobWV0YWRhdGEuc291cmNlVXJsISkpKSB7XG4gICAgbWV0YUxpbmVzLnB1c2goYC0gKipTb3VyY2U6KiogJHttZXRhZGF0YS5zb3VyY2VVcmx9YCk7XG4gIH1cbiAgaWYgKG1ldGFkYXRhLnRvdGFsUGFnZXMpIG1ldGFMaW5lcy5wdXNoKGAtICoqVG90YWwgUGFnZXM6KiogJHttZXRhZGF0YS50b3RhbFBhZ2VzfWApO1xuXG4gIGlmIChtZXRhTGluZXMubGVuZ3RoID4gMCkge1xuICAgIHBhcnRzLnB1c2gobWV0YUxpbmVzLmpvaW4oJ1xcbicpKTtcbiAgICBwYXJ0cy5wdXNoKCdcXG4tLS1cXG4nKTtcbiAgfVxuXG4gIC8vIFNvcnQgcGFnZXMgYnkgcGFnZU51bVxuICBjb25zdCBzb3J0ZWQgPSBbLi4ucGFnZXNdLnNvcnQoKGEsIGIpID0+IGEucGFnZU51bSAtIGIucGFnZU51bSk7XG5cbiAgZm9yIChjb25zdCBwYWdlIG9mIHNvcnRlZCkge1xuICAgIHBhcnRzLnB1c2goYCMjIFBhZ2UgJHtwYWdlLnBhZ2VOdW19XFxuXFxuYCk7XG4gICAgaWYgKHBhZ2UudGV4dCAmJiBwYWdlLnRleHQudHJpbSgpKSB7XG4gICAgICBwYXJ0cy5wdXNoKGAke3BhZ2UudGV4dC50cmltKCl9XFxuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcnRzLnB1c2goYCpbTm8gdGV4dCBvciBpbGx1c3RyYXRpb24gcGFnZV0qXFxuYCk7XG4gICAgfVxuICAgIHBhcnRzLnB1c2goJ1xcbi0tLVxcbicpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJ1xcbicpO1xufVxuXG4iLAogICAgIi8qKlxuICogRmFzdCwgcHVyZSBKYXZhU2NyaXB0IFBERiBjb21waWxlciBmb3IgZW1iZWRkaW5nIEpQRUcgcGFnZSBpbWFnZXMgaW50byBQREYgZG9jdW1lbnRzLlxuICogQ29uZm9ybXMgdG8gUERGIDEuNCBzcGVjaWZpY2F0aW9uLiBaZXJvIGV4dGVybmFsIGJpbmFyeSBkZXBlbmRlbmNpZXMuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBKcGVnSW5mbyB7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBjaGFubmVsczogbnVtYmVyO1xuICBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJztcbiAgYml0czogbnVtYmVyO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHdpZHRoLCBoZWlnaHQsIGFuZCBjb2xvciBzcGFjZSBkaXJlY3RseSBmcm9tIEpQRUcgaGVhZGVyIG1hcmtlcnMgKFNPRjAvU09GMikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRKcGVnSW5mbyhkYXRhOiBVaW50OEFycmF5KTogSnBlZ0luZm8ge1xuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG5cbiAgaWYgKHZpZXcuZ2V0VWludDE2KDApICE9PSAweGZmZDgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIHZhbGlkIEpQRUcgaW1hZ2UgKG1pc3NpbmcgU09JIG1hcmtlcikuJyk7XG4gIH1cblxuICBjb25zdCBTT0ZfTUFSS0VSUyA9IFtcbiAgICAweGZmYzAsIDB4ZmZjMSwgMHhmZmMyLCAweGZmYzMsIDB4ZmZjNSwgMHhmZmM2LCAweGZmYzcsIDB4ZmZjOSwgMHhmZmNhLFxuICAgIDB4ZmZjYiwgMHhmZmNkLCAweGZmY2UsIDB4ZmZjZixcbiAgXTtcblxuICBsZXQgcG9zID0gMjtcbiAgd2hpbGUgKHBvcyA8IGRhdGEubGVuZ3RoIC0gOCkge1xuICAgIGNvbnN0IG1hcmtlciA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgcG9zICs9IDI7XG5cbiAgICBpZiAoU09GX01BUktFUlMuaW5jbHVkZXMobWFya2VyKSkge1xuICAgICAgcG9zICs9IDI7IC8vIHNraXAgbGVuZ3RoXG4gICAgICBjb25zdCBiaXRzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG4gICAgICBjb25zdCBoZWlnaHQgPSB2aWV3LmdldFVpbnQxNihwb3MpO1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb25zdCB3aWR0aCA9IHZpZXcuZ2V0VWludDE2KHBvcyk7XG4gICAgICBwb3MgKz0gMjtcbiAgICAgIGNvbnN0IGNoYW5uZWxzID0gdmlldy5nZXRVaW50OChwb3MrKyk7XG5cbiAgICAgIGxldCBjb2xvclNwYWNlOiAnRGV2aWNlR3JheScgfCAnRGV2aWNlUkdCJyB8ICdEZXZpY2VDTVlLJyA9ICdEZXZpY2VSR0InO1xuICAgICAgaWYgKGNoYW5uZWxzID09PSAxKSBjb2xvclNwYWNlID0gJ0RldmljZUdyYXknO1xuICAgICAgZWxzZSBpZiAoY2hhbm5lbHMgPT09IDQpIGNvbG9yU3BhY2UgPSAnRGV2aWNlQ01ZSyc7XG5cbiAgICAgIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIGNoYW5uZWxzLCBjb2xvclNwYWNlLCBiaXRzIH07XG4gICAgfVxuXG4gICAgY29uc3QgbGVuZ3RoID0gdmlldy5nZXRVaW50MTYocG9zKTtcbiAgICBwb3MgKz0gbGVuZ3RoO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBTT0YgbWFya2VyIGluIEpQRUcgc3RyZWFtLicpO1xufVxuXG4vKipcbiAqIEhlbHBlciB0byBjb252ZXJ0IEJhc2U2NCBEYXRhIFVSTCB0byBVaW50OEFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGF0YVVybFRvQnl0ZXMoZGF0YVVybDogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGNvbW1hSW5kZXggPSBkYXRhVXJsLmluZGV4T2YoJywnKTtcbiAgY29uc3QgYmFzZTY0ID0gY29tbWFJbmRleCA+PSAwID8gZGF0YVVybC5zbGljZShjb21tYUluZGV4ICsgMSkgOiBkYXRhVXJsO1xuICBjb25zdCBiaW5hcnlTdHJpbmcgPSBhdG9iKGJhc2U2NCk7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYmluYXJ5U3RyaW5nLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5U3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgYnl0ZXNbaV0gPSBiaW5hcnlTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gYnl0ZXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmSW1hZ2VJbnB1dCB7XG4gIHBhZ2VOdW06IG51bWJlcjtcbiAgZGF0YTogVWludDhBcnJheSB8IHN0cmluZzsgLy8gVWludDhBcnJheSBvciBEYXRhVVJMXG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBsaXN0IG9mIEpQRUcgaW1hZ2VzIGludG8gYSB2YWxpZCBQREYgZG9jdW1lbnQuXG4gKiBFbWJlZHMgcmF3IEpQRUcgc3RyZWFtcyBkaXJlY3RseSB3aXRob3V0IGRlY29tcHJlc3Npb24gb3IgcmUtZW5jb2RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSnBlZ3NUb1BkZihcbiAgaW1hZ2VzOiBQZGZJbWFnZUlucHV0W10sXG4gIG1ldGFkYXRhOiB7IHRpdGxlPzogc3RyaW5nOyBhdXRob3I/OiBzdHJpbmc7IGNyZWF0b3I/OiBzdHJpbmcgfSA9IHt9XG4pOiBVaW50OEFycmF5IHtcbiAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgUERGOiBObyBpbWFnZXMgcHJvdmlkZWQuJyk7XG4gIH1cblxuICBjb25zdCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICBjb25zdCBvZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICBsZXQgY3VycmVudE9mZnNldCA9IDA7XG5cbiAgZnVuY3Rpb24gd3JpdGUoYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICBjaHVua3MucHVzaChieXRlcyk7XG4gICAgY3VycmVudE9mZnNldCArPSBieXRlcy5sZW5ndGg7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZVN0cmluZyhzdHI6IHN0cmluZykge1xuICAgIHdyaXRlKHRleHRFbmNvZGVyLmVuY29kZShzdHIpKTtcbiAgfVxuXG4gIC8vIEhlYWRlclxuICB3cml0ZVN0cmluZygnJVBERi0xLjRcXG4lXFx4RTJcXHhFM1xceENGXFx4RDNcXG4nKTtcblxuICBsZXQgb2JqSWRDb3VudGVyID0gMTtcbiAgZnVuY3Rpb24gc3RhcnRPYmplY3QoKTogbnVtYmVyIHtcbiAgICBjb25zdCBpZCA9IG9iaklkQ291bnRlcisrO1xuICAgIG9mZnNldHNbaWRdID0gY3VycmVudE9mZnNldDtcbiAgICB3cml0ZVN0cmluZyhgJHtpZH0gMCBvYmpcXG5gKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRPYmplY3QoKSB7XG4gICAgd3JpdGVTdHJpbmcoJ2VuZG9ialxcbicpO1xuICB9XG5cbiAgY29uc3QgdG90YWxQYWdlcyA9IGltYWdlcy5sZW5ndGg7XG5cbiAgLy8gUHJlLWNhbGN1bGF0ZSBPYmplY3QgSURzOlxuICAvLyAxOiBDYXRhbG9nXG4gIC8vIDI6IFBhZ2VzXG4gIC8vIDMgKyAoaSAqIDMpOiBQYWdlIG9iamVjdFxuICAvLyA0ICsgKGkgKiAzKTogQ29udGVudCBzdHJlYW1cbiAgLy8gNSArIChpICogMyk6IEltYWdlIFhPYmplY3RcbiAgY29uc3QgY2F0YWxvZ0lkID0gMTtcbiAgY29uc3QgcGFnZXNSb290SWQgPSAyO1xuICBjb25zdCBwYWdlSWRzOiBudW1iZXJbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsUGFnZXM7IGkrKykge1xuICAgIHBhZ2VJZHMucHVzaCgzICsgaSAqIDMpO1xuICB9XG5cbiAgLy8gMS4gQ2F0YWxvZ1xuICBzdGFydE9iamVjdCgpOyAvLyAxXG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL0NhdGFsb2dcXG4gIC9QYWdlcyAke3BhZ2VzUm9vdElkfSAwIFJcXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAyLiBQYWdlcyBSb290XG4gIHN0YXJ0T2JqZWN0KCk7IC8vIDJcbiAgY29uc3Qga2lkc1N0ciA9IHBhZ2VJZHMubWFwKGlkID0+IGAke2lkfSAwIFJgKS5qb2luKCcgJyk7XG4gIHdyaXRlU3RyaW5nKGA8PFxcbiAgL1R5cGUgL1BhZ2VzXFxuICAvS2lkcyBbICR7a2lkc1N0cn0gXVxcbiAgL0NvdW50ICR7dG90YWxQYWdlc31cXG4+PlxcbmApO1xuICBlbmRPYmplY3QoKTtcblxuICAvLyAzLiBSZW5kZXIgRWFjaCBQYWdlIChQYWdlLCBDb250ZW50cywgSW1hZ2UgWE9iamVjdClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbFBhZ2VzOyBpKyspIHtcbiAgICBjb25zdCBpdGVtID0gaW1hZ2VzW2ldO1xuICAgIGNvbnN0IGltYWdlQnl0ZXMgPSB0eXBlb2YgaXRlbS5kYXRhID09PSAnc3RyaW5nJyA/IGRhdGFVcmxUb0J5dGVzKGl0ZW0uZGF0YSkgOiBpdGVtLmRhdGE7XG4gICAgY29uc3QgaW5mbyA9IGdldEpwZWdJbmZvKGltYWdlQnl0ZXMpO1xuXG4gICAgY29uc3Qgd2lkdGggPSBpdGVtLndpZHRoIHx8IGluZm8ud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gaXRlbS5oZWlnaHQgfHwgaW5mby5oZWlnaHQ7XG5cbiAgICBjb25zdCBwYWdlT2JqSWQgPSAzICsgaSAqIDM7XG4gICAgY29uc3QgY29udGVudE9iaklkID0gNCArIGkgKiAzO1xuICAgIGNvbnN0IGltYWdlT2JqSWQgPSA1ICsgaSAqIDM7XG5cbiAgICAvLyBQYWdlIE9iamVjdFxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIHBhZ2VPYmpJZFxuICAgIHdyaXRlU3RyaW5nKFxuICAgICAgYDw8XFxuYCArXG4gICAgICBgICAvVHlwZSAvUGFnZVxcbmAgK1xuICAgICAgYCAgL1BhcmVudCAke3BhZ2VzUm9vdElkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9NZWRpYUJveCBbIDAgMCAke3dpZHRofSAke2hlaWdodH0gXVxcbmAgK1xuICAgICAgYCAgL0NvbnRlbnRzICR7Y29udGVudE9iaklkfSAwIFJcXG5gICtcbiAgICAgIGAgIC9SZXNvdXJjZXMgPDxcXG5gICtcbiAgICAgIGAgICAgL1hPYmplY3QgPDwgL0ltJHtpICsgMX0gJHtpbWFnZU9iaklkfSAwIFIgPj5cXG5gICtcbiAgICAgIGAgID4+XFxuYCArXG4gICAgICBgPj5cXG5gXG4gICAgKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIENvbnRlbnQgU3RyZWFtXG4gICAgY29uc3QgY29udGVudFN0cmVhbSA9IGBxXFxuJHt3aWR0aH0gMCAwICR7aGVpZ2h0fSAwIDAgY21cXG4vSW0ke2kgKyAxfSBEb1xcblFcXG5gO1xuICAgIGNvbnN0IGNvbnRlbnRCeXRlcyA9IHRleHRFbmNvZGVyLmVuY29kZShjb250ZW50U3RyZWFtKTtcblxuICAgIHN0YXJ0T2JqZWN0KCk7IC8vIGNvbnRlbnRPYmpJZFxuICAgIHdyaXRlU3RyaW5nKGA8PCAvTGVuZ3RoICR7Y29udGVudEJ5dGVzLmxlbmd0aH0gPj5cXG5zdHJlYW1cXG5gKTtcbiAgICB3cml0ZShjb250ZW50Qnl0ZXMpO1xuICAgIHdyaXRlU3RyaW5nKCdcXG5lbmRzdHJlYW1cXG4nKTtcbiAgICBlbmRPYmplY3QoKTtcblxuICAgIC8vIEltYWdlIFhPYmplY3RcbiAgICBzdGFydE9iamVjdCgpOyAvLyBpbWFnZU9iaklkXG4gICAgd3JpdGVTdHJpbmcoXG4gICAgICBgPDxcXG5gICtcbiAgICAgIGAgIC9UeXBlIC9YT2JqZWN0XFxuYCArXG4gICAgICBgICAvU3VidHlwZSAvSW1hZ2VcXG5gICtcbiAgICAgIGAgIC9XaWR0aCAke2luZm8ud2lkdGh9XFxuYCArXG4gICAgICBgICAvSGVpZ2h0ICR7aW5mby5oZWlnaHR9XFxuYCArXG4gICAgICBgICAvQ29sb3JTcGFjZSAvJHtpbmZvLmNvbG9yU3BhY2V9XFxuYCArXG4gICAgICBgICAvQml0c1BlckNvbXBvbmVudCAke2luZm8uYml0c31cXG5gICtcbiAgICAgIGAgIC9GaWx0ZXIgL0RDVERlY29kZVxcbmAgK1xuICAgICAgYCAgL0xlbmd0aCAke2ltYWdlQnl0ZXMubGVuZ3RofVxcbmAgK1xuICAgICAgYD4+XFxuc3RyZWFtXFxuYFxuICAgICk7XG4gICAgd3JpdGUoaW1hZ2VCeXRlcyk7XG4gICAgd3JpdGVTdHJpbmcoJ1xcbmVuZHN0cmVhbVxcbicpO1xuICAgIGVuZE9iamVjdCgpO1xuICB9XG5cbiAgLy8gT3B0aW9uYWwgSW5mbyBPYmplY3RcbiAgY29uc3QgaW5mb0lkID0gc3RhcnRPYmplY3QoKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gKG1ldGFkYXRhLnRpdGxlIHx8ICdBcmNoaXZlLm9yZyBCb29rJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICBjb25zdCBzYWZlQXV0aG9yID0gKG1ldGFkYXRhLmF1dGhvciB8fCAnQXJjaGl2ZS5vcmcnKS5yZXBsYWNlKC9bKClcXFxcXS9nLCAnXFxcXCQmJyk7XG4gIGNvbnN0IGNyZWF0b3IgPSAobWV0YWRhdGEuY3JlYXRvciB8fCAnQXJjaGl2ZSBEb3dubG9hZGVyJykucmVwbGFjZSgvWygpXFxcXF0vZywgJ1xcXFwkJicpO1xuICB3cml0ZVN0cmluZyhcbiAgICBgPDxcXG5gICtcbiAgICBgICAvVGl0bGUgKCR7c2FmZVRpdGxlfSlcXG5gICtcbiAgICBgICAvQXV0aG9yICgke3NhZmVBdXRob3J9KVxcbmAgK1xuICAgIGAgIC9DcmVhdG9yICgke2NyZWF0b3J9KVxcbmAgK1xuICAgIGAgIC9Qcm9kdWNlciAoQXJjaGl2ZSBEb3dubG9hZGVyIEV4dGVuc2lvbilcXG5gICtcbiAgICBgICAvQ3JlYXRpb25EYXRlIChEOiR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1stOlRdL2csICcnKS5zbGljZSgwLCAxNCl9WilcXG5gICtcbiAgICBgPj5cXG5gXG4gICk7XG4gIGVuZE9iamVjdCgpO1xuXG4gIC8vIFhSZWYgVGFibGVcbiAgY29uc3Qgc3RhcnRYcmVmID0gY3VycmVudE9mZnNldDtcbiAgY29uc3QgdG90YWxPYmplY3RzID0gb2JqSWRDb3VudGVyOyAvLyAxIHRvIG9iaklkQ291bnRlci0xXG5cbiAgd3JpdGVTdHJpbmcoYHhyZWZcXG4wICR7dG90YWxPYmplY3RzfVxcbmApO1xuICB3cml0ZVN0cmluZygnMDAwMDAwMDAwMCA2NTUzNSBmIFxcbicpO1xuXG4gIGZvciAobGV0IGlkID0gMTsgaWQgPCB0b3RhbE9iamVjdHM7IGlkKyspIHtcbiAgICBjb25zdCBvZmZzZXQgPSBvZmZzZXRzW2lkXSB8fCAwO1xuICAgIGNvbnN0IHBhZGRlZE9mZnNldCA9IFN0cmluZyhvZmZzZXQpLnBhZFN0YXJ0KDEwLCAnMCcpO1xuICAgIHdyaXRlU3RyaW5nKGAke3BhZGRlZE9mZnNldH0gMDAwMDAgbiBcXG5gKTtcbiAgfVxuXG4gIC8vIFRyYWlsZXJcbiAgd3JpdGVTdHJpbmcoXG4gICAgYHRyYWlsZXJcXG5gICtcbiAgICBgPDxcXG5gICtcbiAgICBgICAvU2l6ZSAke3RvdGFsT2JqZWN0c31cXG5gICtcbiAgICBgICAvUm9vdCAke2NhdGFsb2dJZH0gMCBSXFxuYCArXG4gICAgYCAgL0luZm8gJHtpbmZvSWR9IDAgUlxcbmAgK1xuICAgIGA+PlxcbmAgK1xuICAgIGBzdGFydHhyZWZcXG5gICtcbiAgICBgJHtzdGFydFhyZWZ9XFxuYCArXG4gICAgYCUlRU9GXFxuYFxuICApO1xuXG4gIC8vIENvbmNhdGVuYXRlIGFsbCBjaHVua3MgaW50byBmaW5hbCBVaW50OEFycmF5XG4gIGxldCB0b3RhbExlbmd0aCA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB0b3RhbExlbmd0aCArPSBjaHVuay5sZW5ndGg7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRvdGFsTGVuZ3RoKTtcbiAgbGV0IHBvcyA9IDA7XG4gIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgcmVzdWx0LnNldChjaHVuaywgcG9zKTtcbiAgICBwb3MgKz0gY2h1bmsubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBBbGlhcyBmb3IgY29tcGlsZUpwZWdzVG9QZGYuXG4gKi9cbmV4cG9ydCBjb25zdCBjb21waWxlSW1hZ2VzVG9QZGYgPSBjb21waWxlSnBlZ3NUb1BkZjtcbiIsCiAgICAiLyoqXG4gKiBGaWxlc3lzdGVtIGFuZCBuYW1pbmcgc2FuaXRpemF0aW9uIHV0aWxpdGllc1xuICovXG5cbi8qKlxuICogU2FuaXRpemVzIGEgc3RyaW5nIGZvciBzYWZlIHVzYWdlIGluIGRpcmVjdG9yeSBvciBmaWxlIG5hbWVzIGFjcm9zcyBtYWNPUywgTGludXgsIGFuZCBXaW5kb3dzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVGaWxlbmFtZShuYW1lOiBzdHJpbmcsIGZhbGxiYWNrID0gJ2Jvb2snKTogc3RyaW5nIHtcbiAgaWYgKCFuYW1lIHx8IHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbGxiYWNrO1xuXG4gIC8vIFJlbW92ZSBvciByZXBsYWNlIGlsbGVnYWwgY2hhcmFjdGVyczogLyBcXCA6ICogPyBcIiA8ID4gfCBhbmQgY29udHJvbCBjaGFyc1xuICBsZXQgY2xlYW5lZCA9IG5hbWVcbiAgICAucmVwbGFjZSgvWzw+OlwiL1xcXFx8PypcXHgwMC1cXHgxRl0vZywgJ18nKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAudHJpbSgpO1xuXG4gIC8vIFN0cmlwIGxlYWRpbmcvdHJhaWxpbmcgZG90cyBhbmQgc3BhY2VzXG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL15cXC4rfFxcLiskL2csICcnKS50cmltKCk7XG5cbiAgLy8gQXZvaWQgcmVzZXJ2ZWQgbmFtZXMgb24gV2luZG93cyAoQ09OLCBQUk4sIEFVWCwgTlVMLCBDT00xLTksIExQVDEtOSlcbiAgY29uc3QgcmVzZXJ2ZWQgPSAvXihDT058UFJOfEFVWHxOVUx8Q09NWzEtOV18TFBUWzEtOV0pJC9pO1xuICBpZiAocmVzZXJ2ZWQudGVzdChjbGVhbmVkKSkge1xuICAgIGNsZWFuZWQgPSBgJHtjbGVhbmVkfV9maWxlYDtcbiAgfVxuXG4gIC8vIENhcCBsZW5ndGggdG8gMTIwIGNoYXJhY3RlcnMgdG8gcHJldmVudCBwYXRoIGxpbWl0IGVycm9yc1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPiAxMjApIHtcbiAgICBjbGVhbmVkID0gY2xlYW5lZC5zdWJzdHJpbmcoMCwgMTIwKS50cmltKCk7XG4gIH1cblxuICByZXR1cm4gY2xlYW5lZCB8fCBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBGb3JtYXRzIGEgc3ViZm9sZGVyIHBhdGggYmFzZWQgb24gdGhlIHVzZXIncyB0ZW1wbGF0ZSBwYXR0ZXJuLlxuICogVGVtcGxhdGVzIHN1cHBvcnRlZDpcbiAqIC0ge3RpdGxlfSAtPiBcIlRoZV9Cb29rX1RpdGxlXCJcbiAqIC0ge2lkfSAtPiBcIm5hZ2hhbW1hZGlsaWJyYXIwMGphbWVcIlxuICogLSB7dGl0bGV9X3tpZH0gLT4gXCJUaGVfQm9va19UaXRsZV9uYWdoYW1tYWRpbGlicmFyMDBqYW1lXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN1YmRpcihcbiAgYmFzZURpcjogc3RyaW5nLFxuICBwYXR0ZXJuOiBzdHJpbmcsXG4gIGJvb2tUaXRsZTogc3RyaW5nLFxuICBib29rSWQ6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgY29uc3Qgc2FmZUJhc2UgPSBzYW5pdGl6ZUZpbGVuYW1lKGJhc2VEaXIsICdBcmNoaXZlQm9va3MnKTtcbiAgY29uc3Qgc2FmZVRpdGxlID0gc2FuaXRpemVGaWxlbmFtZShib29rVGl0bGUsICdib29rJyk7XG4gIGNvbnN0IHNhZmVJZCA9IHNhbml0aXplRmlsZW5hbWUoYm9va0lkLCAnaWQnKTtcblxuICBsZXQgZm9sZGVyID0gcGF0dGVybiB8fCAne3RpdGxlfV97aWR9JztcbiAgZm9sZGVyID0gZm9sZGVyLnJlcGxhY2UoL1xce3RpdGxlXFx9L2csIHNhZmVUaXRsZSk7XG4gIGZvbGRlciA9IGZvbGRlci5yZXBsYWNlKC9cXHtpZFxcfS9nLCBzYWZlSWQpO1xuICBmb2xkZXIgPSBzYW5pdGl6ZUZpbGVuYW1lKGZvbGRlciwgc2FmZVRpdGxlKTtcblxuICByZXR1cm4gYCR7c2FmZUJhc2V9LyR7Zm9sZGVyfWA7XG59XG5cbi8qKlxuICogRm9ybWF0cyBhIHBhZ2UgaW1hZ2UgZmlsZW5hbWUgd2l0aCB6ZXJvIHBhZGRpbmcuXG4gKiBFeGFtcGxlOiBcInBhZ2VfMDAxLmpwZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRQYWdlRmlsZW5hbWUoXG4gIHBhZ2VOdW06IG51bWJlcixcbiAgdG90YWxQYWdlczogbnVtYmVyLFxuICBmb3JtYXQgPSAnanBnJ1xuKTogc3RyaW5nIHtcbiAgY29uc3QgcGFkTGVuZ3RoID0gTWF0aC5tYXgoMywgU3RyaW5nKHRvdGFsUGFnZXMpLmxlbmd0aCk7XG4gIGNvbnN0IHBhZGRlZE51bSA9IFN0cmluZyhwYWdlTnVtKS5wYWRTdGFydChwYWRMZW5ndGgsICcwJyk7XG4gIHJldHVybiBgcGFnZV8ke3BhZGRlZE51bX0uJHtmb3JtYXR9YDtcbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBCb29rSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlRGp2dVhtbFRvVGV4dCB9IGZyb20gJy4uL3V0aWxzL21hcmtkb3duLWJ1aWxkZXInO1xuXG5leHBvcnQgY2xhc3MgQXJjaGl2ZVByb3ZpZGVyIGltcGxlbWVudHMgQm9va1Byb3ZpZGVyIHtcbiAgcmVhZG9ubHkgc2l0ZUlkID0gJ2FyY2hpdmUnIGFzIGNvbnN0O1xuICByZWFkb25seSBzaXRlTmFtZSA9ICdBcmNoaXZlLm9yZyc7XG4gIHJlYWRvbmx5IGRlZmF1bHRTdGFydFBhZ2UgPSAwO1xuXG4gIHByaXZhdGUgYm9va0luZm86IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG5cbiAgaXNNYXRjaCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluY2x1ZGVzKCdhcmNoaXZlLm9yZycpICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5pbmNsdWRlcygnL2RldGFpbHMvJyk7XG4gIH1cblxuICBzZXRCb29rSW5mbyhpbmZvOiBCb29rSW5mbyB8IG51bGwpIHtcbiAgICB0aGlzLmJvb2tJbmZvID0gaW5mbztcbiAgfVxuXG4gIGFzeW5jIGRldGVjdEJvb2tJbmZvKCk6IFByb21pc2U8Qm9va0luZm8gfCBudWxsPiB7XG4gICAgLy8gUmVxdWVzdCBCb29rUmVhZGVyIGRldGVjdGlvbiBmcm9tIGJyaWRnZSBpbiBNQUlOIHdvcmxkXG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0RFVEVDVF9CT09LJyk7XG5cbiAgICAvLyBBbHNvIGluc3BlY3QgRE9NIGRpcmVjdGx5IGFzIGZhc3QgcGF0aCAvIGZhbGxiYWNrXG4gICAgY29uc3QgZG9tUGFnZSA9IHRoaXMuZXh0cmFjdFBhZ2VJbmZvRnJvbURvbSgpO1xuICAgIGlmIChkb21QYWdlKSB7XG4gICAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LnRpdGxlIHx8ICdBcmNoaXZlIEJvb2snO1xuICAgICAgY29uc3QgaWRNYXRjaCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvXFwvZGV0YWlsc1xcLyhbXlxcL1xcPyNdKykvKTtcbiAgICAgIGNvbnN0IGJvb2tJZCA9IGlkTWF0Y2ggPyBpZE1hdGNoWzFdIDogJ2Jvb2snO1xuXG4gICAgICBpZiAoIXRoaXMuYm9va0luZm8pIHtcbiAgICAgICAgdGhpcy5ib29rSW5mbyA9IHtcbiAgICAgICAgICBib29rSWQsXG4gICAgICAgICAgYm9va1RpdGxlOiB0aXRsZSxcbiAgICAgICAgICB0b3RhbFBhZ2VzOiBkb21QYWdlLnRvdGFsLFxuICAgICAgICAgIGN1cnJlbnRMZWFmOiBkb21QYWdlLmN1cnJlbnQsXG4gICAgICAgICAgY3VycmVudE1vZGU6IDEsXG4gICAgICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkb21QYWdlLnRvdGFsID4gMCAmJiAoIXRoaXMuYm9va0luZm8udG90YWxQYWdlcyB8fCB0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXMgPCBkb21QYWdlLnRvdGFsKSkge1xuICAgICAgICAgIHRoaXMuYm9va0luZm8udG90YWxQYWdlcyA9IGRvbVBhZ2UudG90YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ib29rSW5mbztcbiAgfVxuXG4gIGdldEN1cnJlbnRQYWdlKCk6IG51bWJlciB8IG51bGwge1xuICAgIC8vIDEuIENoZWNrIHN0YXR1cyAvIHBhZ2UgaW5kaWNhdG9yIHNwYW5zIGFjcm9zcyBCb29rUmVhZGVyIHZlcnNpb25zXG4gICAgY29uc3QgY3VycmVudFNwYW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0sIC5wYWdlLW51bWJlciwgLkJScGFnZXItY291bnRlcicpO1xuICAgIGlmIChjdXJyZW50U3BhbiAmJiBjdXJyZW50U3Bhbi50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBjdXJyZW50U3Bhbi50ZXh0Q29udGVudC5tYXRjaCgvXFwoKFxcZCspKD86XFxzKi1cXHMqXFxkKyk/XFxzKlxcL1xccyooXFxkKylcXCkvKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNpbXBsZU1hdGNoID0gY3VycmVudFNwYW4udGV4dENvbnRlbnQubWF0Y2goL1xcKChcXGQrKVxccypcXC8vKTtcbiAgICAgIGlmIChzaW1wbGVNYXRjaCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoc2ltcGxlTWF0Y2hbMV0sIDEwKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG9mTWF0Y2ggPSBjdXJyZW50U3Bhbi50ZXh0Q29udGVudC5tYXRjaCgvKFxcZCspXFxzK29mXFxzKyhcXGQrKS9pKTtcbiAgICAgIGlmIChvZk1hdGNoKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChvZk1hdGNoWzFdLCAxMCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzbGFzaE1hdGNoID0gY3VycmVudFNwYW4udGV4dENvbnRlbnQubWF0Y2goL1xcL1xccyooXFxkKykvKTtcbiAgICAgIGlmIChzbGFzaE1hdGNoKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChzbGFzaE1hdGNoWzFdLCAxMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gQ2hlY2sgaW5wdXQgZmllbGRzIHVzZWQgZm9yIHBhZ2UganVtcGluZ1xuICAgIGNvbnN0IHBhZ2VJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJ2lucHV0LkJScGFnZWlucHV0LCBpbnB1dC5wYWdlLW51bWJlci1pbnB1dCwgaW5wdXRbbmFtZT1cInBhZ2VcIl0nKTtcbiAgICBpZiAocGFnZUlucHV0ICYmIHBhZ2VJbnB1dC52YWx1ZSkge1xuICAgICAgY29uc3QgdmFsID0gcGFyc2VJbnQocGFnZUlucHV0LnZhbHVlLCAxMCk7XG4gICAgICBpZiAoIWlzTmFOKHZhbCkpIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgLy8gMy4gQWN0aXZlIHBhZ2UgY29udGFpbmVyIGluIERPTVxuICAgIGNvbnN0IGFjdGl2ZUNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5CUnBhZ2Vjb250YWluZXIuQlJwYWdlLXZpc2libGUsIC5CUnBhZ2UuYWN0aXZlLCAuQlJwYWdlY29udGFpbmVyW2RhdGEtaW5kZXhdJyk7XG4gICAgaWYgKGFjdGl2ZUNvbnRhaW5lcikge1xuICAgICAgY29uc3QgaWR4QXR0ciA9IGFjdGl2ZUNvbnRhaW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtaW5kZXgnKSB8fCBhY3RpdmVDb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXBhZ2UnKTtcbiAgICAgIGlmIChpZHhBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KGlkeEF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpKSByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uIEFyY2hpdmUub3JnLi4uJyk7XG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ1NXSVRDSF9NT0RFXzEnKTtcblxuICAgIC8vIEFjY29tbW9kYXRlIG11bHRpcGxlIGJ1dHRvbiBzZWxlY3RvcnMgYWNyb3NzIEJvb2tSZWFkZXIgdmVyc2lvbnNcbiAgICBjb25zdCBvbmVQYWdlQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIk9uZS1wYWdlXCIgaV0sIGJ1dHRvbi5vbmUtcGFnZSwgLkJScGFnZXZpZXcxLCBidXR0b25bZGF0YS1tb2RlPVwiMVwiXSwgW2FyaWEtbGFiZWwqPVwiMS1wYWdlXCIgaV0sIC5CUmljb25fb25lcGFnZSwgLnZpZXctbW9kZS0xdXAnXG4gICAgKTtcbiAgICBpZiAob25lUGFnZUJ0biAmJiAhb25lUGFnZUJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpICYmIG9uZVBhZ2VCdG4uZ2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnKSAhPT0gJ3RydWUnKSB7XG4gICAgICB0cnkgeyBvbmVQYWdlQnRuLmNsaWNrKCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgbmF2aWdhdGVUb1BhZ2UocGFnZU51bTogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gTmF2aWdhdGluZyB0byBBcmNoaXZlIGxlYWYgJHtwYWdlTnVtfS4uLmApO1xuICAgIHRoaXMucG9zdFRvQnJpZGdlKCdKVU1QX1BBR0UnLCB7IGxlYWZJbmRleDogcGFnZU51bSB9KTtcblxuICAgIGlmIChwYWdlTnVtID09PSAwKSB7XG4gICAgICBjb25zdCBmaXJzdEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgICAnYnV0dG9uW3RpdGxlKj1cIkZpcnN0IHBhZ2VcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmlyc3QgcGFnZVwiIGldLCBidXR0b24ubmF2Zmlyc3QsIC5ib29rLWZsaXAtZmlyc3QsIC5CUm5hdmZpcnN0LCBbYXJpYS1sYWJlbD1cIkZpcnN0IHBhZ2VcIiBpXSdcbiAgICAgICk7XG4gICAgICBpZiAoZmlyc3RCdG4pIHtcbiAgICAgICAgdHJ5IHsgZmlyc3RCdG4uY2xpY2soKTsgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cblxuICAgICAgY29uc3QgaG9tZUV2ZW50ID0geyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBrZXk6ICdIb21lJywgY29kZTogJ0hvbWUnLCBrZXlDb2RlOiAzNiwgd2hpY2g6IDM2IH07XG4gICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBob21lRXZlbnQpKTtcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgaG9tZUV2ZW50KSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW06IG51bWJlcik6IHZvaWQge1xuICAgIC8vIDEuIERpcmVjdCBCb29rUmVhZGVyIEFQSSBjYWxsIHZpYSBicmlkZ2UgKG1vc3QgcmVsaWFibGUgaW4gTUFJTiB3b3JsZCwgc3VwcG9ydHMgYnIubmV4dCgpICYgdmVyc2lvbnMpXG4gICAgdGhpcy5wb3N0VG9CcmlkZ2UoJ0ZMSVBfTkVYVCcsIHsgdGFyZ2V0UGFnZTogdGFyZ2V0UGFnZU51bSB9KTtcblxuICAgIC8vIDIuIERPTSBidXR0b24gY2xpY2sgZmFsbGJhY2sgYWNyb3NzIG11bHRpcGxlIEJvb2tSZWFkZXIgdmVyc2lvbnNcbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW3RpdGxlKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b24ubmF2bmV4dCwgLmJvb2stZmxpcC1yaWdodCwgLkJSbmF2bmV4dCwgW2FyaWEtbGFiZWw9XCJOZXh0IHBhZ2VcIiBpXSwgW2RhdGEtYWN0aW9uPVwibmV4dC1wYWdlXCIgaV0sIC5CUmljb25fZmxpcF9yaWdodCwgYnV0dG9uLnBhZ2UtbmV4dCdcbiAgICApO1xuICAgIGlmIChuZXh0QnRuKSB7XG4gICAgICB0cnkgeyBuZXh0QnRuLmNsaWNrKCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgLy8gMy4gS2V5Ym9hcmQgQXJyb3dSaWdodCAmIFBhZ2VEb3duIGV2ZW50cyBhY3Jvc3MgQm9va1JlYWRlciB2ZXJzaW9uc1xuICAgIGZvciAoY29uc3Qga2V5IG9mIFsnQXJyb3dSaWdodCcsICdQYWdlRG93biddKSB7XG4gICAgICBjb25zdCBrZXlFdmVudCA9IHtcbiAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAga2V5LFxuICAgICAgICBjb2RlOiBrZXksXG4gICAgICAgIGtleUNvZGU6IGtleSA9PT0gJ0Fycm93UmlnaHQnID8gMzkgOiAzNCxcbiAgICAgICAgd2hpY2g6IGtleSA9PT0gJ0Fycm93UmlnaHQnID8gMzkgOiAzNCxcbiAgICAgIH07XG4gICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuICAgIH1cbiAgfVxuXG4gIGdldEFjdGl2ZVBhZ2VJbWFnZShtaW5XaWR0aCA9IDMwMCwgdGFyZ2V0UGFnZU51bT86IG51bWJlcik6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsIHtcbiAgICAvLyAxLiBEaXJlY3QgVGFyZ2V0IENvbnRhaW5lciBMb29rdXAgKHN1cHBvcnRzIG1vZGVybiAmIGxlZ2FjeSBCb29rUmVhZGVyIHZlcnNpb25zKVxuICAgIGlmICh0eXBlb2YgdGFyZ2V0UGFnZU51bSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnN0IHRhcmdldFNlbGVjdG9ycyA9IFtcbiAgICAgICAgYC5CUnBhZ2Vjb250YWluZXJbZGF0YS1pbmRleD1cIiR7dGFyZ2V0UGFnZU51bX1cIl0gaW1nYCxcbiAgICAgICAgYC5wYWdlZGl2JHt0YXJnZXRQYWdlTnVtfSBpbWdgLFxuICAgICAgICBgW2RhdGEtaW5kZXg9XCIke3RhcmdldFBhZ2VOdW19XCJdIGltZ2AsXG4gICAgICAgIGAuQlJwYWdlW2RhdGEtcGFnZT1cIiR7dGFyZ2V0UGFnZU51bX1cIl0gaW1nYCxcbiAgICAgICAgYC5CUnBhZ2VbZGF0YS1sZWFmPVwiJHt0YXJnZXRQYWdlTnVtfVwiXSBpbWdgLFxuICAgICAgICBgI3BhZ2VkaXYke3RhcmdldFBhZ2VOdW19IGltZ2AsXG4gICAgICAgIGAjcGFnZSR7dGFyZ2V0UGFnZU51bX0gaW1nYCxcbiAgICAgICAgYGltZ1tkYXRhLXNlcT1cIiR7dGFyZ2V0UGFnZU51bX1cIl1gLFxuICAgICAgXTtcbiAgICAgIGZvciAoY29uc3Qgc2VsIG9mIHRhcmdldFNlbGVjdG9ycykge1xuICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEltYWdlRWxlbWVudD4oc2VsKTtcbiAgICAgICAgaWYgKGVsICYmIGVsLmNvbXBsZXRlICYmIGVsLm5hdHVyYWxXaWR0aCA+PSBtaW5XaWR0aCAmJiBlbC5zcmMpIHtcbiAgICAgICAgICBlbC5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBRdWVyeSBhbGwgY2FuZGlkYXRlIHBhZ2UgaW1hZ2VzIGFjcm9zcyBhbGwgQm9va1JlYWRlciB2ZXJzaW9uc1xuICAgIGNvbnN0IGltYWdlU2VsZWN0b3JzID0gW1xuICAgICAgJy5CUnBhZ2Vjb250YWluZXIgaW1nJyxcbiAgICAgICdpbWcuQlJwYWdlaW1hZ2UnLFxuICAgICAgJy5CUnBhZ2UgaW1nJyxcbiAgICAgICcuQlJwYWdldmlldyBpbWcnLFxuICAgICAgJ2ltZ1tjbGFzcyo9XCJCUnBhZ2VcIl0nLFxuICAgICAgJ2ltZ1tzcmMqPVwiQm9va1JlYWRlckltYWdlcy5waHBcIl0nLFxuICAgICAgJ2ltZ1tzcmMqPVwiL0Jvb2tSZWFkZXIvXCJdJyxcbiAgICAgICdpbWdbc3JjKj1cInNjYWxlPVwiXScsXG4gICAgICAnaW1nW3NyYyo9XCJ6aXA9XCJdJyxcbiAgICAgICcuYm9vay1wYWdlIGltZycsXG4gICAgXTtcbiAgICBjb25zdCBpbWFnZXMgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEltYWdlRWxlbWVudD4oaW1hZ2VTZWxlY3RvcnMuam9pbignLCAnKSkpO1xuICAgIGNvbnN0IHZhbGlkID0gaW1hZ2VzLmZpbHRlcihpbWcgPT4gaW1nLmNvbXBsZXRlICYmIGltZy5uYXR1cmFsV2lkdGggPj0gbWluV2lkdGggJiYgaW1nLnNyYyk7XG5cbiAgICBpZiAodmFsaWQubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIDMuIElmIHRhcmdldFBhZ2VOdW0gaXMgc3BlY2lmaWVkLCBmaW5kIGFueSBpbWFnZSB3aG9zZSBwYXJlbnQvY29udGFpbmVyIG9yIGRhdGFzZXQgbWF0Y2hlcyB0YXJnZXRQYWdlTnVtXG4gICAgaWYgKHR5cGVvZiB0YXJnZXRQYWdlTnVtID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgbWF0Y2ggPSB2YWxpZC5maW5kKGltZyA9PiB7XG4gICAgICAgIGlmIChpbWcuZGF0YXNldC5zZXEgPT09IFN0cmluZyh0YXJnZXRQYWdlTnVtKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGltZy5jbG9zZXN0KCcuQlJwYWdlY29udGFpbmVyLCAuQlJwYWdlLCBbZGF0YS1pbmRleF0sIFtkYXRhLXBhZ2VdJyk7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICBjb25zdCBpZHggPSBjb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLWluZGV4JykgfHwgY29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1wYWdlJykgfHwgY29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1sZWFmJyk7XG4gICAgICAgICAgaWYgKGlkeCA9PT0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBpZiAoY29udGFpbmVyLmNsYXNzTGlzdC5jb250YWlucyhgcGFnZWRpdiR7dGFyZ2V0UGFnZU51bX1gKSB8fCBjb250YWluZXIuY2xhc3NMaXN0LmNvbnRhaW5zKGBwJHt0YXJnZXRQYWdlTnVtfWApKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBtYXRjaC5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDQuIFZpZXdwb3J0IHZpc2liaWxpdHkgc2NvcmluZzogUGljayB0aGUgaW1hZ2Ugd2l0aCB0aGUgbGFyZ2VzdCB2aXNpYmxlIGFyZWEgb24gc2NyZWVuXG4gICAgbGV0IGJlc3RJbWc6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbWF4VmlzaWJsZUFyZWEgPSAwO1xuICAgIGNvbnN0IHdpblcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5pbm5lcldpZHRoIDogMTkyMDtcbiAgICBjb25zdCB3aW5IID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiAxMDgwO1xuXG4gICAgZm9yIChjb25zdCBpbWcgb2YgdmFsaWQpIHtcbiAgICAgIGNvbnN0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCB2aXNpYmxlV2lkdGggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LnJpZ2h0LCB3aW5XKSAtIE1hdGgubWF4KHJlY3QubGVmdCwgMCkpO1xuICAgICAgY29uc3QgdmlzaWJsZUhlaWdodCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QuYm90dG9tLCB3aW5IKSAtIE1hdGgubWF4KHJlY3QudG9wLCAwKSk7XG4gICAgICBjb25zdCBhcmVhID0gdmlzaWJsZVdpZHRoICogdmlzaWJsZUhlaWdodDtcblxuICAgICAgaWYgKGFyZWEgPiBtYXhWaXNpYmxlQXJlYSAmJiB2aXNpYmxlV2lkdGggPiA1MCAmJiB2aXNpYmxlSGVpZ2h0ID4gNTApIHtcbiAgICAgICAgbWF4VmlzaWJsZUFyZWEgPSBhcmVhO1xuICAgICAgICBiZXN0SW1nID0gaW1nO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChiZXN0SW1nKSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldFBhZ2VOdW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGJlc3RJbWcuZGF0YXNldC5zZXEgPSBTdHJpbmcodGFyZ2V0UGFnZU51bSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmVzdEltZztcbiAgICB9XG5cbiAgICAvLyA1LiBGYWxsYmFjazogTGF0ZXN0IHZhbGlkIGltYWdlIGluIERPTSBvcmRlciAobmV3ZXN0IHBhZ2UpXG4gICAgY29uc3QgZmFsbGJhY2sgPSB2YWxpZFt2YWxpZC5sZW5ndGggLSAxXTtcbiAgICBpZiAoZmFsbGJhY2sgJiYgdHlwZW9mIHRhcmdldFBhZ2VOdW0gPT09ICdudW1iZXInKSB7XG4gICAgICBmYWxsYmFjay5kYXRhc2V0LnNlcSA9IFN0cmluZyh0YXJnZXRQYWdlTnVtKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG5cbiAgYXN5bmMgZXh0cmFjdFBhZ2VUZXh0KHBhZ2VOdW06IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLmJvb2tJbmZvIHx8ICF0aGlzLmJvb2tJbmZvLnNlcnZlciB8fCAhdGhpcy5ib29rSW5mby5ib29rUGF0aCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGNvbnN0IGxlYWZJbmRleCA9IHBhZ2VOdW07XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vJHt0aGlzLmJvb2tJbmZvLnNlcnZlcn0vQm9va1JlYWRlci9Cb29rUmVhZGVyR2V0VGV4dFdyYXBwZXIucGhwP3BhdGg9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5ib29rSW5mby5ib29rUGF0aCl9X2RqdnUueG1sJm1vZGU9ZGp2dV94bWwmcGFnZT0ke2xlYWZJbmRleH1gO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScsXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiAnJztcbiAgICAgIGNvbnN0IHhtbCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIHJldHVybiBwYXJzZURqdnVYbWxUb1RleHQoeG1sKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgZmV0Y2ggdGV4dCBmb3IgbGVhZiAke2xlYWZJbmRleH06YCwgZXJyKTtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1cblxuICBpc0F0RW5kT2ZCb29rKGN1cnJlbnRQYWdlOiBudW1iZXIsIHRvdGFsUGFnZXM6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgICdidXR0b25bdGl0bGUqPVwiRmxpcCByaWdodFwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvbi5uYXZuZXh0LCAuYm9vay1mbGlwLXJpZ2h0LCAuQlJuYXZuZXh0LCBbYXJpYS1sYWJlbD1cIk5leHQgcGFnZVwiIGldLCBbZGF0YS1hY3Rpb249XCJuZXh0LXBhZ2VcIiBpXSdcbiAgICApO1xuICAgIGNvbnN0IGlzTmV4dERpc2FibGVkID0gbmV4dEJ0biAmJiAoXG4gICAgICBuZXh0QnRuLmRpc2FibGVkIHx8XG4gICAgICBuZXh0QnRuLmdldEF0dHJpYnV0ZSgnYXJpYS1kaXNhYmxlZCcpID09PSAndHJ1ZScgfHxcbiAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpXG4gICAgKTtcbiAgICBjb25zdCBkb21MZWFmID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpO1xuICAgIHJldHVybiBCb29sZWFuKGlzTmV4dERpc2FibGVkIHx8ICh0b3RhbFBhZ2VzID4gMCAmJiBkb21MZWFmICE9PSBudWxsICYmIGRvbUxlYWYgPj0gdG90YWxQYWdlcyAmJiBjdXJyZW50UGFnZSA+PSB0b3RhbFBhZ2VzKSk7XG4gIH1cblxuICBwcml2YXRlIHBvc3RUb0JyaWRnZShhY3Rpb246IHN0cmluZywgZXh0cmFEYXRhOiBhbnkgPSB7fSkge1xuICAgIHdpbmRvdy5wb3N0TWVzc2FnZSh7IGRpcmVjdGlvbjogJ1RPX0JSSURHRScsIGFjdGlvbiwgLi4uZXh0cmFEYXRhIH0sICcqJyk7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RQYWdlSW5mb0Zyb21Eb20oKTogeyBjdXJyZW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfSB8IG51bGwge1xuICAgIGNvbnN0IHBhZ2VFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5CUmN1cnJlbnRwYWdlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW3JvbGU9XCJzdGF0dXNcIl0nKTtcbiAgICBpZiAocGFnZUVsICYmIHBhZ2VFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYWdlRWwudGV4dENvbnRlbnQubWF0Y2goL1xcKChcXGQrKVxccypcXC9cXHMqKFxcZCspXFwpLyk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjdXJyZW50OiBwYXJzZUludChtYXRjaFsxXSwgMTApLFxuICAgICAgICAgIHRvdGFsOiBwYXJzZUludChtYXRjaFsyXSwgMTApLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwKICAgICJpbXBvcnQgeyBCb29rUHJvdmlkZXIgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IEJvb2tJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQgfSBmcm9tICcuLi91dGlscy9tYXJrZG93bi1idWlsZGVyJztcblxuZXhwb3J0IGNsYXNzIEhhdGhpVHJ1c3RQcm92aWRlciBpbXBsZW1lbnRzIEJvb2tQcm92aWRlciB7XG4gIHJlYWRvbmx5IHNpdGVJZCA9ICdoYXRoaXRydXN0JyBhcyBjb25zdDtcbiAgcmVhZG9ubHkgc2l0ZU5hbWUgPSAnSGF0aGlUcnVzdCc7XG4gIHJlYWRvbmx5IGRlZmF1bHRTdGFydFBhZ2UgPSAxOyAvLyBIYXRoaVRydXN0IHNlcXVlbmNlcyBhcmUgMS1iYXNlZFxuXG4gIHByaXZhdGUgYm9va0luZm86IEJvb2tJbmZvIHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gVHJhY2tpbmcgbG9hZGVkIHNlcXVlbmNlcyBmcm9tIE1BSU4gd29ybGQgYnJpZGdlXG4gIHByaXZhdGUgYW5ub3VuY2VkU2VxdWVuY2VzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIHByaXZhdGUgc2VxVG9CbG9iVXJsID0gbmV3IE1hcDxudW1iZXIsIHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBibG9iVXJsVG9TZXEgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBwcml2YXRlIHNlcVRvSHRtbCA9IG5ldyBNYXA8bnVtYmVyLCBzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gTGlzdGVuIGZvciBicmlkZ2UgbWVzc2FnZXMgKHdvcmxkOiBNQUlOKVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSAhPT0gd2luZG93IHx8ICFldmVudC5kYXRhIHx8IGV2ZW50LmRhdGEuZGlyZWN0aW9uICE9PSAnRlJPTV9CUklER0UnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGE7XG4gICAgICAgIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0xPQURfQU5OT1VOQ0VEJykge1xuICAgICAgICAgIGlmIChtc2cuaXNMb2FkZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYW5ub3VuY2VkU2VxdWVuY2VzLmFkZChtc2cuc2VxKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEhhdGhpVHJ1c3QgYW5ub3VuY2VkIHNlcXVlbmNlICR7bXNnLnNlcX0gbG9hZGVkYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfSU1BR0VfUkVBRFknKSB7XG4gICAgICAgICAgdGhpcy5zZXFUb0Jsb2JVcmwuc2V0KG1zZy5zZXEsIG1zZy5ibG9iVXJsKTtcbiAgICAgICAgICB0aGlzLmJsb2JVcmxUb1NlcS5zZXQobXNnLmJsb2JVcmwsIG1zZy5zZXEpO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfVEVYVF9SRUFEWScpIHtcbiAgICAgICAgICB0aGlzLnNlcVRvSHRtbC5zZXQobXNnLnNlcSwgbXNnLmh0bWwpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBvblBhZ2VMb2FkQW5ub3VuY2VkKHNlcTogbnVtYmVyLCBpc1Zpc2libGU6IGJvb2xlYW4sIGlzTG9hZGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKGlzTG9hZGVkKSB7XG4gICAgICB0aGlzLmFubm91bmNlZFNlcXVlbmNlcy5hZGQoc2VxKTtcbiAgICB9XG4gIH1cblxuICBvblBhZ2VJbWFnZVJlYWR5KHNlcTogbnVtYmVyLCBibG9iVXJsOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNlcVRvQmxvYlVybC5zZXQoc2VxLCBibG9iVXJsKTtcbiAgICB0aGlzLmJsb2JVcmxUb1NlcS5zZXQoYmxvYlVybCwgc2VxKTtcbiAgfVxuXG4gIG9uUGFnZVRleHRSZWFkeShzZXE6IG51bWJlciwgaHRtbDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zZXFUb0h0bWwuc2V0KHNlcSwgaHRtbCk7XG4gIH1cblxuICBnZXRCbG9iVXJsRm9yU2VxKHNlcTogbnVtYmVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5zZXFUb0Jsb2JVcmwuZ2V0KHNlcSk7XG4gIH1cblxuICBnZXRDYWNoZWRIdG1sRm9yU2VxKHNlcTogbnVtYmVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5zZXFUb0h0bWwuZ2V0KHNlcSk7XG4gIH1cblxuICBpc1BhZ2VBbm5vdW5jZWQoc2VxOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hbm5vdW5jZWRTZXF1ZW5jZXMuaGFzKHNlcSk7XG4gIH1cblxuICBpc01hdGNoKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlzSG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2JhYmVsLmhhdGhpdHJ1c3Qub3JnJyB8fFxuICAgICAgICAgICAgICAgICAgICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgJiYgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9jZ2kvcHQnKSk7XG4gICAgcmV0dXJuIGlzSG9zdDtcbiAgfVxuXG4gIGFzeW5jIGRldGVjdEJvb2tJbmZvKCk6IFByb21pc2U8Qm9va0luZm8gfCBudWxsPiB7XG4gICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgICBjb25zdCBib29rSWQgPSBwYXJhbXMuZ2V0KCdpZCcpIHx8ICdoYXRoaXRydXN0X2Jvb2snO1xuXG4gICAgLy8gMS4gRGV0ZWN0IEJvb2sgVGl0bGVcbiAgICBsZXQgYm9va1RpdGxlID0gJyc7XG4gICAgY29uc3QgbWV0YVRpdGxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MTWV0YUVsZW1lbnQ+KCdtZXRhW25hbWU9XCJEQy50aXRsZVwiXSwgbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJyk7XG4gICAgaWYgKG1ldGFUaXRsZSAmJiBtZXRhVGl0bGUuY29udGVudCkge1xuICAgICAgYm9va1RpdGxlID0gbWV0YVRpdGxlLmNvbnRlbnQudHJpbSgpO1xuICAgIH1cbiAgICBpZiAoIWJvb2tUaXRsZSkge1xuICAgICAgY29uc3QgaDEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoMS50aXRsZSwgaDEuaXRlbS10aXRsZSwgaDEnKTtcbiAgICAgIGlmIChoMSAmJiBoMS50ZXh0Q29udGVudCkge1xuICAgICAgICBib29rVGl0bGUgPSBoMS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghYm9va1RpdGxlKSB7XG4gICAgICBib29rVGl0bGUgPSBkb2N1bWVudC50aXRsZSA/IGRvY3VtZW50LnRpdGxlLnJlcGxhY2UoL1stfF1cXHMqSGF0aGlUcnVzdC4qL2ksICcnKS50cmltKCkgOiAnSGF0aGlUcnVzdCBCb29rJztcbiAgICB9XG5cbiAgICAvLyAyLiBEZXRlY3QgVG90YWwgUGFnZXNcbiAgICBjb25zdCB0b3RhbFBhZ2VzID0gdGhpcy5nZXRUb3RhbFBhZ2VzRnJvbURvbSgpO1xuXG4gICAgLy8gMy4gRGV0ZWN0IEN1cnJlbnQgU2VxdWVuY2VcbiAgICBjb25zdCBjdXJyZW50U2VxID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpIHx8IDE7XG5cbiAgICAvLyBDaGVjayBhdXRob3IgYW5kIHllYXIgaWYgcHJlc2VudCBpbiBtZXRhZGF0YVxuICAgIGNvbnN0IGF1dGhvck1ldGEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxNZXRhRWxlbWVudD4oJ21ldGFbbmFtZT1cIkRDLmNyZWF0b3JcIl0nKTtcbiAgICBjb25zdCBhdXRob3IgPSBhdXRob3JNZXRhPy5jb250ZW50O1xuXG4gICAgY29uc3QgZGF0ZU1ldGEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxNZXRhRWxlbWVudD4oJ21ldGFbbmFtZT1cIkRDLmRhdGVcIl0nKTtcbiAgICBjb25zdCB5ZWFyID0gZGF0ZU1ldGE/LmNvbnRlbnQ7XG5cbiAgICB0aGlzLmJvb2tJbmZvID0ge1xuICAgICAgYm9va0lkLFxuICAgICAgYm9va1RpdGxlOiBib29rVGl0bGUgfHwgJ0hhdGhpVHJ1c3QgQm9vaycsXG4gICAgICB0b3RhbFBhZ2VzOiB0b3RhbFBhZ2VzIHx8IDUwMCxcbiAgICAgIGN1cnJlbnRMZWFmOiBjdXJyZW50U2VxLFxuICAgICAgY3VycmVudE1vZGU6IDEsXG4gICAgICBzb3VyY2VVcmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgYXV0aG9yLFxuICAgICAgeWVhcixcbiAgICB9O1xuXG4gICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gSGF0aGlUcnVzdCB2b2x1bWUgZGV0ZWN0ZWQ6JywgdGhpcy5ib29rSW5mby5ib29rVGl0bGUsIGAoJHt0aGlzLmJvb2tJbmZvLnRvdGFsUGFnZXN9IHBhZ2VzKWApO1xuICAgIHJldHVybiB0aGlzLmJvb2tJbmZvO1xuICB9XG5cbiAgZ2V0Q3VycmVudFBhZ2UoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBudWxsO1xuXG4gICAgLy8gMS4gQ2hlY2sgdG9vbGJhciBpbnB1dFxuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG4gICAgaWYgKHNlcUlucHV0ICYmIHNlcUlucHV0LnZhbHVlKSB7XG4gICAgICBjb25zdCB2YWwgPSBwYXJzZUludChzZXFJbnB1dC52YWx1ZSwgMTApO1xuICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgLy8gMi4gQ2hlY2sgVVJMIHNlYXJjaCBwYXJhbVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYXRpb24gJiYgd2luZG93LmxvY2F0aW9uLnNlYXJjaCkge1xuICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgICAgIGNvbnN0IHNlcSA9IHBhcmFtcy5nZXQoJ3NlcScpO1xuICAgICAgaWYgKHNlcSkge1xuICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChzZXEsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMy4gQ2hlY2sgZGF0YS1zZXEgb24gYWN0aXZlIGZpZ3VyZSBvciBzcHJlYWRcbiAgICBjb25zdCBhY3RpdmVGaWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYuc3ByZWFkIGZpZ3VyZVtkYXRhLXNlcV0sIGZpZ3VyZVtkYXRhLXNlcV0nKTtcbiAgICBpZiAoYWN0aXZlRmlnKSB7XG4gICAgICBjb25zdCBzZXFBdHRyID0gYWN0aXZlRmlnLmdldEF0dHJpYnV0ZSgnZGF0YS1zZXEnKTtcbiAgICAgIGlmIChzZXFBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHNlcUF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhc3luYyBuYXZpZ2F0ZVRvUGFnZShwYWdlTnVtOiBudW1iZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBOYXZpZ2F0aW5nIHRvIEhhdGhpVHJ1c3Qgc2VxdWVuY2UgJHtwYWdlTnVtfS4uLmApO1xuICAgIGNvbnN0IHNlcUlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignI3Rvb2xiYXItc2VxLCBpbnB1dFtuYW1lPVwic2VxXCJdJyk7XG5cbiAgICBpZiAoc2VxSW5wdXQpIHtcbiAgICAgIHNlcUlucHV0LmZvY3VzKCk7XG4gICAgICBzZXFJbnB1dC52YWx1ZSA9IFN0cmluZyhwYWdlTnVtKTtcbiAgICAgIHNlcUlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICBzZXFJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2hhbmdlJywgeyBidWJibGVzOiB0cnVlIH0pKTtcblxuICAgICAgLy8gRGlzcGF0Y2ggRW50ZXIga2V5ZG93biBldmVudFxuICAgICAgY29uc3QgZW50ZXJFdmVudCA9IG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywge1xuICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICBrZXk6ICdFbnRlcicsXG4gICAgICAgIGNvZGU6ICdFbnRlcicsXG4gICAgICAgIGtleUNvZGU6IDEzLFxuICAgICAgICB3aGljaDogMTMsXG4gICAgICB9KTtcbiAgICAgIHNlcUlucHV0LmRpc3BhdGNoRXZlbnQoZW50ZXJFdmVudCk7XG5cbiAgICAgIC8vIFN1Ym1pdCBwYXJlbnQgZm9ybSBpZiBwcmVzZW50XG4gICAgICBjb25zdCBmb3JtID0gc2VxSW5wdXQuY2xvc2VzdCgnZm9ybScpO1xuICAgICAgaWYgKGZvcm0pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGZvcm0ucmVxdWVzdFN1Ym1pdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgZm9ybS5yZXF1ZXN0U3VibWl0KCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm0uZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3N1Ym1pdCcsIHsgYnViYmxlczogdHJ1ZSwgY2FuY2VsYWJsZTogdHJ1ZSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW06IG51bWJlcik6IHZvaWQge1xuICAgIC8vIDEuIFByaW1hcnk6IENsaWNrIE5leHQgUGFnZSBidXR0b25cbiAgICAvLyA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tb3V0bGluZS1kYXJrXCIgYXJpYS1sYWJlbD1cIk5leHQgUGFnZVwiPjxpIGNsYXNzPVwiZmEtc29saWQgZmEtYW5nbGUtcmlnaHRcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PC9idXR0b24+XG4gICAgY29uc3QgbmV4dEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQgfCBIVE1MQW5jaG9yRWxlbWVudD4oXG4gICAgICAnYnV0dG9uW2FyaWEtbGFiZWw9XCJOZXh0IFBhZ2VcIiBpXSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiTmV4dFwiIGldLCBidXR0b25bdGl0bGUqPVwiTmV4dFwiIGldLCBbYWNjZXNza2V5PVwiblwiXSwgYnV0dG9uLm5leHQsIGEuYWN0aW9uLW5leHQtcGFnZSdcbiAgICApO1xuICAgIGlmIChuZXh0QnRuKSB7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IChuZXh0QnRuIGFzIGFueSkuZGlzYWJsZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5nZXRBdHRyaWJ1dGUoJ2FyaWEtZGlzYWJsZWQnKSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIG5leHRCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpO1xuICAgICAgaWYgKCFkaXNhYmxlZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIENsaWNraW5nIEhhdGhpVHJ1c3QgTmV4dCBQYWdlIGJ1dHRvbi4uLicpO1xuICAgICAgICAgIG5leHRCdG4uY2xpY2soKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gS2V5Ym9hcmQgQXJyb3dSaWdodCBldmVudCAoc3RhbmRhcmQgcmVhZGVyIGhvdGtleSlcbiAgICBjb25zdCBrZXlFdmVudCA9IHtcbiAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAga2V5OiAnQXJyb3dSaWdodCcsXG4gICAgICBjb2RlOiAnQXJyb3dSaWdodCcsXG4gICAgICBrZXlDb2RlOiAzOSxcbiAgICAgIHdoaWNoOiAzOSxcbiAgICB9O1xuICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGtleUV2ZW50KSk7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBrZXlFdmVudCkpO1xuXG4gICAgLy8gMy4gRmFsbGJhY2s6IG9ubHkgaWYgTmV4dCBidXR0b24gaXMgbm90IGF2YWlsYWJsZSwgdXNlIHNlcXVlbmNlIGlucHV0XG4gICAgY29uc3Qgc2VxSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbnB1dEVsZW1lbnQ+KCcjdG9vbGJhci1zZXEsIGlucHV0W25hbWU9XCJzZXFcIl0nKTtcbiAgICBpZiAoc2VxSW5wdXQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZhbGxiYWNrIHRvIHNlcXVlbmNlIGlucHV0ICR7dGFyZ2V0UGFnZU51bX0uLi5gKTtcbiAgICAgIHRoaXMubmF2aWdhdGVUb1BhZ2UodGFyZ2V0UGFnZU51bSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QWN0aXZlUGFnZUltYWdlKG1pbldpZHRoID0gMzAwLCB0YXJnZXRTZXE/OiBudW1iZXIpOiBIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbCB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBudWxsO1xuXG4gICAgLy8gMS4gSWYgdGFyZ2V0U2VxIGlzIHNwZWNpZmllZCAoZHVyaW5nIHNlcXVlbnRpYWwgY2FwdHVyZSlcbiAgICBpZiAodHlwZW9mIHRhcmdldFNlcSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTZXEgPSB0aGlzLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICAvLyBJZiB0aGUgcmVhZGVyIHRvb2xiYXIgaGFzIG5vdCByZWFjaGVkIHRhcmdldFNlcSB5ZXQsIHdhaXQhXG4gICAgICBpZiAoY3VycmVudFNlcSAhPT0gbnVsbCAmJiBjdXJyZW50U2VxIDwgdGFyZ2V0U2VxKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbiBpbWFnZSBleHBsaWNpdGx5IHRhZ2dlZCB3aXRoIHRhcmdldFNlcVxuICAgICAgY29uc3QgdGFnZ2VkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MSW1hZ2VFbGVtZW50PihgaW1nW2RhdGEtc2VxPVwiJHt0YXJnZXRTZXF9XCJdYCk7XG4gICAgICBpZiAodGFnZ2VkICYmIHRhZ2dlZC5jb21wbGV0ZSAmJiB0YWdnZWQubmF0dXJhbFdpZHRoID49IG1pbldpZHRoICYmIHRhZ2dlZC5zcmMgJiYgIXRhZ2dlZC5zcmMuaW5jbHVkZXMoJ2Jhc2U2NCxpVkJPUncnKSkge1xuICAgICAgICByZXR1cm4gdGFnZ2VkO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJ5IGNhbmRpZGF0ZSBwYWdlIGltYWdlcyBpbnNpZGUgbWFpbiNtYWluXG4gICAgY29uc3QgaW1hZ2VzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbWFnZUVsZW1lbnQ+KFxuICAgICAgJ21haW4jbWFpbiBkZXRhaWxzIGZpZ3VyZSBkaXYuaW1hZ2UgaW1nLCBtYWluI21haW4gZGV0YWlscyBmaWd1cmUgaW1nLCBtYWluI21haW4gZGl2LnNwcmVhZCBmaWd1cmUgZGl2LmltYWdlIGltZywgbWFpbiNtYWluIGRpdi5zcHJlYWQgZmlndXJlIGltZywgbWFpbiNtYWluIGltZ1tzcmNePVwiYmxvYjpcIl0sIG1haW4jbWFpbiBpbWcnXG4gICAgKSk7XG5cbiAgICBjb25zdCB2YWxpZCA9IGltYWdlcy5maWx0ZXIoaW1nID0+XG4gICAgICBpbWcuY29tcGxldGUgJiZcbiAgICAgIGltZy5uYXR1cmFsV2lkdGggPj0gbWluV2lkdGggJiZcbiAgICAgIGltZy5zcmMgJiZcbiAgICAgICFpbWcuc3JjLmluY2x1ZGVzKCdiYXNlNjQsaVZCT1J3JykgLy8gSWdub3JlIHRyYW5zcGFyZW50IDF4MSBwbGFjZWhvbGRlclxuICAgICk7XG5cbiAgICBpZiAodmFsaWQubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIC8vIFBpY2sgaW1hZ2UgdmlzaWJsZSB3aXRoaW4gYnJvd3NlciB2aWV3cG9ydFxuICAgIGNvbnN0IHZpc2libGUgPSB2YWxpZC5maW5kKGltZyA9PiB7XG4gICAgICAvLyBJZiBpbWFnZSBpcyBleHBsaWNpdGx5IHRhZ2dlZCB3aXRoIGEgZGlmZmVyZW50IHNlcXVlbmNlLCBkbyBub3QgcGljayBpdCFcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0U2VxID09PSAnbnVtYmVyJyAmJiBpbWcuZGF0YXNldC5zZXEgJiYgcGFyc2VJbnQoaW1nLmRhdGFzZXQuc2VxLCAxMCkgIT09IHRhcmdldFNlcSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY3QgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICByZXR1cm4gcmVjdC53aWR0aCA+IDUwICYmIHJlY3QuaGVpZ2h0ID4gNTAgJiZcbiAgICAgICAgICAgICByZWN0LnRvcCA8IHdpbmRvdy5pbm5lckhlaWdodCAmJiByZWN0LmJvdHRvbSA+IDAgJiZcbiAgICAgICAgICAgICByZWN0LmxlZnQgPCB3aW5kb3cuaW5uZXJXaWR0aCAmJiByZWN0LnJpZ2h0ID4gMDtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNob3NlbiA9IHZpc2libGUgfHwgdmFsaWRbMF07XG4gICAgaWYgKGNob3NlbiAmJiB0eXBlb2YgdGFyZ2V0U2VxID09PSAnbnVtYmVyJykge1xuICAgICAgY2hvc2VuLnNldEF0dHJpYnV0ZSgnZGF0YS1zZXEnLCBTdHJpbmcodGFyZ2V0U2VxKSk7XG4gICAgICBjaG9zZW4uZGF0YXNldC5zZXEgPSBTdHJpbmcodGFyZ2V0U2VxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hvc2VuO1xuICB9XG5cbiAgYXN5bmMgZXh0cmFjdFBhZ2VUZXh0KHBhZ2VOdW06IG51bWJlciwgaW1nPzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNsZWVwID0gKG1zOiBudW1iZXIpID0+IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcblxuICAgIC8vIDEuIENoZWNrIGlmIHdlIGFscmVhZHkgcmVjZWl2ZWQgdGhlIE9DUiBIVE1MIGZyb20gdGhlIG5ldHdvcmsgaW50ZXJjZXB0aW9uXG4gICAgY29uc3QgY2FjaGVkSHRtbCA9IHRoaXMuc2VxVG9IdG1sLmdldChwYWdlTnVtKTtcbiAgICBpZiAoY2FjaGVkSHRtbCkge1xuICAgICAgY29uc3QgdGV4dCA9IHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGNhY2hlZEh0bWwpO1xuICAgICAgaWYgKHRleHQgJiYgdGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIC8vIDIuIFF1ZXJ5IERPTSBmb3IgdGFyZ2V0IHNlcXVlbmNlJ3MgZmlnY2FwdGlvbiwgcmV0cnlpbmcgYnJpZWZseSAodXAgdG8gMjUwMG1zKVxuICAgIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnQgPCAyNTAwKSB7XG4gICAgICAvLyAyYS4gSWYgaW1nIHdhcyBwYXNzZWQsIGNoZWNrIGl0cyBjbG9zZXN0IGZpZ3VyZTpcbiAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgY29uc3QgZmlndXJlID0gaW1nLmNsb3Nlc3QoJ2ZpZ3VyZScpO1xuICAgICAgICBpZiAoZmlndXJlKSB7XG4gICAgICAgICAgY29uc3QgZmlnY2FwdGlvbiA9IGZpZ3VyZS5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignZmlnY2FwdGlvbicpO1xuICAgICAgICAgIGlmIChmaWdjYXB0aW9uICYmIGZpZ2NhcHRpb24udGV4dENvbnRlbnQgJiYgZmlnY2FwdGlvbi50ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KGZpZ2NhcHRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyAyYi4gQ2hlY2sgZXhwbGljaXRseSB0YWdnZWQgZmlnY2FwdGlvbjpcbiAgICAgIGNvbnN0IHRhZ2dlZEZpZ2NhcHRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICAgICAgYGZpZ3VyZVtkYXRhLXNlcT1cIiR7cGFnZU51bX1cIl0gZmlnY2FwdGlvbiwgZmlnY2FwdGlvbltkYXRhLXNlcT1cIiR7cGFnZU51bX1cIl0sIC5zcHJlYWRbZGF0YS1zZXE9XCIke3BhZ2VOdW19XCJdIGZpZ2NhcHRpb25gXG4gICAgICApO1xuICAgICAgaWYgKHRhZ2dlZEZpZ2NhcHRpb24gJiYgdGFnZ2VkRmlnY2FwdGlvbi50ZXh0Q29udGVudCAmJiB0YWdnZWRGaWdjYXB0aW9uLnRleHRDb250ZW50LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUhhdGhpRmlnY2FwdGlvblRvVGV4dCh0YWdnZWRGaWdjYXB0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8gMmMuIEZhbGxiYWNrOiBjaGVjayBtYWluIHNwcmVhZCBkZXRhaWxzIGZpZ2NhcHRpb246XG4gICAgICBjb25zdCBzcHJlYWRGaWdjYXB0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICAgICdtYWluI21haW4gZGV0YWlscyBmaWd1cmUgZmlnY2FwdGlvbiwgbWFpbiNtYWluIGZpZ3VyZSBmaWdjYXB0aW9uLCBtYWluI21haW4gZmlnY2FwdGlvbidcbiAgICAgICk7XG4gICAgICBpZiAoc3ByZWFkRmlnY2FwdGlvbiAmJiBzcHJlYWRGaWdjYXB0aW9uLnRleHRDb250ZW50ICYmIHNwcmVhZEZpZ2NhcHRpb24udGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSGF0aGlGaWdjYXB0aW9uVG9UZXh0KHNwcmVhZEZpZ2NhcHRpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyAyZC4gQ2hlY2sgaWYgbmV0d29yayByZXNwb25zZSBhcnJpdmVkIHdoaWxlIHBvbGxpbmc6XG4gICAgICBjb25zdCBsYXRlSHRtbCA9IHRoaXMuc2VxVG9IdG1sLmdldChwYWdlTnVtKTtcbiAgICAgIGlmIChsYXRlSHRtbCkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gcGFyc2VIYXRoaUZpZ2NhcHRpb25Ub1RleHQobGF0ZUh0bWwpO1xuICAgICAgICBpZiAodGV4dCAmJiB0ZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2xlZXAoMTAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBpc0F0RW5kT2ZCb29rKGN1cnJlbnRQYWdlOiBudW1iZXIsIHRvdGFsUGFnZXM6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICh0b3RhbFBhZ2VzID4gMCAmJiBjdXJyZW50UGFnZSA+PSB0b3RhbFBhZ2VzKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXh0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudCB8IEhUTUxBbmNob3JFbGVtZW50PihcbiAgICAgICdidXR0b25bYXJpYS1sYWJlbCo9XCJOZXh0XCIgaV0sIGJ1dHRvblt0aXRsZSo9XCJOZXh0XCIgaV0sIFthY2Nlc3NrZXk9XCJuXCJdJ1xuICAgICk7XG4gICAgaWYgKG5leHRCdG4pIHtcbiAgICAgIGNvbnN0IGRpc2FibGVkID0gKG5leHRCdG4gYXMgYW55KS5kaXNhYmxlZCB8fFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0QnRuLmdldEF0dHJpYnV0ZSgnYXJpYS1kaXNhYmxlZCcpID09PSAndHJ1ZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dEJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ2Rpc2FibGVkJyk7XG4gICAgICBpZiAoZGlzYWJsZWQpIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VG90YWxQYWdlc0Zyb21Eb20oKTogbnVtYmVyIHtcbiAgICAvLyAxLiBDaGVjayBwYXJlbnQgY29udGFpbmVyIG9mICN0b29sYmFyLXNlcTogPGlucHV0IGlkPVwidG9vbGJhci1zZXFcIj4gLi4uIDxzcGFuPi88L3NwYW4+IDxzcGFuPjI3Mjwvc3Bhbj5cbiAgICBjb25zdCBzZXFJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJyN0b29sYmFyLXNlcSwgaW5wdXRbbmFtZT1cInNlcVwiXScpO1xuICAgIGlmIChzZXFJbnB1dCkge1xuICAgICAgY29uc3QgcGFyZW50ID0gc2VxSW5wdXQucGFyZW50RWxlbWVudDtcbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHBhcmVudC50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgY29uc3QgbWF0Y2ggPSB0ZXh0Lm1hdGNoKC9cXC9cXHMqKFxcZCspLyk7XG4gICAgICAgIGlmIChtYXRjaCkgcmV0dXJuIHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG5cbiAgICAgICAgY29uc3QgaHRtbE1hdGNoID0gcGFyZW50LmlubmVySFRNTC5tYXRjaCgvXFwvXFxzKjxcXC9zcGFuPlxccyo8c3Bhbj5cXHMqKFxcZCspL2kpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbm5lckhUTUwubWF0Y2goL1xcL1xccyooXFxkKykvKTtcbiAgICAgICAgaWYgKGh0bWxNYXRjaCkgcmV0dXJuIHBhcnNlSW50KGh0bWxNYXRjaFsxXSwgMTApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtYXhBdHRyID0gc2VxSW5wdXQuZ2V0QXR0cmlidXRlKCdtYXgnKTtcbiAgICAgIGlmIChtYXhBdHRyKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KG1heEF0dHIsIDEwKTtcbiAgICAgICAgaWYgKCFpc05hTih2YWwpICYmIHZhbCA+IDApIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi4gQ2hlY2sgd2luZG93Lm1hbmlmZXN0IGlmIHByZXNlbnQgaW4gcGFnZVxuICAgIGNvbnN0IHcgPSB3aW5kb3cgYXMgYW55O1xuICAgIGlmICh3Lm1hbmlmZXN0ICYmIHcubWFuaWZlc3QudG90YWxTZXEpIHtcbiAgICAgIGNvbnN0IHZhbCA9IHBhcnNlSW50KHcubWFuaWZlc3QudG90YWxTZXEsIDEwKTtcbiAgICAgIGlmICghaXNOYU4odmFsKSAmJiB2YWwgPiAwKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIC8vIDMuIENoZWNrIGdlbmVyYWwgdGV4dCBlLmcuIFwib2YgMjcyXCIgb3IgXCIvIDI3MlwiXG4gICAgY29uc3QgcGFnaW5nRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFnaW5nLCBbY2xhc3MqPVwicGFnaW5nXCJdLCBbYXJpYS1sYWJlbCo9XCJ0b3RhbCBwYWdlc1wiIGldJyk7XG4gICAgaWYgKHBhZ2luZ0VsICYmIHBhZ2luZ0VsLnRleHRDb250ZW50KSB7XG4gICAgICBjb25zdCBtID0gcGFnaW5nRWwudGV4dENvbnRlbnQubWF0Y2goL1xcL1xccyooXFxkKykvKSB8fCBwYWdpbmdFbC50ZXh0Q29udGVudC5tYXRjaCgvb2ZcXHMrKFxcZCspL2kpO1xuICAgICAgaWYgKG0pIHJldHVybiBwYXJzZUludChtWzFdLCAxMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgQm9va1Byb3ZpZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBBcmNoaXZlUHJvdmlkZXIgfSBmcm9tICcuL2FyY2hpdmUtcHJvdmlkZXInO1xuaW1wb3J0IHsgSGF0aGlUcnVzdFByb3ZpZGVyIH0gZnJvbSAnLi9oYXRoaXRydXN0LXByb3ZpZGVyJztcblxuZXhwb3J0ICogZnJvbSAnLi90eXBlcyc7XG5leHBvcnQgKiBmcm9tICcuL2FyY2hpdmUtcHJvdmlkZXInO1xuZXhwb3J0ICogZnJvbSAnLi9oYXRoaXRydXN0LXByb3ZpZGVyJztcblxuLyoqXG4gKiBSZWdpc3RyeSBvZiBzdXBwb3J0ZWQgYm9vayBzaXRlIHByb3ZpZGVycy5cbiAqL1xuY29uc3QgcHJvdmlkZXJzOiBCb29rUHJvdmlkZXJbXSA9IFtcbiAgbmV3IEFyY2hpdmVQcm92aWRlcigpLFxuICBuZXcgSGF0aGlUcnVzdFByb3ZpZGVyKCksXG5dO1xuXG4vKipcbiAqIERldGVjdHMgYW5kIHJldHVybnMgdGhlIGFjdGl2ZSBwcm92aWRlciBtYXRjaGluZyB0aGUgY3VycmVudCB3ZWJwYWdlLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBjdXJyZW50IHBhZ2UgaXMgbm90IGEgc3VwcG9ydGVkIGJvb2sgdmlld2VyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlUHJvdmlkZXIoKTogQm9va1Byb3ZpZGVyIHwgbnVsbCB7XG4gIGZvciAoY29uc3QgcHJvdmlkZXIgb2YgcHJvdmlkZXJzKSB7XG4gICAgaWYgKHByb3ZpZGVyLmlzTWF0Y2goKSkge1xuICAgICAgcmV0dXJuIHByb3ZpZGVyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsCiAgICAiLyoqXG4gKiBDb250ZW50IFNjcmlwdCAoSXNvbGF0ZWQgV29ybGQpIGZvciBBcmNoaXZlIERvd25sb2FkZXJcbiAqIE1hbmFnZXMgYXV0b21hdGlvbiwgcGFnZSBjeWNsaW5nLCB2ZXJpZmljYXRpb24sIGNhbnZhcyBjYXB0dXJlLCBhbmQgdGV4dCBmZXRjaGluZy5cbiAqL1xuXG5pbXBvcnQgeyBCb29rSW5mbywgRG93bmxvYWRlckNvbmZpZywgUHJvZ3Jlc3NTdGF0ZSwgRXh0ZW5zaW9uTWVzc2FnZSwgQnJpZGdlTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IEZsb2F0aW5nUGlsbCB9IGZyb20gJy4vcGlsbCc7XG5pbXBvcnQgeyBwYXJzZURqdnVYbWxUb1RleHQsIGJ1aWxkQm9va01hcmtkb3duLCBQYWdlVGV4dEVudHJ5IH0gZnJvbSAnLi4vdXRpbHMvbWFya2Rvd24tYnVpbGRlcic7XG5pbXBvcnQgeyBjb21waWxlSnBlZ3NUb1BkZiwgUGRmSW1hZ2VJbnB1dCB9IGZyb20gJy4uL3V0aWxzL3BkZi1idWlsZGVyJztcbmltcG9ydCB7IGZvcm1hdFN1YmRpciwgZm9ybWF0UGFnZUZpbGVuYW1lLCBzYW5pdGl6ZUZpbGVuYW1lIH0gZnJvbSAnLi4vdXRpbHMvc2FuaXRpemVyJztcbmltcG9ydCB7IGdldEFjdGl2ZVByb3ZpZGVyLCBCb29rUHJvdmlkZXIsIEFyY2hpdmVQcm92aWRlciwgSGF0aGlUcnVzdFByb3ZpZGVyIH0gZnJvbSAnLi4vcHJvdmlkZXJzJztcblxuKGZ1bmN0aW9uIGluaXRDb250ZW50U2NyaXB0KCkge1xuICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBJbml0aWFsaXplZCBvbicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblxuICBjb25zdCBwcm92aWRlcjogQm9va1Byb3ZpZGVyIHwgbnVsbCA9IGdldEFjdGl2ZVByb3ZpZGVyKCk7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBObyBtYXRjaGluZyBib29rIHByb3ZpZGVyIGZvcicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gQWN0aXZlIHByb3ZpZGVyOiAke3Byb3ZpZGVyLnNpdGVOYW1lfSAoJHtwcm92aWRlci5zaXRlSWR9KWApO1xuXG4gIC8vIFN0YXRlXG4gIGxldCBib29rSW5mbzogQm9va0luZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGlzUnVubmluZyA9IGZhbHNlO1xuICBsZXQgaXNQYXVzZWQgPSBmYWxzZTtcbiAgbGV0IHN0b3BSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgbGV0IGN1cnJlbnRQYWdlID0gcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZTtcbiAgbGV0IGRvd25sb2FkZWRQYWdlcyA9IDA7XG4gIGxldCBmYWlsZWRQYWdlcyA9IDA7XG4gIGxldCBjdXJyZW50UmV0cnlDb3VudCA9IDA7XG4gIGxldCBsYXN0RGltZW5zaW9ucyA9IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xuICBsZXQgY29sbGVjdGVkSW1hZ2VzOiBQZGZJbWFnZUlucHV0W10gPSBbXTtcbiAgbGV0IGNvbGxlY3RlZFRleHRzOiBQYWdlVGV4dEVudHJ5W10gPSBbXTtcbiAgbGV0IGlzRW5kT2ZCb29rID0gZmFsc2U7XG5cbiAgaW50ZXJmYWNlIEh0dHBFcnJvckluZm8ge1xuICAgIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgICB1cmw6IHN0cmluZztcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgICByZXRyeUFmdGVyPzogbnVtYmVyO1xuICB9XG5cbiAgbGV0IGxhc3RIdHRwRXJyb3I6IEh0dHBFcnJvckluZm8gfCBudWxsID0gbnVsbDtcbiAgbGV0IGNvbnNlY3V0aXZlRXJyb3JDb3VudCA9IDA7XG5cbiAgZnVuY3Rpb24gb25IdHRwRXJyb3JSZWNlaXZlZChzdGF0dXNDb2RlOiBudW1iZXIsIHVybDogc3RyaW5nLCByZXRyeUFmdGVyPzogbnVtYmVyKSB7XG4gICAgY29uc3QgaXNCb29rUmVsYXRlZCA9XG4gICAgICB1cmwuaW5jbHVkZXMoJ2ltZ3NydicpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ0Jvb2tSZWFkZXInKSB8fFxuICAgICAgdXJsLmluY2x1ZGVzKCcvY2dpL3B0JykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnZGV0YWlscycpIHx8XG4gICAgICB1cmwuaW5jbHVkZXMoJ2hhdGhpdHJ1c3Qub3JnJykgfHxcbiAgICAgIHVybC5pbmNsdWRlcygnYXJjaGl2ZS5vcmcnKTtcblxuICAgIGlmICghaXNCb29rUmVsYXRlZCkgcmV0dXJuO1xuXG4gICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIEhUVFAgZXJyb3IgJHtzdGF0dXNDb2RlfSBkZXRlY3RlZCBmb3IgJHt1cmx9YCk7XG4gICAgbGFzdEh0dHBFcnJvciA9IHtcbiAgICAgIHN0YXR1c0NvZGUsXG4gICAgICB1cmwsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICByZXRyeUFmdGVyLFxuICAgIH07XG4gIH1cblxuICAvLyBMb2FkIHNhdmVkIHNldHRpbmdzIGZyb20gbG9jYWxTdG9yYWdlIGZpcnN0XG4gIGNvbnN0IGxvY2FsU2F2ZVBhdGggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX3NhdmVfcGF0aCcpO1xuICBjb25zdCBsb2NhbEZvbGRlclBhdHRlcm4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX2ZvbGRlcl9wYXR0ZXJuJyk7XG4gIGNvbnN0IGxvY2FsU3RhcnRQYWdlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJyk7XG4gIGNvbnN0IGxvY2FsRW5kUGFnZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnKTtcbiAgY29uc3QgbG9jYWxNYXhIZWlnaHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZV9kb3dubG9hZGVyX21heF9oZWlnaHQnKTtcblxuICBsZXQgaW5pdGlhbFN0YXJ0UGFnZSA9IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2U7XG4gIGlmIChsb2NhbFN0YXJ0UGFnZSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KGxvY2FsU3RhcnRQYWdlLCAxMCk7XG4gICAgaWYgKCFpc05hTihwYXJzZWQpICYmIHBhcnNlZCA+PSBwcm92aWRlci5kZWZhdWx0U3RhcnRQYWdlKSB7XG4gICAgICBpbml0aWFsU3RhcnRQYWdlID0gcGFyc2VkO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRlZmF1bHRDb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7XG4gICAgYmFzZURpcjogbG9jYWxTYXZlUGF0aCB8fCAnQXJjaGl2ZUJvb2tzJyxcbiAgICBmb2xkZXJQYXR0ZXJuOiBsb2NhbEZvbGRlclBhdHRlcm4gfHwgJ3t0aXRsZX1fe2lkfScsXG4gICAgc2F2ZUltYWdlczogZmFsc2UsXG4gICAgZ2VuZXJhdGVQZGY6IHRydWUsXG4gICAgc2F2ZVRleHRNZDogdHJ1ZSxcbiAgICBpbWFnZVF1YWxpdHk6IDAuNzUsXG4gICAgbWF4UGFnZUhlaWdodDogbG9jYWxNYXhIZWlnaHQgIT09IG51bGwgPyBNYXRoLm1heCgwLCBwYXJzZUludChsb2NhbE1heEhlaWdodCwgMTApKSA6IDAsXG4gICAgcGFnZURlbGF5TXM6IDUwMCxcbiAgICBwYWdlQ2hhbmdlVGltZW91dE1zOiAxMDAwMCxcbiAgICBtYXhSZXRyaWVzOiAxMCxcbiAgICBhdXRvU2luZ2xlUGFnZTogdHJ1ZSxcbiAgICBzdGFydFBhZ2U6IGluaXRpYWxTdGFydFBhZ2UsXG4gICAgZW5kUGFnZTogbG9jYWxFbmRQYWdlICE9PSBudWxsID8gTWF0aC5tYXgoMCwgcGFyc2VJbnQobG9jYWxFbmRQYWdlLCAxMCkpIDogMCxcbiAgICBkZWxldGVJbWFnZXNPbkNvbXBsZXRlOiB0cnVlLFxuICB9O1xuXG4gIGxldCBjb25maWc6IERvd25sb2FkZXJDb25maWcgPSB7IC4uLmRlZmF1bHRDb25maWcgfTtcblxuICBmdW5jdGlvbiBzYXZlQ29uZmlnKHVwZGF0ZWQ6IFBhcnRpYWw8RG93bmxvYWRlckNvbmZpZz4pIHtcbiAgICBjb25maWcgPSB7IC4uLmNvbmZpZywgLi4udXBkYXRlZCB9O1xuICAgIGlmIChjb25maWcuYmFzZURpcikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zYXZlX3BhdGgnLCBjb25maWcuYmFzZURpcik7XG4gICAgfVxuICAgIGlmIChjb25maWcuZm9sZGVyUGF0dGVybikge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9mb2xkZXJfcGF0dGVybicsIGNvbmZpZy5mb2xkZXJQYXR0ZXJuKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuc3RhcnRQYWdlID09PSAnbnVtYmVyJykge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyY2hpdmVfZG93bmxvYWRlcl9zdGFydF9wYWdlJywgU3RyaW5nKGNvbmZpZy5zdGFydFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcuZW5kUGFnZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfZW5kX3BhZ2UnLCBTdHJpbmcoY29uZmlnLmVuZFBhZ2UpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb25maWcubWF4UGFnZUhlaWdodCA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfbWF4X2hlaWdodCcsIFN0cmluZyhjb25maWcubWF4UGFnZUhlaWdodCkpO1xuICAgIH1cbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IGRvd25sb2FkZXJDb25maWc6IGNvbmZpZyB9KTtcbiAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICB9XG5cbiAgLy8gTG9hZCB1c2VyIGNvbmZpZyBmcm9tIGNocm9tZS5zdG9yYWdlXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFsnbGliZXJhdG9yQ29uZmlnJywgJ2Rvd25sb2FkZXJDb25maWcnXSwgKHJlcykgPT4ge1xuICAgIGNvbnN0IHNhdmVkID0gcmVzLmRvd25sb2FkZXJDb25maWcgfHwgcmVzLmxpYmVyYXRvckNvbmZpZztcbiAgICBpZiAoc2F2ZWQpIHtcbiAgICAgIGNvbnN0IGxvY2FsUGF0aCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlX2Rvd25sb2FkZXJfc2F2ZV9wYXRoJyk7XG4gICAgICBjb25maWcgPSB7XG4gICAgICAgIC4uLmRlZmF1bHRDb25maWcsXG4gICAgICAgIC4uLnNhdmVkLFxuICAgICAgICAuLi4obG9jYWxQYXRoID8geyBiYXNlRGlyOiBsb2NhbFBhdGggfSA6IHt9KSxcbiAgICAgIH07XG4gICAgICBwaWxsLnNldENvbmZpZyhjb25maWcpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gRmxvYXRpbmcgUGlsbCBVSSB3aXRoIGZ1bGwgY2FsbGJhY2tzXG4gIGNvbnN0IHBpbGwgPSBuZXcgRmxvYXRpbmdQaWxsKHtcbiAgICBvblN0YXJ0OiAoKSA9PiBzdGFydERvd25sb2FkKCksXG4gICAgb25QYXVzZTogKCkgPT4gcGF1c2VEb3dubG9hZCgpLFxuICAgIG9uUmVzdW1lOiAoKSA9PiByZXN1bWVEb3dubG9hZCgpLFxuICAgIG9uU3RvcDogKCkgPT4gaGFuZGxlU3RvcFJlcXVlc3QoKSxcbiAgICBvblNhdmVTZXR0aW5nczogKG5ld1NldHRpbmdzKSA9PiB7XG4gICAgICBzYXZlQ29uZmlnKG5ld1NldHRpbmdzKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFNldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZTonLCBuZXdTZXR0aW5ncyk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogaXNSdW5uaW5nID8gKGlzUGF1c2VkID8gJ3BhdXNlZCcgOiAnZG93bmxvYWRpbmcnKSA6ICdpZGxlJyxcbiAgICAgICAgc3RhdHVzVGV4dDogJ1NldHRpbmdzIHNhdmVkIHRvIGxvY2FsU3RvcmFnZScsXG4gICAgICB9KTtcbiAgICB9LFxuICAgIG9uU3dpdGNoTW9kZTogKCkgPT4gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCksXG4gICAgb25WaWV3RmlsZTogKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gT3BlbmluZyBkb3dubG9hZGVkIGZpbGUgaW4gRmluZGVyL0V4cGxvcmVyLi4uJyk7XG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdPUEVOX0RPV05MT0FEJyB9KTtcbiAgICB9LFxuICB9KTtcblxuICBpZiAocGlsbC5zaG91bGRSZW5kZXIoKSkge1xuICAgIHBpbGwucmVuZGVyKCk7XG4gICAgcGlsbC5zZXRDb25maWcoY29uZmlnKTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hCb29rSW5mbygpIHtcbiAgICBjb25zdCBkZXRlY3RlZCA9IGF3YWl0IHByb3ZpZGVyLmRldGVjdEJvb2tJbmZvKCk7XG4gICAgaWYgKGRldGVjdGVkKSB7XG4gICAgICBib29rSW5mbyA9IGRldGVjdGVkO1xuICAgICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJjaGl2ZVByb3ZpZGVyKSB7XG4gICAgICAgIHByb3ZpZGVyLnNldEJvb2tJbmZvKGJvb2tJbmZvKTtcbiAgICAgIH1cbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID8/IHByb3ZpZGVyLmRlZmF1bHRTdGFydFBhZ2UsXG4gICAgICAgIGJvb2tJbmZvLnRvdGFsUGFnZXMsXG4gICAgICAgICdSZWFkeScsXG4gICAgICAgICdub3JtYWwnLFxuICAgICAgICBpc1BhdXNlZCxcbiAgICAgICAgaXNSdW5uaW5nLFxuICAgICAgICBib29rSW5mby5jdXJyZW50TW9kZSA/PyAxLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQnJpZGdlIGxpc3RlbmVyIGZvciBNQUlOIHdvcmxkIGV2ZW50cyAoSFRUUCBlcnJvciBpbnRlcmNlcHRpb24gJiBBcmNoaXZlLm9yZyBCb29rUmVhZGVyKVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ0ZST01fQlJJREdFJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGEgYXMgQnJpZGdlTWVzc2FnZTtcblxuICAgIC8vIEludGVyY2VwdCBhbnkgbm9uLTIwMCBIVFRQIHN0YXR1cyAoNDI5LCA1MDAsIDQwMSwgZXRjLilcbiAgICBpZiAobXNnLmV2ZW50ID09PSAnSFRUUF9FUlJPUicpIHtcbiAgICAgIG9uSHR0cEVycm9yUmVjZWl2ZWQobXNnLnN0YXR1c0NvZGUsIG1zZy51cmwsIG1zZy5yZXRyeUFmdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3J3YXJkIEhhdGhpVHJ1c3QgcGFnZSBhbm5vdW5jZW1lbnRzLCBpbWFnZXMsIGFuZCBPQ1IgdGV4dCB0byBwcm92aWRlclxuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEhhdGhpVHJ1c3RQcm92aWRlcikge1xuICAgICAgaWYgKG1zZy5ldmVudCA9PT0gJ1BBR0VfTE9BRF9BTk5PVU5DRUQnKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZUxvYWRBbm5vdW5jZWQobXNnLnNlcSwgbXNnLmlzVmlzaWJsZSwgbXNnLmlzTG9hZGVkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX0lNQUdFX1JFQURZJykge1xuICAgICAgICBwcm92aWRlci5vblBhZ2VJbWFnZVJlYWR5KG1zZy5zZXEsIG1zZy5ibG9iVXJsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdQQUdFX1RFWFRfUkVBRFknKSB7XG4gICAgICAgIHByb3ZpZGVyLm9uUGFnZVRleHRSZWFkeShtc2cuc2VxLCBtc2cuaHRtbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXNnLmV2ZW50ID09PSAnQk9PS19JTkZPJykge1xuICAgICAgYm9va0luZm8gPSBtc2cuZGF0YTtcbiAgICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFyY2hpdmVQcm92aWRlcikge1xuICAgICAgICBwcm92aWRlci5zZXRCb29rSW5mbyhib29rSW5mbyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvbUN1cnJlbnQgPSBwcm92aWRlci5nZXRDdXJyZW50UGFnZSgpO1xuICAgICAgaWYgKGRvbUN1cnJlbnQgIT09IG51bGwgJiYgKCFib29rSW5mby50b3RhbFBhZ2VzIHx8IGRvbUN1cnJlbnQgPiAoYm9va0luZm8uY3VycmVudExlYWYgPz8gMCkpKSB7XG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRMZWFmID0gZG9tQ3VycmVudDtcbiAgICAgIH1cblxuICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgYm9va0luZm8uY3VycmVudExlYWYgPz8gMCxcbiAgICAgICAgYm9va0luZm8udG90YWxQYWdlcyxcbiAgICAgICAgJ1JlYWR5JyxcbiAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgIGlzUGF1c2VkLFxuICAgICAgICBpc1J1bm5pbmcsXG4gICAgICAgIGJvb2tJbmZvLmN1cnJlbnRNb2RlLFxuICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgKTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKCk7XG4gICAgfSBlbHNlIGlmIChtc2cuZXZlbnQgPT09ICdNT0RFX0NIQU5HRUQnKSB7XG4gICAgICBpZiAoYm9va0luZm8pIHtcbiAgICAgICAgYm9va0luZm8uY3VycmVudE1vZGUgPSBtc2cubW9kZTtcbiAgICAgICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgICBib29rSW5mby50b3RhbFBhZ2VzLFxuICAgICAgICAgICcxLVBhZ2UgTW9kZSBBY3RpdmUnLFxuICAgICAgICAgICdub3JtYWwnLFxuICAgICAgICAgIGlzUGF1c2VkLFxuICAgICAgICAgIGlzUnVubmluZyxcbiAgICAgICAgICBtc2cubW9kZSxcbiAgICAgICAgICBsYXN0RGltZW5zaW9uc1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gSW5pdGlhbCBkZXRlY3Rpb25cbiAgcmVmcmVzaEJvb2tJbmZvKCk7XG4gIHNldFRpbWVvdXQoKCkgPT4gcmVmcmVzaEJvb2tJbmZvKCksIDgwMCk7XG5cbiAgLy8gTmV0d29yayBjb25uZWN0aW9uIGxpc3RlbmVyc1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLndhcm4oJ1tBcmNoaXZlRG93bmxvYWRlcl0gTmV0d29yayBjb25uZWN0aW9uIGxvc3QgKG9mZmxpbmUpJyk7XG4gICAgaWYgKGlzUnVubmluZyAmJiAhaXNQYXVzZWQpIHtcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIHBpbGwudXBkYXRlUHJvZ3Jlc3MoXG4gICAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgICBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwLFxuICAgICAgICAnT2ZmbGluZSAtIFBhdXNlZCcsXG4gICAgICAgICdvZmZsaW5lJyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICAgIGxhc3REaW1lbnNpb25zXG4gICAgICApO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdvZmZsaW5lJywgaXNPZmZsaW5lOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBOZXR3b3JrIGNvbm5lY3Rpb24gcmVzdG9yZWQgKG9ubGluZSknKTtcbiAgICBpZiAoaXNSdW5uaW5nICYmIGlzUGF1c2VkKSB7XG4gICAgICBwaWxsLnVwZGF0ZVByb2dyZXNzKFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgYm9va0luZm8/LnRvdGFsUGFnZXMgfHwgMCxcbiAgICAgICAgJ09ubGluZSAtIENsaWNrIENPTlRJTlVFJyxcbiAgICAgICAgJ3N0YWxsZWQnLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlLFxuICAgICAgICBib29rSW5mbz8uY3VycmVudE1vZGUgfHwgMSxcbiAgICAgICAgbGFzdERpbWVuc2lvbnNcbiAgICAgICk7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3N0YWxsZWQnLCBpc09mZmxpbmU6IGZhbHNlIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gSGVscGVyc1xuICBjb25zdCBzbGVlcCA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcblxuICBmdW5jdGlvbiBicm9hZGNhc3RTdGF0ZShleHRyYTogUGFydGlhbDxQcm9ncmVzc1N0YXRlPiA9IHt9KSB7XG4gICAgY29uc3QgdG90YWwgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjb25maWcuZW5kUGFnZSB8fCAxO1xuICAgIGxldCBzdGF0dXNUeXBlOiAnbm9ybWFsJyB8ICdyZXRyeWluZycgfCAnb2ZmbGluZScgfCAnc3RhbGxlZCcgfCAnY29tcGxldGUnID0gJ25vcm1hbCc7XG5cbiAgICBpZiAoZXh0cmEuc3RhdHVzID09PSAnc3RhbGxlZCcpIHN0YXR1c1R5cGUgPSAnc3RhbGxlZCc7XG4gICAgZWxzZSBpZiAoZXh0cmEuc3RhdHVzID09PSAncmV0cnlpbmcnKSBzdGF0dXNUeXBlID0gJ3JldHJ5aW5nJztcbiAgICBlbHNlIGlmICghbmF2aWdhdG9yLm9uTGluZSkgc3RhdHVzVHlwZSA9ICdvZmZsaW5lJztcbiAgICBlbHNlIGlmIChleHRyYS5zdGF0dXMgPT09ICdjb21wbGV0ZScpIHN0YXR1c1R5cGUgPSAnY29tcGxldGUnO1xuXG4gICAgY29uc3Qgc3RhdGU6IFByb2dyZXNzU3RhdGUgPSB7XG4gICAgICBzdGF0dXM6IGlzUnVubmluZyA/IChpc1BhdXNlZCA/IChzdGF0dXNUeXBlID09PSAnc3RhbGxlZCcgPyAnc3RhbGxlZCcgOiAncGF1c2VkJykgOiAnZG93bmxvYWRpbmcnKSA6IChleHRyYS5zdGF0dXMgfHwgJ2lkbGUnKSxcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWxQYWdlczogdG90YWwsXG4gICAgICBkb3dubG9hZGVkUGFnZXMsXG4gICAgICBmYWlsZWRQYWdlcyxcbiAgICAgIHJldHJ5Q291bnQ6IGN1cnJlbnRSZXRyeUNvdW50LFxuICAgICAgc3RhdHVzVGV4dDogaXNQYXVzZWQgPyAoc3RhdHVzVHlwZSA9PT0gJ3N0YWxsZWQnID8gJ1N0YWxsZWQgLSBDbGljayBDT05USU5VRScgOiAnUGF1c2VkJykgOiAoaXNSdW5uaW5nID8gYENhcHR1cmluZyBwYWdlICR7Y3VycmVudFBhZ2V9YCA6ICdSZWFkeScpLFxuICAgICAgYm9va0luZm86IGJvb2tJbmZvIHx8IHVuZGVmaW5lZCxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNPZmZsaW5lOiAhbmF2aWdhdG9yLm9uTGluZSxcbiAgICAgIGltYWdlRGltZW5zaW9uczogbGFzdERpbWVuc2lvbnMsXG4gICAgICAuLi5leHRyYSxcbiAgICB9O1xuXG4gICAgcGlsbC51cGRhdGVQcm9ncmVzcyhcbiAgICAgIGN1cnJlbnRQYWdlLFxuICAgICAgdG90YWwsXG4gICAgICBzdGF0ZS5zdGF0dXNUZXh0LFxuICAgICAgc3RhdHVzVHlwZSxcbiAgICAgIGlzUGF1c2VkLFxuICAgICAgaXNSdW5uaW5nLFxuICAgICAgYm9va0luZm8/LmN1cnJlbnRNb2RlIHx8IDEsXG4gICAgICBsYXN0RGltZW5zaW9uc1xuICAgICk7XG5cbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdTVEFURV9VUERBVEUnLCBzdGF0ZSB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRW5mb3JjZXMgMS1wYWdlIHZpZXcgbW9kZSB2aWEgcHJvdmlkZXIgaWYgc3VwcG9ydGVkLlxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChwcm92aWRlci5lbmZvcmNlU2luZ2xlUGFnZU1vZGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEVuZm9yY2luZyBzaW5nbGUtcGFnZSBtb2RlIG9uICR7cHJvdmlkZXIuc2l0ZU5hbWV9Li4uYCk7XG4gICAgICByZXR1cm4gYXdhaXQgcHJvdmlkZXIuZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhcHR1cmVzIGltYWdlIGZyb20gRE9NIGVsZW1lbnQgdG8gSlBFRyBEYXRhIFVSTCB1c2luZyBhbiBvZmZzY3JlZW4gY2FudmFzLlxuICAgKiBQcm9wb3J0aWFuYWxseSBkb3duc2NhbGVzIGlmIG1heFBhZ2VIZWlnaHQgPiAwIGFuZCBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0LlxuICAgKiBJZiBjYW52YXMgaXMgdGFpbnRlZCBieSBjcm9zcy1vcmlnaW4gcmVzb3VyY2VzLCBjbGVhbmx5IHJlY292ZXJzIHZpYSBibG9iIGZldGNoL2JhY2tncm91bmQgcHJveHkuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBjYXB0dXJlSW1hZ2VUb0RhdGFVcmwoaW1nOiBIVE1MSW1hZ2VFbGVtZW50LCBxdWFsaXR5ID0gMC43NSwgbWF4UGFnZUhlaWdodCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCB3aWR0aCA9IGltZy5uYXR1cmFsV2lkdGggfHwgaW1nLndpZHRoIHx8IDA7XG4gICAgbGV0IGhlaWdodCA9IGltZy5uYXR1cmFsSGVpZ2h0IHx8IGltZy5oZWlnaHQgfHwgMDtcblxuICAgIGlmIChtYXhQYWdlSGVpZ2h0ID4gMCAmJiBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0KSB7XG4gICAgICBjb25zdCBzY2FsZSA9IG1heFBhZ2VIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICB3aWR0aCA9IE1hdGgucm91bmQod2lkdGggKiBzY2FsZSk7XG4gICAgICBoZWlnaHQgPSBtYXhQYWdlSGVpZ2h0O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgaWYgKCFjdHgpIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IG9idGFpbiBjYW52YXMgMkQgY29udGV4dCcpO1xuXG4gICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIHF1YWxpdHkpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAvLyBUYWludGVkIGNhbnZhcyByZWNvdmVyeSAoY3Jvc3Mtb3JpZ2luIENETiBvciBwcm90ZWN0ZWQgcGFnZXMpXG4gICAgICBpZiAoZXJyLm5hbWUgPT09ICdTZWN1cml0eUVycm9yJyB8fCBTdHJpbmcoZXJyKS5pbmNsdWRlcygnVGFpbnRlZCcpIHx8IFN0cmluZyhlcnIpLmluY2x1ZGVzKCdTZWN1cml0eUVycm9yJykpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIENhbnZhcyB0YWludGVkIGZvciAke2ltZy5zcmN9LiBSZWNvdmVyaW5nIHZpYSBjbGVhbiBibG9iIGZldGNoLi4uYCk7XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaENsZWFuRGF0YVVybChpbWcuc3JjLCBxdWFsaXR5LCBtYXhQYWdlSGVpZ2h0KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBibG9iVG9EYXRhVXJsKGJsb2I6IEJsb2IpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHJlc29sdmUocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNjYWxlRGF0YVVybChkYXRhVXJsOiBzdHJpbmcsIHF1YWxpdHkgPSAwLjc1LCBtYXhQYWdlSGVpZ2h0ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKG1heFBhZ2VIZWlnaHQgPD0gMCkgcmV0dXJuIGRhdGFVcmw7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIGxldCB3aWR0aCA9IGltZy5uYXR1cmFsV2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodDtcbiAgICAgICAgaWYgKGhlaWdodCA+IG1heFBhZ2VIZWlnaHQpIHtcbiAgICAgICAgICBjb25zdCBzY2FsZSA9IG1heFBhZ2VIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoICogc2NhbGUpO1xuICAgICAgICAgIGhlaWdodCA9IG1heFBhZ2VIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgaWYgKCFjdHgpIHJldHVybiByZXNvbHZlKGRhdGFVcmwpO1xuICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIHJlc29sdmUoY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIHF1YWxpdHkpKTtcbiAgICAgIH07XG4gICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlc29sdmUoZGF0YVVybCk7XG4gICAgICBpbWcuc3JjID0gZGF0YVVybDtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIGZldGNoQ2xlYW5EYXRhVXJsKHVybDogc3RyaW5nLCBxdWFsaXR5ID0gMC43NSwgbWF4UGFnZUhlaWdodCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBibG9iOiBCbG9iIHwgbnVsbCA9IG51bGw7XG5cbiAgICAvLyAxLiBMb2NhbCBmZXRjaCAoZmFzdCBwYXRoIGZvciBibG9iOiBhbmQgQ09SUy1lbmFibGVkIGVuZHBvaW50cylcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7IGNyZWRlbnRpYWxzOiAnaW5jbHVkZScgfSk7XG4gICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgIGJsb2IgPSBhd2FpdCByZXMuYmxvYigpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAvLyAyLiBCYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyIGZldGNoIChpbW11bmUgdG8gQ09SUyByZXN0cmljdGlvbnMgd2l0aCBob3N0X3Blcm1pc3Npb25zKVxuICAgIGlmICghYmxvYikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYmdSZXM6IGFueSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgICB7IHR5cGU6ICdGRVRDSF9JTUFHRV9EQVRBX1VSTCcsIHVybCB9LFxuICAgICAgICAgICAgKHJlc3BvbnNlKSA9PiByZXNvbHZlKHJlc3BvbnNlIHx8IHsgc3VjY2VzczogZmFsc2UgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGJnUmVzICYmIGJnUmVzLnN1Y2Nlc3MgJiYgYmdSZXMuZGF0YVVybCkge1xuICAgICAgICAgIGlmIChtYXhQYWdlSGVpZ2h0IDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiBiZ1Jlcy5kYXRhVXJsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYXdhaXQgc2NhbGVEYXRhVXJsKGJnUmVzLmRhdGFVcmwsIHF1YWxpdHksIG1heFBhZ2VIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cblxuICAgIGlmIChibG9iKSB7XG4gICAgICBpZiAobWF4UGFnZUhlaWdodCA8PSAwKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBibG9iVG9EYXRhVXJsKGJsb2IpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYml0bWFwID0gYXdhaXQgY3JlYXRlSW1hZ2VCaXRtYXAoYmxvYik7XG4gICAgICAgIGxldCB3aWR0aCA9IGJpdG1hcC53aWR0aDtcbiAgICAgICAgbGV0IGhlaWdodCA9IGJpdG1hcC5oZWlnaHQ7XG4gICAgICAgIGlmIChtYXhQYWdlSGVpZ2h0ID4gMCAmJiBoZWlnaHQgPiBtYXhQYWdlSGVpZ2h0KSB7XG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSBtYXhQYWdlSGVpZ2h0IC8gaGVpZ2h0O1xuICAgICAgICAgIHdpZHRoID0gTWF0aC5yb3VuZCh3aWR0aCAqIHNjYWxlKTtcbiAgICAgICAgICBoZWlnaHQgPSBtYXhQYWdlSGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGlmIChjdHgpIHtcbiAgICAgICAgICBjdHguZHJhd0ltYWdlKGJpdG1hcCwgMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCBxdWFsaXR5KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIHJldHVybiBhd2FpdCBibG9iVG9EYXRhVXJsKGJsb2IpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGV4cG9ydCBpbWFnZSBmcm9tICR7dXJsfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbm9uLTIwMCBIVFRQIHJlc3BvbnNlcyAoNDI5LCA1MDAsIDUwMiwgNTAzLCA0MDEsIDQwMywgZXRjLilcbiAgICogLSA0MDEvNDAzOiBQYXVzZXMgZG93bmxvYWQgdG8gbGV0IHVzZXIgYXV0aGVudGljYXRlIG9yIHJlbmV3IGxvYW5cbiAgICogLSA0MjkgJiA1eHg6IEluaXRpYXRlcyBleHBvbmVudGlhbCBiYWNrb2ZmIHdpdGggbGl2ZSBjb3VudGRvd24gYW5kIGluY3JlYXNlcyBwYWNpbmdcbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyOiBIdHRwRXJyb3JJbmZvLCB0YXJnZXRQYWdlTnVtOiBudW1iZXIpIHtcbiAgICBjb25zZWN1dGl2ZUVycm9yQ291bnQrKztcblxuICAgIC8vIDQwMSAvIDQwMzogQXV0aC9Gb3JiaWRkZW5cbiAgICBpZiAoZXJyLnN0YXR1c0NvZGUgPT09IDQwMSB8fCBlcnIuc3RhdHVzQ29kZSA9PT0gNDAzKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbQXJjaGl2ZURvd25sb2FkZXJdIEFjY2VzcyByZXN0cmljdGVkIChIVFRQICR7ZXJyLnN0YXR1c0NvZGV9KSBvbiAke2Vyci51cmx9LiBQYXVzaW5nLmApO1xuICAgICAgaXNQYXVzZWQgPSB0cnVlO1xuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdwYXVzZWQnLFxuICAgICAgICBzdGF0dXNUZXh0OiBgQWNjZXNzIHJlc3RyaWN0ZWQgKEhUVFAgJHtlcnIuc3RhdHVzQ29kZX0pLiBQbGVhc2UgY2hlY2sgbG9naW4gb3IgbG9hbiBzdGF0dXMuYCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJhdGUgTGltaXRpbmcgKDQyOSkgJiBTZXJ2ZXIgRXJyb3JzICg1MDAsIDUwMiwgNTAzLCA1MDQpXG4gICAgLy8gSWYgdGhlIHNlcnZlciBleHBsaWNpdGx5IHNwZWNpZmllcyBSZXRyeS1BZnRlciwgaG9ub3IgaXQuXG4gICAgLy8gT3RoZXJ3aXNlIGZhbGxiYWNrIHRvIGV4cG9uZW50aWFsIGJhY2tvZmY6IDEwcywgMjBzLCA0MHMsIGNhcHBlZCBhdCA2MHMuXG4gICAgY29uc3QgaXNTZXJ2ZXJSZXF1ZXN0ZWQgPSB0eXBlb2YgZXJyLnJldHJ5QWZ0ZXIgPT09ICdudW1iZXInICYmICFpc05hTihlcnIucmV0cnlBZnRlcikgJiYgZXJyLnJldHJ5QWZ0ZXIgPiAwO1xuICAgIGNvbnN0IGJhc2VTZWNvbmRzID0gaXNTZXJ2ZXJSZXF1ZXN0ZWRcbiAgICAgID8gZXJyLnJldHJ5QWZ0ZXJcbiAgICAgIDogTWF0aC5taW4oMTAgKiBNYXRoLnBvdygyLCBNYXRoLm1heCgwLCBjb25zZWN1dGl2ZUVycm9yQ291bnQgLSAxKSksIDYwKTtcblxuICAgIC8vIEF1dG9tYXRpY2FsbHkgaW5jcmVhc2UgaW50ZXItcGFnZSBwYWNpbmcgZGVsYXkgdG8gcHJldmVudCByZWN1cnJpbmcgZXJyb3JzXG4gICAgY29uc3QgcHJldkRlbGF5ID0gY29uZmlnLnBhZ2VEZWxheU1zO1xuICAgIGNvbmZpZy5wYWdlRGVsYXlNcyA9IE1hdGgubWluKE1hdGgubWF4KGNvbmZpZy5wYWdlRGVsYXlNcywgMTUwMCkgKyA1MDAsIDUwMDApO1xuICAgIGlmIChjb25maWcucGFnZURlbGF5TXMgIT09IHByZXZEZWxheSkge1xuICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gSW5jcmVhc2VkIHBhZ2UgcGFjaW5nIGRlbGF5IHRvICR7Y29uZmlnLnBhZ2VEZWxheU1zfW1zLmApO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IGVyci5zdGF0dXNDb2RlID09PSA0MjlcbiAgICAgID8gJ1JhdGUgTGltaXRlZCdcbiAgICAgIDogKGVyci5zdGF0dXNDb2RlID49IDUwMCA/IGBTZXJ2ZXIgRXJyb3IgKCR7ZXJyLnN0YXR1c0NvZGV9KWAgOiBgSFRUUCAke2Vyci5zdGF0dXNDb2RlfWApO1xuXG4gICAgaWYgKGlzU2VydmVyUmVxdWVzdGVkKSB7XG4gICAgICBsYWJlbCArPSAnIChzZXJ2ZXIgYXNrZWQpJztcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gJHtsYWJlbH0gb24gJHtlcnIudXJsfS4gQmFja2luZyBvZmYgZm9yICR7TWF0aC5yb3VuZChiYXNlU2Vjb25kcyl9cy4uLmApO1xuXG4gICAgZm9yIChsZXQgcmVtYWluaW5nID0gTWF0aC5yb3VuZChiYXNlU2Vjb25kcyk7IHJlbWFpbmluZyA+IDA7IHJlbWFpbmluZy0tKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgcmV0dXJuO1xuICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm47XG4gICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERpc3BsYXkgaW4gbWludXRlcyBpZiBtb3JlIHRoYW4gMTIwcywgb3RoZXJ3aXNlIGluIHNlY29uZHNcbiAgICAgIGNvbnN0IHRpbWVTdHIgPSByZW1haW5pbmcgPiAxMjBcbiAgICAgICAgPyBgJHtNYXRoLnJvdW5kKHJlbWFpbmluZyAvIDYwKX1tYFxuICAgICAgICA6IGAke3JlbWFpbmluZ31zYDtcblxuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdyZXRyeWluZycsXG4gICAgICAgIHJldHJ5Q291bnQ6IGNvbnNlY3V0aXZlRXJyb3JDb3VudCxcbiAgICAgICAgc3RhdHVzVGV4dDogYCR7dGltZVN0cn0gUmV0cnlpbmc6ICR7bGFiZWx9LmAsXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHNsZWVwKDEwMDApO1xuICAgIH1cblxuICAgIC8vIEJhY2tvZmYgY29tcGxldGUhIFJlLW5hdmlnYXRlIHRvIHRhcmdldFBhZ2VOdW0gc28gcmVhZGVyIHJlLWZldGNoZXMgY2xlYW5seVxuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEJhY2tvZmYgY29tcGxldGVkLiBSZS1yZXF1ZXN0aW5nIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4uLmApO1xuICAgIGF3YWl0IHByb3ZpZGVyLnRyaWdnZXJQYWdlRmxpcCh0YXJnZXRQYWdlTnVtKTtcbiAgICBhd2FpdCBzbGVlcCg4MDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEZhc3QgUGFnZSBUdXJuICYgV2FpdCBFbmdpbmU6XG4gICAqIDEuIFRyaWdnZXJzIHBhZ2UgZmxpcCB2aWEgcHJvdmlkZXIuXG4gICAqIDIuIFBvbGxzIGF0IGhpZ2ggZnJlcXVlbmN5ICgxMDBtcykgYW5kIHJldHVybnMgdGhlIG5ldyBpbWFnZSBpbW1lZGlhdGVseSBvbmNlIHZpc2libGUuXG4gICAqIDMuIFJlamVjdHMgcGFnZSBsb2FkIGlmIGFueSBub24tMjAwIEhUVFAgcmVzcG9uc2UgKDQyOSwgNTAwLCA0MDEsIGV0Yy4pIHdhcyByZWNlaXZlZC5cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHR1cm5BbmRHZXROZXh0SW1hZ2UoXG4gICAgbGFzdFNyYzogc3RyaW5nLFxuICAgIHRhcmdldFBhZ2VOdW06IG51bWJlclxuICApOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsPiB7XG4gICAgbGV0IHJldHJ5QXR0ZW1wdCA9IDA7XG4gICAgaXNFbmRPZkJvb2sgPSBmYWxzZTtcblxuICAgIHdoaWxlIChyZXRyeUF0dGVtcHQgPD0gY29uZmlnLm1heFJldHJpZXMpIHtcbiAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcblxuICAgICAgLy8gSGFuZGxlIHBhdXNlIC8gb2ZmbGluZVxuICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgYXdhaXQgc2xlZXAoNTAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gMS4gQ2hlY2sgaWYgcmVhZGVyIGlzIGFscmVhZHkgYXQgZW5kIG9mIGJvb2tcbiAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBib29rSW5mbz8udG90YWxQYWdlcyB8fCAwO1xuICAgICAgaWYgKHByb3ZpZGVyLmlzQXRFbmRPZkJvb2sgJiYgcHJvdmlkZXIuaXNBdEVuZE9mQm9vayh0YXJnZXRQYWdlTnVtLCB0b3RhbFBhZ2VzKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBFbmQgb2YgYm9vayByZWFjaGVkIGF0IHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS5gKTtcbiAgICAgICAgaXNFbmRPZkJvb2sgPSB0cnVlO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG9tUGFnZUJlZm9yZSA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICBpZiAodG90YWxQYWdlcyA+IDAgJiYgZG9tUGFnZUJlZm9yZSAhPT0gbnVsbCAmJiBkb21QYWdlQmVmb3JlID49IHRvdGFsUGFnZXMgJiYgdGFyZ2V0UGFnZU51bSA+IHRvdGFsUGFnZXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRW5kIG9mIGJvb2sgcmVhY2hlZCBhdCBwYWdlICR7ZG9tUGFnZUJlZm9yZX0uYCk7XG4gICAgICAgIGlzRW5kT2ZCb29rID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIDIuIFRyaWdnZXIgcGFnZSBmbGlwIG9yIGNoZWNrIGlmIGFscmVhZHkgdHVybmVkXG4gICAgICBjb25zdCBhbHJlYWR5VHVybmVkID0gZG9tUGFnZUJlZm9yZSAhPT0gbnVsbCAmJiBkb21QYWdlQmVmb3JlID49IHRhcmdldFBhZ2VOdW07XG5cbiAgICAgIGlmIChyZXRyeUF0dGVtcHQgPiAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFJldHJ5ICR7cmV0cnlBdHRlbXB0fTogcmUtdHJpZ2dlcmluZyBmbGlwIHRvIHBhZ2UgJHt0YXJnZXRQYWdlTnVtfS4uLmApO1xuICAgICAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgIGlmIChyZXRyeUF0dGVtcHQgPj0gMiAmJiBwcm92aWRlci5uYXZpZ2F0ZVRvUGFnZSkge1xuICAgICAgICAgIC8vIERpcmVjdCBuYXZpZ2F0aW9uIGZhbGxiYWNrIG9uIHJlcGVhdGVkIHN0YWxsXG4gICAgICAgICAgYXdhaXQgcHJvdmlkZXIubmF2aWdhdGVUb1BhZ2UodGFyZ2V0UGFnZU51bSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIWFscmVhZHlUdXJuZWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRmxpcHBpbmcgdG8gcGFnZSAke3RhcmdldFBhZ2VOdW19IChhdHRlbXB0IDEvJHtjb25maWcubWF4UmV0cmllcyArIDF9KS4uLmApO1xuICAgICAgICBhd2FpdCBwcm92aWRlci50cmlnZ2VyUGFnZUZsaXAodGFyZ2V0UGFnZU51bSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBET00gaW5kaWNhdGVzIHBhZ2UgaXMgYWxyZWFkeSBvbiBzZXF1ZW5jZS9sZWFmICR7ZG9tUGFnZUJlZm9yZX0uIFdhaXRpbmcgZm9yIGltYWdlLmApO1xuICAgICAgfVxuXG4gICAgICAvLyAzLiBGYXN0IHBvbGwgd2l0aCBIVFRQIGVycm9yIHJlamVjdGlvblxuICAgICAgY29uc3QgY2hlY2tTdGFydCA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCB0aW1lb3V0TXMgPSA1MDAwOyAvLyA1IHNlY29uZHMgbWF4IHBlciBmbGlwIGF0dGVtcHRcbiAgICAgIGxldCBudWRnZWQgPSBmYWxzZTtcblxuICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBjaGVja1N0YXJ0IDwgdGltZW91dE1zKSB7XG4gICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSByZXR1cm4gbnVsbDtcbiAgICAgICAgd2hpbGUgKGlzUGF1c2VkIHx8ICFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgaWYgKHN0b3BSZXF1ZXN0ZWQpIHJldHVybiBudWxsO1xuICAgICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDUklUSUNBTDogUmVqZWN0IHBhZ2UgbG9hZCBpZiBhbiBIVFRQIGVycm9yICg0MjksIDUwMCwgNDAxLCBldGMuKSBvY2N1cnJlZCFcbiAgICAgICAgaWYgKGxhc3RIdHRwRXJyb3IgJiYgKERhdGUubm93KCkgLSBsYXN0SHR0cEVycm9yLnRpbWVzdGFtcCA8IDEwMDAwKSkge1xuICAgICAgICAgIGNvbnN0IGVyciA9IGxhc3RIdHRwRXJyb3I7XG4gICAgICAgICAgbGFzdEh0dHBFcnJvciA9IG51bGw7IC8vIGNvbnN1bWUgZXJyb3JcbiAgICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3RhcmdldFBhZ2VOdW19IGxvYWQgcmVqZWN0ZWQgZHVlIHRvIEhUVFAgJHtlcnIuc3RhdHVzQ29kZX0gb24gJHtlcnIudXJsfWApO1xuXG4gICAgICAgICAgLy8gSW5pdGlhdGUgYmFja29mZlxuICAgICAgICAgIGF3YWl0IGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyLCB0YXJnZXRQYWdlTnVtKTtcblxuICAgICAgICAgIC8vIFJlc3RhcnQgcG9sbGluZyBhZnRlciBiYWNrb2ZmXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3YWl0aW5nIG1vcmUgdGhhbiAxNTAwbXMgd2l0aG91dCB0aGUgaW1hZ2UgYXBwZWFyaW5nLCBzZW5kIGEgbnVkZ2UgZmxpcFxuICAgICAgICBpZiAoIW51ZGdlZCAmJiBEYXRlLm5vdygpIC0gY2hlY2tTdGFydCA+IDE1MDApIHtcbiAgICAgICAgICBudWRnZWQgPSB0cnVlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEltYWdlIG5vdCB5ZXQgY29uZmlybWVkIGFmdGVyIDEuNXMuIFJlLXRyaWdnZXJpbmcgZmxpcCBmb3IgcGFnZSAke3RhcmdldFBhZ2VOdW19Li4uYCk7XG4gICAgICAgICAgYXdhaXQgcHJvdmlkZXIudHJpZ2dlclBhZ2VGbGlwKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgc2xlZXAoMTAwKTtcblxuICAgICAgICBjb25zdCBhY3RpdmVJbWcgPSBwcm92aWRlci5nZXRBY3RpdmVQYWdlSW1hZ2UoMzAwLCB0YXJnZXRQYWdlTnVtKTtcbiAgICAgICAgaWYgKGFjdGl2ZUltZyAmJiBhY3RpdmVJbWcuY29tcGxldGUgJiYgYWN0aXZlSW1nLm5hdHVyYWxXaWR0aCA+PSAzMDApIHtcbiAgICAgICAgICAvLyBEb3VibGUgY2hlY2sgbm8gcGVuZGluZyBIVFRQIGVycm9yIGJlZm9yZSBhY2NlcHRpbmcgaW1hZ2VcbiAgICAgICAgICBpZiAobGFzdEh0dHBFcnJvciAmJiAoRGF0ZS5ub3coKSAtIGxhc3RIdHRwRXJyb3IudGltZXN0YW1wIDwgMzAwMCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBEbyBub3QgYWNjZXB0IGltYWdlIHdoZW4gZXJyb3IgaXMgcGVuZGluZyFcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBcyBzb29uIGFzIHRoZSBpbWFnZSBpcyB2aXNpYmxlIHdpdGggYSBuZXcgc3JjIChvciBjb25maXJtZWQgbWF0Y2hpbmcgdGFyZ2V0UGFnZU51bSksIHJldHVybiBpdCFcbiAgICAgICAgICBjb25zdCBpc1RhcmdldFNlcSA9IGFjdGl2ZUltZy5kYXRhc2V0LnNlcSA9PT0gU3RyaW5nKHRhcmdldFBhZ2VOdW0pO1xuICAgICAgICAgIGlmIChhY3RpdmVJbWcuc3JjICYmIChhY3RpdmVJbWcuc3JjICE9PSBsYXN0U3JjIHx8IGlzVGFyZ2V0U2VxKSkge1xuICAgICAgICAgICAgY3VycmVudFJldHJ5Q291bnQgPSAwO1xuICAgICAgICAgICAgY29uc2VjdXRpdmVFcnJvckNvdW50ID0gMDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIFBhZ2UgJHt0YXJnZXRQYWdlTnVtfSB2aXNpYmxlICgke2FjdGl2ZUltZy5uYXR1cmFsV2lkdGh9eCR7YWN0aXZlSW1nLm5hdHVyYWxIZWlnaHR9cHgpIWApO1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUltZztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGltZWQgb3V0IG9yIGJhY2tlZCBvZmYgd2l0aG91dCBwYWdlIGNoYW5naW5nOlxuICAgICAgcmV0cnlBdHRlbXB0Kys7XG4gICAgICBjdXJyZW50UmV0cnlDb3VudCA9IHJldHJ5QXR0ZW1wdDtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSBkaWQgTk9UIGNoYW5nZSBhZnRlciBmbGlwIGF0dGVtcHQgJHtyZXRyeUF0dGVtcHR9IGZvciBwYWdlICR7dGFyZ2V0UGFnZU51bX0uIFJldHJ5aW5nLi4uYFxuICAgICAgKTtcblxuICAgICAgYnJvYWRjYXN0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6ICdyZXRyeWluZycsXG4gICAgICAgIHJldHJ5Q291bnQ6IHJldHJ5QXR0ZW1wdCxcbiAgICAgICAgc3RhdHVzVGV4dDogYFJldHJ5aW5nIHBhZ2UgdHVybiAoJHtyZXRyeUF0dGVtcHR9LyR7Y29uZmlnLm1heFJldHJpZXN9KS4uLmAsXG4gICAgICB9KTtcblxuICAgICAgLy8gUXVpY2sgYmFja29mZiBkZWxheSBvbiBpbml0aWFsIHJldHJpZXM6IDFzLCAycywgM3MuLi4gKG1heCA1cylcbiAgICAgIGNvbnN0IGJhY2tvZmZTZWMgPSBNYXRoLm1pbihyZXRyeUF0dGVtcHQsIDUpO1xuICAgICAgYXdhaXQgc2xlZXAoYmFja29mZlNlYyAqIDEwMDApO1xuICAgIH1cblxuICAgIGNvbnNvbGUuZXJyb3IoYFtBcmNoaXZlRG93bmxvYWRlcl0gRmFpbGVkIHRvIGZsaXAgdG8gcGFnZSAke3RhcmdldFBhZ2VOdW19IGFmdGVyICR7Y29uZmlnLm1heFJldHJpZXN9IGF0dGVtcHRzLmApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIE1haW4gZG93bmxvYWQgYW5kIGNhcHR1cmUgb3JjaGVzdHJhdGlvbiBsb29wXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBzdGFydERvd25sb2FkKHVzZXJDb25maWc/OiBQYXJ0aWFsPERvd25sb2FkZXJDb25maWc+KSB7XG4gICAgaWYgKGlzUnVubmluZyAmJiAhaXNQYXVzZWQpIHJldHVybjtcblxuICAgIGlmIChpc1BhdXNlZCkge1xuICAgICAgcmVzdW1lRG93bmxvYWQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpc1J1bm5pbmcgPSB0cnVlO1xuICAgIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgc3RvcFJlcXVlc3RlZCA9IGZhbHNlO1xuICAgIGN1cnJlbnRSZXRyeUNvdW50ID0gMDtcbiAgICBkb3dubG9hZGVkUGFnZXMgPSAwO1xuICAgIGZhaWxlZFBhZ2VzID0gMDtcbiAgICBjb2xsZWN0ZWRJbWFnZXMgPSBbXTtcbiAgICBjb2xsZWN0ZWRUZXh0cyA9IFtdO1xuXG4gICAgaWYgKHVzZXJDb25maWcpIHtcbiAgICAgIGNvbmZpZyA9IHsgLi4uY29uZmlnLCAuLi51c2VyQ29uZmlnIH07XG4gICAgfVxuXG4gICAgLy8gUmVmcmVzaCBib29rIGRldGVjdGlvblxuICAgIGF3YWl0IHJlZnJlc2hCb29rSW5mbygpO1xuXG4gICAgY29uc3QgdG90YWxQYWdlcyA9IGJvb2tJbmZvPy50b3RhbFBhZ2VzIHx8IGNvbmZpZy5lbmRQYWdlIHx8IDUwMDtcbiAgICBjb25zdCBzdGFydFAgPSB0eXBlb2YgY29uZmlnLnN0YXJ0UGFnZSA9PT0gJ251bWJlcidcbiAgICAgID8gTWF0aC5tYXgocHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZSwgY29uZmlnLnN0YXJ0UGFnZSlcbiAgICAgIDogcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZTtcblxuICAgIGNvbnN0IG1heEJvb2tQYWdlID0gcHJvdmlkZXIuc2l0ZUlkID09PSAnYXJjaGl2ZScgJiYgcHJvdmlkZXIuZGVmYXVsdFN0YXJ0UGFnZSA9PT0gMFxuICAgICAgPyBNYXRoLm1heCgwLCB0b3RhbFBhZ2VzIC0gMSlcbiAgICAgIDogdG90YWxQYWdlcztcblxuICAgIGNvbnN0IGVuZFAgPSBjb25maWcuZW5kUGFnZSA+IDBcbiAgICAgID8gY29uZmlnLmVuZFBhZ2VcbiAgICAgIDogbWF4Qm9va1BhZ2U7XG5cbiAgICBjb25zdCBib29rVGl0bGUgPSBib29rSW5mbz8uYm9va1RpdGxlIHx8IGAke3Byb3ZpZGVyLnNpdGVOYW1lfSBCb29rYDtcbiAgICBjb25zdCBib29rSWQgPSBib29rSW5mbz8uYm9va0lkIHx8ICdib29rJztcbiAgICBjb25zdCBzdWJEaXIgPSBmb3JtYXRTdWJkaXIoY29uZmlnLmJhc2VEaXIsIGNvbmZpZy5mb2xkZXJQYXR0ZXJuLCBib29rVGl0bGUsIGJvb2tJZCk7XG5cbiAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBTdGFydGluZyBkb3dubG9hZDogcGFnZXMgJHtzdGFydFB9IHRvICR7ZW5kUH0gaW50byAnJHtzdWJEaXJ9J2ApO1xuXG4gICAgLy8gU3RlcCAxOiBFbnN1cmUgU2luZ2xlLVBhZ2UgTW9kZSBpZiBjb25maWd1cmVkIGFuZCBzdXBwb3J0ZWRcbiAgICBpZiAoY29uZmlnLmF1dG9TaW5nbGVQYWdlICYmIHByb3ZpZGVyLmVuZm9yY2VTaW5nbGVQYWdlTW9kZSkge1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdlbnN1cmluZ19tb2RlJywgc3RhdHVzVGV4dDogJ1N3aXRjaGluZyB0byAxLXBhZ2UgbW9kZS4uLicgfSk7XG4gICAgICBhd2FpdCBlbmZvcmNlU2luZ2xlUGFnZU1vZGUoKTtcbiAgICAgIGF3YWl0IHNsZWVwKDYwMCk7XG4gICAgfVxuXG4gICAgLy8gU3RlcCAyOiBBbHdheXMgbmF2aWdhdGUgdG8gdGhlIHN0YXJ0aW5nIHBhZ2VcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6ICdkb3dubG9hZGluZycsXG4gICAgICBjdXJyZW50UGFnZTogc3RhcnRQLFxuICAgICAgc3RhdHVzVGV4dDogYE5hdmlnYXRpbmcgdG8gcGFnZSAke3N0YXJ0UH0uLi5gLFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIE5hdmlnYXRpbmcgdG8gc3RhcnRpbmcgcGFnZS9sZWFmICR7c3RhcnRQfS4uLmApO1xuICAgIGF3YWl0IHByb3ZpZGVyLm5hdmlnYXRlVG9QYWdlKHN0YXJ0UCk7XG5cbiAgICAvLyBHaXZlIHJlYWRlciB0aW1lIHRvIGxvYWQgYW5kIHJlbmRlciBzdGFydFBcbiAgICBhd2FpdCBzbGVlcCgxMjAwKTtcblxuICAgIGxldCBsYXN0SW1nU3JjID0gJyc7XG4gICAgbGV0IGN1cnJlbnRJbWc6IEhUTUxJbWFnZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgIGZvciAobGV0IHBhZ2VOdW0gPSBzdGFydFA7IHBhZ2VOdW0gPD0gZW5kUDsgcGFnZU51bSsrKSB7XG4gICAgICBpZiAoc3RvcFJlcXVlc3RlZCkgYnJlYWs7XG5cbiAgICAgIGN1cnJlbnRQYWdlID0gcGFnZU51bTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAnZG93bmxvYWRpbmcnLFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgc3RhdHVzVGV4dDogYENhcHR1cmluZyBwYWdlICR7cGFnZU51bX1gLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEZvciB0aGUgZmlyc3QgcGFnZSAob3IgcmVjb3ZlcnkpLCB3YWl0IGZvciB0aGUgaW1hZ2UgdG8gYmUgcmVhZHlcbiAgICAgIGlmICghY3VycmVudEltZykge1xuICAgICAgICBjb25zdCB3YWl0SW1hZ2VTdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gd2FpdEltYWdlU3RhcnQgPCAxNTAwMCkge1xuICAgICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSBicmVhaztcbiAgICAgICAgICB3aGlsZSAoaXNQYXVzZWQgfHwgIW5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgICAgIGlmIChzdG9wUmVxdWVzdGVkKSBicmVhaztcbiAgICAgICAgICAgIGF3YWl0IHNsZWVwKDUwMCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudEltZyA9IHByb3ZpZGVyLmdldEFjdGl2ZVBhZ2VJbWFnZSgzMDAsIHBhZ2VOdW0pO1xuICAgICAgICAgIGlmIChjdXJyZW50SW1nKSBicmVhaztcbiAgICAgICAgICBhd2FpdCBzbGVlcCgxNTApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghY3VycmVudEltZykge1xuICAgICAgICBjb25zb2xlLndhcm4oYFtBcmNoaXZlRG93bmxvYWRlcl0gUGFnZSAke3BhZ2VOdW19IGltYWdlIHRpbWVkIG91dC5gKTtcbiAgICAgICAgZmFpbGVkUGFnZXMrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGFzdEltZ1NyYyA9IGN1cnJlbnRJbWcuc3JjO1xuXG4gICAgICAgICAgLy8gMS4gQ2FwdHVyZSBJbWFnZSB0byBEYXRhVVJMICh3aXRoIG9wdGlvbmFsIG1heFBhZ2VIZWlnaHQgY29uc3RyYWludCBhbmQgdGFpbnRlZCBjYW52YXMgcmVjb3ZlcnkpXG4gICAgICAgICAgY29uc3QgZGF0YVVybCA9IGF3YWl0IGNhcHR1cmVJbWFnZVRvRGF0YVVybChjdXJyZW50SW1nLCBjb25maWcuaW1hZ2VRdWFsaXR5LCBjb25maWcubWF4UGFnZUhlaWdodCk7XG5cbiAgICAgICAgICAvLyBDYWxjdWxhdGUgZmluYWwgcGFnZSBkaW1lbnNpb25zIGFmdGVyIGRvd25zY2FsaW5nXG4gICAgICAgICAgbGV0IHBhZ2VXID0gY3VycmVudEltZy5uYXR1cmFsV2lkdGg7XG4gICAgICAgICAgbGV0IHBhZ2VIID0gY3VycmVudEltZy5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICAgIGlmIChjb25maWcubWF4UGFnZUhlaWdodCA+IDAgJiYgcGFnZUggPiBjb25maWcubWF4UGFnZUhlaWdodCkge1xuICAgICAgICAgICAgcGFnZVcgPSBNYXRoLnJvdW5kKHBhZ2VXICogKGNvbmZpZy5tYXhQYWdlSGVpZ2h0IC8gcGFnZUgpKTtcbiAgICAgICAgICAgIHBhZ2VIID0gY29uZmlnLm1heFBhZ2VIZWlnaHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxhc3REaW1lbnNpb25zID0geyB3aWR0aDogcGFnZVcsIGhlaWdodDogcGFnZUggfTtcblxuICAgICAgICAgIC8vIFN0b3JlIGZvciBQREYgY29tcGlsZXIgKGRlZHVwbGljYXRlIGJ5IHBhZ2VOdW0pXG4gICAgICAgICAgaWYgKGNvbmZpZy5nZW5lcmF0ZVBkZikge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdJZHggPSBjb2xsZWN0ZWRJbWFnZXMuZmluZEluZGV4KGkgPT4gaS5wYWdlTnVtID09PSBwYWdlTnVtKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0lkeCA+PSAwKSB7XG4gICAgICAgICAgICAgIGNvbGxlY3RlZEltYWdlc1tleGlzdGluZ0lkeF0gPSB7XG4gICAgICAgICAgICAgICAgcGFnZU51bSxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhVXJsLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBwYWdlVyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhZ2VILFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29sbGVjdGVkSW1hZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHBhZ2VOdW0sXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YVVybCxcbiAgICAgICAgICAgICAgICB3aWR0aDogcGFnZVcsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYWdlSCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZG93bmxvYWRlZFBhZ2VzID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aDtcblxuICAgICAgICAgIC8vIFNhdmUgaW5kaXZpZHVhbCBpbWFnZSBmaWxlXG4gICAgICAgICAgaWYgKGNvbmZpZy5zYXZlSW1hZ2VzKSB7XG4gICAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgICAgIHR5cGU6ICdET1dOTE9BRF9QQUdFX0lNQUdFJyxcbiAgICAgICAgICAgICAgYm9va1RpdGxlLFxuICAgICAgICAgICAgICBwYWdlTnVtLFxuICAgICAgICAgICAgICB0b3RhbFBhZ2VzOiBlbmRQLFxuICAgICAgICAgICAgICBkYXRhVXJsLFxuICAgICAgICAgICAgICBzdWJEaXIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyAyLiBFeHRyYWN0IE9DUiB0ZXh0IGlmIGVuYWJsZWQsIHZlcmlmeWluZyBubyBIVFRQIGVycm9ycyBvY2N1cnJlZFxuICAgICAgICAgIGlmIChjb25maWcuc2F2ZVRleHRNZCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgbGV0IHRleHQgPSBhd2FpdCBwcm92aWRlci5leHRyYWN0UGFnZVRleHQocGFnZU51bSwgY3VycmVudEltZyk7XG4gICAgICAgICAgICAgIGlmIChsYXN0SHR0cEVycm9yICYmIChEYXRlLm5vdygpIC0gbGFzdEh0dHBFcnJvci50aW1lc3RhbXAgPCAzMDAwKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGxhc3RIdHRwRXJyb3I7XG4gICAgICAgICAgICAgICAgbGFzdEh0dHBFcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIE9DUiB0ZXh0IGZldGNoIGZvciBwYWdlICR7cGFnZU51bX0gZW5jb3VudGVyZWQgSFRUUCAke2Vyci5zdGF0dXNDb2RlfWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUh0dHBFcnJvckJhY2tvZmYoZXJyLCBwYWdlTnVtKTtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gYXdhaXQgcHJvdmlkZXIuZXh0cmFjdFBhZ2VUZXh0KHBhZ2VOdW0sIGN1cnJlbnRJbWcpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdUZXh0SWR4ID0gY29sbGVjdGVkVGV4dHMuZmluZEluZGV4KHQgPT4gdC5wYWdlTnVtID09PSBwYWdlTnVtKTtcbiAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGV4dElkeCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkVGV4dHNbZXhpc3RpbmdUZXh0SWR4XSA9IHsgcGFnZU51bSwgbGVhZkluZGV4OiBwYWdlTnVtLCB0ZXh0IH07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGVkVGV4dHMucHVzaCh7IHBhZ2VOdW0sIGxlYWZJbmRleDogcGFnZU51bSwgdGV4dCB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQXJjaGl2ZURvd25sb2FkZXJdIENvdWxkIG5vdCBleHRyYWN0IHRleHQgZm9yIHBhZ2UgJHtwYWdlTnVtfTpgLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlOiBwYWdlTnVtLFxuICAgICAgICAgICAgZG93bmxvYWRlZFBhZ2VzLFxuICAgICAgICAgICAgY3VycmVudFRodW1ibmFpbDogZGF0YVVybCxcbiAgICAgICAgICAgIHN0YXR1c1RleHQ6IGBDYXB0dXJpbmcgcGFnZSAke3BhZ2VOdW19YCxcbiAgICAgICAgICAgIGltYWdlRGltZW5zaW9uczogZGltZW5zaW9ucyxcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgIGZhaWxlZFBhZ2VzKys7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW0FyY2hpdmVEb3dubG9hZGVyXSBFcnJvciBwcm9jZXNzaW5nIHBhZ2UgJHtwYWdlTnVtfTpgLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFR1cm4gcGFnZSBpZiBub3QgdGhlIGxhc3QgcGFnZVxuICAgICAgaWYgKHBhZ2VOdW0gPCBlbmRQICYmICFzdG9wUmVxdWVzdGVkKSB7XG4gICAgICAgIGNvbnN0IG5leHRJbWcgPSBhd2FpdCB0dXJuQW5kR2V0TmV4dEltYWdlKGxhc3RJbWdTcmMsIHBhZ2VOdW0gKyAxKTtcbiAgICAgICAgaWYgKCFuZXh0SW1nKSB7XG4gICAgICAgICAgaWYgKGlzRW5kT2ZCb29rKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBSZWFjaGVkIGVuZCBvZiBib29rIGF0IHBhZ2UgJHtwYWdlTnVtfS4gRmluYWxpemluZy5gKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEZhaWxlZCBhZnRlciByZXRyaWVzOiBwcm9tcHQgdXNlciB0byBzYXZlIGNhcHR1cmVkIHBhZ2VzIVxuICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgdHVybiBwYXN0IHBhZ2UgJHtwYWdlTnVtfS4gUHJvbXB0aW5nIHVzZXIgdG8gc2F2ZS5gKTtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgICAgICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICAgIGF3YWl0IGhhbmRsZVN0b3BSZXF1ZXN0KGBDYW5ub3QgY29udGludWUgcGFzdCBwYWdlICR7cGFnZU51bX0uIFNhdmUgYWxsICR7Y291bnR9IHBhZ2VzIGRvd25sb2FkZWQgc28gZmFyP2ApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFscmVhZHkgaGF2ZSB0aGUgbmV4dCBwYWdlJ3MgdmVyaWZpZWQgaW1hZ2UgcmVhZHkhXG4gICAgICAgIGN1cnJlbnRJbWcgPSBuZXh0SW1nO1xuXG4gICAgICAgIC8vIFN5bmNocm9uaXplIHBhZ2UgY291bnRlciBpZiB2aWV3ZXIgaXMgYWhlYWQgKEFyY2hpdmUub3JnIGxlYWYtanVtcGluZylcbiAgICAgICAgaWYgKHByb3ZpZGVyLnNpdGVJZCAhPT0gJ2hhdGhpdHJ1c3QnKSB7XG4gICAgICAgICAgY29uc3QgZG9tUGFnZU5vdyA9IHByb3ZpZGVyLmdldEN1cnJlbnRQYWdlKCk7XG4gICAgICAgICAgaWYgKGRvbVBhZ2VOb3cgIT09IG51bGwgJiYgZG9tUGFnZU5vdyA+IHBhZ2VOdW0pIHtcbiAgICAgICAgICAgIHBhZ2VOdW0gPSBkb21QYWdlTm93IC0gMTsgLy8gcGFnZU51bSsrIGluIHRoZSBmb3ItbG9vcCB3aWxsIHNldCBwYWdlTnVtID0gZG9tUGFnZU5vd1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlbGF5IGJldHdlZW4gcGFnZXNcbiAgICAgICAgaWYgKGNvbmZpZy5wYWdlRGVsYXlNcyA+IDApIHtcbiAgICAgICAgICBhd2FpdCBzbGVlcChjb25maWcucGFnZURlbGF5TXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gV3JhcC11cDogR2VuZXJhdGUgUERGIGFuZCBNYXJrZG93biBmaWxlc1xuICAgIGlmICghc3RvcFJlcXVlc3RlZCAmJiBkb3dubG9hZGVkUGFnZXMgPiAwKSB7XG4gICAgICBhd2FpdCBmaW5hbGl6ZUJvb2soc3ViRGlyLCBib29rVGl0bGUpO1xuICAgIH1cblxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogc3RvcFJlcXVlc3RlZCA/ICdpZGxlJyA6ICdjb21wbGV0ZScsXG4gICAgICBzdGF0dXNUZXh0OiBzdG9wUmVxdWVzdGVkID8gJ1N0b3BwZWQgYnkgdXNlcicgOiBgQ29tcGxldGVkISBTYXZlZCAke2Rvd25sb2FkZWRQYWdlc30gcGFnZXMuYCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlcyBhbmQgdHJpZ2dlcnMgZG93bmxvYWQgZm9yIHRoZSBmaW5hbCBQREYgYW5kIE1hcmtkb3duIHRleHQgZG9jdW1lbnQuXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBmaW5hbGl6ZUJvb2soc3ViRGlyOiBzdHJpbmcsIGJvb2tUaXRsZTogc3RyaW5nKSB7XG4gICAgLy8gMS4gQ29tcGlsZSBQREZcbiAgICBpZiAoY29uZmlnLmdlbmVyYXRlUGRmICYmIGNvbGxlY3RlZEltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2NvbXBpbGluZ19wZGYnLCBzdGF0dXNUZXh0OiAnQ29tcGlsaW5nIFBERiBkb2N1bWVudC4uLicgfSk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBBc3NlbWJsaW5nIFBERiBmcm9tJywgY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCwgJ3BhZ2VzLi4uJyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBkZkJ5dGVzID0gY29tcGlsZUpwZWdzVG9QZGYoY29sbGVjdGVkSW1hZ2VzLCB7XG4gICAgICAgICAgdGl0bGU6IGJvb2tUaXRsZSxcbiAgICAgICAgICBhdXRob3I6IGJvb2tJbmZvPy5hdXRob3IgfHwgcHJvdmlkZXIuc2l0ZU5hbWUsXG4gICAgICAgICAgY3JlYXRvcjogJ0FyY2hpdmUgRG93bmxvYWRlcicsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBkZkJsb2IgPSBuZXcgQmxvYihbcGRmQnl0ZXNdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9wZGYnIH0pO1xuICAgICAgICBjb25zdCBwZGZCbG9iVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChwZGZCbG9iKTtcblxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ1NBVkVfRklOQUxfRklMRVMnLFxuICAgICAgICAgIGJvb2tUaXRsZSxcbiAgICAgICAgICBzdWJEaXIsXG4gICAgICAgICAgcGRmQmxvYlVybCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gUERGIGNvbXBpbGVkIGFuZCBzZW50IGZvciBkb3dubG9hZCEnKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbQXJjaGl2ZURvd25sb2FkZXJdIEZhaWxlZCB0byBjb21waWxlIFBERjonLCBlcnIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIuIFNhdmUgTWFya2Rvd24gdGV4dFxuICAgIGlmIChjb25maWcuc2F2ZVRleHRNZCkge1xuICAgICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdzYXZpbmdfdGV4dCcsIHN0YXR1c1RleHQ6ICdTYXZpbmcgTWFya2Rvd24gdGV4dC4uLicgfSk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBBc3NlbWJsaW5nIE1hcmtkb3duIGZyb20nLCBjb2xsZWN0ZWRUZXh0cy5sZW5ndGgsICdwYWdlIHRleHRzLi4uJyk7XG5cbiAgICAgIGNvbnN0IG1kQ29udGVudCA9IGJ1aWxkQm9va01hcmtkb3duKFxuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6IGJvb2tUaXRsZSxcbiAgICAgICAgICBib29rSWQ6IGJvb2tJbmZvPy5ib29rSWQgfHwgJ2Jvb2snLFxuICAgICAgICAgIGF1dGhvcjogYm9va0luZm8/LmF1dGhvcixcbiAgICAgICAgICBwdWJsaXNoZXI6IGJvb2tJbmZvPy5wdWJsaXNoZXIsXG4gICAgICAgICAgeWVhcjogYm9va0luZm8/LnllYXIsXG4gICAgICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgICB0b3RhbFBhZ2VzOiBib29rSW5mbz8udG90YWxQYWdlcyB8fCBjdXJyZW50UGFnZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29sbGVjdGVkVGV4dHNcbiAgICAgICk7XG5cbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogJ1NBVkVfRklOQUxfRklMRVMnLFxuICAgICAgICBib29rVGl0bGUsXG4gICAgICAgIHN1YkRpcixcbiAgICAgICAgbWFya2Rvd25Db250ZW50OiBtZENvbnRlbnQsXG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gTWFya2Rvd24gZ2VuZXJhdGVkIGFuZCBzZW50IGZvciBkb3dubG9hZCEnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwYXVzZURvd25sb2FkKCkge1xuICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ3BhdXNlZCcsIHN0YXR1c1RleHQ6ICdEb3dubG9hZCBwYXVzZWQnIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzdW1lRG93bmxvYWQoKSB7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7IHN0YXR1czogJ2Rvd25sb2FkaW5nJywgc3RhdHVzVGV4dDogYFJlc3VtaW5nIHBhZ2UgJHtjdXJyZW50UGFnZX0uLi5gIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudDogbnVtYmVyKSB7XG4gICAgc3RvcFJlcXVlc3RlZCA9IHRydWU7XG4gICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICBicm9hZGNhc3RTdGF0ZSh7XG4gICAgICBzdGF0dXM6ICdjb21waWxpbmdfcGRmJyxcbiAgICAgIHN0YXR1c1RleHQ6IGBTYXZpbmcgJHtjb3VudH0gY2FwdHVyZWQgcGFnZXMuLi5gLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYm9va1RpdGxlID0gYm9va0luZm8/LmJvb2tUaXRsZSB8fCBgJHtwcm92aWRlci5zaXRlTmFtZX0gQm9va2A7XG4gICAgY29uc3QgYm9va0lkID0gYm9va0luZm8/LmJvb2tJZCB8fCAnYm9vayc7XG4gICAgY29uc3Qgc3ViRGlyID0gZm9ybWF0U3ViZGlyKGNvbmZpZy5iYXNlRGlyLCBjb25maWcuZm9sZGVyUGF0dGVybiwgYm9va1RpdGxlLCBib29rSWQpO1xuXG4gICAgYXdhaXQgZmluYWxpemVCb29rKHN1YkRpciwgYm9va1RpdGxlKTtcblxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgIHN0YXR1czogJ2NvbXBsZXRlJyxcbiAgICAgIGRvd25sb2FkZWRQYWdlczogY291bnQsXG4gICAgICBzdGF0dXNUZXh0OiBgQ29tcGxldGVkISBTYXZlZCAke2NvdW50fSBwYWdlcy5gLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlU3RvcFJlcXVlc3QoY3VzdG9tTWVzc2FnZT86IHN0cmluZykge1xuICAgIGlmICghaXNSdW5uaW5nKSB7XG4gICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IGNvbGxlY3RlZEltYWdlcy5sZW5ndGggfHwgZG93bmxvYWRlZFBhZ2VzO1xuICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgIC8vIFRlbXBvcmFyaWx5IHBhdXNlIHRoZSBkb3dubG9hZCBjeWNsZSB3aGlsZSB1c2VyIGRlY2lkZXNcbiAgICAgIGlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgIGJyb2FkY2FzdFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiAncGF1c2VkJyxcbiAgICAgICAgc3RhdHVzVGV4dDogY3VzdG9tTWVzc2FnZSB8fCBgUGF1c2VkOiBTYXZlICR7Y291bnR9IHBhZ2VzP2AsXG4gICAgICB9KTtcblxuICAgICAgcGlsbC5zaG93U3RvcFByb21wdChcbiAgICAgICAgY291bnQsXG4gICAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAvLyBZRVM6IFNhdmUgZXZlcnl0aGluZyBhbmQgdHJlYXQgbGlrZSBjb21wbGV0ZSFcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0FyY2hpdmVEb3dubG9hZGVyXSBVc2VyIGNvbmZpcm1lZCBzYXZpbmcgJHtjb3VudH0gcGFnZXMuYCk7XG4gICAgICAgICAgYXdhaXQgc2F2ZVBhcnRpYWxBbmRDb21wbGV0ZShjb3VudCk7XG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBESVNDQVJEXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gVXNlciBkaXNjYXJkZWQgZG93bmxvYWRzIG9uIHN0b3AuJyk7XG4gICAgICAgICAgc3RvcERvd25sb2FkKCk7XG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBDQU5DRUwgLyBSRVNVTUVcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBSZXN1bWluZyBkb3dubG9hZC4uLicpO1xuICAgICAgICAgIHJlc3VtZURvd25sb2FkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3BEb3dubG9hZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3BEb3dubG9hZCgpIHtcbiAgICBzdG9wUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIGNvbGxlY3RlZEltYWdlcyA9IFtdO1xuICAgIGNvbGxlY3RlZFRleHRzID0gW107XG4gICAgYnJvYWRjYXN0U3RhdGUoeyBzdGF0dXM6ICdpZGxlJywgc3RhdHVzVGV4dDogJ0Rvd25sb2FkIHN0b3BwZWQnIH0pO1xuICB9XG5cbiAgLy8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gUG9wdXAgb3IgQmFja2dyb3VuZCBTZXJ2aWNlIFdvcmtlclxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IEV4dGVuc2lvbk1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICAgIGNhc2UgJ0dFVF9TVEFURSc6IHtcbiAgICAgICAgYnJvYWRjYXN0U3RhdGUoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgYm9va0luZm8gfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTVEFSVF9ET1dOTE9BRCc6IHtcbiAgICAgICAgc3RhcnREb3dubG9hZChtZXNzYWdlLmNvbmZpZyk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdQQVVTRV9ET1dOTE9BRCc6IHtcbiAgICAgICAgcGF1c2VEb3dubG9hZCgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnUkVTVU1FX0RPV05MT0FEJzoge1xuICAgICAgICByZXN1bWVEb3dubG9hZCgpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RPUF9BTkRfU0FWRSc6IHtcbiAgICAgICAgY29uc3QgY291bnQgPSBjb2xsZWN0ZWRJbWFnZXMubGVuZ3RoIHx8IGRvd25sb2FkZWRQYWdlcztcbiAgICAgICAgaWYgKGlzUnVubmluZyAmJiBjb3VudCA+IDApIHtcbiAgICAgICAgICBzYXZlUGFydGlhbEFuZENvbXBsZXRlKGNvdW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgICAgfVxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1RPUF9ET1dOTE9BRCc6IHtcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc2F2ZUNvbGxlY3RlZCkge1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gY29sbGVjdGVkSW1hZ2VzLmxlbmd0aCB8fCBkb3dubG9hZGVkUGFnZXM7XG4gICAgICAgICAgaWYgKGlzUnVubmluZyAmJiBjb3VudCA+IDApIHtcbiAgICAgICAgICAgIHNhdmVQYXJ0aWFsQW5kQ29tcGxldGUoY291bnQpO1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdG9wRG93bmxvYWQoKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NXSVRDSF9UT19TSU5HTEVfUEFHRSc6IHtcbiAgICAgICAgZW5mb3JjZVNpbmdsZVBhZ2VNb2RlKCk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdTQVZFX0NPTkZJRyc6IHtcbiAgICAgICAgc2F2ZUNvbmZpZyhtZXNzYWdlLmNvbmZpZyk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0dFVF9DT05GSUcnOiB7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0hUVFBfRVJST1JfREVURUNURUQnOiB7XG4gICAgICAgIG9uSHR0cEVycm9yUmVjZWl2ZWQobWVzc2FnZS5zdGF0dXNDb2RlLCBtZXNzYWdlLnVybCwgbWVzc2FnZS5yZXRyeUFmdGVyKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn0pKCk7XG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBOEJPLE1BQU0sYUFBYTtBQUFBLEVBQ2hCLFlBQWdDO0FBQUEsRUFDaEMsV0FBVztBQUFBLEVBQ1gsaUJBQWlCO0FBQUEsRUFDakIsbUJBQW1CO0FBQUEsRUFDbkIsWUFBMkIsQ0FBQztBQUFBLEVBQzVCLGdCQUEyQyxDQUFDO0FBQUEsRUFFcEQsV0FBVyxDQUFDLFlBQTJCLENBQUMsR0FBRztBQUFBLElBQ3pDLEtBQUssWUFBWTtBQUFBO0FBQUEsRUFHWixZQUFZLEdBQVk7QUFBQSxJQUM3QixNQUFNLFlBQVksT0FBTyxTQUFTLFNBQVMsU0FBUyxhQUFhLEtBQy9DLE9BQU8sU0FBUyxTQUFTLFNBQVMsV0FBVztBQUFBLElBQy9ELE1BQU0sVUFBVSxPQUFPLFNBQVMsYUFBYSwwQkFDNUIsT0FBTyxTQUFTLFNBQVMsU0FBUyxnQkFBZ0IsS0FBSyxPQUFPLFNBQVMsU0FBUyxXQUFXLFNBQVM7QUFBQSxJQUNySCxPQUFPLGFBQWE7QUFBQTtBQUFBLEVBR2YsTUFBTSxHQUFTO0FBQUEsSUFDcEIsSUFBSSxDQUFDLEtBQUssYUFBYTtBQUFBLE1BQUc7QUFBQSxJQUMxQixJQUFJLEtBQUs7QUFBQSxNQUFXO0FBQUEsSUFFcEIsTUFBTSxPQUFPLFNBQVMsY0FBYyxLQUFLO0FBQUEsSUFDekMsS0FBSyxLQUFLO0FBQUEsSUFDVixLQUFLLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG9CQTJZRCxPQUFPLFFBQVEsT0FBTyxrQkFBa0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7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
