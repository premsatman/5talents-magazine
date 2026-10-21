import { defineType, defineField, defineArrayMember } from 'sanity'
import { PlayIcon } from '@sanity/icons/Play'
import { MicrophoneIcon } from '@sanity/icons/Microphone'

/**
 * 5Talents Rewind - the weekly Hinglish show - as a podcast.
 *
 * Two types. `podcastShow` holds what is true of the whole show (cover, the
 * description directories print, where to subscribe) and `podcastEpisode`
 * holds one week. Added 21 Oct 2026, after Episode 1.
 *
 * The website is the podcast's home, not a mirror of it: /rewind/feed.xml is
 * built from these documents, and Spotify, Apple, Amazon and YouTube read
 * that one feed. So the episode document is the single place an episode is
 * written down, and what is typed here is what every app shows.
 *
 * The show the site renders at /rewind has the fixed id REWIND_SHOW_ID. A
 * second show is a deploy-level decision - it needs its own route - for the
 * same reason a new section is (see web/src/lib/sections.ts).
 */
export const REWIND_SHOW_ID = 'podcast-rewind'

const TIMESTAMP = /^(\d{1,2}:)?\d{1,2}:\d{2}$/

export const podcastShow = defineType({
  name: 'podcastShow',
  title: 'Podcast show',
  type: 'document',
  icon: MicrophoneIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'tagline',
      type: 'string',
      description: 'One line under the title on /rewind. "5Talents ki khabrein, bina boring hue."',
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 5,
      description:
        'What the show is, for the podcast apps and the top of /rewind. Apple and Spotify print this on the show page, so write it for a stranger. Up to 4,000 characters; the first two lines are what most apps show.',
      validation: (r) => r.required().max(4000),
    }),
    defineField({
      name: 'cover',
      title: 'Cover art (square)',
      type: 'externalImage',
      description:
        'Square, 3000 x 3000, on Cloudinary. Apple refuses anything under 1400 x 1400 and anything not square. The feed asks Cloudinary for a JPG, so the source format does not matter.',
    }),
    defineField({
      name: 'language',
      type: 'string',
      initialValue: 'hi',
      description:
        'Language code for the feed. Rewind is Hinglish; "hi" puts it in front of Hindi listeners, which is who it is for.',
    }),
    defineField({
      name: 'ownerEmail',
      title: 'Owner email',
      type: 'string',
      initialValue: 'editorial@5talentsmag.com',
      description:
        'Apple and Spotify send the ownership-verification code here, and the feed is locked to it. Must be a mailbox someone reads.',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'links',
      title: 'Where to listen',
      type: 'object',
      description: 'Fill these in as each directory approves the show. Empty ones are not shown.',
      fields: [
        defineField({ name: 'youtube', title: 'YouTube playlist', type: 'url' }),
        defineField({ name: 'spotify', title: 'Spotify', type: 'url' }),
        defineField({ name: 'apple', title: 'Apple Podcasts', type: 'url' }),
        defineField({ name: 'amazon', title: 'Amazon Music', type: 'url' }),
      ],
    }),
  ],
})

export const podcastEpisode = defineType({
  name: 'podcastEpisode',
  title: 'Podcast episode',
  type: 'document',
  icon: PlayIcon,
  groups: [
    { name: 'content', title: 'Episode', default: true },
    { name: 'media', title: 'Video & audio' },
    { name: 'stories', title: 'Chapters & stories' },
    { name: 'transcript', title: 'Transcript' },
  ],
  fields: [
    defineField({
      name: 'show',
      type: 'reference',
      to: [{ type: 'podcastShow' }],
      group: 'content',
      initialValue: { _ref: REWIND_SHOW_ID },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'number',
      title: 'Episode number',
      type: 'number',
      group: 'content',
      validation: (r) => r.required().integer().min(1),
    }),
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      description:
        'The same title as the YouTube video, without "| 5Talents Rewind #1" - the site and the apps add the show name themselves.',
      validation: (r) => r.required().max(100),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      description: 'Generate it. It starts with the episode number so the URLs sort.',
      options: {
        source: (doc) => {
          const d = doc as { number?: number; title?: string }
          return `episode-${d.number ?? ''}-${d.title ?? ''}`
        },
        maxLength: 80,
      },
      validation: (r) =>
        r.required().custom((slug) => {
          if (!slug?.current) return 'Required'
          if (!/^[a-z0-9-]+$/.test(slug.current)) return 'Lowercase letters, numbers and hyphens only.'
          return true
        }),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      group: 'content',
      description:
        'When the episode goes public, on the site and in the feed. Set it to the YouTube premiere time. A date in the future keeps it hidden until then.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description:
        'Two sentences: what is in this week. Shown on the episode cards and as the episode description in every podcast app.',
      validation: (r) => r.required().max(400),
    }),
    defineField({
      name: 'cover',
      title: 'Episode image (16:9)',
      type: 'externalImage',
      group: 'content',
      description:
        'The YouTube thumbnail, on Cloudinary. Used on the site only - podcast apps need a square, so they get the show cover.',
    }),

    // ---- Video & audio ---------------------------------------------------
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube video',
      type: 'url',
      group: 'media',
      description: 'The full episode, any YouTube link form.',
    }),
    defineField({
      name: 'audio',
      title: 'Audio file (MP3)',
      type: 'object',
      group: 'media',
      description:
        'The podcast file. MP3, 128 kbps, loudness -16 LUFS, on Cloudinary. An episode with no audio stays on the site but is left out of the podcast feed.',
      fields: [
        defineField({
          name: 'url',
          type: 'url',
          validation: (r) => r.uri({ scheme: ['https'] }),
        }),
        defineField({
          name: 'bytes',
          title: 'File size in bytes',
          type: 'number',
          description:
            'The exact size, from Cloudinary or `ls -l`. Apple checks it against the file and rejects an episode when they disagree.',
          validation: (r) =>
            r.custom((value, ctx) => {
              const url = (ctx.parent as { url?: string } | undefined)?.url
              if (url && !value) return 'Required when there is an audio file.'
              return true
            }),
        }),
        defineField({
          name: 'duration',
          title: 'Length in seconds',
          type: 'number',
          validation: (r) =>
            r.custom((value, ctx) => {
              const url = (ctx.parent as { url?: string } | undefined)?.url
              if (url && !value) return 'Required when there is an audio file.'
              return true
            }),
        }),
      ],
    }),
    defineField({
      name: 'shorts',
      title: 'Shorts from this episode',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({ type: 'url' })],
      validation: (r) => r.max(8),
    }),

    // ---- Chapters & stories -----------------------------------------------
    /**
     * Chapters are also the link to the articles.
     *
     * Every Rewind story is a story we have already published, so a chapter
     * can point at its article. That one reference does three jobs: the
     * episode page lists the article under its timestamp, the article page
     * shows "Covered on 5Talents Rewind" with a jump to the right minute, and
     * the feed's show notes link back to the site. Nothing has to be kept in
     * step by hand.
     */
    defineField({
      name: 'chapters',
      type: 'array',
      group: 'stories',
      description:
        'Copy the timestamps from the YouTube description. The first must be 0:00, or YouTube ignores all of them.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'chapter',
          fields: [
            defineField({
              name: 'start',
              type: 'string',
              description: 'm:ss or h:mm:ss, e.g. 1:32',
              validation: (r) =>
                r.required().custom((v) => (!v || TIMESTAMP.test(v) ? true : 'Use m:ss, e.g. 1:32')),
            }),
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'article',
              title: 'Our article on this story',
              type: 'reference',
              to: [{ type: 'article' }],
              description: 'Leave empty for the intro and outro.',
            }),
          ],
          preview: {
            select: { start: 'start', title: 'title', article: 'article.title' },
            prepare: ({ start, title, article }) => ({
              title: `${start ?? '?'}  ${title ?? ''}`,
              subtitle: article ? `→ ${article}` : undefined,
            }),
          },
        }),
      ],
      validation: (r) =>
        r.custom((chapters) => {
          const list = (chapters ?? []) as { start?: string }[]
          if (list.length > 0 && !/^0?0:00$/.test(list[0]?.start ?? '')) {
            return 'The first chapter must start at 0:00.'
          }
          return true
        }).warning(),
    }),

    // ---- Transcript -------------------------------------------------------
    defineField({
      name: 'transcript',
      type: 'text',
      rows: 24,
      group: 'transcript',
      description:
        'What was said, in Roman Hinglish, cleaned up from the YouTube auto-captions. Separate paragraphs with a blank line; start a paragraph with a timestamp in square brackets, e.g. [1:32], to mark where it begins. Search engines read this - video they cannot.',
    }),
    defineField({
      name: 'credits',
      type: 'text',
      rows: 3,
      group: 'transcript',
      description: 'Music and image credits, printed under the transcript.',
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'numberDesc', by: [{ field: 'number', direction: 'desc' }] },
  ],
  preview: {
    select: { number: 'number', title: 'title', media: 'cover.url' },
    prepare: ({ number, title }) => ({
      title: `#${number ?? '?'}  ${title ?? ''}`,
      subtitle: '5Talents Rewind',
    }),
  },
})
