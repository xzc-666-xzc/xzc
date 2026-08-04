package com.interview.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.interview.common.entity.User;
import com.interview.common.entity.WorkOrder;
import com.interview.common.entity.WorkOrderAttachment;
import com.interview.common.entity.WorkOrderMessage;
import com.interview.common.enums.WorkOrderStatus;
import com.interview.common.enums.WorkOrderType;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import com.interview.user.mapper.UserMapper;
import com.interview.user.mapper.WorkOrderAttachmentMapper;
import com.interview.user.mapper.WorkOrderMapper;
import com.interview.user.mapper.WorkOrderMessageMapper;
import com.interview.user.vo.WorkOrderDetailVO;
import com.interview.user.vo.WorkOrderListVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderMapper workOrderMapper;
    private final WorkOrderMessageMapper messageMapper;
    private final WorkOrderAttachmentMapper attachmentMapper;
    private final UserMapper userMapper;
    private final WorkOrderStateMachine stateMachine;
    private final NotificationService notificationService;
    private final WorkOrderMessageService messageService;
    private final StringRedisTemplate redisTemplate;

    // ==================== 管理员列表 ====================

    /**
     * 获取所有管理员列表（用于转报/转派下拉）
     */
    public List<Map<String, Object>> getAdminList() {
        List<User> admins = userMapper.selectList(
                new LambdaQueryWrapper<User>()
                        .eq(User::getRole, "admin")
                        .eq(User::getStatus, 1)
        );
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : admins) {
            result.add(Map.of(
                    "id", u.getId().toString(),
                    "username", u.getUsername(),
                    "realName", u.getRealName() != null ? u.getRealName() : u.getUsername(),
                    "role", u.getRole()
            ));
        }
        return result;
    }

    private String getAdminName(Long adminId) {
        if (adminId == null) return "管理员";
        User u = userMapper.selectById(adminId);
        if (u == null) return "管理员";
        return u.getRealName() != null ? u.getRealName() : u.getUsername();
    }

    // ==================== 创建与查询 ====================

    @Transactional
    public WorkOrder createWorkOrder(Long userId, String title, String type,
                                      String description, String priority) {
        WorkOrder order = new WorkOrder();
        order.setTitle(title);
        order.setType(type);
        order.setDescription(description);
        order.setPriority(priority != null ? priority : "MEDIUM");
        order.setStatus(WorkOrderStatus.DRAFT.name());
        order.setSubmitterId(userId);
        workOrderMapper.insert(order);
        return order;
    }

    @Transactional
    public WorkOrder updateDraft(Long orderId, Long userId, String title,
                                  String type, String description, String priority) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        if (!order.getSubmitterId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能编辑自己的工单");
        }
        if (!WorkOrderStatus.DRAFT.name().equals(order.getStatus())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "只有草稿状态的工单可以编辑");
        }
        order.setTitle(title);
        order.setType(type);
        order.setDescription(description);
        if (priority != null) order.setPriority(priority);
        workOrderMapper.updateById(order);
        return order;
    }

    public Page<WorkOrderListVO> listWorkOrders(Long userId, String role,
                                                  int page, int pageSize,
                                                  String status, String type,
                                                  String keyword) {
        boolean isAdmin = "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);

        LambdaQueryWrapper<WorkOrder> wrapper = new LambdaQueryWrapper<>();
        if (!isAdmin) {
            wrapper.eq(WorkOrder::getSubmitterId, userId);
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(WorkOrder::getStatus, status);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(WorkOrder::getType, type);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(WorkOrder::getTitle, keyword);
        }
        wrapper.orderByDesc(WorkOrder::getUpdatedAt);

        IPage<WorkOrder> iPage = workOrderMapper.selectPage(new Page<>(page, pageSize), wrapper);

        // 批量查用户名
        Set<Long> userIds = new HashSet<>();
        for (WorkOrder wo : iPage.getRecords()) {
            userIds.add(wo.getSubmitterId());
            if (wo.getAssigneeId() != null) userIds.add(wo.getAssigneeId());
        }
        Map<Long, String> nameMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(userIds);
            for (User u : users) {
                nameMap.put(u.getId(), u.getUsername());
            }
        }

        List<WorkOrderListVO> records = new ArrayList<>();
        for (WorkOrder wo : iPage.getRecords()) {
            long msgCount = messageMapper.selectCount(
                new LambdaQueryWrapper<WorkOrderMessage>()
                    .eq(WorkOrderMessage::getOrderId, wo.getId())
            );
            records.add(WorkOrderListVO.from(wo,
                nameMap.getOrDefault(wo.getSubmitterId(), "未知"),
                nameMap.getOrDefault(wo.getAssigneeId(), null),
                (int) msgCount));
        }

        Page<WorkOrderListVO> result = new Page<>(page, pageSize);
        result.setRecords(records);
        result.setTotal(iPage.getTotal());
        return result;
    }

    public WorkOrderDetailVO getDetail(Long orderId, Long userId, String role) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }

        boolean isAdmin = "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);

        // 处理中的工单：非处理人/被转报人的管理员不能查看
        if (isAdmin && "PROCESSING".equals(order.getStatus())
            && order.getAssigneeId() != null
            && !userId.equals(order.getAssigneeId())
            && !userId.equals(order.getSubmitterId())
            && !userId.equals(order.getEscalatedTo())) {
            throw new BusinessException(ResultCode.FORBIDDEN,
                "该工单正在被 " + getAdminName(order.getAssigneeId()) + " 处理中，请等待处理完成");
        }

        if (!isAdmin && !order.getSubmitterId().equals(userId)
            && !userId.equals(order.getAssigneeId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权查看此工单");
        }

        WorkOrderDetailVO vo = WorkOrderDetailVO.from(order);

        // 填充用户信息
        Set<Long> userIds = new HashSet<>();
        userIds.add(order.getSubmitterId());
        if (order.getAssigneeId() != null) userIds.add(order.getAssigneeId());
        if (order.getEscalatedTo() != null) userIds.add(order.getEscalatedTo());
        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User u : userMapper.selectBatchIds(userIds)) {
                userMap.put(u.getId(), u);
            }
        }

        User submitter = userMap.get(order.getSubmitterId());
        if (submitter != null) {
            WorkOrderDetailVO.UserBrief ub = new WorkOrderDetailVO.UserBrief();
            ub.setId(submitter.getId().toString());
            ub.setUsername(submitter.getUsername());
            ub.setAvatar(submitter.getAvatar());
            vo.setSubmitter(ub);
        }

        if (order.getAssigneeId() != null) {
            User assignee = userMap.get(order.getAssigneeId());
            if (assignee != null) {
                WorkOrderDetailVO.UserBrief ub = new WorkOrderDetailVO.UserBrief();
                ub.setId(assignee.getId().toString());
                ub.setUsername(assignee.getUsername());
                ub.setAvatar(assignee.getAvatar());
                vo.setAssignee(ub);
            }
        }

        if (order.getEscalatedTo() != null) {
            User escalated = userMap.get(order.getEscalatedTo());
            if (escalated != null) {
                WorkOrderDetailVO.UserBrief ub = new WorkOrderDetailVO.UserBrief();
                ub.setId(escalated.getId().toString());
                ub.setUsername(escalated.getUsername());
                ub.setAvatar(escalated.getAvatar());
                vo.setEscalatedTo(ub);
            }
        }

        // 附件列表
        List<WorkOrderAttachment> attachments = attachmentMapper.selectList(
            new LambdaQueryWrapper<WorkOrderAttachment>()
                .eq(WorkOrderAttachment::getOrderId, orderId)
        );
        List<WorkOrderDetailVO.AttachmentVO> attVOs = new ArrayList<>();
        for (WorkOrderAttachment att : attachments) {
            WorkOrderDetailVO.AttachmentVO avo = new WorkOrderDetailVO.AttachmentVO();
            avo.setId(att.getId().toString());
            avo.setFileName(att.getFileName());
            avo.setFileType(att.getFileType());
            avo.setFileSize(att.getFileSize());
            avo.setFileUrl(att.getFileUrl());
            avo.setThumbnailUrl(att.getThumbnailUrl());
            avo.setUploaderId(att.getUploaderId());
            avo.setCreatedAt(att.getCreatedAt());
            attVOs.add(avo);
        }
        vo.setAttachments(attVOs);

        return vo;
    }

    // ==================== 智能分发 ====================

    /** 问题类型 → 专属管理员映射 */
    private static final Map<String, Long> TYPE_ADMIN_MAP = Map.of(
        "INTERVIEW_FAULT", 10001L,    // 面试故障 → GxzcA
        "FEATURE_SUGGESTION", 10002L, // 功能建议 → GxzcB
        "BUG_REPORT", 10003L          // BUG上报 → GxzcC
    );

    private static final String ONLINE_KEY_PREFIX = "admin:online:";

    private void tryDispatchByType(WorkOrder order) {
        Long targetAdminId = TYPE_ADMIN_MAP.get(order.getType());
        if (targetAdminId == null) return;

        // 检查目标管理员是否在线
        Boolean online = redisTemplate.hasKey(ONLINE_KEY_PREFIX + targetAdminId);
        if (Boolean.TRUE.equals(online)) {
            // 在线 → 自动接单
            order.setAssigneeId(targetAdminId);
            order.setStatus(WorkOrderStatus.PROCESSING.name());
            workOrderMapper.updateById(order);

            messageService.addSystemMessage(order.getId(),
                "已自动分配给 " + getAdminName(targetAdminId) + "（" + getTypeLabel(order.getType()) + "专属处理）");

            notificationService.notifyUser(targetAdminId,
                "新工单已分配",
                String.format("「%s」类型工单「%s」已自动分配给您处理",
                    getTypeLabel(order.getType()), order.getTitle()),
                "/work-orders/" + order.getId());
        } else {
            // 离线 → 保持PENDING，通知管理员上线
            messageService.addSystemMessage(order.getId(),
                getAdminName(targetAdminId) + " 当前离线，" + getTypeLabel(order.getType()) + "工单等待处理中");

            notificationService.notifyUser(targetAdminId,
                "新工单待处理（离线通知）",
                String.format("您有一条「%s」类型工单「%s」待处理，请尽快上线",
                    getTypeLabel(order.getType()), order.getTitle()),
                "/work-orders/" + order.getId());
        }
    }

    private String getTypeLabel(String type) {
        return switch (type) {
            case "INTERVIEW_FAULT" -> "面试故障";
            case "FEATURE_SUGGESTION" -> "功能建议";
            case "BUG_REPORT" -> "BUG上报";
            default -> type;
        };
    }

    // ==================== 状态流转 ====================

    @Transactional
    public WorkOrder submitWorkOrder(Long orderId, Long userId) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        stateMachine.transition(order, WorkOrderStatus.PENDING, userId, "candidate");
        workOrderMapper.updateById(order);

        // 智能分发：根据问题类型自动分配
        tryDispatchByType(order);

        // 通知管理员
        notificationService.notifyAdmins(
            "新工单待处理",
            String.format("用户提交了工单「%s」，请及时处理", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        // 自动留言记录
        messageService.addSystemMessage(orderId, "用户提交了工单，状态变更为【待处理】");

        return order;
    }

    @Transactional
    public WorkOrder acceptWorkOrder(Long orderId, Long adminId, String role) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        stateMachine.transition(order, WorkOrderStatus.PROCESSING, adminId, role);
        workOrderMapper.updateById(order);

        notificationService.notifyUser(
            order.getSubmitterId(),
            "工单处理中",
            String.format("您的工单「%s」已被管理员接单，正在处理中", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        messageService.addSystemMessage(orderId, "管理员已接单，状态变更为【处理中】");

        return order;
    }

    @Transactional
    public WorkOrder resolveWorkOrder(Long orderId, Long operatorId,
                                       String role, String resolution) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        stateMachine.transition(order, WorkOrderStatus.RESOLVED, operatorId, role);
        order.setResolution(resolution);
        workOrderMapper.updateById(order);

        notificationService.notifyUser(
            order.getSubmitterId(),
            "工单已解决",
            String.format("您的工单「%s」已被标记为已解决", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        messageService.addSystemMessage(orderId,
            String.format("管理员已将工单标记为【已解决】，说明：%s", resolution));

        return order;
    }

    @Transactional
    public WorkOrder closeWorkOrder(Long orderId, Long operatorId, String role) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        stateMachine.transition(order, WorkOrderStatus.CLOSED, operatorId, role);
        workOrderMapper.updateById(order);

        if (!operatorId.equals(order.getSubmitterId())) {
            notificationService.notifyUser(
                order.getSubmitterId(),
                "工单已关闭",
                String.format("您的工单「%s」已被管理员关闭", order.getTitle()),
                "/work-orders/" + order.getId()
            );
        }

        messageService.addSystemMessage(orderId, "工单已关闭");

        return order;
    }

    @Transactional
    public WorkOrder escalateWorkOrder(Long orderId, Long operatorId,
                                        String role, Long escalatedTo, String note) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }

        boolean isAdmin = "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);
        if (!isAdmin) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有管理员可以转报工单");
        }

        order.setEscalatedTo(escalatedTo);
        order.setEscalationNote(note);
        // 转报同时将处理人变更为目标管理员
        order.setAssigneeId(escalatedTo);
        // 如果工单还在PENDING状态，自动转为PROCESSING
        if ("PENDING".equals(order.getStatus())) {
            order.setStatus("PROCESSING");
        }
        workOrderMapper.updateById(order);

        notificationService.notifyUser(
            escalatedTo,
            "工单转报",
            String.format("管理员转报了一条工单「%s」给您处理，备注：%s", order.getTitle(), note),
            "/work-orders/" + order.getId()
        );

        messageService.addSystemMessage(orderId,
            String.format("管理员已将工单转报给上级（ID:%d），备注：%s", escalatedTo, note));

        return order;
    }

    @Transactional
    public WorkOrder reassignWorkOrder(Long orderId, Long operatorId,
                                        String role, Long newAssigneeId) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }

        boolean isAdmin = "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);
        if (!isAdmin) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有管理员可以转派工单");
        }

        if (!WorkOrderStatus.PROCESSING.name().equals(order.getStatus())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "只有处理中的工单可以转派");
        }

        // 验证新处理人存在且为管理员
        User newAssignee = userMapper.selectById(newAssigneeId);
        if (newAssignee == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "目标管理员不存在");
        }
        if (!"admin".equals(newAssignee.getRole()) && !"hr".equals(newAssignee.getRole())
            && !"teacher".equals(newAssignee.getRole())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "只能转派给管理员");
        }

        Long oldAssigneeId = order.getAssigneeId();
        order.setAssigneeId(newAssigneeId);
        workOrderMapper.updateById(order);

        // 通知新处理人
        notificationService.notifyUser(
            newAssigneeId,
            "工单转派",
            String.format("管理员将工单「%s」转派给您处理", order.getTitle()),
            "/work-orders/" + order.getId()
        );

        messageService.addSystemMessage(orderId,
            String.format("工单已转派给 %s（ID:%d）", newAssignee.getUsername(), newAssigneeId));

        return order;
    }

    // ==================== 撤销功能 ====================

    /** 用户撤销工单（仅 DRAFT/PENDING 状态） */
    @Transactional
    public WorkOrder revokeByUser(Long orderId, Long userId) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        if (!order.getSubmitterId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能撤销自己的工单");
        }
        String status = order.getStatus();
        if (!"DRAFT".equals(status) && !"PENDING".equals(status)) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "该工单已进入处理流程，无法撤销，请联系管理员");
        }
        order.setStatus(WorkOrderStatus.CLOSED.name());
        order.setResolution("用户主动撤销");
        order.setClosedAt(java.time.LocalDateTime.now());
        workOrderMapper.updateById(order);

        messageService.addSystemMessage(orderId, "用户主动撤销了工单");
        return order;
    }

    /** 管理员退回工单到待处理池（PROCESSING → PENDING，清除处理人） */
    @Transactional
    public WorkOrder returnToPool(Long orderId, Long adminId, String role) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        boolean isAdmin = "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);
        if (!isAdmin) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有管理员可以退回工单");
        }
        if (!"PROCESSING".equals(order.getStatus())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "只有处理中的工单可以退回");
        }
        Long oldAssignee = order.getAssigneeId();
        order.setStatus(WorkOrderStatus.PENDING.name());
        order.setAssigneeId(null);
        workOrderMapper.updateById(order);

        messageService.addSystemMessage(orderId, String.format(
            "管理员 %s 将工单退回待处理池，原处理人：%s，将重新分配",
            getAdminName(adminId), getAdminName(oldAssignee)));
        return order;
    }

    /** 管理员强制关闭工单（任意状态，附带原因） */
    @Transactional
    public WorkOrder forceClose(Long orderId, Long adminId, String role, String reason) {
        WorkOrder order = workOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "工单不存在");
        }
        boolean isAdmin = "admin".equals(role) || "hr".equals(role) || "teacher".equals(role);
        if (!isAdmin) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有管理员可以强制关闭工单");
        }
        order.setStatus(WorkOrderStatus.CLOSED.name());
        order.setResolution(reason != null && !reason.isBlank() ? reason : "管理员强制关闭");
        order.setClosedAt(java.time.LocalDateTime.now());
        workOrderMapper.updateById(order);

        if (!adminId.equals(order.getSubmitterId())) {
            notificationService.notifyUser(order.getSubmitterId(),
                "工单已关闭",
                String.format("您的工单「%s」已被管理员关闭，原因：%s",
                    order.getTitle(), reason != null ? reason : "无"),
                "/work-orders/" + order.getId());
        }

        messageService.addSystemMessage(orderId,
            String.format("管理员强制关闭了工单，原因：%s", reason != null ? reason : "无"));
        return order;
    }
}
