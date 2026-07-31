import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores';
import { interviewService, positionService } from '@/services/api';
import { MOCK_POSITIONS, MOCK_INTERVIEWS } from '@/data/mock';
import { generateCoachSuggestions, getGreeting } from '@/data/aiEngine';
import { aiChatStore } from '@/stores/aiChatStore';

interface InterviewRecord {
  id: string; positionName: string; difficulty: string; mode: string;
  score: number | null; status: string; questionCount: number;
  startedAt: string; completedAt: string | null;
}
interface PositionItem {
  id: string; name: string; category: string; description: string; tags: string; hot: boolean;
}

const diffLabels: Record<string, string> = { junior: '初级', middle: '中级', senior: '高级', expert: '专家' };
const posIcons: Record<string, string> = {
  'Java后端开发': '☕', '前端开发': '⚛️', '产品经理': '📱', 'HR-通用面试': '🤝',
  'Go后端开发': '🔷', '测试开发': '🧪', 'JavaAgent开发工程师': '🔧',
};

const highlights = [
  {
    title: 'AI 模拟面试',
    desc: '5 维度智能评分 · 实时追问 · 全真模拟',
    gradient: 'from-indigo-500 to-purple-600',
    bgLight: 'bg-indigo-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <defs><linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
        <circle cx="12" cy="12" r="10" stroke="url(#hg1)" strokeWidth="1.8" fill="none"/>
        <path d="M8 9.5c0-2.5 1.5-4 4-4s4 1.5 4 4c0 2-1 3.5-2.5 4v1.5" stroke="url(#hg1)" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="17.5" r="0.8" fill="url(#hg1)"/>
      </svg>
    ),
  },
  {
    title: '多模态交互',
    desc: '文字 · 语音 · 视频三种模式自由切换',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <defs><linearGradient id="hg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs>
        <rect x="3" y="4" width="11" height="13" rx="2" stroke="url(#hg2)" strokeWidth="1.8"/>
        <polygon points="17,7 21,10.5 17,14" fill="url(#hg2)"/>
        <line x1="7" y1="9" x2="10" y2="9" stroke="url(#hg2)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="12" x2="12" y2="12" stroke="url(#hg2)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: '智能评测报告',
    desc: '雷达图 · 逐题分析 · 错题自动收录',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <defs><linearGradient id="hg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#ea580c"/></linearGradient></defs>
        <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="url(#hg3)" strokeWidth="1.8"/>
        <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="url(#hg3)" strokeWidth="1.8"/>
        <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="url(#hg3)" strokeWidth="1.8"/>
        <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="url(#hg3)" strokeWidth="1.8"/>
        <line x1="7" y1="7" x2="7" y2="7" stroke="url(#hg3)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="7" y1="17" x2="7" y2="17" stroke="url(#hg3)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: '竞技排行榜',
    desc: '万人同台竞技 · 数据驱动成长',
    gradient: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <defs><linearGradient id="hg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f43f5e"/><stop offset="100%" stopColor="#ec4899"/></linearGradient></defs>
        <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 4 7 4" stroke="url(#hg4)" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 4 17 4" stroke="url(#hg4)" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M4 22h16" stroke="url(#hg4)" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10 14.7V17c0 .55-.47.98-.97 1.2C7.85 18.8 7 20.2 7 22" stroke="url(#hg4)" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M14 14.7V17c0 .55.47.98.97 1.2C16.15 18.8 17 20.2 17 22" stroke="url(#hg4)" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M18 2H6v7a6 6 0 0012 0V2Z" fill="url(#hg4)" fillOpacity="0.15" stroke="url(#hg4)" strokeWidth="1.8"/>
      </svg>
    ),
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const username = useUserStore(s => s.user?.username) || '同学';
  const [recentInterviews, setRecentInterviews] = useState<InterviewRecord[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, posRes] = await Promise.all([
        interviewService.getHistory({ page: 1, pageSize: 10 }),
        positionService.list(),
      ]);
      const h = historyRes.data?.data as { records: InterviewRecord[] } | undefined;
      if (h?.records) setRecentInterviews(h.records);
      const p = posRes.data?.data as PositionItem[] | undefined;
      if (p) setPositions(p);
    } catch {
      setRecentInterviews(MOCK_INTERVIEWS);
      setPositions(MOCK_POSITIONS);
    } finally { setLoading(false); }
  };

  const completed = useMemo(() => recentInterviews.filter(r => r.status === 'completed' && r.score != null), [recentInterviews]);
  const avgScore = completed.length ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
  const bestScore = completed.length > 0 ? Math.max(...completed.map(r => r.score || 0)) : 0;
  const totalCount = recentInterviews.length;
  const completionRate = totalCount > 0 ? Math.round((completed.length / totalCount) * 100) : 0;

  const coachSuggestion = useMemo(() => {
    const suggestions = generateCoachSuggestions(username, recentInterviews);
    return suggestions.length > 0 ? suggestions[0] : null;
  }, [username, recentInterviews]);

  const groupedByDate = useMemo(() => {
    return recentInterviews.slice(0, 8).reduce<Record<string, InterviewRecord[]>>((acc, r) => {
      const date = r.startedAt?.slice(0, 10) || '未知';
      if (!acc[date]) acc[date] = [];
      acc[date].push(r);
      return acc;
    }, {});
  }, [recentInterviews]);

  const today = new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
  const greet = getGreeting(username);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          <span className="text-ink-muted text-sm font-medium">小空正在准备你的工作台...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* ========== 1. 顶部横幅：欢迎 + KPI ========== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent-700 via-accent-800 to-brand-800 rounded-2xl p-6 md:p-7 mb-4 text-white shadow-card-elevated">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.05] rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs tracking-widest uppercase mb-1.5">{today}</p>
            <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight">{greet} 👋</h1>
            <p className="text-white/45 text-sm mt-1.5">真实模拟 · 精准评测 · 数据驱动成长</p>
            {/* 内联 KPI */}
            <div className="flex gap-5 mt-4">
              {[
                { v: totalCount, l: '总次数' },
                { v: avgScore, l: '均分' },
                { v: completionRate + '%', l: '完成率' },
                { v: bestScore || '-', l: '最高分' },
              ].map(k => (
                <div key={k.l} className="text-center">
                  <p className="text-xl font-extrabold tabular-nums">{k.v}</p>
                  <p className="text-white/40 text-[10px]">{k.l}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('/setup')}
            className="shrink-0 bg-white text-accent-700 px-5 py-2.5 rounded-xl font-bold text-sm
                       hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2 shadow-lg self-start">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5,3 19,12 5,21" /></svg>
            开始新面试
          </button>
        </div>
      </div>

      {/* ========== 2. 四模块功能入口（横条） ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {highlights.map(h => (
          <button key={h.title}
            onClick={() => {
              if (h.title.includes('模拟')) navigate('/setup');
              else if (h.title.includes('模态')) navigate('/setup');
              else if (h.title.includes('评测')) navigate('/reports');
              else navigate('/leaderboard');
            }}
            className="card p-4 card-hover group text-left flex flex-col gap-3 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-xl ${h.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              {h.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-ink-primary mb-0.5">{h.title}</h3>
              <p className="text-[11px] text-ink-muted leading-relaxed">{h.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ========== 3. 三栏：时间线 | AI教练+快捷面板 ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左：时间线（占2份） */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col max-h-[520px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-warmBorder-light shrink-0">
            <h3 className="font-semibold text-sm text-ink-primary flex items-center gap-2.5">
              <span className="w-1.5 h-4 rounded-full bg-accent-500" />最近面试动态
            </h3>
            {recentInterviews.length > 0 && (
              <button onClick={() => navigate('/reports')}
                className="text-xs text-accent-600 hover:text-accent-700 font-medium transition-colors flex items-center gap-1">
                全部记录 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {recentInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-4xl mb-3">🚀</p>
                <p className="text-xs text-ink-muted mb-3">还没有面试记录</p>
                <button onClick={() => navigate('/setup')}
                  className="text-accent-600 text-xs font-medium hover:text-accent-700 transition-colors">
                  开始第一场模拟面试 →
                </button>
              </div>
            ) : (
              Object.entries(groupedByDate).map(([date, items]) => (
                <div key={date} className="relative pl-9 pb-4 last:pb-0">
                  <div className="absolute left-[14px] top-3 bottom-0 w-px bg-warmBorder-light last:hidden" />
                  <div className="flex items-center gap-3 mb-2">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-accent-400 bg-white ring-4 ring-accent-50/50" />
                    <span className="text-sm font-semibold text-ink-primary">{date}</span>
                    <span className="text-[10px] text-ink-muted bg-warm-alt px-2 py-0.5 rounded-full">{items.length} 场</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <div key={item.id}
                        onClick={() => {
                          if (item.status === 'completed' && item.score != null) navigate(`/report/${item.id}`);
                          else if (item.status === 'interrupted' || item.status === 'in_progress') navigate(`/interview/${item.id}`);
                        }}
                        className="card-clickable bg-warm-alt/80 rounded-lg px-3.5 py-2.5 border border-transparent flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm shrink-0">{posIcons[item.positionName] || '💼'}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink-primary truncate">{item.positionName}</p>
                            <p className="text-[11px] text-ink-muted mt-0.5">
                              {diffLabels[item.difficulty] || item.difficulty} · {item.questionCount}题
                              {item.mode === 'voice' ? ' · 🎤' : item.mode === 'video' ? ' · 📹' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'completed' && item.score != null && (
                            <span className={`text-sm font-bold tabular-nums ${
                              item.score >= 80 ? 'text-emerald-600' : item.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                            }`}>{item.score}分</span>
                          )}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                            item.status === 'interrupted' ? 'bg-orange-50 text-orange-600' :
                            'bg-accent-50 text-accent-600'
                          }`}>
                            {item.status === 'completed' ? '已完成' : item.status === 'interrupted' ? '未完成' : '进行中'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右：AI教练 + 快捷面板 */}
        <div className="space-y-4">
          {/* AI 教练小空 */}
          <div className="card p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-sm">🤖</div>
              <div>
                <p className="text-sm font-semibold text-ink-primary">AI 教练 <span className="text-indigo-600">小空</span></p>
                <p className="text-[10px] text-emerald-500 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> 在线</p>
              </div>
            </div>
            {coachSuggestion ? (
              <>
                <p className="text-xs text-ink-secondary leading-relaxed mb-3">
                  {coachSuggestion.greeting && <span className="font-medium text-ink-primary block mb-0.5">{coachSuggestion.greeting}</span>}
                  {coachSuggestion.message}
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => navigate(coachSuggestion.action.href)}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-semibold rounded-lg
                               hover:from-indigo-700 hover:to-indigo-800 active:scale-95 transition-all">
                    {coachSuggestion.action.label}
                  </button>
                  <button onClick={() => aiChatStore.open()}
                    className="px-3 py-1.5 border border-warmBorder-light text-ink-secondary text-[11px] font-medium rounded-lg
                               hover:bg-warm-hover active:scale-95 transition-all">💬 问小空</button>
                </div>
              </>
            ) : (
              <p className="text-xs text-ink-secondary leading-relaxed">
                {totalCount === 0 ? '欢迎！我是小空，准备好开启第一场模拟面试了吗？' : '一切正常！有任何问题随时问我。'}
              </p>
            )}
          </div>

          {/* 快捷操作 + 热门岗位 */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-ink-primary mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-accent-500" />快捷操作
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { icon: '▶️', label: '开始面试', href: '/setup' },
                { icon: '📊', label: '面试报告', href: '/reports' },
                { icon: '🎯', label: '薄弱练习', href: '/reports' },
                { icon: '🏆', label: '排行榜', href: '/leaderboard' },
              ].map(btn => (
                <button key={btn.label} onClick={() => navigate(btn.href)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-warmBorder-light
                             hover:bg-warm-hover active:scale-[0.97] transition-all duration-200 group">
                  <span className="text-base shrink-0 group-hover:scale-110 transition-transform duration-200">{btn.icon}</span>
                  <span className="text-[11px] font-medium text-ink-secondary">{btn.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)}
                placeholder="输入面试码加入"
                className="flex-1 input-focus border border-warmBorder-light rounded-lg px-2.5 py-1.5 text-xs bg-warm-alt placeholder:text-ink-muted" />
              <button disabled={!joinCode.trim()}
                className="bg-teal-500 text-white px-3 py-1.5 rounded-lg font-semibold text-xs
                           hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all">加入</button>
            </div>
            <div className="pt-3 border-t border-warmBorder-light">
              <h3 className="text-xs font-semibold text-ink-primary mb-2 flex items-center gap-2">
                <span className="w-1 h-3 rounded-full bg-brand-500" />热门岗位
              </h3>
              <div className="space-y-0.5">
                {(positions.length > 0 ? positions.slice(0, 4) : MOCK_POSITIONS.slice(0, 4)).map((pos, idx) => (
                  <button key={pos.id} onClick={() => navigate('/setup')}
                    className="w-full text-left p-2 rounded-lg hover:bg-warm-hover transition-all duration-200
                               flex items-center gap-2.5 group active:scale-[0.985]">
                    <span className="text-sm shrink-0">{posIcons[pos.name] || '💼'}</span>
                    <span className="text-xs font-medium text-ink-primary group-hover:text-accent-700 transition-colors truncate flex-1">{pos.name}</span>
                    {pos.hot && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded text-[9px] font-bold">HOT</span>}
                    <span className="text-[10px] text-ink-muted font-mono">{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
