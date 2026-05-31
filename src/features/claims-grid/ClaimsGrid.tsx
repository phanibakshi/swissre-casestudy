import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Pagination } from '@/components/ui/Pagination'
import { Loader } from '@/components/ui/Loader'
import { useClaimsColumns } from '@/features/claims-grid/columns'
import { useClaimsParams } from '@/features/claims-grid/hooks/use-claims-params'
import { useClaimsQuery } from '@/features/claims-grid/hooks/use-claims-query'
import { getTableRowHeightPx, pxToRem } from '@/lib/layout/rem'
import type { ClaimsSortField } from '@/types/claim'
import styles from './ClaimsGrid.module.scss'

const COL_CLASS: Record<string, string | undefined> = {
  customerName: styles.colCustomerName,
  company: styles.colCompany,
  phone: styles.colPhone,
  email: styles.colEmail,
  country: styles.colCountry,
  status: styles.colStatus,
}
const SORTABLE_COLUMNS: ClaimsSortField[] = [
  'customerName',
  'company',
  'phone',
  'email',
  'country',
  'status',
  'updatedAt',
]
const SORT_OPTIONS: { label: string; value: ClaimsSortField }[] = [
  { label: 'Newest', value: 'updatedAt' },
  { label: 'Customer', value: 'customerName' },
  { label: 'Company', value: 'company' },
  { label: 'Status', value: 'status' },
]

export function ClaimsGrid() {
  const navigate = useNavigate()
  const { params, setParams } = useClaimsParams()
  const { data, isLoading, isError, refetch, isFetching } = useClaimsQuery(params)
  const [rowHeightPx, setRowHeightPx] = useState(getTableRowHeightPx)
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    setRowHeightPx(getTableRowHeightPx())
  }, [])

  const columns = useClaimsColumns()

  const sorting: SortingState = [{ id: params.sort, desc: params.sortDir === 'desc' }]

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeightPx,
    overscan: 4,
  })

  const handleSortChange = (field: ClaimsSortField) => {
    const sameField = params.sort === field
    setParams({
      sort: field,
      sortDir: sameField && params.sortDir === 'desc' ? 'asc' : 'desc',
      page: 1,
    })
  }

  const activeCount = data?.data.filter((c) => c.status === 'active').length ?? 0

  return (
    <article className={styles.card}>
      {isLoading && <Loader message="Loading customers…" />}
      <header className={styles.cardHeader}>
        <div>
          <h2 className={styles.title}>All Customers</h2>
          <p className={styles.subtitle}>{activeCount} active on this page</p>
        </div>
        <div className={styles.toolbar}>
          <label className={styles.sort}>
            <span className={styles.sortLabel}>Sort by:</span>
            <select
              className={styles.sortSelect}
              value={params.sort}
              onChange={(e) => handleSortChange(e.target.value as ClaimsSortField)}
            >
              {SORT_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {isError && (
        <p className={styles.state}>
          Failed to load claims.{' '}
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Retry
          </button>
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div ref={scrollRef} className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => {
                      const sortable = SORTABLE_COLUMNS.includes(header.column.id as ClaimsSortField)
                      return (
                        <th
                          key={header.id}
                          className={[
                            styles.th,
                            COL_CLASS[header.column.id],
                            sortable && styles.thSortable,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => sortable && handleSortChange(header.column.id as ClaimsSortField)}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {params.sort === header.column.id && (
                            <span className={styles.sortIndicator}>{params.sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody
                style={{
                  height: rows.length ? `${pxToRem(virtualizer.getTotalSize())}rem` : undefined,
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((vRow) => {
                  const row = rows[vRow.index]
                  return (
                    <tr
                      key={row.id}
                      className={styles.row}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${pxToRem(vRow.size)}rem`,
                        transform: `translateY(${pxToRem(vRow.start)}rem)`,
                        display: 'table',
                        tableLayout: 'fixed',
                      }}
                      onClick={() => navigate(`/claims/${row.original.id}/workspace`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={[styles.td, COL_CLASS[cell.column.id]].filter(Boolean).join(' ')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {isFetching && !isLoading && <p className={styles.fetching}>Updating…</p>}

          <Pagination
            page={params.page}
            pageSize={params.pageSize}
            total={data?.total ?? 0}
            onPageChange={(page) => setParams({ page })}
          />
        </>
      )}
    </article>
  )
}
