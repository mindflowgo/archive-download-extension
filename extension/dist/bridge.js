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
          try {
            br.flipSpeed = 0;
          } catch (e) {}
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
          }, 300);
        }
        break;
      }
      case "FLIP_NEXT": {
        const targetPage = typeof event.data.targetPage === "number" ? event.data.targetPage : undefined;
        if (br) {
          try {
            br.flipSpeed = 0;
            br.animating = false;
          } catch (e) {}
          console.log(`[ArchiveDownloader] Flipping next page via BookReader (target: ${targetPage ?? "next"})`);
          let flipped = false;
          if (typeof br.next === "function") {
            try {
              br.next({ noAnimate: true, flipSpeed: 0 });
              flipped = true;
            } catch (e) {
              try {
                br.next();
                flipped = true;
              } catch (e2) {}
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
          if (typeof targetPage === "number") {
            setTimeout(() => tagArchiveDomElements(targetPage), 80);
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

//# debugId=04ACF8554EE654D764756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvYnJpZGdlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIi8qKlxuICogQnJpZGdlIHNjcmlwdCBydW5uaW5nIGluIHdvcmxkOiBcIk1BSU5cIlxuICogSW50ZXJhY3RzIGRpcmVjdGx5IHdpdGggQXJjaGl2ZS5vcmcncyBuYXRpdmUgQm9va1JlYWRlciAod2luZG93LmJyKSBvYmplY3QuXG4gKi9cblxuaW1wb3J0IHsgQm9va0luZm8sIEJyaWRnZU1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcyc7XG5cbihmdW5jdGlvbiBpbml0QnJpZGdlKCkge1xuICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBJbmplY3RlZCBpbnRvIE1BSU4gd29ybGQnKTtcblxuICBmdW5jdGlvbiBzZW5kVG9Db250ZW50U2NyaXB0KG1zZzogQnJpZGdlTWVzc2FnZSkge1xuICAgIHdpbmRvdy5wb3N0TWVzc2FnZShtc2csICcqJyk7XG4gIH1cblxuICBjb25zdCBzZXFUb0Jsb2JVcmwgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuICBjb25zdCBibG9iVXJsVG9TZXEgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBsZXQgbGFzdEltYWdlRmV0Y2hTZXE6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxOiBudW1iZXIsIGJsb2JVcmw/OiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGFyZ2V0QmxvYiA9IGJsb2JVcmwgfHwgc2VxVG9CbG9iVXJsLmdldChzZXEpO1xuICAgICAgbGV0IGltZzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgICAgaWYgKHRhcmdldEJsb2IpIHtcbiAgICAgICAgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW3NyYz1cIiR7dGFyZ2V0QmxvYn1cIl1gKTtcbiAgICAgIH1cbiAgICAgIGlmICghaW1nKSB7XG4gICAgICAgIGNvbnN0IHNwcmVhZEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI3NwcmVhZCR7c2VxfSwgW2lkKj1cInNwcmVhZFwiXVtpZCo9XCIke3NlcX1cIl1gKTtcbiAgICAgICAgaWYgKHNwcmVhZEVsKSB7XG4gICAgICAgICAgaW1nID0gc3ByZWFkRWwucXVlcnlTZWxlY3RvcignZGV0YWlscyBmaWd1cmUgaW1nLCBmaWd1cmUgaW1nLCBpbWdbc3JjXj1cImJsb2I6XCJdJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnZGF0YS1zZXEnLCBTdHJpbmcoc2VxKSk7XG4gICAgICAgIGltZy5kYXRhc2V0LnNlcSA9IFN0cmluZyhzZXEpO1xuICAgICAgICBjb25zdCBmaWcgPSBpbWcuY2xvc2VzdCgnZmlndXJlJyk7XG4gICAgICAgIGlmIChmaWcpIHtcbiAgICAgICAgICBmaWcuc2V0QXR0cmlidXRlKCdkYXRhLXNlcScsIFN0cmluZyhzZXEpKTtcbiAgICAgICAgICBmaWcuZGF0YXNldC5zZXEgPSBTdHJpbmcoc2VxKTtcbiAgICAgICAgICBjb25zdCBjYXAgPSBmaWcucXVlcnlTZWxlY3RvcignZmlnY2FwdGlvbicpO1xuICAgICAgICAgIGlmIChjYXApIHtcbiAgICAgICAgICAgIGNhcC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHNlcSkpO1xuICAgICAgICAgICAgY2FwLmRhdGFzZXQuc2VxID0gU3RyaW5nKHNlcSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNwcmVhZCA9IGltZy5jbG9zZXN0KCcuc3ByZWFkJykgfHwgaW1nLmNsb3Nlc3QoJ1tpZCo9XCJzcHJlYWRcIl0nKTtcbiAgICAgICAgaWYgKHNwcmVhZCkge1xuICAgICAgICAgIHNwcmVhZC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHNlcSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlUmV0cnlBZnRlckhlYWRlcihoOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIWgpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdHJpbW1lZCA9IGgudHJpbSgpO1xuICAgIGNvbnN0IHBhcnNlZEludCA9IHBhcnNlSW50KHRyaW1tZWQsIDEwKTtcbiAgICBpZiAoIWlzTmFOKHBhcnNlZEludCkgJiYgL15cXGQrJC8udGVzdCh0cmltbWVkKSkge1xuICAgICAgcmV0dXJuIHBhcnNlZEludCA+IDAgPyBwYXJzZWRJbnQgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGRhdGVNcyA9IERhdGUucGFyc2UodHJpbW1lZCk7XG4gICAgaWYgKCFpc05hTihkYXRlTXMpKSB7XG4gICAgICBjb25zdCBkaWZmU2VjID0gTWF0aC5yb3VuZCgoZGF0ZU1zIC0gRGF0ZS5ub3coKSkgLyAxMDAwKTtcbiAgICAgIHJldHVybiBkaWZmU2VjID4gMCA/IGRpZmZTZWMgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBJbnRlcmNlcHQgd2luZG93LmZldGNoIGFuZCBYTUxIdHRwUmVxdWVzdCB0byBjYXRjaCBIVFRQIHN0YXR1cyA+PSA0MDAgYW5kIGNhcHR1cmUgSGF0aGlUcnVzdCBpbWFnZS90ZXh0IHJlcXVlc3RzXG4gIHRyeSB7XG4gICAgY29uc3Qgb3JpZ0ZldGNoID0gd2luZG93LmZldGNoO1xuICAgIGlmICh0eXBlb2Ygb3JpZ0ZldGNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB3aW5kb3cuZmV0Y2ggPSBhc3luYyBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc3QgdXJsID0gdHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnXG4gICAgICAgICAgPyBhcmdzWzBdXG4gICAgICAgICAgOiAoYXJnc1swXSAmJiAoYXJnc1swXSBhcyBhbnkpLnVybCA/IChhcmdzWzBdIGFzIGFueSkudXJsIDogJycpO1xuXG4gICAgICAgIGxldCBzZXFGcm9tVXJsOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgaWYgKHVybCAmJiAodXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9pbWFnZScpIHx8IHVybC5pbmNsdWRlcygnL2NnaS9pbWdzcnYvdGh1bWJuYWlsJykgfHwgdXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9odG1sJykpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgICBjb25zdCBzID0gcGFyc2VkLnNlYXJjaFBhcmFtcy5nZXQoJ3NlcScpO1xuICAgICAgICAgICAgaWYgKHMpIHtcbiAgICAgICAgICAgICAgc2VxRnJvbVVybCA9IHBhcnNlSW50KHMsIDEwKTtcbiAgICAgICAgICAgICAgaWYgKCFpc05hTihzZXFGcm9tVXJsKSAmJiAodXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9pbWFnZScpIHx8IHVybC5pbmNsdWRlcygnL2NnaS9pbWdzcnYvdGh1bWJuYWlsJykpKSB7XG4gICAgICAgICAgICAgICAgbGFzdEltYWdlRmV0Y2hTZXEgPSBzZXFGcm9tVXJsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgb3JpZ0ZldGNoLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgIGxldCByZXRyeUFmdGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGggPSByZXNwb25zZS5oZWFkZXJzLmdldCgncmV0cnktYWZ0ZXInKTtcbiAgICAgICAgICAgIHJldHJ5QWZ0ZXIgPSBwYXJzZVJldHJ5QWZ0ZXJIZWFkZXIoaCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7cmVzcG9uc2Uuc3RhdHVzfSBpbnRlcmNlcHRlZCBvbiBmZXRjaDpgLCB1cmwpO1xuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdIVFRQX0VSUk9SJyxcbiAgICAgICAgICAgIHVybDogdXJsIHx8IHJlc3BvbnNlLnVybCB8fCAnJyxcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICAgIHJldHJ5QWZ0ZXIsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uub2sgJiYgc2VxRnJvbVVybCAhPT0gbnVsbCAmJiB1cmwuaW5jbHVkZXMoJy9jZ2kvaW1nc3J2L2h0bWwnKSkge1xuICAgICAgICAgIC8vIEludGVyY2VwdCBPQ1IgSFRNTCB0ZXh0IGRpcmVjdGx5IGZyb20gcmVzcG9uc2VcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY2xvbmUgPSByZXNwb25zZS5jbG9uZSgpO1xuICAgICAgICAgICAgY29uc3Qgc2VxID0gc2VxRnJvbVVybDtcbiAgICAgICAgICAgIGNsb25lLnRleHQoKS50aGVuKChodG1sVGV4dCkgPT4ge1xuICAgICAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgICAgICAgICAgZXZlbnQ6ICdQQUdFX1RFWFRfUkVBRFknLFxuICAgICAgICAgICAgICAgIHNlcSxcbiAgICAgICAgICAgICAgICBodG1sOiBodG1sVGV4dCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gSG9vayBVUkwuY3JlYXRlT2JqZWN0VVJMIHRvIGFzc29jaWF0ZSBibG9iIFVSTHMgd2l0aCBzZXF1ZW5jZSBudW1iZXJzXG4gICAgY29uc3Qgb3JpZ0NyZWF0ZU9iamVjdFVSTCA9IFVSTC5jcmVhdGVPYmplY3RVUkw7XG4gICAgaWYgKHR5cGVvZiBvcmlnQ3JlYXRlT2JqZWN0VVJMID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBVUkwuY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24gKG9iajogQmxvYiB8IE1lZGlhU291cmNlKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgYmxvYlVybCA9IG9yaWdDcmVhdGVPYmplY3RVUkwuY2FsbChVUkwsIG9iaik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJsb2IgJiYgbGFzdEltYWdlRmV0Y2hTZXEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcSA9IGxhc3RJbWFnZUZldGNoU2VxO1xuICAgICAgICAgICAgc2VxVG9CbG9iVXJsLnNldChzZXEsIGJsb2JVcmwpO1xuICAgICAgICAgICAgYmxvYlVybFRvU2VxLnNldChibG9iVXJsLCBzZXEpO1xuICAgICAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgICAgZXZlbnQ6ICdQQUdFX0lNQUdFX1JFQURZJyxcbiAgICAgICAgICAgICAgc2VxLFxuICAgICAgICAgICAgICBibG9iVXJsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxLCBibG9iVXJsKSwgMjApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgcmV0dXJuIGJsb2JVcmw7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEhvb2sgY29uc29sZS5sb2cgdG8gbGlzdGVuIGZvciBIYXRoaVRydXN0J3MgaW50ZXJuYWwgcGFnZS5sb2FkSW1hZ2UgYW5ub3VuY2VtZW50c1xuICAgIC8vIEZvcm1hdDogY29uc29sZS5sb2coXCItLSBwYWdlLmxvYWRJbWFnZVwiLCBzZXEoKSwgZ2V0KGlzVmlzaWJsZTIpLCBnZXQoaXNMb2FkZWQpKTtcbiAgICBjb25zdCBvcmlnTG9nID0gY29uc29sZS5sb2c7XG4gICAgY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChhcmdzWzBdID09PSAnLS0gcGFnZS5sb2FkSW1hZ2UnICYmIHR5cGVvZiBhcmdzWzFdID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGNvbnN0IHNlcSA9IGFyZ3NbMV07XG4gICAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gQm9vbGVhbihhcmdzWzJdKTtcbiAgICAgICAgICBjb25zdCBpc0xvYWRlZCA9IEJvb2xlYW4oYXJnc1szXSk7XG5cbiAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgIGV2ZW50OiAnUEFHRV9MT0FEX0FOTk9VTkNFRCcsXG4gICAgICAgICAgICBzZXEsXG4gICAgICAgICAgICBpc1Zpc2libGUsXG4gICAgICAgICAgICBpc0xvYWRlZCxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxKSwgNTApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgcmV0dXJuIG9yaWdMb2cuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gICAgfTtcblxuICAgIGNvbnN0IG9yaWdYaHJPcGVuID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLm9wZW47XG4gICAgY29uc3Qgb3JpZ1hoclNlbmQgPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZDtcbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtZXRob2Q6IHN0cmluZywgdXJsOiBzdHJpbmcgfCBVUkwsIC4uLnJlc3Q6IGFueVtdKSB7XG4gICAgICAodGhpcyBhcyBhbnkpLl9yZXF1ZXN0VXJsID0gU3RyaW5nKHVybCk7XG4gICAgICByZXR1cm4gKG9yaWdYaHJPcGVuIGFzIGFueSkuYXBwbHkodGhpcywgW21ldGhvZCwgdXJsLCAuLi5yZXN0XSk7XG4gICAgfTtcbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gKHRoaXMgYXMgYW55KS5fcmVxdWVzdFVybCB8fCB0aGlzLnJlc3BvbnNlVVJMIHx8ICcnO1xuICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7dGhpcy5zdGF0dXN9IGludGVyY2VwdGVkIG9uIFhIUjpgLCB1cmwpO1xuICAgICAgICAgIGxldCByZXRyeUFmdGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGggPSB0aGlzLmdldFJlc3BvbnNlSGVhZGVyKCdyZXRyeS1hZnRlcicpO1xuICAgICAgICAgICAgcmV0cnlBZnRlciA9IHBhcnNlUmV0cnlBZnRlckhlYWRlcihoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdIVFRQX0VSUk9SJyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgICAgcmV0cnlBZnRlcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gb3JpZ1hoclNlbmQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignW0FyY2hpdmVEb3dubG9hZGVyXSBDb3VsZCBub3QgaG9vayBuZXR3b3JrL2NvbnNvbGUgbWV0aG9kczonLCBlcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Qm9va1JlYWRlcigpOiBhbnkge1xuICAgIHJldHVybiAod2luZG93IGFzIGFueSkuYnI7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0UGFnZUluZm9Gcm9tRG9tKCk6IHsgY3VycmVudDogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0gfCBudWxsIHtcbiAgICAvLyBBcmNoaXZlLm9yZyByZW5kZXJzOiA8c3BhbiBjbGFzcz1cIkJSY3VycmVudHBhZ2VcIiByb2xlPVwic3RhdHVzXCI+UGFnZSDigJQgKDAvNTE1KTwvc3Bhbj5cbiAgICBjb25zdCBwYWdlRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuQlJjdXJyZW50cGFnZSwgW3JvbGU9XCJzdGF0dXNcIl0nKTtcbiAgICBpZiAocGFnZUVsICYmIHBhZ2VFbC50ZXh0Q29udGVudCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYWdlRWwudGV4dENvbnRlbnQubWF0Y2goL1xcKChcXGQrKVxccypcXC9cXHMqKFxcZCspXFwpLyk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjdXJyZW50OiBwYXJzZUludChtYXRjaFsxXSwgMTApLFxuICAgICAgICAgIHRvdGFsOiBwYXJzZUludChtYXRjaFsyXSwgMTApLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzbGFzaE1hdGNoID0gcGFnZUVsLnRleHRDb250ZW50Lm1hdGNoKC9cXC9cXHMqKFxcZCspLyk7XG4gICAgICBpZiAoc2xhc2hNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGN1cnJlbnQ6IDAsXG4gICAgICAgICAgdG90YWw6IHBhcnNlSW50KHNsYXNoTWF0Y2hbMV0sIDEwKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBudW1QYWdlc0VsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkJSbnVtcGFnZXMsIFthcmlhLWxhYmVsKj1cInRvdGFsIHBhZ2VzXCIgaV0sIC5wYWdlLW51bWJlcicpO1xuICAgIGlmIChudW1QYWdlc0VsICYmIG51bVBhZ2VzRWwudGV4dENvbnRlbnQpIHtcbiAgICAgIGNvbnN0IG0gPSBudW1QYWdlc0VsLnRleHRDb250ZW50Lm1hdGNoKC9cXGQrLyk7XG4gICAgICBpZiAobSkge1xuICAgICAgICByZXR1cm4geyBjdXJyZW50OiAwLCB0b3RhbDogcGFyc2VJbnQobVswXSwgMTApIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0Qm9va0luZm8oKTogQm9va0luZm8gfCBudWxsIHtcbiAgICBjb25zdCBiciA9IGdldEJvb2tSZWFkZXIoKTtcbiAgICBjb25zdCBkb21QYWdlSW5mbyA9IGV4dHJhY3RQYWdlSW5mb0Zyb21Eb20oKTtcblxuICAgIGxldCB0b3RhbFBhZ2VzID0gMDtcblxuICAgIC8vIDEuIFByaW1hcnk6IElmIERPTSBoYXMgdGhlIGV4YWN0ICgwLzUxNSkgZm9ybWF0LCB0cnVzdCBpdCFcbiAgICBpZiAoZG9tUGFnZUluZm8gJiYgZG9tUGFnZUluZm8udG90YWwgPiAwKSB7XG4gICAgICB0b3RhbFBhZ2VzID0gZG9tUGFnZUluZm8udG90YWw7XG4gICAgfVxuXG4gICAgLy8gMi4gQm9va1JlYWRlciBBUEkgbWV0aG9kcyAoc3VwcG9ydGluZyBtdWx0aXBsZSBCb29rUmVhZGVyIHZlcnNpb25zKVxuICAgIGlmICghdG90YWxQYWdlcyAmJiBicikge1xuICAgICAgaWYgKGJyLmJvb2sgJiYgdHlwZW9mIGJyLmJvb2suZ2V0TnVtTGVhZnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHsgdG90YWxQYWdlcyA9IGJyLmJvb2suZ2V0TnVtTGVhZnMoKTsgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cblxuICAgICAgaWYgKCF0b3RhbFBhZ2VzICYmIHR5cGVvZiBici5nZXROdW1MZWFmcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRvdGFsUGFnZXMgPSBici5nZXROdW1MZWFmcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRvdGFsUGFnZXMgJiYgdHlwZW9mIGJyLm51bUxlYWZzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdG90YWxQYWdlcyA9IGJyLm51bUxlYWZzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9XG5cbiAgICAgIGlmICghdG90YWxQYWdlcyAmJiB0eXBlb2YgYnIubnVtTGVhZnMgPT09ICdudW1iZXInICYmIGJyLm51bUxlYWZzID4gMCkge1xuICAgICAgICB0b3RhbFBhZ2VzID0gYnIubnVtTGVhZnM7XG4gICAgICB9XG5cbiAgICAgIGlmICghdG90YWxQYWdlcyAmJiBBcnJheS5pc0FycmF5KGJyLmRhdGEpKSB7XG4gICAgICAgIC8vIEluIDItcGFnZSBtb2RlLCBici5kYXRhIGlzIGFuIGFycmF5IG9mIHBhaXJzLiBGbGF0dGVuaW5nIGdpdmVzIGFsbCBpbmRpdmlkdWFsIHBhZ2VzIVxuICAgICAgICB0b3RhbFBhZ2VzID0gYnIuZGF0YS5mbGF0KCkubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEN1cnJlbnQgbGVhZlxuICAgIGxldCBjdXJyZW50TGVhZiA9IDA7XG4gICAgaWYgKGRvbVBhZ2VJbmZvICYmIGRvbVBhZ2VJbmZvLmN1cnJlbnQgPiAwKSB7XG4gICAgICBjdXJyZW50TGVhZiA9IGRvbVBhZ2VJbmZvLmN1cnJlbnQ7XG4gICAgfSBlbHNlIGlmIChicikge1xuICAgICAgaWYgKHR5cGVvZiBici5sZWFmTnVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBjdXJyZW50TGVhZiA9IGJyLmxlYWZOdW07XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBici5jdXJyZW50SW5kZXggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBpZHggPSBici5jdXJyZW50SW5kZXgoKTtcbiAgICAgICAgICBpZiAodHlwZW9mIGJyLmdldExlYWZOdW0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGN1cnJlbnRMZWFmID0gYnIuZ2V0TGVhZk51bShpZHgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50TGVhZiA9IGlkeDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjdXJyZW50TGVhZiA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50TW9kZSA9IChiciAmJiB0eXBlb2YgYnIubW9kZSA9PT0gJ251bWJlcicpID8gYnIubW9kZSA6IDA7XG4gICAgY29uc3QgYm9va1RpdGxlID0gKGJyICYmIGJyLmJvb2tUaXRsZSkgfHwgKGJyPy5ib29rPy5tZXRhZGF0YT8udGl0bGUpIHx8IGRvY3VtZW50LnRpdGxlIHx8ICdBcmNoaXZlIEJvb2snO1xuICAgIGNvbnN0IGJvb2tJZCA9IChiciAmJiBici5ib29rSWQpIHx8ICcnO1xuXG4gICAgaWYgKCFiciAmJiAhZG9tUGFnZUluZm8gJiYgIWJvb2tJZCkgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgYm9va0lkLFxuICAgICAgYm9va1RpdGxlLFxuICAgICAgdG90YWxQYWdlcyxcbiAgICAgIGN1cnJlbnRMZWFmLFxuICAgICAgY3VycmVudE1vZGUsXG4gICAgICBzZXJ2ZXI6IChiciAmJiBici5zZXJ2ZXIpIHx8ICcnLFxuICAgICAgYm9va1BhdGg6IChiciAmJiBici5ib29rUGF0aCkgfHwgJycsXG4gICAgICBpc1Byb3RlY3RlZDogQm9vbGVhbihiciAmJiBici5wcm90ZWN0ZWQpLFxuICAgICAgc291cmNlVXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdGFnQXJjaGl2ZURvbUVsZW1lbnRzKGxlYWY6IG51bWJlcikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZWxlY3RvcnMgPSBbXG4gICAgICAgIGAuQlJwYWdlY29udGFpbmVyW2RhdGEtaW5kZXg9XCIke2xlYWZ9XCJdIGltZ2AsXG4gICAgICAgIGAucGFnZWRpdiR7bGVhZn0gaW1nYCxcbiAgICAgICAgYFtkYXRhLWluZGV4PVwiJHtsZWFmfVwiXSBpbWdgLFxuICAgICAgICBgLkJScGFnZVtkYXRhLXBhZ2U9XCIke2xlYWZ9XCJdIGltZ2AsXG4gICAgICAgIGAuQlJwYWdlW2RhdGEtbGVhZj1cIiR7bGVhZn1cIl0gaW1nYCxcbiAgICAgICAgYCNwYWdlZGl2JHtsZWFmfSBpbWdgLFxuICAgICAgICBgI3BhZ2Uke2xlYWZ9IGltZ2AsXG4gICAgICBdO1xuICAgICAgZm9yIChjb25zdCBzZWwgb2Ygc2VsZWN0b3JzKSB7XG4gICAgICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEltYWdlRWxlbWVudD4oc2VsKTtcbiAgICAgICAgaWYgKGltZykge1xuICAgICAgICAgIGltZy5kYXRhc2V0LnNlcSA9IFN0cmluZyhsZWFmKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cblxuICAvLyBIYW5kbGUgY29tbWFuZHMgZnJvbSBjb250ZW50IHNjcmlwdFxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLmRpcmVjdGlvbiAhPT0gJ1RPX0JSSURHRScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7IGFjdGlvbiB9ID0gZXZlbnQuZGF0YTtcbiAgICBjb25zdCBiciA9IGdldEJvb2tSZWFkZXIoKTtcblxuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlICdERVRFQ1RfQk9PSyc6IHtcbiAgICAgICAgY29uc3QgaW5mbyA9IGV4dHJhY3RCb29rSW5mbygpO1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdCT09LX0lORk8nLFxuICAgICAgICAgICAgZGF0YTogaW5mbyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAnU1dJVENIX01PREVfMSc6IHtcbiAgICAgICAgaWYgKGJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gU3dpdGNoaW5nIHRvIDEtcGFnZSBtb2RlJyk7XG4gICAgICAgICAgdHJ5IHsgYnIuZmxpcFNwZWVkID0gMDsgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICBpZiAodHlwZW9mIGJyLnN3aXRjaE1vZGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7IGJyLnN3aXRjaE1vZGUoMSk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYnIuc3dpdGNoUmVhZE1vZGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7IGJyLnN3aXRjaFJlYWRNb2RlKDEpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBleHRyYWN0Qm9va0luZm8oKTtcbiAgICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgICAgICBldmVudDogJ01PREVfQ0hBTkdFRCcsXG4gICAgICAgICAgICAgICAgbW9kZTogYnIubW9kZSB8fCAxLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgICAgIGV2ZW50OiAnQk9PS19JTkZPJyxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbmZvLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdGTElQX05FWFQnOiB7XG4gICAgICAgIGNvbnN0IHRhcmdldFBhZ2UgPSB0eXBlb2YgZXZlbnQuZGF0YS50YXJnZXRQYWdlID09PSAnbnVtYmVyJyA/IGV2ZW50LmRhdGEudGFyZ2V0UGFnZSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGJyKSB7XG4gICAgICAgICAgdHJ5IHsgYnIuZmxpcFNwZWVkID0gMDsgYnIuYW5pbWF0aW5nID0gZmFsc2U7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRmxpcHBpbmcgbmV4dCBwYWdlIHZpYSBCb29rUmVhZGVyICh0YXJnZXQ6ICR7dGFyZ2V0UGFnZSA/PyAnbmV4dCd9KWApO1xuICAgICAgICAgIGxldCBmbGlwcGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAvLyAxLiBQcmltYXJ5OiBici5uZXh0KHsgbm9BbmltYXRlOiB0cnVlLCBmbGlwU3BlZWQ6IDAgfSkgZm9yIGluc3RhbnQgZmxpcFxuICAgICAgICAgIGlmICh0eXBlb2YgYnIubmV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgYnIubmV4dCh7IG5vQW5pbWF0ZTogdHJ1ZSwgZmxpcFNwZWVkOiAwIH0pO1xuICAgICAgICAgICAgICBmbGlwcGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBici5uZXh0KCk7XG4gICAgICAgICAgICAgICAgZmxpcHBlZCA9IHRydWU7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUyKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDIuIERpcmVjdCBqdW1wIGZhbGxiYWNrIGlmIHRhcmdldFBhZ2Ugc3BlY2lmaWVkXG4gICAgICAgICAgaWYgKCFmbGlwcGVkICYmIHR5cGVvZiB0YXJnZXRQYWdlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBici5qdW1wVG9JbmRleCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0cnkgeyBici5qdW1wVG9JbmRleCh0YXJnZXRQYWdlLCB7IG5vQW5pbWF0ZTogdHJ1ZSB9KTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0cnkgeyBici5qdW1wVG9JbmRleCh0YXJnZXRQYWdlKTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUyKSB7fVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBici5qdW1wVG9MZWFmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHRyeSB7IGJyLmp1bXBUb0xlYWYodGFyZ2V0UGFnZSk7IGZsaXBwZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIDMuIExlZ2FjeSB2ZXJzaW9uczogYnIuZmxpcFJpZ2h0KCkgb3IgYnIucmlnaHQoKVxuICAgICAgICAgIGlmICghZmxpcHBlZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBici5mbGlwUmlnaHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHsgYnIuZmxpcFJpZ2h0KCk7IGZsaXBwZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYnIucmlnaHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHsgYnIucmlnaHQoKTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXRQYWdlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0YWdBcmNoaXZlRG9tRWxlbWVudHModGFyZ2V0UGFnZSksIDgwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ0pVTVBfUEFHRSc6IHtcbiAgICAgICAgY29uc3QgbGVhZkluZGV4ID0gdHlwZW9mIGV2ZW50LmRhdGEubGVhZkluZGV4ID09PSAnbnVtYmVyJyA/IGV2ZW50LmRhdGEubGVhZkluZGV4IDogMDtcbiAgICAgICAgaWYgKGJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gSnVtcGluZyB0byBsZWFmICR7bGVhZkluZGV4fWApO1xuICAgICAgICAgIGxldCBqdW1wZWQgPSBmYWxzZTtcbiAgICAgICAgICBpZiAodHlwZW9mIGJyLmp1bXBUb0luZGV4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkgeyBici5qdW1wVG9JbmRleChsZWFmSW5kZXgsIHsgbm9BbmltYXRlOiB0cnVlIH0pOyBqdW1wZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRyeSB7IGJyLmp1bXBUb0luZGV4KGxlYWZJbmRleCk7IGp1bXBlZCA9IHRydWU7IH0gY2F0Y2ggKGUyKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWp1bXBlZCAmJiB0eXBlb2YgYnIuanVtcFRvTGVhZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHsgYnIuanVtcFRvTGVhZihsZWFmSW5kZXgpOyBqdW1wZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWp1bXBlZCAmJiB0eXBlb2YgYnIuZ29Ub1BhZ2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7IGJyLmdvVG9QYWdlKGxlYWZJbmRleCk7IGp1bXBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGFnQXJjaGl2ZURvbUVsZW1lbnRzKGxlYWZJbmRleCksIDIwMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlYWZJbmRleCA9PT0gMCkge1xuICAgICAgICAgIGlmIChiciAmJiB0eXBlb2YgYnIuZmlyc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7IGJyLmZpcnN0KCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGhvbWVFdmVudCA9IHtcbiAgICAgICAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICAgICAga2V5OiAnSG9tZScsXG4gICAgICAgICAgICBjb2RlOiAnSG9tZScsXG4gICAgICAgICAgICBrZXlDb2RlOiAzNixcbiAgICAgICAgICAgIHdoaWNoOiAzNixcbiAgICAgICAgICB9O1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIGhvbWVFdmVudCkpO1xuICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgaG9tZUV2ZW50KSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBQb2xsIGZvciBCb29rUmVhZGVyICYgRE9NIHBhZ2UgYXZhaWxhYmlsaXR5XG4gIGxldCBwb2xsQ291bnQgPSAwO1xuICBjb25zdCBwb2xsSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgcG9sbENvdW50Kys7XG4gICAgY29uc3QgaW5mbyA9IGV4dHJhY3RCb29rSW5mbygpO1xuICAgIGlmIChpbmZvICYmIGluZm8udG90YWxQYWdlcyA+IDApIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwocG9sbEludGVydmFsKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIEJvb2sgZGV0ZWN0ZWQ6JywgaW5mby5ib29rVGl0bGUsIGAoJHtpbmZvLnRvdGFsUGFnZXN9IHBhZ2VzKWApO1xuICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgZXZlbnQ6ICdCT09LX0lORk8nLFxuICAgICAgICBkYXRhOiBpbmZvLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChwb2xsQ291bnQgPiA0MCkge1xuICAgICAgY2xlYXJJbnRlcnZhbChwb2xsSW50ZXJ2YWwpO1xuICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgIGV2ZW50OiAnQk9PS19JTkZPJyxcbiAgICAgICAgICBkYXRhOiBpbmZvLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDQwMCk7XG59KSgpO1xuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtDQU9DLFNBQVMsVUFBVSxHQUFHO0FBQUEsRUFDckIsUUFBUSxJQUFJLDhDQUE4QztBQUFBLEVBRTFELFNBQVMsbUJBQW1CLENBQUMsS0FBb0I7QUFBQSxJQUMvQyxPQUFPLFlBQVksS0FBSyxHQUFHO0FBQUE7QUFBQSxFQUc3QixNQUFNLGVBQWUsSUFBSTtBQUFBLEVBQ3pCLE1BQU0sZUFBZSxJQUFJO0FBQUEsRUFDekIsSUFBSSxvQkFBbUM7QUFBQSxFQUV2QyxTQUFTLG1CQUFtQixDQUFDLEtBQWEsU0FBa0I7QUFBQSxJQUMxRCxJQUFJO0FBQUEsTUFDRixNQUFNLGFBQWEsV0FBVyxhQUFhLElBQUksR0FBRztBQUFBLE1BQ2xELElBQUksTUFBK0I7QUFBQSxNQUNuQyxJQUFJLFlBQVk7QUFBQSxRQUNkLE1BQU0sU0FBUyxjQUFjLFlBQVksY0FBYztBQUFBLE1BQ3pEO0FBQUEsTUFDQSxJQUFJLENBQUMsS0FBSztBQUFBLFFBQ1IsTUFBTSxXQUFXLFNBQVMsY0FBYyxVQUFVLDRCQUE0QixPQUFPO0FBQUEsUUFDckYsSUFBSSxVQUFVO0FBQUEsVUFDWixNQUFNLFNBQVMsY0FBYyxtREFBbUQ7QUFBQSxRQUNsRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLElBQUksS0FBSztBQUFBLFFBQ1AsSUFB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UUFDOUQ7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBO0FBQUEsR0FFSDtBQUFBLEVBR0QsSUFBSSxZQUFZO0FBQUEsRUFDaEIsTUFBTSxlQUFlLFlBQVksTUFBTTtBQUFBLElBQ3JDO0FBQUEsSUFDQSxNQUFNLE9BQU8sZ0JBQWdCO0FBQUEsSUFDN0IsSUFBSSxRQUFRLEtBQUssYUFBYSxHQUFHO0FBQUEsTUFDL0IsY0FBYyxZQUFZO0FBQUEsTUFDMUIsUUFBUSxJQUFJLHNDQUFzQyxLQUFLLFdBQVcsSUFBSSxLQUFLLG1CQUFtQjtBQUFBLE1BQzlGLG9CQUFvQjtBQUFBLFFBQ2xCLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxNQUNSLENBQUM7QUFBQSxJQUNILEVBQU8sU0FBSSxZQUFZLElBQUk7QUFBQSxNQUN6QixjQUFjLFlBQVk7QUFBQSxNQUMxQixJQUFJLE1BQU07QUFBQSxRQUNSLG9CQUFvQjtBQUFBLFVBQ2xCLFdBQVc7QUFBQSxVQUNYLE9BQU87QUFBQSxVQUNQLE1BQU07QUFBQSxRQUNSLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEtBQ0MsR0FBRztBQUFBLEdBQ0w7IiwKICAiZGVidWdJZCI6ICIwNEFDRjg1NTRFRTY1NEQ3NjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
