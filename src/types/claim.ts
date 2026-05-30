export type ClaimStatus = 'active' | 'inactive'

export type Claim = {
  id: string
  customerName: string
  company: string
  phone: string
  email: string
  country: string
  status: ClaimStatus
  assignee: string | null
  updatedAt: string
}

export type ClaimsSortField =
  | 'customerName'
  | 'company'
  | 'phone'
  | 'email'
  | 'country'
  | 'status'
  | 'updatedAt'

export type ClaimsQueryParams = {
  page: number
  pageSize: number
  sort: ClaimsSortField
  sortDir: 'asc' | 'desc'
  search: string
}

export type ClaimsResponse = {
  data: Claim[]
  total: number
  page: number
  pageSize: number
}
