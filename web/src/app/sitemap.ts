import type { MetadataRoute } from 'next'
import { freshClient } from '@/sanity/client'
import { REWIND_SITEMAP_QUERY, SITEMAP_QUERY } from '@/sanity/queries'
import { SECTION_SLUGS, isSectionSlug } from '@/lib/sections'
import { absoluteUrl, siteUrl } from '@/lib/site'

/**
 * No changefreq and no priority anywhere in this file.
 *
 * Google ignores both - it has said so since 2023 - and between them they were
 * about five hundred lines of XML that influenced nothing. lastmod is the one
 * optional field still read, and only the articles have an honest value for it.
 *
 * `/issues` is absent: it is added below only once an issue is published,
 * because an index page reading "No issues published yet" is a thin page and
 * does not belong in a file that says what is worth crawling.
 */
const STATIC_PAGES = [
  '/',
  '/interviews',
  '/talent-search',
  '/archive',
  '/editorial-board',
  '/contributors',
  '/plagiarism',
  '/write-for-us',
  '/advertise',
  '/about',
  '/contact',
  '/privacy',
  '/corrections',
  '/terms',
]

/**
 * Rebuild hourly.
 *
 * Without this the file is generated once at build time and served from the
 * edge cache for as long as nothing is deployed - it was two days stale when
 * the 26 Oct audit ran, and the two newest articles were missing from it.
 * Worse than stale: SITEMAP_QUERY filters on `publishedAt <= now()`, and at
 * build time `now()` is the build. An article scheduled for Thursday was being
 * excluded by a clock frozen on Tuesday, and stayed excluded until the next
 * deploy happened to fall after its publish time.
 *
 * An hour is short enough that a new piece is listed before Google next asks
 * for the file, and long enough that the query runs ~24 times a day.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [data, episodes] = await Promise.all([
    freshClient.fetch(SITEMAP_QUERY),
    freshClient.fetch(REWIND_SITEMAP_QUERY) as Promise<{ slug?: string | null; publishedAt?: string | null }[] | null>,
  ])

  // The homepage canonical is the bare origin with no trailing slash, and
  // absoluteUrl('/') would emit one. A <loc> that differs from the canonical it
  // points at is a self-inflicted duplicate.
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: path === '/' ? siteUrl : absoluteUrl(path),
  }))

  const onlineIssues = data?.onlineIssues ?? []
  if (onlineIssues.length > 0) entries.push({ url: absoluteUrl('/issues') })

  for (const section of SECTION_SLUGS) {
    entries.push({ url: absoluteUrl(`/${section}`) })
  }

  for (const article of data?.articles ?? []) {
    if (!article.slug || !article.section || !isSectionSlug(article.section)) continue
    entries.push({
      url: absoluteUrl(`/${article.section}/${article.slug}`),
      // contentUpdatedAt, not _updatedAt: the automated internal-linking runs
      // bump _updatedAt in batches, so as a lastmod it tells Google only that
      // a script ran. publishedAt is the honest fallback.
      lastModified: (() => {
        const revised = article.contentUpdatedAt
        const stamp =
          revised && article.publishedAt && revised > article.publishedAt
            ? revised
            : article.publishedAt
        return stamp ? new Date(stamp) : undefined
      })(),
    })
  }

  // Tags under three articles never arrive here - SITEMAP_QUERY filters them
  // out. See the note there.
  for (const tag of data?.tags ?? []) {
    if (tag.slug) entries.push({ url: absoluteUrl(`/tags/${tag.slug}`) })
  }
  for (const author of data?.authors ?? []) {
    if (author.slug) entries.push({ url: absoluteUrl(`/authors/${author.slug}`) })
  }
  for (const issue of data?.issues ?? []) {
    if (issue.slug) entries.push({ url: absoluteUrl(`/archive/${issue.slug}`) })
  }
  for (const issue of onlineIssues) {
    if (issue.slug) entries.push({ url: absoluteUrl(`/issues/${issue.slug}`) })
  }

  // 5Talents Rewind. The show page only once there is an episode on it, for
  // the same reason /issues waits for an issue.
  if ((episodes ?? []).length > 0) entries.push({ url: absoluteUrl('/rewind') })
  for (const ep of episodes ?? []) {
    if (ep.slug) {
      entries.push({
        url: absoluteUrl(`/rewind/${ep.slug}`),
        lastModified: ep.publishedAt ? new Date(ep.publishedAt) : undefined,
      })
    }
  }

  return entries
}
