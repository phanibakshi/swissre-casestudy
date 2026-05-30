import { Navigate, Outlet } from 'react-router-dom'
import type { Permission } from '@/types/rbac'
import { usePermissions } from '@/features/auth/auth-context'

type ProtectedRouteProps = {
  permission: Permission
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { can } = usePermissions()
  if (!can(permission)) return <Navigate to="/claims" replace />
  return <Outlet />
}
