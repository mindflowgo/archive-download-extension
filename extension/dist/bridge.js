// extension/src/content/bridge.ts
(function initBridge() {
  console.log("[ArchiveDownloader] Injected into MAIN world");
  function sendToContentScript(msg) {
    window.postMessage(msg, "*");
  }
  const seqToBlobUrl = new Map;
  const blobUrlToSeq = new Map;
  let lastImageFetchSeq = null;
  function tagHathiDomElements(seq, blobUrl) {
    try {
      const targetBlob = blobUrl || seqToBlobUrl.get(seq);
      let img = null;
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
        img.setAttribute("data-seq", String(seq));
        img.dataset.seq = String(seq);
        const fig = img.closest("figure");
        if (fig) {
          fig.setAttribute("data-seq", String(seq));
          fig.dataset.seq = String(seq);
          const cap = fig.querySelector("figcaption");
          if (cap) {
            cap.setAttribute("data-seq", String(seq));
            cap.dataset.seq = String(seq);
          }
        }
        const spread = img.closest(".spread") || img.closest('[id*="spread"]');
        if (spread) {
          spread.setAttribute("data-seq", String(seq));
        }
      }
    } catch (e) {}
  }
  function parseRetryAfterHeader(h) {
    if (!h)
      return;
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
    return;
  }
  try {
    const origFetch = window.fetch;
    if (typeof origFetch === "function") {
      window.fetch = async function(...args) {
        const url = typeof args[0] === "string" ? args[0] : args[0] && args[0].url ? args[0].url : "";
        let seqFromUrl = null;
        if (url && (url.includes("/cgi/imgsrv/image") || url.includes("/cgi/imgsrv/thumbnail") || url.includes("/cgi/imgsrv/html"))) {
          try {
            const parsed = new URL(url, window.location.href);
            const s = parsed.searchParams.get("seq");
            if (s) {
              seqFromUrl = parseInt(s, 10);
              if (!isNaN(seqFromUrl) && (url.includes("/cgi/imgsrv/image") || url.includes("/cgi/imgsrv/thumbnail"))) {
                lastImageFetchSeq = seqFromUrl;
              }
            }
          } catch (e) {}
        }
        const response = await origFetch.apply(this, args);
        if (response && response.status >= 400) {
          let retryAfter;
          try {
            const h = response.headers.get("retry-after");
            retryAfter = parseRetryAfterHeader(h);
          } catch (e) {}
          console.warn(`[ArchiveDownloader] HTTP error ${response.status} intercepted on fetch:`, url);
          sendToContentScript({
            direction: "FROM_BRIDGE",
            event: "HTTP_ERROR",
            url: url || response.url || "",
            statusCode: response.status,
            retryAfter
          });
        } else if (response && response.ok && seqFromUrl !== null && url.includes("/cgi/imgsrv/html")) {
          try {
            const clone = response.clone();
            const seq = seqFromUrl;
            clone.text().then((htmlText) => {
              sendToContentScript({
                direction: "FROM_BRIDGE",
                event: "PAGE_TEXT_READY",
                seq,
                html: htmlText
              });
            }).catch(() => {});
          } catch (e) {}
        }
        return response;
      };
    }
    const origCreateObjectURL = URL.createObjectURL;
    if (typeof origCreateObjectURL === "function") {
      URL.createObjectURL = function(obj) {
        const blobUrl = origCreateObjectURL.call(URL, obj);
        try {
          if (obj instanceof Blob && lastImageFetchSeq !== null) {
            const seq = lastImageFetchSeq;
            seqToBlobUrl.set(seq, blobUrl);
            blobUrlToSeq.set(blobUrl, seq);
            sendToContentScript({
              direction: "FROM_BRIDGE",
              event: "PAGE_IMAGE_READY",
              seq,
              blobUrl
            });
            setTimeout(() => tagHathiDomElements(seq, blobUrl), 20);
          }
        } catch (e) {}
        return blobUrl;
      };
    }
    const origLog = console.log;
    console.log = function(...args) {
      try {
        if (args[0] === "-- page.loadImage" && typeof args[1] === "number") {
          const seq = args[1];
          const isVisible = Boolean(args[2]);
          const isLoaded = Boolean(args[3]);
          sendToContentScript({
            direction: "FROM_BRIDGE",
            event: "PAGE_LOAD_ANNOUNCED",
            seq,
            isVisible,
            isLoaded
          });
          tagHathiDomElements(seq);
          setTimeout(() => tagHathiDomElements(seq), 50);
        }
      } catch (e) {}
      return origLog.apply(console, args);
    };
    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._requestUrl = String(url);
      return origXhrOpen.apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener("load", () => {
        if (this.status >= 400) {
          const url = this._requestUrl || this.responseURL || "";
          console.warn(`[ArchiveDownloader] HTTP error ${this.status} intercepted on XHR:`, url);
          let retryAfter;
          try {
            const h = this.getResponseHeader("retry-after");
            retryAfter = parseRetryAfterHeader(h);
          } catch (e) {}
          sendToContentScript({
            direction: "FROM_BRIDGE",
            event: "HTTP_ERROR",
            url,
            statusCode: this.status,
            retryAfter
          });
        }
      });
      return origXhrSend.apply(this, args);
    };
  } catch (err) {
    console.error("[ArchiveDownloader] Could not hook network/console methods:", err);
  }
  function getBookReader() {
    return window.br;
  }
  function extractPageInfoFromDom() {
    const pageEl = document.querySelector('.BRcurrentpage, [role="status"]');
    if (pageEl && pageEl.textContent) {
      const match = pageEl.textContent.match(/\((\d+)\s*\/\s*(\d+)\)/);
      if (match) {
        return {
          current: parseInt(match[1], 10),
          total: parseInt(match[2], 10)
        };
      }
      const slashMatch = pageEl.textContent.match(/\/\s*(\d+)/);
      if (slashMatch) {
        return {
          current: 0,
          total: parseInt(slashMatch[1], 10)
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
  function extractBookInfo() {
    const br = getBookReader();
    const domPageInfo = extractPageInfoFromDom();
    let totalPages = 0;
    if (domPageInfo && domPageInfo.total > 0) {
      totalPages = domPageInfo.total;
    }
    if (!totalPages && br) {
      if (br.book && typeof br.book.getNumLeafs === "function") {
        try {
          totalPages = br.book.getNumLeafs();
        } catch (e) {}
      }
      if (!totalPages && typeof br.getNumLeafs === "function") {
        try {
          totalPages = br.getNumLeafs();
        } catch (e) {}
      }
      if (!totalPages && typeof br.numLeafs === "function") {
        try {
          totalPages = br.numLeafs();
        } catch (e) {}
      }
      if (!totalPages && typeof br.numLeafs === "number" && br.numLeafs > 0) {
        totalPages = br.numLeafs;
      }
      if (!totalPages && Array.isArray(br.data)) {
        totalPages = br.data.flat().length;
      }
    }
    let currentLeaf = 0;
    if (domPageInfo && domPageInfo.current > 0) {
      currentLeaf = domPageInfo.current;
    } else if (br) {
      if (typeof br.leafNum === "number") {
        currentLeaf = br.leafNum;
      } else if (typeof br.currentIndex === "function") {
        try {
          const idx = br.currentIndex();
          if (typeof br.getLeafNum === "function") {
            currentLeaf = br.getLeafNum(idx);
          } else {
            currentLeaf = idx;
          }
        } catch (e) {
          currentLeaf = 0;
        }
      }
    }
    const currentMode = br && typeof br.mode === "number" ? br.mode : 0;
    const bookTitle = br && br.bookTitle || br?.book?.metadata?.title || document.title || "Archive Book";
    const bookId = br && br.bookId || "";
    if (!br && !domPageInfo && !bookId)
      return null;
    return {
      bookId,
      bookTitle,
      totalPages,
      currentLeaf,
      currentMode,
      server: br && br.server || "",
      bookPath: br && br.bookPath || "",
      isProtected: Boolean(br && br.protected),
      sourceUrl: window.location.href
    };
  }
  function tagArchiveDomElements(leaf) {
    try {
      const selectors = [
        `.BRpagecontainer[data-index="${leaf}"] img`,
        `.pagediv${leaf} img`,
        `[data-index="${leaf}"] img`,
        `.BRpage[data-page="${leaf}"] img`,
        `.BRpage[data-leaf="${leaf}"] img`,
        `#pagediv${leaf} img`,
        `#page${leaf} img`
      ];
      for (const sel of selectors) {
        const img = document.querySelector(sel);
        if (img) {
          img.dataset.seq = String(leaf);
          break;
        }
      }
    } catch (e) {}
  }
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.direction !== "TO_BRIDGE") {
      return;
    }
    const { action } = event.data;
    const br = getBookReader();
    switch (action) {
      case "DETECT_BOOK": {
        const info = extractBookInfo();
        if (info) {
          sendToContentScript({
            direction: "FROM_BRIDGE",
            event: "BOOK_INFO",
            data: info
          });
        }
        break;
      }
      case "SWITCH_MODE_1": {
        if (br) {
          console.log("[ArchiveDownloader] Switching to 1-page mode");
          if (typeof br.switchMode === "function") {
            try {
              br.switchMode(1);
            } catch (e) {}
          } else if (typeof br.switchReadMode === "function") {
            try {
              br.switchReadMode(1);
            } catch (e) {}
          }
          setTimeout(() => {
            const info = extractBookInfo();
            if (info) {
              sendToContentScript({
                direction: "FROM_BRIDGE",
                event: "MODE_CHANGED",
                mode: br.mode || 1
              });
              sendToContentScript({
                direction: "FROM_BRIDGE",
                event: "BOOK_INFO",
                data: info
              });
            }
          }, 400);
        }
        break;
      }
      case "FLIP_NEXT": {
        const targetPage = typeof event.data.targetPage === "number" ? event.data.targetPage : undefined;
        if (br) {
          console.log(`[ArchiveDownloader] Flipping next page via BookReader (target: ${targetPage ?? "next"})`);
          let flipped = false;
          if (typeof br.next === "function") {
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
          if (!flipped) {
            if (typeof br.flipRight === "function") {
              try {
                br.flipRight();
                flipped = true;
              } catch (e) {}
            } else if (typeof br.right === "function") {
              try {
                br.right();
                flipped = true;
              } catch (e) {}
            }
          }
          if (!flipped && typeof targetPage === "number") {
            if (typeof br.jumpToIndex === "function") {
              try {
                br.jumpToIndex(targetPage, { noAnimate: true });
                flipped = true;
              } catch (e) {
                try {
                  br.jumpToIndex(targetPage);
                  flipped = true;
                } catch (e2) {}
              }
            } else if (typeof br.jumpToLeaf === "function") {
              try {
                br.jumpToLeaf(targetPage);
                flipped = true;
              } catch (e) {}
            } else if (typeof br.goToPage === "function") {
              try {
                br.goToPage(targetPage);
                flipped = true;
              } catch (e) {}
            }
          }
          if (typeof targetPage === "number") {
            setTimeout(() => tagArchiveDomElements(targetPage), 150);
          }
        }
        break;
      }
      case "JUMP_PAGE": {
        const leafIndex = typeof event.data.leafIndex === "number" ? event.data.leafIndex : 0;
        if (br) {
          console.log(`[ArchiveDownloader] Jumping to leaf ${leafIndex}`);
          let jumped = false;
          if (typeof br.jumpToIndex === "function") {
            try {
              br.jumpToIndex(leafIndex, { noAnimate: true });
              jumped = true;
            } catch (e) {
              try {
                br.jumpToIndex(leafIndex);
                jumped = true;
              } catch (e2) {}
            }
          }
          if (!jumped && typeof br.jumpToLeaf === "function") {
            try {
              br.jumpToLeaf(leafIndex);
              jumped = true;
            } catch (e) {}
          }
          if (!jumped && typeof br.goToPage === "function") {
            try {
              br.goToPage(leafIndex);
              jumped = true;
            } catch (e) {}
          }
          setTimeout(() => tagArchiveDomElements(leafIndex), 200);
        }
        if (leafIndex === 0) {
          if (br && typeof br.first === "function") {
            try {
              br.first();
            } catch (e) {}
          }
          const homeEvent = {
            bubbles: true,
            cancelable: true,
            key: "Home",
            code: "Home",
            keyCode: 36,
            which: 36
          };
          document.body.dispatchEvent(new KeyboardEvent("keydown", homeEvent));
          window.dispatchEvent(new KeyboardEvent("keydown", homeEvent));
        }
        break;
      }
    }
  });
  let pollCount = 0;
  const pollInterval = setInterval(() => {
    pollCount++;
    const info = extractBookInfo();
    if (info && info.totalPages > 0) {
      clearInterval(pollInterval);
      console.log("[ArchiveDownloader] Book detected:", info.bookTitle, `(${info.totalPages} pages)`);
      sendToContentScript({
        direction: "FROM_BRIDGE",
        event: "BOOK_INFO",
        data: info
      });
    } else if (pollCount > 40) {
      clearInterval(pollInterval);
      if (info) {
        sendToContentScript({
          direction: "FROM_BRIDGE",
          event: "BOOK_INFO",
          data: info
        });
      }
    }
  }, 400);
})();

//# debugId=929BC1AC978A83FF64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvYnJpZGdlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIi8qKlxuICogQnJpZGdlIHNjcmlwdCBydW5uaW5nIGluIHdvcmxkOiBcIk1BSU5cIlxuICogSW50ZXJhY3RzIGRpcmVjdGx5IHdpdGggQXJjaGl2ZS5vcmcncyBuYXRpdmUgQm9va1JlYWRlciAod2luZG93LmJyKSBvYmplY3QuXG4gKi9cblxuaW1wb3J0IHsgQm9va0luZm8sIEJyaWRnZU1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcyc7XG5cbihmdW5jdGlvbiBpbml0QnJpZGdlKCkge1xuICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBJbmplY3RlZCBpbnRvIE1BSU4gd29ybGQnKTtcblxuICBmdW5jdGlvbiBzZW5kVG9Db250ZW50U2NyaXB0KG1zZzogQnJpZGdlTWVzc2FnZSkge1xuICAgIHdpbmRvdy5wb3N0TWVzc2FnZShtc2csICcqJyk7XG4gIH1cblxuICBjb25zdCBzZXFUb0Jsb2JVcmwgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuICBjb25zdCBibG9iVXJsVG9TZXEgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBsZXQgbGFzdEltYWdlRmV0Y2hTZXE6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxOiBudW1iZXIsIGJsb2JVcmw/OiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGFyZ2V0QmxvYiA9IGJsb2JVcmwgfHwgc2VxVG9CbG9iVXJsLmdldChzZXEpO1xuICAgICAgbGV0IGltZzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgICAgaWYgKHRhcmdldEJsb2IpIHtcbiAgICAgICAgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW3NyYz1cIiR7dGFyZ2V0QmxvYn1cIl1gKTtcbiAgICAgIH1cbiAgICAgIGlmICghaW1nKSB7XG4gICAgICAgIGNvbnN0IHNwcmVhZEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI3NwcmVhZCR7c2VxfSwgW2lkKj1cInNwcmVhZFwiXVtpZCo9XCIke3NlcX1cIl1gKTtcbiAgICAgICAgaWYgKHNwcmVhZEVsKSB7XG4gICAgICAgICAgaW1nID0gc3ByZWFkRWwucXVlcnlTZWxlY3RvcignZGV0YWlscyBmaWd1cmUgaW1nLCBmaWd1cmUgaW1nLCBpbWdbc3JjXj1cImJsb2I6XCJdJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnZGF0YS1zZXEnLCBTdHJpbmcoc2VxKSk7XG4gICAgICAgIGltZy5kYXRhc2V0LnNlcSA9IFN0cmluZyhzZXEpO1xuICAgICAgICBjb25zdCBmaWcgPSBpbWcuY2xvc2VzdCgnZmlndXJlJyk7XG4gICAgICAgIGlmIChmaWcpIHtcbiAgICAgICAgICBmaWcuc2V0QXR0cmlidXRlKCdkYXRhLXNlcScsIFN0cmluZyhzZXEpKTtcbiAgICAgICAgICBmaWcuZGF0YXNldC5zZXEgPSBTdHJpbmcoc2VxKTtcbiAgICAgICAgICBjb25zdCBjYXAgPSBmaWcucXVlcnlTZWxlY3RvcignZmlnY2FwdGlvbicpO1xuICAgICAgICAgIGlmIChjYXApIHtcbiAgICAgICAgICAgIGNhcC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHNlcSkpO1xuICAgICAgICAgICAgY2FwLmRhdGFzZXQuc2VxID0gU3RyaW5nKHNlcSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNwcmVhZCA9IGltZy5jbG9zZXN0KCcuc3ByZWFkJykgfHwgaW1nLmNsb3Nlc3QoJ1tpZCo9XCJzcHJlYWRcIl0nKTtcbiAgICAgICAgaWYgKHNwcmVhZCkge1xuICAgICAgICAgIHNwcmVhZC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHNlcSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlUmV0cnlBZnRlckhlYWRlcihoOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIWgpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdHJpbW1lZCA9IGgudHJpbSgpO1xuICAgIGNvbnN0IHBhcnNlZEludCA9IHBhcnNlSW50KHRyaW1tZWQsIDEwKTtcbiAgICBpZiAoIWlzTmFOKHBhcnNlZEludCkgJiYgL15cXGQrJC8udGVzdCh0cmltbWVkKSkge1xuICAgICAgcmV0dXJuIHBhcnNlZEludCA+IDAgPyBwYXJzZWRJbnQgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGRhdGVNcyA9IERhdGUucGFyc2UodHJpbW1lZCk7XG4gICAgaWYgKCFpc05hTihkYXRlTXMpKSB7XG4gICAgICBjb25zdCBkaWZmU2VjID0gTWF0aC5yb3VuZCgoZGF0ZU1zIC0gRGF0ZS5ub3coKSkgLyAxMDAwKTtcbiAgICAgIHJldHVybiBkaWZmU2VjID4gMCA/IGRpZmZTZWMgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBJbnRlcmNlcHQgd2luZG93LmZldGNoIGFuZCBYTUxIdHRwUmVxdWVzdCB0byBjYXRjaCBIVFRQIHN0YXR1cyA+PSA0MDAgYW5kIGNhcHR1cmUgSGF0aGlUcnVzdCBpbWFnZS90ZXh0IHJlcXVlc3RzXG4gIHRyeSB7XG4gICAgY29uc3Qgb3JpZ0ZldGNoID0gd2luZG93LmZldGNoO1xuICAgIGlmICh0eXBlb2Ygb3JpZ0ZldGNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB3aW5kb3cuZmV0Y2ggPSBhc3luYyBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc3QgdXJsID0gdHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnXG4gICAgICAgICAgPyBhcmdzWzBdXG4gICAgICAgICAgOiAoYXJnc1swXSAmJiAoYXJnc1swXSBhcyBhbnkpLnVybCA/IChhcmdzWzBdIGFzIGFueSkudXJsIDogJycpO1xuXG4gICAgICAgIGxldCBzZXFGcm9tVXJsOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgaWYgKHVybCAmJiAodXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9pbWFnZScpIHx8IHVybC5pbmNsdWRlcygnL2NnaS9pbWdzcnYvdGh1bWJuYWlsJykgfHwgdXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9odG1sJykpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgICBjb25zdCBzID0gcGFyc2VkLnNlYXJjaFBhcmFtcy5nZXQoJ3NlcScpO1xuICAgICAgICAgICAgaWYgKHMpIHtcbiAgICAgICAgICAgICAgc2VxRnJvbVVybCA9IHBhcnNlSW50KHMsIDEwKTtcbiAgICAgICAgICAgICAgaWYgKCFpc05hTihzZXFGcm9tVXJsKSAmJiAodXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9pbWFnZScpIHx8IHVybC5pbmNsdWRlcygnL2NnaS9pbWdzcnYvdGh1bWJuYWlsJykpKSB7XG4gICAgICAgICAgICAgICAgbGFzdEltYWdlRmV0Y2hTZXEgPSBzZXFGcm9tVXJsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgb3JpZ0ZldGNoLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgIGxldCByZXRyeUFmdGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGggPSByZXNwb25zZS5oZWFkZXJzLmdldCgncmV0cnktYWZ0ZXInKTtcbiAgICAgICAgICAgIHJldHJ5QWZ0ZXIgPSBwYXJzZVJldHJ5QWZ0ZXJIZWFkZXIoaCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7cmVzcG9uc2Uuc3RhdHVzfSBpbnRlcmNlcHRlZCBvbiBmZXRjaDpgLCB1cmwpO1xuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdIVFRQX0VSUk9SJyxcbiAgICAgICAgICAgIHVybDogdXJsIHx8IHJlc3BvbnNlLnVybCB8fCAnJyxcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICAgIHJldHJ5QWZ0ZXIsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uub2sgJiYgc2VxRnJvbVVybCAhPT0gbnVsbCAmJiB1cmwuaW5jbHVkZXMoJy9jZ2kvaW1nc3J2L2h0bWwnKSkge1xuICAgICAgICAgIC8vIEludGVyY2VwdCBPQ1IgSFRNTCB0ZXh0IGRpcmVjdGx5IGZyb20gcmVzcG9uc2VcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY2xvbmUgPSByZXNwb25zZS5jbG9uZSgpO1xuICAgICAgICAgICAgY29uc3Qgc2VxID0gc2VxRnJvbVVybDtcbiAgICAgICAgICAgIGNsb25lLnRleHQoKS50aGVuKChodG1sVGV4dCkgPT4ge1xuICAgICAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgICAgICAgICAgZXZlbnQ6ICdQQUdFX1RFWFRfUkVBRFknLFxuICAgICAgICAgICAgICAgIHNlcSxcbiAgICAgICAgICAgICAgICBodG1sOiBodG1sVGV4dCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gSG9vayBVUkwuY3JlYXRlT2JqZWN0VVJMIHRvIGFzc29jaWF0ZSBibG9iIFVSTHMgd2l0aCBzZXF1ZW5jZSBudW1iZXJzXG4gICAgY29uc3Qgb3JpZ0NyZWF0ZU9iamVjdFVSTCA9IFVSTC5jcmVhdGVPYmplY3RVUkw7XG4gICAgaWYgKHR5cGVvZiBvcmlnQ3JlYXRlT2JqZWN0VVJMID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBVUkwuY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24gKG9iajogQmxvYiB8IE1lZGlhU291cmNlKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgYmxvYlVybCA9IG9yaWdDcmVhdGVPYmplY3RVUkwuY2FsbChVUkwsIG9iaik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJsb2IgJiYgbGFzdEltYWdlRmV0Y2hTZXEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcSA9IGxhc3RJbWFnZUZldGNoU2VxO1xuICAgICAgICAgICAgc2VxVG9CbG9iVXJsLnNldChzZXEsIGJsb2JVcmwpO1xuICAgICAgICAgICAgYmxvYlVybFRvU2VxLnNldChibG9iVXJsLCBzZXEpO1xuICAgICAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgICAgZXZlbnQ6ICdQQUdFX0lNQUdFX1JFQURZJyxcbiAgICAgICAgICAgICAgc2VxLFxuICAgICAgICAgICAgICBibG9iVXJsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxLCBibG9iVXJsKSwgMjApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgcmV0dXJuIGJsb2JVcmw7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEhvb2sgY29uc29sZS5sb2cgdG8gbGlzdGVuIGZvciBIYXRoaVRydXN0J3MgaW50ZXJuYWwgcGFnZS5sb2FkSW1hZ2UgYW5ub3VuY2VtZW50c1xuICAgIC8vIEZvcm1hdDogY29uc29sZS5sb2coXCItLSBwYWdlLmxvYWRJbWFnZVwiLCBzZXEoKSwgZ2V0KGlzVmlzaWJsZTIpLCBnZXQoaXNMb2FkZWQpKTtcbiAgICBjb25zdCBvcmlnTG9nID0gY29uc29sZS5sb2c7XG4gICAgY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChhcmdzWzBdID09PSAnLS0gcGFnZS5sb2FkSW1hZ2UnICYmIHR5cGVvZiBhcmdzWzFdID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGNvbnN0IHNlcSA9IGFyZ3NbMV07XG4gICAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gQm9vbGVhbihhcmdzWzJdKTtcbiAgICAgICAgICBjb25zdCBpc0xvYWRlZCA9IEJvb2xlYW4oYXJnc1szXSk7XG5cbiAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgIGV2ZW50OiAnUEFHRV9MT0FEX0FOTk9VTkNFRCcsXG4gICAgICAgICAgICBzZXEsXG4gICAgICAgICAgICBpc1Zpc2libGUsXG4gICAgICAgICAgICBpc0xvYWRlZCxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxKSwgNTApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgcmV0dXJuIG9yaWdMb2cuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gICAgfTtcblxuICAgIGNvbnN0IG9yaWdYaHJPcGVuID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLm9wZW47XG4gICAgY29uc3Qgb3JpZ1hoclNlbmQgPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZDtcbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtZXRob2Q6IHN0cmluZywgdXJsOiBzdHJpbmcgfCBVUkwsIC4uLnJlc3Q6IGFueVtdKSB7XG4gICAgICAodGhpcyBhcyBhbnkpLl9yZXF1ZXN0VXJsID0gU3RyaW5nKHVybCk7XG4gICAgICByZXR1cm4gKG9yaWdYaHJPcGVuIGFzIGFueSkuYXBwbHkodGhpcywgW21ldGhvZCwgdXJsLCAuLi5yZXN0XSk7XG4gICAgfTtcbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gKHRoaXMgYXMgYW55KS5fcmVxdWVzdFVybCB8fCB0aGlzLnJlc3BvbnNlVVJMIHx8ICcnO1xuICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7dGhpcy5zdGF0dXN9IGludGVyY2VwdGVkIG9uIFhIUjpgLCB1cmwpO1xuICAgICAgICAgIGxldCByZXRyeUFmdGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGggPSB0aGlzLmdldFJlc3BvbnNlSGVhZGVyKCdyZXRyeS1hZnRlcicpO1xuICAgICAgICAgICAgcmV0cnlBZnRlciA9IHBhcnNlUmV0cnlBZnRlckhlYWRlcihoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdIVFRQX0VSUk9SJyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgICAgcmV0cnlBZnRlcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gb3JpZ1hoclNlbmQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgaG9vayBuZXR3b3JrL2NvbnNvbGUgbWV0aG9kczonLCBlcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Qm9va1JlYWRlcigpOiBhbnkge1xuICAgIHJldHVybiAod2luZG93IGFzIGFueSkuYnI7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0UGFnZUluZm9Gcm9tRG9tKCk6IHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0gfCBudWxsIHtcbiAgICAvLyBBcmNoaXZlLm9yZyByZW5kZXJzOiA8c3BhbiBjbGFzcz1cIkJSY3VycmVudHBhZ2VcIiByb2xlPVwic3RhdHVzXCI+UGFnZSDigJQgKDAvNTE1KTwvc3Bhbj5cbiAgICBjb25zdCBwYWdlRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0nKTtcbiAgICBpZiAocGFnZUVsICYmIHBhZ2VFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYWdlRWwudGV4dENvbnRlbnQubWF0Y2goL1xcKChcXGQrKVxccypcXC9cXHMqKFxcZCspXFwpLyk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjdXJyZW50OiBwYXJzZUludChtYXRjaFsxXSwgMTApLFxuICAgICAgICAgIHRvdGFsOiBwYXJzZUludChtYXRjaFsyXSwgMTApLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzbGFzaE1hdGNoID0gcGFnZUVsLnRleHRDb250ZW50Lm1hdGNoKC9cXC9cXHMqKFxcZCspLyk7XG4gICAgICBpZiAoc2xhc2hNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGN1cnJlbnQ6IDAsXG4gICAgICAgICAgdG90YWw6IHBhcnNlSW50KHNsYXNoTWF0Y2hbMV0sIDEwKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBudW1QYWdlc0VsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkJSbnVtcGFnZXMsIFthcmlhLWxhYmVsKj1cInRvdGFsIHBhZ2VzXCIgaV0sIC5wYWdlLW51bWJlcicpO1xuICAgIGlmIChudW1QYWdlc0VsICYmIG51bVBhZ2VzRWwudGV4dENvbnRlbnQpIHtcbiAgICAgIGNvbnN0IG0gPSBudW1QYWdlc0VsLnRleHRDb250ZW50Lm1hdGNoKC9cXGQrLyk7XG4gICAgICBpZiAobSkge1xuICAgICAgICByZXR1cm4geyBjdXJyZW50OiAwLCB0b3RhbDogcGFyc2VJbnQobVswXSwgMTApIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0Qm9va0luZm8oKTogQm9va0luZm8gfCBudWxsIHtcbiAgICBjb25zdCBiciA9IGdldEJvb2tSZWFkZXIoKTtcbiAgICBjb25zdCBkb21QYWdlSW5mbyA9IGV4dHJhY3RQYWdlSW5mb0Zyb21Eb20oKTtcblxuICAgIGxldCB0b3RhbFBhZ2VzID0gMDtcblxuICAgIC8vIDEuIFByaW1hcnk6IElmIERPTSBoYXMgdGhlIGV4YWN0ICgwLzUxNSkgZm9ybWF0LCB0cnVzdCBpdCFcbiAgICBpZiAoZG9tUGFnZUluZm8gJiYgZG9tUGFnZUluZm8udG90YWwgPiAwKSB7XG4gICAgICB0b3RhbFBhZ2VzID0gZG9tUGFnZUluZm8udG90YWw7XG4gICAgfVxuXG4gICAgLy8gMi4gQm9va1JlYWRlciBBUEkgbWV0aG9kcyAoc3VwcG9ydGluZyBtdWx0aXBsZSBCb29rUmVhZGVyIHZlcnNpb25zKVxuICAgIGlmICghdG90YWxQYWdlcyAmJiBicikge1xuICAgICAgaWYgKGJyLmJvb2sgJiYgdHlwZW9mIGJyLmJvb2suZ2V0TnVtTGVhZnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHsgdG90YWxQYWdlcyA9IGJyLmJvb2suZ2V0TnVtTGVhZnMoKTsgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cblxuICAgICAgaWYgKCF0b3RhbFBhZ2VzICYmIHR5cGVvZiBici5nZXROdW1MZWFmcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRvdGFsUGFnZXMgPSBici5nZXROdW1MZWFmcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRvdGFsUGFnZXMgJiYgdHlwZW9mIGJyLm51bUxlYWZzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdG90YWxQYWdlcyA9IGJyLm51bUxlYWZzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9XG5cbiAgICAgIGlmICghdG90YWxQYWdlcyAmJiB0eXBlb2YgYnIubnVtTGVhZnMgPT09ICdudW1iZXInICYmIGJyLm51bUxlYWZzID4gMCkge1xuICAgICAgICB0b3RhbFBhZ2VzID0gYnIubnVtTGVhZnM7XG4gICAgICB9XG5cbiAgICAgIGlmICghdG90YWxQYWdlcyAmJiBBcnJheS5pc0FycmF5KGJyLmRhdGEpKSB7XG4gICAgICAgIC8vIEluIDItcGFnZSBtb2RlLCBici5kYXRhIGlzIGFuIGFycmF5IG9mIHBhaXJzLiBGbGF0dGVuaW5nIGdpdmVzIGFsbCBpbmRpdmlkdWFsIHBhZ2VzIVxuICAgICAgICB0b3RhbFBhZ2VzID0gYnIuZGF0YS5mbGF0KCkubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEN1cnJlbnQgbGVhZlxuICAgIGxldCBjdXJyZW50TGVhZiA9IDA7XG4gICAgaWYgKGRvbVBhZ2VJbmZvICYmIGRvbVBhZ2VJbmZvLmN1cnJlbnQgPiAwKSB7XG4gICAgICBjdXJyZW50TGVhZiA9IGRvbVBhZ2VJbmZvLmN1cnJlbnQ7XG4gICAgfSBlbHNlIGlmIChicikge1xuICAgICAgaWYgKHR5cGVvZiBici5sZWFmTnVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBjdXJyZW50TGVhZiA9IGJyLmxlYWZOdW07XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBici5jdXJyZW50SW5kZXggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBpZHggPSBici5jdXJyZW50SW5kZXgoKTtcbiAgICAgICAgICBpZiAodHlwZW9mIGJyLmdldExlYWZOdW0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGN1cnJlbnRMZWFmID0gYnIuZ2V0TGVhZk51bShpZHgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50TGVhZiA9IGlkeDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjdXJyZW50TGVhZiA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50TW9kZSA9IChiciAmJiB0eXBlb2YgYnIubW9kZSA9PT0gJ251bWJlcicpID8gYnIubW9kZSA6IDA7XG4gICAgY29uc3QgYm9va1RpdGxlID0gKGJyICYmIGJyLmJvb2tUaXRsZSkgfHwgKGJyPy5ib29rPy5tZXRhZGF0YT8udGl0bGUpIHx8IGRvY3VtZW50LnRpdGxlIHx8ICdBcmNoaXZlIEJvb2snO1xuICAgIGNvbnN0IGJvb2tJZCA9IChiciAmJiBici5ib29rSWQpIHx8ICcnO1xuXG4gICAgaWYgKCFiciAmJiAhZG9tUGFnZUluZm8gJiYgIWJvb2tJZCkgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgYm9va0lkLFxuICAgICAgYm9va1RpdGxlLFxuICAgICAgdG90YWxQYWdlcyxcbiAgICAgIGN1cnJlbnRMZWFmLFxuICAgICAgY3VycmVudE1vZGUsXG4gICAgICBzZXJ2ZXI6IChiciAmJiBici5zZXJ2ZXIpIHx8ICcnLFxuICAgICAgYm9va1BhdGg6IChiciAmJiBici5ib29rUGF0aCkgfHwgJycsXG4gICAgICBpc1Byb3RlY3RlZDogQm9vbGVhbihiciAmJiBici5wcm90ZWN0ZWQpLFxuICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdGFnQXJjaGl2ZURvbUVsZW1lbnRzKGxlYWY6IG51bWJlcikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZWxlY3RvcnMgPSBbXG4gICAgICAgIGAuQlJwYWdlY29udGFpbmVyW2RhdGEtaW5kZXg9XCIke2xlYWZ9XCJdIGltZ2AsXG4gICAgICAgIGAucGFnZWRpdiR7bGVhZn0gaW1nYCxcbiAgICAgICAgYFtkYXRhLWluZGV4PVwiJHtsZWFmfVwiXSBpbWdgLFxuICAgICAgICBgLkJScGFnZVtkYXRhLXBhZ2U9XCIke2xlYWZ9XCJdIGltZ2AsXG4gICAgICAgIGAuQlJwYWdlW2RhdGEtbGVhZj1cIiR7bGVhZn1cIl0gaW1nYCxcbiAgICAgICAgYCNwYWdlZGl2JHtsZWFmfSBpbWdgLFxuICAgICAgICBgI3BhZ2Uke2xlYWZ9IGltZ2AsXG4gICAgICBdO1xuICAgICAgZm9yIChjb25zdCBzZWwgb2Ygc2VsZWN0b3JzKSB7XG4gICAgICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEltYWdlRWxlbWVudD4oc2VsKTtcbiAgICAgICAgaWYgKGltZykge1xuICAgICAgICAgIGltZy5kYXRhc2V0LnNlcSA9IFN0cmluZyhsZWFmKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cblxuICAvLyBIYW5kbGUgY29tbWFuZHMgZnJvbSBjb250ZW50IHNjcmlwdFxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ1RPX0JSSURHRScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7IGFjdGlvbiB9ID0gZXZlbnQuZGF0YTtcbiAgICBjb25zdCBiciA9IGdldEJvb2tSZWFkZXIoKTtcblxuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlICdERVRFQ1RfQk9PSyc6IHtcbiAgICAgICAgY29uc3QgaW5mbyA9IGV4dHJhY3RCb29rSW5mbygpO1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdCT09LX0lORk8nLFxuICAgICAgICAgICAgZGF0YTogaW5mbyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1dJVENIX01PREVfMSc6IHtcbiAgICAgICAgaWYgKGJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gU3dpdGNoaW5nIHRvIDEtcGFnZSBtb2RlJyk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBici5zd2l0Y2hNb2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkgeyBici5zd2l0Y2hNb2RlKDEpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJyLnN3aXRjaFJlYWRNb2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkgeyBici5zd2l0Y2hSZWFkTW9kZSgxKTsgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gZXh0cmFjdEJvb2tJbmZvKCk7XG4gICAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgICAgICAgICAgZXZlbnQ6ICdNT0RFX0NIQU5HRUQnLFxuICAgICAgICAgICAgICAgIG1vZGU6IGJyLm1vZGUgfHwgMSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgICAgICBldmVudDogJ0JPT0tfSU5GTycsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5mbyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgNDAwKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnRkxJUF9ORVhUJzoge1xuICAgICAgICBjb25zdCB0YXJnZXRQYWdlID0gdHlwZW9mIGV2ZW50LmRhdGEudGFyZ2V0UGFnZSA9PT0gJ251bWJlcicgPyBldmVudC5kYXRhLnRhcmdldFBhZ2UgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChicikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEZsaXBwaW5nIG5leHQgcGFnZSB2aWEgQm9va1JlYWRlciAodGFyZ2V0OiAke3RhcmdldFBhZ2UgPz8gJ25leHQnfSlgKTtcbiAgICAgICAgICBsZXQgZmxpcHBlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgLy8gMS4gUHJpbWFyeTogYnIubmV4dCgpIC0gc3RhbmRhcmQgbWV0aG9kIGFjcm9zcyBCb29rUmVhZGVyIHZlcnNpb25zXG4gICAgICAgICAgaWYgKHR5cGVvZiBici5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBici5uZXh0KCk7XG4gICAgICAgICAgICAgIGZsaXBwZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGJyLm5leHQoeyBub0FuaW1hdGU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZmxpcHBlZCA9IHRydWU7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUyKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDIuIFNlY29uZGFyeTogYnIuZmxpcFJpZ2h0KCkgb3IgYnIucmlnaHQoKSAtIGxlZ2FjeSB2ZXJzaW9uc1xuICAgICAgICAgIGlmICghZmxpcHBlZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBici5mbGlwUmlnaHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHsgYnIuZmxpcFJpZ2h0KCk7IGZsaXBwZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYnIucmlnaHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHsgYnIucmlnaHQoKTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gMy4gRmFsbGJhY2s6IGRpcmVjdCBqdW1wIGlmIHRhcmdldFBhZ2UgaXMgc3BlY2lmaWVkIGFuZCBici5uZXh0IHdhc24ndCBhdmFpbGFibGVcbiAgICAgICAgICBpZiAoIWZsaXBwZWQgJiYgdHlwZW9mIHRhcmdldFBhZ2UgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJyLmp1bXBUb0luZGV4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHRyeSB7IGJyLmp1bXBUb0luZGV4KHRhcmdldFBhZ2UsIHsgbm9BbmltYXRlOiB0cnVlIH0pOyBmbGlwcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7IGJyLmp1bXBUb0luZGV4KHRhcmdldFBhZ2UpOyBmbGlwcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZTIpIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJyLmp1bXBUb0xlYWYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHsgYnIuanVtcFRvTGVhZih0YXJnZXRQYWdlKTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBici5nb1RvUGFnZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0cnkgeyBici5nb1RvUGFnZSh0YXJnZXRQYWdlKTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXRQYWdlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0YWdBcmNoaXZlRG9tRWxlbWVudHModGFyZ2V0UGFnZSksIDE1MCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdKVU1QX1BBR0UnOiB7XG4gICAgICAgIGNvbnN0IGxlYWZJbmRleCA9IHR5cGVvZiBldmVudC5kYXRhLmxlYWZJbmRleCA9PT0gJ251bWJlcicgPyBldmVudC5kYXRhLmxlYWZJbmRleCA6IDA7XG4gICAgICAgIGlmIChicikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEp1bXBpbmcgdG8gbGVhZiAke2xlYWZJbmRleH1gKTtcbiAgICAgICAgICBsZXQganVtcGVkID0gZmFsc2U7XG4gICAgICAgICAgaWYgKHR5cGVvZiBici5qdW1wVG9JbmRleCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHsgYnIuanVtcFRvSW5kZXgobGVhZkluZGV4LCB7IG5vQW5pbWF0ZTogdHJ1ZSB9KTsganVtcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICB0cnkgeyBici5qdW1wVG9JbmRleChsZWFmSW5kZXgpOyBqdW1wZWQgPSB0cnVlOyB9IGNhdGNoIChlMikge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFqdW1wZWQgJiYgdHlwZW9mIGJyLmp1bXBUb0xlYWYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7IGJyLmp1bXBUb0xlYWYobGVhZkluZGV4KTsganVtcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFqdW1wZWQgJiYgdHlwZW9mIGJyLmdvVG9QYWdlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkgeyBici5nb1RvUGFnZShsZWFmSW5kZXgpOyBqdW1wZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRhZ0FyY2hpdmVEb21FbGVtZW50cyhsZWFmSW5kZXgpLCAyMDApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFmSW5kZXggPT09IDApIHtcbiAgICAgICAgICBpZiAoYnIgJiYgdHlwZW9mIGJyLmZpcnN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkgeyBici5maXJzdCgpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBob21lRXZlbnQgPSB7XG4gICAgICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGtleTogJ0hvbWUnLFxuICAgICAgICAgICAgY29kZTogJ0hvbWUnLFxuICAgICAgICAgICAga2V5Q29kZTogMzYsXG4gICAgICAgICAgICB3aGljaDogMzYsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBob21lRXZlbnQpKTtcbiAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGhvbWVFdmVudCkpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gUG9sbCBmb3IgQm9va1JlYWRlciAmIERPTSBwYWdlIGF2YWlsYWJpbGl0eVxuICBsZXQgcG9sbENvdW50ID0gMDtcbiAgY29uc3QgcG9sbEludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIHBvbGxDb3VudCsrO1xuICAgIGNvbnN0IGluZm8gPSBleHRyYWN0Qm9va0luZm8oKTtcbiAgICBpZiAoaW5mbyAmJiBpbmZvLnRvdGFsUGFnZXMgPiAwKSB7XG4gICAgICBjbGVhckludGVydmFsKHBvbGxJbnRlcnZhbCk7XG4gICAgICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBCb29rIGRldGVjdGVkOicsIGluZm8uYm9va1RpdGxlLCBgKCR7aW5mby50b3RhbFBhZ2VzfSBwYWdlcylgKTtcbiAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgIGV2ZW50OiAnQk9PS19JTkZPJyxcbiAgICAgICAgZGF0YTogaW5mbyxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAocG9sbENvdW50ID4gNDApIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwocG9sbEludGVydmFsKTtcbiAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICBldmVudDogJ0JPT0tfSU5GTycsXG4gICAgICAgICAgZGF0YTogaW5mbyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCA0MDApO1xufSkoKTtcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7Q0FPQyxTQUFTLFVBQVUsR0FBRztBQUFBLEVBQ3JCLFFBQVEsSUFBSSw4Q0FBOEM7QUFBQSxFQUUxRCxTQUFTLG1CQUFtQixDQUFDLEtBQW9CO0FBQUEsSUFDL0MsT0FBTyxZQUFZLEtBQUssR0FBRztBQUFBO0FBQUEsRUFHN0IsTUFBTSxlQUFlLElBQUk7QUFBQSxFQUN6QixNQUFNLGVBQWUsSUFBSTtBQUFBLEVBQ3pCLElBQUksb0JBQW1DO0FBQUEsRUFFdkMsU0FBUyxtQkFBbUIsQ0FBQyxLQUFhLFNBQWtCO0FBQUEsSUFDMUQsSUFBSTtBQUFBLE1BQ0YsTUFBTSxhQUFhLFdBQVcsYUFBYSxJQUFJLEdBQUc7QUFBQSxNQUNsRCxJQUFJLE1BQStCO0FBQUEsTUFDbkMsSUFBSSxZQUFZO0FBQUEsUUFDZCxNQUFNLFNBQVMsY0FBYyxZQUFZLGNBQWM7QUFBQSxNQUN6RDtBQUFBLE1BQ0EsSUFBSSxDQUFDLEtBQUs7QUFBQSxRQUNSLE1BQU0sV0FBVyxTQUFTLGNBQWMsVUFBVSw0QkFBNEIsT0FBTztBQUFBLFFBQ3JGLElBQUksVUFBVTtBQUFBLFVBQ1osTUFBTSxTQUFTLGNBQWMsbURBQW1EO0FBQUEsUUFDbEY7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LFdBQVcsU0FBUyxDQUFDO0FBQUEsUUFDOUQ7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBO0FBQUEsR0FFSDtBQUFBLEVBR0QsSUFBSSxZQUFZO0FBQUEsRUFDaEIsTUFBTSxlQUFlLFlBQVksTUFBTTtBQUFBLElBQ3JDO0FBQUEsSUFDQSxNQUFNLE9BQU8sZ0JBQWdCO0FBQUEsSUFDN0IsSUFBSSxRQUFRLEtBQUssYUFBYSxHQUFHO0FBQUEsTUFDL0IsY0FBYyxZQUFZO0FBQUEsTUFDMUIsUUFBUSxJQUFJLHNDQUFzQyxLQUFLLFdBQVcsSUFBSSxLQUFLLG1CQUFtQjtBQUFBLE1BQzlGLG9CQUFvQjtBQUFBLFFBQ2xCLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxNQUNSLENBQUM7QUFBQSxJQUNILEVBQU8sU0FBSSxZQUFZLElBQUk7QUFBQSxNQUN6QixjQUFjLFlBQVk7QUFBQSxNQUMxQixJQUFJLE1BQU07QUFBQSxRQUNSLG9CQUFvQjtBQUFBLFVBQ2xCLFdBQVc7QUFBQSxVQUNYLE9BQU87QUFBQSxVQUNQLE1BQU07QUFBQSxRQUNSLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEtBQ0MsR0FBRztBQUFBLEdBQ0w7IiwKICAiZGVidWdJZCI6ICI5MjlCQzFBQzk3OEE4M0ZGNjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
