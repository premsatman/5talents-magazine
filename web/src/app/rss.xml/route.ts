import { freshClient } from '@/sanity/client'
import { FEED_QUERY } from '@/sanity/queries'
import { buildFeed, feedHeaders, type FeedArticle } from '@/lib/rss-feed'

/**
 * Blueprint s7: do not skip RSS. It is how aggregators, feed readers and
 * email-digest tooling pick up a magazine.
 *
 * The whole magazine, newest first. Per-section feeds live at
 * /[section]/rss.xml and are built by the same builder.
 */

/**
 * Without this the feed is frozen at build time and never updates again.
 *
 * A route handler that takes no request argument and reads no dynamic API is
 * statically evaluated once during the build, and App Router then serves that
 * one snapshot forever. freshClient makes no difference: it is only called
 * during that single build-time evaluation.
 *
 * This happened in production. On 19 November 2026 this feed's lastBuildDate
 * still read 20 October and its newest item was a month old, while the site
 * had published daily throughout. The per-section feeds were worse, frozen at
 * 12 October. Since the nine Pinterest boards and the Flipboard magazines all
 * auto-publish from these feeds, they carried nothing for four to five weeks
 * and nothing anywhere reported an error.
 *
 * Checked at the same time and genuinely fine, so left alone: news-sitemap.xml
 * and rewind/feed.xml. Do not "fix" those.
 *
 * Five minutes matches the article route. Feeds are cheap and crawlers hit
 * them often, so ISR is the right trade rather than force-dynamic.
 */
export const revalidate = 300
export async function GET() {
  const articles = ((await freshClient.fetch(FEED_QUERY)) ?? []) as unknown as FeedArticle[]

  return new Response(buildFeed({ articles }), { headers: feedHeaders })
}
