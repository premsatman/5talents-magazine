import Link from 'next/link'
import { sanityFetch } from '@/sanity/live'
import { SECTION_TAGS_QUERY } from '@/sanity/queries'
import { SECTION_SLUGS } from '@/lib/sections'
import { clean } from '@/sanity/stega'
import { tagline } from '@/lib/site'
import { ThemeToggle } from './ThemeToggle'
import { BrushStroke } from './Wordmark'
import { PrimaryNav, type NavItem } from './PrimaryNav'

const FALLBACK_NAV: NavItem[] = [
  { name: 'Faith', slug: 'faith' },
  { name: 'Culture', slug: 'culture' },
  { name: 'Work & money', slug: 'work-money' },
  { name: 'Wellbeing', slug: 'wellbeing' },
  { name: 'Campus', slug: 'campus' },
  { name: 'Heritage', slug: 'heritage' },
]

/**
 * Section links plus the tags actually used within each one.
 *
 * Generated rather than curated, so a dropdown can never point at a topic with
 * nothing behind it. A section with no tagged pieces yet gets no dropdown.
 */
async function navItems(): Promise<NavItem[]> {
  const { data } = await sanityFetch({ query: SECTION_TAGS_QUERY, stega: false })

  const fromCms = (data ?? [])
    .map((s) => {
      // array::unique() compares references, and projecting { name, slug }
      // builds a fresh object per article - so a tag used by two pieces in the
      // same section comes back twice. Dedupe on the slug here instead.
      const seen = new Set<string>()
      const tags: { name: string; slug: string }[] = []
      for (const tag of s.tags ?? []) {
        const slug = clean(tag?.slug) ?? ''
        const name = clean(tag?.name) ?? ''
        if (!slug || !name || seen.has(slug)) continue
        seen.add(slug)
        tags.push({ name, slug })
      }

      return { name: clean(s.name) ?? '', slug: clean(s.slug) ?? '', tags }
    })
    .filter((s) => s.slug && (SECTION_SLUGS as readonly string[]).includes(s.slug))

  return fromCms.length > 0 ? fromCms : FALLBACK_NAV
}

/**
 * Utility bar.
 *
 * Subscribe sits top right where Relevant puts Subscribe and Login. There is no
 * Login, deliberately: blueprint section 7 cut Supabase from phase one and put
 * contributor accounts and paid memberships "a year away at least". A login
 * button with nothing behind it is worse than no login button.
 */
export function UtilityBar() {
  return (
    <div className="utility">
      <div className="wrap">
        <Link href="/archive">Published since 2012 · 18 issues</Link>
        <div className="util-right">
          <Link href="/write-for-us">Write for us</Link>
          <Link href="/advertise">Advertise</Link>
          <ThemeToggle />
          <Link className="subscribebtn" href="#newsletter">
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Full masthead. Homepage and index pages. */
export async function SiteHeader() {
  const items = await navItems()
  return (
    <>
      <UtilityBar />
      <header className="masthead">
        <div className="wrap">
          <p className="logo">
            <Link href="/">5TALENTS</Link>
          </p>
          <BrushStroke />
          <p className="tagline">{tagline}</p>
        </div>
      </header>
      <PrimaryNav items={items} />
    </>
  )
}

/** Compact bar. Article pages. */
export async function CompactHeader() {
  const items = await navItems()
  return (
    <>
      <UtilityBar />
      <PrimaryNav items={items} compact />
    </>
  )
}
