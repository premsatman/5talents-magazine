import 'server-only'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { writeToken } from '@/sanity/token'

/**
 * Mirror push results into Sanity so they can be read in the Studio.
 *
 * Supabase stays the source of truth - fivetalents_push_log is what makes a
 * second send impossible, and that must not depend on a second system being
 * reachable. These documents are a read-only copy for human eyes, written
 * after the fact and allowed to fail.
 *
 * Why here rather than a /api/push/stats page the Studio calls: the Studio is
 * a browser app served from a public URL, so any token it carried to
 * authenticate such a call would sit in a downloadable bundle. Writing the
 * numbers into Sanity puts them behind the login that already exists.
 *
 * Every function swallows its errors on purpose. A failure to record must
 * never turn into a failure to notify, and never into a 500 on the route that
 * pings IndexNow.
 */

function writer() {
  if (!writeToken) return null
  return createClient({ projectId, dataset, apiVersion, token: writeToken, useCdn: false })
}

export async function recordSendInSanity(send: {
  articleId: string
  slug?: string | null
  headline?: string | null
  attempted: number
  delivered: number
  removed: number
}) {
  const client = writer()
  if (!client) return
  try {
    // Deterministic id: a replayed write corrects the row it already made
    // instead of leaving two records of one notification.
    await client.createOrReplace({
      _id: `pushSend.${send.articleId}`,
      _type: 'pushSend',
      article: { _type: 'reference', _ref: send.articleId },
      headline: send.headline ?? undefined,
      slug: send.slug ?? undefined,
      sentAt: new Date().toISOString(),
      attempted: send.attempted,
      delivered: send.delivered,
      removed: send.removed,
    })
  } catch {
    /* the send already happened; the record is not worth an exception */
  }
}

export async function recordSubscriberCount(subscribers: number) {
  const client = writer()
  if (!client) return
  try {
    await client.createOrReplace({
      _id: 'push-stats',
      _type: 'pushStats',
      subscribers,
      checkedAt: new Date().toISOString(),
    })
  } catch {
    /* ignore */
  }
}
