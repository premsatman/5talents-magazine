/**
 * Publisher of record.
 *
 * 5Talents has no publishing body. It is published by a person, which the ISSN
 * India detailed information document allows where no body exists, and the
 * consequence is that the publisher's name and complete Indian postal address
 * have to be displayed on the publication itself and match the ISSN
 * application form character for character.
 *
 * These types are hand-written rather than imported from types.generated.ts on
 * purpose: the components below are shared between the footer, the about page
 * and the editorial board page, whose queries each project a slightly
 * different shape, and a structural type lets all three pass without three
 * near-identical generated aliases.
 */

export type Publisher = {
  name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pinCode?: string | null
  country?: string | null
  email?: string | null
  mobile?: string | null
} | null | undefined

export type Particulars = {
  startYear?: number | null
  frequency?: string | null
  subject?: string | null
  languages?: Array<string | null> | null
  format?: string | null
  issnOnline?: string | null
  issnPrint?: string | null
} | null | undefined

/** Address parts in postal order, blanks dropped. */
export function publisherLines(publisher: Publisher): string[] {
  if (!publisher) return []
  const cityLine = [publisher.city, publisher.state, publisher.pinCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')

  return [publisher.address, cityLine, publisher.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
}

/**
 * The one-line imprint: "Published by X, address, city state PIN, country."
 *
 * Returns null rather than a half-built string when the name or the address is
 * missing, because a partial imprint is worse than none — it looks like the
 * requirement has been met when it has not.
 */
export function imprint(publisher: Publisher): string | null {
  const name = publisher?.name?.trim()
  const lines = publisherLines(publisher)
  if (!name || lines.length === 0) return null
  return `Published by ${name}, ${lines.join(', ')}.`
}
