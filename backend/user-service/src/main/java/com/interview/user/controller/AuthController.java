package com.interview.user.controller;

import com.interview.common.entity.User;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.R;
import com.interview.common.result.ResultCode;
import com.interview.common.util.AuthUtil;
import com.interview.common.util.JwtUtil;
import com.interview.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "认证接口", description = "用户注册与登录")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthUtil authUtil;

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
        @NotBlank(message = "显示名称不能为空")
        private String displayName;
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
                        "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
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
            throw new BusinessException(ResultCode.CONFLICT, "该账号已存在");
        }

        User user = userService.register(req.getUsername(), req.getDisplayName(),
                req.getPassword(), req.getEmail(), req.getRole());

        // HR/管理员需要审批，不直接返回 token
        if ("hr".equals(req.getRole()) || "admin".equals(req.getRole()) || "teacher".equals(req.getRole())) {
            return R.ok(Map.of(
                    "pending", true,
                    "message", "注册成功，请等待管理员审批"
            ));
        }

        // 求职者直接激活
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> data = Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId().toString(),
                        "username", user.getUsername(),
                        "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "avatar", ""
                ),
                "pending", false
        );
        return R.ok(data);
    }

    @Operation(summary = "检查账号是否已被注册")
    @GetMapping("/check-username")
    public R<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        boolean exists = userService.existsByUsername(username);
        return R.ok(Map.of("exists", exists));
    }

    // ==================== 管理员审批接口 ====================

    @Operation(summary = "获取待审批用户列表（管理员）")
    @GetMapping("/admin/pending-users")
    public R<List<Map<String, Object>>> getPendingUsers(HttpServletRequest request) {
        requireAdmin(request);
        List<Map<String, Object>> users = userService.getPendingUsers();
        return R.ok(users);
    }

    @Operation(summary = "审批通过用户（管理员）")
    @PostMapping("/admin/users/{id}/approve")
    public R<Void> approveUser(@PathVariable Long id, HttpServletRequest request) {
        requireAdmin(request);
        userService.approveUser(id);
        return R.ok(null);
    }

    @Operation(summary = "驳回用户注册（管理员）")
    @PostMapping("/admin/users/{id}/reject")
    public R<Void> rejectUser(@PathVariable Long id, HttpServletRequest request) {
        requireAdmin(request);
        userService.rejectUser(id);
        return R.ok(null);
    }

    private void requireAdmin(HttpServletRequest request) {
        if (!authUtil.isAdmin(request)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "仅管理员可执行此操作");
        }
    }
}
