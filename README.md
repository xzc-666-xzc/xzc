<<<<<<< HEAD
=======
[README.md](https://github.com/user-attachments/files/30488151/README.md)
>>>>>>> 050a5082a2ed60fcbd02ede529b7b795b900aebe
# 多模态智能模拟面试评测平台

> Smart Interview — AI 驱动的多模态模拟面试评测系统

基于 **React + Spring Cloud 微服务** 的全栈面试平台，支持文本/语音/视频三种交互模式，覆盖从岗位选择、智能出题、多维度评测到错题复习的完整面试闭环。

---

## 功能概览

| 模块 | 说明 |
|------|------|
| 🔐 用户系统 | 注册/登录、JWT 鉴权、角色权限（求职者/HR/讲师/管理员） |
| 📋 面试配置 | 岗位选择、难度分级（初级→专家）、5 种面试类型 |
| 💬 面试大厅 | 实时对话式答题、计时器、暂停/恢复、AI 追问建议 |
| 📊 评估报告 | 五维评分（内容·逻辑·深度·STAR·表达）、雷达图、提升计划 |
| 📁 报告中心 | 历史面试汇总、趋势分析、逐题回溯 |
| 📝 错题本 | 低分题目自动收录、专项练习模式 |
| 🗂️ 题库管理 | 6 大岗位方向 × 4 个难度层级、动态抽题 |
| 🛡️ 管理后台 | 数据看板、用户管理、面试监控 |

---

## 技术栈

```
前端   React 18 · TypeScript · Vite · TailwindCSS · Zustand · Recharts
后端   Spring Boot 3 · Spring Cloud Gateway · MyBatis Plus · JWT
数据   MySQL 8.0 · Redis 7
部署   Docker Compose · Nginx
```

### 微服务架构

```
┌──────────┐     ┌──────────────┐
│  Nginx   │────▶│   Gateway    │  统一鉴权 · 路由分发
│  :80     │     │   :8080      │
└──────────┘     └──┬──┬──┬──┬─┘
        │           │  │  │  │
   ┌────▼──┐  ┌────▼──▼──▼──▼────┐
   │ 静态  │  │                  │
   │ 资源  │  │  微服务集群       │
   └───────┘  │                  │
              │ user-service:9001│  用户 · 认证
              │ interview:9002   │  面试 · 题库
              │ ai-service:9003  │  ASR · LLM
              │ report-service   │  评测 · 报告
              │      :9004       │
              └──────────────────┘
              ┌────────┬─────────┐
              │ MySQL  │  Redis  │
              │ :3307  │  :6379  │
              └────────┴─────────┘
```

---

## 快速开始

### 环境要求

- **Docker** 20.10+ & Docker Compose v2
- 或本地安装 **JDK 17** · **Node.js 20** · **MySQL 8.0** · **Redis 7**

### 一键启动（Docker）

```bash
# 1. 克隆仓库
git clone <repo-url> && cd xzc

# 2. 编译后端（首次需手动编译）
cd backend && mvn clean package -DskipTests && cd ..

# 3. 启动全部服务
docker compose up -d
```

启动后访问：

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:8081 |
| Gateway API | http://localhost:8080 |

### 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| `Gxzc` | `06210726` | 管理员 |
| `Hxzc` | `06210726` | HR |
| `Xxzc` | `06210726` | 求职者 |

### 本地开发

```bash
# 后端（需先启动 MySQL + Redis）
cd backend
# Windows: 双击 start_all.bat
# Linux/Mac: 逐个启动各服务

# 前端
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## 项目结构

```
xzc/
├── frontend/                     # React 前端
│   └── src/
│       ├── pages/                # 页面组件
│       │   ├── Login.tsx         # 登录/注册
│       │   ├── Dashboard.tsx     # 首页看板
│       │   ├── InterviewSetup.tsx # 面试配置
│       │   ├── InterviewRoom.tsx  # 面试大厅（核心）
│       │   ├── InterviewReport.tsx # 单场报告
│       │   ├── InterviewReportHub.tsx # 报告汇总
│       │   ├── WrongBook.tsx      # 错题本
│       │   ├── Profile.tsx        # 个人中心
│       │   └── admin/AdminPanel.tsx # 管理后台
│       ├── components/           # 通用组件
│       ├── stores/               # Zustand 状态管理
│       ├── services/api.ts       # API 封装
│       ├── types/                # TypeScript 类型
│       └── data/                 # 题库 & Mock 数据
│
├── backend/
│   ├── gateway/                  # Spring Cloud Gateway
│   ├── common/                   # 公共模块（实体·工具·异常）
│   ├── user-service/             # 用户服务（认证·资料）
│   ├── interview-service/        # 面试服务（题库·答题·错题）
│   ├── ai-service/               # AI 服务（ASR·LLM 预留）
│   ├── report-service/           # 报告服务（评测·统计）
│   └── sql/init.sql              # 数据库初始化脚本
│
├── docs/                         # 项目文档
│   ├── API设计规范.md
│   ├── 数据库设计文档.docx
│   └── 版本迭代文档.docx
│
└── docker-compose.yml            # 容器编排
```

---

## 数据库 ER 图

7 张核心表：`t_user` → `t_interview` → `t_question` → `t_answer` → `t_evaluation`，外加 `t_position`（岗位）和 `t_wrong_question`（错题本）。

详见 [`docs/数据库设计文档.docx`](docs/数据库设计文档.docx)

---

## 版本路线

| 版本 | 主题 | 状态 |
|------|------|------|
| **V1.0** | 文本面试 · 五维评测 · 微服务架构 | ✅ 已发布 |
| **V2.0** | 语音交互（ASR/TTS）· UI 翻新 · 题库升级 | 📋 规划中 |
| **V3.0** | 视频面试 · 大模型驱动 · AI 面试官 · 数据中台 | 💡 远期规划 |

详见 [`docs/版本迭代文档.docx`](docs/版本迭代文档.docx)

---

## License

仅供学习与内部使用。
