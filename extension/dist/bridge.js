// src/content/bridge.ts
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
        } else if (response && response.ok && url.includes("BookReaderGetTextWrapper.php")) {
          try {
            const pageMatch = url.match(/[?&]page=(\d+)/);
            if (pageMatch) {
              const page = parseInt(pageMatch[1], 10);
              const clone = response.clone();
              clone.text().then((xmlText) => {
                sendToContentScript({
                  direction: "FROM_BRIDGE",
                  event: "ARCHIVE_TEXT_READY",
                  page,
                  xml: xmlText
                });
              }).catch(() => {});
            }
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
        } else if (this.status === 200) {
          const url = this._requestUrl || this.responseURL || "";
          if (url && url.includes("BookReaderGetTextWrapper.php")) {
            try {
              const pageMatch = url.match(/[?&]page=(\d+)/);
              if (pageMatch) {
                const page = parseInt(pageMatch[1], 10);
                sendToContentScript({
                  direction: "FROM_BRIDGE",
                  event: "ARCHIVE_TEXT_READY",
                  page,
                  xml: this.responseText
                });
              }
            } catch (e) {}
          }
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
            try {
              br.switchMode("1up");
            } catch (e) {}
            try {
              if (br.constMode1up)
                br.switchMode(br.constMode1up);
            } catch (e) {}
          } else if (typeof br.switchReadMode === "function") {
            try {
              br.switchReadMode(1);
            } catch (e) {}
          }
          const onePageBtn = document.querySelector('button.onepg, .onepg, button[title*="One-page" i], button[aria-label*="One-page" i], button.one-page, .BRpageview1, button[data-mode="1"], [aria-label*="1-page" i], .BRicon_onepage, .view-mode-1up');
          if (onePageBtn && !onePageBtn.classList.contains("active")) {
            try {
              onePageBtn.click();
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
          if (typeof targetPage === "number") {
            if (typeof br.jumpToLeaf === "function") {
              try {
                br.jumpToLeaf(targetPage);
                flipped = true;
              } catch (e) {}
            }
          }
          if (!flipped && typeof br.next === "function") {
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
          if (!flipped && typeof targetPage === "number" && typeof br.jumpToIndex === "function") {
            try {
              br.jumpToIndex(targetPage, { noAnimate: true });
              flipped = true;
            } catch (e) {
              try {
                br.jumpToIndex(targetPage);
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
          if (!flipped) {
            const nextBtn = document.querySelector('button[title*="Flip right" i], button[aria-label*="Flip right" i], button.navnext, .book-flip-right, .BRnavnext, [aria-label="Next page" i], [data-action="next-page" i], .BRicon_flip_right');
            if (nextBtn) {
              try {
                nextBtn.click();
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
          if (typeof br.jumpToLeaf === "function") {
            try {
              br.jumpToLeaf(leafIndex);
              jumped = true;
            } catch (e) {}
          }
          if (!jumped && typeof br.jumpToIndex === "function") {
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

//# debugId=1D9FEFAD4EEC00E764756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbnRlbnQvYnJpZGdlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIi8qKlxuICogQnJpZGdlIHNjcmlwdCBydW5uaW5nIGluIHdvcmxkOiBcIk1BSU5cIlxuICogSW50ZXJhY3RzIGRpcmVjdGx5IHdpdGggQXJjaGl2ZS5vcmcncyBuYXRpdmUgQm9va1JlYWRlciAod2luZG93LmJyKSBvYmplY3QuXG4gKi9cblxuaW1wb3J0IHsgQm9va0luZm8sIEJyaWRnZU1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcyc7XG5cbihmdW5jdGlvbiBpbml0QnJpZGdlKCkge1xuICBjb25zb2xlLmxvZygnW0FyY2hpdmVEb3dubG9hZGVyXSBJbmplY3RlZCBpbnRvIE1BSU4gd29ybGQnKTtcblxuICBmdW5jdGlvbiBzZW5kVG9Db250ZW50U2NyaXB0KG1zZzogQnJpZGdlTWVzc2FnZSkge1xuICAgIHdpbmRvdy5wb3N0TWVzc2FnZShtc2csICcqJyk7XG4gIH1cblxuICBjb25zdCBzZXFUb0Jsb2JVcmwgPSBuZXcgTWFwPG51bWJlciwgc3RyaW5nPigpO1xuICBjb25zdCBibG9iVXJsVG9TZXEgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBsZXQgbGFzdEltYWdlRmV0Y2hTZXE6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxOiBudW1iZXIsIGJsb2JVcmw/OiBzdHJpbmcpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGFyZ2V0QmxvYiA9IGJsb2JVcmwgfHwgc2VxVG9CbG9iVXJsLmdldChzZXEpO1xuICAgICAgbGV0IGltZzogSFRNTEltYWdlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgICAgaWYgKHRhcmdldEJsb2IpIHtcbiAgICAgICAgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW3NyYz1cIiR7dGFyZ2V0QmxvYn1cIl1gKTtcbiAgICAgIH1cbiAgICAgIGlmICghaW1nKSB7XG4gICAgICAgIGNvbnN0IHNwcmVhZEVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI3NwcmVhZCR7c2VxfSwgW2lkKj1cInNwcmVhZFwiXVtpZCo9XCIke3NlcX1cIl1gKTtcbiAgICAgICAgaWYgKHNwcmVhZEVsKSB7XG4gICAgICAgICAgaW1nID0gc3ByZWFkRWwucXVlcnlTZWxlY3RvcignZGV0YWlscyBmaWd1cmUgaW1nLCBmaWd1cmUgaW1nLCBpbWdbc3JjXj1cImJsb2I6XCJdJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnZGF0YS1zZXEnLCBTdHJpbmcoc2VxKSk7XG4gICAgICAgIGltZy5kYXRhc2V0LnNlcSA9IFN0cmluZyhzZXEpO1xuICAgICAgICBjb25zdCBmaWcgPSBpbWcuY2xvc2VzdCgnZmlndXJlJyk7XG4gICAgICAgIGlmIChmaWcpIHtcbiAgICAgICAgICBmaWcuc2V0QXR0cmlidXRlKCdkYXRhLXNlcScsIFN0cmluZyhzZXEpKTtcbiAgICAgICAgICBmaWcuZGF0YXNldC5zZXEgPSBTdHJpbmcoc2VxKTtcbiAgICAgICAgICBjb25zdCBjYXAgPSBmaWcucXVlcnlTZWxlY3RvcignZmlnY2FwdGlvbicpO1xuICAgICAgICAgIGlmIChjYXApIHtcbiAgICAgICAgICAgIGNhcC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHNlcSkpO1xuICAgICAgICAgICAgY2FwLmRhdGFzZXQuc2VxID0gU3RyaW5nKHNlcSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNwcmVhZCA9IGltZy5jbG9zZXN0KCcuc3ByZWFkJykgfHwgaW1nLmNsb3Nlc3QoJ1tpZCo9XCJzcHJlYWRcIl0nKTtcbiAgICAgICAgaWYgKHNwcmVhZCkge1xuICAgICAgICAgIHNwcmVhZC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VxJywgU3RyaW5nKHNlcSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlUmV0cnlBZnRlckhlYWRlcihoOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIWgpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgdHJpbW1lZCA9IGgudHJpbSgpO1xuICAgIGNvbnN0IHBhcnNlZEludCA9IHBhcnNlSW50KHRyaW1tZWQsIDEwKTtcbiAgICBpZiAoIWlzTmFOKHBhcnNlZEludCkgJiYgL15cXGQrJC8udGVzdCh0cmltbWVkKSkge1xuICAgICAgcmV0dXJuIHBhcnNlZEludCA+IDAgPyBwYXJzZWRJbnQgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGRhdGVNcyA9IERhdGUucGFyc2UodHJpbW1lZCk7XG4gICAgaWYgKCFpc05hTihkYXRlTXMpKSB7XG4gICAgICBjb25zdCBkaWZmU2VjID0gTWF0aC5yb3VuZCgoZGF0ZU1zIC0gRGF0ZS5ub3coKSkgLyAxMDAwKTtcbiAgICAgIHJldHVybiBkaWZmU2VjID4gMCA/IGRpZmZTZWMgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBJbnRlcmNlcHQgd2luZG93LmZldGNoIGFuZCBYTUxIdHRwUmVxdWVzdCB0byBjYXRjaCBIVFRQIHN0YXR1cyA+PSA0MDAgYW5kIGNhcHR1cmUgSGF0aGlUcnVzdCBpbWFnZS90ZXh0IHJlcXVlc3RzXG4gIHRyeSB7XG4gICAgY29uc3Qgb3JpZ0ZldGNoID0gd2luZG93LmZldGNoO1xuICAgIGlmICh0eXBlb2Ygb3JpZ0ZldGNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB3aW5kb3cuZmV0Y2ggPSBhc3luYyBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc3QgdXJsID0gdHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnXG4gICAgICAgICAgPyBhcmdzWzBdXG4gICAgICAgICAgOiAoYXJnc1swXSAmJiAoYXJnc1swXSBhcyBhbnkpLnVybCA/IChhcmdzWzBdIGFzIGFueSkudXJsIDogJycpO1xuXG4gICAgICAgIGxldCBzZXFGcm9tVXJsOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgaWYgKHVybCAmJiAodXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9pbWFnZScpIHx8IHVybC5pbmNsdWRlcygnL2NnaS9pbWdzcnYvdGh1bWJuYWlsJykgfHwgdXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9odG1sJykpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgICBjb25zdCBzID0gcGFyc2VkLnNlYXJjaFBhcmFtcy5nZXQoJ3NlcScpO1xuICAgICAgICAgICAgaWYgKHMpIHtcbiAgICAgICAgICAgICAgc2VxRnJvbVVybCA9IHBhcnNlSW50KHMsIDEwKTtcbiAgICAgICAgICAgICAgaWYgKCFpc05hTihzZXFGcm9tVXJsKSAmJiAodXJsLmluY2x1ZGVzKCcvY2dpL2ltZ3Nydi9pbWFnZScpIHx8IHVybC5pbmNsdWRlcygnL2NnaS9pbWdzcnYvdGh1bWJuYWlsJykpKSB7XG4gICAgICAgICAgICAgICAgbGFzdEltYWdlRmV0Y2hTZXEgPSBzZXFGcm9tVXJsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgb3JpZ0ZldGNoLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgIGxldCByZXRyeUFmdGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGggPSByZXNwb25zZS5oZWFkZXJzLmdldCgncmV0cnktYWZ0ZXInKTtcbiAgICAgICAgICAgIHJldHJ5QWZ0ZXIgPSBwYXJzZVJldHJ5QWZ0ZXJIZWFkZXIoaCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7cmVzcG9uc2Uuc3RhdHVzfSBpbnRlcmNlcHRlZCBvbiBmZXRjaDpgLCB1cmwpO1xuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdIVFRQX0VSUk9SJyxcbiAgICAgICAgICAgIHVybDogdXJsIHx8IHJlc3BvbnNlLnVybCB8fCAnJyxcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICAgIHJldHJ5QWZ0ZXIsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uub2sgJiYgc2VxRnJvbVVybCAhPT0gbnVsbCAmJiB1cmwuaW5jbHVkZXMoJy9jZ2kvaW1nc3J2L2h0bWwnKSkge1xuICAgICAgICAgIC8vIEludGVyY2VwdCBPQ1IgSFRNTCB0ZXh0IGRpcmVjdGx5IGZyb20gcmVzcG9uc2VcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY2xvbmUgPSByZXNwb25zZS5jbG9uZSgpO1xuICAgICAgICAgICAgY29uc3Qgc2VxID0gc2VxRnJvbVVybDtcbiAgICAgICAgICAgIGNsb25lLnRleHQoKS50aGVuKChodG1sVGV4dCkgPT4ge1xuICAgICAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgICAgICAgICAgZXZlbnQ6ICdQQUdFX1RFWFRfUkVBRFknLFxuICAgICAgICAgICAgICAgIHNlcSxcbiAgICAgICAgICAgICAgICBodG1sOiBodG1sVGV4dCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5vayAmJiB1cmwuaW5jbHVkZXMoJ0Jvb2tSZWFkZXJHZXRUZXh0V3JhcHBlci5waHAnKSkge1xuICAgICAgICAgIC8vIEludGVyY2VwdCBBcmNoaXZlLm9yZyBEalZ1IE9DUiBYTUwgdGV4dCBkaXJlY3RseSBmcm9tIEJvb2tSZWFkZXIgcmVzcG9uc2VcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGFnZU1hdGNoID0gdXJsLm1hdGNoKC9bPyZdcGFnZT0oXFxkKykvKTtcbiAgICAgICAgICAgIGlmIChwYWdlTWF0Y2gpIHtcbiAgICAgICAgICAgICAgY29uc3QgcGFnZSA9IHBhcnNlSW50KHBhZ2VNYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgICBjb25zdCBjbG9uZSA9IHJlc3BvbnNlLmNsb25lKCk7XG4gICAgICAgICAgICAgIGNsb25lLnRleHQoKS50aGVuKCh4bWxUZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgICAgICAgICAgICBldmVudDogJ0FSQ0hJVkVfVEVYVF9SRUFEWScsXG4gICAgICAgICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgICAgICAgeG1sOiB4bWxUZXh0LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gSG9vayBVUkwuY3JlYXRlT2JqZWN0VVJMIHRvIGFzc29jaWF0ZSBibG9iIFVSTHMgd2l0aCBzZXF1ZW5jZSBudW1iZXJzXG4gICAgY29uc3Qgb3JpZ0NyZWF0ZU9iamVjdFVSTCA9IFVSTC5jcmVhdGVPYmplY3RVUkw7XG4gICAgaWYgKHR5cGVvZiBvcmlnQ3JlYXRlT2JqZWN0VVJMID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBVUkwuY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24gKG9iajogQmxvYiB8IE1lZGlhU291cmNlKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgYmxvYlVybCA9IG9yaWdDcmVhdGVPYmplY3RVUkwuY2FsbChVUkwsIG9iaik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJsb2IgJiYgbGFzdEltYWdlRmV0Y2hTZXEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcSA9IGxhc3RJbWFnZUZldGNoU2VxO1xuICAgICAgICAgICAgc2VxVG9CbG9iVXJsLnNldChzZXEsIGJsb2JVcmwpO1xuICAgICAgICAgICAgYmxvYlVybFRvU2VxLnNldChibG9iVXJsLCBzZXEpO1xuICAgICAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgICAgZXZlbnQ6ICdQQUdFX0lNQUdFX1JFQURZJyxcbiAgICAgICAgICAgICAgc2VxLFxuICAgICAgICAgICAgICBibG9iVXJsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxLCBibG9iVXJsKSwgMjApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgcmV0dXJuIGJsb2JVcmw7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEhvb2sgY29uc29sZS5sb2cgdG8gbGlzdGVuIGZvciBIYXRoaVRydXN0J3MgaW50ZXJuYWwgcGFnZS5sb2FkSW1hZ2UgYW5ub3VuY2VtZW50c1xuICAgIC8vIEZvcm1hdDogY29uc29sZS5sb2coXCItLSBwYWdlLmxvYWRJbWFnZVwiLCBzZXEoKSwgZ2V0KGlzVmlzaWJsZTIpLCBnZXQoaXNMb2FkZWQpKTtcbiAgICBjb25zdCBvcmlnTG9nID0gY29uc29sZS5sb2c7XG4gICAgY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChhcmdzWzBdID09PSAnLS0gcGFnZS5sb2FkSW1hZ2UnICYmIHR5cGVvZiBhcmdzWzFdID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGNvbnN0IHNlcSA9IGFyZ3NbMV07XG4gICAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gQm9vbGVhbihhcmdzWzJdKTtcbiAgICAgICAgICBjb25zdCBpc0xvYWRlZCA9IEJvb2xlYW4oYXJnc1szXSk7XG5cbiAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgIGV2ZW50OiAnUEFHRV9MT0FEX0FOTk9VTkNFRCcsXG4gICAgICAgICAgICBzZXEsXG4gICAgICAgICAgICBpc1Zpc2libGUsXG4gICAgICAgICAgICBpc0xvYWRlZCxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRhZ0hhdGhpRG9tRWxlbWVudHMoc2VxKSwgNTApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgcmV0dXJuIG9yaWdMb2cuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gICAgfTtcblxuICAgIGNvbnN0IG9yaWdYaHJPcGVuID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLm9wZW47XG4gICAgY29uc3Qgb3JpZ1hoclNlbmQgPSBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZDtcbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtZXRob2Q6IHN0cmluZywgdXJsOiBzdHJpbmcgfCBVUkwsIC4uLnJlc3Q6IGFueVtdKSB7XG4gICAgICAodGhpcyBhcyBhbnkpLl9yZXF1ZXN0VXJsID0gU3RyaW5nKHVybCk7XG4gICAgICByZXR1cm4gKG9yaWdYaHJPcGVuIGFzIGFueSkuYXBwbHkodGhpcywgW21ldGhvZCwgdXJsLCAuLi5yZXN0XSk7XG4gICAgfTtcbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gKHRoaXMgYXMgYW55KS5fcmVxdWVzdFVybCB8fCB0aGlzLnJlc3BvbnNlVVJMIHx8ICcnO1xuICAgICAgICAgIGNvbnNvbGUud2FybihgW0FyY2hpdmVEb3dubG9hZGVyXSBIVFRQIGVycm9yICR7dGhpcy5zdGF0dXN9IGludGVyY2VwdGVkIG9uIFhIUjpgLCB1cmwpO1xuICAgICAgICAgIGxldCByZXRyeUFmdGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGggPSB0aGlzLmdldFJlc3BvbnNlSGVhZGVyKCdyZXRyeS1hZnRlcicpO1xuICAgICAgICAgICAgcmV0cnlBZnRlciA9IHBhcnNlUmV0cnlBZnRlckhlYWRlcihoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgZXZlbnQ6ICdIVFRQX0VSUk9SJyxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgICAgcmV0cnlBZnRlcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gKHRoaXMgYXMgYW55KS5fcmVxdWVzdFVybCB8fCB0aGlzLnJlc3BvbnNlVVJMIHx8ICcnO1xuICAgICAgICAgIGlmICh1cmwgJiYgdXJsLmluY2x1ZGVzKCdCb29rUmVhZGVyR2V0VGV4dFdyYXBwZXIucGhwJykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhZ2VNYXRjaCA9IHVybC5tYXRjaCgvWz8mXXBhZ2U9KFxcZCspLyk7XG4gICAgICAgICAgICAgIGlmIChwYWdlTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYWdlID0gcGFyc2VJbnQocGFnZU1hdGNoWzFdLCAxMCk7XG4gICAgICAgICAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgICAgICAgICAgICBldmVudDogJ0FSQ0hJVkVfVEVYVF9SRUFEWScsXG4gICAgICAgICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgICAgICAgeG1sOiB0aGlzLnJlc3BvbnNlVGV4dCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG9yaWdYaHJTZW5kLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tBcmNoaXZlRG93bmxvYWRlcl0gQ291bGQgbm90IGhvb2sgbmV0d29yay9jb25zb2xlIG1ldGhvZHM6JywgZXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEJvb2tSZWFkZXIoKTogYW55IHtcbiAgICByZXR1cm4gKHdpbmRvdyBhcyBhbnkpLmJyO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdFBhZ2VJbmZvRnJvbURvbSgpOiB7IGN1cnJlbnQ6IG51bWJlcjsgdG90YWw6IG51bWJlciB9IHwgbnVsbCB7XG4gICAgLy8gQXJjaGl2ZS5vcmcgcmVuZGVyczogPHNwYW4gY2xhc3M9XCJCUmN1cnJlbnRwYWdlXCIgcm9sZT1cInN0YXR1c1wiPlBhZ2Ug4oCUICgwLzUxNSk8L3NwYW4+XG4gICAgY29uc3QgcGFnZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkJSY3VycmVudHBhZ2UsIFtyb2xlPVwic3RhdHVzXCJdJyk7XG4gICAgaWYgKHBhZ2VFbCAmJiBwYWdlRWwudGV4dENvbnRlbnQpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gcGFnZUVsLnRleHRDb250ZW50Lm1hdGNoKC9cXCgoXFxkKylcXHMqXFwvXFxzKihcXGQrKVxcKS8pO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY3VycmVudDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSxcbiAgICAgICAgICB0b3RhbDogcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2xhc2hNYXRjaCA9IHBhZ2VFbC50ZXh0Q29udGVudC5tYXRjaCgvXFwvXFxzKihcXGQrKS8pO1xuICAgICAgaWYgKHNsYXNoTWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjdXJyZW50OiAwLFxuICAgICAgICAgIHRvdGFsOiBwYXJzZUludChzbGFzaE1hdGNoWzFdLCAxMCksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbnVtUGFnZXNFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5CUm51bXBhZ2VzLCBbYXJpYS1sYWJlbCo9XCJ0b3RhbCBwYWdlc1wiIGldLCAucGFnZS1udW1iZXInKTtcbiAgICBpZiAobnVtUGFnZXNFbCAmJiBudW1QYWdlc0VsLnRleHRDb250ZW50KSB7XG4gICAgICBjb25zdCBtID0gbnVtUGFnZXNFbC50ZXh0Q29udGVudC5tYXRjaCgvXFxkKy8pO1xuICAgICAgaWYgKG0pIHtcbiAgICAgICAgcmV0dXJuIHsgY3VycmVudDogMCwgdG90YWw6IHBhcnNlSW50KG1bMF0sIDEwKSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdEJvb2tJbmZvKCk6IEJvb2tJbmZvIHwgbnVsbCB7XG4gICAgY29uc3QgYnIgPSBnZXRCb29rUmVhZGVyKCk7XG4gICAgY29uc3QgZG9tUGFnZUluZm8gPSBleHRyYWN0UGFnZUluZm9Gcm9tRG9tKCk7XG5cbiAgICBsZXQgdG90YWxQYWdlcyA9IDA7XG5cbiAgICAvLyAxLiBQcmltYXJ5OiBJZiBET00gaGFzIHRoZSBleGFjdCAoMC81MTUpIGZvcm1hdCwgdHJ1c3QgaXQhXG4gICAgaWYgKGRvbVBhZ2VJbmZvICYmIGRvbVBhZ2VJbmZvLnRvdGFsID4gMCkge1xuICAgICAgdG90YWxQYWdlcyA9IGRvbVBhZ2VJbmZvLnRvdGFsO1xuICAgIH1cblxuICAgIC8vIDIuIEJvb2tSZWFkZXIgQVBJIG1ldGhvZHMgKHN1cHBvcnRpbmcgbXVsdGlwbGUgQm9va1JlYWRlciB2ZXJzaW9ucylcbiAgICBpZiAoIXRvdGFsUGFnZXMgJiYgYnIpIHtcbiAgICAgIGlmIChici5ib29rICYmIHR5cGVvZiBici5ib29rLmdldE51bUxlYWZzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7IHRvdGFsUGFnZXMgPSBici5ib29rLmdldE51bUxlYWZzKCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9XG5cbiAgICAgIGlmICghdG90YWxQYWdlcyAmJiB0eXBlb2YgYnIuZ2V0TnVtTGVhZnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0b3RhbFBhZ2VzID0gYnIuZ2V0TnVtTGVhZnMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cblxuICAgICAgaWYgKCF0b3RhbFBhZ2VzICYmIHR5cGVvZiBici5udW1MZWFmcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRvdGFsUGFnZXMgPSBici5udW1MZWFmcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRvdGFsUGFnZXMgJiYgdHlwZW9mIGJyLm51bUxlYWZzID09PSAnbnVtYmVyJyAmJiBici5udW1MZWFmcyA+IDApIHtcbiAgICAgICAgdG90YWxQYWdlcyA9IGJyLm51bUxlYWZzO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRvdGFsUGFnZXMgJiYgQXJyYXkuaXNBcnJheShici5kYXRhKSkge1xuICAgICAgICAvLyBJbiAyLXBhZ2UgbW9kZSwgYnIuZGF0YSBpcyBhbiBhcnJheSBvZiBwYWlycy4gRmxhdHRlbmluZyBnaXZlcyBhbGwgaW5kaXZpZHVhbCBwYWdlcyFcbiAgICAgICAgdG90YWxQYWdlcyA9IGJyLmRhdGEuZmxhdCgpLmxlbmd0aDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDdXJyZW50IGxlYWZcbiAgICBsZXQgY3VycmVudExlYWYgPSAwO1xuICAgIGlmIChkb21QYWdlSW5mbyAmJiBkb21QYWdlSW5mby5jdXJyZW50ID4gMCkge1xuICAgICAgY3VycmVudExlYWYgPSBkb21QYWdlSW5mby5jdXJyZW50O1xuICAgIH0gZWxzZSBpZiAoYnIpIHtcbiAgICAgIGlmICh0eXBlb2YgYnIubGVhZk51bSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY3VycmVudExlYWYgPSBici5sZWFmTnVtO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYnIuY3VycmVudEluZGV4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgaWR4ID0gYnIuY3VycmVudEluZGV4KCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBici5nZXRMZWFmTnVtID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjdXJyZW50TGVhZiA9IGJyLmdldExlYWZOdW0oaWR4KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudExlYWYgPSBpZHg7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY3VycmVudExlYWYgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudE1vZGUgPSAoYnIgJiYgdHlwZW9mIGJyLm1vZGUgPT09ICdudW1iZXInKSA/IGJyLm1vZGUgOiAwO1xuICAgIGNvbnN0IGJvb2tUaXRsZSA9IChiciAmJiBici5ib29rVGl0bGUpIHx8IChicj8uYm9vaz8ubWV0YWRhdGE/LnRpdGxlKSB8fCBkb2N1bWVudC50aXRsZSB8fCAnQXJjaGl2ZSBCb29rJztcbiAgICBjb25zdCBib29rSWQgPSAoYnIgJiYgYnIuYm9va0lkKSB8fCAnJztcblxuICAgIGlmICghYnIgJiYgIWRvbVBhZ2VJbmZvICYmICFib29rSWQpIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJvb2tJZCxcbiAgICAgIGJvb2tUaXRsZSxcbiAgICAgIHRvdGFsUGFnZXMsXG4gICAgICBjdXJyZW50TGVhZixcbiAgICAgIGN1cnJlbnRNb2RlLFxuICAgICAgc2VydmVyOiAoYnIgJiYgYnIuc2VydmVyKSB8fCAnJyxcbiAgICAgIGJvb2tQYXRoOiAoYnIgJiYgYnIuYm9va1BhdGgpIHx8ICcnLFxuICAgICAgaXNQcm90ZWN0ZWQ6IEJvb2xlYW4oYnIgJiYgYnIucHJvdGVjdGVkKSxcbiAgICAgIHNvdXJjZVVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhZ0FyY2hpdmVEb21FbGVtZW50cyhsZWFmOiBudW1iZXIpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2VsZWN0b3JzID0gW1xuICAgICAgICBgLkJScGFnZWNvbnRhaW5lcltkYXRhLWluZGV4PVwiJHtsZWFmfVwiXSBpbWdgLFxuICAgICAgICBgLnBhZ2VkaXYke2xlYWZ9IGltZ2AsXG4gICAgICAgIGBbZGF0YS1pbmRleD1cIiR7bGVhZn1cIl0gaW1nYCxcbiAgICAgICAgYC5CUnBhZ2VbZGF0YS1wYWdlPVwiJHtsZWFmfVwiXSBpbWdgLFxuICAgICAgICBgLkJScGFnZVtkYXRhLWxlYWY9XCIke2xlYWZ9XCJdIGltZ2AsXG4gICAgICAgIGAjcGFnZWRpdiR7bGVhZn0gaW1nYCxcbiAgICAgICAgYCNwYWdlJHtsZWFmfSBpbWdgLFxuICAgICAgXTtcbiAgICAgIGZvciAoY29uc3Qgc2VsIG9mIHNlbGVjdG9ycykge1xuICAgICAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxJbWFnZUVsZW1lbnQ+KHNlbCk7XG4gICAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgICBpbWcuZGF0YXNldC5zZXEgPSBTdHJpbmcobGVhZik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7fVxuICB9XG5cbiAgLy8gSGFuZGxlIGNvbW1hbmRzIGZyb20gY29udGVudCBzY3JpcHRcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cgfHwgIWV2ZW50LmRhdGEgfHwgZXZlbnQuZGF0YS5kaXJlY3Rpb24gIT09ICdUT19CUklER0UnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgeyBhY3Rpb24gfSA9IGV2ZW50LmRhdGE7XG4gICAgY29uc3QgYnIgPSBnZXRCb29rUmVhZGVyKCk7XG5cbiAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgY2FzZSAnREVURUNUX0JPT0snOiB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBleHRyYWN0Qm9va0luZm8oKTtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgIGV2ZW50OiAnQk9PS19JTkZPJyxcbiAgICAgICAgICAgIGRhdGE6IGluZm8sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ1NXSVRDSF9NT0RFXzEnOiB7XG4gICAgICAgIGlmIChicikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbQXJjaGl2ZURvd25sb2FkZXJdIFN3aXRjaGluZyB0byAxLXBhZ2UgbW9kZScpO1xuICAgICAgICAgIHRyeSB7IGJyLmZsaXBTcGVlZCA9IDA7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgaWYgKHR5cGVvZiBici5zd2l0Y2hNb2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkgeyBici5zd2l0Y2hNb2RlKDEpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgdHJ5IHsgYnIuc3dpdGNoTW9kZSgnMXVwJyk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB0cnkgeyBpZiAoYnIuY29uc3RNb2RlMXVwKSBici5zd2l0Y2hNb2RlKGJyLmNvbnN0TW9kZTF1cCk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYnIuc3dpdGNoUmVhZE1vZGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7IGJyLnN3aXRjaFJlYWRNb2RlKDEpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBvbmVQYWdlQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICAgICAgICAnYnV0dG9uLm9uZXBnLCAub25lcGcsIGJ1dHRvblt0aXRsZSo9XCJPbmUtcGFnZVwiIGldLCBidXR0b25bYXJpYS1sYWJlbCo9XCJPbmUtcGFnZVwiIGldLCBidXR0b24ub25lLXBhZ2UsIC5CUnBhZ2V2aWV3MSwgYnV0dG9uW2RhdGEtbW9kZT1cIjFcIl0sIFthcmlhLWxhYmVsKj1cIjEtcGFnZVwiIGldLCAuQlJpY29uX29uZXBhZ2UsIC52aWV3LW1vZGUtMXVwJ1xuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKG9uZVBhZ2VCdG4gJiYgIW9uZVBhZ2VCdG4uY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICAgICAgdHJ5IHsgb25lUGFnZUJ0bi5jbGljaygpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBleHRyYWN0Qm9va0luZm8oKTtcbiAgICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICAgIHNlbmRUb0NvbnRlbnRTY3JpcHQoe1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0ZST01fQlJJREdFJyxcbiAgICAgICAgICAgICAgICBldmVudDogJ01PREVfQ0hBTkdFRCcsXG4gICAgICAgICAgICAgICAgbW9kZTogYnIubW9kZSB8fCAxLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgc2VuZFRvQ29udGVudFNjcmlwdCh7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICAgICAgICAgIGV2ZW50OiAnQk9PS19JTkZPJyxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbmZvLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdGTElQX05FWFQnOiB7XG4gICAgICAgIGNvbnN0IHRhcmdldFBhZ2UgPSB0eXBlb2YgZXZlbnQuZGF0YS50YXJnZXRQYWdlID09PSAnbnVtYmVyJyA/IGV2ZW50LmRhdGEudGFyZ2V0UGFnZSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGJyKSB7XG4gICAgICAgICAgdHJ5IHsgYnIuZmxpcFNwZWVkID0gMDsgYnIuYW5pbWF0aW5nID0gZmFsc2U7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgY29uc29sZS5sb2coYFtBcmNoaXZlRG93bmxvYWRlcl0gRmxpcHBpbmcgbmV4dCBwYWdlIHZpYSBCb29rUmVhZGVyICh0YXJnZXQ6ICR7dGFyZ2V0UGFnZSA/PyAnbmV4dCd9KWApO1xuICAgICAgICAgIGxldCBmbGlwcGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAvLyAxLiBJZiB0YXJnZXRQYWdlIGlzIHNwZWNpZmllZCwgdHJ5IGRpcmVjdCBsZWFmIGp1bXAgZmlyc3QgKGxlYWYgbnVtYmVyczogMCwgMSwgMi4uLilcbiAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldFBhZ2UgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJyLmp1bXBUb0xlYWYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdHJ5IHsgYnIuanVtcFRvTGVhZih0YXJnZXRQYWdlKTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gMi4gUmVsYXRpdmUgZmxpcCBtZXRob2RzOiBici5uZXh0KHsgbm9BbmltYXRlOiB0cnVlLCBmbGlwU3BlZWQ6IDAgfSlcbiAgICAgICAgICBpZiAoIWZsaXBwZWQgJiYgdHlwZW9mIGJyLm5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGJyLm5leHQoeyBub0FuaW1hdGU6IHRydWUsIGZsaXBTcGVlZDogMCB9KTtcbiAgICAgICAgICAgICAgZmxpcHBlZCA9IHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYnIubmV4dCgpO1xuICAgICAgICAgICAgICAgIGZsaXBwZWQgPSB0cnVlO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlMikge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyAzLiBGYWxsYmFjazogYnIuanVtcFRvSW5kZXggaWYgdGFyZ2V0UGFnZSBpcyBzcGVjaWZpZWRcbiAgICAgICAgICBpZiAoIWZsaXBwZWQgJiYgdHlwZW9mIHRhcmdldFBhZ2UgPT09ICdudW1iZXInICYmIHR5cGVvZiBici5qdW1wVG9JbmRleCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHsgYnIuanVtcFRvSW5kZXgodGFyZ2V0UGFnZSwgeyBub0FuaW1hdGU6IHRydWUgfSk7IGZsaXBwZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRyeSB7IGJyLmp1bXBUb0luZGV4KHRhcmdldFBhZ2UpOyBmbGlwcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZTIpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gNC4gTGVnYWN5IHZlcnNpb25zOiBici5mbGlwUmlnaHQoKSBvciBici5yaWdodCgpXG4gICAgICAgICAgaWYgKCFmbGlwcGVkKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJyLmZsaXBSaWdodCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0cnkgeyBici5mbGlwUmlnaHQoKTsgZmxpcHBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBici5yaWdodCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0cnkgeyBici5yaWdodCgpOyBmbGlwcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyA1LiBUcmlnZ2VyIERPTSBOZXh0IGJ1dHRvbiBjbGljayBpbiBNQUlOIHdvcmxkIGlmIG5vdCBhbHJlYWR5IGZsaXBwZWRcbiAgICAgICAgICBpZiAoIWZsaXBwZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG5leHRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgICAgICAgICAgJ2J1dHRvblt0aXRsZSo9XCJGbGlwIHJpZ2h0XCIgaV0sIGJ1dHRvblthcmlhLWxhYmVsKj1cIkZsaXAgcmlnaHRcIiBpXSwgYnV0dG9uLm5hdm5leHQsIC5ib29rLWZsaXAtcmlnaHQsIC5CUm5hdm5leHQsIFthcmlhLWxhYmVsPVwiTmV4dCBwYWdlXCIgaV0sIFtkYXRhLWFjdGlvbj1cIm5leHQtcGFnZVwiIGldLCAuQlJpY29uX2ZsaXBfcmlnaHQnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKG5leHRCdG4pIHtcbiAgICAgICAgICAgICAgdHJ5IHsgbmV4dEJ0bi5jbGljaygpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0UGFnZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGFnQXJjaGl2ZURvbUVsZW1lbnRzKHRhcmdldFBhZ2UpLCA4MCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICdKVU1QX1BBR0UnOiB7XG4gICAgICAgIGNvbnN0IGxlYWZJbmRleCA9IHR5cGVvZiBldmVudC5kYXRhLmxlYWZJbmRleCA9PT0gJ251bWJlcicgPyBldmVudC5kYXRhLmxlYWZJbmRleCA6IDA7XG4gICAgICAgIGlmIChicikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQXJjaGl2ZURvd25sb2FkZXJdIEp1bXBpbmcgdG8gbGVhZiAke2xlYWZJbmRleH1gKTtcbiAgICAgICAgICBsZXQganVtcGVkID0gZmFsc2U7XG4gICAgICAgICAgLy8gTGVhZiBqdW1waW5nIGlzIGxlYWYtYmFzZWQgaW4gQm9va1JlYWRlclxuICAgICAgICAgIGlmICh0eXBlb2YgYnIuanVtcFRvTGVhZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHsgYnIuanVtcFRvTGVhZihsZWFmSW5kZXgpOyBqdW1wZWQgPSB0cnVlOyB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWp1bXBlZCAmJiB0eXBlb2YgYnIuanVtcFRvSW5kZXggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7IGJyLmp1bXBUb0luZGV4KGxlYWZJbmRleCwgeyBub0FuaW1hdGU6IHRydWUgfSk7IGp1bXBlZCA9IHRydWU7IH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdHJ5IHsgYnIuanVtcFRvSW5kZXgobGVhZkluZGV4KTsganVtcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZTIpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghanVtcGVkICYmIHR5cGVvZiBici5nb1RvUGFnZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHsgYnIuZ29Ub1BhZ2UobGVhZkluZGV4KTsganVtcGVkID0gdHJ1ZTsgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0YWdBcmNoaXZlRG9tRWxlbWVudHMobGVhZkluZGV4KSwgMjAwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVhZkluZGV4ID09PSAwKSB7XG4gICAgICAgICAgaWYgKGJyICYmIHR5cGVvZiBici5maXJzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHsgYnIuZmlyc3QoKTsgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgaG9tZUV2ZW50ID0ge1xuICAgICAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgICAgICAgICBrZXk6ICdIb21lJyxcbiAgICAgICAgICAgIGNvZGU6ICdIb21lJyxcbiAgICAgICAgICAgIGtleUNvZGU6IDM2LFxuICAgICAgICAgICAgd2hpY2g6IDM2LFxuICAgICAgICAgIH07XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KCdrZXlkb3duJywgaG9tZUV2ZW50KSk7XG4gICAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCBob21lRXZlbnQpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIFBvbGwgZm9yIEJvb2tSZWFkZXIgJiBET00gcGFnZSBhdmFpbGFiaWxpdHlcbiAgbGV0IHBvbGxDb3VudCA9IDA7XG4gIGNvbnN0IHBvbGxJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBwb2xsQ291bnQrKztcbiAgICBjb25zdCBpbmZvID0gZXh0cmFjdEJvb2tJbmZvKCk7XG4gICAgaWYgKGluZm8gJiYgaW5mby50b3RhbFBhZ2VzID4gMCkge1xuICAgICAgY2xlYXJJbnRlcnZhbChwb2xsSW50ZXJ2YWwpO1xuICAgICAgY29uc29sZS5sb2coJ1tBcmNoaXZlRG93bmxvYWRlcl0gQm9vayBkZXRlY3RlZDonLCBpbmZvLmJvb2tUaXRsZSwgYCgke2luZm8udG90YWxQYWdlc30gcGFnZXMpYCk7XG4gICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgZGlyZWN0aW9uOiAnRlJPTV9CUklER0UnLFxuICAgICAgICBldmVudDogJ0JPT0tfSU5GTycsXG4gICAgICAgIGRhdGE6IGluZm8sXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHBvbGxDb3VudCA+IDQwKSB7XG4gICAgICBjbGVhckludGVydmFsKHBvbGxJbnRlcnZhbCk7XG4gICAgICBpZiAoaW5mbykge1xuICAgICAgICBzZW5kVG9Db250ZW50U2NyaXB0KHtcbiAgICAgICAgICBkaXJlY3Rpb246ICdGUk9NX0JSSURHRScsXG4gICAgICAgICAgZXZlbnQ6ICdCT09LX0lORk8nLFxuICAgICAgICAgIGRhdGE6IGluZm8sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgNDAwKTtcbn0pKCk7XG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0NBT0MsU0FBUyxVQUFVLEdBQUc7QUFBQSxFQUNyQixRQUFRLElBQUksOENBQThDO0FBQUEsRUFFMUQsU0FBUyxtQkFBbUIsQ0FBQyxLQUFvQjtBQUFBLElBQy9DLE9BQU8sWUFBWSxLQUFLLEdBQUc7QUFBQTtBQUFBLEVBRzdCLE1BQU0sZUFBZSxJQUFJO0FBQUEsRUFDekIsTUFBTSxlQUFlLElBQUk7QUFBQSxFQUN6QixJQUFJLG9CQUFtQztBQUFBLEVBRXZDLFNBQVMsbUJBQW1CLENBQUMsS0FBYSxTQUFrQjtBQUFBLElBQzFELElBQUk7QUFBQSxNQUNGLE1BQU0sYUFBYSxXQUFXLGFBQWEsSUFBSSxHQUFHO0FBQUEsTUFDbEQsSUFBSSxNQUErQjtBQUFBLE1BQ25DLElBQUksWUFBWTtBQUFBLFFBQ2QsTUFBTSxTQUFTLGNBQWMsWUFBWSxjQUFjO0FBQUEsTUFDekQ7QUFBQSxNQUNBLElBQUksQ0FBQyxLQUFLO0FBQUEsUUFDUixNQUFNLFdBQVcsU0FBUyxjQUFjLFVBQVUsNEJBQTRCLE9BQU87QUFBQSxRQUNyRixJQUFJLFVBQVU7QUFBQSxVQUNaLE1BQU0sU0FBUyxjQUFjLG1EQUFtRDtBQUFBLFFBQ2xGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsSUFBSSxLQUFLO0FBQUEsUUFDUCxJQUFJLGFBQWEsWUFBWSxP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
