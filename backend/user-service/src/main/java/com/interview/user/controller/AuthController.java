package com.interview.user.controller;

import com.interview.common.entity.User;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.R;
import com.interview.common.result.ResultCode;
import com.interview.common.util.JwtUtil;
import com.interview.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "认证接口", description = "用户注册与登录")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Data
    public static class LoginRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;
        @NotBlank(message = "密码不能为空")
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;
        @NotBlank(message = "密码不能为空")
        private String password;
        @NotBlank @Email
        private String email;
        @NotBlank
        private String role;
    }

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public R<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        User user = userService.login(req.getUsername(), req.getPassword());

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> data = Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId().toString(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "avatar", user.getAvatar() != null ? user.getAvatar() : ""
                )
        );
        return R.ok(data);
    }

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public R<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
        if (userService.existsByUsername(req.getUsername())) {
            throw new BusinessException(ResultCode.CONFLICT, "用户名已存在");
        }

        User user = userService.register(req.getUsername(), req.getPassword(), req.getEmail(), req.getRole());

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> data = Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId().toString(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "avatar", ""
                )
        );
        return R.ok(data);
    }
}
