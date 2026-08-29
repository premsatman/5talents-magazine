'use client'

import { useEffect, useState } from 'react'

/**
 * Design system s7: dark mode via prefers-color-scheme AND a manual toggle,
 * in both directions. The stored preference is applied by an inline script in
 * layout.tsx before paint, so there is no flash of the wrong theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'light' || attr === 'dark') {
      setTheme(attr)
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('5t-theme', next)
    } catch {
      // Private browsing, or site data blocked. The toggle still works for
      // this page view; it just will not be remembered.
    }
    setTheme(next)
  }

  return (
    <button className="themebtn" type="button" onClick={toggle} aria-pressed={theme === 'dark'}>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
