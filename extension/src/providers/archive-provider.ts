import { BookProvider } from './types';
import { BookInfo } from '../types';
import { parseDjvuXmlToText } from '../utils/markdown-builder';

/**
 * Extracts page/leaf number from Archive.org image URLs (e.g. _0030.tif -> 30).
 * Example: file=principlesteach01nuttgoog_tif/principlesteach01nuttgoog_0030.tif
 */
export function parseArchiveImageUrlPage(src: string): number | null {
  if (!src) return null;
  // 1. BookReaderImages.php file parameter: e.g. file=..._0030.tif or file=...-0030.jp2
  const fileMatch = src.match(/[?&]file=[^&]*?[_\-\.](\d+)\.(?:tif|jp2|jpg|jpeg|png)/i);
  if (fileMatch) {
    const num = parseInt(fileMatch[1], 10);
    if (!isNaN(num)) return num;
  }
  // 2. Generic leaf filename in URL path: e.g. /principlesteach01nuttgoog_0030.tif
  const genericMatch = src.match(/[_\-\.](\d{3,6})\.(?:tif|jp2|jpg|jpeg|png)(?:[?&#]|$)/i);
  if (genericMatch) {
    const num = parseInt(genericMatch[1], 10);
    if (!isNaN(num)) return num;
  }
  // 3. Explicit page/leaf query parameters: ?page=30 or &leaf=30
  const paramMatch = src.match(/[?&](?:page|leaf)=(\d+)/i);
  if (paramMatch) {
    const num = parseInt(paramMatch[1], 10);
    if (!isNaN(num)) return num;
  }
  return null;
}

/**
 * Checks whether an image element is fully loaded, decoded, and represents a real page scan.
 */
export function isImageLoaded(img: HTMLImageElement | null | undefined, minWidth = 200): boolean {
  if (!img) return false;
  if (!img.src || img.src.startsWith('data:image/gif') || img.src === 'about:blank') return false;
  return Boolean(img.complete && (img.naturalWidth >= minWidth || img.width >= minWidth));
}

/**
 * Extracts current and total page from Archive.org DOM indicators.
 * Example: <span class="BRcurrentpage" role="status">Page — (57/384)</span> -> { current: 57, total: 384 }
 */
export function parseArchiveDomPage(text: string): { current: number; total: number } | null {
  if (!text) return null;
  // 1. (57/384) or (57 - 58/384) e.g. "Page — (57/384)" or "Pages (1 - 2/515)"
  const match = text.match(/\((\d+)(?:\s*-\s*\d+)?\s*\/\s*(\d+)\)/);
  if (match) {
    return {
      current: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
    };
  }
  // 2. Simple slash with or without parentheses: 57/384 or (57 / 384)
  const slashMatch = text.match(/(\d+)(?:\s*-\s*\d+)?\s*\/\s*(\d+)/);
  if (slashMatch) {
    return {
      current: parseInt(slashMatch[1], 10),
      total: parseInt(slashMatch[2], 10),
    };
  }
  // 3. "Page 42 of 300"
  const ofMatch = text.match(/(\d+)\s+of\s+(\d+)/i);
  if (ofMatch) {
    return {
      current: parseInt(ofMatch[1], 10),
      total: parseInt(ofMatch[2], 10),
    };
  }
  // 4. "Page 57" or "Page — 57"
  const pageMatch = text.match(/page\s*—?\s*(\d+)/i);
  if (pageMatch) {
    return {
      current: parseInt(pageMatch[1], 10),
      total: 0,
    };
  }
  return null;
}

export class ArchiveProvider implements BookProvider {
  readonly siteId = 'archive' as const;
  readonly siteName = 'Archive.org';
  readonly defaultStartPage = 0;

  private bookInfo: BookInfo | null = null;
  private textCache = new Map<number, string>();
  private detectedOffset: number | null = null;

  onArchiveTextReady(page: number, xml: string) {
    const text = parseDjvuXmlToText(xml);
    if (text) {
      this.textCache.set(page, text);
    }
  }

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
    // 1. Check status / page indicator spans across BookReader versions (authoritative: .BRcurrentpage)
    const currentSpan = document.querySelector('.BRcurrentpage, [role="status"], .page-number, .BRpager-counter');
    if (currentSpan && currentSpan.textContent) {
      const parsed = parseArchiveDomPage(currentSpan.textContent);
      if (parsed && typeof parsed.current === 'number') {
        return parsed.current;
      }
    }

    // 2. Visible / selected page container in DOM
    const visibleContainer = document.querySelector(
      '.BRpagecontainer.BRpage-visible, .BRpagecontainer--hasSelection, .BRpage.active'
    );
    if (visibleContainer) {
      const idxAttr = visibleContainer.getAttribute('data-index') || visibleContainer.getAttribute('data-page');
      if (idxAttr) {
        const val = parseInt(idxAttr, 10);
        if (!isNaN(val)) return val;
      }
    }

    // 3. Check input fields used for page jumping
    const pageInput = document.querySelector<HTMLInputElement>('input.BRpageinput, input.page-number-input, input[name="page"]');
    if (pageInput && pageInput.value) {
      const val = parseInt(pageInput.value, 10);
      if (!isNaN(val)) return val;
    }

    return null;
  }

  async enforceSinglePageMode(): Promise<boolean> {
    console.log('[ArchiveDownloader] Enforcing single-page mode on Archive.org...');
    this.postToBridge('SWITCH_MODE_1');

    // Accommodate multiple button selectors across BookReader versions
    const onePageBtn = document.querySelector<HTMLButtonElement>(
      'button.onepg, .onepg, button[title*="One-page" i], button[aria-label*="One-page" i], button.one-page, .BRpageview1, button[data-mode="1"], [aria-label*="1-page" i], .BRicon_onepage, .view-mode-1up'
    );
    if (onePageBtn && !onePageBtn.classList.contains('active') && onePageBtn.getAttribute('aria-pressed') !== 'true') {
      try { onePageBtn.click(); } catch (e) {}
    }

    // Keyboard shortcut '1' to switch to 1-page mode in BookReader
    try {
      const key1Event = { bubbles: true, cancelable: true, key: '1', code: 'Digit1', keyCode: 49, which: 49 };
      document.body.dispatchEvent(new KeyboardEvent('keydown', key1Event));
      window.dispatchEvent(new KeyboardEvent('keydown', key1Event));
    } catch (e) {}

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
    // Direct BookReader API call via bridge (most reliable in MAIN world, executes jumpToLeaf/next)
    // Avoid double-clicking DOM buttons simultaneously so the reader doesn't flip twice!
    this.postToBridge('FLIP_NEXT', { targetPage: targetPageNum });
  }

  getActivePageImage(minWidth = 200, targetPageNum?: number): HTMLImageElement | null {
    // 1. Priority #1: Target Container explicitly matching targetPageNum if specified
    if (typeof targetPageNum === 'number') {
      const targetSelectors = [
        `.BRpagecontainer[data-index="${targetPageNum}"] img.BRpageimage`,
        `.BRpagecontainer[data-index="${targetPageNum}"] img`,
        `.pagediv${targetPageNum} img.BRpageimage`,
        `.pagediv${targetPageNum} img`,
        `[data-index="${targetPageNum}"] img.BRpageimage`,
        `[data-index="${targetPageNum}"] img`,
        `[data-page-num="n${targetPageNum}"] img`,
        `.BRpage[data-page="${targetPageNum}"] img`,
        `.BRpage[data-leaf="${targetPageNum}"] img`,
        `#pagediv${targetPageNum} img`,
        `#page${targetPageNum} img`,
      ];
      for (const sel of targetSelectors) {
        const el = document.querySelector<HTMLImageElement>(sel);
        if (el) {
          if (isImageLoaded(el, minWidth)) {
            el.dataset.seq = String(targetPageNum);
            const fileNum = parseArchiveImageUrlPage(el.src);
            if (fileNum !== null) {
              this.detectedOffset = fileNum - targetPageNum;
            }
            return el;
          } else {
            // Container for targetPage exists but image is still loading: wait for it!
            return null;
          }
        }
      }
    }

    // 2. Priority #2: Actively visible page container in the BookReader DOM
    const visibleContainers = Array.from(document.querySelectorAll<HTMLElement>(
      '.BRpagecontainer.BRpage-visible, .BRpagecontainer--hasSelection, .BRpage.active, .BRpageview'
    ));
    for (const container of visibleContainers) {
      if (!container || (container as any).tagName === 'IMG' || typeof container.querySelectorAll !== 'function') continue;

      // If targetPageNum is specified, do not accept a visible container that explicitly belongs to an older page!
      if (typeof targetPageNum === 'number') {
        const idxAttr = container.getAttribute('data-index') || container.getAttribute('data-page');
        if (idxAttr) {
          const cIdx = parseInt(idxAttr, 10);
          if (!isNaN(cIdx) && cIdx < targetPageNum) {
            continue; // Stale container from prior page, skip
          }
        }
        const classMatch = container.className.match(/\bpagediv(\d+)\b/);
        if (classMatch) {
          const cIdx = parseInt(classMatch[1], 10);
          if (!isNaN(cIdx) && cIdx < targetPageNum) {
            continue; // Stale container from prior page, skip
          }
        }
      }

      const imgs = Array.from(container.querySelectorAll<HTMLImageElement>(
        'img.BRpageimage, img[class*="BRpage"], img[src*="BookReaderImages.php"], img'
      ));
      for (const img of imgs) {
        if (isImageLoaded(img, minWidth)) {
          if (typeof targetPageNum === 'number') {
            const fileNum = parseArchiveImageUrlPage(img.src);
            if (fileNum !== null && fileNum < targetPageNum) {
              continue; // Older image from prior page, skip
            }
            img.dataset.seq = String(targetPageNum);
            if (fileNum !== null) {
              this.detectedOffset = fileNum - targetPageNum;
            }
          }
          return img;
        }
      }
    }

    // 3. Priority #3: Any candidate book scan image across the DOM that is loaded
    const allImages = Array.from(document.querySelectorAll<HTMLImageElement>(
      'img.BRpageimage, .BRpagecontainer img, .BRpage img, img[src*="BookReaderImages.php"], img[src*="/BookReader/"], .book-page img'
    )).filter(img => isImageLoaded(img, minWidth));

    if (allImages.length === 0) return null;

    // If targetPageNum is specified, don't return an image whose URL belongs to an earlier page
    if (typeof targetPageNum === 'number') {
      const filtered = allImages.filter(img => {
        const fileNum = parseArchiveImageUrlPage(img.src);
        if (fileNum === null) return true;
        const offset = this.detectedOffset ?? 0;
        return fileNum >= targetPageNum + offset;
      });
      if (filtered.length === 0) return null;
      const exactMatch = filtered.find(img => {
        const fn = parseArchiveImageUrlPage(img.src);
        return fn === targetPageNum || (this.detectedOffset !== null && fn === targetPageNum + this.detectedOffset);
      });
      const chosen = exactMatch || filtered[filtered.length - 1];
      chosen.dataset.seq = String(targetPageNum);
      return chosen;
    }

    // Pick the image with the largest visible area in the viewport
    let bestImg: HTMLImageElement | null = null;
    let maxVisibleArea = 0;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;

    for (const img of allImages) {
      const rect = img.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, winW) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, winH) - Math.max(rect.top, 0));
      const area = visibleWidth * visibleHeight;

      if (area > maxVisibleArea && visibleWidth > 50 && visibleHeight > 50) {
        maxVisibleArea = area;
        bestImg = img;
      }
    }

    const chosen = bestImg || allImages[allImages.length - 1] || null;
    if (chosen && typeof targetPageNum === 'number') {
      chosen.dataset.seq = String(targetPageNum);
    }
    return chosen;
  }

  async extractPageText(pageNum: number, img?: HTMLImageElement | null): Promise<string> {
    // 1. Check if intercepted from BookReader's network call
    if (this.textCache.has(pageNum)) {
      return this.textCache.get(pageNum)!;
    }

    // 2. Wait briefly (up to 200ms) in case BookReader's background request is currently in-flight
    for (let i = 0; i < 4; i++) {
      if (this.textCache.has(pageNum)) {
        return this.textCache.get(pageNum)!;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    if (this.textCache.has(pageNum)) {
      return this.textCache.get(pageNum)!;
    }

    // 3. Derive server and bookPath from bookInfo or dynamically from active page image URL
    let server = this.bookInfo?.server || '';
    let bookPath = this.bookInfo?.bookPath || '';

    const candidateSrc = img?.src || this.getActivePageImage(300, pageNum)?.src;
    if ((!server || !bookPath) && candidateSrc && candidateSrc.includes('BookReaderImages.php')) {
      try {
        const u = new URL(candidateSrc);
        if (!server) server = u.host;
        const zipParam = u.searchParams.get('zip');
        const idParam = u.searchParams.get('id');
        if (!bookPath) {
          if (zipParam) {
            bookPath = zipParam.replace(/_[a-zA-Z0-9]+\.zip$/i, '');
          } else if (idParam) {
            bookPath = `/0/items/${idParam}/${idParam}`;
          }
        }
        if (this.bookInfo) {
          if (!this.bookInfo.server && server) this.bookInfo.server = server;
          if (!this.bookInfo.bookPath && bookPath) this.bookInfo.bookPath = bookPath;
        }
      } catch (e) {}
    }

    if (!server || !bookPath) {
      return '';
    }

    const leafIndex = pageNum;
    const url = `https://${server}/BookReader/BookReaderGetTextWrapper.php?path=${encodeURIComponent(bookPath)}_djvu.xml&mode=djvu_xml&page=${leafIndex}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) return '';
      const xml = await response.text();
      const text = parseDjvuXmlToText(xml);
      this.textCache.set(leafIndex, text);
      return text;
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
    const pageEl = document.querySelector('.BRcurrentpage, [role="status"]');
    if (pageEl && pageEl.textContent) {
      const parsed = parseArchiveDomPage(pageEl.textContent);
      if (parsed) return parsed;
    }
    return null;
  }
}
