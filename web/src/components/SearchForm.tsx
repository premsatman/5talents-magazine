'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Search box. Used inline on /search and inside the header's expanding field.
 *
 * A plain GET form would work without JavaScript, but it cannot preserve focus
 * or close the header panel afterwards, so this pushes the route instead. The
 * fallback still matters: the form has a real `action`, so if hydration has not
 * finished the browser submits it the ordinary way and search still works.
 */
export function SearchForm({
  defaultValue = '',
  autoFocus = false,
  onDone,
  compact = false,
}: {
  defaultValue?: string
  autoFocus?: boolean
  onDone?: () => void
  compact?: boolean
}) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) input.current?.focus()
  }, [autoFocus])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const term = value.trim()
    if (!term) return
    event.preventDefault()
    router.push(`/search?q=${encodeURIComponent(term)}`)
    onDone?.()
  }

  const id = compact ? 'site-search-compact' : 'site-search'

  return (
    <form className={`searchform${compact ? ' searchform--compact' : ''}`} action="/search" method="get" onSubmit={onSubmit} role="search">
      <label className="visually-hidden" htmlFor={id}>
        Search 5Talents
      </label>
      <input
        id={id}
        ref={input}
        name="q"
        type="search"
        placeholder="Search the magazine…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
      />
      <button type="submit">Search</button>
    </form>
  )
}
