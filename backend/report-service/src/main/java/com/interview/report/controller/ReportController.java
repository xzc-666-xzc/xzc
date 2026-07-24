package com.interview.report.controller;

import com.interview.common.result.PageResult;
import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "报告接口", description = "面试评测报告与错题本")
@RestController
@RequestMapping
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final AuthUtil authUtil;

    @Operation(summary = "获取面试报告")
    @GetMapping("/reports/{interviewId}")
    public R<Map<String, Object>> getReport(
            HttpServletRequest request,
            @PathVariable Long interviewId) {
        Long userId = authUtil.getUserId(request);
        return R.ok(reportService.getReport(interviewId, userId));
    }

    @Operation(summary = "获取逐题评测详情")
    @GetMapping("/reports/evaluate/{answerId}")
    public R<Map<String, Object>> getEvaluateDetail(@PathVariable Long answerId) {
        return R.ok(reportService.getEvaluateDetail(answerId));
    }

    @Operation(summary = "获取错题本列表")
    @GetMapping("/wrong-book")
    public R<PageResult<Map<String, Object>>> getWrongBook(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String tags) {
        Long userId = authUtil.getUserId(request);
        return R.ok(reportService.getWrongBook(userId, page, pageSize, tags));
    }

    @Operation(summary = "标记错题已复习")
    @PostMapping("/wrong-book/{id}/review")
    public R<Void> reviewWrongQuestion(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long userId = authUtil.getUserId(request);
        reportService.reviewWrongQuestion(id, userId);
        return R.ok();
    }
}
