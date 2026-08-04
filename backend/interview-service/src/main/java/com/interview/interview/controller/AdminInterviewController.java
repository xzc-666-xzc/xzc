package com.interview.interview.controller;

import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.interview.service.InterviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "管理员面试接口", description = "面试监控、强制终止")
@RestController
@RequestMapping("/interviews/admin")
@RequiredArgsConstructor
public class AdminInterviewController {

    private final InterviewService interviewService;
    private final AuthUtil authUtil;

    @Operation(summary = "获取所有进行中的面试列表")
    @GetMapping("/ongoing")
    public R<List<Map<String, Object>>> getOngoingList(HttpServletRequest request) {
        if (!authUtil.isAdmin(request)) {
            return R.fail(40300, "仅管理员可访问");
        }
        return R.ok(interviewService.getOngoingList());
    }

    @Operation(summary = "强制终止面试")
    @PostMapping("/{interviewId}/force-end")
    public R<Map<String, String>> forceEnd(
            HttpServletRequest request,
            @PathVariable Long interviewId) {
        if (!authUtil.isAdmin(request)) {
            return R.fail(40300, "仅管理员可访问");
        }
        interviewService.forceEndInterview(interviewId, "ADMIN");
        return R.ok(Map.of("message", "面试已终止"));
    }
}
