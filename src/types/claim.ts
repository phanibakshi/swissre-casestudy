export type ClaimStatus = 'active' | 'pending' | 'closed'

export type ClaimChannel = 'email' | 'sftp' | 'portal' | 'api'

export type Claim = {
  id: string
  claimant: string
  channel: ClaimChannel
  assignee: string | null
  status: ClaimStatus
  updatedAt: string
}

export type ClaimsSortField = 'claimant' | 'channel' | 'assignee' | 'status' | 'updatedAt'

export type ClaimsQueryParams = {
  page: number
  pageSize: number
  sort: ClaimsSortField
  sortDir: 'asc' | 'desc'
  search: string
  status: ClaimStatus | ''
}

export type ClaimsResponse = {
  data: Claim[]
  total: number
  page: number
  pageSize: number
}
