import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset the scroll position to the top on every route change. Fixes footer
 * links (Mentions légales, Confidentialité, CGU…) that otherwise kept the
 * previous page's scroll offset. Uses `useLayoutEffect` so the jump happens
 * before paint (no visible flash). HashRouter-safe: when `location.hash`
 * points at a specific in-page anchor, we leave the scroll alone so future
 * anchored links keep working.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useLayoutEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, search, hash])

  return null
}
