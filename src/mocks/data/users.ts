import type { User } from '@/types/rbac'

export const MOCK_USERS: Record<string, User> = {
  viewer: { id: 'u-viewer', name: 'View Only', role: 'viewer' },
  adjuster: { id: 'u-adjuster', name: 'Phani Bakshi', role: 'adjuster' },
  admin: { id: 'u-admin', name: 'Admin User', role: 'admin' },
}

export const DEFAULT_MOCK_USER = MOCK_USERS.adjuster
