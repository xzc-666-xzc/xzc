package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_work_order")
public class WorkOrder {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 工单标题 */
    private String title;

    /** 问题类型: INTERVIEW_FAULT / FEATURE_SUGGESTION / BUG_REPORT */
    private String type;

    /** 详细描述 */
    private String description;

    /** 状态: DRAFT / PENDING / PROCESSING / RESOLVED / CLOSED */
    private String status;

    /** 优先级: LOW / MEDIUM / HIGH / URGENT */
    private String priority;

    /** 提交人ID */
    private Long submitterId;

    /** 当前处理人ID */
    private Long assigneeId;

    /** 转报上级ID */
    private Long escalatedTo;

    /** 转报备注 */
    private String escalationNote;

    /** 解决说明 */
    private String resolution;

    /** 解决时间 */
    private LocalDateTime resolvedAt;

    /** 关闭时间 */
    private LocalDateTime closedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
