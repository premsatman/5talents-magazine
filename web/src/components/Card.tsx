import Image from 'next/image'
import Link from 'next/link'
import { resolveMedia } from '@/sanity/media'
import { clean } from '@/sanity/stega'
import { readingTimeLabel } from '@/lib/reading-time'
import { formatDate } from '@/lib/format'
import { articleHref } from '@/lib/site'
import { SHAPES, type CardShape } from '@/lib/media'
import { SponsorLabel, isSponsored } from './SponsorLabel'
import type { ArticleCardData } from './types'

/**
 * The hero cards set their text over the photograph rather than under it -
 * kicker, headline and meta stacked and centred, the way Relevant does it.
 *
 * That only works with a scrim. White type straight onto a photograph is the
 * most common contrast failure on any magazine site, because a light patch
 * anywhere behind the headline breaks it. The gradient in globals.css lays a
 * flat wash over the whole frame plus a heavier foot, which holds white type at
 * AA against anything short of a blown-out sky.
 *
 * It also means these cards ignore light and dark mode: white on a darkened
 * photograph is correct in both.
 */
function OverlayCard({
  article,
  priority,
}: {
  article: ArticleCardData
  priority?: boolean
}) {
  const spec = SHAPES.portrait
  const href = articleHref(clean(article.section?.slug), clean(article.slug))
  const media = resolveMedia(article.hero, article.heroExternal, {
    width: spec.width,
    height: spec.height,
  })
  const sponsored = isSponsored(article.sponsorTier)

  return (
    <article className="card card--portrait card--overlay">
      <Link className="card__overlaylink" href={href}>
        <div className="card__frame" style={{ aspectRatio: spec.ratio }}>
          {media && (
            <Image
              src={media.src}
              alt={media.alt}
              width={media.width}
              height={media.height}
              sizes={spec.sizes}
              placeholder={media.blur ? 'blur' : 'empty'}
              blurDataURL={media.blur}
              priority={priority}
            />
          )}
          <span className="card__scrim" aria-hidden="true" />
          <span className="card__noise" aria-hidden="true" />

          <div className="card__overlaybody">
            {sponsored ? (
              <SponsorLabel tier={article.sponsorTier} />
            ) : (
              article.section?.name && <span className="card__okicker">{article.section.name}</span>
            )}

            {/* Two layers. The base is the headline exactly as it reads at
                rest — its colour never changes. The wipe is a duplicate in ink
                on yellow, clipped to zero width and opened left to right on
                hover, so each letter flips as the highlight reaches it and
                nothing is ever dark type on a dark photograph.

                The duplicate is clean()ed so only the base carries stega and
                click-to-edit still resolves to one node. */}
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
}

/**
 * One card component, five shapes. Which shape a card takes is a layout
 * decision made by the page, never by the article - so the same piece can be
 * the portrait hero on the homepage and a standard card in its section without
 * anything in the data changing.
 */
export function Card({
  article,
  shape = 'standard',
  showSection = true,
  showDeck = true,
  priority = false,
}: {
  article: ArticleCardData
  shape?: CardShape
  showSection?: boolean
  showDeck?: boolean
  priority?: boolean
}) {
  // The hero shape is a different composition, not a different size.
  if (shape === 'portrait') return <OverlayCard article={article} priority={priority} />

  const spec = SHAPES[shape]
  const href = articleHref(clean(article.section?.slug), clean(article.slug))
  const sponsored = isSponsored(article.sponsorTier)
  const media = resolveMedia(article.hero, article.heroExternal, {
    width: spec.width,
    height: spec.height,
  })

  return (
    <article className={`card card--${shape}${sponsored ? ' card--sponsored' : ''}`}>
      <Link className="card__media" href={href} tabIndex={-1} aria-hidden="true">
        {/* The box reserves its ratio whether or not an image loads, so a
            missing hero cannot shift the grid. */}
        <div className="card__frame" style={{ aspectRatio: spec.ratio }}>
          {media ? (
            <Image
              src={media.src}
              alt={media.alt}
              width={media.width}
              height={media.height}
              sizes={spec.sizes}
              placeholder={media.blur ? 'blur' : 'empty'}
              blurDataURL={media.blur}
              priority={priority}
            />
          ) : (
            <span className="card__noimage" aria-hidden="true">
              5T
            </span>
          )}
        </div>
      </Link>

      <div className="card__body">
        {sponsored ? (
          <SponsorLabel tier={article.sponsorTier} />
        ) : (
          showSection && article.section?.name && <span className="card__kicker">{article.section.name}</span>
        )}

        <h3 className="card__title">
          <Link className="brush-link" href={href}>
            {article.title}
          </Link>
        </h3>

        {showDeck && article.deck && <p className="card__deck">{article.deck}</p>}

        <p className="card__meta">
          {[
            article.authors?.[0]?.name,
            readingTimeLabel(article.wordCount),
            article.originalIssue?.title ? `${article.originalIssue.title} archive` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </article>
  )
}

/** A 90x90 thumbnail beside a headline. Used in the rail and the long tail. */
export function ListRow({ article, rank }: { article: ArticleCardData; rank?: number }) {
  const spec = SHAPES.thumb
  const href = articleHref(clean(article.section?.slug), clean(article.slug))
  const media = resolveMedia(article.hero, article.heroExternal, {
    width: spec.width,
    height: spec.height,
  })

  return (
    <li className="listrow">
      {typeof rank === 'number' && (
        <span className="listrow__rank" aria-hidden="true">
          {String(rank).padStart(2, '0')}
        </span>
      )}
      <Link className="listrow__media" href={href} tabIndex={-1} aria-hidden="true">
        <div className="listrow__frame">
          {media && (
            <Image
              src={media.src}
              alt=""
              width={media.width}
              height={media.height}
              sizes={spec.sizes}
            />
          )}
        </div>
      </Link>
      <div>
        <h3 className="listrow__title">
          <Link className="brush-link" href={href}>
            {article.title}
          </Link>
        </h3>
        <p className="listrow__meta">
          {[article.section?.name, article.authors?.[0]?.name].filter(Boolean).join(' · ')}
        </p>
      </div>
    </li>
  )
}

/**
 * Layout preview.
 *
 * With two articles in the dataset most of this page would render empty, and
 * you cannot judge a grid you cannot see. Set NEXT_PUBLIC_LAYOUT_PREVIEW=true
 * and empty slots fill with a labelled box at the right ratio.
 *
 * Off unless that variable is explicitly "true", so it can never reach a reader.
 */
export const layoutPreview = process.env.NEXT_PUBLIC_LAYOUT_PREVIEW === 'true'

export function CardPlaceholder({ shape = 'standard' }: { shape?: CardShape }) {
  const spec = SHAPES[shape]

  if (shape === 'portrait') {
    return (
      <article className="card card--portrait card--overlay card--placeholder">
        <div className="card__frame" style={{ aspectRatio: spec.ratio }}>
          <span className="card__noimage">
            {spec.width} × {spec.height}
            <br />
            3:4
          </span>
          <span className="card__scrim" aria-hidden="true" />
          <div className="card__overlaybody">
            <span className="card__okicker">Section</span>
            <h3 className="card__otitle">A cover headline, three lines at the very most</h3>
            <p className="card__ometa">28 August 2026 · 7 min read</p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={`card card--${shape} card--placeholder`}>
      <div className="card__frame" style={{ aspectRatio: spec.ratio }}>
        <span className="card__noimage">
          {spec.width} × {spec.height}
          <br />
          {spec.ratio.replace(' / ', ':')}
        </span>
      </div>
      <div className="card__body">
        <span className="card__kicker">Section</span>
        <h3 className="card__title">Headline sits here, two lines at most</h3>
        <p className="card__deck">
          The deck runs to about this length before it starts to crowd the card below it.
        </p>
        <p className="card__meta">Byline · 7 min read</p>
      </div>
    </article>
  )
}

/** Pads a list out to `count` with placeholders, in preview mode only. */
export function padded<T>(items: T[], count: number): (T | null)[] {
  if (!layoutPreview) return items
  const out: (T | null)[] = [...items]
  while (out.length < count) out.push(null)
  return out
}
