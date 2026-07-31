/**
 * 轻量 AI 聊天状态桥 — 用于跨组件触发聊天窗口
 * AISidebar / AICoach 等组件通过此 store 打开 AIFloatingChat
 */

type Listener = () => void;

let _open = false;
const listeners = new Set<Listener>();

export const aiChatStore = {
  get isOpen() { return _open; },

  open() {
    _open = true;
    listeners.forEach(fn => fn());
  },

  close() {
    _open = false;
    listeners.forEach(fn => fn());
  },

  toggle() {
    _open ? this.close() : this.open();
  },

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};
