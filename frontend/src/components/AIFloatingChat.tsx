import { useState, useRef, useEffect, useCallback } from 'react';
import { getQuickReply } from '@/data/aiEngine';
import { aiChatStore } from '@/stores/aiChatStore';

interface Message {
  role: 'ai' | 'user';
  text: string;
  time: string;
}

interface AIFloatingChatProps {
  /** 上下文信息，用于个性化回复 */
  context?: { position?: string; score?: number };
}

export default function AIFloatingChat({ context }: AIFloatingChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: '你好！我是小空 🤖 你的 AI 面试教练。可以问我任何面试相关的问题，比如：\n• "我适合什么岗位？"\n• "面试准备技巧有哪些？"\n• "帮我分析 Java 面试重点"',
      time: formatTime(new Date()),
    },
  ]);
  const [unread, setUnread] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Listen to external open triggers (from AISidebar, AICoach, etc.)
  useEffect(() => {
    const unsub = aiChatStore.subscribe(() => {
      setOpen(aiChatStore.isOpen);
    });
    return unsub;
  }, []);

  // Simulate unread notification after 30s idle
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setUnread(true), 30000);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (open) {
      setUnread(false);
      inputRef.current?.focus();
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: 'user', text, time: formatTime(new Date()) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI thinking delay
    setTimeout(() => {
      const reply = getQuickReply(text, context);
      setMessages(prev => [...prev, { role: 'ai', text: reply, time: formatTime(new Date()) }]);
    }, 600 + Math.random() * 800);
  }, [input, context]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600
                   text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40
                   hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center text-2xl"
        title="AI 面试教练 · 小空"
      >
        🤖
        {unread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-400 rounded-full border-2 border-white animate-pulse" />
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-8rem)]
                        bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-white to-purple-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-sm">
                🤖
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">AI 教练 · 小空</p>
                <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" /> 始终在线
                </p>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); aiChatStore.close(); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
                  msg.role === 'ai'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {msg.role === 'ai' ? '🤖' : '👤'}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-slate-100 text-slate-700 rounded-tl-sm'
                    : 'bg-indigo-600 text-white rounded-tr-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === 'ai' ? 'text-slate-400' : 'text-indigo-200'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex gap-1.5 flex-wrap shrink-0">
            {['推荐岗位', '面试技巧', 'Java重点', '分析报告'].map(tag => (
              <button
                key={tag}
                onClick={() => { setInput(tag); inputRef.current?.focus(); }}
                className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-500 rounded-full
                           hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="输入你的问题..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
                         placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10
                         transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium
                         rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed
                         active:scale-95 transition-all duration-200 shrink-0"
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
             onClick={() => setOpen(false)} />
      )}
    </>
  );
}

function formatTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
