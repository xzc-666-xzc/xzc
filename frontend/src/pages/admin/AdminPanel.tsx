import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MOCK_POSITIONS, MOCK_INTERVIEWS } from '@/data/mock';
import { useUserStore } from '@/stores';
import { questionBanks } from '@/data/questions';
import type { PositionBank, QuestionTemplate } from '@/data/questions';

type Tab = 'overview' | 'users' | 'questions' | 'monitor';

// Mock admin data
const MOCK_USERS = [
  { id: '1', username: 'test', email: 'test@test.com', role: 'candidate', totalInterviews: 12, avgScore: 76, createdAt: '2026-06-15' },
  { id: '2', username: 'alice', email: 'alice@hr.com', role: 'hr', totalInterviews: 45, avgScore: 0, createdAt: '2026-05-20' },
  { id: '3', username: 'bob_teacher', email: 'bob@edu.com', role: 'teacher', totalInterviews: 30, avgScore: 0, createdAt: '2026-04-10' },
  { id: '4', username: 'candidate01', email: 'c1@test.com', role: 'candidate', totalInterviews: 8, avgScore: 82, createdAt: '2026-07-01' },
  { id: '5', username: 'candidate02', email: 'c2@test.com', role: 'candidate', totalInterviews: 15, avgScore: 68, createdAt: '2026-06-28' },
  { id: '6', username: 'candidate03', email: 'c3@test.com', role: 'candidate', totalInterviews: 5, avgScore: 91, createdAt: '2026-07-10' },
  { id: '7', username: 'admin_master', email: 'admin@platform.com', role: 'admin', totalInterviews: 0, avgScore: 0, createdAt: '2026-01-01' },
];

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
  candidate: { label: '求职者', color: 'bg-blue-50 text-blue-700' },
  hr: { label: 'HR', color: 'bg-purple-50 text-purple-700' },
  teacher: { label: '讲师', color: 'bg-teal-50 text-teal-700' },
  admin: { label: '管理员', color: 'bg-red-50 text-red-700' },
};

const allTabs: { key: Tab; label: string; icon: JSX.Element; roles: string[] }[] = [
  { key: 'overview', label: '数据概览', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, roles: ['admin'] },
  { key: 'users', label: '用户管理', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, roles: ['admin'] },
  { key: 'questions', label: '题库管理', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, roles: ['admin', 'hr', 'teacher'] },
  { key: 'monitor', label: '面试监控', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, roles: ['admin', 'hr'] },
];

const roleTitles: Record<string, { title: string; desc: string }> = {
  admin: { title: '管理中心', desc: '平台数据 · 用户管理 · 题库维护 · 面试监控' },
  hr: { title: 'HR 工作台', desc: '题库管理 · 面试监控' },
  teacher: { title: '教师工作台', desc: '题库管理 · 教学内容维护' },
};

export default function AdminPanel() {
  const { user } = useUserStore();
  const userRole = user?.role || 'candidate';
  const isAdmin = userRole === 'admin';

  // 按角色过滤 tabs
  const tabs = allTabs.filter(t => t.roles.includes(userRole));
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.key || 'questions');

  const roleInfo = roleTitles[userRole] || roleTitles.admin;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {isAdmin ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary-700"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-teal-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            )}
            {roleInfo.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{roleInfo.desc}</p>
        </div>
        <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-medium border border-teal-200">
          已服务 {MOCK_INTERVIEWS.length + 318} 场面试
        </span>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'questions' && <QuestionsTab />}
      {activeTab === 'monitor' && <MonitorTab />}
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
          { label: '总用户数', value: '1,234', sub: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '本月面试', value: '318', sub: '+23%', color: 'text-green-600', bg: 'bg-green-50' },
          { label: '题库总量', value: '186', sub: '4个岗位', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: '平均得分', value: '73.5', sub: '±2.1', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">近7日使用趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={usageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Line type="monotone" dataKey="面试场次" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="用户数" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">难度分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={diffDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} name="面试场次" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick stats */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">热门岗位排行</h3>
        <div className="space-y-3">
          {[
            { name: 'Java后端开发', count: 142, pct: 45 },
            { name: '前端开发', count: 98, pct: 31 },
            { name: 'HR-通用面试', count: 45, pct: 14 },
            { name: '产品经理', count: 33, pct: 10 },
          ].map((item, idx) => (
            <div key={item.name} className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-300 w-5">{idx + 1}</span>
              <span className="text-sm text-slate-700 w-32">{item.name}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full" style={{ width: `${item.pct}%` }} />
              </div>
              <span className="text-sm text-slate-500 w-16 text-right">{item.count} 场</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== Users Tab ====================
function UsersTab() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = MOCK_USERS.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.username.includes(search) && !u.email.includes(search)) return false;
    return true;
  });

  return (
    <div className="animate-fade-in space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户名或邮箱..."
          className="border border-slate-300 rounded-xl px-4 py-2 text-sm w-64 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none">
          <option value="all">全部角色</option>
          <option value="candidate">求职者</option>
          <option value="hr">HR</option>
          <option value="teacher">讲师</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['用户名', '邮箱', '角色', '面试次数', '平均分', '注册日期', '操作'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(u => {
              const r = roleLabels[u.role] || roleLabels.candidate;
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{u.username}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${r.color}`}>{r.label}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{u.totalInterviews}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{u.role === 'candidate' ? u.avgScore : '-'}</td>
                  <td className="px-5 py-3 text-sm text-slate-400">{u.createdAt}</td>
                  <td className="px-5 py-3">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">详情</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">共 {filtered.length} 位用户（Mock 数据演示）</p>
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
    junior: 'bg-green-50 text-green-700 border-green-200',
    middle: 'bg-blue-50 text-blue-700 border-blue-200',
    senior: 'bg-purple-50 text-purple-700 border-purple-200',
    expert: 'bg-red-50 text-red-700 border-red-200',
  };
  const posIcons: Record<string, string> = {
    'Java后端开发': '☕', '前端开发': '⚛️', '产品经理': '📱', 'HR-通用面试': '🤝',
  };

  // 总计题目数
  const totalQuestions = questionBanks.reduce((sum, bank) =>
    sum + Object.values(bank.levels).reduce((s, qs) => s + qs.length, 0), 0
  );

  // 搜索过滤
  const filterQuestions = (qs: QuestionTemplate[]) => {
    if (!search.trim()) return qs;
    const kw = search.toLowerCase();
    return qs.filter(q => q.content.toLowerCase().includes(kw) || q.tags.some(t => t.toLowerCase().includes(kw)));
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* 搜索 + 统计 */}
      <div className="flex gap-3 items-center flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) { setExpandedBank(null); setExpandedLevel(null); } }}
          placeholder="搜索题目内容或标签..."
          className="border border-slate-300 rounded-xl px-4 py-2 text-sm w-72 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        <span className="text-sm text-slate-400">
          共 <span className="font-semibold text-slate-600">{totalQuestions}</span> 道题，
          <span className="font-semibold text-slate-600"> {questionBanks.length}</span> 个岗位
        </span>
        {search && (
          <button onClick={() => setSearch('')} className="text-sm text-primary-600 hover:text-primary-700">
            清除搜索
          </button>
        )}
      </div>

      {/* 全局搜索结果 */}
      {search.trim() ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b text-xs text-slate-500">
            搜索结果：
            {questionBanks.reduce((sum, bank) =>
              sum + Object.values(bank.levels).reduce((s, qs) => s + filterQuestions(qs).length, 0), 0
            )} 道匹配题目
          </div>
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-auto">
            {questionBanks.map(bank =>
              Object.entries(bank.levels).map(([level, qs]) =>
                filterQuestions(qs).map(q => (
                  <div key={q.id} className="px-5 py-3 hover:bg-slate-50/50">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{posIcons[bank.positionName] || '💼'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{q.content}</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${diffColors[level]}`}>{diffLabels[level]}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">{bank.positionName}</span>
                          {q.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1">编辑</button>
                        <button className="text-xs text-red-400 hover:text-red-500 px-2 py-1">删除</button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      ) : (
        /* 按岗位→难度层级展示 */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {questionBanks.map(bank => {
            const bankTotal = Object.values(bank.levels).reduce((s, qs) => s + qs.length, 0);
            const isExpanded = expandedBank === bank.positionId;
            return (
              <div key={bank.positionId}
                className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
                {/* 岗位标题 */}
                <button
                  onClick={() => setExpandedBank(isExpanded ? null : bank.positionId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{posIcons[bank.positionName] || '💼'}</span>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800">{bank.positionName}</h4>
                      <p className="text-xs text-slate-400">{diffOrder.filter(l => bank.levels[l]).length} 个难度 · {bankTotal} 题</p>
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="border-t border-slate-100 animate-fade-in">
                    {diffOrder.map(level => {
                      const questions = bank.levels[level];
                      if (!questions || questions.length === 0) return null;
                      const isLevelOpen = expandedLevel === `${bank.positionId}-${level}`;
                      return (
                        <div key={level} className="border-b border-slate-50 last:border-0">
                          <button
                            onClick={() => setExpandedLevel(isLevelOpen ? null : `${bank.positionId}-${level}`)}
                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${diffColors[level]}`}>
                                {diffLabels[level]}
                              </span>
                              <span className="text-xs text-slate-500">{questions.length} 道题</span>
                              {/* 标签预览 */}
                              <div className="hidden sm:flex gap-1">
                                {[...new Set(questions.flatMap(q => q.tags))].slice(0, 4).map(t => (
                                  <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">{t}</span>
                                ))}
                              </div>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              className={`w-4 h-4 text-slate-400 transition-transform ${isLevelOpen ? 'rotate-180' : ''}`}>
                              <polyline points="6 9 12 15 18 9"/></svg>
                          </button>

                          {/* 题目列表 */}
                          {isLevelOpen && (
                            <div className="px-5 pb-3 divide-y divide-slate-50 animate-fade-in">
                              {questions.map((q, idx) => (
                                <div key={q.id} className="py-2.5 flex items-start gap-3">
                                  <span className="text-xs text-slate-300 w-5 shrink-0 mt-0.5">{idx + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700 leading-relaxed">{q.content}</p>
                                    <div className="flex gap-1 mt-1">
                                      {q.tags.map(t => (
                                        <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">{t}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    <button className="text-xs text-primary-600 hover:text-primary-700 px-1.5 py-0.5">编辑</button>
                                    <button className="text-xs text-red-400 hover:text-red-500 px-1.5 py-0.5">删除</button>
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
  const activeInterviews = [
    { id: 'int-001', user: 'candidate01', position: 'Java后端开发', difficulty: '中级', progress: '5/8', elapsed: '28:15', status: 'in_progress' },
    { id: 'int-002', user: 'candidate02', position: '前端开发', difficulty: '高级', progress: '3/10', elapsed: '18:42', status: 'in_progress' },
    { id: 'int-003', user: 'candidate03', position: '产品经理', difficulty: '初级', progress: '6/6', elapsed: '35:10', status: 'completed' },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <h3 className="font-semibold text-slate-800 mb-1">实时面试监控</h3>
        <p className="text-xs text-slate-400 mb-4">当前 {activeInterviews.filter(i => i.status === 'in_progress').length} 场进行中</p>

        <div className="space-y-3">
          {activeInterviews.map(interview => (
            <div key={interview.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${interview.status === 'in_progress' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">{interview.position} · {interview.difficulty}</p>
                  <p className="text-xs text-slate-400">候选人：{interview.user} · 进度 {interview.progress}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">{interview.elapsed}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  interview.status === 'in_progress' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {interview.status === 'in_progress' ? '进行中' : '已完成'}
                </span>
                {interview.status === 'in_progress' && (
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">查看详情 →</button>
                )}
                {interview.status === 'completed' && (
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">查看报告</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
