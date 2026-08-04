package com.interview.user.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.interview.common.entity.User;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import com.interview.user.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class UserService extends ServiceImpl<UserMapper, User> {

    /**
     * 用户登录校验
     */
    public User login(String username, String password) {
        User user = this.getOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        );
        if (user == null) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "该账号不存在");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "该账号已被禁用，请联系管理员");
        }
        if (!BCrypt.checkpw(password, user.getPassword())) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "密码错误，请重新输入");
        }
        return user;
    }

    /**
     * 注册新用户
     */
    @Transactional
    public User register(String username, String password, String email, String role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
        user.setEmail(email);
        user.setRole(role);
        user.setStatus(1);
        user.setInterviewStyle("friendly");
        user.setVoiceSpeed("normal");

        this.save(user);
        return user;
    }

    /**
     * 判断用户名是否已存在
     */
    public boolean existsByUsername(String username) {
        return this.count(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        ) > 0;
    }

    /**
     * 获取排行榜数据（真实求职者 + 固定虚拟人气用户）
     */
    public List<Map<String, Object>> getLeaderboard() {
        List<Map<String, Object>> list = this.baseMapper.getLeaderboard();

        // 追加固定虚拟用户，仅用于排行榜展示，不存入数据库
        list.addAll(getBotUsers());

        // 按面试次数降序、平均分降序排列
        list.sort((a, b) -> {
            long countA = ((Number) a.get("interview_count")).longValue();
            long countB = ((Number) b.get("interview_count")).longValue();
            if (countA != countB) return Long.compare(countB, countA);
            double scoreA = ((Number) a.get("avg_score")).doubleValue();
            double scoreB = ((Number) b.get("avg_score")).doubleValue();
            return Double.compare(scoreB, scoreA);
        });
        return list;
    }

    /**
     * 虚拟人气用户 —— 固定身份，成绩和次数随机分布但保持不变
     */
    private List<Map<String, Object>> getBotUsers() {
        return List.of(
            Map.of("username", "张明远",     "interview_count", 27L, "avg_score", 92.3),
            Map.of("username", "李思涵",     "interview_count", 24L, "avg_score", 89.7),
            Map.of("username", "王晨曦",     "interview_count", 21L, "avg_score", 86.1),
            Map.of("username", "赵一鸣",     "interview_count", 19L, "avg_score", 94.8),
            Map.of("username", "陈雨桐",     "interview_count", 18L, "avg_score", 78.5),
            Map.of("username", "林小满",     "interview_count", 16L, "avg_score", 91.2),
            Map.of("username", "周子轩",     "interview_count", 15L, "avg_score", 73.0),
            Map.of("username", "吴若曦",     "interview_count", 14L, "avg_score", 83.6),
            Map.of("username", "郑浩然",     "interview_count", 12L, "avg_score", 67.4),
            Map.of("username", "黄思远",     "interview_count", 11L, "avg_score", 76.9),
            Map.of("username", "刘雨晴",     "interview_count", 9L,  "avg_score", 88.5),
            Map.of("username", "许一诺",     "interview_count", 8L,  "avg_score", 61.2),
            Map.of("username", "沈逸凡",     "interview_count", 7L,  "avg_score", 71.8),
            Map.of("username", "孙乐怡",     "interview_count", 5L,  "avg_score", 82.3),
            Map.of("username", "杨子涵",     "interview_count", 3L,  "avg_score", 57.0),
            Map.of("username", "唐诗语",     "interview_count", 2L,  "avg_score", 65.5)
        );
    }

    /**
     * 更新用户资料
     */
    @Transactional
    public void updateProfile(Long userId, Map<String, Object> body) {
        User user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "用户不存在");
        }

        if (body.containsKey("username")) user.setUsername((String) body.get("username"));
        if (body.containsKey("email")) user.setEmail((String) body.get("email"));
        if (body.containsKey("phone")) user.setPhone((String) body.get("phone"));
        if (body.containsKey("avatar")) user.setAvatar((String) body.get("avatar"));
        if (body.containsKey("interviewStyle")) user.setInterviewStyle((String) body.get("interviewStyle"));
        if (body.containsKey("voiceSpeed")) user.setVoiceSpeed((String) body.get("voiceSpeed"));

        this.updateById(user);
    }
}
