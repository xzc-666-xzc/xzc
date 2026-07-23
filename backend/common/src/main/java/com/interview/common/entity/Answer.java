package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_answer")
public class Answer {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 问题ID */
    private Long questionId;

    /** 回答内容（文本/ASR转换结果） */
    private String content;

    /** 语音文件URL */
    private String audioUrl;

    /** 回答耗时（秒） */
    private Integer duration;

    /** ASR置信度 */
    private Double asrConfidence;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
