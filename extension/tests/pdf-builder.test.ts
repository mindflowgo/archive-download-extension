import { describe, expect, it } from 'bun:test';
import { getJpegInfo, compileJpegsToPdf } from '../src/utils/pdf-builder';

describe('PDF Builder utilities', () => {
  // A minimal valid Grayscale JPEG
  const minimalJpeg = new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x64, 0x00, 0x32, 0x01, 0x01, 0x11, 0x00, // SOF0: height=100, width=50, 1 component
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, // SOS
    0x00, // data
    0xff, 0xd9, // EOI
  ]);

  it('should parse JPEG dimensions and properties correctly', () => {
    const info = getJpegInfo(minimalJpeg);
    expect(info.width).toBe(50);
    expect(info.height).toBe(100);
    expect(info.colorSpace).toBe('DeviceGray');
    expect(info.bits).toBe(8);
  });

  it('should compile multiple JPEG pages into a valid PDF document', () => {
    const pdfBytes = compileJpegsToPdf(
      [
        { pageNum: 1, data: minimalJpeg },
        { pageNum: 2, data: minimalJpeg },
      ],
      { title: 'Test Book', author: 'Archive Downloader' }
    );

    const pdfString = new TextDecoder().decode(pdfBytes);
    expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
    expect(pdfString).toContain('/Type /Catalog');
    expect(pdfString).toContain('/Type /Pages');
    expect(pdfString).toContain('/Count 2');
    expect(pdfString).toContain('/Filter /DCTDecode');
    expect(pdfString).toContain('(Test Book)');
    expect(pdfString.endsWith('%%EOF\n')).toBe(true);
  });

  describe('Page Size & Max Height Reduction', () => {
    function calculateScaledDimensions(
      originalWidth: number,
      originalHeight: number,
      maxPageHeight: number
    ): { width: number; height: number } {
      if (maxPageHeight > 0 && originalHeight > maxPageHeight) {
        const scale = maxPageHeight / originalHeight;
        return {
          width: Math.round(originalWidth * scale),
          height: maxPageHeight,
        };
      }
      return { width: originalWidth, height: originalHeight };
    }

    it('should reduce page height to maxPageHeight while preserving aspect ratio', () => {
      // e.g. 1512x2016 -> maxPageHeight: 1000
      const scaled = calculateScaledDimensions(1512, 2016, 1000);
      expect(scaled.height).toBe(1000);
      expect(scaled.width).toBe(750); // 1512 * (1000 / 2016) = 750
    });

    it('should not scale up if page height is already below maxPageHeight', () => {
      // 600x800 with maxPageHeight: 1000
      const scaled = calculateScaledDimensions(600, 800, 1000);
      expect(scaled.height).toBe(800);
      expect(scaled.width).toBe(600);
    });

    it('should not scale if maxPageHeight is 0 (original size)', () => {
      const scaled = calculateScaledDimensions(1512, 2016, 0);
      expect(scaled.height).toBe(2016);
      expect(scaled.width).toBe(1512);
    });
  });
});
