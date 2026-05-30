import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import styles from './MainHeader.module.scss'

export function MainHeader() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') ?? '')

  useEffect(() => {
    setQuery(searchParams.get('search') ?? '')
  }, [searchParams])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (location.pathname.startsWith('/claims')) {
      const next = new URLSearchParams(searchParams)
      if (query) next.set('search', query)
      else next.delete('search')
      next.set('page', '1')
      navigate({ pathname: '/claims', search: next.toString() })
    } else {
      navigate(`/claims?search=${encodeURIComponent(query)}&page=1`)
    }
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
