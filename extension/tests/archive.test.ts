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
  });
});
