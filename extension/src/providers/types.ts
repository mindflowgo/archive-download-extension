import { BookInfo } from '../types';

/**
 * Common abstraction for site-specific reader integrations (Archive.org, HathiTrust, etc.)
 */
export interface BookProvider {
  readonly siteId: 'archive' | 'hathitrust';
  readonly siteName: string;
  readonly defaultStartPage: number; // 0 for Archive.org, 1 for HathiTrust

  /**
   * Returns true if this provider applies to the current page.
   */
  isMatch(): boolean;

  /**
   * Detects volume metadata (ID, title, total pages, current page/leaf).
   */
  detectBookInfo(): Promise<BookInfo | null>;

  /**
   * Retrieves current page/sequence number from the DOM.
   */
  getCurrentPage(): number | null;

  /**
   * Enforces 1-page / single-page mode if supported.
   */
  enforceSinglePageMode?(): Promise<boolean>;

  /**
   * Navigates directly to a target page or sequence number.
   */
  navigateToPage(pageNum: number): Promise<boolean>;

  /**
   * Triggers a turn to the next page.
   */
  triggerPageFlip(targetPageNum: number): Promise<void> | void;

  /**
   * Finds the active rendered book page image element in the DOM.
   */
  getActivePageImage(minWidth?: number, targetPageNum?: number): HTMLImageElement | null;

  /**
   * Extracts or fetches OCR text for the specified page.
   */
  extractPageText(pageNum: number, img?: HTMLImageElement | null): Promise<string>;

  /**
   * Checks whether the reader is at the end of the book.
   */
  isAtEndOfBook?(currentPage: number, totalPages: number): boolean;
}
