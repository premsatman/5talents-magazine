import 'server-only'

/**
 * In-memory fixed-window rate limiter for the public form routes.
 *
 * Blueprint s7: unauthenticated writes into the dataset are a spam vector that
 * will consume the document quota. This is the cheap half of the defence; the
 * honeypot and Turnstile check are the other half.
 *
 * Caveat worth knowing: this counter lives in one serverless instance's memory,
 * so under concurrency the effective limit is per-instance, not global. That is
 * adequate at launch traffic. If the form starts getting hammered, move the
 * counter to Upstash Redis or Vercel KV - the interface below does not change.
 */
type Window = { count: number; resetAt: number }

const buckets = new Map<string, Window>()

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60 * 60 * 1000 }: { limit?: number; windowMs?: number } = {},
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
  }

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) }
  }
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Cloudflare Turnstile. Returns true when unconfigured, so the form still works pre-setup. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  const body = new URLSearchParams({ secret, response: token, remoteip: ip })
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  })
  if (!res.ok) return false
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}
