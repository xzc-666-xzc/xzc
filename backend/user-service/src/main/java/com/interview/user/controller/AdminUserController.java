package com.interview.user.controller;

import com.interview.common.entity.User;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.R;
import com.interview.common.result.ResultCode;
import com.interview.common.util.AuthUtil;
import com.interview.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Tag(name = "管理员用户管理接口", description = "用户审批、冻结、删除等管理操作")
@RestController
@RequestMapping("/user/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final AuthUtil authUtil;

    /**
     * 校验当前用户是否为管理员（admin/hr/teacher）
     */
    private void checkAdmin(HttpServletRequest request) {
        if (!authUtil.isAdmin(request)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "仅管理员可访问");
        }
    }

    /**
     * 校验当前用户是否为超级管理员（Gxzc）
     */
    private void checkSuperAdmin(HttpServletRequest request) {
        if (!authUtil.isSuperAdmin(request)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "仅超级管理员可执行此操作");
        }
    }

    @Operation(summary = "获取所有用户列表")
    @GetMapping("/users")
    public R<List<Map<String, Object>>> listUsers(HttpServletRequest request) {
        checkAdmin(request);
        List<User> users = userService.getAllUsers();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId().toString());
            m.put("username", u.getUsername());
            m.put("realName", u.getRealName() != null ? u.getRealName() : "");
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("status", u.getStatus());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
            result.add(m);
        }
        return R.ok(result);
    }

    @Operation(summary = "获取待审批用户列表")
    @GetMapping("/pending")
    public R<List<Map<String, Object>>> listPending(HttpServletRequest request) {
        checkAdmin(request);
        List<User> users = userService.getPendingUsers();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId().toString());
            m.put("username", u.getUsername());
            m.put("realName", u.getRealName() != null ? u.getRealName() : "");
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
            result.add(m);
        }
        return R.ok(result);
    }

    @Operation(summary = "审批通过用户")
    @PostMapping("/users/{userId}/approve")
    public R<Map<String, String>> approveUser(
            HttpServletRequest request,
            @PathVariable Long userId) {
        checkAdmin(request);
        userService.approveUser(userId);
        return R.ok(Map.of("message", "用户已审批通过"));
    }

    @Operation(summary = "拒绝用户注册申请")
    @PostMapping("/users/{userId}/reject")
    public R<Map<String, String>> rejectUser(
            HttpServletRequest request,
            @PathVariable Long userId) {
        checkAdmin(request);
        userService.rejectUser(userId);
        return R.ok(Map.of("message", "用户注册申请已拒绝并删除"));
    }

    @Operation(summary = "冻结用户账号")
    @PutMapping("/users/{userId}/freeze")
    public R<Map<String, String>> freezeUser(
            HttpServletRequest request,
            @PathVariable Long userId) {
        checkSuperAdmin(request);
        User target = userService.getById(userId);
        if (target != null && "Gxzc".equals(target.getUsername())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "不能冻结超级管理员账号");
        }
        userService.freezeUser(userId);
        return R.ok(Map.of("message", "用户已冻结"));
    }

    @Operation(summary = "解冻用户账号")
    @PutMapping("/users/{userId}/unfreeze")
    public R<Map<String, String>> unfreezeUser(
            HttpServletRequest request,
            @PathVariable Long userId) {
        checkSuperAdmin(request);
        userService.unfreezeUser(userId);
        return R.ok(Map.of("message", "用户已解冻"));
    }

    @Operation(summary = "删除用户（仅超级管理员）")
    @DeleteMapping("/users/{userId}")
    public R<Map<String, String>> deleteUser(
            HttpServletRequest request,
            @PathVariable Long userId) {
        checkSuperAdmin(request);
        User target = userService.getById(userId);
        if (target != null && "Gxzc".equals(target.getUsername())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "不能删除超级管理员账号");
        }
        userService.deleteUser(userId);
        return R.ok(Map.of("message", "用户已删除"));
    }

    @Operation(summary = "修改用户角色（仅超级管理员）")
    @PutMapping("/users/{userId}/role")
    public R<Map<String, String>> changeRole(
            HttpServletRequest request,
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        checkSuperAdmin(request);
        String newRole = body.get("role");
        if (newRole == null || newRole.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "角色不能为空");
        }
        User target = userService.getById(userId);
        if (target != null && "Gxzc".equals(target.getUsername())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "不能修改超级管理员账号角色");
        }
        userService.changeUserRole(userId, newRole);
        return R.ok(Map.of("message", "角色已更新"));
    }
}
