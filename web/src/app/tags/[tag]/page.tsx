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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { tag } = await props.params
  const { data } = await sanityFetch({ query: TAG_QUERY, params: { slug: tag }, stega: false })
  if (!data) return {}
  return {
    title: data.name ?? tag,
    description: data.description ?? `Everything 5Talents has published on ${data.name}.`,
    alternates: { canonical: `/tags/${tag}` },
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
