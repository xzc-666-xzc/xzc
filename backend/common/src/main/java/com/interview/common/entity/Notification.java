package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_notification")
public class Notification {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 接收人ID */
    private Long userId;

    /** 通知标题 */
    private String title;

    /** 通知内容 */
    private String content;

    /** 通知类型: WORK_ORDER_STATUS / INTERVIEW_REMIND / SYSTEM_UPDATE */
    private String type;

    /** 关联业务ID */
    private Long refId;

    /** 跳转链接 */
    private String refUrl;

    /** 0-未读 1-已读 */
    private Integer isRead;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
