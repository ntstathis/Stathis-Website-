// 03-analyze.mjs — digest the raw REST export into one compact inventory table
// (export/analysis.md) used to classify every entry into collections and to
// build the GR↔EN pairing. Fetches the category taxonomy (one request).

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://stathis.com.gr';
const ROOT = path.resolve(import.meta.dirname, '..', '..');

async function loadDir(rel) {
  const dir = path.join(ROOT, rel);
  const items = [];
  for (const f of await readdir(dir)) {
    if (f.endsWith('.json')) items.push(JSON.parse(await readFile(path.join(dir, f), 'utf8')));
  }
  return items;
}

// category id -> name
const catRes = await fetch(`${BASE}/wp-json/wp/v2/categories?per_page=100&_fields=id,slug,name,count`, {
  headers: { 'User-Agent': 'stathis-website-migration/1.0' },
});
const cats = await catRes.json();
const catName = new Map(cats.map((c) => [c.id, c.slug]));
await writeFile(path.join(ROOT, 'export/raw/categories.json'), JSON.stringify(cats, null, 2), 'utf8');

const pages = await loadDir('export/raw/pages');
const posts = await loadDir('export/raw/posts');

const toPath = (link) => new URL(link).pathname.replace(/^\/|\/$/g, '');

const rows = [];
for (const [kind, items] of [['page', pages], ['post', posts]]) {
  for (const i of items) {
    rows.push({
      kind,
      id: i.id,
      lang: i.lang ?? '?',
      path: toPath(i.link) || '(home)',
      title: (i.title?.rendered ?? '').replace(/\|/g, '/').slice(0, 60),
      cats: (i.categories ?? []).map((c) => catName.get(c) ?? c).join('+') || '',
      twin: i.translations ? Object.entries(i.translations).filter(([l]) => l !== i.lang).map(([l, id]) => `${l}:${id}`).join(',') : '',
      words: (i.content?.rendered ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
    });
  }
}
rows.sort((a, b) => a.kind.localeCompare(b.kind) || a.path.localeCompare(b.path));

const lines = ['| kind | id | lang | path | cats | twin | words | title |', '|---|---|---|---|---|---|---|---|'];
for (const r of rows) {
  lines.push(`| ${r.kind} | ${r.id} | ${r.lang} | ${r.path} | ${r.cats} | ${r.twin} | ${r.words} | ${r.title} |`);
}
await writeFile(path.join(ROOT, 'export/analysis.md'), lines.join('\n') + '\n', 'utf8');
console.log(`wrote export/analysis.md: ${rows.length} entries, ${cats.length} categories`);
console.log('categories:', cats.map((c) => `${c.slug}(${c.count})`).join(' '));
