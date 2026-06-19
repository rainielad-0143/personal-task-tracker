import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * Resolve the starting theme: an explicit saved choice wins, otherwise fall
 * back to the OS preference. Guarded so it stays safe in environments without
 * `localStorage`/`matchMedia` (e.g. jsdom under tests).
 */
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch {
    // Ignore and fall through to the light default.
  }
  return 'light'
}

/** Owns the current theme, mirrors it onto <html data-theme>, and persists it. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persistence is best-effort; ignore storage failures.
    }
  }, [theme])

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))

  return { theme, toggleTheme }
}
