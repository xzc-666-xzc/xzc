import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MOCK_POSITIONS, MOCK_INTERVIEWS } from '@/data/mock';
import { useUserStore } from '@/stores';
import { userService, interviewService, positionService } from '@/services/api';
import { questionBanks } from '@/data/questions';
import type { PositionBank, QuestionTemplate } from '@/data/questions';
import type { InterviewTemplate, Difficulty, InterviewMode, InterviewType } from '@/types';

type Tab = 'overview' | 'users' | 'questions' | 'monitor' | 'create';

const SYSTEM_USERS_FALLBACK = [
  { id: '1', username: 'Gxzc', email: 'Gxzc@interview.com', role: 'admin', totalInterviews: 0, avgScore: 0, createdAt: '2026-01-01' },
  { id: '2', username: 'Hxzc', email: 'Hxzc@interview.com', role: 'hr', totalInterviews: 0, avgScore: 0, createdAt: '2026-01-02' },
  { id: '3', username: 'Xxzc', email: 'Xxzc@interview.com', role: 'candidate', totalInterviews: 3, avgScore: 68, createdAt: '2026-06-01' },
  { id: '4', username: 'dlg', email: 'dlg@interview.com', role: 'candidate', totalInterviews: 5, avgScore: 74, createdAt: '2026-06-10' },
];

interface UserRecord {
  id: string; username: string; email: string; role: string;
  totalInterviews: number; avgScore: number; createdAt: string;
}

const usageTrend = [
  { date: '07-20', 面试场次: 14, 用户数: 8 },
  { date: '07-21', 面试场次: 18, 用户数: 10 },
  { date: '07-22', 面试场次: 22, 用户数: 13 },
  { date: '07-23', 面试场次: 19, 用户数: 15 },
  { date: '07-24', 面试场次: 25, 用户数: 17 },
  { date: '07-25', 面试场次: 31, 用户数: 22 },
  { date: '07-26', 面试场次: 28, 用户数: 24 },
];

const diffDistribution = [
  { name: '初级', value: 85 },
  { name: '中级', value: 142 },
  { name: '高级', value: 63 },
  { name: '专家', value: 28 },
];

const roleLabels: Record<string, { label: string; color: string }> = {
  candidate: { label: '求职者', color: 'bg-accent-50 text-accent-700' },
  hr: { label: 'HR', color: 'bg-brand-50 text-brand-700' },
  teacher: { label: '讲师', color: 'bg-teal-50 text-teal-700' },
  admin: { label: '管理员', color: 'bg-rose-50 text-rose-700' },
};

const allTabs: { key: Tab; label: string; icon: JSX.Element; roles: string[] }[] = [
  { key: 'overview', label: '数据概览', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>, roles: ['admin'] },
  { key: 'users', label: '用户管理', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, roles: ['admin'] },
  { key: 'questions', label: '题库管理', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, roles: ['admin', 'hr', 'teacher'] },
  { key: 'monitor', label: '面试监控', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, roles: ['admin', 'hr'] },
  { key: 'create', label: '创建面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>, roles: ['admin', 'hr'] },
];

const roleTitles: Record<string, { title: string; desc: string }> = {
  admin: { title: '管理中心', desc: '平台数据 · 用户管理 · 题库维护 · 面试监控' },
  hr: { title: 'HR 工作台', desc: '题库管理 · 面试监控' },
  teacher: { title: '教师工作台', desc: '题库管理 · 教学内容维护' },
};

// ==================== 主组件 ====================
export default function AdminPanel() {
  const { user } = useUserStore();
  const userRole = user?.role || 'candidate';
  const isAdmin = userRole === 'admin';

  const tabs = allTabs.filter(t => t.roles.includes(userRole));
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.key || 'questions');

  const roleInfo = roleTitles[userRole] || roleTitles.admin;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            {isAdmin ? (
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 flex items-center justify-center shadow-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </span>
            ) : (
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </span>
            )}
            {roleInfo.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 ml-11">{roleInfo.desc}</p>
        </div>
        <div className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-sm font-semibold border border-teal-200 shadow-sm">
          已服务 {MOCK_INTERVIEWS.length + 318} 场面试
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-warm-hover rounded-xl p-1.5 mb-8 w-fit shadow-inner">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-spring
              ${activeTab === tab.key
                ? 'bg-white text-accent-700 shadow-sm ring-1 ring-slate-200/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'questions' && <QuestionsTab />}
      {activeTab === 'monitor' && <MonitorTab />}
      {activeTab === 'create' && <CreateInterviewTab />}
    </div>
  );
}

// ==================== Overview Tab ====================
function OverviewTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总用户数', value: '1,234', sub: '+12% 较上月', color: 'accent', iconBg: 'bg-accent-50', iconColor: 'text-accent-600' },
          { label: '本月面试', value: '318', sub: '+23% 较上月', color: 'emerald', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { label: '题库总量', value: '500+', sub: '覆盖 5 个岗位', color: 'brand', iconBg: 'bg-brand-50', iconColor: 'text-brand-600' },
          { label: '平均得分', value: '73.5', sub: '±2.1 标准差', color: 'amber', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card card-hover p-5 group cursor-default">
            <p className="text-sm font-medium text-slate-500 tracking-wide">{s.label}</p>
            <div className="flex items-baseline gap-2 mt-2 mb-1">
              <span className="text-[32px] font-extrabold text-slate-800 tracking-tight tabular-nums">{s.value}</span>
            </div>
            <p className="text-xs text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-accent-500" />
            近7日使用趋势
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={usageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
              <Line type="monotone" dataKey="面试场次" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
              <Line type="monotone" dataKey="用户数" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-brand-500" />
            难度分布
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={diffDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} name="面试场次" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 热门岗位排行 */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-amber-500" />
          热门岗位排行
        </h3>
        <div className="space-y-3">
          {[
            { name: 'Java后端开发', count: 142, pct: 38 },
            { name: '前端开发', count: 98, pct: 27 },
            { name: 'JavaAgent开发工程师', count: 56, pct: 15 },
            { name: 'HR-通用面试', count: 45, pct: 12 },
            { name: '产品经理', count: 33, pct: 8 },
          ].map((item, idx) => (
            <div key={item.name} className="flex items-center gap-4 group">
              <span className={`text-sm font-bold w-6 text-right tabular-nums
                ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-700 w-36 truncate group-hover:text-accent-700 transition-colors">
                {item.name}
              </span>
              <div className="flex-1 h-2.5 bg-warm-hover rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-brand-500 transition-all duration-700 ease-spring"
                     style={{ width: `${item.pct}%` }} />
              </div>
              <span className="text-sm font-semibold text-slate-500 w-16 text-right tabular-nums">{item.count} 场</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== Users Tab ====================
function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await userService.getLeaderboard();
        const raw = (res.data?.data as unknown) as Array<{ username: string; interview_count: number; avg_score: number }> | undefined;
        const candidates: UserRecord[] = (raw || []).map((u, i) => ({
          id: `c-${i}`, username: u.username, email: `${u.username.toLowerCase()}@interview.com`,
          role: 'candidate', totalInterviews: u.interview_count, avgScore: u.avg_score, createdAt: '2026-07-01',
        }));
        setUsers([
          { id: 'sys-1', username: 'Gxzc', email: 'Gxzc@interview.com', role: 'admin', totalInterviews: 0, avgScore: 0, createdAt: '2026-01-01' },
          { id: 'sys-2', username: 'Hxzc', email: 'Hxzc@interview.com', role: 'hr', totalInterviews: 0, avgScore: 0, createdAt: '2026-01-02' },
          ...candidates,
        ]);
      } catch { setUsers(SYSTEM_USERS_FALLBACK); }
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.username.includes(search) && !u.email.includes(search)) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户名或邮箱..."
            className="input-focus pl-10 pr-4 py-2.5 border border-warmBorder-light rounded-xl text-sm w-72 bg-warm-alt placeholder:text-slate-400" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-warmBorder-light rounded-xl px-4 py-2.5 text-sm outline-none bg-warm-alt
                     focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all">
          <option value="all">全部角色 ({users.length})</option>
          <option value="candidate">求职者 ({users.filter(u => u.role === 'candidate').length})</option>
          <option value="hr">HR ({users.filter(u => u.role === 'hr').length})</option>
          <option value="admin">管理员 ({users.filter(u => u.role === 'admin').length})</option>
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          共 <strong className="text-slate-600">{filtered.length}</strong> 位用户
          {search && <button onClick={() => setSearch('')} className="ml-2 text-accent-600 hover:text-accent-700 font-medium">清除</button>}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '求职者', count: users.filter(u => u.role === 'candidate').length, color: 'text-accent-700', bg: 'bg-accent-50' },
          { label: '管理员/HR', count: users.filter(u => u.role !== 'candidate').length, color: 'text-brand-700', bg: 'bg-brand-50' },
          { label: '总面试场次', count: users.reduce((s, u) => s + u.totalInterviews, 0), color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: '平均得分', count: users.filter(u => u.role === 'candidate' && u.totalInterviews > 0).length > 0
            ? Math.round(users.filter(u => u.role === 'candidate' && u.totalInterviews > 0).reduce((s, u) => s + u.avgScore, 0) / users.filter(u => u.role === 'candidate' && u.totalInterviews > 0).length)
            : 0, suffix: '分', color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4 border border-transparent hover:shadow-sm transition-all duration-200`}>
            <p className="text-xs text-slate-500 font-medium">{card.label}</p>
            <p className={`text-2xl font-extrabold mt-1.5 tracking-tight ${card.color}`}>
              {card.count}{card.suffix || ''}
            </p>
          </div>
        ))}
      </div>

      {/* User Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-alt/80 border-b border-warmBorder-light">
                {['用户名', '邮箱', '角色', '面试次数', '平均分', '注册日期', '操作'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => {
                const r = roleLabels[u.role] || roleLabels.candidate;
                return (
                  <tr key={u.id} className="hover:bg-warm-alt/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm
                          ${u.role === 'admin' ? 'bg-gradient-to-br from-rose-400 to-rose-600' :
                            u.role === 'hr' ? 'bg-gradient-to-br from-brand-400 to-brand-600' :
                            'bg-gradient-to-br from-accent-400 to-accent-600'}`}>
                          {u.username[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.color}`}>{r.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === 'candidate' ? (
                        <span className={`text-sm font-semibold tabular-nums ${u.totalInterviews >= 10 ? 'text-emerald-600' : u.totalInterviews > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {u.totalInterviews} 次
                        </span>
                      ) : <span className="text-sm text-slate-400">-</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === 'candidate' ? (
                        <span className={`text-sm font-bold tabular-nums ${u.totalInterviews === 0 ? 'text-slate-400' : u.avgScore >= 80 ? 'text-emerald-600' : u.avgScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {u.totalInterviews > 0 ? `${u.avgScore} 分` : '-'}
                        </span>
                      ) : <span className="text-sm text-slate-400">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{u.createdAt}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelectedUser(u)}
                        className="text-sm text-accent-600 hover:text-accent-700 font-semibold whitespace-nowrap
                                   hover:underline decoration-accent-300 underline-offset-4 transition-all">
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-sm">暂无匹配用户</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-card-elevated animate-scale-in">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg
                ${selectedUser.role === 'admin'
                  ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                  : selectedUser.role === 'hr'
                    ? 'bg-gradient-to-br from-brand-400 to-brand-600'
                    : 'bg-gradient-to-br from-accent-400 to-accent-600'}`}>
                {selectedUser.username[0]?.toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-4">{selectedUser.username}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold mt-2 inline-block ${(roleLabels[selectedUser.role] || roleLabels.candidate).color}`}>
                {(roleLabels[selectedUser.role] || roleLabels.candidate).label}
              </span>
            </div>
            <div className="space-y-3 bg-warm-alt rounded-2xl p-4">
              {[
                { label: '邮箱', value: selectedUser.email },
                { label: '角色', value: (roleLabels[selectedUser.role] || roleLabels.candidate).label },
                { label: '面试次数', value: selectedUser.role === 'candidate' ? `${selectedUser.totalInterviews} 次` : '-' },
                { label: '平均成绩', value: selectedUser.role === 'candidate' && selectedUser.totalInterviews > 0 ? `${selectedUser.avgScore} 分` : '-' },
                { label: '注册日期', value: selectedUser.createdAt },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-700">{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedUser(null)}
              className="w-full mt-5 bg-warm-hover text-slate-600 py-2.5 rounded-xl text-sm font-semibold
                         hover:bg-slate-200 active:scale-95 transition-all duration-200">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Questions Tab ====================
function QuestionsTab() {
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const diffOrder = ['junior', 'middle', 'senior', 'expert'];
  const diffLabels: Record<string, string> = { junior: '初级', middle: '中级', senior: '高级', expert: '专家' };
  const diffColors: Record<string, string> = {
    junior: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    middle: 'bg-accent-50 text-accent-700 border-accent-200',
    senior: 'bg-brand-50 text-brand-700 border-brand-200',
    expert: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const posIcons: Record<string, string> = {
    'Java后端开发': '☕', '前端开发': '⚛️', '产品经理': '📱', 'HR-通用面试': '🤝', 'JavaAgent开发工程师': '🔧',
  };

  const totalQuestions = questionBanks.reduce((sum, bank) =>
    sum + Object.values(bank.levels).reduce((s, qs) => s + qs.length, 0), 0
  );

  const filterQuestions = (qs: QuestionTemplate[]) => {
    if (!search.trim()) return qs;
    const kw = search.toLowerCase();
    return qs.filter(q => q.content.toLowerCase().includes(kw) || q.tags.some(t => t.toLowerCase().includes(kw)));
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Search */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) { setExpandedBank(null); setExpandedLevel(null); } }}
            placeholder="搜索题目内容或标签..."
            className="input-focus pl-10 pr-4 py-2.5 border border-warmBorder-light rounded-xl text-sm w-80 bg-warm-alt placeholder:text-slate-400" />
        </div>
        <span className="text-sm text-slate-400">
          共 <span className="font-semibold text-slate-600">{totalQuestions}</span> 道题，
          <span className="font-semibold text-slate-600"> {questionBanks.length}</span> 个岗位
        </span>
        {search && (
          <button onClick={() => setSearch('')} className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors">清除搜索</button>
        )}
      </div>

      {/* Global search results */}
      {search.trim() ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-warm-alt border-b text-xs text-slate-500 font-medium">
            搜索结果：
            {questionBanks.reduce((sum, bank) =>
              sum + Object.values(bank.levels).reduce((s, qs) => s + filterQuestions(qs).length, 0), 0
            )} 道匹配题目
          </div>
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-auto">
            {questionBanks.map(bank =>
              Object.entries(bank.levels).map(([level, qs]) =>
                filterQuestions(qs).map(q => (
                  <div key={q.id} className="px-5 py-4 hover:bg-warm-alt/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{posIcons[bank.positionName] || '💼'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-relaxed">{q.content}</p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${diffColors[level]}`}>{diffLabels[level]}</span>
                          <span className="px-2 py-0.5 bg-warm-hover text-slate-500 rounded-md text-[10px]">{bank.positionName}</span>
                          {q.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-warm-hover text-slate-500 rounded-md text-[10px]">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button className="text-xs text-accent-600 hover:text-accent-700 font-medium px-2 py-1 hover:bg-accent-50 rounded-lg transition-colors">编辑</button>
                        <button className="text-xs text-rose-400 hover:text-rose-500 font-medium px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors">删除</button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      ) : (
        /* Hierarchical view */
        <div className="space-y-4">
          {questionBanks.map(bank => {
            const bankTotal = Object.values(bank.levels).reduce((s, qs) => s + qs.length, 0);
            const isExpanded = expandedBank === bank.positionId;
            return (
              <div key={bank.positionId} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedBank(isExpanded ? null : bank.positionId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-alt/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{posIcons[bank.positionName] || '💼'}</span>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800">{bank.positionName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {diffOrder.filter(l => bank.levels[l]).length} 个难度 · {bankTotal} 题
                      </p>
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-warmBorder-light animate-fade-in">
                    {diffOrder.map(level => {
                      const questions = bank.levels[level];
                      if (!questions || questions.length === 0) return null;
                      const isLevelOpen = expandedLevel === `${bank.positionId}-${level}`;
                      return (
                        <div key={level} className="border-b border-slate-50 last:border-0">
                          <button
                            onClick={() => setExpandedLevel(isLevelOpen ? null : `${bank.positionId}-${level}`)}
                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-warm-alt/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${diffColors[level]}`}>
                                {diffLabels[level]}
                              </span>
                              <span className="text-xs text-slate-500">{questions.length} 题</span>
                              <div className="hidden sm:flex gap-1">
                                {[...new Set(questions.flatMap(q => q.tags))].slice(0, 4).map(t => (
                                  <span key={t} className="px-1.5 py-0.5 bg-warm-hover text-slate-400 rounded text-[10px]">{t}</span>
                                ))}
                              </div>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isLevelOpen ? 'rotate-180' : ''}`}>
                              <polyline points="6 9 12 15 18 9"/></svg>
                          </button>

                          {isLevelOpen && (
                            <div className="px-5 pb-3 divide-y divide-slate-50 animate-fade-in">
                              {questions.map((q, idx) => (
                                <div key={q.id} className="py-3 flex items-start gap-3">
                                  <span className="text-xs text-slate-300 w-5 shrink-0 mt-0.5 tabular-nums">{idx + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700 leading-relaxed">{q.content}</p>
                                    <div className="flex gap-1 mt-1.5">
                                      {q.tags.map(t => (
                                        <span key={t} className="px-1.5 py-0.5 bg-warm-hover text-slate-400 rounded text-[10px]">{t}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    <button className="text-xs text-accent-600 hover:text-accent-700 font-medium px-1.5 py-0.5 hover:bg-accent-50 rounded transition-colors">编辑</button>
                                    <button className="text-xs text-rose-400 hover:text-rose-500 font-medium px-1.5 py-0.5 hover:bg-rose-50 rounded transition-colors">删除</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Monitor Tab ====================
function MonitorTab() {
  const [records, setRecords] = useState<Array<{
    id: string; positionName: string; difficulty: string; mode: string;
    score: number | null; status: string; questionCount: number;
    startedAt: string; completedAt: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fallbackData = [
    { id: 'int-001', positionName: 'Java后端开发', difficulty: 'middle', mode: 'text', score: null, status: 'in_progress', questionCount: 8, startedAt: '2026-07-30T08:30:00', completedAt: null },
    { id: 'int-002', positionName: 'JavaAgent开发工程师', difficulty: 'senior', mode: 'voice', score: null, status: 'in_progress', questionCount: 10, startedAt: '2026-07-30T09:00:00', completedAt: null },
    { id: 'int-003', positionName: '前端开发', difficulty: 'junior', mode: 'text', score: null, status: 'in_progress', questionCount: 6, startedAt: '2026-07-30T09:15:00', completedAt: null },
    { id: 'int-004', positionName: '产品经理', difficulty: 'middle', mode: 'video', score: null, status: 'in_progress', questionCount: 8, startedAt: '2026-07-30T08:45:00', completedAt: null },
    { id: 'int-005', positionName: 'Java后端开发', difficulty: 'expert', mode: 'text', score: 72, status: 'completed', questionCount: 10, startedAt: '2026-07-30T07:00:00', completedAt: '2026-07-30T08:15:00' },
    { id: 'int-006', positionName: 'HR-通用面试', difficulty: 'middle', mode: 'voice', score: 85, status: 'completed', questionCount: 8, startedAt: '2026-07-30T07:30:00', completedAt: '2026-07-30T08:30:00' },
    { id: 'int-007', positionName: '前端开发', difficulty: 'senior', mode: 'text', score: 58, status: 'interrupted', questionCount: 10, startedAt: '2026-07-29T14:00:00', completedAt: '2026-07-29T14:42:00' },
    { id: 'int-008', positionName: 'JavaAgent开发工程师', difficulty: 'middle', mode: 'text', score: 91, status: 'completed', questionCount: 8, startedAt: '2026-07-29T10:00:00', completedAt: '2026-07-29T11:10:00' },
  ];

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await interviewService.getHistory({ page: 1, pageSize: 50 });
        const data = (res.data as any)?.data as { records: typeof fallbackData } | undefined;
        if (data?.records && data.records.length > 0) setRecords(data.records);
        else setRecords(fallbackData);
      } catch { setRecords(fallbackData); }
      setLoading(false);
    })();
  }, []);

  const inProgress = records.filter(r => r.status === 'in_progress');
  const completed = records.filter(r => r.status === 'completed');
  const interrupted = records.filter(r => r.status === 'interrupted');

  const getElapsed = (startedAt: string, completedAt: string | null) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const mins = Math.floor((end - start) / 60000);
    if (mins < 60) return `${mins} 分钟`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const diffLabels: Record<string, string> = { junior: '初级', middle: '中级', senior: '高级', expert: '专家' };
  const posIcons: Record<string, string> = {
    'Java后端开发': '☕', '前端开发': '⚛️', '产品经理': '📱', 'HR-通用面试': '🤝', 'JavaAgent开发工程师': '🔧',
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-emerald-50/50 border-emerald-200 p-5 text-center card-hover cursor-default">
          <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">{inProgress.length}</p>
          <p className="text-sm font-medium text-emerald-600 mt-1">进行中</p>
        </div>
        <div className="card bg-accent-50/50 border-accent-200 p-5 text-center card-hover cursor-default">
          <p className="text-3xl font-extrabold text-accent-600 tabular-nums">{completed.length}</p>
          <p className="text-sm font-medium text-accent-600 mt-1">已完成</p>
        </div>
        <div className="card bg-orange-50/50 border-orange-200 p-5 text-center card-hover cursor-default">
          <p className="text-3xl font-extrabold text-orange-600 tabular-nums">{interrupted.length}</p>
          <p className="text-sm font-medium text-orange-600 mt-1">中断/退出</p>
        </div>
      </div>

      {/* In-progress interviews */}
      {inProgress.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-100" />
              进行中 ({inProgress.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">数据实时更新</span>
          </div>
          <div className="space-y-3">
            {inProgress.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-warm-alt rounded-xl
                                             hover:bg-warm-hover/60 transition-colors card-clickable border border-transparent">
                <div className="flex items-center gap-4">
                  <span className="text-xl">{posIcons[item.positionName] || '💼'}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.positionName} · {diffLabels[item.difficulty] || item.difficulty}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.mode === 'voice' ? '🎤 语音' : item.mode === 'video' ? '📹 视频' : '💬 文本'}
                      · {item.questionCount} 题
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 font-medium">⏱ {getElapsed(item.startedAt, item.completedAt)}</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">进行中</span>
                  <button className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors">查看详情 →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent records */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-warmBorder-light">
          <h3 className="font-semibold text-slate-800">📋 最近面试记录</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-alt/80 border-b border-warmBorder-light">
                {['岗位', '难度', '模式', '状态', '耗时', '得分', '时间', '操作'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map(item => (
                <tr key={item.id} className="hover:bg-warm-alt/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      {posIcons[item.positionName] || '💼'} {item.positionName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{diffLabels[item.difficulty] || item.difficulty}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 bg-warm-hover text-slate-600 rounded-full text-xs font-medium">
                      {item.mode === 'voice' ? '语音' : item.mode === 'video' ? '视频' : '文本'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'in_progress' ? 'bg-emerald-50 text-emerald-700' :
                      item.status === 'completed' ? 'bg-accent-50 text-accent-700' :
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {item.status === 'in_progress' ? '进行中' : item.status === 'completed' ? '已完成' : '中断'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{getElapsed(item.startedAt, item.completedAt)}</td>
                  <td className="px-5 py-3.5">
                    {item.score != null ? (
                      <span className={`text-sm font-bold tabular-nums ${item.score >= 80 ? 'text-emerald-600' : item.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {item.score} 分
                      </span>
                    ) : <span className="text-sm text-slate-400">-</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{item.startedAt?.slice(5, 16)?.replace('T', ' ') || '-'}</td>
                  <td className="px-5 py-3.5">
                    {item.status === 'completed' ? (
                      <button className="text-sm text-accent-600 hover:text-accent-700 font-medium">查看报告</button>
                    ) : item.status === 'in_progress' ? (
                      <button className="text-sm text-accent-600 hover:text-accent-700 font-medium">实时监控</button>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== Create Interview Tab ====================
function CreateInterviewTab() {
  const [positionId, setPositionId] = useState('');
  const [positions, setPositions] = useState<Array<{ id: string; name: string }>>([]);
  const [difficulty, setDifficulty] = useState('middle');
  const [mode, setMode] = useState('text');
  const [type, setType] = useState('technical');
  const [questionCount, setQuestionCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [sessions, setSessions] = useState<InterviewTemplate[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => { loadPositions(); loadSessions(); }, []);

  const loadPositions = async () => {
    try {
      const res = await positionService.list();
      const data = res.data?.data as Array<{ id: string; name: string }> | undefined;
      if (data) setPositions(data);
    } catch {
      setPositions(MOCK_POSITIONS.map(p => ({ id: p.id, name: p.name })));
    }
  };

  const loadSessions = async () => {
    setListLoading(true);
    try {
      const res = await interviewService.getHrList({ page: 1, pageSize: 50 });
      const data = (res.data?.data as { records: InterviewTemplate[] })?.records;
      if (data) setSessions(data);
    } catch { /* silently fail */ }
    setListLoading(false);
  };

  const handleCreate = async () => {
    if (!positionId) { setError('请选择岗位'); return; }
    const pos = positions.find(p => p.id === positionId);
    setLoading(true); setError(''); setCreatedCode(null);
    try {
      const res = await interviewService.createByHR({
        positionId,
        positionName: pos?.name || positionId,
        difficulty: difficulty as Difficulty,
        mode: mode as InterviewMode,
        type: type as InterviewType,
        questionCount,
      });
      const data = res.data?.data;
      if (data?.code) {
        setCreatedCode(data.code);
        setPositionId('');
        setDifficulty('middle');
        loadSessions();
      }
    } catch {
      setError('创建失败，请重试');
    }
    setLoading(false);
  };

  const difficultyOptions = [
    { key: 'junior', label: '初级', desc: '基础入门' },
    { key: 'middle', label: '中级', desc: '项目实战' },
    { key: 'senior', label: '高级', desc: '架构设计' },
    { key: 'expert', label: '专家', desc: '行业视野' },
  ];

  const modeOptions = [
    { key: 'text', label: '文本', icon: '💬', disabled: false },
    { key: 'voice', label: '语音', icon: '🎙️', disabled: false },
    { key: 'video', label: '视频', icon: '📹', disabled: false },
  ];

  const typeOptions = [
    { key: 'technical', label: '技术面', desc: '技术深度与工程能力' },
    { key: 'hr', label: 'HR面', desc: '综合素质与文化匹配' },
    { key: 'stress', label: '压力面', desc: '抗压与临场应变' },
    { key: 'boss', label: 'Boss面', desc: '战略思维与商业认知' },
  ];

  const countPresets = [5, 8, 10, 15];

  return (
    <div className="animate-fade-in space-y-6">
      {/* ====== 成功提示 ====== */}
      {createdCode && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center animate-scale-in max-w-2xl mx-auto">
          <p className="text-emerald-700 font-semibold text-sm mb-2">✅ 面试创建成功！邀请码：</p>
          <p className="text-4xl font-extrabold text-emerald-600 tracking-[0.3em] font-mono mb-2">{createdCode}</p>
          <p className="text-xs text-emerald-500 mb-4">将此码分享给候选人，对方即可通过该码加入面试</p>
          <button onClick={() => { navigator.clipboard.writeText(createdCode); alert('已复制到剪贴板'); }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all">
            📋 复制邀请码
          </button>
        </div>
      )}

      {/* ====== 表单 + 会话列表 并排 ====== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左：创建表单 */}
        <div className="card">
        <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          创建专属面试
        </h2>

        {/* 岗位选择 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">选择岗位</label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {positions.map(p => (
              <button key={p.id} onClick={() => { setPositionId(p.id); setError(''); }}
                className={`text-left p-3.5 rounded-xl border-2 transition-all duration-200 active:scale-[0.97]
                  ${positionId === p.id
                    ? 'border-accent-400 bg-accent-50/60 ring-2 ring-accent-200 shadow-sm'
                    : 'border-warmBorder-light bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}>
                <span className="text-sm font-semibold text-slate-800">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 难度 + 模式 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">难度等级</label>
            <div className="grid grid-cols-4 gap-2">
              {difficultyOptions.map(d => (
                <button key={d.key} onClick={() => setDifficulty(d.key)}
                  className={`p-2.5 rounded-xl border text-center transition-all duration-200 active:scale-95
                    ${difficulty === d.key
                      ? 'border-accent-400 bg-accent-50 text-accent-700 shadow-sm'
                      : 'border-warmBorder-light bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                  <div className="text-xs font-bold">{d.label}</div>
                  <div className="text-[10px] opacity-60">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">面试模式</label>
            <div className="flex gap-3">
              {modeOptions.map(m => (
                <button key={m.key} onClick={() => !m.disabled && setMode(m.key)}
                  disabled={m.disabled}
                  className={`flex-1 p-3 rounded-xl border text-center transition-all duration-200 active:scale-95
                    ${m.disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : ''}
                    ${mode === m.key && !m.disabled
                      ? 'border-accent-400 bg-accent-50 text-accent-700 shadow-sm'
                      : !m.disabled ? 'border-warmBorder-light bg-white text-slate-600 hover:border-slate-300' : ''
                    }`}>
                  <div className="text-xl mb-0.5">{m.icon}</div>
                  <div className="text-xs font-semibold">{m.label}{m.disabled ? ' (即将开放)' : ''}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 面试类型 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">面试类型</label>
          <div className="grid grid-cols-4 gap-2">
            {typeOptions.map(t => (
              <button key={t.key} onClick={() => setType(t.key)}
                className={`p-2.5 rounded-xl border text-center transition-all duration-200 active:scale-95
                  ${type === t.key
                    ? 'border-accent-400 bg-accent-50 text-accent-700 shadow-sm'
                    : 'border-warmBorder-light bg-white text-slate-600 hover:border-slate-300'
                  }`}>
                <div className="text-xs font-bold">{t.label}</div>
                <div className="text-[10px] opacity-60">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 题目数量 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">题目数量</label>
          <div className="flex items-center gap-4">
            {countPresets.map(n => (
              <button key={n} onClick={() => setQuestionCount(n)}
                className={`w-12 h-10 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95
                  ${questionCount === n
                    ? 'border-accent-400 bg-accent-50 text-accent-700 shadow-sm'
                    : 'border-warmBorder-light bg-white text-slate-500 hover:border-slate-300'
                  }`}>{n}</button>
            ))}
            <input type="range" min={3} max={20} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
              className="flex-1 accent-accent-600" />
            <span className="text-sm font-bold text-slate-700 min-w-[4rem] text-right">{questionCount} 道题</span>
            <span className="text-xs text-ink-muted">约 {questionCount * 3} 分钟</span>
          </div>
        </div>

        {/* 错误提示 */}
        {error && <p className="text-rose-500 text-xs font-semibold mb-4 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}

        {/* 提交按钮 */}
        <button onClick={handleCreate} disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-600 to-brand-600 text-white font-bold text-sm
                     hover:from-accent-700 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-all duration-200 shadow-button hover:shadow-button-hover">
          {loading ? '正在生成邀请码...' : '🎯 生成邀请码'}
        </button>
      </div>

      {/* ====== 会话列表 ====== */}
      <div className="card">
        <h2 className="text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          </span>
          已创建的面试会话
        </h2>

        {listLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-[3px] border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium">暂无面试会话</p>
            <p className="text-xs mt-1">创建第一个面试，生成邀请码分享给候选人</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">邀请码</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">岗位</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">难度</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">模式</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">题数</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-warm-alt/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-accent-700 tracking-wider bg-accent-50 px-2 py-0.5 rounded">{s.code}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{s.positionName}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold
                        ${s.difficulty === 'expert' ? 'bg-rose-50 text-rose-600' :
                          s.difficulty === 'senior' ? 'bg-amber-50 text-amber-700' :
                          s.difficulty === 'middle' ? 'bg-accent-50 text-accent-700' :
                          'bg-emerald-50 text-emerald-700'}`}>
                        {{ junior: '初级', middle: '中级', senior: '高级', expert: '专家' }[s.difficulty] || s.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {{ text: '💬 文本', voice: '🎙️ 语音', video: '📹 视频' }[s.mode] || s.mode}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{s.questionCount} 题</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold
                        ${s.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          s.status === 'in_progress' ? 'bg-emerald-50 text-emerald-700' :
                          s.status === 'completed' ? 'bg-accent-50 text-accent-700' :
                          'bg-slate-50 text-slate-500'}`}>
                        {{ pending: '待加入', in_progress: '进行中', completed: '已完成', interrupted: '已中断', cancelled: '已取消' }[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{s.createdAt?.slice(0, 16)?.replace('T', ' ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div> {/* end grid */}
    </div>
  );
}
