/**
 * Outbound links to the people and organisations we write about.
 *
 * tagUrl() adds utm parameters so that the organisation's own analytics names
 * 5Talents as the source, even when the click comes from an in-app browser
 * that drops the referrer.
 *
 * Three rules:
 *   - Social and app-store hosts are left alone. They ignore utm parameters
 *     and the organisation gets no report of where a profile visit came from.
 *   - A URL that already carries a utm_source is left alone. It is theirs.
 *   - Source citations are never passed through this. A citation is evidence,
 *     not a lead, and the cited page should be linked exactly as published.
 */
const UNTAGGED_HOSTS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'youtu.be',
  'threads.net',
  'threads.com',
  'tiktok.com',
  'linkedin.com',
  'wa.me',
  'whatsapp.com',
  't.me',
  'open.spotify.com',
  'play.google.com',
  'apps.apple.com',
  '5talentsmag.com',
]

export function hostOf(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function tagUrl(raw: string, campaign: string): string {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return raw
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return raw
  const host = url.hostname.replace(/^www\./, '')
  if (UNTAGGED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return raw
  if (url.searchParams.has('utm_source')) return raw
  url.searchParams.set('utm_source', '5talentsmag')
  url.searchParams.set('utm_medium', 'referral')
  url.searchParams.set('utm_campaign', campaign)
  return url.toString()
}
