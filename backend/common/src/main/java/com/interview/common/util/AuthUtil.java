package com.interview.common.util;

import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class AuthUtil {

    private final JwtUtil jwtUtil;

    public AuthUtil(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    /**
     * 从请求头提取 Bearer Token 并解析用户ID
     * 优先读取网关注入的 X-User-Id 头，兜底解析 JWT
     */
    public Long getUserId(HttpServletRequest request) {
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            return Long.parseLong(userIdHeader);
        }
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        return jwtUtil.getUserId(authHeader.substring(7));
    }

    /**
     * 获取当前用户角色（优先读网关注入的 X-Role 头，兜底解析 JWT）
     */
    public String getRole(HttpServletRequest request) {
        String roleHeader = request.getHeader("X-Role");
        if (roleHeader != null && !roleHeader.isEmpty()) {
            return roleHeader;
        }
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        return jwtUtil.getRole(authHeader.substring(7));
    }

    /**
     * 获取当前用户名（优先读网关注入的 X-Username 头，兜底解析 JWT）
     */
    public String getUsername(HttpServletRequest request) {
        String usernameHeader = request.getHeader("X-Username");
        if (usernameHeader != null && !usernameHeader.isEmpty()) {
            return usernameHeader;
        }
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        return jwtUtil.getUsername(authHeader.substring(7));
    }

    /**
     * 判断当前用户是否为管理员角色
     */
    public boolean isAdmin(HttpServletRequest request) {
        String role = getRole(request);
        return "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);
    }
}
