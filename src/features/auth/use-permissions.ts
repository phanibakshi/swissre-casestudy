import { can } from '@/lib/rbac/permissions'
import type { Permission } from '@/types/rbac'
import { useAuth } from './auth-context'

export function usePermissions() {
  const { user } = useAuth()
  return {
    role: user.role,
    can: (permission: Permission) => can(user.role, permission),
  }
}
