// ---------- 用户 ----------
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'candidate' | 'hr' | 'teacher' | 'admin';
  createdAt: string;
}

// ---------- 面试 ----------
export type InterviewMode = 'text' | 'voice' | 'video';
export type Difficulty = 'junior' | 'middle' | 'senior' | 'expert';
export type InterviewType = 'technical' | 'hr' | 'stress' | 'group' | 'boss';
export type InterviewStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'interrupted'
  | 'cancelled';

export interface Position {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
}

export interface InterviewConfig {
  positionId: string;
  positionName: string;
  difficulty: Difficulty;
  mode: InterviewMode;
  type: InterviewType;
  questionCount: number;
  duration: number; // 预计时长(分钟)
}

export interface Interview {
  id: string;
  userId: string;
  config: InterviewConfig;
  status: InterviewStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  startedAt: string;
  completedAt?: string;
  score?: number;
  summary?: string;
}

export interface Question {
  id: string;
  interviewId: string;
  index: number;
  content: string;
  type: 'main' | 'follow_up';
  parentQuestionId?: string;
  expectedPoints: string[];
  knowledgeTags: string[];
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;        // 文本回答 或 语音转文本
  audioUrl?: string;      // 语音文件URL
  duration: number;       // 回答耗时(秒)
  asrConfidence?: number; // ASR置信度
  createdAt: string;
}

export interface Evaluation {
  answerId: string;
  contentScore: number;         // 内容得分 (0-100)
  logicScore: number;           // 逻辑得分
  depthScore: number;           // 专业深度
  starScore: number;            // STAR方法
  expressionScore: number;      // 表达得分
  overallScore: number;         // 综合得分
  strengths: string[];          // 优点
  weaknesses: string[];         // 不足
  suggestions: string[];        // 改进建议
  referenceAnswer: string;      // 高分参考答案
}

// ---------- 报告 ----------
export interface InterviewReport {
  interviewId: string;
  totalScore: number;
  scores: {
    content: number;
    logic: number;
    depth: number;
    star: number;
    expression: number;
  };
  radarData: {
    dimension: string;
    score: number;
    fullMark: number;
  }[];
  questionDetails: {
    question: string;
    answer: string;
    evaluation: Evaluation;
  }[];
  overallSummary: string;
  strengths: string[];
  weaknesses: string[];
  improvementPlan: string;
  createdAt: string;
}

// ---------- API 通用响应 ----------
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
