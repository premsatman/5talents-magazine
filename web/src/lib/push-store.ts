import 'server-only'

/**
 * The two push tables in Supabase, over PostgREST.
 *
 * Same approach as subscribers.ts, and for the same reason: the Supabase SDK
 * would be a dependency earning its keep on about sixty lines of HTTP. The
 * tables live in project "pstoday+crb" beside the newsletter ones, prefixed
 * fivetalents_, and SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are already set
 * in Vercel for the newsletter.
 *
 * The service key bypasses row-level security. Both tables have RLS on and no
 * policies, so this module is the only way in, and it is server-only.
 */

const SUBS = 'fivetalents_push_subscriptions'
const LOG = 'fivetalents_push_log'

export class PushStoreUnavailable extends Error {}

export type StoredSubscription = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  fail_count: number
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new PushStoreUnavailable('Supabase is not configured')
  return { url, key }
}

async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const { url, key } = config()
  const { prefer, ...rest } = init
  let res: Response
  try {
    res = await fetch(`${url}/rest/v1/${path}`, {
      ...rest,
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        ...(prefer ? { prefer } : {}),
        ...(rest.headers ?? {}),
      },
      cache: 'no-store',
    })
  } catch (error) {
    throw new PushStoreUnavailable(`Supabase unreachable: ${String(error)}`)
  }
  if (!res.ok) {
    throw new PushStoreUnavailable(`Supabase ${path} failed: ${res.status} ${await res.text()}`)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/** A push endpoint is a URL, so it has to be escaped before it goes in a filter. */
const eq = (value: string) => `eq.${encodeURIComponent(value)}`

/* ------------------------------------------------------------ subscriptions */

export async function saveSubscription(sub: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string | null
  source?: string | null
}) {
  // merge-duplicates on the unique endpoint: a reader who subscribes again
  // from another page updates their row rather than colliding. fail_count is
  // reset because a fresh subscription is by definition reachable.
  await rest(SUBS, {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      user_agent: sub.userAgent ?? null,
      source: sub.source ?? null,
      fail_count: 0,
    }),
  })
}

export function deleteSubscription(endpoint: string) {
  return rest(`${SUBS}?endpoint=${eq(endpoint)}`, { method: 'DELETE' })
}

export function listSubscriptions() {
  return rest<StoredSubscription[]>(`${SUBS}?select=id,endpoint,p256dh,auth,fail_count`)
}

export function countSubscriptions() {
  return rest<{ count: number }[]>(`${SUBS}?select=count`).then((r) => r?.[0]?.count ?? 0)
}

export function deleteSubscriptionsById(ids: string[]) {
  if (ids.length === 0) return Promise.resolve()
  return rest(`${SUBS}?id=in.(${ids.join(',')})`, { method: 'DELETE' })
}

export function markDelivered(ids: string[]) {
  if (ids.length === 0) return Promise.resolve()
  return rest(`${SUBS}?id=in.(${ids.join(',')})`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify({ last_success_at: new Date().toISOString(), fail_count: 0 }),
  })
}

export async function bumpFailure(sub: StoredSubscription) {
  await rest(`${SUBS}?id=eq.${sub.id}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify({ fail_count: sub.fail_count + 1 }),
  })
}

/* --------------------------------------------------------------------- log */

export type PushLogRow = { id: string; article_id: string; sent_at: string }

/**
 * Claim an article for sending, or return null if it is already claimed.
 *
 * article_id is unique, and ignore-duplicates makes this insert the lock: the
 * row comes back only to the first caller. Sanity is free to deliver a webhook
 * twice, and the daily cron deliberately re-walks articles the webhook already
 * handled, so a select-then-insert would leave a window where both send.
 */
export async function claimArticle(articleId: string, slug?: string | null) {
  const rows = await rest<PushLogRow[]>(LOG, {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=representation',
    body: JSON.stringify({ article_id: articleId, slug: slug ?? null }),
  })
  return rows?.[0] ?? null
}

export function releaseArticle(logId: string) {
  return rest(`${LOG}?id=eq.${logId}`, { method: 'DELETE' })
}

export function pushedSince(iso: string) {
  return rest<{ id: string }[]>(`${LOG}?select=id&sent_at=gte.${iso}&limit=1`).then(
    (rows) => (rows?.length ?? 0) > 0,
  )
}

export function recordCounts(
  logId: string,
  counts: { attempted: number; delivered: number; removed: number },
) {
  return rest(`${LOG}?id=eq.${logId}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify(counts),
  })
}
