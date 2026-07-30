import { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import type { LeaderboardEntry } from '@/services/api';

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await userService.getLeaderboard();
      const rawList = (res.data?.data as unknown) as Array<{ username: string; interview_count: number; avg_score: number }> | undefined;
      if (rawList) {
        // 后端返回 snake_case，映射为前端 camelCase
        setData(rawList.map(item => ({
          username: item.username,
          interviewCount: item.interview_count,
          avgScore: item.avg_score,
        })));
      }
    } catch { /* fallback */ }
    setLoading(false);
  };

  // 排名徽章
  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="text-slate-400 font-medium">{rank}</span>;
  };

  // 分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

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
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span>🏆</span> 面试排行榜
        </h1>
        <p className="text-sm text-slate-500 mt-1">统计所有已完成面试的数据，中途退出不计入</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{data.length}</p>
          <p className="text-xs text-slate-500 mt-1">参与人数</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">
            {data.reduce((sum, d) => sum + d.interviewCount, 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">总完成面试数</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {data.length > 0
              ? Math.round(data.reduce((sum, d) => sum + d.avgScore, 0) / data.length)
              : 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">全员均分</p>
        </div>
      </div>

      {/* 排行榜表格 */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-400 text-sm">暂无排行数据</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-[60px_1fr_120px_120px] px-6 py-3.5 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-500">排名</span>
            <span className="text-xs font-medium text-slate-500">用户名</span>
            <span className="text-xs font-medium text-slate-500 text-center">面试次数</span>
            <span className="text-xs font-medium text-slate-500 text-center">平均成绩</span>
          </div>

          {/* 行 */}
          <div className="divide-y divide-slate-50">
            {data.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={entry.username + idx}
                  className={`grid grid-cols-[60px_1fr_120px_120px] px-6 py-4 items-center transition-colors hover:bg-slate-50/60
                    ${isTop3 ? 'bg-amber-50/30' : ''}`}
                >
                  {/* 排名 */}
                  <span className="text-xl flex items-center justify-center">
                    {getRankBadge(rank)}
                  </span>

                  {/* 用户名 */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm
                      ${isTop3 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                      {entry.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className={`text-sm ${isTop3 ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}`}>
                      {entry.username}
                    </span>
                    {isTop3 && (
                      <span className="text-xs text-amber-600 font-medium">
                        {rank === 1 ? 'TOP 1' : rank === 2 ? 'TOP 2' : 'TOP 3'}
                      </span>
                    )}
                  </div>

                  {/* 面试次数 */}
                  <span className="text-sm font-medium text-slate-600 text-center">
                    {entry.interviewCount} 次
                  </span>

                  {/* 平均成绩 */}
                  <span className={`text-sm font-bold text-center ${getScoreColor(entry.avgScore)}`}>
                    {entry.interviewCount > 0 ? `${entry.avgScore} 分` : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
