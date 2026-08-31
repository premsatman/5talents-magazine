/**
 * Typed wrapper around gtag.
 *
 * Exists so that every analytics event in the codebase has one call site. When
 * ad tracking arrives, `adImpression()` and `adClick()` below are the only
 * places that need to learn about the ad server — and if analytics is ever
 * swapped out, this is the only file that changes.
 *
 * Every function here is a no-op when the tag has not loaded: in development,
 * on preview deploys, before the GA property exists, and for the meaningful
 * share of readers running a content blocker. Nothing calling these needs to
 * check first.
 *
 * A note on why the ad events below are not a billing record. GA4 is blocked
 * for a large minority of readers, suppresses rows with small user counts,
 * buckets high-cardinality dimensions into "(other)", and retains data for at
 * most fourteen months. It is a good analysis layer and an unusable invoice.
 * See TunedUp-Ads-Platform-Spec.md §5.
 */

type GtagParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (command: 'event' | 'config' | 'js', target: string, params?: GtagParams) => void
    dataLayer?: unknown[]
  }
}

/** Fire a GA4 event. Silently does nothing if the tag is absent. */
export function track(event: string, params: GtagParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', event, params)
}

/* ------------------------------------------------------------------ *
 * Ad events
 *
 * Not wired up yet — the ad server does not exist. Register these four
 * parameters as custom dimensions in GA4 Admin before the first call, or the
 * events arrive with the values discarded and no way to recover them.
 * ------------------------------------------------------------------ */

type AdEvent = {
  /** Slot letter from AD_SIZES: A through J. */
  slot: string
  advertiser: string
  campaign?: string
  creative?: string
}

export function adImpression(ad: AdEvent) {
  track('ad_impression', { ad_slot: ad.slot, ...adParams(ad) })
}

export function adClick(ad: AdEvent) {
  track('ad_click', { ad_slot: ad.slot, ...adParams(ad) })
}

function adParams({ advertiser, campaign, creative }: AdEvent) {
  return { advertiser, campaign, creative }
}

/* ------------------------------------------------------------------ *
 * Editorial events
 *
 * Worth having from launch: these are the numbers that make an advertiser
 * conversation possible later, and they cannot be backfilled.
 * ------------------------------------------------------------------ */

/** A reader reached the end of an article. Pair with reading-time for depth. */
export function articleComplete(slug: string, section: string) {
  track('article_complete', { slug, section })
}

/** Newsletter signup, from wherever on the page it happened. */
export function newsletterSignup(placement: string) {
  track('newsletter_signup', { placement })
}

/** Someone opened the advertise page's contact link. Your earliest demand signal. */
export function advertiseEnquiry() {
  track('advertise_enquiry')
}
