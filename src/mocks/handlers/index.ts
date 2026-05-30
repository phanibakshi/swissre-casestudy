import { http, HttpResponse } from 'msw'
import { claimsHandlers } from '@/mocks/handlers/claims'
import { DEFAULT_MOCK_USER } from '@/mocks/data/users'

export const handlers = [
  http.get('/api/me', () => HttpResponse.json(DEFAULT_MOCK_USER)),
  ...claimsHandlers,
]
