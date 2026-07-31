import { useState } from 'react';

interface AISidebarProps {
  collapsed?: boolean;
  onAskAI?: () => void;
}

const quickPrompts = [
  {
    label: '推荐面试岗位',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="1.8" />
        <polygon points="12,6 14,11 19,11 15,14 16.5,19 12,16 7.5,19 9,14 5,11 10,11" fill="#6366f1" fillOpacity="0.3" stroke="#6366f1" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    label: '面试技巧指南',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="9" y1="7" x2="15" y2="7" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="9" y1="10.5" x2="13" y2="10.5" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '面试报告分析',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: '技术专项突破',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" fill="#ec4899" fillOpacity="0.2" stroke="#ec4899" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AISidebar({ collapsed = false, onAskAI }: AISidebarProps) {
  const [expanded, setExpanded] = useState(false);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <button
          onClick={onAskAI}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
          title="AI 教练 · 小空"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="9" cy="10" r="1.2" fill="white" />
            <circle cx="15" cy="10" r="1.2" fill="white" />
            <path d="M8 14.5c1 1.5 2.5 2 4 2s3-0.5 4-2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  // 折叠态：单行
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                   bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50
                   hover:from-indigo-100/60 hover:to-purple-100/60
                   active:scale-[0.98] transition-all duration-200 group"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="9" cy="10" r="1" fill="white" />
            <circle cx="15" cy="10" r="1" fill="white" />
            <path d="M8 14c1 1.5 2.5 2 4 2s3-0.5 4-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-slate-700 flex-1 text-left">小空 · AI 教练</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-500 transition-colors">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }

  // 展开态
  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="9" cy="10" r="1" fill="white" />
              <circle cx="15" cy="10" r="1" fill="white" />
              <path d="M8 14c1 1.5 2.5 2 4 2s3-0.5 4-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-700">AI 教练 <span className="text-indigo-600">小空</span></p>
            <p className="text-[9px] text-emerald-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" /> 在线
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-white/60 active:scale-90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      <div className="space-y-0.5">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={onAskAI}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]
                       text-ink-secondary hover:bg-white/80 hover:text-indigo-600
                       active:scale-[0.97] transition-all duration-150"
          >
            <span className="shrink-0">{p.icon}</span>
            <span className="font-medium">{p.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onAskAI}
        className="w-full mt-2 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-medium
                   rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-md hover:shadow-indigo-500/20
                   active:scale-95 transition-all duration-200 flex items-center justify-center gap-1"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3 h-3">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        问小空
      </button>
    </div>
  );
}
