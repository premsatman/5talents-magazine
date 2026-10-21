import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { freshClient } from '@/sanity/client'
import { REWIND_EPISODE_QUERY, REWIND_EPISODE_SLUGS_QUERY, REWIND_SHOW_QUERY } from '@/sanity/queries'
import { clean } from '@/sanity/stega'
import { cloudinaryUrl } from '@/sanity/media'
import { CompactHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ShareBar } from '@/components/ShareBar'
import { EpisodeMedia } from '@/components/EpisodeMedia'
import { ListenOn } from '@/components/Rewind'
import { youtubeId } from '@/components/WatchIt'
import { absoluteUrl, siteName } from '@/lib/site'
import { formatDate, metaDescription } from '@/lib/format'
import {
  REWIND_PATH,
  episodeHref,
  formatClock,
  isoDuration,
  minutesLabel,
  parseTimestamp,
  transcriptParagraphs,
  type Chapter,
  type EpisodeCardData,
  type ShowData,
} from '@/lib/podcast'

type Props = { params: Promise<{ slug: string }> }

type EpisodeData = EpisodeCardData & {
  chapters?: Chapter[] | null
  shorts?: (string | null)[] | null
  transcript?: string | null
  credits?: string | null
  prev?: { number?: number | null; title?: string | null; slug?: string | null } | null
  next?: { number?: number | null; title?: string | null; slug?: string | null } | null
}

export async function generateStaticParams() {
  const rows = ((await freshClient.fetch(REWIND_EPISODE_SLUGS_QUERY)) ?? []) as { slug?: string | null }[]
  return rows.filter((r) => r.slug).map((r) => ({ slug: r.slug as string }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const { data } = await sanityFetch({ query: REWIND_EPISODE_QUERY, params: { slug }, stega: false })
  const ep = data as EpisodeData | null
  if (!ep) return {}
  // "| 5Talents Rewind #1" is added here, not typed into the title, so the
  // apps (which print the show name themselves) do not show it twice.
  const title = `${ep.title} | 5Talents Rewind #${ep.number}`
  const description = ep.summary ? metaDescription(ep.summary) : undefined
  const image = ep.cover?.url ? cloudinaryUrl(ep.cover.url, 1200, 630) : undefined
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: episodeHref(slug) },
    openGraph: {
      type: 'video.episode',
      siteName,
      locale: 'en_IN',
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function EpisodePage(props: Props) {
  const { slug } = await props.params
  const [{ data }, { data: showData }] = await Promise.all([
    sanityFetch({ query: REWIND_EPISODE_QUERY, params: { slug } }),
    sanityFetch({ query: REWIND_SHOW_QUERY }),
  ])
  const ep = data as EpisodeData | null
  if (!ep) notFound()
  const show = showData as ShowData

  const videoId = youtubeId(ep.youtubeUrl)
  const audioUrl = clean(ep.audio?.url)
  const duration = ep.audio?.duration ?? null
  const url = absoluteUrl(episodeHref(slug))
  const showName = clean(show?.title) ?? '5Talents Rewind'

  // Cleaned on the server: the chapter list is a client component, and
  // stega-encoded slugs would end up in its links.
  const chapters: Chapter[] = (ep.chapters ?? []).map((c) => ({
    _key: clean(c._key),
    start: clean(c.start),
    title: c.title,
    article: c.article?.slug
      ? {
          title: c.article.title,
          slug: clean(c.article.slug),
          section: clean(c.article.section),
          deck: c.article.deck,
        }
      : null,
  }))

  const paragraphs = transcriptParagraphs(ep.transcript)
  const shorts = (ep.shorts ?? [])
    .map((s) => youtubeId(s))
    .filter((id): id is string => Boolean(id))

  /**
   * PodcastEpisode with the video attached. Google reads VideoObject for the
   * video results and key moments; the chapters become Clips so the key
   * moments come from our timestamps rather than Google's guesses.
   */
  const thumb = ep.cover?.url ? cloudinaryUrl(clean(ep.cover.url) as string, 1280, 720) : undefined
  const clips = chapters
    .map((c, i) => {
      const startOffset = parseTimestamp(c.start)
      const nextStart = chapters[i + 1] ? parseTimestamp(chapters[i + 1].start) : duration ?? undefined
      return {
        '@type': 'Clip',
        name: clean(c.title),
        startOffset,
        ...(nextStart ? { endOffset: nextStart } : {}),
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}&t=${startOffset}` : `${url}`,
      }
    })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    '@id': `${url}#episode`,
    name: clean(ep.title),
    description: clean(ep.summary) ?? undefined,
    url,
    episodeNumber: ep.number,
    datePublished: clean(ep.publishedAt),
    inLanguage: 'hi-IN',
    timeRequired: isoDuration(duration),
    partOfSeries: { '@type': 'PodcastSeries', '@id': absoluteUrl(`${REWIND_PATH}#series`), name: showName, url: absoluteUrl(REWIND_PATH) },
    publisher: { '@id': absoluteUrl('/#organization') },
    ...(audioUrl
      ? { associatedMedia: { '@type': 'MediaObject', contentUrl: audioUrl, encodingFormat: 'audio/mpeg', duration: isoDuration(duration) } }
      : {}),
    ...(videoId
      ? {
          video: {
            '@type': 'VideoObject',
            name: clean(ep.title),
            description: clean(ep.summary) ?? clean(ep.title),
            thumbnailUrl: thumb ?? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            uploadDate: clean(ep.publishedAt),
            duration: isoDuration(duration),
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            ...(clips.length > 0 ? { hasPart: clips } : {}),
          },
        }
      : {}),
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: showName, item: absoluteUrl(REWIND_PATH) },
      { '@type': 'ListItem', position: 3, name: clean(ep.title) ?? slug, item: url },
    ],
  }

  return (
    <>
      <CompactHeader />
      <main>
        <div className="col episode">
          <p className="rewind-kicker episode__kicker">
            <Link href={REWIND_PATH}>◀◀ {showName}</Link>
            {' · '}Episode {ep.number}
            {duration ? ` · ${minutesLabel(duration)}` : ''}
            {ep.publishedAt ? ` · ${formatDate(clean(ep.publishedAt))}` : ''}
          </p>
          <h1 className="episode__title">{ep.title}</h1>
          {ep.summary && <p className="episode__summary">{ep.summary}</p>}

          <EpisodeMedia videoId={videoId} title={clean(ep.title) ?? showName} chapters={chapters} />

          {audioUrl && (
            <section className="episode-audio" aria-labelledby="audio-head">
              <h2 id="audio-head">Sirf sunna hai? Audio only</h2>
              {/* preload="none": the file is 7 MB and most visitors watch. */}
              <audio controls preload="none" src={audioUrl}>
                <a href={audioUrl}>Download the MP3</a>
              </audio>
              <p className="note">
                {duration ? `${formatClock(duration)} · ` : ''}
                <a href={audioUrl} download>
                  Download MP3
                </a>
              </p>
            </section>
          )}

          <section className="episode-follow" aria-label="Follow the show">
            <p className="episode-follow__head">Follow {showName}</p>
            <ListenOn show={show} compact />
          </section>

          <ShareBar url={url} title={`${clean(ep.title)} | ${showName} #${ep.number}`} deck={ep.summary} />

          {shorts.length > 0 && (
            <section className="episode-shorts" aria-labelledby="shorts-head">
              <h2 id="shorts-head">Shorts from this episode</h2>
              <ul>
                {shorts.map((id) => (
                  <li key={id}>
                    <div className="episode-shorts__frame">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                        title="5Talents Rewind short"
                        loading="lazy"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {paragraphs.length > 0 && (
            <details className="episode-transcript">
              <summary>
                <h2>Transcript</h2>
                <span className="note">Hinglish, lightly edited from the captions</span>
              </summary>
              {paragraphs.map((p, i) => (
                <p key={i}>
                  {p.at && <span className="episode-transcript__at">{p.at}</span>}
                  {p.text}
                </p>
              ))}
            </details>
          )}

          {ep.credits && <p className="note episode-credits">{ep.credits}</p>}

          {(ep.prev?.slug || ep.next?.slug) && (
            <nav className="episode-pager" aria-label="More episodes">
              {ep.prev?.slug ? (
                <Link href={episodeHref(ep.prev.slug)}>
                  <span className="note">← Episode {ep.prev.number}</span>
                  {ep.prev.title}
                </Link>
              ) : (
                <span />
              )}
              {ep.next?.slug && (
                <Link href={episodeHref(ep.next.slug)} className="episode-pager__next">
                  <span className="note">Episode {ep.next.number} →</span>
                  {ep.next.title}
                </Link>
              )}
            </nav>
          )}
        </div>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbJsonLd]) }}
      />
    </>
  )
}
