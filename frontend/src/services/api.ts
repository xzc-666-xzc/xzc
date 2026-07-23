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
  (res) => res,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== 用户服务 ====================
export const userService = {
  login: (data: { username: string; password: string }) =>
    http.post<ApiResponse<{ token: string; user: unknown }>>('/user/login', data),

  register: (data: { username: string; password: string; email: string; role: string }) =>
    http.post<ApiResponse<{ token: string; user: unknown }>>('/user/register', data),

  getProfile: () =>
    http.get<ApiResponse<unknown>>('/user/profile'),

  updateProfile: (data: unknown) =>
    http.put<ApiResponse<unknown>>('/user/profile', data),
};

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
};

// ==================== 报告服务 ====================
export const reportService = {
  getByInterviewId: (interviewId: string) =>
    http.get<ApiResponse<unknown>>(`/reports/${interviewId}`),

  getEvaluateDetail: (answerId: string) =>
    http.get<ApiResponse<unknown>>(`/reports/evaluate/${answerId}`),
};

// ==================== 错题本服务 ====================
export const wrongBookService = {
  list: (params?: { page?: number; pageSize?: number; tags?: string[] }) =>
    http.get<ApiResponse<unknown>>('/wrong-book', { params }),

  review: (id: string) =>
    http.post<ApiResponse<unknown>>(`/wrong-book/${id}/review`),
};

export default http;
