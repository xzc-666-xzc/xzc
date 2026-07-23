import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  RiseOutlined,
  FileTextOutlined,
  StarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { interviewService } from '@/services/api';
import type { ColumnsType } from 'antd/es/table';

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
  completedAt: string | null;
}

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getHistory({ page: 1, pageSize: 50 });
      const data = res.data?.data as { records: InterviewRecord[]; total: number } | undefined;
      if (data?.records) {
        setRecords(data.records);
      }
    } catch {
      message.error('加载面试历史失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<InterviewRecord> = [
    { title: '岗位', dataIndex: 'positionName', key: 'positionName' },
    {
      title: '难度', dataIndex: 'difficulty', key: 'difficulty',
      render: (v: string) => {
        const colors: Record<string, string> = { 'junior': 'green', 'middle': 'blue', 'senior': 'purple', 'expert': 'red' };
        const labels: Record<string, string> = { 'junior': '初级', 'middle': '中级', 'senior': '高级', 'expert': '专家' };
        return <Tag color={colors[v] || 'default'}>{labels[v] || v}</Tag>;
      },
    },
    { title: '模式', dataIndex: 'mode', key: 'mode',
      render: (v: string) => v === 'text' ? '文字' : v === 'voice' ? '语音' : v },
    {
      title: '得分', dataIndex: 'score', key: 'score',
      render: (v: number | null, r: InterviewRecord) => (
        <span style={{ color: (v ?? 0) >= 80 ? '#52c41a' : (v ?? 0) >= 60 ? '#faad14' : v != null ? '#ff4d4f' : '#999', fontWeight: 600 }}>
          {r.status === 'completed' && v != null ? v : r.status === 'completed' ? '-' : '-'}
        </span>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => (
        <Tag color={v === 'completed' ? 'green' : v === 'interrupted' ? 'orange' : v === 'in_progress' ? 'blue' : 'default'}>
          {v === 'completed' ? '已完成' : v === 'interrupted' ? '未完成' : v === 'in_progress' ? '进行中' : v}
        </Tag>
      ),
    },
    { title: '题目数', dataIndex: 'questionCount', key: 'questionCount' },
    {
      title: '日期', dataIndex: 'startedAt', key: 'startedAt',
      render: (v: string) => v ? v.slice(0, 10) : '-',
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: InterviewRecord) => (
        <Space>
          {r.status === 'completed' ? (
            <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/report/${r.id}`)}>
              查看报告
            </Button>
          ) : r.status === 'interrupted' || r.status === 'in_progress' ? (
            <Button type="link" icon={<ReloadOutlined />} onClick={() => navigate(`/interview/${r.id}`)}>
              继续面试
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const completedRecords = records.filter((r) => r.status === 'completed' && r.score != null);
  const avgScore = completedRecords.length
    ? Math.round(completedRecords.reduce((s, r) => s + (r.score || 0), 0) / completedRecords.length)
    : 0;

  const trendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: completedRecords.slice().reverse().map((r) => r.startedAt?.slice(0, 10) || ''),
    },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [
      {
        name: '面试得分',
        type: 'line',
        data: completedRecords.slice().reverse().map((r) => r.score ?? 0),
        smooth: true,
        lineStyle: { color: '#1677ff' },
        areaStyle: { color: 'rgba(22,119,255,0.1)' },
      },
    ],
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载面试历史..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>面试历史</Title>
        <Button onClick={loadHistory}>刷新</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总面试次数" value={records.length} prefix={<FileTextOutlined />} suffix="次" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="平均得分" value={avgScore} prefix={<StarOutlined />} suffix="分" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="完成率" value={records.length > 0 ? Math.round((completedRecords.length / records.length) * 100) : 0}
              prefix={<RiseOutlined />} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="最高得分" value={completedRecords.length > 0 ? Math.max(...completedRecords.map((r) => r.score || 0)) : 0}
              prefix={<StarOutlined />} suffix="分" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card title="成绩趋势" style={{ marginBottom: 24 }}>
        {completedRecords.length >= 2 ? (
          <ReactECharts option={trendOption} style={{ height: 300 }} />
        ) : (
          <Empty description="至少完成2次面试后显示趋势图" />
        )}
      </Card>

      <Card title="面试记录">
        <Table columns={columns} dataSource={records} rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无面试记录，去开始第一次面试吧！" /> }} />
      </Card>
    </div>
  );
}
