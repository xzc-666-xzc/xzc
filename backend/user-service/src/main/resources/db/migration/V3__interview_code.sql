ALTER TABLE t_interview
    ADD COLUMN code VARCHAR(6) NULL COMMENT '面试邀请码(6位数字)',
    ADD UNIQUE INDEX idx_code (code);

ALTER TABLE t_interview
    ADD COLUMN created_by BIGINT NULL COMMENT '创建人ID(HR)',
    ADD INDEX idx_created_by (created_by);
