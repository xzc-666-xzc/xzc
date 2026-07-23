package com.interview.interview.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.interview.common.entity.*;
import com.interview.common.exception.BusinessException;
import com.interview.interview.controller.InterviewController.CreateInterviewRequest;
import com.interview.interview.mapper.InterviewMapper;
import com.interview.interview.mapper.AnswerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewService extends ServiceImpl<InterviewMapper, Interview> {

    private final AnswerMapper answerMapper;

    /**
     * 创建新面试会话
     */
    @Transactional
    public Interview createInterview(Long userId, CreateInterviewRequest req) {
        Interview interview = new Interview();
        interview.setUserId(userId);
        interview.setPositionId(req.getPositionId());
        interview.setPositionName(req.getPositionName());
        interview.setDifficulty(req.getDifficulty());
        interview.setMode(req.getMode());
        interview.setType(req.getType());
        interview.setQuestionCount(req.getQuestionCount());
        interview.setStatus("in_progress");
        interview.setCurrentQuestionIndex(0);
        interview.setStartedAt(LocalDateTime.now());

        this.save(interview);
        return interview;
    }

    /**
     * 获取面试详情（并校验所有权）
     */
    public Interview getInterview(Long interviewId, Long userId) {
        Interview interview = this.getById(interviewId);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }
        if (!interview.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权访问该面试");
        }
        return interview;
    }

    /**
     * 提交回答并记录
     */
    @Transactional
    public void submitAnswer(Long interviewId, Long userId, Long questionId,
                             String content, Integer duration) {
        Interview interview = getInterview(interviewId, userId);

        if (!"in_progress".equals(interview.getStatus())) {
            throw new BusinessException(400, "面试已结束，无法提交回答");
        }

        // 保存回答
        Answer answer = new Answer();
        answer.setQuestionId(questionId);
        answer.setContent(content);
        answer.setDuration(duration);
        answerMapper.insert(answer);

        // 更新面试进度
        int newIndex = interview.getCurrentQuestionIndex() + 1;
        interview.setCurrentQuestionIndex(newIndex);
        this.updateById(interview);
    }

    /**
     * 完成面试
     */
    @Transactional
    public void completeInterview(Long interviewId, Long userId) {
        Interview interview = getInterview(interviewId, userId);

        if ("completed".equals(interview.getStatus())) {
            throw new BusinessException(400, "面试已完成");
        }

        interview.setStatus("completed");
        interview.setCompletedAt(LocalDateTime.now());
        this.updateById(interview);
    }

    /**
     * 暂停面试（网络中断等场景）
     */
    @Transactional
    public void pauseInterview(Long interviewId, Long userId) {
        Interview interview = getInterview(interviewId, userId);
        if ("in_progress".equals(interview.getStatus())) {
            interview.setStatus("interrupted");
            this.updateById(interview);
        }
    }

    /**
     * 恢复面试
     */
    @Transactional
    public void resumeInterview(Long interviewId, Long userId) {
        Interview interview = getInterview(interviewId, userId);
        if ("interrupted".equals(interview.getStatus())) {
            interview.setStatus("in_progress");
            this.updateById(interview);
        }
    }

    /**
     * 获取面试历史
     */
    public Map<String, Object> getHistory(Long userId, int page, int pageSize) {
        IPage<Interview> pageResult = this.page(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<Interview>()
                        .eq(Interview::getUserId, userId)
                        .orderByDesc(Interview::getCreatedAt)
        );

        List<Map<String, Object>> records = pageResult.getRecords().stream()
                .map(i -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", i.getId().toString());
                    m.put("positionName", i.getPositionName());
                    m.put("difficulty", i.getDifficulty());
                    m.put("mode", i.getMode());
                    m.put("status", i.getStatus());
                    m.put("questionCount", i.getQuestionCount());
                    m.put("currentQuestionIndex", i.getCurrentQuestionIndex());
                    m.put("score", i.getScore());
                    m.put("startedAt", i.getStartedAt() != null ? i.getStartedAt().toString() : null);
                    m.put("completedAt", i.getCompletedAt() != null ? i.getCompletedAt().toString() : null);
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("total", pageResult.getTotal());
        result.put("page", page);
        result.put("pageSize", pageSize);
        return result;
    }
}
