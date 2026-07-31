import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores';
import AIFloatingChat from '@/components/AIFloatingChat';
import AISidebar from '@/components/AISidebar';
import { aiChatStore } from '@/stores/aiChatStore';

const candidateMenuItems = [
  { key: '/', icon: 'dashboard', label: '工作台' },
  { key: '/setup', icon: 'interview', label: '开始面试' },
  { key: '/reports', icon: 'chart', label: '面试报告' },
  { key: '/leaderboard', icon: 'leaderboard', label: '排行榜' },
  { key: '/profile', icon: 'profile', label: '个人中心' },
];

const adminMenuItems = [
  { key: '/admin', icon: 'admin', label: '管理中心' },
  { key: '/profile', icon: 'profile', label: '个人中心' },
];

const workflowSteps = [
  { label: '配置面试', paths: ['/setup'] },
  { label: '进行中', paths: ['/interview'] },
  { label: '查看报告', paths: ['/report'] },
];

const icons: Record<string, JSX.Element> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" opacity="0.9" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" opacity="0.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" opacity="0.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" opacity="0.9" />
    </svg>
  ),
  interview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" opacity="0.3" stroke="none" />
      <polygon points="10,8 16,12 10,16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="15" cy="21" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="9" cy="3" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="6" cy="12" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-1a7 7 0 0114 0v1" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" opacity="0.85" />
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 2H6v7a6 6 0 0012 0V2Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 4 7 4" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 4 17 4" />
      <path d="M4 22h16" />
      <path d="M10 14.7V17c0 .55-.47.98-.97 1.2C7.85 18.8 7 20.2 7 22" />
      <path d="M14 14.7V17c0 .55.47.98.97 1.2C16.15 18.8 17 20.2 17 22" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const currentKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  const isAdminRole = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'teacher';
  const menuItems = isAdminRole ? adminMenuItems : candidateMenuItems;

  useEffect(() => {
    if (isAdminRole && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [isAdminRole, location.pathname]);

  const currentWorkflowIdx = isAdminRole ? -1 : workflowSteps.findIndex(step =>
    step.paths.some(p => location.pathname.startsWith(p))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAskAI = useCallback(() => {
    aiChatStore.open();
  }, []);

  const isInterviewPage = location.pathname.startsWith('/interview');
  const isReportPage = location.pathname.startsWith('/report');

  return (
    <div className={`flex h-screen ${isInterviewPage ? 'bg-[#0f1729]' : 'bg-warm-page'}`}>
      {/* ==================== SIDEBAR ==================== */}
      {(isInterviewPage || isReportPage) ? null : (
      <aside
        className={`${
          collapsed ? 'w-[68px]' : 'w-60'
        } bg-warm-surface/95 backdrop-blur-xl border-r flex flex-col transition-all duration-300 ease-spring shrink-0 overflow-hidden relative`}
        style={{ borderColor: '#e8e0d8' }}
      >
        {/* 折叠/展开切换按钮 — 悬浮在侧边栏右边缘 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[68px] z-30 w-6 h-6 rounded-full bg-white border shadow-sm
                     flex items-center justify-center text-slate-400 hover:text-accent-600 hover:border-accent-300
                     hover:shadow-md active:scale-90 transition-all duration-200 cursor-pointer"
          title={collapsed ? '展开侧栏' : '收起侧栏'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
            {collapsed
              ? <polyline points="9,18 15,12 9,6" />
              : <polyline points="15,18 9,12 15,6" />
            }
          </svg>
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-200/60 px-3">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-600 to-brand-600 flex items-center justify-center shadow-button shrink-0
                          transition-transform duration-300 hover:scale-105">
              <svg viewBox="0 0 24 24" fill="white" className="w-[18px] h-[18px]">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-bold text-slate-800 text-[15px] whitespace-nowrap tracking-tight">
                智能面试<span className="text-accent-600">平台</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const active = currentKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 ease-spring group relative
                  ${active
                    ? 'bg-accent-50/80 text-accent-700 shadow-nav-active'
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700'
                  }
                `}
              >
                {/* 激活指示条 */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-accent-500 to-brand-500 rounded-full" />
                )}
                <span className={`shrink-0 transition-colors duration-200
                  ${active ? 'text-accent-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  {icons[item.icon]}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg
                                   opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50
                                   shadow-lg">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-4 border-t border-slate-200/60 space-y-3">
          {/* AI 教练面板 */}
          <AISidebar collapsed={collapsed} onAskAI={handleAskAI} />

          {!collapsed && (
            <>
              <div className={`rounded-xl p-3 text-xs
                ${isAdminRole
                  ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100/50'
                  : 'bg-gradient-to-br from-accent-50 to-brand-50 border border-accent-100/50'}`}>
                <p className={`font-semibold flex items-center gap-1.5 ${isAdminRole ? 'text-teal-700' : 'text-accent-700'}`}>
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center ${isAdminRole ? 'bg-teal-100' : 'bg-accent-100'}`}>
                    {isAdminRole ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-teal-600"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-accent-600"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"/></svg>
                    )}
                  </span>
                  {isAdminRole ? '管理控制台' : 'AI 智能面试'}
                </p>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  {isAdminRole ? '数据驱动 · 精细管理' : '专业模拟 · 精准评测'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                           border border-rose-200/60 bg-rose-50/50 text-rose-500 text-sm font-medium
                           hover:bg-rose-100 hover:border-rose-300 hover:text-rose-600
                           active:scale-95 transition-all duration-200 cursor-pointer select-none group"
              >
                <span className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-rose-500"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </span>
                退出登录
              </button>
            </>
          )}
        </div>
      </aside>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ==================== HEADER ==================== */}
        {(isInterviewPage || isReportPage) ? null : (
        <header className="h-16 bg-warm-surface/95 backdrop-blur-xl border-b flex items-center justify-between px-5 shrink-0 shadow-topbar z-10"
          style={{ borderColor: '#e8e0d8' }}>
          <div className="flex items-center gap-4">
            {/* Breadcrumb / Workflow indicator */}
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              {workflowSteps.map((step, idx) => {
                const isActive = idx === currentWorkflowIdx;
                const isPast = idx < currentWorkflowIdx;
                return (
                  <div key={step.label} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <div className={`w-5 h-px transition-colors duration-300 ${
                        idx <= currentWorkflowIdx ? 'bg-accent-400' : 'bg-slate-200'
                      }`} />
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-300
                      ${isActive
                        ? 'bg-accent-100 text-accent-700 shadow-sm'
                        : isPast
                          ? 'bg-teal-50 text-teal-600'
                          : 'text-slate-400'
                      }`}>
                      {isPast && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 inline-block mr-0.5 -mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: search + notification + user */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className={`hidden sm:flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all duration-300
              ${searchFocused
                ? 'border-accent-400 bg-white shadow-sm ring-2 ring-accent-500/10 w-56'
                : 'border-slate-200 bg-slate-50/50 w-44 hover:border-slate-300'}`}>
              <span className="text-slate-400 shrink-0">{icons.search}</span>
              <input
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="搜索..."
                className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
              />
            </div>

            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600
                               transition-all duration-200 active:scale-90"
                    title="通知">
              {icons.bell}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* User avatar */}
            <div className="relative z-30">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-xl
                           transition-all duration-200 active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-brand-600 text-white
                                flex items-center justify-center text-sm font-semibold shadow-button
                                ring-2 ring-white transition-transform duration-300 hover:scale-105">
                  {(user?.username || '用户')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-600 hidden sm:block">
                  {user?.username || '用户'}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-400 hidden sm:block">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-elevated border border-slate-100 py-2 z-50 animate-scale-in overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-50">
                      <p className="text-sm font-semibold text-slate-800">{user?.username || '用户'}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email || ''}</p>
                    </div>
                    {/* Menu items */}
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600
                                 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                      {icons.profile}
                      <span className="text-slate-700">个人中心</span>
                    </button>
                    <div className="border-t border-slate-50 my-1" />
                    <button
                      onClick={() => { setShowUserMenu(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500
                                 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium"
                    >
                      {icons.logout}
                      <span>退出登录</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        )}

        {/* ==================== PAGE CONTENT ==================== */}
        <main className={`flex-1 overflow-auto ${isInterviewPage || isReportPage ? 'bg-[#0f1729]' : ''}`}>
          <Outlet />
        </main>

        {/* ==================== AI 浮动助手 ==================== */}
        <AIFloatingChat context={{ position: undefined, score: undefined }} />
      </div>
    </div>
  );
}
