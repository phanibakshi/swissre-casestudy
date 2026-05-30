import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { ClaimsGrid } from '@/features/claims-grid/ClaimsGrid'
import { DocumentWorkspacePage } from '@/features/document-workspace/DocumentWorkspacePage'

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
          { path: 'claims/:id/workspace', element: <DocumentWorkspacePage /> },
        ],
      },
    ],
  },
])
