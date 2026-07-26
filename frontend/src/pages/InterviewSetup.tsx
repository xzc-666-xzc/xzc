import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '@/stores';
import { interviewService, positionService } from '@/services/api';
import { MOCK_POSITIONS } from '@/data/mock';
import type { InterviewConfig, Difficulty, InterviewMode, InterviewType } from '@/types';

interface RawPosition {
  id: string; name: string; category: string; description: string; tags: string; hot: boolean;
}
interface Position {
  id: string; name: string; category: string; description: string; tags: string[]; hot: boolean;
}

const difficultyOptions: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'junior', label: '初级', desc: '基础概念 + 简单场景' },
  { value: 'middle', label: '中级', desc: '原理理解 + 项目实战' },
  { value: 'senior', label: '高级', desc: '架构设计 + 深度追问' },
  { value: 'expert', label: '专家级', desc: '系统思维 + 创新方案' },
];

const modeOptions: { value: InterviewMode; label: string; icon: JSX.Element; desc: string }[] = [
  { value: 'text', label: '文字面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, desc: '通过文本对话完成面试' },
  { value: 'voice', label: '语音面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>, desc: '语音实时交流，转写为文字' },
  { value: 'video', label: '视频面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>, desc: '视频面对面（三期开放）' },
];

const typeOptions: { value: InterviewType; label: string; desc: string }[] = [
  { value: 'technical', label: '技术面', desc: '专业知识 + 技术深度' },
  { value: 'hr', label: 'HR面', desc: '综合素质 + 软技能' },
  { value: 'stress', label: '压力面', desc: '高压场景 + 临场应变' },
  { value: 'boss', label: 'Boss面', desc: '战略思维 + 领导力' },
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
      // 后端不可用时使用 Mock 数据
      const parsed = MOCK_POSITIONS.map(p => ({ ...p, tags: JSON.parse(p.tags) as string[] }));
      setPositions(parsed);
    }
    finally { setPositionsLoading(false); }
  };

  const selectedPos = positions.find((p) => p.id === selectedPosition);

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
    try {
      const res = await interviewService.create(config);
      const data = res.data?.data;
      if (!data?.interviewId) throw new Error('接口未返回 interviewId');
      setConfig(config);
      setStatus('in_progress');
      navigate(`/interview/${data.interviewId}`);
    } catch {
      // 后端不可用：使用 Mock interviewId 直接进入面试
      const mockId = `mock-${Date.now()}`;
      setConfig(config);
      setStatus('in_progress');
      navigate(`/interview/${mockId}`);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-slate-800 mb-1">配置你的模拟面试</h1>
      <p className="text-slate-500 text-sm mb-6">选择岗位、难度和交互模式，AI 面试官将为你打造专属面试体验</p>

      {/* Steps */}
      <div className="flex gap-4 mb-8">
        {stepTitles.map((title, i) => (
          <div key={title} className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors
              ${i <= currentStep ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {i + 1}
            </div>
            <div>
              <p className={`text-sm font-medium ${i <= currentStep ? 'text-slate-800' : 'text-slate-400'}`}>{title}</p>
              <p className="text-xs text-slate-400">{['目标职位','难度 & 模式','确认并启动'][i]}</p>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-primary-700' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      {/* Step 0: Position Selection */}
      {currentStep === 0 && (
        <>
          {positionsLoading ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="animate-spin w-8 h-8 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
              </svg>
              加载岗位列表...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => { setSelectedPosition(pos.id); setError(''); }}
                  className={`text-left p-5 rounded-xl border-2 transition-all
                    ${selectedPosition === pos.id ? 'border-primary-700 bg-primary-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800">{pos.name}</span>
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">{pos.category}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{pos.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(pos.tags) && pos.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 text-right">
            <button disabled={!selectedPosition}
              onClick={() => { setCurrentStep(1); setError(''); }}
              className="bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              下一步
            </button>
          </div>
        </>
      )}

      {/* Step 1: Config */}
      {currentStep === 1 && (
        <>
          {selectedPos && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 flex items-center gap-4">
              <span className="text-sm text-slate-500">已选岗位：</span>
              <span className="font-medium text-slate-800">{selectedPos.name}</span>
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-lg text-xs">{selectedPos.category}</span>
            </div>
          )}

          {/* Mode */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
            <h3 className="font-semibold text-slate-800 mb-4">面试模式</h3>
            <div className="grid grid-cols-3 gap-3">
              {modeOptions.map((opt) => (
                <button key={opt.value} onClick={() => setMode(opt.value)}
                  disabled={opt.value === 'video'}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                    ${mode === opt.value ? 'border-primary-700 bg-primary-50/50' : 'border-slate-200 hover:border-slate-300'}
                    ${opt.value === 'video' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={mode === opt.value ? 'text-primary-700' : 'text-slate-400'}>{opt.icon}</span>
                  <span className={`text-sm font-medium ${mode === opt.value ? 'text-slate-800' : 'text-slate-500'}`}>{opt.label}</span>
                  <span className="text-xs text-slate-400">{opt.desc}</span>
                  {opt.value === 'video' && <span className="px-2 py-0.5 bg-orange-100 text-orange-500 rounded text-xs">三期开放</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
            <h3 className="font-semibold text-slate-800 mb-4">面试类型</h3>
            <div className="flex flex-wrap gap-3">
              {typeOptions.map((opt) => (
                <button key={opt.value} onClick={() => setType(opt.value)}
                  className={`px-5 py-2.5 rounded-xl border-2 transition-all text-sm
                    ${type === opt.value ? 'border-primary-700 bg-primary-50 text-primary-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">难度等级</h3>
              <div className="space-y-2">
                {difficultyOptions.map((opt) => (
                  <label key={opt.value} onClick={() => setDifficulty(opt.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${difficulty === opt.value ? 'border-primary-700 bg-primary-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex shrink-0 ${difficulty === opt.value ? 'border-primary-700 bg-primary-700' : 'border-slate-300'}`}>
                      {difficulty === opt.value && <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 m-auto"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">题目数量</h3>
              <input type="number" min={3} max={20} value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(3, Math.min(20, Number(e.target.value))))}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-500/20" />
              <p className="text-xs text-slate-400 mt-2">建议 6-10 题，预计 {questionCount * 3} 分钟</p>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setCurrentStep(0)}
              className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              上一步
            </button>
            <button onClick={() => { setCurrentStep(2); setError(''); }}
              className="bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors">
              确认配置
            </button>
          </div>
        </>
      )}

      {/* Step 2: Confirm */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-10 h-10">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">一切就绪，准备开始！</h2>
            <p className="text-slate-500 text-sm mb-8">确认以下配置后，AI 面试官将进入房间</p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8">
            {[
              ['目标岗位', selectedPos?.name || '-'],
              ['面试模式', modeOptions.find(m => m.value === mode)?.label],
              ['难度等级', difficultyOptions.find(d => d.value === difficulty)?.label],
              ['题目数量', `${questionCount} 题`],
              ['面试类型', typeOptions.find(t => t.value === type)?.label],
              ['预计时长', `${questionCount * 3} 分钟`],
            ].map(([label, val]) => (
              <div key={label as string} className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700">{val}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={() => setCurrentStep(1)}
              className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              返回修改
            </button>
            <button onClick={handleStart} disabled={loading}
              className="bg-primary-700 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-primary-200">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/></svg>创建中...</>
              ) : (
                <><svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="5,3 19,12 5,21"/></svg>开始面试</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
