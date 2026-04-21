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
import { BacklogListPage } from '@/pages/BacklogListPage'
import { BacklogCreatePage } from '@/pages/BacklogCreatePage'
import { BacklogDetailPage } from '@/pages/BacklogDetailPage'
import { TasksListPage } from '@/pages/TasksListPage'
import { TaskCreatePage } from '@/pages/TaskCreatePage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ReportsPage } from '@/pages/ReportsPage'

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
      {
        path: 'backlogs',
        element: (
          <RequireRole allow={['PROJECT_MANAGER', 'BUSINESS_ANALYST']}>
            <BacklogListPage />
          </RequireRole>
        ),
      },
      {
        path: 'backlogs/new',
        element: (
          <RequireRole allow={['BUSINESS_ANALYST']} redirectTo="/backlogs">
            <BacklogCreatePage />
          </RequireRole>
        ),
      },
      {
        path: 'backlogs/:id',
        element: (
          <RequireRole allow={['PROJECT_MANAGER', 'BUSINESS_ANALYST']}>
            <BacklogDetailPage />
          </RequireRole>
        ),
      },
      { path: 'tasks', element: <TasksListPage /> },
      {
        path: 'tasks/new',
        element: (
          <RequireRole allow={['PROJECT_MANAGER']} redirectTo="/tasks">
            <TaskCreatePage />
          </RequireRole>
        ),
      },
      { path: 'tasks/:id', element: <TaskDetailPage /> },
      {
        path: 'analytics',
        element: (
          <RequireRole allow={['PROJECT_MANAGER']}>
            <AnalyticsPage />
          </RequireRole>
        ),
      },
      {
        path: 'reports',
        element: (
          <RequireRole allow={['PROJECT_MANAGER']}>
            <ReportsPage />
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
