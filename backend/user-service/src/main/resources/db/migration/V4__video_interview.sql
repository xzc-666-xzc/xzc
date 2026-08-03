-- 视频面试扩展
-- 情绪分析记录表
CREATE TABLE IF NOT EXISTS t_emotion_record (
    id              BIGINT      PRIMARY KEY COMMENT '记录ID',
    interview_id    BIGINT      NOT NULL COMMENT '面试ID',
    room_id         VARCHAR(10) NOT NULL COMMENT '视频房间号',
    emotion         VARCHAR(32) NOT NULL COMMENT '情绪: neutral/happy/focused/nervous/confident/thinking',
    confidence      DOUBLE      NOT NULL DEFAULT 0.0 COMMENT '置信度 0-1',
    frame_index     INT         NOT NULL DEFAULT 0 COMMENT '帧序号',
    timestamp       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_interview_id (interview_id),
    INDEX idx_room_id (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频面试情绪分析记录表';
