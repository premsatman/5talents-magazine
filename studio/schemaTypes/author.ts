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
    /**
     * Editorial board fields.
     *
     * Only needed for the people listed in siteSettings.editorialBoard. ISSN
     * India requires, for each board member: full name, designation, complete
     * affiliated institutional address, institutional email (personal
     * addresses like Gmail and Yahoo are to be avoided), and a profile link
     * hosted on the affiliated institution's own website. Detailed information
     * document, section 3. A contributor who is not on the board leaves all of
     * these empty.
     */
    defineField({
      name: 'designation',
      type: 'string',
      description:
        'Their job title at their institution \u2014 Professor of New Testament, Principal, Managing Editor. Distinct from "role", which is what they do for 5Talents.',
    }),
    defineField({
      name: 'institutionAddress',
      title: 'Institutional postal address',
      type: 'text',
      rows: 3,
      description: 'Complete postal address of the institution, including city, state, PIN and country.',
    }),
    defineField({
      name: 'institutionalEmail',
      type: 'string',
      description:
        'On the institution\u2019s own domain. Gmail, Yahoo and the like are explicitly to be avoided, and this is the address ISSN India writes to during verification.',
      validation: (r) =>
        r.email().custom((value) => {
          if (!value) return true
          const consumer = ['gmail.', 'yahoo.', 'hotmail.', 'outlook.', 'rediffmail.', 'proton.', 'icloud.']
          const lower = value.toLowerCase()
          return consumer.some((domain) => lower.includes('@' + domain) || lower.includes('.' + domain))
            ? 'ISSN India asks that personal addresses like Gmail and Yahoo be avoided for editorial board members. Use the institution\u2019s own domain.'
            : true
        }),
    }),
    defineField({
      name: 'profileUrl',
      title: 'Institutional profile link',
      type: 'url',
      description:
        'Their staff or faculty page on the institution\u2019s own website. Only institution-hosted profiles are accepted \u2014 LinkedIn, ResearchGate and personal sites are not.',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    /**
     * Date of death, where the contributor has died.
     *
     * The archive is thirteen years old and this is going to keep happening.
     * Ingrid Albuquerque-Solomon died on 2 May 2023; V. Bhaskar Rao has also
     * died. Their pages carry a byline in the present tense and a bio that says
     * what they "runs" and "publishes", which reads badly and is untrue.
     *
     * Setting this puts a quiet line on the piece and on the contributor page.
     * It also means the re-interview list can be filtered honestly, rather than
     * somebody writing to an address that nobody is reading.
     */
    defineField({
      name: 'died',
      title: 'Date of death',
      type: 'date',
      description:
        'Set only where the contributor has died and it has been verified. Adds an in memoriam line to their pieces.',
    }),
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
          // A dead contributor cannot consent, and "pending" would imply we are
          // waiting on a reply that is never coming. Rights pass to the estate.
          { title: 'Contributor has died - ask the estate', value: 'estate' },
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
