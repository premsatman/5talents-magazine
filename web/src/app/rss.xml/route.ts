import { stegaClean } from 'next-sanity'
import { freshClient } from '@/sanity/client'
import { FEED_QUERY } from '@/sanity/queries'
import { type ImageLike } from '@/sanity/image'
import { type ExternalImage } from '@/sanity/media'
import { absoluteUrl, defaultDescription, editorialEmail, siteName, siteUrl } from '@/lib/site'
import { isSectionSlug } from '@/lib/sections'
import { cdata, escapeXml, feedImageType, feedImageUrl, portableTextToHtml } from '@/lib/rss-html'

/**
 * Blueprint s7: do not skip RSS. It is how aggregators, feed readers and
 * email-digest tooling pick up a magazine.
 *
 * Each item carries, beyond the basics:
 *   <enclosure> and <media:content>  the lead picture at 1200x630, the same
 *                                    crop as the share card. Flipboard uses it
 *                                    for the story tile; Pinterest's RSS
 *                                    auto-publish pins it.
 *   <content:encoded>                the full article. Flipboard does not
 *                                    accept excerpt-only feeds.
 *
 * The image order matches the article page's og:image: SEO override, then the
 * Cloudinary URL, then the Sanity upload.
 */

type FeedArticle = {
  title: string | null
  slug: string | null
  deck: string | null
  publishedAt: string | null
  sponsorTier: string | null
  section: { name: string | null; slug: string | null } | null
  authors: Array<{ name: string | null }> | null
  hero: ImageLike
  heroExternal: ExternalImage
  seo: { ogImage: ImageLike } | null
  body: unknown
}

function leadImage(a: FeedArticle) {
  if (a.seo?.ogImage?.asset?.url) return feedImageUrl(a.seo.ogImage, null, 1200, 630)
  return feedImageUrl(a.hero, a.heroExternal, 1200, 630)
}

function leadAlt(a: FeedArticle) {
  return stegaClean(a.heroExternal?.url ? a.heroExternal?.alt : a.hero?.alt) || a.title || ''
}

export async function GET() {
  const articles = ((await freshClient.fetch(FEED_QUERY)) ?? []) as unknown as FeedArticle[]

  const items = articles
    .filter((a) => a.slug && a.section?.slug && isSectionSlug(a.section.slug))
    .map((a) => {
      const url = absoluteUrl(`/${a.section?.slug}/${a.slug}`)
      const authors = (a.authors ?? []).map((x) => x?.name).filter(Boolean).join(', ')
      const sponsored = a.sponsorTier && a.sponsorTier !== 'none'
      const description = [sponsored ? '[Sponsored] ' : '', a.deck ?? ''].join('')
      const image = leadImage(a)

      // The deck leads the full text, as it does on the page, and the lead
      // picture sits above it so readers that ignore <enclosure> still show it.
      // The sponsorship label is its own line rather than a prefix on the deck:
      // a sponsored piece with no deck must still carry it, and <description>
      // is not what Flipboard renders.
      const body = [
        image ? `<p><img src="${escapeXml(image)}" alt="${escapeXml(leadAlt(a))}"/></p>` : '',
        sponsored ? `<p><strong>Sponsored</strong></p>` : '',
        a.deck ? `<p><em>${escapeXml(a.deck)}</em></p>` : '',
        portableTextToHtml(a.body),
        `<p><a href="${url}">Read this story on ${escapeXml(siteName)}</a></p>`,
      ]
        .filter(Boolean)
        .join('\n')

      const imageType = image ? feedImageType(image) : ''

      return `    <item>
      <title>${escapeXml(a.title ?? 'Untitled')}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ''}
      ${authors ? `<dc:creator>${escapeXml(authors)}</dc:creator>` : ''}
      ${a.section?.name ? `<category>${escapeXml(a.section.name)}</category>` : ''}
      <description>${escapeXml(description)}</description>
      ${image ? `<enclosure url="${escapeXml(image)}" length="0" type="${imageType}" />` : ''}
      ${image ? `<media:content url="${escapeXml(image)}" medium="image" type="${imageType}" width="1200" height="630" />` : ''}
      ${image ? `<media:thumbnail url="${escapeXml(image)}" width="1200" height="630" />` : ''}
      <content:encoded>${cdata(body)}</content:encoded>
    </item>`
    })
    .join('\n')

  const newest = articles.find((a) => a.publishedAt)?.publishedAt
  // RSS 2.0 caps the channel image at 144x400, so the 512px app icon is out:
  // strict validators reject it and some directories refuse the feed on that
  // alone. The 96px favicon is inside the limit.
  const logo = `${siteUrl}/favicon/favicon-96x96.png`
  const editor = `${editorialEmail} (${siteName})`

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(defaultDescription)}</description>
    <language>en</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(siteName)}. Articles are © their authors.</copyright>
    <managingEditor>${escapeXml(editor)}</managingEditor>
    <webMaster>${escapeXml(editor)}</webMaster>
    <category>Religion &amp; Spirituality/Christianity</category>
    <generator>${escapeXml(siteName)} on Next.js</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <ttl>60</ttl>
    ${newest ? `<pubDate>${new Date(newest).toUTCString()}</pubDate>` : ''}
    ${newest ? `<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>` : ''}
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${logo}</url>
      <title>${escapeXml(siteName)}</title>
      <link>${siteUrl}</link>
      <width>96</width>
      <height>96</height>
    </image>
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
