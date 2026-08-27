// 02-media.mjs — download every media file the kept pages actually reference.
// Scans export/raw JSON + export/html for /wp-content/ URLs, resolves size-suffixed
// variants (-300x200.jpg) to originals, downloads originals into export/media/
// mirroring the uploads path, and writes export/media-manifest.csv with alt text.
// Also pulls the theme's fonts.css and the woff2 files it references.
//
// Run after 01-export-wp.mjs. Idempotent: existing files are skipped.

import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = 'https://stathis.com.gr';
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const UA = 'stathis-website-migration/1.0 (site owner content export)';
const DELAY_MS = 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

// ---------- 1. Collect referenced /wp-content/ URLs ----------
const URL_RE = /https?:\/\/(?:www\.)?stathis\.com\.gr\/wp-content\/[^\s"'()<>\\,]+?\.(?:jpe?g|png|webp|gif|svg|ico|pdf|woff2?|ttf|eot|css|mp4)/gi;

const refs = new Map(); // normalized original URL -> {count, viaSized:Set}
function noteUrl(raw) {
  let u = raw.replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/#038;/g, '');
  u = u.replace(/^http:\/\//, 'https://').replace('://www.', '://');
  // strip WP thumbnail suffix to get the original
  const orig = u.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp|gif))$/i, '$1');
  const entry = refs.get(orig) ?? { count: 0, viaSized: new Set() };
  entry.count++;
  if (orig !== u) entry.viaSized.add(u);
  refs.set(orig, entry);
}

async function scanTree(rel) {
  const dir = path.join(ROOT, rel);
  if (!existsSync(dir)) return;
  let files = 0;
  for await (const file of walk(dir)) {
    if (!/\.(json|html|txt|css)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    // unescape JSON-escaped URLs (Elementor data-settings) before matching
    for (const m of text.replace(/\\\//g, '/').matchAll(URL_RE)) noteUrl(m[0]);
    files++;
  }
  console.log(`scanned ${files} files under ${rel}`);
}

await scanTree('export/raw');
await scanTree('export/html');
await scanTree('export/css');
console.log(`unique original media URLs referenced: ${refs.size}`);

// ---------- 2. Alt text from media-index ----------
let altByUrl = new Map();
const mediaIndexFile = path.join(ROOT, 'export/raw/media-index.json');
if (existsSync(mediaIndexFile)) {
  const idx = JSON.parse(await readFile(mediaIndexFile, 'utf8'));
  for (const m of idx) {
    if (m.source_url) altByUrl.set(m.source_url.replace('://www.', '://'), m.alt_text ?? '');
  }
}

// ---------- 3. Download originals (fall back to a sized variant if original 404s) ----------
async function download(url) {
  const rel = new URL(url).pathname.replace(/^\/wp-content\//, '');
  const dest = path.join(ROOT, 'export/media', rel);
  if (existsSync(dest) && (await stat(dest)).size > 0) return { status: 'cached', dest };
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return { status: res.status, dest: null };
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return { status: 200, dest };
}

const manifest = ['url,local,status,refs,alt'];
let ok = 0, failed = 0, cached = 0, i = 0;
for (const [url, info] of [...refs.entries()].sort()) {
  let { status, dest } = await download(url);
  if (typeof status === 'number' && status !== 200 && info.viaSized.size) {
    // original missing — take the largest referenced sized variant instead
    const alt = [...info.viaSized].sort().at(-1);
    ({ status, dest } = await download(alt));
  }
  if (status === 'cached') cached++;
  else if (status === 200) ok++;
  else failed++;
  const csv = (s) => `"${String(s ?? '').replaceAll('"', '""')}"`;
  manifest.push(
    [csv(url), csv(dest ? path.relative(ROOT, dest) : ''), status, info.count, csv(altByUrl.get(url) ?? '')].join(','),
  );
  if (++i % 25 === 0) console.log(`  ${i}/${refs.size} (ok ${ok}, cached ${cached}, failed ${failed})`);
  if (status !== 'cached') await sleep(DELAY_MS);
}
await writeFile(path.join(ROOT, 'export/media-manifest.csv'), manifest.join('\n') + '\n', 'utf8');
console.log(`downloaded ${ok}, cached ${cached}, failed ${failed} -> export/media-manifest.csv`);

// ---------- 4. Theme fonts ----------
console.log('== Theme fonts ==');
const fontsCssUrl = `${BASE}/wp-content/themes/StathisTheme/assets/fonts/fonts.css`;
const res = await fetch(fontsCssUrl, { headers: { 'User-Agent': UA } });
if (res.ok) {
  const css = await res.text();
  await mkdir(path.join(ROOT, 'export/fonts'), { recursive: true });
  await writeFile(path.join(ROOT, 'export/fonts/fonts.css'), css, 'utf8');
  const fontRefs = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
  for (const ref of fontRefs) {
    const abs = new URL(ref, fontsCssUrl).href;
    const name = path.basename(new URL(abs).pathname);
    const fres = await fetch(abs, { headers: { 'User-Agent': UA } });
    if (fres.ok) await writeFile(path.join(ROOT, 'export/fonts', name), Buffer.from(await fres.arrayBuffer()));
    console.log(`  ${name}: ${fres.status}`);
    await sleep(DELAY_MS);
  }
} else {
  console.warn(`  fonts.css: HTTP ${res.status} — locate fonts manually from export/css`);
}
console.log('Done.');
