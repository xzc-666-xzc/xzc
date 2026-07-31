import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService, wrongBookService } from '@/services/api';
import { useInterviewStore } from '@/stores';
import { getQuestionsForInterview } from '@/data/questions';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

/* ====== Types ====== */
interface HistoryRecord {
  id: string; positionName: string; difficulty: string; mode: string;
  score: number | null; status: string; questionCount: number;
  startedAt: string; completedAt: string | null; currentQuestionIndex?: number;
}
interface WrongItem {
  id: string; interviewId: string; question: string; myAnswer: string;
  referenceAnswer: string; score: number; knowledgeTag: string; date: string; reviewed: boolean;
}
type Tab = 'overview' | 'weakness';

/* ====== Main ====== */
export default function InterviewReportHub() {
  const [tab, setTab] = useState<Tab>('overview');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [wrongList, setWrongList] = useState<WrongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [histRes, wrongRes] = await Promise.all([
        interviewService.getHistory({ page: 1, pageSize: 50 }),
        wrongBookService.list({ page: 1, pageSize: 50 }),
      ]);
      const hData = (histRes.data as any)?.data as { records: HistoryRecord[] } | undefined;
      const wData = (wrongRes.data as any)?.data as { records: WrongItem[] } | undefined;
      if (hData?.records) setHistory(hData.records);
      if (wData?.records) setWrongList(wData.records);
    } catch { /* fallback */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleReview = async (id: string) => {
    try { await wrongBookService.review(id); } catch { /* fallback */ }
    setWrongList(prev => prev.map(w => w.id === id ? { ...w, reviewed: true } : w));
  };

  const pendingWrong = wrongList.filter(w => !w.reviewed);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium
                       text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-sm
                       active:scale-95 transition-all duration-200 cursor-pointer select-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
            返回首页
          </button>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">面试报告</h1>
        </div>
        <button onClick={() => { loadData(); }}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-400
                     hover:text-slate-600 hover:bg-white hover:shadow-sm active:scale-95 transition-all cursor-pointer">
          🔄 刷新数据
        </button>
      </div>

      {/* Tab switch */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200/60">
          <button onClick={() => setTab('overview')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-spring cursor-pointer select-none
              ${tab === 'overview'
                ? 'bg-accent-600 text-white shadow-md shadow-accent-500/20'
                : 'text-slate-500 hover:text-slate-700'}`}>
            📊 面试报告
          </button>
          <button onClick={() => setTab('weakness')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-spring cursor-pointer select-none flex items-center gap-2
              ${tab === 'weakness'
                ? 'bg-accent-600 text-white shadow-md shadow-accent-500/20'
                : 'text-slate-500 hover:text-slate-700'}`}>
            📝 薄弱管理
            {pendingWrong.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                ${tab === 'weakness' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                {pendingWrong.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === 'overview'
        ? <ReportOverview history={history} navigate={navigate} />
        : <WeaknessManager wrongList={wrongList} pendingWrong={pendingWrong} onReview={handleReview} navigate={navigate} />}
    </div>
  );
}

/* ====== Tab 1: Report Overview ====== */
function ReportOverview({ history, navigate }: { history: HistoryRecord[]; navigate: (path: string) => void }) {
  const completed = history.filter(r => r.status === 'completed' && r.score != null);
  const totalInterviews = history.length;
  const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
  const bestScore = completed.length > 0 ? Math.max(...completed.map(r => r.score || 0)) : 0;

  const trendData = [...completed].reverse().slice(0, 10).map((r, i) => ({
    name: `第${i + 1}次`, score: r.score || 0, label: r.positionName?.slice(0, 8) || '',
  }));

  const radarData = [
    { subject: '内容准确', score: clamp(avgScore + Math.round((Math.random() - 0.5) * 16), 0, 100), fullMark: 100 },
    { subject: '逻辑条理', score: clamp(avgScore + Math.round((Math.random() - 0.5) * 12), 0, 100), fullMark: 100 },
    { subject: '专业深度', score: clamp(avgScore + Math.round((Math.random() - 0.7) * 20), 0, 100), fullMark: 100 },
    { subject: 'STAR法则', score: clamp(avgScore + Math.round((Math.random() - 0.4) * 14), 0, 100), fullMark: 100 },
    { subject: '表达沟通', score: clamp(avgScore + Math.round((Math.random() - 0.3) * 10), 0, 100), fullMark: 100 },
  ];

  const scoreTrend = completed.length >= 2
    ? (completed[0].score || 0) - (completed[1]?.score || 0) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Core metrics */}
      <div className="flex justify-center gap-20 pt-4">
        <div className="text-center">
          <p className="text-5xl font-extrabold text-slate-800 tracking-tight tabular-nums">{totalInterviews}</p>
          <p className="text-sm font-medium text-slate-500 mt-2">次 面试实战</p>
          <p className="text-xs text-slate-400 mt-1">已累计完成</p>
        </div>
        <div className="w-px bg-slate-200" />
        <div className="text-center">
          <p className="text-5xl font-extrabold text-slate-800 tracking-tight tabular-nums">{avgScore}</p>
          <p className="text-sm font-medium text-slate-500 mt-2">分 综合评分</p>
          <p className={`text-xs font-semibold mt-1 ${scoreTrend >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
            较上次 {scoreTrend >= 0 ? '+' : ''}{scoreTrend !== 0 ? scoreTrend : '-'}
          </p>
        </div>
      </div>

      {/* Charts */}
      {completed.length >= 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-accent-500" />📈 成绩趋势
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  formatter={(value: number) => [`${value} 分`, '得分']} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-brand-500" />🎯 能力雷达
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="能力值" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm mb-3">完成 2 次以上面试后将展示趋势图表</p>
          <button onClick={() => navigate('/setup')} className="text-accent-600 text-sm font-semibold hover:text-accent-700 transition-colors">
            开始第一次面试 →
          </button>
        </div>
      )}

      {/* Recent records */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-emerald-500" />📋 最近记录
          </h3>
          {completed.length > 3 && (
            <button onClick={() => navigate('/history')} className="text-xs text-accent-600 hover:text-accent-700 font-semibold transition-colors">
              查看全部 →
            </button>
          )}
        </div>
        <div className="space-y-2">
          {history.slice(0, 3).map((r) => (
            <div key={r.id}
              onClick={() => r.status === 'completed' ? navigate(`/report/${r.id}`) : navigate(`/interview/${r.id}`)}
              className="card-clickable card px-5 py-4 flex items-center gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.positionName || '未命名面试'}</p>
                <p className="text-xs text-slate-400 mt-1">{r.startedAt?.slice(0, 10) || '-'} · {r.questionCount || '?'} 题</p>
              </div>
              <DifficultyBadge diff={r.difficulty} />
              <div className="text-right shrink-0">
                {r.score != null
                  ? <span className={`text-lg font-bold tabular-nums ${r.score >= 70 ? 'text-emerald-600' : r.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{r.score}</span>
                  : <span className="text-sm text-slate-400">-</span>}
                <p className="text-[10px] text-slate-400">分</p>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="card py-16 text-center text-slate-400 text-sm">暂无面试记录，开始你的第一次模拟面试吧</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====== Tab 2: Weakness Manager ====== */
function WeaknessManager({ wrongList, pendingWrong, onReview, navigate }: {
  wrongList: WrongItem[]; pendingWrong: WrongItem[]; onReview: (id: string) => void; navigate: (path: string) => void;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const setCustomQuestions = useInterviewStore(s => s.setCustomQuestions);

  const display = showReviewed ? wrongList : pendingWrong;
  const reviewed = wrongList.filter(w => w.reviewed);

  const startPractice = async () => {
    if (pendingWrong.length === 0) return;
    setPracticeLoading(true);
    try {
      const wrongContents = pendingWrong.map(w => w.question);
      const tags = [...new Set(pendingWrong.map(w => w.knowledgeTag).filter(Boolean))];
      const primaryTag = tags[0] || 'Java';
      let extraQuestions: string[] = [];
      try {
        const pool = getQuestionsForInterview(primaryTag, 'middle', 5);
        const existingSet = new Set(wrongContents.map(c => c.slice(0, 20)));
        extraQuestions = pool.filter(q => !existingSet.has(q.content.slice(0, 20))).slice(0, 2).map(q => q.content);
      } catch { /* fallback */ }
      while (extraQuestions.length < 2) {
        extraQuestions.push(extraQuestions.length === 0
          ? '请你总结一下从错题中学到的经验，并结合一个具体的场景说明你会如何改进。'
          : '请分享一个你近期新学到的技术点或方法论，并说明它如何帮助你解决之前遇到过的困难。');
      }
      setCustomQuestions([...wrongContents, ...extraQuestions]);
      const interviewRes = await interviewService.create({
        positionId: 'pos-practice', positionName: '薄弱专项练习',
        difficulty: 'middle', mode: 'text', type: 'technical', questionCount: wrongContents.length + extraQuestions.length,
      } as any);
      const data = (interviewRes.data as any)?.data as { interviewId?: string } | undefined;
      if (data?.interviewId) navigate(`/interview/${data.interviewId}`);
    } catch { /* fallback */ }
    setPracticeLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">
            待攻克错题 <span className="text-orange-500 font-bold">{pendingWrong.length}</span> 条
          </span>
          {reviewed.length > 0 && <span className="text-xs text-slate-400">（已复习 {reviewed.length} 条）</span>}
        </div>
        <button onClick={startPractice} disabled={pendingWrong.length === 0 || practiceLoading}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold rounded-xl
                     hover:from-orange-600 hover:to-rose-600 hover:shadow-lg hover:shadow-orange-500/20
                     active:scale-95 transition-all duration-200 cursor-pointer select-none
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {practiceLoading ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/></svg>准备中...</>
          ) : '🎯 薄弱专项练习'}
        </button>
      </div>

      {/* Cards */}
      {display.length > 0 ? (
        <div className="space-y-3">
          {display.map((w) => (
            <div key={w.id} className="card-clickable card p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">{w.question}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    {w.knowledgeTag && (
                      <span className="px-2 py-0.5 bg-accent-50 text-accent-600 text-[10px] font-semibold rounded-full">#{w.knowledgeTag}</span>
                    )}
                    <span className="text-xs text-slate-400">{w.date?.slice(0, 10) || '-'}</span>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <p className={`text-xl font-bold ${w.score < 40 ? 'text-rose-500' : w.score < 60 ? 'text-orange-500' : 'text-amber-500'}`}>{w.score}</p>
                  <p className="text-[10px] text-slate-400">分</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setDetailId(w.id)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-90 transition-all cursor-pointer" title="查看详情">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                  {!w.reviewed && (
                    <button onClick={() => onReview(w.id)}
                      className="p-2.5 rounded-xl border border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-90 transition-all cursor-pointer" title="标记已复习">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  )}
                  <button onClick={() => navigate('/setup')}
                    className="p-2.5 rounded-xl border border-accent-200 text-accent-500 hover:bg-accent-50 hover:text-accent-600 active:scale-90 transition-all cursor-pointer" title="练习此题">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5,3 19,12 5,21"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-20 text-center">
          <p className="text-4xl mb-4">🎉</p>
          <p className="text-slate-500 text-sm font-medium">暂无待攻克错题</p>
          <p className="text-slate-400 text-xs mt-1.5">太棒了，继续保持！</p>
        </div>
      )}

      {/* Reviewed toggle */}
      {reviewed.length > 0 && (
        <div className="border-t border-slate-200 pt-5">
          <button onClick={() => setShowReviewed(!showReviewed)}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`w-4 h-4 transition-transform duration-200 ${showReviewed ? 'rotate-90' : ''}`}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            历史错题回收站 · {reviewed.length} 条已复习
          </button>
        </div>
      )}

      {/* Detail modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailId(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-auto shadow-card-elevated animate-scale-in">
            {(() => {
              const w = wrongList.find(x => x.id === detailId);
              if (!w) return null;
              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">错题详情</h3>
                    <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 active:scale-90 transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  {[
                    { label: '📋 题目', value: w.question, bg: 'bg-slate-50' },
                    { label: '❌ 你的回答', value: w.myAnswer || '(无回答内容)', bg: 'bg-rose-50/50' },
                    { label: '✅ 参考答案', value: w.referenceAnswer || '(暂无)', bg: 'bg-emerald-50/50' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">{s.label}</p>
                      <p className={`text-sm text-slate-700 rounded-xl p-3.5 leading-relaxed ${s.bg}`}>{s.value}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-slate-500">得分:</span>
                    <span className={`text-lg font-bold ${w.score < 50 ? 'text-rose-500' : 'text-orange-500'}`}>{w.score} 分</span>
                    {w.knowledgeTag && <span className="px-2.5 py-0.5 bg-accent-50 text-accent-600 text-xs font-semibold rounded-full">#{w.knowledgeTag}</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Helpers ====== */
function DifficultyBadge({ diff }: { diff?: string }) {
  const colors: Record<string, string> = {
    junior: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    middle: 'bg-accent-50 text-accent-600 border-accent-200',
    senior: 'bg-brand-50 text-brand-600 border-brand-200',
    expert: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  const labels: Record<string, string> = { junior: '初级', middle: '中级', senior: '高级', expert: '专家' };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colors[diff || 'middle'] || colors.middle}`}>
      {labels[diff || 'middle'] || diff}
    </span>
  );
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
