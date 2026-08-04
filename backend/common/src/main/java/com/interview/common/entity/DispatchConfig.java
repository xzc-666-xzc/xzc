package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_dispatch_config")
public class DispatchConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String workOrderType;

    private Long assigneeId;

    private String assigneeName;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
