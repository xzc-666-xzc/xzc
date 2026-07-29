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
