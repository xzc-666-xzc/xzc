-- V7: 面试表新增 end_reason 字段，记录结束原因
ALTER TABLE t_interview
    ADD COLUMN end_reason VARCHAR(30) DEFAULT NULL COMMENT 'NORMAL/TIMEOUT/ADMIN' AFTER completed_at;
