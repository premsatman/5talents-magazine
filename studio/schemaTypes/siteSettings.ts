import { defineType, defineField, defineArrayMember } from 'sanity'
import { CogIcon } from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'policy', title: 'Policy' },
    { name: 'ads', title: 'Advertising' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'identity',
      initialValue: '5Talents Magazine',
    }),
    defineField({
      name: 'tagline',
      type: 'string',
      group: 'identity',
      initialValue: "Discovering talents for God's kingdom",
      description:
        'Note the apostrophe: "God’s kingdom". It was set wrong on all 17 original issues.',
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      group: 'identity',
      description: 'Default meta description and RSS channel description.',
    }),
    defineField({
      name: 'mission',
      type: 'text',
      rows: 5,
      group: 'identity',
    }),
    defineField({
      name: 'masthead',
      type: 'array',
      group: 'identity',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'entry',
          fields: [
            defineField({ name: 'role', type: 'string' }),
            defineField({ name: 'person', type: 'reference', to: [{ type: 'author' }] }),
          ],
          preview: { select: { title: 'role', subtitle: 'person.name' } },
        }),
      ],
    }),
    defineField({
      name: 'doctrinalStatement',
      type: 'blockContent',
      group: 'identity',
    }),
    defineField({
      name: 'socials',
      type: 'array',
      group: 'identity',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'social',
          fields: [
            defineField({ name: 'platform', type: 'string' }),
            defineField({ name: 'url', type: 'url' }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),

    defineField({
      name: 'scopeStatement',
      title: 'Editorial scope statement',
      type: 'text',
      rows: 3,
      group: 'policy',
      description:
        'Blueprint s4 and s8. This line is your evidence of scope if anyone ever asks whether the IT Rules 2021 apply. It renders in the site footer and on the about page.',
      initialValue:
        '5Talents is a culture and formation magazine. We do not report news or cover political controversy.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'correctionsPolicy',
      type: 'blockContent',
      group: 'policy',
    }),
    defineField({
      name: 'privacyPolicy',
      type: 'blockContent',
      group: 'policy',
    }),
    defineField({
      name: 'contactEmail',
      type: 'string',
      group: 'policy',
      validation: (r) => r.email(),
    }),
    defineField({
      name: 'grievanceOfficer',
      type: 'object',
      group: 'policy',
      description:
        'Only needed if the media lawyer conversation in blueprint s8 concludes you ARE in scope for the IT Rules. Left blank otherwise.',
      fields: [
        defineField({ name: 'name', type: 'string' }),
        defineField({ name: 'email', type: 'string' }),
        defineField({ name: 'address', type: 'text', rows: 3 }),
      ],
      options: { collapsible: true, collapsed: true },
    }),

    defineField({
      name: 'adsEnabled',
      title: 'Advertising live',
      type: 'string',
      group: 'ads',
      description:
        'Blueprint trigger 1: the day this goes live is the day the Vercel Hobby licence stops covering you. Upgrade to Pro first.',
      options: {
        list: [
          { title: 'Off - pre-revenue', value: 'off' },
          { title: 'Direct-sold only', value: 'direct' },
          { title: 'Direct-sold + AdSense', value: 'all' },
        ],
        layout: 'radio',
      },
      initialValue: 'off',
    }),
    defineField({
      name: 'enabledSlots',
      title: 'Slots currently in use',
      type: 'array',
      group: 'ads',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'A - header leaderboard (see the CWV warning)', value: 'A' },
          { title: 'B - in-article, after paragraph 3', value: 'B' },
          { title: 'C - in-article, after paragraph 8', value: 'C' },
          { title: 'D - sidebar sticky, desktop', value: 'D' },
          { title: 'E - end of article', value: 'E' },
          { title: 'F - between homepage sections', value: 'F' },
          { title: 'G - newsletter inline', value: 'G' },
          { title: 'H - house ad', value: 'H' },
        ],
      },
      initialValue: ['B', 'E'],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site settings' }),
  },
})
