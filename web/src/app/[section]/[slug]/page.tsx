import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { freshClient } from '@/sanity/client'
import {
  ARTICLE_FALLBACK_RELATED_QUERY,
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
import { CompactHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ReadingProgress } from '@/components/ReadingProgress'
import { PortableBody } from '@/components/PortableBody'
import { SponsorLabel, isSponsored } from '@/components/SponsorLabel'
import { AdSlot } from '@/components/AdSlot'
import { ShareBar } from '@/components/ShareBar'
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
    title,
    description,
    alternates: { canonical: articleHref(section, slug) },
    robots: data.seo?.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': kind === 'review' ? 'Review' : 'Article',
    headline: article.title,
    description: article.seo?.description ?? article.deck ?? undefined,
    datePublished: article.publishedAt,
    author: (article.authors ?? []).map((a) => ({ '@type': 'Person', name: a?.name })),
    publisher: { '@type': 'Organization', name: siteName },
    mainEntityOfPage: absoluteUrl(articleHref(section, slug)),
    image: article.hero?.asset?.url ? [article.hero.asset.url] : undefined,
    isAccessibleForFree: true,
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

              <PortableBody value={article.body} />

              <ShareBar url={shareUrl} title={article.title ?? ''} deck={article.deck} />

              <AdSlot slot="E" />

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

              <AdSlot slot="D" />
            </div>
          </aside>
        </div>

      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
