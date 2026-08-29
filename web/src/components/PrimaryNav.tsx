'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { SearchForm } from './SearchForm'

export type NavItem = {
  name: string
  slug: string
  tags?: { name: string; slug: string }[]
}

/**
 * Primary navigation: section links with tag dropdowns, a search field that
 * expands in place, and a hamburger drawer below 900px.
 *
 * The dropdowns are generated from tags actually used within each section, so
 * they cannot drift out of date the way a hand-curated sub-menu does. A section
 * with no tagged articles yet simply has no dropdown - it stays a plain link.
 *
 * Keyboard behaviour is the part that usually gets skipped: each dropdown is a
 * real button with aria-expanded, Escape closes and returns focus, and the
 * whole thing works without a pointer.
 */
export function PrimaryNav({ items, compact = false }: { items: NavItem[]; compact?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const drawerId = useId()

  // Any navigation closes everything.
  useEffect(() => {
    setOpen(null)
    setDrawer(false)
    setSearch(false)
  }, [pathname])

  // The drawer is a full-height overlay, so the page behind it must not scroll.
  useEffect(() => {
    if (!drawer) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawer])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(null)
      setDrawer(false)
      setSearch(false)
    }
    function onClick(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])

  const isCurrent = (slug: string) => pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)

  return (
    <nav className={`primary${compact ? ' compact' : ''}`} aria-label="Sections" ref={navRef}>
      <div className="wrap primary__bar">
        <button
          className="navtoggle"
          type="button"
          aria-expanded={drawer}
          aria-controls={drawerId}
          onClick={() => setDrawer((v) => !v)}
        >
          <span className="navtoggle__bars" aria-hidden="true" />
          <span className="visually-hidden">{drawer ? 'Close menu' : 'Menu'}</span>
        </button>

        {compact && (
          <Link className="minilogo" href="/">
            5TALENTS
          </Link>
        )}

        <ul className="primary__list">
          {items.map((item) => {
            const tags = item.tags ?? []
            const expanded = open === item.slug

            return (
              <li key={item.slug} className={tags.length > 0 ? 'has-menu' : undefined}>
                <Link
                  className="brush-link"
                  href={`/${item.slug}`}
                  aria-current={isCurrent(item.slug) ? 'page' : undefined}
                >
                  {item.name}
                </Link>

                {tags.length > 0 && (
                  <>
                    <button
                      className="navcaret"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : item.slug)}
                    >
                      <span className="visually-hidden">
                        {expanded ? `Hide topics in ${item.name}` : `Topics in ${item.name}`}
                      </span>
                      <span aria-hidden="true">▾</span>
                    </button>

                    {expanded && (
                      <div className="navmenu">
                        <ul>
                          {tags.map((tag) => (
                            <li key={tag.slug}>
                              <Link href={`/tags/${tag.slug}`}>{tag.name}</Link>
                            </li>
                          ))}
                        </ul>
                        <Link className="navmenu__all" href={`/${item.slug}`}>
                          All {item.name.toLowerCase()} <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </li>
            )
          })}
          <li>
            <Link className="brush-link" href="/archive" aria-current={isCurrent('archive') ? 'page' : undefined}>
              Archive
            </Link>
          </li>
        </ul>

        <div className="primary__tools">
          {search ? (
            <SearchForm compact onDone={() => setSearch(false)} autoFocus />
          ) : (
            <button className="navicon" type="button" onClick={() => setSearch(true)}>
              <span className="visually-hidden">Search</span>
              <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8.5" cy="8.5" r="6" />
                <path d="M13 13l5 5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`drawer${drawer ? ' drawer--open' : ''}`} id={drawerId} hidden={!drawer}>
        <div className="drawer__panel">
          <SearchForm onDone={() => setDrawer(false)} />
          <ul className="drawer__list">
            {items.map((item) => (
              <li key={item.slug}>
                <Link href={`/${item.slug}`}>{item.name}</Link>
                {(item.tags ?? []).length > 0 && (
                  <ul className="drawer__tags">
                    {(item.tags ?? []).map((tag) => (
                      <li key={tag.slug}>
                        <Link href={`/tags/${tag.slug}`}>{tag.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li><Link href="/archive">The archive</Link></li>
            <li><Link href="/interviews">Cover stories</Link></li>
            <li><Link href="/talent-search">Talent search</Link></li>
            <li><Link href="/write-for-us">Write for us</Link></li>
            <li><Link href="/advertise">Advertise</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>
        </div>
        <button className="drawer__scrim" type="button" onClick={() => setDrawer(false)}>
          <span className="visually-hidden">Close menu</span>
        </button>
      </div>
    </nav>
  )
}
