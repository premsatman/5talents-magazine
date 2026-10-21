import { NextResponse, type NextRequest } from 'next/server'
import { freshClient } from '@/sanity/client'
import { submitToIndexNow, urlsFor, type IndexableArticle } from '@/lib/indexnow'

/**
 * Daily sweep: ping every article that went live in the last 26 hours.
 *
 * Exists for scheduled pieces. When an article is published in Studio with a
 * publishedAt in the future, the webhook fires at that moment and correctly
 * skips it, because the URL would still 404. Nothing fires again when the
 * time arrives. This catches them. Articles the webhook already sent get sent
 * a second time, which IndexNow accepts without complaint.
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
    `*[_type == "article" && defined(slug.current) && publishedAt > $since && publishedAt <= now()]{
      "slug": slug.current,
      "section": section->slug.current,
      publishedAt,
      "noIndex": seo.noIndex,
      retracted
    }`,
    { since },
  )) ?? []) as IndexableArticle[]

  const urls = rows.flatMap((a) => urlsFor(a))
  const result = await submitToIndexNow(urls)
  return NextResponse.json({ articles: rows.length, ...result })
}
