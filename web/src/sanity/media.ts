import { urlFor, imgAlt, imgBlur, imgCaption, type ImageLike } from './image'
import { clean } from './stega'

/**
 * One resolver for both image sources.
 *
 * A picture can arrive two ways: uploaded to Sanity, or hosted on Cloudinary
 * and referenced by URL (blueprint trigger 2 — asset storage is the likeliest
 * reason to outgrow the Sanity free plan). Components should not care which,
 * so everything goes through `resolveMedia` and comes back in one shape.
 *
 * Cloudinary URLs are rewritten with the size the slot actually needs rather
 * than served at full resolution. The transform used is:
 *
 *   c_lfill   "limited fill" - crops to fill the box but never scales the
 *             image up past its original size. c_fill would happily upscale,
 *             and the declared width is typed by hand, so it cannot be trusted
 *             to prevent that. This makes the guarantee in the URL itself.
 *   g_auto    auto-gravity — Cloudinary finds the subject, which is the
 *             equivalent of setting a Sanity hotspot, done for you
 *   f_auto    modern format (AVIF/WebP) where the browser supports it
 *   q_auto    quality chosen per image
 *
 * Deliberately no `dpr_`. The widths passed in are already about 2x the
 * rendered size — SHAPES in lib/media.ts is written that way — so adding a DPR
 * multiplier would double a second time and ask Cloudinary for a 4800px file to
 * fill a 1200px slot.
 *
 * The request is also clamped to the declared source width as a second line of
 * defence, but c_lfill is the one that actually holds.
 */

export type ExternalImage = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  caption?: string | null
  credit?: string | null
} | null | undefined

export type Media = {
  src: string
  width: number
  height: number
  alt: string
  caption: string
  blur?: string
  /** Intrinsic width of the original, for the hero's overlay decision. */
  sourceWidth: number
  from: 'sanity' | 'cloudinary' | 'url'
}

const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//

/**
 * Inserts a transform into a Cloudinary delivery URL, replacing any that is
 * already there. Editors are asked not to paste transforms, but they will.
 */
export function cloudinaryUrl(
  url: string,
  width: number,
  height?: number,
  sourceWidth?: number,
): string {
  const marker = '/image/upload/'
  const i = url.indexOf(marker)
  if (i === -1) return url

  const head = url.slice(0, i + marker.length)
  let tail = url.slice(i + marker.length)

  // Strip an existing transform segment. A version (v123456) or the public id
  // is what should follow /upload/, so anything containing a comma or a known
  // transform prefix before the first slash is a transform we are replacing.
  const firstSlash = tail.indexOf('/')
  if (firstSlash > -1) {
    const segment = tail.slice(0, firstSlash)
    if (/[,]/.test(segment) || /^(c_|w_|h_|f_|q_|g_|dpr_)/.test(segment)) {
      tail = tail.slice(firstSlash + 1)
    }
  }

  // Never ask for more than the original holds.
  const w = sourceWidth && sourceWidth > 0 ? Math.min(width, sourceWidth) : width
  const scale = w / width
  const h = height ? Math.round(height * scale) : undefined

  const transform = ['c_lfill', 'g_auto', `w_${Math.round(w)}`, h ? `h_${h}` : null, 'f_auto', 'q_auto']
    .filter(Boolean)
    .join(',')

  return `${head}${transform}/${tail}`
}

/**
 * Resolves whichever source is present to a single shape.
 *
 * The external URL wins when it is set. That is deliberate: pasting a URL is a
 * conscious act, and the alternative — an old upload quietly overriding the
 * link you just added — is the more surprising of the two behaviours.
 */
export function resolveMedia(
  sanityImage: ImageLike,
  external: ExternalImage,
  target: { width: number; height?: number },
): Media | null {
  const url = clean(external?.url)

  if (url) {
    const sourceWidth = external?.width ?? 0
    const sourceHeight = external?.height ?? 0
    const isCloudinary = CLOUDINARY.test(url)

    return {
      src: isCloudinary
        ? cloudinaryUrl(url, target.width, target.height, sourceWidth)
        : url,
      // Fall back to the target if dimensions were not supplied. The schema
      // asks for them; this stops a missing value breaking the page.
      width: target.width,
      height: target.height ?? (sourceWidth && sourceHeight
        ? Math.round((target.width * sourceHeight) / sourceWidth)
        : Math.round(target.width * 0.66)),
      alt: clean(external?.alt) ?? '',
      caption: [clean(external?.caption), clean(external?.credit)]
        .filter((p) => typeof p === 'string' && p.length > 0)
        .join(' · '),
      sourceWidth,
      from: isCloudinary ? 'cloudinary' : 'url',
    }
  }

  if (!sanityImage?.asset?.url) return null

  const builder = target.height
    ? urlFor(sanityImage).width(target.width).height(target.height)
    : urlFor(sanityImage).width(target.width)

  return {
    src: builder.url(),
    width: target.width,
    height: target.height ?? Math.round(target.width * 0.66),
    alt: imgAlt(sanityImage),
    caption: imgCaption(sanityImage),
    blur: imgBlur(sanityImage),
    sourceWidth: sanityImage.asset?.metadata?.dimensions?.width ?? 0,
    from: 'sanity',
  }
}
