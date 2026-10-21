import { NextResponse, type NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { submitToIndexNow, urlsFor, type IndexableArticle } from '@/lib/indexnow'

/**
 * Sanity webhook -> IndexNow, so a new article reaches Bing within minutes of
 * Publish instead of whenever its crawler next comes round.
 *
 * Configure in sanity.io/manage -> project -> API -> Webhooks -> Create:
 *   Name        IndexNow on publish
 *   URL         https://www.5talentsmag.com/api/indexnow
 *   Dataset     production
 *   Trigger on  Create, Update
 *   Filter      _type == "article"
 *   Projection  {
 *                 "slug": slug.current,
 *                 "section": section->slug.current,
 *                 publishedAt,
 *                 "noIndex": seo.noIndex,
 *                 retracted
 *               }
 *   Drafts      off (only published changes)
 *   Secret      the value of INDEXNOW_WEBHOOK_SECRET in Vercel
 *
 * An article scheduled for later (publishedAt in the future) is skipped here
 * and picked up by the daily sweep in ./cron once it is live.
 */
type Payload = IndexableArticle

export async function POST(req: NextRequest) {
  const secret = process.env.INDEXNOW_WEBHOOK_SECRET ?? process.env.SANITY_REVALIDATE_SECRET
  if (!secret) return new Response('Webhook secret is not configured', { status: 500 })

  try {
    const { isValidSignature, body } = await parseBody<Payload>(req, secret)
    if (!isValidSignature) return new Response('Invalid signature', { status: 401 })
    if (!body) return new Response('Missing body', { status: 400 })

    const urls = urlsFor(body)
    if (urls.length === 0) return NextResponse.json({ skipped: true, reason: 'not live, noindexed or retracted' })

    const result = await submitToIndexNow(urls)
    return NextResponse.json(result)
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Unknown error', { status: 500 })
  }
}
