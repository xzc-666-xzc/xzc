package com.interview.interview.controller;

import com.interview.common.entity.Interview;
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

    @Operation(summary = "获取面试历史")
    @GetMapping("/history")
    public R<Map<String, Object>> getHistory(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long userId = authUtil.getUserId(request);
        return R.ok(interviewService.getHistory(userId, page, pageSize));
    }
}
