import type { ReactNode } from 'react'
import type { Permission } from '@/types/rbac'
import { usePermissions } from './auth-context'

type CanProps = {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

/** Declarative RBAC gate — show, hide, or swap content by permission. */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = usePermissions()
  return can(permission) ? children : fallback
}
