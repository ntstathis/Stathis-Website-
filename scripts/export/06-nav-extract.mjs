// 06-nav-extract.mjs — dump the mega-menu items (type, href, title, image) for both languages.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
for (const [label, f] of [
  ['GR', 'export/html/index.html'],
  ['EN', 'export/html/en/home/index.html'],
]) {
  console.log(`=== ${label} ===`);
  const h = await readFile(path.join(ROOT, f), 'utf8');
  const re = /<a[^>]*class="[^"]*(product|service)_mega_menu_item[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(h))) {
    const block = m[0];
    const href = (block.match(/href="([^"]+)"/) || [])[1];
    const img = (block.match(/data-src="([^"]+)"/) || block.match(/src="(https[^"]+)"/) || [])[1];
    const title = (block.match(/<div class="title">\s*(?:<span>)?\s*([^<]+)/) || [])[1];
    console.log([m[1], href, (title || '').trim(), img].join(' | '));
  }
}
