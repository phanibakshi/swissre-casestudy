import type { Permission, Role } from '@/types/rbac'

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  viewer: ['claims:read', 'documents:view'],
  adjuster: [
    'claims:read',
    'claims:edit',
    'claims:assign',
    'documents:view',
    'documents:edit',
    'documents:comment',
  ],
  admin: [
    'claims:read',
    'claims:edit',
    'claims:delete',
    'claims:assign',
    'documents:view',
    'documents:edit',
    'documents:split',
    'documents:merge',
    'documents:comment',
  ],
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
