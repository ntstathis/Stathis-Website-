// 05-css-extract.mjs — pull the rules that matter out of the minified theme
// bundle (app.bundle.css), grouped by media query, filtered by selector pattern.
// Output: export/skeletons/theme-css.txt (reference for writing the clean theme).
//
// Usage: node scripts/export/05-css-extract.mjs [extra-pattern]

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const css = await readFile(
  path.join(ROOT, 'export/css/wp-content__themes__StathisTheme__public__app.bundle.css'),
  'utf8',
);

// selectors worth keeping for the rebuild
const PATTERNS = [
  /(^|[\s,.#:>~+])(html|body)\b/,
  /logo|navigation|navlinks|menu|mega|toggle|languages|caret/,
  /menu_cta|cta/,
  /footer/,
  /black_box|bgs|hero|swiper|spacer|title|subtitle/,
  /ff-|fs-|fw-|radius|overflow-hidden|text-white|bg-black|bg-grey|text-grey/,
  /container|the_col|the_row|row|col-md|col-lg|col-\d/,
  /btn|button|arrow|slide/,
  /h1|h2|h3|h4|\bp\b|\ba\b|ul|li/,
  /form|input|textarea|label|submit/,
  /product|service|news|client|pistopoi|certif|card|item_wrapper|img_wrapper|nb_aspect/,
  /flexiblePage|section|content_in|four_|home_/,
];
const extra = process.argv[2] ? new RegExp(process.argv[2]) : null;

// split top-level rules incl. @media groups
function splitRules(text) {
  const rules = [];
  let depth = 0, start = 0, media = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) {
        const sel = text.slice(start, i).trim();
        if (sel.startsWith('@media')) {
          media = sel;
          start = i + 1;
          depth = 0;
          // recurse into media block manually
          let d = 1, j = i + 1;
          for (; j < text.length && d > 0; j++) {
            if (text[j] === '{') d++;
            else if (text[j] === '}') d--;
          }
          for (const r of splitRules(text.slice(i + 1, j - 1))) rules.push({ ...r, media });
          i = j - 1;
          start = j;
          media = '';
          continue;
        }
        rules.push({ sel, media: '', bodyStart: i + 1 });
        depth = 1;
      } else depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && rules.length && rules.at(-1).bodyStart != null) {
        rules.at(-1).body = text.slice(rules.at(-1).bodyStart, i).trim();
        delete rules.at(-1).bodyStart;
        start = i + 1;
      }
    }
  }
  return rules.filter((r) => r.body);
}

const rules = splitRules(css);
const keep = rules.filter(
  (r) => PATTERNS.some((p) => p.test(r.sel)) || (extra && extra.test(r.sel)),
);
const byMedia = new Map();
for (const r of keep) {
  const key = r.media || '(base)';
  if (!byMedia.has(key)) byMedia.set(key, []);
  byMedia.get(key).push(`${r.sel} { ${r.body} }`);
}
const out = [];
for (const [media, list] of byMedia) {
  out.push(`\n/* ============ ${media} — ${list.length} rules ============ */`);
  out.push(...list);
}
await writeFile(path.join(ROOT, 'export/skeletons/theme-css.txt'), out.join('\n'), 'utf8');
console.log(`total rules: ${rules.length}; kept: ${keep.length}; media groups: ${byMedia.size}`);
