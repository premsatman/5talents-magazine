import { defineType, defineField } from 'sanity'
import { BellIcon } from '@sanity/icons/Bell'
import { BarChartIcon } from '@sanity/icons/BarChart'

/**
 * Push notification records, written by the site, read here.
 *
 * Same shape as `submission`: the server holds the write token, the Studio
 * only looks. Nothing in here is editable, because editing it would not change
 * anything - the real record of what was sent lives in Supabase
 * (fivetalents_push_log), where the unique article_id is what stops the same
 * piece being pushed twice.
 *
 * These documents exist so that the numbers can be looked at without opening a
 * SQL console, and specifically so they can be looked at WITHOUT a stats
 * endpoint. The Studio runs in the browser, so any token it used to call the
 * site would ship inside a publicly downloadable bundle; Sanity's own login
 * already guards this.
 *
 * The document id is pushSend.<article _id>, so a replayed write updates the
 * same row rather than making a second one.
 */
export const pushSend = defineType({
  name: 'pushSend',
  title: 'Push sent',
  type: 'document',
  icon: BellIcon,
  readOnly: true,
  fields: [
    defineField({ name: 'article', type: 'reference', to: [{ type: 'article' }] }),
    defineField({ name: 'headline', type: 'string', description: 'The notification title as sent.' }),
    defineField({ name: 'slug', type: 'string' }),
    defineField({ name: 'sentAt', type: 'datetime' }),
    defineField({
      name: 'attempted',
      type: 'number',
      description: 'Subscriptions on file when the send began.',
    }),
    defineField({ name: 'delivered', type: 'number', description: 'Accepted by the push service.' }),
    defineField({
      name: 'removed',
      type: 'number',
      description:
        'Subscriptions deleted during this send: the browser was uninstalled, permission was revoked, or it failed five times running.',
    }),
  ],
  orderings: [
    { name: 'sentDesc', title: 'Newest first', by: [{ field: 'sentAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'headline', slug: 'slug', sentAt: 'sentAt', delivered: 'delivered', attempted: 'attempted' },
    prepare({ title, slug, sentAt, delivered, attempted }) {
      const when = sentAt
        ? new Date(sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'not sent'
      const reach =
        typeof delivered === 'number' && typeof attempted === 'number'
          ? `${delivered} of ${attempted} delivered`
          : 'no counts'
      return { title: title || slug || 'Push', subtitle: `${when} · ${reach}` }
    },
  },
})

/**
 * One document, id "push-stats". How many browsers are subscribed right now.
 *
 * Refreshed by the daily cron whether or not anything was pushed, so the
 * number is never more than a day old even in a week with no sends. It is
 * deliberately not live: a live figure would need the endpoint this design
 * exists to avoid.
 */
export const pushStats = defineType({
  name: 'pushStats',
  title: 'Push subscribers',
  type: 'document',
  icon: BarChartIcon,
  readOnly: true,
  fields: [
    defineField({ name: 'subscribers', type: 'number', title: 'Subscribed browsers' }),
    defineField({ name: 'checkedAt', type: 'datetime', title: 'Counted at' }),
  ],
  preview: {
    select: { subscribers: 'subscribers', checkedAt: 'checkedAt' },
    prepare({ subscribers, checkedAt }) {
      return {
        title: `${subscribers ?? 0} subscribed browser${subscribers === 1 ? '' : 's'}`,
        subtitle: checkedAt ? `counted ${new Date(checkedAt).toLocaleString('en-GB')}` : 'never counted',
      }
    },
  },
})
