import { NextResponse, type NextRequest } from 'next/server'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { PushStoreUnavailable, deleteSubscription } from '@/lib/push-store'

/**
 * Forget a push subscription.
 *
 * Deliberately not authenticated and deliberately not rate-limited hard:
 * knowing an endpoint is the only thing needed to send to it, so anyone who
 * has one may delete it. Unsubscribing must never be the harder path.
 */
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const limit = rateLimit(`push-off:${clientIp(req.headers)}`, { limit: 60, windowMs: 60 * 60 * 1000 })
  if (!limit.ok) return NextResponse.json({ ok: true })

  let endpoint: string | undefined
  try {
    endpoint = ((await req.json()) as { endpoint?: string }).endpoint
  } catch {
    return NextResponse.json({ message: 'Could not read that.' }, { status: 400 })
  }
  if (!endpoint) return NextResponse.json({ message: 'No endpoint.' }, { status: 400 })

  try {
    await deleteSubscription(endpoint)
  } catch (error) {
    if (error instanceof PushStoreUnavailable) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ message: 'Could not remove that.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
