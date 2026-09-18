import { defineType, defineField, defineArrayMember } from 'sanity'
import { CaseIcon } from '@sanity/icons/Case'

/**
 * Direct-sold advertising and our own house promotions.
 *
 * The slot list below must match AD_SIZES in web/src/lib/media.ts. Slots G and H
 * were defined there, never placed on a page, and deleted; bookings made against
 * them in the meantime render nowhere.
 */

/** Slot dimensions, mirroring AD_SIZES in web/src/lib/media.ts. */
const SLOT_SIZE: Record<string, { w: number; h: number }> = {
  A: { w: 970, h: 250 },
  B: { w: 336, h: 280 },
  C: { w: 336, h: 280 },
  D: { w: 300, h: 600 },
  E: { w: 336, h: 280 },
  F: { w: 970, h: 90 },
  I: { w: 160, h: 600 },
  J: { w: 160, h: 600 },
}

/**
 * Sanity encodes an image's dimensions in the asset _ref, as
 * `image-<hash>-970x90-png`, so the shape of a creative can be checked here
 * without fetching anything.
 *
 * This matters more than it looks. A creative whose size does not match its
 * slot fails silently: `.ad--filled` deliberately lets a booked image keep its
 * aspect ratio and scale to fit rather than squashing it, so a 970x90 dropped
 * into the 300px article rail renders as a 300x28 sliver that reads as a
 * horizontal rule. Nothing errors. It just looks like a layout bug.
 */
function creativeSize(ref?: string): { w: number; h: number } | null {
  const m = /-(\d+)x(\d+)-[a-z]+$/.exec(ref ?? '')
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null
}
export const advertiser = defineType({
  name: 'advertiser',
  title: 'Advertiser',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'logo',
      type: 'image',
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({
      name: 'creative',
      title: 'Ad creative',
      type: 'image',
      description:
        'The image served in the slot. Design at 2x — 672x560 for a 336x280 slot — so it stays sharp on a retina screen. The shape has to match the slot; a wrong-shaped creative is not cropped, it is scaled down until it fits, which can leave it a few pixels tall.',
      fields: [defineField({ name: 'alt', type: 'string', validation: (r) => r.required() })],
      validation: (r) =>
        r.custom((creative, ctx) => {
          const asset = (creative as { asset?: { _ref?: string } } | undefined)?.asset
          const size = creativeSize(asset?._ref)
          const slots = (ctx.document as { slots?: string[] } | undefined)?.slots ?? []
          if (!size || slots.length === 0) return true

          const ratio = size.w / size.h
          // Compared by aspect ratio, not by pixels, because designing at 2x is
          // the house rule and 672x560 must pass for a 336x280 slot.
          const wrong = slots.filter((slot) => {
            const want = SLOT_SIZE[slot]
            return want && Math.abs(ratio - want.w / want.h) / (want.w / want.h) > 0.02
          })
          if (wrong.length) {
            const wanted = wrong
              .map((s) => `${s} needs ${SLOT_SIZE[s].w}x${SLOT_SIZE[s].h}`)
              .join(', ')
            return `This creative is ${size.w}x${size.h}, the wrong shape for ${wrong.length > 1 ? 'slots' : 'slot'} ${wrong.join(', ')} — ${wanted}. It will be scaled down to fit rather than cropped, so it may render as a thin strip. Book this creative on a slot of the same shape, or upload one that matches.`
          }

          const thin = slots.find((slot) => SLOT_SIZE[slot] && size.w < SLOT_SIZE[slot].w)
          if (thin) {
            return `This creative is only ${size.w}px wide and slot ${thin} displays at ${SLOT_SIZE[thin].w}px. It will look soft. Export at 2x — ${SLOT_SIZE[thin].w * 2}x${SLOT_SIZE[thin].h * 2}.`
          }
          return true
        }).warning(),
    }),
    defineField({
      name: 'url',
      title: 'Click-through URL',
      type: 'url',
      description: 'Required for an image booking. Leave empty for an embed — the widget carries its own links.',
      validation: (r) =>
        r.uri({ scheme: ['http', 'https'] }).custom((url, ctx) => {
          const doc = ctx.document as { embedCode?: string } | undefined
          if (!url && !doc?.embedCode) return 'A booking needs either a click-through URL or embed code.'
          return true
        }),
    }),

    /**
     * THIRD-PARTY EMBEDS
     *
     * Travelpayouts sells widgets, not banners — search forms, calendars, maps,
     * delivered as a <script> tag. Several of them call document.write, which in
     * React after hydration blanks the page, so the snippet cannot simply be
     * dropped into the tree.
     *
     * It is rendered into a sandboxed iframe instead. That fixes four things at
     * once: document.write works because the iframe is a fresh document; the
     * widget cannot read this page or its cookies; Drive cannot rewrite links
     * that are not in our DOM; and the frame keeps a fixed height.
     *
     * Paste the snippet exactly as Travelpayouts gives it. Nothing here is
     * executed in the Studio or on our own origin.
     *
     * Only ever paste code from a party you are actually doing business with. An
     * embed runs whatever it is sent, and the sandbox limits the blast radius
     * rather than removing it.
     */
    defineField({
      name: 'embedCode',
      title: 'Embed code (widgets)',
      type: 'text',
      rows: 6,
      description:
        'For Travelpayouts widgets and anything else that ships as a script tag. Paste the snippet unchanged. An embed booking needs no creative image and no click-through URL. Set the width in the provider\'s customizer to match the slot: 336 for B, C and E, 300 for D, 970 for F.',
    }),

    /**
     * Height is the one thing a widget provider will not tell you in advance:
     * the form is as tall as its fields end up at the width you chose. So it is
     * recorded per booking rather than per slot, and the frame reserves exactly
     * this many pixels.
     *
     * Get the number from the provider's live preview, or place it once and
     * measure the frame in devtools. Too small and the Search button is clipped,
     * which is the only failure that costs money rather than looks.
     */
    defineField({
      name: 'embedHeight',
      title: 'Embed height (px)',
      type: 'number',
      description:
        'Measured height of the widget at the width you configured. Reserved exactly, so the page never shifts. Err 20px high rather than low — a clipped Search button converts nothing.',
      validation: (r) =>
        r.min(40).max(1200).custom((height, ctx) => {
          const doc = ctx.document as { embedCode?: string } | undefined
          if (doc?.embedCode && !height) return 'An embed needs a height, or it has nothing to reserve.'
          return true
        }),
    }),
    defineField({
      name: 'tier',
      type: 'string',
      options: {
        list: [
          { title: 'Sponsor', value: 'sponsor' },
          { title: 'Partner', value: 'partner' },
          { title: 'Supporter', value: 'supporter' },
          { title: 'House ad (our own services)', value: 'house' },
        ],
        layout: 'radio',
      },
      initialValue: 'supporter',
    }),
    defineField({ name: 'activeFrom', type: 'date', validation: (r) => r.required() }),
    defineField({
      name: 'activeTo',
      type: 'date',
      validation: (r) =>
        r.required().custom((to, ctx) => {
          const from = (ctx.document as { activeFrom?: string } | undefined)?.activeFrom
          if (from && to && new Date(to) < new Date(from)) return 'End date must be after start date.'
          return true
        }),
    }),
    defineField({
      name: 'slots',
      title: 'Booked slots',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        // These must match AD_SIZES in web/src/lib/media.ts exactly. G and G's
        // neighbour H were removed there after being defined and never placed
        // on any page, and were left in this list for a while afterwards, so a
        // booking could be made against a slot that renders nowhere. Sizes are
        // named here because the person booking needs to know what artwork to
        // ask for.
        list: [
          { title: 'A - header leaderboard, 970x250 (off by default)', value: 'A' },
          { title: 'B - in-article, after paragraph 3, 336x280', value: 'B' },
          { title: 'C - in-article, after paragraph 8, 336x280', value: 'C' },
          { title: 'D - article rail, 300x600', value: 'D' },
          { title: 'E - end of article, 336x280', value: 'E' },
          { title: 'F - between homepage sections, 970x90', value: 'F' },
          { title: 'I - left gutter skyscraper, 160x600 (above 1500px only)', value: 'I' },
          { title: 'J - right gutter skyscraper, 160x600 (above 1500px only)', value: 'J' },
        ],
      },
      validation: (r) => r.required().min(1),
    }),
    /**
     * Section targeting.
     *
     * Left empty, a booking runs on every page that renders its slot — which is
     * how every booking behaved before this field existed, and why empty has to
     * keep meaning "everywhere". Filling it in narrows the booking to those
     * sections and nothing else.
     *
     * This exists because affiliate inventory and editorial inventory want
     * opposite things. A hotel banner earns its place at the foot of a
     * conference report and looks like a mistake halfway through a piece on
     * prayer. Slot alone cannot tell those two pages apart.
     *
     * Slugs must match SECTION_SLUGS in web/src/lib/sections.ts. A slug that
     * matches no section targets nothing, silently — the same failure mode as
     * booking a slot that no page renders.
     *
     * Only article pages carry a section. Slot F sits on the homepage and the
     * index pages, which belong to no section, so a targeted booking will not
     * appear there at all.
     */
    defineField({
      name: 'sections',
      title: 'Limit to sections',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description:
        'Leave empty to run everywhere. Choose sections to restrict this booking to articles in them — useful for affiliate and travel creative that only suits some coverage. Note that slot F (homepage and index pages) belongs to no section, so a restricted booking never runs there.',
      options: {
        list: [
          { title: 'Faith', value: 'faith' },
          { title: 'Culture', value: 'culture' },
          { title: 'Technology', value: 'technology' },
          { title: 'Work & Money', value: 'work-money' },
          { title: 'Wellbeing', value: 'wellbeing' },
          { title: 'Campus', value: 'campus' },
          { title: 'Heritage', value: 'heritage' },
          { title: 'Current', value: 'current' },
        ],
      },
    }),
    defineField({
      name: 'notes',
      type: 'text',
      rows: 3,
      description: 'Internal. Contract terms, invoice status, contact.',
    }),
  ],
  preview: {
    // Targeting is shown here because it is otherwise invisible until you open
    // the booking, and a booking narrowed to one section behaves very
    // differently from one that is not.
    select: {
      title: 'name',
      tier: 'tier',
      slots: 'slots',
      sections: 'sections',
      embedCode: 'embedCode',
      media: 'logo',
    },
    prepare: ({ title, tier, slots, sections, embedCode, media }) => {
      const where = (sections as string[] | undefined)?.length
        ? (sections as string[]).join(', ')
        : 'all sections'
      const kind = embedCode ? 'embed' : 'image'
      return {
        title,
        subtitle: `${kind} · ${tier ?? 'supporter'} · ${(slots as string[] | undefined)?.join('') || 'no slot'} · ${where}`,
        media,
      }
    },
  },
})
