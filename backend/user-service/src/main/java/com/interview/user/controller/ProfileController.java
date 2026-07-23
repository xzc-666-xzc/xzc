package com.interview.user.controller;

import com.interview.common.entity.User;
import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "个人资料接口")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;
    private final AuthUtil authUtil;

    @Operation(summary = "获取个人资料")
    @GetMapping("/profile")
    public R<Map<String, Object>> getProfile(HttpServletRequest request) {
        Long userId = authUtil.getUserId(request);
        User user = userService.getById(userId);

        return R.ok(Map.of(
                "id", user.getId().toString(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                "role", user.getRole(),
                "createdAt", user.getCreatedAt().toString()
        ));
    }

    @Operation(summary = "更新个人资料")
    @PutMapping("/profile")
    public R<Void> updateProfile(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long userId = authUtil.getUserId(request);
        userService.updateProfile(userId, body);
        return R.ok();
    }
}
