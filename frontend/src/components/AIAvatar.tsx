import { useMemo } from 'react';
import type { VideoState } from '@/stores/videoStore';

type AiState = VideoState['aiState'];

interface Props {
  state: AiState;
  message?: string;
  className?: string;
}

const stateConfig: Record<AiState, { emoji: string; label: string; bgGradient: string; bubble: string; dotColor: string }> = {
  greeting: {
    emoji: '👋', label: '你好！', bgGradient: 'from-indigo-500 to-purple-600',
    bubble: '欢迎参加本次视频面试，我是你的AI面试官，准备好了吗？', dotColor: 'bg-emerald-400',
  },
  thinking: {
    emoji: '🤔', label: '思考中...', bgGradient: 'from-amber-400 to-orange-500',
    bubble: '让我想想，这个问题可以从几个角度来回答...', dotColor: 'bg-amber-400',
  },
  asking: {
    emoji: '🧐', label: '提问中', bgGradient: 'from-indigo-500 to-sky-600',
    bubble: '', dotColor: 'bg-indigo-400',
  },
  listening: {
    emoji: '😌', label: '倾听中', bgGradient: 'from-emerald-500 to-teal-600',
    bubble: '我正在认真听你的回答，请继续...', dotColor: 'bg-emerald-400',
  },
  encouraging: {
    emoji: '😊', label: '很好！', bgGradient: 'from-rose-400 to-pink-500',
    bubble: '回答得很不错！让我们继续下一题。', dotColor: 'bg-rose-400',
  },
  ending: {
    emoji: '🎉', label: '面试结束', bgGradient: 'from-purple-500 to-indigo-600',
    bubble: '面试已完成，感谢你的参与！正在生成报告...', dotColor: 'bg-purple-400',
  },
};

export default function AIAvatar({ state, message, className = '' }: Props) {
  const cfg = useMemo(() => stateConfig[state] || stateConfig.greeting, [state]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* AI 头像圆形容器 */}
      <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${cfg.bgGradient} flex items-center justify-center shadow-glow mb-3 transition-all duration-500`}>
        {/* 外圈脉动光环 */}
        <div className={`absolute inset-0 rounded-full border-2 ${cfg.dotColor} opacity-30 animate-pulse`} />
        {/* 表情 */}
        <span className="text-5xl relative z-10 animate-float drop-shadow-lg">{cfg.emoji}</span>
        {/* 在线状态点 */}
        <div className={`absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full ${cfg.dotColor} ring-2 ring-white`} />
        {/* 耳朵/装饰 */}
        <div className="absolute -top-1 left-2 w-6 h-6 bg-white rounded-full opacity-20 animate-pulse" />
        <div className="absolute -top-1 right-2 w-4 h-4 bg-white rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* 状态标签 */}
      <p className="text-xs font-bold text-slate-500 mb-1.5">{cfg.label}</p>

      {/* 对话气泡 */}
      <div className="relative bg-white rounded-2xl px-4 py-3 shadow-card border border-warmBorder-light max-w-[260px]">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-warmBorder-light rotate-45" />
        <p className="text-xs text-slate-600 leading-relaxed text-center">
          {message || cfg.bubble}
        </p>
      </div>

      {/* CSS 动画角色 - 底部装饰 */}
      <div className="mt-3 flex gap-1.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${cfg.dotColor} animate-bounce`}
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1.2s' }}
          />
        ))}
      </div>
    </div>
  );
}
