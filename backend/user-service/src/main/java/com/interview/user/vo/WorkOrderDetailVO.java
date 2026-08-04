package com.interview.user.vo;

import com.interview.common.entity.WorkOrder;
import com.interview.common.enums.WorkOrderStatus;
import com.interview.common.enums.WorkOrderType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class WorkOrderDetailVO {

    private String id;
    private String title;
    private String type;
    private String typeLabel;
    private String description;
    private String status;
    private String statusLabel;
    private String priority;
    private UserBrief submitter;
    private UserBrief assignee;
    private UserBrief escalatedTo;
    private String escalationNote;
    private String resolution;
    private List<AttachmentVO> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class UserBrief {
        private String id;
        private String username;
        private String avatar;
    }

    @Data
    public static class AttachmentVO {
        private String id;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private String fileUrl;
        private String thumbnailUrl;
        private Long uploaderId;
        private LocalDateTime createdAt;
    }

    public static WorkOrderDetailVO from(WorkOrder order) {
        WorkOrderDetailVO vo = new WorkOrderDetailVO();
        vo.setId(order.getId().toString());
        vo.setTitle(order.getTitle());
        vo.setType(order.getType());
        try { vo.setTypeLabel(WorkOrderType.valueOf(order.getType()).getLabel()); }
        catch (Exception e) { vo.setTypeLabel(order.getType()); }
        vo.setDescription(order.getDescription());
        vo.setStatus(order.getStatus());
        try { vo.setStatusLabel(WorkOrderStatus.valueOf(order.getStatus()).getLabel()); }
        catch (Exception e) { vo.setStatusLabel(order.getStatus()); }
        vo.setPriority(order.getPriority());
        vo.setEscalationNote(order.getEscalationNote());
        vo.setResolution(order.getResolution());
        vo.setCreatedAt(order.getCreatedAt());
        vo.setUpdatedAt(order.getUpdatedAt());
        return vo;
    }
}
