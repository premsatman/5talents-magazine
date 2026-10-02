import { OutboundLink } from '@/components/OutboundLink'
import { tagUrl } from '@/lib/outbound'

/**
 * Sources, and where to find the people the piece is about.
 *
 * Both render after the body. Sources are the evidence for the piece and are
 * linked exactly as published. Find them is a reader service: every way to
 * reach the organisation, in one place, so nobody has to go searching.
 *
 * Types are hand-written: these fields arrive through ARTICLE_EXTRAS_QUERY,
 * which is not in types.generated.ts until typegen is next run.
 */
export type Source = {
  _key: string
  title?: string | null
  publisher?: string | null
  url?: string | null
}

export type FindThemData = {
  name?: string | null
  note?: string | null
  paid?: boolean | null
  website?: string | null
  tickets?: string | null
  appAndroid?: string | null
  appIos?: string | null
  instagram?: string | null
  facebook?: string | null
  x?: string | null
  youtube?: string | null
  whatsapp?: string | null
} | null | undefined

const LINKS: { key: keyof NonNullable<FindThemData>; label: string }[] = [
  { key: 'website', label: 'Website' },
  { key: 'tickets', label: 'Tickets / register' },
  { key: 'appAndroid', label: 'Android app' },
  { key: 'appIos', label: 'iPhone app' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

export function Sources({ sources, slug }: { sources?: (Source | null)[] | null; slug: string }) {
  const items = (sources ?? []).filter((s): s is Source => Boolean(s?.title))
  if (items.length === 0) return null

  return (
    <section className="sources" aria-labelledby="sources-head">
      <h2 id="sources-head">Sources</h2>
      <ol>
        {items.map((s) => (
          <li key={s._key}>
            {s.url ? (
              <OutboundLink href={s.url} placement="sources" kind="source" slug={slug}>
                {s.title}
              </OutboundLink>
            ) : (
              s.title
            )}
            {s.publisher ? `, ${s.publisher}` : ''}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function FindThem({ data, slug }: { data: FindThemData; slug: string }) {
  if (!data) return null
  const links = LINKS.map((l) => ({ ...l, url: data[l.key] as string | null | undefined })).filter(
    (l): l is { key: keyof NonNullable<FindThemData>; label: string; url: string } =>
      typeof l.url === 'string' && l.url.length > 0,
  )
  if (links.length === 0) return null

  // Money behind the listing changes what the links are. Google asks for
  // rel="sponsored" on paid links, and the reader is told before they click.
  const rel = data.paid ? 'noopener noreferrer sponsored nofollow' : 'noopener noreferrer'

  return (
    <aside className="findthem" aria-labelledby="findthem-head">
      <h2 id="findthem-head">{data.name ? `Find ${data.name}` : 'Find them'}</h2>
      {data.note && <p>{data.note}</p>}
      <p className="endcard-buttons">
        {links.map((l) => (
          <OutboundLink
            key={l.key}
            className="btn endcard-btn"
            href={tagUrl(l.url, slug)}
            placement="find-them"
            kind={l.key}
            slug={slug}
            rel={rel}
          >
            {l.label}
          </OutboundLink>
        ))}
      </p>
      {data.paid && <p className="note endcard-disclosure">This listing is a paid placement.</p>}
    </aside>
  )
}
