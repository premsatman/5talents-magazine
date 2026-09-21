import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { ONLINE_ISSUES_QUERY } from '@/sanity/queries'
import { clean } from '@/sanity/stega'
import { formatMonth } from '@/lib/format'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Issues',
  description: 'Every issue of the online magazine, with its full contents.',
  alternates: { canonical: '/issues' },
}

/**
 * The online issue archive.
 *
 * Separate from /archive, which is the twenty PDF issues of 2012-17 that were
 * circulated privately and never publicly published. Section 4 of the ISSN India detailed information document asks
 * for an archive kept in step with the publication's stated frequency, listing
 * each issue's articles by title with a link per article — and asks
 * specifically that a link to a consolidated PDF of a whole issue be avoided,
 * which is why the print archive's model could not simply be extended to cover
 * the web magazine.
 */
export default async function IssuesPage() {
  const { data } = await sanityFetch({ query: ONLINE_ISSUES_QUERY })
  const issues = data ?? []

  const byVolume = new Map<number, typeof issues>()
  for (const issue of issues) {
    const volume = issue.volume ?? 0
    byVolume.set(volume, [...(byVolume.get(volume) ?? []), issue])
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Issues</h1>
          <p>
            The magazine is published monthly. Volume 1 is 2026, the year 5Talents returned as a
            website. The twenty PDF issues of 2012 to 2017, circulated privately at the time,
            are in <Link href="/archive">the archive</Link>.
          </p>
        </div>

        {issues.length === 0 ? (
          <p className="empty">No issues published yet.</p>
        ) : (
          [...byVolume.entries()].map(([volume, volumeIssues]) => (
            <section className="issue-volume" key={volume}>
              <h2>Volume {volume}</h2>
              <ul className="issue-list">
                {volumeIssues.map((issue) => (
                  <li key={issue._id}>
                    <Link href={`/issues/${clean(issue.slug)}`}>
                      <strong>Issue {issue.issueNumber}</strong>
                      <span aria-hidden="true"> · </span>
                      {formatMonth(clean(issue.issueDate))}
                    </Link>
                    <span className="note">
                      {issue.articleCount === 1 ? '1 article' : `${issue.articleCount ?? 0} articles`}
                    </span>
                    {issue.summary && <p className="issue-list__summary">{issue.summary}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
      <SiteFooter />
    </>
  )
}
