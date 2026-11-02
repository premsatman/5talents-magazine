import { NextResponse, type NextRequest } from 'next/server'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { PushStoreUnavailable, saveSubscription } from '@/lib/push-store'

/**
 * Store a browser push subscription.
 *
 * The body is whatever PushManager.subscribe() returned, which is public
 * information about a browser endpoint - no name, no email, nothing the reader
 * typed. It is still written server-side with the service key, because the
 * table must not be readable from the browser: the endpoints together are a
 * list of everyone who subscribed, and anyone holding one could send to it.
 */
export const runtime = 'nodejs'

type Body = {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  source?: string
}

const SOURCES = new Set(['article-slidein', 'footer-bell'])

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  // Higher than the newsletter's limit: a subscription can legitimately be
  // re-sent when a browser rotates an endpoint, and failing that is worse
  // than the write, which is an upsert on a unique column.
  const limit = rateLimit(`push:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 })
  if (!limit.ok) {
    return NextResponse.json(
      { message: 'Too many attempts. Try again shortly.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  let payload: Body
  try {
    payload = (await req.json()) as Body
  } catch {
    return NextResponse.json({ message: 'Could not read that.' }, { status: 400 })
  }

  const endpoint = payload.subscription?.endpoint
  const p256dh = payload.subscription?.keys?.p256dh
  const auth = payload.subscription?.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ message: 'Incomplete subscription.' }, { status: 400 })
  }
  // Endpoints are https URLs at the browser vendor's push service. Anything
  // else is either a mistake or someone trying to make this route post to a
  // host of their choosing later.
  let parsed: URL
  try {
    parsed = new URL(endpoint)
  } catch {
    return NextResponse.json({ message: 'Invalid endpoint.' }, { status: 400 })
  }
  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ message: 'Invalid endpoint.' }, { status: 400 })
  }

  const source = payload.source && SOURCES.has(payload.source) ? payload.source : null

  try {
    await saveSubscription({
      endpoint,
      p256dh,
      auth,
      // Kept only to count Android against desktop. Truncated because the
      // full string is long, high-entropy and of no use at that length.
      userAgent: req.headers.get('user-agent')?.slice(0, 180) ?? null,
      source,
    })
  } catch (error) {
    if (error instanceof PushStoreUnavailable) {
      return NextResponse.json({ message: 'Notifications are unavailable.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Could not save that.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
