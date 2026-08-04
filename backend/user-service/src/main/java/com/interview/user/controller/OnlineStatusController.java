package com.interview.user.controller;

import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class OnlineStatusController {

    private final StringRedisTemplate redisTemplate;
    private final AuthUtil authUtil;

    private static final String ONLINE_KEY_PREFIX = "admin:online:";
    private static final long HEARTBEAT_TTL_SECONDS = 120; // 2分钟无心跳视为离线

    /** 管理员心跳上报 */
    @PostMapping("/heartbeat")
    public R<Void> heartbeat(HttpServletRequest request) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        if (!"admin".equals(role) && !"hr".equals(role) && !"teacher".equals(role)) {
            return R.ok(null);
        }
        redisTemplate.opsForValue().set(ONLINE_KEY_PREFIX + userId, "1", Duration.ofSeconds(HEARTBEAT_TTL_SECONDS));
        return R.ok(null);
    }

    /** 获取管理员在线状态列表 */
    @GetMapping("/admin/online-status")
    public R<Map<String, Boolean>> getOnlineStatus(@RequestParam(required = false) String userIds) {
        Map<String, Boolean> result = new HashMap<>();
        if (userIds != null && !userIds.isEmpty()) {
            for (String uid : userIds.split(",")) {
                result.put(uid, Boolean.TRUE.equals(redisTemplate.hasKey(ONLINE_KEY_PREFIX + uid.trim())));
            }
        }
        return R.ok(result);
    }
}
