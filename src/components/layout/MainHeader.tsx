import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import styles from './MainHeader.module.scss'

const SEARCH_DEBOUNCE_MS = 300

export function MainHeader() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') ?? '')

  const applySearch = useCallback(
    (value: string) => {
      if (location.pathname.startsWith('/claims')) {
        const next = new URLSearchParams(searchParams)
        if (value) next.set('search', value)
        else next.delete('search')
        next.set('page', '1')
        navigate({ pathname: '/claims', search: next.toString() }, { replace: true })
      } else {
        navigate(value ? `/claims?search=${encodeURIComponent(value)}&page=1` : '/claims?page=1')
      }
    },
    [location.pathname, navigate, searchParams],
  )

  useEffect(() => {
    setQuery(searchParams.get('search') ?? '')
  }, [searchParams])

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? ''
    if (!location.pathname.startsWith('/claims') || query === urlSearch) return
    const timer = setTimeout(() => applySearch(query), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, location.pathname, searchParams, applySearch])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    applySearch(query)
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.greeting}>Hello {user.name} 👋</h1>
      <form className={styles.search} onSubmit={handleSubmit}>
        <span className={styles.searchIcon} aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search claims"
        />
      </form>
    </header>
  )
}
