import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Select,
  Empty,
  Modal,
  message,
  Spin,
} from 'antd';
import {
  BookOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { wrongBookService } from '@/services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface WrongQuestion {
  id: string;
  interviewId: string;
  question: string;
  myAnswer: string;
  referenceAnswer: string;
  score: number;
  knowledgeTag: string;
  date: string;
  reviewed: boolean;
}

export default function WrongBook() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    loadWrongBook();
  }, []);

  const loadWrongBook = async () => {
    setLoading(true);
    try {
      const res = await wrongBookService.list({ page: 1, pageSize: 50 });
      const data = res.data?.data as { records: WrongQuestion[]; total: number } | undefined;
      if (data?.records) {
        setQuestions(data.records);
      }
    } catch {
      message.error('加载错题本失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string) => {
    try {
      await wrongBookService.review(id);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, reviewed: true } : q)),
      );
      message.success('已标记为已复习');
    } catch {
      message.error('操作失败');
    }
  };

  const tags = [...new Set(questions.filter((q) => q.knowledgeTag).map((q) => q.knowledgeTag?.split('-')[0]))].filter(Boolean);
  const filteredQuestions = selectedTag === 'all'
    ? questions
    : questions.filter((q) => q.knowledgeTag?.includes(selectedTag));

  const columns: ColumnsType<WrongQuestion> = [
    {
      title: '题目', dataIndex: 'question', key: 'question',
      render: (v: string) => <Text ellipsis style={{ maxWidth: 300 }}>{v}</Text>,
    },
    {
      title: '得分', dataIndex: 'score', key: 'score',
      render: (v: number) => <Tag color={v < 50 ? 'red' : 'gold'}>{v}分</Tag>,
    },
    {
      title: '知识标签', dataIndex: 'knowledgeTag', key: 'knowledgeTag',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-',
    },
    { title: '日期', dataIndex: 'date', key: 'date' },
    {
      title: '状态', dataIndex: 'reviewed', key: 'reviewed',
      render: (v: boolean) => (
        v ? <Tag color="green" icon={<CheckCircleOutlined />}>已复习</Tag> : <Tag color="orange">待复习</Tag>
      ),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: WrongQuestion) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: '错题详情',
                width: 700,
                content: (
                  <div>
                    <p><strong>题目：</strong>{r.question}</p>
                    <p><strong>你的回答：</strong><Text type="danger">{r.myAnswer}</Text></p>
                    <p><strong>参考答案：</strong>{r.referenceAnswer}</p>
                    <p><Tag color="blue">{r.knowledgeTag || '综合'}</Tag> <Tag color="red">{r.score}分</Tag></p>
                  </div>
                ),
              });
            }}
          >详情</Button>
          {!r.reviewed && (
            <Button type="link" icon={<CheckCircleOutlined />}
              onClick={() => handleReview(r.id)}>标记已复习</Button>
          )}
          <Button type="link" icon={<PlayCircleOutlined />}
            onClick={() => navigate('/setup')}>练习</Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载错题本..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4}><BookOutlined /> 错题本</Title>
          <Text type="secondary">得分低于60分的题目自动收录，支持按标签筛选和针对性练习</Text>
        </div>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate('/setup')}>
          针对性练习
        </Button>
      </div>

      <Card>
        {tags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Text>筛选标签：</Text>
              <Select defaultValue="all" style={{ width: 200 }} onChange={setSelectedTag}
                options={[{ value: 'all', label: '全部' }, ...tags.map((t) => ({ value: t, label: t }))]} />
            </Space>
          </div>
        )}

        <Table columns={columns} dataSource={filteredQuestions} rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无错题，继续保持！" /> }} />
      </Card>
    </div>
  );
}
