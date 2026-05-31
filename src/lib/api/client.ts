import type { Role } from '@/types/rbac'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type FetchOptions = {
  role?: Role
  signal?: AbortSignal
}

type MutateOptions = FetchOptions & {
  method?: 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

function authHeaders(role?: Role, json = false): Record<string, string> {
  const headers: Record<string, string> = {}
  if (role) headers['X-User-Role'] = role
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export async function apiGet<T>(path: string, { role, signal }: FetchOptions = {}): Promise<T> {
  const res = await fetch(path, { headers: authHeaders(role), signal })
  if (!res.ok) throw new ApiError(res.statusText || 'Request failed', res.status)
  return res.json() as Promise<T>
}

export async function apiMutate<T>(path: string, options: MutateOptions = {}): Promise<T> {
  const { role, signal, method = 'POST', body } = options
  const res = await fetch(path, {
    method,
    headers: authHeaders(role, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })
  if (!res.ok) throw new ApiError(res.statusText || 'Request failed', res.status)
  return res.json() as Promise<T>
}

export function buildClaimsUrl(params: Record<string, string | number>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== undefined) search.set(key, String(value))
  }
  return `/api/claims?${search.toString()}`
}
