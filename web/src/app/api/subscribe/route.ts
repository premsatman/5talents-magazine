import { NextResponse, type NextRequest } from 'next/server'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * Newsletter signup, via Resend Contacts.
 *
 * Blueprint trigger 3, worth repeating here because it is the one free-tier
 * limit most likely to bite: Resend's free plan caps at roughly 3,000 emails a
 * month AND about 100 a day. The monthly cap is not the problem — the daily one
 * is. A single broadcast to more than ~100 subscribers may exceed it, which
 * would mean you cannot send a real newsletter on the free plan at all,
 * regardless of list size.
 *
 * Test a broadcast to 150 dummy addresses before building anything around this.
 *
 * AUDIENCES ARE GONE
 *
 * This used to POST to /audiences/<id>/contacts. Resend has since deprecated
 * Audiences in favour of a global Contacts model, and renamed Audiences to
 * Segments. The old endpoint still answers, but it is on its way out and the
 * new one is better for us anyway:
 *
 *   Contact  one global record per email address, counted once no matter how
 *            many lists it appears on
 *   Segment  internal organisation only. Optional, and we do not need one
 *   Topic    what the reader sees on the preference page when they unsubscribe
 *
 * The practical consequence is that RESEND_SEGMENT_ID is optional. A contact
 * with no segment is a perfectly good subscriber. Set one only when there is
 * more than one kind of email being sent and it matters which list is which.
 *
 * Set RESEND_TOPIC_ID once there is more than one kind of email, so a reader
 * can drop the weekly letter without losing everything else. With no topic,
 * unsubscribing is all-or-nothing — which is honest and fine for one newsletter.
 */
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const limit = rateLimit(`subscribe:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })
  if (!limit.ok) {
    return NextResponse.json(
      { message: 'Too many attempts. Try again shortly.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  let payload: { email?: string; company?: string }
  try {
    payload = (await req.json()) as { email?: string; company?: string }
  } catch {
    return NextResponse.json({ message: 'Could not read that.' }, { status: 400 })
  }

  // Honeypot.
  if (payload.company) return NextResponse.json({ message: 'You are on the list.' })

  const email = (payload.email ?? '').trim().slice(0, 200)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ message: 'That email address does not look right.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  // Both optional. RESEND_AUDIENCE_ID is read as a fallback because an audience
  // keeps its id when it becomes a segment, so an older .env still works.
  const segmentId = process.env.RESEND_SEGMENT_ID || process.env.RESEND_AUDIENCE_ID
  const topicId = process.env.RESEND_TOPIC_ID

  if (!apiKey) {
    return NextResponse.json(
      { message: 'The newsletter is not connected yet. Check back in a few days.' },
      { status: 503 },
    )
  }

  let res: Response
  try {
    res = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
        ...(topicId ? { topics: [{ id: topicId, subscription: 'opt_in' }] } : {}),
      }),
    })
  } catch {
    // Resend unreachable. Say so rather than claiming a signup that did not
    // happen — a reader who is told they are on the list will not try again.
    return NextResponse.json(
      { message: 'We could not add you just now. Please try again in a minute.' },
      { status: 502 },
    )
  }

  // 409 is an address already on the list. That is a success from where the
  // reader is standing, and telling them otherwise invites a second attempt.
  if (!res.ok && res.status !== 409) {
    console.error(`Resend subscribe failed: ${res.status} ${await res.text()}`)
    return NextResponse.json(
      { message: 'We could not add you just now. Please try again in a minute.' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    message: 'You are on the list. The first email lands on a Saturday.',
  })
}
