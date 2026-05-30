import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { can } from '@/lib/rbac/permissions'
import { DEFAULT_MOCK_USER, MOCK_USERS } from '@/mocks/data/users'
import type { Permission, Role, User } from '@/types/rbac'

type AuthContextValue = {
  user: User
  setRole: (role: Role) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(DEFAULT_MOCK_USER)

  const value = useMemo(
    () => ({
      user,
      setRole: (role: Role) => setUser(MOCK_USERS[role]),
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function usePermissions() {
  const { user } = useAuth()
  return {
    role: user.role,
    can: (permission: Permission) => can(user.role, permission),
  }
}
