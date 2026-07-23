import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Card,
  Typography,
  Space,
  Tag,
  Progress,
  Modal,
  message,
  Spin,
  Alert,
  Tooltip,
  Collapse,
} from 'antd';
import {
  SendOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  ForwardOutlined,
  CheckCircleOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { useInterviewStore } from '@/stores';
import { interviewService } from '@/services/api';
import { getSelfIntroQuestion, getQuestionsForInterview } from '@/data/questions';
import type { Question } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Feedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
}

interface QAItem {
  question: string;
  answer: string;
  feedback: Feedback | null;
}

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    config, interviewStatus, isPaused,
    addAnswer, setStatus, setPaused, isRecording, setRecording,
  } = useInterviewStore();

  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [history, setHistory] = useState<QAItem[]>([]);
  const [showASRFallback, setShowASRFallback] = useState(false);
  const [asrConfidence, setAsrConfidence] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 保存题目到后端并获取真实ID
  const saveQuestionToBackend = async (content: string, idx: number): Promise<Question> => {
    try {
      const res = await interviewService.saveQuestion(id!, { content, index: idx });
      const realId = res.data?.data?.questionId || `q_${Date.now()}`;
      return {
        id: realId,
        interviewId: id || '',
        index: idx,
        content,
        type: 'main',
        expectedPoints: [],
        knowledgeTags: [],
        createdAt: new Date().toISOString(),
      };
    } catch {
      // fallback: use local ID if API fails
      return {
        id: `q_${Date.now()}`,
        interviewId: id || '',
        index: idx,
        content,
        type: 'main',
        expectedPoints: [],
        knowledgeTags: [],
        createdAt: new Date().toISOString(),
      };
    }
  };

  // 预加载题库（根据岗位和难度）
  const questionPoolRef = useRef<ReturnType<typeof getQuestionsForInterview>>([]);
  useEffect(() => {
    if (config) {
      questionPoolRef.current = getQuestionsForInterview(
        config.positionId,
        config.difficulty,
        config.questionCount - 1, // 减去第一题自我介绍
      );
    }
  }, [config]);

  // 初始化面试
  useEffect(() => {
    if (interviewStatus !== 'in_progress') setStatus('in_progress');

    const initFirstQuestion = async () => {
      const intro = getSelfIntroQuestion();
      const q = await saveQuestionToBackend(intro.content, 0);
      setCurrentQuestion(q);
    };
    setTimeout(() => { initFirstQuestion(); }, 800);

    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 提交回答
  const handleSubmitAnswer = useCallback(async () => {
    if (!currentInput.trim() || !currentQuestion || !id) return;

    setAiThinking(true);
    const answerContent = currentInput.trim();
    const currentQ = currentQuestion;
    setCurrentInput('');
    setCurrentQuestion(null);

    addAnswer({
      id: `a_${Date.now()}`,
      questionId: currentQ.id,
      content: answerContent,
      duration: elapsed,
      asrConfidence,
      createdAt: new Date().toISOString(),
    });

    try {
      await interviewService.submitAnswer(id, {
        questionId: currentQ.id,
        content: answerContent,
        duration: elapsed,
      });
    } catch { /* 本地记录即可 */ }

    // 模拟 AI 评估
    await new Promise((r) => setTimeout(r, 1500));
    const feedback = generateFeedback(currentQ, answerContent);
    setCurrentFeedback(feedback);

    // 加入历史记录
    setHistory((prev) => [...prev, {
      question: currentQ.content,
      answer: answerContent,
      feedback,
    }]);

    setAiThinking(false);
    setWaitingForNext(true);
    scrollToBottom();
  }, [currentInput, currentQuestion, id, elapsed]);

  // 进入下一题
  const handleNextQuestion = useCallback(() => {
    const prevIndex = questionIndex;
    const totalQuestions = config?.questionCount || 8;
    const isLastQuestion = prevIndex >= totalQuestions - 1;

    setCurrentFeedback(null);
    setWaitingForNext(false);

    if (isLastQuestion) {
      handleComplete();
    } else {
      const nextIdx = prevIndex + 1;
      setQuestionIndex(nextIdx);
      setTimeout(async () => {
        // 从预加载题库中取第 nextIdx-1 道题（第0题是自我介绍，题库从第1题开始）
        const poolIdx = nextIdx - 1; // 题库索引（不含第一题自我介绍）
        const template = questionPoolRef.current[poolIdx];
        const content = template
          ? template.content
          : '请继续回答下一道面试题。';
        const q = await saveQuestionToBackend(content, nextIdx);
        setCurrentQuestion(q);
        setElapsed(0);
        scrollToBottom();
      }, 200);
    }
  }, [questionIndex, config?.questionCount, id]);

  // 完成面试
  const handleComplete = async () => {
    if (!id) return;
    try {
      await interviewService.complete(id);
      setStatus('completed');
      message.success('面试完成！正在生成报告...');
      navigate(`/report/${id}`);
    } catch {
      message.error('提交失败');
    }
  };

  const handlePause = () => {
    if (isPaused) {
      setPaused(false);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      setPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const handleQuit = () => {
    Modal.confirm({
      title: '确定要退出面试吗？',
      icon: <ExclamationCircleOutlined />,
      content: `当前进度 ${questionIndex + 1}/${config?.questionCount || 8}，已答数据将自动保存。`,
      okText: '保存并退出',
      cancelText: '继续面试',
      onOk: () => {
        interviewService.pause(id || '');
        navigate('/');
      },
    });
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setRecording(false);
      message.success('录音已停止');
      const mockConfidence = Math.random();
      setAsrConfidence(mockConfidence);
      if (mockConfidence < 0.6) setShowASRFallback(true);
    } else {
      setRecording(true);
      message.info('开始录音...');
    }
  };

  const answeredCount = questionIndex + (waitingForNext ? 1 : 0);
  const progress = (answeredCount / (config?.questionCount || 8)) * 100;

  return (
    <div className="interview-room">
      {/* 顶栏 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Space>
          <Text style={{ color: '#fff' }}>
            {config?.positionName} · {config?.difficulty === 'middle' ? '中级' : config?.difficulty}
          </Text>
          <Tag color="blue">{answeredCount}/{config?.questionCount} 题</Tag>
        </Space>
        <Progress percent={Math.round(progress)} size="small"
          style={{ width: 200, margin: 0 }} strokeColor="#52c41a"
          trailColor="rgba(255,255,255,0.15)" />
        <Space>
          <Text style={{ color: '#aaa' }}><ClockCircleOutlined /> {formatTime(elapsed)}</Text>
          <Tooltip title={isPaused ? '继续' : '暂停'}>
            <Button type="text" style={{ color: '#fff' }}
              icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              onClick={handlePause} />
          </Tooltip>
          <Button danger type="text" onClick={handleQuit}>退出</Button>
        </Space>
      </div>

      {/* 主对话区 */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '24px 32px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {isPaused && (
          <Alert message="面试已暂停" description="计时器已暂停，点击继续按钮恢复面试"
            type="warning" showIcon />
        )}

        {showASRFallback && (
          <Alert message="语音识别置信度过低" description="建议切换至文字输入模式"
            type="warning" showIcon
            action={<Button size="small" onClick={() => { setShowASRFallback(false); message.info('已切换至文字输入模式'); }}>切换为文字输入</Button>}
            closable onClose={() => setShowASRFallback(false)} />
        )}

        {/* 历史问答（折叠） */}
        {history.length > 0 && (
          <Collapse
            ghost
            size="small"
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            items={history.map((item, idx) => ({
              key: String(idx),
              label: (
                <Space>
                  <Tag color={item.feedback && item.feedback.overallScore >= 80 ? 'green' : item.feedback && item.feedback.overallScore >= 60 ? 'gold' : 'red'}
                    style={{ fontSize: 12 }}>
                    第{idx + 1}题 · {item.feedback ? `${item.feedback.overallScore}分` : '评分中'}
                  </Tag>
                  <Text style={{ color: '#888', fontSize: 13 }} ellipsis>
                    {item.question.length > 35 ? item.question.slice(0, 35) + '...' : item.question}
                  </Text>
                </Space>
              ),
              children: (
                <div style={{ paddingLeft: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>问题：</Text>
                  <Paragraph style={{ color: '#bbb', fontSize: 13, margin: '4px 0 8px' }}>{item.question}</Paragraph>
                  <Text type="secondary" style={{ fontSize: 12 }}>你的回答：</Text>
                  <Paragraph style={{ color: '#999', fontSize: 13, margin: '4px 0 8px' }}>{item.answer}</Paragraph>
                  {item.feedback && (
                    <>
                      <Text style={{ color: item.feedback.overallScore >= 80 ? '#52c41a' : item.feedback.overallScore >= 60 ? '#faad14' : '#ff4d4f', fontWeight: 600, fontSize: 14 }}>
                        得分：{item.feedback.overallScore} 分
                      </Text>
                      <Text style={{ color: '#1677ff', fontSize: 12, display: 'block', marginTop: 4 }}>
                        💡 {item.feedback.suggestion}
                      </Text>
                    </>
                  )}
                </div>
              ),
            }))}
            style={{ background: 'transparent' }}
          />
        )}

        {/* 当前题目 */}
        {currentQuestion && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700 }}>
              AI
            </div>
            <Card style={{ maxWidth: '75%', background: 'rgba(255,255,255,0.08)', border: 'none' }}
              bodyStyle={{ padding: '12px 16px', color: '#e0e0e0' }}>
              <Text style={{ color: '#8899ff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                🤖 AI 面试官 · 第{currentQuestion.index + 1}题
              </Text>
              <Paragraph style={{ color: '#e0e0e0', margin: 0, whiteSpace: 'pre-wrap', fontSize: 15 }}>
                {currentQuestion.content}
              </Paragraph>
            </Card>
          </div>
        )}

        {/* AI 思考中 */}
        {aiThinking && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700 }}>
              AI
            </div>
            <Card style={{ maxWidth: '70%', background: 'rgba(255,255,255,0.06)', border: 'none' }}
              bodyStyle={{ padding: '16px 20px' }}>
              <Space>
                <Spin indicator={<LoadingOutlined style={{ color: '#8899ff' }} />} />
                <Text style={{ color: '#aaa' }}>AI 正在分析你的回答...</Text>
              </Space>
            </Card>
          </div>
        )}

        {/* AI 反馈 */}
        {currentFeedback && !aiThinking && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700 }}>
              AI
            </div>
            <Card style={{ maxWidth: '75%', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(136,153,255,0.3)' }}
              bodyStyle={{ padding: '16px 20px', color: '#e0e0e0' }}>
              <Text style={{ color: '#8899ff', fontWeight: 600, display: 'block', marginBottom: 12 }}>
                🤖 AI 面试官点评
              </Text>

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 700,
                  color: currentFeedback.overallScore >= 80 ? '#52c41a'
                    : currentFeedback.overallScore >= 60 ? '#faad14' : '#ff4d4f' }}>
                  {currentFeedback.overallScore} 分
                </Text>
                <Text style={{ color: '#aaa', marginLeft: 8 }}>本题综合评分</Text>
              </div>

              {currentFeedback.strengths.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#52c41a', fontWeight: 600 }}><CheckCircleOutlined /> 优点</Text>
                  <ul style={{ margin: '4px 0 0 16px', color: '#bbb' }}>
                    {currentFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {currentFeedback.weaknesses.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#faad14', fontWeight: 600 }}><ExclamationCircleOutlined /> 需要改进</Text>
                  <ul style={{ margin: '4px 0 0 16px', color: '#bbb' }}>
                    {currentFeedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ padding: '8px 12px', background: 'rgba(22,119,255,0.1)', borderRadius: 6 }}>
                <Text style={{ color: '#1677ff', fontSize: 12 }}>💡 {currentFeedback.suggestion}</Text>
              </div>
            </Card>
          </div>
        )}

        {/* 下一题按钮 */}
        {waitingForNext && !aiThinking && (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <Button type="primary" size="large" icon={<ForwardOutlined />}
              onClick={handleNextQuestion} style={{ minWidth: 160 }}>
              {questionIndex + 1 >= (config?.questionCount || 8) ? '完成面试' : '下一题'}
            </Button>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: '#666', fontSize: 12 }}>查看反馈后，点击按钮继续</Text>
            </div>
          </div>
        )}

        {/* 自动滚动锚点 */}
        <div ref={chatEndRef} />
      </div>

      {/* 输入区 */}
      {!waitingForNext && (
        <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            {config?.mode === 'voice' && (
              <Button icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                shape="circle" size="large" danger={isRecording} onClick={handleVoiceToggle} />
            )}
            <TextArea value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) { e.preventDefault(); handleSubmitAnswer(); }
              }}
              placeholder={config?.mode === 'voice'
                ? '语音内容将自动转为文字...'
                : '输入你的回答... (Enter 发送，Shift+Enter 换行)'}
              autoSize={{ minRows: 2, maxRows: 5 }}
              disabled={aiThinking || isPaused}
              style={{ flex: 1, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)', color: '#e0e0e0' }} />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSubmitAnswer}
              loading={aiThinking} disabled={!currentInput.trim() || aiThinking || isPaused} size="large">
              发送
            </Button>
          </div>
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ color: '#666', fontSize: 12 }}>
              Enter 发送 · Shift+Enter 换行
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 辅助函数 ---

function generateFeedback(_question: Question, answer: string): Feedback {
  const len = answer.length;
  let baseScore = 60;
  if (len > 300) baseScore = 85;
  else if (len > 200) baseScore = 78;
  else if (len > 100) baseScore = 70;
  else if (len > 50) baseScore = 62;
  else baseScore = 50;

  const score = Math.min(98, baseScore + Math.floor(Math.random() * 10) - 5);

  const allStrengths = [
    '回答结构清晰，条理分明', '专业术语使用准确', '项目经验描述具体',
    '能够结合实际案例说明', '表达流畅，逻辑连贯', '对核心概念理解到位',
  ];
  const allWeaknesses = [
    '缺少量化的数据支撑', '可以更深入阐述技术原理', '建议使用 STAR 法则组织回答',
    '部分表述略显笼统', '缺少对边界情况的思考', '可补充更多实践细节',
  ];
  const suggestions = [
    '建议结合具体项目中的量化指标来强化说服力',
    '尝试用 STAR 法则（情境-任务-行动-结果）重新组织回答',
    '深入思考技术方案背后的设计原理和权衡',
    '多准备几个技术难点的案例，展示解决问题的能力',
    '注意区分"知道"和"做过"——强调亲身实践经验',
    '在回答中体现出对行业最佳实践的了解',
  ];

  const nStrengths = score >= 80 ? 3 : score >= 65 ? 2 : 1;
  const nWeaknesses = score >= 80 ? 1 : score >= 65 ? 2 : 3;
  const si = score % allStrengths.length;
  const wi = score % allWeaknesses.length;

  return {
    overallScore: score,
    strengths: allStrengths.slice(si, si + nStrengths),
    weaknesses: allWeaknesses.slice(wi, wi + nWeaknesses),
    suggestion: suggestions[score % suggestions.length],
  };
}

function getNextQuestion(index: number, _prev: string): string {
  const questions = [
    '请详细介绍你最近参与的一个项目，你在其中承担什么角色？解决了什么技术难题？',
    '谈谈你对微服务架构的理解，以及在实际项目中如何做服务拆分？',
    '遇到线上故障时，你的排查思路是什么？请举个具体例子。',
    '请写一个 SQL，查询每个部门薪资最高的员工信息。',
    '如何保证分布式系统的一致性？请介绍你知道的几种方案及其优缺点。',
    '谈谈你对 JVM 垃圾回收机制的理解，以及如何进行 GC 调优？',
    '在产品设计中，你是如何权衡用户需求和开发成本的？',
    '请分享一次你如何推动团队改变技术方案的真实案例。',
  ];
  return questions[index % questions.length];
}
