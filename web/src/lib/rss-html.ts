import { stegaClean } from 'next-sanity'
import { urlFor, type ImageLike } from '@/sanity/image'
import { cloudinaryUrl, type ExternalImage } from '@/sanity/media'
import { absoluteUrl } from '@/lib/site'

/**
 * Portable Text to plain HTML, for <content:encoded> in the RSS feed.
 *
 * Written by hand rather than with @portabletext/to-html because the body uses
 * only a handful of block types, and feed readers want the simplest markup
 * there is: no classes, no ads, no iframes, every URL absolute. Anything a
 * reader cannot render (an Instagram embed) becomes a plain link instead.
 *
 * The block types handled here are the whole of studio/schemaTypes/
 * blockContent.ts: block, image, externalImage, instagramEmbed, verse,
 * editorsNote, pullQuote. Add a member there and it silently vanishes from the
 * feed until it is added below.
 */

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // &#39; rather than &apos;: this same text goes inside <content:encoded>,
    // which readers parse as HTML, and &apos; is not an HTML4 entity.
    .replace(/'/g, '&#39;')
}

/** CDATA cannot contain "]]>", so split it across two sections. */
export function cdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

const esc = (value: unknown) => (typeof value === 'string' ? escapeXml(stegaClean(value)) : '')

type Span = { _type?: string; text?: string; marks?: string[] }
type MarkDef = { _key?: string; _type?: string; href?: string }
type Block = {
  _type?: string
  style?: string
  listItem?: string
  level?: number
  children?: Span[]
  markDefs?: MarkDef[]
  [key: string]: unknown
}

function href(raw?: string) {
  const value = stegaClean(raw) ?? ''
  if (!value) return ''
  if (/^(https?:|mailto:|tel:)/.test(value)) return value
  return absoluteUrl(value)
}

const SIMPLE_MARKS: Record<string, string> = {
  strong: 'strong',
  em: 'em',
  underline: 'u',
  'strike-through': 's',
  code: 'code',
  highlight: 'mark',
}

function spans(block: Block) {
  const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]))
  return (block.children ?? [])
    .map((span) => {
      let html = esc(span.text).replace(/\n/g, '<br/>')
      for (const mark of span.marks ?? []) {
        const tag = SIMPLE_MARKS[mark]
        if (tag) {
          html = `<${tag}>${html}</${tag}>`
          continue
        }
        const def = defs.get(mark)
        if (def?._type === 'link') {
          const url = href(def.href)
          if (url) html = `<a href="${escapeXml(url)}">${html}</a>`
        }
      }
      return html
    })
    .join('')
}

/**
 * The MIME type to declare for a feed image.
 *
 * Both generated paths below end at JPEG. Only a non-Cloudinary external URL
 * passes through untouched, and declaring a PNG as image/jpeg is how an
 * enclosure gets rejected, so read the extension in that one case.
 */
export function feedImageType(url: string): string {
  const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

/** Lead and body pictures, at a size feed readers display well. */
export function feedImageUrl(
  sanity: ImageLike,
  external: ExternalImage,
  width = 1200,
  height?: number,
): string | null {
  const url = stegaClean(external?.url)
  if (url) {
    // f_jpg rather than f_auto: the feed declares image/jpeg, and a reader
    // that gets WebP back from an "auto" URL may refuse it.
    return /res\.cloudinary\.com/.test(url)
      ? cloudinaryUrl(url, width, height, external?.width ?? undefined).replace('f_auto', 'f_jpg')
      : url
  }
  if (!sanity?.asset?.url) return null
  const builder = height
    ? urlFor(sanity).width(width).height(height).fit('crop')
    : urlFor(sanity).width(width)
  // urlFor() adds auto=format, which overrides fm=jpg and serves WebP to any
  // client that asks for it. The feed promises JPEG, so drop it here. The
  // builder always appends auto last, after at least w=, so removing it never
  // leaves the query string without its leading "?".
  return builder.format('jpg').url().replace(/[?&]auto=format/, '')
}

function figure(src: string | null, alt: unknown, caption: unknown, credit: unknown) {
  if (!src) return ''
  const line = [stegaClean(caption), stegaClean(credit)]
    .filter((p) => typeof p === 'string' && p.length > 0)
    .join(' · ')
  return `<figure><img src="${escapeXml(src)}" alt="${esc(alt)}"/>${
    line ? `<figcaption>${escapeXml(line)}</figcaption>` : ''
  }</figure>`
}

function blockHtml(block: Block): string {
  const type = stegaClean(block._type)
  switch (type) {
    case 'block': {
      const inner = spans(block)
      if (!inner.trim()) return ''
      const style = stegaClean(block.style) ?? 'normal'
      if (/^h[1-6]$/.test(style)) {
        // The feed item's own title is the h1, so body headings start at h2.
        const level = Math.max(2, Number(style.slice(1)))
        return `<h${level}>${inner}</h${level}>`
      }
      if (style === 'blockquote') return `<blockquote><p>${inner}</p></blockquote>`
      return `<p>${inner}</p>`
    }
    case 'image': {
      const img = block as unknown as ImageLike & { alt?: string; caption?: string; credit?: string }
      return figure(feedImageUrl(img, null, 1200), img?.alt, img?.caption, img?.credit)
    }
    case 'externalImage': {
      const img = block as unknown as NonNullable<ExternalImage>
      return figure(feedImageUrl(null, img, 1200), img.alt, img.caption, img.credit)
    }
    case 'verse':
    case 'pullQuote': {
      const text = type === 'verse' ? block.text : block.quote
      return `<blockquote><p>${esc(text)}</p>${
        block.attribution ? `<cite>${esc(block.attribution)}</cite>` : ''
      }</blockquote>`
    }
    case 'editorsNote':
      return `<p><strong>Editor’s note:</strong> ${esc(block.text)}</p>`
    case 'instagramEmbed': {
      const url = href(block.url as string | undefined)
      if (!url) return ''
      return `<p><a href="${escapeXml(url)}">${esc(block.caption) || 'View the post on Instagram'}</a></p>`
    }
    default:
      return ''
  }
}

export function portableTextToHtml(value: unknown): string {
  const blocks = (Array.isArray(value) ? value : []) as Block[]
  const out: string[] = []
  let list: string | null = null

  for (const block of blocks) {
    const item = stegaClean(block.listItem)
    const tag = item ? (item === 'number' ? 'ol' : 'ul') : null

    if (list && list !== tag) {
      out.push(`</${list}>`)
      list = null
    }
    if (tag) {
      if (!list) {
        out.push(`<${tag}>`)
        list = tag
      }
      out.push(`<li>${spans(block)}</li>`)
      continue
    }
    const html = blockHtml(block)
    if (html) out.push(html)
  }
  if (list) out.push(`</${list}>`)

  return out.join('\n')
}
