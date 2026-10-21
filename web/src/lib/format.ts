const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(value?: string | null): string {
  if (!value) return ''
  return dateFormatter.format(new Date(value))
}

export function formatMonth(value?: string | null): string {
  if (!value) return ''
  return monthFormatter.format(new Date(value))
}

export function joinNames(
  people?: readonly ({ name?: string | null } | null)[] | null,
): string {
  const names = (people ?? []).map((p) => p?.name).filter(Boolean) as string[]
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * A meta description cut to fit a search result. Google shows roughly 155-160
 * characters and Bing flags anything much shorter than ~110 as too thin, so
 * templates aim for 120-160 and this trims at a word boundary if they run over.
 */
export function metaDescription(text: string, max = 158): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\u2014-]+$/, '')}\u2026`
}
