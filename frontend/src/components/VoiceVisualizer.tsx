import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  /** 是否正在录音/播放 */
  active: boolean;
  /** 条数，默认 5 */
  bars?: number;
  /** 颜色主题 */
  variant?: 'indigo' | 'red' | 'green';
  /** 高度 px，默认 40 */
  height?: number;
  /** 额外的 CSS 类名 */
  className?: string;
}

const variantColors = {
  indigo: 'bg-indigo-400',
  red: 'bg-rose-400',
  green: 'bg-emerald-400',
};

/**
 * 纯 CSS 语音波形可视化组件
 * 使用 animation-delay 产生波浪效果
 */
export default function VoiceVisualizer({
  active,
  bars = 5,
  variant = 'indigo',
  height = 40,
  className = '',
}: VoiceVisualizerProps) {
  const barColor = variantColors[variant];

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className}`}
      style={{ height }}
      aria-label={active ? '正在录音' : '录音已停止'}
      role="status"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${barColor} ${
            active ? 'animate-wave' : 'h-1 opacity-30'
          }`}
          style={{
            animationDelay: `${i * 0.12}s`,
            animationDuration: `${0.6 + Math.random() * 0.4}s`,
            height: active ? undefined : '4px',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; }
          25% { height: ${height * 0.5}px; }
          50% { height: ${height}px; }
          75% { height: ${height * 0.6}px; }
        }
        .animate-wave {
          animation: wave ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * 使用真实 AudioContext 的实时波形可视化（用于录音场景）
 */
export function RealtimeVisualizer({
  recording,
  variant = 'red',
  className = '',
}: {
  recording: boolean;
  variant?: 'indigo' | 'red';
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!recording) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      // Clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw flat line
          ctx.strokeStyle = variant === 'red' ? '#f43f5e' : '#818cf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        // Don't connect to destination (no echo)

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (cancelled) return;
          animRef.current = requestAnimationFrame(draw);

          analyser.getByteFrequencyData(dataArray);

          const W = canvas.width;
          const H = canvas.height;
          ctx.clearRect(0, 0, W, H);

          const barW = (W / bufferLength) * 2.5;
          let x = 0;

          const gradient = ctx.createLinearGradient(0, H, 0, 0);
          if (variant === 'red') {
            gradient.addColorStop(0, '#f43f5e');
            gradient.addColorStop(1, '#fb7185');
          } else {
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#a78bfa');
          }
          ctx.fillStyle = gradient;

          for (let i = 0; i < bufferLength; i++) {
            const barH = (dataArray[i] / 255) * H * 0.8;
            ctx.fillRect(x, H - barH, barW - 1, barH);
            x += barW;
          }
        };

        draw();
      } catch {
        // Permission denied or no mic
      }
    };

    init();

    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [recording, variant]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={48}
      className={`rounded-lg ${className}`}
      style={{ background: 'transparent' }}
    />
  );
}
