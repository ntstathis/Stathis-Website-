import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Shared schema for all migrated WordPress content.
// `path` is the FULL URL path without leading/trailing slash, stored verbatim
// from the old site ('proionta/kit-monwsis', 'en/insulation-kit',
// 'refrigerated-container-koala-80'). Never derive it — old URLs are irregular
// and must survive exactly (SEO).
// `translationKey` pairs the GR and EN twin of a page (from Polylang's
// translations map). Absent = the page has no twin in the other language.
const base = z.object({
  lang: z.enum(['el', 'en']),
  path: z.string().regex(/^[^/].*[^/]$|^[^/]+$/, 'path must not have leading/trailing slashes'),
  translationKey: z.string().optional(),
  title: z.string(),
  seo: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    noindex: z.boolean().default(false),
  }),
  wpId: z.number().optional(),
  images: z
    .array(z.object({ src: z.string(), alt: z.string().default('') }))
    .optional(),
});

const collection = (name: string, extra?: z.ZodRawShape) =>
  defineCollection({
    loader: glob({ pattern: '**/*.md', base: `./src/content/${name}` }),
    schema: extra ? base.extend(extra) : base,
  });

export const collections = {
  // 25 Koala refrigerated-container catalog entries × 2 languages
  koala: collection('koala'),
  // ready-to-deliver vehicle listings (Sprinter pick-ups), listed on
  // /ochimata-mercedes-benz-sprinter-pick-up/
  vehicles: collection('vehicles'),
  // product pages (kit monwsis, psyktika mixanimata, sortimo, …)
  products: collection('products'),
  // real news posts, listed on /news/ (paginated) and /feed/
  news: collection('news', {
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
  // remaining prose pages (etaireia, privacy, terms, micro-landing pages, …)
  pages: collection('pages'),
};
