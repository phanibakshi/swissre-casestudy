import type { ClaimStatus } from '@/types/claim'
import styles from './StatusBadge.module.scss'

const LABELS: Record<ClaimStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

type StatusBadgeProps = {
  status: ClaimStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={[styles.badge, styles[status]].join(' ')}>
      {LABELS[status]}
    </span>
  )
}
