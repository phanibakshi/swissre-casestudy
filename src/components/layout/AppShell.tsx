import { Outlet } from 'react-router-dom'
import { BrandLogoIcon } from '@/components/layout/BrandLogoIcon'
import { MainHeader } from '@/components/layout/MainHeader'
import { SidebarNav, type SidebarNavItemConfig } from '@/components/layout/SidebarNav'
import { NavIcon } from '@/components/layout/NavIcon'
import { useSidebarCollapsed } from '@/components/layout/use-sidebar-collapsed'
import { Button } from '@/components/ui/Button'
import { RoleSwitcher } from '@/features/auth/RoleSwitcher'
import { useAuth } from '@/features/auth/auth-context'
import type { Role } from '@/types/rbac'
import styles from './AppShell.module.scss'

/** Menu items aligned with Figma CRM Dashboard (expanded + minimized frames). */
const NAV_ITEMS: SidebarNavItemConfig[] = [
  { label: 'Dashboard', icon: 'key-square' },
  { label: 'Product', icon: 'product', hasChevron: true },
  { label: 'Customers', icon: 'customers', to: '/claims', hasChevron: true },
  { label: 'Income', icon: 'income', hasChevron: true },
  { label: 'Promote', icon: 'promote', hasChevron: true },
  { label: 'Help', icon: 'help', hasChevron: true },
]

const ROLE_LABELS: Record<Role, string> = {
  viewer: 'Viewer',
  adjuster: 'Claims Adjuster',
  admin: 'Administrator',
}

function userInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AppShell() {
  const { user } = useAuth()
  const { collapsed, toggle } = useSidebarCollapsed()

  return (
    <div className={styles.root}>
      <aside
        className={[styles.sidebar, collapsed && styles.sidebarCollapsed].filter(Boolean).join(' ')}
        aria-label="Sidebar"
        aria-expanded={!collapsed}
      >
        <div className={styles.brand}>
          <button
            type="button"
            className={styles.brandBtn}
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <BrandLogoIcon />
          </button>
          {!collapsed && (
            <>
              <span className={styles.brandName}>Dashboard</span>
              <span className={styles.version}>v.01</span>
            </>
          )}
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          <SidebarNav items={NAV_ITEMS} collapsed={collapsed} />
        </nav>

        {!collapsed && (
          <div className={styles.proCard}>
            <p className={styles.proText}>Upgrade to PRO to get access all Features!</p>
            <Button variant="secondary" className={styles.proBtn}>
              Get Pro Now!
            </Button>
          </div>
        )}

        <footer className={styles.profileSection}>
          <div className={[styles.profile, collapsed && styles.profileCollapsed].filter(Boolean).join(' ')}>
            <div className={styles.avatar} aria-hidden title={collapsed ? user.name : undefined}>
              {userInitials(user.name)}
            </div>
            {!collapsed && (
              <>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{user.name}</span>
                  <span className={styles.profileRole}>{ROLE_LABELS[user.role]}</span>
                </div>
                <NavIcon name="chevron" className={styles.profileChevron} size="sm" />
              </>
            )}
          </div>
          {!collapsed && <RoleSwitcher className={styles.roleSwitcher} />}
        </footer>
      </aside>

      <div className={styles.main}>
        <MainHeader />
        <Outlet />
      </div>
    </div>
  )
}
