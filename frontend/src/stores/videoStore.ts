import { create } from 'zustand';
import type { Question } from '@/types';

export interface VideoState {
  roomId: string;
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isRecording: boolean;
  currentQuestionIndex: number;
  questions: Question[];
  duration: number;
  status: 'idle' | 'ready' | 'ongoing' | 'ended';
  aiState: 'greeting' | 'thinking' | 'asking' | 'listening' | 'encouraging' | 'ending';

  setRoomId: (id: string) => void;
  setStream: (stream: MediaStream | null) => void;
  toggleCamera: () => void;
  toggleMic: () => void;
  setRecording: (v: boolean) => void;
  setQuestions: (qs: Question[]) => void;
  nextQuestion: () => void;
  setStatus: (s: VideoState['status']) => void;
  setAiState: (s: VideoState['aiState']) => void;
  tick: () => void;
  reset: () => void;
}

const initialState = {
  roomId: '',
  stream: null,
  isCameraOn: true,
  isMicOn: true,
  isRecording: false,
  currentQuestionIndex: 0,
  questions: [] as Question[],
  duration: 0,
  status: 'idle' as const,
  aiState: 'greeting' as const,
};

export const useVideoStore = create<VideoState>((set, get) => ({
  ...initialState,

  setRoomId: (id) => set({ roomId: id }),

  setStream: (stream) => set({ stream }),

  toggleCamera: () => {
    const { stream, isCameraOn } = get();
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = !isCameraOn; });
      set({ isCameraOn: !isCameraOn });
    }
  },

  toggleMic: () => {
    const { stream, isMicOn } = get();
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = !isMicOn; });
      set({ isMicOn: !isMicOn });
    }
  },

  setRecording: (v) => set({ isRecording: v }),

  setQuestions: (qs) => set({ questions: qs }),

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1, duration: 0 });
    }
  },

  setStatus: (s) => set({ status: s }),

  setAiState: (s) => set({ aiState: s }),

  tick: () => set(s => ({ duration: s.duration + 1 })),

  reset: () => set({ ...initialState, stream: null }),
}));
