import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/api';
import { useUserStore } from '@/stores';

/* ====== 注册表单校验规则 ====== */
const DISPLAY_NAME_RE = /^[a-zA-Z0-9_一-龥]{2,16}$/;
const ACCOUNT_RE = /^[a-zA-Z0-9]{3,20}$/;
const VULGAR_WORDS = ['admin', 'root', 'test', 'fuck', 'shit', 'damn', 'ass', 'bitch', 'nmsl', 'sb', 'cao', '操', '草泥马', '傻逼', '妈的', '他妈', '你妈', '死', '杀', 'sb', '2b', '脑子', '垃圾', '废物'];
const hasVulgar = (s: string) => VULGAR_WORDS.some(w => s.toLowerCase().includes(w.toLowerCase()));
const hasChinese = (s: string) => /[一-龥]/.test(s);

type Role = 'candidate' | 'hr' | 'admin';
type Tab = 'login' | 'register';

const roleOptions: { value: Role; label: string; desc: string }[] = [
  { value: 'candidate', label: '求职者', desc: '参与模拟面试，提升面试技能' },
  { value: 'hr', label: 'HR', desc: '评估候选人，定制面试题库' },
  { value: 'admin', label: '管理员', desc: '系统管理与数据查看' },
];

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPwd, setLoginShowPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginUsernameError, setLoginUsernameError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regAccount, setRegAccount] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPwd, setRegShowPwd] = useState(false);
  const [regRole, setRegRole] = useState<Role>('candidate');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [accountChecking, setAccountChecking] = useState(false);
  const [accountTaken, setAccountTaken] = useState(false);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const navigate = useNavigate();
  const setAuth = useUserStore((s) => s.setAuth);

  useEffect(() => {
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    setAccountTaken(false);
    if (!regAccount || regAccount.length < 3) { setAccountChecking(false); return; }
    if (!ACCOUNT_RE.test(regAccount)) { setAccountChecking(false); return; }
    setAccountChecking(true);
    checkTimerRef.current = setTimeout(async () => {
      try {
        const res = await userService.checkAccount(regAccount);
        const data = res.data?.data as { exists: boolean } | undefined;
        if (data?.exists) { setAccountTaken(true); setAccountError('该账号已被占用'); }
        else { setAccountTaken(false); if (accountError === '该账号已被占用') setAccountError(''); }
      } catch { }
      finally { setAccountChecking(false); }
    }, 500);
    return () => { if (checkTimerRef.current) clearTimeout(checkTimerRef.current); };
  }, [regAccount]);

  const validateDisplayName = useCallback((v: string) => {
    if (!v) { setDisplayNameError(''); return true; }
    if (v.length < 2 || v.length > 16) { setDisplayNameError('用户名要求2-16位，支持中文、字母、数字、下划线；不可首尾带下划线，禁止低俗敏感词汇'); return false; }
    if (!DISPLAY_NAME_RE.test(v)) { setDisplayNameError('用户名支持中文、字母、数字、下划线，不可含特殊符号'); return false; }
    if (v.startsWith('_') || v.endsWith('_')) { setDisplayNameError('用户名不可首尾带下划线'); return false; }
    if (hasVulgar(v)) { setDisplayNameError('用户名包含敏感词汇'); return false; }
    setDisplayNameError('');
    return true;
  }, []);

  const validateAccount = useCallback((v: string) => {
    if (!v) { setAccountError(''); return true; }
    if (hasChinese(v)) { setAccountError('账号不可包含汉字，仅支持字母和数字组合'); return false; }
    if (v.length < 3 || v.length > 20) { setAccountError('账号要求3-20位字母或数字'); return false; }
    if (!ACCOUNT_RE.test(v)) { setAccountError('账号仅支持字母和数字的组合'); return false; }
    if (accountTaken) { setAccountError('该账号已被占用'); return false; }
    setAccountError('');
    return true;
  }, [accountTaken]);

  const validatePassword = useCallback((v: string) => {
    if (!v) { setPasswordError(''); return true; }
    if (v.length < 8 || v.length > 16) { setPasswordError('密码长度须8-16位'); return false; }
    setPasswordError('');
    return true;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginUsernameError(''); setLoginPasswordError(''); setLoginError('');
    if (!loginUsername.trim()) { setLoginUsernameError('请输入账号'); return; }
    if (!loginPassword) { setLoginPasswordError('请输入密码'); return; }
    setLoginLoading(true);
    try {
      const res = await userService.login({ username: loginUsername.trim(), password: loginPassword });
      const { token, user } = res.data.data as { token: string; user: { role: string } };
      setAuth(user as never, token);
      const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'teacher';
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch (err: any) {
      const msg: string = err?.response?.data?.message || err?.message || '登录失败';
      if (msg.includes('不存在')) { setLoginUsernameError(msg); }
      else if (msg.includes('密码') || msg.includes('password')) { setLoginPasswordError(msg); }
      else if (msg.includes('禁用')) { setLoginUsernameError(msg); }
      else { setLoginError(msg); }
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const dnValid = validateDisplayName(regDisplayName);
    const acValid = validateAccount(regAccount);
    const pwValid = validatePassword(regPassword);
    if (!dnValid || !acValid || !pwValid) return;
    if (!regDisplayName) { setDisplayNameError('请输入用户名'); return; }
    if (!regAccount) { setAccountError('请输入账号'); return; }
    if (!regPassword) { setPasswordError('请输入密码'); return; }
    if (accountTaken) { setAccountError('该账号已被占用'); return; }
    setRegError(''); setRegLoading(true);
    try {
      const res = await userService.register({
        username: regAccount.trim(), password: regPassword,
        email: `${regAccount.trim()}@interview.com`, role: regRole,
      });
      const { token, user } = res.data.data as { token: string; user: { role: string } };
      setAuth(user as never, token);
      const isAdmin = user.role === 'admin' || user.role === 'hr';
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '注册失败，请重试';
      setRegError(msg);
    } finally { setRegLoading(false); }
  };

  const switchTab = (t: Tab) => {
    setTab(t); setLoginError(''); setLoginUsernameError(''); setLoginPasswordError('');
    setRegError(''); setDisplayNameError(''); setAccountError(''); setPasswordError('');
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-xl text-slate-100 placeholder-slate-500
     outline-none transition-all duration-200 text-sm
     ${hasError
       ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
       : 'border-slate-600/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25'
     }`;

  return (
    <div className="h-screen flex bg-[#0a0e17] overflow-hidden">
      {/* ===== 左侧品牌区 ===== */}
      <div className="hidden lg:flex w-[42%] xl:w-[45%] relative overflow-hidden bg-black">
        <img
          src="/images/login_left_panel.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-contain scale-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/60" />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center
                            border border-white/15 shadow-lg">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">智能面试评测平台</h1>
              <p className="text-white/40 text-xs mt-0.5">专业模拟 · 精准评测</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-12">
            {[
              { value: '10,000+', label: '模拟面试' },
              { value: '50+', label: '岗位方向' },
              { value: '98%', label: '用户好评' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white font-bold text-2xl tracking-tight">{stat.value}</p>
                <p className="text-white/35 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 右侧表单 ===== */}
      <div className="flex-1 flex items-center justify-center bg-[#0a0e17] px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-[420px]">

          {/* Tab switch */}
          <div className="flex bg-white/5 rounded-xl p-1.5 mb-10 backdrop-blur-sm">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-200
                ${tab === 'login'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >登录</button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-200
                ${tab === 'register'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >注册</button>
          </div>

          {/* ===== Login Form ===== */}
          {tab === 'login' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">欢迎回来 👋</h2>
                <p className="text-slate-400 text-sm mt-2">登录你的账号，继续模拟面试之旅</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5" noValidate autoComplete="on">
                {loginError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3.5 rounded-xl animate-fade-in flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">账号</label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <input type="text" value={loginUsername}
                      onChange={(e) => { setLoginUsername(e.target.value); setLoginUsernameError(''); }}
                      placeholder="请输入账号" autoComplete="username" name="login-username"
                      className={inputClass(!!loginUsernameError)} />
                  </div>
                  {loginUsernameError && <p className="text-rose-400 text-xs mt-1.5 ml-1 animate-fade-in">{loginUsernameError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input type={loginShowPwd ? 'text' : 'password'} value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginPasswordError(''); }}
                      placeholder="请输入密码" autoComplete="current-password" name="login-password"
                      className={`${inputClass(!!loginPasswordError)} pr-12`} />
                    <button type="button"
                      onMouseDown={(e) => { e.preventDefault(); setLoginShowPwd(!loginShowPwd); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300
                                 transition-colors cursor-pointer select-none z-10 p-0.5"
                      tabIndex={-1}>
                      {loginShowPwd ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                  {loginPasswordError && <p className="text-rose-400 text-xs mt-1.5 ml-1 animate-fade-in">{loginPasswordError}</p>}
                </div>

                <button type="submit" disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl
                             font-semibold text-[15px] hover:from-indigo-600 hover:to-purple-700
                             hover:shadow-xl hover:shadow-indigo-500/25
                             active:scale-[0.98] transition-all duration-200 disabled:opacity-60
                             flex items-center justify-center gap-2 cursor-pointer select-none">
                  {loginLoading ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/></svg>登录中...</>
                  ) : '登录'}
                </button>
              </form>

              <div className="mt-10 pt-6 border-t border-white/5">
                <p className="text-xs text-slate-500 mb-3 text-center">支持多角色登录</p>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((r) => (
                    <div key={r.value} className="bg-white/5 border border-white/5 rounded-xl px-3 py-3 text-center select-none">
                      <p className="text-sm font-medium text-slate-300">{r.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== Register Form ===== */}
          {tab === 'register' && (
            <div className="animate-fade-in" key="register-form">
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">创建账号 🚀</h2>
                <p className="text-slate-400 text-sm mt-2">开启你的 AI 模拟面试之旅</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                {regError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3.5 rounded-xl animate-fade-in flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {regError}
                  </div>
                )}

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <input type="text" value={regDisplayName}
                      onChange={(e) => { setRegDisplayName(e.target.value); validateDisplayName(e.target.value); }}
                      onBlur={(e) => validateDisplayName(e.target.value)}
                      placeholder="输入用户名（2-16位）" maxLength={16}
                      className={inputClass(!!displayNameError)} />
                  </div>
                  {displayNameError && <p className="text-rose-400 text-xs mt-1.5 ml-1 animate-fade-in">{displayNameError}</p>}
                </div>

                {/* Account */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">账号</label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input type="text" value={regAccount}
                      onChange={(e) => setRegAccount(e.target.value)}
                      onBlur={(e) => { const t = e.target.value.trim(); setRegAccount(t); validateAccount(t); }}
                      placeholder="请输入账号" maxLength={20} autoComplete="off" name="reg-account"
                      className={`${inputClass(!!accountError)} pr-10`} />
                    {accountChecking && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/></svg>
                      </div>
                    )}
                    {!accountChecking && regAccount.length >= 3 && ACCOUNT_RE.test(regAccount) && !accountTaken && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  {accountError && <p className="text-rose-400 text-xs mt-1.5 ml-1 animate-fade-in">{accountError}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input type={regShowPwd ? 'text' : 'password'} value={regPassword}
                      onChange={(e) => { setRegPassword(e.target.value); validatePassword(e.target.value); }}
                      onBlur={(e) => validatePassword(e.target.value)}
                      placeholder="请输入密码（8-16位）" maxLength={16} autoComplete="new-password" name="reg-password"
                      className={`${inputClass(!!passwordError)} pr-12`} />
                    <button type="button"
                      onMouseDown={(e) => { e.preventDefault(); setRegShowPwd(!regShowPwd); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300
                                 transition-colors cursor-pointer select-none z-10 p-0.5"
                      tabIndex={-1}>
                      {regShowPwd ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                  {passwordError && <p className="text-rose-400 text-xs mt-1.5 ml-1 animate-fade-in">{passwordError}</p>}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">选择角色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setRegRole(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none
                          ${regRole === opt.value
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm'
                            : 'border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/10 hover:text-slate-300'}`}>
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    {roleOptions.find((o) => o.value === regRole)?.desc}
                  </p>
                </div>

                <button type="submit" disabled={regLoading || accountChecking}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl
                             font-semibold text-[15px] hover:from-indigo-600 hover:to-purple-700
                             hover:shadow-xl hover:shadow-indigo-500/25
                             active:scale-[0.98] transition-all duration-200 disabled:opacity-60
                             flex items-center justify-center gap-2 cursor-pointer select-none">
                  {regLoading ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75"/></svg>注册中...</>
                  ) : '完成注册'}
                </button>
              </form>

              <p className="mt-8 text-center text-slate-500 text-xs">
                注册即表示同意服务条款和隐私政策
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
