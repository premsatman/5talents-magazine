/**
 * Travelpayouts Drive.
 *
 * Drive is a link rewriter, not an ad unit. It scans each page and turns
 * outbound travel links into affiliate links, so it needs ordinary DOM access
 * on every page — it cannot live inside a sandboxed iframe the way a banner
 * creative does.
 *
 * This deliberately renders Travelpayouts' own snippet verbatim, inline in
 * <head>, rather than going through `next/script`. That is not laziness:
 *
 *   `next/script` with strategy="afterInteractive" injects the tag from the
 *   client after hydration, so it never appears in the server-rendered HTML.
 *   Travelpayouts verifies installation by fetching the page, so a tag that
 *   only exists after React boots is a tag their checker cannot see. Same
 *   reason the theme script in layout.tsx is written this way.
 *
 * The snippet is non-blocking despite sitting in <head> — it creates a script
 * element with async set and appends it, so nothing waits on the network.
 *
 * The WordPress attributes on the outer tag (nowprocket, data-noptimize,
 * data-cfasync, data-wpfc-render, seraph-accel-crit, data-no-defer) are kept
 * even though nothing here reads them. They cost a few bytes and they mean the
 * markup on the page is byte-for-byte what Travelpayouts' documentation and
 * their support team expect to see. `data-cmp-ab` is the one they actually read.
 *
 * The partner ID is not a secret — it ships in the page source on every view,
 * which is how affiliate attribution works — so it is a constant rather than an
 * environment variable. `NTc1MjQ2` is `575246` base64-encoded.
 *
 * VERCEL_ENV must be "production": preview deployments and local runs would
 * otherwise generate affiliate clicks against your own account, and
 * self-referred traffic is a common way affiliate accounts get closed. This is
 * a server component, so VERCEL_ENV is read on the server and never ships.
 *
 * Two things still need settling, neither of them code:
 *
 *   - **Disclosure.** Drive converts editorial links into paid ones silently.
 *     A reader clicking a hotel link inside a conference piece cannot tell it
 *     earns you money. The blueprint's editorial firewall says paid placement
 *     is labelled every time; auto-monetised links are the same thing arriving
 *     through a side door. Decide a standing disclosure line for any article
 *     carrying them.
 *
 *   - **Consent.** Drive sets third-party cookies, which is why the tag takes a
 *     `data-cmp-ab` flag at all. /privacy currently says only that "where
 *     third-party ads appear, the ad network sets its own cookies", and marks
 *     itself as unreviewed placeholder text. Under the DPDP Act, and under
 *     UK/EU rules for the diaspora readers the blueprint courts, it needs to
 *     name Travelpayouts and say what it does.
 */

const DRIVE_SNIPPET = `
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.setAttribute("data-cmp-ab","2");
      script.src = 'https://emrldco.com/NTc1MjQ2.js?t=575246';
      document.head.appendChild(script);
  })();
`

export function TravelpayoutsDrive() {
  if (process.env.VERCEL_ENV !== 'production') return null

  return (
    <script
      data-cmp-ab="2"
      data-noptimize="1"
      data-cfasync="false"
      data-wpfc-render="false"
      data-no-defer="1"
      dangerouslySetInnerHTML={{ __html: DRIVE_SNIPPET }}
    />
  )
}
