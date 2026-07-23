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
import { reportService } from '@/services/api';
import type { InterviewReport } from '@/types';

const { Title, Text, Paragraph } = Typography;

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportService.getByInterviewId(id!);
      const data = (res.data as { code: number; message: string; data: InterviewReport | null })?.data;
      if (data && data.totalScore !== undefined) {
        setReport(data);
      } else {
        setError('未找到面试报告');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`加载报告失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="正在生成面试报告..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description={error || '未找到面试报告'}>
          <Button type="primary" onClick={() => navigate('/history')}>返回面试历史</Button>
        </Empty>
      </div>
    );
  }

  const radarOption = {
    tooltip: {},
    radar: {
      indicator: (report.radarData || []).map((r: { dimension: string; fullMark: number }) => ({
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
            value: (report.radarData || []).map((r: { score: number }) => r.score),
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
  const scores = report.scores || { content: 0, logic: 0, depth: 0, star: 0, expression: 0 };
  const scoreItems = [
    { label: '内容准确性', key: 'content', value: scores.content ?? 0 },
    { label: '逻辑条理性', key: 'logic', value: scores.logic ?? 0 },
    { label: '专业深度', key: 'depth', value: scores.depth ?? 0 },
    { label: 'STAR 法则运用', key: 'star', value: scores.star ?? 0 },
    { label: '表达沟通能力', key: 'expression', value: scores.expression ?? 0 },
  ];

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/history')}>返回历史</Button>
        </Space>
      </div>

      {/* 总分卡片 */}
      <Card style={{ marginBottom: 24, textAlign: 'center' }}>
        <TrophyOutlined style={{ fontSize: 48, color: scoreColor, marginBottom: 12 }} />
        <Title level={2}>
          综合得分：<span style={{ color: scoreColor }}>{report.totalScore}</span> / 100
        </Title>
        <Text type="secondary">面试时间：{report.createdAt?.slice(0, 10) || '-'}</Text>
      </Card>

      {/* 五维评分 + 雷达图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="各维度得分">
            <Row gutter={[0, 16]}>
              {scoreItems.map((item) => (
                <Col span={24} key={item.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ width: 120 }}>{item.label}</Text>
                    <Progress percent={item.value} size="small" style={{ flex: 1, margin: 0 }}
                      strokeColor={item.value >= 80 ? '#52c41a' : item.value >= 60 ? '#faad14' : '#ff4d4f'} />
                    <Text strong>{item.value}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="能力雷达图">
            {(report.radarData || []).length > 0 ? (
              <ReactECharts option={radarOption} style={{ height: 320 }} />
            ) : (
              <Empty description="暂无雷达图数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 总体评价 */}
      {(report.overallSummary || report.strengths?.length > 0) && (
        <Card title="总体评价" style={{ marginBottom: 24 }}>
          {report.overallSummary && (
            <Alert message="AI 综合评语" description={report.overallSummary} type="info" showIcon style={{ marginBottom: 16 }} />
          )}
          <Row gutter={24}>
            {report.strengths?.length > 0 && (
              <Col xs={24} sm={12}>
                <Title level={5}><TrophyOutlined style={{ color: '#52c41a' }} /> 优点</Title>
                <List size="small" dataSource={report.strengths}
                  renderItem={(item) => <List.Item><Tag color="green">{item}</Tag></List.Item>} />
              </Col>
            )}
            {report.weaknesses?.length > 0 && (
              <Col xs={24} sm={12}>
                <Title level={5}><WarningOutlined style={{ color: '#faad14' }} /> 待改善</Title>
                <List size="small" dataSource={report.weaknesses}
                  renderItem={(item) => <List.Item><Tag color="orange">{item}</Tag></List.Item>} />
              </Col>
            )}
          </Row>
          {report.improvementPlan && (
            <>
              <Divider />
              <Title level={5}><BulbOutlined style={{ color: '#1677ff' }} /> 改进计划</Title>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{report.improvementPlan}</Paragraph>
            </>
          )}
        </Card>
      )}

      {/* 逐题分析 */}
      {(report.questionDetails || []).length > 0 && (
        <Card title="逐题分析 & 回放" style={{ marginBottom: 24 }}>
          <Tabs
            items={report.questionDetails!.map((detail, idx) => ({
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
                      <Button size="small" icon={<PlaySquareOutlined />}
                        onClick={() => message.info('回放功能开发中，敬请期待！')}>
                        回放本题
                      </Button>
                    </div>
                  </Card>
                  {detail.evaluation && (
                    <>
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
                        {detail.evaluation.strengths?.length > 0 && (
                          <>
                            <Text strong style={{ color: '#52c41a' }}>✅ 优点：</Text>
                            <ul>{detail.evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          </>
                        )}
                        {detail.evaluation.weaknesses?.length > 0 && (
                          <>
                            <Text strong style={{ color: '#faad14' }}>⚠️ 不足：</Text>
                            <ul>{detail.evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                          </>
                        )}
                        {detail.evaluation.suggestions?.length > 0 && (
                          <>
                            <Text strong style={{ color: '#1677ff' }}>💡 建议：</Text>
                            <ul>{detail.evaluation.suggestions.map((sg, i) => <li key={i}>{sg}</li>)}</ul>
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {detail.evaluation?.referenceAnswer && (
                    <Collapse style={{ marginTop: 12 }} items={[{
                      key: 'ref',
                      label: '📖 查看高分参考答案',
                      children: <Text>{detail.evaluation.referenceAnswer}</Text>,
                    }]} />
                  )}
                </div>
              ),
            }))}
          />
        </Card>
      )}

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
