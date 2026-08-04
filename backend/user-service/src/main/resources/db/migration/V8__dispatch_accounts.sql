-- V8: 创建分发专用管理员账号 (密码 BCrypt 加密: 12345678)
-- 默认密码均为 12345678，首次登录后可修改
INSERT IGNORE INTO t_user (id, username, real_name, password, email, role, status, interview_style, voice_speed, created_at, updated_at)
VALUES
(10001, 'GxzcA', '技术支持-GxzcA', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'GxzcA@interview.com', 'admin', 1, 'friendly', 'normal', NOW(), NOW()),
(10002, 'GxzcB', '产品运营-GxzcB', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'GxzcB@interview.com', 'admin', 1, 'friendly', 'normal', NOW(), NOW()),
(10003, 'GxzcC', '研发测试-GxzcC', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'GxzcC@interview.com', 'admin', 1, 'friendly', 'normal', NOW(), NOW());
