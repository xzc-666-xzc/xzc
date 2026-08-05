import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '@/stores';
import { NEW_FEATURE_KEY, FEATURE_BADGE_MAP } from '@/config/features';
import { interviewService, positionService } from '@/services/api';
import { MOCK_POSITIONS, MOCK_INTERVIEWS } from '@/data/mock';
import { calculatePositionMatch } from '@/data/aiEngine';
import type { InterviewConfig, Difficulty, InterviewMode, InterviewType } from '@/types';

interface RawPosition {
  id: string; name: string; category: string; description: string; tags: string; hot: boolean;
}
interface Position {
  id: string; name: string; category: string; description: string; tags: string[]; hot: boolean;
}

const difficultyOptions: { value: Difficulty; label: string; desc: string; color: string }[] = [
  { value: 'junior', label: '初级', desc: '基础概念 + 简单场景', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'middle', label: '中级', desc: '原理理解 + 项目实战', color: 'border-accent-400 bg-accent-50 text-accent-700' },
  { value: 'senior', label: '高级', desc: '架构设计 + 深度追问', color: 'border-brand-400 bg-brand-50 text-brand-700' },
  { value: 'expert', label: '专家级', desc: '系统思维 + 创新方案', color: 'border-rose-400 bg-rose-50 text-rose-700' },
];

const modeOptions: { value: InterviewMode; label: string; icon: JSX.Element; desc: string }[] = [
  { value: 'text', label: '文字面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, desc: '通过文本对话完成面试' },
  { value: 'voice', label: '语音面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>, desc: '语音实时交流，转写为文字' },
  { value: 'video', label: '视频面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>, desc: 'AI视频面对面，新体验' },
];

const typeOptions: { value: InterviewType; label: string; desc: string; icon: string }[] = [
  { value: 'technical', label: '技术面', desc: '专业知识 + 技术深度', icon: '💻' },
  { value: 'hr', label: 'HR面', desc: '综合素质 + 软技能', icon: '🤝' },
  { value: 'stress', label: '压力面', desc: '高压场景 + 临场应变', icon: '⚡' },
  { value: 'boss', label: 'Boss面', desc: '战略思维 + 领导力', icon: '🎯' },
];

const stepTitles = ['选择岗位', '参数配置', '确认开始'];

export default function InterviewSetup() {
  const [loading, setLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [mode, setMode] = useState<InterviewMode>('text');
  const [type, setType] = useState<InterviewType>('technical');
  const [difficulty, setDifficulty] = useState<Difficulty>('middle');
  const [questionCount, setQuestionCount] = useState(8);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setConfig, setStatus } = useInterviewStore();

  useEffect(() => { loadPositions(); }, []);

  const loadPositions = async () => {
    setPositionsLoading(true);
    try {
      const res = await positionService.list();
      const data = res.data.data as RawPosition[];
      setPositions(data.map(p => ({ ...p, tags: p.tags ? JSON.parse(p.tags) : [] })));
    } catch {
      const parsed = MOCK_POSITIONS.map(p => ({ ...p, tags: JSON.parse(p.tags) as string[] }));
      setPositions(parsed);
    }
    finally { setPositionsLoading(false); }
  };

  const selectedPos = positions.find((p) => p.id === selectedPosition);

  // AI 岗位匹配度计算
  const completedInterviews = useMemo(() => MOCK_INTERVIEWS.filter(
    r => r.status === 'completed' && r.score != null
  ), []);
  const positionMatches = useMemo(() => {
    const matches: Record<string, number> = {};
    positions.forEach(p => {
      const m = calculatePositionMatch(p.id, completedInterviews);
      matches[p.id] = m?.matchScore || 0;
    });
    return matches;
  }, [positions, completedInterviews]);

  const handleStart = async () => {
    if (!selectedPosition) { setError('请先选择岗位'); return; }
    setLoading(true); setError('');
    const pos = positions.find((p) => p.id === selectedPosition);
    const config: InterviewConfig = {
      positionId: selectedPosition,
      positionName: pos?.name || selectedPosition,
      difficulty,
      mode,
      type,
      questionCount,
      duration: questionCount * 3,
    };
    // 视频面试走独立流程
    if (mode === 'video') {
      try {
        const res = await fetch('/api/interviews/video/room/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ positionId: selectedPosition, positionName: pos?.name, difficulty, type, questionCount }),
        });
        const data = await res.json();
        if (data.data?.roomId) {
          navigate(`/interview/video/${data.data.roomId}`);
        } else {
          setError('创建视频房间失败');
        }
      } catch {
        setError('创建视频房间失败，请重试');
      }
      setLoading(false);
      return;
    }
    try {
      const res = await interviewService.create(config);
      const data = res.data?.data;
      if (!data?.interviewId) throw new Error('接口未返回 interviewId');
      setConfig(config);
      setStatus('in_progress');
      navigate(`/interview/${data.interviewId}`);
    } catch {
      const mockId = `mock-${Date.now()}`;
      setConfig(config);
      setStatus('in_progress');
      navigate(`/interview/${mockId}`);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">配置你的模拟面试</h1>
        <p className="text-slate-500 text-sm mt-1.5">选择岗位、难度和交互模式，AI 面试官将为你打造专属面试体验</p>
      </div>

      {/* ===== 步骤条 ===== */}
      <div className="flex gap-0 mb-10">
        {stepTitles.map((title, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          const isPending = i > currentStep;
          return (
            <div key={title} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-3">
                {/* Step circle */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0
                  transition-all duration-300 ease-spring
                  ${isDone
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : isActive
                      ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/25 ring-4 ring-accent-100'
                      : 'bg-warm-hover text-slate-400'
                  }`}>
                  {isDone ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold transition-colors duration-300
                    ${isPending ? 'text-slate-400' : 'text-slate-800'}`}>{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {['目标职位', '难度 & 模式', '确认并启动'][i]}
                  </p>
                </div>
              </div>
              {/* Connector line */}
              {i < 2 && (
                <div className="flex-1 mx-4">
                  <div className={`h-1 rounded-full transition-all duration-500 ${
                    isDone ? 'bg-emerald-500' : isActive ? 'bg-gradient-to-r from-accent-400 to-slate-200' : 'bg-slate-200'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== Error ===== */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl mb-6
                        flex items-center gap-2 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* ===== Step 0: 选择岗位 ===== */}
      {currentStep === 0 && (
        <>
          {positionsLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <div className="w-10 h-10 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" />
                <span className="text-sm font-medium">加载岗位列表...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((pos) => {
                const isSelected = selectedPosition === pos.id;
                const matchScore = positionMatches[pos.id] || 0;
                return (
                  <button
                    key={pos.id}
                    onClick={() => { setSelectedPosition(pos.id); setError(''); }}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 ease-spring
                      ${isSelected
                        ? 'border-accent-500 bg-accent-50/50 shadow-md shadow-accent-500/10 ring-2 ring-accent-500/20 scale-[1.02]'
                        : 'border-slate-100 bg-white hover:border-accent-300 hover:shadow-glow-purple hover:-translate-y-1'
                      }
                      active:scale-[0.985]`}
                  >
                    {/* AI 匹配度标签 */}
                    {matchScore >= 70 && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                        ✨ AI推荐 · {matchScore}%
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-semibold text-slate-800">{pos.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border transition-colors
                        ${isSelected ? 'bg-accent-100 text-accent-700 border-accent-200' : 'bg-warm-alt text-slate-500 border-warmBorder-light'}`}>
                        {pos.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3 leading-relaxed">{pos.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(pos.tags) && pos.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-warm-alt text-slate-500 rounded-md text-xs border border-warmBorder-light">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-8 flex justify-end">
            <button disabled={!selectedPosition}
              onClick={() => { setCurrentStep(1); setError(''); }}
              className="btn-brand px-8 py-3 text-[15px] disabled:opacity-40 disabled:cursor-not-allowed
                         disabled:hover:shadow-button disabled:active:scale-100">
              下一步
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 ml-1"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </>
      )}

      {/* ===== Step 1: 参数配置 ===== */}
      {currentStep === 1 && (
        <>
          {/* 已选岗位提示 */}
          {selectedPos && (
            <div className="card bg-accent-50/50 border-accent-200 p-4 mb-6 flex items-center gap-4 animate-fade-in">
              <span className="text-sm text-slate-500">已选岗位：</span>
              <span className="font-semibold text-slate-800">{selectedPos.name}</span>
              <span className="px-2.5 py-0.5 bg-accent-100 text-accent-700 rounded-lg text-xs font-medium border border-accent-200">{selectedPos.category}</span>
              <button onClick={() => setCurrentStep(0)} className="ml-auto text-xs text-accent-600 hover:text-accent-700 font-medium transition-colors">
                更换
              </button>
            </div>
          )}

          {/* 面试模式 */}
          <div className="card p-6 mb-5">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-accent-500" />
              面试模式
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {modeOptions.map((opt) => {
                const isActive = mode === opt.value;
                const isNew = (NEW_FEATURE_KEY as string) === 'video-interview' && opt.value === 'video';
                return (
                  <button key={opt.value} onClick={() => setMode(opt.value)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ease-spring text-center relative
                      ${isActive
                        ? 'border-accent-500 bg-accent-50/50 shadow-md shadow-accent-500/5 ring-2 ring-accent-500/10 scale-[1.02]'
                        : 'border-warmBorder-light hover:border-slate-300 hover:shadow-sm hover:scale-[1.005] cursor-pointer'
                      }
                      active:scale-[0.97]`}>
                    <span className={`transition-colors duration-200 ${isActive ? 'text-accent-600' : 'text-slate-400'}`}>
                      {opt.icon}
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed">{opt.desc}</span>
                    {isNew && <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-rose-500 text-white rounded text-[9px] font-extrabold leading-none animate-pulse">新</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 面试类型 */}
          <div className="card p-6 mb-5">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-brand-500" />
              面试类型
            </h3>
            <div className="flex flex-wrap gap-3">
              {typeOptions.map((opt) => {
                const isActive = type === opt.value;
                return (
                  <button key={opt.value} onClick={() => setType(opt.value)}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 transition-all duration-200 ease-spring text-sm
                      ${isActive
                        ? 'border-accent-500 bg-accent-50 text-accent-700 font-semibold shadow-sm scale-[1.02]'
                        : 'border-warmBorder-light text-slate-600 hover:border-slate-300 hover:bg-warm-alt'
                      }
                      active:scale-[0.97] cursor-pointer`}>
                    <span className="text-lg">{opt.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 难度 + 题目数量 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 难度等级 */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-amber-500" />
                难度等级
              </h3>
              <div className="space-y-2">
                {difficultyOptions.map((opt) => {
                  const isActive = difficulty === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setDifficulty(opt.value)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 cursor-pointer
                        transition-all duration-200 ease-spring text-left
                        ${isActive
                          ? 'border-accent-500 bg-accent-50/50 shadow-sm ring-2 ring-accent-500/10'
                          : 'border-warmBorder-light hover:border-slate-300 hover:bg-warm-alt'
                        }
                        active:scale-[0.98]`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                        ${isActive ? 'border-accent-600 bg-accent-600' : 'border-slate-300'}`}>
                        {isActive && (
                          <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" fill="none"/></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold transition-colors ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{opt.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 题目数量 */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-emerald-500" />
                题目数量
              </h3>
              <div className="space-y-4">
                {/* 滑块 */}
                <div className="relative pt-2">
                  <input
                    type="range"
                    min={3}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                               accent-accent-600
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6
                               [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-accent-600
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
                               [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                               [&::-webkit-slider-thumb]:hover:scale-110
                               [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>3 题</span>
                    <span>20 题</span>
                  </div>
                </div>

                {/* 快捷选择 */}
                <div className="flex gap-2 justify-center">
                  {[5, 8, 10, 15].map(n => (
                    <button key={n} onClick={() => setQuestionCount(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                        ${questionCount === n
                          ? 'bg-accent-600 text-white shadow-sm'
                          : 'bg-warm-hover text-slate-500 hover:bg-slate-200'
                        }
                        active:scale-90 cursor-pointer`}>
                      {n} 题
                    </button>
                  ))}
                </div>

                {/* 实时预览 */}
                <div className="bg-warm-alt rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-accent-600 tabular-nums">{questionCount}</p>
                  <p className="text-xs text-slate-500 mt-1">道题 · 预计 {questionCount * 3} 分钟</p>
                </div>
              </div>
            </div>
          </div>

          {/* 导航按钮 */}
          <div className="mt-8 flex justify-between">
            <button onClick={() => setCurrentStep(0)}
              className="px-6 py-3 border-2 border-warmBorder-light rounded-xl text-slate-600 font-medium
                         hover:bg-warm-alt hover:border-slate-300 active:scale-95 transition-all duration-200">
              上一步
            </button>
            <button onClick={() => { setCurrentStep(2); setError(''); }}
              className="btn-brand px-8 py-3 text-[15px]">
              确认配置
            </button>
          </div>
        </>
      )}

      {/* ===== Step 2: 确认 ===== */}
      {currentStep === 2 && (
        <div className="card p-8 md:p-10 animate-scale-in">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-500 to-brand-600
                            flex items-center justify-center shadow-lg shadow-brand-500/25 animate-float">
              <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">一切就绪，准备开始！</h2>
            <p className="text-slate-500 text-sm mt-2">确认以下配置后，AI 面试官将进入房间</p>
          </div>

          {/* 配置摘要网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-10">
            {[
              ['目标岗位', selectedPos?.name || '-'],
              ['面试模式', modeOptions.find(m => m.value === mode)?.label],
              ['难度等级', difficultyOptions.find(d => d.value === difficulty)?.label],
              ['题目数量', `${questionCount} 题`],
              ['面试类型', typeOptions.find(t => t.value === type)?.label],
              ['预计时长', `${questionCount * 3} 分钟`],
            ].map(([label, val]) => (
              <div key={label as string} className="bg-warm-alt rounded-xl px-4 py-3.5 text-center
                                                     border border-warmBorder-light hover:border-warmBorder-light transition-colors">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-1.5">{val}</p>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center gap-4">
            <button onClick={() => setCurrentStep(1)}
              className="px-7 py-3 border-2 border-warmBorder-light rounded-xl text-slate-600 font-medium
                         hover:bg-warm-alt hover:border-slate-300 active:scale-95 transition-all duration-200">
              返回修改
            </button>
            <button onClick={handleStart} disabled={loading}
              className="btn-brand px-10 py-3 text-[15px] disabled:opacity-60 shadow-lg shadow-brand-500/20
                         disabled:hover:shadow-button disabled:active:scale-100 flex items-center gap-2.5">
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/>
                  </svg>
                  创建中...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="5,3 19,12 5,21"/></svg>
                  开始面试
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
