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
    'The origins of 5Talents Magazine, 2012 to 2014 — eighteen PDF issues circulated privately, now rebuilt as readable web articles with the original files alongside.',
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
            Eighteen issues, made between July 2012 and July 2014. They were never printed and
            never publicly circulated — they were PDFs, sent to a small list of friends and
            supporters. Each one is being rebuilt as readable web articles; the original files
            remain downloadable alongside, but the point is that the writing now works on a phone.
          </p>
          <p>
            Issues of the online magazine, from 2026 onwards, are in{' '}
            <Link href="/issues">Issues</Link>.
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
