import { useCallback, useState } from 'react'

const STORAGE_KEY = 'sidebar-collapsed'

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed)

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [])

  return { collapsed, toggle, setCollapsed }
}
