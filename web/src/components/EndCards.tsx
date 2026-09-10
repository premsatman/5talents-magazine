import Image from 'next/image'
import { clean } from '@/sanity/stega'
import { resolveMedia } from '@/sanity/media'
import type { ExternalImage } from '@/sanity/media'

/**
 * The contributor's own links, printed after the piece.
 *
 * Two things here are not cosmetic.
 *
 * `rel` on every outbound link: "noopener noreferrer" always, plus "sponsored
 * nofollow" wherever the card says a commission is earned. Google asks for the
 * sponsored value on any link with money behind it, and passing editorial
 * PageRank to a retailer is exactly what it is meant to prevent.
 *
 * The disclosure line: it is rendered from the same `affiliate` flag, right
 * under the card, before the reader clicks. Both ASCI in India and the US FTC
 * want it up-front rather than in a footer, so it cannot be a site-wide notice.
 */

type SpotifyCard = { _key: string; _type: 'spotifyCard'; url?: string | null; label?: string | null; compact?: boolean | null }
type YoutubeCard = { _key: string; _type: 'youtubeCard'; channelName?: string | null; url?: string | null; blurb?: string | null; cta?: string | null; avatar?: ExternalImage }
type BuyLink = { _key: string; label?: string | null; url?: string | null; affiliate?: boolean | null }
type BookCard = { _key: string; _type: 'bookCard'; title?: string | null; author?: string | null; blurb?: string | null; cover?: ExternalImage; links?: (BuyLink | null)[] | null }
type LinkCard = { _key: string; _type: 'linkCard'; title?: string | null; url?: string | null; blurb?: string | null; cta?: string | null; affiliate?: boolean | null; image?: ExternalImage }

export type EndCard = SpotifyCard | YoutubeCard | BookCard | LinkCard

const REL = 'noopener noreferrer'
const relFor = (affiliate?: boolean | null) => (affiliate ? `${REL} sponsored nofollow` : REL)

/**
 * open.spotify.com/track/ID -> open.spotify.com/embed/track/ID
 *
 * Handles the localised form Spotify hands out in some regions
 * (/intl-de/track/ID), the ?si= tracking parameter, and a URL that is already
 * an embed. Returns null on anything it does not recognise, so a bad paste
 * renders nothing rather than an empty grey frame.
 */
function spotifyEmbedSrc(raw: string): { src: string; tall: boolean } | null {
  let path: string
  try {
    path = new URL(raw).pathname
  } catch {
    return null
  }
  path = path.replace(/^\/intl-[a-z]{2}\//i, '/').replace(/^\/embed\//, '/')
  const match = path.match(/^\/(track|album|playlist|show|episode|artist)\/([A-Za-z0-9]+)/)
  if (!match) return null
  const [, type, id] = match
  return {
    src: `https://open.spotify.com/embed/${type}/${id}`,
    tall: type === 'album' || type === 'playlist' || type === 'show' || type === 'artist',
  }
}

function Disclosure() {
  return (
    <p className="note endcard-disclosure">
      This link earns the author or 5Talents a commission. It costs you nothing extra.
    </p>
  )
}

function Thumb({ image, alt, width, height }: { image: ExternalImage; alt: string; width: number; height?: number }) {
  const media = resolveMedia(null, image, { width, height })
  if (!media) return null
  return (
    <Image
      src={media.src}
      alt={media.alt || alt}
      width={media.width}
      height={media.height}
      className="endcard-thumb"
    />
  )
}

export function EndCards({ cards }: { cards?: (EndCard | null)[] | null }) {
  const items = (cards ?? []).filter(Boolean) as EndCard[]
  if (items.length === 0) return null

  return (
    <aside className="endcards" aria-label="From the contributor">
      <h2 className="endcards-head">Elsewhere</h2>

      {items.map((card) => {
        if (card._type === 'spotifyCard') {
          const url = clean(card.url)
          const embed = url ? spotifyEmbedSrc(url) : null
          if (!embed) return null
          const height = card.compact ? 152 : embed.tall ? 352 : 232
          return (
            <div className="endcard" key={card._key}>
              {card.label && <p className="endcard-kicker">{card.label}</p>}
              <iframe
                src={embed.src}
                title={clean(card.label) ?? 'Spotify player'}
                height={height}
                loading="lazy"
                allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                style={{ width: '100%', border: 0, borderRadius: '12px', display: 'block' }}
              />
            </div>
          )
        }

        if (card._type === 'youtubeCard') {
          const url = clean(card.url)
          if (!url) return null
          return (
            <div className="endcard endcard-row" key={card._key}>
              {card.avatar?.url && <Thumb image={card.avatar} alt="" width={88} height={88} />}
              <div>
                <p className="endcard-kicker">YouTube</p>
                <h3>{card.channelName}</h3>
                {card.blurb && <p>{card.blurb}</p>}
                <a className="btn endcard-btn" href={url} target="_blank" rel={REL}>
                  {card.cta || 'Visit the channel'}
                </a>
              </div>
            </div>
          )
        }

        if (card._type === 'bookCard') {
          const links = (card.links ?? []).filter((l): l is BuyLink => Boolean(l?.url))
          const paid = links.some((l) => l.affiliate)
          return (
            <div className="endcard endcard-row" key={card._key}>
              {card.cover?.url && <Thumb image={card.cover} alt={`${clean(card.title) ?? ''} cover`} width={120} />}
              <div>
                <p className="endcard-kicker">Book</p>
                <h3>{card.title}</h3>
                {card.author && <p className="note">by {card.author}</p>}
                {card.blurb && <p>{card.blurb}</p>}
                <p className="endcard-buttons">
                  {links.map((link) => (
                    <a
                      className="btn endcard-btn"
                      key={link._key}
                      href={clean(link.url) as string}
                      target="_blank"
                      rel={relFor(link.affiliate)}
                    >
                      {link.label}
                    </a>
                  ))}
                </p>
                {paid && <Disclosure />}
              </div>
            </div>
          )
        }

        const url = clean(card.url)
        if (!url) return null
        return (
          <div className="endcard endcard-row" key={card._key}>
            {card.image?.url && <Thumb image={card.image} alt="" width={120} />}
            <div>
              <h3>{card.title}</h3>
              {card.blurb && <p>{card.blurb}</p>}
              <a className="btn endcard-btn" href={url} target="_blank" rel={relFor(card.affiliate)}>
                {card.cta || 'Open'}
              </a>
              {card.affiliate && <Disclosure />}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
