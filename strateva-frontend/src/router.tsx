import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RequireRole } from '@/components/RequireRole'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { GoalsListPage } from '@/pages/GoalsListPage'
import { GoalCreatePage } from '@/pages/GoalCreatePage'
import { GoalEditPage } from '@/pages/GoalEditPage'
import { GoalDetailPage } from '@/pages/GoalDetailPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'goals', element: <GoalsListPage /> },
      {
        path: 'goals/new',
        element: (
          <RequireRole allow={['PROJECT_MANAGER']} redirectTo="/goals">
            <GoalCreatePage />
          </RequireRole>
        ),
      },
      { path: 'goals/:id', element: <GoalDetailPage /> },
      {
        path: 'goals/:id/edit',
        element: (
          <RequireRole allow={['PROJECT_MANAGER']} redirectTo="/goals">
            <GoalEditPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
