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
        setData(rawList.map(item => ({
          username: item.username,
          interviewCount: item.interview_count,
          avgScore: item.avg_score,
        })));
      }
    } catch { /* fallback */ }
    setLoading(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="text-slate-300 font-bold text-sm">{rank}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-accent-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
          <span className="text-3xl">🏆</span> 面试排行榜
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 ml-11">统计所有已完成面试的数据，中途退出不计入</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 text-center card-hover cursor-default">
          <p className="text-3xl font-extrabold text-accent-700 tabular-nums">{data.length}</p>
          <p className="text-sm font-medium text-slate-500 mt-1.5">参与人数</p>
        </div>
        <div className="card p-5 text-center card-hover cursor-default">
          <p className="text-3xl font-extrabold text-teal-700 tabular-nums">
            {data.reduce((sum, d) => sum + d.interviewCount, 0)}
          </p>
          <p className="text-sm font-medium text-slate-500 mt-1.5">总完成面试数</p>
        </div>
        <div className="card p-5 text-center card-hover cursor-default">
          <p className="text-3xl font-extrabold text-amber-700 tabular-nums">
            {data.length > 0
              ? Math.round(data.reduce((sum, d) => sum + d.avgScore, 0) / data.length)
              : 0}
          </p>
          <p className="text-sm font-medium text-slate-500 mt-1.5">全员均分</p>
        </div>
      </div>

      {/* Leaderboard table */}
      {data.length === 0 ? (
        <div className="card py-20 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-slate-400 text-sm font-medium">暂无排行数据</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_120px_120px] px-6 py-4 bg-warm-alt/80 border-b border-warmBorder-light">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">排名</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">用户名</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">面试次数</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">平均成绩</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {data.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={entry.username + idx}
                  className={`grid grid-cols-[60px_1fr_120px_120px] px-6 py-4 items-center transition-all duration-200
                    hover:bg-warm-alt/60
                    ${isTop3 ? 'bg-amber-50/20' : ''}`}
                >
                  {/* Rank */}
                  <span className="text-xl flex items-center justify-center">
                    {getRankBadge(rank)}
                  </span>

                  {/* Username */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md
                      ${rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                        rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                        rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                        'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
                      {entry.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className={`text-sm ${isTop3 ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                      {entry.username}
                    </span>
                    {isTop3 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        rank === 1 ? 'bg-amber-100 text-amber-700' :
                        rank === 2 ? 'bg-warm-hover text-slate-600' :
                        'bg-amber-100/60 text-amber-700'
                      }`}>
                        TOP {rank}
                      </span>
                    )}
                  </div>

                  {/* Interview count */}
                  <span className="text-sm font-semibold text-slate-600 text-center tabular-nums">
                    {entry.interviewCount} 次
                  </span>

                  {/* Avg score */}
                  <span className={`text-sm font-bold text-center tabular-nums ${getScoreColor(entry.avgScore)}`}>
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
