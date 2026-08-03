package com.interview.gateway.filter;

import com.interview.common.util.JwtUtil;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

@Component
public class AuthFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AuthFilter.class);
    private final JwtUtil jwtUtil;

    private static final Set<String> WHITE_LIST = Set.of(
            "/api/user/login",
            "/api/user/register",
            "/api/user/check-username"
    );

    private static final List<String> WHITE_PREFIXES = List.of(
            "/api/ai/asr-token",
            "/api/interviews/video/room/validate"
    );

    public AuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private boolean isWhitelisted(String path) {
        // Exact match
        if (WHITE_LIST.contains(path)) return true;
        // Prefix match for parameterized paths
        if (WHITE_PREFIXES.stream().anyMatch(path::startsWith)) return true;
        return false;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (isWhitelisted(path)) {
            return chain.filter(exchange);
        }

        if (!path.startsWith("/api/")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("请求缺少Token: {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            String body = buildErrorBody(40100, "未登录或Token已过期");
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = jwtUtil.parseToken(token);

            exchange = exchange.mutate()
                    .request(r -> r.header("X-User-Id", claims.getSubject())
                            .header("X-Username", claims.get("username", String.class))
                            .header("X-Role", claims.get("role", String.class)))
                    .build();

            log.debug("Token校验通过: userId={}, path={}", claims.getSubject(), path);
            return chain.filter(exchange);
        } catch (Exception e) {
            log.warn("Token校验失败: {} - {}", path, e.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            String body = buildErrorBody(40100, "Token无效或已过期");
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }
    }

    /**
     * 构建标准 JSON 错误响应体
     */
    private String buildErrorBody(int code, String message) {
        return "{\"code\":" + code + ",\"message\":\"" + message
                + "\",\"data\":null,\"timestamp\":" + System.currentTimeMillis() + "}";
    }

    @Override
    public int getOrder() {
        return -100;
    }
}