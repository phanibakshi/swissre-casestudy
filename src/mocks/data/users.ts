import type { User } from '@/types/rbac'

export const MOCK_USERS: Record<string, User> = {
  viewer: { id: 'u-viewer', name: 'Phani Kumar', role: 'viewer' },
  adjuster: { id: 'u-adjuster', name: 'Phani Bakshi', role: 'adjuster' },
  admin: { id: 'u-admin', name: 'Swissre Admin', role: 'admin' },
}

export const DEFAULT_MOCK_USER = MOCK_USERS.adjuster
