import { Can } from '@/features/auth/Can'
import type { Claim } from '@/types/claim'
import styles from './RowActions.module.scss'

type RowActionsProps = {
  claim: Claim
  onEdit: (claim: Claim) => void
  onDelete: (claim: Claim) => void
  onAssign: (claim: Claim) => void
}

export function RowActions({ claim, onEdit, onDelete, onAssign }: RowActionsProps) {
  return (
    <div className={styles.root} onClick={(e) => e.stopPropagation()}>
      <Can permission="claims:edit">
        <button type="button" className={styles.action} onClick={() => onEdit(claim)}>
          Edit
        </button>
      </Can>
      <Can permission="claims:assign">
        <button type="button" className={styles.action} onClick={() => onAssign(claim)}>
          Assign
        </button>
      </Can>
      <Can permission="claims:delete">
        <button type="button" className={[styles.action, styles.danger].join(' ')} onClick={() => onDelete(claim)}>
          Delete
        </button>
      </Can>
    </div>
  )
}
