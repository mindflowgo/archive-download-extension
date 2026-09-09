/**
 * Floating Progress Pill Overlay for Archive.org
 * ONLY appears on https://archive.org/details/*
 *
 * Features:
 * - Cog icon button (⚙) to open expandable in-page Settings tray
 * - Settings (save path, folder pattern, start/end pages) saved to localStorage
 * - Square, full-height buttons with no curvature (just line outline)
 * - [✕] button that shrinks pill to a small docked book icon on the far left edge of the screen
 * - Clicking the docked book icon restores the pill
 * - Image dimensions in small grey letters below status:
 *   "Capturing page 14"
 *   "(image: 2580 x 3915)"
 * - [CONTINUE] button when stalled or connection drops
 * - Interactive Stop confirmation prompt to save captured pages so far
 * - "Downloaded: View Files" button on completion that opens the downloaded file/folder
 */

import { DownloaderConfig } from '../types';

export interface PillCallbacks {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onSaveSettings?: (settings: Partial<DownloaderConfig>) => void;
  onSwitchMode?: () => void;
  onViewFile?: () => void;
}

export class FloatingPill {
  private container: HTMLElement | null = null;
  private isDocked = false;
  private isSettingsOpen = false;
  private isConfirmingStop = false;
  private callbacks: PillCallbacks = {};
  private currentConfig: Partial<DownloaderConfig> = {};

  constructor(callbacks: PillCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public shouldRender(): boolean {
    const isArchive = window.location.hostname.includes('archive.org') &&
                      window.location.pathname.includes('/details/');
    const isBabel = window.location.hostname === 'babel.hathitrust.org' ||
                    (window.location.hostname.includes('hathitrust.org') && window.location.pathname.startsWith('/cgi/pt'));
    return isArchive || isBabel;
  }

  public render(): void {
    if (!this.shouldRender()) return;
    if (this.container) return;

    const pill = document.createElement('div');
    pill.id = 'archive-downloader-pill';
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
        <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Archive Downloader" />
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
          <button class="pill-setting-btn btn-save" id="pillSettingSaveBtn">💾 Save Settings</button>
          <button class="pill-setting-btn btn-close" id="pillSettingCloseBtn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(pill);
    this.container = pill;

    // Attach callbacks
    const startBtn = pill.querySelector('#pillStartBtn') as HTMLButtonElement;
    startBtn?.addEventListener('click', () => this.callbacks.onStart?.());

    const continueBtn = pill.querySelector('#pillContinueBtn') as HTMLButtonElement;
    continueBtn?.addEventListener('click', () => this.callbacks.onResume?.());

    const viewFileBtn = pill.querySelector('#pillViewFileBtn') as HTMLButtonElement;
    viewFileBtn?.addEventListener('click', () => this.callbacks.onViewFile?.());

    const pauseBtn = pill.querySelector('#pillPauseBtn') as HTMLButtonElement;
    pauseBtn?.addEventListener('click', () => this.callbacks.onPause?.());

    const resumeBtn = pill.querySelector('#pillResumeBtn') as HTMLButtonElement;
    resumeBtn?.addEventListener('click', () => this.callbacks.onResume?.());

    const stopBtn = pill.querySelector('#pillStopBtn') as HTMLButtonElement;
    stopBtn?.addEventListener('click', () => this.callbacks.onStop?.());

    const modeBtn = pill.querySelector('#pillModeBtn') as HTMLButtonElement;
    modeBtn?.addEventListener('click', () => this.callbacks.onSwitchMode?.());

    // Cog button to toggle settings tray
    const cogBtn = pill.querySelector('#pillCogBtn') as HTMLButtonElement;
    cogBtn?.addEventListener('click', () => this.toggleSettings());

    // Save Settings button
    const saveSettingsBtn = pill.querySelector('#pillSettingSaveBtn') as HTMLButtonElement;
    saveSettingsBtn?.addEventListener('click', () => {
      const savePathInput = pill.querySelector('#pillSettingSavePath') as HTMLInputElement;
      const patternSelect = pill.querySelector('#pillSettingPattern') as HTMLSelectElement;
      const startPageInput = pill.querySelector('#pillSettingStartPage') as HTMLInputElement;
      const endPageInput = pill.querySelector('#pillSettingEndPage') as HTMLInputElement;
      const maxHeightInput = pill.querySelector('#pillSettingMaxHeight') as HTMLInputElement;

      const baseDir = savePathInput?.value.trim() || 'ArchiveBooks';
      const folderPattern = patternSelect?.value || '{title}_{id}';
      const startPage = startPageInput?.value !== '' ? Math.max(0, parseInt(startPageInput.value, 10)) : 0;
      const endPage = endPageInput?.value !== '' ? Math.max(0, parseInt(endPageInput.value, 10)) : 0;
      const maxPageHeight = maxHeightInput?.value !== '' ? Math.max(0, parseInt(maxHeightInput.value, 10)) : 0;

      this.callbacks.onSaveSettings?.({
        baseDir,
        folderPattern,
        startPage,
        endPage,
        maxPageHeight,
      });

      const hint = pill.querySelector('#pillSettingsSavedHint') as HTMLElement;
      if (hint) {
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 2500);
      }
    });

    const closeSettingsBtn = pill.querySelector('#pillSettingCloseBtn') as HTMLButtonElement;
    closeSettingsBtn?.addEventListener('click', () => this.toggleSettings(false));

    // [x] close/dock button
    const closeBtn = pill.querySelector('#pillCloseBtn') as HTMLButtonElement;
    closeBtn?.addEventListener('click', () => this.dockToLeft());

    // Docked icon click to expand
    const dockIcon = pill.querySelector('#pillDockIcon') as HTMLElement;
    dockIcon?.addEventListener('click', () => this.undockFromLeft());

    // Populate initial inputs if config exists
    this.setConfig(this.currentConfig);
  }

  public toggleSettings(open?: boolean): void {
    if (!this.container) return;
    this.isSettingsOpen = typeof open === 'boolean' ? open : !this.isSettingsOpen;

    const panel = this.container.querySelector('#pillSettingsPanel') as HTMLElement;
    const cogBtn = this.container.querySelector('#pillCogBtn') as HTMLElement;

    if (panel) {
      panel.style.display = this.isSettingsOpen ? 'flex' : 'none';
    }
    if (cogBtn) {
      if (this.isSettingsOpen) {
        cogBtn.classList.add('active');
      } else {
        cogBtn.classList.remove('active');
      }
    }
  }

  public setConfig(cfg: Partial<DownloaderConfig>): void {
    this.currentConfig = { ...this.currentConfig, ...cfg };
    if (!this.container) return;

    const savePathInput = this.container.querySelector('#pillSettingSavePath') as HTMLInputElement;
    if (savePathInput && cfg.baseDir !== undefined) {
      savePathInput.value = cfg.baseDir;
    }

    const patternSelect = this.container.querySelector('#pillSettingPattern') as HTMLSelectElement;
    if (patternSelect && cfg.folderPattern !== undefined) {
      patternSelect.value = cfg.folderPattern;
    }

    const startPageInput = this.container.querySelector('#pillSettingStartPage') as HTMLInputElement;
    if (startPageInput && cfg.startPage !== undefined) {
      startPageInput.value = String(cfg.startPage);
    }

    const endPageInput = this.container.querySelector('#pillSettingEndPage') as HTMLInputElement;
    if (endPageInput && cfg.endPage !== undefined) {
      endPageInput.value = cfg.endPage > 0 ? String(cfg.endPage) : '';
    }

    const maxHeightInput = this.container.querySelector('#pillSettingMaxHeight') as HTMLInputElement;
    if (maxHeightInput && cfg.maxPageHeight !== undefined) {
      maxHeightInput.value = cfg.maxPageHeight > 0 ? String(cfg.maxPageHeight) : '';
    }
  }

  public showStopPrompt(
    count: number,
    onSave: () => void,
    onDiscard: () => void,
    onCancel: () => void,
    customMessage?: string
  ): void {
    if (!this.container) return;
    this.isConfirmingStop = true;

    const confirmBar = this.container.querySelector('#pillConfirmBar') as HTMLElement;
    const confirmText = this.container.querySelector('#pillConfirmText') as HTMLElement;
    const saveBtn = this.container.querySelector('#pillConfirmSaveBtn') as HTMLButtonElement;
    const discardBtn = this.container.querySelector('#pillConfirmDiscardBtn') as HTMLButtonElement;
    const cancelBtn = this.container.querySelector('#pillConfirmCancelBtn') as HTMLButtonElement;

    // Hide normal buttons and status while confirming
    this.setStandardControlsVisible(false);

    if (confirmText) {
      confirmText.textContent = customMessage || `Save all ${count} pages downloaded so far?`;
    }
    if (confirmBar) {
      confirmBar.style.display = 'flex';
    }

    const cleanup = () => {
      this.isConfirmingStop = false;
      if (confirmBar) confirmBar.style.display = 'none';
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

  public hideStopPrompt(): void {
    this.isConfirmingStop = false;
    const confirmBar = this.container?.querySelector('#pillConfirmBar') as HTMLElement;
    if (confirmBar) confirmBar.style.display = 'none';
    this.setStandardControlsVisible(true);
  }

  private setStandardControlsVisible(visible: boolean): void {
    if (!this.container) return;
    const elements = this.container.querySelectorAll<HTMLElement>(
      '#pillStartBtn, #pillContinueBtn, #pillViewFileBtn, #pillPauseBtn, #pillResumeBtn, #pillStopBtn, #pillModeBtn, .pill-status-section, #pillCounter'
    );
    elements.forEach((el) => {
      el.style.display = visible ? '' : 'none';
    });
  }

  public dockToLeft(): void {
    if (!this.container) return;
    this.isDocked = true;
    this.toggleSettings(false);
    this.container.classList.add('docked-left');
  }

  public undockFromLeft(): void {
    if (!this.container) return;
    this.isDocked = false;
    this.container.classList.remove('docked-left');
  }

  public updateProgress(
    currentPage: number,
    totalPages: number,
    statusText: string,
    statusType: string = 'normal',
    isPaused: boolean = false,
    isActive: boolean = false,
    currentMode: number = 1,
    imageDimensions?: { width: number; height: number }
  ): void {
    if (!this.container) return;
    if (this.isConfirmingStop) return; // Do not overwrite confirmation prompt

    const startBtn = this.container.querySelector('#pillStartBtn') as HTMLElement;
    const continueBtn = this.container.querySelector('#pillContinueBtn') as HTMLElement;
    const viewFileBtn = this.container.querySelector('#pillViewFileBtn') as HTMLElement;
    const pauseBtn = this.container.querySelector('#pillPauseBtn') as HTMLElement;
    const resumeBtn = this.container.querySelector('#pillResumeBtn') as HTMLElement;
    const stopBtn = this.container.querySelector('#pillStopBtn') as HTMLElement;
    const modeBtn = this.container.querySelector('#pillModeBtn') as HTMLElement;

    const counterEl = this.container.querySelector('#pillCounter') as HTMLElement;
    const fillEl = this.container.querySelector('#pillProgressFill') as HTMLElement;
    const statusTextEl = this.container.querySelector('#pillStatusText') as HTMLElement;
    const dimensionsEl = this.container.querySelector('#pillDimensionsText') as HTMLElement;

    // 1-page switch button
    if (modeBtn) {
      modeBtn.style.display = currentMode !== 1 && !isActive ? 'flex' : 'none';
    }

    // Right Side Counter
    if (counterEl) {
      if (totalPages > 0) {
        if (isActive) {
          counterEl.textContent = `Page ${currentPage}/${totalPages}`;
        } else {
          counterEl.textContent = `0/${totalPages} pages`;
        }
      } else {
        counterEl.textContent = 'Detecting pages...';
      }
    }

    // Progress bar fill
    if (fillEl && totalPages > 0) {
      const pct = Math.min(100, Math.round(((currentPage + 1) / totalPages) * 100));
      fillEl.style.width = `${pct}%`;
    }

    // Status text & class
    if (statusTextEl) {
      statusTextEl.textContent = statusText;
      statusTextEl.className = `pill-status-text ${statusType}`;
    }

    // Image Dimensions: (image: 2580 x 3915)
    if (dimensionsEl) {
      if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
        dimensionsEl.textContent = `(image: ${imageDimensions.width} x ${imageDimensions.height})`;
      } else {
        dimensionsEl.textContent = `(image: - x -)`;
      }
    }

    // Buttons Visibility
    startBtn.style.display = 'none';
    continueBtn.style.display = 'none';
    viewFileBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'none';
    stopBtn.style.display = 'none';

    if (statusType === 'complete') {
      // Completed: show "Downloaded: View Files"
      viewFileBtn.style.display = 'flex';
    } else if (statusType === 'stalled' || statusType === 'offline' || (isPaused && statusType === 'retrying')) {
      // Stalled / offline / max retries hit: show CONTINUE + Stop
      continueBtn.style.display = 'flex';
      stopBtn.style.display = 'flex';
    } else if (isActive) {
      // Currently active
      stopBtn.style.display = 'flex';
      if (isPaused) {
        resumeBtn.style.display = 'flex';
      } else {
        pauseBtn.style.display = 'flex';
      }
    } else {
      // Idle
      startBtn.style.display = 'flex';
    }
  }

  public destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
