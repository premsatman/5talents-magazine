import { defineType, defineField } from 'sanity'
import { TagIcon } from '@sanity/icons/Tag'

/**
 * The nine sections from blueprint s4. Slugs here MUST match the allowlist in
 * web/src/lib/sections.ts - that allowlist is what stops typo'd URLs falling
 * into /[section] and generating soft-404s at scale.
 */
export const section = defineType({
  name: 'section',
  title: 'Section',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name', maxLength: 40 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      description: 'Shown at the top of the section index and used as its meta description.',
      validation: (r) => r.max(200).warning('Keep under 200 characters for search results.'),
    }),
    defineField({
      name: 'ordering',
      title: 'Order in navigation',
      type: 'number',
      validation: (r) => r.required().integer(),
    }),
  ],
  orderings: [
    { name: 'nav', title: 'Navigation order', by: [{ field: 'ordering', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'slug.current' },
  },
})
