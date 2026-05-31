import { http, HttpResponse, delay } from 'msw'
import { CLAIMS_TOTAL, getClaimByIndex, queryClaims } from '@/mocks/data/claims-store'
import { DEFAULT_MOCK_USER, MOCK_USERS } from '@/mocks/data/users'
import type { Claim, ClaimsQueryParams, ClaimsSortField } from '@/types/claim'
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

function claimIndexFromId(id: string): number | null {
  const match = /^CLM-(\d+)$/.exec(id)
  if (!match) return null
  const index = Number(match[1]) - 1
  if (index < 0 || index >= CLAIMS_TOTAL) return null
  return index
}

function canAccessClaim(claim: Claim, role: Role, userName: string): boolean {
  if (role === 'admin' || role === 'viewer') return true
  if (role === 'adjuster') return claim.assignee === null || claim.assignee === userName
  return true
}

function documentMetaForClaim() {
  return {
    fileName: 'sample.pdf',
    sizeBytes: 500,
    pageCount: 1,
  }
}

export const claimsHandlers = [
  http.get('/api/claims', ({ request }) => {
    const role = roleFromRequest(request)
    const user = MOCK_USERS[role]
    const params = parseClaimsQuery(new URL(request.url))
    return HttpResponse.json(queryClaims(params, role, user.name))
  }),

  http.get('/api/claims/:id', async ({ request, params }) => {
    await delay(500)
    const role = roleFromRequest(request)
    const user = MOCK_USERS[role]
    const id = params.id as string
    const index = claimIndexFromId(id)
    if (index === null) return HttpResponse.json({ message: 'Claim not found' }, { status: 404 })

    const claim = getClaimByIndex(index)
    if (!canAccessClaim(claim, role, user.name)) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    return HttpResponse.json({ claim, document: documentMetaForClaim() })
  }),
]
