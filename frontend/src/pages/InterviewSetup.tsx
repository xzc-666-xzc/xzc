import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Button,
  Radio,
  InputNumber,
  Typography,
  Steps,
  message,
  Row,
  Col,
  Tag,
  Space,
  Descriptions,
  Spin,
} from 'antd';
import {
  PlayCircleOutlined,
  AudioOutlined,
  EditOutlined,
  VideoCameraOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useInterviewStore } from '@/stores';
import { interviewService, positionService } from '@/services/api';
import type { InterviewConfig, Difficulty, InterviewMode, InterviewType } from '@/types';

const { Title, Text } = Typography;

interface RawPosition {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string;
  hot: boolean;
}

interface Position {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  hot: boolean;
}

const difficultyOptions: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'junior', label: '初级', desc: '基础概念 + 简单场景' },
  { value: 'middle', label: '中级', desc: '原理理解 + 项目实战' },
  { value: 'senior', label: '高级', desc: '架构设计 + 深度追问' },
  { value: 'expert', label: '专家级', desc: '系统思维 + 创新方案' },
];

const modeOptions: { value: InterviewMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'text', label: '文字面试', icon: <EditOutlined />, desc: '通过文本对话完成面试' },
  { value: 'voice', label: '语音面试', icon: <AudioOutlined />, desc: '语音实时交流，转写为文字' },
  { value: 'video', label: '视频面试', icon: <VideoCameraOutlined />, desc: '视频面对面，分析表情与姿态（三期）' },
];

const typeOptions: { value: InterviewType; label: string; desc: string }[] = [
  { value: 'technical', label: '技术面', desc: '专业知识 + 技术深度' },
  { value: 'hr', label: 'HR面', desc: '综合素质 + 软技能' },
  { value: 'stress', label: '压力面', desc: '高压场景 + 临场应变' },
  { value: 'boss', label: 'Boss面', desc: '战略思维 + 领导力' },
];

export default function InterviewSetup() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const navigate = useNavigate();
  const { setConfig, setStatus } = useInterviewStore();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    setPositionsLoading(true);
    try {
      const res = await positionService.list();
      const data = res.data.data as RawPosition[];
      const parsed: Position[] = data.map(p => ({
        ...p,
        tags: p.tags ? JSON.parse(p.tags) : [],
      }));
      setPositions(parsed);
    } catch {
      message.error('加载岗位列表失败');
    } finally {
      setPositionsLoading(false);
    }
  };

  const selectedPos = positions.find((p) => p.id === selectedPosition);

  const handleStart = async () => {
    // 仅验证第二步的表单字段（不依赖隐藏的 positionId Select）
    const values = await form.validateFields(['difficulty', 'mode', 'type', 'questionCount']);
    setLoading(true);

    if (!selectedPosition) {
      message.error('请先选择岗位');
      setLoading(false);
      return;
    }

    const pos = positions.find((p) => p.id === selectedPosition);
    const config: InterviewConfig = {
      positionId: selectedPosition,
      positionName: pos?.name || selectedPosition,
      difficulty: values.difficulty,
      mode: values.mode,
      type: values.type,
      questionCount: values.questionCount,
      duration: values.questionCount * 3,
    };

    try {
      const res = await interviewService.create(config);
      const data = res.data?.data;
      if (!data?.interviewId) {
        throw new Error('接口未返回 interviewId');
      }
      setConfig(config);
      setStatus('in_progress');
      navigate(`/interview/${data.interviewId}`);
    } catch {
      message.error('创建面试失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Title level={4}>配置你的模拟面试</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        选择岗位、难度和交互模式，AI 面试官将为你打造专属面试体验
      </Text>

      <Steps
        current={currentStep}
        onChange={setCurrentStep}
        style={{ marginBottom: 32 }}
        items={[
          { title: '选择岗位', description: '目标职位' },
          { title: '参数配置', description: '难度 & 模式' },
          { title: '开始面试', description: '确认并启动' },
        ]}
      />

      <Form form={form} layout="vertical" initialValues={{ questionCount: 8, mode: 'text', difficulty: 'middle', type: 'technical' }}>
        {currentStep === 0 && (
          <>
            {positionsLoading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin tip="加载岗位列表..." />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {positions.map((pos) => (
                  <Col xs={24} sm={12} key={pos.id}>
                    <Card
                      hoverable
                      style={{
                        border: selectedPosition === pos.id ? '2px solid #1677ff' : undefined,
                      }}
                      onClick={() => setSelectedPosition(pos.id)}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 16 }}>
                            {pos.name}
                          </Text>
                          <Tag color="blue">{pos.category}</Tag>
                        </div>
                        <Text type="secondary">{pos.description}</Text>
                        <div>
                          {Array.isArray(pos.tags) && pos.tags.map((tag: string) => (
                            <Tag key={tag} style={{ marginBottom: 4 }}>
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Button
                type="primary"
                disabled={!selectedPosition}
                onClick={() => setCurrentStep(1)}
              >
                下一步
              </Button>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            {selectedPos && (
              <Card style={{ marginBottom: 24 }} size="small">
                <Descriptions title="已选岗位" column={2}>
                  <Descriptions.Item label="岗位">{selectedPos.name}</Descriptions.Item>
                  <Descriptions.Item label="类别">{selectedPos.category}</Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Card title="面试模式" style={{ marginBottom: 16 }}>
              <Form.Item name="mode" rules={[{ required: true }]}>
                <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                  <Row gutter={[12, 12]}>
                    {modeOptions.map((opt) => (
                      <Col xs={24} sm={8} key={opt.value}>
                        <Radio.Button
                          value={opt.value}
                          style={{ width: '100%', height: 'auto', padding: 16 }}
                          disabled={opt.value === 'video'}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</div>
                            <div style={{ fontWeight: 600 }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{opt.desc}</div>
                            {opt.value === 'video' && (
                              <Tag color="orange" style={{ marginTop: 4 }}>
                                三期开放
                              </Tag>
                            )}
                          </div>
                        </Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Form.Item>
            </Card>

            <Card title="面试类型" style={{ marginBottom: 16 }}>
              <Form.Item name="type" rules={[{ required: true }]}>
                <Radio.Group buttonStyle="solid">
                  <Row gutter={[8, 8]}>
                    {typeOptions.map((opt) => (
                      <Col key={opt.value}>
                        <Radio.Button value={opt.value}>{opt.label}</Radio.Button>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Form.Item>
            </Card>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Card title="难度等级">
                  <Form.Item name="difficulty" rules={[{ required: true }]}>
                    <Radio.Group style={{ width: '100%' }}>
                      {difficultyOptions.map((opt) => (
                        <Radio key={opt.value} value={opt.value} style={{ display: 'block', marginBottom: 12 }}>
                          <Text strong>{opt.label}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {opt.desc}
                          </Text>
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card title="题目数量">
                  <Form.Item name="questionCount">
                    <InputNumber min={3} max={20} defaultValue={8} style={{ width: '100%' }} />
                  </Form.Item>
                  <Text type="secondary">建议 6-10 题，预计 {form.getFieldValue('questionCount') * 3} 分钟</Text>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" onClick={() => setCurrentStep(2)}>
                确认配置
              </Button>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ThunderboltOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 24 }} />
              <Title level={3}>一切就绪，准备开始！</Title>
              <Descriptions column={2} style={{ maxWidth: 500, margin: '24px auto' }} bordered size="small">
                <Descriptions.Item label="目标岗位">{selectedPos?.name}</Descriptions.Item>
                <Descriptions.Item label="面试模式">
                  {modeOptions.find((m) => m.value === form.getFieldValue('mode'))?.label}
                </Descriptions.Item>
                <Descriptions.Item label="难度等级">
                  {difficultyOptions.find((d) => d.value === form.getFieldValue('difficulty'))?.label}
                </Descriptions.Item>
                <Descriptions.Item label="题目数量">{form.getFieldValue('questionCount')} 题</Descriptions.Item>
                <Descriptions.Item label="面试类型">
                  {typeOptions.find((t) => t.value === form.getFieldValue('type'))?.label}
                </Descriptions.Item>
                <Descriptions.Item label="预计时长">
                  {form.getFieldValue('questionCount') * 3} 分钟
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 16 }}>
                <Button onClick={() => setCurrentStep(1)}>返回修改</Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  loading={loading}
                  onClick={handleStart}
                >
                  开始面试
                </Button>
              </div>
            </div>
          </Card>
        )}
      </Form>
    </div>
  );
}