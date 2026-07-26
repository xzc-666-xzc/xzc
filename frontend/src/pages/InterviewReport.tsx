import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { reportService } from '@/services/api';
import { MOCK_REPORT } from '@/data/mock';
import type { InterviewReport } from '@/types';

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => { if (!id) return; loadReport(); }, [id]);

  const loadReport = async () => {
    setLoading(true); setError('');
    try {
      const res = await reportService.getByInterviewId(id!);
      const data = (res.data as { code: number; message: string; data: InterviewReport | null })?.data;
      if (data && data.totalScore !== undefined) setReport(data);
      else setError('未找到面试报告');
    } catch {
      // 后端不可用时使用 Mock 数据
      setReport(MOCK_REPORT as InterviewReport);
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
          <span className="text-sm">正在生成面试报告...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 mb-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-lg mb-4">{error || '未找到面试报告'}</p>
        <button onClick={() => navigate('/history')} className="bg-primary-700 text-white px-6 py-2 rounded-xl">返回面试历史</button>
      </div>
    );
  }

  const scoreColor = report.totalScore >= 80 ? 'text-green-500' : report.totalScore >= 60 ? 'text-amber-500' : 'text-red-500';
  const scores = report.scores || { content: 0, logic: 0, depth: 0, star: 0, expression: 0 };

  const radarData = (report.radarData || []).map(r => ({ dimension: r.dimension, score: r.score, fullMark: r.fullMark }));
  const barData = radarData;

  const scoreItems = [
    { label: '内容准确性', key: 'content' as const, value: scores.content ?? 0 },
    { label: '逻辑条理性', key: 'logic' as const, value: scores.logic ?? 0 },
    { label: '专业深度', key: 'depth' as const, value: scores.depth ?? 0 },
    { label: 'STAR法则运用', key: 'star' as const, value: scores.star ?? 0 },
    { label: '表达沟通能力', key: 'expression' as const, value: scores.expression ?? 0 },
  ];

  return (
    <div className="page-container">
      {/* Back */}
      <button onClick={() => navigate('/history')}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-4 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        返回历史
      </button>

      {/* Total Score Card with Ring */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Ring */}
          <div className="relative w-44 h-44 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={report.totalScore >= 80 ? '#22c55e' : report.totalScore >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(report.totalScore / 100) * 326.7} 326.7`}
                className="score-ring" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${scoreColor}`}>{report.totalScore}</span>
              <span className="text-sm text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-slate-800 mb-1">综合得分</h2>
            <p className="text-slate-500 text-sm mb-3">
              {report.totalScore >= 85 ? '🌟 表现优秀，各项能力均衡出色' :
               report.totalScore >= 70 ? '👍 表现良好，部分维度有提升空间' :
               report.totalScore >= 60 ? '📚 表现一般，建议针对性强化薄弱环节' :
               '💪 需要加强，建议系统复习后再次挑战'}
            </p>
            <p className="text-slate-400 text-xs">面试时间：{report.createdAt?.slice(0, 10) || '-'}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 text-center mb-4">能力雷达图</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="你的得分" dataKey="score" stroke="#165DFF" fill="#165DFF" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">暂无雷达图数据</div>}
        </div>

        {/* Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 text-center mb-4">各模块分值</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#165DFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Progress Bars */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-5">五维评分详情</h3>
        <div className="space-y-4">
          {scoreItems.map(item => (
            <div key={item.key} className="flex items-center gap-4">
              <span className="text-sm text-slate-600 w-28 shrink-0">{item.label}</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    item.value >= 80 ? 'bg-green-500' : item.value >= 60 ? 'bg-amber-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              {/* 星级 */}
              <div className="flex gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(n => (
                  <svg key={n} viewBox="0 0 24 24" fill={n <= Math.ceil(item.value / 20) ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="1.5"
                    className={`w-4 h-4 ${n <= Math.ceil(item.value / 20) ? (item.value >= 80 ? 'text-green-400' : item.value >= 60 ? 'text-amber-400' : 'text-red-400') : 'text-slate-200'}`}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ))}
              </div>
              <span className={`text-sm font-bold w-10 text-right ${item.value >= 80 ? 'text-green-600' : item.value >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Evaluation */}
      {(report.overallSummary || report.strengths?.length || report.weaknesses?.length) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">总体评价</h3>
          {report.overallSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-800 flex gap-3">
              <span className="shrink-0">💬</span>
              <p>{report.overallSummary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {report.strengths?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1">🏆 优点</h4>
                <ul className="space-y-1">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-green-500 mt-1 shrink-0">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.weaknesses?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1">⚠️ 待改善</h4>
                <ul className="space-y-1">
                  {report.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-amber-500 mt-1 shrink-0">•</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {report.improvementPlan && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-primary-700 mb-2 flex items-center gap-1">💡 改进计划</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{report.improvementPlan}</p>
            </div>
          )}
        </div>
      )}

      {/* Per-question Analysis */}
      {(report.questionDetails || []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
          <h3 className="font-semibold text-slate-800 px-6 pt-6 pb-0">逐题分析 & 回放</h3>

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 mt-4 px-6">
            {report.questionDetails!.map((_, idx) => (
              <button key={idx} onClick={() => setActiveTab(idx)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${activeTab === idx ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                第{idx + 1}题
              </button>
            ))}
          </div>

          {/* Tab content */}
          {report.questionDetails![activeTab] && (
            <div className="p-6 space-y-4">
              {(() => {
                const detail = report.questionDetails![activeTab];
                return (
                  <>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">📋 题目</p>
                      <p className="text-sm text-slate-700">{detail.question}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">✏️ 你的回答</p>
                      <p className="text-sm text-slate-600">{detail.answer}</p>
                    </div>

                    {detail.evaluation && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: '内容', score: detail.evaluation.contentScore },
                            { label: '逻辑', score: detail.evaluation.logicScore },
                            { label: '深度', score: detail.evaluation.depthScore },
                            { label: 'STAR', score: detail.evaluation.starScore },
                            { label: '表达', score: detail.evaluation.expressionScore },
                          ].map(s => (
                            <span key={s.label} className={`px-3 py-1 rounded-full text-xs font-medium ${
                              s.score >= 80 ? 'bg-green-50 text-green-700' :
                              s.score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {s.label}: {s.score}
                            </span>
                          ))}
                        </div>

                        {detail.evaluation.strengths?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-600 mb-1">✅ 优点</p>
                            <ul className="space-y-1">{detail.evaluation.strengths.map((s, i) => <li key={i} className="text-sm text-slate-600">• {s}</li>)}</ul>
                          </div>
                        )}
                        {detail.evaluation.weaknesses?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-amber-600 mb-1">⚠️ 不足</p>
                            <ul className="space-y-1">{detail.evaluation.weaknesses.map((w, i) => <li key={i} className="text-sm text-slate-600">• {w}</li>)}</ul>
                          </div>
                        )}
                        {detail.evaluation.suggestions?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-primary-700 mb-1">💡 建议</p>
                            <ul className="space-y-1">{detail.evaluation.suggestions.map((sg, i) => <li key={i} className="text-sm text-slate-600">• {sg}</li>)}</ul>
                          </div>
                        )}
                        {detail.evaluation.referenceAnswer && (
                          <details className="bg-slate-50 rounded-xl overflow-hidden">
                            <summary className="px-4 py-3 cursor-pointer text-sm text-primary-700 font-medium hover:bg-slate-100 transition-colors">
                              📖 查看高分参考答案
                            </summary>
                            <p className="px-4 pb-4 text-sm text-slate-600">{detail.evaluation.referenceAnswer}</p>
                          </details>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pb-12">
        <button onClick={() => navigate('/setup')}
          className="bg-primary-700 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-800 transition-all btn-glow flex items-center gap-2 shadow-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          再来一次面试
        </button>
        <button onClick={() => navigate('/wrong-book')}
          className="border-2 border-slate-200 text-slate-600 px-8 py-3 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          查看错题本
        </button>
      </div>
    </div>
  );
}
