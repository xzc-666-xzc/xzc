-- V6: 用户表新增 real_name 字段，区分登录账号与真实姓名
ALTER TABLE t_user
    ADD COLUMN real_name VARCHAR(64) DEFAULT NULL COMMENT '真实姓名（排行榜/页面展示用）' AFTER username;

-- 将现有用户的 real_name 回填为 username
UPDATE t_user SET real_name = username WHERE real_name IS NULL;
