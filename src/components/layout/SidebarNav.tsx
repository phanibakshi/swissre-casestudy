import { NavLink } from 'react-router-dom'
import { NavIcon, type NavIconName } from '@/components/layout/NavIcon'
import styles from './SidebarNav.module.scss'

export type SidebarNavItemConfig = {
  label: string
  icon: NavIconName
  to?: string
  hasChevron?: boolean
}

type SidebarNavProps = {
  items: SidebarNavItemConfig[]
  collapsed?: boolean
}

export function SidebarNav({ items, collapsed = false }: SidebarNavProps) {
  return (
    <ul className={[styles.list, collapsed && styles.listCollapsed].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const content = (
          <>
            <NavIcon name={item.icon} className={styles.icon} />
            {!collapsed && <span className={styles.label}>{item.label}</span>}
            {!collapsed && item.hasChevron && (
              <NavIcon name="chevron" className={styles.chevron} size="sm" />
            )}
          </>
        )

        const linkClass = ({ isActive }: { isActive: boolean }) =>
          [
            styles.link,
            collapsed && styles.linkCollapsed,
            isActive && styles.linkActive,
            isActive && collapsed && styles.linkActiveCollapsed,
          ]
            .filter(Boolean)
            .join(' ')

        return (
          <li key={item.label}>
            {item.to ? (
              <NavLink to={item.to} className={linkClass} title={collapsed ? item.label : undefined}>
                {content}
              </NavLink>
            ) : (
              <span
                className={[styles.link, styles.linkDisabled, collapsed && styles.linkCollapsed]
                  .filter(Boolean)
                  .join(' ')}
                aria-disabled
                title={collapsed ? item.label : undefined}
              >
                {content}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
