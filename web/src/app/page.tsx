import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import {
  HOME_ARCHIVE_STRIP_QUERY,
  HOME_COMPACT_QUERY,
  HOME_HERO_QUERY,
  HOME_RAIL_QUERY,
  HOME_SECTIONS_QUERY,
  HOME_TAIL_QUERY,
} from '@/sanity/queries'
import { urlFor, imgAlt, imgBlur } from '@/sanity/image'
import { clean } from '@/sanity/stega'
import { isSectionSlug } from '@/lib/sections'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { AdSlot } from '@/components/AdSlot'
import { Card, CardPlaceholder, ListRow, layoutPreview, padded } from '@/components/Card'
import { Newsletter } from '@/components/Newsletter'
import type { ArticleCardData } from '@/components/types'
import { defaultDescription, siteName, socialDescription, tagline } from '@/lib/site'

/**
 * The homepage was inheriting the layout's title template and nothing else -
 * no description of its own and no explicit canonical. `absolute` stops the
 * template appending " — 5Talents Magazine" to a title that already ends in it.
 *
 * The share image comes from app/opengraph-image.tsx, which Next applies to
 * every route that does not export one.
 */
export const metadata: Metadata = {
  title: { absolute: `${siteName} — ${tagline}` },
  description: defaultDescription,
  alternates: { canonical: '/' },
  // Next replaces the parent openGraph object wholesale rather than merging
  // into it, so siteName and locale have to be restated here or they vanish
  // from the page that most needs them. Same in [section]/[slug].
  openGraph: {
    type: 'website',
    siteName,
    locale: 'en_IN',
    title: `${siteName} — ${tagline}`,
    description: socialDescription,
    url: '/',
  },
  twitter: { card: 'summary_large_image', description: socialDescription },
}

/**
 * Homepage.
 *
 * Structure adapted from relevantmagazine.com, measured 28 Aug 2026. Their
 * homepage runs to 18,263px and reduces to a repeating pattern:
 *
 *     leaderboard
 *     masthead
 *     three portrait hero cards          (396 x 520)
 *     leaderboard
 *     five compact cards + right rail    (216 x 144)
 *     leaderboard  ->  "The Latest"
 *     leaderboard  ->  section block     (one feature + three standard)
 *     leaderboard  ->  section block
 *     ...
 *     long tail of list rows
 *     leaderboard
 *     footer
 *
 * A leaderboard immediately before every section heading is the whole ad
 * strategy, and it is worth copying. The typography, palette and card styling
 * stay ours - the density comes from them, the voice does not.
 */

type SectionBlock = {
  name?: string | null
  slug?: string | null
  description?: string | null
  articles?: ArticleCardData[] | null
}

export default async function HomePage() {
  const [hero, compact, sections, rail, tail, issues] = await Promise.all([
    sanityFetch({ query: HOME_HERO_QUERY }),
    sanityFetch({ query: HOME_COMPACT_QUERY }),
    sanityFetch({ query: HOME_SECTIONS_QUERY }),
    sanityFetch({ query: HOME_RAIL_QUERY }),
    sanityFetch({ query: HOME_TAIL_QUERY }),
    sanityFetch({ query: HOME_ARCHIVE_STRIP_QUERY }),
  ])

  const heroCards = padded((hero.data ?? []) as ArticleCardData[], 3)
  const compactCards = padded((compact.data ?? []) as ArticleCardData[], 5)
  const railCards = ((rail.data ?? []) as ArticleCardData[]).slice(0, 5)
  const tailCards = padded((tail.data ?? []) as ArticleCardData[], layoutPreview ? 6 : 0)

  const blocks = ((sections.data ?? []) as SectionBlock[]).filter((s) =>
    isSectionSlug(clean(s.slug) ?? ''),
  )

  return (
    <>
      {/* Gutter skyscrapers, fixed in the dead margin either side of the
          measure. CSS hides them entirely below 1500px wide or 740px tall -
          they are never shrunk into a narrow screen. */}
      <AdSlot slot="I" className="gutter gutter--left" />
      <AdSlot slot="J" className="gutter gutter--right" />

      {/* Slot A. Off in siteSettings by default - an above-fold leaderboard is
          the most reliable way to wreck LCP. Relevant runs one here anyway. */}
      <div className="wrap adband">
        <AdSlot slot="A" />
      </div>

      <SiteHeader />

      <main>
        {/* ---- Hero: three portrait cards ------------------------------- */}
        <section className="wrap hero-row" aria-label="Featured">
          <div className="grid-3">
            {heroCards.map((article, i) =>
              article ? (
                <Card
                  key={article._id}
                  article={article}
                  shape="portrait"
                  /* All three are above the fold on a desktop, so any of them
                     can be the LCP. Only the first is above the fold on a
                     phone, where grid-3 collapses to one column. So: preload
                     the first, load the other two eagerly but without a
                     preload competing for a phone's first bytes. */
                  priority={i === 0}
                  eager={i > 0}
                  showDeck={false}
                />
              ) : (
                <CardPlaceholder key={`hero-${i}`} shape="portrait" />
              ),
            )}
          </div>
        </section>

        <div className="wrap adband">
          <AdSlot slot="F" />
        </div>

        {/* ---- The Latest + rail ---------------------------------------- */}
        <div className="wrap rail-layout">
          <section aria-labelledby="latest-head">
            <div className="sechead">
              <h2 className="brush-rule" id="latest-head">
                The latest
              </h2>
            </div>
            <div className="grid-compact">
              {compactCards.map((article, i) =>
                article ? (
                  <Card key={article._id} article={article} shape="compact" showDeck={false} />
                ) : (
                  <CardPlaceholder key={`compact-${i}`} shape="compact" />
                ),
              )}
            </div>
          </section>

          <aside className="rail" aria-label="More from 5Talents">
            <div className="rail__sticky">
              <div className="sechead">
                <h2 className="brush-rule">Most read</h2>
              </div>
              {railCards.length > 0 ? (
                <ol className="listrows">
                  {railCards.map((article, i) => (
                    <ListRow key={article._id} article={article} rank={i + 1} />
                  ))}
                </ol>
              ) : (
                <p className="empty">Nothing published yet.</p>
              )}

              {/* Slot D (300x600) used to sit here. A skyscraper under a short
                  Most-read list left more empty rail than list, and an unsold
                  one is just a hole. Bring it back when there is an advertiser
                  for it — and consider 300x250 rather than 300x600, which is
                  the size the rail actually has room for. */}
            </div>
          </aside>
        </div>

        {/* ---- Section blocks ------------------------------------------- */}
        {blocks.map((block) => {
          // One lead card plus a 2x2 grid beside it.
          const articles = padded(block.articles ?? [], layoutPreview ? 5 : 0)
          if (articles.length === 0) return null
          const slug = clean(block.slug)

          return (
            <div key={slug}>
              <div className="wrap adband">
                <AdSlot slot="F" />
              </div>

              <section className="wrap section-block" aria-labelledby={`sec-${slug}`}>
                <div className="sechead">
                  <h2 className="brush-rule" id={`sec-${slug}`}>
                    {block.name}
                  </h2>
                  <Link href={`/${slug}`}>
                    All {block.name?.toLowerCase()} <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <div className="section-grid">
                  <div className="section-grid__lead">
                    {articles[0] ? (
                      <Card article={articles[0]} shape="feature" showSection={false} />
                    ) : (
                      <CardPlaceholder shape="feature" />
                    )}
                    {block.description && <p className="section-desc">{block.description}</p>}
                  </div>
                  <div className="section-grid__rest">
                    {articles.slice(1).map((article, i) =>
                      article ? (
                        <Card
                          key={article._id}
                          article={article}
                          shape="standard"
                          showSection={false}
                          showDeck={false}
                        />
                      ) : (
                        <CardPlaceholder key={`${slug}-${i}`} shape="standard" />
                      ),
                    )}
                  </div>
                </div>
              </section>
            </div>
          )
        })}

        <Newsletter />

        {/* ---- Archive strip -------------------------------------------- */}
        {(issues.data ?? []).length > 0 && (
          <section className="archive">
            <div className="wrap">
              <div className="sechead">
                <h2 className="brush-rule">From the archive</h2>
                <Link href="/archive">
                  All 18 issues <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="covers">
                {(issues.data ?? []).map((issue) => (
                  <figure key={issue._id}>
                    <Link href={`/archive/${clean(issue.slug)}`}>
                      {issue.coverImage?.asset?.url && (
                        <Image
                          src={urlFor(issue.coverImage).width(320).url()}
                          alt={imgAlt(issue.coverImage, `${clean(issue.title) ?? ''} cover`)}
                          width={160}
                          height={222}
                          sizes="160px"
                          placeholder={imgBlur(issue.coverImage) ? 'blur' : 'empty'}
                          blurDataURL={imgBlur(issue.coverImage)}
                        />
                      )}
                      <figcaption>{issue.title}</figcaption>
                    </Link>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---- Long tail ------------------------------------------------ */}
        {tailCards.length > 0 && (
          <section className="wrap section-block" aria-labelledby="more-head">
            <div className="sechead">
              <h2 className="brush-rule" id="more-head">
                More from 5Talents
              </h2>
            </div>
            <ol className="listrows listrows--tail">
              {tailCards.map((article, i) =>
                article ? (
                  <ListRow key={article._id} article={article} />
                ) : (
                  <li className="listrow listrow--placeholder" key={`tail-${i}`}>
                    <div className="listrow__frame" />
                    <div>
                      <h3 className="listrow__title">A headline of roughly this length</h3>
                      <p className="listrow__meta">Section · Byline</p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </section>
        )}

        <div className="wrap adband">
          <AdSlot slot="F" />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
