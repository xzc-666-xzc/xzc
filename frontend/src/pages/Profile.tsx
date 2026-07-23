import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Avatar,
  Divider,
  message,
  Tabs,
  Space,
  Switch,
  Select,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  LockOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/stores';
import { userService } from '@/services/api';

const { Title, Text } = Typography;

export default function Profile() {
  const { user, updateUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSaveProfile = async (values: unknown) => {
    setLoading(true);
    try {
      await userService.updateProfile(values);
      updateUser(values as never);
      message.success('保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: '基本资料',
      children: (
        <Card>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Avatar size={80} icon={<UserOutlined />} />
            <Title level={5} style={{ marginTop: 12 }}>
              {user?.username || '用户'}
            </Title>
            <Text type="secondary">{user?.email || '未设置邮箱'}</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              username: user?.username,
              email: user?.email,
            }}
            onFinish={handleSaveProfile}
          >
            <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
              <Input prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input prefix={<PhoneOutlined />} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<SaveOutlined />} loading={loading} htmlType="submit">
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <LockOutlined /> 安全设置
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item name="confirmPassword" label="确认新密码" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={() => message.success('密码修改成功')}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'preferences',
      label: (
        <span>
          <SettingOutlined /> 偏好设置
        </span>
      ),
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="AI 面试风格">
              <Select
                defaultValue="friendly"
                options={[
                  { value: 'strict', label: '严格模式 - 连续追问，不留情面' },
                  { value: 'friendly', label: '友好模式 - 温和引导，循序渐进' },
                  { value: 'balanced', label: '平衡模式 - 适中难度，张弛有度' },
                ]}
              />
            </Form.Item>
            <Form.Item label="语音播报速度">
              <Select
                defaultValue="normal"
                options={[
                  { value: 'slow', label: '慢速' },
                  { value: 'normal', label: '正常' },
                  { value: 'fast', label: '快速' },
                ]}
              />
            </Form.Item>
            <Divider />
            <Form.Item label="面试提醒通知">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="报告生成通知">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="每周学习报告">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={() => message.success('偏好设置已保存')}>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Title level={4}>个人中心</Title>
      <Tabs items={tabItems} />
    </div>
  );
}
