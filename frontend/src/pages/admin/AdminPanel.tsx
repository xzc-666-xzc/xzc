import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MOCK_POSITIONS, MOCK_INTERVIEWS } from '@/data/mock';
import { useUserStore } from '@/stores';
import { userService, interviewService, positionService, workOrderService } from '@/services/api';
import { questionBanks } from '@/data/questions';
import type { PositionBank, QuestionTemplate } from '@/data/questions';
import type { InterviewTemplate, Difficulty, InterviewMode, InterviewType } from '@/types';
import AgentDashboard from './AgentDashboard';

type Tab = 'overview' | 'users' | 'questions' | 'monitor' | 'create' | 'agent';

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

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  candidate: { label: '求职者', color: 'text-accent-700', bg: 'bg-accent-50' },
  hr: { label: 'HR', color: 'text-brand-700', bg: 'bg-brand-50' },
  teacher: { label: '讲师', color: 'text-teal-700', bg: 'bg-teal-50' },
  admin: { label: '管理员', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const roleAvatarGradient: Record<string, string> = {
  admin: 'from-rose-400 to-rose-600',
  hr: 'from-brand-400 to-brand-600',
  teacher: 'from-teal-400 to-teal-600',
  candidate: 'from-accent-400 to-accent-600',
};

const allTabs: { key: Tab; label: string; icon: JSX.Element; roles: string[] }[] = [
  { key: 'overview', label: '数据概览', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>, roles: ['admin'] },
  { key: 'users', label: '用户管理', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, roles: ['admin'] },
  { key: 'questions', label: '题库管理', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, roles: ['admin', 'hr', 'teacher'] },
  { key: 'monitor', label: '面试监控', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, roles: ['admin', 'hr'] },
  { key: 'create', label: '创建面试', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>, roles: ['admin', 'hr'] },
  { key: 'agent', label: '工单客服', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, roles: ['admin'] },
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
  const isGxzc = user?.username === 'Gxzc';
  const isSuperAdmin = isAdmin && isGxzc; // Gxzc 专属超级管理员权限

  const tabs = allTabs.filter(t => t.roles.includes(userRole));
  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? 'overview' : tabs[0]?.key || 'questions');

  const roleInfo = roleTitles[userRole] || roleTitles.admin;
  const headerGradient = isAdmin
    ? 'from-accent-600 to-brand-700'
    : userRole === 'hr'
      ? 'from-teal-600 to-emerald-700'
      : 'from-indigo-600 to-blue-700';
  const headerIcon = isAdmin
    ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;

  // Agent dashboard uses full-screen layout
  if (activeTab === 'agent') return <AgentDashboard onBack={() => setActiveTab('overview')} />;

  return (
    <div className="page-container animate-fade-in">
      {/* ====== Header Banner ====== */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${headerGradient} rounded-2xl p-6 mb-6 text-white shadow-card-elevated`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.04] rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg shrink-0">
              {headerIcon}
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{roleInfo.title}</h1>
              <p className="text-white/55 text-sm mt-1">{roleInfo.desc}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl text-sm font-semibold border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            已服务 {MOCK_INTERVIEWS.length + 318} 场面试
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-cool-alt rounded-xl p-1.5 mb-8 w-fit shadow-sm border border-slate-100">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-spring
              ${activeTab === tab.key
                ? 'bg-white text-accent-700 shadow-sm ring-1 ring-slate-200/60'
                : 'text-ink-muted hover:text-ink-body hover:bg-white/60'
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
          { label: '总用户数', value: '1,234', sub: '+12% 较上月', icon: '👥', color: '#6366F1', bg: 'from-indigo-50 to-blue-50', border: 'border-indigo-100' },
          { label: '本月面试', value: '318', sub: '+23% 较上月', icon: '📋', color: '#10B981', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: '题库总量', value: '500+', sub: '覆盖 5 个岗位', icon: '📚', color: '#7C3AED', bg: 'from-purple-50 to-violet-50', border: 'border-purple-100' },
          { label: '平均得分', value: '73.5', sub: '±2.1 标准差', icon: '📊', color: '#F59E0B', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`card p-5 card-glow group cursor-default bg-gradient-to-br ${s.bg} ${s.border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{s.label}</p>
            <p className="text-[32px] font-extrabold tracking-tight mt-1 tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-ink-muted mt-0.5">{s.sub}</p>
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
  const { user: currentUser } = useUserStore();
  const isSuperAdmin = currentUser?.username === 'Gxzc' && currentUser?.role === 'admin';

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

  // Gxzc super-admin: freeze/unfreeze user
  const handleToggleFreeze = (u: UserRecord) => {
    const action = u.role === 'frozen' ? '解冻' : '冻结';
    if (!confirm(`确定要${action}用户「${u.username}」吗？`)) return;
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: u.role === 'frozen' ? 'candidate' : 'frozen' as any } : x));
  };

  // Gxzc super-admin: delete user
  const handleDeleteUser = (u: UserRecord) => {
    if (!confirm(`确定要永久删除用户「${u.username}」吗？此操作不可恢复！`)) return;
    setUsers(prev => prev.filter(x => x.id !== u.id));
  };

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
          { label: '求职者', count: users.filter(u => u.role === 'candidate').length, color: 'text-accent-700', bg: 'bg-accent-50', icon: '👤' },
          { label: '管理员/HR', count: users.filter(u => u.role !== 'candidate').length, color: 'text-brand-700', bg: 'bg-brand-50', icon: '🛡️' },
          { label: '总面试场次', count: users.reduce((s, u) => s + u.totalInterviews, 0), color: 'text-teal-700', bg: 'bg-teal-50', icon: '📋' },
          { label: '平均得分', count: users.filter(u => u.role === 'candidate' && u.totalInterviews > 0).length > 0
            ? Math.round(users.filter(u => u.role === 'candidate' && u.totalInterviews > 0).reduce((s, u) => s + u.avgScore, 0) / users.filter(u => u.role === 'candidate' && u.totalInterviews > 0).length)
            : 0, suffix: '分', color: 'text-amber-700', bg: 'bg-amber-50', icon: '📊' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4 border border-transparent card-hover transition-all duration-200`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-ink-muted font-medium">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className={`text-2xl font-extrabold tracking-tight ${card.color}`}>
              {card.count}{card.suffix || ''}
            </p>
          </div>
        ))}
      </div>

      {/* User Table — desktop */}
      <div className="card overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-cool-alt/80 border-b" style={{ borderColor: 'var(--border-light)' }}>
                {['用户名', '邮箱', '角色', '面试次数', '平均分', '注册日期', '操作'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => {
                const r = roleLabels[u.role] || roleLabels.candidate;
                return (
                  <tr key={u.id} className="hover:bg-cool-hover/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gradient-to-br ${roleAvatarGradient[u.role] || roleAvatarGradient.candidate}`}>
                          {u.username[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-ink-title">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-muted">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.color} ${r.bg}`}>{r.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === 'candidate' ? (
                        <span className={`text-sm font-semibold tabular-nums ${u.totalInterviews >= 10 ? 'text-emerald-600' : u.totalInterviews > 0 ? 'text-amber-600' : 'text-ink-muted'}`}>
                          {u.totalInterviews} 次
                        </span>
                      ) : <span className="text-sm text-ink-muted">-</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === 'candidate' ? (
                        <span className={`text-sm font-bold tabular-nums ${u.totalInterviews === 0 ? 'text-ink-muted' : u.avgScore >= 80 ? 'text-emerald-600' : u.avgScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {u.totalInterviews > 0 ? `${u.avgScore} 分` : '-'}
                        </span>
                      ) : <span className="text-sm text-ink-muted">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-muted">{u.createdAt}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedUser(u)}
                          className="text-sm text-accent-600 hover:text-accent-700 font-semibold whitespace-nowrap">
                          查看详情
                        </button>
                        {isSuperAdmin && u.username !== 'Gxzc' && (
                          <>
                            <button onClick={() => handleToggleFreeze(u)}
                              className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                                u.role === 'frozen' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}>
                              {u.role === 'frozen' ? '解冻' : '冻结'}
                            </button>
                            <button onClick={() => handleDeleteUser(u)}
                              className="text-xs px-2 py-0.5 rounded font-medium bg-rose-50 text-rose-500 hover:bg-rose-100 whitespace-nowrap">
                              删除
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-ink-muted text-sm">暂无匹配用户</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile card list */}
        <div className="lg:hidden divide-y divide-slate-50">
          {filtered.map(u => {
            const r = roleLabels[u.role] || roleLabels.candidate;
            return (
              <div key={u.id} onClick={() => setSelectedUser(u)}
                className="px-4 py-4 hover:bg-cool-hover/60 transition-colors cursor-pointer flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0 bg-gradient-to-br ${roleAvatarGradient[u.role] || roleAvatarGradient.candidate}`}>
                  {u.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-title">{u.username}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.color} ${r.bg}`}>{r.label}</span>
                  {u.role === 'candidate' && u.totalInterviews > 0 && (
                    <p className={`text-sm font-bold mt-1 ${u.avgScore >= 80 ? 'text-emerald-600' : u.avgScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{u.avgScore} 分</p>
                  )}
                  {isSuperAdmin && u.username !== 'Gxzc' && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); handleToggleFreeze(u); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
                          u.role === 'frozen' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        {u.role === 'frozen' ? '解冻' : '冻结'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-500 whitespace-nowrap">
                        删除
                      </button>
                    </div>
                  )}
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-300"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-ink-muted text-sm">暂无匹配用户</div>
          )}
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQ, setNewQ] = useState({ positionId: 'pos-java', difficulty: 'middle', content: '', tags: '' });
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; type: string; dataUrl: string }>>([]);

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { alert(`文件「${file.name}」超过 10MB 限制`); return; }
      const reader = new FileReader();
      reader.onload = () => setUploadedFiles(prev => [...prev, { name: file.name, type: file.type, dataUrl: reader.result as string }]);
      reader.readAsDataURL(file);
    });
  };

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
      {/* Search + New button */}
      <div className="flex gap-3 items-center flex-wrap justify-between">
        <div className="flex gap-3 items-center flex-wrap">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) { setExpandedBank(null); setExpandedLevel(null); } }}
            placeholder="搜索题目内容或标签..."
            className="input-focus pl-10 pr-4 py-2.5 border rounded-xl text-sm w-80 bg-cool-alt placeholder:text-ink-muted" style={{borderColor:'var(--border-light)'}} />
        </div>
        <span className="text-sm text-ink-muted">
          共 <span className="font-semibold text-ink-body">{totalQuestions}</span> 道题，
          <span className="font-semibold text-ink-body"> {questionBanks.length}</span> 个岗位
        </span>
        {search && (
          <button onClick={() => setSearch('')} className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors">清除搜索</button>
        )}
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="btn-brand px-4 py-2.5 text-sm flex items-center gap-2 shadow-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
          + 新建题目
        </button>
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

      {/* ====== 新建题目模态框（多格式支持） ====== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={() => { if (newQ.content || uploadedFiles.length > 0) { if (!confirm('有未保存内容，确定关闭吗？')) return; } setShowCreateModal(false); setUploadedFiles([]); setInputMode('text'); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{borderColor:'var(--border-light)'}}>
              <h3 className="text-lg font-extrabold text-ink-title">+ 新建题目</h3>
              <button onClick={() => { if (newQ.content || uploadedFiles.length > 0) { if (!confirm('有未保存内容，确定关闭吗？')) return; } setShowCreateModal(false); setUploadedFiles([]); setInputMode('text'); }}
                className="p-1.5 rounded-lg hover:bg-cool-hover text-ink-muted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-ink-title mb-1.5">岗位</label>
                  <select value={newQ.positionId} onChange={e => setNewQ({...newQ, positionId: e.target.value})}
                    className="w-full input-focus border rounded-xl px-3 py-2 text-sm bg-cool-alt" style={{borderColor:'var(--border-light)'}}>
                    {questionBanks.map(b => <option key={b.positionId} value={b.positionId}>{b.positionName}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-ink-title mb-1.5">难度</label>
                  <select value={newQ.difficulty} onChange={e => setNewQ({...newQ, difficulty: e.target.value})}
                    className="w-full input-focus border rounded-xl px-3 py-2 text-sm bg-cool-alt" style={{borderColor:'var(--border-light)'}}>
                    <option value="junior">初级</option><option value="middle">中级</option><option value="senior">高级</option><option value="expert">专家</option>
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-ink-title mb-1.5">标签（逗号分隔）</label>
                  <input value={newQ.tags} onChange={e => setNewQ({...newQ, tags: e.target.value})}
                    placeholder="Java基础, OOP" className="w-full input-focus border rounded-xl px-3 py-2 text-sm bg-cool-alt" style={{borderColor:'var(--border-light)'}} />
                </div>
              </div>

              {/* ====== 输入模式切换 ====== */}
              <div>
                <label className="block text-xs font-semibold text-ink-title mb-2">题目内容 <span className="text-rose-500">*</span></label>
                <div className="flex gap-1 bg-cool-alt rounded-xl p-1 mb-3 w-fit border" style={{borderColor:'var(--border-light)'}}>
                  {[
                    { key: 'text', label: '📝 文本输入', icon: '' },
                    { key: 'file', label: '📎 文件上传', icon: '' },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => setInputMode(tab.key as 'text' | 'file')}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        inputMode === tab.key ? 'bg-white text-accent-700 shadow-sm' : 'text-ink-muted hover:text-ink-body'
                      }`}>{tab.label}</button>
                  ))}
                </div>

                {/* 文本模式 */}
                {inputMode === 'text' && (
                  <textarea value={newQ.content} onChange={e => setNewQ({...newQ, content: e.target.value})} rows={5}
                    placeholder="请输入题目内容（支持 Markdown 格式）..."
                    className="w-full input-focus border rounded-xl px-4 py-3 text-sm bg-cool-alt resize-none" style={{borderColor:'var(--border-light)'}} />
                )}

                {/* 文件上传模式 */}
                {inputMode === 'file' && (
                  <div>
                    {/* 拖拽/选择上传区 */}
                    <label className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                                      hover:border-accent-400 hover:bg-accent-50/30 transition-all duration-200"
                           style={{borderColor:'var(--border-light)'}}
                           onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366f1'; }}
                           onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                           onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-light)'; handleFiles(e.dataTransfer.files); }}>
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.md" className="hidden"
                             onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-100 to-brand-100 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-accent-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <p className="text-sm font-semibold text-ink-body">点击上传或拖拽文件到此处</p>
                        <p className="text-xs text-ink-muted">支持图片（PNG/JPG）、PDF、Word、TXT、Markdown</p>
                      </div>
                    </label>

                    {/* 文件预览列表 */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadedFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 bg-cool-alt rounded-xl p-3 group">
                            {f.type.startsWith('image/') ? (
                              <img src={f.dataUrl} alt={f.name} className="w-16 h-16 object-cover rounded-lg border" style={{borderColor:'var(--border-light)'}} />
                            ) : (
                              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl bg-white border" style={{borderColor:'var(--border-light)'}}>
                                {f.type.includes('pdf') ? '📄' : f.type.includes('word') || f.type.includes('doc') ? '📝' : '📎'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink-title truncate">{f.name}</p>
                              <p className="text-[10px] text-ink-muted">{(f.dataUrl.length / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-ink-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-between px-6 py-4 border-t shrink-0" style={{borderColor:'var(--border-light)'}}>
              <button onClick={() => { setShowCreateModal(false); setUploadedFiles([]); setInputMode('text'); }}
                className="px-5 py-2.5 border rounded-xl text-sm font-semibold text-ink-muted hover:bg-cool-hover active:scale-95 transition-all" style={{borderColor:'var(--border-light)'}}>取消</button>
              <button onClick={() => {
                let finalContent = newQ.content;
                if (inputMode === 'file' && uploadedFiles.length > 0) {
                  finalContent = uploadedFiles.map(f => `[📎 ${f.name}]\n![${f.name}](${f.dataUrl})`).join('\n\n');
                  if (newQ.content) finalContent = newQ.content + '\n\n' + finalContent;
                }
                if (!finalContent.trim() && uploadedFiles.length === 0) return;
                const b = questionBanks.find(x => x.positionId === newQ.positionId);
                if (b) { const lvl = newQ.difficulty; const q = { id: `${b.positionId}-${lvl}-${Date.now()}`, content: finalContent, tags: newQ.tags.split(/[,，]/).filter(Boolean).map((t: string) => t.trim()) }; b.levels[lvl] = [q, ...(b.levels[lvl] || [])]; alert('题目已添加！（刷新后生效）'); }
                setShowCreateModal(false); setUploadedFiles([]); setInputMode('text');
                setNewQ({ positionId: 'pos-java', difficulty: 'middle', content: '', tags: '' });
              }}
                disabled={inputMode === 'text' ? !newQ.content.trim() : uploadedFiles.length === 0 && !newQ.content.trim()}
                className="btn-brand px-6 py-2.5 text-sm disabled:opacity-40 flex items-center gap-2">
                💜 确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Monitor Tab ====================
function MonitorTab() {
  const { user } = useUserStore();
  const userRole = user?.role || 'candidate';
  const isAdmin = userRole === 'admin';

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

  // ===== localStorage 持久化 =====
  const STORAGE_KEY = 'monitor_removed_shared'; // 管理员和HR共享
  const getRemovedIds = (): { terminated: string[]; deleted: string[]; _expires?: number } => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"terminated":[],"deleted":[]}'); }
    catch { return { terminated: [], deleted: [] }; }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const removed = getRemovedIds();
      if (removed._expires && removed._expires < Date.now()) localStorage.removeItem(STORAGE_KEY);

      const filteredFallback = fallbackData.filter(
        r => !removed.deleted.includes(r.id) && !removed.terminated.includes(r.id)
      );
      try {
        const res = await interviewService.getOngoingList();
        const ongoing = (res.data?.data as any[]) || [];
        if (ongoing.length > 0) {
          setRecords(ongoing
            .filter((o: any) => !removed.deleted.includes(String(o.id)))
            .map((o: any) => ({
              id: String(o.id), positionName: o.positionName, difficulty: o.difficulty,
              mode: o.mode, score: null, status: removed.terminated.includes(String(o.id)) ? 'completed' : o.status,
              questionCount: o.questionCount, startedAt: o.startedAt, completedAt: o.completedAt || null,
            })));
        } else setRecords(filteredFallback);
      } catch { setRecords(filteredFallback); }
      setLoading(false);
    })();
  }, []);

  const handleForceEnd = async (id: string) => {
    if (!confirm('确定要强制终止该面试吗？')) return;
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
    const removed = getRemovedIds();
    if (!removed.terminated.includes(id)) { removed.terminated.push(id); removed._expires = Date.now() + 7*24*3600*1000; localStorage.setItem(STORAGE_KEY, JSON.stringify(removed)); }
    if (id.startsWith('int-')) return;
    try { await interviewService.forceEnd(id); }
    catch (err: any) { setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'in_progress' } : r)); alert('终止失败：' + (err?.response?.data?.message || err?.message || '操作失败')); }
  };

  const handleDeleteRecord = (id: string) => {
    if (!confirm('确定要删除该面试记录吗？')) return;
    setRecords(prev => prev.filter(r => r.id !== id));
    const removed = getRemovedIds();
    if (!removed.deleted.includes(id)) { removed.deleted.push(id); removed._expires = Date.now() + 7*24*3600*1000; localStorage.setItem(STORAGE_KEY, JSON.stringify(removed)); }
    if (id.startsWith('int-')) return;
    interviewService.forceEnd(id).catch(() => {});
  };

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
      {/* Status summary — colored top border */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center card-hover cursor-default" style={{ borderTop: '3px solid #10B981' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-100" />
            <span className="text-sm font-semibold text-emerald-700">进行中</span>
          </div>
          <p className="text-4xl font-extrabold text-emerald-600 tabular-nums">{inProgress.length}</p>
        </div>
        <div className="card p-5 text-center card-hover cursor-default" style={{ borderTop: '3px solid #6366F1' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500 ring-2 ring-accent-100" />
            <span className="text-sm font-semibold text-accent-700">已完成</span>
          </div>
          <p className="text-4xl font-extrabold text-accent-600 tabular-nums">{completed.length}</p>
        </div>
        <div className="card p-5 text-center card-hover cursor-default" style={{ borderTop: '3px solid #F97316' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-100" />
            <span className="text-sm font-semibold text-orange-700">中断/退出</span>
          </div>
          <p className="text-4xl font-extrabold text-orange-600 tabular-nums">{interrupted.length}</p>
        </div>
      </div>

      {/* In-progress — card grid */}
      {inProgress.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-title flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-100" />
              实时进行中 ({inProgress.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inProgress.map(item => (
              <div key={item.id} className="bg-cool-alt rounded-xl p-4 hover:shadow-card-hover hover:border-accent-200
                                             transition-all duration-200 border border-transparent group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{posIcons[item.positionName] || '💼'}</span>
                    <div>
                      <p className="text-sm font-semibold text-ink-title">{item.positionName}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {diffLabels[item.difficulty] || item.difficulty} · {item.questionCount} 题
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-semibold shrink-0">进行中</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-ink-muted">
                    <span>{item.mode === 'voice' ? '🎤 语音' : item.mode === 'video' ? '📹 视频' : '💬 文本'}</span>
                    <span>⏱ {getElapsed(item.startedAt, item.completedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-accent-600 hover:text-accent-700 font-medium transition-colors">详情 →</button>
                    <button onClick={(e) => { e.stopPropagation(); handleForceEnd(item.id); }}
                      className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[11px] font-medium hover:bg-rose-600 transition-colors">
                      ⏹ 终止
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent records — card list style */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
          <h3 className="font-semibold text-ink-title">📋 最近面试记录</h3>
          <span className="text-xs text-ink-muted">{records.length} 条记录</span>
        </div>
        <div className="divide-y divide-slate-50">
          {records.map(item => (
            <div key={item.id} className="px-5 py-3.5 hover:bg-cool-hover/60 transition-colors flex items-center gap-4 group">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm bg-gradient-to-br ${
                item.status === 'in_progress' ? 'from-emerald-400 to-emerald-600' :
                item.status === 'completed' ? 'from-accent-400 to-accent-600' :
                'from-orange-400 to-orange-600'
              }`}>
                {posIcons[item.positionName] || '💼'}
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-6 gap-4 items-center">
                <span className="text-sm font-semibold text-ink-title truncate">{item.positionName}</span>
                <span className="text-xs text-ink-muted">{diffLabels[item.difficulty] || item.difficulty}</span>
                <span className="text-xs text-ink-muted">{item.mode === 'voice' ? '🎤 语音' : item.mode === 'video' ? '📹 视频' : '💬 文本'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-center ${
                  item.status === 'in_progress' ? 'bg-emerald-50 text-emerald-700' :
                  item.status === 'completed' ? 'bg-accent-50 text-accent-700' :
                  'bg-orange-50 text-orange-700'
                }`}>
                  {item.status === 'in_progress' ? '进行中' : item.status === 'completed' ? '已完成' : '中断'}
                </span>
                <span className="text-xs text-ink-muted">{getElapsed(item.startedAt, item.completedAt)}</span>
                <div className="flex items-center justify-between">
                  {item.score != null ? (
                    <span className={`text-sm font-bold tabular-nums ${item.score >= 80 ? 'text-emerald-600' : item.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {item.score} 分
                    </span>
                  ) : <span className="text-sm text-ink-muted">-</span>}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-accent-600 font-medium cursor-pointer">
                      {item.status === 'completed' ? '查看报告 →' : item.status === 'in_progress' ? '实时监控 →' : ''}
                    </span>
                    {(isAdmin || userRole === 'hr') && (
                      <button onClick={() => handleDeleteRecord(item.id)}
                        className="text-xs px-2 py-0.5 rounded font-medium bg-rose-50 text-rose-500 hover:bg-rose-100 whitespace-nowrap">
                        🗑 删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {sessions.map(s => (
              <div key={s.id} className="bg-cool-alt rounded-xl p-3.5 hover:shadow-card-hover hover:bg-white transition-all duration-200 border border-transparent hover:border-accent-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-accent-700 tracking-wider bg-accent-50 px-2.5 py-0.5 rounded-lg text-xs">
                    {s.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                    s.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    s.status === 'in_progress' ? 'bg-emerald-50 text-emerald-700' :
                    s.status === 'completed' ? 'bg-accent-50 text-accent-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {{ pending: '待加入', in_progress: '进行中', completed: '已完成', interrupted: '已中断', cancelled: '已取消' }[s.status] || s.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink-title">{s.positionName}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    s.difficulty === 'expert' ? 'bg-rose-50 text-rose-600' :
                    s.difficulty === 'senior' ? 'bg-amber-50 text-amber-700' :
                    s.difficulty === 'middle' ? 'bg-accent-50 text-accent-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {{ junior: '初级', middle: '中级', senior: '高级', expert: '专家' }[s.difficulty] || s.difficulty}
                  </span>
                  <span>{{ text: '💬 文本', voice: '🎙️ 语音', video: '📹 视频' }[s.mode] || s.mode}</span>
                  <span>{s.questionCount} 题</span>
                  <span className="ml-auto">{s.createdAt?.slice(0, 16)?.replace('T', ' ') || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div> {/* end grid */}
    </div>
  );
}
