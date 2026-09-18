import { NextResponse } from 'next/server'
import { freshClient } from '@/sanity/client'

/**
 * Host document for a third-party widget embed.
 *
 * WHY THIS ROUTE EXISTS
 *
 * The obvious way to sandbox a widget is to put its snippet in an iframe's
 * `srcdoc`. That was the first implementation, and it failed in a way that
 * looks like success: Travelpayouts logged impressions while the slot rendered
 * blank.
 *
 * A `srcdoc` document's URL is `about:srcdoc`, so `location.hostname` inside it
 * is the empty string. Klook's script reads that to build
 * `publisher_host=<host>` on the nested render call it makes to
 * affiliate.klook.com. With the host empty, that endpoint returns nothing — but
 * the Travelpayouts wrapper has already fired its own impression beacon by
 * then, so the dashboard shows traffic that no reader ever saw.
 *
 * Removing the sandbox does not help: `about:srcdoc` has no hostname whatever
 * the sandbox says. The document needs a real URL, which is what this route is.
 * Served from our own origin, `location.hostname` is the site's domain, and the
 * widget builds the call it meant to build.
 *
 * The iframe keeps its sandbox. Sandboxing changes a document's *origin*, not
 * its *URL*, so the frame still reports the right hostname while being denied
 * access to this page — which is the arrangement we wanted all along and could
 * not get from srcdoc.
 *
 * Any widget that renders blank in a slot but counts impressions upstream is
 * likely this same class of bug: something in the embed is reading its
 * environment and getting an answer we did not intend to give it.
 */

/** Keep the widget's own markup out of the picture; it sizes itself. */
const SHELL = (body: string) =>
  `<!doctype html><html><head><meta charset="utf-8">` +
  `<meta name="referrer" content="no-referrer-when-downgrade">` +
  `<base target="_blank">` +
  `<style>html,body{margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;overflow:hidden}</style>` +
  `</head><body>${body}</body></html>`

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  // Sanity document IDs are opaque; reject anything that is not shaped like
  // one before it reaches a query. The GROQ below is parameterised anyway, so
  // this is belt and braces rather than the only guard.
  if (!/^[a-zA-Z0-9._-]{1,128}$/.test(id)) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Published perspective only, and the same date window the slot itself
  // honours — an expired booking must stop serving even if a stale page in
  // someone's cache still points at this URL.
  const today = new Date().toISOString().slice(0, 10)
  const booking = await freshClient.fetch<{ embedCode?: string } | null>(
    `*[_type == "advertiser" && _id == $id && defined(embedCode)
       && activeFrom <= $today && activeTo >= $today][0]{ embedCode }`,
    { id, today },
  )

  if (!booking?.embedCode) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(SHELL(booking.embedCode), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Framable by us and nobody else. Without this, any site could iframe
      // this route and run our bookings against their traffic.
      'Content-Security-Policy': "frame-ancestors 'self'",
      // Short cache: a booking can be pulled mid-flight, and this document is
      // cheap to rebuild. Long enough that a busy page is not refetching it
      // for every reader.
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
