import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService, positionService } from '@/services/api';
import { MOCK_POSITIONS, MOCK_INTERVIEWS } from '@/data/mock';
import StatCard from '@/components/StatCard';

interface InterviewRecord {
  id: string; positionName: string; difficulty: string; mode: string;
  score: number | null; status: string; questionCount: number;
  startedAt: string; completedAt: string | null;
}
interface PositionItem {
  id: string; name: string; category: string; description: string; tags: string; hot: boolean;
}

const diffLabels: Record<string, string> = { junior: '初级', middle: '中级', senior: '高级', expert: '专家' };
const diffColors: Record<string, string> = {
  junior: 'bg-green-50 text-green-700 border-green-200',
  middle: 'bg-blue-50 text-blue-700 border-blue-200',
  senior: 'bg-purple-50 text-purple-700 border-purple-200',
  expert: 'bg-red-50 text-red-700 border-red-200',
};

const posIcons: Record<string, string> = {
  'Java后端开发': '☕', '前端开发': '⚛️', '产品经理': '📱', 'HR-通用面试': '🤝',
  'Go后端开发': '🔷', '测试开发': '🧪', 'JavaAgent开发工程师': '🔧',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentInterviews, setRecentInterviews] = useState<InterviewRecord[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, posRes] = await Promise.all([
        interviewService.getHistory({ page: 1, pageSize: 5 }),
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

  const completed = recentInterviews.filter(r => r.status === 'completed' && r.score != null);
  const avgScore = completed.length ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
  const bestScore = completed.length > 0 ? Math.max(...completed.map(r => r.score || 0)) : 0;

  // 按日期分组面试记录
  const groupedByDate = recentInterviews.reduce<Record<string, InterviewRecord[]>>((acc, r) => {
    const date = r.startedAt?.slice(0, 10) || '未知日期';
    if (!acc[date]) acc[date] = [];
    acc[date].push(r);
    return acc;
  }, {});

  const greets = ['早上好', '上午好', '下午好', '晚上好'];
  const greet = greets[Math.floor(new Date().getHours() / 6)] || '你好';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* 欢迎区 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-brand-800 rounded-2xl p-8 mb-6 text-white shadow-glow">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">{greet}，{new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-2xl font-bold">准备开启今天的模拟面试</h1>
            <p className="text-white/60 text-sm mt-2 max-w-md">
              AI 驱动的智能化技术面试评测平台，真实模拟 · 精准评测 · 专项提升
            </p>
          </div>
          <button
            onClick={() => navigate('/setup')}
            className="bg-white text-primary-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all btn-glow flex items-center gap-2 shadow-lg animate-pulse-ring"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="5,3 19,12 5,21" /></svg>
            开始新面试
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="面试总次数" value={recentInterviews.length} suffix="次"
          color="blue" trend="up" trendLabel="较上月 +2"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
        <StatCard label="平均得分" value={avgScore} suffix="分"
          color="green" trend={avgScore >= 70 ? 'up' : 'flat'} trendLabel="稳定"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
        <StatCard label="完成率" value={recentInterviews.length > 0 ? Math.round((completed.length / recentInterviews.length) * 100) : 0} suffix="%"
          color="amber"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
        <StatCard label="最高得分" value={bestScore} suffix="分"
          color="red"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 4 7 4"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 4 17 4"/><path d="M4 22h16"/><path d="M10 22V8c0-1.1.9-2 2-2s2 .9 2 2v14"/></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左: 时间线 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary-500"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                最近面试记录
              </h3>
              <button onClick={() => navigate('/history')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                全部记录 →
              </button>
            </div>
            {recentInterviews.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-3 opacity-40"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                <p className="text-sm">暂无面试记录</p>
                <button onClick={() => navigate('/setup')} className="text-primary-500 text-sm mt-2 hover:underline">去开始第一场面试 →</button>
              </div>
            ) : (
              <div className="p-6">
                {Object.entries(groupedByDate).map(([date, items]) => (
                  <div key={date} className="relative pl-10 pb-6 last:pb-0">
                    {/* 时间线竖线 */}
                    <div className="absolute left-[19px] top-3 bottom-0 w-px bg-slate-200 last:hidden" />
                    {/* 日期标签 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="absolute left-3 top-1 w-3.5 h-3.5 rounded-full border-2 border-primary-400 bg-white ring-4 ring-primary-50" />
                      <span className="text-sm font-medium text-slate-700">{date}</span>
                      <span className="text-xs text-slate-400">{items.length} 场面试</span>
                    </div>
                    {/* 面试条目 */}
                    <div className="space-y-2 mt-2">
                      {items.map(item => (
                        <div key={item.id}
                          className="bg-slate-50 rounded-xl px-4 py-3 hover:bg-slate-100/80 transition-colors cursor-pointer"
                          onClick={() => {
                            if (item.status === 'completed') navigate(`/report/${item.id}`);
                            else if (item.status === 'interrupted' || item.status === 'in_progress') navigate(`/interview/${item.id}`);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{posIcons[item.positionName] || '💼'}</span>
                              <div>
                                <p className="text-sm font-medium text-slate-700">{item.positionName}</p>
                                <p className="text-xs text-slate-400">
                                  {diffLabels[item.difficulty] || item.difficulty} · {item.questionCount}题
                                  {item.mode === 'voice' ? ' · 语音' : item.mode === 'video' ? ' · 视频' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.status === 'completed' && item.score != null && (
                                <span className={`text-sm font-bold ${item.score >= 80 ? 'text-green-600' : item.score >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                                  {item.score}分
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                item.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                item.status === 'interrupted' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {item.status === 'completed' ? '已完成' : item.status === 'interrupted' ? '未完成' : item.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右: 快速操作 + 岗位 */}
        <div className="space-y-4">
          {/* 一键加入 */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-teal-500"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
              一键加入面试
            </h3>
            <div className="flex gap-2">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)}
                placeholder="输入面试码"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
              <button disabled={!joinCode.trim()}
                className="bg-teal-500 text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-teal-600 disabled:opacity-40 transition-colors">
                加入
              </button>
            </div>
          </div>

          {/* 热门岗位 */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">热门面试岗位</h3>
            <div className="space-y-2">
              {(positions.length > 0 ? positions.slice(0, 5) : MOCK_POSITIONS.slice(0, 5)).map(pos => (
                <button key={pos.id} onClick={() => navigate('/setup')}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                >
                  <span className="text-xl shrink-0">{posIcons[pos.name] || '💼'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-primary-700 transition-colors flex items-center gap-2">
                      {pos.name}
                      {pos.hot && <span className="px-1.5 py-0.5 bg-red-50 text-red-500 rounded text-[10px] font-bold">HOT</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{pos.category}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
          </div>

          {/* 信任标识 */}
          <div className="text-center text-xs text-slate-400 space-y-1">
            <p>🔒 端到端加密 · 数据自动归档</p>
            <p>已服务 <span className="font-semibold text-slate-500">10,000+</span> 候选人</p>
          </div>
        </div>
      </div>
    </div>
  );
}
