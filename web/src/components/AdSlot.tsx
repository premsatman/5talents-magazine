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
 *   A  Top leaderboard, above the hero    970 x 250  <- off by default, see below
 *   B  In-article, after paragraph 3      336 x 280  floated, text wraps beside
 *   C  In-article, after paragraph 8      336 x 280  floated, text wraps beside
 *   D  Article rail                       300 x 600
 *   E  End of article                     336 x 280
 *   F  Before each section heading        970 x 90
 *   I  Left gutter skyscraper             160 x 600  above 1500px only
 *   J  Right gutter skyscraper            160 x 600  above 1500px only
 *
 * Slots G and H were defined and never placed on a page, and were deleted.
 * AD_SIZES in lib/media.ts is the authority; the booking dropdown in
 * schemaTypes/advertiser.ts must match it, or a slot can be booked that
 * renders nowhere.
 *
 * Every slot reserves its exact height in every state. An ad that loads into
 * unreserved space shifts the layout and costs ranking, and that is the single
 * most expensive mistake available on this page.
 *
 * Slot A stays out of the default enabledSlots. Relevant runs one at 73px;
 * at $3-8 RPM it earns little and it is the most reliable way to wreck LCP.
 *
 * HOUSE ADS
 *
 * A booking with tier "house" is one of our own promotions, and it is not an
 * advertisement. It is not sold, nobody paid for it, and it points at our own
 * pages. So it must not carry the word "Advertisement", must not be marked
 * rel="sponsored" (which tells a search engine the link was paid for, and
 * throws away internal link equity into the bargain), and must not open in a
 * new tab, because a reader is not leaving the site. It is labelled as coming
 * from us and it behaves like every other internal link.
 *
 * `adsEnabled: "house"` runs these and nothing else, which is how a magazine
 * with no advertisers yet fills its own space honestly.
 */

/** Show labelled boxes rather than blank reserved space. */
const showPlaceholders = process.env.NEXT_PUBLIC_AD_PLACEHOLDERS !== 'false'

/**
 * Deterministic pick from a pool.
 *
 * Pages are statically generated, so an ad chosen at render time is baked into
 * the HTML: picking at random would hand every visitor the same "random" ad
 * until the next revalidation. Real per-impression rotation needs client-side
 * JavaScript, which costs a render-blocking script and a layout shift on a slot
 * whose whole job is to not shift.
 *
 * So this distributes advertisers *across pages* instead. Each page seeds the
 * hash with something stable and distinct - its slug, or which occurrence of a
 * repeated slot it is - and gets a stable advertiser. Three bookings on slot B
 * means roughly a third of articles each, the same advertiser every time on any
 * given article.
 *
 * That is weaker than true rotation in one way and stronger in two: an
 * advertiser can be shown exactly which pages carry them, and nothing moves
 * after paint.
 */
function pick<T>(items: T[], seed: string): T | undefined {
  if (items.length <= 1) return items[0]
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return items[Math.abs(h) % items.length]
}

export async function AdSlot({
  slot,
  className = '',
  seed,
}: {
  slot: SlotId
  className?: string
  /**
   * What makes this placement distinct - an article slug, a section, or which
   * copy of a repeated slot this is. Omit and every page showing this slot
   * picks the same advertiser.
   */
  seed?: string
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
  const slotOn = enabled.includes(slot)

  const candidates = ads ?? []
  const house = candidates.filter((a) => clean(a.tier) === 'house')
  const paid = candidates.filter((a) => clean(a.tier) !== 'house')

  // Which bookings may run at all, by mode:
  //
  //   house   our own promotions only. A paid booking sitting in the dataset
  //           must not go live because someone forgot to change this back, so
  //           it is filtered out rather than merely outranked.
  //   direct  sold inventory only, with house filling a slot nobody bought -
  //           an empty box earns nothing and a promotion of our own does.
  //   mixed   both compete on equal terms and share the pages between them.
  //   all     as mixed; AdSense fills what is left once that is wired up.
  const pool =
    adsEnabled === 'house'
      ? house
      : adsEnabled === 'direct'
        ? paid.length > 0
          ? paid
          : house
        : candidates

  // Seeded by slot as well as page, so two different slots on one article do
  // not both land on the same advertiser.
  const booked = pick(pool, `${slot}:${seed ?? ''}`)

  const live = Boolean(adsEnabled && adsEnabled !== 'off' && slotOn)
  const isHouse = clean(booked?.tier) === 'house'

  if (live && booked?.creative?.asset?.url) {
    const href = clean(booked.url) ?? '#'
    // Our own pages are internal links: same tab, no sponsored marker.
    const external = /^https?:\/\//.test(href) && !isHouse

    return (
      <aside
        className={`ad ad--${slot.toLowerCase()} ad--filled${isHouse ? ' ad--house' : ''} ${className}`}
      >
        <span className="ad__label">{isHouse ? 'From 5Talents' : 'Advertisement'}</span>
        <div className="ad__frame" style={{ width: size.w, height: size.h }}>
          <a
            href={href}
            rel={isHouse ? undefined : 'sponsored noopener'}
            target={external ? '_blank' : undefined}
          >
            <Image
              src={urlFor(booked.creative).width(size.w * 2).url()}
              alt={imgAlt(booked.creative, clean(booked.name) ?? (isHouse ? '5Talents' : 'Advertisement'))}
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
