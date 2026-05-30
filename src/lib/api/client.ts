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

export async function apiGet<T>(path: string, { role, signal }: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (role) headers['X-User-Role'] = role

  const res = await fetch(path, { headers, signal })
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
