import { useAuth } from './auth-context'
import type { Role } from '@/types/rbac'
import styles from './RoleSwitcher.module.scss'

const ROLES: Role[] = ['Viewer', 'Adjuster', 'Admin']

type RoleSwitcherProps = {
  className?: string
}

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { user, setRole } = useAuth()

  return (
    <label className={[styles.root, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>Role</span>
      <select
        className={styles.select}
        value={user.role}
        onChange={(event) => setRole(event.target.value as Role)}
        aria-label="Switch demo role"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </label>
  )
}
