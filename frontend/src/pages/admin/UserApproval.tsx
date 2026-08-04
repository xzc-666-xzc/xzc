import { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import type { PendingUser } from '@/services/api';

export default function UserApproval() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await userService.getPendingUsers();
      setUsers((res.data?.data as PendingUser[]) || []);
    } catch { /* fallback */ }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await userService.approveUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || '操作失败');
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('确定驳回该用户注册申请吗？此操作不可撤销。')) return;
    setActionLoading(id);
    try {
      await userService.rejectUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || '操作失败');
    }
    setActionLoading(null);
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { hr: 'HR', admin: '管理员', teacher: '教师', candidate: '求职者' };
    return map[role] || role;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
          <span className="text-3xl">👥</span> 用户审批
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 ml-11">
          待审批 {users.length} 个注册申请
        </p>
      </div>

      {users.length === 0 ? (
        <div className="card py-20 text-center">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-slate-400 text-sm font-medium">暂无待审批用户</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_120px_180px] px-6 py-4 bg-warm-alt/80 border-b border-warmBorder-light">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">用户信息</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">角色</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">申请时间</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">操作</span>
          </div>

          <div className="divide-y divide-slate-50">
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-[1fr_100px_120px_180px] px-6 py-4 items-center hover:bg-warm-alt/60 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{u.displayName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">账号: {u.username} · {u.email}</p>
                </div>
                <span className="text-xs font-medium text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'hr' ? 'bg-blue-100 text-blue-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>
                    {roleLabel(u.role)}
                  </span>
                </span>
                <span className="text-xs text-slate-500 text-center">{u.createdAt?.slice(0, 10)}</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleApprove(u.id)}
                    disabled={actionLoading === u.id}
                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === u.id ? '处理中...' : '通过'}
                  </button>
                  <button
                    onClick={() => handleReject(u.id)}
                    disabled={actionLoading === u.id}
                    className="px-4 py-1.5 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    驳回
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
