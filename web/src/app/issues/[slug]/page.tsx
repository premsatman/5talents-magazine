import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/live'
import { ONLINE_ISSUE_QUERY, ONLINE_ISSUE_SLUGS_QUERY } from '@/sanity/queries'
import { freshClient } from '@/sanity/client'
import { clean } from '@/sanity/stega'
import { formatMonth, joinNames } from '@/lib/format'
import { articleHref } from '@/lib/site'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const issues = await freshClient.fetch(ONLINE_ISSUE_SLUGS_QUERY)
  return (issues ?? []).filter((i) => i.slug).map((i) => ({ slug: i.slug as string }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const { data: issue } = await sanityFetch({
    query: ONLINE_ISSUE_QUERY,
    params: { slug },
    stega: false,
  })
  if (!issue) return {}
  const label = `Volume ${issue.volume}, Issue ${issue.issueNumber}`
  return {
    title: label,
    description: issue.summary ?? `${label} of 5Talents Magazine.`,
    alternates: { canonical: `/issues/${slug}` },
  }
}

/**
 * One issue of the online magazine: its table of contents.
 *
 * Every article is listed by title and linked separately, which is what the
 * ISSN India detailed information document asks for in section 4. There is no
 * "download the whole issue" link and there should not be one — the same
 * section asks that a consolidated PDF of an issue be avoided in favour of
 * per-article links.
 */
export default async function IssuePage({ params }: Params) {
  const { slug } = await params
  const { data: issue } = await sanityFetch({ query: ONLINE_ISSUE_QUERY, params: { slug } })
  if (!issue) notFound()

  const articles = issue.articles ?? []
  const month = formatMonth(clean(issue.issueDate))

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <p className="citation">
            <cite>5Talents Magazine</cite>
            <span aria-hidden="true"> · </span>
            {month}
          </p>
          <h1>
            Volume {issue.volume}, Issue {issue.issueNumber}
          </h1>
          {issue.summary && <p>{issue.summary}</p>}
        </div>

        {articles.length === 0 ? (
          <p className="empty">Nothing published in this issue yet.</p>
        ) : (
          <ol className="toc">
            {articles.map((article) => (
              <li key={article._id}>
                <h2>
                  <Link href={articleHref(clean(article.section?.slug), clean(article.slug))}>
                    {article.title}
                  </Link>
                </h2>
                {article.deck && <p className="toc__deck">{article.deck}</p>}
                <p className="note">
                  {joinNames(article.authors)}
                  {article.section?.name && (
                    <>
                      <span aria-hidden="true"> · </span>
                      {article.section.name}
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
        )}

        <p className="note">
          <Link href="/issues">All issues</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
