/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 保留传统 primary 色系兼容
        primary: {
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
        // 品牌色 — Indigo + Purple 体系
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
        dark: '#1E293B',
        // ====== 暖色背景系统 ======
        warm: {
          page:   '#f7f3ee',   // 最底层：暖杏灰
          surface:'#fdfbf9',   // 第二层：米白（侧栏/面板）
          card:   '#ffffff',   // 第三层：纯白（卡片）
          alt:    '#faf7f3',   // 卡片备选
          hover:  '#f5ede6',   // 悬停态
          active: '#ece1d7',   // 选中态
          selected:'#ede7e0',  // 已选状态
        },
        // ====== 暖色文字系统 ======
        ink: {
          primary:  '#1a1410',  // 深暖黑
          secondary:'#5c534a',  // 暖灰棕
          muted:    '#a09287',  // 浅暖灰
        },
        // ====== 暖色边框 ======
        warmBorder: {
          light:  '#e8e0d8',
          medium: '#d5ccc2',
        },
        // ====== 柔和状态色 ======
        soft: {
          success: '#5b8c5a',
          warning: '#d4a055',
          danger:  '#c26565',
          info:    '#5b7f9e',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(99,102,241,0.04), 0 4px 16px 0 rgba(99,102,241,0.06)',
        'card-hover': '0 4px 8px 0 rgba(99,102,241,0.06), 0 12px 28px 0 rgba(99,102,241,0.12)',
        'card-elevated': '0 8px 16px 0 rgba(99,102,241,0.06), 0 20px 40px 0 rgba(99,102,241,0.10)',
        'button': '0 2px 8px 0 rgba(99,102,241,0.20)',
        'button-hover': '0 4px 16px 0 rgba(99,102,241,0.30)',
        'glow': '0 0 24px 0 rgba(99,102,241,0.35)',
        'glow-purple': '0 0 24px 0 rgba(139,92,246,0.35)',
        'nav-active': '0 2px 8px 0 rgba(99,102,241,0.12)',
        'topbar': '0 1px 3px 0 rgba(15,23,42,0.04), 0 1px 2px 0 rgba(15,23,42,0.03)',
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
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-ring': 'pulse-ring 2.5s infinite',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 3s ease-in-out infinite',
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
