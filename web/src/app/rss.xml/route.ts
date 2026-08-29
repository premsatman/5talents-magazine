import { freshClient } from '@/sanity/client'
import { FEED_QUERY } from '@/sanity/queries'
import { absoluteUrl, defaultDescription, siteName, siteUrl } from '@/lib/site'
import { isSectionSlug } from '@/lib/sections'

/**
 * Blueprint s7: do not skip RSS. It is how aggregators, feed readers and
 * email-digest tooling pick up a magazine.
 */
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const articles = await freshClient.fetch(FEED_QUERY)

  const items = (articles ?? [])
    .filter((a) => a.slug && a.section?.slug && isSectionSlug(a.section.slug))
    .map((a) => {
      const url = absoluteUrl(`/${a.section?.slug}/${a.slug}`)
      const authors = (a.authors ?? []).map((x) => x?.name).filter(Boolean).join(', ')
      const sponsored = a.sponsorTier && a.sponsorTier !== 'none'
      const description = [
        sponsored ? '[Sponsored] ' : '',
        a.deck ?? '',
      ].join('')

      return `    <item>
      <title>${escapeXml(a.title ?? 'Untitled')}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ''}
      ${authors ? `<dc:creator>${escapeXml(authors)}</dc:creator>` : ''}
      ${a.section?.name ? `<category>${escapeXml(a.section.name)}</category>` : ''}
      <description>${escapeXml(description)}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(defaultDescription)}</description>
    <language>en</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
