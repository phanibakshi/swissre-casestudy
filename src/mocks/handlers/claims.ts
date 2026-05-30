import { http, HttpResponse } from 'msw'
import { queryClaims } from '@/mocks/data/claims-store'
import { DEFAULT_MOCK_USER, MOCK_USERS } from '@/mocks/data/users'
import type { ClaimsQueryParams, ClaimsSortField } from '@/types/claim'
import type { Role } from '@/types/rbac'

function parseClaimsQuery(url: URL): ClaimsQueryParams {
  return {
    page: Math.max(1, Number(url.searchParams.get('page') ?? 1)),
    pageSize: Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 8))),
    sort: (url.searchParams.get('sort') as ClaimsSortField) || 'updatedAt',
    sortDir: url.searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc',
    search: url.searchParams.get('search') ?? '',
  }
}

function roleFromRequest(request: Request): Role {
  const header = request.headers.get('X-User-Role')
  if (header === 'viewer' || header === 'adjuster' || header === 'admin') return header
  return DEFAULT_MOCK_USER.role
}

export const claimsHandlers = [
  http.get('/api/claims', ({ request }) => {
    const role = roleFromRequest(request)
    const user = MOCK_USERS[role]
    const params = parseClaimsQuery(new URL(request.url))
    return HttpResponse.json(queryClaims(params, role, user.name))
  }),
]
