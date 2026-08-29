import { defineType, defineField, defineArrayMember } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'

/**
 * ONE article type with a `kind` discriminator - blueprint s7.
 *
 * Sanity has no schema inheritance. Three separate document types would force
 * every homepage, section, tag and related-articles query to union across all
 * of them. One type keeps every query and every reference simple.
 *
 * `readingTime` is deliberately absent: it is derived at render, because a
 * stored value goes stale on every edit.
 */
export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Filing' },
    { name: 'kindMeta', title: 'Type-specific' },
    { name: 'disclosure', title: 'Disclosure' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ---- Content ---------------------------------------------------------
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (r) => r.required().max(110).warning('Long headlines wrap badly in Anton.'),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 80 },
      validation: (r) =>
        r.required().custom((slug) => {
          if (!slug?.current) return 'Required'
          if (!/^[a-z0-9-]+$/.test(slug.current)) return 'Lowercase letters, numbers and hyphens only.'
          return true
        }),
    }),
    defineField({
      name: 'deck',
      title: 'Deck / standfirst',
      type: 'text',
      rows: 2,
      group: 'content',
      description: 'The italic line under the headline. One sentence.',
      validation: (r) => r.max(220).warning('Decks read best under 220 characters.'),
    }),
    defineField({
      name: 'hero',
      title: 'Lead image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() }),
        defineField({ name: 'caption', type: 'string' }),
        defineField({
          name: 'credit',
          type: 'string',
          description: 'Photographer or archive source. Required for archival images.',
        }),
      ],
    }),
    defineField({
      name: 'heroExternal',
      title: 'Lead image from a URL (Cloudinary)',
      type: 'externalImage',
      group: 'content',
      description:
        'Use this instead of uploading above. If a URL is set here it is used and the upload is ignored, so you never end up with two versions of the same picture.',
      options: { collapsible: true, collapsed: true },
    }),
    defineField({ name: 'body', type: 'blockContent', group: 'content' }),

    // ---- Filing ----------------------------------------------------------
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      group: 'meta',
      description: 'The discriminator. Controls which type-specific block applies below.',
      options: {
        list: [
          { title: 'Feature', value: 'feature' },
          { title: 'Interview', value: 'interview' },
          { title: 'Review', value: 'review' },
          { title: 'Essay', value: 'essay' },
        ],
        layout: 'radio',
      },
      initialValue: 'feature',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'section',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'section' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      group: 'meta',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })],
      validation: (r) => r.unique().max(8).warning('More than eight tags dilutes the tag indexes.'),
    }),
    defineField({
      name: 'authors',
      type: 'array',
      group: 'meta',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'author' }] })],
      validation: (r) => r.required().min(1).unique(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      group: 'meta',
      description:
        'For archive pieces this is the REPUBLICATION date, not the original. The original issue date lives in Archive provenance and is displayed prominently. Blueprint s7.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Homepage placement',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: 'Not featured', value: 'none' },
          { title: 'Hero - the cover story slot', value: 'hero' },
          { title: 'Featured in its section block', value: 'featured' },
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
    /**
     * Retraction.
     *
     * Added 30 August 2026, when three pieces in the archive's "Missionary
     * Story" column turned out to be third-party text running under a staff
     * byline. Two were already live.
     *
     * Deleting them would have been the quick fix and the wrong one: it
     * destroys the record of what was published and for how long, which is the
     * first thing anyone asks about afterwards. So a retracted piece stays in
     * the dataset with the reason attached, and simply stops being public.
     */
    defineField({
      name: 'retracted',
      title: 'Retracted',
      type: 'boolean',
      group: 'meta',
      description:
        'Takes the piece off the site immediately - out of its section, out of search, out of the sitemap - while keeping the document and the reason on file. Use this rather than deleting.',
      initialValue: false,
    }),
    defineField({
      name: 'retractedAt',
      type: 'datetime',
      group: 'meta',
      hidden: ({ parent }) => !parent?.retracted,
    }),
    defineField({
      name: 'retractionNote',
      title: 'Why it was retracted',
      type: 'text',
      rows: 4,
      group: 'meta',
      hidden: ({ parent }) => !parent?.retracted,
      description: 'Specific enough to answer a rights-holder. Name the source if the problem is provenance.',
      validation: (r) =>
        r.custom((value, ctx) => {
          const parent = ctx.parent as { retracted?: boolean } | undefined
          if (parent?.retracted && !value) return 'Say why. A retraction with no reason is not a record.'
          return true
        }),
    }),

    defineField({
      name: 'relatedArticles',
      title: 'Read next',
      type: 'array',
      group: 'meta',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
      validation: (r) => r.unique().max(4),
    }),

    // ---- Type-specific blocks -------------------------------------------
    defineField({
      name: 'interviewMeta',
      title: 'Interview',
      type: 'object',
      group: 'kindMeta',
      hidden: ({ parent }) => parent?.kind !== 'interview',
      fields: [
        defineField({ name: 'subject', type: 'string', title: 'Subject name' }),
        defineField({ name: 'subjectBio', type: 'text', rows: 2 }),
        defineField({
          name: 'subjectPhoto',
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', type: 'string' })],
        }),
        defineField({
          name: 'country',
          type: 'string',
          description: 'Drives the alternating India / international cover rhythm.',
        }),
        defineField({
          name: 'isCoverStory',
          title: 'Cover story',
          type: 'string',
          options: {
            list: [
              { title: 'Cover story', value: 'cover' },
              { title: 'Talent Search profile', value: 'talentSearch' },
              { title: 'Standard interview', value: 'standard' },
            ],
            layout: 'radio',
          },
          initialValue: 'standard',
        }),
        defineField({
          name: 'consentOnFile',
          title: 'Written consent on file',
          type: 'string',
          description:
            'Blueprint s8: get written consent from every interviewee, and let the subject review their own quotes before publication. Especially where the piece touches conversion testimony.',
          options: {
            list: [
              { title: 'Yes - consent and quote review complete', value: 'yes' },
              { title: 'Consent yes, quote review outstanding', value: 'partial' },
              { title: 'No - do not publish', value: 'no' },
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'pullQuotes',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          description: 'Optional. Standalone pull quotes for social and the issue browser.',
        }),
      ],
      options: { collapsible: true, collapsed: false },
    }),
    defineField({
      name: 'reviewMeta',
      title: 'Review',
      type: 'object',
      group: 'kindMeta',
      hidden: ({ parent }) => parent?.kind !== 'review',
      fields: [
        defineField({ name: 'workTitle', type: 'string', title: 'Title of the work' }),
        defineField({ name: 'creator', type: 'string', title: 'Author / director / artist' }),
        defineField({
          name: 'workType',
          type: 'string',
          options: {
            list: ['book', 'film', 'album', 'series', 'exhibition', 'game'],
          },
        }),
        defineField({
          name: 'rating',
          type: 'number',
          description: 'Out of 5. Leave blank for reviews that should not carry a score.',
          validation: (r) => r.min(1).max(5),
        }),
        defineField({ name: 'year', type: 'number' }),
      ],
      options: { collapsible: true },
    }),
    defineField({
      name: 'archiveMeta',
      title: 'Archive provenance',
      type: 'object',
      group: 'kindMeta',
      description:
        'Fill in for anything republished from the 2012-14 issues. Display shows the original issue prominently; publishedAt carries the freshness signal.',
      fields: [
        defineField({
          name: 'originalIssue',
          type: 'reference',
          to: [{ type: 'archiveIssue' }],
        }),
        defineField({ name: 'originalPage', type: 'number' }),
        defineField({ name: 'republishedAt', type: 'date' }),
        defineField({
          name: 'editNote',
          type: 'string',
          description: 'e.g. "Lightly edited for length and clarity." Shown to readers.',
        }),
        defineField({
          name: 'rightsCleared',
          title: 'Rights cleared',
          type: 'string',
          description:
            'Blueprint s1. Text rights and image rights are separate questions - photographs may have been licensed for the print issue only.',
          options: {
            list: [
              { title: 'Text and images cleared', value: 'full' },
              { title: 'Text cleared, images replaced', value: 'textOnly' },
              { title: 'Not yet checked - do not publish', value: 'unchecked' },
            ],
            layout: 'radio',
          },
        }),
      ],
      options: { collapsible: true, collapsed: true },
    }),

    // ---- Disclosure ------------------------------------------------------
    defineField({
      name: 'sponsorTier',
      title: 'Sponsorship',
      type: 'string',
      group: 'disclosure',
      description:
        'THE most important field in the schema. It drives the disclosure label automatically, so the label can never be forgotten. Manual labelling fails eventually, and the failure is a compliance problem.',
      options: {
        list: [
          { title: 'None - ordinary editorial', value: 'none' },
          { title: 'Sponsored - paid placement, written by us', value: 'sponsored' },
          { title: 'Supplied - written by the advertiser', value: 'supplied' },
        ],
        layout: 'radio',
      },
      initialValue: 'none',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'sponsor',
      type: 'reference',
      group: 'disclosure',
      to: [{ type: 'advertiser' }],
      hidden: ({ parent }) => !parent?.sponsorTier || parent.sponsorTier === 'none',
      validation: (r) =>
        r.custom((value, ctx) => {
          const tier = (ctx.document as { sponsorTier?: string } | undefined)?.sponsorTier
          if (tier && tier !== 'none' && !value) return 'Name the sponsor for any paid placement.'
          return true
        }),
    }),

    // ---- SEO -------------------------------------------------------------
    defineField({
      name: 'seo',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          description: 'Falls back to the headline.',
          validation: (r) => r.max(62).warning('Google truncates past ~60 characters.'),
        }),
        defineField({
          name: 'description',
          type: 'text',
          rows: 2,
          description: 'Falls back to the deck.',
          validation: (r) => r.max(160).warning('Keep under 160 characters.'),
        }),
        defineField({
          name: 'ogImage',
          type: 'image',
          description: 'Falls back to the lead image.',
        }),
        defineField({
          name: 'noIndex',
          title: 'Hide from search engines',
          type: 'boolean',
          initialValue: false,
        }),
      ],
      options: { collapsible: true, collapsed: true },
    }),
  ],

  orderings: [
    { name: 'newest', title: 'Newest first', by: [{ field: 'publishedAt', direction: 'desc' }] },
    { name: 'oldest', title: 'Oldest first', by: [{ field: 'publishedAt', direction: 'asc' }] },
  ],

  preview: {
    select: {
      title: 'title',
      kind: 'kind',
      section: 'section.name',
      media: 'hero',
      sponsorTier: 'sponsorTier',
    },
    prepare({ title, kind, section, media, sponsorTier }) {
      const flag = sponsorTier && sponsorTier !== 'none' ? ` - ${sponsorTier.toUpperCase()}` : ''
      return {
        title,
        subtitle: `${section ?? 'Unfiled'} - ${kind ?? 'feature'}${flag}`,
        media,
      }
    },
  },
})
