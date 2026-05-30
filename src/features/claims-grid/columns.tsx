import { useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RowActions } from '@/features/claims-grid/components/RowActions'
import type { Claim } from '@/types/claim'

const helper = createColumnHelper<Claim>()

type UseClaimsColumnsOptions = {
  onEdit: (claim: Claim) => void
  onDelete: (claim: Claim) => void
  onAssign: (claim: Claim) => void
}

export function useClaimsColumns({ onEdit, onDelete, onAssign }: UseClaimsColumnsOptions) {
  return useMemo(
    () =>
      [
        helper.accessor('claimant', { header: 'Claimant' }),
        helper.accessor('channel', {
          header: 'Channel',
          cell: ({ getValue }) => getValue().toUpperCase(),
        }),
        helper.accessor('assignee', {
          header: 'Assignee',
          cell: ({ getValue }) => getValue() ?? '—',
        }),
        helper.accessor('status', {
          header: 'Status',
          cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        }),
        helper.display({
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => (
            <RowActions
              claim={row.original}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssign={onAssign}
            />
          ),
        }),
      ] as ColumnDef<Claim>[],
    [onEdit, onDelete, onAssign],
  )
}
