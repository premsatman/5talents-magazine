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
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    return NextResponse.json(
      { message: 'The newsletter is not connected yet. Check back in a few days.' },
      { status: 503 },
    )
  }

  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  })

  if (!res.ok && res.status !== 409) {
    return NextResponse.json(
      { message: 'We could not add you just now. Please try again in a minute.' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    message: 'You are on the list. The first email lands on a Saturday.',
  })
}
