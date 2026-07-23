package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_question")
public class Question {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 面试ID */
    private Long interviewId;

    /** 题号 */
    @TableField("`index`")
    private Integer index;

    /** 题目内容 */
    private String content;

    /** 类型：main/follow_up */
    private String type;

    /** 父题ID（追问时关联主问题） */
    private Long parentQuestionId;

    /** 期望得分点（JSON数组） */
    private String expectedPoints;

    /** 知识标签（JSON数组） */
    private String knowledgeTags;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
