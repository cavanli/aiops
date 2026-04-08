import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, LoginResponse, ApiResponse } from '@/types/auth';

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
      // Give zustand-persist one tick to flush to localStorage before
      // React Query fires protected requests on the dashboard mount.
      await new Promise((r) => setTimeout(r, 0));
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('邮箱或密码错误');
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
            项目交付AIOPS
          </Title>
        </div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
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
