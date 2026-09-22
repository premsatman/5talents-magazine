import { clean } from '@/sanity/stega'

/**
 * The "Watch it" card at the top of a Screen article.
 *
 * Where to watch, by country, plus the content advisory. This is the block a
 * search snippet or an AI answer quotes, so it is plain server-rendered HTML
 * (a table, not a widget). International first; India always gets a row when
 * the editor fills one in. See readme/SCREEN-SECTION-PLAN.md.
 */
type Row = {
  _key?: string | null
  region?: string | null
  platform?: string | null
  languages?: string | null
  releaseDate?: string | null
}
type Advisory = {
  language?: string | null
  violence?: string | null
  sexualContent?: string | null
  themes?: string | null
}
export type ScreenMeta = {
  workTitle?: string | null
  workType?: string | null
  releaseDate?: string | null
  advisoryNote?: string | null
  trailerUrl?: string | null
  availability?: Row[] | null
  contentAdvisory?: Advisory | null
} | null | undefined

const WORK_TYPE: Record<string, string> = {
  film: 'Film',
  series: 'Series',
  documentary: 'Documentary',
  docuseries: 'Docuseries',
}

function fmt(date?: string | null) {
  const d = clean(date)
  if (!d) return ''
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Pull the video id out of any YouTube URL form an editor might paste:
 * watch?v=, youtu.be/, /embed/, /shorts/. Returns null for anything else,
 * so a non-YouTube link never becomes an iframe.
 */
function youtubeId(url?: string | null): string | null {
  const u = clean(url)
  if (!u) return null
  try {
    const parsed = new URL(u)
    const host = parsed.hostname.replace(/^www\.|^m\./, '')
    let id: string | null = null
    if (host === 'youtu.be') id = parsed.pathname.slice(1)
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id =
        parsed.searchParams.get('v') ??
        parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ??
        null
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null
  } catch {
    return null
  }
}

export function WatchIt({ meta }: { meta: ScreenMeta }) {
  const rows = (meta?.availability ?? []).filter((r) => clean(r.region) && clean(r.platform))
  const adv = meta?.contentAdvisory
  const advItems = adv
    ? ([
        ['Language', adv.language],
        ['Violence', adv.violence],
        ['Sexual content', adv.sexualContent],
        ['Themes', adv.themes],
      ] as const).filter(([, v]) => clean(v))
    : []
  const trailerId = youtubeId(meta?.trailerUrl)
  if (!rows.length && !advItems.length && !clean(meta?.advisoryNote) && !clean(meta?.trailerUrl)) return null

  const title = clean(meta?.workTitle)
  const type = WORK_TYPE[clean(meta?.workType) ?? ''] ?? ''

  return (
    <aside className="watchit" aria-label="Where to watch">
      <p className="watchit-head">
        Watch it{title ? <>: <strong>{title}</strong></> : null}
        {type ? <span className="watchit-type"> · {type}</span> : null}
        {meta?.releaseDate ? <span className="watchit-type"> · released {fmt(meta.releaseDate)}</span> : null}
      </p>

      {rows.length > 0 && (
        <table className="watchit-table">
          <thead>
            <tr>
              <th scope="col">Where</th>
              <th scope="col">Platform</th>
              <th scope="col">Languages</th>
              <th scope="col">From</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={clean(r._key) ?? i}>
                <th scope="row">{clean(r.region)}</th>
                <td>{clean(r.platform)}</td>
                <td>{clean(r.languages) ?? ''}</td>
                <td>{fmt(r.releaseDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(advItems.length > 0 || clean(meta?.advisoryNote)) && (
        <p className="watchit-advisory">
          <strong>Content advisory:</strong>{' '}
          {advItems.map(([k, v]) => `${k} ${clean(v)}`).join(' · ')}
          {advItems.length && clean(meta?.advisoryNote) ? '. ' : ''}
          {clean(meta?.advisoryNote) ?? ''}
        </p>
      )}

      {trailerId ? (
        // The studio's own upload, embedded - nothing is copied or re-hosted.
        // youtube-nocookie keeps YouTube from setting cookies until play.
        <figure className="watchit-video">
          <div className="watchit-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerId}?rel=0`}
              title={`${title ?? 'Official'} trailer`}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <figcaption>Official trailer, embedded from YouTube</figcaption>
        </figure>
      ) : clean(meta?.trailerUrl) ? (
        <p className="watchit-trailer">
          <a href={clean(meta?.trailerUrl) ?? undefined} target="_blank" rel="noopener noreferrer">
            Watch the official trailer
          </a>
        </p>
      ) : null}
    </aside>
  )
}
