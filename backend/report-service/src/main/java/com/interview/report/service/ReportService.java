package com.interview.report.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.interview.common.entity.*;
import com.interview.common.exception.BusinessException;
import com.interview.report.mapper.InterviewMapper;
import com.interview.report.mapper.QuestionMapper;
import com.interview.report.mapper.AnswerMapper;
import com.interview.report.mapper.EvaluationMapper;
import com.interview.report.mapper.WrongQuestionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService extends ServiceImpl<InterviewMapper, Interview> {

    private final QuestionMapper questionMapper;
    private final AnswerMapper answerMapper;
    private final EvaluationMapper evaluationMapper;
    private final WrongQuestionMapper wrongQuestionMapper;
    private final ObjectMapper objectMapper;

    /**
     * 获取完整的面试报告
     */
    public Map<String, Object> getReport(Long interviewId, Long userId) {
        Interview interview = this.getById(interviewId);
        if (interview == null || !interview.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权访问该报告");
        }
        if (!"completed".equals(interview.getStatus())) {
            throw new BusinessException(400, "面试尚未完成，无法查看报告");
        }

        // 获取所有题目和回答
        List<Question> questions = questionMapper.selectList(
                new LambdaQueryWrapper<Question>()
                        .eq(Question::getInterviewId, interviewId)
                        .orderByAsc(Question::getIndex)
        );

        List<Map<String, Object>> questionDetails = new ArrayList<>();
        int totalContent = 0, totalLogic = 0, totalDepth = 0, totalStar = 0, totalExpression = 0;
        List<String> allStrengths = new ArrayList<>();
        List<String> allWeaknesses = new ArrayList<>();

        for (Question q : questions) {
            Answer answer = answerMapper.selectOne(
                    new LambdaQueryWrapper<Answer>().eq(Answer::getQuestionId, q.getId())
            );
            Evaluation eval = null;
            if (answer != null) {
                eval = evaluationMapper.selectOne(
                        new LambdaQueryWrapper<Evaluation>().eq(Evaluation::getAnswerId, answer.getId())
                );
            }

            if (eval != null) {
                totalContent += eval.getContentScore();
                totalLogic += eval.getLogicScore();
                totalDepth += eval.getDepthScore();
                totalStar += eval.getStarScore();
                totalExpression += eval.getExpressionScore();

                if (eval.getStrengths() != null && !eval.getStrengths().isEmpty()) {
                    try {
                        List<String> strengths = objectMapper.readValue(eval.getStrengths(),
                                new TypeReference<List<String>>() {});
                        allStrengths.addAll(strengths);
                    } catch (Exception e) {
                        allStrengths.add(eval.getStrengths());
                    }
                }
                if (eval.getWeaknesses() != null && !eval.getWeaknesses().isEmpty()) {
                    try {
                        List<String> weaknesses = objectMapper.readValue(eval.getWeaknesses(),
                                new TypeReference<List<String>>() {});
                        allWeaknesses.addAll(weaknesses);
                    } catch (Exception e) {
                        allWeaknesses.add(eval.getWeaknesses());
                    }
                }
            }

            Map<String, Object> detail = new HashMap<>();
            detail.put("question", q.getContent());
            detail.put("answer", answer != null ? answer.getContent() : "");

            if (eval != null) {
                Map<String, Object> evalMap = new HashMap<>();
                evalMap.put("answerId", eval.getId().toString());
                evalMap.put("contentScore", eval.getContentScore());
                evalMap.put("logicScore", eval.getLogicScore());
                evalMap.put("depthScore", eval.getDepthScore());
                evalMap.put("starScore", eval.getStarScore());
                evalMap.put("expressionScore", eval.getExpressionScore());
                evalMap.put("overallScore", eval.getOverallScore());
                evalMap.put("strengths", eval.getStrengths());
                evalMap.put("weaknesses", eval.getWeaknesses());
                evalMap.put("suggestions", eval.getSuggestions());
                evalMap.put("referenceAnswer", eval.getReferenceAnswer());
                detail.put("evaluation", evalMap);
            }
            questionDetails.add(detail);
        }

        int qCount = questions.size();
        int avgContent = qCount > 0 ? totalContent / qCount : 0;
        int avgLogic = qCount > 0 ? totalLogic / qCount : 0;
        int avgDepth = qCount > 0 ? totalDepth / qCount : 0;
        int avgStar = qCount > 0 ? totalStar / qCount : 0;
        int avgExpression = qCount > 0 ? totalExpression / qCount : 0;
        int totalScore = (avgContent + avgLogic + avgDepth + avgStar + avgExpression) / 5;

        // 雷达图数据
        List<Map<String, Object>> radarData = List.of(
                Map.of("dimension", "内容准确性", "score", avgContent, "fullMark", 100),
                Map.of("dimension", "逻辑条理性", "score", avgLogic, "fullMark", 100),
                Map.of("dimension", "专业深度", "score", avgDepth, "fullMark", 100),
                Map.of("dimension", "STAR法则", "score", avgStar, "fullMark", 100),
                Map.of("dimension", "表达沟通", "score", avgExpression, "fullMark", 100)
        );

        Map<String, Object> report = new HashMap<>();
        report.put("interviewId", interviewId.toString());
        report.put("totalScore", totalScore);
        report.put("scores", Map.of(
                "content", avgContent, "logic", avgLogic,
                "depth", avgDepth, "star", avgStar, "expression", avgExpression
        ));
        report.put("radarData", radarData);
        report.put("questionDetails", questionDetails);
        report.put("overallSummary", interview.getSummary() != null ? interview.getSummary() : "整体表现分析中...");
        report.put("strengths", allStrengths);
        report.put("weaknesses", allWeaknesses);
        report.put("improvementPlan", "建议针对薄弱维度进行专项练习");
        report.put("createdAt", interview.getCompletedAt() != null
                ? interview.getCompletedAt().toString() : "");

        return report;
    }

    /**
     * 获取逐题评测详情
     */
    public Map<String, Object> getEvaluateDetail(Long answerId) {
        Evaluation eval = evaluationMapper.selectOne(
                new LambdaQueryWrapper<Evaluation>().eq(Evaluation::getAnswerId, answerId)
        );
        if (eval == null) {
            throw new BusinessException(404, "评测不存在");
        }

        Map<String, Object> detail = new HashMap<>();
        detail.put("contentScore", eval.getContentScore());
        detail.put("logicScore", eval.getLogicScore());
        detail.put("depthScore", eval.getDepthScore());
        detail.put("starScore", eval.getStarScore());
        detail.put("expressionScore", eval.getExpressionScore());
        detail.put("overallScore", eval.getOverallScore());
        detail.put("strengths", eval.getStrengths());
        detail.put("weaknesses", eval.getWeaknesses());
        detail.put("suggestions", eval.getSuggestions());
        detail.put("referenceAnswer", eval.getReferenceAnswer());
        return detail;
    }

    /**
     * 获取错题本
     */
    public Map<String, Object> getWrongBook(Long userId, int page, int pageSize, String tags) {
        IPage<WrongQuestion> pageResult = wrongQuestionMapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<WrongQuestion>()
                        .eq(WrongQuestion::getUserId, userId)
                        .orderByDesc(WrongQuestion::getCreatedAt)
        );

        List<Map<String, Object>> records = new ArrayList<>();
        for (WrongQuestion wq : pageResult.getRecords()) {
            Question question = questionMapper.selectById(wq.getQuestionId());
            Answer answer = answerMapper.selectOne(
                    new LambdaQueryWrapper<Answer>().eq(Answer::getQuestionId, wq.getQuestionId())
            );
            Evaluation eval = evaluationMapper.selectOne(
                    new LambdaQueryWrapper<Evaluation>().eq(Evaluation::getAnswerId,
                            answer != null ? answer.getId() : null)
            );

            Map<String, Object> record = new HashMap<>();
            record.put("id", wq.getId().toString());
            record.put("interviewId", wq.getInterviewId().toString());
            record.put("question", question != null ? question.getContent() : "");
            record.put("myAnswer", answer != null ? answer.getContent() : "");
            record.put("referenceAnswer", eval != null ? eval.getReferenceAnswer() : "");
            record.put("score", eval != null ? eval.getOverallScore() : 0);
            record.put("knowledgeTag", question != null ? question.getKnowledgeTags() : "");
            record.put("date", wq.getCreatedAt() != null ? wq.getCreatedAt().toString().substring(0, 10) : "");
            record.put("reviewed", wq.getReviewed());
            records.add(record);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("total", pageResult.getTotal());
        result.put("page", page);
        result.put("pageSize", pageSize);
        return result;
    }

    /**
     * 标记错题已复习
     */
    @Transactional
    public void reviewWrongQuestion(Long id, Long userId) {
        WrongQuestion wq = wrongQuestionMapper.selectById(id);
        if (wq == null || !wq.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作");
        }
        wq.setReviewed(true);
        wrongQuestionMapper.updateById(wq);
    }
}
