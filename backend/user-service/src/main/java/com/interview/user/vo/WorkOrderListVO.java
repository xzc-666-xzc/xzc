package com.interview.user.vo;

import com.interview.common.entity.WorkOrder;
import com.interview.common.enums.WorkOrderStatus;
import com.interview.common.enums.WorkOrderType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WorkOrderListVO {

    private String id;
    private String title;
    private String type;
    private String typeLabel;
    private String status;
    private String statusLabel;
    private String priority;
    private String submitterName;
    private String assigneeName;
    private int messageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WorkOrderListVO from(WorkOrder order, String submitterName,
                                        String assigneeName, int messageCount) {
        WorkOrderListVO vo = new WorkOrderListVO();
        vo.setId(order.getId().toString());
        vo.setTitle(order.getTitle());
        vo.setType(order.getType());
        vo.setTypeLabel(getTypeLabel(order.getType()));
        vo.setStatus(order.getStatus());
        vo.setStatusLabel(getStatusLabel(order.getStatus()));
        vo.setPriority(order.getPriority());
        vo.setSubmitterName(submitterName);
        vo.setAssigneeName(assigneeName);
        vo.setMessageCount(messageCount);
        vo.setCreatedAt(order.getCreatedAt());
        vo.setUpdatedAt(order.getUpdatedAt());
        return vo;
    }

    private static String getTypeLabel(String type) {
        try {
            return WorkOrderType.valueOf(type).getLabel();
        } catch (Exception e) {
            return type;
        }
    }

    private static String getStatusLabel(String status) {
        try {
            return WorkOrderStatus.valueOf(status).getLabel();
        } catch (Exception e) {
            return status;
        }
    }
}
