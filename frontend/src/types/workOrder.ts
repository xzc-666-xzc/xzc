/** 工单状态 */
export type WorkOrderStatus = 'DRAFT' | 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';

/** 问题类型 */
export type WorkOrderType = 'INTERVIEW_FAULT' | 'FEATURE_SUGGESTION' | 'BUG_REPORT';

/** 优先级 */
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/** 创建工单请求 */
export interface CreateWorkOrderRequest {
  title: string;
  type: WorkOrderType;
  description: string;
  priority?: WorkOrderPriority;
}

/** 发送留言请求 */
export interface SendMessageRequest {
  content: string;
  messageType?: 'TEXT';
}

/** 工单列表项 */
export interface WorkOrderListVO {
  id: string;
  title: string;
  type: WorkOrderType;
  typeLabel: string;
  status: WorkOrderStatus;
  statusLabel: string;
  priority: WorkOrderPriority;
  submitterName: string;
  assigneeName: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 工单详情 */
export interface WorkOrderDetailVO {
  id: string;
  title: string;
  type: WorkOrderType;
  typeLabel: string;
  description: string;
  status: WorkOrderStatus;
  statusLabel: string;
  priority: WorkOrderPriority;
  submitter: { id: string; username: string; avatar: string | null } | null;
  assignee: { id: string; username: string; avatar: string | null } | null;
  escalatedTo: { id: string; username: string } | null;
  escalationNote: string | null;
  resolution: string | null;
  attachments: AttachmentVO[];
  createdAt: string;
  updatedAt: string;
}

/** 留言 */
export interface MessageVO {
  id: string;
  senderId: number;
  senderName: string;
  senderRole: 'candidate' | 'admin' | 'hr' | 'system';
  content: string;
  messageType: 'TEXT' | 'SYSTEM' | 'ESCALATION';
  createdAt: string;
}

/** 附件 */
export interface AttachmentVO {
  id: string;
  fileName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'FILE';
  fileSize: number;
  fileUrl: string;
  thumbnailUrl: string | null;
  uploaderId: number;
  createdAt: string;
}

/** 状态标签映射 */
export const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string }> = {
  DRAFT:      { label: '草稿',   color: 'bg-slate-100 text-slate-600' },
  PENDING:    { label: '待处理', color: 'bg-orange-100 text-orange-700' },
  PROCESSING: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  RESOLVED:   { label: '已解决', color: 'bg-green-100 text-green-700' },
  CLOSED:     { label: '已关闭', color: 'bg-slate-200 text-slate-500' },
};

/** 类型标签映射 */
export const TYPE_CONFIG: Record<WorkOrderType, { label: string; color: string }> = {
  INTERVIEW_FAULT:    { label: '面试故障', color: 'bg-red-100 text-red-700' },
  FEATURE_SUGGESTION: { label: '功能建议', color: 'bg-purple-100 text-purple-700' },
  BUG_REPORT:         { label: 'BUG上报',  color: 'bg-amber-100 text-amber-700' },
};
