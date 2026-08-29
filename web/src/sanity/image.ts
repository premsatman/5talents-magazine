import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { stegaClean } from 'next-sanity'
import { dataset, projectId } from './env'

const builder = createImageUrlBuilder({ projectId, dataset })

/** The shape the GROQ image fragment returns. Deliberately loose. */
export type ImageLike =
  | {
      asset?: {
        _id?: string | null
        _ref?: string | null
        url?: string | null
        metadata?: {
          lqip?: string | null
          /** Intrinsic size. The article hero uses it to decide whether the
              source is large enough to carry type over it. */
          dimensions?: { width?: number | null; height?: number | null } | null
        } | null
      } | null
      alt?: string | null
      caption?: string | null
      credit?: string | null
      hotspot?: unknown
      crop?: unknown
    }
  | null
  | undefined

/**
 * stegaClean is not optional here.
 *
 * With Visual Editing on, every string in a query result carries invisible
 * encoded characters. An asset _id or _ref carrying them builds a broken CDN
 * URL, so the image silently fails to load in edit mode only - the worst kind
 * of bug to track down.
 */
export function urlFor(source: ImageLike) {
  return builder
    .image(stegaClean(source) as SanityImageSource)
    .auto('format')
    .fit('max')
}

/** Alt text, cleaned - stega characters would otherwise be read out by a screen reader. */
export function imgAlt(source: ImageLike, fallback = ''): string {
  const alt = stegaClean(source?.alt)
  return typeof alt === 'string' && alt.length > 0 ? alt : fallback
}

/** Base64 blur placeholder, or undefined if the asset has no lqip. */
export function imgBlur(source: ImageLike): string | undefined {
  const lqip = stegaClean(source?.asset?.metadata?.lqip)
  return typeof lqip === 'string' && lqip.length > 0 ? lqip : undefined
}

export function hasImage(source: ImageLike): boolean {
  return Boolean(source?.asset?.url)
}

/** Cleaned caption/credit line for a figcaption. */
export function imgCaption(source: ImageLike): string {
  const caption = stegaClean(source?.caption)
  const credit = stegaClean(source?.credit)
  return [caption, credit].filter((part) => typeof part === 'string' && part.length > 0).join(' · ')
}
