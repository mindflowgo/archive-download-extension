import { describe, expect, it } from 'bun:test';
import { parseDjvuXmlToText, buildBookMarkdown } from '../src/utils/markdown-builder';

describe('Markdown Builder utilities', () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<OBJECT data="file://localhost/var/tmp/autoclean/derive/naghammadilibrar00jame/naghammadilibrar00jame.djvu" type="image/x.djvu" usemap="naghammadilibrar00jame_0480.djvu" width="2580" height="3915">
   <PARAM name="PAGE" value="naghammadilibrar00jame_0480.djvu"/>
   <PARAM name="DPI" value="514"/>
   <HIDDENTEXT>
    <PAGECOLUMN>
     <REGION>
      <PARAGRAPH x-role="header-footer">
       <LINE>
        <WORD coords="460,250,917,205" x-confidence="56">462 </WORD>
        <WORD coords="917,247,1037,214" x-confidence="36">THE </WORD>
        <WORD coords="1037,247,1167,214" x-confidence="34">NAG </WORD>
        <WORD coords="1167,247,1435,214" x-confidence="58">HAMMADI </WORD>
        <WORD coords="1435,247,1673,214" x-confidence="59">LIBRARY </WORD>
        <WORD coords="1673,247,1748,215" x-confidence="20">IN </WORD>
        <WORD coords="1748,248,1960,214" x-confidence="71">ENGLISH</WORD>
       </LINE>
      </PARAGRAPH>
      <PARAGRAPH>
       <LINE>
        <WORD coords="461,413,545,367" x-confidence="36">its </WORD>
        <WORD coords="545,420,728,366" x-confidence="49">stand, </WORD>
        <WORD coords="728,422,847,365" x-confidence="58">[the </WORD>
        <WORD coords="847,422,1133,363" x-confidence="49">first]-born </WORD>
        <WORD coords="1133,411,1175,363" x-confidence="2">5 </WORD>
       </LINE>
      </PARAGRAPH>
     </REGION>
    </PAGECOLUMN>
   </HIDDENTEXT>
</OBJECT>`;

  it('should strip DJVU XML into clean text paragraphs', () => {
    const text = parseDjvuXmlToText(sampleXml);
    expect(text).toContain('462 THE NAG HAMMADI LIBRARY IN ENGLISH');
    expect(text).toContain('its stand, [the first]-born 5');
  });

  it('should decode HTML entities like &#8212; to proper UTF-8 characters', () => {
    const rawWithEntities = '<PARAGRAPH><LINE><WORD>Word</WORD><WORD>&#8212;</WORD><WORD>another&#8212;word</WORD><WORD>&mdash;</WORD><WORD>&quot;quoted&quot;</WORD></LINE></PARAGRAPH>';
    const decoded = parseDjvuXmlToText(rawWithEntities);
    expect(decoded).toContain('—'); // em-dash
    expect(decoded).not.toContain('&#8212;');
    expect(decoded).not.toContain('&mdash;');
    expect(decoded).toContain('"quoted"');
  });

  it('should build complete Markdown with metadata and page sections', () => {
    const markdown = buildBookMarkdown(
      {
        title: 'The Nag Hammadi Library in English',
        bookId: 'naghammadilibrar00jame',
        author: 'James M. Robinson',
        totalPages: 515,
      },
      [
        {
          pageNum: 480,
          leafIndex: 479,
          text: parseDjvuXmlToText(sampleXml),
        },
      ]
    );

    expect(markdown).toContain('# The Nag Hammadi Library in English');
    expect(markdown).toContain('- **Author:** James M. Robinson');
    expect(markdown).toContain('- **Internet Archive Identifier:** [naghammadilibrar00jame](https://archive.org/details/naghammadilibrar00jame)');
    expect(markdown).toContain('## Page 480');
    expect(markdown).toContain('462 THE NAG HAMMADI LIBRARY IN ENGLISH');
  });
});
