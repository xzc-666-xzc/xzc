package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_evaluation")
public class Evaluation {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 回答ID */
    private Long answerId;

    /** 内容准确性得分（0-100） */
    private Integer contentScore;

    /** 逻辑条理性得分 */
    private Integer logicScore;

    /** 专业深度得分 */
    private Integer depthScore;

    /** STAR法则运用得分 */
    private Integer starScore;

    /** 表达沟通得分 */
    private Integer expressionScore;

    /** 综合得分 */
    private Integer overallScore;

    /** 优点（JSON数组） */
    private String strengths;

    /** 不足（JSON数组） */
    private String weaknesses;

    /** 改进建议（JSON数组） */
    private String suggestions;

    /** 参考答案 */
    private String referenceAnswer;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
