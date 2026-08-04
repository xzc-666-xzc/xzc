package com.interview.interview.scheduler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.interview.common.entity.Interview;
import com.interview.interview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 面试超时自动检查 — 每分钟扫描进行中超过1小时的面试并自动结束
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class InterviewTimeoutScheduler {

    private final InterviewService interviewService;

    private static final long TIMEOUT_MINUTES = 60;

    @Scheduled(fixedDelay = 60000)
    public void checkAndAutoEndInterviews() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES);
        List<Interview> timeoutList = interviewService.list(
                new LambdaQueryWrapper<Interview>()
                        .eq(Interview::getStatus, "in_progress")
                        .lt(Interview::getStartedAt, threshold));

        for (Interview interview : timeoutList) {
            try {
                interviewService.forceEndInterview(interview.getId(), "TIMEOUT");
                log.info("自动结束超时面试: interviewId={}, startedAt={}", interview.getId(), interview.getStartedAt());
            } catch (Exception e) {
                log.error("自动结束面试失败: interviewId={}", interview.getId(), e);
            }
        }
    }
}
