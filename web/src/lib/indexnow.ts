/**
 * IndexNow: tell Bing (and Yandex, Naver, Seznam, Yep; Yahoo, DuckDuckGo,
 * Ecosia and Copilot through Bing) that a URL is new or changed.
 *
 * Google does not take part. For Google the sitemaps do this job.
 *
 * The key is public by design. IndexNow proves ownership by fetching
 * https://www.5talentsmag.com/<key>.txt, which lives in web/public/. The same
 * key is used by scripts/indexnow.mjs for one-off manual pings.
 *
 * Called from two places:
 *   - /api/indexnow       Sanity webhook, the moment an article is published
 *   - /api/indexnow/cron  daily sweep for articles that were scheduled ahead
 *                         and went live without anyone pressing Publish
 */
import { absoluteUrl, siteUrl } from '@/lib/site'
import { isSectionSlug } from '@/lib/sections'

export const INDEXNOW_KEY = 'b26d72876fb816a1df92ee9f19d6be05'

export type IndexableArticle = {
  slug?: string | null
  section?: string | null
  publishedAt?: string | null
  noIndex?: boolean | null
  retracted?: boolean | null
}

/**
 * The URLs worth pinging for an article, or none if it should not be pinged:
 * not live yet, retracted, noindexed, or in a section that is not deployed.
 * Pinging a URL that 404s or is noindexed costs trust with Bing.
 */
export function urlsFor(article: IndexableArticle, now = Date.now()): string[] {
  const { slug, section, publishedAt } = article
  if (!slug || !section || !isSectionSlug(section)) return []
  if (!publishedAt || Date.parse(publishedAt) > now) return []
  if (article.retracted || article.noIndex) return []
  // The section page changes too: the new piece is now at the top of it.
  return [absoluteUrl(`/${section}/${slug}`), absoluteUrl(`/${section}`)]
}

export async function submitToIndexNow(urls: string[]): Promise<{ status: number; sent: string[] }> {
  const unique = [...new Set(urls)]
  if (unique.length === 0) return { status: 204, sent: [] }

  // Only ever ping the production host. A preview deployment or a laptop
  // must not submit localhost or preview URLs under the real key.
  if (process.env.VERCEL_ENV !== 'production') return { status: 204, sent: [] }

  const host = new URL(siteUrl).host
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
      urlList: unique,
    }),
  })
  return { status: res.status, sent: unique }
}
