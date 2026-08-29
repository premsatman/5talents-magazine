import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { SECTION_ARTICLES_QUERY, SECTION_QUERY } from '@/sanity/queries'
import { SECTION_SLUGS, isSectionSlug } from '@/lib/sections'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArticleCard } from '@/components/ArticleCard'
import { AdSlot } from '@/components/AdSlot'
import type { ArticleCardData } from '@/components/types'

/**
 * Blueprint s7: the section route is constrained by an explicit allowlist plus
 * generateStaticParams. Anything outside the allowlist 404s immediately, so a
 * typo'd URL cannot generate a soft-404 - which matters for a site whose whole
 * SEO thesis is indexation.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return SECTION_SLUGS.map((section) => ({ section }))
}

type Props = { params: Promise<{ section: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { section } = await props.params
  if (!isSectionSlug(section)) return {}

  const { data } = await sanityFetch({
    query: SECTION_QUERY,
    params: { slug: section },
    stega: false,
  })
  if (!data) return {}

  return {
    title: data.name ?? section,
    description: data.description ?? undefined,
    alternates: { canonical: `/${section}` },
  }
}

export default async function SectionPage(props: Props) {
  const { section } = await props.params
  if (!isSectionSlug(section)) notFound()

  const [meta, list] = await Promise.all([
    sanityFetch({ query: SECTION_QUERY, params: { slug: section } }),
    sanityFetch({ query: SECTION_ARTICLES_QUERY, params: { slug: section } }),
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
          <p className="empty">Nothing published in this section yet.</p>
        ) : (
          <div className="grid g3">
            {articles.map((article, index) => (
              <ArticleCard
                key={article._id}
                article={article}
                showSection={false}
                priority={index === 0}
              />
            ))}
          </div>
        )}

        <AdSlot slot="F" />
      </main>
      <SiteFooter />
    </>
  )
}
