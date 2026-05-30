import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { ClaimsGridPage } from '@/features/claims-grid/ClaimsGridPage'
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
          { path: 'claims', element: <ClaimsGridPage /> },
          { path: 'claims/:id/workspace', element: <DocumentWorkspacePage /> },
        ],
      },
    ],
  },
])
