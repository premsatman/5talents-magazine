import { freshClient } from '@/sanity/client'
import { NEWS_SITEMAP_QUERY } from '@/sanity/queries'
import { absoluteUrl, siteName } from '@/lib/site'
import { isSectionSlug } from '@/lib/sections'

/**
 * Google News sitemap.
 *
 * Separate from sitemap.xml on purpose. Google asks that a news sitemap hold
 * only articles published in the last two days, and reads the title and
 * publication date from here rather than guessing them from the page. Older
 * pieces drop out of this file and stay in sitemap.xml.
 *
 * An empty <urlset> on a quiet day is valid and is what Google expects.
 *
 * Submit once in Search Console (Sitemaps -> news-sitemap.xml). It is also
 * listed in robots.txt.
 */
const WINDOW_MS = 48 * 60 * 60 * 1000

type Row = {
  title?: string | null
  slug?: string | null
  section?: string | null
  publishedAt?: string | null
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const rows = ((await freshClient.fetch(NEWS_SITEMAP_QUERY, { since })) ?? []) as Row[]

  const urls = rows
    .filter((a) => a.slug && a.title && a.publishedAt && a.section && isSectionSlug(a.section))
    .map(
      (a) => `  <url>
    <loc>${absoluteUrl(`/${a.section}/${a.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.publishedAt as string).toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title as string)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Short: this file exists to be fresh.
      'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  })
}
