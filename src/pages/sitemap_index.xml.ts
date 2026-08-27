// Alias of /sitemap.xml at the old Yoast URL, so crawlers with the old
// sitemap location memorized keep finding a valid sitemap.
import type { APIRoute } from 'astro';
import { sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async () =>
  new Response(await sitemapXml(), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
