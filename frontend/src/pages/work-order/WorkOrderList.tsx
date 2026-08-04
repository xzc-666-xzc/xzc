import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { workOrderService } from '@/services/api';
import { STATUS_CONFIG, TYPE_CONFIG } from '@/types/workOrder';
import type { WorkOrderListVO, WorkOrderStatus, WorkOrderType } from '@/types/workOrder';

export default function WorkOrderList() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'teacher';

  const {
    orders, total, page, loading,
    filterStatus, filterType, filterKeyword,
    setOrders, setLoading, setFilter,
  } = useWorkOrderStore();

  const [searchKeyword, setSearchKeyword] = useState(filterKeyword);

  const fetchList = useCallback(async (p?: number) => {
    setLoading(true);
    try {
      const res = await workOrderService.list({
        page: p || page,
        pageSize: 10,
        status: filterStatus || undefined,
        type: filterType || undefined,
        keyword: filterKeyword || undefined,
      });
      const data = res.data.data;
      setOrders(data.records, data.total, data.page);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType, filterKeyword, setOrders, setLoading]);

  useEffect(() => {
    fetchList(1);
  }, [filterStatus, filterType]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setFilter(filterStatus, filterType, searchKeyword);
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: '全部状态' },
    { value: 'DRAFT', label: '草稿' },
    { value: 'PENDING', label: '待处理' },
    { value: 'PROCESSING', label: '处理中' },
    { value: 'RESOLVED', label: '已解决' },
    { value: 'CLOSED', label: '已关闭' },
  ];

  const typeOptions: { value: string; label: string }[] = [
    { value: '', label: '全部类型' },
    { value: 'INTERVIEW_FAULT', label: '面试故障' },
    { value: 'FEATURE_SUGGESTION', label: '功能建议' },
    { value: 'BUG_REPORT', label: 'BUG上报' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">问题反馈工单</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin ? '管理和处理所有用户提交的反馈工单' : '提交和管理您的反馈工单'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => navigate('/work-orders/create')}
            className="px-4 py-2.5 bg-accent-600 text-white text-sm font-medium rounded-xl
                       hover:bg-accent-700 active:scale-95 transition-all duration-200 shadow-button"
          >
            + 创建工单
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilter(e.target.value, filterType, filterKeyword)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600
                     focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilter(filterStatus, e.target.value, filterKeyword)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600
                     focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400"
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索工单标题..."
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600
                       focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 w-48"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-xl hover:bg-slate-200 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500 text-sm">暂无工单记录</p>
          {!isAdmin && (
            <button
              onClick={() => navigate('/work-orders/create')}
              className="mt-4 text-accent-600 text-sm font-medium hover:underline"
            >
              创建第一个工单 →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <WorkOrderCard
                key={order.id}
                order={order}
                onClick={() => navigate(`/work-orders/${order.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">共 {total} 条工单</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchList(page - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40
                           hover:bg-slate-50 transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-slate-500">第 {page} 页</span>
              <button
                disabled={page * 10 >= total}
                onClick={() => fetchList(page + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40
                           hover:bg-slate-50 transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function WorkOrderCard({ order, onClick }: { order: WorkOrderListVO; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[order.status as WorkOrderStatus] || { label: order.status, color: 'bg-slate-100 text-slate-600' };
  const typeCfg = TYPE_CONFIG[order.type as WorkOrderType] || { label: order.type, color: 'bg-slate-100 text-slate-600' };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-card-elevated
                 hover:border-accent-200 cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${typeCfg.color}`}>
              {typeCfg.label}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {order.priority === 'HIGH' || order.priority === 'URGENT' ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-600">
                {order.priority === 'URGENT' ? '紧急' : '高优先'}
              </span>
            ) : null}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-accent-700 transition-colors truncate">
            {order.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>提交人：{order.submitterName}</span>
            {order.assigneeName && <span>处理人：{order.assigneeName}</span>}
            <span>{order.messageCount} 条留言</span>
            <span>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             className="w-4 h-4 text-slate-300 group-hover:text-accent-500 shrink-0 mt-2 transition-colors">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
