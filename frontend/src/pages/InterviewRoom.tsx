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
} from '@ant-design/icons';
import { useInterviewStore } from '@/stores';
import { interviewService } from '@/services/api';
import type { Question } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    config, questions, currentQuestionIndex,
    answers, interviewStatus, isPaused,
    addQuestion, addAnswer, nextQuestion,
    setStatus, setPaused, isRecording, setRecording,
  } = useInterviewStore();

  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showASRFallback, setShowASRFallback] = useState(false);
  const [asrConfidence, setAsrConfidence] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const wsRef = useRef<WebSocket>();

  // 初始化面试
  useEffect(() => {
    if (interviewStatus !== 'in_progress') setStatus('in_progress');

    // 模拟：加载首道题目
    setTimeout(() => {
      setCurrentQuestion({
        id: 'q1',
        interviewId: id || '',
        index: 0,
        content: '你好！欢迎参加本次模拟面试。首先请做一个简单的自我介绍，重点说说你在相关领域的项目经验和技术栈。',
        type: 'main',
        expectedPoints: ['自我介绍', '项目经验', '技术栈'],
        knowledgeTags: ['自我介绍', '综合'],
        createdAt: new Date().toISOString(),
      });
    }, 1000);

    // 计时器
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      wsRef.current?.close();
    };
  }, []);

  // 格式化时间
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
    setCurrentInput('');

    // 记录回答
    addAnswer({
      id: `a_${Date.now()}`,
      questionId: currentQuestion.id,
      content: answerContent,
      duration: elapsed,
      asrConfidence,
      createdAt: new Date().toISOString(),
    });

    try {
      await interviewService.submitAnswer(id, {
        questionId: currentQuestion.id,
        content: answerContent,
        duration: elapsed,
      });
    } catch {
      // 本地记录成功即可，服务端异步重试
    }

    setAiThinking(false);

    // 模拟AI追问或下一题
    const isLastQuestion = currentQuestion.index >= (config?.questionCount || 8) - 1;

    if (!isLastQuestion) {
      // AI 追问或出下一题
      setTimeout(() => {
        const nextQ: Question = {
          id: `q_${Date.now()}`,
          interviewId: id,
          index: currentQuestion.index + 1,
          content: getNextQuestion(currentQuestion.index + 1, answerContent),
          type: 'main',
          expectedPoints: ['技术理解', '实践经验'],
          knowledgeTags: ['技术', '项目'],
          createdAt: new Date().toISOString(),
        };
        setCurrentQuestion(nextQ);
        setElapsed(0);
      }, 1500);
    } else {
      // 面试结束
      setTimeout(() => {
        handleComplete();
      }, 1000);
    }
  }, [currentInput, currentQuestion, id, elapsed]);

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

  // 暂停/继续
  const handlePause = () => {
    if (isPaused) {
      setPaused(false);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      setPaused(true);
      clearInterval(timerRef.current);
    }
  };

  // 退出确认
  const handleQuit = () => {
    Modal.confirm({
      title: '确定要退出面试吗？',
      icon: <ExclamationCircleOutlined />,
      content: `当前进度 ${(currentQuestion?.index || 0) + 1}/${config?.questionCount || 8}，已答数据将自动保存。`,
      okText: '保存并退出',
      cancelText: '继续面试',
      onOk: () => {
        interviewService.pause(id || '');
        navigate('/');
      },
    });
  };

  // 模拟语音录制（ASR 降级处理）
  const handleVoiceToggle = () => {
    if (isRecording) {
      setRecording(false);
      message.success('录音已停止');
      // 模拟 ASR 置信度检查
      const mockConfidence = Math.random();
      setAsrConfidence(mockConfidence);
      if (mockConfidence < 0.6) {
        setShowASRFallback(true);
      }
    } else {
      setRecording(true);
      message.info('开始录音...');
    }
  };

  // 切换到文字输入模式
  const handleSwitchToText = () => {
    setShowASRFallback(false);
    message.info('已切换至文字输入模式');
  };

  const progress = ((currentQuestion?.index || 0) / (config?.questionCount || 8)) * 100;

  return (
    <div className="interview-room">
      {/* 顶栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Space>
          <Text style={{ color: '#fff' }}>
            {config?.positionName} · {config?.difficulty === 'middle' ? '中级' : config?.difficulty}
          </Text>
          <Tag color="blue">{questions.length + 1}/{config?.questionCount} 题</Tag>
        </Space>

        <Progress
          percent={Math.round(progress)}
          size="small"
          style={{ width: 200, margin: 0 }}
          strokeColor="#52c41a"
          trailColor="rgba(255,255,255,0.15)"
        />

        <Space>
          <Text style={{ color: '#aaa' }}>
            <ClockCircleOutlined /> {formatTime(elapsed)}
          </Text>
          <Tooltip title={isPaused ? '继续' : '暂停'}>
            <Button
              type="text"
              style={{ color: '#fff' }}
              icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              onClick={handlePause}
            />
          </Tooltip>
          <Button danger type="text" onClick={handleQuit}>
            退出
          </Button>
        </Space>
      </div>

      {/* 主对话区 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {isPaused && (
          <Alert
            message="面试已暂停"
            description="计时器已暂停，点击继续按钮恢复面试"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {showASRFallback && (
          <Alert
            message="语音识别置信度过低"
            description="检测到语音可能不够清晰，建议切换至文字输入模式继续面试"
            type="warning"
            showIcon
            action={
              <Button size="small" onClick={handleSwitchToText}>
                切换为文字输入
              </Button>
            }
            closable
            onClose={() => setShowASRFallback(false)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* AI 面试官消息 */}
        {currentQuestion && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              AI
            </div>
            <Card
              style={{
                maxWidth: '70%',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
              }}
              bodyStyle={{ padding: '12px 16px', color: '#e0e0e0' }}
            >
              <Text style={{ color: '#8899ff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                🤖 AI 面试官
              </Text>
              <Paragraph style={{ color: '#e0e0e0', margin: 0, whiteSpace: 'pre-wrap' }}>
                {currentQuestion.content}
              </Paragraph>
            </Card>
          </div>
        )}

        {/* 用户回答记录 */}
        {answers.map((answer, idx) => (
          <div key={answer.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            <Card
              style={{
                maxWidth: '70%',
                background: 'rgba(22, 119, 255, 0.15)',
                border: '1px solid rgba(22, 119, 255, 0.3)',
              }}
              bodyStyle={{ padding: '12px 16px', color: '#e0e0e0' }}
            >
              <Text style={{ color: '#1677ff', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                👤 你的回答 · 第{idx + 1}题
              </Text>
              <Paragraph style={{ color: '#e0e0e0', margin: 0, whiteSpace: 'pre-wrap' }}>
                {answer.content}
              </Paragraph>
            </Card>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: '#1677ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              我
            </div>
          </div>
        ))}

        {/* AI 思考中 */}
        {aiThinking && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Space>
              <Spin indicator={<LoadingOutlined />} />
              <Text style={{ color: '#aaa' }}>AI 正在分析你的回答...</Text>
            </Space>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div
        style={{
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          {config?.mode === 'voice' && (
            <Button
              icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
              shape="circle"
              size="large"
              danger={isRecording}
              onClick={handleVoiceToggle}
            />
          )}

          <TextArea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSubmitAnswer();
              }
            }}
            placeholder={
              config?.mode === 'voice'
                ? '语音内容将自动转换为文字显示在这里...'
                : '输入你的回答... (Enter 发送，Shift+Enter 换行)'
            }
            autoSize={{ minRows: 2, maxRows: 5 }}
            disabled={aiThinking || isPaused}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e0e0e0',
            }}
          />

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitAnswer}
            loading={aiThinking}
            disabled={!currentInput.trim() || aiThinking || isPaused}
            size="large"
          >
            发送
          </Button>
        </div>

        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <Text type="secondary" style={{ color: '#666', fontSize: 12 }}>
            {config?.mode === 'text'
              ? 'Enter 发送 · Shift+Enter 换行'
              : '点击麦克风按钮开始语音输入 · 语音内容自动转文字'}
          </Text>
        </div>
      </div>
    </div>
  );
}

// 模拟问题生成器（实际对接 LLM）
function getNextQuestion(index: number, prevAnswer: string): string {
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
