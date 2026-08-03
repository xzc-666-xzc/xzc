package com.interview.interview.controller;

import com.interview.common.entity.Interview;
import com.interview.common.entity.Question;
import com.interview.common.result.PageResult;
import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.interview.service.InterviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "面试接口", description = "面试会话的创建与管理")
@RestController
@RequestMapping("/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final AuthUtil authUtil;

    @Data
    public static class CreateInterviewRequest {
        @NotBlank private String positionId;
        @NotBlank private String positionName;
        @NotBlank private String difficulty;
        @NotBlank private String mode;
        @NotBlank private String type;
        @NotNull private Integer questionCount;
        @NotNull private Integer duration;
    }

    @Data
    public static class SubmitAnswerRequest {
        @NotBlank private String questionId;
        @NotBlank private String content;
        @NotNull private Integer duration;
    }

    @Operation(summary = "创建新面试")
    @PostMapping
    public R<Map<String, String>> createInterview(
            HttpServletRequest request,
            @Valid @RequestBody CreateInterviewRequest req) {
        Long userId = authUtil.getUserId(request);
        Interview interview = interviewService.createInterview(userId, req);
        return R.ok(Map.of("interviewId", interview.getId().toString()));
    }

    @Operation(summary = "获取面试详情")
    @GetMapping("/{id}")
    public R<Map<String, Object>> getInterview(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        Interview interview = interviewService.getInterview(id, userId);

        return R.ok(Map.of(
                "id", interview.getId().toString(),
                "positionName", interview.getPositionName(),
                "difficulty", interview.getDifficulty(),
                "mode", interview.getMode(),
                "status", interview.getStatus(),
                "currentQuestionIndex", interview.getCurrentQuestionIndex(),
                "totalQuestions", interview.getQuestionCount(),
                "startedAt", interview.getStartedAt() != null ? interview.getStartedAt().toString() : null,
                "completedAt", interview.getCompletedAt() != null ? interview.getCompletedAt().toString() : null
        ));
    }

    @Data
    public static class SaveQuestionRequest {
        @NotBlank private String content;
        @NotNull private Integer index;
    }

    @Operation(summary = "保存面试题目")
    @PostMapping("/{interviewId}/questions")
    public R<Map<String, String>> saveQuestion(
            HttpServletRequest request,
            @PathVariable Long interviewId,
            @Valid @RequestBody SaveQuestionRequest req) {
        Long userId = authUtil.getUserId(request);
        Question q = interviewService.saveQuestion(interviewId, userId, req.getContent(), req.getIndex());
        return R.ok(Map.of("questionId", q.getId().toString()));
    }

    @Operation(summary = "提交回答")
    @PostMapping("/{interviewId}/answers")
    public R<Void> submitAnswer(
            HttpServletRequest request,
            @PathVariable Long interviewId,
            @Valid @RequestBody SubmitAnswerRequest req) {
        Long userId = authUtil.getUserId(request);
        interviewService.submitAnswer(interviewId, userId,
                Long.parseLong(req.getQuestionId()), req.getContent(), req.getDuration());
        return R.ok();
    }

    @Operation(summary = "完成面试")
    @PostMapping("/{interviewId}/complete")
    public R<Void> completeInterview(
            HttpServletRequest request,
            @PathVariable Long interviewId) {
        Long userId = authUtil.getUserId(request);
        interviewService.completeInterview(interviewId, userId);
        return R.ok();
    }

    @Operation(summary = "暂停面试")
    @PostMapping("/{interviewId}/pause")
    public R<Void> pauseInterview(
            HttpServletRequest request,
            @PathVariable Long interviewId) {
        Long userId = authUtil.getUserId(request);
        interviewService.pauseInterview(interviewId, userId);
        return R.ok();
    }

    @Operation(summary = "恢复面试")
    @PostMapping("/{interviewId}/resume")
    public R<Void> resumeInterview(
            HttpServletRequest request,
            @PathVariable Long interviewId) {
        Long userId = authUtil.getUserId(request);
        interviewService.resumeInterview(interviewId, userId);
        return R.ok();
    }

    // ==================== HR 面试码相关 ====================

    @Data
    public static class CreateByHrRequest {
        @NotBlank private String positionId;
        @NotBlank private String positionName;
        @NotBlank private String difficulty;
        @NotBlank private String mode;
        @NotBlank private String type;
        @NotNull private Integer questionCount;
    }

    @Data
    public static class JoinByCodeRequest {
        @NotBlank private String code;
    }

    @Operation(summary = "HR创建面试(生成邀请码)")
    @PostMapping("/create-by-hr")
    public R<Map<String, Object>> createByHr(
            HttpServletRequest request,
            @Valid @RequestBody CreateByHrRequest req) {
        Long userId = authUtil.getUserId(request);
        com.interview.common.entity.Interview interview = interviewService.createByHr(userId, req);
        return R.ok(Map.of(
                "interviewId", interview.getId().toString(),
                "code", interview.getCode()
        ));
    }

    @Operation(summary = "候选人通过邀请码加入面试")
    @PostMapping("/join-by-code")
    public R<Map<String, Object>> joinByCode(
            HttpServletRequest request,
            @Valid @RequestBody JoinByCodeRequest req) {
        Long userId = authUtil.getUserId(request);
        com.interview.common.entity.Interview interview = interviewService.joinByCode(userId, req.getCode());
        return R.ok(Map.of(
                "interviewId", interview.getId().toString(),
                "positionId", interview.getPositionId(),
                "positionName", interview.getPositionName(),
                "difficulty", interview.getDifficulty(),
                "mode", interview.getMode(),
                "type", interview.getType(),
                "questionCount", interview.getQuestionCount(),
                "duration", interview.getQuestionCount() * 3
        ));
    }

    @Operation(summary = "HR查看自己创建的面试列表")
    @GetMapping("/hr-list")
    public R<PageResult<Map<String, Object>>> getHrList(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long userId = authUtil.getUserId(request);
        return R.ok(interviewService.getHrList(userId, page, pageSize));
    }

    // ==================== 原有端点 ====================

    @Operation(summary = "获取面试历史")
    @GetMapping("/history")
    public R<PageResult<Map<String, Object>>> getHistory(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long userId = authUtil.getUserId(request);
        return R.ok(interviewService.getHistory(userId, page, pageSize));
    }
}
