import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/api';
import { useUserStore } from '@/stores';
import '@/styles/login.css';

/* ====== 校验规则 ====== */
const DISPLAY_NAME_RE = /^[a-zA-Z0-9_一-鿿]{2,16}$/;
const ACCOUNT_RE = /^[a-zA-Z0-9]{3,20}$/;
const VULGAR_WORDS = ['admin', 'root', 'test', 'fuck', 'shit', 'damn', 'ass', 'bitch', 'nmsl', 'sb', 'cao'];
const hasVulgar = (s: string) => VULGAR_WORDS.some(w => s.toLowerCase().includes(w.toLowerCase()));
const hasChinese = (s: string) => /[一-鿿]/.test(s);

type Role = 'candidate' | 'hr' | 'admin';
type Tab = 'login' | 'register';
type RegStep = 1 | 2;

const roleOptions: { value: Role; label: string }[] = [
  { value: 'candidate', label: '求职者' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: '管理员' },
];

const POSITIONS = [
  { id: 'pos-java-middle', name: 'Java后端开发', icon: '☕' },
  { id: 'pos-fe-middle', name: '前端开发', icon: '⚛️' },
  { id: 'pos-pm-junior', name: '产品经理', icon: '📱' },
  { id: 'pos-hr-general', name: 'HR-通用面试', icon: '🤝' },
  { id: 'pos-java-agent', name: 'JavaAgent开发', icon: '🔧' },
  { id: 'pos-go', name: 'Go后端开发', icon: '🔷' },
];

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  // 登录
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPwd, setLoginShowPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginUsernameError, setLoginUsernameError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');
  // 注册 Step 1
  const [regStep, setRegStep] = useState<RegStep>(1);
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
  // 注册 Step 2
  const [selectedPosition, setSelectedPosition] = useState('');

  const navigate = useNavigate();
  const setAuth = useUserStore((s) => s.setAuth);

  // ====== 账号查重 ======
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

  // ====== 校验函数 ======
  const validateDisplayName = useCallback((v: string) => {
    if (!v) { setDisplayNameError(''); return true; }
    if (v.length < 2 || v.length > 16) { setDisplayNameError('2-16位，支持中文/字母/数字/下划线'); return false; }
    if (!DISPLAY_NAME_RE.test(v)) { setDisplayNameError('仅支持中文、字母、数字、下划线'); return false; }
    if (v.startsWith('_') || v.endsWith('_')) { setDisplayNameError('不可首尾带下划线'); return false; }
    if (hasVulgar(v)) { setDisplayNameError('包含敏感词汇'); return false; }
    setDisplayNameError(''); return true;
  }, []);

  const validateAccount = useCallback((v: string) => {
    if (!v) { setAccountError(''); return true; }
    if (hasChinese(v)) { setAccountError('账号不可包含汉字'); return false; }
    if (v.length < 3 || v.length > 20) { setAccountError('3-20位字母或数字'); return false; }
    if (!ACCOUNT_RE.test(v)) { setAccountError('仅支持字母和数字'); return false; }
    if (accountTaken) { setAccountError('该账号已被占用'); return false; }
    setAccountError(''); return true;
  }, [accountTaken]);

  const validatePassword = useCallback((v: string) => {
    if (!v) { setPasswordError(''); return true; }
    if (v.length < 8 || v.length > 16) { setPasswordError('密码长度须8-16位'); return false; }
    setPasswordError(''); return true;
  }, []);

  // ====== 登录 ======
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
      if (msg.includes('不存在')) setLoginUsernameError(msg);
      else if (msg.includes('密码')) setLoginPasswordError(msg);
      else if (msg.includes('禁用')) setLoginUsernameError(msg);
      else setLoginError(msg);
    } finally { setLoginLoading(false); }
  };

  // ====== 注册 Step 1 → Step 2 ======
  const handleRegNext = () => {
    const dnValid = validateDisplayName(regDisplayName);
    const acValid = validateAccount(regAccount);
    const pwValid = validatePassword(regPassword);
    if (!regDisplayName) { setDisplayNameError('请输入用户名'); return; }
    if (!regAccount) { setAccountError('请输入账号'); return; }
    if (!regPassword) { setPasswordError('请输入密码'); return; }
    if (!dnValid || !acValid || !pwValid) return;
    if (accountTaken) { setAccountError('该账号已被占用'); return; }
    setRegError('');
    setRegStep(2);
  };

  // ====== 注册最终提交 ======
  const handleRegister = async () => {
    setRegError(''); setRegLoading(true);
    try {
      const res = await userService.register({
        username: regAccount.trim(), realName: regDisplayName.trim(),
        password: regPassword,
        email: `${regAccount.trim()}@interview.com`, role: regRole,
      });
      const resData = res.data.data as { token?: string; user?: { role: string }; pendingApproval?: boolean; message?: string };
      if (resData?.pendingApproval) {
        alert(resData.message || '您的账号已提交审批，请等待超级管理员审批后登录');
        setTab('login'); setRegStep(1);
        return;
      }
      const { token, user } = resData as { token: string; user: { role: string } };
      setAuth(user as never, token);
      const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'teacher';
      navigate(isAdmin ? '/admin' : '/', { replace: true });
    } catch (err: any) {
      setRegError(err?.response?.data?.message || err?.message || '注册失败');
      setRegStep(1);
    } finally { setRegLoading(false); }
  };

  const switchTab = (t: Tab) => {
    setTab(t); setRegStep(1);
    setLoginError(''); setLoginUsernameError(''); setLoginPasswordError('');
    setRegError(''); setDisplayNameError(''); setAccountError(''); setPasswordError('');
    setSelectedPosition('');
  };

  const inputClass = (hasError: boolean) =>
    `login-input ${hasError ? 'login-input--error' : ''}`;

  return (
    <div className="login-page">
      {/* ================================================================
          左侧品牌区 (60%) — 太空蓝紫渐变 + 网格点阵 + 大字排版
          ================================================================ */}
      <div className="login-brand">
        <div className="login-brand__glow login-brand__glow--top" />
        <div className="login-brand__glow login-brand__glow--mid" />
        <div className="login-brand__glow login-brand__glow--bottom" />

        <div className="login-brand__hero">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.15)' }}>
              <svg viewBox="0 0 24 24" fill="white" style={{ width: 22, height: 22 }}><polygon points="5,3 19,12 5,21" /></svg>
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>智面</h1>
              <p style={{ color: 'rgba(165,180,252,0.45)', fontSize: 10, fontWeight: 500, letterSpacing: '0.15em' }}>SMART INTERVIEW</p>
            </div>
          </div>

          {/* Hero 大标题 */}
          <div style={{ marginTop: 48 }}>
            <h2>
              AI 驱动的<br />下一代<br /><span>模拟面试平台</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
              融合大语言模型 · 多模态交互 · 五维智能评测
            </p>
          </div>

          {/* 三大卖点 */}
          <div className="login-feature-list">
            {[
              { icon: '🤖', title: 'AI 大模型驱动', desc: '基于面试岗位实时生成专属题目，拒绝千篇一律' },
              { icon: '📊', title: '多维智能评测', desc: '雷达图精准定位能力与短板，五维量化分析' },
              { icon: '🎯', title: '千人千面训练', desc: '针对薄弱项定制提分策略，精准靶向提升' },
            ].map(f => (
              <div key={f.title} className="login-feature-item">
                <div className="login-feature-item__icon">{f.icon}</div>
                <div className="login-feature-item__text">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 底部数据面板 */}
          <div className="login-stats-bar">
            {[
              { v: '3,245+', l: '累计面试' },
              { v: '50+', l: '覆盖岗位' },
              { v: '3 种', l: '交互模式' },
              { v: '500+', l: '题库储备' },
            ].map(s => (
              <div key={s.l} className="login-stat-card">
                <p className="login-stat-card__value">{s.v}</p>
                <p className="login-stat-card__label">{s.l}</p>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10, letterSpacing: '0.2em' }}>POWERED BY AI · 专业模拟 · 精准评测</p>
          </div>
        </div>
      </div>

      {/* ================================================================
          右侧操作区 (40%) — Glassmorphism 玻璃态
          ================================================================ */}
      <div className="login-panel">
        <div className="login-glass-card">

          {/* 胶囊 Tab */}
          <div className="login-tab-bar">
            <button onClick={() => switchTab('login')} className={`login-tab-btn ${tab === 'login' ? 'login-tab-btn--active' : ''}`}>登录</button>
            <button onClick={() => switchTab('register')} className={`login-tab-btn ${tab === 'register' ? 'login-tab-btn--active' : ''}`}>注册</button>
          </div>

          {/* ====== Login Form ====== */}
          {tab === 'login' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>欢迎回来 👋</h2>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>登录你的账号，继续模拟面试之旅</p>
              </div>

              <form onSubmit={handleLogin} noValidate autoComplete="on">
                {loginError && (
                  <div style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', color: '#F87171', fontSize: 13, padding: '12px 16px', borderRadius: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {loginError}
                  </div>
                )}

                <div className="login-input-group">
                  <label className="login-input-label">账号</label>
                  <div className="login-input-wrap">
                    <span className="login-input-wrap__icon">👤</span>
                    <input type="text" value={loginUsername} onChange={e => { setLoginUsername(e.target.value); setLoginUsernameError(''); }}
                      placeholder="请输入账号" autoComplete="username"
                      className={inputClass(!!loginUsernameError)} />
                  </div>
                  {loginUsernameError && <p className="login-field-hint login-field-hint--error">{loginUsernameError}</p>}
                </div>

                <div className="login-input-group">
                  <label className="login-input-label">密码</label>
                  <div className="login-input-wrap">
                    <span className="login-input-wrap__icon">🔒</span>
                    <input type={loginShowPwd ? 'text' : 'password'} value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); setLoginPasswordError(''); }}
                      placeholder="请输入密码" autoComplete="current-password"
                      className={inputClass(!!loginPasswordError)} />
                    <button type="button" onMouseDown={e => { e.preventDefault(); setLoginShowPwd(!loginShowPwd); }}
                      className="login-pwd-toggle" tabIndex={-1}>
                      {loginShowPwd ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {loginPasswordError && <p className="login-field-hint login-field-hint--error">{loginPasswordError}</p>}
                </div>

                <button type="submit" disabled={loginLoading} className="login-submit-btn">
                  {loginLoading ? <><svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" opacity="0.75"/></svg>登录中...</> : '✨ 立即登录'}
                </button>
              </form>

              {/* 角色提示 */}
              <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)', textAlign: 'center', marginBottom: 12 }}>支持多角色登录</p>
                <div className="login-role-row">
                  {roleOptions.map(r => (
                    <div key={r.value} className="login-role-chip">{r.label}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ====== Register Form — 两步流程 ====== */}
          {tab === 'register' && (
            <div className="animate-fade-in" key={`reg-step-${regStep}`}>
              {/* 步骤指示器 */}
              <div className="login-step-indicator">
                <div className={`login-step-dot ${regStep >= 1 ? 'login-step-dot--active' : ''} ${regStep > 1 ? 'login-step-dot--done' : ''}`} />
                <div className={`login-step-line ${regStep > 1 ? 'login-step-line--done' : ''}`} />
                <div className={`login-step-dot ${regStep >= 2 ? 'login-step-dot--active' : ''}`} />
              </div>

              {/* ====== Step 1: 基础信息 ====== */}
              {regStep === 1 && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>创建账号 🚀</h2>
                    <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>开启你的 AI 模拟面试之旅</p>
                  </div>

                  {regError && (
                    <div style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', color: '#F87171', fontSize: 13, padding: '12px 16px', borderRadius: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {regError}
                    </div>
                  )}

                  {/* 用户名 */}
                  <div className="login-input-group">
                    <label className="login-input-label">用户名</label>
                    <div className="login-input-wrap">
                      <span className="login-input-wrap__icon">👤</span>
                      <input type="text" value={regDisplayName} onChange={e => { setRegDisplayName(e.target.value); validateDisplayName(e.target.value); }}
                        onBlur={e => validateDisplayName(e.target.value)} placeholder="输入用户名（2-16位）" maxLength={16}
                        className={inputClass(!!displayNameError)} />
                    </div>
                    {displayNameError && <p className="login-field-hint login-field-hint--error">{displayNameError}</p>}
                  </div>

                  {/* 账号 */}
                  <div className="login-input-group">
                    <label className="login-input-label">账号</label>
                    <div className="login-input-wrap">
                      <span className="login-input-wrap__icon">🔑</span>
                      <input type="text" value={regAccount} onChange={e => setRegAccount(e.target.value)}
                        onBlur={e => { const t = e.target.value.trim(); setRegAccount(t); validateAccount(t); }}
                        placeholder="输入账号" maxLength={20} autoComplete="off"
                        className={inputClass(!!accountError)} />
                      {accountChecking && (
                        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                          <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, color: '#818CF8' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" opacity="0.75"/></svg>
                        </div>
                      )}
                      {!accountChecking && regAccount.length >= 3 && ACCOUNT_RE.test(regAccount) && !accountTaken && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" style={{ width: 16, height: 16, position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    {accountError && (
                      <p className="login-field-hint login-field-hint--error">
                        {accountTaken ? <>{accountError}，去 <a onClick={() => switchTab('login')}>登录？</a></> : accountError}
                      </p>
                    )}
                  </div>

                  {/* 密码 */}
                  <div className="login-input-group">
                    <label className="login-input-label">密码</label>
                    <div className="login-input-wrap">
                      <span className="login-input-wrap__icon">🔒</span>
                      <input type={regShowPwd ? 'text' : 'password'} value={regPassword}
                        onChange={e => { setRegPassword(e.target.value); validatePassword(e.target.value); }}
                        onBlur={e => validatePassword(e.target.value)}
                        placeholder="输入密码（8-16位）" maxLength={16} autoComplete="new-password"
                        className={inputClass(!!passwordError)} />
                      <button type="button" onMouseDown={e => { e.preventDefault(); setRegShowPwd(!regShowPwd); }}
                        className="login-pwd-toggle" tabIndex={-1}>
                        {regShowPwd ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                    {passwordError && <p className="login-field-hint login-field-hint--error">{passwordError}</p>}
                  </div>

                  {/* 角色 */}
                  <div className="login-input-group">
                    <label className="login-input-label">选择角色</label>
                    <div className="login-role-row">
                      {roleOptions.map(opt => (
                        <button key={opt.value} type="button" onClick={() => setRegRole(opt.value)}
                          className={`login-role-chip ${regRole === opt.value ? 'login-role-chip--active' : ''}`}>{opt.label}</button>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={handleRegNext} className="login-submit-btn" style={{ marginTop: 8 }}>
                    下一步 →
                  </button>
                </>
              )}

              {/* ====== Step 2: AI 画像采集 ====== */}
              {regStep === 2 && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>定制你的专属计划 🎯</h2>
                    <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>选择目标岗位，AI 将为你定制面试训练方案</p>
                  </div>

                  <div className="position-card-grid">
                    {POSITIONS.map(p => (
                      <button key={p.id} type="button" onClick={() => setSelectedPosition(p.id)}
                        className={`position-card ${selectedPosition === p.id ? 'position-card--selected' : ''}`}>
                        <div className="position-card__icon">{p.icon}</div>
                        <div className="position-card__name">{p.name}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setRegStep(1)}
                      style={{ flex: 1, padding: '15px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', background: 'transparent', color: '#94A3B8', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      ← 返回
                    </button>
                    <button type="button" onClick={handleRegister} disabled={regLoading}
                      className="login-submit-btn" style={{ flex: 2 }}>
                      {regLoading ? '注册中...' : selectedPosition ? '✨ 开启专属面试' : '跳过，直接开始'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 底部：社交登录 */}
          <div className="login-divider"><span>其他方式</span></div>
          <div className="login-social-row">
            <div className="login-social-btn" title="微信登录">💬</div>
            <div className="login-social-btn" title="GitHub 登录">🐙</div>
            <div className="login-social-btn" title="邮箱登录">📧</div>
          </div>
        </div>
      </div>
    </div>
  );
}
