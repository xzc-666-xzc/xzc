package com.interview.user.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.interview.common.entity.Notification;
import com.interview.common.result.PageResult;
import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.user.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "站内通知", description = "站内消息通知接口")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthUtil authUtil;

    @Operation(summary = "获取未读通知数")
    @GetMapping("/unread-count")
    public R<Map<String, Object>> getUnreadCount(HttpServletRequest request) {
        Long userId = authUtil.getUserId(request);
        long count = notificationService.getUnreadCount(userId);
        return R.ok(Map.of("count", count));
    }

    @Operation(summary = "获取通知列表")
    @GetMapping
    public R<PageResult<Notification>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long userId = authUtil.getUserId(request);
        IPage<Notification> result = notificationService.getNotifications(userId, page, pageSize);
        return R.ok(PageResult.of(result.getRecords(), result.getTotal(), page, pageSize));
    }

    @Operation(summary = "标记单条已读")
    @PutMapping("/{id}/read")
    public R<Void> markRead(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        notificationService.markRead(id, userId);
        return R.ok();
    }

    @Operation(summary = "全部标记已读")
    @PutMapping("/read-all")
    public R<Void> markAllRead(HttpServletRequest request) {
        Long userId = authUtil.getUserId(request);
        notificationService.markAllRead(userId);
        return R.ok();
    }
}
