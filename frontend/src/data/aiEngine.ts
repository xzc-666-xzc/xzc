/**
 * AI 教练「小空」— 智能建议引擎
 * 基于用户历史数据生成个性化推荐和提醒
 */

export interface InterviewRecord {
  id: string; positionName: string; difficulty: string; mode: string;
  score: number | null; status: string; questionCount: number;
  startedAt: string; completedAt: string | null;
}

export interface AISuggestion {
  type: 'greeting' | 'reminder' | 'recommendation' | 'weakness' | 'tip';
  greeting: string;
  message: string;
  action: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  dismissible: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface PositionMatch {
  id: string;
  name: string;
  category: string;
  matchScore: number;       // 0-100 AI 匹配度
  reason: string;
  recommended: boolean;
}

export interface WeakPoint {
  tag: string;
  label: string;
  score: number;            // 0-100
  level: 'good' | 'moderate' | 'weak';
  suggestion: string;
}

export interface StudyPlan {
  weeks: { label: string; tasks: string[] }[];
  targetDate: string;
}

// ==================== AI 引擎 ====================

/** 根据时间和最近活动生成问候语 */
export function getGreeting(username: string): string {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  return `${timeGreet}，${username}`;
}

/** 生成首页 AI 教练建议 */
export function generateCoachSuggestions(
  username: string,
  recentInterviews: InterviewRecord[]
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const completed = recentInterviews.filter(r => r.status === 'completed' && r.score != null);
  const now = new Date();
  const daysSinceLast = completed.length > 0
    ? Math.floor((now.getTime() - new Date(completed[0].startedAt).getTime()) / 86400000)
    : 999;

  // 1. 完成率提醒
  const incompleteCount = recentInterviews.filter(r => r.status === 'interrupted' || r.status === 'in_progress').length;
  if (incompleteCount > 0) {
    suggestions.push({
      type: 'reminder',
      greeting: getGreeting(username),
      message: `你有 ${incompleteCount} 场未完成的面试，建议继续完成以获取完整评测报告。`,
      action: { label: '继续面试', href: '/setup' },
      dismissible: true,
      priority: 'high',
    });
  }

  // 2. 间隔提醒
  if (daysSinceLast >= 3 && daysSinceLast < 999) {
    suggestions.push({
      type: 'reminder',
      greeting: getGreeting(username),
      message: `检测到你 ${daysSinceLast} 天没有练习了。保持规律练习有助于面试能力的持续提升。`,
      action: { label: '开始练习', href: '/setup' },
      secondaryAction: { label: '查看报告', href: '/reports' },
      dismissible: true,
      priority: 'medium',
    });
  }

  // 3. 弱项检测
  if (completed.length >= 3) {
    const avgScore = Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length);
    const lastScore = completed[0].score || 0;
    if (lastScore < 70) {
      suggestions.push({
        type: 'weakness',
        greeting: '',
        message: `你最近一场面试得分 ${lastScore} 分（近${completed.length}场均分 ${avgScore}），建议针对性强化薄弱环节后再进行模拟面试。`,
        action: { label: '薄弱专项练习', href: '/reports' },
        dismissible: true,
        priority: 'high',
      });
    }
  }

  // 4. 岗位推荐
  if (completed.length > 0) {
    const positions = [...new Set(completed.map(r => r.positionName))];
    const best = positions[0] || 'Java后端开发';
    suggestions.push({
      type: 'recommendation',
      greeting: '',
      message: `根据你的面试历史，${best} 岗位的面试次数最多。建议尝试不同岗位拓展面试经验。`,
      action: { label: '浏览岗位', href: '/setup' },
      dismissible: true,
      priority: 'low',
    });
  }

  // 5. 欢迎新用户
  if (recentInterviews.length === 0) {
    suggestions.push({
      type: 'greeting',
      greeting: `👋 ${getGreeting(username)}！我是你的 AI 面试教练「小空」`,
      message: '准备好开启你的模拟面试之旅了吗？我为你精选了几个热门岗位，选择感兴趣的即可开始第一场模拟面试。',
      action: { label: '开始第一场面试', href: '/setup' },
      secondaryAction: { label: '了解更多', href: '/leaderboard' },
      dismissible: true,
      priority: 'high',
    });
  }

  return suggestions;
}

/** 根据历史数据计算岗位匹配度 */
export function calculatePositionMatch(
  positionId: string,
  completed: InterviewRecord[]
): PositionMatch | null {
  const posInterviews = completed.filter(r => r.positionName.includes(
    positionId.includes('java') ? 'Java' : positionId.includes('fe') ? '前端' : '产品'
  ));

  if (posInterviews.length === 0) return null;

  const scores = posInterviews.filter(r => r.score != null).map(r => r.score!);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  let matchScore: number;
  let reason: string;

  if (scores.length >= 3 && avgScore >= 80) {
    matchScore = 85 + Math.min(10, Math.floor((avgScore - 80) / 2));
    reason = `已完成 ${scores.length} 场，均分 ${avgScore.toFixed(0)}`;
  } else if (scores.length >= 2) {
    matchScore = 65 + Math.min(20, Math.floor((avgScore - 60) / 2));
    reason = `有 ${scores.length} 场面试经验`;
  } else if (scores.length === 1) {
    matchScore = avgScore >= 70 ? 70 : 50;
    reason = `首次尝试得分 ${avgScore.toFixed(0)}`;
  } else {
    matchScore = 30;
    reason = '新岗位，待探索';
  }

  return {
    id: positionId,
    name: '',
    category: '',
    matchScore: Math.max(0, Math.min(100, matchScore)),
    reason,
    recommended: matchScore >= 75,
  };
}

/** 生成弱项分析 */
export function analyzeWeakPoints(completed: InterviewRecord[]): WeakPoint[] {
  const points: WeakPoint[] = [
    { tag: 'java-basics', label: 'Java 基础', score: 82, level: 'good', suggestion: '基础扎实，可挑战更高难度' },
    { tag: 'bytecode', label: '字节码增强', score: 55, level: 'weak', suggestion: '建议深入学习 ASM 和 ByteBuddy 框架' },
    { tag: 'jvm', label: 'JVM 原理', score: 68, level: 'moderate', suggestion: '重点突破 GC 调优和内存模型' },
    { tag: 'project', label: '项目经验', score: 60, level: 'moderate', suggestion: '准备 2-3 个有量化成果的项目案例' },
    { tag: 'architecture', label: '架构设计', score: 45, level: 'weak', suggestion: '从分布式系统设计经典案例学起' },
  ];

  // Adjust scores based on actual data
  if (completed.length >= 3) {
    const overallAvg = completed.filter(r => r.score != null).reduce((s, r) => s + (r.score || 0), 0) /
      completed.filter(r => r.score != null).length;
    return points.map(p => ({
      ...p,
      score: Math.round(Math.min(95, Math.max(20, p.score + (overallAvg - 65) * 0.3))),
      level: p.score >= 75 ? 'good' as const : p.score >= 55 ? 'moderate' as const : 'weak' as const,
    }));
  }

  return points;
}

/** 生成学习计划 */
export function generateStudyPlan(weakPoints: WeakPoint[]): StudyPlan {
  const weakTags = weakPoints.filter(w => w.level === 'weak').map(w => w.label);
  const modTags = weakPoints.filter(w => w.level === 'moderate').map(w => w.label);

  const now = new Date();
  const nextWeek = (d: number) => {
    const date = new Date(now.getTime() + d * 86400000);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return {
    weeks: [
      { label: `Week 1 (${nextWeek(0)}-${nextWeek(6)})`, tasks: [
        `${weakTags[0] || '基础知识'} 专项突破`,
        `${modTags[0] || '进阶知识'} 巩固练习`,
        '每日 30 分钟模拟问答',
      ]},
      { label: `Week 2 (${nextWeek(7)}-${nextWeek(13)})`, tasks: [
        `${weakTags[1] || modTags[0] || '核心技术'} 深度实践`,
        '完整项目案例梳理（STAR 法则）',
        '综合模拟面试 2 次',
      ]},
      { label: `Week 3 (${nextWeek(14)}-${nextWeek(20)})`, tasks: [
        '全真模拟面试（目标岗位）',
        '面试复盘与查漏补缺',
        `预计 ${nextWeek(21)} 可达到目标水平`,
      ]},
    ],
    targetDate: nextWeek(21),
  };
}

/** 简易聊天回复（本地规则引擎，无后端依赖） */
export function getQuickReply(input: string, context?: { position?: string; score?: number }): string {
  const q = input.trim().toLowerCase();

  if (/你好|hi|hello|嗨/.test(q)) {
    return '你好呀！我是小空，你的 AI 面试教练 🤖 有什么面试相关的问题尽管问我！';
  }
  if (/适合.*岗位|推荐.*岗位|什么.*岗位/.test(q)) {
    return '根据热门度和面试数据，目前最受欢迎的岗位是 Java 后端开发、前端开发、JavaAgent 开发工程师和产品经理。建议从你熟悉的技术栈开始尝试！';
  }
  if (/面试.*技巧|怎么.*面试|如何.*准备/.test(q)) {
    return '面试准备三个关键：\n1️⃣ STAR 法则组织项目经历\n2️⃣ 提前准备 3-5 个核心技术问题的深度回答\n3️⃣ 模拟练习至少 5 次，适应压力环境\n需要我帮你安排一次模拟面试吗？';
  }
  if (/得分|成绩|分数|report/.test(q)) {
    return context?.score
      ? `你最近一次面试得分 ${context.score} 分。建议查看完整报告了解各维度表现，针对性提升薄弱环节。`
      : '你可以去「面试报告」页面查看所有历史成绩和详细分析哦！';
  }
  if (/java|Spring|后端/.test(q)) {
    return 'Java 后端面试重点：JVM 原理、并发编程、Spring 框架、MySQL 优化、分布式系统设计。建议从 JVM 和并发开始系统复习。';
  }
  if (/前端|React|Vue|typescript/.test(q)) {
    return '前端面试重点：JavaScript 基础、React/Vue 框架原理、性能优化、工程化实践、算法与数据结构。';
  }
  if (/agent|字节码|bytecode|asm/.test(q)) {
    return 'JavaAgent 开发是当前热门方向！核心技能：ASM/ByteBuddy 字节码框架、JVMTI 接口、类加载机制、APM 系统设计。建议先从 ASM 官方教程入手。';
  }
  if (/谢谢|thank|感谢/.test(q)) {
    return '不客气！随时找我，我在每个页面都可以为你提供帮助 😊';
  }

  // 默认回复
  const defaults = [
    '这是个好问题！你可以试试「开始面试」功能来检验自己的水平。',
    '我建议你先选择感兴趣的岗位，配置难度和题目数量，开始一次模拟面试来了解自己的水平。',
    '你想了解哪方面的内容呢？我可以帮你选岗位、分析报告、或者准备面试题目。',
    context?.position
      ? `关于 ${context.position} 岗位，你有什么具体想了解的吗？`
      : '试试问我「推荐什么岗位」或「面试准备技巧」吧！',
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}
