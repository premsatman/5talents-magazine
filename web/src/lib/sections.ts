/**
 * The section allowlist.
 *
 * Blueprint s7: constrain /[section] with an explicit slug allowlist plus
 * generateStaticParams. Left open, any typo'd URL falls into the section route
 * and generates soft-404s at scale - bad for a site whose whole SEO thesis is
 * indexation.
 *
 * A section added in Sanity but not listed here will 404. That is deliberate:
 * adding a section is a deploy-level decision, not a CMS-level one, because a
 * new top-level slug can silently shadow a static page of the same name.
 */
export const SECTION_SLUGS = [
  'faith',
  'culture',
  'technology',
  'work-money',
  'wellbeing',
  'campus',
  'heritage',
] as const

export type SectionSlug = (typeof SECTION_SLUGS)[number]

/**
 * Slugs already claimed by static routes. A section may never use one of these,
 * because Next resolves the static segment first and the section silently
 * disappears.
 */
export const RESERVED_SLUGS = new Set([
  'about',
  'advertise',
  'archive',
  'authors',
  'api',
  'contact',
  'corrections',
  'interviews',
  'privacy',
  'rss.xml',
  'sitemap.xml',
  'robots.txt',
  'studio',
  'tags',
  'talent-search',
  'write-for-us',
])

export function isSectionSlug(value: string): value is SectionSlug {
  return (SECTION_SLUGS as readonly string[]).includes(value)
}
