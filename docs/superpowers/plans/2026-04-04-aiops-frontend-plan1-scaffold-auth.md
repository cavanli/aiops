# AIOps Frontend Plan F1: Scaffold + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the AIOps React frontend with Vite + Ant Design, establish the routing/layout shell, implement login/logout with JWT token management, and wire up the Axios API client pointing at the Go backend.

**Architecture:** Single-page app in `AIops/frontend/`. Vite for build, React Router v6 for routing, Zustand for auth state, Axios with request/response interceptors for API calls and automatic token refresh. Layout uses Ant Design's `Layout` (sider + header + content). All pages beyond login are protected by an auth guard component.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Ant Design 5, React Router v6, Zustand, Axios, @ant-design/icons

---

## File Map

```
AIops/frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── .env.development          # VITE_API_BASE_URL=http://localhost:8080
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Router root with auth guard
│   ├── api/
│   │   └── client.ts         # Axios instance + interceptors + token refresh
│   ├── store/
│   │   └── authStore.ts      # Zustand store: token, user, login/logout actions
│   ├── types/
│   │   └── auth.ts           # LoginRequest, LoginResponse, User types
│   ├── pages/
│   │   └── Login.tsx         # Login form page
│   └── layouts/
│       └── AppLayout.tsx     # Sider + Header + Outlet shell
```

---

## Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `AIops/frontend/` (new directory, via npm create)

- [ ] **Step 1: Create Vite project**

```bash
cd e:/Opsgit/AIops
npm create vite@latest frontend -- --template react-ts
```

Expected output: `Scaffolding project in .../frontend/...  Done.`

- [ ] **Step 2: Install dependencies**

```bash
cd e:/Opsgit/AIops/frontend
npm install
npm install antd @ant-design/icons react-router-dom zustand axios
```

Expected: All packages install without errors.

- [ ] **Step 3: Verify dev server starts**

```bash
cd e:/Opsgit/AIops/frontend
npm run dev -- --port 3000
```

Expected: `VITE v5.x.x  ready in Xms` and `Local: http://localhost:3000/`

Stop with Ctrl+C after confirming.

- [ ] **Step 4: Create .env.development**

Create file `e:/Opsgit/AIops/frontend/.env.development` with content:

```
VITE_API_BASE_URL=http://localhost:8080
```

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/
git commit -m "feat: scaffold Vite React TypeScript frontend"
```

---

## Task 2: Auth types + Zustand store + Axios client

**Files:**
- Create: `AIops/frontend/src/types/auth.ts`
- Create: `AIops/frontend/src/store/authStore.ts`
- Create: `AIops/frontend/src/api/client.ts`

- [ ] **Step 1: Create auth types**

Create `e:/Opsgit/AIops/frontend/src/types/auth.ts`:

```typescript
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

- [ ] **Step 2: Create Zustand auth store**

Create `e:/Opsgit/AIops/frontend/src/store/authStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
      isAuthenticated: () => get().token !== null,
    }),
    {
      name: 'aiops-auth',
    }
  )
);
```

- [ ] **Step 3: Create Axios client with interceptors**

Create `e:/Opsgit/AIops/frontend/src/api/client.ts`:

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  failedQueue = [];
}

// Auto-refresh on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setAuth, clearAuth, user } =
        useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        );
        const { token: newToken, refresh_token: newRefresh } = res.data.data;
        setAuth(newToken, newRefresh, user!);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
```

- [ ] **Step 4: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/
git commit -m "feat: add auth types, Zustand store, and Axios client with token refresh"
```

---

## Task 3: Login page

**Files:**
- Create: `AIops/frontend/src/pages/Login.tsx`

- [ ] **Step 1: Create Login page**

Create `e:/Opsgit/AIops/frontend/src/pages/Login.tsx`:

```tsx
import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, LoginResponse, ApiResponse } from '../types/auth';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const res = await client.post<ApiResponse<LoginResponse>>(
        '/api/v1/auth/login',
        values
      );
      const { token, refresh_token, user } = res.data.data;
      setAuth(token, refresh_token, user);
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card style={{ width: 400, borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: '#2563EB', margin: 0 }}>
            AIOps 部署中台
          </Title>
        </div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ background: '#2563EB' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/pages/Login.tsx
git commit -m "feat: add Login page with Ant Design form"
```

---

## Task 4: App layout shell (sider + header + outlet)

**Files:**
- Create: `AIops/frontend/src/layouts/AppLayout.tsx`

- [ ] **Step 1: Create AppLayout**

Create `e:/Opsgit/AIops/frontend/src/layouts/AppLayout.tsx`:

```tsx
import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  CloudServerOutlined,
  ApiOutlined,
  ApartmentOutlined,
  RocketOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  { key: '/hosts', icon: <CloudServerOutlined />, label: '主机管理' },
  { key: '/models', icon: <ApiOutlined />, label: '模型广场' },
  { key: '/workflows', icon: <ApartmentOutlined />, label: '工作流' },
  { key: '/deployments', icon: <RocketOutlined />, label: '部署执行' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await client.post('/api/v1/auth/logout');
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: '#fff', borderRight: '1px solid #E2E8F0' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {!collapsed && (
            <Text strong style={{ color: '#2563EB', fontSize: 16 }}>
              AIOps
            </Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            height: 64,
          }}
        >
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', fontSize: 18, color: '#1E293B' }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ background: '#2563EB' }}
              />
              <Text>{user?.username}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/layouts/AppLayout.tsx
git commit -m "feat: add AppLayout with collapsible sider and user dropdown"
```

---

## Task 5: App router + auth guard + placeholder pages + build verify

**Files:**
- Modify: `AIops/frontend/src/App.tsx`
- Modify: `AIops/frontend/src/main.tsx`
- Create: `AIops/frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create Dashboard placeholder**

Create `e:/Opsgit/AIops/frontend/src/pages/Dashboard.tsx`:

```tsx
import { Typography } from 'antd';

const { Title, Text } = Typography;

export default function Dashboard() {
  return (
    <div>
      <Title level={4}>概览</Title>
      <Text type="secondary">欢迎使用 AIOps 部署中台</Text>
    </div>
  );
}
```

- [ ] **Step 2: Replace App.tsx with router + auth guard**

Read current `e:/Opsgit/AIops/frontend/src/App.tsx`, then replace with:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './store/authStore';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
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
          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="hosts" element={<Dashboard />} />
            <Route path="models" element={<Dashboard />} />
            <Route path="workflows" element={<Dashboard />} />
            <Route path="deployments" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
```

- [ ] **Step 3: Update main.tsx**

Read current `e:/Opsgit/AIops/frontend/src/main.tsx`, then replace with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Verify build**

```bash
cd e:/Opsgit/AIops/frontend
npm run build
```

Expected: `✓ built in Xs` with no TypeScript errors. Output in `dist/`.

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/
git commit -m "feat: add router with auth guard, Dashboard placeholder, and Ant Design theme"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Vite + React + TypeScript scaffold ✓
- [x] Ant Design 5 with primary color #2563EB ✓
- [x] Left sider (collapsible) + top header layout ✓
- [x] Login page with form validation ✓
- [x] JWT token stored in localStorage via Zustand persist ✓
- [x] Automatic token refresh on 401 ✓
- [x] Logout clears auth state and redirects to /login ✓
- [x] Auth guard redirects unauthenticated users to /login ✓
- [x] Chinese locale (zh_CN) ✓
- [x] Navigation: 概览, 主机管理, 模型广场, 工作流, 部署执行 ✓

**No Placeholders:** All code complete.

**Type Consistency:**
- `ApiResponse<T>` used in Login.tsx matches definition in auth.ts
- `useAuthStore` interface used consistently across Login.tsx, AppLayout.tsx, App.tsx, client.ts
- `User` type matches backend response shape (id, username, email, role)

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-04-aiops-frontend-plan1-scaffold-auth.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
