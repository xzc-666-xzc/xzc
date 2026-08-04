import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 - 注入 Token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
http.interceptors.response.use(
  (res) => {
    // 检查业务码：401xx 未认证，触发登录跳转
    const bizCode = res.data?.code;
    if (bizCode === 40100 || bizCode === 40101) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('未登录'));
    }
    // 检查业务码：40300 权限不足
    if (bizCode === 40300) {
      console.warn('权限不足:', res.data?.message);
    }
    return res;
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      console.warn('HTTP 403: 权限不足');
    }
    return Promise.reject(error);
  }
);

// ==================== 用户服务 ====================
export const userService = {
  login: (data: { username: string; password: string }) =>
    http.post<ApiResponse<{ token: string; user: unknown }>>('/user/login', data),

  register: (data: { username: string; realName: string; password: string; email: string; role: string }) =>
    http.post<ApiResponse<{ token: string; user: unknown }>>('/user/register', data),

  checkAccount: (username: string) =>
    http.get<ApiResponse<{ exists: boolean }>>('/user/check-username', { params: { username } }),

  getProfile: () =>
    http.get<ApiResponse<unknown>>('/user/profile'),

  updateProfile: (data: unknown) =>
    http.put<ApiResponse<unknown>>('/user/profile', data),

  getLeaderboard: () =>
    http.get<ApiResponse<LeaderboardEntry[]>>('/user/leaderboard'),
};

export interface LeaderboardEntry {
  username: string;
  interviewCount: number;
  avgScore: number;
}

export interface AdminBrief {
  id: string;
  username: string;
  realName: string;
  role: string;
}

export interface OngoingInterview {
  id: string;
  userId: string;
  positionName: string;
  difficulty: string;
  mode: string;
  type: string;
  status: string;
  startedAt: string;
  questionCount: number;
  elapsedMinutes: number;
  isTimeout: boolean;
}

// ==================== 岗位服务 ====================
export const positionService = {
  list: (params?: { category?: string; keyword?: string }) =>
    http.get<ApiResponse<unknown[]>>('/positions', { params }),

  getById: (id: string) =>
    http.get<ApiResponse<unknown>>(`/positions/${id}`),
};

// ==================== 面试服务 ====================
export const interviewService = {
  create: (config: unknown) =>
    http.post<ApiResponse<{ interviewId: string }>>('/interviews', config),

  getById: (id: string) =>
    http.get<ApiResponse<unknown>>(`/interviews/${id}`),

  saveQuestion: (interviewId: string, data: { content: string; index: number }) =>
    http.post<ApiResponse<{ questionId: string }>>(`/interviews/${interviewId}/questions`, data),

  submitAnswer: (interviewId: string, data: { questionId: string; content: string; duration: number }) =>
    http.post<ApiResponse<unknown>>(`/interviews/${interviewId}/answers`, data),

  complete: (interviewId: string) =>
    http.post<ApiResponse<unknown>>(`/interviews/${interviewId}/complete`),

  getHistory: (params?: { page?: number; pageSize?: number }) =>
    http.get<ApiResponse<unknown>>('/interviews/history', { params }),

  pause: (interviewId: string) =>
    http.post<ApiResponse<unknown>>(`/interviews/${interviewId}/pause`),

  resume: (interviewId: string) =>
    http.post<ApiResponse<unknown>>(`/interviews/${interviewId}/resume`),

  /** HR 创建面试模板并生成邀请码 */
  createByHR: (config: Omit<import('@/types').InterviewConfig, 'duration'>) =>
    http.post<ApiResponse<{ interviewId: string; code: string }>>('/interviews/create-by-hr', config),

  /** 候选人通过邀请码加入面试 */
  joinByCode: (code: string) =>
    http.post<ApiResponse<{
      interviewId: string;
      positionId: string;
      positionName: string;
      difficulty: string;
      mode: string;
      type: string;
      questionCount: number;
      duration: number;
    }>>('/interviews/join-by-code', { code }),

  /** HR 查看自己创建的面试模板列表 */
  getHrList: (params?: { page?: number; pageSize?: number }) =>
    http.get<ApiResponse<import('@/types').PageData<import('@/types').InterviewTemplate>>>('/interviews/hr-list', { params }),

  /** 管理员：获取进行中的面试列表 */
  getOngoingList: () =>
    http.get<ApiResponse<OngoingInterview[]>>('/interviews/admin/ongoing'),

  /** 管理员：强制终止面试 */
  forceEnd: (interviewId: string) =>
    http.post<ApiResponse<{ message: string }>>(`/interviews/admin/${interviewId}/force-end`),
};

// ==================== 报告服务 ====================
export const reportService = {
  getByInterviewId: (interviewId: string) =>
    http.get<ApiResponse<unknown>>(`/reports/${interviewId}`),

  getEvaluateDetail: (answerId: string) =>
    http.get<ApiResponse<unknown>>(`/reports/evaluate/${answerId}`),
};

// ==================== 语音服务 ====================
export const voiceService = {
  /** 服务端 ASR：上传音频 blob，返回识别文本 */
  transcribe: (audioBlob: Blob, interviewId: string, questionId: string) => {
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    form.append('interviewId', interviewId);
    form.append('questionId', questionId);
    return http.post<ApiResponse<{ transcript: string; confidence: number }>>(
      '/voice/transcribe',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 }
    );
  },

  /** TTS 合成：文本转语音，返回 audio blob URL */
  synthesize: (text: string, options?: { rate?: number; pitch?: number }) => {
    // 优先使用浏览器内置 TTS（无需服务端），服务端 TTS 作为备选
    return http.post<ApiResponse<{ audioUrl: string }>>('/voice/synthesize', {
      text,
      rate: options?.rate || 1,
      pitch: options?.pitch || 1,
    });
  },
};

// ==================== 错题本服务 ====================
export const wrongBookService = {
  list: (params?: { page?: number; pageSize?: number; tags?: string[] }) =>
    http.get<ApiResponse<unknown>>('/wrong-book', { params }),

  review: (id: string) =>
    http.post<ApiResponse<unknown>>(`/wrong-book/${id}/review`),
};

// ==================== 工单服务 ====================
export const workOrderService = {
  create: (data: import('@/types/workOrder').CreateWorkOrderRequest) =>
    http.post<ApiResponse<{ id: string; status: string; createdAt: string }>>('/work-orders', data),

  list: (params?: { page?: number; pageSize?: number; status?: string; type?: string; keyword?: string }) =>
    http.get<ApiResponse<import('@/types').PageData<import('@/types/workOrder').WorkOrderListVO>>>('/work-orders', { params }),

  getDetail: (id: string) =>
    http.get<ApiResponse<import('@/types/workOrder').WorkOrderDetailVO>>(`/work-orders/${id}`),

  update: (id: string, data: import('@/types/workOrder').CreateWorkOrderRequest) =>
    http.put<ApiResponse<void>>(`/work-orders/${id}`, data),

  submit: (id: string) =>
    http.post<ApiResponse<{ id: string; status: string }>>(`/work-orders/${id}/submit`),

  accept: (id: string) =>
    http.post<ApiResponse<{ id: string; status: string; assigneeId: string }>>(`/work-orders/${id}/accept`),

  resolve: (id: string, resolution: string) =>
    http.post<ApiResponse<{ id: string; status: string }>>(`/work-orders/${id}/resolve`, { resolution }),

  close: (id: string) =>
    http.post<ApiResponse<{ id: string; status: string }>>(`/work-orders/${id}/close`),

  escalate: (id: string, escalatedTo: number, note: string) =>
    http.post<ApiResponse<{ id: string }>>(`/work-orders/${id}/escalate`, { escalatedTo, note }),

  getAdminList: () =>
    http.get<ApiResponse<AdminBrief[]>>('/work-orders/admin-list'),

  reassign: (id: string, assigneeId: string) =>
    http.post<ApiResponse<{ id: string; assigneeId: string }>>(`/work-orders/${id}/reassign`, { assigneeId }),

  getMessages: (orderId: string, params?: { page?: number; pageSize?: number }) =>
    http.get<ApiResponse<import('@/types').PageData<import('@/types/workOrder').MessageVO>>>(`/work-orders/${orderId}/messages`, { params }),

  sendMessage: (orderId: string, data: import('@/types/workOrder').SendMessageRequest) =>
    http.post<ApiResponse<import('@/types/workOrder').MessageVO>>(`/work-orders/${orderId}/messages`, data),

  uploadAttachment: (orderId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<ApiResponse<import('@/types/workOrder').AttachmentVO>>(
      `/work-orders/${orderId}/attachments`, form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
    );
  },

  deleteAttachment: (orderId: string, attId: string) =>
    http.delete<ApiResponse<void>>(`/work-orders/${orderId}/attachments/${attId}`),
};

// ==================== 通知服务 ====================
export const notificationService = {
  getUnreadCount: () =>
    http.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  list: (params?: { page?: number; pageSize?: number }) =>
    http.get<ApiResponse<import('@/types').PageData<unknown>>>('/notifications', { params }),

  markRead: (id: string) =>
    http.put<ApiResponse<void>>(`/notifications/${id}/read`),

  markAllRead: () =>
    http.put<ApiResponse<void>>('/notifications/read-all'),
};

export default http;
