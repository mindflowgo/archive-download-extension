/**
 * Fast, pure JavaScript PDF compiler for embedding JPEG page images into PDF documents.
 * Conforms to PDF 1.4 specification. Zero external binary dependencies.
 */

export interface JpegInfo {
  width: number;
  height: number;
  channels: number;
  colorSpace: 'DeviceGray' | 'DeviceRGB' | 'DeviceCMYK';
  bits: number;
}

/**
 * Extracts width, height, and color space directly from JPEG header markers (SOF0/SOF2).
 */
export function getJpegInfo(data: Uint8Array): JpegInfo {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (view.getUint16(0) !== 0xffd8) {
    throw new Error('Not a valid JPEG image (missing SOI marker).');
  }

  const SOF_MARKERS = [
    0xffc0, 0xffc1, 0xffc2, 0xffc3, 0xffc5, 0xffc6, 0xffc7, 0xffc9, 0xffca,
    0xffcb, 0xffcd, 0xffce, 0xffcf,
  ];

  let pos = 2;
  while (pos < data.length - 8) {
    const marker = view.getUint16(pos);
    pos += 2;

    if (SOF_MARKERS.includes(marker)) {
      pos += 2; // skip length
      const bits = view.getUint8(pos++);
      const height = view.getUint16(pos);
      pos += 2;
      const width = view.getUint16(pos);
      pos += 2;
      const channels = view.getUint8(pos++);

      let colorSpace: 'DeviceGray' | 'DeviceRGB' | 'DeviceCMYK' = 'DeviceRGB';
      if (channels === 1) colorSpace = 'DeviceGray';
      else if (channels === 4) colorSpace = 'DeviceCMYK';

      return { width, height, channels, colorSpace, bits };
    }

    const length = view.getUint16(pos);
    pos += length;
  }

  throw new Error('Could not find SOF marker in JPEG stream.');
}

/**
 * Helper to convert Base64 Data URL to Uint8Array.
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface PdfImageInput {
  pageNum: number;
  data: Uint8Array | string; // Uint8Array or DataURL
  width?: number;
  height?: number;
}

/**
 * Compiles a list of JPEG images into a valid PDF document.
 * Embeds raw JPEG streams directly without decompression or re-encoding.
 */
export function compileJpegsToPdf(
  images: PdfImageInput[],
  metadata: { title?: string; author?: string; creator?: string } = {}
): Uint8Array {
  if (images.length === 0) {
    throw new Error('Cannot create PDF: No images provided.');
  }

  const textEncoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  function write(bytes: Uint8Array) {
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  function writeString(str: string) {
    write(textEncoder.encode(str));
  }

  // Header
  writeString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  let objIdCounter = 1;
  function startObject(): number {
    const id = objIdCounter++;
    offsets[id] = currentOffset;
    writeString(`${id} 0 obj\n`);
    return id;
  }

  function endObject() {
    writeString('endobj\n');
  }

  const totalPages = images.length;

  // Pre-calculate Object IDs:
  // 1: Catalog
  // 2: Pages
  // 3 + (i * 3): Page object
  // 4 + (i * 3): Content stream
  // 5 + (i * 3): Image XObject
  const catalogId = 1;
  const pagesRootId = 2;
  const pageIds: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pageIds.push(3 + i * 3);
  }

  // 1. Catalog
  startObject(); // 1
  writeString(`<<\n  /Type /Catalog\n  /Pages ${pagesRootId} 0 R\n>>\n`);
  endObject();

  // 2. Pages Root
  startObject(); // 2
  const kidsStr = pageIds.map(id => `${id} 0 R`).join(' ');
  writeString(`<<\n  /Type /Pages\n  /Kids [ ${kidsStr} ]\n  /Count ${totalPages}\n>>\n`);
  endObject();

  // 3. Render Each Page (Page, Contents, Image XObject)
  for (let i = 0; i < totalPages; i++) {
    const item = images[i];
    const imageBytes = typeof item.data === 'string' ? dataUrlToBytes(item.data) : item.data;
    const info = getJpegInfo(imageBytes);

    const width = item.width || info.width;
    const height = item.height || info.height;

    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;

    // Page Object
    startObject(); // pageObjId
    writeString(
      `<<\n` +
      `  /Type /Page\n` +
      `  /Parent ${pagesRootId} 0 R\n` +
      `  /MediaBox [ 0 0 ${width} ${height} ]\n` +
      `  /Contents ${contentObjId} 0 R\n` +
      `  /Resources <<\n` +
      `    /XObject << /Im${i + 1} ${imageObjId} 0 R >>\n` +
      `  >>\n` +
      `>>\n`
    );
    endObject();

    // Content Stream
    const contentStream = `q\n${width} 0 0 ${height} 0 0 cm\n/Im${i + 1} Do\nQ\n`;
    const contentBytes = textEncoder.encode(contentStream);

    startObject(); // contentObjId
    writeString(`<< /Length ${contentBytes.length} >>\nstream\n`);
    write(contentBytes);
    writeString('\nendstream\n');
    endObject();

    // Image XObject
    startObject(); // imageObjId
    writeString(
      `<<\n` +
      `  /Type /XObject\n` +
      `  /Subtype /Image\n` +
      `  /Width ${info.width}\n` +
      `  /Height ${info.height}\n` +
      `  /ColorSpace /${info.colorSpace}\n` +
      `  /BitsPerComponent ${info.bits}\n` +
      `  /Filter /DCTDecode\n` +
      `  /Length ${imageBytes.length}\n` +
      `>>\nstream\n`
    );
    write(imageBytes);
    writeString('\nendstream\n');
    endObject();
  }

  // Optional Info Object
  const infoId = startObject();
  const safeTitle = (metadata.title || 'Archive.org Book').replace(/[()\\]/g, '\\$&');
  const safeAuthor = (metadata.author || 'Archive.org').replace(/[()\\]/g, '\\$&');
  const creator = (metadata.creator || 'Archive Downloader').replace(/[()\\]/g, '\\$&');
  writeString(
    `<<\n` +
    `  /Title (${safeTitle})\n` +
    `  /Author (${safeAuthor})\n` +
    `  /Creator (${creator})\n` +
    `  /Producer (Archive Downloader Extension)\n` +
    `  /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z)\n` +
    `>>\n`
  );
  endObject();

  // XRef Table
  const startXref = currentOffset;
  const totalObjects = objIdCounter; // 1 to objIdCounter-1

  writeString(`xref\n0 ${totalObjects}\n`);
  writeString('0000000000 65535 f \n');

  for (let id = 1; id < totalObjects; id++) {
    const offset = offsets[id] || 0;
    const paddedOffset = String(offset).padStart(10, '0');
    writeString(`${paddedOffset} 00000 n \n`);
  }

  // Trailer
  writeString(
    `trailer\n` +
    `<<\n` +
    `  /Size ${totalObjects}\n` +
    `  /Root ${catalogId} 0 R\n` +
    `  /Info ${infoId} 0 R\n` +
    `>>\n` +
    `startxref\n` +
    `${startXref}\n` +
    `%%EOF\n`
  );

  // Concatenate all chunks into final Uint8Array
  let totalLength = 0;
  for (const chunk of chunks) totalLength += chunk.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
}

/**
 * Alias for compileJpegsToPdf.
 */
export const compileImagesToPdf = compileJpegsToPdf;
