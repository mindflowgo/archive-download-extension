import { BookProvider } from './types';
import { BookInfo } from '../types';
import { parseHathiFigcaptionToText } from '../utils/markdown-builder';

export class HathiTrustProvider implements BookProvider {
  readonly siteId = 'hathitrust' as const;
  readonly siteName = 'HathiTrust';
  readonly defaultStartPage = 1; // HathiTrust sequences are 1-based

  private bookInfo: BookInfo | null = null;

  // Tracking loaded sequences from MAIN world bridge
  private announcedSequences = new Set<number>();
  private seqToBlobUrl = new Map<number, string>();
  private blobUrlToSeq = new Map<string, number>();
  private seqToHtml = new Map<number, string>();

  constructor() {
    // Listen for bridge messages (world: MAIN)
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data || event.data.direction !== 'FROM_BRIDGE') {
          return;
        }
        const msg = event.data;
        if (msg.event === 'PAGE_LOAD_ANNOUNCED') {
          if (msg.isLoaded) {
            this.announcedSequences.add(msg.seq);
            console.log(`[ArchiveDownloader] HathiTrust announced sequence ${msg.seq} loaded`);
          }
        } else if (msg.event === 'PAGE_IMAGE_READY') {
          this.seqToBlobUrl.set(msg.seq, msg.blobUrl);
          this.blobUrlToSeq.set(msg.blobUrl, msg.seq);
        } else if (msg.event === 'PAGE_TEXT_READY') {
          this.seqToHtml.set(msg.seq, msg.html);
        }
      });
    }
  }

  onPageLoadAnnounced(seq: number, isVisible: boolean, isLoaded: boolean): void {
    if (isLoaded) {
      this.announcedSequences.add(seq);
    }
  }

  onPageImageReady(seq: number, blobUrl: string): void {
    this.seqToBlobUrl.set(seq, blobUrl);
    this.blobUrlToSeq.set(blobUrl, seq);
  }

  onPageTextReady(seq: number, html: string): void {
    this.seqToHtml.set(seq, html);
  }

  getBlobUrlForSeq(seq: number): string | undefined {
    return this.seqToBlobUrl.get(seq);
  }

  getCachedHtmlForSeq(seq: number): string | undefined {
    return this.seqToHtml.get(seq);
  }

  isPageAnnounced(seq: number): boolean {
    return this.announcedSequences.has(seq);
  }

  isMatch(): boolean {
    const isHost = window.location.hostname === 'babel.hathitrust.org' ||
                   (window.location.hostname.includes('hathitrust.org') && window.location.pathname.startsWith('/cgi/pt'));
    return isHost;
  }

  async detectBookInfo(): Promise<BookInfo | null> {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('id') || 'hathitrust_book';

    // 1. Detect Book Title
    let bookTitle = '';
    const metaTitle = document.querySelector<HTMLMetaElement>('meta[name="DC.title"], meta[property="og:title"]');
    if (metaTitle && metaTitle.content) {
      bookTitle = metaTitle.content.trim();
    }
    if (!bookTitle) {
      const h1 = document.querySelector('h1.title, h1.item-title, h1');
      if (h1 && h1.textContent) {
        bookTitle = h1.textContent.trim();
      }
    }
    if (!bookTitle) {
      bookTitle = document.title ? document.title.replace(/[-|]\s*HathiTrust.*/i, '').trim() : 'HathiTrust Book';
    }

    // 2. Detect Total Pages
    const totalPages = this.getTotalPagesFromDom();

    // 3. Detect Current Sequence
    const currentSeq = this.getCurrentPage() || 1;

    // Check author and year if present in metadata
    const authorMeta = document.querySelector<HTMLMetaElement>('meta[name="DC.creator"]');
    const author = authorMeta?.content;

    const dateMeta = document.querySelector<HTMLMetaElement>('meta[name="DC.date"]');
    const year = dateMeta?.content;

    this.bookInfo = {
      bookId,
      bookTitle: bookTitle || 'HathiTrust Book',
      totalPages: totalPages || 500,
      currentLeaf: currentSeq,
      currentMode: 1,
      sourceUrl: window.location.href,
      author,
      year,
    };

    console.log('[ArchiveDownloader] HathiTrust volume detected:', this.bookInfo.bookTitle, `(${this.bookInfo.totalPages} pages)`);
    return this.bookInfo;
  }

  getCurrentPage(): number | null {
    if (typeof document === 'undefined') return null;

    // 1. Check toolbar input
    const seqInput = document.querySelector<HTMLInputElement>('#toolbar-seq, input[name="seq"]');
    if (seqInput && seqInput.value) {
      const val = parseInt(seqInput.value, 10);
      if (!isNaN(val) && val > 0) return val;
    }

    // 2. Check URL search param
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const seq = params.get('seq');
      if (seq) {
        const val = parseInt(seq, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    }

    // 3. Check data-seq on active figure or spread
    const activeFig = document.querySelector('div.spread figure[data-seq], figure[data-seq]');
    if (activeFig) {
      const seqAttr = activeFig.getAttribute('data-seq');
      if (seqAttr) {
        const val = parseInt(seqAttr, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    }

    return null;
  }

  async navigateToPage(pageNum: number): Promise<boolean> {
    console.log(`[ArchiveDownloader] Navigating to HathiTrust sequence ${pageNum}...`);
    const seqInput = document.querySelector<HTMLInputElement>('#toolbar-seq, input[name="seq"]');

    if (seqInput) {
      seqInput.focus();
      seqInput.value = String(pageNum);
      seqInput.dispatchEvent(new Event('input', { bubbles: true }));
      seqInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Dispatch Enter keydown event
      const enterEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
      });
      seqInput.dispatchEvent(enterEvent);

      // Submit parent form if present
      const form = seqInput.closest('form');
      if (form) {
        try {
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        } catch (e) {}
      }
      return true;
    }

    return false;
  }

  triggerPageFlip(targetPageNum: number): void {
    // 1. Primary: Click Next Page button
    // <button type="button" class="btn btn-outline-dark" aria-label="Next Page"><i class="fa-solid fa-angle-right" aria-hidden="true"></i></button>
    const nextBtn = document.querySelector<HTMLButtonElement | HTMLAnchorElement>(
      'button[aria-label="Next Page" i], button[aria-label*="Next" i], button[title*="Next" i], [accesskey="n"], button.next, a.action-next-page'
    );
    if (nextBtn) {
      const disabled = (nextBtn as any).disabled ||
                       nextBtn.getAttribute('aria-disabled') === 'true' ||
                       nextBtn.classList.contains('disabled');
      if (!disabled) {
        try {
          console.log('[ArchiveDownloader] Clicking HathiTrust Next Page button...');
          nextBtn.click();
          return;
        } catch (e) {}
      }
    }

    // 2. Keyboard ArrowRight event (standard reader hotkey)
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

    // 3. Fallback: only if Next button is not available, use sequence input
    const seqInput = document.querySelector<HTMLInputElement>('#toolbar-seq, input[name="seq"]');
    if (seqInput) {
      console.log(`[ArchiveDownloader] Fallback to sequence input ${targetPageNum}...`);
      this.navigateToPage(targetPageNum);
    }
  }

  getActivePageImage(minWidth = 300, targetSeq?: number): HTMLImageElement | null {
    if (typeof document === 'undefined') return null;

    // 1. If targetSeq is specified (during sequential capture)
    if (typeof targetSeq === 'number') {
      const currentSeq = this.getCurrentPage();
      // If the reader toolbar has not reached targetSeq yet, wait!
      if (currentSeq !== null && currentSeq < targetSeq) {
        return null;
      }

      // Check if there is an image explicitly tagged with targetSeq
      const tagged = document.querySelector<HTMLImageElement>(`img[data-seq="${targetSeq}"]`);
      if (tagged && tagged.complete && tagged.naturalWidth >= minWidth && tagged.src && !tagged.src.includes('base64,iVBORw')) {
        return tagged;
      }
    }

    // Query candidate page images inside main#main
    const images = Array.from(document.querySelectorAll<HTMLImageElement>(
      'main#main details figure div.image img, main#main details figure img, main#main div.spread figure div.image img, main#main div.spread figure img, main#main img[src^="blob:"], main#main img'
    ));

    const valid = images.filter(img =>
      img.complete &&
      img.naturalWidth >= minWidth &&
      img.src &&
      !img.src.includes('base64,iVBORw') // Ignore transparent 1x1 placeholder
    );

    if (valid.length === 0) return null;

    // Pick image visible within browser viewport
    const visible = valid.find(img => {
      // If image is explicitly tagged with a different sequence, do not pick it!
      if (typeof targetSeq === 'number' && img.dataset.seq && parseInt(img.dataset.seq, 10) !== targetSeq) {
        return false;
      }

      const rect = img.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50 &&
             rect.top < window.innerHeight && rect.bottom > 0 &&
             rect.left < window.innerWidth && rect.right > 0;
    });

    const chosen = visible || valid[0];
    if (chosen && typeof targetSeq === 'number') {
      chosen.setAttribute('data-seq', String(targetSeq));
      chosen.dataset.seq = String(targetSeq);
    }

    return chosen;
  }

  async extractPageText(pageNum: number, img?: HTMLImageElement | null): Promise<string> {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const start = Date.now();

    // 1. Check if we already received the OCR HTML from the network interception
    const cachedHtml = this.seqToHtml.get(pageNum);
    if (cachedHtml) {
      const text = parseHathiFigcaptionToText(cachedHtml);
      if (text && text.trim().length > 0) {
        return text;
      }
    }

    if (typeof document === 'undefined') {
      return '';
    }

    // 2. Query DOM for target sequence's figcaption, retrying briefly (up to 2500ms)
    while (Date.now() - start < 2500) {
      // 2a. If img was passed, check its closest figure:
      if (img) {
        const figure = img.closest('figure');
        if (figure) {
          const figcaption = figure.querySelector<HTMLElement>('figcaption');
          if (figcaption && figcaption.textContent && figcaption.textContent.trim().length > 0) {
            return parseHathiFigcaptionToText(figcaption);
          }
        }
      }

      // 2b. Check explicitly tagged figcaption:
      const taggedFigcaption = document.querySelector<HTMLElement>(
        `figure[data-seq="${pageNum}"] figcaption, figcaption[data-seq="${pageNum}"], .spread[data-seq="${pageNum}"] figcaption`
      );
      if (taggedFigcaption && taggedFigcaption.textContent && taggedFigcaption.textContent.trim().length > 0) {
        return parseHathiFigcaptionToText(taggedFigcaption);
      }

      // 2c. Fallback: check main spread details figcaption:
      const spreadFigcaption = document.querySelector<HTMLElement>(
        'main#main details figure figcaption, main#main figure figcaption, main#main figcaption'
      );
      if (spreadFigcaption && spreadFigcaption.textContent && spreadFigcaption.textContent.trim().length > 0) {
        return parseHathiFigcaptionToText(spreadFigcaption);
      }

      // 2d. Check if network response arrived while polling:
      const lateHtml = this.seqToHtml.get(pageNum);
      if (lateHtml) {
        const text = parseHathiFigcaptionToText(lateHtml);
        if (text && text.trim().length > 0) {
          return text;
        }
      }

      await sleep(100);
    }

    return '';
  }

  isAtEndOfBook(currentPage: number, totalPages: number): boolean {
    if (totalPages > 0 && currentPage >= totalPages) {
      return true;
    }

    const nextBtn = document.querySelector<HTMLButtonElement | HTMLAnchorElement>(
      'button[aria-label*="Next" i], button[title*="Next" i], [accesskey="n"]'
    );
    if (nextBtn) {
      const disabled = (nextBtn as any).disabled ||
                       nextBtn.getAttribute('aria-disabled') === 'true' ||
                       nextBtn.classList.contains('disabled');
      if (disabled) return true;
    }

    return false;
  }

  private getTotalPagesFromDom(): number {
    // 1. Check parent container of #toolbar-seq: <input id="toolbar-seq"> ... <span>/</span> <span>272</span>
    const seqInput = document.querySelector<HTMLInputElement>('#toolbar-seq, input[name="seq"]');
    if (seqInput) {
      const parent = seqInput.parentElement;
      if (parent) {
        const text = parent.textContent || '';
        const match = text.match(/\/\s*(\d+)/);
        if (match) return parseInt(match[1], 10);

        const htmlMatch = parent.innerHTML.match(/\/\s*<\/span>\s*<span>\s*(\d+)/i) ||
                          parent.innerHTML.match(/\/\s*(\d+)/);
        if (htmlMatch) return parseInt(htmlMatch[1], 10);
      }

      const maxAttr = seqInput.getAttribute('max');
      if (maxAttr) {
        const val = parseInt(maxAttr, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    }

    // 2. Check window.manifest if present in page
    const w = window as any;
    if (w.manifest && w.manifest.totalSeq) {
      const val = parseInt(w.manifest.totalSeq, 10);
      if (!isNaN(val) && val > 0) return val;
    }

    // 3. Check general text e.g. "of 272" or "/ 272"
    const pagingEl = document.querySelector('.paging, [class*="paging"], [aria-label*="total pages" i]');
    if (pagingEl && pagingEl.textContent) {
      const m = pagingEl.textContent.match(/\/\s*(\d+)/) || pagingEl.textContent.match(/of\s+(\d+)/i);
      if (m) return parseInt(m[1], 10);
    }

    return 0;
  }
}
