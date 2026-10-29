import { NextResponse, type NextRequest } from 'next/server'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { siteUrl } from '@/lib/site'
import { sendConfirmation, subscribe, SubscribersUnavailable } from '@/lib/subscribers'

/**
 * Newsletter signup -> Supabase "5Talents Mag" group, double opt-in.
 *
 * This used to create a Resend contact in the "5Talents Magazine" segment. The
 * list now lives in Supabase with PS.Today's, and 5Talents Weekly is sent from
 * the PS.Today admin. Resend is only used here to deliver the confirmation.
 *
 *   new address        row created, confirmation emailed, nothing sent until confirmed
 *   confirmed already  5Talents Weekly switched on, no email (they already proved the address)
 *   recently asked     no second email within 5 minutes
 *   bounced before     told plainly, so they can use another address
 */
export const runtime = 'nodejs'

function baseUrl(req: NextRequest): string {
  return siteUrl.includes('localhost') ? new URL(req.url).origin : siteUrl
}

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

  // Honeypot: look successful, do nothing.
  if (payload.company) return NextResponse.json({ message: 'Check your inbox to confirm.' })

  const email = (payload.email ?? '').trim().toLowerCase().slice(0, 200)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ message: 'That email address does not look right.' }, { status: 400 })
  }

  try {
    const result = await subscribe(email)

    switch (result.status) {
      case 'subscribed':
        return NextResponse.json({
          message: 'You are on the list. 5Talents Weekly arrives on Saturday evening.',
        })
      case 'pending':
        return NextResponse.json({
          message: 'We have just sent you a confirmation email. Click the link in it to finish.',
        })
      case 'undeliverable':
        return NextResponse.json(
          { message: 'Emails to that address have bounced before. Please try a different one.' },
          { status: 422 },
        )
      case 'invalid':
        return NextResponse.json({ message: 'That email address does not look right.' }, { status: 400 })
      case 'confirm': {
        if (!result.token) throw new SubscribersUnavailable('No token returned')
        const confirmUrl = `${baseUrl(req)}/api/subscribe/confirm?token=${encodeURIComponent(result.token)}`
        await sendConfirmation(email, confirmUrl)
        return NextResponse.json({
          message: 'Almost done. Check your inbox and click the link to confirm.',
        })
      }
    }
  } catch (error) {
    // Say so rather than claim a signup that did not happen - a reader told they
    // are on the list will not try again.
    console.error('Subscribe failed', error)
    const notReady = error instanceof SubscribersUnavailable && /not configured/.test(error.message)
    return NextResponse.json(
      {
        message: notReady
          ? 'The newsletter is not connected yet. Check back in a few days.'
          : 'We could not add you just now. Please try again in a minute.',
      },
      { status: notReady ? 503 : 502 },
    )
  }
}
