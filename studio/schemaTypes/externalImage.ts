import { defineType, defineField } from 'sanity'
import { ImageIcon } from '@sanity/icons/Image'

/**
 * An image hosted somewhere else — in practice Cloudinary.
 *
 * Blueprint trigger 2 is the reason this exists: asset storage is the thing
 * most likely to push the Sanity free plan over, and 119 MB of issue PDFs plus
 * covers is already close. Keeping photography on Cloudinary and only the text
 * in Sanity buys a lot of headroom.
 *
 * The site treats these exactly like uploaded images. If the URL is a standard
 * Cloudinary delivery URL, the front end rewrites it with the right size,
 * `f_auto`, `q_auto` and `g_auto` — so each card gets a correctly cropped,
 * correctly sized file rather than the full-resolution original, and
 * Cloudinary's auto-gravity keeps faces in frame the way a Sanity hotspot does.
 *
 * Width and height are not decoration. Without them the browser cannot reserve
 * space before the image arrives, the page jumps, and Cumulative Layout Shift
 * suffers — which costs ranking and ad revenue both.
 */
export const externalImage = defineType({
  name: 'externalImage',
  title: 'Image from a URL',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Image URL',
      type: 'url',
      description:
        'Paste the Cloudinary delivery URL, e.g. https://res.cloudinary.com/your-cloud/image/upload/v123/photo.jpg — do not include sizing transforms, the site adds those itself.',
      validation: (r) => r.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'What the picture shows, for a reader who cannot see it.',
      validation: (r) =>
        r.custom((value, ctx) => {
          const url = (ctx.parent as { url?: string } | undefined)?.url
          if (url && !value) return 'Alt text is required when a URL is set.'
          return true
        }),
    }),
    defineField({
      name: 'width',
      type: 'number',
      description:
        'The width of the file as it exists in Cloudinary — not the size you want it shown at. In the Cloudinary media library it is on the asset panel. Required: without it the browser cannot reserve space and the page jumps as the image loads.',
      validation: (r) =>
        r.custom((value, ctx) => {
          const url = (ctx.parent as { url?: string } | undefined)?.url
          if (url && !value) return 'Width is required so the space can be reserved.'
          if (value && value < 1) return 'Must be a positive number.'
          return true
        }),
    }),
    defineField({
      name: 'height',
      type: 'number',
      description: 'Again the original, not the display size.',
      validation: (r) =>
        r.custom((value, ctx) => {
          const url = (ctx.parent as { url?: string } | undefined)?.url
          if (url && !value) return 'Height is required so the space can be reserved.'
          if (value && value < 1) return 'Must be a positive number.'
          return true
        }),
    }),
    defineField({ name: 'caption', type: 'string' }),
    defineField({
      name: 'credit',
      type: 'string',
      description: 'Photographer or source. Required for anything not shot by us.',
    }),
  ],
  preview: {
    select: { title: 'alt', subtitle: 'url', media: 'url' },
    prepare: ({ title, subtitle }) => ({
      title: title || 'Image from a URL',
      subtitle,
    }),
  },
})
