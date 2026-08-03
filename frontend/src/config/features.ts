/**
 * 平台特性配置
 * — 控制「新」功能标识位置 + 通知/更新记录
 * — 新功能上线时只需修改此文件
 */

/** 当前标注为"新"的功能 key */
export const NEW_FEATURE_KEY = 'video-interview';

/** 新功能配置：key → 展示信息 */
export interface NewFeatureBadge {
  key: string;
  /** 侧边栏菜单 key（用于匹配显示"新"角标） */
  sidebarKey: string;
  /** Dashboard 功能卡片标题（用于匹配"新"标签） */
  dashboardLabel: string;
}

export const FEATURE_BADGE_MAP: Record<string, NewFeatureBadge> = {
  'invite-code': {
    key: 'invite-code',
    sidebarKey: '/setup',
    dashboardLabel: '面试码',
  },
  'video-interview': {
    key: 'video-interview',
    sidebarKey: '/setup',
    dashboardLabel: '视频面试',
  },
};

/** 更新记录（最新的在前） */
export interface UpdateRecord {
  date: string;
  text: string;
}

export const UPDATE_HISTORY: UpdateRecord[] = [
  { date: '8月3日', text: '🎥 视频面试功能上线，支持AI虚拟形象' },
  { date: '8月3日', text: '📝 面试码功能上线，HR可创建专属面试' },
  { date: '8月2日', text: '🎨 工作台UI全面优化，布局更清晰' },
  { date: '8月1日', text: '🔍 搜索栏升级，支持精确匹配跳转' },
  { date: '7月31日', text: '🔔 通知铃铛上线，实时推送平台更新' },
  { date: '7月30日', text: '📊 HR管理后台新增面试监控面板' },
];
