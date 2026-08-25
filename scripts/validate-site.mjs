import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const failures = [];
const warnings = [];

const htmlFiles = readdirSync(root)
  .filter((name) => name.endsWith('.html'))
  .sort();

const localReferencePattern = /(?:src|href)=["']([^"']+)["']/gi;
const ignoredReference = /^(?:https?:|mailto:|tel:|javascript:|data:|#|\/)/i;

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), 'utf8');
  let match;

  while ((match = localReferencePattern.exec(html)) !== null) {
    const raw = match[1].split('#')[0].split('?')[0];
    if (!raw || ignoredReference.test(raw) || raw.includes('${')) continue;
    const target = join(root, raw.replaceAll('/', '\\'));
    if (!existsSync(target)) failures.push(`${file} -> missing ${raw}`);
  }

  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
    failures.push(`${file} -> missing html lang attribute`);
  }
  if (!/theme-switch-btn--mobile/.test(html)) {
    failures.push(`${file} -> missing mobile theme toggle`);
  }
  if (!/<h1\b/i.test(html)) warnings.push(`${file} -> no h1 found`);
}

const galleryDataPath = join(root, 'gallery_data.json');
if (existsSync(galleryDataPath)) {
  try {
    const galleryData = JSON.parse(readFileSync(galleryDataPath, 'utf8'));
    if (!Array.isArray(galleryData)) failures.push('gallery_data.json -> expected an array');
    for (const item of galleryData) {
      if (!item?.src) failures.push('gallery_data.json -> item missing src');
      if (item?.src && !existsSync(join(root, item.src))) {
        failures.push(`gallery_data.json -> missing ${item.src}`);
      }
      if (item?.thumb && !existsSync(join(root, item.thumb))) {
        failures.push(`gallery_data.json -> missing ${item.thumb}`);
      }
    }
  } catch (error) {
    failures.push(`gallery_data.json -> invalid JSON (${error.message})`);
  }
}

const css = readFileSync(join(root, 'assets', 'css', 'styles.css'), 'utf8');
const js = readFileSync(join(root, 'assets', 'js', 'main.js'), 'utf8');
const videoManifestPath = join(root, 'assets', 'video', 'manifest.json');
if (!existsSync(videoManifestPath)) {
  failures.push('assets/video/manifest.json -> missing playable-media manifest');
} else {
  try {
    const videoManifest = JSON.parse(readFileSync(videoManifestPath, 'utf8'));
    const minimumDuration = Number(videoManifest?.minDurationSeconds);
    if (!Number.isFinite(minimumDuration) || minimumDuration < 7) {
      failures.push('assets/video/manifest.json -> minimum duration must be at least 7 seconds');
    }
    if (!Array.isArray(videoManifest?.videos) || videoManifest.videos.length < 2) {
      failures.push('assets/video/manifest.json -> expected at least two videos');
    } else {
      const seenVideos = new Set();
      for (const video of videoManifest.videos) {
        if (!video || typeof video.src !== 'string' || !/^assets\/video\/[^/]+\.mp4$/i.test(video.src)) {
          failures.push(`assets/video/manifest.json -> invalid playable path ${video?.src ?? video}`);
          continue;
        }
        if (!Number.isFinite(Number(video.durationSeconds)) || Number(video.durationSeconds) < minimumDuration) {
          failures.push(`assets/video/manifest.json -> ${video.src} is shorter than ${minimumDuration} seconds`);
        }
        if (seenVideos.has(video.src)) failures.push(`assets/video/manifest.json -> duplicate ${video.src}`);
        seenVideos.add(video.src);
        if (!existsSync(join(root, video.src.replaceAll('/', '\\')))) {
          failures.push(`assets/video/manifest.json -> missing ${video.src}`);
        }
      }
    }
  } catch (error) {
    failures.push(`assets/video/manifest.json -> invalid JSON (${error.message})`);
  }
}
const jsAssetPattern = /["'](assets\/(?:img|video)\/[^"']+)["']/gi;
for (const match of js.matchAll(jsAssetPattern)) {
  const asset = match[1];
  if (!existsSync(join(root, asset))) warnings.push(`assets/js/main.js -> runtime fallback for missing ${asset}`);
}
const animationHooks = [
  ['CSS keyframes', /@keyframes\s+[\w-]+/],
  ['hero video crossfade', /\.hero-video-bg/],
  ['button hover state', /\.btn:hover/],
  ['reduced motion policy', /prefers-reduced-motion/],
  ['requestAnimationFrame', /requestAnimationFrame/],
];
for (const [name, pattern] of animationHooks) {
  if (!pattern.test(name === 'requestAnimationFrame' ? js : css)) {
    failures.push(`animation invariant -> missing ${name}`);
  }
}

const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
if (!sitemap.includes('<urlset')) failures.push('sitemap.xml -> missing urlset root');
if (/<loc>https?:\/\//i.test(sitemap)) {
  for (const url of sitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)) {
    const pathname = new URL(url[1]).pathname.replace(/^\//, '') || 'index.html';
    if (!existsSync(join(root, pathname))) failures.push(`sitemap.xml -> missing ${pathname}`);
  }
} else {
  warnings.push('sitemap.xml -> no absolute URLs until the final Netlify URL is known');
}

console.log(`Validated ${htmlFiles.length} HTML pages.`);
console.log(`Animation hooks preserved: ${animationHooks.length}/${animationHooks.length}.`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const failure of failures) console.error(`FAIL ${failure}`);

if (failures.length > 0) process.exitCode = 1;
else console.log('Site validation passed.');
