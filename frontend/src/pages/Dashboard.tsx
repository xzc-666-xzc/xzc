import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore, useInterviewStore } from '@/stores';
import { interviewService, positionService } from '@/services/api';
import { MOCK_POSITIONS } from '@/data/mock';
import { NEW_FEATURE_KEY } from '@/config/features';
import { generateCoachSuggestions, getGreeting } from '@/data/aiEngine';
import { aiChatStore } from '@/stores/aiChatStore';
import type { InterviewConfig, Difficulty, InterviewMode, InterviewType } from '@/types';

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
      setRecentInterviews([]);
      setPositions(MOCK_POSITIONS);
    } finally { setLoading(false); }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await interviewService.joinByCode(joinCode.trim());
      const data = res.data?.data;
      if (!data?.interviewId) throw new Error('无效的面试码');
      const config: InterviewConfig = {
        positionId: data.positionId,
        positionName: data.positionName,
        difficulty: data.difficulty as Difficulty,
        mode: data.mode as InterviewMode,
        type: data.type as InterviewType,
        questionCount: data.questionCount,
        duration: data.duration,
      };
      // 视频面试 → 创建房间并跳转视频页面
      if (data.mode === 'video') {
        const roomRes = await fetch('/api/interviews/video/room/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ positionId: data.positionId, positionName: data.positionName, difficulty: data.difficulty, type: data.type, questionCount: data.questionCount }),
        });
        const roomData = await roomRes.json();
        if (roomData.data?.roomId) {
          navigate(`/interview/video/${roomData.data.roomId}`);
        } else {
          alert('创建视频房间失败，请重试');
        }
        return;
      }
      const { setConfig, setStatus } = useInterviewStore.getState();
      setConfig(config);
      setStatus('in_progress');
      navigate(`/interview/${data.interviewId}`);
    } catch {
      alert('面试码无效或已失效，请检查后重试');
    }
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
        </div>
      </div>

      {/* ========== 2. 核心入口：AI面试 | 面试码 | 快捷入口 ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* 左：AI模拟面试 Hero（占2份） */}
        <button onClick={() => navigate('/setup')}
          className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-accent-600 via-accent-700 to-brand-700 rounded-2xl p-6 md:p-7 text-white shadow-card-elevated group cursor-pointer
                     hover:shadow-glow transition-all duration-300 active:scale-[0.985]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl group-hover:bg-white/[0.1] transition-colors" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-400/[0.08] rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0
                          group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.8" fill="none" opacity="0.9"/>
                <polygon points="10,8 16,12 10,16" fill="white"/>
              </svg>
            </div>
            <div className="text-left">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1.5">AI 模拟面试</h2>
              <p className="text-white/65 text-sm leading-relaxed mb-4">
                多维度智能评分 · 语音文字双模式 · 精准岗位匹配 · 实时追问
              </p>
              <span className="inline-flex items-center gap-2 bg-white text-accent-700 px-4 py-2 rounded-xl font-bold text-sm
                               group-hover:bg-slate-50 group-hover:shadow-lg transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5,3 19,12 5,21" /></svg>
                立即开始面试
              </span>
            </div>
          </div>
        </button>

        {/* 右：面试码 + 快捷入口 */}
        <div className="space-y-4">
          {/* 面试码卡片 */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0">
              {(NEW_FEATURE_KEY as string) === 'invite-code' && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-bl-lg rounded-tr-xl leading-none shadow-sm">🔥 新功能</span>
              )}
            </div>
            <h3 className="text-sm font-bold text-ink-primary mb-1 mt-1">面试码加入</h3>
            <p className="text-[11px] text-ink-muted mb-3">输入HR分享的6位邀请码，进入专属面试</p>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
              placeholder="输入 6 位面试码"
              maxLength={6}
              className="w-full input-focus border-2 border-warmBorder-light rounded-xl px-3.5 py-2.5 text-base font-mono tracking-[0.2em] text-center
                         bg-warm-alt placeholder:text-ink-muted focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
            <button onClick={handleJoinByCode} disabled={!joinCode.trim()}
              className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-sm
                         hover:from-teal-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed
                         active:scale-[0.98] transition-all duration-200 shadow-button">
              加入专属面试
            </button>
          </div>

          {/* 快捷入口：面试报告 + 排行榜 + AI教练 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '📊', label: '面试报告', href: '/reports' },
              { icon: '🏆', label: '排行榜', href: '/leaderboard' },
              { icon: '💬', label: 'AI 教练', action: () => aiChatStore.open() },
            ].map(btn => (
              <button key={btn.label} onClick={() => btn.action ? btn.action() : navigate(btn.href)}
                className="card p-3 flex flex-col items-center gap-1.5 card-hover group cursor-pointer">
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">{btn.icon}</span>
                <span className="text-[10px] font-medium text-ink-secondary">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== 3. 时间线 | AI教练 ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左：时间线 */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col max-h-[460px]">
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
                      <div key={item.id} onClick={() => {
                          if (item.status === 'completed' && item.score != null) navigate(`/report/${item.id}`);
                          else if (item.status === 'interrupted' || item.status === 'in_progress') navigate(`/interview/${item.id}`);
                        }}
                        className="card-clickable bg-warm-alt/80 rounded-lg px-3.5 py-2.5 border border-transparent flex items-center justify-between gap-3 cursor-pointer"
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
                            <span className={`text-sm font-bold tabular-nums ${item.score >= 80 ? 'text-emerald-600' : item.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{item.score}分</span>
                          )}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : item.status === 'interrupted' ? 'bg-orange-50 text-orange-600' : 'bg-accent-50 text-accent-600'}`}>
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

        {/* 右：AI教练 + 热门岗位 */}
        <div className="space-y-4">
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
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-800 active:scale-95 transition-all">
                    {coachSuggestion.action.label}
                  </button>
                  <button onClick={() => aiChatStore.open()}
                    className="px-3 py-1.5 border border-warmBorder-light text-ink-secondary text-[11px] font-medium rounded-lg hover:bg-warm-hover active:scale-95 transition-all">💬 问小空</button>
                </div>
              </>
            ) : (
              <p className="text-xs text-ink-secondary leading-relaxed">
                {totalCount === 0 ? '欢迎！我是小空，准备好开启第一场模拟面试了吗？' : '一切正常！有任何问题随时问我。'}
              </p>
            )}
          </div>
          <div className="card p-3">
            <h3 className="text-xs font-semibold text-ink-primary mb-2 flex items-center gap-1.5">
              <span className="w-1 h-2.5 rounded-full bg-brand-500" />热门岗位
            </h3>
            <div className="space-y-0.5">
              {(positions.length > 0 ? positions.slice(0, 5) : MOCK_POSITIONS.slice(0, 5)).map((pos, idx) => (
                <button key={pos.id} onClick={() => navigate('/setup')}
                  className="w-full text-left p-2 rounded-lg hover:bg-warm-hover transition-all duration-200 flex items-center gap-2.5 group active:scale-[0.985]">
                  <span className="text-xs shrink-0">{posIcons[pos.name] || '💼'}</span>
                  <span className="text-[11px] font-medium text-ink-primary group-hover:text-accent-700 transition-colors truncate flex-1">{pos.name}</span>
                  {pos.hot && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded text-[9px] font-bold">HOT</span>}
                  <span className="text-[10px] text-ink-muted font-mono">{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
