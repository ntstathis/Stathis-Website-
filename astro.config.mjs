// @ts-check
import { defineConfig } from 'astro/config';

// URL behavior mirrors the old WordPress site exactly:
// every page is a directory with a trailing slash (GitHub Pages then serves
// /foo -> 301 -> /foo/ like WP did). Do not change these two settings.
export default defineConfig({
  site: 'https://stathis.com.gr',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
