import type { Claim, ClaimChannel, ClaimStatus, ClaimsQueryParams, ClaimsResponse, ClaimsSortField } from '@/types/claim'

export const CLAIMS_TOTAL = 20_000

const CLAIMANTS = [
  'Jane Cooper', 'Floyd Miles', 'Ronald Richards', 'Marvin McKinney', 'Jerome Bell',
  'Kathryn Murphy', 'Jacob Jones', 'Kristin Watson', 'Esther Howard', 'Cameron Williamson',
  'Brooklyn Simmons', 'Leslie Alexander', 'Jenny Wilson', 'Robert Fox', 'Devon Lane',
]

const ASSIGNEES = ['Demo User', 'View Only', 'Admin User', null] as const

const CHANNELS: ClaimChannel[] = ['email', 'sftp', 'portal', 'api']
const STATUSES: ClaimStatus[] = ['active', 'pending', 'closed']

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateClaim(index: number): Claim {
  const rand = seededRandom(index + 1)
  const status = STATUSES[Math.floor(rand() * STATUSES.length)]
  const assignee = ASSIGNEES[Math.floor(rand() * ASSIGNEES.length)]
  const daysAgo = Math.floor(rand() * 365)

  return {
    id: `CLM-${String(index + 1).padStart(6, '0')}`,
    claimant: CLAIMANTS[index % CLAIMANTS.length],
    channel: CHANNELS[Math.floor(rand() * CHANNELS.length)],
    assignee,
    status,
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
    claim.claimant.toLowerCase().includes(q) ||
    claim.channel.toLowerCase().includes(q) ||
    (claim.assignee?.toLowerCase().includes(q) ?? false)
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
    if (params.status && claim.status !== params.status) continue
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
