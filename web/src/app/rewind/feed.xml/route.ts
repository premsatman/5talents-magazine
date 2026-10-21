import { freshClient } from '@/sanity/client'
import { REWIND_FEED_QUERY } from '@/sanity/queries'
import { clean } from '@/sanity/stega'
import { cdata, escapeXml } from '@/lib/rss-html'
import { absoluteUrl, articleHref, siteName } from '@/lib/site'
import {
  REWIND_FEED_PATH,
  REWIND_PATH,
  episodeHref,
  formatClock,
  parseTimestamp,
  squareJpg,
  type Chapter,
  type EpisodeCardData,
  type ShowData,
} from '@/lib/podcast'
import { youtubeId } from '@/components/WatchIt'

/**
 * The 5Talents Rewind podcast feed.
 *
 * This one URL is what Spotify, Apple Podcasts, Amazon Music and YouTube
 * (Studio > Podcasts > RSS) are given. They poll it and pick up each new
 * episode on their own, so publishing an episode in Studio is the whole job.
 *
 * Tags follow Apple's podcast RSS requirements, which every other directory
 * accepts as well. Rules that bite if broken:
 *
 *   - <guid> must never change once published, or every app re-downloads the
 *     episode as new. It is the Sanity document id, which cannot change.
 *   - enclosure `length` must be the real byte count. Apple compares it.
 *   - artwork must be a square JPG or PNG, 1400-3000px. squareJpg() asks
 *     Cloudinary for exactly that; f_auto would hand Apple a WebP.
 *   - <itunes:explicit> is required and is "false" for this show.
 *   - <podcast:locked> stops anyone else importing the feed into another
 *     host under their name.
 *
 * Only episodes with an audio file appear. A video-only week stays on the
 * site and out of the apps.
 */

type FeedEpisode = EpisodeCardData & { chapters?: Chapter[] | null }

function showNotes(ep: FeedEpisode): string {
  const yt = youtubeId(ep.youtubeUrl)
  const page = absoluteUrl(episodeHref(clean(ep.slug)))
  const chapters = (ep.chapters ?? [])
    .map((c) => {
      const at = formatClock(parseTimestamp(clean(c.start)))
      const a = c.article
      const link =
        a?.slug && a.section
          ? ` - <a href="${escapeXml(absoluteUrl(articleHref(clean(a.section), clean(a.slug))))}?utm_source=podcast&amp;utm_medium=shownotes">read the story</a>`
          : ''
      return `<li>${at} ${escapeXml(clean(c.title) ?? '')}${link}</li>`
    })
    .join('')

  return [
    ep.summary ? `<p>${escapeXml(clean(ep.summary) ?? '')}</p>` : '',
    chapters ? `<p><strong>In this episode</strong></p><ul>${chapters}</ul>` : '',
    yt ? `<p>Watch it on YouTube: <a href="https://youtu.be/${yt}">https://youtu.be/${yt}</a></p>` : '',
    `<p>Episode page, transcript and every story: <a href="${page}">${page}</a></p>`,
    `<p>${escapeXml(siteName)}: <a href="${absoluteUrl('/')}">5talentsmag.com</a></p>`,
  ]
    .filter(Boolean)
    .join('\n')
}

function item(ep: FeedEpisode, artwork?: string): string {
  const audio = ep.audio
  const url = clean(audio?.url)
  if (!url || !audio?.bytes) return ''
  const page = absoluteUrl(episodeHref(clean(ep.slug)))
  const summary = clean(ep.summary) ?? ''
  return `    <item>
      <title>${escapeXml(clean(ep.title) ?? `Episode ${ep.number}`)}</title>
      <link>${page}</link>
      <guid isPermaLink="false">5talentsmag-rewind-${escapeXml(ep._id)}</guid>
      ${ep.publishedAt ? `<pubDate>${new Date(clean(ep.publishedAt) as string).toUTCString()}</pubDate>` : ''}
      <description>${cdata(showNotes(ep))}</description>
      <content:encoded>${cdata(showNotes(ep))}</content:encoded>
      <itunes:summary>${escapeXml(summary)}</itunes:summary>
      <enclosure url="${escapeXml(url)}" length="${Math.round(audio.bytes)}" type="audio/mpeg" />
      ${audio.duration ? `<itunes:duration>${Math.round(audio.duration)}</itunes:duration>` : ''}
      ${ep.number ? `<itunes:episode>${ep.number}</itunes:episode>` : ''}
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
      ${artwork ? `<itunes:image href="${escapeXml(artwork)}" />` : ''}
    </item>`
}

export async function GET() {
  const data = (await freshClient.fetch(REWIND_FEED_QUERY)) as unknown as {
    show: ShowData
    episodes: FeedEpisode[] | null
  } | null

  const show = data?.show
  const episodes = data?.episodes ?? []
  const title = clean(show?.title) ?? '5Talents Rewind'
  const description =
    clean(show?.description) ??
    'Har hafte 5Talents Magazine ki khabrein, Hinglish mein, bina boring hue.'
  const owner = clean(show?.ownerEmail) ?? 'editorial@5talentsmag.com'
  const artwork = squareJpg(show?.cover?.url, 3000)
  const link = absoluteUrl(REWIND_PATH)
  const newest = clean(episodes[0]?.publishedAt)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${link}</link>
    <atom:link href="${absoluteUrl(REWIND_FEED_PATH)}" rel="self" type="application/rss+xml" />
    <description>${cdata(description)}</description>
    <itunes:summary>${escapeXml(description)}</itunes:summary>
    <language>${escapeXml(clean(show?.language) ?? 'hi')}</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(siteName)}</copyright>
    <managingEditor>${escapeXml(`${owner} (${siteName})`)}</managingEditor>
    <webMaster>${escapeXml(`${owner} (${siteName})`)}</webMaster>
    <itunes:author>${escapeXml(siteName)}</itunes:author>
    <itunes:owner>
      <itunes:name>${escapeXml(siteName)}</itunes:name>
      <itunes:email>${escapeXml(owner)}</itunes:email>
    </itunes:owner>
    ${artwork ? `<itunes:image href="${escapeXml(artwork)}" />` : ''}
    ${artwork ? `<image><url>${escapeXml(artwork)}</url><title>${escapeXml(title)}</title><link>${link}</link></image>` : ''}
    <itunes:category text="Religion &amp; Spirituality">
      <itunes:category text="Christianity" />
    </itunes:category>
    <itunes:category text="News" />
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <podcast:locked owner="${escapeXml(owner)}">yes</podcast:locked>
    ${newest ? `<pubDate>${new Date(newest).toUTCString()}</pubDate>` : ''}
    ${newest ? `<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>` : ''}
${episodes.map((ep) => item(ep, artwork)).filter(Boolean).join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      /**
       * Five minutes at the edge, not the hour the article feeds use.
       *
       * On 21 Oct 2026 the first request after deploy cached an empty feed
       * for an hour, and Spotify's submission check read that copy and
       * reported "missing episodes". Podcast apps poll on their own schedule
       * anyway; what matters is that a newly published episode shows up here
       * within minutes.
       */
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
