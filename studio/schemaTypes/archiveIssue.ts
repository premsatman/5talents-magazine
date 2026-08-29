import { defineType, defineField, defineArrayMember } from 'sanity'
import { BookIcon } from '@sanity/icons/Book'

/**
 * One of the 17 back issues, 2012-2014.
 *
 * Note on the PDF field: blueprint trigger 2 warns that 119 MB of PDFs may push
 * the Sanity free asset allowance. If it does, host the raw files on R2 and put
 * the URL in `pdfUrl` instead of uploading to `pdfFile`. Both are supported.
 */
export const archiveIssue = defineType({
  name: 'archiveIssue',
  title: 'Archive issue',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'As printed, e.g. "August 2013" or "March-April 2014".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 40 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'issueDate',
      type: 'date',
      options: { dateFormat: 'YYYY-MM' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'issueNumber',
      type: 'number',
      description: 'Where the original printed one.',
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'pdfFile',
      title: 'Original issue PDF',
      type: 'file',
      options: { accept: '.pdf' },
      description: 'Kept as a downloadable "original issue" alongside the web articles.',
    }),
    defineField({
      name: 'pdfUrl',
      title: 'Original issue PDF (external URL)',
      type: 'url',
      description: 'Use instead of the upload above if the PDFs are hosted off-Sanity.',
    }),
    defineField({ name: 'pageCount', type: 'number' }),
    defineField({
      name: 'tableOfContents',
      type: 'array',
      description: 'Transcribed from the printed contents page. Drives the issue browser.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'entry',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'page', type: 'number' }),
            defineField({ name: 'byline', type: 'string' }),
            defineField({
              name: 'article',
              title: 'Republished as',
              type: 'reference',
              to: [{ type: 'article' }],
              description: 'Link once the piece has been cleaned up and published to the web.',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'byline' } },
        }),
      ],
    }),
  ],
  orderings: [
    { name: 'chron', title: 'Newest first', by: [{ field: 'issueDate', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'issueDate', media: 'coverImage' },
  },
})
