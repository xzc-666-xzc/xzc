package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_work_order_message")
public class WorkOrderMessage {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 关联工单ID */
    private Long orderId;

    /** 发送人ID */
    private Long senderId;

    /** 发送人名称 */
    private String senderName;

    /** 发送人角色 */
    private String senderRole;

    /** 消息内容 */
    private String content;

    /** 消息类型: TEXT / SYSTEM / ESCALATION */
    private String messageType;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
