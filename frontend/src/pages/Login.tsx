import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/api';
import { useUserStore } from '@/stores';

type Role = 'candidate' | 'hr' | 'admin';
type Tab = 'login' | 'register';

const roleOptions: { value: Role; label: string; desc: string }[] = [
  { value: 'candidate', label: '求职者', desc: '参与模拟面试，提升面试技能' },
  { value: 'hr', label: 'HR', desc: '评估候选人，定制面试题库' },
  { value: 'admin', label: '管理员', desc: '系统管理与数据查看' },
];

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('candidate');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const navigate = useNavigate();
  const setAuth = useUserStore((s) => s.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) { setLoginError('请输入用户名'); return; }
    if (!loginPassword) { setLoginError('请输入密码'); return; }
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await userService.login({ username: loginUsername.trim(), password: loginPassword });
      const { token, user } = res.data.data as { token: string; user: { role: string } };
      setAuth(user as never, token);
      const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'teacher';
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch {
      setLoginError('用户名或密码错误');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim()) { setRegError('请输入账号'); return; }
    if (!regPassword || regPassword.length < 6) { setRegError('密码长度不少于6位'); return; }
    setRegError('');
    setRegLoading(true);
    try {
      const res = await userService.register({
        username: regUsername.trim(),
        password: regPassword,
        email: `${regUsername.trim()}@interview.com`,
        role: regRole,
      });
      const { token, user } = res.data.data as { token: string; user: { role: string } };
      setAuth(user as never, token);
      const isAdmin = user.role === 'admin' || user.role === 'hr';
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '注册失败，请重试';
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  // 切换 tab 时清空错误
  const switchTab = (t: Tab) => { setTab(t); setLoginError(''); setRegError(''); };

  return (
    <div className="h-screen flex bg-[#0a0e17] overflow-hidden">
      {/* ==================== 左侧：品牌展示区 ==================== */}
      <div className="hidden lg:flex w-[42%] xl:w-[45%] relative overflow-hidden bg-black">
        {/* 左侧大图 */}
        <img
          src="/images/login_left_panel.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-contain scale-90"
        />
        {/* 整体渐隐叠加层 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/50" />

        {/* 内容覆盖层 */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* 顶部 Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">智能面试评测平台</h1>
              <p className="text-white/50 text-xs">专业模拟 · 精准评测</p>
            </div>
          </div>

          {/* 底部数据 */}
          <div className="flex items-center gap-10">
            {[
              { value: '10,000+', label: '模拟面试' },
              { value: '50+', label: '岗位方向' },
              { value: '98%', label: '用户好评' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white font-bold text-xl">{stat.value}</p>
                <p className="text-white/40 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== 右侧：登录/注册表单 ==================== */}
      <div className="flex-1 flex items-center justify-center bg-[#0a0e17] px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-[420px]">

          {/* Tab 切换 */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 mb-8">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none
                ${tab === 'login'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >登录</button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none
                ${tab === 'register'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >注册</button>
          </div>

          {/* 登录表单 */}
          {tab === 'login' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">欢迎回来 👋</h2>
                <p className="text-slate-400 text-sm mt-1.5">登录你的账号，继续模拟面试之旅</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl animate-fade-in">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="请输入用户名"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3.5 rounded-xl font-medium hover:from-indigo-600 hover:to-blue-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {loginLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                      </svg>
                      登录中...
                    </>
                  ) : '登录'}
                </button>
              </form>

              {/* 多角色提示 */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-3 text-center">支持多角色登录</p>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((r) => (
                    <div key={r.value}
                      onClick={() => { setLoginUsername(r.value === 'candidate' ? 'testuser' : r.value === 'hr' ? 'hr_manager' : 'admin'); setLoginPassword('123456'); }}
                      className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-3 text-center hover:bg-slate-800 hover:border-slate-600/50 active:scale-95 transition-all duration-200 cursor-pointer select-none group">
                      <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{r.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 注册表单 */}
          {tab === 'register' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">创建账号 🚀</h2>
                <p className="text-slate-400 text-sm mt-1.5">开启你的 AI 模拟面试之旅</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {regError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl animate-fade-in">
                    {regError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">账号</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="请输入账号"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="设置登录密码（不少于6位）"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                  />
                </div>

                {/* 角色选择 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">选择角色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRegRole(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none
                          ${regRole === opt.value
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : 'border-slate-700/40 bg-slate-800/30 text-slate-400 hover:border-slate-600/50 hover:text-slate-300'}`}
                      >
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    {roleOptions.find((o) => o.value === regRole)?.desc}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3.5 rounded-xl font-medium hover:from-indigo-600 hover:to-blue-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  {regLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                      </svg>
                      注册中...
                    </>
                  ) : '完成注册'}
                </button>
              </form>

              <p className="mt-6 text-center text-slate-500 text-xs">
                注册即表示同意服务条款和隐私政策
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
