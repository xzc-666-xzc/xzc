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
     */
    public Long getUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        return jwtUtil.getUserId(authHeader.substring(7));
    }
}
