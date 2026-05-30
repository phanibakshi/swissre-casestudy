import type { Claim, ClaimStatus, ClaimsQueryParams, ClaimsResponse, ClaimsSortField } from '@/types/claim'
import { MOCK_USERS } from '@/mocks/data/users'

export const CLAIMS_TOTAL = 20_000

const CUSTOMER_NAMES = [
  'Jane Cooper', 'Floyd Miles', 'Ronald Richards', 'Marvin McKinney', 'Jerome Bell',
  'Kathryn Murphy', 'Jacob Jones', 'Kristin Watson', 'Esther Howard', 'Cameron Williamson',
  'Brooklyn Simmons', 'Leslie Alexander', 'Jenny Wilson', 'Robert Fox', 'Devon Lane',
]

const COMPANIES = [
  'Microsoft', 'Yahoo', 'Adobe', 'Tesla', 'Google', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Spotify',
]

const COUNTRIES = ['USA', 'UK', 'Australia', 'Germany', 'Canada', 'India', 'France', 'Japan']

const ASSIGNEES = [
  MOCK_USERS.adjuster.name,
  MOCK_USERS.viewer.name,
  MOCK_USERS.admin.name,
  null,
] as const

const STATUSES: ClaimStatus[] = ['active', 'inactive']

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')
}

export function generateClaim(index: number): Claim {
  const rand = seededRandom(index + 1)
  const customerName = CUSTOMER_NAMES[index % CUSTOMER_NAMES.length]
  const company = COMPANIES[Math.floor(rand() * COMPANIES.length)]
  const country = COUNTRIES[Math.floor(rand() * COUNTRIES.length)]
  const status = STATUSES[Math.floor(rand() * STATUSES.length)]
  const assignee = ASSIGNEES[Math.floor(rand() * ASSIGNEES.length)]
  const daysAgo = Math.floor(rand() * 365)
  const phone = `+1 (${200 + (index % 800)}) ${100 + (index % 900)}-${String(1000 + (index % 9000)).slice(-4)}`

  return {
    id: `CLM-${String(index + 1).padStart(6, '0')}`,
    customerName,
    company,
    phone,
    email: `${slugify(customerName)}@${slugify(company)}.com`,
    country,
    status,
    assignee,
    updatedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  }
}

/** Lazy claim access — no 20k array in memory. */
export function getClaimByIndex(index: number): Claim {
  if (index < 0 || index >= CLAIMS_TOTAL) throw new RangeError(`Claim index ${index} out of range`)
  return generateClaim(index)
}

function matchesSearch(claim: Claim, search: string): boolean {
  if (!search) return true
  const q = search.toLowerCase()
  return (
    claim.id.toLowerCase().includes(q) ||
    claim.customerName.toLowerCase().includes(q) ||
    claim.company.toLowerCase().includes(q) ||
    claim.phone.includes(q) ||
    claim.email.toLowerCase().includes(q) ||
    claim.country.toLowerCase().includes(q)
  )
}

function matchesRole(claim: Claim, role: string, userName: string): boolean {
  if (role === 'admin' || role === 'viewer') return true
  if (role === 'adjuster') return claim.assignee === null || claim.assignee === userName
  return true
}

function compareClaims(a: Claim, b: Claim, sort: ClaimsSortField, dir: 'asc' | 'desc'): number {
  const av = a[sort] ?? ''
  const bv = b[sort] ?? ''
  const cmp = String(av).localeCompare(String(bv))
  return dir === 'asc' ? cmp : -cmp
}

export function queryClaims(
  params: ClaimsQueryParams,
  role: string,
  userName: string,
): ClaimsResponse {
  const matchingIndices: number[] = []

  for (let i = 0; i < CLAIMS_TOTAL; i++) {
    const claim = getClaimByIndex(i)
    if (!matchesRole(claim, role, userName)) continue
    if (!matchesSearch(claim, params.search)) continue
    matchingIndices.push(i)
  }

  matchingIndices.sort((ia, ib) =>
    compareClaims(getClaimByIndex(ia), getClaimByIndex(ib), params.sort, params.sortDir),
  )

  const total = matchingIndices.length
  const start = (params.page - 1) * params.pageSize
  const pageIndices = matchingIndices.slice(start, start + params.pageSize)
  const data = pageIndices.map(getClaimByIndex)

  return { data, total, page: params.page, pageSize: params.pageSize }
}
