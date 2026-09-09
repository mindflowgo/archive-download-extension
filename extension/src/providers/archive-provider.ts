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
    // 1. Check status / page indicator spans across BookReader versions
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

    // 2. Check input fields used for page jumping
    const pageInput = document.querySelector<HTMLInputElement>('input.BRpageinput, input.page-number-input, input[name="page"]');
    if (pageInput && pageInput.value) {
      const val = parseInt(pageInput.value, 10);
      if (!isNaN(val)) return val;
    }

    // 3. Active page container in DOM
    const activeContainer = document.querySelector('.BRpagecontainer.BRpage-visible, .BRpage.active, .BRpagecontainer[data-index]');
    if (activeContainer) {
      const idxAttr = activeContainer.getAttribute('data-index') || activeContainer.getAttribute('data-page');
      if (idxAttr) {
        const val = parseInt(idxAttr, 10);
        if (!isNaN(val)) return val;
      }
    }

    return null;
  }

  async enforceSinglePageMode(): Promise<boolean> {
    console.log('[ArchiveDownloader] Enforcing single-page mode on Archive.org...');
    this.postToBridge('SWITCH_MODE_1');

    // Accommodate multiple button selectors across BookReader versions
    const onePageBtn = document.querySelector<HTMLButtonElement>(
      'button[title*="One-page" i], button[aria-label*="One-page" i], button.one-page, .BRpageview1, button[data-mode="1"], [aria-label*="1-page" i], .BRicon_onepage, .view-mode-1up'
    );
    if (onePageBtn && !onePageBtn.classList.contains('active') && onePageBtn.getAttribute('aria-pressed') !== 'true') {
      try { onePageBtn.click(); } catch (e) {}
    }
    return true;
  }

  async navigateToPage(pageNum: number): Promise<boolean> {
    console.log(`[ArchiveDownloader] Navigating to Archive leaf ${pageNum}...`);
    this.postToBridge('JUMP_PAGE', { leafIndex: pageNum });

    if (pageNum === 0) {
      const firstBtn = document.querySelector<HTMLButtonElement>(
        'button[title*="First page" i], button[aria-label*="First page" i], button.navfirst, .book-flip-first, .BRnavfirst, [aria-label="First page" i]'
      );
      if (firstBtn) {
        try { firstBtn.click(); } catch (e) {}
      }

      const homeEvent = { bubbles: true, cancelable: true, key: 'Home', code: 'Home', keyCode: 36, which: 36 };
      document.body.dispatchEvent(new KeyboardEvent('keydown', homeEvent));
      window.dispatchEvent(new KeyboardEvent('keydown', homeEvent));
    }
    return true;
  }

  triggerPageFlip(targetPageNum: number): void {
    // 1. Direct BookReader API call via bridge (most reliable in MAIN world, supports br.next() & versions)
    this.postToBridge('FLIP_NEXT', { targetPage: targetPageNum });

    // 2. DOM button click fallback across multiple BookReader versions
    const nextBtn = document.querySelector<HTMLButtonElement>(
      'button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right, .BRnavnext, [aria-label="Next page" i], [data-action="next-page" i], .BRicon_flip_right, button.page-next'
    );
    if (nextBtn) {
      try { nextBtn.click(); } catch (e) {}
    }

    // 3. Keyboard ArrowRight & PageDown events across BookReader versions
    for (const key of ['ArrowRight', 'PageDown']) {
      const keyEvent = {
        bubbles: true,
        cancelable: true,
        key,
        code: key,
        keyCode: key === 'ArrowRight' ? 39 : 34,
        which: key === 'ArrowRight' ? 39 : 34,
      };
      document.body.dispatchEvent(new KeyboardEvent('keydown', keyEvent));
      window.dispatchEvent(new KeyboardEvent('keydown', keyEvent));
    }
  }

  getActivePageImage(minWidth = 300, targetPageNum?: number): HTMLImageElement | null {
    // 1. Direct Target Container Lookup (supports modern & legacy BookReader versions)
    if (typeof targetPageNum === 'number') {
      const targetSelectors = [
        `.BRpagecontainer[data-index="${targetPageNum}"] img`,
        `.pagediv${targetPageNum} img`,
        `[data-index="${targetPageNum}"] img`,
        `.BRpage[data-page="${targetPageNum}"] img`,
        `.BRpage[data-leaf="${targetPageNum}"] img`,
        `#pagediv${targetPageNum} img`,
        `#page${targetPageNum} img`,
        `img[data-seq="${targetPageNum}"]`,
      ];
      for (const sel of targetSelectors) {
        const el = document.querySelector<HTMLImageElement>(sel);
        if (el && el.complete && el.naturalWidth >= minWidth && el.src) {
          el.dataset.seq = String(targetPageNum);
          return el;
        }
      }
    }

    // 2. Query all candidate page images across all BookReader versions
    const imageSelectors = [
      '.BRpagecontainer img',
      'img.BRpageimage',
      '.BRpage img',
      '.BRpageview img',
      'img[class*="BRpage"]',
      'img[src*="BookReaderImages.php"]',
      'img[src*="/BookReader/"]',
      'img[src*="scale="]',
      'img[src*="zip="]',
      '.book-page img',
    ];
    const images = Array.from(document.querySelectorAll<HTMLImageElement>(imageSelectors.join(', ')));
    const valid = images.filter(img => img.complete && img.naturalWidth >= minWidth && img.src);

    if (valid.length === 0) return null;

    // 3. If targetPageNum is specified, find any image whose parent/container or dataset matches targetPageNum
    if (typeof targetPageNum === 'number') {
      const match = valid.find(img => {
        if (img.dataset.seq === String(targetPageNum)) return true;
        const container = img.closest('.BRpagecontainer, .BRpage, [data-index], [data-page]');
        if (container) {
          const idx = container.getAttribute('data-index') || container.getAttribute('data-page') || container.getAttribute('data-leaf');
          if (idx === String(targetPageNum)) return true;
          if (container.classList.contains(`pagediv${targetPageNum}`) || container.classList.contains(`p${targetPageNum}`)) return true;
        }
        return false;
      });
      if (match) {
        match.dataset.seq = String(targetPageNum);
        return match;
      }
    }

    // 4. Viewport visibility scoring: Pick the image with the largest visible area on screen
    let bestImg: HTMLImageElement | null = null;
    let maxVisibleArea = 0;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;

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
      if (typeof targetPageNum === 'number') {
        bestImg.dataset.seq = String(targetPageNum);
      }
      return bestImg;
    }

    // 5. Fallback: Latest valid image in DOM order (newest page)
    const fallback = valid[valid.length - 1];
    if (fallback && typeof targetPageNum === 'number') {
      fallback.dataset.seq = String(targetPageNum);
    }
    return fallback;
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
      'button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right, .BRnavnext, [aria-label="Next page" i], [data-action="next-page" i]'
    );
    const isNextDisabled = nextBtn && (
      nextBtn.disabled ||
      nextBtn.getAttribute('aria-disabled') === 'true' ||
      nextBtn.classList.contains('disabled')
    );
    const domLeaf = this.getCurrentPage();
    return Boolean(isNextDisabled || (totalPages > 0 && domLeaf !== null && domLeaf >= totalPages && currentPage >= totalPages));
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
