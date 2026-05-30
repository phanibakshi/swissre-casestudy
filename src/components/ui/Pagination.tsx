import styles from './Pagination.module.scss'

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

function formatTotal(total: number): string {
  if (total >= 1_000_000) return `${total % 1_000_000 === 0 ? total / 1_000_000 : (total / 1_000_000).toFixed(1)}M`
  if (total >= 1_000) return `${total % 1_000 === 0 ? total / 1_000 : (total / 1_000).toFixed(1)}K`
  return String(total)
}

function buildPages(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < totalPages - 2) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = buildPages(page, totalPages)

  return (
    <footer className={styles.footer}>
      <p className={styles.summary}>
        Showing data {from} to {to} of {formatTotal(total)} entries
      </p>
      <nav className={styles.nav} aria-label="Pagination">
        <button
          type="button"
          className={styles.pageBtn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          &lt;
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className={styles.ellipsis}>
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={[styles.pageBtn, p === page && styles.pageBtnActive].filter(Boolean).join(' ')}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          &gt;
        </button>
      </nav>
    </footer>
  )
}
