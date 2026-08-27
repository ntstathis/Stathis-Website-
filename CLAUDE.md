# stathis.com.gr — static site

Company website of Stathis (Θεοχάρης Ντούνας & ΣΙΑ Α.Β.Ε.Ε.), migrated from
WordPress in 2026. Astro, static output, deployed to GitHub Pages by pushing
to `main`. Bilingual: Greek at root, English under `/en/`.

## Iron rules

1. **URLs are frozen.** Every page's `path` matches the old WordPress site
   verbatim. Never rename a path; never derive paths from titles. CI runs
   `scripts/check-parity.mjs` and fails the build on any missing or unexpected
   URL. Approved changes go in `parity/dropped-urls.txt` / `parity/new-urls.txt`.
2. **Trailing slashes always** (`astro.config.mjs`). Do not change
   `trailingSlash` or `build.format`.
3. **Greek content for GR pages, English for EN.** GR and EN twins are linked
   by `translationKey` in frontmatter — keep both sides in sync when editing.
4. **`sales.stathis.com.gr` is a separate app.** The configurator pages only
   iframe it. Never touch that server or its DNS.
5. **Numbers, not adjectives** (company house rule): performance claims need a
   figure, a unit and a condition.

## Layout

- `src/content/{koala,products,news,pages}/{el,en}/` — all migrated content, one
  `.md` per page; frontmatter carries `lang`, `path`, `translationKey`, `seo`.
- `src/pages/` — bespoke pages (home, contact, news listing, configurator, 404,
  sitemap endpoints) + the `[...path].astro` catch-all that renders collections.
- `src/lib/routes.ts` — GR↔EN pairs for bespoke pages (collections pair via
  `translationKey`).
- `parity/` — frozen old-site sitemap snapshots + drop/new allowlists.
- `export/` — provenance: raw WordPress REST JSON and rendered-HTML snapshots
  of the old site (media binaries are gitignored). Read-only reference.
- `scripts/export/` — the one-off WP export pipeline (kept for provenance).

## Common task: add a news post

1. Create `src/content/news/el/<slug>.md` and (if there's an English version)
   `src/content/news/en/<en-slug>.md` with the same `translationKey`.
2. Frontmatter: `lang`, `path` (= the URL slug, no slashes), `title`,
   `pubDate`, `seo.title` (`<Title> - Stathis`), `seo.description`, `images`.
3. Put images in `src/assets/img/news/<slug>/`, semantic filenames.
4. `npm run build && npm run parity` — then add the new path(s) to
   `parity/new-urls.txt` (parity will tell you).
5. Commit and push to `main`; GitHub Actions deploys.

## Verify locally

```bash
npm run dev        # live dev server
npm run build && npm run parity   # what CI runs
```
