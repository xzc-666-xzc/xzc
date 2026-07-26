import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '@/services/api';
import { useUserStore } from '@/stores';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useUserStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('请输入用户名'); return; }
    if (!password) { setError('请输入密码'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await userService.login({ username: username.trim(), password });
      const { token, user } = res.data.data as { token: string; user: { role: string } };
      setAuth(user as never, token);
      // 管理角色跳转到管理中心，候选人跳转工作台
      const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'teacher';
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch {
      setError('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-brand-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-16 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-16 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />

      <div className="relative bg-white/95 backdrop-blur-sm w-[420px] p-8 rounded-2xl shadow-2xl animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-600 to-brand-600 flex items-center justify-center shadow-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">智能面试评测平台</h2>
          <p className="text-slate-500 text-sm mt-1">AI 驱动 · 真实模拟 · 精准评测</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">用户名</label>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">密码</label>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-brand-600 text-white py-3 rounded-xl font-medium hover:from-primary-700 hover:to-brand-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-button"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                </svg>
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p>
            <span className="text-slate-400 text-sm">还没有账号？</span>
            <Link to="/register" className="text-primary-600 hover:text-primary-700 text-sm ml-1 font-medium">
              立即注册
            </Link>
          </p>
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">多角色智能面试平台</p>
            <div className="flex justify-center gap-2">
              {[
                { role: 'candidate', label: '👤 求职者', desc: '模拟面试' },
                { role: 'hr', label: '📋 HR', desc: '题库管理' },
                { role: 'admin', label: '⚙️ 管理员', desc: '数据看板' },
              ].map(r => (
                <div key={r.role} className="bg-slate-50 rounded-xl px-3 py-2 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => { /* Could pre-fill role */ }}>
                  <p className="text-xs font-medium text-slate-600">{r.label}</p>
                  <p className="text-[10px] text-slate-400">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            🔒 端到端加密 · 已服务 <span className="font-semibold text-slate-500">10,000+</span> 候选人
          </p>
        </div>
      </div>
    </div>
  );
}
