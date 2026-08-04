package com.interview.user.service;

import com.interview.common.entity.WorkOrder;
import com.interview.common.enums.WorkOrderStatus;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 工单状态机 — 所有状态变更必须经过此类校验
 */
@Service
public class WorkOrderStateMachine {

    /**
     * 核心状态转移方法
     *
     * @param order        工单实体（已从DB加载）
     * @param target       目标状态
     * @param operatorId   操作人ID
     * @param operatorRole 操作人角色
     */
    public void transition(WorkOrder order,
                           WorkOrderStatus target,
                           Long operatorId,
                           String operatorRole) {

        WorkOrderStatus current = WorkOrderStatus.valueOf(order.getStatus());

        // 1. 校验状态转移合法性
        if (!current.canTransitionTo(target)) {
            throw new BusinessException(
                ResultCode.BAD_REQUEST,
                String.format("工单状态不能从 [%s] 直接变更为 [%s]，合法的下一状态为: %s",
                    current.getLabel(),
                    target.getLabel(),
                    current.allowedNext().stream()
                        .map(WorkOrderStatus::getLabel)
                        .toList()
                )
            );
        }

        // 2. 权限校验
        validatePermission(current, target, operatorId, operatorRole, order);

        // 3. 执行状态变更的附带操作
        applySideEffects(order, target, operatorId);

        // 4. 更新状态
        order.setStatus(target.name());
        order.setUpdatedAt(LocalDateTime.now());
    }

    private void validatePermission(WorkOrderStatus current,
                                     WorkOrderStatus target,
                                     Long operatorId,
                                     String operatorRole,
                                     WorkOrder order) {

        boolean isAdmin = "admin".equals(operatorRole)
                       || "hr".equals(operatorRole)
                       || "teacher".equals(operatorRole);
        boolean isSubmitter = operatorId.equals(order.getSubmitterId());
        boolean isAssignee = operatorId.equals(order.getAssigneeId());

        switch (target) {
            case PENDING -> {
                if (current == WorkOrderStatus.DRAFT && !isSubmitter) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "只有提交人本人可以提交工单");
                }
            }
            case PROCESSING -> {
                if (!isAdmin) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "只有管理员可以接单");
                }
            }
            case RESOLVED -> {
                if (!isAdmin && !isAssignee) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "只有处理人可以标记为已解决");
                }
            }
            case CLOSED -> {
                if (!isSubmitter && !isAdmin && !isAssignee) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "无权限关闭此工单");
                }
                if (current == WorkOrderStatus.PENDING && !isAdmin) {
                    throw new BusinessException(ResultCode.FORBIDDEN, "待处理状态下只有管理员可以关闭工单");
                }
            }
        }
    }

    private void applySideEffects(WorkOrder order,
                                   WorkOrderStatus target,
                                   Long operatorId) {
        switch (target) {
            case PROCESSING -> order.setAssigneeId(operatorId);
            case RESOLVED -> order.setResolvedAt(LocalDateTime.now());
            case CLOSED -> {
                order.setClosedAt(LocalDateTime.now());
                if (order.getResolvedAt() == null) {
                    order.setResolvedAt(LocalDateTime.now());
                }
            }
            default -> {}
        }
    }
}
