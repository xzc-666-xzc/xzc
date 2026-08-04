import { create } from 'zustand';
import type { WorkOrderListVO, WorkOrderDetailVO, MessageVO } from '@/types/workOrder';

interface WorkOrderState {
  // 列表
  orders: WorkOrderListVO[];
  total: number;
  page: number;
  loading: boolean;

  // 详情
  currentOrder: WorkOrderDetailVO | null;
  messages: MessageVO[];
  messagesLoading: boolean;

  // 筛选
  filterStatus: string;
  filterType: string;
  filterKeyword: string;

  // Actions
  setOrders: (orders: WorkOrderListVO[], total: number, page: number) => void;
  setLoading: (v: boolean) => void;
  setCurrentOrder: (order: WorkOrderDetailVO | null) => void;
  setMessages: (messages: MessageVO[]) => void;
  addMessage: (msg: MessageVO) => void;
  setMessagesLoading: (v: boolean) => void;
  setFilter: (status: string, type: string, keyword: string) => void;
  updateOrderStatus: (orderId: string, status: string, updates?: Record<string, unknown>) => void;
  reset: () => void;
}

export const useWorkOrderStore = create<WorkOrderState>((set) => ({
  orders: [],
  total: 0,
  page: 1,
  loading: false,
  currentOrder: null,
  messages: [],
  messagesLoading: false,
  filterStatus: '',
  filterType: '',
  filterKeyword: '',

  setOrders: (orders, total, page) => set({ orders, total, page }),
  setLoading: (loading) => set({ loading }),
  setCurrentOrder: (currentOrder) => set({ currentOrder }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessagesLoading: (messagesLoading) => set({ messagesLoading }),
  setFilter: (filterStatus, filterType, filterKeyword) =>
    set({ filterStatus, filterType, filterKeyword }),
  updateOrderStatus: (orderId, status, updates) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, status: status as never, ...updates } : o
      ),
      currentOrder: s.currentOrder?.id === orderId
        ? { ...s.currentOrder, status: status as never, ...updates }
        : s.currentOrder,
    })),
  reset: () =>
    set({
      orders: [],
      total: 0,
      page: 1,
      loading: false,
      currentOrder: null,
      messages: [],
      messagesLoading: false,
    }),
}));
