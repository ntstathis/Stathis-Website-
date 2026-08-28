// check-meta.mjs — SEO meta parity: compares <title>, meta description and
// canonical of every built page against the old site's crawled HTML.
// Differences must be allowlisted in parity/meta-diffs.txt (one path per line,
// # comments) — everything else fails.
//
// Usage: node scripts/check-meta.mjs   (after astro build)

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OLD = path.join(ROOT, 'export/html');

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
};
const meta = (html) => ({
  title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
  description: pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
    ?? pick(html, /<meta[^>]+content="([^"]*)"[^>]+name="description"/i),
  canonical: pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i)
    ?? pick(html, /<link[^>]+href="([^"]*)"[^>]+rel="canonical"/i),
});
const decode = (s) =>
  s == null
    ? s
    : s
        .replace(/&#8211;|&ndash;/g, '–')
        .replace(/&#8217;/g, '’')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;|&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

async function lines(rel) {
  const f = path.join(ROOT, rel);
  if (!existsSync(f)) return [];
  return (await readFile(f, 'utf8')).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}
const allow = new Set(await lines('parity/meta-diffs.txt'));
const dropped = new Set(
  (await lines('parity/dropped-urls.txt')).map((u) => new URL(u).pathname.replace(/^\/|\/$/g, '')),
);
const expected = (await lines('parity/expected-urls.txt')).map((u) =>
  new URL(u).pathname.replace(/^\/|\/$/g, ''),
);

let fails = 0, checked = 0, allowed = 0;
for (const p of expected) {
  if (dropped.has(p)) continue;
  const oldFile = path.join(OLD, p, 'index.html');
  const newFile = path.join(DIST, p, 'index.html');
  if (!existsSync(oldFile) || !existsSync(newFile)) continue; // URL parity is check-parity's job
  const o = meta(await readFile(oldFile, 'utf8'));
  const n = meta(await readFile(newFile, 'utf8'));
  checked++;
  const diffs = [];
  if (decode(o.title) !== decode(n.title)) diffs.push(`title: "${o.title}" -> "${n.title}"`);
  if (decode(o.description ?? '') !== decode(n.description ?? ''))
    diffs.push(`description: "${o.description}" -> "${n.description}"`);
  if ((o.canonical ?? '').replace(/\/$/, '') !== (n.canonical ?? '').replace(/\/$/, ''))
    diffs.push(`canonical: "${o.canonical}" -> "${n.canonical}"`);
  if (diffs.length) {
    if (allow.has(p) || allow.has('/' + p + '/')) { allowed++; continue; }
    fails++;
    console.error(`DIFF /${p}/`);
    for (const d of diffs) console.error('   ' + d);
  }
}
console.log(`meta parity: ${checked} pages compared, ${allowed} allowlisted diffs, ${fails} failures`);
process.exit(fails ? 1 : 0);
