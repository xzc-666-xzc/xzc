import { useState } from 'react';
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
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  RiseOutlined,
  FileTextOutlined,
  StarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface InterviewRecord {
  id: string;
  position: string;
  difficulty: string;
  mode: string;
  score: number;
  status: 'completed' | 'interrupted' | 'pending';
  questionCount: number;
  date: string;
  duration: number;
}

const mockRecords: InterviewRecord[] = [
  { id: '1', position: 'Java后端开发-中级', difficulty: '中级', mode: '文字', score: 78, status: 'completed', questionCount: 8, date: '2026-07-22', duration: 28 },
  { id: '2', position: '产品经理-初级', difficulty: '初级', mode: '文字', score: 72, status: 'completed', questionCount: 6, date: '2026-07-20', duration: 22 },
  { id: '3', position: '前端开发-中级', difficulty: '中级', mode: '语音', score: 65, status: 'interrupted', questionCount: 4, date: '2026-07-18', duration: 15 },
  { id: '4', position: 'Java后端开发-中级', difficulty: '中级', mode: '文字', score: 70, status: 'completed', questionCount: 8, date: '2026-07-15', duration: 30 },
  { id: '5', position: 'HR-通用面试', difficulty: '初级', mode: '文字', score: 82, status: 'completed', questionCount: 6, date: '2026-07-10', duration: 20 },
  { id: '6', position: 'Java后端开发-高级', difficulty: '高级', mode: '文字', score: 58, status: 'completed', questionCount: 10, date: '2026-07-05', duration: 35 },
];

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [records] = useState<InterviewRecord[]>(mockRecords);

  const columns: ColumnsType<InterviewRecord> = [
    { title: '岗位', dataIndex: 'position', key: 'position' },
    {
      title: '难度', dataIndex: 'difficulty', key: 'difficulty',
      render: (v: string) => {
        const colors: Record<string, string> = { '初级': 'green', '中级': 'blue', '高级': 'purple', '专家级': 'red' };
        return <Tag color={colors[v] || 'default'}>{v}</Tag>;
      },
    },
    { title: '模式', dataIndex: 'mode', key: 'mode' },
    {
      title: '得分', dataIndex: 'score', key: 'score',
      render: (v: number, r: InterviewRecord) => (
        <span style={{ color: v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>
          {r.status === 'interrupted' ? '-' : v}
        </span>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => (
        <Tag color={v === 'completed' ? 'green' : v === 'interrupted' ? 'orange' : 'default'}>
          {v === 'completed' ? '已完成' : v === 'interrupted' ? '未完成' : '待开始'}
        </Tag>
      ),
    },
    { title: '题目数', dataIndex: 'questionCount', key: 'questionCount' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '用时(分钟)', dataIndex: 'duration', key: 'duration' },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: InterviewRecord) => (
        <Space>
          {r.status === 'completed' ? (
            <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/report/${r.id}`)}>
              查看报告
            </Button>
          ) : r.status === 'interrupted' ? (
            <Button type="link" icon={<ReloadOutlined />} onClick={() => navigate(`/interview/${r.id}`)}>
              继续面试
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  // 成绩趋势图
  const trendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: mockRecords.filter((r) => r.status === 'completed').reverse().map((r) => r.date),
    },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [
      {
        name: '面试得分',
        type: 'line',
        data: mockRecords.filter((r) => r.status === 'completed').reverse().map((r) => r.score),
        smooth: true,
        lineStyle: { color: '#1677ff' },
        areaStyle: { color: 'rgba(22,119,255,0.1)' },
      },
    ],
  };

  const completedRecords = records.filter((r) => r.status === 'completed');
  const avgScore = completedRecords.length
    ? Math.round(completedRecords.reduce((s, r) => s + r.score, 0) / completedRecords.length)
    : 0;

  return (
    <div className="page-container">
      <Title level={4}>面试历史</Title>

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
            <Statistic title="完成率" value={Math.round((completedRecords.length / records.length) * 100)} prefix={<RiseOutlined />} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="最高得分" value={Math.max(...records.map((r) => r.score))} prefix={<StarOutlined />} suffix="分" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* 成长曲线 */}
      <Card title="成绩趋势" style={{ marginBottom: 24 }}>
        {completedRecords.length >= 2 ? (
          <ReactECharts option={trendOption} style={{ height: 300 }} />
        ) : (
          <Empty description="至少完成2次面试后显示趋势图" />
        )}
      </Card>

      {/* 历史列表 */}
      <Card title="面试记录">
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
