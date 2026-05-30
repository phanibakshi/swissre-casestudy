import { useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Claim } from '@/types/claim'

const helper = createColumnHelper<Claim>()

export function useClaimsColumns() {
  return useMemo(
    () =>
      [
        helper.accessor('customerName', { header: 'Customer name' }),
        helper.accessor('company', { header: 'Company' }),
        helper.accessor('phone', { header: 'Phone Number' }),
        helper.accessor('email', { header: 'Email' }),
        helper.accessor('country', { header: 'Country' }),
        helper.accessor('status', {
          header: 'Status',
          cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        }),
      ] as ColumnDef<Claim>[],
    [],
  )
}
