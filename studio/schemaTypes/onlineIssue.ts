import { defineType, defineField } from 'sanity'
import { DocumentsIcon } from '@sanity/icons/Documents'

/**
 * One issue of the online magazine.
 *
 * This is not `archiveIssue`. That type models the 18 early issues of
 * 2012-2014, which exist as PDFs with a page-numbered table of contents and
 * were circulated privately rather than published. This one models the web
 * magazine, where an issue is a set of article documents and nothing is a PDF.
 *
 * It exists because ISSN India requires two things a continuously-published
 * feed cannot give them:
 *
 *   - an archive listing the issues, each one listing its articles by title
 *     with a separate link per article (detailed information document, s4 -
 *     which also says to avoid linking a single consolidated PDF of an issue,
 *     so the print archive's PDF model must not be reused here);
 *   - bibliographic details on the first page of every article: publication
 *     name, volume, issue, month, year (s7).
 *
 * The 5+ articles per issue in `validation` is their floor for a non-annual
 * publication, and an issue that falls short is not counted as a complete
 * issue during assessment. Membership lives on the article, not here, so that
 * an article moves between issues by editing the article.
 *
 * Volume 1 is 2026, the year the site went live and the year declared as the
 * start of the online format. Volume 2 opens in January 2027 with the monthly
 * cadence proper. See issn/PLAN.md.
 */
export const onlineIssue = defineType({
  name: 'onlineIssue',
  title: 'Online issue',
  type: 'document',
  icon: DocumentsIcon,
  fields: [
    defineField({
      name: 'volume',
      type: 'number',
      description: 'Volume 1 is 2026. One volume per calendar year.',
      validation: (r) => r.required().integer().min(1),
    }),
    defineField({
      name: 'issueNumber',
      title: 'Issue number',
      type: 'number',
      description: 'Restarts at 1 with each volume.',
      validation: (r) => r.required().integer().min(1),
    }),
    defineField({
      name: 'issueDate',
      title: 'Month of issue',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
      description: 'The month and year this issue carries. Drives the citation line on every article in it.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'e.g. "vol-1-issue-3". Used for /issues/[slug].',
      options: {
        maxLength: 40,
        source: (doc) => `vol-${doc.volume ?? ''}-issue-${doc.issueNumber ?? ''}`,
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
      description: 'One paragraph introducing the issue. Shown at the head of the issue page.',
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
  ],
  orderings: [
    {
      name: 'chron',
      title: 'Newest first',
      by: [
        { field: 'volume', direction: 'desc' },
        { field: 'issueNumber', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: { volume: 'volume', issueNumber: 'issueNumber', date: 'issueDate', media: 'coverImage' },
    prepare: ({ volume, issueNumber, date, media }) => ({
      title: `Volume ${volume ?? '?'}, Issue ${issueNumber ?? '?'}`,
      subtitle: date ?? 'No month set',
      media,
    }),
  },
})
