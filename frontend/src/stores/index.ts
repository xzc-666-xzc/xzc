import { create } from 'zustand';
import type { User, Interview, InterviewConfig, Question, Answer, Evaluation } from '@/types';

// ---------- 用户状态 ----------
interface UserState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  updateUser: (partial) =>
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
}));

// ---------- 面试状态 ----------
interface InterviewState {
  currentInterview: Interview | null;
  config: InterviewConfig | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  evaluations: Evaluation[];
  isRecording: boolean;
  isPaused: boolean;
  interviewStatus: 'idle' | 'config' | 'in_progress' | 'paused' | 'completed';

  setConfig: (config: InterviewConfig) => void;
  setInterview: (interview: Interview) => void;
  addQuestion: (q: Question) => void;
  nextQuestion: () => void;
  addAnswer: (a: Answer) => void;
  addEvaluation: (e: Evaluation) => void;
  setRecording: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  setStatus: (s: InterviewState['interviewStatus']) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  currentInterview: null,
  config: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  evaluations: [],
  isRecording: false,
  isPaused: false,
  interviewStatus: 'idle',

  setConfig: (config) => set({ config, interviewStatus: 'config' }),
  setInterview: (interview) => set({ currentInterview: interview }),
  addQuestion: (q) => set((s) => ({ questions: [...s.questions, q] })),
  nextQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
  addAnswer: (a) => set((s) => ({ answers: [...s.answers, a] })),
  addEvaluation: (e) => set((s) => ({ evaluations: [...s.evaluations, e] })),
  setRecording: (v) => set({ isRecording: v }),
  setPaused: (v) => set({ isPaused: v }),
  setStatus: (s) => set({ interviewStatus: s }),
  reset: () =>
    set({
      currentInterview: null,
      config: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      evaluations: [],
      isRecording: false,
      isPaused: false,
      interviewStatus: 'idle',
    }),
}));
