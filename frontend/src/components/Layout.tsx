import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores';

const candidateMenuItems = [
  { key: '/', icon: 'dashboard', label: '工作台' },
  { key: '/setup', icon: 'interview', label: '开始面试' },
  { key: '/reports', icon: 'chart', label: '面试报告' },
  { key: '/profile', icon: 'profile', label: '个人中心' },
];

const adminMenuItems = [
  { key: '/admin', icon: 'admin', label: '管理中心' },
  { key: '/profile', icon: 'profile', label: '个人中心' },
];

// 工作流步骤：根据当前路由确定用户处于哪个阶段
const workflowSteps = [
  { label: '配置面试', paths: ['/setup'] },
  { label: '进行中', paths: ['/interview'] },
  { label: '查看报告', paths: ['/report'] },
];

const icons: Record<string, JSX.Element> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  interview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  collapse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const currentKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  // 角色判断
  const isAdminRole = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'teacher';
  const menuItems = isAdminRole ? adminMenuItems : candidateMenuItems;

  // 管理端默认路由
  useEffect(() => {
    if (isAdminRole && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [isAdminRole, location.pathname]);

  // 检测当前工作流阶段（仅候选人）
  const currentWorkflowIdx = isAdminRole ? -1 : workflowSteps.findIndex(step =>
    step.paths.some(p => location.pathname.startsWith(p))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 检测是否在面试页面（需要深色背景）
  const isInterviewPage = location.pathname.startsWith('/interview');
  const isReportPage = location.pathname.startsWith('/report');

  return (
    <div className={`flex h-screen ${isInterviewPage ? 'bg-[#0f1729]' : 'bg-gradient-to-br from-slate-50 to-blue-50/30'}`}>
      {/* Sidebar */}
      {(isInterviewPage || isReportPage) ? null : (
      <aside
        className={`${
          collapsed ? 'w-[68px]' : 'w-60'
        } bg-white/80 backdrop-blur-sm border-r border-slate-200/80 flex flex-col transition-all duration-300 shrink-0 overflow-hidden`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-200/60 px-3">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-brand-600 flex items-center justify-center shadow-button shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-bold text-slate-800 text-sm whitespace-nowrap">智能面试平台</span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {menuItems
            .map((item) => {
            const active = currentKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative
                  ${active
                    ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }
                `}
              >
                {/* 活跃指示条 */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-600 rounded-full" />
                )}
                <span className={`shrink-0 ${active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  {icons[item.icon]}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {/* 折叠时 tooltip */}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        {!collapsed && (
          <div className="px-3 py-4 border-t border-slate-200/60 space-y-2">
            <div className={`rounded-xl p-3 text-xs ${isAdminRole ? 'bg-teal-50' : 'bg-gradient-to-r from-primary-50 to-brand-50'}`}>
              <p className={`font-medium flex items-center gap-1 ${isAdminRole ? 'text-teal-700' : 'text-primary-700'}`}>
                {icons.sparkle}
                {isAdminRole ? '管理控制台' : 'AI 智能面试'}
              </p>
              <p className="text-slate-500 mt-1">{isAdminRole ? '数据驱动 · 精细管理' : '专业模拟 · 精准评测'}</p>
            </div>
            {/* 退出登录按钮 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50/50 text-red-500 text-sm font-medium hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-200 cursor-pointer select-none"
            >
              {icons.logout}
              退出登录
            </button>
          </div>
        )}
      </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {(isInterviewPage || isReportPage) ? null : (
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 flex items-center justify-between px-5 shrink-0 overflow-visible">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {icons.collapse}
            </button>

            {/* 工作流进度指示 */}
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              {workflowSteps.map((step, idx) => {
                const isActive = idx === currentWorkflowIdx;
                const isPast = idx < currentWorkflowIdx;
                return (
                  <div key={step.label} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <div className={`w-6 h-px ${idx <= currentWorkflowIdx ? 'bg-primary-400' : 'bg-slate-200'}`} />
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full transition-colors
                      ${isActive ? 'bg-primary-100 text-primary-700 font-medium' :
                        isPast ? 'bg-teal-50 text-teal-600' :
                        'text-slate-400'}`}>
                      {isPast ? '✓' : ''} {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User */}
          <div className="relative z-30">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-brand-600 text-white flex items-center justify-center text-sm font-medium shadow-button">
                {(user?.username || '用户')[0].toUpperCase()}
              </div>
              <span className="text-sm text-slate-600 hidden sm:block">{user?.username || '用户'}</span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-card-hover border border-slate-100 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="text-sm font-medium text-slate-800">{user?.username || '用户'}</p>
                    <p className="text-xs text-slate-400">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {icons.profile} 个人中心
                  </button>
                  <div className="border-t border-slate-50 my-1" />
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    {icons.logout} 退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        )}

        {/* Content */}
        <main className={`flex-1 overflow-auto ${isInterviewPage || isReportPage ? 'bg-[#0f1729]' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
