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
