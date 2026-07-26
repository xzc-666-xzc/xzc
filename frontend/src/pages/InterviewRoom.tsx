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
    if (config) questionPoolRef.current = getQuestionsForInterview(config.positionId, config.difficulty, config.questionCount - 1);
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
        const content = template ? template.content : '请继续回答下一道面试题。';
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
    <div className="h-full flex flex-col bg-[#0f1729] text-slate-200 interview-dark">
      <Watermark text={config?.positionName || '面试中'} />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/3 border-b border-white/8 shrink-0">
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
            className={`p-2 rounded-lg transition-colors ${showAIPanel ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/10 text-slate-400'}`}
            title="AI 助手面板">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/></svg>
          </button>
          <button onClick={handlePause} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors" title={isPaused ? '继续' : '暂停'}>
            {isPaused
              ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="5,3 19,12 5,21"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>}
          </button>
          <button onClick={() => setShowQuitModal(true)}
            className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors text-sm">退出</button>
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
              <div className="max-w-[80%] bg-white/6 rounded-2xl rounded-tl-sm px-5 py-4 border border-white/8">
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
              <div className="max-w-[80%] bg-white/6 rounded-2xl rounded-tl-sm px-5 py-4 border border-indigo-500/20">
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
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 mx-auto btn-glow">
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
        <div className="px-6 py-4 bg-white/2 border-t border-white/8 shrink-0">
          {/* 快捷短语 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {QUICK_REPLIES.map(phrase => (
              <button key={phrase} onClick={() => setCurrentInput(prev => prev + (prev ? ' ' : '') + phrase)}
                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 hover:bg-white/10 hover:text-slate-300 transition-colors">
                {phrase}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            {config?.mode === 'voice' && (
              <button onClick={handleVoiceToggle}
                className={`p-3 rounded-xl transition-colors shrink-0 ${isRecording ? 'bg-red-500 text-white' : 'bg-white/8 text-slate-300 hover:bg-white/15'}`}>
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
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 resize-none outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm disabled:opacity-40"
              />
              <span className="absolute bottom-2 right-3 text-xs text-slate-600">{currentInput.length} 字</span>
            </div>
            <button
              onClick={handleSubmitAnswer}
              disabled={!currentInput.trim() || aiThinking || isPaused}
              className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
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
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm">继续面试</button>
              <button onClick={handleQuit}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium border border-red-500/30">保存并退出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateFeedback(_question: Question, answer: string): Feedback {
  const len = answer.length;
  let baseScore = 60;
  if (len > 300) baseScore = 85; else if (len > 200) baseScore = 78; else if (len > 100) baseScore = 70; else if (len > 50) baseScore = 62; else baseScore = 50;
  const score = Math.min(98, baseScore + Math.floor(Math.random() * 10) - 5);
  const allStrengths = ['回答结构清晰，条理分明', '专业术语使用准确', '项目经验描述具体', '能够结合实际案例说明', '表达流畅，逻辑连贯', '对核心概念理解到位'];
  const allWeaknesses = ['缺少量化的数据支撑', '可以更深入阐述技术原理', '建议使用 STAR 法则组织回答', '部分表述略显笼统', '缺少对边界情况的思考', '可补充更多实践细节'];
  const suggestions = ['建议结合具体项目中的量化指标来强化说服力', '尝试用 STAR 法则重新组织回答', '深入思考技术方案背后的设计原理和权衡', '多准备几个技术难点的案例，展示解决问题的能力', '注意区分"知道"和"做过"——强调亲身实践经验', '在回答中体现出对行业最佳实践的了解'];
  return {
    overallScore: score,
    strengths: allStrengths.slice(score % 6, score % 6 + (score >= 80 ? 3 : 2)),
    weaknesses: allWeaknesses.slice(score % 6, score % 6 + (score >= 80 ? 1 : 3)),
    suggestion: suggestions[score % suggestions.length],
  };
}
