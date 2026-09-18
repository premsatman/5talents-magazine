import Script from 'next/script'

/**
 * Travelpayouts Drive.
 *
 * Drive is a link rewriter, not an ad unit. It scans each page and turns
 * outbound travel links into affiliate links, so it needs ordinary DOM access
 * on every page — it cannot live inside a sandboxed iframe the way a banner
 * creative does.
 *
 * Travelpayouts gives you a snippet that builds a <script> element and appends
 * it to <head>. Two things are different here:
 *
 *   1. We load the target script directly. `next/script` already does the
 *      async-append the snippet does by hand, so shipping their loader would
 *      only mean a loader loading a loader.
 *
 *   2. Their snippet carries `nowprocket`, `data-noptimize`, `data-cfasync`,
 *      `data-wpfc-render`, `seraph-accel-crit` and `data-no-defer`. Every one
 *      of those is an instruction to a WordPress caching or optimisation plugin
 *      telling it not to defer, combine or minify the tag. None mean anything
 *      here, so they are dropped. `data-cmp-ab` is read by Travelpayouts
 *      itself and is kept.
 *
 * Gated the same way as Analytics, and for the same reasons:
 *
 *   1. `NEXT_PUBLIC_TRAVELPAYOUTS_DRIVE_SRC` must be set. Unset, nothing loads.
 *   2. `VERCEL_ENV` must be exactly "production", so branch previews and local
 *      runs do not generate affiliate clicks against your own account. Self-
 *      referred clicks are how affiliate accounts get closed.
 *
 * `afterInteractive`, not `beforeInteractive`: Drive rewrites links that are
 * already in the DOM, so it has nothing to do until the page has rendered.
 * Loading it earlier would only push out LCP.
 *
 * Before switching this on, two things need settling — neither is code:
 *
 *   - **Disclosure.** Drive silently converts editorial links into paid ones.
 *     A reader clicking a hotel link inside a conference piece cannot tell it
 *     earns you money. The editorial firewall in the relaunch blueprint says
 *     paid placement is labelled every time; auto-monetised links are the same
 *     thing arriving through a side door. Decide on a standing disclosure line
 *     for any article carrying affiliate links.
 *
 *   - **Consent.** Drive sets third-party cookies, which is why the tag takes a
 *     `data-cmp-ab` flag at all. /privacy currently says only that "where
 *     third-party ads appear, the ad network sets its own cookies" and is
 *     explicitly marked as unreviewed placeholder text. Under the DPDP Act, and
 *     under UK/EU rules for the diaspora readers the blueprint courts, that
 *     needs to name Travelpayouts and say what it does.
 */

const DRIVE_SRC = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_DRIVE_SRC

export function TravelpayoutsDrive() {
  if (!DRIVE_SRC || process.env.VERCEL_ENV !== 'production') return null

  return (
    <Script
      id="travelpayouts-drive"
      src={DRIVE_SRC}
      data-cmp-ab="2"
      strategy="afterInteractive"
    />
  )
}
