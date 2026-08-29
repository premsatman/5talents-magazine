import Image from 'next/image'
import Link from 'next/link'
import { type ImageLike } from '@/sanity/image'
import { resolveMedia, type ExternalImage } from '@/sanity/media'
import { clean } from '@/sanity/stega'
import { readingTimeLabel } from '@/lib/reading-time'
import { formatDate } from '@/lib/format'
import { SponsorLabel, isSponsored } from './SponsorLabel'

/**
 * Article hero.
 *
 * Full-width photograph at the top with the headline, deck and byline set over
 * it — the same composition as the homepage lead cards, and as Relevant's
 * article pages.
 *
 * **It falls back on its own.** The overlay only runs when the source
 * photograph is at least MIN_OVERLAY_WIDTH across. The hero renders up to
 * 1200 CSS px wide, so anything smaller is being stretched, and a soft,
 * stretched photograph with white type over it looks worse than no photograph
 * at all. The 2012–14 archive shots are around 560×420 and will always take the
 * stacked treatment: same large image on top, headline underneath in the
 * measure, no scrim, nothing upscaled.
 *
 * That means the page gets better on its own as real photography arrives,
 * rather than needing anyone to remember to switch a setting.
 */
const MIN_OVERLAY_WIDTH = 1400

type HeroArticle = {
  title?: string | null
  deck?: string | null
  kind?: string | null
  publishedAt?: string | null
  sponsorTier?: string | null
  wordCount?: number | null
  hero?: ImageLike
  heroExternal?: ExternalImage
  section?: { name?: string | null; slug?: string | null } | null
  authors?: ({ name?: string | null; slug?: string | null } | null)[] | null
  interviewMeta?: { isCoverStory?: string | null } | null
  sponsor?: { name?: string | null } | null
}

export function Byline({ article }: { article: HeroArticle }) {
  const kind = clean(article.kind)
  return (
    <>
      {kind === 'interview' ? 'Interview by ' : ''}
      {(article.authors ?? []).map((author, index) => (
        <span key={author?.slug ?? index}>
          {index > 0 && ', '}
          {author?.slug ? (
            <Link href={`/authors/${clean(author.slug)}`}>{author.name}</Link>
          ) : (
            author?.name
          )}
        </span>
      ))}
      <span aria-hidden="true"> · </span>
      <time dateTime={article.publishedAt ?? undefined}>{formatDate(article.publishedAt)}</time>
      <span aria-hidden="true"> · </span>
      {readingTimeLabel(article.wordCount)}
    </>
  )
}

/**
 * Caption, section, deck and byline — everything that used to sit between the
 * photograph and the first paragraph. It now runs down the rail so the article
 * opens straight into its text.
 */
export function ArticleMeta({
  article,
  children,
}: {
  article: HeroArticle
  children?: React.ReactNode
}) {
  const wide = resolveMedia(article.hero, article.heroExternal, { width: 2400, height: 1200 })
  const caption = wide?.caption ?? ''
  const sponsored = isSponsored(article.sponsorTier)
  const coverType = clean(article.interviewMeta?.isCoverStory)
  const sectionSlug = clean(article.section?.slug)

  return (
    <div className="articlemeta">
      {caption && <p className="piecehero__caption">{caption}</p>}

      {sponsored ? (
        <SponsorLabel tier={article.sponsorTier} sponsor={article.sponsor} showNote />
      ) : (
        <span className="crumb">
          {coverType === 'cover' && 'Cover story · '}
          {coverType === 'talentSearch' && (
            <>
              <Link href="/talent-search">Talent search</Link> ·{' '}
            </>
          )}
          <Link href={`/${sectionSlug}`}>{article.section?.name}</Link>
        </span>
      )}

      {article.deck && <p className="deck">{article.deck}</p>}

      <p className="meta">
        <Byline article={article} />
      </p>

      {children}
    </div>
  )
}

export function ArticleHero({ article }: { article: HeroArticle }) {
  // One resolver for both sources - uploaded to Sanity, or hosted on
  // Cloudinary and referenced by URL. Everything below is source-agnostic.
  const wide = resolveMedia(article.hero, article.heroExternal, { width: 2400, height: 1200 })
  const width = wide?.sourceWidth ?? 0
  const overlay = Boolean(wide) && width >= MIN_OVERLAY_WIDTH

  /* ---- Overlay: headline over the photograph ------------------------- */
  if (overlay && wide) {
    return (
      <header className="piecehero piecehero--overlay">
        <div className="piecehero__frame">
          <Image
            src={wide.src}
            alt={wide.alt}
            width={wide.width}
            height={wide.height}
            sizes="100vw"
            placeholder={wide.blur ? 'blur' : 'empty'}
            blurDataURL={wide.blur}
            priority
          />
          <span className="piecehero__scrim" aria-hidden="true" />
          {/* The headline and nothing else. Section, deck and byline sit below
              the photograph, where they read at normal contrast and do not
              compete with it. Less type over a picture is almost always the
              right call - it keeps the image legible as an image. */}
          <div className="piecehero__copy">
            <h1>{article.title}</h1>
          </div>
        </div>
      </header>
    )
  }

  /* ---- Stacked: large image, headline underneath --------------------- */
  // Cap the display width at 1.3x the source. Letting a 560px archive photo
  // fill a 924px column was the exact stretching this fallback exists to
  // avoid - a smaller sharp image beats a large soft one every time. No forced
  // aspect ratio either: an archive photograph is shown at the shape it was
  // taken, not cropped to fit a slot.
  const cap = width ? Math.round(width * 1.3) : undefined
  const natural = resolveMedia(article.hero, article.heroExternal, {
    width: Math.min(Math.max(width * 2, 1200), 2000),
  })

  return (
    <header className="piecehero piecehero--stacked">
      {natural && (
        <figure className="piecehero__frame" style={cap ? { maxWidth: cap } : undefined}>
          <Image
            src={natural.src}
            alt={natural.alt}
            width={natural.width}
            height={natural.height}
            sizes={cap ? `(max-width: ${cap}px) 100vw, ${cap}px` : '100vw'}
            placeholder={natural.blur ? 'blur' : 'empty'}
            blurDataURL={natural.blur}
            priority
          />
        </figure>
      )}
      <div className="col">
        <h1>{article.title}</h1>
      </div>
    </header>
  )
}
