import { NextResponse, type NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { freshClient } from '@/sanity/client'
import { submitToIndexNow, urlsFor, type IndexableArticle } from '@/lib/indexnow'
import { sendArticlePush, type PushArticle } from '@/lib/push'
import { PUSH_ARTICLE_QUERY } from '@/sanity/queries'

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
 *
 * This route also sends the browser push, rather than a webhook of its own:
 * Sanity allows two and both are taken ("Revalidate site" and this one). The
 * moment IndexNow cares about and the moment a push should go are the same
 * moment, so one delivery does both.
 *
 * The push needs the headline, the deck and the lead image, which this
 * webhook's projection does not carry. Rather than ask for the projection to
 * be edited in sanity.io/manage - a step that would be silently skipped and
 * leave titleless notifications - the article is read back from Sanity by
 * slug. Nothing about the webhook configuration above changes.
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

    // Never let a push failure fail the ping. IndexNow is the job this route
    // is configured for; the push is a passenger.
    let push: Awaited<ReturnType<typeof sendArticlePush>> | { sent: false; reason: string }
    try {
      const article = (await freshClient.fetch(PUSH_ARTICLE_QUERY, {
        slug: body.slug,
        section: body.section,
      })) as PushArticle | null
      push = article
        ? await sendArticlePush(article)
        : { sent: false as const, reason: 'article not found' }
    } catch (error) {
      push = { sent: false as const, reason: error instanceof Error ? error.message : 'push failed' }
    }

    return NextResponse.json({ ...result, push })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Unknown error', { status: 500 })
  }
}
