import { metaDescription } from '@/lib/format'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { freshClient } from '@/sanity/client'
import {
  ARCHIVE_ISSUE_QUERY,
  ARCHIVE_NEIGHBOURS_QUERY,
  ARCHIVE_SLUGS_QUERY,
} from '@/sanity/queries'
import { urlFor, imgAlt, imgBlur } from '@/sanity/image'
import { clean } from '@/sanity/stega'
import { formatMonth } from '@/lib/format'
import { articleHref } from '@/lib/site'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { IssueReader } from '@/components/IssueReader'

type Props = { params: Promise<{ issue: string }> }

/** Declared by hand until typegen is next run; see ARCHIVE_NEIGHBOURS_QUERY. */
type IssueLink = { title: string | null; slug: string | null; issueDate: string | null } | null
type Neighbours = { older: IssueLink; newer: IssueLink } | null

export async function generateStaticParams() {
  const issues = await freshClient.fetch(ARCHIVE_SLUGS_QUERY)
  return (issues ?? []).filter((i) => i.slug).map((i) => ({ issue: i.slug as string }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { issue } = await props.params
  const { data } = await sanityFetch({
    query: ARCHIVE_ISSUE_QUERY,
    params: { slug: issue },
    stega: false,
  })
  if (!data) return {}
  return {
    title: `${data.title} issue`,
    // Names the first pieces in the issue, so the result says what is in it
    // rather than only that it exists.
    description: metaDescription(
      [
        `The ${data.title} issue of 5Talents Magazine, rebuilt for the web with the original PDF alongside.`,
        (data.tableOfContents ?? [])
          .map((entry) => entry?.title)
          .filter(Boolean)
          .slice(0, 3)
          .join(', '),
      ]
        .filter(Boolean)
        .join(' Inside: '),
    ),
    alternates: { canonical: `/archive/${issue}` },
  }
}

export default async function IssuePage(props: Props) {
  const { issue: slug } = await props.params
  const [{ data: issue }, { data: around }] = await Promise.all([
    sanityFetch({ query: ARCHIVE_ISSUE_QUERY, params: { slug } }),
    sanityFetch({ query: ARCHIVE_NEIGHBOURS_QUERY, params: { slug } }),
  ])
  if (!issue) notFound()

  const neighbours = around as unknown as Neighbours
  const older = neighbours?.older
  const newer = neighbours?.newer

  const pdf = clean(issue.pdfUrl) ?? clean(issue.pdfFile)
  const embed = clean(issue.embedUrl)
  const contents = issue.tableOfContents ?? []

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <p className="crumb">
            <Link href="/archive">Archive</Link>
          </p>
          <h1>{issue.title ?? formatMonth(issue.issueDate)}</h1>
          <p className="note">
            {[
              issue.issueNumber ? `Issue ${issue.issueNumber}` : null,
              formatMonth(issue.issueDate),
              issue.pageCount ? `${issue.pageCount} pages` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="issue-layout">
          <div>
            {issue.coverImage?.asset?.url && (
              <Image
                src={urlFor(issue.coverImage).width(520).url()}
                alt={imgAlt(issue.coverImage, `${clean(issue.title) ?? ''} cover`)}
                width={520}
                height={720}
                sizes="(max-width: 800px) 60vw, 260px"
                placeholder={imgBlur(issue.coverImage) ? 'blur' : 'empty'}
                blurDataURL={imgBlur(issue.coverImage)}
                priority
                style={{ border: '1px solid var(--rule-strong)', width: '100%', height: 'auto' }}
              />
            )}
            {embed && <IssueReader url={embed} title={clean(issue.title) ?? 'This issue'} />}
            {pdf && (
              <p style={{ marginTop: 'var(--s-4)', textAlign: 'center' }}>
                <a className="brush-link note" href={pdf} download>
                  Download the original PDF
                </a>
              </p>
            )}
          </div>

          <div>
            <h2 className="brush-rule" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 var(--s-4)' }}>
              Contents
            </h2>
            {contents.length === 0 ? (
              <p className="empty">
                The contents of this issue have not been transcribed yet. The PDF is available
                above.
              </p>
            ) : (
              <ul className="toc">
                {contents.map((entry) => (
                  <li key={entry._key}>
                    <span className="pageno" aria-hidden="true">
                      {entry.page ?? '—'}
                    </span>
                    <div>
                      <h3>
                        {entry.article?.slug ? (
                          <Link
                            className="brush-link"
                            href={articleHref(
                              clean(entry.article.section?.slug),
                              clean(entry.article.slug),
                            )}
                          >
                            {entry.title}
                          </Link>
                        ) : (
                          entry.title
                        )}
                      </h3>
                      <p className="note">
                        {[
                          entry.byline,
                          entry.article?.slug ? 'Read online' : 'In the PDF only',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Issue-to-issue links. A reader working through the run wants them,
            and they give crawlers a path from any one issue to all twenty -
            previously the only links in were /archive and six homepage
            covers, and every issue page sat "discovered, not indexed". */}
        {(older?.slug || newer?.slug) && (
          <nav className="issue-nav" aria-label="Other issues">
            {older?.slug ? (
              <Link className="brush-link" href={`/archive/${clean(older.slug)}`}>
                ← {older.title ?? formatMonth(older.issueDate)}
              </Link>
            ) : (
              <span />
            )}
            {newer?.slug ? (
              <Link className="brush-link" href={`/archive/${clean(newer.slug)}`}>
                {newer.title ?? formatMonth(newer.issueDate)} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
