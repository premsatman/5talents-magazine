import Script from 'next/script'

/**
 * Google Analytics 4.
 *
 * Installed with `next/script` rather than `@next/third-parties`, deliberately.
 * The wrapper package adds a dependency to save about eight lines and takes
 * away the ability to gate loading the way this file does. There is nothing in
 * it we need.
 *
 * Two rules govern whether the tag loads at all:
 *
 *   1. `NEXT_PUBLIC_GA_ID` must be set. No ID, no script — so the site runs
 *      perfectly well before the GA property exists, which is where it is now.
 *
 *   2. `VERCEL_ENV` must be exactly "production". Preview deployments run with
 *      NODE_ENV=production, so checking NODE_ENV alone would send every branch
 *      preview and every `npm start` on your laptop into the same property.
 *      Three weeks later the numbers are unusable and you cannot tell which
 *      sessions were yours.
 *
 * This is a server component, so it reads VERCEL_ENV directly. That variable is
 * not NEXT_PUBLIC_ and never reaches the browser.
 *
 * If this site ever moves off Vercel, VERCEL_ENV disappears and analytics
 * silently stop. That is the correct failure direction — no data beats wrong
 * data — but it is the thing to check first if the reports go quiet.
 *
 * Client-side navigations: GA4's Enhanced Measurement ("page changes based on
 * browser history events", on by default) picks up App Router route changes on
 * its own. Do not also send manual page_view events or every navigation counts
 * twice.
 *
 * No `anonymize_ip` here, deliberately. That was a Universal Analytics setting;
 * GA4 ignores it and anonymises IPs automatically with no way to turn it off.
 * Passing it would imply a privacy control that does not exist.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export function Analytics() {
  if (!GA_ID || process.env.VERCEL_ENV !== 'production') return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
