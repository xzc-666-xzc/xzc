import { useState } from 'react';
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
} from 'antd';
import {
  BookOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
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

const mockWrongQuestions: WrongQuestion[] = [
  {
    id: 'w1', interviewId: '1',
    question: '谈谈你对微服务架构的理解，以及在实际项目中如何做服务拆分？',
    myAnswer: '微服务就是把一个大项目拆成小服务，每个服务有独立的数据库...',
    referenceAnswer: '微服务架构通过DDD界定限界上下文，按业务能力拆分。拆分策略包括：按业务域（交易/用户/商品）、按变更频率（稳定核心vs快速迭代）、按团队组织（康威定律）。需要配套服务发现、配置中心、API网关、链路追踪等基础设施。',
    score: 55, knowledgeTag: '系统设计-微服务', date: '2026-07-22', reviewed: false,
  },
  {
    id: 'w2', interviewId: '1',
    question: '如何保证分布式系统的一致性？介绍几种方案及优缺点。',
    myAnswer: '可以用分布式事务，比如两阶段提交...',
    referenceAnswer: '1. 两阶段提交(2PC)：强一致但性能差；2. TCC(Try-Confirm-Cancel)：最终一致，需业务实现补偿；3. Saga：长事务拆分为局部事务+补偿；4. 本地消息表+MQ：最终一致，高性能；5. Raft/Paxos：强一致，适合配置管理。',
    score: 48, knowledgeTag: '分布式系统-一致性', date: '2026-07-22', reviewed: false,
  },
  {
    id: 'w3', interviewId: '5',
    question: '分享一次你如何推动团队改变技术方案的真实案例。',
    myAnswer: '我们之前用了过时的框架，我建议大家升级，最终同意了。',
    referenceAnswer: '使用STAR法：S-老旧框架导致开发效率低下；T-在3个月内完成迁移不影响业务；A-调研3种方案，输出对比报告，先在非核心模块试点，用数据说服技术Leader；R-成功迁移，开发效率提升40%。',
    score: 42, knowledgeTag: '综合-沟通推动', date: '2026-07-10', reviewed: true,
  },
];

export default function WrongBook() {
  const navigate = useNavigate();
  const [questions] = useState<WrongQuestion[]>(mockWrongQuestions);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const filteredQuestions = selectedTag === 'all'
    ? questions
    : questions.filter((q) => q.knowledgeTag.includes(selectedTag));

  const tags = [...new Set(questions.map((q) => q.knowledgeTag.split('-')[0]))];

  const columns: ColumnsType<WrongQuestion> = [
    {
      title: '题目', dataIndex: 'question', key: 'question',
      render: (v: string) => <Text ellipsis style={{ maxWidth: 300 }}>{v}</Text>,
    },
    {
      title: '得分', dataIndex: 'score', key: 'score',
      render: (v: number) => (
        <Tag color={v < 50 ? 'red' : 'gold'}>{v}分</Tag>
      ),
    },
    {
      title: '知识标签', dataIndex: 'knowledgeTag', key: 'knowledgeTag',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
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
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: '错题详情',
                width: 700,
                content: (
                  <div>
                    <p><strong>题目：</strong>{r.question}</p>
                    <p><strong>你的回答：</strong><Text type="danger">{r.myAnswer}</Text></p>
                    <p><strong>参考答案：</strong>{r.referenceAnswer}</p>
                    <p><Tag color="blue">{r.knowledgeTag}</Tag> <Tag color="red">{r.score}分</Tag></p>
                  </div>
                ),
              });
            }}
          >
            详情
          </Button>
          <Button type="link" icon={<PlayCircleOutlined />} onClick={() => navigate('/setup')}>
            练习
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4}>
            <BookOutlined /> 错题本
          </Title>
          <Text type="secondary">答错或得分的题目自动收录，支持按标签筛选和针对性练习</Text>
        </div>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate('/setup')}>
          针对性练习
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text>筛选标签：</Text>
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={setSelectedTag}
              options={[
                { value: 'all', label: '全部' },
                ...tags.map((t) => ({ value: t, label: t })),
              ]}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredQuestions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无错题，继续保持！" /> }}
        />
      </Card>
    </div>
  );
}
