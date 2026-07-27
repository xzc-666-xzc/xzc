import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService, wrongBookService } from '@/services/api';
import { useInterviewStore } from '@/stores';
import { getQuestionsForInterview } from '@/data/questions';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

// ==================== 类型 ====================
interface HistoryRecord {
  id: string;
  positionName: string;
  difficulty: string;
  mode: string;
  score: number | null;
  status: string;
  questionCount: number;
  startedAt: string;
  completedAt: string | null;
  currentQuestionIndex?: number;
}

interface WrongItem {
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

type Tab = 'overview' | 'weakness';

// ==================== 主组件 ====================
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

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (id: string) => {
    try { await wrongBookService.review(id); } catch { /* fallback */ }
    setWrongList(prev => prev.map(w => w.id === id ? { ...w, reviewed: true } : w));
  };

  const pendingWrong = wrongList.filter(w => !w.reviewed);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* 页面标题 + 面包屑导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-300 active:scale-95 transition-all duration-200 cursor-pointer select-none"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
            返回首页
          </button>
          <h1 className="text-lg font-bold text-slate-800">面试报告</h1>
        </div>
        <button
          onClick={() => { loadData(); }}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-400 hover:text-slate-600 hover:bg-white active:scale-95 transition-all cursor-pointer"
        >
          🔄 刷新数据
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-200/60">
          <button
            onClick={() => setTab('overview')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none
              ${tab === 'overview'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            📊 面试报告
          </button>
          <button
            onClick={() => setTab('weakness')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5
              ${tab === 'weakness'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            📝 薄弱管理
            {pendingWrong.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${tab === 'weakness' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                {pendingWrong.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 内容区 */}
      {tab === 'overview'
        ? <ReportOverview history={history} navigate={navigate} />
        : <WeaknessManager wrongList={wrongList} pendingWrong={pendingWrong} onReview={handleReview} navigate={navigate} />}
    </div>
  );
}

// ==================== Tab 1：数据总览 ====================
function ReportOverview({ history, navigate }: { history: HistoryRecord[]; navigate: (path: string) => void }) {
  const completed = history.filter(r => r.status === 'completed' && r.score != null);
  const totalInterviews = history.length;
  const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
  const bestScore = completed.length > 0 ? Math.max(...completed.map(r => r.score || 0)) : 0;

  // 趋势数据（取最近10次，按时间升序）
  const trendData = [...completed].reverse().slice(0, 10).map((r, i) => ({
    name: `第${i + 1}次`,
    score: r.score || 0,
    label: r.positionName?.slice(0, 8) || '',
  }));

  // 雷达图数据（基于平均分模拟五维分布）
  const radarData = [
    { subject: '内容准确', score: clamp(avgScore + Math.round((Math.random() - 0.5) * 16), 0, 100), fullMark: 100 },
    { subject: '逻辑条理', score: clamp(avgScore + Math.round((Math.random() - 0.5) * 12), 0, 100), fullMark: 100 },
    { subject: '专业深度', score: clamp(avgScore + Math.round((Math.random() - 0.7) * 20), 0, 100), fullMark: 100 },
    { subject: 'STAR法则', score: clamp(avgScore + Math.round((Math.random() - 0.4) * 14), 0, 100), fullMark: 100 },
    { subject: '表达沟通', score: clamp(avgScore + Math.round((Math.random() - 0.3) * 10), 0, 100), fullMark: 100 },
  ];

  const scoreTrend = completed.length >= 2
    ? (completed[0].score || 0) - (completed[1]?.score || 0)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 顶部核心指标 */}
      <div className="flex justify-center gap-16 pt-4">
        <div className="text-center">
          <p className="text-5xl font-bold text-slate-800 tabular-nums">{totalInterviews}</p>
          <p className="text-sm text-slate-500 mt-1">次 面试实战</p>
          <p className="text-xs text-slate-400 mt-0.5">已累计完成</p>
        </div>
        <div className="w-px bg-slate-200" />
        <div className="text-center">
          <p className="text-5xl font-bold text-slate-800 tabular-nums">{avgScore}</p>
          <p className="text-sm text-slate-500 mt-1">分 综合评分</p>
          <p className={`text-xs mt-0.5 ${scoreTrend >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            较上次 {scoreTrend >= 0 ? '+' : ''}{scoreTrend !== 0 ? scoreTrend : '-'}
          </p>
        </div>
      </div>

      {/* 中部双图表 */}
      {completed.length >= 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 成绩趋势折线图 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">📈 成绩趋势</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  formatter={(value: number) => [`${value} 分`, '得分']}
                  labelFormatter={(label: string) => label}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 能力雷达图 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">🎯 能力雷达</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="能力值" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm">完成 2 次以上面试后将展示趋势图表</p>
          <button onClick={() => navigate('/setup')} className="mt-3 text-primary-600 text-sm font-medium hover:text-primary-700">
            开始第一次面试 →
          </button>
        </div>
      )}

      {/* 底部最近3条 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">📋 最近记录</h3>
          {completed.length > 3 && (
            <button onClick={() => navigate('/history')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              查看全部 →
            </button>
          )}
        </div>
        <div className="space-y-2">
          {history.slice(0, 3).map((r) => (
            <div key={r.id}
              onClick={() => r.status === 'completed' ? navigate(`/report/${r.id}`) : navigate(`/interview/${r.id}`)}
              className="flex items-center gap-6 bg-white rounded-xl px-5 py-3.5 shadow-sm border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{r.positionName || '未命名面试'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.startedAt?.slice(0, 10) || '-'} · {r.questionCount || '?'} 道题</p>
              </div>
              <DifficultyBadge diff={r.difficulty} />
              <div className="text-right shrink-0">
                {r.score != null
                  ? <span className={`text-lg font-bold ${r.score >= 70 ? 'text-green-600' : r.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{r.score}</span>
                  : <span className="text-sm text-slate-400">-</span>}
                <p className="text-[10px] text-slate-400">分</p>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">暂无面试记录，开始你的第一次模拟面试吧</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Tab 2：薄弱管理 ====================
function WeaknessManager({ wrongList, pendingWrong, onReview, navigate }: {
  wrongList: WrongItem[];
  pendingWrong: WrongItem[];
  onReview: (id: string) => void;
  navigate: (path: string) => void;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const setCustomQuestions = useInterviewStore(s => s.setCustomQuestions);

  const display = showReviewed ? wrongList : pendingWrong;
  const reviewed = wrongList.filter(w => w.reviewed);

  // 专项练习：错题重练 + 2道相似题
  const startPractice = async () => {
    if (pendingWrong.length === 0) return;
    setPracticeLoading(true);
    try {
      // 收集错题题干作为练习题目
      const wrongContents = pendingWrong.map(w => w.question);
      // 从题库中匹配2道相似题目
      const tags = [...new Set(pendingWrong.map(w => w.knowledgeTag).filter(Boolean))];
      const primaryTag = tags[0] || 'Java';
      // 尝试用第一个标签匹配题库，获取相似题目
      let extraQuestions: string[] = [];
      try {
        const pool = getQuestionsForInterview(primaryTag, 'middle', 5);
        const existingSet = new Set(wrongContents.map(c => c.slice(0, 20)));
        extraQuestions = pool
          .filter(q => !existingSet.has(q.content.slice(0, 20)))
          .slice(0, 2)
          .map(q => q.content);
      } catch { /* fallback */ }
      // 如果题库不够2道，用通用题目补齐
      while (extraQuestions.length < 2) {
        extraQuestions.push(
          extraQuestions.length === 0
            ? '请你总结一下从错题中学到的经验，并结合一个具体的场景说明你会如何改进。'
            : '请分享一个你近期新学到的技术点或方法论，并说明它如何帮助你解决之前遇到过的困难。'
        );
      }
      const allQuestions = [...wrongContents, ...extraQuestions];
      setCustomQuestions(allQuestions);
      // 创建面试并跳转
      const interviewRes = await interviewService.create({
        positionId: 'pos-practice',
        positionName: '薄弱专项练习',
        difficulty: 'middle',
        mode: 'text',
        type: 'technical',
        questionCount: allQuestions.length,
      } as any);
      const data = (interviewRes.data as any)?.data as { interviewId?: string } | undefined;
      if (data?.interviewId) {
        navigate(`/interview/${data.interviewId}`);
      }
    } catch { /* fallback */ }
    setPracticeLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 顶部统计 + 操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">
            待攻克错题 <span className="text-orange-500 font-bold">{pendingWrong.length}</span> 条
          </span>
          {reviewed.length > 0 && (
            <span className="text-xs text-slate-400">（已复习 {reviewed.length} 条）</span>
          )}
        </div>
        <button
          onClick={startPractice}
          disabled={pendingWrong.length === 0 || practiceLoading}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-xl hover:from-orange-600 hover:to-red-600 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {practiceLoading ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/></svg> 准备中...</>
          ) : '🎯 薄弱专项练习'}
        </button>
      </div>

      {/* 卡片列表 */}
      {display.length > 0 ? (
        <div className="space-y-3">
          {display.map((w) => (
            <div key={w.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                {/* 题目 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2">{w.question}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {w.knowledgeTag && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full">
                        #{w.knowledgeTag}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{w.date?.slice(0, 10) || '-'}</span>
                  </div>
                </div>

                {/* 分数 */}
                <div className="text-center shrink-0">
                  <p className={`text-xl font-bold ${w.score < 40 ? 'text-red-500' : w.score < 60 ? 'text-orange-500' : 'text-amber-500'}`}>
                    {w.score}
                  </p>
                  <p className="text-[10px] text-slate-400">分</p>
                </div>

                {/* 操作 */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setDetailId(w.id)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-90 transition-all cursor-pointer"
                    title="查看详情">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                  {!w.reviewed && (
                    <button onClick={() => onReview(w.id)}
                      className="p-2 rounded-lg border border-green-200 text-green-500 hover:bg-green-50 hover:text-green-600 active:scale-90 transition-all cursor-pointer"
                      title="标记已复习">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  )}
                  <button onClick={() => navigate('/setup')}
                    className="p-2 rounded-lg border border-primary-200 text-primary-500 hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all cursor-pointer"
                    title="练习此题">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="5,3 19,12 5,21"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-slate-500 text-sm font-medium">暂无待攻克错题</p>
          <p className="text-slate-400 text-xs mt-1">太棒了，继续保持！</p>
        </div>
      )}

      {/* 折叠：已复习的错题 */}
      {reviewed.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <button onClick={() => setShowReviewed(!showReviewed)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`w-4 h-4 transition-transform ${showReviewed ? 'rotate-90' : ''}`}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            历史错题回收站 · {reviewed.length} 条已复习
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailId(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-auto shadow-2xl animate-scale-in">
            {(() => {
              const w = wrongList.find(x => x.id === detailId);
              if (!w) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">错题详情</h3>
                    <button onClick={() => setDetailId(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">题目</p>
                    <p className="text-sm text-slate-800">{w.question}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">你的回答</p>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{w.myAnswer || '(无回答内容)'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">参考答案</p>
                    <p className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3">{w.referenceAnswer || '(暂无)'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">得分:</span>
                    <span className={`text-lg font-bold ${w.score < 50 ? 'text-red-500' : 'text-orange-500'}`}>{w.score} 分</span>
                    {w.knowledgeTag && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">#{w.knowledgeTag}</span>}
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

// ==================== 辅助组件 ====================
function DifficultyBadge({ diff }: { diff?: string }) {
  const colors: Record<string, string> = {
    junior: 'bg-green-50 text-green-600 border-green-200',
    middle: 'bg-blue-50 text-blue-600 border-blue-200',
    senior: 'bg-purple-50 text-purple-600 border-purple-200',
    expert: 'bg-red-50 text-red-600 border-red-200',
  };
  const labels: Record<string, string> = { junior: '初级', middle: '中级', senior: '高级', expert: '专家' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[diff || 'middle'] || colors.middle}`}>
      {labels[diff || 'middle'] || diff}
    </span>
  );
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
