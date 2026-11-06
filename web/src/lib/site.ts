export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const siteName = '5Talents Magazine'

/** Design system s9 note 2: the apostrophe was wrong on all 18 original issues. */
export const tagline = 'Discovering talents for God’s kingdom'

export const defaultDescription =
  'A magazine for young Christians, edited from India, written for the world. Culture, faith, work, wellbeing and heritage. Founded 2012, published since 2026.'

/**
 * Shorter twin of the above, for og:description only.
 *
 * The two do different jobs. Google shows a meta description up to roughly 160
 * characters, so defaultDescription uses the room to list the sections. Social
 * cards cut around 125 - and on a phone, less - so a description written for
 * search arrives with its last clause missing. This one is built to fit.
 */
export const socialDescription =
  'A magazine for young Christians — edited from India, written for the world. Founded 2012, published since 2026.'

/**
 * Blueprint s4: publish this as a line on the about page and in the footer.
 *
 * Revised 18 Sep 2026. The magazine now covers Christian news, events and
 * conferences, which it previously did not. That is a deliberate widening and
 * it very likely brings the site inside "news and current affairs content"
 * under the IT Rules 2021 — the thing the old wording existed to stay outside.
 * See the note in src/app/about/page.tsx.
 */
export const scopeStatement =
  '5Talents covers Christian culture, formation, news, events and conferences. We do not cover political controversy.'

/**
 * The desk address, used as managingEditor and webMaster in the RSS feed.
 *
 * Feed directories read those two fields when they want a human to contact
 * about the feed, and several reject a submission without them. It is a real
 * mailbox, not a no-reply.
 */
export const editorialEmail = 'editorial@5talentsmag.com'

/**
 * The openGraph block for a page that has nothing special to say.
 *
 * It exists because Next REPLACES a parent's openGraph with the child's rather
 * than merging the two, key by key (the note in [section]/[slug]/page.tsx is
 * the scar from learning that). So a page that set `openGraph: { url }` just to
 * emit og:url would silently drop the layout's og:type, og:site_name and
 * og:locale and end up worse off than before.
 *
 * og:url itself matters because it is what Facebook, LinkedIn, Slack and the
 * rest treat as the canonical address of a shared page. Without it they key the
 * share off whatever URL it arrived on - utm tags, trackers and all - and the
 * same article accumulates engagement counts under several identities.
 *
 * og:title, og:description and og:image are not here on purpose: Next fills
 * those from the page's own title and description and from opengraph-image.tsx.
 */
export function pageOg(url: string) {
  return { type: 'website' as const, siteName, locale: 'en_IN', url }
}

/**
 * "Add 5Talents as a preferred source in Google."
 *
 * A reader who does this is more likely to be shown our pieces in Top
 * Stories, with a badge. It changes nothing for anyone else: it is not a
 * ranking signal and has no effect until an individual chooses us in their
 * own Google account, which is why the ask belongs beside the notification
 * bell rather than in the policy list.
 *
 * The plain link deliberately, not Google's two-line JavaScript button: the
 * button pulls news.google.com/swg/js/v1/publisher.js onto the page, and the
 * reach this can earn at current audience size does not pay for a script.
 * Revisit if the magazine ever has the readership to make it worth the weight.
 *
 * The domain is written out rather than derived from siteUrl because the tool
 * matches on the public domain, and a localhost or preview host would make a
 * dead link out of a working one.
 */
export const preferredSourceUrl = 'https://www.google.com/preferences/source?q=5talentsmag.com'

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function articleHref(section?: string | null, slug?: string | null) {
  if (!section || !slug) return '/'
  return `/${section}/${slug}`
}
