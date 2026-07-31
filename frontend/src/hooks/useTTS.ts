import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseTTSOptions {
  /** 语言，默认 'zh-CN' */
  lang?: string;
  /** 语速 0.1-10，默认 1 */
  rate?: number;
  /** 音调 0-2，默认 1 */
  pitch?: number;
  /** 音量 0-1，默认 1 */
  volume?: number;
  /** 语音选择偏好 */
  voicePreference?: 'female' | 'male';
}

export interface UseTTSReturn {
  /** 是否正在播放 */
  speaking: boolean;
  /** 浏览器是否支持 TTS */
  supported: boolean;
  /** 可用语音列表 */
  voices: SpeechSynthesisVoice[];
  /** 当前朗读的文本 */
  currentText: string;
  /** 播放/朗读文本 */
  speak: (text: string) => void;
  /** 暂停 */
  pause: () => void;
  /** 恢复 */
  resume: () => void;
  /** 停止 */
  stop: () => void;
  /** 取消所有待播放 */
  cancel: () => void;
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const {
    lang = 'zh-CN',
    rate = 1,
    pitch = 1,
    volume = 1,
    voicePreference = 'female',
  } = options;

  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentText, setCurrentText] = useState('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices (they load async in some browsers)
  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  // Find best matching voice
  const findVoice = useCallback((): SpeechSynthesisVoice | null => {
    const zhVoices = voices.filter(v => v.lang.startsWith('zh'));

    if (zhVoices.length === 0) return null;

    // Prefer female voice
    if (voicePreference === 'female') {
      const female = zhVoices.find(
        v => v.name.includes('Female') || v.name.includes('Xiaoxiao') || v.name.includes('Tingting')
      );
      if (female) return female;
    } else {
      const male = zhVoices.find(
        v => v.name.includes('Male') || v.name.includes('Yunxi')
      );
      if (male) return male;
    }

    // Prefer native-sounding voices
    const google = zhVoices.find(v => v.name.includes('Google'));
    if (google) return google;

    return zhVoices[0];
  }, [voices, voicePreference]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const voice = findVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setSpeaking(true);
        setCurrentText(text);
      };

      utterance.onend = () => {
        setSpeaking(false);
        setCurrentText('');
      };

      utterance.onerror = (event) => {
        // Ignore 'canceled' and 'interrupted' as they're intentional
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('TTS error:', event.error);
        }
        setSpeaking(false);
        setCurrentText('');
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('TTS speak error:', err);
        setSpeaking(false);
        setCurrentText('');
      }
    },
    [supported, lang, rate, pitch, volume, findVoice]
  );

  const pause = useCallback(() => {
    if (supported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setSpeaking(false);
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeaking(true);
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setCurrentText('');
    }
  }, [supported]);

  const cancel = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setCurrentText('');
    }
  }, [supported]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return {
    speaking,
    supported,
    voices,
    currentText,
    speak,
    pause,
    resume,
    stop,
    cancel,
  };
}
