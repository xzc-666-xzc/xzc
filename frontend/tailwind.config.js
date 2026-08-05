/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ====== 主色系 — Indigo/Purple ======
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // 品牌色 — 蓝紫渐变体系
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // 强调色 — Indigo
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // 亮青色 — AI状态/进度条
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00D2FF',
          600: '#00b8e0',
          700: '#0098b5',
          800: '#007a91',
          900: '#005f70',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // ====== 冷色背景系统 ======
        cool: {
          page:   '#F0F2F5',   // 最底层：冷调浅灰
          surface:'#F8F9FA',   // 第二层：侧栏/面板
          card:   '#FFFFFF',   // 第三层：纯白卡片
          alt:    '#F4F6F8',   // 卡片备选
          hover:  '#EDEFF2',   // 悬停态
          active: '#E4E6EA',   // 选中态
        },
        // ====== 文字系统 ======
        ink: {
          title:   '#1A1A1A',  // 标题 — 绝对黑
          body:    '#374151',  // 正文 — 深灰
          muted:   '#9CA3AF',  // 次要 — 浅灰
        },
        // ====== 边框系统 ======
        border: {
          light:  '#E5E7EB',
          medium: '#D1D5DB',
        },
        // ====== 数据/标签色 ======
        data: {
          gold:     '#F59E0B',
          silver:   '#9CA3AF',
          bronze:   '#D97706',
          red:      '#EF4444',
          green:    '#10B981',
          blue:     '#3B82F6',
          orange:   '#F97316',
        },
        // ====== 暗色面试模式 ======
        dark: {
          bg:       '#1E1F22',  // ChatGPT 暗色背景
          surface:  '#2B2D31',  // 输入区/面板
          card:     '#313338',  // 卡片
          bubbleUser: '#343541', // 用户气泡
          bubbleAI:   '#10A37F', // AI 气泡 (ChatGPT 绿)
          border:   '#3F4147',
          text:     '#ECEDEE',
          muted:    '#949BA4',
        },
        // 保留旧 warm 色兼容过渡
        warm: {
          page:   '#F0F2F5',
          surface:'#F8F9FA',
          card:   '#FFFFFF',
          alt:    '#F4F6F8',
          hover:  '#EDEFF2',
          active: '#E4E6EA',
          selected:'#E4E6EA',
        },
        warmBorder: {
          light:  '#E5E7EB',
          medium: '#D1D5DB',
        },
        soft: {
          success: '#10B981',
          warning: '#F59E0B',
          danger:  '#EF4444',
          info:    '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        // 轻量卡片阴影 — 悬浮感
        'card': '0 1px 2px 0 rgba(0,0,0,0.03), 0 4px 12px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 2px 4px 0 rgba(0,0,0,0.04), 0 12px 24px 0 rgba(0,0,0,0.08)',
        'card-elevated': '0 4px 8px 0 rgba(0,0,0,0.04), 0 20px 40px 0 rgba(0,0,0,0.08)',
        // 品牌按钮阴影
        'button': '0 2px 8px 0 rgba(99,102,241,0.25)',
        'button-hover': '0 4px 16px 0 rgba(99,102,241,0.35)',
        // 发光效果
        'glow': '0 0 24px 0 rgba(99,102,241,0.35)',
        'glow-purple': '0 0 28px 0 rgba(108,92,231,0.40)',
        'glow-cyan': '0 0 20px 0 rgba(0,210,255,0.30)',
        // 排行榜发光环
        'glow-gold': '0 0 16px 0 rgba(245,158,11,0.50)',
        'glow-silver': '0 0 14px 0 rgba(156,163,175,0.45)',
        'glow-bronze': '0 0 12px 0 rgba(217,119,6,0.40)',
        // 导航
        'nav-active': '0 2px 8px 0 rgba(99,102,241,0.12)',
        'topbar': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.03)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(99,102,241,0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px 0 rgba(108,92,231,0.15)' },
          '50%': { boxShadow: '0 0 24px 0 rgba(108,92,231,0.35)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-ring': 'pulse-ring 2.5s infinite',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.5s infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
