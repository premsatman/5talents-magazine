import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { freshClient } from '@/sanity/client'
import { TAG_ARTICLES_QUERY, TAG_QUERY, TAG_SLUGS_QUERY } from '@/sanity/queries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArticleCard } from '@/components/ArticleCard'
import type { ArticleCardData } from '@/components/types'

type Props = { params: Promise<{ tag: string }> }

export async function generateStaticParams() {
  const tags = await freshClient.fetch(TAG_SLUGS_QUERY)
  return (tags ?? []).filter((t) => t.slug).map((t) => ({ tag: t.slug as string }))
}

/**
 * A tag page earns a place in the index at three articles.
 *
 * Below that it says nothing the section index does not already say, and the
 * thin ones were the bulk of what Google had parked in "Discovered — currently
 * not indexed". noindex,follow rather than a 404 or a removal: the page is
 * still useful to a reader who clicks the tag, and follow keeps the links out
 * of it passing to the articles. Already-crawled thin tags drop out of the
 * index on their own once Google sees this.
 *
 * The same floor is applied in SITEMAP_QUERY, which keeps them out of
 * sitemap.xml. Change both together.
 */
const INDEXABLE_FROM = 3

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { tag } = await props.params
  const { data } = await sanityFetch({ query: TAG_QUERY, params: { slug: tag }, stega: false })
  if (!data) return {}
  return {
    title: data.name ?? tag,
    description: data.description ?? `Everything 5Talents has published on ${data.name}.`,
    alternates: { canonical: `/tags/${tag}` },
    // Overrides the root layout's index:true for this route only.
    ...((data.articleCount ?? 0) < INDEXABLE_FROM
      ? { robots: { index: false, follow: true } }
      : {}),
  }
}

export default async function TagPage(props: Props) {
  const { tag } = await props.params
  const [meta, list] = await Promise.all([
    sanityFetch({ query: TAG_QUERY, params: { slug: tag } }),
    sanityFetch({ query: TAG_ARTICLES_QUERY, params: { slug: tag } }),
  ])
  if (!meta.data) notFound()
  const articles = (list.data ?? []) as ArticleCardData[]

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>{meta.data.name}</h1>
          {meta.data.description && <p>{meta.data.description}</p>}
        </div>
        {articles.length === 0 ? (
          <p className="empty">Nothing tagged this yet.</p>
        ) : (
          <div className="grid-cards">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
