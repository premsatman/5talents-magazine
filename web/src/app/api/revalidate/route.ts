import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

/**
 * Sanity webhook -> tag invalidation.
 *
 * The Live Content API (src/sanity/live.ts) already handles the common case, so
 * this is a fallback for anything that needs invalidating from outside Sanity's
 * live channel, and a belt-and-braces path if live events are ever missed.
 *
 * Configure in Sanity Manage -> API -> Webhooks:
 *   URL        https://yoursite.com/api/revalidate
 *   Trigger    Create, Update, Delete
 *   Filter     _type in ["article","author","section","tag","archiveIssue","advertiser","siteSettings"]
 *   Projection { "tags": [_type, _type + ":" + slug.current] }
 *   Secret     the value of SANITY_REVALIDATE_SECRET
 */
type Payload = { tags?: string[] }

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET
    if (!secret) {
      return new Response('Revalidation secret is not configured', { status: 500 })
    }

    // The `true` adds a short delay so Sanity's CDN has caught up before we
    // regenerate - otherwise the rebuilt page can pick up the pre-edit content.
    const { isValidSignature, body } = await parseBody<Payload>(req, secret, true)

    if (!isValidSignature) return new Response('Invalid signature', { status: 401 })
    if (!Array.isArray(body?.tags) || body.tags.length === 0) {
      return new Response('Missing tags', { status: 400 })
    }

    // Next 16 requires a cacheLife profile as the second argument.
    for (const tag of body.tags) revalidateTag(tag, 'max')

    return NextResponse.json({ revalidated: body.tags, at: Date.now() })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Unknown error', { status: 500 })
  }
}
