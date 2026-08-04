-- ============================================================
-- V5: 问题反馈工单模块
-- ============================================================

-- 工单主表
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

    INDEX idx_wo_submitter (submitter_id),
    INDEX idx_wo_assignee (assignee_id),
    INDEX idx_wo_status (status),
    INDEX idx_wo_type (type),
    INDEX idx_wo_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问题反馈工单表';

-- 工单留言表
CREATE TABLE IF NOT EXISTS t_work_order_message (
    id              BIGINT          PRIMARY KEY COMMENT '留言ID（雪花ID）',
    order_id        BIGINT          NOT NULL COMMENT '关联工单ID',
    sender_id       BIGINT          NOT NULL COMMENT '发送人ID',
    sender_name     VARCHAR(64)     NOT NULL COMMENT '发送人名称（冗余，方便展示）',
    sender_role     VARCHAR(32)     NOT NULL COMMENT '发送人角色: candidate/admin/hr',
    content         TEXT            NOT NULL COMMENT '消息内容',
    message_type    VARCHAR(16)     NOT NULL DEFAULT 'TEXT' COMMENT '消息类型: TEXT/SYSTEM/ESCALATION',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',

    INDEX idx_wom_order_id (order_id),
    INDEX idx_wom_sender (sender_id),
    FOREIGN KEY (order_id) REFERENCES t_work_order(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单留言/沟通记录表';

-- 工单附件表
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
    thumbnail_url   VARCHAR(1024)   DEFAULT NULL COMMENT '缩略图URL',
    uploader_id     BIGINT          NOT NULL COMMENT '上传人ID',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',

    INDEX idx_woa_order_id (order_id),
    INDEX idx_woa_message_id (message_id),
    FOREIGN KEY (order_id) REFERENCES t_work_order(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单附件表';

-- 站内通知表
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

    INDEX idx_notif_user_unread (user_id, is_read),
    INDEX idx_notif_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内通知表';
