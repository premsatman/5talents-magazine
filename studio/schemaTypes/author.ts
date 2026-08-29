import { defineType, defineField, defineArrayMember } from 'sanity'
import { UserIcon } from '@sanity/icons/User'

export const author = defineType({
  name: 'author',
  title: 'Contributor',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name', maxLength: 60 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'photo',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
    defineField({
      name: 'bio',
      type: 'text',
      rows: 3,
      description: 'Two sentences. Appears under every piece they write.',
      validation: (r) => r.max(320).warning('Author cards look best under 320 characters.'),
    }),
    defineField({ name: 'role', type: 'string', description: 'e.g. Executive Director, Contributing writer' }),
    defineField({
      name: 'institution',
      type: 'string',
      description: 'Bible college, seminary, church or employer. Matters for the Campus section.',
    }),
    defineField({ name: 'country', type: 'string' }),
    defineField({
      name: 'isStaff',
      title: 'Masthead',
      type: 'string',
      options: {
        list: [
          { title: 'Staff / masthead', value: 'staff' },
          { title: 'Contributor', value: 'contributor' },
        ],
        layout: 'radio',
      },
      initialValue: 'contributor',
    }),
    defineField({
      name: 'socials',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'social',
          fields: [
            defineField({
              name: 'platform',
              type: 'string',
              options: {
                list: ['website', 'instagram', 'x', 'linkedin', 'youtube', 'substack'],
              },
            }),
            defineField({
              name: 'url',
              type: 'url',
              validation: (r) => r.uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({
      name: 'republishConsent',
      title: 'Archive republication consent',
      type: 'string',
      description:
        'Blueprint s1: check original contributor agreements before republishing named writers. Record the answer here so it is not re-litigated per article.',
      options: {
        list: [
          { title: 'Not applicable (new contributor)', value: 'na' },
          { title: 'Consent given', value: 'granted' },
          { title: 'Asked, no reply - hold their pieces', value: 'pending' },
          { title: 'Declined - do not republish', value: 'declined' },
        ],
        layout: 'radio',
      },
      initialValue: 'na',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo' },
  },
})
