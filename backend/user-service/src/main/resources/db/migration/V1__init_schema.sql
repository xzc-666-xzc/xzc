-- ============================================================
-- V1: 数据库初始化建表
-- 对应原 init.sql 中的建表部分
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS t_user (
    id          BIGINT        PRIMARY KEY COMMENT '用户ID',
    username    VARCHAR(64)   NOT NULL UNIQUE COMMENT '用户名',
    password    VARCHAR(256)  NOT NULL COMMENT '密码(BCrypt加密)',
    email       VARCHAR(128)  NOT NULL COMMENT '邮箱',
    phone       VARCHAR(20)   DEFAULT NULL COMMENT '手机号',
    avatar      VARCHAR(512)  DEFAULT NULL COMMENT '头像URL',
    role        VARCHAR(32)   NOT NULL DEFAULT 'candidate' COMMENT '角色: candidate/hr/teacher/admin',
    status      TINYINT       NOT NULL DEFAULT 1 COMMENT '0-禁用 1-正常',
    interview_style VARCHAR(32) DEFAULT 'friendly' COMMENT 'AI面试风格',
    voice_speed     VARCHAR(16) DEFAULT 'normal' COMMENT '语音播放速度',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 面试记录表
CREATE TABLE IF NOT EXISTS t_interview (
    id                  BIGINT      PRIMARY KEY COMMENT '面试ID',
    user_id             BIGINT      NOT NULL COMMENT '用户ID',
    position_id         VARCHAR(64) NOT NULL COMMENT '岗位ID',
    position_name       VARCHAR(128) NOT NULL COMMENT '岗位名称',
    difficulty          VARCHAR(32) NOT NULL COMMENT '难度: junior/middle/senior/expert',
    mode                VARCHAR(16) NOT NULL COMMENT '模式: text/voice/video',
    type                VARCHAR(32) NOT NULL COMMENT '类型: technical/hr/stress/group/boss',
    question_count      INT         NOT NULL DEFAULT 8 COMMENT '题目数量',
    status              VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'pending/in_progress/completed/interrupted/cancelled',
    current_question_index INT      NOT NULL DEFAULT 0 COMMENT '当前题目索引',
    score               INT         DEFAULT NULL COMMENT '总得分',
    summary             TEXT        DEFAULT NULL COMMENT '面试总结',
    started_at          DATETIME    DEFAULT NULL COMMENT '开始时间',
    completed_at        DATETIME    DEFAULT NULL COMMENT '结束时间',
    created_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试记录表';

-- 题目表
CREATE TABLE IF NOT EXISTS t_question (
    id                  BIGINT      PRIMARY KEY COMMENT '题目ID',
    interview_id        BIGINT      NOT NULL COMMENT '面试ID',
    `index`             INT         NOT NULL COMMENT '题号(从0开始)',
    content             TEXT        NOT NULL COMMENT '题目内容',
    type                VARCHAR(16) NOT NULL DEFAULT 'main' COMMENT '类型: main/follow_up',
    parent_question_id  BIGINT      DEFAULT NULL COMMENT '父题ID(追问时关联)',
    expected_points     TEXT        DEFAULT NULL COMMENT '期望得分点(JSON)',
    knowledge_tags      VARCHAR(512) DEFAULT NULL COMMENT '知识标签(JSON)',
    created_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_interview_id (interview_id),
    FOREIGN KEY (interview_id) REFERENCES t_interview(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目表';

-- 回答表
CREATE TABLE IF NOT EXISTS t_answer (
    id              BIGINT      PRIMARY KEY COMMENT '回答ID',
    question_id     BIGINT      NOT NULL COMMENT '问题ID',
    content         TEXT        NOT NULL COMMENT '回答内容',
    audio_url       VARCHAR(512) DEFAULT NULL COMMENT '语音文件URL',
    duration        INT         NOT NULL DEFAULT 0 COMMENT '回答耗时(秒)',
    asr_confidence  DOUBLE      DEFAULT NULL COMMENT 'ASR置信度(0-1)',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_question_id (question_id),
    FOREIGN KEY (question_id) REFERENCES t_question(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回答表';

-- 评测结果表
CREATE TABLE IF NOT EXISTS t_evaluation (
    id               BIGINT      PRIMARY KEY COMMENT '评测ID',
    answer_id        BIGINT      NOT NULL COMMENT '回答ID',
    content_score    INT         NOT NULL DEFAULT 0 COMMENT '内容准确性得分',
    logic_score      INT         NOT NULL DEFAULT 0 COMMENT '逻辑条理性得分',
    depth_score      INT         NOT NULL DEFAULT 0 COMMENT '专业深度得分',
    star_score       INT         NOT NULL DEFAULT 0 COMMENT 'STAR法则得分',
    expression_score INT         NOT NULL DEFAULT 0 COMMENT '表达沟通得分',
    overall_score    INT         NOT NULL DEFAULT 0 COMMENT '综合得分',
    strengths        TEXT        DEFAULT NULL COMMENT '优点(JSON数组)',
    weaknesses       TEXT        DEFAULT NULL COMMENT '不足(JSON数组)',
    suggestions      TEXT        DEFAULT NULL COMMENT '改进建议(JSON数组)',
    reference_answer TEXT        DEFAULT NULL COMMENT '参考答案',
    created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE INDEX idx_answer_id (answer_id),
    FOREIGN KEY (answer_id) REFERENCES t_answer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评测结果表';

-- 错题本表
CREATE TABLE IF NOT EXISTS t_wrong_question (
    id              BIGINT      PRIMARY KEY COMMENT '错题ID',
    user_id         BIGINT      NOT NULL COMMENT '用户ID',
    interview_id    BIGINT      NOT NULL COMMENT '面试ID',
    question_id     BIGINT      NOT NULL COMMENT '问题ID',
    reviewed        TINYINT     NOT NULL DEFAULT 0 COMMENT '0-待复习 1-已复习',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_question_id (question_id),
    FOREIGN KEY (question_id) REFERENCES t_question(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题本表';

-- 岗位信息表
CREATE TABLE IF NOT EXISTS t_position (
    id          VARCHAR(64)   PRIMARY KEY COMMENT '岗位ID',
    name        VARCHAR(128)  NOT NULL COMMENT '岗位名称',
    category    VARCHAR(64)   NOT NULL COMMENT '岗位类别',
    description TEXT          NOT NULL COMMENT '岗位描述',
    tags        VARCHAR(512)  DEFAULT NULL COMMENT '标签(JSON数组)',
    is_hot      TINYINT       NOT NULL DEFAULT 0 COMMENT '0-普通 1-热门',
    status      TINYINT       NOT NULL DEFAULT 1 COMMENT '0-禁用 1-正常',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位信息表';
