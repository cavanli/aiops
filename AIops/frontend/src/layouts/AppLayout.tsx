import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Input, Badge } from 'antd';
import {
  DashboardOutlined,
  ApiOutlined,
  ApartmentOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  RobotOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  BellOutlined,
  DownOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useClusterStore, CLUSTER_LABELS, type ClusterEnv } from '../store/clusterStore';
import client from '../api/client';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '控制面板' },
  { key: '/models', icon: <ApiOutlined />, label: '模型广场' },
  { key: '/assets', icon: <CloudUploadOutlined />, label: '资产管理' },
  { key: '/skills', icon: <ToolOutlined />, label: '技能库' },
  { key: '/mcp', icon: <ThunderboltOutlined />, label: 'MCP 中心' },
  { key: '/workflows', icon: <ApartmentOutlined />, label: '工作流' },
  { key: '/agents', icon: <RobotOutlined />, label: '智能体 (Agent)' },
  { key: '/rag', icon: <FileTextOutlined />, label: 'RAG 引擎' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

const SIDEBAR_BG = '#1a1f2e';
const SIDEBAR_ACTIVE_BG = '#6366F1';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { env, setEnv } = useClusterStore();

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

  const clusterMenu = {
    items: [
      { key: 'prod', label: '生产集群' },
      { key: 'staging', label: '预发集群' },
      { key: 'dev', label: '开发集群' },
    ],
    onClick: ({ key }: { key: string }) => setEnv(key as ClusterEnv),
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: SIDEBAR_BG }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0 20px' : '0 20px',
            gap: 10,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DashboardOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          {!collapsed && (
            <Text strong style={{ color: '#fff', fontSize: 15, whiteSpace: 'nowrap' }}>
              AIOps部署平台
            </Text>
          )}
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', border: 'none' }}
            theme="dark"
          />
        </div>

        {/* User info at bottom */}
        {!collapsed && (
          <Dropdown menu={userMenu} placement="topLeft">
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <Avatar
                size={36}
                icon={<UserOutlined />}
                style={{ background: '#374151', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                  {user?.username ?? '管理员用户'}
                </div>
                <div style={{ color: '#94A3B8', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email ?? 'admin@aiops.local'}
                </div>
              </div>
            </div>
          </Dropdown>
        )}
        </div>
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
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', fontSize: 16, color: '#64748B', flexShrink: 0 }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Input
              placeholder="搜索资源、技能、日志..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              style={{
                maxWidth: 420,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
              }}
              variant="borderless"
            />
          </div>

          <Space size={16}>
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 18, color: '#64748B', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={clusterMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer', color: '#1E293B', fontWeight: 500 }}>
                {CLUSTER_LABELS[env]}
                <DownOutlined style={{ fontSize: 12 }} />
              </Space>
            </Dropdown>
          </Space>
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
