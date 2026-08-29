import { defineLive } from 'next-sanity/live'
import { client } from './client'
import { readToken } from './token'

/**
 * Live Content API.
 *
 * Blueprint s7 asked for webhook-driven on-demand revalidation rather than a
 * blanket time-based ISR interval, for two reasons: time-based revalidation
 * regenerates pages nobody changed, and it still gives editors a slower update
 * than tag invalidation.
 *
 * defineLive satisfies both. Pages render statically with `revalidate: false`
 * and are invalidated by live events the moment a document changes - no polling,
 * no wasted regeneration, and no webhook to configure for the common case.
 *
 * The tag webhook at /api/revalidate is still shipped as a fallback for
 * anything that needs to be invalidated from outside Sanity.
 */
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: readToken,
  browserToken: readToken,
})
