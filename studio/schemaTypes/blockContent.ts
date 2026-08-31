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
    /**
     * An editor's note — the magazine speaking in its own voice, not the
     * author's.
     *
     * Added for Bhaskar Rao, interviewed in 2012 and died in May 2026. A
     * reader landing on that page needs to know both facts before the first
     * present-tense sentence, or the piece misleads them about something that
     * matters to the people who knew him.
     *
     * The archive will keep needing this. Every 2012-14 interview is being
     * republished more than a decade later, and some of those subjects have
     * died, changed ministries or would tell the story differently now. The
     * note is how the magazine says so without editing what the person
     * actually said.
     */
    defineArrayMember({
      type: 'object',
      name: 'editorsNote',
      title: "Editor's note",
      fields: [
        defineField({
          name: 'text',
          type: 'text',
          rows: 4,
          description:
            'The magazine in its own voice. Keep it factual and short. Use it to frame a piece, never to argue with it.',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'placement',
          type: 'string',
          options: {
            list: [
              { title: 'Above the article', value: 'top' },
              { title: 'At the foot of the article', value: 'foot' },
            ],
            layout: 'radio',
          },
          initialValue: 'top',
        }),
      ],
      preview: {
        select: { title: 'text', subtitle: 'placement' },
        prepare: ({ title, subtitle }) => ({
          title: title || "Editor's note",
          subtitle: subtitle === 'foot' ? 'At the foot' : 'Above the article',
        }),
      },
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
