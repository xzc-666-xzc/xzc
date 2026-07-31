import { useState } from 'react';
import { useUserStore } from '@/stores';
import { userService } from '@/services/api';

type Tab = 'profile' | 'security' | 'preferences';

export default function Profile() {
  const { user, updateUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [aiStyle, setAiStyle] = useState('friendly');
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const [interviewReminder, setInterviewReminder] = useState(true);
  const [reportNotify, setReportNotify] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile({ username, email, phone });
      updateUser({ username, email } as never);
      showSuccess('个人资料已保存');
    } catch { showSuccess('保存失败，请重试'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { showSuccess('两次密码输入不一致'); return; }
    if (newPwd.length < 6) { showSuccess('密码长度不少于6位'); return; }
    showSuccess('密码修改成功');
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
  };

  const handleSavePrefs = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess('偏好设置已保存');
  };

  const tabs = [
    { key: 'profile' as Tab, label: '👤 基本资料' },
    { key: 'security' as Tab, label: '🔒 安全设置' },
    { key: 'preferences' as Tab, label: '⚙️ 偏好设置' },
  ];

  return (
    <div className="page-container animate-fade-in">
      <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-8">个人中心</h1>

      {successMsg && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm
                        flex items-center gap-2.5 animate-fade-in font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 mb-8 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-spring
              ${activeTab === tab.key
                ? 'bg-white text-accent-700 shadow-sm ring-1 ring-slate-200/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-8 animate-fade-in">
          {/* Avatar */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-500 to-brand-600
                            flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20 ring-4 ring-white">
              {(user?.username || '用户')[0].toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{user?.username || '用户'}</h3>
            <p className="text-sm text-slate-400 mt-1">{user?.email || '未设置邮箱'}</p>
          </div>

          <form onSubmit={handleSaveProfile} className="max-w-md mx-auto space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">用户名</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50
                           placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50
                           placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">手机号</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50
                           placeholder:text-slate-400" />
            </div>
            <button type="submit" disabled={loading}
              className="btn-brand w-full py-3 text-sm disabled:opacity-60 disabled:hover:shadow-button disabled:active:scale-100">
              {loading ? '保存中...' : '保存修改'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card p-8 animate-fade-in">
          <form onSubmit={handleChangePassword} className="max-w-md mx-auto space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">当前密码</label>
              <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">新密码</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6}
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">确认新密码</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50" />
            </div>
            <button type="submit"
              className="btn-brand w-full py-3 text-sm">
              修改密码
            </button>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card p-8 animate-fade-in">
          <form onSubmit={handleSavePrefs} className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">AI 面试风格</label>
              <select value={aiStyle} onChange={e => setAiStyle(e.target.value)}
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50">
                <option value="strict">严格模式 - 连续追问，不留情面</option>
                <option value="friendly">友好模式 - 温和引导，循序渐进</option>
                <option value="balanced">平衡模式 - 适中难度，张弛有度</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">语音播报速度</label>
              <select value={voiceSpeed} onChange={e => setVoiceSpeed(e.target.value)}
                className="input-focus w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50">
                <option value="slow">慢速</option>
                <option value="normal">正常</option>
                <option value="fast">快速</option>
              </select>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-5">
              {[
                { label: '面试提醒通知', value: interviewReminder, setter: setInterviewReminder },
                { label: '报告生成通知', value: reportNotify, setter: setReportNotify },
                { label: '每周学习报告', value: weeklyReport, setter: setWeeklyReport },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <button type="button" role="switch" aria-checked={item.value}
                    onClick={() => item.setter(!item.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200
                      ${item.value ? 'bg-accent-600' : 'bg-slate-300'}
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
                      ${item.value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit"
              className="btn-brand w-full py-3 text-sm">
              保存设置
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
