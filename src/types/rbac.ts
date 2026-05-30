export type Role = 'viewer' | 'adjuster' | 'admin'

export type Permission =
  | 'claims:read'
  | 'claims:edit'
  | 'claims:delete'
  | 'claims:assign'
  | 'documents:view'
  | 'documents:edit'
  | 'documents:split'
  | 'documents:merge'
  | 'documents:comment'

export type User = {
  id: string
  name: string
  role: Role
}
