import { freshClient } from '@/sanity/client'
import { SECTION_INDEX_QUERY } from '@/sanity/queries'
import { isSectionSlug } from '@/lib/sections'
import { absoluteUrl, scopeStatement, siteName, siteUrl, tagline } from '@/lib/site'

/**
 * /llms.txt - what this publication is, in one plain-text file.
 *
 * The convention (llmstxt.org) is a Markdown file at the root that tells a
 * language model what a site covers and where the authoritative pages are,
 * instead of leaving it to infer that from whichever article it happened to
 * crawl. Served as text/plain, which is what the spec asks for and what every
 * client reading it expects.
 *
 * The section list is read from Sanity rather than hardcoded, for the same
 * reason the nav is: a section's scope line is editorial copy and it is edited
 * in the studio. Filtered through the route allowlist so a section that exists
 * in the dataset but is not deployed cannot be advertised here as a URL that
 * 404s.
 *
 * Deliberately not a sitemap. It lists the ten section indexes and the four
 * pages that say who publishes this and how to correct it - not 72 articles,
 * which is what sitemap.xml is for.
 */
type Section = {
  name?: string | null
  slug?: string | null
  description?: string | null
  articleCount?: number | null
}

export async function GET() {
  const sections = ((await freshClient.fetch(SECTION_INDEX_QUERY)) ?? []) as Section[]

  const sectionLines = sections
    .filter((s) => s.slug && isSectionSlug(s.slug))
    .map((s) => {
      const scope = s.description?.replace(/\s+/g, ' ').trim()
      const count =
        s.articleCount === 1 ? ' (1 article)' : s.articleCount ? ` (${s.articleCount} articles)` : ''
      return `- [${s.name ?? s.slug}](${absoluteUrl(`/${s.slug}`)})${count}${scope ? `: ${scope}` : ''}`
    })
    .join('\n')

  const body = `# ${siteName}

> ${tagline}. A magazine for young Christians, edited from India and written for the world.

Founded in Hyderabad in July 2012. It ran to twenty issues — nineteen monthly
to July 2014 and a last one in January 2017 — made as PDFs and circulated
privately rather than published, which is why the publication date of record is
2026, when it became a monthly online magazine at ${siteUrl}. Those twenty
issues are the archive at ${absoluteUrl('/archive')}; pieces rewritten and
republished from them carry a note of the issue they first appeared in.

${scopeStatement}

Articles live at /{section}/{slug} — the section slug is always one of the
sections below. Every piece carries a named byline and a publication date.

## Sections

${sectionLines}

## About this publication

- [About](${absoluteUrl('/about')}): what the magazine is for, its editorial
  scope and doctrinal position, the masthead, and the publisher of record.
- [Editorial board](${absoluteUrl('/editorial-board')}): the board by name,
  with each member's designation and institution.
- [Corrections](${absoluteUrl('/corrections')}): the corrections policy and
  how to report an error. Corrected articles carry the correction on the page.

## Feeds

- [RSS](${siteUrl}/rss.xml)
- [Sitemap](${siteUrl}/sitemap.xml)
`

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
