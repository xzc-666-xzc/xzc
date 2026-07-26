import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wrongBookService } from '@/services/api';
import { MOCK_WRONG_QUESTIONS } from '@/data/mock';

interface WrongQuestion {
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

export default function WrongBook() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('all');
  const [detailModal, setDetailModal] = useState<WrongQuestion | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { loadWrongBook(); }, []);

  const loadWrongBook = async () => {
    setLoading(true);
    try {
      const res = await wrongBookService.list({ page: 1, pageSize: 50 });
      const data = res.data?.data as { records: WrongQuestion[]; total: number } | undefined;
      if (data?.records) setQuestions(data.records);
    } catch {
      // 后端不可用时使用 Mock 数据
      setQuestions(MOCK_WRONG_QUESTIONS);
    }
    finally { setLoading(false); }
  };

  const handleReview = async (id: string) => {
    try {
      await wrongBookService.review(id);
      setQuestions(prev => prev.map(q => (q.id === id ? { ...q, reviewed: true } : q)));
    } catch { /* empty */ }
  };

  const tags = [...new Set(questions.filter(q => q.knowledgeTag).map(q => q.knowledgeTag?.split('-')[0]))].filter(Boolean);
  const filteredQuestions = selectedTag === 'all' ? questions : questions.filter(q => q.knowledgeTag?.includes(selectedTag));
  const paginatedQuestions = filteredQuestions.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));

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
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary-700">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            错题本
          </h1>
          <p className="text-sm text-slate-500 mt-1">得分低于60分的题目自动收录，支持按标签筛选和针对性练习</p>
        </div>
        <button onClick={() => navigate('/setup')}
          className="bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors text-sm">
          针对性练习
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tag filter */}
        {tags.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">筛选标签：</span>
            <select value={selectedTag} onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-700">
              <option value="all">全部</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {['题目', '得分', '知识标签', '日期', '状态', '操作'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedQuestions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">🎉 暂无错题，继续保持！</td></tr>
              ) : paginatedQuestions.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 max-w-xs truncate">{q.question}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      q.score < 50 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>{q.score}分</span>
                  </td>
                  <td className="px-6 py-4">
                    {q.knowledgeTag ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{q.knowledgeTag}</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 text-nowrap">{q.date || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.reviewed ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {q.reviewed ? '✅ 已复习' : '⏳ 待复习'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDetailModal(q)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium">详情</button>
                      {!q.reviewed && (
                        <button onClick={() => handleReview(q.id)}
                          className="text-sm text-green-600 hover:text-green-700 font-medium">标记已复习</button>
                      )}
                      <button onClick={() => navigate('/setup')}
                        className="text-sm text-slate-400 hover:text-slate-600">练习</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <span className="text-sm text-slate-500">共 {filteredQuestions.length} 条</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 disabled:opacity-30 hover:bg-slate-50">上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page ? 'bg-primary-700 text-white' : 'border border-slate-300 hover:bg-slate-50'
                  }`}>{p}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 disabled:opacity-30 hover:bg-slate-50">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailModal(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">错题详情</h3>
              <button onClick={() => setDetailModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-slate-500 mb-1">📋 题目</p>
                <p className="text-slate-700">{detailModal.question}</p>
              </div>
              <div>
                <p className="font-medium text-red-500 mb-1">❌ 你的回答</p>
                <p className="text-slate-600">{detailModal.myAnswer}</p>
              </div>
              <div>
                <p className="font-medium text-green-600 mb-1">✅ 参考答案</p>
                <p className="text-slate-600">{detailModal.referenceAnswer}</p>
              </div>
              <div className="flex gap-2">
                {detailModal.knowledgeTag && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{detailModal.knowledgeTag}</span>}
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">{detailModal.score}分</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setDetailModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
