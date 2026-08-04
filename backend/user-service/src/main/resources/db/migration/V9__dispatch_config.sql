-- V9: 工单分发配置表
CREATE TABLE IF NOT EXISTS t_dispatch_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    work_order_type VARCHAR(50) NOT NULL COMMENT '工单类型: INTERVIEW_FAULT/FEATURE_SUGGESTION/BUG_REPORT',
    assignee_id BIGINT NOT NULL COMMENT '负责管理员ID',
    assignee_name VARCHAR(100) COMMENT '管理员姓名(冗余)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_type (work_order_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单类型分发配置';

-- 初始数据
INSERT IGNORE INTO t_dispatch_config (work_order_type, assignee_id, assignee_name) VALUES
('INTERVIEW_FAULT', 10001, '技术支持-GxzcA'),
('FEATURE_SUGGESTION', 10002, '产品运营-GxzcB'),
('BUG_REPORT', 10003, '研发测试-GxzcC');
