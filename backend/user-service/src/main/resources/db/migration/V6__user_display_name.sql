-- V6: 用户表新增 display_name 字段，区分登录账号与显示名称
ALTER TABLE t_user
    ADD COLUMN display_name VARCHAR(64) DEFAULT NULL COMMENT '显示名称（排行榜/页面展示用）' AFTER username;

-- 将现有用户的 display_name 回填为 username
UPDATE t_user SET display_name = username WHERE display_name IS NULL;
