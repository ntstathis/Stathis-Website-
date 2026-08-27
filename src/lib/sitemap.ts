// Builds the sitemap URL set: every indexable page with its GR↔EN hreflang
// alternates. Served identically at /sitemap.xml and /sitemap_index.xml
// (Google has the old Yoast /sitemap_index.xml memorized).
import { getCollection } from 'astro:content';
import { routePairs, toUrl } from './i18n';

const SITE = 'https://stathis.com.gr';

interface Entry {
  loc: string;
  alternates?: { el: string; en: string };
}

export async function buildSitemapEntries(): Promise<Entry[]> {
  const abs = (p: string) => SITE + toUrl(p)!;
  const out: Entry[] = [];
  const seen = new Set<string>();
  const push = (e: Entry) => {
    if (!seen.has(e.loc)) {
      seen.add(e.loc);
      out.push(e);
    }
  };

  // bespoke pages (skip noindex thank-you pages — they are not in routePairs' indexable set)
  const noindexBespoke = new Set(['efcharistoume']);
  for (const [el, en] of Object.entries(routePairs)) {
    if (noindexBespoke.has(el)) continue;
    if (en) {
      const alternates = { el: abs(el), en: abs(en) };
      push({ loc: abs(el), alternates });
      push({ loc: abs(en), alternates });
    } else {
      push({ loc: abs(el) });
    }
  }

  for (const name of ['koala', 'vehicles', 'products', 'news', 'pages'] as const) {
    const entries = await getCollection(name);
    const byKeyLang = new Map<string, string>();
    for (const e of entries) {
      if (e.data.translationKey) byKeyLang.set(`${e.data.translationKey}:${e.data.lang}`, e.data.path);
    }
    for (const e of entries) {
      if (e.data.seo.noindex) continue;
      const twin = e.data.translationKey
        ? byKeyLang.get(`${e.data.translationKey}:${e.data.lang === 'el' ? 'en' : 'el'}`)
        : undefined;
      if (twin != null) {
        const el = e.data.lang === 'el' ? e.data.path : twin;
        const en = e.data.lang === 'en' ? e.data.path : twin;
        push({ loc: abs(e.data.path), alternates: { el: abs(el), en: abs(en) } });
      } else {
        push({ loc: abs(e.data.path) });
      }
    }
  }
  return out.sort((a, b) => a.loc.localeCompare(b.loc));
}

export async function sitemapXml(): Promise<string> {
  const entries = await buildSitemapEntries();
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const body = entries
    .map((e) => {
      const alt = e.alternates
        ? `\n    <xhtml:link rel="alternate" hreflang="el" href="${esc(e.alternates.el)}"/>` +
          `\n    <xhtml:link rel="alternate" hreflang="en" href="${esc(e.alternates.en)}"/>` +
          `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(e.alternates.el)}"/>`
        : '';
      return `  <url>\n    <loc>${esc(e.loc)}</loc>${alt}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;
}
