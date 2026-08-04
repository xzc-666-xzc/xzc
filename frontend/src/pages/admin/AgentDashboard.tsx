import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '@/stores';
import { workOrderService, userService } from '@/services/api';
import type { WorkOrderDetailVO } from '@/types/workOrder';
import type { MessageVO } from '@/types/workOrder';

type QueueTab = 'pending' | 'mine' | 'resolved' | 'closed';
type OnlineStatus = 'online' | 'busy' | 'offline';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
  PENDING: { label: '待处理', color: 'bg-amber-100 text-amber-700' },
  PROCESSING: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: '已解决', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: '已关闭', color: 'bg-slate-200 text-slate-500' },
};

const TYPE_CFG: Record<string, { label: string; icon: string }> = {
  INTERVIEW_FAULT: { label: '面试故障', icon: '🔴' },
  FEATURE_SUGGESTION: { label: '功能建议', icon: '🟡' },
  BUG_REPORT: { label: 'BUG上报', icon: '🟣' },
};

export default function AgentDashboard() {
  const user = useUserStore(s => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'teacher';

  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('online');
  const [queueTab, setQueueTab] = useState<QueueTab>('pending');
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkOrderDetailVO | null>(null);
  const [messages, setMessages] = useState<MessageVO[]>([]);
  const [msgText, setMsgText] = useState('');
  const [internalText, setInternalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showInternalInput, setShowInternalInput] = useState(false);
  const [stats, setStats] = useState({ todayResolved: 0, avgResponseMin: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    try {
      let status: string | undefined;
      switch (queueTab) {
        case 'pending': status = 'PENDING'; break;
        case 'mine': status = 'PROCESSING'; break;
        case 'resolved': status = 'RESOLVED'; break;
        case 'closed': status = 'CLOSED'; break;
      }
      const res = await workOrderService.list({ page: 1, pageSize: 50, status });
      setTickets((res.data?.data as any)?.records || []);
    } catch {} finally { setLoading(false); }
  }, [queueTab]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Poll for new tickets
  useEffect(() => {
    pollRef.current = setInterval(fetchQueue, 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchQueue]);

  // Fetch detail + messages when selecting
  useEffect(() => {
    if (!selectedId) { setDetail(null); setMessages([]); return; }
    setDetailLoading(true);
    Promise.all([
      workOrderService.getDetail(selectedId),
      workOrderService.getMessages(selectedId),
    ]).then(([dRes, mRes]) => {
      setDetail(dRes.data?.data as any);
      setMessages((mRes.data?.data as any)?.records || []);
    }).catch(() => {}).finally(() => setDetailLoading(false));
  }, [selectedId]);

  // Scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Heartbeat
  useEffect(() => { userService.heartbeat().catch(() => {}); }, []);

  // Send message
  const sendMessage = async (isInternal: boolean) => {
    const text = isInternal ? internalText : msgText;
    if (!text.trim() || !selectedId) return;
    try {
      const res = await workOrderService.sendMessage(selectedId, {
        content: (isInternal ? '[内部上报] ' : '') + text.trim(),
        messageType: 'TEXT',
      });
      setMessages(prev => [...prev, res.data?.data as any]);
      if (isInternal) { setInternalText(''); setShowInternalInput(false); }
      else setMsgText('');
    } catch (err: any) { alert(err?.response?.data?.message || '发送失败'); }
  };

  // Actions
  const doAction = async (action: string) => {
    if (!selectedId) return;
    setActionLoading(action);
    try {
      switch (action) {
        case 'accept': await workOrderService.accept(selectedId); break;
        case 'resolve': await workOrderService.resolve(selectedId, '已解决'); break;
        case 'close': await workOrderService.close(selectedId); break;
        case 'returnToPool': await workOrderService.returnToPool(selectedId); break;
        case 'forceClose': {
          const r = prompt('强制关闭原因：'); if (r === null) { setActionLoading(null); return; }
          await workOrderService.forceClose(selectedId, r || '');
          break;
        }
      }
      fetchQueue();
      if (selectedId) {
        const dRes = await workOrderService.getDetail(selectedId);
        setDetail(dRes.data?.data as any);
      }
    } catch (err: any) { alert(err?.response?.data?.message || '操作失败'); }
    setActionLoading(null);
  };

  if (!isAdmin) return <div className="p-20 text-center text-slate-400">仅管理员可访问</div>;

  const status = detail?.status || '';
  const isProcessing = status === 'PROCESSING';
  const isPending = status === 'PENDING';
  const canClose = status && status !== 'CLOSED';

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* ===== Top Status Bar ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOnlineStatus(s => s === 'online' ? 'busy' : 'online')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              onlineStatus === 'online' ? 'bg-green-100 text-green-700' :
              onlineStatus === 'busy' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-500'
            }`}>
            <span className={`w-2 h-2 rounded-full ${
              onlineStatus === 'online' ? 'bg-green-500 animate-pulse' :
              onlineStatus === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
            }`} />
            {onlineStatus === 'online' ? '在线 🔵' : onlineStatus === 'busy' ? '忙碌 🟡' : '离线 ⚪'}
          </button>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-500">今日已处理 <b className="text-slate-700">{stats.todayResolved}</b> 单</span>
        </div>
        <div className="text-xs text-slate-400">
          {user?.username} · 客服工作台
        </div>
      </div>

      {/* ===== Three-Column Body ===== */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Ticket Queue */}
        <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-white">
          <div className="flex border-b border-slate-100">
            {(['pending','mine','resolved','closed'] as QueueTab[]).map(t => (
              <button key={t} onClick={() => { setQueueTab(t); setSelectedId(null); }}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  queueTab === t ? 'text-accent-600 border-b-2 border-accent-600' : 'text-slate-400 hover:text-slate-600'
                }`}>
                {{ pending:'待处理', mine:'我的', resolved:'已解决', closed:'已关闭' }[t]}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">暂无工单</div>
            ) : (
              tickets.map((t: any) => {
                const typeCfg = TYPE_CFG[t.type] || { label: t.type, icon: '📌' };
                return (
                  <div key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                      selectedId === t.id ? 'bg-accent-50 border-l-2 border-l-accent-500' : 'hover:bg-slate-50'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">{typeCfg.icon}</span>
                      <span className="text-sm font-medium text-slate-800 truncate flex-1">{t.title}</span>
                      {t.unread && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 ml-5">
                      <span>{t.submitterName}</span>
                      <span>·</span>
                      <span>{t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : ''}</span>
                      {t.messageCount > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{t.messageCount}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER: Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-warm-page/20">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              👈 选择左侧工单开始处理
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {(detail?.submitter?.username || '?')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{detail?.submitter?.username}</p>
                    <p className="text-[10px] text-slate-400">{detail?.title}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_CFG[status]?.color || ''}`}>
                  {STATUS_CFG[status]?.label || status}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
                {messages.map(msg => {
                  const isSystem = msg.messageType === 'SYSTEM';
                  const isInternal = msg.content?.startsWith('[内部上报]');
                  const isMine = msg.senderId === Number(user?.id);

                  if (isSystem) {
                    return <div key={msg.id} className="flex justify-center"><span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{msg.content}</span></div>;
                  }
                  if (isInternal) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 max-w-[80%]">
                          <p className="text-[10px] text-purple-600 font-medium mb-0.5">🔒 内部上报</p>
                          <p className="text-xs text-purple-800 whitespace-pre-wrap">{msg.content.replace('[内部上报] ', '')}</p>
                          <p className="text-[9px] text-purple-400 mt-1">{msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                        msg.senderRole === 'admin' || msg.senderRole === 'hr' ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gradient-to-br from-accent-500 to-brand-600'
                      }`}>{msg.senderName[0]}</div>
                      <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                        isMine ? 'bg-accent-600 text-white rounded-tr-md' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-md'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <p className={`text-[9px] mt-1 ${isMine ? 'text-accent-200' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input + Actions */}
              <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0 space-y-2">
                {/* Quick actions */}
                <div className="flex gap-2">
                  {isPending && (
                    <button onClick={() => doAction('accept')} disabled={actionLoading !== null}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      ✋ 接单处理
                    </button>
                  )}
                  {isProcessing && (
                    <>
                      <button onClick={() => doAction('resolve')} disabled={actionLoading !== null}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
                        ✅ 解决
                      </button>
                      <button onClick={() => doAction('returnToPool')} disabled={actionLoading !== null}
                        className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:opacity-50">
                        🔄 退回
                      </button>
                    </>
                  )}
                  {canClose && (
                    <button onClick={() => doAction('close')} disabled={actionLoading !== null}
                      className="px-3 py-1.5 bg-slate-500 text-white text-xs rounded-lg hover:bg-slate-600 disabled:opacity-50">
                      🔒 关闭
                    </button>
                  )}
                  <button onClick={() => doAction('forceClose')} disabled={actionLoading !== null}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50">
                    ⛔ 强制关闭
                  </button>
                  <button onClick={() => setShowInternalInput(!showInternalInput)}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs rounded-lg hover:bg-purple-200">
                    🔒 内部上报
                  </button>
                </div>

                {/* Internal input */}
                {showInternalInput && (
                  <div className="flex gap-2">
                    <input value={internalText} onChange={e => setInternalText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendMessage(true); }}
                      placeholder="内部上报（仅管理员可见）..."
                      className="flex-1 px-3 py-1.5 border border-purple-200 rounded-lg text-xs outline-none bg-purple-50" />
                    <button onClick={() => sendMessage(true)}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">发送</button>
                  </div>
                )}

                {/* Normal input */}
                <div className="flex gap-2">
                  <input value={msgText} onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(false); }}
                    placeholder="输入回复..."
                    disabled={status === 'RESOLVED' || status === 'CLOSED'}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent-500/20 disabled:bg-slate-50" />
                  <button onClick={() => sendMessage(false)} disabled={!msgText.trim() || status === 'RESOLVED' || status === 'CLOSED'}
                    className="px-5 py-2 bg-accent-600 text-white text-sm rounded-lg hover:bg-accent-700 disabled:opacity-40">发送</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Context Panel */}
        <div className="w-72 border-l border-slate-100 bg-white overflow-auto shrink-0 p-4 space-y-4">
          {!detail ? (
            <p className="text-xs text-slate-400 text-center pt-10">选择工单查看详情</p>
          ) : (
            <>
              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">基本信息</h4>
                <p className="text-sm font-semibold text-slate-800 mb-1">{detail.title}</p>
                <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{detail.description}</p>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">问题类型</h4>
                <span className="text-xs">{(TYPE_CFG[detail.type] || {}).icon} {(TYPE_CFG[detail.type] || {}).label || detail.type}</span>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">分配信息</h4>
                {detail.assignee ? (
                  <p className="text-xs text-slate-600">当前处理人：<b>{detail.assignee.username}</b></p>
                ) : (
                  <p className="text-xs text-amber-600">待系统自动分配</p>
                )}
              </div>

              {/* Attachments */}
              {detail.attachments && detail.attachments.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    附件 ({detail.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {detail.attachments.map((att: any) => (
                      <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="block bg-slate-50 rounded-lg p-2 hover:bg-slate-100 transition-colors">
                        {att.fileType === 'IMAGE' ? (
                          <img src={att.thumbnailUrl || att.fileUrl} alt="" className="w-full h-20 object-cover rounded mb-1" />
                        ) : <span className="text-xl">🎬</span>}
                        <p className="text-[10px] text-slate-500 truncate">{att.fileName}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {detail.resolution && (
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="text-[10px] font-semibold text-green-600 mb-1">✅ 解决说明</h4>
                  <p className="text-xs text-green-800">{detail.resolution}</p>
                </div>
              )}

              {/* History log */}
              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">流转记录</h4>
                <div className="space-y-1.5">
                  {messages.filter(m => m.messageType === 'SYSTEM').slice(-5).map(m => (
                    <p key={m.id} className="text-[10px] text-slate-400">· {m.content}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
