package com.interview.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.common.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {

    @Update("UPDATE t_notification SET is_read = 1 WHERE user_id = #{userId} AND is_read = 0")
    int markAllRead(Long userId);
}
