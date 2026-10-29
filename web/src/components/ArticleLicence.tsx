import { siteName } from '@/lib/site'

export const CC_BY_ND = 'https://creativecommons.org/licenses/by-nd/4.0/'

/**
 * Values the `licence` field on the article document can hold.
 *
 * Anything else - including the field being absent, which is the case for
 * every article written before it existed - falls through to the author's
 * copyright. That direction is deliberate: a CC licence cannot be recalled
 * once a copy is out, so the safe default is the restrictive one. See the
 * field's own note in studio/schemaTypes/article.ts.
 */
export type Licence = 'author' | 'cc-by-nd'

export function isOpenLicensed(licence?: string | null) {
  return licence === 'cc-by-nd'
}

/**
 * The copyright line at the foot of an article.
 *
 * Two notices, because the magazine holds two different positions. Our own
 * writing is given away on purpose - CC BY-ND lets anyone republish it whole,
 * with credit, which is how a small magazine travels. A contributor's piece is
 * theirs; we publish it with permission and say so, and anyone who wants it
 * elsewhere asks them, not us.
 *
 * Images are excluded from the CC grant in so many words. Photographs here are
 * frequently licensed to 5Talents for this use alone, and a blanket licence
 * over the page would be granting away rights we were never given.
 *
 * The year comes from the article's own publish date. A notice that read
 * "© 2026" over a piece from 2013 would be claiming a term that starts in the
 * wrong decade.
 */
export function ArticleLicence({
  licence,
  authors,
  publishedAt,
}: {
  licence?: string | null
  authors: (string | null | undefined)[]
  publishedAt?: string | null
}) {
  const names = authors.filter(Boolean) as string[]
  if (names.length === 0 || !publishedAt) return null

  const year = new Date(publishedAt).getFullYear()
  if (!Number.isFinite(year)) return null

  const byline =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

  if (isOpenLicensed(licence)) {
    return (
      <aside className="licence">
        <p>
          © {year} {byline}, {siteName}. This article is licensed under{' '}
          <a href={CC_BY_ND} rel="license noopener noreferrer" target="_blank">
            CC BY-ND 4.0
          </a>
          : you may republish it free of charge, with credit and a link to the original,
          without changes. Images are not covered by this licence.
        </p>
      </aside>
    )
  }

  return (
    <aside className="licence">
      <p>
        © {year} {byline}. Published by {siteName} with the author&rsquo;s permission.
        Please contact the author before republishing.
      </p>
    </aside>
  )
}
