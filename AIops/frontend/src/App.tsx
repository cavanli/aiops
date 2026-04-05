import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React, { Suspense } from 'react'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useAuthStore } from './store/authStore'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Hosts from './pages/Hosts'
import Models from './pages/Models'
import Workflows from './pages/Workflows'
import Deployments from './pages/Deployments'

const WorkflowEditor = React.lazy(() => import('./pages/WorkflowEditor'))

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563EB',
          borderRadius: 8,
          colorBgLayout: '#F8FAFC',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Full-screen workflow editor — outside AppLayout */}
          <Route
            path="/workflows/:id/edit"
            element={
              <AuthGuard>
                <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }} />}>
                  <WorkflowEditor />
                </Suspense>
              </AuthGuard>
            }
          />

          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="hosts" element={<Hosts />} />
            <Route path="models" element={<Models />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="deployments" element={<Deployments />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
