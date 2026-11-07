import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ShareBar } from '@/components/ShareBar'
import { metaDescription } from '@/lib/format'
import { absoluteUrl, siteName, pageOg } from '@/lib/site'
import {
  fetchWeeklyIssue,
  weeklyPath,
  weeklyWindowLabel,
  weeklyIssueTitle,
  type WeeklyIssue,
  type WeeklyStory,
} from '@/lib/weekly'

/**
 * /weekly/<date> — one issue of the Saturday letter, kept permanently.
 *
 * This is where the email's share buttons point, so it has to exist before the
 * send, not after. See src/lib/weekly.ts for why that ordering matters.
 */

type Props = { params: Promise<{ date: string }> }

const storyHref = (a: WeeklyStory) => `/${a.sectionSlug}/${a.slug}`

const kicker = (a: WeeklyStory) =>
  a.archiveYear ? `From the ${a.archiveYear} archive` : a.sectionName

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params
  const issue = await fetchWeeklyIssue(date)
  if (!issue) return { title: 'Issue not found', robots: { index: false, follow: false } }

  const title = issue.subject || weeklyIssueTitle(issue)
  const description = metaDescription(
    issue.preheader || `Everything 5Talents Magazine published in the week to ${date}.`
  )
  const lead = issue.articles[0]
  const url = weeklyPath(issue.issueDate)

  return {
    title,
    description,
    alternates: { canonical: url },
    // An unsent issue is still being edited, so it stays out of search. Social
    // scrapers read the card regardless, which is the point: the link has to
    // preview correctly from the first minute it is shared.
    robots: issue.indexable ? undefined : { index: false, follow: true },
    openGraph: {
      ...pageOg(url),
      title,
      description,
      images: lead?.imageUrl ? [{ url: lead.imageUrl, alt: lead.imageAlt ?? lead.title }] : undefined,
    },
  }
}

function Story({ a, lead = false }: { a: WeeklyStory; lead?: boolean }) {
  return (
    <article className={lead ? 'wk-lead' : 'wk-story'}>
      {a.imageUrl ? (
        <Link href={storyHref(a)} className="wk-thumb" aria-hidden="true" tabIndex={-1}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.imageUrl} alt="" loading={lead ? 'eager' : 'lazy'} />
        </Link>
      ) : null}
      <div className="wk-text">
        <p className="wk-kicker">{kicker(a)}</p>
        <h2>
          <Link href={storyHref(a)}>{a.title}</Link>
        </h2>
        <p className="wk-by">
          {a.authors.length ? a.authors.join(', ') : '5Talents'}
          <span aria-hidden="true"> · </span>
          <time dateTime={a.publishedAt}>
            {new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Asia/Kolkata',
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }).format(new Date(a.publishedAt))}
          </time>
        </p>
        {a.deck ? <p className="wk-deck">{a.deck}</p> : null}
      </div>
    </article>
  )
}

export default async function WeeklyIssuePage({ params }: Props) {
  const { date } = await params
  const issue: WeeklyIssue | null = await fetchWeeklyIssue(date)
  if (!issue || issue.articles.length === 0) notFound()

  const [lead, ...rest] = issue.articles
  const title = issue.subject || weeklyIssueTitle(issue)

  return (
    <>
      <SiteHeader />
      <main className="wrap wk">
        <header className="wk-head">
          <p className="wk-eyebrow">
            5Talents Weekly{issue.issueNumber ? ` · Issue ${issue.issueNumber}` : ''}
          </p>
          <h1>{title}</h1>
          <p className="wk-window">
            {weeklyWindowLabel(issue.windowStart, issue.issueDate)}
            <span aria-hidden="true"> · </span>
            {issue.articles.length} {issue.articles.length === 1 ? 'story' : 'stories'}
          </p>
          {issue.status !== 'sent' ? (
            <p className="wk-pending">This edition has not been mailed yet.</p>
          ) : null}
        </header>

        {issue.editorNote?.trim() ? (
          <div className="wk-note">
            {issue.editorNote
              .trim()
              .split(/\n{2,}/)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
        ) : null}

        <Story a={lead} lead />

        {issue.promo ? (
          <aside className="wk-promo">
            <h2>{issue.promo.title}</h2>
            <p>{issue.promo.body}</p>
            <a href={issue.promo.url}>{issue.promo.linkLabel}</a>
          </aside>
        ) : null}

        {rest.map((a) => (
          <Story key={a.id} a={a} />
        ))}

        <div className="wk-share">
          <h2>Share this edition</h2>
          <ShareBar url={absoluteUrl(weeklyPath(issue.issueDate))} title={title} deck={issue.preheader} />
        </div>

        <aside className="wk-sub">
          <h2>Get this in your inbox</h2>
          <p>
            {siteName} sends one letter every Saturday — everything published that week, nothing else.
          </p>
          <Link href="/#newsletter">Subscribe free</Link>
        </aside>
      </main>
      <SiteFooter />
    </>
  )
}
