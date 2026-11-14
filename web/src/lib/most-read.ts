import 'server-only'
import { freshClient } from '@/sanity/client'
import { articleCompletions, Ga4Unavailable } from '@/lib/ga4'
import { isSectionSlug } from '@/lib/sections'

/**
 * The homepage "Most read" rail.
 *
 * It said "Most read" and numbered its entries 01 to 05 while running the same
 * query as "The latest" - newest first, sliced to five. The two columns held
 * the same five articles in the same order, and the rank was the array index,
 * so a piece published ten minutes ago was 01 before anyone had opened it. The
 * numbers were decoration presented as evidence.
 *
 * This replaces them with GA4 article_complete counts over a rolling window,
 * refreshed once a day by the cron. Five rows in Supabase keyed by rank, so a
 * refresh is an upsert in place rather than a delete and insert, which would
 * leave the rail empty for the moment in between.
 *
 * Only ids and counts are stored. Titles, decks and images are resolved from
 * Sanity at render time, so an edited headline is never stale here, and a
 * retracted piece disappears from the rail because the Sanity query drops it.
 */

const TABLE = 'fivetalents_most_read'
const WINDOW_DAYS = 30
const SIZE = 5

export type MostReadRow = {
  rank: number
  article_id: string
  slug: string | null
  section: string | null
  completions: number
}

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return { url, key }
}

async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const cfg = config()
  if (!cfg) throw new Error('Supabase is not configured')
  const { prefer, ...rest } = init
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: cfg.key,
      authorization: `Bearer ${cfg.key}`,
      'content-type': 'application/json',
      ...(prefer ? { prefer } : {}),
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status} ${await res.text()}`)
  const text = res.status === 204 ? '' : await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/**
 * The article ids the homepage should show, best first. Empty on any problem.
 *
 * Cached for an hour rather than read fresh. This runs on the homepage, and a
 * `no-store` fetch anywhere in a route opts that route out of static rendering
 * altogether - which for the sake of a table the cron rewrites once a day
 * would have traded the homepage's static render for nothing. An hour is far
 * shorter than the data's actual refresh rate.
 */
export async function readMostRead(): Promise<MostReadRow[]> {
  const cfg = config()
  if (!cfg) return []
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/${TABLE}?select=rank,article_id,slug,section,completions&order=rank.asc&limit=${SIZE}`,
      {
        headers: { apikey: cfg.key, authorization: `Bearer ${cfg.key}` },
        next: { revalidate: 3600 },
      },
    )
    if (!res.ok) return []
    return ((await res.json()) ?? []) as MostReadRow[]
  } catch {
    // The rail falls back to recency upstream. A stats table being unreachable
    // must never be the reason a homepage fails to render.
    return []
  }
}

export type RefreshResult =
  | { ok: false; reason: string }
  | { ok: true; ranked: { rank: number; slug: string | null; completions: number }[] }

/**
 * Pull GA4, match paths to articles, write the table. Daily, from the cron.
 *
 * Matching is done against Sanity rather than by parsing the URL, because a
 * path only proves what someone visited: an article since retracted, or moved
 * to another section, would otherwise keep its place in the rail. Asking Sanity
 * for live articles and keeping the intersection means the list can only ever
 * contain pieces that are currently published.
 */
export async function refreshMostRead(days = WINDOW_DAYS): Promise<RefreshResult> {
  if (!config()) return { ok: false, reason: 'Supabase is not configured' }

  let rows
  try {
    rows = await articleCompletions(days)
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Ga4Unavailable ? error.message : 'GA4 request failed',
    }
  }
  if (rows.length === 0) return { ok: false, reason: 'GA4 returned no completions' }

  const live = (await freshClient.fetch(
    `*[_type == "article" && defined(slug.current) && publishedAt <= now()
       && coalesce(retracted, false) == false && seo.noIndex != true]{
      _id, "slug": slug.current, "section": section->slug.current
    }`,
  )) as { _id: string; slug: string; section: string | null }[]

  const bySlug = new Map(
    live
      .filter((a) => a.section && isSectionSlug(a.section))
      .map((a) => [`/${a.section}/${a.slug}`, a]),
  )

  const ranked = rows
    .map((row) => ({ article: bySlug.get(row.path.replace(/\/$/, '')), count: row.count }))
    .filter((row): row is { article: { _id: string; slug: string; section: string | null }; count: number } =>
      Boolean(row.article),
    )
    .slice(0, SIZE)
    .map((row, index) => ({
      rank: index + 1,
      article_id: row.article._id,
      slug: row.article.slug,
      section: row.article.section,
      path: `/${row.article.section}/${row.article.slug}`,
      completions: row.count,
      window_days: days,
      computed_at: new Date().toISOString(),
    }))

  if (ranked.length === 0) return { ok: false, reason: 'no GA4 paths matched a live article' }

  await rest(TABLE, {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: JSON.stringify(ranked),
  })

  // A quiet week can return fewer than five. Clear any stale rows below the
  // new list rather than leaving yesterday's number four sitting under today's
  // number three.
  if (ranked.length < SIZE) {
    await rest(`${TABLE}?rank=gt.${ranked.length}`, { method: 'DELETE' }).catch(() => {})
  }

  return {
    ok: true,
    ranked: ranked.map(({ rank, slug, completions }) => ({ rank, slug, completions })),
  }
}
