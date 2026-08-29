import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  stega: { studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333' },
})

/**
 * For generateStaticParams and webhook handlers: bypass the CDN so we never
 * build a route list from a stale edge cache.
 */
export const freshClient = client.withConfig({ useCdn: false, stega: false })
