import { useCallback, useState } from 'react'

export type AppTheme = 'light' | 'dark'

const STORAGE_KEY = 'popup-store-map.theme'

export function useThemePreference() {
  const [theme, setTheme] = useState<AppTheme>(() =>
    window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light')

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
