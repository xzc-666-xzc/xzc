package com.interview.user.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.interview.common.entity.WorkOrder;
import com.interview.common.entity.WorkOrderAttachment;
import com.interview.common.result.PageResult;
import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.user.service.OssService;
import com.interview.user.service.WorkOrderMessageService;
import com.interview.user.service.WorkOrderService;
import com.interview.user.vo.MessageVO;
import com.interview.user.vo.WorkOrderDetailVO;
import com.interview.user.vo.WorkOrderListVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Tag(name = "工单反馈", description = "问题反馈工单的创建、流转与沟通")
@RestController
@RequestMapping("/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final WorkOrderMessageService messageService;
    private final OssService ossService;
    private final AuthUtil authUtil;

    // ==================== 请求体 DTO ====================

    @Data
    public static class CreateWorkOrderRequest {
        @NotBlank(message = "标题不能为空")
        @Size(min = 1, max = 100, message = "标题长度1-100字符")
        private String title;

        @NotBlank(message = "问题类型不能为空")
        private String type;

        @NotBlank(message = "描述不能为空")
        @Size(min = 10, max = 5000, message = "描述长度10-5000字符")
        private String description;

        private String priority = "MEDIUM";
    }

    @Data
    public static class SendMessageRequest {
        @NotBlank(message = "消息内容不能为空")
        @Size(min = 1, max = 2000)
        private String content;

        private String messageType = "TEXT";
    }

    @Data
    public static class EscalateRequest {
        @NotNull(message = "转报目标不能为空")
        private Long escalatedTo;

        @NotBlank(message = "转报备注不能为空")
        private String note;
    }

    @Data
    public static class ReassignRequest {
        @NotNull(message = "新处理人ID不能为空")
        private Long assigneeId;
    }

    @Data
    public static class ResolveRequest {
        @NotBlank(message = "解决说明不能为空")
        @Size(min = 5, max = 2000, message = "解决说明长度5-2000字符")
        private String resolution;
    }

    // ==================== CRUD 端点 ====================

    @Operation(summary = "创建工单（保存为草稿）")
    @PostMapping
    public R<Map<String, Object>> create(
            HttpServletRequest request,
            @Valid @RequestBody CreateWorkOrderRequest req) {
        Long userId = authUtil.getUserId(request);
        WorkOrder order = workOrderService.createWorkOrder(
            userId, req.getTitle(), req.getType(), req.getDescription(), req.getPriority());
        return R.created(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "createdAt", order.getCreatedAt().toString()
        ));
    }

    @Operation(summary = "查询工单列表")
    @GetMapping
    public R<PageResult<WorkOrderListVO>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        Page<WorkOrderListVO> result = workOrderService.listWorkOrders(
            userId, role, page, pageSize, status, type, keyword);
        return R.ok(PageResult.of(result.getRecords(), result.getTotal(), page, pageSize));
    }

    @Operation(summary = "查询工单详情")
    @GetMapping("/{id}")
    public R<WorkOrderDetailVO> detail(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        return R.ok(workOrderService.getDetail(id, userId, role));
    }

    @Operation(summary = "编辑草稿工单")
    @PutMapping("/{id}")
    public R<Void> update(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody CreateWorkOrderRequest req) {
        Long userId = authUtil.getUserId(request);
        workOrderService.updateDraft(id, userId, req.getTitle(), req.getType(),
            req.getDescription(), req.getPriority());
        return R.ok();
    }

    // ==================== 状态流转端点 ====================

    @Operation(summary = "提交工单（草稿 → 待处理）")
    @PostMapping("/{id}/submit")
    public R<Map<String, Object>> submit(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        WorkOrder order = workOrderService.submitWorkOrder(id, userId);
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "管理员接单（待处理 → 处理中）")
    @PostMapping("/{id}/accept")
    public R<Map<String, Object>> accept(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        WorkOrder order = workOrderService.acceptWorkOrder(id, userId, role);
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "assigneeId", order.getAssigneeId() != null ? order.getAssigneeId().toString() : null,
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "标记已解决（处理中 → 已解决）")
    @PostMapping("/{id}/resolve")
    public R<Map<String, Object>> resolve(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody ResolveRequest req) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        WorkOrder order = workOrderService.resolveWorkOrder(id, userId, role, req.getResolution());
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "关闭工单 → 已关闭")
    @PostMapping("/{id}/close")
    public R<Map<String, Object>> close(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        WorkOrder order = workOrderService.closeWorkOrder(id, userId, role);
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "status", order.getStatus(),
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    @Operation(summary = "转报上级")
    @PostMapping("/{id}/escalate")
    public R<Map<String, Object>> escalate(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody EscalateRequest req) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        WorkOrder order = workOrderService.escalateWorkOrder(
            id, userId, role, req.getEscalatedTo(), req.getNote());
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "escalatedTo", order.getEscalatedTo().toString()
        ));
    }

    @Operation(summary = "转派工单（管理员将处理中的工单转给其他管理员）")
    @PostMapping("/{id}/reassign")
    public R<Map<String, Object>> reassign(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody ReassignRequest req) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        WorkOrder order = workOrderService.reassignWorkOrder(
            id, userId, role, req.getAssigneeId());
        return R.ok(Map.of(
            "id", order.getId().toString(),
            "assigneeId", order.getAssigneeId() != null ? order.getAssigneeId().toString() : null,
            "updatedAt", order.getUpdatedAt().toString()
        ));
    }

    // ==================== 留言端点 ====================

    @Operation(summary = "获取留言列表")
    @GetMapping("/{id}/messages")
    public R<PageResult<MessageVO>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        Page<MessageVO> result = messageService.getMessages(id, page, pageSize);
        return R.ok(PageResult.of(result.getRecords(), result.getTotal(), page, pageSize));
    }

    @Operation(summary = "发送留言")
    @PostMapping("/{id}/messages")
    public R<MessageVO> sendMessage(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest req) {
        Long userId = authUtil.getUserId(request);
        String role = authUtil.getRole(request);
        String username = authUtil.getUsername(request);
        return R.created(messageService.sendMessage(
            id, userId, username, role, req.getContent(), req.getMessageType()));
    }

    // ==================== 附件端点 ====================

    @Operation(summary = "上传附件")
    @PostMapping("/{id}/attachments")
    public R<WorkOrderDetailVO.AttachmentVO> uploadAttachment(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        Long userId = authUtil.getUserId(request);
        WorkOrderAttachment attachment = ossService.uploadAttachment(file, id, userId);

        WorkOrderDetailVO.AttachmentVO avo = new WorkOrderDetailVO.AttachmentVO();
        avo.setId(attachment.getId().toString());
        avo.setFileName(attachment.getFileName());
        avo.setFileType(attachment.getFileType());
        avo.setFileSize(attachment.getFileSize());
        avo.setFileUrl(attachment.getFileUrl());
        avo.setThumbnailUrl(attachment.getThumbnailUrl());
        avo.setUploaderId(attachment.getUploaderId());
        avo.setCreatedAt(attachment.getCreatedAt());

        return R.created(avo);
    }

    @Operation(summary = "删除附件")
    @DeleteMapping("/{id}/attachments/{attId}")
    public R<Void> deleteAttachment(
            HttpServletRequest request,
            @PathVariable Long id,
            @PathVariable Long attId) {
        Long userId = authUtil.getUserId(request);
        ossService.deleteAttachment(attId, userId);
        return R.ok();
    }
}
