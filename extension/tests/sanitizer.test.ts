import { describe, expect, it } from 'bun:test';
import { sanitizeFilename, formatSubdir, formatPageFilename } from '../src/utils/sanitizer';

describe('Sanitizer utilities', () => {
  it('should clean illegal filesystem characters', () => {
    expect(sanitizeFilename('The Nag Hammadi Library: Volume 1? *yes* <no>|cool/test\\one')).toBe(
      'The Nag Hammadi Library_ Volume 1_ _yes_ _no__cool_test_one'
    );
  });

  it('should format subdirectories with templates', () => {
    const dir1 = formatSubdir('ArchiveBooks', '{title}', 'Nag Hammadi Library', 'naghammadilibrar00jame');
    expect(dir1).toBe('ArchiveBooks/Nag Hammadi Library');

    const dir2 = formatSubdir('Books', '{title}_{id}', 'Nag Hammadi Library', 'naghammadilibrar00jame');
    expect(dir2).toBe('Books/Nag Hammadi Library_naghammadilibrar00jame');
  });

  it('should format zero-padded page filenames', () => {
    expect(formatPageFilename(1, 515)).toBe('page_001.jpg');
    expect(formatPageFilename(42, 515)).toBe('page_042.jpg');
    expect(formatPageFilename(515, 515)).toBe('page_515.jpg');
  });
});
