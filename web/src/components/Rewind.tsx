import Image from 'next/image'
import Link from 'next/link'
import { clean } from '@/sanity/stega'
import { resolveMedia } from '@/sanity/media'
import { youtubeId } from '@/components/WatchIt'
import { formatDate } from '@/lib/format'
import {
  REWIND_FEED_PATH,
  REWIND_PATH,
  episodeHref,
  minutesLabel,
  parseTimestamp,
  youtubeAt,
  type EpisodeCardData,
  type ShowData,
} from '@/lib/podcast'

/**
 * 5Talents Rewind building blocks: the "listen on" buttons, an episode row,
 * the homepage block and the card at the foot of an article.
 */

const OUT = 'noopener noreferrer'

/** Every place the show can be followed. Empty links are skipped. */
export function ListenOn({ show, compact = false }: { show: ShowData; compact?: boolean }) {
  const links = show?.links
  const items = [
    ['YouTube', clean(links?.youtube)],
    ['Spotify', clean(links?.spotify)],
    ['Apple Podcasts', clean(links?.apple)],
    ['Amazon Music', clean(links?.amazon)],
  ].filter((x): x is [string, string] => Boolean(x[1]))

  return (
    <p className={`listenon${compact ? ' listenon--compact' : ''}`}>
      {items.map(([label, url]) => (
        <a key={label} className="btn endcard-btn" href={url} target="_blank" rel={OUT}>
          {label}
        </a>
      ))}
      {/* The feed is the one link that always exists - any podcast app can
          follow it, including the ones we have not submitted to. */}
      <a className="listenon__rss" href={REWIND_FEED_PATH}>
        RSS feed
      </a>
    </p>
  )
}

function EpisodeThumb({ episode, priority = false }: { episode: EpisodeCardData; priority?: boolean }) {
  const media = resolveMedia(null, episode.cover, { width: 960, height: 540 })
  if (!media) return <div className="rewind-thumb rewind-thumb--empty" aria-hidden="true" />
  return (
    <Image
      className="rewind-thumb"
      src={media.src}
      alt={media.alt}
      width={media.width}
      height={media.height}
      sizes="(max-width: 760px) 100vw, 480px"
      priority={priority}
    />
  )
}

function kicker(episode: EpisodeCardData) {
  return [
    episode.number ? `Episode ${episode.number}` : null,
    minutesLabel(episode.audio?.duration),
    formatDate(clean(episode.publishedAt)),
  ]
    .filter(Boolean)
    .join(' · ')
}

/** One episode in a list: picture, number, title, summary. */
export function EpisodeRow({ episode }: { episode: EpisodeCardData }) {
  const href = episodeHref(episode.slug)
  return (
    <li className="episoderow">
      <Link className="episoderow__media" href={href} tabIndex={-1} aria-hidden="true">
        <EpisodeThumb episode={episode} />
      </Link>
      <div>
        <p className="rewind-kicker">{kicker(episode)}</p>
        <h3 className="episoderow__title">
          <Link className="brush-link" href={href}>
            {episode.title}
          </Link>
        </h3>
        {episode.summary && <p className="episoderow__summary">{episode.summary}</p>}
      </div>
    </li>
  )
}

/**
 * The homepage block: the newest episode, large, with a way in to all of them.
 * Renders nothing until an episode is public.
 */
export function RewindLatest({ episode }: { episode: EpisodeCardData | null }) {
  if (!episode?._id) return null
  const href = episodeHref(episode.slug)
  const yt = youtubeId(episode.youtubeUrl)

  return (
    <section className="wrap section-block rewind-home" aria-labelledby="rewind-head">
      <div className="sechead">
        <h2 className="brush-rule" id="rewind-head">
          5Talents Rewind
        </h2>
        <Link href={REWIND_PATH}>
          All episodes <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="rewind-latest">
        <Link className="rewind-latest__media" href={href} tabIndex={-1} aria-hidden="true">
          <EpisodeThumb episode={episode} />
          <span className="rewind-play" aria-hidden="true">▶</span>
        </Link>
        <div>
          <p className="rewind-kicker">{kicker(episode)}</p>
          <h3 className="rewind-latest__title">
            <Link className="brush-link" href={href}>
              {episode.title}
            </Link>
          </h3>
          {episode.summary && <p>{episode.summary}</p>}
          <p className="listenon">
            <Link className="btn endcard-btn" href={href}>
              Watch or listen
            </Link>
            {yt && (
              <a className="listenon__rss" href={youtubeAt(yt, 0)} target="_blank" rel={OUT}>
                Open on YouTube
              </a>
            )}
          </p>
          <p className="note">Har hafte 5Talents ki khabrein, Hinglish mein, bina boring hue.</p>
        </div>
      </div>
    </section>
  )
}

export type ArticleEpisode = {
  _id: string
  number?: number | null
  title?: string | null
  slug?: string | null
  youtubeUrl?: string | null
  chapter?: { start?: string | null; title?: string | null } | null
}

/**
 * "Covered on 5Talents Rewind" - at the foot of an article that an episode
 * talked about. Says where in the episode the story starts and goes straight
 * there on YouTube.
 */
export function OnRewind({ episodes }: { episodes: ArticleEpisode[] }) {
  if (episodes.length === 0) return null
  return (
    <aside className="onrewind" aria-label="On 5Talents Rewind">
      {episodes.map((ep) => {
        const yt = youtubeId(ep.youtubeUrl)
        const at = parseTimestamp(ep.chapter?.start)
        return (
          <div key={ep._id} className="onrewind__item">
            <p className="onrewind__kicker">
              <span aria-hidden="true">◀◀ </span>Covered on 5Talents Rewind #{ep.number}
              {ep.chapter?.start ? `, at ${clean(ep.chapter.start)}` : ''}
            </p>
            <p className="onrewind__title">
              <Link className="brush-link" href={episodeHref(ep.slug)}>
                {ep.title}
              </Link>
            </p>
            <p className="listenon listenon--compact">
              {yt && (
                <a className="btn endcard-btn" href={youtubeAt(yt, at)} target="_blank" rel={OUT}>
                  Watch this story{at > 0 ? ` from ${clean(ep.chapter?.start)}` : ''}
                </a>
              )}
              <Link className="listenon__rss" href={episodeHref(ep.slug)}>
                Full episode, audio and transcript
              </Link>
            </p>
          </div>
        )
      })}
    </aside>
  )
}
