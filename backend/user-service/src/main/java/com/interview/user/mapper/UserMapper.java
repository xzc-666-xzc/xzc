package com.interview.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.common.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 排行榜查询：统计每个求职者的已完成面试次数和平均分
     * 只统计 status='completed' 的面试，中途退出的不计入
     */
    @Select("SELECT COALESCE(u.real_name, u.username) AS username, " +
            "       COUNT(i.id) AS interview_count, " +
            "       COALESCE(ROUND(AVG(i.score), 1), 0) AS avg_score " +
            "FROM t_user u " +
            "LEFT JOIN t_interview i ON u.id = i.user_id AND i.status = 'completed' " +
            "WHERE u.role = 'candidate' AND u.status = 1 " +
            "GROUP BY u.id, u.username " +
            "ORDER BY interview_count DESC, avg_score DESC")
    List<Map<String, Object>> getLeaderboard();
}
