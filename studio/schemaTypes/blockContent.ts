import { defineType, defineArrayMember, defineField } from 'sanity'
import { ImageIcon } from '@sanity/icons/Image'

/**
 * Body copy. Deliberately restrained: a magazine body is paragraphs, one level
 * of subhead, pull quotes and images. Anything more and the archive cleanup in
 * blueprint s7 becomes harder, not easier.
 */
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Subhead', value: 'h2' },
        { title: 'Sub-subhead', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Italic', value: 'em' },
          { title: 'Bold', value: 'strong' },
          {
            title: 'Highlight',
            value: 'highlight',
            // The brush stroke. Design system s2: one highlight per screen.
          },
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              defineField({
                name: 'href',
                type: 'url',
                validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto'] }),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      icon: ImageIcon,
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          validation: (r) => r.required().error('Alt text is required.'),
        }),
        defineField({ name: 'caption', type: 'string' }),
        defineField({
          name: 'credit',
          type: 'string',
          description:
            'Blueprint s1: archive images may have been licensed for the print issue only. Record the source.',
        }),
      ],
    }),
    // The same picture, hosted on Cloudinary rather than uploaded here.
    defineArrayMember({ type: 'externalImage' }),
    // Poetry. Portable Text collapses single line breaks inside a paragraph,
    // which turns a poem into prose - so verse gets its own block where the
    // line endings are the author's and are preserved exactly.
    defineArrayMember({
      type: 'object',
      name: 'verse',
      title: 'Verse',
      fields: [
        defineField({
          name: 'text',
          type: 'text',
          rows: 10,
          description: 'Line breaks are kept exactly as typed. One stanza per block.',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'attribution',
          type: 'string',
          description: 'Optional. A scripture reference, or who is speaking.',
        }),
      ],
      preview: { select: { title: 'text', subtitle: 'attribution' } },
    }),
    defineArrayMember({
      type: 'object',
      name: 'pullQuote',
      title: 'Pull quote',
      fields: [
        defineField({ name: 'quote', type: 'text', rows: 3, validation: (r) => r.required() }),
        defineField({ name: 'attribution', type: 'string' }),
        defineField({
          name: 'highlightPhrase',
          type: 'string',
          description:
            'Optional. A short phrase inside the quote to mark with the brush stroke. Must appear in the quote verbatim. Use sparingly - once per article at most.',
        }),
      ],
      preview: { select: { title: 'quote', subtitle: 'attribution' } },
    }),
  ],
})
