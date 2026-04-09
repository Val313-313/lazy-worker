import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';

const isWatch = process.argv.includes('--watch');

// Clean dist folder
if (existsSync('dist')) {
  rmSync('dist', { recursive: true });
}
mkdirSync('dist', { recursive: true });

// Content scripts that need bundling (they use ES module imports)
const contentScripts = [
  'src/content/jobs-ch.js',
  'src/content/linkedin.js',
  'src/content/indeed.js',
  'src/content/arbeit-swiss.js',
];

// Build content scripts (bundle imports into single files)
const contentBuild = await esbuild.context({
  entryPoints: contentScripts,
  bundle: true,
  outdir: 'dist/content',
  format: 'iife', // Immediately invoked function expression - works as content script
  target: ['chrome100'],
  minify: !isWatch,
  sourcemap: isWatch,
});

// Build service worker (already self-contained, but bundle for consistency)
const swBuild = await esbuild.context({
  entryPoints: ['src/background/service-worker.js'],
  bundle: true,
  outdir: 'dist/background',
  format: 'esm', // Service workers support ES modules
  target: ['chrome100'],
  minify: !isWatch,
  sourcemap: isWatch,
});

// Build job-room.js (self-contained IIFE, just copy/minify)
const jobRoomBuild = await esbuild.context({
  entryPoints: ['src/content/job-room.js'],
  bundle: false, // No bundling needed, it's self-contained
  outdir: 'dist/content',
  format: 'iife',
  target: ['chrome100'],
  minify: !isWatch,
  sourcemap: isWatch,
});

// Initial build
await contentBuild.rebuild();
await swBuild.rebuild();
await jobRoomBuild.rebuild();

console.log('✓ JavaScript bundled');

// Copy static files
mkdirSync('dist/popup', { recursive: true });
mkdirSync('dist/assets', { recursive: true });
mkdirSync('dist/_locales', { recursive: true });

cpSync('src/popup/popup.html', 'dist/popup/popup.html');
cpSync('src/popup/popup.css', 'dist/popup/popup.css');
cpSync('src/popup/popup.js', 'dist/popup/popup.js');
cpSync('src/content/arbeit-swiss.css', 'dist/content/arbeit-swiss.css');

// Copy assets if they exist
if (existsSync('src/assets')) {
  cpSync('src/assets', 'dist/assets', { recursive: true });
}

// Copy locales
if (existsSync('_locales')) {
  cpSync('_locales', 'dist/_locales', { recursive: true });
}

console.log('✓ Static files copied');
console.log('✓ Build complete!');

if (isWatch) {
  console.log('👀 Watching for changes...');
  await Promise.all([
    contentBuild.watch(),
    swBuild.watch(),
    jobRoomBuild.watch(),
  ]);
} else {
  await contentBuild.dispose();
  await swBuild.dispose();
  await jobRoomBuild.dispose();
}
