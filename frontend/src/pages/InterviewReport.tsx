import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  List,
  Collapse,
  Space,
  Divider,
  Progress,
  Empty,
  Spin,
  message,
  Alert,
  Tabs,
} from 'antd';
import {
  TrophyOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  BulbOutlined,
  WarningOutlined,
  PlaySquareOutlined,
  BookOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { InterviewReport } from '@/types';

const { Title, Text, Paragraph } = Typography;

// 模拟报告数据
const mockReport: InterviewReport = {
  interviewId: '1',
  totalScore: 76,
  scores: {
    content: 78,
    logic: 72,
    depth: 70,
    star: 80,
    expression: 80,
  },
  radarData: [
    { dimension: '内容准确性', score: 78, fullMark: 100 },
    { dimension: '逻辑条理性', score: 72, fullMark: 100 },
    { dimension: '专业深度', score: 70, fullMark: 100 },
    { dimension: 'STAR 法则', score: 80, fullMark: 100 },
    { dimension: '表达沟通', score: 80, fullMark: 100 },
  ],
  questionDetails: [
    {
      question: '请做一个简单的自我介绍，重点说说你在相关领域的项目经验和技术栈。',
      answer: '我做了3年Java开发，参与过电商平台的订单系统和支付系统的开发...',
      evaluation: {
        answerId: 'a1',
        contentScore: 80,
        logicScore: 75,
        depthScore: 72,
        starScore: 82,
        expressionScore: 78,
        overallScore: 77,
        strengths: ['项目经验描述清晰', '技术栈覆盖面广'],
        weaknesses: ['缺乏量化的业绩数据', 'STAR结构可更完整'],
        suggestions: ['使用"我主导了XX系统,日处理X万订单,性能提升X%"的量化表述'],
        referenceAnswer: '我过去3年负责电商平台核心交易链路，主导了订单系统重构，将接口响应时间从200ms降到50ms，日订单处理量从1万提升到10万...',
      },
    },
    {
      question: '请详细介绍你最近参与的一个项目，你在其中承担什么角色?',
      answer: '我参与了公司数据中台项目，主要负责数据采集模块的设计开发...',
      evaluation: {
        answerId: 'a2',
        contentScore: 75,
        logicScore: 68,
        depthScore: 65,
        starScore: 78,
        expressionScore: 82,
        overallScore: 74,
        strengths: ['角色定位明确', '沟通表达流畅'],
        weaknesses: ['缺少架构层面的思考', '未提及项目难点和解决方案'],
        suggestions: ['补充项目架构图思路', '准备2-3个解决过的技术难点'],
        referenceAnswer: '我主导了数据中台采集层的架构设计，采用Flink+Kafka解决异构数据源实时接入，峰值处理能力达到10万QPS...',
      },
    },
  ],
  overallSummary: '整体表现良好，在自我介绍和表达沟通方面做得不错。主要提升空间在于：回答深度不足，需要更多展示架构思维和量化结果。建议针对弱点进行专项练习。',
  strengths: ['表达能力强', '项目经验丰富', '积极的态度'],
  weaknesses: ['缺乏量化数据支撑', '部分回答深度不够', '逻辑结构待优化'],
  improvementPlan: '1. 学习STAR法则并在每次回答中刻意运用\n2. 准备3个核心项目的量化数据\n3. 加强系统设计题目练习\n4. 每周进行1-2次模拟面试',
  createdAt: '2026-07-22T10:30:00Z',
};

export default function InterviewReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载报告
    setTimeout(() => {
      setReport(mockReport);
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="正在生成面试报告..." />
      </div>
    );
  }

  if (!report) {
    return <Empty description="未找到面试报告" />;
  }

  const radarOption = {
    tooltip: {},
    radar: {
      indicator: report.radarData.map((r) => ({
        name: r.dimension,
        max: r.fullMark,
      })),
      center: ['50%', '50%'],
      radius: '75%',
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: report.radarData.map((r) => r.score),
            name: '你的得分',
            areaStyle: { color: 'rgba(22, 119, 255, 0.2)' },
            lineStyle: { color: '#1677ff', width: 2 },
            itemStyle: { color: '#1677ff' },
          },
        ],
      },
    ],
  };

  const scoreColor = report.totalScore >= 80 ? '#52c41a' : report.totalScore >= 60 ? '#faad14' : '#ff4d4f';

  return (
    <div className="page-container">
      {/* 顶部导航 */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/history')}>
            返回历史
          </Button>
        </Space>
      </div>

      {/* 总分卡片 */}
      <Card style={{ marginBottom: 24, textAlign: 'center' }}>
        <TrophyOutlined style={{ fontSize: 48, color: scoreColor, marginBottom: 12 }} />
        <Title level={2}>
          综合得分：<span style={{ color: scoreColor }}>{report.totalScore}</span> / 100
        </Title>
        <Text type="secondary">面试时间：{report.createdAt} · Java后端开发-中级</Text>
      </Card>

      {/* 五维评分 + 雷达图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="各维度得分">
            <Row gutter={[0, 16]}>
              {[
                { label: '内容准确性', key: 'content', value: report.scores.content },
                { label: '逻辑条理性', key: 'logic', value: report.scores.logic },
                { label: '专业深度', key: 'depth', value: report.scores.depth },
                { label: 'STAR 法则运用', key: 'star', value: report.scores.star },
                { label: '表达沟通能力', key: 'expression', value: report.scores.expression },
              ].map((item) => (
                <Col span={24} key={item.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ width: 120 }}>{item.label}</Text>
                    <Progress
                      percent={item.value}
                      size="small"
                      style={{ flex: 1, margin: 0 }}
                      strokeColor={item.value >= 80 ? '#52c41a' : item.value >= 60 ? '#faad14' : '#ff4d4f'}
                    />
                    <Text strong>{item.value}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="能力雷达图">
            <ReactECharts option={radarOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      {/* 总体评价 */}
      <Card title="总体评价" style={{ marginBottom: 24 }}>
        <Alert
          message="AI 综合评语"
          description={report.overallSummary}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Title level={5}>
              <TrophyOutlined style={{ color: '#52c41a' }} /> 优点
            </Title>
            <List
              size="small"
              dataSource={report.strengths}
              renderItem={(item) => (
                <List.Item>
                  <Tag color="green">{item}</Tag>
                </List.Item>
              )}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Title level={5}>
              <WarningOutlined style={{ color: '#faad14' }} /> 待改善
            </Title>
            <List
              size="small"
              dataSource={report.weaknesses}
              renderItem={(item) => (
                <List.Item>
                  <Tag color="orange">{item}</Tag>
                </List.Item>
              )}
            />
          </Col>
        </Row>
        <Divider />
        <Title level={5}>
          <BulbOutlined style={{ color: '#1677ff' }} /> 改进计划
        </Title>
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{report.improvementPlan}</Paragraph>
      </Card>

      {/* 逐题分析 + 回放 */}
      <Card title="逐题分析 & 回放" style={{ marginBottom: 24 }}>
        <Tabs
          items={report.questionDetails.map((detail, idx) => ({
            key: String(idx),
            label: `第${idx + 1}题`,
            children: (
              <div>
                <Card size="small" title="题目" style={{ marginBottom: 12 }}>
                  <Text>{detail.question}</Text>
                </Card>
                <Card size="small" title="你的回答" style={{ marginBottom: 12 }}>
                  <Text>{detail.answer}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Button
                      size="small"
                      icon={<PlaySquareOutlined />}
                      onClick={() => message.info('回放功能开发中，敬请期待！')}
                    >
                      回放本题
                    </Button>
                  </div>
                </Card>
                <Row gutter={[8, 8]}>
                  {[
                    { label: '内容', score: detail.evaluation.contentScore },
                    { label: '逻辑', score: detail.evaluation.logicScore },
                    { label: '深度', score: detail.evaluation.depthScore },
                    { label: 'STAR', score: detail.evaluation.starScore },
                    { label: '表达', score: detail.evaluation.expressionScore },
                  ].map((s) => (
                    <Col key={s.label}>
                      <Tag color={s.score >= 80 ? 'green' : s.score >= 60 ? 'gold' : 'red'}>
                        {s.label}: {s.score}
                      </Tag>
                    </Col>
                  ))}
                </Row>
                <div style={{ marginTop: 12 }}>
                  <Text strong style={{ color: '#52c41a' }}>✅ 优点：</Text>
                  <ul>
                    {detail.evaluation.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <Text strong style={{ color: '#faad14' }}>⚠️ 不足：</Text>
                  <ul>
                    {detail.evaluation.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                  <Text strong style={{ color: '#1677ff' }}>💡 建议：</Text>
                  <ul>
                    {detail.evaluation.suggestions.map((sg, i) => (
                      <li key={i}>{sg}</li>
                    ))}
                  </ul>
                </div>
                <Collapse
                  style={{ marginTop: 12 }}
                  items={[
                    {
                      key: 'ref',
                      label: '📖 查看高分参考答案',
                      children: <Text>{detail.evaluation.referenceAnswer}</Text>,
                    },
                  ]}
                />
              </div>
            ),
          }))}
        />
      </Card>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => navigate('/setup')} size="large">
            再来一次面试
          </Button>
          <Button icon={<BookOutlined />} onClick={() => navigate('/wrong-book')} size="large">
            查看错题本
          </Button>
        </Space>
      </div>
    </div>
  );
}
