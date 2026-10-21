import { clean } from '@/sanity/stega'
import type { ExternalImage } from '@/sanity/media'

/**
 * 5Talents Rewind - shared shapes and helpers for /rewind, the homepage block,
 * the "Covered on Rewind" card on articles and the podcast feed.
 *
 * Schema: studio/schemaTypes/podcast.ts. The show is one document with a
 * fixed id; this constant must match REWIND_SHOW_ID there.
 */
export const REWIND_SHOW_ID = 'podcast-rewind'
export const REWIND_PATH = '/rewind'
export const REWIND_FEED_PATH = '/rewind/feed.xml'

export function episodeHref(slug?: string | null) {
  const s = clean(slug)
  return s ? `${REWIND_PATH}/${s}` : REWIND_PATH
}

export type EpisodeAudio = {
  url?: string | null
  bytes?: number | null
  duration?: number | null
} | null

export type EpisodeCardData = {
  _id: string
  number?: number | null
  title?: string | null
  slug?: string | null
  publishedAt?: string | null
  summary?: string | null
  youtubeUrl?: string | null
  cover?: ExternalImage
  audio?: EpisodeAudio
}

export type ChapterArticle = {
  title?: string | null
  slug?: string | null
  section?: string | null
  deck?: string | null
} | null

export type Chapter = {
  _key?: string | null
  start?: string | null
  title?: string | null
  article?: ChapterArticle
}

export type ShowData = {
  title?: string | null
  tagline?: string | null
  description?: string | null
  cover?: ExternalImage
  language?: string | null
  ownerEmail?: string | null
  links?: {
    youtube?: string | null
    spotify?: string | null
    apple?: string | null
    amazon?: string | null
  } | null
} | null

/** "1:32" -> 92, "1:02:03" -> 3723. Anything unparseable is 0. */
export function parseTimestamp(value?: string | null): number {
  const v = clean(value)
  if (!v) return 0
  const parts = v.split(':').map((p) => Number.parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return 0
  return parts.reduce((total, n) => total * 60 + n, 0)
}

/** 441 -> "7:21", 3723 -> "1:02:03". The form a listener reads. */
export function formatClock(seconds?: number | null): string {
  const s = Math.max(0, Math.round(seconds ?? 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** 441 -> "7 min". Rounded up, so a 30-second clip never reads "0 min". */
export function minutesLabel(seconds?: number | null): string {
  if (!seconds) return ''
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

/** 441 -> "PT7M21S", the ISO 8601 form structured data wants. */
export function isoDuration(seconds?: number | null): string | undefined {
  if (!seconds) return undefined
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${sec || (!h && !m) ? `${sec}S` : ''}`
}

/** A YouTube watch link that starts at a given second. */
export function youtubeAt(id: string, seconds: number): string {
  return seconds > 0 ? `https://youtu.be/${id}?t=${seconds}` : `https://youtu.be/${id}`
}

/**
 * A square JPG of a Cloudinary image, for the podcast feed.
 *
 * Not cloudinaryUrl(): that asks for f_auto, and Apple Podcasts rejects WebP
 * and AVIF artwork. The feed needs a real JPG URL at a fixed size.
 */
export function squareJpg(url?: string | null, size = 3000): string | undefined {
  const u = clean(url)
  if (!u) return undefined
  const marker = '/image/upload/'
  const i = u.indexOf(marker)
  if (i === -1) return u
  let tail = u.slice(i + marker.length)
  const slash = tail.indexOf('/')
  if (slash > -1 && /[,]|^(c|w|h|f|q|g|dpr)_/.test(tail.slice(0, slash))) tail = tail.slice(slash + 1)
  return `${u.slice(0, i + marker.length)}c_fill,g_auto,w_${size},h_${size},f_jpg,q_auto/${tail.replace(/\.(webp|avif|png)$/i, '.jpg')}`
}

/**
 * Transcript text -> paragraphs, each with an optional start time.
 *
 * Editors mark a paragraph's start with "[1:32]" at its head (see the schema
 * description). Kept as plain text in Sanity rather than Portable Text: it is
 * pasted, cleaned and pasted again, and plain text survives that.
 */
export function transcriptParagraphs(text?: string | null): { at?: string; text: string }[] {
  const t = clean(text)
  if (!t) return []
  return t
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^\[((?:\d{1,2}:)?\d{1,2}:\d{2})\]\s*/)
      return m ? { at: m[1], text: p.slice(m[0].length) } : { text: p }
    })
}
