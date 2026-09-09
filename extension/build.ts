/**
 * Fast build script for Archive Downloader Chrome Extension using Bun's native bundler
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';

const isWatch = process.argv.includes('--watch');
const rootDir = import.meta.dir;
const distDir = join(rootDir, 'dist');
const popupDistDir = join(distDir, 'popup');
const iconsDistDir = join(distDir, 'icons');

async function buildAll() {
  console.log('[Build] Building Archive Downloader Extension...');

  // Ensure output directories exist
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
  if (!existsSync(popupDistDir)) mkdirSync(popupDistDir, { recursive: true });
  if (!existsSync(iconsDistDir)) mkdirSync(iconsDistDir, { recursive: true });

  // 1. Bundle Content Script (Isolated world)
  const contentResult = await Bun.build({
    entrypoints: [join(rootDir, 'src/content/index.ts')],
    outdir: distDir,
    naming: 'content.js',
    target: 'browser',
    minify: false,
    sourcemap: 'inline',
  });

  if (!contentResult.success) {
    console.error('[Build Error] Content Script:', contentResult.logs);
    return false;
  }

  // 2. Bundle MAIN World Bridge Script
  const bridgeResult = await Bun.build({
    entrypoints: [join(rootDir, 'src/content/bridge.ts')],
    outdir: distDir,
    naming: 'bridge.js',
    target: 'browser',
    minify: false,
    sourcemap: 'inline',
  });

  if (!bridgeResult.success) {
    console.error('[Build Error] Bridge Script:', bridgeResult.logs);
    return false;
  }

  // 3. Bundle Background Service Worker
  const bgResult = await Bun.build({
    entrypoints: [join(rootDir, 'src/background/service-worker.ts')],
    outdir: distDir,
    naming: 'background.js',
    target: 'browser',
    minify: false,
    sourcemap: 'inline',
  });

  if (!bgResult.success) {
    console.error('[Build Error] Background Script:', bgResult.logs);
    return false;
  }

  // 4. Bundle Popup Script
  const popupResult = await Bun.build({
    entrypoints: [join(rootDir, 'src/popup/popup.ts')],
    outdir: popupDistDir,
    naming: 'popup.js',
    target: 'browser',
    minify: false,
    sourcemap: 'inline',
  });

  if (!popupResult.success) {
    console.error('[Build Error] Popup Script:', popupResult.logs);
    return false;
  }

  // 5. Copy static assets
  copyFileSync(join(rootDir, 'manifest.json'), join(distDir, 'manifest.json'));
  copyFileSync(join(rootDir, 'src/popup/popup.html'), join(popupDistDir, 'popup.html'));
  copyFileSync(join(rootDir, 'src/popup/popup.css'), join(popupDistDir, 'popup.css'));

  // Copy icons
  const iconsSourceDir = join(rootDir, 'icons');
  if (existsSync(iconsSourceDir)) {
    const icons = readdirSync(iconsSourceDir);
    for (const icon of icons) {
      if (icon.endsWith('.png')) {
        copyFileSync(join(iconsSourceDir, icon), join(iconsDistDir, icon));
      }
    }
  }

  console.log('[Build] Extension successfully built to dist/');
  return true;
}

buildAll();

if (isWatch) {
  console.log('[Build] Watching for changes in src/ and manifest.json...');
  import('fs').then(({ watch }) => {
    watch(join(rootDir, 'src'), { recursive: true }, () => {
      console.log('[Build] File change detected in src/ -> Rebuilding...');
      buildAll();
    });
    watch(join(rootDir, 'manifest.json'), () => {
      console.log('[Build] File change detected in manifest.json -> Rebuilding...');
      buildAll();
    });
  });
}
