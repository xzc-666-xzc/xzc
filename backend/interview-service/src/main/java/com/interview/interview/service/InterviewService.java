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
import com.interview.interview.mapper.QuestionMapper;
import com.interview.interview.mapper.EvaluationMapper;
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
    private final QuestionMapper questionMapper;
    private final EvaluationMapper evaluationMapper;

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

    /** 保存题目并返回数据库ID */
    @Transactional
    public Question saveQuestion(Long interviewId, Long userId, String content, int index) {
        getInterview(interviewId, userId);
        Question q = new Question();
        q.setInterviewId(interviewId);
        q.setIndex(index);
        q.setContent(content);
        q.setType("main");
        questionMapper.insert(q);
        return q;
    }

    @Transactional
    public void submitAnswer(Long interviewId, Long userId, Long questionId,
                             String content, Integer duration) {
        Interview interview = getInterview(interviewId, userId);
        if (!"in_progress".equals(interview.getStatus())) {
            throw new BusinessException(400, "面试已结束，无法提交回答");
        }
        Answer answer = new Answer();
        answer.setQuestionId(questionId);
        answer.setContent(content);
        answer.setDuration(duration);
        answerMapper.insert(answer);

        int newIndex = interview.getCurrentQuestionIndex() + 1;
        interview.setCurrentQuestionIndex(newIndex);
        this.updateById(interview);
    }

    @Transactional
    public void completeInterview(Long interviewId, Long userId) {
        Interview interview = getInterview(interviewId, userId);
        if ("completed".equals(interview.getStatus())) {
            throw new BusinessException(400, "面试已完成");
        }

        // 为所有回答生成评测
        generateEvaluations(interviewId);

        // 计算总分
        int totalScore = calculateTotalScore(interviewId);
        interview.setScore(totalScore);
        interview.setStatus("completed");
        interview.setCompletedAt(LocalDateTime.now());

        // 生成综合评语
        String summary = buildSummary(totalScore);
        interview.setSummary(summary);

        this.updateById(interview);
    }

    private void generateEvaluations(Long interviewId) {
        List<Question> questions = questionMapper.selectList(
                new LambdaQueryWrapper<Question>()
                        .eq(Question::getInterviewId, interviewId)
                        .orderByAsc(Question::getIndex));

        for (Question q : questions) {
            Answer answer = answerMapper.selectOne(
                    new LambdaQueryWrapper<Answer>().eq(Answer::getQuestionId, q.getId()));
            if (answer == null) continue;

            // 检查是否已评测
            Long count = evaluationMapper.selectCount(
                    new LambdaQueryWrapper<Evaluation>().eq(Evaluation::getAnswerId, answer.getId()));
            if (count > 0) continue;

            // 基于内容长度模拟评分
            int len = answer.getContent() != null ? answer.getContent().length() : 0;
            int base = len > 300 ? 85 : len > 200 ? 78 : len > 100 ? 70 : len > 50 ? 62 : 50;
            Random rnd = new Random();
            int contentScore = clamp(base + rnd.nextInt(10) - 5);
            int logicScore = clamp(base + rnd.nextInt(10) - 8);
            int depthScore = clamp(base + rnd.nextInt(14) - 7);
            int starScore = clamp(base + rnd.nextInt(10) - 5);
            int expressionScore = clamp(base + rnd.nextInt(8) - 4);
            int overall = (contentScore + logicScore + depthScore + starScore + expressionScore) / 5;

            List<String> strengths = pickRandom(strengthPool, overall >= 80 ? 3 : overall >= 65 ? 2 : 1, rnd);
            List<String> weaknesses = pickRandom(weaknessPool, overall >= 80 ? 1 : overall >= 65 ? 2 : 3, rnd);
            List<String> suggestions = pickRandom(suggestionPool, 1, rnd);

            Evaluation eval = new Evaluation();
            eval.setAnswerId(answer.getId());
            eval.setContentScore(contentScore);
            eval.setLogicScore(logicScore);
            eval.setDepthScore(depthScore);
            eval.setStarScore(starScore);
            eval.setExpressionScore(expressionScore);
            eval.setOverallScore(overall);
            eval.setStrengths(toJson(strengths));
            eval.setWeaknesses(toJson(weaknesses));
            eval.setSuggestions(toJson(suggestions));
            eval.setReferenceAnswer("请结合具体项目和量化数据来组织回答，参考STAR法则（情境-任务-行动-结果）。");
            evaluationMapper.insert(eval);
        }
    }

    private int calculateTotalScore(Long interviewId) {
        List<Evaluation> evals = evaluationMapper.selectList(
                new LambdaQueryWrapper<Evaluation>()
                        .inSql(Evaluation::getAnswerId,
                                "SELECT id FROM t_answer WHERE question_id IN (SELECT id FROM t_question WHERE interview_id = " + interviewId + ")"));

        if (evals.isEmpty()) return 0;
        return evals.stream().mapToInt(Evaluation::getOverallScore).sum() / evals.size();
    }

    private String buildSummary(int totalScore) {
        if (totalScore >= 85) return "表现优秀！你的回答专业、结构清晰，展现了扎实的技术功底和丰富的实战经验。";
        if (totalScore >= 70) return "整体表现良好，具备一定专业能力。建议更深入地阐述技术原理，并补充量化的项目成果。";
        if (totalScore >= 60) return "表现一般，基础概念基本正确但深度不足。建议加强STAR法则的运用，准备更多项目案例。";
        return "需要更多练习。建议从基础知识入手，逐步提升面试回答的深度和结构化程度。";
    }

    @Transactional
    public void pauseInterview(Long interviewId, Long userId) {
        Interview interview = getInterview(interviewId, userId);
        if ("in_progress".equals(interview.getStatus())) {
            interview.setStatus("interrupted");
            this.updateById(interview);
        }
    }

    @Transactional
    public void resumeInterview(Long interviewId, Long userId) {
        Interview interview = getInterview(interviewId, userId);
        if ("interrupted".equals(interview.getStatus())) {
            interview.setStatus("in_progress");
            this.updateById(interview);
        }
    }

    public Map<String, Object> getHistory(Long userId, int page, int pageSize) {
        IPage<Interview> pageResult = this.page(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<Interview>()
                        .eq(Interview::getUserId, userId)
                        .orderByDesc(Interview::getCreatedAt));

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

    // --- helper methods ---

    private static int clamp(int v) { return Math.max(0, Math.min(100, v)); }

    private static List<String> pickRandom(List<String> pool, int count, Random rnd) {
        List<String> copy = new ArrayList<>(pool);
        Collections.shuffle(copy, rnd);
        return copy.subList(0, Math.min(count, copy.size()));
    }

    private static String toJson(List<String> list) {
        return "[\"" + String.join("\",\"", list) + "\"]";
    }

    private static final List<String> strengthPool = List.of(
            "回答结构清晰，条理分明", "专业术语使用准确", "项目经验描述具体",
            "能够结合实际案例说明", "表达流畅，逻辑连贯", "对核心概念理解到位",
            "展现出了良好的问题分析能力", "回答内容充实，有深度");

    private static final List<String> weaknessPool = List.of(
            "缺少量化的数据支撑", "可以更深入阐述技术原理", "建议使用 STAR 法则组织回答",
            "部分表述略显笼统", "缺少对边界情况的思考", "可补充更多实践细节",
            "回答内容偏短，建议展开说明", "缺乏对后续影响的分析");

    private static final List<String> suggestionPool = List.of(
            "建议结合具体项目中的量化指标来强化说服力",
            "尝试用 STAR 法则（情境-任务-行动-结果）重新组织回答",
            "深入思考技术方案背后的设计原理和权衡",
            "多准备几个技术难点的案例，展示解决问题的能力",
            "注意区分知道和做过——强调亲身实践经验",
            "在回答中体现出对行业最佳实践的了解");
}
