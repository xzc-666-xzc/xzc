package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_interview")
public class Interview {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 用户ID */
    private Long userId;

    /** 岗位ID */
    private String positionId;

    /** 岗位名称 */
    private String positionName;

    /** 难度：junior/middle/senior/expert */
    private String difficulty;

    /** 面试模式：text/voice/video */
    private String mode;

    /** 面试类型：technical/hr/stress/group/boss */
    private String type;

    /** 题目数量 */
    private Integer questionCount;

    /** 状态：pending/in_progress/completed/interrupted/cancelled */
    private String status;

    /** 当前题目索引 */
    private Integer currentQuestionIndex;

    /** 面试邀请码(6位数字)，HR创建时生成，候选人通过此码加入 */
    private String code;

    /** 创建人ID(HR)，记录该面试模板由谁创建 */
    private Long createdBy;

    /** 总得分 */
    private Integer score;

    /** 面试总结 */
    private String summary;

    /** 开始时间 */
    private LocalDateTime startedAt;

    /** 结束时间 */
    private LocalDateTime completedAt;

    /** 结束原因：NORMAL/TIMEOUT/ADMIN */
    private String endReason;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
