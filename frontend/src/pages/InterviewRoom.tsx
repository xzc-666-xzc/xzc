import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterviewStore } from '@/stores';
import { interviewService } from '@/services/api';
import { getSelfIntroQuestion, getQuestionsForInterview } from '@/data/questions';
import Watermark from '@/components/Watermark';
import type { Question } from '@/types';

interface Feedback { overallScore: number; strengths: string[]; weaknesses: string[]; suggestion: string; }
interface QAItem { question: string; answer: string; feedback: Feedback | null; }

// AI 追问建议
const AI_HINTS = [
  '可以追问：这个方案在极端并发场景下有什么退化策略？',
  '建议深入：你提到的技术选型，对比过其他方案吗？优劣在哪？',
  '可以追问：如果让你重新设计，你会改进哪些地方？',
  '建议深入：你在这个项目中遇到的最大技术挑战是什么？',
  '可追问实践：能否给一个具体的线上故障案例和排查过程？',
];

const QUICK_REPLIES = [
  '这是一个很好的问题。',
  '从我的项目经验来看，',
  '我认为核心要点在于',
  '举个例子来说明，',
  '总结来说，',
];

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { config, interviewStatus, isPaused, addAnswer, setStatus, setPaused, isRecording, setRecording } = useInterviewStore();

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
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [expandedQA, setExpandedQA] = useState<Set<number>>(new Set());
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiHint, setAiHint] = useState(AI_HINTS[0]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 模拟网络状态
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');
  useEffect(() => {
    const qualities: Array<'good' | 'fair' | 'poor'> = ['good', 'good', 'good', 'fair', 'poor'];
    const timer = setInterval(() => setNetworkQuality(qualities[Math.floor(Math.random() * qualities.length)]), 30000);
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const saveQuestionToBackend = async (content: string, idx: number): Promise<Question> => {
    try {
      const res = await interviewService.saveQuestion(id!, { content, index: idx });
      const realId = res.data?.data?.questionId || `q_${Date.now()}`;
      return { id: realId, interviewId: id || '', index: idx, content, type: 'main', expectedPoints: [], knowledgeTags: [], createdAt: new Date().toISOString() };
    } catch {
      return { id: `q_${Date.now()}`, interviewId: id || '', index: idx, content, type: 'main', expectedPoints: [], knowledgeTags: [], createdAt: new Date().toISOString() };
    }
  };

  const questionPoolRef = useRef<ReturnType<typeof getQuestionsForInterview>>([]);
  useEffect(() => {
    if (config) {
      const pool = getQuestionsForInterview(config.positionId, config.difficulty, config.questionCount - 1);
      questionPoolRef.current = pool;
      // 如果题库返回的题目不够，用兜底题目补齐
      if (pool.length < config.questionCount - 1) {
        console.warn(`Question pool only has ${pool.length} questions, need ${config.questionCount - 1}`);
      }
    }
  }, [config]);

  useEffect(() => {
    if (interviewStatus !== 'in_progress') setStatus('in_progress');
    const initFirstQuestion = async () => {
      const intro = getSelfIntroQuestion();
      const q = await saveQuestionToBackend(intro.content, 0);
      setCurrentQuestion(q);
    };
    setTimeout(() => { initFirstQuestion(); }, 800);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentInput.trim() || !currentQuestion || !id) return;
    setAiThinking(true);
    const answerContent = currentInput.trim();
    const currentQ = currentQuestion;
    setCurrentInput('');
    setCurrentQuestion(null);
    addAnswer({ id: `a_${Date.now()}`, questionId: currentQ.id, content: answerContent, duration: elapsed, asrConfidence, createdAt: new Date().toISOString() });
    try { await interviewService.submitAnswer(id, { questionId: currentQ.id, content: answerContent, duration: elapsed }); } catch { /* fallback */ }
    await new Promise(r => setTimeout(r, 1500));
    const feedback = generateFeedback(currentQ, answerContent);
    setCurrentFeedback(feedback);
    setHistory(prev => [...prev, { question: currentQ.content, answer: answerContent, feedback }]);
    setAiHint(AI_HINTS[Math.floor(Math.random() * AI_HINTS.length)]);
    setAiThinking(false);
    setWaitingForNext(true);
    scrollToBottom();
  }, [currentInput, currentQuestion, id, elapsed]);

  const handleNextQuestion = useCallback(() => {
    const totalQuestions = config?.questionCount || 8;
    const isLastQuestion = questionIndex >= totalQuestions - 1;
    setCurrentFeedback(null); setWaitingForNext(false);
    if (isLastQuestion) {
      handleComplete();
    } else {
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      setTimeout(async () => {
        const template = questionPoolRef.current[nextIdx - 1];
        // 兜底：题库不足时动态生成题目，而非显示无意义的"请继续回答下一道面试题"
        const fallbackQuestions = [
          `请你详细聊聊在这个岗位上，你最有心得的一个技术点或项目经验。`,
          `如果一个新人来问你关于${config?.positionName || '该岗位'}的核心技能，你会怎么给他规划学习路径？`,
          `请分享一次你在工作中遇到技术难题并最终解决的经历，重点说明你的分析思路。`,
          `你认为${config?.positionName || '这个领域'}的未来发展趋势是什么？你为此做了哪些准备？`,
          `请描述一次你与团队协作完成复杂任务的经历，你在其中扮演了什么角色？`,
          `如果让你重新设计你现在负责的系统/模块，你会做什么改进？为什么？`,
          `请分享一个你近期关注的技术话题或行业动态，以及你的思考和见解。`,
          `你觉得一个好的${config?.positionName || ''}工程师/从业者最重要的三个品质是什么？请结合自身经历说明。`,
        ];
        const fallbackIdx = (nextIdx * 7 + (config?.questionCount || 8)) % fallbackQuestions.length;
        const content = template
          ? template.content
          : fallbackQuestions[fallbackIdx];
        const q = await saveQuestionToBackend(content, nextIdx);
        setCurrentQuestion(q); setElapsed(0); scrollToBottom();
      }, 200);
    }
  }, [questionIndex, config?.questionCount, id]);

  const handleComplete = async () => {
    if (!id) return;
    try { await interviewService.complete(id); } catch { /* fallback */ }
    setStatus('completed');
    navigate(`/report/${id}`);
  };

  const handlePause = () => {
    if (isPaused) { setPaused(false); timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000); }
    else { setPaused(true); clearInterval(timerRef.current); }
  };

  const handleQuit = () => { interviewService.pause(id || ''); navigate('/'); };
  const handleVoiceToggle = () => {
    if (isRecording) { setRecording(false); const c = Math.random(); setAsrConfidence(c); if (c < 0.6) setShowASRFallback(true); }
    else setRecording(true);
  };

  const answeredCount = questionIndex + (waitingForNext ? 1 : 0);
  const totalQuestions = config?.questionCount || 8;
  const progress = (answeredCount / totalQuestions) * 100;
  const totalSecs = (config?.questionCount || 8) * 180;

  return (
    <div className="h-full flex flex-col bg-[#111827] text-slate-200 interview-dark">
      <Watermark text={config?.positionName || '面试中'} />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800/50 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-medium text-sm">{config?.positionName}</span>
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-lg text-xs">{answeredCount}/{totalQuestions} 题</span>
          {/* 网络指示 */}
          <span className={`w-2 h-2 rounded-full ${
            networkQuality === 'good' ? 'bg-green-400 animate-pulse' :
            networkQuality === 'fair' ? 'bg-amber-400' : 'bg-red-400'
          }`} title={`网络: ${networkQuality === 'good' ? '良好' : networkQuality === 'fair' ? '一般' : '较差'}`} />
        </div>

        {/* 计时圆环 */}
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="2.5"
              strokeDasharray={`${(elapsed / totalSecs) * 94.2} 94.2`} strokeLinecap="round"
              className="score-ring" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white">{formatTime(elapsed)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* AI 面板按钮 */}
          <button onClick={() => setShowAIPanel(!showAIPanel)}
            className={`p-2.5 rounded-xl transition-all duration-200 border cursor-pointer select-none
              ${showAIPanel
                ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/30 hover:border-indigo-300/50 active:scale-95'
                : 'border-slate-500/20 text-slate-400 hover:bg-white/10 hover:border-slate-400/40 hover:text-slate-200 active:border-indigo-400/50 active:scale-95'}`}
            title="AI 助手面板">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/></svg>
          </button>
          <button onClick={handlePause}
            className="p-2.5 rounded-xl border border-slate-500/20 text-slate-400 hover:bg-white/10 hover:border-slate-400/40 hover:text-slate-200 active:border-indigo-400/50 active:scale-95 transition-all duration-200 cursor-pointer select-none"
            title={isPaused ? '继续' : '暂停'}>
            {isPaused
              ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="5,3 19,12 5,21"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>}
          </button>
          <button onClick={() => setShowQuitModal(true)}
            className="px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:border-red-400/40 hover:text-red-300 active:scale-95 active:border-red-400/60 transition-all duration-200 text-sm cursor-pointer select-none">退出</button>
        </div>
      </div>

      {/* 三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 主对话区 */}
        <div className={`flex-1 flex flex-col overflow-auto px-6 lg:px-8 py-5 gap-3 ${showAIPanel ? 'lg:pr-4' : ''}`}>
          {/* Paused alert */}
          {isPaused && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm animate-fade-in">
              ⏸️ 面试已暂停 — 计时器已停止，点击继续按钮恢复
            </div>
          )}
          {showASRFallback && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm flex items-center justify-between">
              <span>⚠️ 语音识别置信度过低</span>
              <button onClick={() => setShowASRFallback(false)} className="text-amber-300 underline text-xs">切换文字输入</button>
            </div>
          )}

          {/* 历史问答 */}
          {history.map((item, idx) => (
            <div key={idx} className="border-b border-white/5 pb-2">
              <button onClick={() => { const next = new Set(expandedQA); expandedQA.has(idx) ? next.delete(idx) : next.add(idx); setExpandedQA(next); }}
                className="w-full flex items-center gap-2 py-1 text-left hover:bg-white/5 rounded px-2 transition-colors">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  item.feedback && item.feedback.overallScore >= 80 ? 'bg-green-500/20 text-green-400' :
                  item.feedback && item.feedback.overallScore >= 60 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'}`}>
                  第{idx + 1}题 · {item.feedback ? `${item.feedback.overallScore}分` : '评分中'}
                </span>
                <span className="text-slate-500 text-sm truncate flex-1">{item.question.slice(0, 35)}...</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`w-4 h-4 text-slate-500 transition-transform ${expandedQA.has(idx) ? 'rotate-90' : ''}`}>
                  <polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {expandedQA.has(idx) && (
                <div className="mt-2 pl-4 pb-2 text-sm space-y-2 animate-fade-in">
                  <div><span className="text-slate-500">Q: </span><span className="text-slate-300">{item.question}</span></div>
                  <div><span className="text-slate-500">A: </span><span className="text-slate-400">{item.answer}</span></div>
                  {item.feedback && (
                    <div>
                      <span className={`font-bold ${item.feedback.overallScore >= 80 ? 'text-green-400' : 'text-amber-400'}`}>
                        {item.feedback.overallScore}分
                      </span>
                      <span className="text-blue-400 text-xs ml-3">💡 {item.feedback.suggestion}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* AI 问题气泡 */}
          {currentQuestion && (
            <div className="flex gap-3 items-start animate-slide-up">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-glow">
                AI
              </div>
              <div className="max-w-[80%] bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 border border-slate-700">
                <p className="text-indigo-300 font-semibold text-xs mb-2">🤖 AI 面试官 · 第{currentQuestion.index + 1}题</p>
                <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{currentQuestion.content}</p>
              </div>
            </div>
          )}

          {/* AI 思考 */}
          {aiThinking && (
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">AI</div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
                <span className="text-slate-400 text-sm">AI 正在分析你的回答...</span>
              </div>
            </div>
          )}

          {/* AI 反馈 */}
          {currentFeedback && !aiThinking && (
            <div className="flex gap-3 items-start animate-slide-up">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">AI</div>
              <div className="max-w-[80%] bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 border border-indigo-500/30">
                <p className="text-indigo-300 font-semibold text-xs mb-3">🤖 AI 面试官点评</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-3xl font-bold ${currentFeedback.overallScore >= 80 ? 'text-green-400' : currentFeedback.overallScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {currentFeedback.overallScore}
                  </span>
                  <span className="text-slate-500 text-sm">分</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${currentFeedback.overallScore >= 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${currentFeedback.overallScore}%` }} />
                  </div>
                </div>
                {currentFeedback.strengths.length > 0 && (
                  <div className="mb-2"><p className="text-green-400 text-xs font-medium mb-1">✅ 优点</p>
                    {currentFeedback.strengths.map((s, i) => <p key={i} className="text-slate-300 text-xs">· {s}</p>)}
                  </div>)}
                {currentFeedback.weaknesses.length > 0 && (
                  <div className="mb-2"><p className="text-amber-400 text-xs font-medium mb-1">⚠️ 待改进</p>
                    {currentFeedback.weaknesses.map((w, i) => <p key={i} className="text-slate-300 text-xs">· {w}</p>)}
                  </div>)}
                <div className="bg-blue-500/10 rounded-lg px-3 py-2 mt-3">
                  <p className="text-blue-400 text-xs">💡 {currentFeedback.suggestion}</p>
                </div>
              </div>
            </div>
          )}

          {/* 下一题按钮 */}
          {waitingForNext && !aiThinking && (
            <div className="text-center py-4 animate-fade-in">
              <button onClick={handleNextQuestion}
                className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 border border-white/10 text-white rounded-xl font-semibold text-base hover:from-indigo-600 hover:to-purple-700 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.97] active:border-white/30 transition-all duration-200 flex items-center gap-2.5 mx-auto cursor-pointer select-none">
                {questionIndex + 1 >= totalQuestions ? '🎉 完成面试，查看报告' : '下一题'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* AI 助手右侧面板 */}
        {showAIPanel && (
          <div className="hidden lg:block w-72 bg-white/3 border-l border-white/8 overflow-auto p-4 animate-fade-in shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/></svg>
                AI 助手
              </h4>
              <button onClick={() => setShowAIPanel(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>

            {/* 追问建议 */}
            <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20 mb-4">
              <p className="text-indigo-300 text-xs font-medium mb-2">💡 追问建议</p>
              <p className="text-slate-400 text-xs leading-relaxed">{aiHint}</p>
            </div>

            {/* 面试信息 */}
            <div className="space-y-3 text-xs text-slate-400">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-slate-500 mb-1">岗位</p>
                <p className="text-slate-300 font-medium">{config?.positionName || '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-slate-500 mb-1">难度</p>
                <p className="text-slate-300 font-medium">{config?.difficulty === 'middle' ? '中级' : config?.difficulty === 'junior' ? '初级' : config?.difficulty === 'senior' ? '高级' : config?.difficulty || '-'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-slate-500 mb-1">题目进度</p>
                <p className="text-slate-300 font-medium">{answeredCount} / {totalQuestions}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      {!waitingForNext && (
        <div className="px-6 py-4 bg-[#0b1018] border-t-2 border-indigo-500/40 shrink-0">
          {/* 快捷短语 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {QUICK_REPLIES.map(phrase => (
              <button key={phrase} onClick={() => setCurrentInput(prev => prev + (prev ? ' ' : '') + phrase)}
                className="px-4 py-2 bg-slate-700/40 border border-slate-500/20 rounded-xl text-sm text-slate-300 hover:bg-slate-600/70 hover:border-slate-400/40 hover:text-white hover:shadow-lg hover:shadow-slate-900/30 active:border-indigo-400/60 active:bg-slate-600 active:scale-[0.97] transition-all duration-200 cursor-pointer select-none">
                {phrase}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            {config?.mode === 'voice' && (
              <button onClick={handleVoiceToggle}
                className={`p-3.5 rounded-xl transition-all duration-200 shrink-0 border cursor-pointer select-none
                  ${isRecording
                    ? 'bg-red-500/80 border-red-400/40 text-white hover:bg-red-500 hover:border-red-300/60 active:scale-[0.95]'
                    : 'bg-white/5 border-slate-500/20 text-slate-300 hover:bg-white/10 hover:border-slate-400/40 hover:text-white active:border-indigo-400/50 active:scale-[0.95]'}`}>
                {isRecording
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>}
              </button>
            )}
            <div className="flex-1 relative">
              <textarea
                value={currentInput}
                onChange={e => setCurrentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitAnswer(); } }}
                placeholder={config?.mode === 'voice' ? '语音内容将自动转为文字...' : '输入你的回答... (Enter 发送，Shift+Enter 换行)'}
                disabled={aiThinking || isPaused}
                rows={2}
                className="w-full bg-[#1a2236] border border-slate-600/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 resize-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm disabled:opacity-40"
              />
              <span className="absolute bottom-2 right-3 text-xs text-slate-400">{currentInput.length} 字</span>
            </div>
            <button
              onClick={handleSubmitAnswer}
              disabled={!currentInput.trim() || aiThinking || isPaused}
              className="px-6 py-3.5 bg-indigo-500/80 border border-indigo-400/30 text-white rounded-xl font-medium hover:bg-indigo-500 hover:border-indigo-300/50 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.96] active:border-indigo-300/70 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-indigo-500/80 disabled:hover:shadow-none flex items-center gap-2 shrink-0 cursor-pointer select-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              发送
            </button>
          </div>
        </div>
      )}

      {/* 退出弹窗 */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowQuitModal(false)} />
          <div className="relative bg-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4 border border-white/10 shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="rgb(239 68 68)" strokeWidth="2" className="w-7 h-7"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white">确定退出面试？</h3>
              <p className="text-slate-400 text-sm mt-1">进度 {questionIndex + 1}/{totalQuestions}，数据自动保存</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowQuitModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-500/20 text-slate-300 hover:bg-slate-600/50 hover:border-slate-400/40 hover:text-white active:scale-95 active:border-indigo-400/50 transition-all duration-200 text-sm cursor-pointer select-none">继续面试</button>
              <button onClick={handleQuit}
                className="flex-1 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 hover:border-red-400/40 hover:text-red-300 active:scale-95 active:border-red-400/60 transition-all duration-200 text-sm font-medium cursor-pointer select-none">保存并退出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateFeedback(_question: Question, answer: string): Feedback {
  const content = answer.trim();
  const len = content.length;

  // === 内容有效性检测 ===
  const validity = checkContentValidity(content);

  // 如果是无效内容（乱写），直接给极低分
  if (!validity.isValid) {
    return {
      overallScore: validity.suggestedScore,
      strengths: [],
      weaknesses: validity.reasons,
      suggestion: '请认真对待每一次模拟面试，给出你真实水平的回答。即使是"不太确定"也要用自己的理解来表达，这样才能获得有意义的反馈。',
    };
  }

  // === 多因子分析 ===
  const structureScore = analyzeStructureTS(content);
  const quantScore = analyzeQuantificationTS(content);
  const termScore = analyzeTerminologyTS(content);
  const coherenceScore = analyzeCoherenceTS(content);
  const lengthScore = evaluateLengthTS(len);

  const rawContent = quantScore * 0.35 + termScore * 0.40 + lengthScore * 0.25;
  const rawLogic = structureScore * 0.45 + coherenceScore * 0.40 + lengthScore * 0.15;
  const rawDepth = termScore * 0.55 + quantScore * 0.25 + coherenceScore * 0.20;
  const rawStar = structureScore * 0.60 + coherenceScore * 0.25 + lengthScore * 0.15;
  const rawExpr = coherenceScore * 0.45 + structureScore * 0.30 + lengthScore * 0.25;

  const jitter = () => Math.floor(Math.random() * 6) - 3;
  const contentScore = clamp(rawContent + jitter());
  const logicScore = clamp(rawLogic + jitter());
  const depthScore = clamp(rawDepth + jitter());
  const starScore = clamp(rawStar + jitter());
  const expressionScore = clamp(rawExpr + jitter());
  const overall = Math.round((contentScore + logicScore + depthScore + starScore + expressionScore) / 5);

  // 分层反馈
  const tier = overall >= 85 ? 'excellent' : overall >= 70 ? 'good' : overall >= 50 ? 'average' : 'poor';

  const strengthPool: Record<string, string[]> = {
    excellent: ['STAR法则运用完整，结构清晰', '包含具体量化数据和指标，说服力强', '展现了深入的技术理解和分析能力', '语言表达流畅自信，逻辑层层递进', '能结合实际场景举例，实践能力强', '对核心概念理解精准，专业术语运用得当'],
    good: ['回答框架清晰，能抓住问题核心', '对关键概念理解准确，基础扎实', '能结合实际工作场景回答问题', '语言表达较为流畅，有一定条理', '展现了独立思考能力', '对问题理解到位，没明显跑题'],
    average: ['基本概念方向大致正确', '尝试用自己的语言组织回答', '回答中有一些实际经验的体现'],
    poor: [],
  };
  const weaknessPool: Record<string, string[]> = {
    excellent: ['可以更多地从业务价值角度阐述方案意义', '可进一步延伸到行业趋势和技术演进'],
    good: ['缺少量化数据支撑，建议用具体指标增强说服力', '可深入阐述技术选型的权衡依据', 'STAR法则运用不够完整', '对边界情况的考虑不够充分', '部分表述偏笼统，建议更具体'],
    average: ['缺少量化数据支撑和实践细节', '建议使用STAR法则组织回答', '缺乏对技术原理的深入解释', '回答内容偏短，核心观点未充分展开', '关键概念表述不够准确'],
    poor: ['回答内容严重不足', '核心概念理解有误，需要重新学习', '回答与问题关联度低', '缺乏最基本的逻辑结构', '建议从基础知识开始系统学习'],
  };
  const suggestionPool: Record<string, string[]> = {
    excellent: ['可尝试从更高维度思考技术决策的战略意义', '准备一些极端场景案例来展现应变能力'],
    good: ['结合具体项目中的量化指标强化说服力', '用STAR法则重新组织核心项目经历', '深入思考技术方案的设计原理和权衡', '准备几个技术难点攻坚的案例'],
    average: ['每天花30分钟进行模拟问答练习', '准备2-3个有代表性的项目案例按STAR法则组织', '深入学习1-2个核心技术领域的底层原理', '尝试用数据和量化指标总结你的技术经验'],
    poor: ['建议系统学习该岗位要求的基础知识', '多阅读优秀面经了解面试考察维度', '找一个有经验的前辈做模拟面试指导', '通过实际做项目来积累真实经验'],
  };

  const strengthCount = overall >= 85 ? 3 : overall >= 70 ? 2 : overall >= 40 ? 1 : 0;
  const weaknessCount = overall >= 85 ? 1 : overall >= 70 ? 2 : overall >= 40 ? 3 : 4;

  return {
    overallScore: overall,
    strengths: pickN(strengthPool[tier] || [], strengthCount),
    weaknesses: pickN(weaknessPool[tier] || [], weaknessCount),
    suggestion: pickOne(suggestionPool[tier] || suggestionPool.average),
  };
}

// ========== 内容有效性检测 ==========
interface ValidityResult { isValid: boolean; suggestedScore: number; reasons: string[] }

function checkContentValidity(content: string): ValidityResult {
  if (content.length === 0) {
    return { isValid: false, suggestedScore: 0, reasons: ['未提交任何回答内容'] };
  }
  if (content.length < 5) {
    return { isValid: false, suggestedScore: 5, reasons: ['回答内容过短，几乎没有实质性信息'] };
  }

  // 检测是否全是重复字符（如 "aaaaaaa"）
  const uniqueChars = new Set(content).size;
  if (content.length >= 8 && uniqueChars <= 2) {
    return { isValid: false, suggestedScore: 3, reasons: ['回答为无意义的重复字符，请认真作答'] };
  }
  if (content.length >= 6 && uniqueChars <= 1) {
    return { isValid: false, suggestedScore: 0, reasons: ['回答为单一字符重复，完全是无效输入'] };
  }

  // 检测键盘随机敲击模式（如 "asdfghjkl" "qwertyuiop"）
  const keyboardPatterns = ['asdfgh', 'qwerty', 'zxcvbn', 'asdfghjkl', 'qwertyuiop', 'hjkl', 'fdsa', 'qazwsx', 'wsxedc', 'rfvtgb', 'yhnujm', 'qweasd', 'zxcvasdf', '123456', 'abcdef', 'aaaaa', 'bbbbb', 'abcde', 'qwert'];
  const lower = content.toLowerCase().replace(/\s/g, '');
  for (const pattern of keyboardPatterns) {
    if (lower.includes(pattern) && lower.length < 30) {
      return { isValid: false, suggestedScore: 8, reasons: ['检测到键盘随机敲击模式，请认真输入你的真实回答'] };
    }
  }

  // 检测是否全是无意义的英文乱敲
  if (content.length < 30) {
    const chineseCount = (content.match(/[一-鿿]/g) || []).length;
    const englishCount = (content.match(/[a-zA-Z]/g) || []).length;
    // 如果只有英文且都是小写没有空格/标点 → 可能是乱敲
    if (chineseCount === 0 && englishCount >= 5) {
      const hasSpaces = content.includes(' ');
      const hasPunctuation = /[.,!?;:'"()]/.test(content);
      const hasUpperCase = /[A-Z]/.test(content);
      const wordLike = /[a-z]{2,}/g;
      const words = content.match(wordLike) || [];
      // 真正的英文回答会有空格、标点、大小写、真实单词
      if (!hasSpaces && !hasPunctuation && !hasUpperCase && words.length <= 2) {
        // 检查是否有真实的英文单词
        const commonWords = ['the', 'is', 'are', 'was', 'can', 'has', 'and', 'for', 'not', 'but', 'this', 'that', 'with', 'from', 'have', 'will', 'would', 'what', 'when', 'where', 'which', 'about', 'because', 'should', 'could', 'system', 'data', 'code', 'test', 'user', 'service', 'server', 'client', 'design', 'project', 'team', 'work', 'experience', 'develop', 'manage', 'implement', 'solution', 'problem', 'result', 'example', 'first', 'second', 'third', 'finally'];
        const wordCount = commonWords.filter(w => lower.includes(w)).length;
        if (wordCount === 0) {
          return { isValid: false, suggestedScore: 10, reasons: ['回答内容看起来像是无意义的键盘敲击，请用中文认真作答'] };
        }
      }
    }
  }

  return { isValid: true, suggestedScore: 0, reasons: [] };
}

// ========== 内容质量分析（TypeScript版） ==========
function clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))); }

function analyzeStructureTS(content: string): number {
  let score = 25;
  let starHits = 0;
  if (/背景|当时|之前|项目背景|业务场景|面临|所在团队|我们做|做了一/.test(content)) starHits++;
  if (/我的任务|目标|需要解决|负责|要求是|我的职责|要做的/.test(content)) starHits++;
  if (/我做了|采取|实施了|设计了|优化了|采用了|通过|实现了|开发了|搭建了/.test(content)) starHits++;
  if (/结果|最终|效果|提升了|降低了|达到了|完成了|上线了|取得了|带来了/.test(content)) starHits++;
  score += starHits * 15;
  if (/第一|首先|1\.|1、|1）/.test(content)) score += 8;
  if (/第二|其次|2\.|2、|2）/.test(content)) score += 7;
  if (/第三|最后|3\.|3、|3）/.test(content)) score += 5;
  if (/总结|综上所述|总的来说|概括来说|总体来看/.test(content)) score += 5;
  return clamp(score);
}

function analyzeQuantificationTS(content: string): number {
  let score = 15;
  const digits = (content.match(/\d/g) || []).length;
  if (digits >= 15) score += 35;
  else if (digits >= 8) score += 25;
  else if (digits >= 4) score += 15;
  else if (digits >= 2) score += 8;
  if (content.includes('%') || content.includes('百分之')) score += 15;
  if (/QPS|TPS|PV|UV|DAU|MAU|RT|P99|P95|吞吐量|并发量|响应时间/.test(content)) score += 15;
  if (/提升|降低|减少|增长|翻倍|倍|万|亿|千万|百万|十万/.test(content)) score += 10;
  if (/毫秒|ms|秒内|分钟|小时|天完成/.test(content)) score += 5;
  return clamp(score);
}

function analyzeTerminologyTS(content: string): number {
  let score = 10;
  const terms = ['缓存','分布式','集群','负载均衡','高可用','高并发','微服务','容器化','数据库','索引','事务','锁','线程','异步','消息队列','RPC','API','网关','限流','熔断','降级','幂等','扩容','监控','日志','链路追踪','CI/CD','DevOps','重构','设计模式','算法','时间复杂度','单元测试','性能优化','JVM','内存管理','垃圾回收','多线程','并发编程','Linux','Docker','Kubernetes','TCP','HTTP','HTTPS','DNS','Redis','MySQL','Spring','Spring Boot','微服务','React','Vue','TypeScript','SQL','NoSQL'];
  let termCount = 0;
  for (const t of terms) { if (content.toLowerCase().includes(t.toLowerCase())) termCount++; }
  if (termCount >= 10) score += 55;
  else if (termCount >= 7) score += 42;
  else if (termCount >= 5) score += 30;
  else if (termCount >= 3) score += 18;
  else if (termCount >= 1) score += 8;
  return clamp(score);
}

function analyzeCoherenceTS(content: string): number {
  let score = 20;
  if (/因为|所以|因此|由于|导致|原因是|源于|根本原因/.test(content)) score += 12;
  if (/但是|然而|不过|虽然|尽管|另一方面|反过来说|但要注意/.test(content)) score += 8;
  if (/比如|例如|具体来说|举例|举个例子|打个比方/.test(content)) score += 8;
  if (/而且|此外|同时|另外|还有|更重要的是|不仅如此/.test(content)) score += 7;
  if (/首先|其次|然后|接着|之后|最后|接下来|下一步/.test(content)) score += 10;
  if (/相比|相比之下|相对于|比起|比直接|优于|不如/.test(content)) score += 8;
  if (/如果|假如|假设|倘若|一旦|万一|极端情况下/.test(content)) score += 7;
  return clamp(score);
}

function evaluateLengthTS(len: number): number {
  if (len >= 500) return 95;
  if (len >= 350) return 87;
  if (len >= 250) return 78;
  if (len >= 150) return 60;
  if (len >= 80) return 42;
  if (len >= 30) return 25;
  if (len > 0) return 10;
  return 0;
}

function pickN<T>(arr: T[], n: number): T[] {
  if (n <= 0 || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
