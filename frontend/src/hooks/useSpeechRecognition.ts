import { useState, useRef, useCallback, useEffect } from 'react';

// ==================== Type Declarations ====================
// Augment Web Speech API types for missing fields
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// ==================== Types ====================
export interface RecognitionResult {
  transcript: string;       // 最终识别文本
  interim: string;          // 临时（未完成）文本
  confidence: number;       // 置信度 0-1
  isFinal: boolean;         // 是否为最终结果
}

export interface UseSpeechRecognitionOptions {
  /** 识别语言，默认 'zh-CN' */
  lang?: string;
  /** 是否连续识别，默认 true */
  continuous?: boolean;
  /** 是否返回临时结果，默认 true */
  interimResults?: boolean;
  /** 最大静默时间（ms），超时自动停止，默认 15000 */
  maxSilence?: number;
  /** 最终结果回调 */
  onResult?: (result: RecognitionResult) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 开始/停止回调 */
  onStateChange?: (listening: boolean) => void;
}

export interface UseSpeechRecognitionReturn {
  /** 是否正在监听 */
  listening: boolean;
  /** 最终识别文本 */
  transcript: string;
  /** 临时文本 */
  interim: string;
  /** 最后一次置信度 */
  confidence: number;
  /** 浏览器是否支持 SpeechRecognition */
  supported: boolean;
  /** 是否因权限被拒绝 */
  permissionDenied: boolean;
  /** 录音时长（秒） */
  duration: number;
  /** 开始监听 */
  start: () => Promise<void>;
  /** 停止监听并返回最终文本 */
  stop: () => string;
  /** 中止（不返回结果） */
  abort: () => void;
  /** 重置状态 */
  reset: () => void;
}

// ==================== Browser Detection ====================
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// ==================== Hook ====================
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'zh-CN',
    continuous = true,
    interimResults = true,
    maxSilence = 15000,
    onResult,
    onError,
    onStateChange,
  } = options;

  const [listening, setListening] = useState(false);
  const [supported] = useState(() => isSpeechRecognitionSupported());
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [duration, setDuration] = useState(0);

  const transcriptRef = useRef('');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [confidence, setConfidence] = useState(1);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const durationTimerRef = useRef<ReturnType<typeof setInterval>>();
  const stoppedManuallyRef = useRef(false);

  // ---- Reset silence timer on any speech ----
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxSilence > 0) {
      silenceTimerRef.current = setTimeout(() => {
        // Auto-stop on silence
        const final = transcriptRef.current;
        recognitionRef.current?.stop();
      }, maxSilence);
    }
  }, [maxSilence]);

  // ---- Start ----
  const start = useCallback(async () => {
    if (!supported) {
      onError?.('浏览器不支持语音识别，请使用 Chrome 或 Edge');
      return;
    }

    // Check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the stream (we just need permission)
      stream.getTracks().forEach(t => t.stop());
    } catch {
      setPermissionDenied(true);
      onError?.('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
      return;
    }

    setPermissionDenied(false);
    stoppedManuallyRef.current = false;

    const SRClass = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SRClass();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      onStateChange?.(true);
      // Start duration counter
      setDuration(0);
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      resetSilenceTimer();
    };

    recognition.onresult = (event: any) => {
      let i = '';
      let f = '';
      let c = 1;

      for (let j = event.resultIndex; j < event.results.length; j++) {
        const result = event.results[j];
        const text = result[0]?.transcript || '';
        if (result.isFinal) {
          f += text;
          c = Math.min(c, result[0]?.confidence || 1);
        } else {
          i += text;
        }
      }

      if (f) {
        transcriptRef.current += transcriptRef.current ? ' ' + f : f;
        setTranscript(transcriptRef.current);
        setInterim('');
        setConfidence(c);

        onResult?.({
          transcript: transcriptRef.current,
          interim: '',
          confidence: c,
          isFinal: true,
        });
      } else if (i) {
        setInterim(i);
        onResult?.({
          transcript: transcriptRef.current,
          interim: i,
          confidence: 1,
          isFinal: false,
        });
      }

      resetSilenceTimer();
    };

    recognition.onerror = (event: any) => {
      const error = event.error;
      if (error === 'not-allowed') {
        setPermissionDenied(true);
        onError?.('麦克风权限被拒绝');
      } else if (error === 'aborted' && !stoppedManuallyRef.current) {
        // Auto-restart on unexpected abort (not manual stop)
        try {
          recognition.start();
          return;
        } catch {
          // If restart fails, just stop
        }
      } else if (error !== 'aborted') {
        onError?.(`语音识别错误: ${error}`);
      }

      if (error === 'no-speech') {
        onError?.('未检测到语音，请检查麦克风');
      } else if (error === 'audio-capture') {
        onError?.('未找到麦克风设备');
      } else if (error === 'network') {
        onError?.('网络错误，语音识别需要网络连接');
      }
    };

    recognition.onend = () => {
      setListening(false);
      onStateChange?.(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);

      // Auto-restart unless manually stopped (for continuous listening)
      if (!stoppedManuallyRef.current && continuous) {
        try {
          recognition.start();
        } catch {
          // Browser sometimes throws on rapid restart
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      onError?.(`启动语音识别失败: ${err.message}`);
    }
  }, [supported, lang, continuous, interimResults, maxSilence, onResult, onError, onStateChange, resetSilenceTimer]);

  // ---- Stop ----
  const stop = useCallback(() => {
    stoppedManuallyRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);

    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // May already be stopped
      }
    }

    setListening(false);
    setInterim('');
    onStateChange?.(false);

    // Return combined final transcript + any pending interim
    const final = transcriptRef.current;
    return final;
  }, [onStateChange]);

  // ---- Abort ----
  const abort = useCallback(() => {
    stoppedManuallyRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);

    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.abort();
      } catch {
        // May already be stopped
      }
    }

    setListening(false);
    setInterim('');
    onStateChange?.(false);
  }, [onStateChange]);

  // ---- Reset ----
  const reset = useCallback(() => {
    abort();
    transcriptRef.current = '';
    setTranscript('');
    setInterim('');
    setConfidence(1);
    setDuration(0);
  }, [abort]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* noop */ }
      }
    };
  }, []);

  return {
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
  };
}


