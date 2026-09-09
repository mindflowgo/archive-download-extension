import { describe, expect, it } from 'bun:test';
import { parseHathiFigcaptionToText, buildBookMarkdown } from '../src/utils/markdown-builder';
import { HathiTrustProvider } from '../src/providers/hathitrust-provider';
import { ArchiveProvider } from '../src/providers/archive-provider';

describe('HathiTrust Integration & Extraction', () => {
  describe('parseHathiFigcaptionToText', () => {
    it('should strip figcaption HTML and nested spans into clean paragraphs', () => {
      const sampleFigcaption = `
        <figcaption>
          <p class="ocr_par">
            <span class="ocrx_word">In</span>
            <span class="ocrx_word">the</span>
            <span class="ocrx_word">beginning</span>
            <span class="ocrx_word">was</span>
            <span class="ocrx_word">the</span>
            <span class="ocrx_word">Word.</span>
          </p>
          <p class="ocr_par">
            <span class="ocrx_word">And</span>
            <span class="ocrx_word">the</span>
            <span class="ocrx_word">Word</span>
            <span class="ocrx_word">was</span>
            <span class="ocrx_word">with</span>
            <span class="ocrx_word">God.</span>
          </p>
        </figcaption>
      `;

      const parsed = parseHathiFigcaptionToText(sampleFigcaption);
      expect(parsed).toBe('In the beginning was the Word.\n\nAnd the Word was with God.');
    });

    it('should decode HTML entities like &mdash; and &#8212; in figcaption text', () => {
      const sampleWithEntities = `
        <figcaption>
          <p><span>Section</span> <span>1</span> <span>&#8212;</span> <span>Introduction</span> <span>&amp;</span> <span>Overview&hellip;</span></p>
        </figcaption>
      `;

      const parsed = parseHathiFigcaptionToText(sampleWithEntities);
      expect(parsed).toBe('Section 1 — Introduction & Overview…');
    });

    it('should handle un-paragraphed spans or line breaks cleanly', () => {
      const sampleSpansOnly = `
        <figcaption>
          <span>Line</span> <span>one</span><br><span>Line</span> <span>two</span>
        </figcaption>
      `;

      const parsed = parseHathiFigcaptionToText(sampleSpansOnly);
      expect(parsed).toContain('Line one');
      expect(parsed).toContain('Line two');
    });

    it('should return empty string for null or empty input', () => {
      expect(parseHathiFigcaptionToText('')).toBe('');
      expect(parseHathiFigcaptionToText(null as any)).toBe('');
    });
  });

  describe('Total Pages DOM Pattern Extraction', () => {
    it('should extract total pages from HathiTrust toolbar container pattern', () => {
      const toolbarSnippet = `<form class="d-none d-sm-block"><div class="d-flex align-items-center gap-1 bg-dark text-light p-1 px-2 rounded"><label for="toolbar-seq"><span>#</span> <span class="visually-hidden">Page Sequence</span></label> <input id="toolbar-seq" name="seq" type="text" class="form-control text-center svelte-14uya10"> <span>/</span> <span>272</span></div></form>`;

      // 1. Simulating textContent (in browser DOM)
      const textContent = '# Page Sequence / 272';
      const textMatch = textContent.match(/\/\s*(\d+)/);
      expect(textMatch).not.toBeNull();
      expect(parseInt(textMatch![1], 10)).toBe(272);

      // 2. Testing raw HTML pattern
      const htmlMatch = toolbarSnippet.match(/\/\s*<\/span>\s*<span>\s*(\d+)/i);
      expect(htmlMatch).not.toBeNull();
      expect(parseInt(htmlMatch![1], 10)).toBe(272);
    });
  });

  describe('buildBookMarkdown for HathiTrust', () => {
    it('should format HathiTrust Identifier and source URL correctly', () => {
      const md = buildBookMarkdown(
        {
          title: 'Sample Hathi Volume',
          bookId: 'ucm.5324331059',
          author: 'Author Name',
          sourceUrl: 'https://babel.hathitrust.org/cgi/pt?id=ucm.5324331059&seq=5',
          totalPages: 272,
        },
        [
          {
            pageNum: 5,
            leafIndex: 5,
            text: 'Extracted OCR content for sequence 5.',
          },
        ]
      );

      expect(md).toContain('# Sample Hathi Volume');
      expect(md).toContain('- **Author:** Author Name');
      expect(md).toContain('- **HathiTrust Identifier:** [ucm.5324331059](https://babel.hathitrust.org/cgi/pt?id=ucm.5324331059&seq=5)');
      expect(md).not.toContain('Internet Archive Identifier');
      expect(md).toContain('- **Total Pages:** 272');
      expect(md).toContain('## Page 5');
      expect(md).toContain('Extracted OCR content for sequence 5.');
    });
  });

  describe('Book Providers Specification', () => {
    it('HathiTrustProvider should have siteId hathitrust and defaultStartPage 1', () => {
      const hathitrust = new HathiTrustProvider();
      expect(hathitrust.siteId).toBe('hathitrust');
      expect(hathitrust.siteName).toBe('HathiTrust');
      expect(hathitrust.defaultStartPage).toBe(1);
    });

    it('ArchiveProvider should have siteId archive and defaultStartPage 0', () => {
      const archive = new ArchiveProvider();
      expect(archive.siteId).toBe('archive');
      expect(archive.siteName).toBe('Archive.org');
      expect(archive.defaultStartPage).toBe(0);
    });
  });

  describe('HathiTrust Next Page Button Selector', () => {
    it('should match the HathiTrust Next Page button HTML markup', () => {
      const buttonSnippet = '<button type="button" class="btn btn-outline-dark" aria-label="Next Page"><i class="fa-solid fa-angle-right" aria-hidden="true"></i></button>';

      // Verify aria-label regex/selector match
      const ariaMatch = buttonSnippet.match(/aria-label="Next Page"/i);
      expect(ariaMatch).not.toBeNull();

      const classMatch = buttonSnippet.match(/class="[^"]*btn[^"]*"/i);
      expect(classMatch).not.toBeNull();
    });
  });

  describe('Rate Limiting (429) & HTTP Error Backoff Calculation', () => {
    function calculateBackoff(consecutiveCount: number, retryAfter?: number): number {
      const isServerRequested = typeof retryAfter === 'number' && !isNaN(retryAfter) && retryAfter > 0;
      return isServerRequested
        ? retryAfter
        : Math.min(10 * Math.pow(2, Math.max(0, consecutiveCount - 1)), 60);
    }

    function formatRetryStatus(remaining: number, statusCode: number, isServerRequested: boolean = false): string {
      let label = statusCode === 429
        ? 'Rate Limited'
        : (statusCode >= 500 ? `Server Error (${statusCode})` : `HTTP ${statusCode}`);

      if (isServerRequested) {
        label += ' (server asked)';
      }

      const timeStr = remaining > 120
        ? `${Math.round(remaining / 60)}m`
        : `${remaining}s`;

      return `${timeStr} Retrying: ${label}.`;
    }

    it('should calculate exponential backoff up to 60s cap when no Retry-After is provided', () => {
      expect(calculateBackoff(1)).toBe(10); // 1st attempt: 10s
      expect(calculateBackoff(2)).toBe(20); // 2nd attempt: 20s
      expect(calculateBackoff(3)).toBe(40); // 3rd attempt: 40s
      expect(calculateBackoff(4)).toBe(60); // 4th attempt: capped at 60s
      expect(calculateBackoff(10)).toBe(60); // 10th attempt: capped at 60s
    });

    it('should strictly follow server requested Retry-After duration (even 2101s / 35 min)', () => {
      expect(calculateBackoff(1, 15)).toBe(15);
      expect(calculateBackoff(3, 30)).toBe(30);
      expect(calculateBackoff(1, 2101)).toBe(2101);
      expect(calculateBackoff(2, 3600)).toBe(3600);
    });

    it('should format retry status text with remaining time first', () => {
      expect(formatRetryStatus(60, 429)).toBe('60s Retrying: Rate Limited.');
      expect(formatRetryStatus(10, 429)).toBe('10s Retrying: Rate Limited.');
      expect(formatRetryStatus(25, 503)).toBe('25s Retrying: Server Error (503).');
      expect(formatRetryStatus(5, 500)).toBe('5s Retrying: Server Error (500).');
    });

    it('should indicate (server asked) and display in minutes if remaining > 120s', () => {
      expect(formatRetryStatus(2101, 429, true)).toBe('35m Retrying: Rate Limited (server asked).');
      expect(formatRetryStatus(180, 429, true)).toBe('3m Retrying: Rate Limited (server asked).');
      expect(formatRetryStatus(300, 503, true)).toBe('5m Retrying: Server Error (503) (server asked).');
      expect(formatRetryStatus(120, 429, true)).toBe('120s Retrying: Rate Limited (server asked).');
      expect(formatRetryStatus(45, 429, true)).toBe('45s Retrying: Rate Limited (server asked).');
    });
  });

  describe('Out-of-Order Sequence Announcements & Preload Buffer', () => {
    it('should track out-of-order sequence announcements correctly', () => {
      const provider = new HathiTrustProvider();

      // Simulate preloading sequence 169 before sequence 168
      provider.onPageLoadAnnounced(169, true, true);
      provider.onPageImageReady(169, 'blob:https://babel.hathitrust.org/seq169-blob');

      expect(provider.isPageAnnounced(169)).toBe(true);
      expect(provider.isPageAnnounced(168)).toBe(false);
      expect(provider.getBlobUrlForSeq(169)).toBe('blob:https://babel.hathitrust.org/seq169-blob');
      expect(provider.getBlobUrlForSeq(168)).toBeUndefined();

      // Now sequence 168 finishes loading
      provider.onPageLoadAnnounced(168, true, true);
      provider.onPageImageReady(168, 'blob:https://babel.hathitrust.org/seq168-blob');

      expect(provider.isPageAnnounced(168)).toBe(true);
      expect(provider.getBlobUrlForSeq(168)).toBe('blob:https://babel.hathitrust.org/seq168-blob');
    });

    it('should parse intercepted OCR HTML from network cache directly', async () => {
      const provider = new HathiTrustProvider();

      const ocrHtml = `
        <div class="ocr_par">
          <p class="ocr_line"><span>First</span> <span>line</span> <span>of</span> <span>text</span></p>
          <p class="ocr_line"><span>Second</span> <span>line</span> <span>with</span> <span>&mdash;</span> <span>dash</span></p>
        </div>
      `;

      provider.onPageTextReady(168, ocrHtml);
      expect(provider.getCachedHtmlForSeq(168)).toBe(ocrHtml);

      const text = await provider.extractPageText(168);
      expect(text).toContain('First line of text');
      expect(text).toContain('Second line with — dash');
    });

    it('should reject preloaded out-of-order images when target sequence is requested', () => {
      const provider = new HathiTrustProvider();

      // Register blob for preloaded sequence 169
      provider.onPageImageReady(169, 'blob:https://babel.hathitrust.org/img-169');

      // Requesting sequence 168 when only 169 is ready should return null
      const resultFor168 = provider.getActivePageImage(300, 168);
      expect(resultFor168).toBeNull();
    });

    it('should find image tagged with data-seq or visible within viewport', () => {
      const provider = new HathiTrustProvider();

      const mockImg168: any = {
        complete: true,
        naturalWidth: 1024,
        naturalHeight: 1536,
        src: 'blob:https://babel.hathitrust.org/spread168-blob',
        dataset: { seq: '168' },
        setAttribute: (k: string, v: string) => {},
        getBoundingClientRect: () => ({ top: 10, bottom: 500, left: 10, right: 500, width: 490, height: 490 }),
      };

      const origDoc = (globalThis as any).document;
      try {
        (globalThis as any).document = {
          querySelector: (selector: string) => {
            if (selector.includes('img[data-seq="168"]')) {
              return mockImg168;
            }
            return null;
          },
          querySelectorAll: () => [mockImg168],
        };

        const result = provider.getActivePageImage(300, 168);
        expect(result).not.toBeNull();
        expect(result?.src).toBe('blob:https://babel.hathitrust.org/spread168-blob');
      } finally {
        (globalThis as any).document = origDoc;
      }
    });
  });
});
