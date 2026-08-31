import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { NAV_SECTIONS_QUERY, SECTION_ARTICLES_QUERY, SECTION_QUERY } from '@/sanity/queries'
import { clean } from '@/sanity/stega'
import { SECTION_SLUGS, isSectionSlug } from '@/lib/sections'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Card } from '@/components/Card'
import { HeroSync } from '@/components/HeroSync'
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

  const [meta, list, nav] = await Promise.all([
    sanityFetch({ query: SECTION_QUERY, params: { slug: section } }),
    sanityFetch({ query: SECTION_ARTICLES_QUERY, params: { slug: section } }),
    sanityFetch({ query: NAV_SECTIONS_QUERY, stega: false }),
  ])

  if (!meta.data) notFound()
  const articles = (list.data ?? []) as ArticleCardData[]

  // Structure adapted from relevantmagazine.com/faith-2/, measured 30 Aug 2026:
  // a centred section title with its sibling links under it, a row of large
  // overlay cards, then the rest as a plain grid. Their row is a carousel; this
  // is three static cards that share one photograph, because a carousel hides
  // two thirds of what it holds and costs the JavaScript to do it.
  const featured = articles.slice(0, 3)
  const rest = articles.slice(3)

  // Siblings, minus the page we are on. Restricted to the route allowlist, so a
  // section that exists in Sanity but is not deployed cannot produce a dead link.
  const siblings = (nav.data ?? []).filter((s) => {
    const slug = clean(s.slug) ?? ''
    return slug !== section && isSectionSlug(slug)
  })

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap sectionhead">
          <h1>{meta.data.name}</h1>
          {meta.data.description && <p className="sectionhead__deck">{meta.data.description}</p>}

          {siblings.length > 0 && (
            <nav className="sectionhead__siblings" aria-label="Other sections">
              {siblings.map((s) => (
                <Link key={clean(s.slug)} href={`/${clean(s.slug)}`}>
                  {s.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {articles.length === 0 ? (
          <div className="wrap">
            <p className="empty">Nothing published in this section yet.</p>
          </div>
        ) : (
          <>
            <HeroSync articles={featured} label={`Latest in ${meta.data.name}`} />

            {rest.length > 0 && (
              <>
                <div className="wrap adband">
                  <AdSlot slot="F" />
                </div>

                <section className="wrap" aria-labelledby="more-head">
                  <div className="sechead">
                    <h2 className="brush-rule" id="more-head">
                      More from {meta.data.name}
                    </h2>
                  </div>
                  {/* Was `grid g3` - neither class exists in globals.css, so this
                      had never gridded and every card stacked in one column. */}
                  <div className="grid-cards">
                    {rest.map((article) => (
                      <Card key={article._id} article={article} showSection={false} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        <div className="wrap adband">
          <AdSlot slot="F" />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
