import Link from 'next/link'
import { formatMonth } from '@/lib/format'
import { clean } from '@/sanity/stega'

/**
 * The bibliographic line on an article.
 *
 * Section 7 of the ISSN India detailed information document asks for the name
 * of the publication, the volume, the issue, the month and the year on the
 * first page of every article. It also asks for page numbers, which a web
 * article does not have and should not pretend to: an invented page range is
 * exactly the kind of thing that gets an application declined for misleading
 * information. Volume, issue and month carry the citation on their own.
 *
 * Renders nothing when the article has not been placed in an issue yet. The
 * Studio has a "Not in an issue yet" list for finding those.
 */
export function Citation({
  issue,
}: {
  issue?: {
    volume?: number | null
    issueNumber?: number | null
    issueDate?: string | null
    slug?: string | null
  } | null
}) {
  if (!issue?.volume || !issue?.issueNumber) return null

  const month = formatMonth(clean(issue.issueDate))
  const label = `Volume ${issue.volume}, Issue ${issue.issueNumber}${month ? ` · ${month}` : ''}`
  const slug = clean(issue.slug)

  return (
    <p className="citation">
      <cite>5Talents Magazine</cite>
      <span aria-hidden="true"> · </span>
      {slug ? <Link href={`/issues/${slug}`}>{label}</Link> : label}
    </p>
  )
}
