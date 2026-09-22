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
/** Fixed _id of the Screen section document, created with this id on purpose. */
export const SCREEN_SECTION_ID = 'section-screen'

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
        /**
         * Credit is not a licence.
         *
         * A credit line is what a licence usually REQUIRES; it is never what
         * creates one. A `credit` string alone cannot record why we may use a
         * picture, so it cannot stop the mistake. This can. Deliberately not
         * required() - that would block every existing article on next save.
         * Make it required once the back catalogue is filled in.
         */
        defineField({
          name: 'rightsBasis',
          title: 'Why we may use this image',
          type: 'string',
          description:
            'Credit is not permission. Every image needs a basis, and "found it online" is not one.',
          options: {
            list: [
              { title: 'Ours - we made it, or it is from our own archive', value: 'owned' },
              { title: 'Licensed stock - Adobe, Envato, paid', value: 'licensed' },
              { title: 'Free licence - Unsplash, Pexels', value: 'free' },
              { title: 'Creative Commons - credit is required by the licence', value: 'cc' },
              { title: 'Written permission from the rights holder', value: 'permission' },
              { title: 'Public domain', value: 'publicDomain' },
              { title: 'AI generated', value: 'generated' },
            ],
          },
        }),
        defineField({
          name: 'rightsNote',
          title: 'Where the permission lives',
          type: 'string',
          description:
            'For CC: the licence and the attribution string. For permission: where the reply is saved, e.g. "DM from @handle, 12 Sep 2026". For stock: the licence or order number.',
          hidden: ({ parent }) =>
            !['cc', 'permission', 'licensed'].includes(
              (parent as { rightsBasis?: string } | undefined)?.rightsBasis ?? '',
            ),
          validation: (r) =>
            r.custom((value, ctx) => {
              const basis = (ctx.parent as { rightsBasis?: string } | undefined)?.rightsBasis
              if (['cc', 'permission', 'licensed'].includes(basis ?? '') && !value) {
                return 'Say where the permission is recorded. In six months nobody will remember.'
              }
              return true
            }),
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
    defineField({
      name: 'heroPortrait',
      title: 'Homepage hero image, portrait 3:4 (optional)',
      type: 'externalImage',
      group: 'content',
      description:
        'Only used when this piece is in the three homepage hero cards. Use it when the lead image is a text card: a landscape card cropped to portrait loses its words and fights the headline laid over it. Upload a 3:4 version with no big text, just the artwork and the 5TALENTS header.',
      options: { collapsible: true, collapsed: true },
    }),
    defineField({ name: 'body', type: 'blockContent', group: 'content' }),
    /**
     * Contributor's own links, printed after the piece.
     *
     * Deliberately a separate field rather than blocks inside `body`: these
     * belong after the article, not in the middle of it, and keeping them out
     * of the body means the reading-time count and the plain-text extract used
     * for search stay editorial. See endCards.ts for the disclosure rules.
     */
    defineField({
      name: 'endCards',
      title: 'Links after the piece',
      type: 'array',
      group: 'content',
      description:
        'The contributor’s own podcast, channel, book or site. Not for paid placement - that is an advertiser booking in an ad slot.',
      validation: (r) => r.max(4).warning('More than three or four and the end of the piece turns into a link farm.'),
      of: [
        defineArrayMember({ type: 'spotifyCard' }),
        defineArrayMember({ type: 'youtubeCard' }),
        defineArrayMember({ type: 'bookCard' }),
        defineArrayMember({ type: 'linkCard' }),
      ],
    }),

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
          { title: 'Brief - daily post', value: 'brief' },
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
    /**
     * Which online issue this piece belongs to.
     *
     * ISSN India wants the publication name, volume, issue, month and year on
     * the first page of every article (detailed information document, s7), and
     * an archive that lists each issue's articles with a link each (s4). One
     * reference gives both. Optional on the document so that nothing already
     * published breaks, but every live article needs one before the ISSN
     * application goes in.
     */
    defineField({
      name: 'onlineIssue',
      title: 'Online issue',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'onlineIssue' }],
      description: 'Drives the citation line on the article and its entry in the issue archive.',
      /**
       * Briefs stay outside the numbered issues.
       *
       * The ISSN application claims monthly frequency. If the daily stream
       * starts appearing inside numbered issues that claim stops being true,
       * so the schema refuses it rather than relying on anyone remembering.
       */
      hidden: ({ document }) => document?.kind === 'brief',
      validation: (r) =>
        r.custom((value, ctx) => {
          const kind = (ctx.document as { kind?: string } | undefined)?.kind
          if (kind === 'brief' && value) {
            return 'Briefs stay outside the numbered issues - the ISSN frequency claim depends on it.'
          }
          return true
        }),
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
    /**
     * Deliberately minimal.
     *
     * A five-checkbox verification form would be more thorough and would kill
     * the cadence by week two. The full check lives in the plan; what the
     * schema enforces is the one thing that must never be missing.
     */
    defineField({
      name: 'briefMeta',
      title: 'Brief',
      type: 'object',
      group: 'kindMeta',
      hidden: ({ parent }) => parent?.kind !== 'brief',
      fields: [
        defineField({
          name: 'sourceUrl',
          title: 'Primary source',
          type: 'url',
          description:
            'The report, the newsroom, the original upload. One link. If there is no source that can be named, there is no brief.',
        }),
        defineField({ name: 'sourceName', type: 'string', title: 'Source name' }),
        defineField({
          name: 'verifiedNote',
          title: 'What was checked',
          type: 'text',
          rows: 2,
          description:
            'One line for our own record: who covered it, whether the people and place are named, anything that did not check out.',
        }),
      ],
      options: { collapsible: true, collapsed: false },
    }),
    /**
     * Screen - film, series and streaming coverage. See readme/SCREEN-SECTION-PLAN.md.
     *
     * Shown only for articles filed under the Screen section (fixed id
     * `section-screen`). Feeds the "Watch it" card at the top of the article,
     * which is the block search and AI answers quote: where to watch, by country.
     * International first; India always gets its own row.
     */
    /**
     * Brand safety. A story about a suicide, abuse or a death should not sit
     * between a hair-transplant ad and a book promotion. Ticking this removes
     * every ad slot from the article page; nothing else changes.
     */
    defineField({
      name: 'sensitiveTopic',
      title: 'Sensitive story - hide all ads',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
      description: 'Tick for stories about suicide, abuse, violence or a death. Removes every ad from this article.',
    }),
    defineField({
      name: 'screenMeta',
      title: 'Screen - watch guide',
      type: 'object',
      group: 'kindMeta',
      hidden: ({ document }) =>
        (document as { section?: { _ref?: string } } | undefined)?.section?._ref !== SCREEN_SECTION_ID,
      fields: [
        defineField({ name: 'workTitle', title: 'Title of the film or series', type: 'string' }),
        defineField({
          name: 'workType',
          type: 'string',
          options: {
            list: [
              { title: 'Film', value: 'film' },
              { title: 'Series', value: 'series' },
              { title: 'Documentary', value: 'documentary' },
              { title: 'Docuseries', value: 'docuseries' },
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'releaseDate',
          title: 'Original release date',
          type: 'date',
          description: 'Worldwide or original premiere. Per-country dates go in the rows below.',
        }),
        defineField({
          name: 'availability',
          title: 'Where to watch, by country',
          description: 'One row per country. Aim for at least US, UK and India, plus any market you can confirm.',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'watchRow',
              fields: [
                defineField({
                  name: 'region',
                  type: 'string',
                  options: {
                    list: ['Global', 'US', 'UK', 'India', 'Philippines', 'Canada', 'Australia', 'Nigeria', 'Kenya', 'Other'],
                  },
                  validation: (r) => r.required(),
                }),
                defineField({ name: 'platform', type: 'string', description: 'Netflix, Prime Video, JioHotstar, cinemas, The Chosen app...', validation: (r) => r.required() }),
                defineField({ name: 'languages', type: 'string', description: 'Audio / subtitles, e.g. "English; Hindi and Tamil audio"' }),
                defineField({ name: 'releaseDate', type: 'date', title: 'Release date here' }),
              ],
              preview: { select: { title: 'region', subtitle: 'platform' } },
            }),
          ],
        }),
        defineField({
          name: 'contentAdvisory',
          title: 'Content advisory',
          type: 'object',
          options: { columns: 2 },
          fields: ['language', 'violence', 'sexualContent', 'themes'].map((name) =>
            defineField({
              name,
              type: 'string',
              options: { list: ['none', 'mild', 'moderate', 'strong'], layout: 'dropdown' },
            }),
          ),
        }),
        defineField({ name: 'advisoryNote', type: 'string', title: 'Advisory note', description: 'One line, e.g. "Deals with suicide and domestic abuse."' }),
        defineField({ name: 'trailerUrl', type: 'url', title: 'Official trailer (YouTube)' }),
        defineField({
          name: 'trailerAsHero',
          type: 'boolean',
          title: 'Use the trailer as the lead',
          initialValue: false,
          description:
            'Shows the trailer (its YouTube thumbnail with a play button) at the top of the article instead of our card. Only for an official trailer. Our card is still used on the homepage, in social shares and in Google Discover, because the thumbnail may only appear as part of the video.',
        }),
      ],
      options: { collapsible: true, collapsed: false },
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
        /**
         * Set this only when the piece was written again from scratch, rather
         * than cleaned up. The reader is then told both dates, which is the
         * honest description of what they are reading: the 2012 subject, the
         * 2026 words. Leave it empty for a lightly edited republication -
         * claiming a rewrite that did not happen is its own small dishonesty.
         */
        defineField({
          name: 'rewrittenAt',
          title: 'Rewritten on',
          type: 'date',
          description:
            'Only if the text was written fresh from sources. Shown to the reader as "Rewritten from primary sources in <month year>".',
        }),
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

  /**
   * A brief without a source is not publishable. Enforced at document level
   * because briefMeta is hidden for every other kind.
   */
  validation: (r) =>
    r.custom((doc) => {
      const d = doc as { kind?: string; briefMeta?: { sourceUrl?: string } } | undefined
      if (d?.kind === 'brief' && !d?.briefMeta?.sourceUrl) {
        return 'A brief needs a primary source link.'
      }
      return true
    }),

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
