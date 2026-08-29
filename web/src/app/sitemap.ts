import type { MetadataRoute } from 'next'
import { freshClient } from '@/sanity/client'
import { SITEMAP_QUERY } from '@/sanity/queries'
import { SECTION_SLUGS, isSectionSlug } from '@/lib/sections'
import { absoluteUrl } from '@/lib/site'

const STATIC_PAGES = [
  '/',
  '/interviews',
  '/talent-search',
  '/archive',
  '/write-for-us',
  '/advertise',
  '/about',
  '/contact',
  '/privacy',
  '/corrections',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await freshClient.fetch(SITEMAP_QUERY)

  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === '/' ? 'daily' : 'monthly',
    priority: path === '/' ? 1 : 0.6,
  }))

  for (const section of SECTION_SLUGS) {
    entries.push({ url: absoluteUrl(`/${section}`), changeFrequency: 'daily', priority: 0.8 })
  }

  for (const article of data?.articles ?? []) {
    if (!article.slug || !article.section || !isSectionSlug(article.section)) continue
    entries.push({
      url: absoluteUrl(`/${article.section}/${article.slug}`),
      lastModified: article._updatedAt ? new Date(article._updatedAt) : undefined,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  for (const tag of data?.tags ?? []) {
    if (tag.slug) entries.push({ url: absoluteUrl(`/tags/${tag.slug}`), priority: 0.4 })
  }
  for (const author of data?.authors ?? []) {
    if (author.slug) entries.push({ url: absoluteUrl(`/authors/${author.slug}`), priority: 0.5 })
  }
  for (const issue of data?.issues ?? []) {
    if (issue.slug) entries.push({ url: absoluteUrl(`/archive/${issue.slug}`), priority: 0.6 })
  }

  return entries
}
