package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_work_order_attachment")
public class WorkOrderAttachment {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 关联工单ID */
    private Long orderId;

    /** 关联留言ID */
    private Long messageId;

    /** 原始文件名 */
    private String fileName;

    /** 文件类型: IMAGE / VIDEO / FILE */
    private String fileType;

    /** 文件大小(字节) */
    private Long fileSize;

    /** OSS访问URL */
    private String fileUrl;

    /** OSS存储Key */
    private String fileKey;

    /** MIME类型 */
    private String mimeType;

    /** 缩略图URL */
    private String thumbnailUrl;

    /** 上传人ID */
    private Long uploaderId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
