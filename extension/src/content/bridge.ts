/**
 * Bridge script running in world: "MAIN"
 * Interacts directly with Archive.org's native BookReader (window.br) object.
 */

import { BookInfo, BridgeMessage } from '../types';

(function initBridge() {
  console.log('[ArchiveDownloader] Injected into MAIN world');

  function sendToContentScript(msg: BridgeMessage) {
    window.postMessage(msg, '*');
  }

  const seqToBlobUrl = new Map<number, string>();
  const blobUrlToSeq = new Map<string, number>();
  let lastImageFetchSeq: number | null = null;

  function tagHathiDomElements(seq: number, blobUrl?: string) {
    try {
      const targetBlob = blobUrl || seqToBlobUrl.get(seq);
      let img: HTMLImageElement | null = null;
      if (targetBlob) {
        img = document.querySelector(`img[src="${targetBlob}"]`);
      }
      if (!img) {
        const spreadEl = document.querySelector(`#spread${seq}, [id*="spread"][id*="${seq}"]`);
        if (spreadEl) {
          img = spreadEl.querySelector('details figure img, figure img, img[src^="blob:"]');
        }
      }
      if (img) {
        img.setAttribute('data-seq', String(seq));
        img.dataset.seq = String(seq);
        const fig = img.closest('figure');
        if (fig) {
          fig.setAttribute('data-seq', String(seq));
          fig.dataset.seq = String(seq);
          const cap = fig.querySelector('figcaption');
          if (cap) {
            cap.setAttribute('data-seq', String(seq));
            cap.dataset.seq = String(seq);
          }
        }
        const spread = img.closest('.spread') || img.closest('[id*="spread"]');
        if (spread) {
          spread.setAttribute('data-seq', String(seq));
        }
      }
    } catch (e) {}
  }

  function parseRetryAfterHeader(h: string | null | undefined): number | undefined {
    if (!h) return undefined;
    const trimmed = h.trim();
    const parsedInt = parseInt(trimmed, 10);
    if (!isNaN(parsedInt) && /^\d+$/.test(trimmed)) {
      return parsedInt > 0 ? parsedInt : undefined;
    }
    const dateMs = Date.parse(trimmed);
    if (!isNaN(dateMs)) {
      const diffSec = Math.round((dateMs - Date.now()) / 1000);
      return diffSec > 0 ? diffSec : undefined;
    }
    return undefined;
  }

  // Intercept window.fetch and XMLHttpRequest to catch HTTP status >= 400 and capture HathiTrust image/text requests
  try {
    const origFetch = window.fetch;
    if (typeof origFetch === 'function') {
      window.fetch = async function (...args: any[]) {
        const url = typeof args[0] === 'string'
          ? args[0]
          : (args[0] && (args[0] as any).url ? (args[0] as any).url : '');

        let seqFromUrl: number | null = null;
        if (url && (url.includes('/cgi/imgsrv/image') || url.includes('/cgi/imgsrv/thumbnail') || url.includes('/cgi/imgsrv/html'))) {
          try {
            const parsed = new URL(url, window.location.href);
            const s = parsed.searchParams.get('seq');
            if (s) {
              seqFromUrl = parseInt(s, 10);
              if (!isNaN(seqFromUrl) && (url.includes('/cgi/imgsrv/image') || url.includes('/cgi/imgsrv/thumbnail'))) {
                lastImageFetchSeq = seqFromUrl;
              }
            }
          } catch (e) {}
        }

        const response = await origFetch.apply(this, args);
        if (response && response.status >= 400) {
          let retryAfter: number | undefined;
          try {
            const h = response.headers.get('retry-after');
            retryAfter = parseRetryAfterHeader(h);
          } catch (e) {}

          console.warn(`[ArchiveDownloader] HTTP error ${response.status} intercepted on fetch:`, url);
          sendToContentScript({
            direction: 'FROM_BRIDGE',
            event: 'HTTP_ERROR',
            url: url || response.url || '',
            statusCode: response.status,
            retryAfter,
          });
        } else if (response && response.ok && seqFromUrl !== null && url.includes('/cgi/imgsrv/html')) {
          // Intercept OCR HTML text directly from response
          try {
            const clone = response.clone();
            const seq = seqFromUrl;
            clone.text().then((htmlText) => {
              sendToContentScript({
                direction: 'FROM_BRIDGE',
                event: 'PAGE_TEXT_READY',
                seq,
                html: htmlText,
              });
            }).catch(() => {});
          } catch (e) {}
        }

        return response;
      };
    }

    // Hook URL.createObjectURL to associate blob URLs with sequence numbers
    const origCreateObjectURL = URL.createObjectURL;
    if (typeof origCreateObjectURL === 'function') {
      URL.createObjectURL = function (obj: Blob | MediaSource): string {
        const blobUrl = origCreateObjectURL.call(URL, obj);
        try {
          if (obj instanceof Blob && lastImageFetchSeq !== null) {
            const seq = lastImageFetchSeq;
            seqToBlobUrl.set(seq, blobUrl);
            blobUrlToSeq.set(blobUrl, seq);
            sendToContentScript({
              direction: 'FROM_BRIDGE',
              event: 'PAGE_IMAGE_READY',
              seq,
              blobUrl,
            });
            setTimeout(() => tagHathiDomElements(seq, blobUrl), 20);
          }
        } catch (e) {}
        return blobUrl;
      };
    }

    // Hook console.log to listen for HathiTrust's internal page.loadImage announcements
    // Format: console.log("-- page.loadImage", seq(), get(isVisible2), get(isLoaded));
    const origLog = console.log;
    console.log = function (...args: any[]) {
      try {
        if (args[0] === '-- page.loadImage' && typeof args[1] === 'number') {
          const seq = args[1];
          const isVisible = Boolean(args[2]);
          const isLoaded = Boolean(args[3]);

          sendToContentScript({
            direction: 'FROM_BRIDGE',
            event: 'PAGE_LOAD_ANNOUNCED',
            seq,
            isVisible,
            isLoaded,
          });

          tagHathiDomElements(seq);
          setTimeout(() => tagHathiDomElements(seq), 50);
        }
      } catch (e) {}
      return origLog.apply(console, args);
    };

    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      (this as any)._requestUrl = String(url);
      return (origXhrOpen as any).apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function (...args: any[]) {
      this.addEventListener('load', () => {
        if (this.status >= 400) {
          const url = (this as any)._requestUrl || this.responseURL || '';
          console.warn(`[ArchiveDownloader] HTTP error ${this.status} intercepted on XHR:`, url);
          let retryAfter: number | undefined;
          try {
            const h = this.getResponseHeader('retry-after');
            retryAfter = parseRetryAfterHeader(h);
          } catch (e) {}
          sendToContentScript({
            direction: 'FROM_BRIDGE',
            event: 'HTTP_ERROR',
            url,
            statusCode: this.status,
            retryAfter,
          });
        }
      });
      return origXhrSend.apply(this, args);
    };
  } catch (err) {
    console.error('[ArchiveDownloader] Could not hook network/console methods:', err);
  }

  function getBookReader(): any {
    return (window as any).br;
  }

  function extractPageInfoFromDom(): { current: number; total: number } | null {
    // Archive.org renders: <span class="BRcurrentpage" role="status">Page — (0/515)</span>
    const pageEl = document.querySelector('.BRcurrentpage, [role="status"]');
    if (pageEl && pageEl.textContent) {
      const match = pageEl.textContent.match(/\((\d+)\s*\/\s*(\d+)\)/);
      if (match) {
        return {
          current: parseInt(match[1], 10),
          total: parseInt(match[2], 10),
        };
      }

      const slashMatch = pageEl.textContent.match(/\/\s*(\d+)/);
      if (slashMatch) {
        return {
          current: 0,
          total: parseInt(slashMatch[1], 10),
        };
      }
    }

    const numPagesEl = document.querySelector('.BRnumpages, [aria-label*="total pages" i], .page-number');
    if (numPagesEl && numPagesEl.textContent) {
      const m = numPagesEl.textContent.match(/\d+/);
      if (m) {
        return { current: 0, total: parseInt(m[0], 10) };
      }
    }

    return null;
  }

  function extractBookInfo(): BookInfo | null {
    const br = getBookReader();
    const domPageInfo = extractPageInfoFromDom();

    let totalPages = 0;

    // 1. Primary: If DOM has the exact (0/515) format, trust it!
    if (domPageInfo && domPageInfo.total > 0) {
      totalPages = domPageInfo.total;
    }

    // 2. BookReader API methods (supporting multiple BookReader versions)
    if (!totalPages && br) {
      if (br.book && typeof br.book.getNumLeafs === 'function') {
        try { totalPages = br.book.getNumLeafs(); } catch (e) {}
      }

      if (!totalPages && typeof br.getNumLeafs === 'function') {
        try {
          totalPages = br.getNumLeafs();
        } catch (e) {}
      }

      if (!totalPages && typeof br.numLeafs === 'function') {
        try {
          totalPages = br.numLeafs();
        } catch (e) {}
      }

      if (!totalPages && typeof br.numLeafs === 'number' && br.numLeafs > 0) {
        totalPages = br.numLeafs;
      }

      if (!totalPages && Array.isArray(br.data)) {
        // In 2-page mode, br.data is an array of pairs. Flattening gives all individual pages!
        totalPages = br.data.flat().length;
      }
    }

    // Current leaf
    let currentLeaf = 0;
    if (domPageInfo && domPageInfo.current > 0) {
      currentLeaf = domPageInfo.current;
    } else if (br) {
      if (typeof br.leafNum === 'number') {
        currentLeaf = br.leafNum;
      } else if (typeof br.currentIndex === 'function') {
        try {
          const idx = br.currentIndex();
          if (typeof br.getLeafNum === 'function') {
            currentLeaf = br.getLeafNum(idx);
          } else {
            currentLeaf = idx;
          }
        } catch (e) {
          currentLeaf = 0;
        }
      }
    }

    const currentMode = (br && typeof br.mode === 'number') ? br.mode : 0;
    const bookTitle = (br && br.bookTitle) || (br?.book?.metadata?.title) || document.title || 'Archive Book';
    const bookId = (br && br.bookId) || '';

    if (!br && !domPageInfo && !bookId) return null;

    return {
      bookId,
      bookTitle,
      totalPages,
      currentLeaf,
      currentMode,
      server: (br && br.server) || '',
      bookPath: (br && br.bookPath) || '',
      isProtected: Boolean(br && br.protected),
      sourceUrl: window.location.href,
    };
  }

  function tagArchiveDomElements(leaf: number) {
    try {
      const selectors = [
        `.BRpagecontainer[data-index="${leaf}"] img`,
        `.pagediv${leaf} img`,
        `[data-index="${leaf}"] img`,
        `.BRpage[data-page="${leaf}"] img`,
        `.BRpage[data-leaf="${leaf}"] img`,
        `#pagediv${leaf} img`,
        `#page${leaf} img`,
      ];
      for (const sel of selectors) {
        const img = document.querySelector<HTMLImageElement>(sel);
        if (img) {
          img.dataset.seq = String(leaf);
          break;
        }
      }
    } catch (e) {}
  }

  // Handle commands from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.direction !== 'TO_BRIDGE') {
      return;
    }

    const { action } = event.data;
    const br = getBookReader();

    switch (action) {
      case 'DETECT_BOOK': {
        const info = extractBookInfo();
        if (info) {
          sendToContentScript({
            direction: 'FROM_BRIDGE',
            event: 'BOOK_INFO',
            data: info,
          });
        }
        break;
      }

      case 'SWITCH_MODE_1': {
        if (br) {
          console.log('[ArchiveDownloader] Switching to 1-page mode');
          if (typeof br.switchMode === 'function') {
            try { br.switchMode(1); } catch (e) {}
          } else if (typeof br.switchReadMode === 'function') {
            try { br.switchReadMode(1); } catch (e) {}
          }
          setTimeout(() => {
            const info = extractBookInfo();
            if (info) {
              sendToContentScript({
                direction: 'FROM_BRIDGE',
                event: 'MODE_CHANGED',
                mode: br.mode || 1,
              });
              sendToContentScript({
                direction: 'FROM_BRIDGE',
                event: 'BOOK_INFO',
                data: info,
              });
            }
          }, 400);
        }
        break;
      }

      case 'FLIP_NEXT': {
        const targetPage = typeof event.data.targetPage === 'number' ? event.data.targetPage : undefined;
        if (br) {
          console.log(`[ArchiveDownloader] Flipping next page via BookReader (target: ${targetPage ?? 'next'})`);
          let flipped = false;

          // 1. Primary: br.next() - standard method across BookReader versions
          if (typeof br.next === 'function') {
            try {
              br.next();
              flipped = true;
            } catch (e) {
              try {
                br.next({ noAnimate: true });
                flipped = true;
              } catch (e2) {}
            }
          }

          // 2. Secondary: br.flipRight() or br.right() - legacy versions
          if (!flipped) {
            if (typeof br.flipRight === 'function') {
              try { br.flipRight(); flipped = true; } catch (e) {}
            } else if (typeof br.right === 'function') {
              try { br.right(); flipped = true; } catch (e) {}
            }
          }

          // 3. Fallback: direct jump if targetPage is specified and br.next wasn't available
          if (!flipped && typeof targetPage === 'number') {
            if (typeof br.jumpToIndex === 'function') {
              try { br.jumpToIndex(targetPage, { noAnimate: true }); flipped = true; } catch (e) {
                try { br.jumpToIndex(targetPage); flipped = true; } catch (e2) {}
              }
            } else if (typeof br.jumpToLeaf === 'function') {
              try { br.jumpToLeaf(targetPage); flipped = true; } catch (e) {}
            } else if (typeof br.goToPage === 'function') {
              try { br.goToPage(targetPage); flipped = true; } catch (e) {}
            }
          }

          if (typeof targetPage === 'number') {
            setTimeout(() => tagArchiveDomElements(targetPage), 150);
          }
        }
        break;
      }

      case 'JUMP_PAGE': {
        const leafIndex = typeof event.data.leafIndex === 'number' ? event.data.leafIndex : 0;
        if (br) {
          console.log(`[ArchiveDownloader] Jumping to leaf ${leafIndex}`);
          let jumped = false;
          if (typeof br.jumpToIndex === 'function') {
            try { br.jumpToIndex(leafIndex, { noAnimate: true }); jumped = true; } catch (e) {
              try { br.jumpToIndex(leafIndex); jumped = true; } catch (e2) {}
            }
          }
          if (!jumped && typeof br.jumpToLeaf === 'function') {
            try { br.jumpToLeaf(leafIndex); jumped = true; } catch (e) {}
          }
          if (!jumped && typeof br.goToPage === 'function') {
            try { br.goToPage(leafIndex); jumped = true; } catch (e) {}
          }
          setTimeout(() => tagArchiveDomElements(leafIndex), 200);
        }
        if (leafIndex === 0) {
          if (br && typeof br.first === 'function') {
            try { br.first(); } catch (e) {}
          }
          const homeEvent = {
            bubbles: true,
            cancelable: true,
            key: 'Home',
            code: 'Home',
            keyCode: 36,
            which: 36,
          };
          document.body.dispatchEvent(new KeyboardEvent('keydown', homeEvent));
          window.dispatchEvent(new KeyboardEvent('keydown', homeEvent));
        }
        break;
      }
    }
  });

  // Poll for BookReader & DOM page availability
  let pollCount = 0;
  const pollInterval = setInterval(() => {
    pollCount++;
    const info = extractBookInfo();
    if (info && info.totalPages > 0) {
      clearInterval(pollInterval);
      console.log('[ArchiveDownloader] Book detected:', info.bookTitle, `(${info.totalPages} pages)`);
      sendToContentScript({
        direction: 'FROM_BRIDGE',
        event: 'BOOK_INFO',
        data: info,
      });
    } else if (pollCount > 40) {
      clearInterval(pollInterval);
      if (info) {
        sendToContentScript({
          direction: 'FROM_BRIDGE',
          event: 'BOOK_INFO',
          data: info,
        });
      }
    }
  }, 400);
})();
