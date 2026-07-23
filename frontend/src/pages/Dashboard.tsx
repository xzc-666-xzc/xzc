import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Typography, List, Tag, Space } from 'antd';
import {
  PlayCircleOutlined,
  StarOutlined,
  RiseOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// 模拟统计数据
const stats = {
  totalInterviews: 12,
  avgScore: 76,
  completedCount: 8,
  improvementRate: 15,
};

const recentInterviews = [
  { id: '1', position: 'Java后端开发-中级', date: '2026-07-22', score: 78, status: 'completed' },
  { id: '2', position: '产品经理-初级', date: '2026-07-20', score: 72, status: 'completed' },
  { id: '3', position: '前端开发-中级', date: '2026-07-18', score: 65, status: 'interrupted' },
];

const recommendedPositions = [
  { id: 'p1', name: 'Java后端开发', category: '技术岗', hot: true },
  { id: 'p2', name: '产品经理', category: '产品岗', hot: true },
  { id: 'p3', name: '前端开发', category: '技术岗', hot: false },
  { id: 'p4', name: '数据分析师', category: '数据岗', hot: false },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>工作台</Title>
        <Text type="secondary">欢迎回来，开启今天的模拟面试训练</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="已完成的面试"
              value={stats.totalInterviews}
              prefix={<FileTextOutlined />}
              suffix="次"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="平均得分"
              value={stats.avgScore}
              prefix={<StarOutlined />}
              suffix="分"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="完成率"
              value={Math.round((stats.completedCount / stats.totalInterviews) * 100)}
              prefix={<TrophyOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="进步幅度"
              value={stats.improvementRate}
              prefix={<RiseOutlined />}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速开始面试 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              准备好挑战了吗？
            </Text>
            <br />
            <Text type="secondary">选择岗位和难度，AI 面试官将为你量身定制面试体验</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => navigate('/setup')}
          >
            开始新面试
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 最近面试记录 */}
        <Col xs={24} md={14}>
          <Card
            title="最近面试记录"
            extra={
              <Button type="link" onClick={() => navigate('/history')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              dataSource={recentInterviews}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Space>
                      <Tag color={item.status === 'completed' ? 'green' : 'orange'}>
                        {item.status === 'completed' ? '已完成' : '未完成'}
                      </Tag>
                      <Button type="link" onClick={() => navigate(`/report/${item.id}`)}>
                        查看报告
                      </Button>
                    </Space>
                  }
                >
                  <List.Item.Meta
                    title={item.position}
                    description={`面试时间：${item.date} · 得分：${item.score}分`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 推荐岗位 */}
        <Col xs={24} md={10}>
          <Card title="热门面试岗位">
            <List
              dataSource={recommendedPositions}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => navigate('/setup')}
                    >
                      去面试
                    </Button>
                  }
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.name}
                        {item.hot && <Tag color="red">热门</Tag>}
                      </Space>
                    }
                    description={item.category}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
