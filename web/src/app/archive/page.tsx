import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { ARCHIVE_ISSUES_QUERY } from '@/sanity/queries'
import { urlFor, imgAlt, imgBlur } from '@/sanity/image'
import { clean } from '@/sanity/stega'
import { formatMonth } from '@/lib/format'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'The archive',
  description:
    'Every issue of 5Talents Magazine from 2012 to 2014 — 17 issues, 400 pages — rebuilt as readable web articles with the original PDFs alongside.',
  alternates: { canonical: '/archive' },
}

export default async function ArchivePage() {
  const { data } = await sanityFetch({ query: ARCHIVE_ISSUES_QUERY })
  const issues = data ?? []

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>The archive</h1>
          <p>
            Seventeen issues, published between 2012 and 2014. Each one is being rebuilt as
            readable web articles — the original PDFs remain downloadable alongside, but the point
            is that the writing now works on a phone.
          </p>
        </div>

        {issues.length === 0 ? (
          <p className="empty">No issues loaded yet.</p>
        ) : (
          <div className="issuegrid">
            {issues.map((issue) => (
              <figure key={issue._id}>
                <Link href={`/archive/${clean(issue.slug)}`}>
                  {issue.coverImage?.asset?.url && (
                    <Image
                      src={urlFor(issue.coverImage).width(400).url()}
                      alt={imgAlt(issue.coverImage, `${clean(issue.title) ?? ''} cover`)}
                      width={400}
                      height={554}
                      sizes="(max-width: 700px) 45vw, 200px"
                      placeholder={imgBlur(issue.coverImage) ? 'blur' : 'empty'}
                      blurDataURL={imgBlur(issue.coverImage)}
                    />
                  )}
                  <figcaption>
                    <strong>{issue.title ?? formatMonth(issue.issueDate)}</strong>
                    <br />
                    <span className="note">
                      {[
                        issue.pageCount ? `${issue.pageCount} pages` : null,
                        issue.articleCount ? `${issue.articleCount} online` : 'PDF only',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </figcaption>
                </Link>
              </figure>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
