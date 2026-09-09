/**
 * Utilities for extracting OCR text from DJVU XML and compiling Markdown documents
 */

export interface PageTextEntry {
  pageNum: number;
  leafIndex: number;
  text: string;
}

export interface BookMetadata {
  title: string;
  bookId: string;
  author?: string;
  publisher?: string;
  year?: string;
  sourceUrl?: string;
  totalPages?: number;
}

/**
 * Strips DJVU XML into clean, structured plain text for a single page.
 * Robustly parses PARAGRAPH, LINE, and WORD elements.
 * Works seamlessly in both browser and Node/Bun test environments.
 */
export function parseDjvuXmlToText(xmlString: string): string {
  if (!xmlString || typeof xmlString !== 'string') return '';

  // Extract all PARAGRAPH blocks
  const paragraphMatches = xmlString.match(/<PARAGRAPH[\s\S]*?<\/PARAGRAPH>/gi);
  if (!paragraphMatches || paragraphMatches.length === 0) {
    // If no PARAGRAPH tags, try extracting words directly
    const words = Array.from(xmlString.matchAll(/<WORD[^>]*>([\s\S]*?)<\/WORD>/gi))
      .map(m => decodeXmlEntities(m[1].trim()))
      .filter(Boolean);
    return words.join(' ');
  }

  const paragraphs: string[] = [];

  for (const parBlock of paragraphMatches) {
    // Extract all LINE blocks inside this PARAGRAPH
    const lineMatches = parBlock.match(/<LINE[\s\S]*?<\/LINE>/gi);
    const lines: string[] = [];

    if (lineMatches && lineMatches.length > 0) {
      for (const lineBlock of lineMatches) {
        // Extract all WORD contents inside this LINE
        const wordMatches = Array.from(lineBlock.matchAll(/<WORD[^>]*>([\s\S]*?)<\/WORD>/gi));
        const words = wordMatches
          .map(m => decodeHtmlAndXmlEntities(m[1].trim()))
          .filter(Boolean);

        if (words.length > 0) {
          lines.push(words.join(' '));
        }
      }
    } else {
      // Fallback: words directly in paragraph
      const wordMatches = Array.from(parBlock.matchAll(/<WORD[^>]*>([\s\S]*?)<\/WORD>/gi));
      const words = wordMatches
        .map(m => decodeHtmlAndXmlEntities(m[1].trim()))
        .filter(Boolean);

      if (words.length > 0) {
        lines.push(words.join(' '));
      }
    }

    if (lines.length > 0) {
      paragraphs.push(decodeHtmlAndXmlEntities(lines.join('\n')));
    }
  }

  return decodeHtmlAndXmlEntities(paragraphs.join('\n\n'));
}

/**
 * Helper to decode all HTML and XML entities into proper UTF-8 characters.
 * Handles numeric decimal (e.g. &#8212; -> —), hex (&#x2014;), and named entities.
 */
export function decodeHtmlAndXmlEntities(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // 1. Decimal numeric entities: &#8212; -> '—'
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10);
        return String.fromCodePoint(code);
      } catch {
        return _;
      }
    })
    // 2. Hexadecimal numeric entities: &#x2014; -> '—'
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        return String.fromCodePoint(code);
      } catch {
        return _;
      }
    })
    // 3. Named entities
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&cent;/g, '¢')
    .replace(/&pound;/g, '£')
    .replace(/&yen;/g, '¥')
    .replace(/&euro;/g, '€')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&deg;/g, '°')
    .replace(/&plusmn;/g, '±')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // decode &amp; last
}

/**
 * Strips HathiTrust <figcaption> markup into clean, formatted Markdown/text.
 * Handles both DOM Element inputs (in browser) and raw HTML strings (in tests).
 * Extracts word spans, preserves paragraph breaks, and decodes HTML entities.
 */
export function parseHathiFigcaptionToText(input: string | any): string {
  if (!input) return '';

  // If DOM Element in browser environment
  if (typeof input === 'object' && input.nodeType) {
    const el = input as Element;
    const pElements = Array.from(el.querySelectorAll('p, .ocr_par'));

    if (pElements.length > 0) {
      const paragraphs = pElements.map(p => {
        const spans = Array.from(p.querySelectorAll('span, .ocrx_word, .ocr_line'));
        if (spans.length > 0) {
          return spans
            .map(s => (s.textContent || '').trim())
            .filter(Boolean)
            .join(' ');
        }
        return (p.textContent || '').trim().replace(/\s+/g, ' ');
      }).filter(Boolean);

      return decodeHtmlAndXmlEntities(paragraphs.join('\n\n'));
    }

    // If no <p> tags, check for line elements
    const lines = Array.from(el.querySelectorAll('.ocr_line, div'));
    if (lines.length > 0) {
      const lineTexts = lines.map(line => {
        const spans = Array.from(line.querySelectorAll('span, .ocrx_word'));
        if (spans.length > 0) {
          return spans.map(s => (s.textContent || '').trim()).filter(Boolean).join(' ');
        }
        return (line.textContent || '').trim().replace(/\s+/g, ' ');
      }).filter(Boolean);

      return decodeHtmlAndXmlEntities(lineTexts.join('\n'));
    }

    // Fallback: extract all spans or text directly
    const spans = Array.from(el.querySelectorAll('span'));
    if (spans.length > 0) {
      const text = spans.map(s => (s.textContent || '').trim()).filter(Boolean).join(' ');
      return decodeHtmlAndXmlEntities(text);
    }

    return decodeHtmlAndXmlEntities((el.textContent || '').trim().replace(/[ \t]+/g, ' '));
  }

  // If input is an HTML string
  if (typeof input === 'string') {
    let clean = input;

    // Check for <p> or <div class="ocr_par"> paragraphs
    const pMatches = clean.match(/<(?:p|div class="ocr_par")[^>]*>([\s\S]*?)<\/(?:p|div)>/gi);
    if (pMatches && pMatches.length > 0) {
      const paragraphs = pMatches.map(pBlock => {
        return pBlock
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/[ \t\r\n]+/g, ' ')
          .trim();
      }).filter(Boolean);

      return decodeHtmlAndXmlEntities(paragraphs.join('\n\n'));
    }

    // Otherwise strip tags, preserving <br> as line breaks
    const text = clean
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();

    return decodeHtmlAndXmlEntities(text);
  }

  return '';
}

/**
 * Assembles multiple page texts and book metadata into a clean, complete Markdown document.
 */
export function buildBookMarkdown(
  metadata: BookMetadata,
  pages: PageTextEntry[]
): string {
  const parts: string[] = [];

  // Title and Header
  parts.push(`# ${metadata.title || 'Untitled Book'}\n`);

  const metaLines: string[] = [];
  if (metadata.author) metaLines.push(`- **Author:** ${metadata.author}`);
  if (metadata.publisher) metaLines.push(`- **Publisher:** ${metadata.publisher}`);
  if (metadata.year) metaLines.push(`- **Date:** ${metadata.year}`);

  if (metadata.bookId) {
    if (metadata.sourceUrl && metadata.sourceUrl.includes('hathitrust.org')) {
      metaLines.push(`- **HathiTrust Identifier:** [${metadata.bookId}](${metadata.sourceUrl})`);
    } else {
      metaLines.push(`- **Internet Archive Identifier:** [${metadata.bookId}](https://archive.org/details/${metadata.bookId})`);
    }
  }

  if (metadata.sourceUrl && !metaLines.some(l => l.includes(metadata.sourceUrl!))) {
    metaLines.push(`- **Source:** ${metadata.sourceUrl}`);
  }
  if (metadata.totalPages) metaLines.push(`- **Total Pages:** ${metadata.totalPages}`);

  if (metaLines.length > 0) {
    parts.push(metaLines.join('\n'));
    parts.push('\n---\n');
  }

  // Sort pages by pageNum
  const sorted = [...pages].sort((a, b) => a.pageNum - b.pageNum);

  for (const page of sorted) {
    parts.push(`## Page ${page.pageNum}\n\n`);
    if (page.text && page.text.trim()) {
      parts.push(`${page.text.trim()}\n`);
    } else {
      parts.push(`*[No text or illustration page]*\n`);
    }
    parts.push('\n---\n');
  }

  return parts.join('\n');
}

