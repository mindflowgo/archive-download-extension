import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { ArchiveProvider } from '../src/providers/archive-provider';

describe('Archive.org Provider & Multi-Version BookReader Integration', () => {
  let provider: ArchiveProvider;
  let origDocument: any;
  let mockElements: Map<string, any>;

  beforeEach(() => {
    provider = new ArchiveProvider();
    origDocument = (globalThis as any).document;
    mockElements = new Map();
  });

  afterEach(() => {
    (globalThis as any).document = origDocument;
  });

  describe('getCurrentPage DOM Pattern Variations', () => {
    it('should extract current page from standard (1/515) pattern', () => {
      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('.BRcurrentpage')) {
            return { textContent: 'Page — (1/515)' };
          }
          return null;
        }
      };
      expect(provider.getCurrentPage()).toBe(1);
    });

    it('should extract current page from 2-page range (1 - 2/515) pattern', () => {
      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('.BRcurrentpage')) {
            return { textContent: 'Pages (1 - 2/515)' };
          }
          return null;
        }
      };
      expect(provider.getCurrentPage()).toBe(1);
    });

    it('should extract current page from "Page 42 of 300" text pattern', () => {
      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('.BRcurrentpage') || sel.includes('.page-number')) {
            return { textContent: 'Page 42 of 300' };
          }
          return null;
        }
      };
      expect(provider.getCurrentPage()).toBe(42);
    });

    it('should extract current page from input.BRpageinput element', () => {
      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('input.BRpageinput')) {
            return { value: '7' };
          }
          return null;
        }
      };
      expect(provider.getCurrentPage()).toBe(7);
    });

    it('should extract current page from active container data-index', () => {
      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('.BRpagecontainer')) {
            return {
              getAttribute: (attr: string) => (attr === 'data-index' ? '15' : null),
            };
          }
          return null;
        }
      };
      expect(provider.getCurrentPage()).toBe(15);
    });
  });

  describe('isAtEndOfBook Boundary Check', () => {
    it('should NOT trigger end of book when on page 1 of 515 pages', () => {
      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('.BRcurrentpage')) return { textContent: '(1/515)' };
          if (sel.includes('button')) return { disabled: false, getAttribute: () => null, classList: { contains: () => false } };
          return null;
        }
      };
      expect(provider.isAtEndOfBook(1, 515)).toBe(false);
    });

    it('should trigger end of book when currentPage matches or exceeds totalPages', () => {
      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('.BRcurrentpage')) return { textContent: '(515/515)' };
          return null;
        }
      };
      expect(provider.isAtEndOfBook(515, 515)).toBe(true);
    });
  });

  describe('getActivePageImage Multi-Version DOM Matching', () => {
    it('should match image within modern .BRpagecontainer[data-index] and tag dataset.seq', () => {
      const mockImg1: any = {
        complete: true,
        naturalWidth: 1200,
        naturalHeight: 1800,
        src: 'blob:http://localhost/leaf1',
        dataset: {},
        getBoundingClientRect: () => ({ top: 10, bottom: 600, left: 10, right: 600, width: 590, height: 590 }),
      };

      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('[data-index="1"]') || sel.includes('.pagediv1')) {
            return mockImg1;
          }
          return null;
        },
        querySelectorAll: () => [mockImg1],
      };

      const found = provider.getActivePageImage(300, 1);
      expect(found).not.toBeNull();
      expect(found?.src).toBe('blob:http://localhost/leaf1');
      expect(found?.dataset.seq).toBe('1');
    });

    it('should match legacy .BRpage[data-page] container when requested', () => {
      const mockImg2: any = {
        complete: true,
        naturalWidth: 800,
        naturalHeight: 1200,
        src: 'https://ia6001.us.archive.org/BookReader/img2.jpg',
        dataset: {},
        getBoundingClientRect: () => ({ top: 10, bottom: 600, left: 10, right: 600, width: 590, height: 590 }),
      };

      (globalThis as any).document = {
        querySelector: (sel: string) => {
          if (sel.includes('.BRpage[data-page="2"]')) {
            return mockImg2;
          }
          return null;
        },
        querySelectorAll: () => [mockImg2],
      };

      const found = provider.getActivePageImage(300, 2);
      expect(found).not.toBeNull();
      expect(found?.src).toContain('img2.jpg');
      expect(found?.dataset.seq).toBe('2');
    });

    it('should return latest DOM image as fallback if container lookup fails', () => {
      const mockImgA: any = {
        complete: true,
        naturalWidth: 1000,
        naturalHeight: 1500,
        src: 'https://archive.org/leaf_a.jpg',
        dataset: {},
        closest: () => null,
        getBoundingClientRect: () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }),
      };
      const mockImgB: any = {
        complete: true,
        naturalWidth: 1000,
        naturalHeight: 1500,
        src: 'https://archive.org/leaf_b.jpg',
        dataset: {},
        closest: () => null,
        getBoundingClientRect: () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }),
      };

      (globalThis as any).document = {
        querySelector: () => null,
        querySelectorAll: () => [mockImgA, mockImgB],
      };

      const found = provider.getActivePageImage(300, 5);
      expect(found).not.toBeNull();
      expect(found?.src).toBe('https://archive.org/leaf_b.jpg');
      expect(found?.dataset.seq).toBe('5');
    });

    it('should match image by URL filename when targetPageNum matches (e.g. _0030.tif -> 30)', () => {
      const mockImgOld: any = {
        complete: true,
        naturalWidth: 1560,
        naturalHeight: 2348,
        src: 'https://ia800805.us.archive.org/BookReader/BookReaderImages.php?zip=/0/items/principlesteach01nuttgoog/principlesteach01nuttgoog_tif.zip&file=principlesteach01nuttgoog_tif/principlesteach01nuttgoog_0029.tif&id=principlesteach01nuttgoog&scale=4&rotate=0',
        dataset: {},
        getBoundingClientRect: () => ({ top: 10, bottom: 600, left: 10, right: 600, width: 590, height: 590 }),
      };
      const mockImgTarget: any = {
        complete: true,
        naturalWidth: 1560,
        naturalHeight: 2348,
        src: 'https://ia800805.us.archive.org/BookReader/BookReaderImages.php?zip=/0/items/principlesteach01nuttgoog/principlesteach01nuttgoog_tif.zip&file=principlesteach01nuttgoog_tif/principlesteach01nuttgoog_0030.tif&id=principlesteach01nuttgoog&scale=4&rotate=0',
        dataset: {},
        getBoundingClientRect: () => ({ top: 10, bottom: 600, left: 10, right: 600, width: 590, height: 590 }),
      };

      (globalThis as any).document = {
        querySelector: () => null,
        querySelectorAll: () => [mockImgOld, mockImgTarget],
      };

      const found = provider.getActivePageImage(300, 30);
      expect(found).not.toBeNull();
      expect(found?.src).toContain('principlesteach01nuttgoog_0030.tif');
      expect(found?.dataset.seq).toBe('30');
    });

    it('should REJECT image if its URL filename explicitly belongs to an earlier page (e.g. still showing _0029.tif when 30 is requested)', () => {
      const mockImgOld: any = {
        complete: true,
        naturalWidth: 1560,
        naturalHeight: 2348,
        src: 'https://ia800805.us.archive.org/BookReader/BookReaderImages.php?zip=/0/items/principlesteach01nuttgoog/principlesteach01nuttgoog_tif.zip&file=principlesteach01nuttgoog_tif/principlesteach01nuttgoog_0029.tif&id=principlesteach01nuttgoog&scale=4&rotate=0',
        dataset: {},
        getBoundingClientRect: () => ({ top: 10, bottom: 600, left: 10, right: 600, width: 590, height: 590 }),
      };

      (globalThis as any).document = {
        querySelector: () => null,
        querySelectorAll: () => [mockImgOld],
      };

      const found = provider.getActivePageImage(300, 30);
      expect(found).toBeNull();
    });
  });

  describe('parseArchiveImageUrlPage & parseArchiveDomPage Utility Tests', () => {
    it('should parse leaf number from Archive.org BookReaderImages.php file parameter', async () => {
      const { parseArchiveImageUrlPage } = await import('../src/providers/archive-provider');
      const url30 = 'https://ia800805.us.archive.org/BookReader/BookReaderImages.php?zip=/0/items/principlesteach01nuttgoog/principlesteach01nuttgoog_tif.zip&file=principlesteach01nuttgoog_tif/principlesteach01nuttgoog_0030.tif&id=principlesteach01nuttgoog&scale=4&rotate=0';
      expect(parseArchiveImageUrlPage(url30)).toBe(30);

      const url0 = 'https://ia800805.us.archive.org/BookReader/BookReaderImages.php?zip=/items/book/book_tif.zip&file=book_tif/book_0000.tif&id=book&scale=4&rotate=0';
      expect(parseArchiveImageUrlPage(url0)).toBe(0);

      const url57 = 'https://ia800805.us.archive.org/BookReader/BookReaderImages.php?zip=/items/book/book_jp2.zip&file=book_jp2/book_0057.jp2&id=book&scale=4&rotate=0';
      expect(parseArchiveImageUrlPage(url57)).toBe(57);
    });

    it('should parse page and total from DOM status HTML (e.g. Page — (57/384))', async () => {
      const { parseArchiveDomPage } = await import('../src/providers/archive-provider');
      const res1 = parseArchiveDomPage('Page — (57/384)');
      expect(res1).not.toBeNull();
      expect(res1?.current).toBe(57);
      expect(res1?.total).toBe(384);

      const res2 = parseArchiveDomPage('(1/515)');
      expect(res2?.current).toBe(1);
      expect(res2?.total).toBe(515);

      const res3 = parseArchiveDomPage('Page 42 of 300');
      expect(res3?.current).toBe(42);
      expect(res3?.total).toBe(300);
    });
  });
});
