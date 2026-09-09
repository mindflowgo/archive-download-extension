/**
 * Type definitions for Archive Downloader
 */

export interface BookInfo {
  bookId: string;
  bookTitle: string;
  totalPages: number;
  currentLeaf: number;
  currentMode: number; // 1: 1-page, 2: 2-page, 3: thumbnail
  server?: string;
  bookPath?: string;
  isProtected?: boolean;
  author?: string;
  publisher?: string;
  year?: string;
  sourceUrl?: string;
}

export type DownloaderStatus =
  | 'idle'
  | 'initializing'
  | 'ensuring_mode'
  | 'downloading'
  | 'verifying_turn'
  | 'retrying'
  | 'paused'
  | 'offline'
  | 'stalled'
  | 'compiling_pdf'
  | 'saving_text'
  | 'complete'
  | 'error';

export interface DownloaderConfig {
  baseDir: string;             // e.g. "ArchiveBooks"
  folderPattern: string;       // "{title}" or "{title}_{id}" or "{id}"
  saveImages: boolean;         // Save individual page images temporarily
  generatePdf: boolean;        // Combine pages into PDF
  saveTextMd: boolean;         // Save extracted OCR text as Markdown
  imageQuality: number;        // 0.5 to 1.0 (default 0.75)
  maxPageHeight: number;       // Max page height in px (e.g. 1000), 0 for full/original
  pageDelayMs: number;         // Delay after page is confirmed (default 500ms)
  pageChangeTimeoutMs: number; // Max wait for page turn (default 10000ms)
  maxRetries: number;          // Max retry attempts per stalled page turn (default 10)
  autoSinglePage: boolean;     // Enforce 1-page mode automatically
  startPage: number;           // 0-indexed (default 0)
  endPage: number;             // 0 for detected total
  deleteImagesOnComplete: boolean; // Delete images once PDF is created (default true)
}

export type LiberatorConfig = DownloaderConfig; // Backwards compatibility alias

export interface ProgressState {
  status: DownloaderStatus;
  currentPage: number;
  totalPages: number;
  downloadedPages: number;
  failedPages: number;
  retryCount: number;
  statusText: string;
  imageDimensions?: { width: number; height: number };
  currentThumbnail?: string;
  lastError?: string;
  bookInfo?: BookInfo;
  isPaused: boolean;
  isOffline: boolean;
  pdfDownloadId?: number;
}

// Inter-script message protocols
export type ExtensionMessage =
  | { type: 'GET_STATE' }
  | { type: 'STATE_UPDATE'; state: ProgressState }
  | { type: 'START_DOWNLOAD'; config?: Partial<DownloaderConfig> }
  | { type: 'PAUSE_DOWNLOAD' }
  | { type: 'RESUME_DOWNLOAD' }
  | { type: 'STOP_DOWNLOAD'; saveCollected?: boolean }
  | { type: 'STOP_AND_SAVE' }
  | { type: 'SWITCH_TO_SINGLE_PAGE' }
  | { type: 'SAVE_CONFIG'; config: Partial<DownloaderConfig> }
  | { type: 'GET_CONFIG' }
  | { type: 'CONFIG_UPDATE'; config: DownloaderConfig }
  | { type: 'DOWNLOAD_PAGE_IMAGE'; bookTitle: string; pageNum: number; totalPages: number; dataUrl: string; subDir: string }
  | { type: 'SAVE_FINAL_FILES'; bookTitle: string; subDir: string; pdfBlobUrl?: string; markdownContent?: string }
  | { type: 'OPEN_DOWNLOAD' }
  | { type: 'CLEANUP_IMAGES' }
  | { type: 'PAGE_CAPTURED'; pageNum: number; totalPages: number; thumbnail: string }
  | { type: 'HTTP_ERROR_DETECTED'; url: string; statusCode: number; retryAfter?: number };

// Bridge (MAIN world) <-> Content script (ISOLATED world) messages via window.postMessage
export type BridgeMessage =
  | { direction: 'TO_BRIDGE'; action: 'DETECT_BOOK' }
  | { direction: 'TO_BRIDGE'; action: 'SWITCH_MODE_1' }
  | { direction: 'TO_BRIDGE'; action: 'FLIP_NEXT' }
  | { direction: 'TO_BRIDGE'; action: 'JUMP_PAGE'; leafIndex: number }
  | { direction: 'FROM_BRIDGE'; event: 'BOOK_INFO'; data: BookInfo }
  | { direction: 'FROM_BRIDGE'; event: 'MODE_CHANGED'; mode: number }
  | { direction: 'FROM_BRIDGE'; event: 'PAGE_CHANGED'; currentLeaf: number }
  | { direction: 'FROM_BRIDGE'; event: 'HTTP_ERROR'; url: string; statusCode: number; retryAfter?: number }
  | { direction: 'FROM_BRIDGE'; event: 'PAGE_LOAD_ANNOUNCED'; seq: number; isVisible: boolean; isLoaded: boolean }
  | { direction: 'FROM_BRIDGE'; event: 'PAGE_IMAGE_READY'; seq: number; blobUrl: string }
  | { direction: 'FROM_BRIDGE'; event: 'PAGE_TEXT_READY'; seq: number; html: string };
