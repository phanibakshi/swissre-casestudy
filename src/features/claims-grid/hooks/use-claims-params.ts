import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ClaimStatus, ClaimsSortField } from '@/types/claim'

const DEFAULTS = {
  page: 1,
  pageSize: 8,
  sort: 'updatedAt' as ClaimsSortField,
  sortDir: 'desc' as const,
  search: '',
  status: '' as ClaimStatus | '',
}

export function useClaimsParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(
    () => ({
      page: Number(searchParams.get('page') ?? DEFAULTS.page),
      pageSize: Number(searchParams.get('pageSize') ?? DEFAULTS.pageSize),
      sort: (searchParams.get('sort') as ClaimsSortField) || DEFAULTS.sort,
      sortDir: searchParams.get('sortDir') === 'asc' ? ('asc' as const) : ('desc' as const),
      search: searchParams.get('search') ?? DEFAULTS.search,
      status: (searchParams.get('status') as ClaimStatus | '') || DEFAULTS.status,
    }),
    [searchParams],
  )

  const setParams = (patch: Partial<typeof params>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const merged = { ...params, ...patch }
      next.set('page', String(merged.page))
      next.set('pageSize', String(merged.pageSize))
      next.set('sort', merged.sort)
      next.set('sortDir', merged.sortDir)
      if (merged.search) next.set('search', merged.search)
      else next.delete('search')
      if (merged.status) next.set('status', merged.status)
      else next.delete('status')
      return next
    })
  }

  return { params, setParams }
}
