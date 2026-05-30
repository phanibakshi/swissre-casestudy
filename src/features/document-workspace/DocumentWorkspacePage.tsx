import { Link, useParams } from 'react-router-dom'
import { Page } from '@/components/layout/Page'
import { Can } from '@/features/auth/Can'

export function DocumentWorkspacePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Page
      title={`Claim ${id} — Document Workspace`}
      description="Large document viewer and operations — Phase 4–6."
      actions={<Link to="/claims">← Back to claims</Link>}
    >
      <Can permission="documents:view" fallback={<p>You do not have permission to view documents.</p>}>
        <p>
          Document workspace for claim <strong>{id}</strong> will be implemented in Phase 4.
        </p>
      </Can>
    </Page>
  )
}
