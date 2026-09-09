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
      validation: (r) => r.uri({ scheme: ['http', 'https'] }).required(),
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
    defineField({
      name: 'notes',
      type: 'text',
      rows: 3,
      description: 'Internal. Contract terms, invoice status, contact.',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'tier', media: 'logo' },
  },
})
