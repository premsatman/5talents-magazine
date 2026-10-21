/**
 * next/image loader: let Cloudinary and Sanity resize their own pictures.
 *
 * Until 21 Oct 2026 every picture went through Vercel's image optimiser, which
 * fetched an already-resized, already-compressed copy from Cloudinary or the
 * Sanity CDN and converted it a second time. On a cold cache that second
 * conversion was the slowest step of the page: PageSpeed put the lead picture
 * of the Sadhu Sundar Singh article at 5.7 s on a phone. Both CDNs resize,
 * crop and pick the format per browser themselves, so the browser now asks
 * them directly at the width it needs - one hop, served from their edge.
 *
 * The URL coming in has already been shaped by cloudinaryUrl() or urlFor(),
 * which set the crop and aspect ratio. This loader only changes the width for
 * each srcset entry and scales the height with it, so the crop is unchanged at
 * every size.
 *
 * Anything else (a local /public file, an unknown host) is returned as it is.
 */
type LoaderArgs = { src: string; width: number; quality?: number }

const CLOUDINARY_MARKER = '/image/upload/'

function cloudinary(src: string, width: number): string {
  const i = src.indexOf(CLOUDINARY_MARKER)
  if (i === -1) return src
  const head = src.slice(0, i + CLOUDINARY_MARKER.length)
  let tail = src.slice(i + CLOUDINARY_MARKER.length)

  let params: string[] = []
  const slash = tail.indexOf('/')
  if (slash > -1) {
    const first = tail.slice(0, slash)
    if (first.includes(',') || /^(c|w|h|f|q|g|dpr)_/.test(first)) {
      params = first.split(',')
      tail = tail.slice(slash + 1)
    }
  }

  const get = (k: string) => {
    const p = params.find((x) => x.startsWith(`${k}_`))
    return p ? Number(p.slice(k.length + 1)) : undefined
  }
  const w0 = get('w')
  const h0 = get('h')
  const rest = params.filter((p) => !/^(w|h|f|q|dpr)_/.test(p))
  if (!rest.some((p) => p.startsWith('c_'))) rest.unshift('c_limit')

  const out = [
    ...rest,
    `w_${width}`,
    w0 && h0 ? `h_${Math.round((h0 * width) / w0)}` : null,
    'f_auto',
    'q_auto',
  ].filter(Boolean)

  return `${head}${out.join(',')}/${tail}`
}

function sanity(src: string, width: number, quality?: number): string {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return src
  }
  const w0 = Number(url.searchParams.get('w')) || 0
  const h0 = Number(url.searchParams.get('h')) || 0
  url.searchParams.set('w', String(width))
  if (w0 && h0) url.searchParams.set('h', String(Math.round((h0 * width) / w0)))
  url.searchParams.set('q', String(quality ?? 75))
  if (!url.searchParams.has('auto')) url.searchParams.set('auto', 'format')
  return url.toString()
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.startsWith('https://res.cloudinary.com/')) return cloudinary(src, width)
  if (src.startsWith('https://cdn.sanity.io/')) return sanity(src, width, quality)
  return src
}
