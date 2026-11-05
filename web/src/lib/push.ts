import 'server-only'
import webpush, { WebPushError } from 'web-push'
import { absoluteUrl } from '@/lib/site'
import { urlsFor, type IndexableArticle } from '@/lib/indexnow'
import { recordSendInSanity, recordSubscriberCount } from '@/lib/push-sanity'
import {
  bumpFailure,
  claimArticle,
  deleteSubscriptionsById,
  listSubscriptions,
  markDelivered,
  pushedSince,
  recordCounts,
  releaseArticle,
  type StoredSubscription,
} from '@/lib/push-store'

/**
 * Browser push on publish.
 *
 * Called from /api/indexnow (the Sanity webhook) and /api/indexnow/cron, not
 * from a webhook of its own: the plan allows Sanity two webhooks and both are
 * spoken for. The IndexNow route already knows exactly when an article became
 * public, which is the same moment a push should go, so it carries this too.
 *
 * Three guards, in this order, because each is cheaper than the next:
 *   1. the article must be pushable at all - live, not retracted, not
 *      noindexed, in a deployed section, published within 48 hours;
 *   2. nothing may have been pushed yet today (IST);
 *   3. this article must not already have been pushed, ever.
 *
 * Guard 3 is a row claimed in fivetalents_push_log, not a check - see
 * claimArticle. Both callers can fire for the same article within seconds of
 * each other and only one send may result.
 */

const FRESH_MS = 48 * 60 * 60 * 1000
const BATCH = 100
/** Four hours. A phone that was off all afternoon should still get it; a
 *  two-day-old "today's story" is just noise. */
const TTL_SECONDS = 4 * 60 * 60

export type PushArticle = IndexableArticle & {
  _id?: string | null
  title?: string | null
  deck?: string | null
  image?: string | null
}

export type PushPayload = {
  title: string
  body: string
  url: string
  image?: string
  slug: string
}

export type PushResult =
  | { sent: false; reason: string }
  | { sent: true; attempted: number; delivered: number; removed: number }

/**
 * Midnight in Kolkata, as a timestamp.
 *
 * The cap is "one push a day" as a reader in India experiences a day, so it
 * cannot key off the server's UTC date: the 18:00 IST cron runs at 12:30 UTC,
 * and a UTC day boundary would let a piece published at 23:00 IST and another
 * at 01:00 IST both go, four hours apart, across the same night.
 */
export function startOfIstDay(now = Date.now()): Date {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  const ist = new Date(now + IST_OFFSET)
  const midnight = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
  return new Date(midnight - IST_OFFSET)
}

/** The notification for an article, or null if it should not be pushed. */
export function payloadFor(article: PushArticle, now = Date.now()): PushPayload | null {
  // Liveness, retraction, noindex and section deployment are already decided
  // by urlsFor - the same rules IndexNow uses, kept in one place so the two
  // can never disagree about whether a URL is real.
  if (urlsFor(article, now).length === 0) return null

  const published = Date.parse(article.publishedAt ?? '')
  if (!Number.isFinite(published) || now - published > FRESH_MS) return null
  if (!article.title || !article.slug || !article.section) return null

  return {
    title: article.title,
    body: article.deck ?? '',
    url: absoluteUrl(`/${article.section}/${article.slug}`),
    image: article.image ?? undefined,
    slug: article.slug,
  }
}

function vapidReady(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

/**
 * Send one article to every subscriber.
 *
 * Returns rather than throws on every expected refusal, so the IndexNow route
 * can report what happened without a push problem ever failing the ping that
 * route exists to make.
 */
export async function sendArticlePush(
  article: PushArticle,
  now = Date.now(),
): Promise<PushResult> {
  if (process.env.VERCEL_ENV !== 'production') return { sent: false, reason: 'not production' }
  if (!vapidReady()) return { sent: false, reason: 'VAPID keys not configured' }

  const payload = payloadFor(article, now)
  if (!payload) return { sent: false, reason: 'not pushable' }

  const articleId = article._id
  if (!articleId) return { sent: false, reason: 'no article id' }

  if (await pushedSince(startOfIstDay(now).toISOString())) {
    return { sent: false, reason: 'already pushed today' }
  }

  const claim = await claimArticle(articleId, payload.slug)
  if (!claim) return { sent: false, reason: 'already pushed' }

  const subscriptions = await listSubscriptions()
  if (subscriptions.length === 0) {
    // Nothing to send to. Give the claim back rather than burning the day's
    // one push and marking the article done before anyone could receive it.
    await releaseArticle(claim.id)
    return { sent: false, reason: 'no subscribers' }
  }

  const body = JSON.stringify(payload)
  const delivered: string[] = []
  const dead: string[] = []
  const failed: StoredSubscription[] = []

  for (let i = 0; i < subscriptions.length; i += BATCH) {
    const batch = subscriptions.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: TTL_SECONDS, urgency: 'normal', topic: payload.slug.slice(0, 32) },
        ),
      ),
    )

    results.forEach((result, index) => {
      const sub = batch[index]
      if (result.status === 'fulfilled') {
        delivered.push(sub.id)
        return
      }
      // 404 and 410 are the push service saying this endpoint is gone for
      // good - the browser was uninstalled, or the reader revoked permission.
      // Anything else may be transient, so it costs a strike instead.
      const status = (result.reason as WebPushError | undefined)?.statusCode
      if (status === 404 || status === 410) dead.push(sub.id)
      else if (sub.fail_count + 1 >= 5) dead.push(sub.id)
      else failed.push(sub)
    })
  }

  await Promise.allSettled([
    markDelivered(delivered),
    deleteSubscriptionsById(dead),
    ...failed.map((sub) => bumpFailure(sub)),
  ])

  const counts = {
    attempted: subscriptions.length,
    delivered: delivered.length,
    removed: dead.length,
  }
  await recordCounts(claim.id, counts).catch(() => {})

  // The Studio's copy. Supabase above is the record that matters; these two
  // are what someone can actually look at, and neither may throw.
  await Promise.allSettled([
    recordSendInSanity({
      articleId,
      slug: payload.slug,
      headline: payload.title,
      ...counts,
    }),
    recordSubscriberCount(counts.attempted - counts.removed),
  ])

  return { sent: true, ...counts }
}
