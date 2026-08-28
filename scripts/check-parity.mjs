// check-parity.mjs — the SEO safety net. Fails the build if any URL the old
// WordPress site served (per its Yoast sitemaps) is missing from dist/, or if
// dist/ contains pages that are neither expected nor allowlisted, or if any
// internal link points at a page that does not exist.
//
// Inputs:
//   parity/expected-urls.txt   snapshot of all old-site sitemap URLs (from 01-export-wp.mjs)
//   parity/dropped-urls.txt    approved removals (junk pages, dead archives) — one URL per line, # comments
//   parity/new-urls.txt        approved additions (/en/ stub, thank-you page) — one path per line, # comments
//
// Usage: node scripts/check-parity.mjs   (after astro build)

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');

async function lines(rel) {
  const file = path.join(ROOT, rel);
  if (!existsSync(file)) return [];
  return (await readFile(file, 'utf8'))
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

const toPath = (u) => {
  const p = (u.startsWith('http') ? new URL(u).pathname : u).replace(/^\/|\/$/g, '');
  return p;
};

const expected = new Set((await lines('parity/expected-urls.txt')).map(toPath));
const dropped = new Set((await lines('parity/dropped-urls.txt')).map(toPath));
const allowedNew = new Set((await lines('parity/new-urls.txt')).map(toPath));

if (!existsSync(DIST)) {
  console.error('dist/ not found — run astro build first');
  process.exit(1);
}

// collect built pages (directories with index.html) and other build outputs
const built = new Set();
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else built.add(path.relative(DIST, p).replaceAll('\\', '/'));
  }
}
await walk(DIST);
const builtPages = new Set(
  [...built].filter((f) => f.endsWith('index.html')).map((f) => f.replace(/\/?index\.html$/, '')),
);

let failures = 0;
const fail = (msg) => (console.error('FAIL ' + msg), failures++);

// 1. every expected URL (minus approved drops) must exist
for (const p of expected) {
  if (dropped.has(p)) continue;
  // non-HTML endpoints (feed, sitemaps) are checked as files
  if (p.endsWith('.xml')) {
    if (!built.has(p)) fail(`missing endpoint: /${p}`);
  } else if (!builtPages.has(p)) {
    fail(`missing page: /${p}/  (was on the old site)`);
  }
}

// 2. no unexpected new pages
for (const p of builtPages) {
  if (!expected.has(p) && !allowedNew.has(p) && !dropped.has(p)) {
    fail(`unexpected new page: /${p}/  (add to parity/new-urls.txt if intentional)`);
  }
}

// 3. internal links must resolve
const linkRe = /(?:href|src)=["'](\/[^"'#?]*)["'#?]/g;
let checkedLinks = 0;
for (const f of built) {
  if (!f.endsWith('.html')) continue;
  // the 404 page's hidden language-switcher self-links point at /404/ by design
  if (f === '404.html') continue;
  const html = await readFile(path.join(DIST, f), 'utf8');
  for (const m of html.matchAll(linkRe)) {
    const target = decodeURI(m[1]);
    checkedLinks++;
    if (/\.(css|js|json|xml|txt|ico|svg|png|jpe?g|webp|gif|woff2?|ttf|otf|pdf|mp4|webm)$/i.test(target)) {
      if (!built.has(toPath(target))) fail(`broken asset link in /${f}: ${target}`);
    } else if (!builtPages.has(toPath(target))) {
      fail(`broken internal link in /${f}: ${target}`);
    }
  }
}

console.log(
  `parity: ${builtPages.size} pages built, ${expected.size} expected, ${dropped.size} dropped, ${checkedLinks} internal links checked`,
);
if (failures) {
  console.error(`\n${failures} parity failure(s).`);
  process.exit(1);
}
console.log('URL parity OK');
