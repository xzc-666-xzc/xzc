package com.interview.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_user")
public class User {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 登录账号 */
    private String username;

    /** 真实姓名（排行榜/页面展示用） */
    private String realName;

    /** 密码（加密存储） */
    private String password;

    /** 邮箱 */
    private String email;

    /** 手机号 */
    private String phone;

    /** 头像URL */
    private String avatar;

    /** 角色：candidate/hr/teacher/admin */
    private String role;

    /** 账号状态：0-禁用 1-正常 */
    private Integer status;

    /** AI面试风格偏好 */
    private String interviewStyle;

    /** 语音播放速度 */
    private String voiceSpeed;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
