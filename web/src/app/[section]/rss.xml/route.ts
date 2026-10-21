import { notFound } from 'next/navigation'
import { freshClient } from '@/sanity/client'
import { SECTION_FEED_QUERY } from '@/sanity/queries'
import { buildFeed, feedHeaders, type FeedArticle } from '@/lib/rss-feed'
import { SECTION_SLUGS, isSectionSlug } from '@/lib/sections'
import { siteName, siteUrl } from '@/lib/site'

/**
 * One feed per section.
 *
 * Pinterest's RSS auto-publish pins a feed into a single board, and Flipboard
 * pipes a feed into a single Magazine, so the only way either platform can
 * carry the magazine section by section is a feed per section.
 *
 * Validated against the allowlist for the same reason /[section] is: an
 * unknown slug here would otherwise generate an empty feed at any URL anyone
 * cared to type.
 *
 * Lead pictures are the 2:3 pin crop rather than the share card. Pinterest is
 * what reads these feeds - one board per section - and its grid pays for
 * height. /rss.xml keeps the landscape crop for Flipboard and feed readers.
 */

type Props = { params: Promise<{ section: string }> }

export function generateStaticParams() {
  return SECTION_SLUGS.map((section) => ({ section }))
}

export async function GET(_request: Request, props: Props) {
  const { section } = await props.params
  if (!isSectionSlug(section)) notFound()

  const articles = ((await freshClient.fetch(SECTION_FEED_QUERY, { section })) ??
    []) as unknown as FeedArticle[]

  const name = articles.find((a) => a.section?.name)?.section?.name ?? section

  return new Response(
    buildFeed({
      articles,
      title: `${name} — ${siteName}`,
      description: `${name} from ${siteName}.`,
      path: `/${section}/rss.xml`,
      link: `${siteUrl}/${section}`,
      shape: 'pin',
    }),
    { headers: feedHeaders },
  )
}
