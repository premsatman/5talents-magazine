import { NextResponse, type NextRequest } from 'next/server'
import { freshClient } from '@/sanity/client'
import { submitToIndexNow, urlsFor, type IndexableArticle } from '@/lib/indexnow'
import { sendArticlePush, type PushArticle } from '@/lib/push'
import { countSubscriptions } from '@/lib/push-store'
import { recordSubscriberCount } from '@/lib/push-sanity'
import { refreshMostRead } from '@/lib/most-read'

/**
 * Daily sweep: ping every article that went live in the last 26 hours.
 *
 * Exists for scheduled pieces. When an article is published in Studio with a
 * publishedAt in the future, the webhook fires at that moment and correctly
 * skips it, because the URL would still 404. Nothing fires again when the
 * time arrives. This catches them. Articles the webhook already sent get sent
 * a second time, which IndexNow accepts without complaint.
 *
 * It is also the push path for scheduled pieces, for the same reason: nothing
 * fires when a future publishedAt arrives. A piece scheduled overnight is
 * therefore pushed at 18:00 IST, not at the moment it appeared - the one
 * compromise in using the existing cron rather than a second webhook.
 *
 * Articles the webhook already pushed are not pushed again: sendArticlePush
 * claims a row in fivetalents_push_log keyed on the article id, and the claim
 * is what fails the second time. Re-pinging IndexNow is harmless and stays.
 *
 * Runs from vercel.json. Vercel sends `Authorization: Bearer <CRON_SECRET>`
 * when CRON_SECRET is set in the project, and anything else is refused.
 */
export const dynamic = 'force-dynamic'

const WINDOW_MS = 26 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const rows = ((await freshClient.fetch(
    `*[_type == "article" && defined(slug.current) && publishedAt > $since && publishedAt <= now()]
     | order(publishedAt asc){
      _id,
      "slug": slug.current,
      "section": section->slug.current,
      title,
      deck,
      publishedAt,
      "noIndex": seo.noIndex,
      retracted,
      "image": coalesce(heroExternal.url, hero.asset->url)
    }`,
    { since },
  )) ?? []) as PushArticle[]

  const urls = rows.flatMap((a) => urlsFor(a as IndexableArticle))
  const result = await submitToIndexNow(urls)

  /**
   * Oldest first, and sequentially.
   *
   * The daily cap means at most one of these actually sends, and ordering by
   * publishedAt ascending makes it the earliest unpushed piece rather than
   * whichever the dataset happened to return first. Sequential because each
   * call reads the log the previous one writes; in parallel they would all
   * see an empty day and the cap would not hold.
   */
  const pushes: { slug?: string | null; result: Awaited<ReturnType<typeof sendArticlePush>> }[] = []
  for (const article of rows) {
    try {
      pushes.push({ slug: article.slug, result: await sendArticlePush(article) })
    } catch (error) {
      pushes.push({
        slug: article.slug,
        result: { sent: false, reason: error instanceof Error ? error.message : 'push failed' },
      })
    }
  }

  // Refresh the subscriber count in the Studio whether or not anything went
  // out, so a quiet week does not leave a stale number on the page.
  let subscribers: number | null = null
  try {
    subscribers = await countSubscriptions()
    await recordSubscriberCount(subscribers)
  } catch {
    /* the sweep's job is IndexNow; a count is not worth failing it */
  }

  /**
   * Re-rank the homepage's "Most read" rail from GA4.
   *
   * Here rather than in its own cron because Vercel's hobby-tier cron budget
   * is small and this needs to run exactly as often as the sweep does - once a
   * day is ample for a 30-day window. Failures are reported, never thrown: the
   * rail falls back to recency on its own, and IndexNow is this route's job.
   */
  let mostRead: Awaited<ReturnType<typeof refreshMostRead>>
  try {
    mostRead = await refreshMostRead()
  } catch (error) {
    mostRead = { ok: false, reason: error instanceof Error ? error.message : 'unknown' }
  }

  return NextResponse.json({ articles: rows.length, ...result, pushes, subscribers, mostRead })
}
