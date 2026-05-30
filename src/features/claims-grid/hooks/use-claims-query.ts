import { useQuery } from '@tanstack/react-query'
import { buildClaimsUrl, apiGet } from '@/lib/api/client'
import { useAuth } from '@/features/auth/auth-context'
import type { ClaimsQueryParams, ClaimsResponse } from '@/types/claim'

export function useClaimsQuery(params: ClaimsQueryParams) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['claims', params, user.role],
    queryFn: ({ signal }) =>
      apiGet<ClaimsResponse>(
        buildClaimsUrl({
          page: params.page,
          pageSize: params.pageSize,
          sort: params.sort,
          sortDir: params.sortDir,
          search: params.search,
          status: params.status,
        }),
        { role: user.role, signal },
      ),
    placeholderData: (prev) => prev,
  })
}
