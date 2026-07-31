import { useState, useCallback, useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import VoiceVisualizer, { RealtimeVisualizer } from './VoiceVisualizer';

interface VoiceInputProps {
  /** 当获得最终识别文本时触发 */
  onTranscript: (text: string, confidence: number) => void;
  /** 当录音状态改变 */
  onRecordingChange?: (recording: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 暗色主题 */
  dark?: boolean;
}

/**
 * 语音输入组件 — 整合语音识别、波形可视化、实时文本预览
 */
export default function VoiceInput({
  onTranscript,
  onRecordingChange,
  disabled = false,
  dark = false,
}: VoiceInputProps) {
  const [showInterim, setShowInterim] = useState(false);

  const {
    listening,
    transcript,
    interim,
    confidence,
    supported,
    permissionDenied,
    duration,
    start,
    stop,
    abort,
    reset,
  } = useSpeechRecognition({
    lang: 'zh-CN',
    continuous: true,
    interimResults: true,
    maxSilence: 3000,
    onResult: (result) => {
      if (result.isFinal) {
        setShowInterim(true);
      }
    },
    onError: (err) => {
      console.warn('Speech recognition error:', err);
    },
  });

  // Notify parent of recording state
  useEffect(() => {
    onRecordingChange?.(listening);
  }, [listening, onRecordingChange]);

  // When interim text appears, show it
  useEffect(() => {
    if (interim) setShowInterim(true);
  }, [interim]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggle = useCallback(async () => {
    if (disabled) return;

    if (listening) {
      const finalText = stop();
      if (finalText.trim()) {
        onTranscript(finalText, confidence);
      }
      setShowInterim(false);
    } else {
      reset();
      setShowInterim(false);
      await start();
    }
  }, [disabled, listening, stop, start, reset, onTranscript, confidence]);

  const handleCancel = useCallback(() => {
    abort();
    setShowInterim(false);
    reset();
  }, [abort, reset]);

  // Keyboard shortcut: Space to toggle (when not typing in an input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && !disabled && !listening && document.activeElement === document.body) {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, listening, handleToggle]);

  // Not supported fallback — show button with tooltip
  if (!supported) {
    return (
      <button
        disabled
        className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-not-allowed
          ${dark
            ? 'bg-white/3 border border-white/5 text-slate-600'
            : 'bg-slate-100 border border-slate-200 text-slate-400'
          }`}
        title="语音输入需要 Chrome 或 Edge 浏览器，且需 HTTPS 或 localhost"
      >
        <MicIcon className="w-5 h-5 opacity-40" />
        <span className="hidden sm:inline">需要 Chrome</span>
      </button>
    );
  }

  // Permission denied
  if (permissionDenied) {
    return (
      <button
        onClick={() => alert('请在浏览器设置中允许访问麦克风，然后刷新页面')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
          ${dark
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}
      >
        <MicOffIcon className="w-5 h-5" />
        <span className="hidden sm:inline">麦克风被禁用</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Main microphone button */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`relative flex items-center justify-center shrink-0 rounded-2xl transition-all duration-200 cursor-pointer select-none
          ${listening
            ? dark
              ? 'w-14 h-14 bg-rose-500/90 border-2 border-rose-400/50 text-white shadow-lg shadow-rose-500/25'
              : 'w-14 h-14 bg-rose-500 border-2 border-rose-400 text-white shadow-lg shadow-rose-500/25'
            : dark
              ? 'w-12 h-12 bg-white/5 border border-slate-500/20 text-slate-400 hover:bg-white/10 hover:border-slate-400/40 hover:text-white'
              : 'w-12 h-12 bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          ${listening ? 'animate-pulse-ring' : ''}
          active:scale-90`}
        title={listening ? '点击停止录音' : '点击开始录音 (空格键)'}
      >
        {/* Pulse ring when recording */}
        {listening && (
          <span className="absolute inset-0 rounded-2xl ring-4 ring-rose-400/30 animate-ping" />
        )}
        {listening ? (
          <MicIcon className="w-6 h-6" />
        ) : (
          <MicIcon className="w-5 h-5" />
        )}
      </button>

      {/* Recording status panel */}
      {listening && (
        <div className={`flex items-center gap-4 animate-fade-in ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          {/* Waveform */}
          <RealtimeVisualizer recording={listening} variant="red" className="w-32" />

          {/* Timer + status */}
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono tabular-nums text-rose-400">{formatDuration(duration)}</span>
            </span>
          </div>

          {/* Cancel button */}
          <button
            onClick={handleCancel}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-90
              ${dark
                ? 'bg-white/5 border border-slate-500/20 text-slate-400 hover:bg-white/10'
                : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
          >
            取消
          </button>
        </div>
      )}

      {/* Interim text preview */}
      {showInterim && !listening && interim && (
        <div className={`text-sm animate-fade-in ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="italic">"{interim.slice(0, 50)}..."</span>
        </div>
      )}
    </div>
  );
}

/* ====== Icons ====== */
function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}
