import { defineType, defineField, defineArrayMember } from 'sanity'
import { CogIcon } from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'issn', title: 'Publisher & ISSN' },
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
        'Note the apostrophe: "God’s kingdom". It was set wrong on all 18 early issues.',
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
    /**
     * The editorial board is not the masthead and must not be collapsed into
     * it. The masthead is who makes the magazine; the board is the named group
     * of five-plus people ISSN India requires, each with an institutional
     * address, an institutional email and a profile page on their own
     * institution's website. Three of them are emailed at random during
     * assessment and have three days to reply. Detailed information document
     * for ISSN assignment, section 3.
     */
    defineField({
      name: 'editorialBoard',
      title: 'Editorial board',
      type: 'array',
      group: 'issn',
      description:
        'Minimum five members. Each person needs a designation, a complete institutional postal address, an institutional email (not Gmail or Yahoo) and a profile link on their institution\u2019s own site \u2014 all four are set on the contributor document.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'member',
          fields: [
            defineField({
              name: 'role',
              type: 'string',
              description:
                'Named explicitly, as ISSN India asks: Patron, Editor-in-Chief, Editor, Managing Editor, or Member.',
              options: {
                list: [
                  'Patron',
                  'Editor-in-Chief',
                  'Editor',
                  'Managing Editor',
                  'Associate Editor',
                  'Member',
                ],
              },
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'person',
              type: 'reference',
              to: [{ type: 'author' }],
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: 'role', subtitle: 'person.name' } },
        }),
      ],
      validation: (r) =>
        r.min(5).warning('ISSN India requires a minimum of five editorial board members.'),
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
        'Blueprint s4 and s8. This line is your public statement of what the magazine covers, and your evidence of scope if anyone asks. Since Sep 2026 it says we do cover Christian news, events and conferences — which likely places the site inside the IT Rules 2021 "news and current affairs" category. Keep it accurate to what you actually publish; a scope statement that overstates or understates is worse than none.',
      initialValue:
        '5Talents covers Christian culture, formation, news, events and conferences. We do not cover political controversy.',
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

    /**
     * Publisher of record.
     *
     * 5Talents has no publishing body: it is published by a person, which the
     * ISSN detailed information document explicitly allows ("personal address
     * to be given only in the case if publishing body does not exist and the
     * publication is being published in the name of a person"). That makes
     * these fields the publisher details, not a personal aside \u2014 they must
     * appear on the site and they must match the ISSN application form
     * character for character.
     */
    defineField({
      name: 'publisher',
      title: 'Publisher of record',
      type: 'object',
      group: 'issn',
      description:
        'Displayed in the footer of every page and in the journal particulars. Must match the ISSN application form exactly.',
      fields: [
        defineField({
          name: 'name',
          type: 'string',
          description: 'The person or body publishing the magazine. Same name as on the address proof filed with ISSN India.',
        }),
        defineField({
          name: 'address',
          title: 'Street address',
          type: 'text',
          rows: 2,
          description: 'Building, street and locality. City, state and PIN go in their own fields below.',
        }),
        defineField({ name: 'city', title: 'Town / city', type: 'string' }),
        defineField({ name: 'state', type: 'string' }),
        defineField({ name: 'pinCode', title: 'PIN code', type: 'string' }),
        defineField({ name: 'country', type: 'string', initialValue: 'India' }),
        defineField({
          name: 'email',
          type: 'string',
          description:
            'Must be on the magazine\u2019s own domain. Every later correction to the ISSN application has to be sent from this address.',
          validation: (r) => r.email(),
        }),
        defineField({ name: 'mobile', type: 'string' }),
      ],
    }),
    /**
     * The journal particulars block, from section 6 of the ISSN detailed
     * information document. It wants these exact rows on the publication's
     * opening page: title, frequency, ISSN, publisher name, publisher address,
     * starting year, subject, language, publication format, email, mobile.
     */
    defineField({
      name: 'particulars',
      title: 'Journal particulars',
      type: 'object',
      group: 'issn',
      description:
        'Rendered as the particulars table on the about page and in the footer strip. Every value here is also an answer on the ISSN application form \u2014 keep the two identical.',
      fields: [
        defineField({
          name: 'startYear',
          title: 'Starting year of the online edition',
          type: 'number',
          description:
            'The year the online format began publishing, which is what the ISSN form asks for \u2014 not the year the print magazine started. Decided 9 Sep 2026: 2026.',
          initialValue: 2026,
          validation: (r) => r.min(1900).max(2100),
        }),
        defineField({
          name: 'frequency',
          type: 'string',
          options: {
            list: ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Bi-monthly', 'Quarterly', 'Half-yearly', 'Annual'],
          },
          initialValue: 'Monthly',
        }),
        defineField({
          name: 'subject',
          type: 'string',
          description: 'Must match the Subject chosen on the ISSN application form.',
        }),
        defineField({
          name: 'languages',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          initialValue: ['English'],
        }),
        defineField({
          name: 'format',
          title: 'Publication format',
          type: 'string',
          options: { list: ['Online', 'Print', 'Online and Print'], layout: 'radio' },
          initialValue: 'Online',
        }),
        defineField({
          name: 'issnOnline',
          title: 'e-ISSN (online)',
          type: 'string',
          description:
            'Fill in once allotted. Provisional until the next issue is published and a request letter is sent from the registered address.',
        }),
        defineField({
          name: 'issnPrint',
          title: 'ISSN (print)',
          type: 'string',
          description:
            'A separate application. An ISSN assigned to one format may not be used for another.',
        }),
      ],
      options: { collapsible: true, collapsed: false },
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
          // Running our own promotions is not advertising and must not be
          // conflated with it. It sells nothing, takes no money, and does not
          // trigger the licence problem in the note above. Without this value
          // the only way to fill a slot with a subscribe promo was to declare
          // the site commercially ad-supported, which was untrue.
          { title: 'House ads only - our own promotions, nothing sold', value: 'house' },
          // Sold inventory wins the slot; a house promotion fills anything
          // nobody bought. The safe default once there are advertisers.
          { title: 'Direct-sold only - house fills unsold slots', value: 'direct' },
          // Both compete on equal terms and share the pages between them. Use
          // this while there are more slots than advertisers and the house
          // promotions are worth as much as the bookings.
          { title: 'Direct-sold + house, sharing the pages', value: 'mixed' },
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
          { title: 'A - header billboard, 970x250 (see the CWV warning)', value: 'A' },
          { title: 'B - in-article, after paragraph 3', value: 'B' },
          { title: 'C - in-article, after paragraph 8', value: 'C' },
          { title: 'D - sidebar sticky, desktop', value: 'D' },
          { title: 'E - end of article', value: 'E' },
          { title: 'F - between sections, 970x90 leaderboard', value: 'F' },
        ],
      },
      initialValue: ['B', 'E'],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site settings' }),
  },
})
