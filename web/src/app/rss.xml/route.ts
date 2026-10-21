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
export async function GET() {
  const articles = ((await freshClient.fetch(FEED_QUERY)) ?? []) as unknown as FeedArticle[]

  return new Response(buildFeed({ articles }), { headers: feedHeaders })
}
