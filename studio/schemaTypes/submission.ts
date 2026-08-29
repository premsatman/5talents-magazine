import { defineType, defineField } from 'sanity'
import { InboxIcon } from '@sanity/icons/Inbox'

/**
 * Created by the public /write-for-us form via the server route handler.
 *
 * Contributors submitting this way never need a Sanity account, which is what
 * keeps the free tier viable far longer than a "25 contributors" target
 * suggests (blueprint trigger 2). Only editors consume seats.
 */
export const submission = defineType({
  name: 'submission',
  title: 'Submission',
  type: 'document',
  icon: InboxIcon,
  // Never editable from the Studio - this is an inbox, not a content type.
  readOnly: true,
  fields: [
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'country', type: 'string' }),
    defineField({ name: 'institution', type: 'string' }),
    defineField({ name: 'proposedSection', type: 'string' }),
    defineField({ name: 'pitchTitle', type: 'string' }),
    defineField({ name: 'pitch', type: 'text', rows: 8 }),
    defineField({ name: 'links', type: 'text', rows: 3, title: 'Previously published work' }),
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: ['new', 'reading', 'commissioned', 'declined'],
      },
      initialValue: 'new',
    }),
    defineField({ name: 'submittedAt', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'pitchTitle', subtitle: 'name' },
  },
})
