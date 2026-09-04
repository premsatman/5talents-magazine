export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const siteName = '5Talents Magazine'

/** Design system s9 note 2: the apostrophe was wrong on all 17 original issues. */
export const tagline = 'Discovering talents for God’s kingdom'

export const defaultDescription =
  'A magazine for young Christians, edited from India, written for the world. Culture, faith, work, wellbeing and heritage. Published since 2012.'

/**
 * Shorter twin of the above, for og:description only.
 *
 * The two do different jobs. Google shows a meta description up to roughly 160
 * characters, so defaultDescription uses the room to list the sections. Social
 * cards cut around 125 - and on a phone, less - so a description written for
 * search arrives with its last clause missing. This one is built to fit.
 */
export const socialDescription =
  'A magazine for young Christians — edited from India, written for the world. Published since 2012.'

/** Blueprint s4: publish this as a line on the about page and in the footer. */
export const scopeStatement =
  '5Talents is a culture and formation magazine. We do not report news or cover political controversy.'

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function articleHref(section?: string | null, slug?: string | null) {
  if (!section || !slug) return '/'
  return `/${section}/${slug}`
}
