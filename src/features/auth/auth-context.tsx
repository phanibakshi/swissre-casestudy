import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Role, User } from '@/types/rbac'

type AuthContextValue = {
  user: User
  setRole: (role: Role) => void
}

const DEFAULT_USER: User = { id: '1', name: 'Phani Bakshi', role: 'adjuster' }

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(DEFAULT_USER)

  const value = useMemo(
    () => ({
      user,
      setRole: (role: Role) => setUser((current) => ({ ...current, role })),
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
