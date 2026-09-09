import { BookProvider } from './types';
import { ArchiveProvider } from './archive-provider';
import { HathiTrustProvider } from './hathitrust-provider';

export * from './types';
export * from './archive-provider';
export * from './hathitrust-provider';

/**
 * Registry of supported book site providers.
 */
const providers: BookProvider[] = [
  new ArchiveProvider(),
  new HathiTrustProvider(),
];

/**
 * Detects and returns the active provider matching the current webpage.
 * Returns null if the current page is not a supported book viewer.
 */
export function getActiveProvider(): BookProvider | null {
  for (const provider of providers) {
    if (provider.isMatch()) {
      return provider;
    }
  }
  return null;
}
