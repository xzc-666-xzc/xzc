# 问题反馈工单模块 — 完整技术落地方案

> 项目：多模态智能模拟面试评测平台  
> 版本：v3.1  
> 模块：Work Order（工单反馈系统）  
> 日期：2026-08-03

---

## 目录

1. [架构总览](#1-架构总览)
2. [数据库表结构设计](#2-数据库表结构设计)
3. [实体类设计](#3-实体类设计)
4. [API 接口设计](#4-api-接口设计)
5. [状态机与流转控制](#5-状态机与流转控制)
6. [OSS / 云存储附件处理](#6-oss--云存储附件处理)
7. [通知机制设计](#7-通知机制设计)
8. [前端路由与权限拦截](#8-前端路由与权限拦截)
9. [前端 UI 交互设计](#9-前端-ui-交互设计)
10. [核心业务逻辑代码框架](#10-核心业务逻辑代码框架)
11. [部署与配置清单](#11-部署与配置清单)

---

## 1. 架构总览

### 1.1 模块定位

工单模块作为一个**跨切服务**，逻辑上归属 `user-service`（与用户强关联），物理上在 `common` 模块中定义实体/Mapper，在 `user-service` 中实现 Controller/Service。

```
common/
├── entity/
│   ├── WorkOrder.java            # 工单实体
│   ├── WorkOrderMessage.java     # 工单留言实体
│   └── WorkOrderAttachment.java  # 附件实体
├── dto/
│   └── WorkOrderQuery.java       # 工单查询DTO

user-service/
├── controller/
│   └── WorkOrderController.java      # 工单接口
├── service/
│   ├── WorkOrderService.java         # 工单业务逻辑
│   ├── WorkOrderMessageService.java  # 留言业务逻辑
│   └── OssService.java               # OSS文件上传服务
├── mapper/
│   ├── WorkOrderMapper.java
│   ├── WorkOrderMessageMapper.java
│   └── WorkOrderAttachmentMapper.java
└── enums/
    ├── WorkOrderStatus.java          # 工单状态枚举
    └── WorkOrderType.java            # 问题类型枚举

frontend/src/
├── pages/
│   └── work-order/
│       ├── WorkOrderList.tsx          # 工单列表页
│       ├── WorkOrderDetail.tsx        # 工单详情页（含留言）
│       └── WorkOrderCreate.tsx        # 创建工单页
├── services/
│   └── workOrderService.ts           # 工单 API 服务
├── stores/
│   └── workOrderStore.ts             # 工单状态管理
└── types/
    └── workOrder.ts                  # 工单类型定义
```

### 1.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 持久层 | MyBatis-Plus 3.x | 与现有项目一致，使用 `BaseMapper<T>` |
| 文件存储 | 阿里云 OSS / MinIO | 生产环境 OSS，开发环境 MinIO |
| 实时通信 | HTTP 轮询（短期）→ WebSocket（长期） | 留言模块短期用轮询（3s），后续升级 WebSocket |
| 状态机 | Spring State Machine 或手工枚举驱动 | 本项目采用**枚举 + 状态转移表**轻量方案 |
| 通知 | 站内消息表 + 前端轮询 | 与现有小铃铛通知体系整合 |

---

## 2. 数据库表结构设计

### 2.1 工单主表 `t_work_order`

```sql
-- ============================================================
-- 工单主表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_work_order (
    id              BIGINT          PRIMARY KEY COMMENT '工单ID（雪花ID）',
    title           VARCHAR(256)    NOT NULL COMMENT '工单标题',
    type            VARCHAR(32)     NOT NULL COMMENT '问题类型: INTERVIEW_FAULT / FEATURE_SUGGESTION / BUG_REPORT',
    description     TEXT            NOT NULL COMMENT '详细描述',
    status          VARCHAR(32)     NOT NULL DEFAULT 'DRAFT' COMMENT '状态: DRAFT/PENDING/PROCESSING/RESOLVED/CLOSED',
    priority        VARCHAR(16)     NOT NULL DEFAULT 'MEDIUM' COMMENT '优先级: LOW/MEDIUM/HIGH/URGENT',
    submitter_id    BIGINT          NOT NULL COMMENT '提交人ID',
    assignee_id     BIGINT          DEFAULT NULL COMMENT '当前处理人ID（管理员）',
    escalated_to    BIGINT          DEFAULT NULL COMMENT '转报/升级目标ID（上级领导）',
    escalation_note TEXT            DEFAULT NULL COMMENT '转报备注',
    resolution      TEXT            DEFAULT NULL COMMENT '解决说明',
    resolved_at     DATETIME        DEFAULT NULL COMMENT '解决时间',
    closed_at       DATETIME        DEFAULT NULL COMMENT '关闭时间',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_submitter (submitter_id),
    INDEX idx_assignee (assignee_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问题反馈工单表';
```

### 2.2 工单留言表 `t_work_order_message`

```sql
-- ============================================================
-- 工单留言 / 内部沟通表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_work_order_message (
    id              BIGINT          PRIMARY KEY COMMENT '留言ID（雪花ID）',
    order_id        BIGINT          NOT NULL COMMENT '关联工单ID',
    sender_id       BIGINT          NOT NULL COMMENT '发送人ID',
    sender_name     VARCHAR(64)     NOT NULL COMMENT '发送人名称（冗余，方便展示）',
    sender_role     VARCHAR(32)     NOT NULL COMMENT '发送人角色: candidate/admin/hr',
    content         TEXT            NOT NULL COMMENT '消息内容',
    message_type    VARCHAR(16)     NOT NULL DEFAULT 'TEXT' COMMENT '消息类型: TEXT/SYSTEM/ESCALATION',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',

    INDEX idx_order_id (order_id),
    INDEX idx_sender (sender_id),
    FOREIGN KEY (order_id) REFERENCES t_work_order(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单留言/沟通记录表';
```

### 2.3 工单附件表 `t_work_order_attachment`

```sql
-- ============================================================
-- 工单附件表
-- ============================================================
CREATE TABLE IF NOT EXISTS t_work_order_attachment (
    id              BIGINT          PRIMARY KEY COMMENT '附件ID（雪花ID）',
    order_id        BIGINT          NOT NULL COMMENT '关联工单ID',
    message_id      BIGINT          DEFAULT NULL COMMENT '关联留言ID（留言中的附件）',
    file_name       VARCHAR(256)    NOT NULL COMMENT '原始文件名',
    file_type       VARCHAR(32)     NOT NULL COMMENT '文件类型: IMAGE/VIDEO/FILE',
    file_size       BIGINT          NOT NULL COMMENT '文件大小（字节）',
    file_url        VARCHAR(1024)   NOT NULL COMMENT 'OSS/CDN访问URL',
    file_key        VARCHAR(512)    NOT NULL COMMENT 'OSS存储Key（用于删除/归档）',
    mime_type       VARCHAR(128)    DEFAULT NULL COMMENT 'MIME类型',
    thumbnail_url   VARCHAR(1024)   DEFAULT NULL COMMENT '缩略图URL（视频/图片）',
    uploader_id     BIGINT          NOT NULL COMMENT '上传人ID',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',

    INDEX idx_order_id (order_id),
    INDEX idx_message_id (message_id),
    FOREIGN KEY (order_id) REFERENCES t_work_order(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单附件表';
```

### 2.4 站内通知表 `t_notification`

```sql
-- ============================================================
-- 站内通知表（通用，整合现有小铃铛体系）
-- ============================================================
CREATE TABLE IF NOT EXISTS t_notification (
    id              BIGINT          PRIMARY KEY COMMENT '通知ID（雪花ID）',
    user_id         BIGINT          NOT NULL COMMENT '接收人ID',
    title           VARCHAR(256)    NOT NULL COMMENT '通知标题',
    content         VARCHAR(1024)   NOT NULL COMMENT '通知内容',
    type            VARCHAR(32)     NOT NULL COMMENT '通知类型: WORK_ORDER_STATUS/INTERVIEW_REMIND/SYSTEM_UPDATE',
    ref_id          BIGINT          DEFAULT NULL COMMENT '关联业务ID（如工单ID）',
    ref_url         VARCHAR(512)    DEFAULT NULL COMMENT '跳转链接（前端路由）',
    is_read         TINYINT         NOT NULL DEFAULT 0 COMMENT '0-未读 1-已读',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',

    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内通知表';
```

### 2.5 数据字典速查

#### t_work_order 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | BIGINT | ✅ | 雪花算法生成 |
| `title` | VARCHAR(256) | ✅ | 工单标题，前端输入 |
| `type` | VARCHAR(32) | ✅ | `INTERVIEW_FAULT` / `FEATURE_SUGGESTION` / `BUG_REPORT` |
| `description` | TEXT | ✅ | 详细描述，支持 Markdown 纯文本 |
| `status` | VARCHAR(32) | ✅ | 见状态枚举 |
| `priority` | VARCHAR(16) | ✅ | `LOW` / `MEDIUM` / `HIGH` / `URGENT` |
| `submitter_id` | BIGINT | ✅ | FK → t_user.id |
| `assignee_id` | BIGINT | ❌ | 当前处理的管理员 ID |
| `escalated_to` | BIGINT | ❌ | 转报上级 ID |
| `escalation_note` | TEXT | ❌ | 转报原因备注 |
| `resolution` | TEXT | ❌ | 解决说明 |
| `resolved_at` | DATETIME | ❌ | 解决时间戳 |
| `closed_at` | DATETIME | ❌ | 关闭时间戳 |

#### t_work_order_message 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | BIGINT | ✅ | 雪花算法生成 |
| `order_id` | BIGINT | ✅ | FK → t_work_order.id |
| `sender_id` | BIGINT | ✅ | 发送人 ID |
| `sender_name` | VARCHAR(64) | ✅ | 冗余，避免 JOIN |
| `sender_role` | VARCHAR(32) | ✅ | `candidate` / `admin` / `hr` |
| `content` | TEXT | ✅ | 消息正文 |
| `message_type` | VARCHAR(16) | ✅ | `TEXT` / `SYSTEM` / `ESCALATION` |
| `created_at` | DATETIME | ✅ | 自动填充 |

---

## 3. 实体类设计

### 3.1 WorkOrderStatus 枚举

```java
package com.interview.common.enums;

import lombok.Getter;

/**
 * 工单状态枚举 — 严格按照顺序流转
 *
 * <pre>
 *   DRAFT → PENDING → PROCESSING → RESOLVED
 *                                 → CLOSED
 * </pre>
 */
@Getter
public enum WorkOrderStatus {

    DRAFT("草稿", "用户尚未提交，可编辑"),
    PENDING("待处理", "用户已提交，等待管理员接单"),
    PROCESSING("处理中", "管理员已接单，正在处理"),
    RESOLVED("已解决", "问题已解决，等待用户确认"),
    CLOSED("已关闭", "用户确认或超时自动关闭");

    private final String label;
    private final String description;

    WorkOrderStatus(String label, String description) {
        this.label = label;
        this.description = description;
    }

    /**
     * 判断是否允许从当前状态转移到目标状态
     */
    public boolean canTransitionTo(WorkOrderStatus target) {
        return switch (this) {
            case DRAFT      -> target == PENDING;
            case PENDING    -> target == PROCESSING || target == CLOSED;
            case PROCESSING -> target == RESOLVED || target == CLOSED;
            case RESOLVED   -> target == CLOSED;
            case CLOSED     -> false; // 终态，不可再流转
        };
    }

    /**
     * 合法的下一状态集合
     */
    public java.util.Set<WorkOrderStatus> allowedNext() {
        return switch (this) {
            case DRAFT      -> java.util.Set.of(PENDING);
            case PENDING    -> java.util.Set.of(PROCESSING, CLOSED);
            case PROCESSING -> java.util.Set.of(RESOLVED, CLOSED);
            case RESOLVED   -> java.util.Set.of(CLOSED);
            case CLOSED     -> java.util.Set.of();
        };
    }
}
```

### 3.2 WorkOrderType 枚举

```java
package com.interview.common.enums;

import lombok.Getter;

@Getter
public enum WorkOrderType {

    INTERVIEW_FAULT("面试故障", "面试过程中遇到的技术问题"),
    FEATURE_SUGGESTION("功能建议", "对平台功能的改进建议"),
    BUG_REPORT("BUG上报", "平台使用中发现的程序缺陷");

    private final String label;
    private final String description;

    WorkOrderType(String label, String description) {
        this.label = label;
        this.description = description;
    }
}
```

### 3.3 WorkOrder 实体

```java
package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_work_order")
public class WorkOrder {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 工单标题 */
    private String title;

    /** 问题类型: INTERVIEW_FAULT / FEATURE_SUGGESTION / BUG_REPORT */
    private String type;

    /** 详细描述 */
    private String description;

    /** 状态: DRAFT / PENDING / PROCESSING / RESOLVED / CLOSED */
    private String status;

    /** 优先级: LOW / MEDIUM / HIGH / URGENT */
    private String priority;

    /** 提交人ID */
    private Long submitterId;

    /** 当前处理人ID */
    private Long assigneeId;

    /** 转报上级ID */
    private Long escalatedTo;

    /** 转报备注 */
    private String escalationNote;

    /** 解决说明 */
    private String resolution;

    /** 解决时间 */
    private LocalDateTime resolvedAt;

    /** 关闭时间 */
    private LocalDateTime closedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

### 3.4 WorkOrderMessage 实体

```java
package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_work_order_message")
public class WorkOrderMessage {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 关联工单ID */
    private Long orderId;

    /** 发送人ID */
    private Long senderId;

    /** 发送人名称 */
    private String senderName;

    /** 发送人角色 */
    private String senderRole;

    /** 消息内容 */
    private String content;

    /** 消息类型: TEXT / SYSTEM / ESCALATION */
    private String messageType;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

### 3.5 WorkOrderAttachment 实体

```java
package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_work_order_attachment")
public class WorkOrderAttachment {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long orderId;
    private Long messageId;
    private String fileName;
    private String fileType;    // IMAGE / VIDEO / FILE
    private Long fileSize;
    private String fileUrl;
    private String fileKey;
    private String mimeType;
    private String thumbnailUrl;
    private Long uploaderId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

---

## 4. API 接口设计

> 基础路径：`/api/work-orders`  
> 鉴权：所有接口均需携带 Bearer Token（白名单无）

### 4.1 接口清单

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| `POST` | `/api/work-orders` | candidate | 创建工单（或保存草稿） |
| `GET` | `/api/work-orders` | 所有用户 | 查询工单列表（用户看自己的，管理员看全部） |
| `GET` | `/api/work-orders/{id}` | 相关用户 | 查询工单详情（含附件列表） |
| `PUT` | `/api/work-orders/{id}` | 提交人 | 编辑草稿工单 |
| `POST` | `/api/work-orders/{id}/submit` | 提交人 | 提交草稿 → PENDING |
| `POST` | `/api/work-orders/{id}/accept` | admin/hr | 接单 → PROCESSING |
| `POST` | `/api/work-orders/{id}/resolve` | admin/hr | 标记解决 → RESOLVED |
| `POST` | `/api/work-orders/{id}/close` | 提交人/admin | 关闭工单 → CLOSED |
| `POST` | `/api/work-orders/{id}/escalate` | admin/hr | 转报上级 |
| `GET` | `/api/work-orders/{id}/messages` | 相关用户 | 获取留言列表（分页） |
| `POST` | `/api/work-orders/{id}/messages` | 相关用户 | 发送留言 |
| `POST` | `/api/work-orders/{id}/attachments` | 相关用户 | 上传附件 |
| `DELETE` | `/api/work-orders/{id}/attachments/{attId}` | 上传人 | 删除附件 |
| `GET` | `/api/notifications` | 所有用户 | 获取通知列表 |
| `PUT` | `/api/notifications/{id}/read` | 接收人 | 标记已读 |
| `PUT` | `/api/notifications/read-all` | 所有用户 | 全部已读 |

### 4.2 详细接口定义

#### 4.2.1 创建工单

```
POST /api/work-orders
Content-Type: application/json

Request:
{
  "title": "视频面试画面卡顿",
  "type": "INTERVIEW_FAULT",
  "description": "在视频面试过程中，AI虚拟形象画面出现卡顿，延迟约3秒...",
  "priority": "HIGH"
}

Response 201:
{
  "code": 20100,
  "message": "创建成功",
  "data": {
    "id": "1852345678901234567",
    "status": "DRAFT",
    "createdAt": "2026-08-03T14:30:00"
  },
  "timestamp": 1722676200000
}

Validation Error 40001:
{
  "code": 40001,
  "message": "参数校验失败",
  "errors": [
    { "field": "title", "message": "标题不能为空" },
    { "field": "description", "message": "描述至少20个字符" }
  ],
  "timestamp": 1722676200000
}
```

#### 4.2.2 查询工单列表

```
GET /api/work-orders?page=1&pageSize=10&status=PENDING&type=INTERVIEW_FAULT

Response 200:
{
  "code": 20000,
  "message": "操作成功",
  "data": {
    "records": [
      {
        "id": "1852345678901234567",
        "title": "视频面试画面卡顿",
        "type": "INTERVIEW_FAULT",
        "status": "PENDING",
        "priority": "HIGH",
        "submitterName": "张三",
        "assigneeName": null,
        "messageCount": 0,
        "createdAt": "2026-08-03T14:30:00",
        "updatedAt": "2026-08-03T14:30:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "pages": 1
  },
  "timestamp": 1722676200000
}
```

#### 4.2.3 查询工单详情

```
GET /api/work-orders/1852345678901234567

Response 200:
{
  "code": 20000,
  "message": "操作成功",
  "data": {
    "id": "1852345678901234567",
    "title": "视频面试画面卡顿",
    "type": "INTERVIEW_FAULT",
    "typeLabel": "面试故障",
    "description": "在视频面试过程中...",
    "status": "PROCESSING",
    "statusLabel": "处理中",
    "priority": "HIGH",
    "submitter": { "id": 1001, "username": "张三", "avatar": "..." },
    "assignee": { "id": 2001, "username": "李客服", "avatar": "..." },
    "escalatedTo": null,
    "escalationNote": null,
    "resolution": null,
    "attachments": [
      {
        "id": "3001",
        "fileName": "screenshot.png",
        "fileType": "IMAGE",
        "fileSize": 245760,
        "fileUrl": "https://oss.example.com/work-orders/1852.../screenshot.png",
        "thumbnailUrl": "https://oss.example.com/work-orders/1852.../screenshot_thumb.png",
        "uploaderId": 1001,
        "createdAt": "2026-08-03T14:30:00"
      }
    ],
    "createdAt": "2026-08-03T14:30:00",
    "updatedAt": "2026-08-03T14:35:00"
  }
}
```

#### 4.2.4 状态变更（以接单为例）

```
POST /api/work-orders/1852345678901234567/accept

Response 200:
{
  "code": 20000,
  "message": "已接单，工单状态更新为处理中",
  "data": {
    "id": "1852345678901234567",
    "status": "PROCESSING",
    "assigneeId": 2001,
    "updatedAt": "2026-08-03T14:35:00"
  }
}
```

#### 4.2.5 转报上级

```
POST /api/work-orders/1852345678901234567/escalate
Content-Type: application/json

Request:
{
  "escalatedTo": 3001,
  "note": "该问题涉及AI模型底层推理逻辑，需要算法团队介入处理"
}

Response 200:
{
  "code": 20000,
  "message": "已转报上级",
  "data": {
    "id": "1852345678901234567",
    "escalatedTo": 3001,
    "escalationNote": "该问题涉及AI模型底层推理逻辑，需要算法团队介入处理"
  }
}
```

#### 4.2.6 发送留言

```
POST /api/work-orders/1852345678901234567/messages
Content-Type: application/json

Request:
{
  "content": "你好，我已经查看了您的截图，初步判断是浏览器WebGL兼容性问题。请问您使用的是什么浏览器？",
  "messageType": "TEXT"
}

Response 201:
{
  "code": 20100,
  "message": "发送成功",
  "data": {
    "id": "5001",
    "content": "你好，我已经查看了您的截图...",
    "senderName": "李客服",
    "senderRole": "admin",
    "createdAt": "2026-08-03T14:40:00"
  }
}
```

#### 4.2.7 获取留言列表

```
GET /api/work-orders/1852345678901234567/messages?page=1&pageSize=50

Response 200:
{
  "code": 20000,
  "data": {
    "records": [
      {
        "id": "5001",
        "senderId": 2001,
        "senderName": "李客服",
        "senderRole": "admin",
        "content": "你好，我已经查看了您的截图...",
        "messageType": "TEXT",
        "createdAt": "2026-08-03T14:40:00"
      },
      {
        "id": "5002",
        "senderId": 1001,
        "senderName": "张三",
        "senderRole": "candidate",
        "content": "我使用的是 Chrome 120 版本",
        "messageType": "TEXT",
        "createdAt": "2026-08-03T14:42:00"
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 50,
    "pages": 1
  }
}
```

---

## 5. 状态机与流转控制

### 5.1 状态流转图

```
                    ┌──────────┐
                    │  DRAFT   │  用户创建，可编辑
                    │  草稿     │
                    └────┬─────┘
                         │ submit() 提交
                         ▼
                    ┌──────────┐
              ┌─────│ PENDING  │─────┐
              │     │ 待处理    │     │ close() 管理员直接关闭
              │     └────┬─────┘     │
              │          │ accept()  │
              │          ▼           │
              │     ┌──────────┐     │
              │     │PROCESSING│     │
              │     │ 处理中    │─────┤
              │     └────┬─────┘     │
              │          │ resolve() │ close() 无法解决
              │          ▼           │
              │     ┌──────────┐     │
              │     │ RESOLVED │     │
              │     │ 已解决    │     │
              │     └────┬─────┘     │
              │          │ close()   │
              │          ▼           ▼
              │     ┌──────────────────┐
              └────►│     CLOSED       │  终态
                    │     已关闭        │
                    └──────────────────┘
```

### 5.2 状态转移矩阵

| 当前状态 ↓ / 目标 → | DRAFT | PENDING | PROCESSING | RESOLVED | CLOSED |
|---------------------|--------|---------|------------|----------|--------|
| **DRAFT** | — | ✅ 提交 | ❌ | ❌ | ❌ |
| **PENDING** | ❌ | — | ✅ 接单 | ❌ | ✅ 管理员关闭 |
| **PROCESSING** | ❌ | ❌ | — | ✅ 解决 | ✅ 关闭 |
| **RESOLVED** | ❌ | ❌ | ❌ | — | ✅ 确认关闭 |
| **CLOSED** | ❌ | ❌ | ❌ | ❌ | — |

### 5.3 核心流转控制代码

```java
package com.interview.user.service;

import com.interview.common.entity.WorkOrder;
import com.interview.common.enums.WorkOrderStatus;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class WorkOrderStateMachine {

    /**
     * 核心状态转移方法 — 所有状态变更必须经过此处
     *
     * @param order  工单实体（已从DB加载）
     * @param target 目标状态
     * @param operatorId 操作人ID
     * @param operatorRole 操作人角色
     * @throws BusinessException 当转移不合法时抛出
     */
    @Transactional
    public void transition(WorkOrder order,
                           WorkOrderStatus target,
                           Long operatorId,
                           String operatorRole) {

        WorkOrderStatus current = WorkOrderStatus.valueOf(order.getStatus());

        // 1. 校验状态转移合法性
        if (!current.canTransitionTo(target)) {
            throw new BusinessException(
                ResultCode.BAD_REQUEST,
                String.format("工单状态不能从 [%s] 直接变更为 [%s]，合法的下一状态为: %s",
                    current.getLabel(),
                    target.getLabel(),
                    current.allowedNext().stream()
                        .map(WorkOrderStatus::getLabel)
                        .toList()
                )
            );
        }

        // 2. 权限校验
        validatePermission(current, target, operatorId, operatorRole, order);

        // 3. 执行状态变更的附带操作
        applyTransitionSideEffects(order, target, operatorId);

        // 4. 更新状态
        order.setStatus(target.name());
        order.setUpdatedAt(LocalDateTime.now());
    }

    /**
     * 各状态转移的操作人权限校验
     */
    private void validatePermission(WorkOrderStatus current,
                                     WorkOrderStatus target,
                                     Long operatorId,
                                     String operatorRole,
                                     WorkOrder order) {

        boolean isAdmin = "admin".equals(operatorRole) || "hr".equals(operatorRole);
        boolean isSubmitter = operatorId.equals(order.getSubmitterId());
        boolean isAssignee = operatorId.equals(order.getAssigneeId());

        switch (target) {
            case PENDING -> {
                // 只有提交人自己可以从草稿提交
                if (current == WorkOrderStatus.DRAFT && !isSubmitter) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "只有提交人本人可以提交工单");
                }
            }
            case PROCESSING -> {
                // 只有管理员可以接单
                if (!isAdmin) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "只有管理员可以接单");
                }
            }
            case RESOLVED -> {
                // 只有当前处理人或管理员可以标记为已解决
                if (!isAdmin && !isAssignee) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "只有处理人可以标记为已解决");
                }
            }
            case CLOSED -> {
                // 提交人、管理员、处理人都可以关闭
                if (!isSubmitter && !isAdmin && !isAssignee) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "无权限关闭此工单");
                }
                // PENDING 状态下只有管理员能关闭
                if (current == WorkOrderStatus.PENDING && !isAdmin) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "待处理状态下只有管理员可以关闭工单");
                }
            }
        }
    }

    /**
     * 状态变更的附带操作：填充时间戳、清除相关字段等
     */
    private void applyTransitionSideEffects(WorkOrder order,
                                             WorkOrderStatus target,
                                             Long operatorId) {
        switch (target) {
            case PENDING -> {
                // 提交时清除草稿痕迹，不做特殊处理
            }
            case PROCESSING -> {
                // 接单时自动指派处理人
                order.setAssigneeId(operatorId);
            }
            case RESOLVED -> {
                order.setResolvedAt(LocalDateTime.now());
            }
            case CLOSED -> {
                order.setClosedAt(LocalDateTime.now());
                // 如果从 RESOLVED 过来但没有解决时间（异常），补填
                if (order.getResolvedAt() == null) {
                    order.setResolvedAt(LocalDateTime.now());
                }
            }
        }
    }
}
```

### 5.4 Service 层调用示例

```java
@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderMapper workOrderMapper;
    private final WorkOrderStateMachine stateMachine;
    private final NotificationService notificationService;

    /**
     * 用户提交草稿工单
     */
    @Transactional
    public WorkOrder submitWorkOrder(Long orderId, Long userId) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }

        // 执行状态转移
        stateMachine.transition(order, WorkOrderStatus.PENDING, userId, "candidate");

        // 持久化
        workOrderMapper.updateById(order);

        // 发送通知给管理员
        notificationService.notifyAdmins(
            "新工单待处理",
            String.format("用户提交了工单「%s」，请及时处理", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        return order;
    }

    /**
     * 管理员接单
     */
    @Transactional
    public WorkOrder acceptWorkOrder(Long orderId, Long adminId, String role) {
        WorkOrder order = workOrderMapper.selectById(orderId);

        stateMachine.transition(order, WorkOrderStatus.PROCESSING, adminId, role);

        workOrderMapper.updateById(order);

        // 通知提交人：工单已被接单
        notificationService.notifyUser(
            order.getSubmitterId(),
            "工单处理中",
            String.format("您的工单「%s」已被管理员接单，正在处理中", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        return order;
    }

    /**
     * 管理员标记已解决
     */
    @Transactional
    public WorkOrder resolveWorkOrder(Long orderId, Long operatorId,
                                       String role, String resolution) {
        WorkOrder order = workOrderMapper.selectById(orderId);

        stateMachine.transition(order, WorkOrderStatus.RESOLVED, operatorId, role);

        order.setResolution(resolution);
        workOrderMapper.updateById(order);

        // 通知提交人：问题已解决
        notificationService.notifyUser(
            order.getSubmitterId(),
            "工单已解决",
            String.format("您的工单「%s」已被标记为已解决", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        return order;
    }

    /**
     * 关闭工单
     */
    @Transactional
    public WorkOrder closeWorkOrder(Long orderId, Long operatorId, String role) {
        WorkOrder order = workOrderMapper.selectById(orderId);

        stateMachine.transition(order, WorkOrderStatus.CLOSED, operatorId, role);

        workOrderMapper.updateById(order);

        // 如果是管理员关闭，通知提交人
        if (!operatorId.equals(order.getSubmitterId())) {
            notificationService.notifyUser(
                order.getSubmitterId(),
                "工单已关闭",
                String.format("您的工单「%s」已被管理员关闭", order.getTitle()),
                "/work-orders/" + order.getId()
            );
        }

        return order;
    }

    /**
     * 转报上级
     */
    @Transactional
    public WorkOrder escalateWorkOrder(Long orderId, Long operatorId,
                                        String role, Long escalatedTo, String note) {
        WorkOrder order = workOrderMapper.selectById(orderId);

        // 转报不改变状态，仅记录字段
        if (!"admin".equals(role) && !"hr".equals(role)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有管理员可以转报工单");
        }

        order.setEscalatedTo(escalatedTo);
        order.setEscalationNote(note);
        workOrderMapper.updateById(order);

        // 通知转报目标人
        notificationService.notifyUser(
            escalatedTo,
            "工单转报",
            String.format("管理员转报了一条工单「%s」给您处理", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        // 在留言中自动记录转报操作
        messageService.addSystemMessage(orderId,
            String.format("管理员已将工单转报给上级（ID:%d），备注：%s", escalatedTo, note));

        return order;
    }
}
```

---

## 6. OSS / 云存储附件处理

### 6.1 存储架构

```
客户端浏览器                    后端服务                    阿里云 OSS
    │                            │                          │
    │ ① POST /attachments       │                          │
    │  multipart/form-data       │                          │
    │──────────────────────────►│                          │
    │                            │ ② 校验文件类型/大小      │
    │                            │ ③ 生成存储Key           │
    │                            │ ④ ossClient.putObject()  │
    │                            │─────────────────────────►│
    │                            │ ⑤ 返回 fileUrl          │
    │ ⑥ 201 { fileUrl, id }    │                          │
    │◄──────────────────────────│                          │
    │                            │                          │
    │ ⑦ 前端将 attachmentId     │                          │
    │    提交到工单创建/留言接口 │                          │
```

### 6.2 OssService 实现

```java
package com.interview.user.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.PutObjectRequest;
import com.interview.common.entity.WorkOrderAttachment;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import com.interview.user.mapper.WorkOrderAttachmentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OssService {

    private final WorkOrderAttachmentMapper attachmentMapper;

    @Value("${oss.endpoint}")
    private String endpoint;

    @Value("${oss.access-key-id}")
    private String accessKeyId;

    @Value("${oss.access-key-secret}")
    private String accessKeySecret;

    @Value("${oss.bucket-name}")
    private String bucketName;

    @Value("${oss.cdn-domain:}")  // CDN域名，可选
    private String cdnDomain;

    // 允许的图片类型
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"
    );

    // 允许的视频类型
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
        "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    );

    // 文件大小限制
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10MB
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100MB

    /**
     * 上传附件
     *
     * @param file       上传文件
     * @param orderId    工单ID
     * @param uploaderId 上传人ID
     * @return 附件实体（含访问URL）
     */
    public WorkOrderAttachment uploadAttachment(MultipartFile file,
                                                  Long orderId,
                                                  Long uploaderId) {
        // 1. 校验
        validateFile(file);

        // 2. 确定文件类型
        String fileType = determineFileType(file.getContentType());

        // 3. 生成 OSS key
        // 格式: work-orders/{orderId}/{date}/{uuid}.{ext}
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String originalName = file.getOriginalFilename();
        String ext = getFileExtension(originalName);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String ossKey = String.format("work-orders/%d/%s/%s.%s",
            orderId, date, uuid, ext);

        // 4. 上传到 OSS
        String fileUrl = uploadToOss(ossKey, file);

        // 5. 保存附件记录
        WorkOrderAttachment attachment = new WorkOrderAttachment();
        attachment.setOrderId(orderId);
        attachment.setFileName(originalName);
        attachment.setFileType(fileType);
        attachment.setFileSize(file.getSize());
        attachment.setFileUrl(fileUrl);
        attachment.setFileKey(ossKey);
        attachment.setMimeType(file.getContentType());
        attachment.setUploaderId(uploaderId);

        // 图片生成缩略图
        if ("IMAGE".equals(fileType)) {
            attachment.setThumbnailUrl(fileUrl + "?x-oss-process=image/resize,m_fill,w_200,h_200");
        }

        attachmentMapper.insert(attachment);
        return attachment;
    }

    /**
     * 删除附件
     */
    public void deleteAttachment(Long attachmentId, Long operatorId) {
        WorkOrderAttachment attachment = attachmentMapper.selectById(attachmentId);
        if (attachment == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "附件不存在");
        }
        if (!attachment.getUploaderId().equals(operatorId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能删除自己上传的附件");
        }

        // 从 OSS 删除
        deleteFromOss(attachment.getFileKey());

        // 从数据库删除
        attachmentMapper.deleteById(attachmentId);
    }

    // ==================== 私有辅助方法 ====================

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "文件不能为空");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "无法识别文件类型");
        }

        boolean isImage = ALLOWED_IMAGE_TYPES.contains(contentType);
        boolean isVideo = ALLOWED_VIDEO_TYPES.contains(contentType);

        if (!isImage && !isVideo) {
            throw new BusinessException(ResultCode.BAD_REQUEST,
                "不支持的文件类型（支持：JPEG/PNG/GIF/WebP/BMP/MP4/WebM/OGG/MOV）");
        }

        long maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (file.getSize() > maxSize) {
            String limit = isImage ? "10MB" : "100MB";
            throw new BusinessException(ResultCode.BAD_REQUEST,
                "文件大小超过限制（" + (isImage ? "图片" : "视频") + "最大 " + limit + "）");
        }
    }

    private String determineFileType(String contentType) {
        if (ALLOWED_IMAGE_TYPES.contains(contentType)) return "IMAGE";
        if (ALLOWED_VIDEO_TYPES.contains(contentType)) return "VIDEO";
        return "FILE";
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "bin";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    private String uploadToOss(String key, MultipartFile file) {
        OSS ossClient = null;
        try {
            ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
            InputStream inputStream = file.getInputStream();
            ossClient.putObject(bucketName, key, inputStream);

            // 拼接访问 URL
            String baseUrl = (cdnDomain != null && !cdnDomain.isEmpty())
                ? "https://" + cdnDomain
                : "https://" + bucketName + "." + endpoint;
            return baseUrl + "/" + key;

        } catch (Exception e) {
            log.error("OSS 上传失败: key={}", key, e);
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "文件上传失败，请稍后重试");
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }

    private void deleteFromOss(String key) {
        OSS ossClient = null;
        try {
            ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
            ossClient.deleteObject(bucketName, key);
        } catch (Exception e) {
            log.error("OSS 删除失败: key={}", key, e);
            // 删除失败不抛异常 — 允许前端脏数据，通过定时任务清理
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }
}
```

### 6.3 安全配置建议

```yaml
# application.yml
oss:
  endpoint: oss-cn-hangzhou.aliyuncs.com
  access-key-id: ${OSS_ACCESS_KEY_ID}        # 环境变量注入，禁止硬编码
  access-key-secret: ${OSS_ACCESS_KEY_SECRET}
  bucket-name: smart-interview-work-orders
  cdn-domain: cdn.example.com                # CDN 加速域名（可选）

# Bucket 安全策略（在阿里云控制台配置）：
# 1. Bucket 访问权限：私有（不允许公共读）
# 2. 通过 RAM 子账号授权，最小权限原则（仅 PutObject / DeleteObject）
# 3. 配置防盗链 Referer 白名单
# 4. 开启服务端加密（AES-256）
# 5. 文件 URL 通过后端签名生成临时访问链接，有效期 30 分钟
```

### 6.4 临时签名 URL（生产推荐）

```java
/**
 * 生成临时签名访问URL（替代直接公开Bucket）
 * 适用于 Bucket 设置为私有时
 */
public String generatePresignedUrl(String ossKey, int expireSeconds) {
    OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
    try {
        Date expiration = new Date(System.currentTimeMillis() + expireSeconds * 1000L);
        URL url = ossClient.generatePresignedUrl(bucketName, ossKey, expiration);
        return url.toString();
    } finally {
        ossClient.shutdown();
    }
}
```

---

## 7. 通知机制设计

### 7.1 整体流程

```
状态变更发生（接单/解决/关闭/转报）
        │
        ▼
WorkOrderService 调用 NotificationService
        │
        ├──► 写入 t_notification 表（持久化）
        │
        └──► Redis Pub/Sub（可选，实时推送用）
                │
                ▼
        前端轮询 GET /api/notifications?isRead=0
        （每 30s，或在页面获得焦点时）
                │
                ▼
        小铃铛图标红点 + 未读计数
```

### 7.2 NotificationService 实现

```java
package com.interview.user.service;

import com.interview.common.entity.Notification;
import com.interview.user.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;

    /**
     * 通知单个用户
     */
    public void notifyUser(Long userId, String title, String content, String refUrl) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType("WORK_ORDER_STATUS");
        notification.setRefUrl(refUrl);
        notification.setIsRead(0);
        notificationMapper.insert(notification);
    }

    /**
     * 通知所有管理员
     */
    public void notifyAdmins(String title, String content, String refUrl) {
        // 查询所有 admin/hr 角色的用户ID
        List<Long> adminIds = userMapper.selectIdsByRoles(List.of("admin", "hr"));
        for (Long adminId : adminIds) {
            notifyUser(adminId, title, content, refUrl);
        }
    }

    /**
     * 通知工单相关方（除了操作人自己）
     */
    public void notifyOrderStakeholders(Long orderId, Long operatorId,
                                         String title, String content, String refUrl) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        // 通知提交人（如果操作人不是提交人）
        if (!operatorId.equals(order.getSubmitterId())) {
            notifyUser(order.getSubmitterId(), title, content, refUrl);
        }
        // 通知处理人（如果操作人不是处理人）
        if (order.getAssigneeId() != null && !operatorId.equals(order.getAssigneeId())) {
            notifyUser(order.getAssigneeId(), title, content, refUrl);
        }
    }

    /**
     * 获取用户未读通知数
     */
    public int getUnreadCount(Long userId) {
        return notificationMapper.selectCount(
            new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0)
        );
    }

    /**
     * 获取用户通知列表
     */
    public PageResult<Notification> getNotifications(Long userId, int page, int pageSize) {
        IPage<Notification> result = notificationMapper.selectPage(
            new Page<>(page, pageSize),
            new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .orderByDesc(Notification::getCreatedAt)
        );
        return PageResult.of(result.getRecords(), result.getTotal(), page, pageSize);
    }

    /**
     * 标记单条已读
     */
    public void markRead(Long notificationId, Long userId) {
        Notification notification = notificationMapper.selectById(notificationId);
        if (notification == null || !notification.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        notification.setIsRead(1);
        notificationMapper.updateById(notification);
    }

    /**
     * 全部标记已读
     */
    public void markAllRead(Long userId) {
        notificationMapper.markAllRead(userId);
    }
}
```

### 7.3 前端通知轮询 Hook

```typescript
// frontend/src/hooks/useNotificationPoll.ts
import { useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '@/stores';

const POLL_INTERVAL = 30_000; // 30秒

export function useNotificationPoll(onUnreadCount: (count: number) => void) {
  const token = useUserStore(s => s.token);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.code === 20000) {
        onUnreadCount(json.data);
      }
    } catch {
      // 静默失败
    }
  }, [token, onUnreadCount]);

  useEffect(() => {
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL);

    // 页面获得焦点时立即查询
    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchUnread]);
}
```

---

## 8. 前端路由与权限拦截

### 8.1 路由配置

```typescript
// frontend/src/App.tsx 新增路由

{/* 工单模块 */}
<Route path="work-orders" element={<WorkOrderList />} />
<Route path="work-orders/create" element={<WorkOrderCreate />} />
<Route path="work-orders/:id" element={<WorkOrderDetail />} />

// 完整路由树:
// /
// ├── login
// ├── setup
// ├── interview/:id
// ├── interview/video/:roomId
// ├── report/:id
// ├── reports
// ├── leaderboard
// ├── profile
// ├── admin
// ├── work-orders              ← 新增：工单列表
// ├── work-orders/create       ← 新增：创建工单
// └── work-orders/:id          ← 新增：工单详情
```

### 8.2 权限拦截策略

```typescript
// frontend/src/components/WorkOrderGuard.tsx

import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores';

interface WorkOrderGuardProps {
  children: React.ReactNode;
  /** 需要的角色列表，不传则不限制 */
  roles?: ('candidate' | 'hr' | 'teacher' | 'admin')[];
  /** 操作类型，用于更精细的权限控制 */
  action?: 'create' | 'view' | 'manage';
}

/**
 * 工单模块权限守卫
 *
 * 规则：
 * - candidate: 可创建工单、查看自己的工单列表和详情、在工单内留言
 * - hr / teacher / admin: 可查看全部工单、接单、处理、转报
 */
export default function WorkOrderGuard({ children, roles, action }: WorkOrderGuardProps) {
  const user = useUserStore(s => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 角色限制
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 操作限制
  if (action === 'create') {
    // 只有候选人可以创建工单
    if (user.role !== 'candidate') {
      return <Navigate to="/work-orders" replace />;
    }
  }

  return <>{children}</>;
}
```

### 8.3 API 层权限控制

```java
// 后端 Controller 中使用注解 + AuthUtil 双重保障

@RestController
@RequestMapping("/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final AuthUtil authUtil;

    @GetMapping
    public R<PageResult<WorkOrderListVO>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {

        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);  // 从请求头 X-Role 获取

        boolean isAdmin = "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);

        PageResult<WorkOrderListVO> result = isAdmin
            ? workOrderService.listAll(page, pageSize, status, type)
            : workOrderService.listByUser(userId, page, pageSize, status, type);

        return R.ok(result);
    }

    @GetMapping("/{id}")
    public R<WorkOrderDetailVO> detail(
            HttpServletRequest request,
            @PathVariable Long id) {

        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);

        WorkOrderDetailVO detail = workOrderService.getDetail(id, userId, role);
        return R.ok(detail);
    }
}
```

---

## 9. 前端 UI 交互设计

### 9.1 导航栏 — 工单入口按钮

在 `Layout.tsx` 的 Header 右侧区域，**个人头像按钮**与**消息通知（小铃铛）**之间，新增工单入口：

```tsx
{/* ===== 在 header 右侧区域，搜索框之后，小铃铛之前插入 ===== */}

{/* Work Order ticket entry */}
<button
  onClick={() => navigate('/work-orders')}
  className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600
             transition-all duration-200 active:scale-90"
  title="工单反馈"
>
  {/* 工单图标 */}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>

  {/* 工单未读角标（可选，如用户有更新） */}
  {/* {unreadTicketCount > 0 && (
    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full
                     bg-orange-500 ring-2 ring-white animate-pulse" />
  )} */}
</button>

{/* Notification bell — 现有代码 */}
<div ref={notificationsRef} className="relative">
  <button onClick={handleBellClick} ...>
    ...
  </button>
</div>
```

### 9.2 工单列表页 `WorkOrderList.tsx`

**功能要点**：
- 卡片/表格混合布局
- 筛选栏：状态下拉、类型下拉、搜索输入
- 列表项：标题、类型标签（颜色区分）、状态标签、优先级、创建时间
- 分页
- 右上角「创建工单」按钮（仅 candidate 显示）

**状态标签配色方案**：

| 状态 | 颜色 | Tailwind |
|------|------|----------|
| 草稿 DRAFT | 灰色 | `bg-slate-100 text-slate-600` |
| 待处理 PENDING | 橙色 | `bg-orange-100 text-orange-700` |
| 处理中 PROCESSING | 蓝色 | `bg-blue-100 text-blue-700` |
| 已解决 RESOLVED | 绿色 | `bg-green-100 text-green-700` |
| 已关闭 CLOSED | 灰色 | `bg-slate-200 text-slate-500` |

**类型标签配色**：

| 类型 | 颜色 |
|------|------|
| 面试故障 INTERVIEW_FAULT | 红色 `bg-red-100 text-red-700` |
| 功能建议 FEATURE_SUGGESTION | 紫色 `bg-purple-100 text-purple-700` |
| BUG上报 BUG_REPORT | 黄色 `bg-amber-100 text-amber-700` |

### 9.3 工单创建页 `WorkOrderCreate.tsx`

**功能要点**：
- 标题输入框（必填，1~100字符）
- 问题类型下拉选择（必填）
- 详细描述文本框（必填，至少20字符，支持 Markdown 预览）
- 附件上传区：
  - 拖拽/点击上传
  - 支持图片（JPG/PNG/GIF/WebP，最大 10MB）和视频（MP4/WebM，最大 100MB）
  - 上传后展示缩略图（图片）或视频封面 + 文件名
  - 支持删除已上传附件
- 两个按钮：
  - 「保存草稿」— 提交为 DRAFT 状态
  - 「提交工单」— 提交为 PENDING 状态

### 9.4 工单详情页 `WorkOrderDetail.tsx`

**页面布局（两栏）**：

```
┌─────────────────────────────────────────────────────┐
│ ← 返回列表              工单 #1852345678901234567   │
├──────────────────────────┬──────────────────────────┤
│                          │                          │
│   工单信息卡片            │   沟通记录（留言区）      │
│                          │                          │
│   标题：视频面试画面卡顿   │  ┌──────────────────┐   │
│   状态：处理中            │  │ 管理员：你好...    │   │
│   类型：面试故障          │  │ 2026-08-03 14:40  │   │
│   优先级：高              │  └──────────────────┘   │
│   提交人：张三            │                          │
│   处理人：李客服          │  ┌──────────────────┐   │
│   创建时间：2026-08-03    │  │ 张三：Chrome 120  │   │
│                          │  │ 2026-08-03 14:42  │   │
│   详细描述：              │  └──────────────────┘   │
│   在视频面试过程中...      │                          │
│                          │  ┌─ 输入框 ──────────┐   │
│   附件：                  │  │ [输入消息...] 发送 │   │
│   📎 screenshot.png      │  └──────────────────┘   │
│                          │                          │
│   [操作按钮区]            │                          │
│   [接单] [转报] [解决]    │                          │
│   [关闭]                 │                          │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

**操作按钮可见性逻辑**：

| 按钮 | candidate 可见 | admin/hr 可见 | 前置状态 |
|------|:---:|:---:|------|
| 编辑（仅草稿）| ✅ | ❌ | DRAFT |
| 提交 | ✅ | ❌ | DRAFT |
| 接单 | ❌ | ✅ | PENDING |
| 转报 | ❌ | ✅ | PENDING / PROCESSING |
| 标记已解决 | ❌ | ✅ | PROCESSING |
| 关闭 | ✅ (自己的) | ✅ | PENDING / PROCESSING / RESOLVED |

### 9.5 转报弹窗组件 `EscalateDialog.tsx`

```
┌─────────────────────────────────────┐
│  转报工单                            │
│                                     │
│  转报给：  [下拉选择管理员/上级]      │
│                                     │
│  转报备注：                          │
│  ┌─────────────────────────────────┐│
│  │ 描述转报原因和处理情况...         ││
│  └─────────────────────────────────┘│
│                                     │
│          [取消]    [确认转报]        │
└─────────────────────────────────────┘
```

---

## 10. 核心业务逻辑代码框架

### 10.1 Controller 完整代码

```java
package com.interview.user.controller;

import com.interview.common.dto.PageQuery;
import com.interview.common.result.PageResult;
import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.user.service.WorkOrderService;
import com.interview.user.service.WorkOrderMessageService;
import com.interview.user.service.OssService;
import com.interview.user.vo.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Tag(name = "工单反馈", description = "问题反馈工单的创建、流转与沟通")
@RestController
@RequestMapping("/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final WorkOrderMessageService messageService;
    private final OssService ossService;
    private final AuthUtil authUtil;

    // ==================== 请求体 DTO ====================

    @Data
    public static class CreateWorkOrderRequest {
        @NotBlank(message = "标题不能为空")
        @Size(min = 1, max = 100, message = "标题长度1-100字符")
        private String title;

        @NotBlank(message = "问题类型不能为空")
        private String type;

        @NotBlank(message = "描述不能为空")
        @Size(min = 20, max = 5000, message = "描述长度20-5000字符")
        private String description;

        private String priority = "MEDIUM";

        /** 创建时已上传的附件ID列表 */
        private java.util.List<Long> attachmentIds;
    }

    @Data
    public static class SendMessageRequest {
        @NotBlank(message = "消息内容不能为空")
        @Size(min = 1, max = 2000)
        private String content;

        private String messageType = "TEXT";
    }

    @Data
    public static class EscalateRequest {
        @NotNull private Long escalatedTo;
        @NotBlank private String note;
    }

    @Data
    public static class ResolveRequest {
        @NotBlank @Size(min = 10, max = 2000)
        private String resolution;
    }

    // ==================== CRUD 端点 ====================

    @Operation(summary = "创建工单")
    @PostMapping
    public R<Map<String, Object>> create(
            HttpServletRequest request,
            @Valid @RequestBody CreateWorkOrderRequest req) {
        Long userId = authUtil.getUserId(request);
        var order = workOrderService.createWorkOrder(userId, req);
        return R.created(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "createdAt", order.getCreatedAt().toString()
        ));
    }

    @Operation(summary = "查询工单列表")
    @GetMapping
    public R<PageResult<WorkOrderListVO>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        return R.ok(workOrderService.listWorkOrders(userId, role, page, pageSize,
            status, type, keyword));
    }

    @Operation(summary = "查询工单详情")
    @GetMapping("/{id}")
    public R<WorkOrderDetailVO> detail(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        return R.ok(workOrderService.getDetail(id, userId, role));
    }

    @Operation(summary = "编辑草稿工单")
    @PutMapping("/{id}")
    public R<Void> update(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody CreateWorkOrderRequest req) {
        Long userId = authUtil.getUserId(request);
        workOrderService.updateDraft(id, userId, req);
        return R.ok();
    }

    // ==================== 状态流转端点 ====================

    @Operation(summary = "提交工单（草稿 → 待处理）")
    @PostMapping("/{id}/submit")
    public R<Map<String, Object>> submit(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        var order = workOrderService.submitWorkOrder(id, userId);
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "管理员接单（待处理 → 处理中）")
    @PostMapping("/{id}/accept")
    public R<Map<String, Object>> accept(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        var order = workOrderService.acceptWorkOrder(id, userId, role);
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "assigneeId", order.getAssigneeId().toString(),
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "标记已解决（处理中 → 已解决）")
    @PostMapping("/{id}/resolve")
    public R<Map<String, Object>> resolve(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody ResolveRequest req) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        var order = workOrderService.resolveWorkOrder(id, userId, role, req.getResolution());
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "关闭工单 → 已关闭")
    @PostMapping("/{id}/close")
    public R<Map<String, Object>> close(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        var order = workOrderService.closeWorkOrder(id, userId, role);
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "转报上级")
    @PostMapping("/{id}/escalate")
    public R<Map<String, Object>> escalate(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody EscalateRequest req) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        var order = workOrderService.escalateWorkOrder(id, userId, role,
            req.getEscalatedTo(), req.getNote());
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "escalatedTo", order.getEscalatedTo().toString()
        ));
    }

    // ==================== 留言端点 ====================

    @Operation(summary = "获取留言列表")
    @GetMapping("/{id}/messages")
    public R<PageResult<MessageVO>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        return R.ok(messageService.getMessages(id, page, pageSize));
    }

    @Operation(summary = "发送留言")
    @PostMapping("/{id}/messages")
    public R<MessageVO> sendMessage(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest req) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        String username = authUtil.getUsername(request);
        return R.created(messageService.sendMessage(id, userId, username, role,
            req.getContent(), req.getMessageType()));
    }

    // ==================== 附件端点 ====================

    @Operation(summary = "上传附件")
    @PostMapping("/{id}/attachments")
    public R<AttachmentVO> uploadAttachment(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        Long userId = authUtil.getUserId(request);
        var attachment = ossService.uploadAttachment(file, id, userId);
        return R.created(AttachmentVO.from(attachment));
    }

    @Operation(summary = "删除附件")
    @DeleteMapping("/{id}/attachments/{attId}")
    public R<Void> deleteAttachment(
            HttpServletRequest request,
            @PathVariable Long id,
            @PathVariable Long attId) {
        Long userId = authUtil.getUserId(request);
        ossService.deleteAttachment(attId, userId);
        return R.ok();
    }
}
```

### 10.2 前端 API Service

```typescript
// frontend/src/services/workOrderService.ts

import http from './api';
import type { ApiResponse, PageData } from '@/types';
import type {
  WorkOrder, WorkOrderListVO, WorkOrderDetailVO,
  MessageVO, AttachmentVO,
  CreateWorkOrderRequest, SendMessageRequest
} from '@/types/workOrder';

export const workOrderService = {

  // ============ 工单 CRUD ============

  /** 创建工单 */
  create: (data: CreateWorkOrderRequest) =>
    http.post<ApiResponse<{ id: string; status: string; createdAt: string }>>(
      '/work-orders', data),

  /** 查询工单列表 */
  list: (params?: {
    page?: number; pageSize?: number;
    status?: string; type?: string; keyword?: string;
  }) =>
    http.get<ApiResponse<PageData<WorkOrderListVO>>>('/work-orders', { params }),

  /** 查询工单详情 */
  getDetail: (id: string) =>
    http.get<ApiResponse<WorkOrderDetailVO>>(`/work-orders/${id}`),

  /** 编辑草稿工单 */
  update: (id: string, data: CreateWorkOrderRequest) =>
    http.put<ApiResponse<void>>(`/work-orders/${id}`, data),

  // ============ 状态流转 ============

  /** 提交草稿 */
  submit: (id: string) =>
    http.post<ApiResponse<{ id: string; status: string }>>(`/work-orders/${id}/submit`),

  /** 管理员接单 */
  accept: (id: string) =>
    http.post<ApiResponse<{ id: string; status: string; assigneeId: string }>>(
      `/work-orders/${id}/accept`),

  /** 标记已解决 */
  resolve: (id: string, resolution: string) =>
    http.post<ApiResponse<{ id: string; status: string }>>(
      `/work-orders/${id}/resolve`, { resolution }),

  /** 关闭工单 */
  close: (id: string) =>
    http.post<ApiResponse<{ id: string; status: string }>>(`/work-orders/${id}/close`),

  /** 转报上级 */
  escalate: (id: string, escalatedTo: string, note: string) =>
    http.post<ApiResponse<{ id: string }>>(
      `/work-orders/${id}/escalate`, { escalatedTo, note }),

  // ============ 留言 ============

  /** 获取留言列表 */
  getMessages: (orderId: string, params?: { page?: number; pageSize?: number }) =>
    http.get<ApiResponse<PageData<MessageVO>>>(`/work-orders/${orderId}/messages`, { params }),

  /** 发送留言 */
  sendMessage: (orderId: string, data: SendMessageRequest) =>
    http.post<ApiResponse<MessageVO>>(`/work-orders/${orderId}/messages`, data),

  // ============ 附件 ============

  /** 上传附件 */
  uploadAttachment: (orderId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<ApiResponse<AttachmentVO>>(
      `/work-orders/${orderId}/attachments`, form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
    );
  },

  /** 删除附件 */
  deleteAttachment: (orderId: string, attId: string) =>
    http.delete<ApiResponse<void>>(`/work-orders/${orderId}/attachments/${attId}`),
};
```

### 10.3 前端类型定义

```typescript
// frontend/src/types/workOrder.ts

/** 工单状态 */
export type WorkOrderStatus = 'DRAFT' | 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';

/** 问题类型 */
export type WorkOrderType = 'INTERVIEW_FAULT' | 'FEATURE_SUGGESTION' | 'BUG_REPORT';

/** 优先级 */
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/** 创建工单请求 */
export interface CreateWorkOrderRequest {
  title: string;
  type: WorkOrderType;
  description: string;
  priority?: WorkOrderPriority;
  attachmentIds?: string[];
}

/** 发送留言请求 */
export interface SendMessageRequest {
  content: string;
  messageType?: 'TEXT';
}

/** 工单列表项 */
export interface WorkOrderListVO {
  id: string;
  title: string;
  type: WorkOrderType;
  typeLabel: string;
  status: WorkOrderStatus;
  statusLabel: string;
  priority: WorkOrderPriority;
  submitterName: string;
  assigneeName: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 工单详情 */
export interface WorkOrderDetailVO {
  id: string;
  title: string;
  type: WorkOrderType;
  typeLabel: string;
  description: string;
  status: WorkOrderStatus;
  statusLabel: string;
  priority: WorkOrderPriority;
  submitter: { id: string; username: string; avatar: string | null };
  assignee: { id: string; username: string; avatar: string | null } | null;
  escalatedTo: { id: string; username: string } | null;
  escalationNote: string | null;
  resolution: string | null;
  attachments: AttachmentVO[];
  createdAt: string;
  updatedAt: string;
}

/** 留言 */
export interface MessageVO {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'candidate' | 'admin' | 'hr';
  content: string;
  messageType: 'TEXT' | 'SYSTEM' | 'ESCALATION';
  createdAt: string;
}

/** 附件 */
export interface AttachmentVO {
  id: string;
  fileName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'FILE';
  fileSize: number;
  fileUrl: string;
  thumbnailUrl: string | null;
  uploaderId: string;
  createdAt: string;
}

/** 状态标签映射 */
export const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string }> = {
  DRAFT:      { label: '草稿',   color: 'bg-slate-100 text-slate-600' },
  PENDING:    { label: '待处理', color: 'bg-orange-100 text-orange-700' },
  PROCESSING: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  RESOLVED:   { label: '已解决', color: 'bg-green-100 text-green-700' },
  CLOSED:     { label: '已关闭', color: 'bg-slate-200 text-slate-500' },
};

/** 类型标签映射 */
export const TYPE_CONFIG: Record<WorkOrderType, { label: string; color: string }> = {
  INTERVIEW_FAULT:    { label: '面试故障', color: 'bg-red-100 text-red-700' },
  FEATURE_SUGGESTION: { label: '功能建议', color: 'bg-purple-100 text-purple-700' },
  BUG_REPORT:         { label: 'BUG上报',  color: 'bg-amber-100 text-amber-700' },
};
```

### 10.4 Zustand Store

```typescript
// frontend/src/stores/workOrderStore.ts

import { create } from 'zustand';
import type { WorkOrderListVO, WorkOrderDetailVO, MessageVO } from '@/types/workOrder';

interface WorkOrderState {
  // 列表
  orders: WorkOrderListVO[];
  total: number;
  page: number;
  loading: boolean;

  // 详情
  currentOrder: WorkOrderDetailVO | null;
  messages: MessageVO[];
  messagesLoading: boolean;

  // 筛选
  filterStatus: string;
  filterType: string;
  filterKeyword: string;

  // Actions
  setOrders: (orders: WorkOrderListVO[], total: number, page: number) => void;
  setLoading: (v: boolean) => void;
  setCurrentOrder: (order: WorkOrderDetailVO | null) => void;
  setMessages: (messages: MessageVO[]) => void;
  addMessage: (msg: MessageVO) => void;
  setMessagesLoading: (v: boolean) => void;
  setFilter: (status: string, type: string, keyword: string) => void;
  updateOrderStatus: (orderId: string, status: string, updates?: Record<string, unknown>) => void;
}

export const useWorkOrderStore = create<WorkOrderState>((set) => ({
  orders: [],
  total: 0,
  page: 1,
  loading: false,
  currentOrder: null,
  messages: [],
  messagesLoading: false,
  filterStatus: '',
  filterType: '',
  filterKeyword: '',

  setOrders: (orders, total, page) => set({ orders, total, page }),
  setLoading: (loading) => set({ loading }),
  setCurrentOrder: (currentOrder) => set({ currentOrder }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessagesLoading: (messagesLoading) => set({ messagesLoading }),
  setFilter: (filterStatus, filterType, filterKeyword) =>
    set({ filterStatus, filterType, filterKeyword }),
  updateOrderStatus: (orderId, status, updates) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, status: status as never, ...updates } : o
      ),
      currentOrder: s.currentOrder?.id === orderId
        ? { ...s.currentOrder, status: status as never, ...updates }
        : s.currentOrder,
    })),
}));
```

---

## 11. 部署与配置清单

### 11.1 数据库迁移

在 `backend/sql/` 下新增 `V2__work_order.sql`（或用 Flyway 版本号命名），内容为本文第 2 节全部建表 SQL。

### 11.2 application.yml 新增配置

```yaml
# user-service/src/main/resources/application.yml 新增
oss:
  endpoint: ${OSS_ENDPOINT:oss-cn-hangzhou.aliyuncs.com}
  access-key-id: ${OSS_ACCESS_KEY_ID:}
  access-key-secret: ${OSS_ACCESS_KEY_SECRET:}
  bucket-name: ${OSS_BUCKET:smart-interview-work-orders}
  cdn-domain: ${OSS_CDN_DOMAIN:}
```

### 11.3 环境变量清单

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `OSS_ENDPOINT` | OSS 地域节点 | `oss-cn-hangzhou.aliyuncs.com` |
| `OSS_ACCESS_KEY_ID` | RAM 子账号 AccessKey | `LTAI5t...` |
| `OSS_ACCESS_KEY_SECRET` | RAM 子账号 Secret | `...` |
| `OSS_BUCKET` | Bucket 名称 | `smart-interview-work-orders` |
| `OSS_CDN_DOMAIN` | CDN 加速域名（可选） | `cdn.example.com` |

### 11.4 检查清单

- [ ] 数据库执行 `V2__work_order.sql`
- [ ] common 模块新增 3 个 Entity 类 + 3 个 Mapper
- [ ] common 模块新增 2 个枚举（WorkOrderStatus / WorkOrderType）
- [ ] user-service 新增 WorkOrderController
- [ ] user-service 新增 WorkOrderService / WorkOrderMessageService / OssService
- [ ] user-service 新增 NotificationService（或整合现有通知体系）
- [ ] user-service application.yml 配置 OSS 参数
- [ ] 前端新增 3 个页面（List / Create / Detail）+ 路由配置
- [ ] 前端 Layout.tsx 新增工单导航入口按钮
- [ ] 前端 types/workOrder.ts 类型定义
- [ ] 前端 services/workOrderService.ts API 封装
- [ ] 前端 stores/workOrderStore.ts 状态管理
- [ ] 集成测试：完整状态流转链路 + 权限隔离验证
- [ ] 安全审查：OSS Bucket 权限 / SQL 注入 / XSS 防护

---

> **文档版本**：v1.0  
> **最后更新**：2026-08-03  
> **作者**：产品与技术团队  
> **下一步**：前端页面编码实现 → 联调测试 → 上线观察
