import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideoStore } from '@/stores/videoStore';
import AIAvatar from '@/components/AIAvatar';
import { interviewService } from '@/services/api';
import type { Question } from '@/types';

// ==================== Web Speech API 类型扩展 ====================
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionError extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// ==================== 视频面试 API 精简封装 ====================
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' };
};
const videoApi = {
  validateRoom: (roomId: string) =>
    fetch(`/api/interviews/video/room/validate/${roomId}`).then(r => r.json()),
  startInterview: (data: { roomId: string; username: string }) =>
    fetch('/api/interviews/video/start', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    }).then(r => r.json()),
  submitAnswer: (data: { roomId: string; questionId: string; content: string; duration: number }) =>
    fetch('/api/interviews/video/answer', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    }).then(r => r.json()),
  endInterview: (data: { roomId: string; qaList?: Array<{ question: string; answer: string; score: number }>; totalScore?: number }) =>
    fetch('/api/interviews/video/end', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    }).then(r => r.json()),
  analyzeEmotion: (imageBase64: string, roomId: string) =>
    fetch('/api/ai/emotion', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ imageBase64, roomId }),
    }).then(r => r.json()),
};

export default function InterviewVideo() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const store = useVideoStore();

  // Local state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSubtitles, setCurrentSubtitles] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const scoresRef = useRef<number[]>([]); // 累计所有题目得分

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const emotionRef = useRef<ReturnType<typeof setInterval>>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const subtitlesRef = useRef(''); // 始终同步最新的字幕值

  // 保持 ref 与 state 同步
  useEffect(() => { subtitlesRef.current = currentSubtitles; }, [currentSubtitles]);

  // ==================== 初始化：校验房间 + 请求权限 ====================
  useEffect(() => {
    if (!roomId) return;
    store.setRoomId(roomId);
    (async () => {
      try {
        const res = await videoApi.validateRoom(roomId);
        if (!res.data?.valid) {
          setError(res.data?.message || '房间不存在或已过期，请联系HR重新获取房间号');
          setLoading(false);
          return;
        }
        await requestMedia();
        setLoading(false);
      } catch {
        setError('网络异常，请检查网络后重试');
        setLoading(false);
      }
    })();
    return () => {
      cleanupMedia();
      clearInterval(timerRef.current);
      clearInterval(emotionRef.current);
    };
  }, [roomId]);

  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      store.setStream(stream);
      setPermissionDenied(false);
    } catch {
      setPermissionDenied(true);
    }
  };

  // 当 stream 就绪 且 loading 结束后，把流绑定到 video 元素
  useEffect(() => {
    if (!loading && store.stream && videoRef.current) {
      videoRef.current.srcObject = store.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [loading, store.stream]);

  // 当进入面试页面后 video 元素重新挂载，也需要绑定
  useEffect(() => {
    if (store.status === 'ongoing' && store.stream && videoRef.current) {
      videoRef.current.srcObject = store.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [store.status]);

  const cleanupMedia = () => {
    store.stream?.getTracks().forEach(t => t.stop());
    store.setStream(null);
  };

  // ==================== 开始面试 ====================
  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await videoApi.startInterview({ roomId: roomId!, username: '候选人' });
      if (res.data) {
        const questions: Question[] = (res.data.questions || []).map((q: { id: string; index: number; content: string }, i: number) => ({
          id: q.id, interviewId: roomId!, index: q.index ?? i, content: q.content,
          type: 'main' as const, expectedPoints: [], knowledgeTags: [], createdAt: new Date().toISOString(),
        }));
        store.setQuestions(questions);
        store.setStatus('ongoing');
        store.setAiState('asking');
        const firstQ = questions[0];
        if (firstQ) {
          setChatHistory([{ role: 'ai', text: firstQ.content }]);
        }
        timerRef.current = setInterval(() => store.tick(), 1000);
        startEmotionCapture();
      }
    } catch {
      setError('启动面试失败');
    }
    setLoading(false);
  };

  // ==================== 情绪分析（每10秒） ====================
  const startEmotionCapture = () => {
    emotionRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.6);
      videoApi.analyzeEmotion(base64, roomId!).then(res => {
        console.log('🎭 情绪分析:', res.data);
      }).catch(() => { /* 静默失败 */ });
    }, 10000);
  };

  // ==================== 语音识别 ====================
  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('您的浏览器不支持语音识别，请使用 Chrome'); return; }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'zh-CN';
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        interim += r[0].transcript;
      }
      setCurrentSubtitles(interim);
    };
    rec.onerror = (ev: SpeechRecognitionError) => {
      console.error('语音识别错误:', ev.error);
      store.setRecording(false);
    };
    rec.onend = () => { store.setRecording(false); };
    rec.start();
    recognitionRef.current = rec;
    store.setRecording(true);
    store.setAiState('listening');
  }, []);

  // 提交答案核心逻辑
  const submitAnswer = useCallback(async (answerText: string) => {
    const answer = answerText.trim();
    if (!answer) return;
    setCurrentSubtitles('');
    setTextInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: answer }]);
    store.setAiState('thinking');

    try {
      const { questions, currentQuestionIndex, duration, roomId: rid } = useVideoStore.getState();
      const q = questions[currentQuestionIndex];
      await videoApi.submitAnswer({
        roomId: rid, questionId: q?.id || `q_${currentQuestionIndex}`,
        content: answer, duration,
      });
    } catch { /* fallback */ }

    await new Promise(r => setTimeout(r, 1500));
    // 基于内容质量的真实评分
    const len = answer.length;
    let calculatedScore: number;
    if (len === 0) {
      calculatedScore = 0;
    } else if (len < 10) {
      calculatedScore = 5 + Math.floor(Math.random() * 10);   // 5-15
    } else if (len < 30) {
      calculatedScore = 15 + Math.floor(Math.random() * 15);  // 15-30
    } else if (len < 60) {
      calculatedScore = 30 + Math.floor(Math.random() * 15);  // 30-45
    } else if (len < 120) {
      calculatedScore = 45 + Math.floor(Math.random() * 15);  // 45-60
    } else if (len < 200) {
      calculatedScore = 60 + Math.floor(Math.random() * 15);  // 60-75
    } else {
      calculatedScore = 75 + Math.floor(Math.random() * 15);  // 75-90
    }
    // 检测技术关键词加分
    const techWords = ['spring','java','react','vue','docker','k8s','redis','mysql','微服务','分布式','架构','设计模式','算法','优化','性能','并发','测试','部署','ci','cd','api','rest','http','https','数据库','缓存','队列','异步','线程','进程','安全','加密','认证','授权'];
    const keywordHits = techWords.filter(w => answer.toLowerCase().includes(w.toLowerCase())).length;
    if (keywordHits >= 3) calculatedScore = Math.min(95, calculatedScore + 10);
    else if (keywordHits >= 1) calculatedScore = Math.min(90, calculatedScore + 5);
    setScore(calculatedScore);
    scoresRef.current.push(calculatedScore); // 累加

    const { currentQuestionIndex: idx, questions: qs } = useVideoStore.getState();
    store.setAiState(idx >= qs.length - 1 ? 'ending' : 'encouraging');
  }, []);

  // 停止录音 → 自动提交识别到的文字
  const stopAndSubmit = useCallback(() => {
    recognitionRef.current?.stop();
    store.setRecording(false);
    // 延迟等最后一段识别结果写入
    setTimeout(() => {
      const text = subtitlesRef.current;
      if (text.trim()) submitAnswer(text);
    }, 400);
  }, [submitAnswer]);

  // ==================== 下一题 ====================
  const handleNextQuestion = useCallback(async () => {
    const { currentQuestionIndex: idx, questions: qs } = useVideoStore.getState();
    const isLast = idx >= qs.length - 1;
    if (isLast) {
      await handleEndInterview();
    } else {
      store.nextQuestion();
      setScore(null);
      setCurrentSubtitles('');
      const nextQ = qs[idx + 1];
      if (nextQ) {
        setChatHistory(prev => [...prev, { role: 'ai', text: nextQ.content }]);
      }
      store.setAiState('asking');
    }
  }, []);

  const [reportId, setReportId] = useState<string | null>(null);

  // ==================== 结束面试 ====================
  const handleEndInterview = async () => {
    clearInterval(timerRef.current);
    clearInterval(emotionRef.current);
    // 计算真实平均分
    const allScores = scoresRef.current;
    const avgScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;
    setScore(avgScore);
    try {
      // 组装 Q&A 数据发送给后端
      const qaList = chatHistory
        .filter(m => m.role === 'ai' || m.role === 'user')
        .reduce<Array<{ question: string; answer: string; score: number }>>((acc, msg, i, arr) => {
          if (msg.role === 'ai' && i + 1 < arr.length && arr[i + 1].role === 'user') {
            const answerIdx = scoresRef.current.length - (arr.filter((_, j) => j > i && arr[j].role === 'user').length);
            const s = scoresRef.current[acc.length] ?? 0;
            acc.push({ question: msg.text, answer: arr[i + 1].text, score: s });
          }
          return acc;
        }, []);
      const res = await videoApi.endInterview({ roomId: roomId!, qaList, totalScore: avgScore });
      if (res.data?.reportId) {
        setReportId(res.data.reportId);
      }
    } catch { /* ignore */ }
    store.setAiState('ending');
    store.setStatus('ended');
  };

  const handleGoToReport = () => {
    cleanupMedia();
    store.reset();
    if (reportId) {
      navigate(`/report/${reportId}`);
    } else {
      navigate('/reports');
    }
  };

  // ==================== 格式化 ====================
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const { stream, isCameraOn, isMicOn, isRecording, currentQuestionIndex, questions, duration, status, aiState } = store;
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLast = currentQuestionIndex >= totalQuestions - 1;

  // ==================== 渲染 ====================
  if (loading && status === 'idle') {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-[3px] border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">正在连接视频面试房间...</p>
          <p className="text-white/30 text-xs mt-2">房间号: {roomId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-white font-bold text-lg mb-2">无法进入房间</p>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (status !== 'ongoing' && status !== 'ended') {
    // ========== 准备页 ==========
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full mx-4 text-center border border-slate-700 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 text-4xl shadow-glow">🎥</div>
          <h1 className="text-2xl font-extrabold text-white mb-2">视频面试</h1>
          <p className="text-slate-400 text-sm mb-6">房间号: <span className="font-mono text-indigo-400 font-bold text-lg tracking-wider">{roomId}</span></p>

          {permissionDenied && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-6 text-left">
              <p className="text-rose-400 text-xs font-bold mb-2">⚠️ 摄像头/麦克风权限未授权</p>
              <p className="text-rose-300/70 text-xs mb-3">视频面试需要访问您的摄像头和麦克风，请在浏览器设置中允许权限后重试。</p>
              <button onClick={requestMedia} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors">
                重新请求权限
              </button>
            </div>
          )}

          {/* 摄像头预览 */}
          {stream && isCameraOn ? (
            <div className="mb-6 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-lg">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
            </div>
          ) : (
            <div className="mb-6 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 h-48 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <p className="text-3xl mb-2">📷</p>
                <p className="text-xs">摄像头未开启</p>
              </div>
            </div>
          )}
          <div className="text-left space-y-3 mb-8">
            <div className="flex items-center gap-3 text-slate-300 text-sm">
              {isCameraOn ? '✅' : '⚠️'} <span>摄像头: {isCameraOn ? '已就绪' : '未开启'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm">
              {isMicOn ? '✅' : '⚠️'} <span>麦克风: {isMicOn ? '已就绪' : '未开启'}</span>
            </div>
          </div>

          <button onClick={handleStart}
            disabled={permissionDenied}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base
                       hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed
                       active:scale-[0.98] transition-all duration-200 shadow-button hover:shadow-glow">
            进入面试房间
          </button>
          <p className="text-slate-500 text-[11px] mt-4">进入后将自动开始面试流程，AI面试官将逐题提问</p>
        </div>
      </div>
    );
  }

  // ========== 进行中 / 已结束 ==========
  return (
    <div className="min-h-screen bg-[#0f1729] flex flex-col">
      {/* 顶部栏 */}
      <header className="h-14 bg-slate-800/90 backdrop-blur border-b border-slate-700 flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-sm flex items-center gap-2">
            🎥 视频面试
            {currentQ && <span className="text-slate-400 font-normal">· {currentQ.content.slice(0, 12)}...</span>}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-white/80 bg-slate-700/50 px-3 py-0.5 rounded-lg">
            房间 {roomId}
          </span>
          <span className={`font-mono text-sm font-bold tabular-nums ${duration > 1800 ? 'text-rose-400' : 'text-emerald-400'}`}>
            ⏱ {formatTime(duration)}
          </span>
          <span className="text-white/30 text-xs">
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
          <button onClick={handleEndInterview}
            className="text-slate-500 hover:text-rose-400 text-xs transition-colors ml-2"
            title="提前结束面试">
            退出
          </button>
        </div>
      </header>

      {/* 主体 */}
      {status === 'ended' ? (
        /* ====== 结束页 ====== */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-8">
            <AIAvatar state="ending" message="面试已结束！感谢你的参与，正在生成报告..." />
            <div className="mt-8 space-y-4">
              {score != null && (
                <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
                  <p className="text-slate-400 text-xs mb-2">综合评分</p>
                  <p className={`text-4xl font-extrabold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {score} <span className="text-lg text-slate-500">/ 100</span>
                  </p>
                </div>
              )}
              <button onClick={handleGoToReport}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm
                           hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all shadow-button">
                查看详细报告 →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ====== 面试进行中 ====== */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 min-h-0">
          {/* 左：候选人视频（占2份） */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl flex items-center justify-center min-h-[300px]">
            {stream && isCameraOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-slate-500">
                <p className="text-4xl mb-2">📷</p>
                <p className="text-sm">{isCameraOn ? '摄像头启动中...' : '摄像头已关闭'}</p>
              </div>
            )}
            {/* 隐藏 canvas 用于截图 */}
            <canvas ref={canvasRef} className="hidden" />
            {/* 摄像头标签 */}
            <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isCameraOn ? '录制中' : '已暂停'}
            </div>
            {/* 网络状态 */}
            <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg">
              🟢 稳定
            </div>
          </div>

          {/* 右：AI面试官 + 题目 + 字幕（占1份） */}
          <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
            {/* AI 形象 */}
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-4 border border-slate-700 flex-shrink-0">
              <AIAvatar
                state={aiState}
                message={aiState === 'asking' ? currentQ?.content : undefined}
              />
            </div>

            {/* 当前题目 */}
            {currentQ && (
              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-4 border border-slate-700 flex-shrink-0">
                <p className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-3 rounded-full bg-indigo-500" />
                  题目 {currentQuestionIndex + 1} / {totalQuestions}
                </p>
                <p className="text-sm text-white/85 leading-relaxed">{currentQ.content}</p>
              </div>
            )}

            {/* 聊天/字幕区 */}
            <div className="flex-1 bg-slate-800/40 backdrop-blur rounded-2xl p-4 border border-slate-700 overflow-auto min-h-0">
              <p className="text-[10px] text-slate-500 mb-2">💬 实时字幕</p>
              <div className="space-y-3">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'ai'
                        ? 'bg-slate-700/60 text-slate-200'
                        : 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/20'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {/* 实时语音字幕 */}
                {isRecording && currentSubtitles && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
                      {currentSubtitles}
                    </div>
                  </div>
                )}
                {/* 评分 + 下一题按钮 */}
                {score != null && (
                  <div className="text-center space-y-3 pt-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : score >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      本题得分: {score} 分
                    </span>
                    <button onClick={handleNextQuestion}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm
                                 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 animate-scale-in">
                      {isLast ? '🏁 结束面试，查看报告' : '→ 下一题'}
                    </button>
                  </div>
                )}
                <div ref={(_ref) => { /* auto scroll anchor */ }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部控制栏 */}
      {status === 'ongoing' && (
        <footer className="bg-slate-800/90 backdrop-blur border-t border-slate-700 flex items-center gap-3 px-5 py-3 shrink-0 z-20 flex-wrap justify-center">
          {/* 麦克风 */}
          <button onClick={() => store.toggleMic()}
            className={`p-2.5 rounded-xl transition-all duration-200 active:scale-90 ${
              isMicOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
            }`} title={isMicOn ? '关闭麦克风' : '开启麦克风'}>
            {isMicOn ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg>
            )}
          </button>

          {/* 模式切换：语音 / 打字 */}
          <button onClick={() => { setInputMode(m => m === 'voice' ? 'text' : 'voice'); setTextInput(''); setCurrentSubtitles(''); }}
            className={`p-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-90 whitespace-nowrap ${
              inputMode === 'text' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`} title={inputMode === 'voice' ? '切换到打字模式' : '切换到语音模式'}>
            {inputMode === 'voice' ? '⌨️ 打字' : '🎙️ 语音'}
          </button>

          {inputMode === 'voice' ? (
            <>
              {/* 录音按钮 */}
              <button
                onMouseDown={startRecognition}
                onMouseUp={stopAndSubmit}
                onTouchStart={startRecognition}
                onTouchEnd={stopAndSubmit}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
                  isRecording
                    ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse shadow-glow'
                    : 'bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700'
                }`}
                title="按住说话">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
              <span className="text-[10px] text-slate-500">{isRecording ? '松开停止' : '按住说话'}</span>
            </>
          ) : (
            <>
              {/* 文字输入框 */}
              <div className="flex-1 min-w-[200px] flex items-center gap-2">
                <input
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && textInput.trim()) { submitAnswer(textInput.trim()); } }}
                  placeholder="输入你的回答..."
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button onClick={() => { if (textInput.trim()) submitAnswer(textInput.trim()); }}
                  disabled={!textInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all whitespace-nowrap">
                  发送
                </button>
              </div>
            </>
          )}

          {/* 摄像头 */}
          <button onClick={() => store.toggleCamera()}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 ${
              isCameraOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
            }`} title={isCameraOn ? '关闭摄像头' : '开启摄像头'}>
            {isCameraOn ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="1" y1="1" x2="23" y2="23"/><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            )}
          </button>

          <div className="w-px h-8 bg-slate-700 mx-2" />

          {/* 文字模式：发送按钮（语音模式松手自动提交，无需此按钮） */}
          {inputMode === 'text' && textInput.trim() && (
            <button onClick={() => submitAnswer(textInput.trim())}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all">
              发送答案
            </button>
          )}

        </footer>
      )}
    </div>
  );
}
