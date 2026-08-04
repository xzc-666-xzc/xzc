package com.interview.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.interview.common.entity.Notification;
import com.interview.common.entity.User;
import com.interview.user.mapper.NotificationMapper;
import com.interview.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final UserMapper userMapper;

    /** 通知单个用户 */
    public void notifyUser(Long userId, String title, String content, String refUrl) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType("WORK_ORDER_STATUS");
        notification.setRefUrl(refUrl);
        notification.setIsRead(0);
        notificationMapper.insert(notification);
    }

    /** 通知所有管理员 */
    public void notifyAdmins(String title, String content, String refUrl) {
        List<User> admins = userMapper.selectList(
            new LambdaQueryWrapper<User>()
                .in(User::getRole, List.of("admin", "hr", "teacher"))
                .eq(User::getStatus, 1)
        );
        for (User admin : admins) {
            notifyUser(admin.getId(), title, content, refUrl);
        }
    }

    /** 获取未读通知数 */
    public long getUnreadCount(Long userId) {
        return notificationMapper.selectCount(
            new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0)
        );
    }

    /** 获取通知列表（分页） */
    public IPage<Notification> getNotifications(Long userId, int page, int pageSize) {
        return notificationMapper.selectPage(
            new Page<>(page, pageSize),
            new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .orderByDesc(Notification::getCreatedAt)
        );
    }

    /** 标记单条已读 */
    public void markRead(Long notificationId, Long userId) {
        Notification notification = notificationMapper.selectById(notificationId);
        if (notification == null || !notification.getUserId().equals(userId)) {
            return;
        }
        notification.setIsRead(1);
        notificationMapper.updateById(notification);
    }

    /** 全部已读 */
    public void markAllRead(Long userId) {
        notificationMapper.markAllRead(userId);
    }
}
