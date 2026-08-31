import Image from 'next/image'
import { sanityFetch } from '@/sanity/live'
import { ACTIVE_ADS_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { urlFor, imgAlt } from '@/sanity/image'
import { clean } from '@/sanity/stega'
import { AD_SIZES, type SlotId } from '@/lib/media'

export type { SlotId }

/**
 * Ad slots.
 *
 * Sizes and placement measured off relevantmagazine.com, 28 Aug 2026. Their
 * placement rule is simple enough to copy wholesale: a 728x90 leaderboard
 * immediately before every section heading and nowhere else in the flow, plus
 * one tall unit in the rail and one square. Eleven leaderboards down an
 * 18,000px homepage.
 *
 *   A  Top leaderboard, above the hero    728 x 90   <- off by default, see below
 *   B  In-article, after paragraph 3      728 x 90
 *   C  In-article, after paragraph 8      728 x 90
 *   D  Rail, sticky                       300 x 600
 *   E  End of article                     336 x 280
 *   F  Before each section heading        728 x 90
 *   G  Newsletter inline                  600 x 150
 *   H  House ad                           300 x 250
 *
 * Every slot reserves its exact height in every state. An ad that loads into
 * unreserved space shifts the layout and costs ranking, and that is the single
 * most expensive mistake available on this page.
 *
 * Slot A stays out of the default enabledSlots. Relevant runs one at 73px;
 * at $3-8 RPM it earns little and it is the most reliable way to wreck LCP.
 */

/** Show labelled boxes rather than blank reserved space. */
const showPlaceholders = process.env.NEXT_PUBLIC_AD_PLACEHOLDERS !== 'false'

export async function AdSlot({
  slot,
  className = '',
}: {
  slot: SlotId
  className?: string
}) {
  const size = AD_SIZES[slot]

  const [{ data: settings }, { data: ads }] = await Promise.all([
    sanityFetch({ query: SITE_SETTINGS_QUERY }),
    sanityFetch({
      query: ACTIVE_ADS_QUERY,
      params: { slot, today: new Date().toISOString().slice(0, 10) },
      stega: false,
    }),
  ])

  const enabled = clean(settings?.enabledSlots) ?? []
  const adsEnabled = clean(settings?.adsEnabled)
  const live = adsEnabled && adsEnabled !== 'off' && enabled.includes(slot)
  const booked = ads?.[0]

  // Sold and live.
  if (live && booked?.creative?.asset?.url) {
    return (
      <aside className={`ad ad--${slot.toLowerCase()} ad--filled ${className}`}>
        <span className="ad__label">Advertisement</span>
        <div className="ad__frame" style={{ width: size.w, height: size.h }}>
          <a href={clean(booked.url) ?? '#'} rel="sponsored noopener" target="_blank">
            <Image
              src={urlFor(booked.creative).width(size.w * 2).url()}
              alt={imgAlt(booked.creative, clean(booked.name) ?? 'Advertisement')}
              width={size.w}
              height={size.h}
              loading={slot === 'A' ? 'eager' : 'lazy'}
            />
          </a>
        </div>
      </aside>
    )
  }

  // Unsold, or the slot is switched off. Either a labelled box while you are
  // designing and selling, or silent reserved space once you go live.
  //
  // Note that in placeholder mode a slot missing from enabledSlots still draws
  // its box. That is deliberate: while laying the pages out you want to see
  // every position the design offers, including the ones you have chosen not to
  // sell yet. With NEXT_PUBLIC_AD_PLACEHOLDERS="false" - which is how the site
  // should ship - enabledSlots governs completely and a disabled slot reserves
  // silent space and renders nothing.
  // Switched off in settings: render nothing at all. Height is reserved to stop
  // an arriving ad shifting the page, so reserving it where no ad can ever
  // arrive buys nothing and costs a hole in the layout — which at slot D's
  // 300x600 meant more empty rail than rail.
  if (!live && !showPlaceholders) return null

  // Enabled but currently unsold. Keep the height: this is the position a
  // client-injected network like AdSense fills after paint, and that is the
  // shift the reservation exists to prevent.
  if (!showPlaceholders) {
    return <div className={`ad ad--${slot.toLowerCase()} ${className}`} style={{ minHeight: size.h }} aria-hidden="true" />
  }

  return (
    <aside className={`ad ad--${slot.toLowerCase()} ad--empty ${className}`} aria-hidden="true">
      <div className="ad__frame" style={{ width: size.w, height: size.h }}>
        <span className="ad__slotname">Slot {slot} · {size.label}</span>
        <span className="ad__size">
          Space for ads — {size.w} × {size.h}
        </span>
        {size.accepts.length > 1 && (
          <span className="ad__kind">also takes {size.accepts.slice(1).join(', ')}</span>
        )}
      </div>
    </aside>
  )
}
