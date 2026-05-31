import { http, HttpResponse, delay } from 'msw'
import { can } from '@/lib/rbac/permissions'
import { DEFAULT_MOCK_USER, MOCK_USERS } from '@/mocks/data/users'
import type { DocumentAnnotation, DocumentComment, DocumentJob, DocumentState } from '@/types/document'
import type { Permission, Role } from '@/types/rbac'

const states = new Map<string, DocumentState>()
const comments = new Map<string, DocumentComment[]>()
const annotations = new Map<string, DocumentAnnotation[]>()
const jobs = new Map<string, DocumentJob>()

function pageKey(claimId: string, page: number) {
  return `${claimId}:${page}`
}

function getState(claimId: string): DocumentState {
  let state = states.get(claimId)
  if (!state) {
    state = { version: 1, deletedPages: [], rotations: {} }
    states.set(claimId, state)
  }
  return state
}

function roleFromRequest(request: Request): Role {
  const header = request.headers.get('X-User-Role')
  if (header === 'viewer' || header === 'adjuster' || header === 'admin') return header
  return DEFAULT_MOCK_USER.role
}

function assertPermission(role: Role, permission: Permission) {
  if (!can(role, permission)) throw new Error('FORBIDDEN')
}

function createJob(claimId: string, type: DocumentJob['type'], message: string, page?: number): DocumentJob {
  const job: DocumentJob = {
    id: `job-${Date.now()}`,
    type,
    status: 'pending',
    message,
    createdAt: new Date().toISOString(),
  }
  jobs.set(job.id, job)
  setTimeout(() => {
    job.status = 'running'
  }, 300)
  setTimeout(() => {
    const state = getState(claimId)
    if (type === 'delete' && page !== undefined && !state.deletedPages.includes(page)) {
      state.deletedPages.push(page)
    }
    if (type === 'rotate' && page !== undefined) {
      state.rotations[page] = ((state.rotations[page] ?? 0) + 90) % 360
    }
    state.version++
    job.status = 'completed'
    job.message = `${type} completed — v${state.version}`
  }, 2000)
  return job
}

export const documentHandlers = [
  http.get('/api/documents/:claimId/state', ({ request, params }) => {
    const role = roleFromRequest(request)
    if (!can(role, 'documents:view')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(getState(params.claimId as string))
  }),

  http.get('/api/documents/:claimId/pages/:page/comments', ({ request, params }) => {
    const role = roleFromRequest(request)
    if (!can(role, 'documents:view')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(comments.get(pageKey(params.claimId as string, Number(params.page))) ?? [])
  }),

  http.post('/api/documents/:claimId/pages/:page/comments', async ({ request, params }) => {
    await delay(200)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:comment')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    const body = (await request.json()) as { text: string }
    const page = Number(params.page)
    const claimId = params.claimId as string
    const entry: DocumentComment = {
      id: `cmt-${Date.now()}`,
      page,
      author: MOCK_USERS[role].name,
      text: body.text,
      createdAt: new Date().toISOString(),
    }
    const k = pageKey(claimId, page)
    comments.set(k, [...(comments.get(k) ?? []), entry])
    return HttpResponse.json(entry)
  }),

  http.delete('/api/documents/:claimId/pages/:page/comments/:commentId', async ({ request, params }) => {
    await delay(100)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:comment')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    const k = pageKey(params.claimId as string, Number(params.page))
    const next = (comments.get(k) ?? []).filter((c) => c.id !== params.commentId)
    if (next.length === (comments.get(k) ?? []).length) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    comments.set(k, next)
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/documents/:claimId/pages/:page/annotations', ({ request, params }) => {
    const role = roleFromRequest(request)
    if (!can(role, 'documents:view')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(annotations.get(pageKey(params.claimId as string, Number(params.page))) ?? [])
  }),

  http.post('/api/documents/:claimId/pages/:page/annotations', async ({ request, params }) => {
    await delay(150)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:comment')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    const body = (await request.json()) as Omit<DocumentAnnotation, 'id' | 'page'>
    const page = Number(params.page)
    const entry: DocumentAnnotation = { id: `ann-${Date.now()}`, page, ...body }
    const k = pageKey(params.claimId as string, page)
    annotations.set(k, [...(annotations.get(k) ?? []), entry])
    return HttpResponse.json(entry)
  }),

  http.delete('/api/documents/:claimId/pages/:page/annotations/:annotationId', async ({ request, params }) => {
    await delay(100)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:comment')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    const k = pageKey(params.claimId as string, Number(params.page))
    const next = (annotations.get(k) ?? []).filter((a) => a.id !== params.annotationId)
    if (next.length === (annotations.get(k) ?? []).length) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    annotations.set(k, next)
    return HttpResponse.json({ ok: true })
  }),

  http.delete('/api/documents/:claimId/pages/:page', async ({ request, params }) => {
    await delay(100)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:edit')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    const page = Number(params.page)
    return HttpResponse.json(createJob(params.claimId as string, 'delete', `Deleting page ${page}…`, page))
  }),

  http.patch('/api/documents/:claimId/pages/:page', async ({ request, params }) => {
    await delay(100)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:edit')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    const page = Number(params.page)
    return HttpResponse.json(createJob(params.claimId as string, 'rotate', `Rotating page ${page}…`, page))
  }),

  http.post('/api/documents/:claimId/split', async ({ request, params }) => {
    await delay(100)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:split')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    return HttpResponse.json(createJob(params.claimId as string, 'split', 'Splitting document…'))
  }),

  http.post('/api/documents/merge', async ({ request }) => {
    await delay(100)
    const role = roleFromRequest(request)
    try {
      assertPermission(role, 'documents:merge')
    } catch {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    return HttpResponse.json(createJob('merge', 'merge', 'Merging documents…'))
  }),

  http.get('/api/jobs/:jobId', ({ request, params }) => {
    const role = roleFromRequest(request)
    if (!can(role, 'documents:view')) return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    const job = jobs.get(params.jobId as string)
    if (!job) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(job)
  }),
]
