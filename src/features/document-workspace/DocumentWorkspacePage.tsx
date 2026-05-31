import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Can } from '@/features/auth/Can'
import { Loader } from '@/components/ui/Loader'
import { useAuth } from '@/features/auth/auth-context'
import { apiGet, ApiError } from '@/lib/api/client'
import type { Claim } from '@/types/claim'
import styles from './DocumentWorkspacePage.module.scss'

type ClaimWorkspace = {
  claim: Claim
  document: {
    fileName: string
    sizeBytes: number
    pageCount: number
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  return `${Math.round(bytes / 1_000_000)} MB`
}

export function DocumentWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['claim-workspace', id, user.role],
    queryFn: ({ signal }) => apiGet<ClaimWorkspace>(`/api/claims/${id}`, { role: user.role, signal }),
    enabled: Boolean(id),
  })

  const title = data ? `${data.claim.customerName} — Documents` : `Claim ${id}`

  return (
    <section className={styles.root}>
      {isLoading && <Loader message="Opening documents…" />}
      <header className={styles.header}>
        <div>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/claims">Customers</Link>
            <span aria-hidden>›</span>
            <span>{id}</span>
          </nav>
          <h1 className={styles.title}>{title}</h1>
          {data && (
            <p className={styles.meta}>
              {data.claim.company} · {data.claim.country}
            </p>
          )}
        </div>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </header>

      <Can permission="documents:view" fallback={<p className={styles.denied}>You do not have permission to view documents.</p>}>
        {isError && (
          <div className={styles.panel}>
            <p className={styles.error}>
              {error instanceof ApiError && error.status === 403
                ? 'You do not have access to this claim.'
                : 'Failed to load documents.'}
            </p>
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
              Back to grid
            </button>
          </div>
        )}

        {data && (
          <div className={styles.panel}>
            <p className={styles.fileInfo}>
              {data.document.fileName} · {formatBytes(data.document.sizeBytes)} · {data.document.pageCount.toLocaleString()} pages
            </p>
            <div className={styles.viewer} role="img" aria-label="Document viewer placeholder">
              <span className={styles.viewerLabel}>PDF viewer</span>
              <span className={styles.viewerHint}>Page 1 will render here (Phase 4)</span>
            </div>
          </div>
        )}
      </Can>
    </section>
  )
}
