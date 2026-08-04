package com.interview.common.enums;

import lombok.Getter;

import java.util.Set;

/**
 * 工单状态枚举 — 严格按照顺序流转
 *
 * <pre>
 *   DRAFT → PENDING → PROCESSING → RESOLVED
 *                                 → CLOSED
 * </pre>
 */
@Getter
public enum WorkOrderStatus {

    DRAFT("草稿", "用户尚未提交，可编辑"),
    PENDING("待处理", "用户已提交，等待管理员接单"),
    PROCESSING("处理中", "管理员已接单，正在处理"),
    RESOLVED("已解决", "问题已解决，等待用户确认"),
    CLOSED("已关闭", "用户确认或超时自动关闭");

    private final String label;
    private final String description;

    WorkOrderStatus(String label, String description) {
        this.label = label;
        this.description = description;
    }

    /**
     * 判断是否允许从当前状态转移到目标状态
     */
    public boolean canTransitionTo(WorkOrderStatus target) {
        return switch (this) {
            case DRAFT      -> target == PENDING;
            case PENDING    -> target == PROCESSING || target == CLOSED;
            case PROCESSING -> target == RESOLVED || target == CLOSED;
            case RESOLVED   -> target == CLOSED;
            case CLOSED     -> false;
        };
    }

    /**
     * 合法的下一状态集合
     */
    public Set<WorkOrderStatus> allowedNext() {
        return switch (this) {
            case DRAFT      -> Set.of(PENDING);
            case PENDING    -> Set.of(PROCESSING, CLOSED);
            case PROCESSING -> Set.of(RESOLVED, CLOSED);
            case RESOLVED   -> Set.of(CLOSED);
            case CLOSED     -> Set.of();
        };
    }
}
