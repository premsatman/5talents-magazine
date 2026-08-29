import { defineType, defineField, defineArrayMember } from 'sanity'
import { CaseIcon } from '@sanity/icons/Case'

/**
 * Direct-sold advertising. Slots D, F and G are live from launch (blueprint s7);
 * A, B, C and E are AdSense inventory and fall back to the house ad when unsold.
 */
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
      description: 'The image served in the slot. Must match the slot dimensions exactly.',
      fields: [defineField({ name: 'alt', type: 'string', validation: (r) => r.required() })],
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
        list: [
          { title: 'A - header leaderboard', value: 'A' },
          { title: 'B - in-article, after paragraph 3', value: 'B' },
          { title: 'C - in-article, after paragraph 8', value: 'C' },
          { title: 'D - sidebar sticky, desktop', value: 'D' },
          { title: 'E - end of article', value: 'E' },
          { title: 'F - between homepage sections', value: 'F' },
          { title: 'G - newsletter inline', value: 'G' },
          { title: 'H - house ad', value: 'H' },
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
