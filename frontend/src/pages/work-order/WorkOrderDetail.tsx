import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { workOrderService } from '@/services/api';
import { STATUS_CONFIG, TYPE_CONFIG } from '@/types/workOrder';
import type { WorkOrderStatus, WorkOrderType, MessageVO } from '@/types/workOrder';

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'teacher';

  const {
    currentOrder, messages, messagesLoading,
    setCurrentOrder, setMessages, addMessage, setMessagesLoading, updateOrderStatus,
  } = useWorkOrderStore();

  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateTarget, setEscalateTarget] = useState('');
  const [escalateNote, setEscalateNote] = useState('');
  const [adminList, setAdminList] = useState<Array<{ id: string; username: string; realName: string; role: string }>>([]);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTarget, setReassignTarget] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch detail
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await workOrderService.getDetail(id);
      setCurrentOrder(res.data.data);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [id, setCurrentOrder]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!id) return;
    setMessagesLoading(true);
    try {
      const res = await workOrderService.getMessages(id);
      setMessages(res.data.data.records);
    } catch { /* handled */ }
    finally { setMessagesLoading(false); }
  }, [id, setMessages, setMessagesLoading]);

  useEffect(() => { fetchDetail(); fetchMessages(); }, [fetchDetail, fetchMessages]);

  useEffect(() => {
    if (isAdmin) {
      workOrderService.getAdminList().then(res => {
        setAdminList((res.data?.data as any[]) || []);
      }).catch(() => {});
    }
  }, [isAdmin]);

  // Poll messages every 10s
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;
    setSending(true);
    try {
      const res = await workOrderService.sendMessage(id, { content: newMessage.trim() });
      addMessage(res.data.data);
      setNewMessage('');
    } catch { /* handled */ }
    finally { setSending(false); }
  };

  const handleAction = async (action: string) => {
    if (!id) return;
    setActionLoading(action);
    try {
      switch (action) {
        case 'submit': {
          const res = await workOrderService.submit(id);
          updateOrderStatus(id, res.data.data.status);
          break;
        }
        case 'accept': {
          const res = await workOrderService.accept(id);
          updateOrderStatus(id, res.data.data.status, { assigneeName: user?.username });
          break;
        }
        case 'resolve': {
          const res = await workOrderService.resolve(id, resolution);
          updateOrderStatus(id, res.data.data.status);
          setShowResolve(false);
          setResolution('');
          break;
        }
        case 'close': {
          const res = await workOrderService.close(id);
          updateOrderStatus(id, res.data.data.status);
          break;
        }
        case 'escalate': {
          await workOrderService.escalate(id, Number(escalateTarget), escalateNote);
          setShowEscalate(false);
          setEscalateTarget('');
          setEscalateNote('');
          break;
        }
        case 'reassign': {
          const res = await workOrderService.reassign(id, reassignTarget);
          if (currentOrder) updateOrderStatus(id, currentOrder.status, { assigneeName: res.data.data.assigneeId });
          setShowReassign(false);
          setReassignTarget('');
          break;
        }
      }
      fetchDetail();
      fetchMessages();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '操作失败';
      alert(msg);
    } finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">工单不存在或无权查看</p>
        <button onClick={() => navigate('/work-orders')} className="mt-4 text-accent-600 text-sm hover:underline">返回列表</button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[currentOrder.status as WorkOrderStatus] || { label: currentOrder.status, color: 'bg-slate-100' };
  const typeCfg = TYPE_CONFIG[currentOrder.type as WorkOrderType] || { label: currentOrder.type, color: 'bg-slate-100' };
  const canSubmit = currentOrder.status === 'DRAFT' && !isAdmin;
  const canAccept = currentOrder.status === 'PENDING' && isAdmin;
  const canResolve = currentOrder.status === 'PROCESSING' && isAdmin;
  const canClose = (currentOrder.status === 'PENDING' && isAdmin) ||
                    currentOrder.status === 'PROCESSING' ||
                    currentOrder.status === 'RESOLVED';
  const canEscalate = (currentOrder.status === 'PENDING' || currentOrder.status === 'PROCESSING') && isAdmin;
  const canReassign = currentOrder!.status === 'PROCESSING' && isAdmin;
  const canMessage = currentOrder!.status !== 'RESOLVED' && currentOrder!.status !== 'CLOSED';

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-100 bg-white shrink-0">
        <button onClick={() => navigate('/work-orders')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-slate-800 truncate">{currentOrder.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${typeCfg.color}`}>{typeCfg.label}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
            <span className="text-xs text-slate-400">#{currentOrder.id.slice(-8)}</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Order info */}
        <div className="w-96 border-r border-slate-100 overflow-auto shrink-0 bg-white p-5 space-y-5">
          {/* Meta */}
          <div className="space-y-3">
            <MetaItem label="提交人" value={currentOrder.submitter?.username} />
            <MetaItem label="处理人" value={currentOrder.assignee?.username || '未分配'} />
            <MetaItem label="优先级">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                currentOrder.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                currentOrder.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {{ LOW: '低', MEDIUM: '中', HIGH: '高', URGENT: '紧急' }[currentOrder.priority] || currentOrder.priority}
              </span>
            </MetaItem>
            <MetaItem label="创建时间" value={new Date(currentOrder.createdAt).toLocaleString('zh-CN')} />
            <MetaItem label="更新时间" value={new Date(currentOrder.updatedAt).toLocaleString('zh-CN')} />
            {currentOrder.escalatedTo && (
              <MetaItem label="已转报" value={`${currentOrder.escalatedTo.username} — ${currentOrder.escalationNote || ''}`} />
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">详细描述</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{currentOrder.description}</p>
          </div>

          {/* Attachments */}
          {currentOrder.attachments.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                附件 ({currentOrder.attachments.length})
              </h3>
              <div className="space-y-2">
                {currentOrder.attachments.map((att) => (
                  <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors group">
                    {att.fileType === 'IMAGE' ? (
                      <img src={att.thumbnailUrl || att.fileUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-xl">🎬</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate group-hover:text-accent-600 transition-colors">{att.fileName}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(att.fileSize)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          {currentOrder.resolution && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">✅ 解决说明</h3>
              <p className="text-sm text-green-800 whitespace-pre-wrap">{currentOrder.resolution}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            {canSubmit && (
              <ActionBtn label="提交工单" icon="📤" color="bg-accent-600 hover:bg-accent-700 text-white"
                loading={actionLoading === 'submit'} onClick={() => handleAction('submit')} />
            )}
            {canAccept && (
              <ActionBtn label="接单处理" icon="✋" color="bg-blue-600 hover:bg-blue-700 text-white"
                loading={actionLoading === 'accept'} onClick={() => handleAction('accept')} />
            )}
            {canResolve && (
              <>
                <button onClick={() => setShowResolve(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all active:scale-95">
                  ✅ 标记为已解决
                </button>
                {showResolve && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <textarea value={resolution} onChange={(e) => setResolution(e.target.value)}
                      placeholder="请填写解决说明..." rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none focus:ring-2 focus:ring-green-500/20" />
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('resolve')} disabled={!resolution.trim() || actionLoading !== null}
                        className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {actionLoading === 'resolve' ? '提交中...' : '确认解决'}
                      </button>
                      <button onClick={() => setShowResolve(false)}
                        className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-700">取消</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {canEscalate && (
              <>
                <button onClick={() => setShowEscalate(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-all active:scale-95">
                  🔄 转报上级
                </button>
                {showEscalate && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <select value={escalateTarget} onChange={(e) => setEscalateTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white">
                      <option value="">选择转报目标管理员...</option>
                      {adminList.map(a => (
                        <option key={a.id} value={a.id}>{a.realName} ({a.username}) — {a.role}</option>
                      ))}
                    </select>
                    <textarea value={escalateNote} onChange={(e) => setEscalateNote(e.target.value)}
                      placeholder="转报原因..." rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('escalate')} disabled={!escalateTarget || !escalateNote || actionLoading !== null}
                        className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50">
                        {actionLoading === 'escalate' ? '转报中...' : '确认转报'}
                      </button>
                      <button onClick={() => setShowEscalate(false)} className="px-4 py-1.5 text-sm text-slate-500">取消</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {canReassign && (
              <>
                <button onClick={() => setShowReassign(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-all active:scale-95">
                  🔀 转派他人
                </button>
                {showReassign && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <input value={reassignTarget} onChange={(e) => setReassignTarget(e.target.value)}
                      placeholder="输入目标管理员ID" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('reassign')} disabled={!reassignTarget || actionLoading !== null}
                        className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50">
                        {actionLoading === 'reassign' ? '转派中...' : '确认转派'}
                      </button>
                      <button onClick={() => setShowReassign(false)} className="px-4 py-1.5 text-sm text-slate-500">取消</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {canClose && (
              <ActionBtn label="关闭工单" icon="🔒" color="bg-slate-600 hover:bg-slate-700 text-white"
                loading={actionLoading === 'close'} onClick={() => handleAction('close')} />
            )}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-warm-page/30">
          {/* Messages */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {messagesLoading && messages.length === 0 ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm text-slate-400">暂无留言，发送第一条消息开始沟通</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} isMine={msg.senderId === Number(user?.id)} />
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0">
            {canMessage ? (
              <div className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="输入回复... (Enter 发送，Shift+Enter 换行)"
                  rows={2}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none outline-none
                             focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-5 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-medium
                             hover:bg-accent-700 disabled:opacity-40 transition-all active:scale-95 shrink-0"
                >
                  {sending ? '...' : '发送'}
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-400 py-2">
                🛑 工单已{currentOrder.status === 'RESOLVED' ? '解决' : '关闭'}，不再支持留言
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function MetaItem({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 text-right">
        {children || value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

function ActionBtn({ label, icon, color, loading, onClick }: {
  label: string; icon: string; color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${color}`}>
      {loading ? '处理中...' : `${icon} ${label}`}
    </button>
  );
}

function ChatBubble({ msg, isMine }: { msg: MessageVO; isMine: boolean }) {
  const isSystem = msg.messageType === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${
        msg.senderRole === 'admin' || msg.senderRole === 'hr'
          ? 'bg-gradient-to-br from-teal-500 to-emerald-500'
          : 'bg-gradient-to-br from-accent-500 to-brand-600'
      }`}>
        {msg.senderName[0]}
      </div>

      {/* Bubble */}
      <div className={`max-w-[70%] ${isMine ? 'items-end' : ''}`}>
        <div className={`flex items-center gap-2 mb-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium text-slate-600">{msg.senderName}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isMine
            ? 'bg-accent-600 text-white rounded-tr-md'
            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-md'
        }`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
