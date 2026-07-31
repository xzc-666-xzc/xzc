import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { reportService } from '@/services/api';
import { MOCK_REPORT } from '@/data/mock';
import { analyzeWeakPoints, generateStudyPlan } from '@/data/aiEngine';
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
    } catch { setReport(MOCK_REPORT as InterviewReport); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">正在生成面试报告...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 mb-5 opacity-40"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-lg font-medium mb-5">{error || '未找到面试报告'}</p>
        <button onClick={() => navigate('/history')} className="btn-brand px-6 py-2.5 text-sm">返回面试历史</button>
      </div>
    );
  }

  const scoreColor = report.totalScore >= 80 ? 'text-emerald-500' : report.totalScore >= 60 ? 'text-amber-500' : 'text-rose-500';
  const ringColor = report.totalScore >= 80 ? '#10b981' : report.totalScore >= 60 ? '#f59e0b' : '#f43f5e';
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
    <div className="page-container animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/history')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium mb-6
                   transition-colors duration-200">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
        返回历史
      </button>

      {/* ===== Score Card ===== */}
      <div className="card p-8 md:p-10 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Score ring */}
          <div className="relative w-44 h-44 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={ringColor}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(report.totalScore / 100) * 326.7} 326.7`}
                className="score-ring" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-[42px] font-extrabold tracking-tight ${scoreColor} tabular-nums`}>{report.totalScore}</span>
              <span className="text-sm font-medium text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">综合得分</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              {report.totalScore >= 85 ? '🌟 表现优秀，各项能力均衡出色' :
               report.totalScore >= 70 ? '👍 表现良好，部分维度有提升空间' :
               report.totalScore >= 60 ? '📚 表现一般，建议针对性强化薄弱环节' :
               '💪 需要加强，建议系统复习后再次挑战'}
            </p>
            <p className="text-slate-400 text-xs">面试时间：{report.createdAt?.slice(0, 10) || '-'}</p>
          </div>
        </div>
      </div>

      {/* ===== Charts ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 text-center mb-4 flex items-center justify-center gap-2">
            <span className="w-1 h-4 rounded-full bg-accent-500" />能力雷达图
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="你的得分" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">暂无雷达图数据</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 text-center mb-4 flex items-center justify-center gap-2">
            <span className="w-1 h-4 rounded-full bg-brand-500" />各模块分值
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
              <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Five-dimension score ===== */}
      <div className="card p-6 mb-8">
        <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-accent-500" />五维评分详情
        </h3>
        <div className="space-y-5">
          {scoreItems.map(item => (
            <div key={item.key} className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 w-28 shrink-0">{item.label}</span>
              <div className="flex-1 h-3 bg-warm-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-spring ${
                    item.value >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                    item.value >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              {/* Stars */}
              <div className="flex gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(n => {
                  const active = n <= Math.ceil(item.value / 20);
                  return (
                    <svg key={n} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="1.5"
                      className={`w-4 h-4 ${
                        active
                          ? (item.value >= 80 ? 'text-emerald-400' : item.value >= 60 ? 'text-amber-400' : 'text-rose-400')
                          : 'text-slate-200'
                      }`}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  );
                })}
              </div>
              <span className={`text-sm font-bold w-10 text-right tabular-nums ${
                item.value >= 80 ? 'text-emerald-600' : item.value >= 60 ? 'text-amber-600' : 'text-rose-600'
              }`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Overall Evaluation ===== */}
      {(report.overallSummary || report.strengths?.length || report.weaknesses?.length) && (
        <div className="card p-6 mb-8">
          <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-brand-500" />总体评价
          </h3>
          {report.overallSummary && (
            <div className="bg-accent-50/50 border border-accent-200 rounded-2xl p-5 mb-6 text-sm text-accent-800 flex gap-3 leading-relaxed">
              <span className="shrink-0 text-lg">💬</span>
              <p>{report.overallSummary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {report.strengths?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-600 mb-3 flex items-center gap-1.5">🏆 优点</h4>
                <ul className="space-y-1.5">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="text-emerald-500 mt-1.5 shrink-0">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.weaknesses?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-1.5">⚠️ 待改善</h4>
                <ul className="space-y-1.5">
                  {report.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="text-amber-500 mt-1.5 shrink-0">•</span>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {report.improvementPlan && (
            <div className="mt-6 pt-6 border-t border-warmBorder-light">
              <h4 className="text-sm font-semibold text-accent-700 mb-2 flex items-center gap-1.5">💡 改进计划</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{report.improvementPlan}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== Per-question Analysis ===== */}
      {(report.questionDetails || []).length > 0 && (
        <div className="card mb-8 overflow-hidden">
          <h3 className="font-semibold text-slate-800 px-6 pt-6 pb-0 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-accent-500" />逐题分析 & 回放
          </h3>

          <div className="flex border-b border-warmBorder-light mt-4 px-6 gap-1">
            {report.questionDetails!.map((_, idx) => (
              <button key={idx} onClick={() => setActiveTab(idx)}
                className={`px-4 py-3 text-sm font-semibold border-b-[3px] transition-all duration-200 -mb-[1px]
                  ${activeTab === idx ? 'border-accent-600 text-accent-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                第{idx + 1}题
              </button>
            ))}
          </div>

          {report.questionDetails![activeTab] && (
            <div className="p-6 space-y-5">
              {(() => {
                const detail = report.questionDetails![activeTab];
                return (
                  <>
                    <div className="bg-warm-alt rounded-2xl p-4">
                      <p className="text-xs font-semibold text-slate-400 mb-2">📋 题目</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{detail.question}</p>
                    </div>
                    <div className="bg-warm-alt rounded-2xl p-4">
                      <p className="text-xs font-semibold text-slate-400 mb-2">✏️ 你的回答</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{detail.answer}</p>
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
                            <span key={s.label} className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              s.score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                              s.score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {s.label}: {s.score}
                            </span>
                          ))}
                        </div>

                        {detail.evaluation.strengths?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-emerald-600 mb-2">✅ 优点</p>
                            <ul className="space-y-1">{detail.evaluation.strengths.map((s, i) => <li key={i} className="text-sm text-slate-600">• {s}</li>)}</ul>
                          </div>
                        )}
                        {detail.evaluation.weaknesses?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-amber-600 mb-2">⚠️ 不足</p>
                            <ul className="space-y-1">{detail.evaluation.weaknesses.map((w, i) => <li key={i} className="text-sm text-slate-600">• {w}</li>)}</ul>
                          </div>
                        )}
                        {detail.evaluation.suggestions?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-accent-700 mb-2">💡 建议</p>
                            <ul className="space-y-1">{detail.evaluation.suggestions.map((sg, i) => <li key={i} className="text-sm text-slate-600">• {sg}</li>)}</ul>
                          </div>
                        )}
                        {detail.evaluation.referenceAnswer && (
                          <details className="bg-warm-alt rounded-2xl overflow-hidden group">
                            <summary className="px-5 py-3.5 cursor-pointer text-sm text-accent-700 font-semibold
                                                   hover:bg-warm-hover transition-colors select-none">
                              📖 查看高分参考答案
                            </summary>
                            <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{detail.evaluation.referenceAnswer}</p>
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

      {/* ===== AI 教练深度分析 ===== */}
      <AIReportAnalysis totalScore={report.totalScore} />

      {/* ===== Actions ===== */}
      <div className="flex justify-center gap-4 pb-16">
        <button onClick={() => navigate('/setup')}
          className="btn-brand px-8 py-3.5 text-[15px] flex items-center gap-2.5 shadow-lg shadow-brand-500/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          再来一次面试
        </button>
        <button onClick={() => navigate('/wrong-book')}
          className="border-2 border-warmBorder-light text-slate-600 px-8 py-3.5 rounded-xl font-semibold text-[15px]
                     hover:bg-warm-alt hover:border-slate-300 active:scale-95 transition-all duration-200
                     flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          查看错题本
        </button>
      </div>
    </div>
  );
}

// ==================== AI 教练深度分析面板 ====================
function AIReportAnalysis({ totalScore }: { totalScore: number }) {
  const weakPoints = useMemo(() => analyzeWeakPoints([]), []);
  const plan = useMemo(() => generateStudyPlan(weakPoints), [weakPoints]);

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-sm">
          🤖
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">AI 教练 · 小空 深度分析</h3>
          <p className="text-xs text-slate-400">基于你的面试数据生成个性化建议</p>
        </div>
      </div>

      {/* 弱项分析 */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-amber-400" />
          📊 技能维度分析
        </h4>
        <div className="space-y-3">
          {weakPoints.map(wp => (
            <div key={wp.tag} className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 w-24 shrink-0">{wp.label}</span>
              <div className="flex-1 h-2.5 bg-warm-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    wp.level === 'good'
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : wp.level === 'moderate'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`}
                  style={{ width: `${wp.score}%` }}
                />
              </div>
              <span className={`text-sm font-bold w-10 text-right tabular-nums ${
                wp.level === 'good' ? 'text-emerald-600' : wp.level === 'moderate' ? 'text-amber-600' : 'text-rose-600'
              }`}>{wp.score}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                wp.level === 'good' ? 'bg-emerald-50 text-emerald-600' : wp.level === 'moderate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {wp.level === 'good' ? '✅ 良好' : wp.level === 'moderate' ? '📈 中等' : '⚠️ 薄弱'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 学习计划 */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-indigo-400" />
          🎯 学习计划（AI 生成）
        </h4>
        <div className="space-y-3">
          {plan.weeks.map((week, i) => (
            <div key={i} className="bg-warm-alt rounded-xl p-4 border border-warmBorder-light hover:border-warmBorder-light transition-colors">
              <p className="text-sm font-semibold text-slate-700 mb-2">{week.label}</p>
              <ul className="space-y-1">
                {week.tasks.map((task, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-indigo-400 mt-0.5 shrink-0">▸</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center">
          🎯 目标达成日期：<span className="font-semibold text-indigo-500">{plan.targetDate}</span>
        </p>
      </div>
    </div>
  );
}
