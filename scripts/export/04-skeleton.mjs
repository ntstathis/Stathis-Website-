// 04-skeleton.mjs — reduce a crawled HTML page to a compact structural skeleton
// (tags + classes + hrefs/srcs + short text), so templates can be rebuilt without
// wading through Elementor's full markup. Collapses runs of similar siblings.
//
// Usage: node scripts/export/04-skeleton.mjs <path-under-export/html> [maxDepth]
//   e.g. node scripts/export/04-skeleton.mjs index.html
//        node scripts/export/04-skeleton.mjs proionta/kit-monwsis/index.html 14

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const rel = process.argv[2] ?? 'index.html';
const MAX_DEPTH = Number(process.argv[3] ?? 24);
const html = await readFile(path.join(ROOT, 'export/html', rel), 'utf8');

// --- tiny forgiving HTML parser (no deps) ---
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'iframe']);

function parse(html) {
  const root = { tag: '#root', children: [], attrs: {} };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g;
  let skipUntil = null;
  for (const m of html.matchAll(re)) {
    const tok = m[0];
    if (tok.startsWith('<!--')) continue;
    if (skipUntil) {
      if (tok.toLowerCase().startsWith(`</${skipUntil}`)) skipUntil = null;
      continue;
    }
    if (tok[0] === '<') {
      if (tok[1] === '/') {
        const tag = tok.slice(2, -1).trim().toLowerCase().split(/[\s/]/)[0];
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === tag) { stack.length = i; break; }
        }
      } else {
        const tagMatch = tok.match(/^<([a-zA-Z0-9-]+)/);
        if (!tagMatch) continue;
        const tag = tagMatch[1].toLowerCase();
        if (SKIP.has(tag)) { if (!tok.endsWith('/>')) skipUntil = tag; continue; }
        const attrs = {};
        for (const a of tok.matchAll(/([a-zA-Z-]+)=("[^"]*"|'[^']*')/g)) {
          attrs[a[1].toLowerCase()] = a[2].slice(1, -1);
        }
        const node = { tag, attrs, children: [] };
        stack.at(-1).children.push(node);
        if (!VOID.has(tag) && !tok.endsWith('/>')) stack.push(node);
      }
    } else {
      const text = tok.replace(/\s+/g, ' ').trim();
      if (text) stack.at(-1).children.push({ tag: '#text', text, children: [] });
    }
  }
  return root;
}

// --- skeleton printer ---
const IMPORTANT_ATTR = ['href', 'src', 'alt', 'placeholder', 'type', 'name', 'action', 'id'];
function sig(n) {
  if (n.tag === '#text') return 't';
  const cls = (n.attrs.class ?? '').split(/\s+/).filter((c) => !/^\d|elementor-element-[a-f0-9]/.test(c)).slice(0, 3).join('.');
  return `${n.tag}.${cls}(${n.children.length})`;
}
function line(n, depth) {
  if (n.tag === '#text') return `${'  '.repeat(depth)}"${n.text.slice(0, 90)}"`;
  const cls = (n.attrs.class ?? '')
    .split(/\s+/)
    .filter((c) => c && !/^elementor-element-[a-f0-9]|^e-con-|^wp-|^has-/.test(c))
    .slice(0, 6);
  const attrs = IMPORTANT_ATTR.filter((a) => n.attrs[a] != null)
    .map((a) => ` ${a}="${n.attrs[a].slice(0, 80)}"`)
    .join('');
  return `${'  '.repeat(depth)}<${n.tag}${cls.length ? ' .' + cls.join('.') : ''}${attrs}>`;
}
const out = [];
function walk(n, depth) {
  if (depth > MAX_DEPTH) { out.push('  '.repeat(depth) + '…'); return; }
  let i = 0;
  while (i < n.children.length) {
    const child = n.children[i];
    // collapse runs of same-signature siblings
    let run = 1;
    while (i + run < n.children.length && sig(n.children[i + run]) === sig(child) && child.tag !== '#text') run++;
    out.push(line(child, depth));
    walk(child, depth + 1);
    if (run > 2) {
      out.push('  '.repeat(depth) + `… ×${run - 1} more like previous <${child.tag}> sibling`);
      i += run;
    } else i++;
  }
}
const tree = parse(html);
// body only
const htmlNode = tree.children.find((c) => c.tag === 'html') ?? tree;
const body = htmlNode.children.find((c) => c.tag === 'body') ?? htmlNode;
walk(body, 0);
console.log(out.join('\n'));
