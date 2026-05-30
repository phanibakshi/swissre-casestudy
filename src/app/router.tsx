import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { ClaimsGrid } from '@/features/claims-grid/ClaimsGrid'

const DocumentWorkspacePage = lazy(() =>
  import('@/features/document-workspace/DocumentWorkspacePage').then((m) => ({
    default: m.DocumentWorkspacePage,
  })),
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/claims" replace /> },
      {
        element: <ProtectedRoute permission="claims:read" />,
        children: [
          { path: 'claims', element: <ClaimsGrid /> },
          {
            path: 'claims/:id/workspace',
            element: (
              <Suspense fallback={<p>Loading workspace…</p>}>
                <DocumentWorkspacePage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
])
