import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { interviewService } from '@/services/api';
import { MOCK_INTERVIEWS } from '@/data/mock';

interface InterviewRecord {
  id: string;
  positionName: string;
  difficulty: string;
  mode: string;
  score: number | null;
  status: string;
  questionCount: number;
  startedAt: string;
  completedAt: string | null;
}

const difficultyLabels: Record<string, string> = {
  junior: '初级', middle: '中级', senior: '高级', expert: '专家',
};

const difficultyColors: Record<string, string> = {
  junior: 'bg-green-50 text-green-700', middle: 'bg-blue-50 text-blue-700',
  senior: 'bg-purple-50 text-purple-700', expert: 'bg-red-50 text-red-700',
};

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getHistory({ page: 1, pageSize: 50 });
      const data = res.data?.data as { records: InterviewRecord[]; total: number } | undefined;
      if (data?.records) setRecords(data.records);
    } catch {
      // 后端不可用时使用 Mock 数据
      setRecords(MOCK_INTERVIEWS);
    }
    finally { setLoading(false); }
  };

  const completedRecords = records.filter((r) => r.status === 'completed' && r.score != null);
  const avgScore = completedRecords.length
    ? Math.round(completedRecords.reduce((s, r) => s + (r.score || 0), 0) / completedRecords.length) : 0;
  const bestScore = completedRecords.length > 0
    ? Math.max(...completedRecords.map((r) => r.score || 0)) : 0;

  const trendData = completedRecords.slice().reverse().map((r) => ({
    date: r.startedAt?.slice(0, 10) || '',
    score: r.score ?? 0,
  }));

  const paginatedRecords = records.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));

  const statusBadge = (status: string) => {
    const config: Record<string, string> = {
      completed: 'bg-green-50 text-green-700 border-green-200',
      interrupted: 'bg-orange-50 text-orange-700 border-orange-200',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
      pending: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    const labels: Record<string, string> = {
      completed: '已完成', interrupted: '未完成', in_progress: '进行中', pending: '待开始',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${config[status] || config.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">面试历史</h1>
          <p className="text-sm text-slate-500">查看所有面试记录和成绩趋势</p>
        </div>
        <button onClick={loadHistory} className="px-4 py-2 border border-slate-300 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          刷新
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '总面试次数', value: records.length, suffix: '次', color: 'text-blue-600' },
          { label: '平均得分', value: avgScore, suffix: '分', color: 'text-green-600' },
          { label: '完成率', value: records.length > 0 ? Math.round((completedRecords.length / records.length) * 100) : 0, suffix: '%', color: 'text-amber-600' },
          { label: '最高得分', value: bestScore, suffix: '分', color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <p className="text-sm text-slate-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}<span className="text-base font-normal ml-1">{s.suffix}</span></p>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">成绩趋势</h3>
        {trendData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#165DFF" strokeWidth={2}
                dot={{ fill: '#165DFF', r: 4 }} activeDot={{ r: 6 }}
                name="面试得分" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">至少完成2次面试后显示趋势图</div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="font-semibold text-slate-800 px-6 pt-6 pb-4">面试记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {['岗位', '难度', '模式', '得分', '状态', '题数', '日期', '操作'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedRecords.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-400 text-sm">暂无面试记录，去开始第一次面试吧！</td></tr>
              ) : paginatedRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{r.positionName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[r.difficulty] || 'bg-slate-50 text-slate-600'}`}>
                      {difficultyLabels[r.difficulty] || r.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{r.mode === 'text' ? '文字' : r.mode === 'voice' ? '语音' : r.mode}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${
                      r.status !== 'completed' || r.score == null ? 'text-slate-400' :
                      r.score >= 80 ? 'text-green-600' : r.score >= 60 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {r.status === 'completed' && r.score != null ? r.score : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{statusBadge(r.status)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{r.questionCount}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 text-nowrap">{r.startedAt ? r.startedAt.slice(0, 10) : '-'}</td>
                  <td className="px-6 py-4">
                    {r.status === 'completed' ? (
                      <button onClick={() => navigate(`/report/${r.id}`)}
                        className="text-sm text-primary-700 hover:text-primary-800 font-medium">查看报告</button>
                    ) : (r.status === 'interrupted' || r.status === 'in_progress') ? (
                      <button onClick={() => navigate(`/interview/${r.id}`)}
                        className="text-sm text-primary-700 hover:text-primary-800 font-medium">继续面试</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <span className="text-sm text-slate-500">共 {records.length} 条记录</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 disabled:opacity-30 hover:bg-slate-50 transition-colors">上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page ? 'bg-primary-700 text-white' : 'border border-slate-300 hover:bg-slate-50'
                  }`}>{p}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 disabled:opacity-30 hover:bg-slate-50 transition-colors">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
