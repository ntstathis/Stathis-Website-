// 01-export-wp.mjs — pull everything we need out of the live WordPress site.
// Read-only against stathis.com.gr. Idempotent: re-run to refresh.
//
// Produces:
//   parity/sitemaps/*.xml        raw snapshots of all Yoast sitemaps
//   parity/expected-urls.txt     every URL Google knows about (unfiltered)
//   export/raw/pages/{id}.json   REST export incl. Polylang lang/translations + Yoast meta
//   export/raw/posts/{id}.json
//   export/raw/pages-index.json  quick lookup: id, slug, link, lang, translations, title
//   export/raw/posts-index.json
//   export/raw/media-index.json  media library metadata (source_url, alt_text) — no binaries
//   export/html/<path>/index.html  live rendered HTML of every URL (Elementor truth source)
//   export/html/crawl-log.csv
//   export/css/*.css             stylesheets linked from the home page (design-token reference)

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = 'https://stathis.com.gr';
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const UA = 'stathis-website-migration/1.0 (site owner content export)';
const DELAY_MS = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'text') {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual' });
      return { res, body: as === 'skip' ? null : await res[as === 'json' ? 'json' : 'text']() };
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(1000 * attempt);
    }
  }
}

async function save(rel, content) {
  const file = path.join(ROOT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
}

function urlToHtmlPath(u) {
  const p = new URL(u).pathname.replace(/\/$/, '');
  return p === '' ? 'export/html/index.html' : `export/html${p}/index.html`;
}

// ---------- 1. Sitemaps ----------
async function exportSitemaps() {
  console.log('== Sitemaps ==');
  const { body: indexXml } = await get(`${BASE}/sitemap_index.xml`);
  await save('parity/sitemaps/sitemap_index.xml', indexXml);
  const childUrls = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const allUrls = new Set();
  for (const child of childUrls) {
    const { body } = await get(child);
    const name = new URL(child).pathname.replace(/^\//, '');
    await save(`parity/sitemaps/${name}`, body);
    for (const m of body.matchAll(/<loc>([^<]+)<\/loc>/g)) allUrls.add(m[1]);
    console.log(`  ${name}: ${[...body.matchAll(/<loc>/g)].length} URLs`);
    await sleep(DELAY_MS);
  }
  const sorted = [...allUrls].sort();
  await save('parity/expected-urls.txt', sorted.join('\n') + '\n');
  console.log(`  total unique URLs: ${sorted.length}`);
  return sorted;
}

// ---------- 2. REST content ----------
const FIELDS =
  'id,slug,link,parent,status,type,lang,translations,title,content,excerpt,date,modified,categories,tags,featured_media,yoast_head_json';

async function exportRest(type) {
  console.log(`== REST ${type} ==`);
  const items = [];
  for (let page = 1; ; page++) {
    const url = `${BASE}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_fields=${FIELDS}`;
    const { res, body } = await get(url, 'json');
    if (!res.ok) throw new Error(`${type} page ${page}: HTTP ${res.status}`);
    items.push(...body);
    const totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
    console.log(`  page ${page}/${totalPages}: ${body.length} items`);
    if (page >= totalPages) break;
    await sleep(DELAY_MS);
  }
  for (const item of items) {
    await save(`export/raw/${type}/${item.id}.json`, JSON.stringify(item, null, 2));
  }
  const index = items.map((i) => ({
    id: i.id,
    slug: i.slug,
    link: i.link,
    lang: i.lang ?? null,
    translations: i.translations ?? null,
    status: i.status,
    title: i.title?.rendered ?? '',
  }));
  await save(`export/raw/${type}-index.json`, JSON.stringify(index, null, 2));
  const withLang = index.filter((i) => i.lang).length;
  console.log(`  ${items.length} items; ${withLang} carry Polylang lang/translations`);
  if (withLang === 0)
    console.warn(`  !! Polylang fields missing on ${type} — pairing will need a fallback strategy`);
  return items;
}

// ---------- 3. Media metadata (no binaries) ----------
async function exportMediaIndex() {
  console.log('== Media index ==');
  const items = [];
  for (let page = 1; ; page++) {
    const url = `${BASE}/wp-json/wp/v2/media?per_page=100&page=${page}&_fields=id,source_url,alt_text,title,mime_type,media_details.width,media_details.height`;
    const { res, body } = await get(url, 'json');
    if (!res.ok) throw new Error(`media page ${page}: HTTP ${res.status}`);
    items.push(...body);
    const totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) break;
    await sleep(DELAY_MS);
  }
  await save('export/raw/media-index.json', JSON.stringify(items, null, 2));
  console.log(`  ${items.length} media items indexed`);
}

// ---------- 4. Live HTML crawl ----------
async function crawlHtml(urls) {
  console.log('== HTML crawl ==');
  const log = ['url,status,saved'];
  // Extra URLs not in sitemaps that we need to observe:
  const extra = [`${BASE}/en/`, `${BASE}/news/page/2/`, `${BASE}/feed/`];
  const targets = [...new Set([...urls, ...extra])];
  let done = 0;
  for (const u of targets) {
    const { res, body } = await get(u);
    let saved = '';
    if (res.status === 200 && (res.headers.get('content-type') || '').includes('html')) {
      saved = urlToHtmlPath(u);
      await save(saved, body);
    } else if (res.status === 200) {
      // non-HTML 200 (e.g. /feed/ RSS) — save raw next to html tree
      saved = urlToHtmlPath(u).replace(/index\.html$/, 'raw.txt');
      await save(saved, body);
    }
    log.push(`${u},${res.status},${saved}`);
    done++;
    if (done % 20 === 0) console.log(`  ${done}/${targets.length}`);
    await sleep(DELAY_MS);
  }
  await save('export/html/crawl-log.csv', log.join('\n') + '\n');
  const non200 = log.filter((l) => !l.includes(',200,')).length - 1;
  console.log(`  crawled ${done}; non-200 responses: ${non200} (see crawl-log.csv)`);
}

// ---------- 5. Stylesheets referenced by the home page ----------
async function exportCss() {
  console.log('== CSS reference ==');
  const homeFile = path.join(ROOT, 'export/html/index.html');
  if (!existsSync(homeFile)) return console.warn('  home HTML missing, skip');
  const html = await readFile(homeFile, 'utf8');
  const hrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((h) => h.startsWith(BASE) || h.startsWith('/'));
  for (const href of hrefs) {
    const abs = href.startsWith('/') ? BASE + href : href;
    const { res, body } = await get(abs);
    if (res.status !== 200) continue;
    const name = new URL(abs).pathname.split('/').filter(Boolean).join('__').replace(/[^\w.-]/g, '_');
    await save(`export/css/${name}`, body);
    await sleep(DELAY_MS);
  }
  console.log(`  saved ${hrefs.length} stylesheets`);
}

const urls = await exportSitemaps();
await exportRest('pages');
await exportRest('posts');
await exportMediaIndex();
await crawlHtml(urls);
await exportCss();
console.log('\nDone. Next: node scripts/export/02-media.mjs');
