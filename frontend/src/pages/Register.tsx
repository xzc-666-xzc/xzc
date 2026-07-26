import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '@/services/api';
import { useUserStore } from '@/stores';

type Role = 'candidate' | 'hr' | 'teacher';

const roleOptions: { value: Role; label: string; desc: string; icon: JSX.Element }[] = [
  {
    value: 'candidate', label: '求职者', desc: '参与模拟面试，提升面试技能',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    value: 'hr', label: 'HR / 招聘方', desc: '评估候选人，定制面试题库',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    value: 'teacher', label: '培训教师', desc: '管理题库，追踪学员进度',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M2 20h20" />
        <path d="M12 2v4" />
        <path d="M4 6h16" />
        <path d="M6 6v8" />
      </svg>
    ),
  },
];

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useUserStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('请输入用户名'); return; }
    if (!email.trim()) { setError('请输入邮箱'); return; }
    if (!password || password.length < 6) { setError('密码长度不少于6位'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await userService.register({
        username: username.trim(),
        password,
        email: email.trim(),
        role,
      });
      const { token, user } = res.data.data as { token: string; user: { role: string } };
      setAuth(user as never, token);
      const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'teacher';
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-brand-900 relative overflow-hidden py-8">
      <div className="absolute top-20 left-16 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-16 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="relative bg-white/95 backdrop-blur-sm w-[480px] p-8 rounded-2xl shadow-2xl animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-600 to-brand-600 flex items-center justify-center shadow-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">创建账号</h2>
          <p className="text-slate-500 text-sm mt-1">开启你的 AI 模拟面试之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="设置登录密码（不少于6位）"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-3">选择角色</label>
            <div className="grid grid-cols-3 gap-3">
              {roleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                    ${
                      role === opt.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }
                  `}
                >
                  {opt.icon}
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {roleOptions.find((o) => o.value === role)?.desc}
            </p>
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
                注册中...
              </>
            ) : (
              '完成注册'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-slate-400 text-sm">已有账号？</span>
          <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm ml-1 font-medium">
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
}
