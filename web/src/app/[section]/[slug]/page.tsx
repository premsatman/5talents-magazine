import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { freshClient } from '@/sanity/client'
import {
  ARTICLE_FALLBACK_RELATED_QUERY,
  ARTICLE_EXTRAS_QUERY,
  ARTICLE_PATHS_QUERY,
  ARTICLE_QUERY,
  ARTICLE_SEO_QUERY,
  ARTICLE_SIDEBAR_QUERY,
} from '@/sanity/queries'
import { urlFor, imgAlt, imgBlur, imgCaption } from '@/sanity/image'
import { cloudinaryUrl } from '@/sanity/media'
import { clean } from '@/sanity/stega'
import { isSectionSlug } from '@/lib/sections'
import { readingTimeLabel } from '@/lib/reading-time'
import { absoluteUrl, articleHref, siteName } from '@/lib/site'
import { formatDate, formatMonth, joinNames } from '@/lib/format'
import { Citation } from '@/components/Citation'
import { CompactHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ReadingProgress } from '@/components/ReadingProgress'
import { PortableBody } from '@/components/PortableBody'
import { SponsorLabel, isSponsored } from '@/components/SponsorLabel'
import { AdSlot } from '@/components/AdSlot'
import { ShareBar } from '@/components/ShareBar'
import { EndCards } from '@/components/EndCards'
import { FindThem, Sources, type FindThemData, type Source } from '@/components/FindThem'
import { ReadTracker } from '@/components/ReadTracker'
import { WatchIt } from '@/components/WatchIt'
import { ArticleHero, ArticleMeta } from '@/components/ArticleHero'
import { ListRow } from '@/components/Card'
import { NewsletterForm } from '@/components/NewsletterForm'
import type { ArticleCardData } from '@/components/types'

type Props = { params: Promise<{ section: string; slug: string }> }

export async function generateStaticParams() {
  // useCdn: false - never build the route list from a stale edge cache.
  const paths = await freshClient.fetch(ARTICLE_PATHS_QUERY)
  return (paths ?? [])
    .filter((p) => p.slug && p.section && isSectionSlug(p.section))
    .map((p) => ({ section: p.section as string, slug: p.slug as string }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { section, slug } = await props.params
  // stega: false is critical here - invisible Visual Editing characters must
  // never leak into <head>.
  const { data } = await sanityFetch({
    query: ARTICLE_SEO_QUERY,
    params: { section, slug },
    stega: false,
  })
  if (!data) return {}

  const title = data.seo?.title ?? data.title ?? undefined
  const description = data.seo?.description ?? data.deck ?? undefined

  // The fallback used to stop at hero.asset, which silently dropped the share
  // image for every article whose lead picture is hosted on Cloudinary - 11 of
  // the first 18. The order matches resolveMedia: an external URL beats an
  // upload, so the card shows the same picture as the page.
  //
  // Both sources are asked for 1200x630, the size every scraper crops to.
  const sized = (url: string) => `${url}?w=1200&h=630&fit=crop&auto=format`

  const image = data.seo?.ogImage?.asset?.url
    ? sized(data.seo.ogImage.asset.url)
    : data.heroExternal?.url
      ? cloudinaryUrl(data.heroExternal.url, 1200, 630)
      : data.hero?.asset?.url
        ? sized(data.hero.asset.url)
        : undefined

  return {
    // `absolute` drops the root layout's " — 5Talents Magazine" suffix on
    // articles only. The suffix costs 20 of the ~60 characters Google shows,
    // and spends them on a brand nobody searches for yet - so a headline gets
    // clipped before it reaches its subject. Section and standing pages keep
    // the suffix, where the brand is the point.
    title: title ? { absolute: title } : undefined,
    description,
    alternates: { canonical: articleHref(section, slug) },
    // Spread rather than `robots: ... : undefined`. Next merges metadata by
    // walking the keys the child object actually has, so a key present with the
    // value undefined is not "inherit" - it resolves to null and wipes the
    // parent's. That is why articles, alone on the site, emitted no robots meta
    // at all and so missed max-image-preview:large, while tag pages had it.
    // Absent the key, the root layout's value is inherited as intended.
    ...(data.seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'article',
      // Restated because Next replaces the layout's openGraph rather than
      // merging with it. Without these the card reads as anonymous.
      siteName,
      locale: 'en_IN',
      title: title ?? undefined,
      description,
      publishedTime: data.publishedAt ?? undefined,
      authors: (data.authors ?? []).map((a) => a?.name).filter(Boolean) as string[],
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function ArticlePage(props: Props) {
  const { section, slug } = await props.params
  if (!isSectionSlug(section)) notFound()

  const { data: article } = await sanityFetch({ query: ARTICLE_QUERY, params: { section, slug } })
  if (!article) notFound()

  const { data: sidebar } = await sanityFetch({
    query: ARTICLE_SIDEBAR_QUERY,
    params: { id: article._id },
  })
  const sidebarCards = (sidebar ?? []) as ArticleCardData[]

  let related = (article.related ?? []) as ArticleCardData[]
  if (related.length === 0) {
    const { data } = await sanityFetch({
      query: ARTICLE_FALLBACK_RELATED_QUERY,
      params: { id: article._id, section },
    })
    related = (data ?? []) as ArticleCardData[]
  }

  // Every one of these controls logic, so every one is cleaned first.
  const sponsored = isSponsored(article.sponsorTier)
  const kind = clean(article.kind)
  const coverType = clean(article.interviewMeta?.isCoverStory)
  const originalIssue = article.archiveMeta?.originalIssue
  const heroBlur = imgBlur(article.hero)
  const heroCaption = imgCaption(article.hero)

  const shareUrl = absoluteUrl(articleHref(section, slug))

  /**
   * The lead image for structured data.
   *
   * This used to read `article.hero?.asset?.url` alone, which meant any piece
   * using the Cloudinary path emitted no image at all - and heroExternal is the
   * path most of the daily stream uses. Order matches the schema's own rule:
   * if a URL is set on heroExternal it wins and the upload is ignored.
   */
  const jsonLdImage = clean(article.heroExternal?.url) ?? article.hero?.asset?.url ?? undefined
  /**
   * Google's Article guidance asks for the lead image in three shapes -
   * 16:9, 4:3 and 1:1, each at least 1200px wide where the source allows - and
   * picks whichever fits the result it is drawing (desktop thumbnail, mobile
   * card, Discover). One 2:1 image often gets no thumbnail at all.
   */
  const jsonLdImages = (() => {
    const shapes: [number, number][] = [[1600, 900], [1600, 1200], [1200, 1200]]
    const ext = clean(article.heroExternal?.url)
    if (ext) {
      return /^https:\/\/res\.cloudinary\.com\//.test(ext)
        ? shapes.map(([w, h]) => cloudinaryUrl(ext, w, h))
        : [ext]
    }
    if (article.hero?.asset?.url) {
      return shapes.map(([w, h]) => urlFor(article.hero).width(w).height(h).fit('crop').url())
    }
    return undefined
  })()

  const adsOff = Boolean(article.sensitiveTopic)

  const { data: extrasData } = await sanityFetch({
    query: ARTICLE_EXTRAS_QUERY,
    params: { id: article._id },
    stega: false,
  })
  const extras = extrasData as {
    _updatedAt?: string | null
    contentUpdatedAt?: string | null
    sources?: (Source | null)[] | null
    findThem?: FindThemData
  } | null
  /**
   * dateModified reads the hand-set editorial revision date, never _updatedAt.
   *
   * _updatedAt is bumped by the automated internal-linking batch runs - at the
   * time of writing eighteen articles share a single four-second window - so as
   * a freshness signal it says only "a script touched this", which is worse
   * than saying nothing. When no editor has recorded a revision we fall back to
   * publishedAt, which is true.
   */
  const revisedAt = extras?.contentUpdatedAt
  const citations = (extras?.sources ?? [])
    .map((s) => s?.url)
    .filter((u): u is string => Boolean(u))
  const dateModified =
    typeof revisedAt === 'string' && article.publishedAt && revisedAt > article.publishedAt
      ? revisedAt
      : article.publishedAt

  // The daily stream and Screen coverage are news; everything else is a
  // magazine feature. Google treats NewsArticle as a subtype of Article, so
  // nothing is lost where it does not apply.
  const isNews = section === 'current' || section === 'screen'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': kind === 'review' ? 'Review' : isNews ? 'NewsArticle' : 'Article',
    headline: article.title,
    description: article.seo?.description ?? article.deck ?? undefined,
    datePublished: article.publishedAt,
    // Never earlier than publishedAt: a piece scheduled ahead is edited
    // before it goes live, and a modified date before the published one is
    // a contradiction Google flags.
    dateModified,
    author: (article.authors ?? []).map((a) => {
      const authorSlug = clean(a?.slug)
      return {
        '@type': 'Person',
        // The same node the contributor page emits, so the byline here and the
        // Person described there are one entity rather than two that happen to
        // share a name. Convention matches the homepage's /#organization and
        // /#website: the page URL plus a fragment naming the thing.
        '@id': authorSlug ? absoluteUrl(`/authors/${authorSlug}#person`) : undefined,
        name: a?.name,
        // Recommended by Google, and pointing each byline at its own page is
        // the same author-entity work that E-E-A-T rewards.
        url: authorSlug ? absoluteUrl(`/authors/${authorSlug}`) : undefined,
      }
    }),
    publisher: {
      '@type': 'Organization',
      // Joins the NewsMediaOrganization stated on the homepage.
      '@id': absoluteUrl('/#organization'),
      name: siteName,
      url: absoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/favicon/web-app-manifest-512x512.png'),
        width: 512,
        height: 512,
      },
    },
    articleSection: article.section?.name ?? undefined,
    citation: citations.length > 0 ? citations : undefined,
    inLanguage: 'en',
    mainEntityOfPage: absoluteUrl(articleHref(section, slug)),
    image: jsonLdImages ?? (jsonLdImage ? [jsonLdImage] : undefined),
    isAccessibleForFree: true,
    /**
     * Review rich results need the thing reviewed and a rating. Screen reviews
     * name a film or series; other reviews (books, albums) fall back to
     * CreativeWork. Emitted only when there is a title to name.
     */
    ...(kind === 'review' && (article.reviewMeta?.workTitle || article.screenMeta?.workTitle)
      ? {
          itemReviewed: {
            '@type': (() => {
              const t = clean(article.screenMeta?.workType ?? article.reviewMeta?.workType)
              if (t === 'film' || t === 'documentary') return 'Movie'
              if (t === 'series' || t === 'docuseries') return 'TVSeries'
              if (t === 'book') return 'Book'
              if (t === 'album') return 'MusicAlbum'
              return 'CreativeWork'
            })(),
            name: clean(article.reviewMeta?.workTitle ?? article.screenMeta?.workTitle),
          },
          ...(typeof article.reviewMeta?.rating === 'number'
            ? {
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: article.reviewMeta.rating,
                  bestRating: 5,
                  worstRating: 1,
                },
              }
            : {}),
        }
      : {}),
  }

  /**
   * Home -> Section -> Article.
   *
   * The site has no visible breadcrumb trail, but the URL hierarchy is real
   * (/screen/the-chosen-season-five) and this is what puts the section name in
   * the search result in place of the bare domain. The section name comes from
   * Sanity, cleaned, with the slug as the fallback so a missing name cannot
   * produce an empty crumb.
   */
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': absoluteUrl(`${articleHref(section, slug)}#breadcrumb`),
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: clean(article.section?.name) ?? section,
        item: absoluteUrl(`/${section}`),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: clean(article.title) ?? slug,
        item: absoluteUrl(articleHref(section, slug)),
      },
    ],
  }

  return (
    <>
      <ReadingProgress />
      <CompactHeader />

      <main>
        <ArticleHero article={article} />

        <div className="piece-layout">
          {/* Caption, section, deck, byline, share and provenance all live in
              the rail now, so the body opens immediately under the photograph.
              On a phone this block is ordered above the article rather than
              below it - see .piece-layout in globals.css. */}
          <div className="piece-meta">
            <ArticleMeta article={article}>
              {/* ISSN India detailed information document s7: publication name,
                  volume, issue, month and year on the first page of every
                  article. On a phone this rail sits above the body, so it is
                  the first thing under the headline either way. */}
              <Citation issue={article.onlineIssue} />

              <ShareBar url={shareUrl} title={article.title ?? ''} deck={article.deck} />

              {/* Blueprint s7: the original issue date shown prominently, with
                  publishedAt carrying the freshness signal. */}
              {originalIssue && (
                <p className="provenance">
                  First published in the{' '}
                  <Link href={`/archive/${clean(originalIssue.slug)}`}>{originalIssue.title}</Link>{' '}
                  issue
                  {article.archiveMeta?.originalPage
                    ? `, page ${article.archiveMeta.originalPage}`
                    : ''}
                  .
                  {/* Two dates, when there are two. A rewritten piece is the
                      2012 subject in 2026 words, and saying so is the whole
                      point of the column being rewritten rather than reprinted. */}
                  {article.archiveMeta?.rewrittenAt
                    ? ` Rewritten from primary sources in ${formatMonth(clean(article.archiveMeta.rewrittenAt))}.`
                    : ''}
                  {article.archiveMeta?.editNote ? ` ${article.archiveMeta.editNote}` : ''}
                </p>
              )}
            </ArticleMeta>
          </div>

          <div className="piece-main">
            <div className="col">
              {article.reviewMeta?.workTitle && (
                <p className="provenance">
                  Reviewing <strong>{article.reviewMeta.workTitle}</strong>
                  {article.reviewMeta.creator ? ` by ${article.reviewMeta.creator}` : ''}
                  {article.reviewMeta.year ? ` (${article.reviewMeta.year})` : ''}
                  {typeof article.reviewMeta.rating === 'number'
                    ? ` — ${article.reviewMeta.rating} out of 5`
                    : ''}
                </p>
              )}

              {section === 'screen' && (
                <WatchIt meta={article.screenMeta} hideVideo={Boolean(article.screenMeta?.trailerAsHero)} />
              )}

              <PortableBody value={article.body} seed={slug} section={section} adsOff={adsOff} />
              <ReadTracker slug={slug} section={section} />

              <Sources sources={extras?.sources} slug={slug} />

              <ShareBar url={shareUrl} title={article.title ?? ''} deck={article.deck} />

              {!adsOff && <AdSlot slot="E" seed={slug} section={section} />}

              {/* Between our ad and the author card: the contributor's own
                  links read as part of the byline furniture rather than as
                  more advertising. */}
              <FindThem data={extras?.findThem} slug={slug} />

              <EndCards cards={article.endCards} />

              {(article.authors ?? []).map((author, index) => (
                <div className="authorcard" key={author?.slug ?? index}>
                  <div className="avatar" aria-hidden="true">
                    {author?.photo?.asset?.url ? (
                      <Image
                        src={urlFor(author.photo).width(152).height(152).url()}
                        alt=""
                        width={76}
                        height={76}
                      />
                    ) : (
                      (author?.name ?? '')
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3>
                      {author?.slug ? (
                        <Link className="brush-link" href={`/authors/${clean(author.slug)}`}>
                          {author.name}
                        </Link>
                      ) : (
                        author?.name
                      )}
                    </h3>
                    {/* A contributor who has died. Stated plainly and once,
                        under the name, so a reader is not left writing to
                        somebody who cannot answer. */}
                    {author?.died && (
                      <p className="note">
                        <em>In memoriam. Died {formatDate(clean(author.died))}.</em>
                      </p>
                    )}
                    {author?.bio && <p>{author.bio}</p>}
                  </div>
                </div>
              ))}

              {(article.tags ?? []).length > 0 && (
                <p className="note" style={{ marginTop: 'var(--s-4)' }}>
                  {(article.tags ?? []).map((tag, index) => (
                    <span key={tag?.slug ?? index}>
                      {index > 0 && ' · '}
                      <Link href={`/tags/${clean(tag?.slug)}`}>{tag?.name}</Link>
                    </span>
                  ))}
                </p>
              )}

              {related.length > 0 && (
                <section className="related">
                  <h2>Read next</h2>
                  <ol>
                    {related.map((item) => (
                      <li key={item._id}>
                        <h3>
                          <Link
                            className="brush-link"
                            href={articleHref(clean(item.section?.slug), clean(item.slug))}
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="note">
                          {[item.section?.name, joinNames(item.authors)].filter(Boolean).join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>

          <aside className="piece-aside" aria-label="More from 5Talents">
            <div className="piece-aside__sticky">
              {sidebarCards.length > 0 && (
                <section>
                  <div className="sechead">
                    <h2 className="brush-rule">Most read</h2>
                  </div>
                  <ol className="listrows">
                    {sidebarCards.map((item, i) => (
                      <ListRow key={item._id} article={item} rank={i + 1} />
                    ))}
                  </ol>
                </section>
              )}

              <section className="asidebox">
                <h2>One good read, every Saturday</h2>
                <p>The cover story, two essays worth your time, and nothing else.</p>
                <NewsletterForm compact />
              </section>

              {!adsOff && <AdSlot slot="D" seed={slug} section={section} />}
            </div>
          </aside>
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
