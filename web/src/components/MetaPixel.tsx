import Script from 'next/script'

/**
 * Meta (Facebook/Instagram) Pixel.
 *
 * Exists for one job: building retargeting audiences of 5Talents readers in
 * Meta Ads Manager, for 5Talents' own ads. This pixel belongs to 5Talents only;
 * do not share it with other sites. It follows the same rules as Analytics.tsx, on purpose:
 *
 *   1. `NEXT_PUBLIC_META_PIXEL_ID` must be set. No ID, no script.
 *   2. `VERCEL_ENV` must be exactly "production", so previews and local runs
 *      never pollute the audience.
 *   3. The staff opt-out flag set by ?internal=on (see Analytics.tsx) also
 *      stops the pixel, so editors do not end up in their own ad audiences.
 *
 * Client-side navigations: the pixel watches the History API and sends a
 * PageView on each App Router route change by itself. Do not add manual
 * PageView calls or every navigation counts twice. Check with Meta Pixel
 * Helper after the first deploy.
 *
 * Nothing sensitive is sent: only page URLs and the two neutral custom events
 * in lib/analytics.ts (ArticleRead, AppClick). Do not add form fields, emails
 * or anything from the Write for us form here.
 *
 * Every page that loads this must be covered by the privacy page, which names
 * Meta as a third party that sets cookies.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function MetaPixel() {
  if (!PIXEL_ID || process.env.VERCEL_ENV !== 'production') return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        (function () {
          try {
            var q = new URLSearchParams(location.search).get('internal');
            if (q === 'on') return;
            if (q !== 'off' && localStorage.getItem('5t_internal') === '1') return;
          } catch (e) {}
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        })();
      `}
    </Script>
  )
}
