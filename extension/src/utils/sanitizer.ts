/**
 * Filesystem and naming sanitization utilities
 */

/**
 * Sanitizes a string for safe usage in directory or file names across macOS, Linux, and Windows.
 */
export function sanitizeFilename(name: string, fallback = 'book'): string {
  if (!name || typeof name !== 'string') return fallback;

  // Remove or replace illegal characters: / \ : * ? " < > | and control chars
  let cleaned = name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading/trailing dots and spaces
  cleaned = cleaned.replace(/^\.+|\.+$/g, '').trim();

  // Avoid reserved names on Windows (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reserved.test(cleaned)) {
    cleaned = `${cleaned}_file`;
  }

  // Cap length to 120 characters to prevent path limit errors
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 120).trim();
  }

  return cleaned || fallback;
}

/**
 * Formats a subfolder path based on the user's template pattern.
 * Templates supported:
 * - {title} -> "The_Book_Title"
 * - {id} -> "naghammadilibrar00jame"
 * - {title}_{id} -> "The_Book_Title_naghammadilibrar00jame"
 */
export function formatSubdir(
  baseDir: string,
  pattern: string,
  bookTitle: string,
  bookId: string
): string {
  const safeBase = sanitizeFilename(baseDir, 'ArchiveBooks');
  const safeTitle = sanitizeFilename(bookTitle, 'book');
  const safeId = sanitizeFilename(bookId, 'id');

  let folder = pattern || '{title}_{id}';
  folder = folder.replace(/\{title\}/g, safeTitle);
  folder = folder.replace(/\{id\}/g, safeId);
  folder = sanitizeFilename(folder, safeTitle);

  return `${safeBase}/${folder}`;
}

/**
 * Formats a page image filename with zero padding.
 * Example: "page_001.jpg"
 */
export function formatPageFilename(
  pageNum: number,
  totalPages: number,
  format = 'jpg'
): string {
  const padLength = Math.max(3, String(totalPages).length);
  const paddedNum = String(pageNum).padStart(padLength, '0');
  return `page_${paddedNum}.${format}`;
}
