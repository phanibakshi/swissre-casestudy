import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { Can } from '@/features/auth/Can'
import { useAuth } from '@/features/auth/auth-context'
import { apiGet, apiMutate, ApiError } from '@/lib/api/client'
import { loadPdfDocument, releasePdfDocument } from '@/lib/pdf'
import type { Claim } from '@/types/claim'
import type { DocumentAnnotation, DocumentComment, DocumentJob, DocumentState } from '@/types/document'
import styles from './DocumentWorkspacePage.module.scss'

type ClaimWorkspace = {
  claim: Claim
  document: { fileName: string; sizeBytes: number; pageCount: number }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  return `${Math.round(bytes / 1_000_000)} MB`
}

export function DocumentWorkspacePage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const [highlightMode, setHighlightMode] = useState(false)
  const [noteMode, setNoteMode] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['claim-workspace', id, user.role],
    queryFn: ({ signal }) => apiGet<ClaimWorkspace>(`/api/claims/${id}`, { role: user.role, signal }),
    enabled: Boolean(id),
  })

  const { data: pdfPageCount, isLoading: pdfMetaLoading } = useQuery({
    queryKey: ['pdf-page-count'],
    queryFn: async () => (await loadPdfDocument()).numPages,
    staleTime: Infinity,
  })

  const pageCount = pdfPageCount ?? data?.document.pageCount ?? 1
  const rawPage = Number(params.get('page') ?? 1)
  const page = Number.isFinite(rawPage) ? Math.min(pageCount, Math.max(1, Math.floor(rawPage))) : 1

  const setPage = useCallback(
    (next: number) => {
      const clamped = Math.min(pageCount, Math.max(1, next))
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev)
          copy.set('page', String(clamped))
          return copy
        },
        { replace: true },
      )
    },
    [pageCount, setParams],
  )

  const { data: docState } = useQuery({
    queryKey: ['document-state', id, user.role],
    queryFn: ({ signal }) => apiGet<DocumentState>(`/api/documents/${id}/state`, { role: user.role, signal }),
    enabled: Boolean(id),
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['document-comments', id, page, user.role],
    queryFn: ({ signal }) =>
      apiGet<DocumentComment[]>(`/api/documents/${id}/pages/${page}/comments`, { role: user.role, signal }),
    enabled: Boolean(id),
  })

  const { data: annotations = [] } = useQuery({
    queryKey: ['document-annotations', id, page, user.role],
    queryFn: ({ signal }) =>
      apiGet<DocumentAnnotation[]>(`/api/documents/${id}/pages/${page}/annotations`, {
        role: user.role,
        signal,
      }),
    enabled: Boolean(id),
  })

  const { data: activeJob } = useQuery({
    queryKey: ['document-job', activeJobId, user.role],
    queryFn: ({ signal }) => apiGet<DocumentJob>(`/api/jobs/${activeJobId}`, { role: user.role, signal }),
    enabled: Boolean(activeJobId),
    refetchInterval: (q) =>
      q.state.data?.status === 'pending' || q.state.data?.status === 'running' ? 500 : false,
  })

  const invalidatePage = () => {
    queryClient.invalidateQueries({ queryKey: ['document-state', id] })
    queryClient.invalidateQueries({ queryKey: ['document-comments', id, page] })
    queryClient.invalidateQueries({ queryKey: ['document-annotations', id, page] })
  }

  const addComment = useMutation({
    mutationFn: (text: string) =>
      apiMutate<DocumentComment>(`/api/documents/${id}/pages/${page}/comments`, {
        role: user.role,
        body: { text },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-comments', id, page] }),
  })

  const addAnnotation = useMutation({
    mutationFn: (patch: Omit<DocumentAnnotation, 'id' | 'page'>) =>
      apiMutate<DocumentAnnotation>(`/api/documents/${id}/pages/${page}/annotations`, {
        role: user.role,
        body: patch,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-annotations', id, page] }),
  })

  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      apiMutate(`/api/documents/${id}/pages/${page}/comments/${commentId}`, {
        role: user.role,
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-comments', id, page] }),
  })

  const deleteAnnotation = useMutation({
    mutationFn: (annotationId: string) =>
      apiMutate(`/api/documents/${id}/pages/${page}/annotations/${annotationId}`, {
        role: user.role,
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-annotations', id, page] }),
  })

  const runJob = useMutation({
    mutationFn: (req: { path: string; method?: 'DELETE' | 'PATCH' | 'POST' }) =>
      apiMutate<DocumentJob>(req.path, { role: user.role, method: req.method ?? 'POST' }),
    onSuccess: (job) => {
      setActiveJobId(job.id)
      invalidatePage()
    },
  })

  useEffect(() => {
    setHighlightMode(false)
    setNoteMode(false)
    setNoteText('')
  }, [page])

  useEffect(() => {
    if (activeJob?.status === 'completed' || activeJob?.status === 'failed') {
      const t = window.setTimeout(() => setActiveJobId(null), 3000)
      return () => window.clearTimeout(t)
    }
  }, [activeJob?.status])

  const jobBusy = Boolean(activeJob && activeJob.status !== 'completed' && activeJob.status !== 'failed')
  const deleted = docState?.deletedPages.includes(page) ?? false
  const rotation = docState?.rotations[page] ?? 0
  const title = data ? `${data.claim.customerName} — Documents` : `Claim ${id}`

  return (
    <section className={styles.root}>
      {isLoading && <Loader message="Opening documents…" />}
      {data && pdfMetaLoading && !pdfPageCount && <Loader message="Loading document…" />}

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
          </div>
        )}

        {data && (
          <div className={styles.panel}>
            <p className={styles.fileInfo}>
              {data.document.fileName} · {formatBytes(data.document.sizeBytes)} · {pageCount.toLocaleString()} pages
              {docState && docState.version > 1 && ` · v${docState.version}`}
            </p>

            <div className={styles.toolbar}>
              <div className={styles.nav}>
                <Button variant="ghost" disabled={page <= 1 || jobBusy} onClick={() => setPage(page - 1)}>
                  ← Prev
                </Button>
                <span className={styles.pageLabel}>
                  Page {page} of {pageCount}
                </span>
                <Button variant="ghost" disabled={page >= pageCount || jobBusy} onClick={() => setPage(page + 1)}>
                  Next →
                </Button>
              </div>
              <div className={styles.actions}>
                <Can permission="documents:edit">
                  <Button
                    variant="secondary"
                    disabled={jobBusy}
                    onClick={() => runJob.mutate({ path: `/api/documents/${id}/pages/${page}`, method: 'PATCH' })}
                  >
                    Rotate
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={jobBusy}
                    onClick={() => runJob.mutate({ path: `/api/documents/${id}/pages/${page}`, method: 'DELETE' })}
                  >
                    Delete page
                  </Button>
                </Can>
                <Can permission="documents:split">
                  <Button
                    variant="secondary"
                    disabled={jobBusy}
                    onClick={() => runJob.mutate({ path: `/api/documents/${id}/split` })}
                  >
                    Split
                  </Button>
                </Can>
                <Can permission="documents:merge">
                  <Button variant="secondary" disabled={jobBusy} onClick={() => runJob.mutate({ path: '/api/documents/merge' })}>
                    Merge
                  </Button>
                </Can>
              </div>
              {activeJob && activeJob.status !== 'completed' && (
                <p className={styles.job}>
                  {activeJob.message} ({activeJob.status})
                </p>
              )}
            </div>

            <div className={styles.workspace}>
              <PdfPage
                page={page}
                rotation={rotation}
                deleted={deleted}
                annotations={annotations}
                highlightMode={highlightMode}
                noteMode={noteMode}
                noteText={noteText}
                onHighlight={(patch) => {
                  addAnnotation.mutate(patch)
                  setHighlightMode(false)
                }}
                onNote={(patch) => {
                  addAnnotation.mutate(patch)
                  setNoteMode(false)
                  setNoteText('')
                }}
              />

              <aside className={styles.side}>
                <h2 className={styles.sideHeading}>Page {page}</h2>
                <Can permission="documents:comment">
                  <div className={styles.tools}>
                    <Button
                      variant={highlightMode ? 'primary' : 'secondary'}
                      onClick={() => {
                        setNoteMode(false)
                        setHighlightMode((v) => !v)
                      }}
                    >
                      {highlightMode ? 'Highlighting…' : 'Highlight'}
                    </Button>
                    <Button
                      variant={noteMode ? 'primary' : 'secondary'}
                      onClick={() => {
                        setHighlightMode(false)
                        setNoteMode((v) => !v)
                      }}
                    >
                      {noteMode ? 'Placing note…' : 'Add note'}
                    </Button>
                  </div>
                  {noteMode && (
                    <label className={styles.field}>
                      <span className={styles.label}>Note text</span>
                      <textarea
                        className={styles.input}
                        rows={2}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Enter note, then click on the page…"
                      />
                    </label>
                  )}
                  <form
                    className={styles.field}
                    onSubmit={(e) => {
                      e.preventDefault()
                      const text = commentDraft.trim()
                      if (!text) return
                      addComment.mutate(text)
                      setCommentDraft('')
                    }}
                  >
                    <span className={styles.label}>Comment</span>
                    <textarea
                      className={styles.input}
                      rows={3}
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder="Add a page-level comment…"
                    />
                    <Button type="submit" variant="primary" disabled={addComment.isPending || !commentDraft.trim()}>
                      Post comment
                    </Button>
                  </form>
                </Can>

                <section>
                  <h3 className={styles.subheading}>Comments ({comments.length})</h3>
                  <ul className={styles.list}>
                    {comments.length === 0 && <li className={styles.empty}>No comments on this page.</li>}
                    {comments.map((c) => (
                      <li key={c.id} className={styles.item}>
                        <div className={styles.itemHeader}>
                          <p className={styles.itemMeta}>
                            {c.author} · {new Date(c.createdAt).toLocaleString()}
                          </p>
                          <Can permission="documents:comment">
                            <button type="button" className={styles.removeBtn} onClick={() => deleteComment.mutate(c.id)}>
                              Remove
                            </button>
                          </Can>
                        </div>
                        <p className={styles.itemText}>{c.text}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className={styles.subheading}>Annotations ({annotations.length})</h3>
                  <ul className={styles.list}>
                    {annotations.length === 0 && <li className={styles.empty}>No annotations on this page.</li>}
                    {annotations.map((a) => (
                      <li key={a.id} className={styles.item}>
                        <div className={styles.itemHeader}>
                          <p className={styles.itemMeta}>
                            {a.type === 'note' ? 'Note' : 'Highlight'}
                            {a.text ? ` · ${a.text}` : ''}
                          </p>
                          <Can permission="documents:comment">
                            <button type="button" className={styles.removeBtn} onClick={() => deleteAnnotation.mutate(a.id)}>
                              Remove
                            </button>
                          </Can>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          </div>
        )}
      </Can>
    </section>
  )
}

type PdfPageProps = {
  page: number
  rotation: number
  deleted: boolean
  annotations: DocumentAnnotation[]
  highlightMode: boolean
  noteMode: boolean
  noteText: string
  onHighlight: (patch: Omit<DocumentAnnotation, 'id' | 'page'>) => void
  onNote: (patch: Omit<DocumentAnnotation, 'id' | 'page'>) => void
}

function PdfPage({ page, rotation, deleted, annotations, highlightMode, noteMode, noteText, onHighlight, onNote }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const [draft, setDraft] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  useEffect(() => () => releasePdfDocument(), [])

  useEffect(() => {
    if (deleted) {
      setLoading(false)
      return
    }
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    setLoading(true)
    setError(null)
    loadPdfDocument()
      .then(async (pdf) => {
        if (cancelled) return
        const pdfPage = await pdf.getPage(page)
        const viewport = pdfPage.getViewport({ scale: 1.25, rotation })
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise
        if (!cancelled) setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load page')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [page, rotation, deleted])

  function point(event: React.MouseEvent) {
    const stage = stageRef.current
    if (!stage) return null
    const rect = stage.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }
  }

  if (deleted) return <p className={styles.deleted}>This page was deleted.</p>

  return (
    <div className={styles.viewer}>
      <div className={styles.viewerFrame}>
        <div
          ref={stageRef}
          className={[styles.stage, highlightMode && styles.highlightMode, noteMode && styles.noteMode]
            .filter(Boolean)
            .join(' ')}
          onMouseDown={(e) => {
            if (noteMode || !highlightMode) return
            e.preventDefault()
            const p = point(e)
            if (!p) return
            dragRef.current = p
            setDraft({ x: p.x, y: p.y, width: 0, height: 0 })
          }}
          onMouseMove={(e) => {
            if (!dragRef.current) return
            const p = point(e)
            if (!p) return
            setDraft({
              x: Math.min(dragRef.current.x, p.x),
              y: Math.min(dragRef.current.y, p.y),
              width: Math.abs(p.x - dragRef.current.x),
              height: Math.abs(p.y - dragRef.current.y),
            })
          }}
          onMouseUp={() => {
            if (!dragRef.current || !draft) {
              dragRef.current = null
              setDraft(null)
              return
            }
            if (draft.width > 1 && draft.height > 1) {
              onHighlight({
                type: 'highlight',
                x: draft.x,
                y: draft.y,
                width: draft.width,
                height: draft.height,
                color: 'rgba(255, 214, 0, 0.35)',
              })
            }
            dragRef.current = null
            setDraft(null)
          }}
          onMouseLeave={() => {
            dragRef.current = null
            setDraft(null)
          }}
          onClick={(e) => {
            if (!noteMode || !noteText.trim()) return
            const p = point(e)
            if (!p) return
            onNote({ type: 'note', x: p.x, y: p.y, width: 0, height: 0, color: '#2563eb', text: noteText.trim() })
          }}
        >
          <canvas ref={canvasRef} className={styles.canvas} />
          {annotations.map((ann) =>
            ann.type === 'note' ? (
              <span
                key={ann.id}
                className={styles.notePin}
                style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                title={ann.text}
              />
            ) : (
              <span
                key={ann.id}
                className={styles.highlight}
                style={{
                  left: `${ann.x}%`,
                  top: `${ann.y}%`,
                  width: `${ann.width}%`,
                  height: `${ann.height}%`,
                  backgroundColor: ann.color,
                }}
              />
            ),
          )}
          {draft && (
            <span
              className={styles.highlight}
              style={{
                left: `${draft.x}%`,
                top: `${draft.y}%`,
                width: `${draft.width}%`,
                height: `${draft.height}%`,
                backgroundColor: 'rgba(255, 214, 0, 0.35)',
              }}
            />
          )}
        </div>
      </div>
      {(highlightMode || noteMode) && (
        <p className={styles.hint}>{noteMode ? 'Click on the page to place your note.' : 'Drag to highlight.'}</p>
      )}
      {loading && <p className={styles.status}>Rendering page…</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
