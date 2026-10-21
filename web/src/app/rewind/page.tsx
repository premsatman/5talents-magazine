import type { Metadata } from 'next'
import Image from 'next/image'
import { sanityFetch } from '@/sanity/live'
import { REWIND_EPISODES_QUERY, REWIND_SHOW_QUERY } from '@/sanity/queries'
import { clean } from '@/sanity/stega'
import { resolveMedia } from '@/sanity/media'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ListenOn, EpisodeRow } from '@/components/Rewind'
import { absoluteUrl, siteName } from '@/lib/site'
import { metaDescription } from '@/lib/format'
import { REWIND_FEED_PATH, REWIND_PATH, squareJpg, type EpisodeCardData, type ShowData } from '@/lib/podcast'

/**
 * /rewind - the show's home.
 *
 * Modelled on relevantmagazine.com/our-podcasts (checked 21 Oct 2026): square
 * cover, what the show is, where to follow it, then every episode newest
 * first. Theirs sends you to the apps; ours keeps the episode page on the
 * site, because each episode is built from our own articles and the episode
 * page is where the two meet.
 */

const FALLBACK_DESCRIPTION =
  'Har hafte 5Talents Magazine ki khabrein, Hinglish mein, bina boring hue. A weekly video podcast on Christian news, music, film and events, from Hyderabad.'

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await sanityFetch({ query: REWIND_SHOW_QUERY, stega: false })
  const show = data as ShowData
  const title = show?.title ?? '5Talents Rewind'
  const description = metaDescription(show?.description ?? FALLBACK_DESCRIPTION)
  const image = squareJpg(show?.cover?.url, 1200)
  return {
    title,
    description,
    alternates: {
      canonical: REWIND_PATH,
      // Lets podcast apps and feed readers find the feed from the page URL.
      types: { 'application/rss+xml': [{ url: REWIND_FEED_PATH, title }] },
    },
    openGraph: {
      type: 'website',
      siteName,
      locale: 'en_IN',
      title,
      description,
      url: REWIND_PATH,
      images: image ? [{ url: image, width: 1200, height: 1200 }] : undefined,
    },
  }
}

export default async function RewindPage() {
  const [showRes, episodesRes] = await Promise.all([
    sanityFetch({ query: REWIND_SHOW_QUERY }),
    sanityFetch({ query: REWIND_EPISODES_QUERY }),
  ])
  const show = showRes.data as ShowData
  const episodes = (episodesRes.data ?? []) as EpisodeCardData[]

  const title = show?.title ?? '5Talents Rewind'
  const cover = resolveMedia(null, show?.cover, { width: 640, height: 640 })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    '@id': absoluteUrl(`${REWIND_PATH}#series`),
    name: clean(title),
    description: clean(show?.description) ?? FALLBACK_DESCRIPTION,
    url: absoluteUrl(REWIND_PATH),
    webFeed: absoluteUrl(REWIND_FEED_PATH),
    image: squareJpg(show?.cover?.url, 1400),
    inLanguage: 'hi-IN',
    author: { '@id': absoluteUrl('/#organization') },
    publisher: { '@id': absoluteUrl('/#organization') },
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <header className="pagehead rewind-head">
          {cover && (
            <Image
              className="rewind-cover"
              src={cover.src}
              alt={cover.alt || `${clean(title)} cover art`}
              width={cover.width}
              height={cover.height}
              sizes="(max-width: 760px) 50vw, 240px"
              priority
            />
          )}
          <div>
            <p className="rewind-kicker">A weekly show from {siteName}</p>
            <h1>{title}</h1>
            {show?.tagline && <p className="rewind-tagline">{show.tagline}</p>}
            <p>{show?.description ?? FALLBACK_DESCRIPTION}</p>
            <ListenOn show={show} />
          </div>
        </header>

        {episodes.length === 0 ? (
          <p className="empty">The first episode is on its way.</p>
        ) : (
          <section aria-labelledby="episodes-head">
            <div className="sechead">
              <h2 className="brush-rule" id="episodes-head">
                All episodes
              </h2>
            </div>
            <ol className="episoderows">
              {episodes.map((episode) => (
                <EpisodeRow key={episode._id} episode={episode} />
              ))}
            </ol>
          </section>
        )}
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
