import Image from 'next/image'
import Link from 'next/link'
import { resolveMedia } from '@/sanity/media'
import { clean } from '@/sanity/stega'
import { readingTimeLabel } from '@/lib/reading-time'
import { formatDate } from '@/lib/format'
import { articleHref } from '@/lib/site'
import { SponsorLabel, isSponsored } from './SponsorLabel'
import type { ArticleCardData } from './types'

/**
 * Section-page lead: three overlay cards.
 *
 * On a phone they stack and each card shows its own photograph. From 800px
 * they share one picture, sliced across the row with the gap left as paper.
 * Hovering (or focusing) a panel swaps the photograph on all three to that
 * panel's image. Each card keeps its own headline and link.
 *
 * The crop is requested as a single wide frame so the three desktop windows
 * read as one picture, not three copies of a portrait.
 */
const PHOTO = { width: 1800, height: 800 }

export function HeroSync({
  articles,
  label,
}: {
  articles: ArticleCardData[]
  label: string
}) {
  if (articles.length === 0) return null

  const photos = articles.map((article) =>
    resolveMedia(article.hero, article.heroExternal, PHOTO),
  )

  return (
    <section className="wrap hero-row" aria-label={label}>
      <div className="hero-sync" data-cols={articles.length}>
        {articles.map((article, index) => {
          const href = articleHref(clean(article.section?.slug), clean(article.slug))
          const sponsored = isSponsored(article.sponsorTier)

          return (
            <article
              key={article._id}
              className="card card--portrait card--overlay hero-sync__panel"
            >
              <Link className="card__overlaylink" href={href}>
                <div className="card__frame hero-sync__frame" style={{ aspectRatio: '3 / 4' }}>
                  {photos.map((media, photoIndex) =>
                    media ? (
                      <Image
                        key={articles[photoIndex]._id}
                        className={`hero-sync__photo hero-sync__photo--${photoIndex}`}
                        src={media.src}
                        alt=""
                        width={media.width}
                        height={media.height}
                        sizes="(max-width: 800px) 92vw, 1200px"
                        placeholder={media.blur ? 'blur' : 'empty'}
                        blurDataURL={media.blur}
                        priority={index === 0 && photoIndex === 0}
                      />
                    ) : null,
                  )}
                  <span className="card__scrim" aria-hidden="true" />
                  <span className="card__noise" aria-hidden="true" />

                  <div className="card__overlaybody">
                    {sponsored ? (
                      <SponsorLabel tier={article.sponsorTier} />
                    ) : (
                      article.section?.name && (
                        <span className="card__okicker">{article.section.name}</span>
                      )
                    )}

                    <h3 className="card__otitle">
                      <span className="card__otitle-base">{article.title}</span>
                      <span className="card__otitle-wipe" aria-hidden="true">
                        <span>{clean(article.title)}</span>
                      </span>
                    </h3>

                    <p className="card__ometa">
                      {[formatDate(article.publishedAt), readingTimeLabel(article.wordCount)]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
