import { defineType, defineField, defineArrayMember } from 'sanity'
import { PlayIcon } from '@sanity/icons/Play'
import { BookIcon } from '@sanity/icons/Book'
import { LinkIcon } from '@sanity/icons/Link'
import { PlayIcon as VideoIcon } from '@sanity/icons/Play'

/**
 * Cards a contributor can hang off the end of their own piece — their podcast,
 * their channel, their book, their site.
 *
 * These are promotional, and they sit inside an editorial publication applying
 * for an ISSN, so two rules are built into the schema rather than left to
 * whoever is filling the form:
 *
 * 1. Every card carries the contributor's own material, not paid placement.
 *    Paid placement is an `advertiser` booking in an ad slot, which is labelled
 *    as such. Do not use these to sell space.
 * 2. A retail link that earns a commission must say so. `affiliate` renders a
 *    disclosure line, and the front end adds rel="sponsored nofollow" to the
 *    link. India's ASCI guidelines and the US FTC both require the disclosure
 *    to be up-front rather than buried, and Google asks for the rel value on
 *    any link with money behind it.
 *
 * Card images go on Cloudinary like the rest of the site's photography — the
 * site only allows next/image to load from Cloudinary and Sanity, so a cover
 * pasted from Amazon or from a YouTube avatar URL will not render. See
 * externalImage.ts.
 */

export const spotifyCard = defineType({
  name: 'spotifyCard',
  title: 'Spotify',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Spotify link',
      type: 'url',
      description:
        'Any open.spotify.com link — track, album, playlist, show or episode. Use "Copy link" in Spotify; the site converts it to the player itself, so the embed URL works too.',
      validation: (r) =>
        r.required().custom((value) =>
          !value || /^https:\/\/open\.spotify\.com\//.test(value)
            ? true
            : 'Must be an open.spotify.com link.',
        ),
    }),
    defineField({
      name: 'label',
      title: 'Heading',
      type: 'string',
      description: 'Optional line above the player, e.g. "Listen to the full conversation".',
    }),
    defineField({
      name: 'compact',
      title: 'Compact player',
      type: 'boolean',
      description:
        'On for a single track or episode (a slim bar). Off for an album, playlist or show, which needs room for the track list.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'url' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Spotify', subtitle }),
  },
})

export const youtubeCard = defineType({
  name: 'youtubeCard',
  title: 'YouTube channel',
  type: 'object',
  icon: VideoIcon,
  fields: [
    defineField({
      name: 'channelName',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'url',
      title: 'Channel URL',
      type: 'url',
      description: 'e.g. https://www.youtube.com/@handle',
      validation: (r) => r.required().uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'blurb',
      type: 'text',
      rows: 2,
      description: 'One line on what the channel is.',
      validation: (r) => r.max(180).warning('Keep it to a line.'),
    }),
    defineField({
      name: 'avatar',
      title: 'Channel picture',
      type: 'externalImage',
      description: 'Optional. Re-upload it to Cloudinary — a YouTube avatar URL will not load.',
    }),
    defineField({
      name: 'cta',
      title: 'Button text',
      type: 'string',
      initialValue: 'Visit the channel',
    }),
  ],
  preview: {
    select: { title: 'channelName', subtitle: 'url' },
    prepare: ({ title, subtitle }) => ({ title: title || 'YouTube channel', subtitle }),
  },
})

/**
 * One book, with as many places to buy it as it is actually sold.
 *
 * Amazon and the author's own site are the same card, not two: a reader
 * deciding where to buy wants the choice side by side, and two near-identical
 * cards stacked at the end of a piece reads as an advert rather than a note.
 */
export const bookCard = defineType({
  name: 'bookCard',
  title: 'Book',
  type: 'object',
  icon: BookIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'author',
      type: 'string',
      description: 'Leave empty if it is by the piece’s own byline.',
    }),
    defineField({
      name: 'blurb',
      type: 'text',
      rows: 3,
      description: 'Two sentences at most.',
      validation: (r) => r.max(280).warning('Long blurbs get skimmed.'),
    }),
    defineField({
      name: 'cover',
      title: 'Cover image',
      type: 'externalImage',
      description: 'On Cloudinary. Do not hotlink Amazon’s cover image - it will not load and it is theirs.',
    }),
    defineField({
      name: 'links',
      title: 'Where to buy',
      type: 'array',
      validation: (r) => r.min(1).max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'buyLink',
          fields: [
            defineField({
              name: 'label',
              type: 'string',
              description: 'e.g. "Amazon India", "Buy from the author".',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'url',
              type: 'url',
              validation: (r) => r.required().uri({ scheme: ['https'] }),
            }),
            defineField({
              name: 'affiliate',
              title: 'Earns a commission',
              type: 'boolean',
              description:
                'On for any link that pays the author or the magazine - an Amazon Associates tag counts. Adds the disclosure line under the card and marks the link rel="sponsored nofollow".',
              initialValue: false,
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'author' },
    prepare: ({ title, subtitle }) => ({
      title: title || 'Book',
      subtitle: subtitle ? `by ${subtitle}` : undefined,
    }),
  },
})

export const linkCard = defineType({
  name: 'linkCard',
  title: 'Custom link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'url',
      type: 'url',
      validation: (r) => r.required().uri({ scheme: ['https', 'http'] }),
    }),
    defineField({ name: 'blurb', type: 'text', rows: 2, validation: (r) => r.max(200) }),
    defineField({
      name: 'image',
      type: 'externalImage',
      description: 'Optional. On Cloudinary.',
    }),
    defineField({ name: 'cta', title: 'Button text', type: 'string', initialValue: 'Open' }),
    defineField({
      name: 'affiliate',
      title: 'Earns a commission',
      type: 'boolean',
      description: 'Adds the disclosure line and marks the link rel="sponsored nofollow".',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'url' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Link', subtitle }),
  },
})
