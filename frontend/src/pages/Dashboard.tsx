import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Typography, List, Tag, Space, Spin, Empty } from 'antd';
import {
  PlayCircleOutlined,
  StarOutlined,
  RiseOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { interviewService, positionService } from '@/services/api';

const { Title, Text } = Typography;

interface InterviewRecord {
  id: string;
  positionName: string;
  difficulty: string;
  mode: string;
  score: number | null;
  status: string;
  questionCount: number;
  startedAt: string;
}

interface PositionItem {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string;
  hot: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentInterviews, setRecentInterviews] = useState<InterviewRecord[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, posRes] = await Promise.all([
        interviewService.getHistory({ page: 1, pageSize: 5 }),
        positionService.list(),
      ]);
      const historyData = historyRes.data?.data as { records: InterviewRecord[] } | undefined;
      if (historyData?.records) {
        setRecentInterviews(historyData.records);
      }
      const posData = posRes.data?.data as PositionItem[] | undefined;
      if (posData) {
        setPositions(posData);
      }
    } catch {
      // 使用空数据展示
    } finally {
      setLoading(false);
    }
  };

  const totalInterviews = recentInterviews.length;
  const completedRecords = recentInterviews.filter((r) => r.status === 'completed' && r.score != null);
  const avgScore = completedRecords.length
    ? Math.round(completedRecords.reduce((s, r) => s + (r.score || 0), 0) / completedRecords.length)
    : 0;
  const completedCount = completedRecords.length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

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
            <Statistic title="面试总次数" value={totalInterviews}
              prefix={<FileTextOutlined />} suffix="次" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="平均得分" value={avgScore}
              prefix={<StarOutlined />} suffix="分"
              valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="完成率"
              value={totalInterviews > 0 ? Math.round((completedCount / totalInterviews) * 100) : 0}
              prefix={<TrophyOutlined />} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic title="最高得分"
              value={completedRecords.length > 0 ? Math.max(...completedRecords.map((r) => r.score || 0)) : 0}
              prefix={<RiseOutlined />} suffix="分"
              valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* 快速开始面试 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>准备好挑战了吗？</Text>
            <br />
            <Text type="secondary">选择岗位和难度，AI 面试官将为你量身定制面试体验</Text>
          </div>
          <Button type="primary" size="large" icon={<PlayCircleOutlined />}
            onClick={() => navigate('/setup')}>
            开始新面试
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 最近面试记录 */}
        <Col xs={24} md={14}>
          <Card title="最近面试记录"
            extra={
              <Button type="link" onClick={() => navigate('/history')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }>
            {recentInterviews.length === 0 ? (
              <Empty description="暂无面试记录" />
            ) : (
              <List
                dataSource={recentInterviews}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Space>
                        <Tag color={item.status === 'completed' ? 'green' : 'orange'}>
                          {item.status === 'completed' ? '已完成' : item.status === 'interrupted' ? '未完成' : item.status}
                        </Tag>
                        {item.status === 'completed' && (
                          <Button type="link" onClick={() => navigate(`/report/${item.id}`)}>查看报告</Button>
                        )}
                        {(item.status === 'interrupted' || item.status === 'in_progress') && (
                          <Button type="link" onClick={() => navigate(`/interview/${item.id}`)}>继续面试</Button>
                        )}
                      </Space>
                    }
                  >
                    <List.Item.Meta
                      title={item.positionName}
                      description={`面试时间：${item.startedAt?.slice(0, 10) || '-'} · 得分：${item.score ?? '-'}分`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* 热门岗位 */}
        <Col xs={24} md={10}>
          <Card title="热门面试岗位">
            {positions.length === 0 ? (
              <Empty description="暂无岗位数据" />
            ) : (
              <List
                dataSource={positions.slice(0, 6)}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Button type="primary" size="small" onClick={() => navigate('/setup')}>去面试</Button>
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
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
