import 'server-only'
import { createSign } from 'node:crypto'

/**
 * A very small Google Analytics Data API client.
 *
 * No SDK, by the same reasoning as push-store.ts talking to PostgREST over
 * fetch: google-auth-library plus @google-analytics/data is a large dependency
 * tree earning its keep on one signed JWT and one POST. Everything Google's
 * libraries do that matters here is below.
 *
 * Credentials: GA4_SA_JSON_BASE64 holds the service account key file,
 * base64-encoded whole. Encoded rather than split into separate email and key
 * variables because the PEM contains newlines, and pasting those into a
 * dashboard env field is the single most common way this integration breaks.
 *
 * The service account (ga4-reader@fivetalents-magazine.iam.gserviceaccount.com)
 * holds no project roles at all. Its only privilege is Viewer on GA4 property
 * 552160231, granted inside Analytics rather than through IAM, so the key can
 * read one property's reports and do nothing else anywhere.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

export class Ga4Unavailable extends Error {}

type ServiceAccount = { client_email: string; private_key: string }

function credentials(): ServiceAccount {
  const encoded = process.env.GA4_SA_JSON_BASE64
  if (!encoded) throw new Ga4Unavailable('GA4_SA_JSON_BASE64 is not set')
  let parsed: ServiceAccount
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as ServiceAccount
  } catch {
    throw new Ga4Unavailable('GA4_SA_JSON_BASE64 is not valid base64 JSON')
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Ga4Unavailable('Service account JSON is missing client_email or private_key')
  }
  return parsed
}

const base64url = (input: string | Buffer) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/**
 * Tokens last an hour; this caches one for fifty minutes.
 *
 * Module scope, so the cache lives as long as the serverless instance does -
 * which for a once-a-day cron is usually not at all. That is fine: the point
 * is to avoid a second round trip when one invocation makes several calls, not
 * to keep a token warm between days.
 */
let cached: { token: string; expiresAt: number } | null = null

async function accessToken(now = Date.now()): Promise<string> {
  if (cached && cached.expiresAt > now) return cached.token

  const { client_email, private_key } = credentials()
  const issued = Math.floor(now / 1000)
  const claim = {
    iss: client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: issued,
    exp: issued + 3600,
  }
  const header = { alg: 'RS256', typ: 'JWT' }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`

  const signature = createSign('RSA-SHA256').update(unsigned).sign(private_key)
  const assertion = `${unsigned}.${base64url(signature)}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Ga4Unavailable(`Token exchange failed: ${res.status} ${await res.text()}`)

  const body = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!body.access_token) throw new Ga4Unavailable('Token exchange returned no access_token')

  cached = { token: body.access_token, expiresAt: now + (body.expires_in ?? 3600) * 1000 - 600_000 }
  return cached.token
}

export type Ga4Row = { path: string; count: number }

/**
 * Articles by article_complete events, most first.
 *
 * Deliberately not screenPageViews. The heading on the homepage says "most
 * read", and a pageview is someone arriving, not reading. The two rankings
 * genuinely differ - on the 30 days to 13 Nov 2026 one piece was second by
 * views and eighth by completions - and the completion event is also the one a
 * crawler cannot trip, since it fires on an element at the foot of the body.
 * The fake-traffic burst of 18 Sep 2026 inflated views and left completions
 * untouched.
 */
export async function articleCompletions(days = 30, limit = 25): Promise<Ga4Row[]> {
  const property = process.env.GA4_PROPERTY_ID
  if (!property) throw new Ga4Unavailable('GA4_PROPERTY_ID is not set')

  const token = await accessToken()
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { matchType: 'EXACT', value: 'article_complete' },
          },
        },
        orderBys: [{ desc: true, metric: { metricName: 'eventCount' } }],
        limit,
      }),
      cache: 'no-store',
    },
  )
  if (!res.ok) throw new Ga4Unavailable(`runReport failed: ${res.status} ${await res.text()}`)

  const body = (await res.json()) as {
    rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[]
  }
  return (body.rows ?? [])
    .map((row) => ({
      // Strip any query string: ?utm_source=webpush and the bare path are the
      // same article, and GA4 reports pagePath without the query already, but
      // a stray one would otherwise split a piece's score across two rows.
      path: (row.dimensionValues?.[0]?.value ?? '').split('?')[0],
      count: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    .filter((row) => row.path.startsWith('/') && row.count > 0)
}
