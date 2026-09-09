import { BookProvider } from './types';
import { BookInfo } from '../types';
import { parseDjvuXmlToText } from '../utils/markdown-builder';

export class ArchiveProvider implements BookProvider {
  readonly siteId = 'archive' as const;
  readonly siteName = 'Archive.org';
  readonly defaultStartPage = 0;

  private bookInfo: BookInfo | null = null;

  isMatch(): boolean {
    return window.location.hostname.includes('archive.org') && window.location.pathname.includes('/details/');
  }

  setBookInfo(info: BookInfo | null) {
    this.bookInfo = info;
  }

  async detectBookInfo(): Promise<BookInfo | null> {
    // Request BookReader detection from bridge in MAIN world
    this.postToBridge('DETECT_BOOK');

    // Also inspect DOM directly as fast path / fallback
    const domPage = this.extractPageInfoFromDom();
    if (domPage) {
      const title = document.title || 'Archive Book';
      const idMatch = window.location.pathname.match(/\/details\/([^\/\?#]+)/);
      const bookId = idMatch ? idMatch[1] : 'book';

      if (!this.bookInfo) {
        this.bookInfo = {
          bookId,
          bookTitle: title,
          totalPages: domPage.total,
          currentLeaf: domPage.current,
          currentMode: 1,
          sourceUrl: window.location.href,
        };
      } else {
        if (domPage.total > 0 && (!this.bookInfo.totalPages || this.bookInfo.totalPages < domPage.total)) {
          this.bookInfo.totalPages = domPage.total;
        }
      }
    }

    return this.bookInfo;
  }

  getCurrentPage(): number | null {
    const currentSpan = document.querySelector('.BRcurrentpage') || document.querySelector('[role="status"]');
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

  async enforceSinglePageMode(): Promise<boolean> {
    console.log('[ArchiveDownloader] Enforcing single-page mode on Archive.org...');
    this.postToBridge('SWITCH_MODE_1');

    const onePageBtn = document.querySelector<HTMLButtonElement>(
      'button[title*="One-page" i], button[aria-label*="One-page" i], button.one-page, .BRpageview1'
    );
    if (onePageBtn && !onePageBtn.classList.contains('active') && onePageBtn.getAttribute('aria-pressed') !== 'true') {
      onePageBtn.click();
    }
    return true;
  }

  async navigateToPage(pageNum: number): Promise<boolean> {
    console.log(`[ArchiveDownloader] Navigating to Archive leaf ${pageNum}...`);
    this.postToBridge('JUMP_PAGE', { leafIndex: pageNum });

    if (pageNum === 0) {
      const firstBtn = document.querySelector<HTMLButtonElement>(
        'button[title*="First page" i], button[aria-label*="First page" i], button.navfirst, .book-flip-first'
      );
      if (firstBtn) firstBtn.click();

      const homeEvent = { bubbles: true, cancelable: true, key: 'Home', code: 'Home' };
      document.body.dispatchEvent(new KeyboardEvent('keydown', homeEvent));
      window.dispatchEvent(new KeyboardEvent('keydown', homeEvent));
    }
    return true;
  }

  triggerPageFlip(targetPageNum: number): void {
    // 1. Direct BookReader API call via bridge (most reliable in MAIN world)
    this.postToBridge('FLIP_NEXT');

    // 2. DOM button click fallback
    const nextBtn = document.querySelector<HTMLButtonElement>(
      'button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right'
    );
    if (nextBtn) {
      try { nextBtn.click(); } catch (e) {}
    }

    // 3. Keyboard ArrowRight event (BookReader global listener)
    const keyEvent = {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
      code: 'ArrowRight',
      keyCode: 39,
      which: 39,
    };
    document.body.dispatchEvent(new KeyboardEvent('keydown', keyEvent));
    window.dispatchEvent(new KeyboardEvent('keydown', keyEvent));
  }

  getActivePageImage(minWidth = 300, targetPageNum?: number): HTMLImageElement | null {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('.BRpageimage, .BRpage img, img.BRpageimage'));
    const valid = images.filter(img => img.complete && img.naturalWidth >= minWidth && img.src);

    if (valid.length === 0) return null;

    // Pick the image currently visible within the browser viewport
    const visible = valid.find(img => {
      const rect = img.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50 &&
             rect.top < window.innerHeight && rect.bottom > 0 &&
             rect.left < window.innerWidth && rect.right > 0;
    });

    return visible || valid[0];
  }

  async extractPageText(pageNum: number): Promise<string> {
    if (!this.bookInfo || !this.bookInfo.server || !this.bookInfo.bookPath) {
      return '';
    }

    const leafIndex = pageNum;
    const url = `https://${this.bookInfo.server}/BookReader/BookReaderGetTextWrapper.php?path=${encodeURIComponent(this.bookInfo.bookPath)}_djvu.xml&mode=djvu_xml&page=${leafIndex}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) return '';
      const xml = await response.text();
      return parseDjvuXmlToText(xml);
    } catch (err) {
      console.warn(`[ArchiveDownloader] Could not fetch text for leaf ${leafIndex}:`, err);
      return '';
    }
  }

  isAtEndOfBook(currentPage: number, totalPages: number): boolean {
    const nextBtn = document.querySelector<HTMLButtonElement>(
      'button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right'
    );
    const isNextDisabled = nextBtn && (
      nextBtn.disabled ||
      nextBtn.getAttribute('aria-disabled') === 'true' ||
      nextBtn.classList.contains('disabled')
    );
    const domLeaf = this.getCurrentPage();
    return Boolean(isNextDisabled || (totalPages > 0 && domLeaf !== null && domLeaf >= totalPages));
  }

  private postToBridge(action: string, extraData: any = {}) {
    window.postMessage({ direction: 'TO_BRIDGE', action, ...extraData }, '*');
  }

  private extractPageInfoFromDom(): { current: number; total: number } | null {
    const pageEl = document.querySelector('.BRcurrentpage') || document.querySelector('[role="status"]');
    if (pageEl && pageEl.textContent) {
      const match = pageEl.textContent.match(/\((\d+)\s*\/\s*(\d+)\)/);
      if (match) {
        return {
          current: parseInt(match[1], 10),
          total: parseInt(match[2], 10),
        };
      }
    }
    return null;
  }
}
