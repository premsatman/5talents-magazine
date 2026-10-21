import Script from 'next/script'

/**
 * Google Reader Revenue Manager (Subscribe with Google "basic").
 *
 * Installed because Reader Revenue Manager's setup checklist in Publisher
 * Center asks for it, and because it is what lets Google show a Follow or
 * newsletter prompt on 5Talents articles in Google News and Discover. The
 * publication is configured as open access - there is no paywall, no metering
 * and no contribution flow - so this script gates nothing. If an article ever
 * stops rendering for readers, this is not the cause.
 *
 * Same two rules as Analytics.tsx and MetaPixel.tsx:
 *
 *   1. `NEXT_PUBLIC_RRM_PRODUCT_ID` must be set. No ID, no script. The value is
 *      the publication's product ID from Publisher Center, including the
 *      product suffix, e.g. "CAowsI_IDA:openaccess".
 *   2. `VERCEL_ENV` must be exactly "production", so preview deployments and
 *      local runs never register impressions against the publication or show
 *      prompts while you are editing.
 *
 * Article pages only. The init call declares the page a NewsArticle, which is
 * true of [section]/[slug] and of nothing else on the site; putting it in the
 * root layout would tell Google the homepage and the policy pages are articles.
 * Keep it out of layout.tsx.
 *
 * Which prompts actually appear is controlled in Publisher Center under Reader
 * funnels, not here. Before switching the newsletter sign-up funnel on, read
 * the warning in the next paragraph.
 *
 * Newsletter sign-ups collected by Google do NOT reach Resend. They sit in
 * Reader Revenue Manager and are exportable only by hand (Reader funnels ->
 * Download reader data), and Google keeps them for 30 days. There is no API and
 * no webhook. Turning that funnel on without a weekly export routine is how you
 * lose subscribers who think they signed up.
 *
 * The article page already emits NewsArticle JSON-LD of its own; this script
 * reads the page's structured data where it can and the init above where it
 * cannot. The two agree, so leaving both is correct.
 *
 * Google sets its own cookies through this script, so the privacy page names it
 * in the third-party list. If this component is removed, remove that entry too.
 */

const PRODUCT_ID = process.env.NEXT_PUBLIC_RRM_PRODUCT_ID

// lazyOnload (21 Oct 2026): swg-basic.js is a large script and its prompt only
// appears after the reader has started reading, so it waits for the page load
// instead of competing with the lead image on article pages.
export function ReaderRevenue() {
  if (!PRODUCT_ID || process.env.VERCEL_ENV !== 'production') return null

  return (
    <>
      <Script src="https://news.google.com/swg/js/v1/swg-basic.js" strategy="lazyOnload" />
      <Script id="rrm-init" strategy="lazyOnload">
        {`
          (self.SWG_BASIC = self.SWG_BASIC || []).push(function (basicSubscriptions) {
            basicSubscriptions.init({
              type: 'NewsArticle',
              isPartOfType: ['Product'],
              isPartOfProductId: '${PRODUCT_ID}',
              clientOptions: { theme: 'light', lang: 'en' },
            });
          });
        `}
      </Script>
    </>
  )
}
