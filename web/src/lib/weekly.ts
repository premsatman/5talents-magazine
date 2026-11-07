/**
 * 5Talents Weekly — the letter's permanent home on the magazine site.
 *
 * The issue lives in the PS.Today database, which also sends the email. This
 * site holds no credentials for it, so it reads a public, read-only JSON
 * endpoint there instead. That is deliberate: the rule for which articles are
 * in an issue, in what order, and which one leads, exists once. If this page
 * rebuilt that rule from Sanity it would drift from what subscribers were
 * actually sent, and the archive would quietly stop being an archive.
 *
 * The page must be live BEFORE an issue is mailed. Share buttons in the email
 * point here, and WhatsApp, X, LinkedIn and Facebook fetch the preview card at
 * the moment someone shares — then cache it. A 404 in the first minutes is the
 * card everyone sees afterwards, and publishing later does not undo it.
 */

export const WEEKLY_API =
  process.env.FIVETALENTS_WEEKLY_API ?? 'https://www.ps.today/api/public/5talents-weekly'

export type WeeklyStory = {
  id: string
  title: string
  deck: string | null
  publishedAt: string
  slug: string
  sectionName: string
  sectionSlug: string
  authors: string[]
  imageUrl: string | null
  imageAlt: string | null
  archiveYear: number | null
}

export type WeeklyPromo = { title: string; body: string; linkLabel: string; url: string } | null

export type WeeklyIssue = {
  issueNumber: number | null
  issueDate: string
  windowStart: string
  windowEnd: string
  articles: WeeklyStory[]
  subject: string
  preheader: string
  editorNote: string | null
  promo: WeeklyPromo
  status: string
  indexable: boolean
}

export const weeklyPath = (issueDate: string) => `/weekly/${issueDate}`

export const isIssueDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

/**
 * A sent issue never changes, so it is cached for a day. An unsent one is still
 * being edited and is checked every minute, which is what lets the page be up
 * before the send without serving a stale draft.
 */
export async function fetchWeeklyIssue(issueDate: string): Promise<WeeklyIssue | null> {
  if (!isIssueDate(issueDate)) return null
  try {
    const res = await fetch(`${WEEKLY_API}/${issueDate}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const data = (await res.json()) as WeeklyIssue
    return Array.isArray(data?.articles) ? data : null
  } catch {
    return null
  }
}

const dFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const dShort = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long' })

/** "Sunday 1 – Saturday 7 November 2026", matching the letter's own masthead. */
export function weeklyWindowLabel(windowStart: string, issueDate: string): string {
  const start = new Date(windowStart)
  const end = new Date(`${issueDate}T12:00:00+05:30`)
  return `Sunday ${dShort.format(start)} – Saturday ${dFmt.format(end)}`
}

export function weeklyIssueTitle(issue: WeeklyIssue): string {
  return issue.issueNumber ? `5Talents Weekly, Issue ${issue.issueNumber}` : '5Talents Weekly'
}
