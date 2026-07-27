package com.interview.interview.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.interview.common.entity.*;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.PageResult;
import com.interview.common.result.ResultCode;
import com.interview.interview.controller.InterviewController.CreateInterviewRequest;
import com.interview.interview.mapper.InterviewMapper;
import com.interview.interview.mapper.AnswerMapper;
import com.interview.interview.mapper.QuestionMapper;
import com.interview.interview.mapper.EvaluationMapper;
import com.interview.interview.mapper.WrongQuestionMapper;
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
    private final WrongQuestionMapper wrongQuestionMapper;

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
            throw new BusinessException(ResultCode.NOT_FOUND, "面试不存在");
        }
        if (!interview.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权访问该面试");
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
            throw new BusinessException(ResultCode.BAD_REQUEST, "面试已结束，无法提交回答");
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
            throw new BusinessException(ResultCode.BAD_REQUEST, "面试已完成");
        }

        // 为所有回答生成评测（含错题本自动收录）
        generateEvaluations(interview);

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

    private void generateEvaluations(Interview interview) {
        Long interviewId = interview.getId();
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

            // === 多因子内容质量分析 ===
            String content = answer.getContent() != null ? answer.getContent().trim() : "";
            int len = content.length();

            // 内容有效性检测：先判断是不是乱写的垃圾内容
            ValidityResult validity = checkContentValidity(content);
            if (!validity.isValid) {
                // 垃圾内容直接给极低分
                int penalty = validity.suggestedScore;
                Evaluation eval = new Evaluation();
                eval.setAnswerId(answer.getId());
                eval.setContentScore(Math.min(penalty, 15));
                eval.setLogicScore(Math.min(penalty, 10));
                eval.setDepthScore(Math.min(penalty, 10));
                eval.setStarScore(Math.min(penalty, 10));
                eval.setExpressionScore(Math.min(penalty, 10));
                eval.setOverallScore(penalty);
                eval.setStrengths("[]");
                eval.setWeaknesses(toJson(validity.reasons));
                eval.setSuggestions(toJson(List.of("请认真对待每一次模拟面试。即使对问题不太确定，也请用自己的理解和语言来回答，这样才能获得有价值的反馈和提升。")));
                eval.setReferenceAnswer("由于您的回答无效，无法提供针对性参考答案。请在下次面试中认真作答。");
                evaluationMapper.insert(eval);
                if (penalty < 60) {
                    WrongQuestion wq = new WrongQuestion();
                    wq.setUserId(interview.getUserId());
                    wq.setInterviewId(interviewId);
                    wq.setQuestionId(q.getId());
                    wq.setReviewed(false);
                    wrongQuestionMapper.insert(wq);
                }
                continue;
            }

            // 1. 结构分析 (STAR法则、分点论述、总分总)
            int structureScore = analyzeStructure(content);
            // 2. 量化分析 (数字、百分比、具体指标)
            int quantScore = analyzeQuantification(content);
            // 3. 专业术语分析
            int termScore = analyzeTerminology(content, interview.getPositionName());
            // 4. 逻辑连贯性分析
            int coherenceScore = analyzeCoherence(content);
            // 5. 内容充实度
            int lengthScore = evaluateLength(len);

            Random rnd = new Random();
            int contentScore = clamp((int)(quantScore * 0.35 + termScore * 0.40 + lengthScore * 0.25) + rnd.nextInt(6) - 3);
            int logicScore    = clamp((int)(structureScore * 0.45 + coherenceScore * 0.40 + lengthScore * 0.15) + rnd.nextInt(6) - 3);
            int depthScore    = clamp((int)(termScore * 0.55 + quantScore * 0.25 + coherenceScore * 0.20) + rnd.nextInt(8) - 4);
            int starScore     = clamp((int)(structureScore * 0.60 + coherenceScore * 0.25 + lengthScore * 0.15) + rnd.nextInt(6) - 3);
            int expressionScore = clamp((int)(coherenceScore * 0.45 + structureScore * 0.30 + lengthScore * 0.25) + rnd.nextInt(5) - 2);
            int overall = (contentScore + logicScore + depthScore + starScore + expressionScore) / 5;

            // 空内容 / 极短内容特殊处理 → 可以给到0分
            if (len == 0) {
                contentScore = 0; logicScore = 0; depthScore = 0; starScore = 0; expressionScore = 0; overall = 0;
            } else if (len < 20) {
                overall = Math.min(overall, 25);
                contentScore = Math.min(contentScore, 30);
                depthScore = Math.min(depthScore, 30);
            }

            // 按分数段选取分层评语
            String tier = overall >= 85 ? "excellent" : overall >= 70 ? "good" : overall >= 50 ? "average" : "poor";
            int strengthCount = overall >= 85 ? 3 : overall >= 70 ? 2 : overall >= 40 ? 1 : 0;
            int weaknessCount = overall >= 85 ? 1 : overall >= 70 ? 2 : overall >= 40 ? 3 : 4;
            List<String> strengths = pickTiered(strengthPools.getOrDefault(tier, strengthPools.get("poor")), strengthCount, rnd);
            List<String> weaknesses = pickTiered(weaknessPools.getOrDefault(tier, weaknessPools.get("poor")), weaknessCount, rnd);
            List<String> suggestions = pickTiered(suggestionPools.getOrDefault(tier, suggestionPools.get("poor")), 2, rnd);

            // 参考答案多样化
            String referenceAnswer = pickReferenceAnswer(interview, q, rnd);

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
            eval.setReferenceAnswer(referenceAnswer);
            evaluationMapper.insert(eval);

            // 低于60分自动收录到错题本
            if (overall < 60) {
                WrongQuestion wq = new WrongQuestion();
                wq.setUserId(interview.getUserId());
                wq.setInterviewId(interviewId);
                wq.setQuestionId(q.getId());
                wq.setReviewed(false);
                wrongQuestionMapper.insert(wq);
            }
        }
    }

    // ==================== 内容有效性检测 ====================

    private static class ValidityResult {
        boolean isValid;
        int suggestedScore;
        List<String> reasons;
        ValidityResult(boolean isValid, int suggestedScore, List<String> reasons) {
            this.isValid = isValid;
            this.suggestedScore = suggestedScore;
            this.reasons = reasons;
        }
    }

    private ValidityResult checkContentValidity(String content) {
        if (content.isEmpty()) {
            return new ValidityResult(false, 0, List.of("未提交任何回答内容"));
        }
        if (content.length() < 5) {
            return new ValidityResult(false, 5, List.of("回答内容过短，仅有" + content.length() + "个字符，几乎没有实质性信息"));
        }

        // 检测单一字符重复（如 "aaaaaaa"）
        long uniqueChars = content.chars().distinct().count();
        if (content.length() >= 8 && uniqueChars <= 2) {
            return new ValidityResult(false, 3, List.of("回答为无意义的重复字符（仅" + uniqueChars + "种字符重复了" + content.length() + "次），请认真作答"));
        }
        if (content.length() >= 6 && uniqueChars <= 1) {
            return new ValidityResult(false, 0, List.of("回答为单一字符不断重复，完全是无效输入"));
        }

        // 检测键盘随机敲击模式
        String lower = content.toLowerCase().replaceAll("\\s", "");
        for (String pattern : KEYBOARD_PATTERNS) {
            if (lower.contains(pattern) && lower.length() < 30) {
                return new ValidityResult(false, 8,
                        List.of("检测到键盘随机敲击模式（\"" + pattern + "\"），请认真输入你的真实回答"));
            }
        }

        // 检测全英文乱敲（无空格、无标点、无大小写变化、无真实英文单词）
        if (content.length() < 40) {
            long chineseCount = content.chars().filter(c -> Character.isIdeographic(c)).count();
            long englishCount = content.chars().filter(c -> (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')).count();
            if (chineseCount == 0 && englishCount >= 5) {
                boolean hasSpaces = content.contains(" ");
                boolean hasPunctuation = content.matches(".*[.,!?;:'\"()].*");
                boolean hasUpperCase = content.chars().anyMatch(c -> c >= 'A' && c <= 'Z');
                // 检查是否有真实英文单词
                int wordCount = 0;
                for (String word : COMMON_ENGLISH_WORDS) {
                    if (lower.contains(word)) wordCount++;
                }
                if (!hasSpaces && !hasPunctuation && !hasUpperCase && wordCount == 0) {
                    return new ValidityResult(false, 10,
                            List.of("回答内容看起来像是无意义的英文键盘敲击，请用中文认真作答"));
                }
            }
        }

        return new ValidityResult(true, 0, List.of());
    }

    // ==================== 内容质量分析辅助方法 ====================

    /** 分析结构化程度：STAR法则、分点列举、总分总 */
    private int analyzeStructure(String content) {
        if (content.isEmpty()) return 0;
        int score = 25;
        boolean hasSituation = containsAny(content, "背景", "当时", "之前", "项目背景", "业务场景", "面临", "所在团队", "我们做", "做了一");
        boolean hasTask = containsAny(content, "我的任务", "目标", "需要解决", "负责", "要求是", "我的职责", "要做的");
        boolean hasAction = containsAny(content, "我做了", "采取", "实施了", "设计了", "优化了", "采用了", "通过", "实现了", "开发了", "搭建了");
        boolean hasResult = containsAny(content, "结果", "最终", "效果", "提升了", "降低了", "达到了", "完成了", "上线了", "取得了", "带来了");
        int starHits = (hasSituation ? 1 : 0) + (hasTask ? 1 : 0) + (hasAction ? 1 : 0) + (hasResult ? 1 : 0);
        score += starHits * 15;
        if (content.contains("第一") || content.contains("首先") || content.contains("1.") || content.contains("1、") || content.contains("1）")) score += 8;
        if (content.contains("第二") || content.contains("其次") || content.contains("2.") || content.contains("2、") || content.contains("2）")) score += 7;
        if (content.contains("第三") || content.contains("最后") || content.contains("3.") || content.contains("3、") || content.contains("3）")) score += 5;
        if (containsAny(content, "总结", "综上所述", "总的来说", "概括来说", "总体来看")) score += 5;
        return clamp(score);
    }

    /** 分析量化指标：数字、百分比、具体数值 */
    private int analyzeQuantification(String content) {
        if (content.isEmpty()) return 0;
        int score = 15;
        int digitCount = 0;
        for (char c : content.toCharArray()) {
            if (c >= '0' && c <= '9') digitCount++;
        }
        if (digitCount >= 15) score += 35;
        else if (digitCount >= 8) score += 25;
        else if (digitCount >= 4) score += 15;
        else if (digitCount >= 2) score += 8;
        if (content.contains("%") || content.contains("百分之")) score += 15;
        if (containsAny(content, "QPS", "TPS", "PV", "UV", "DAU", "MAU", "RT", "P99", "P95", "P50", "吞吐量", "并发量", "响应时间")) score += 15;
        if (containsAny(content, "提升", "降低", "减少", "增长", "翻倍", "倍", "万", "亿", "千万", "百万", "十万")) score += 10;
        if (containsAny(content, "毫秒", "ms", "秒内", "分钟", "小时", "天完成", "Q1", "Q2", "Q3", "Q4")) score += 5;
        return clamp(score);
    }

    /** 分析专业术语密度 */
    private int analyzeTerminology(String content, String positionName) {
        if (content.isEmpty()) return 0;
        int score = 10;
        int termCount = 0;
        for (String term : TECHNICAL_TERMS) {
            if (content.toLowerCase().contains(term.toLowerCase())) termCount++;
        }
        if (termCount >= 10) score += 55;
        else if (termCount >= 7) score += 42;
        else if (termCount >= 5) score += 30;
        else if (termCount >= 3) score += 18;
        else if (termCount >= 1) score += 8;
        if (positionName != null && positionName.contains("Java")) {
            int javaHits = 0;
            for (String term : JAVA_TERMS) {
                if (content.toLowerCase().contains(term.toLowerCase())) javaHits++;
            }
            score += Math.min(javaHits * 3, 15);
        }
        if (positionName != null && positionName.contains("前端")) {
            int feHits = 0;
            for (String term : FRONTEND_TERMS) {
                if (content.toLowerCase().contains(term.toLowerCase())) feHits++;
            }
            score += Math.min(feHits * 3, 15);
        }
        return clamp(score);
    }

    /** 分析逻辑连贯性：连接词、因果推理、对比分析 */
    private int analyzeCoherence(String content) {
        if (content.isEmpty()) return 0;
        int score = 20;
        if (containsAny(content, "因为", "所以", "因此", "由于", "导致", "原因是", "源于", "根本原因")) score += 12;
        if (containsAny(content, "但是", "然而", "不过", "虽然", "尽管", "另一方面", "反过来说", "但要注意")) score += 8;
        if (containsAny(content, "比如", "例如", "具体来说", "举例", "举个例子", "打个比方", "以")) score += 8;
        if (containsAny(content, "而且", "此外", "同时", "另外", "还有", "更重要的是", "不仅如此")) score += 7;
        if (containsAny(content, "首先", "其次", "然后", "接着", "之后", "最后", "接下来", "下一步")) score += 10;
        if (containsAny(content, "相比", "相比之下", "相对于", "比起", "比直接", "优于", "不如")) score += 8;
        if (containsAny(content, "如果", "假如", "假设", "倘若", "一旦", "万一", "极端情况下")) score += 7;
        return clamp(score);
    }

    /** 内容长度评估：优秀要足够充实 */
    private int evaluateLength(int len) {
        if (len >= 500) return 95;
        if (len >= 350) return 87;
        if (len >= 250) return 78;
        if (len >= 150) return 60;
        if (len >= 80)  return 42;
        if (len >= 30)  return 25;
        if (len > 0)    return 10;
        return 0;
    }

    /** 根据面试类型和难度选取参考答案 */
    private String pickReferenceAnswer(Interview interview, Question q, Random rnd) {
        String type = interview.getType() != null ? interview.getType() : "technical";
        String posName = interview.getPositionName() != null ? interview.getPositionName() : "该岗位";
        String diff = interview.getDifficulty() != null ? interview.getDifficulty() : "middle";
        List<String> pool = referenceAnswerPools.getOrDefault(type, referenceAnswerPools.get("technical"));
        String template = pool.get(rnd.nextInt(pool.size()));
        String diffHint;
        switch (diff) {
            case "junior": diffHint = "，重点在于基础知识的准确性和学习潜力"; break;
            case "senior": diffHint = "，需要展现架构思维和深度技术洞察"; break;
            case "expert": diffHint = "，需要体现行业视野、技术前瞻性和大规模实战经验"; break;
            default: diffHint = "，兼顾理论深度与实际项目经验"; break;
        }
        return template.replace("{position}", posName).replace("{diffHint}", diffHint);
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
        if (totalScore >= 92) return "非常出色！你在各个维度都表现优异，回答既有理论深度又结合了实际经验，展现出了优秀的综合素质和专业能力。建议在现有基础上继续打磨表达技巧，冲击更高目标。";
        if (totalScore >= 85) return "表现优秀！你的回答专业、结构清晰，展现了扎实的技术功底和丰富的实战经验。在部分问题的深度挖掘上还可以更进一步，尝试多从架构设计和系统演进的角度思考。";
        if (totalScore >= 75) return "整体表现良好，具备不错的专业基础。建议更深入阐述技术原理和设计决策背后的思考过程，同时在回答中补充更多量化的项目成果来增强说服力。";
        if (totalScore >= 65) return "表现尚可，基础概念基本正确但深度和广度都有提升空间。建议加强STAR法则的系统运用，提前准备2-3个有代表性的项目案例，练习用数据和事实说话。";
        if (totalScore >= 50) return "表现有待提高，部分回答过于简略或缺少实质内容。建议从基础知识点系统复习入手，多进行模拟面试练习，逐步培养结构化表达的习惯。";
        if (totalScore >= 30) return "当前表现较弱，回答内容明显不足，缺乏专业深度和逻辑结构。建议先系统梳理岗位所需的核心知识体系，通过写技术博客等方式锻炼表达能力，再进行面试练习。";
        return "当前准备还不够充分，大多数回答未能展现应有的专业能力。建议从零开始系统学习岗位要求的基础知识，多阅读优秀面经和技术文章，积累足够的专业储备后再进行模拟面试。";
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

    public PageResult<Map<String, Object>> getHistory(Long userId, int page, int pageSize) {
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

        return PageResult.of(records, pageResult.getTotal(), pageResult.getCurrent(), pageResult.getSize());
    }

    // --- helper methods ---

    private static int clamp(int v) { return Math.max(0, Math.min(100, v)); }

    private static boolean containsAny(String content, String... keywords) {
        for (String kw : keywords) {
            if (content.contains(kw)) return true;
        }
        return false;
    }

    private static List<String> pickRandom(List<String> pool, int count, Random rnd) {
        List<String> copy = new ArrayList<>(pool);
        Collections.shuffle(copy, rnd);
        return copy.subList(0, Math.min(count, copy.size()));
    }

    private static List<String> pickTiered(List<String> pool, int count, Random rnd) {
        if (pool.isEmpty() || count <= 0) return List.of();
        List<String> copy = new ArrayList<>(pool);
        Collections.shuffle(copy, rnd);
        return copy.subList(0, Math.min(count, copy.size()));
    }

    private static String toJson(List<String> list) {
        if (list.isEmpty()) return "[]";
        return "[\"" + String.join("\",\"", list) + "\"]";
    }

    // ==================== 分层评语池 ====================

    // 优点池：按优秀/良好/一般/较差 分层
    private static final Map<String, List<String>> strengthPools = Map.of(
        "excellent", List.of(
            "能够结合STAR法则清晰阐述项目背景、任务、行动和结果，结构非常完整",
            "回答中包含了具体的量化数据（如性能提升百分比、QPS指标），说服力极强",
            "对底层原理有深入理解，能够从源码级别或架构层面分析问题本质",
            "展现了良好的系统设计思维，能综合考虑高可用、可扩展性、成本等多维度权衡",
            "表达自信流畅，逻辑层层递进，展现出了高级工程师的思维深度",
            "能用通俗语言把复杂的技术概念讲清楚，沟通能力出色",
            "对行业最佳实践和技术趋势有清晰认知，视野开阔",
            "在回答中主动提到了风险控制和边界情况处理，思维严谨"
        ),
        "good", List.of(
            "回答框架清晰，能够抓住问题的核心要点进行阐述",
            "对关键技术概念理解准确，展现了扎实的基础功底",
            "能够结合实际工作场景来回答问题，有一定的实践经验",
            "语言表达流畅，信息组织较为有条理",
            "展现出了独立思考的能力，不仅仅是机械背诵知识点",
            "能够区分不同技术方案的适用场景，有基本的架构意识",
            "对问题的理解比较到位，没有明显的跑题或误解",
            "在回答中体现了一定的主动性，能够延展到相关知识点"
        ),
        "average", List.of(
            "对该知识点有基本了解，方向大致正确",
            "尝试用自己的语言组织回答，而非完全照搬资料",
            "回答中体现了一些实际工作的影子",
            "基本概念没有大的错误"
        ),
        "poor", List.of()
    );

    // 不足池
    private static final Map<String, List<String>> weaknessPools = Map.of(
        "excellent", List.of(
            "在时间允许的情况下，可以进一步延伸到对行业趋势和未来技术演进的分析",
            "回答已经很优秀，但可以更多地从业务价值而非纯技术视角来阐述方案价值",
            "可以尝试用更精炼的语言总结核心观点，让回答更加突出重点"
        ),
        "good", List.of(
            "缺少具体的量化数据支撑，建议用指标（如性能提升百分比、QPS变化）来增强说服力",
            "可以更深入地阐述技术选型背后的权衡与决策依据",
            "部分表述略显笼统，建议用更具体的场景和例子来展开",
            "对边界情况和异常场景的考虑不够充分",
            "建议更多地从系统整体架构角度思考，而非局限于单点技术",
            "STAR法则的运用还不够完整，缺少对背景和结果的清晰描述",
            "可以补充说明如果重新做这个项目会有哪些不同的改进思路",
            "对同类技术方案的横向对比分析还需要加强"
        ),
        "average", List.of(
            "缺少量化的数据支撑和实践细节，回答偏理论化",
            "建议使用STAR法则（情境-任务-行动-结果）重新组织回答结构",
            "缺乏对技术原理和底层机制的深入解释",
            "回答内容偏短，没有充分展开核心观点",
            "部分关键概念表述不够准确，需要加强理论知识学习",
            "没有体现出真实的项目实践经验",
            "缺少对方案优缺点和适用边界的分析",
            "逻辑跳跃较大，不同观点之间缺乏有效的过渡和关联"
        ),
        "poor", List.of(
            "回答内容严重不足，几乎没有实质性信息",
            "核心概念理解有误，需要从根本上重新学习相关知识点",
            "回答与问题关联度低，存在明显的答非所问",
            "缺乏最基本的逻辑结构，表达非常零散",
            "建议从最基础的知识点开始系统学习该岗位所需的技术栈",
            "没有体现出任何该岗位应该具备的专业能力",
            "回答过于敷衍，无法让面试官了解你的真实水平",
            "建议先通过写技术博客、做项目demo等方式积累真正的实践经验"
        )
    );

    // 建议池
    private static final Map<String, List<String>> suggestionPools = Map.of(
        "excellent", List.of(
            "可以尝试从更高维度思考，例如这个技术决策对业务长期发展的战略意义",
            "建议准备一些极端场景下的技术挑战案例，展现临场应变能力",
            "在面试中可以适当反问面试官一些有深度的问题，展现你的好奇心和思考力",
            "关注行业前沿动态（如最新的技术白皮书、顶会论文），保持技术敏感度"
        ),
        "good", List.of(
            "建议结合具体项目中的量化指标来强化说服力，用数据说话",
            "尝试用STAR法则重新组织你的核心项目经历，确保每个要素都完整",
            "深入思考技术方案背后的设计原理和架构权衡，不止于使用层面",
            "多准备几个技术难点攻坚的案例，充分展示分析和解决问题的能力",
            "注意区分'知道'和'做过'的差别——面试官更看重亲身实践经验",
            "在回答中体现出对行业最佳实践和技术规范的了解",
            "可以刻意练习1-2分钟的简短回答，训练精准表达的能力",
            "建议阅读一些系统设计和架构方面的经典书籍，提升架构思维"
        ),
        "average", List.of(
            "从基础知识开始系统梳理，补齐理论短析后再进行模拟面试练习",
            "多准备几个有代表性的项目案例，每个案例按照STAR法则来组织",
            "每天花30分钟进行模拟问答练习，培养结构化表达的习惯",
            "建议深入学习1-2个核心技术领域的底层原理，提升专业深度",
            "关注大厂技术博客和开源项目，了解行业标准和最佳实践",
            "尝试把你的技术经验用数据和量化指标来总结，如'性能提升了30%'等",
            "录制自己的模拟面试回答然后复盘，找出需要改进的表达习惯",
            "参加技术社区讨论或开源项目贡献，积累真实的技术交流经验"
        ),
        "poor", List.of(
            "建议从零开始系统学习该岗位要求的基础知识体系，先打好地基",
            "多阅读优秀面经和技术博客，了解面试的考察维度和回答标准",
            "找一个有经验的前辈进行模拟面试指导，获取针对性反馈",
            "通过实际做一个完整的项目来积累真实的开发经验和故事素材",
            "每天坚持写学习笔记，不仅记录'是什么'，更要思考'为什么'和'怎么用'",
            "建议参加一些线上培训课程或技术训练营，在专业指导下系统提升"
        )
    );

    // 参考答案池：按面试类型分类
    private static final Map<String, List<String>> referenceAnswerPools = Map.of(
        "technical", List.of(
            "对于{position}的这道题，一个高质量的回答应该包含：\n1. 明确的技术概念定义和核心原理阐述\n2. 结合实际项目中的具体应用场景说明\n3. 与同类技术的横向对比（优缺点、适用场景）\n4. 量化指标或实践数据支撑\n5. 对该技术未来发展趋势的理解{position}{diffHint}",
            "回答这道{position}面试题时，建议采用以下结构：\n- 首先简述核心概念及其技术背景\n- 然后分享一个你亲身经历的相关案例，用STAR法则展开\n- 接下来深入分析关键技术细节和设计决策\n- 最后总结经验和后续优化方向\n记住：讲'你怎么做的'比讲'它是什么'更重要{diffHint}",
            "优秀的技术回答应当层层递进：\n① 先给出简洁准确的定义（30秒内）\n② 用一个实际例子说明（1分钟）\n③ 深入分析原理或源码细节（1-2分钟）\n④ 讨论边界条件、常见坑和应对方案（1分钟）\n⑤ 延伸谈对相关技术生态的理解（30秒）{diffHint}",
            "针对这个{position}相关问题，高分回答的标准：\n• 概念清晰：能用自己的语言解释技术本质，而非背诵定义\n• 实战印证：有具体的项目场景和量化结果\n• 深入思考：能讲出背后的设计哲学和权衡逻辑\n• 视野开阔：了解业界不同做法及各自优劣{diffHint}"
        ),
        "hr", List.of(
            "在回答HR面试问题时，建议遵循以下原则：\n1. 真诚第一：用真实经历和感受说话，避免套话\n2. 结构化：使用STAR法则组织关键经历\n3. 正能量：即使谈到失败或冲突，也要展现从中获得的成长\n4. 匹配度：将你的特质与公司文化和岗位要求自然关联\n5. 具体：用实际例子而非泛泛表述来证明你的观点",
            "HR面的高分回答策略：\n• 准备3-5个可以复用的核心故事（职业选择、团队合作、冲突解决、成就与失败）\n• 每个故事控制2-3分钟，包含情境-行动-结果三要素\n• 展现自我认知的深度：清楚自己的优势、不足和职业规划\n• 体现出你对公司的了解和加入的诚意",
            "回答{position}相关HR题目时要注意：\n- 为什么选择这个方向 → 结合你对行业的理解和个人的兴趣起源\n- 你的优势是什么 → 用具体事例证明，不超过3个核心优势\n- 职业规划 → 要有清晰的时间线和可实现的目标"
        ),
        "stress", List.of(
            "面对压力面试，保持冷静是关键：\n1. 先深呼吸，给自己3秒思考时间再开口\n2. 承认问题的难度但不要逃避——'这确实是一个很好的问题，让我从以下几个方面来回答'\n3. 即使不确定答案，也要展示你的分析框架和解决问题的思路\n4. 保持自信但不自大的态度，对于不懂的内容坦诚说'这个我目前了解不够深入，但我可以谈谈我的理解'\n5. 将压力转化为展示你抗压能力和思维敏捷度的机会",
            "压力面试的回答框架：\n第一步：快速判断问题类型（技术挑战/行为判断/智力题）\n第二步：用2-3句构建回答框架，即使不确定也要先搭结构\n第三步：边回答边调整，展现你的思维过程而非只有结论\n第四步：如果确实无法回答，给出你的学习路径——'虽然我现在不太确定，但我会通过XX方式去弄清楚'"
        ),
        "group", List.of(
            "群面/无领导小组讨论的高分策略：\n1. 开局：快速理解题目，在他人发言时做好笔记\n2. 发言：观点明确，逻辑清晰，用数据和事实支撑\n3. 互动：认真倾听他人观点，在回应时说'我同意XX的观点，同时我想补充...'\n4. 推动：帮助团队聚焦议题，推动讨论向前进展\n5. 总结：在讨论收尾时主动整合各方观点形成共识\n展现的是团队协作能力，而非个人英雄主义",
            "群面中脱颖而出的要点：\n• 质＞量：宁可少说几句有深度的话，也不要喋喋不休\n• 做连接者：善于发现不同观点之间的关联和整合可能性\n• 适时总结：每讨论一段时间后，主动帮大家梳理一下当前进展\n• 关注时间：提醒团队注意时间进度，展现项目管理意识\n• 面对冲突：不站队，而是帮助双方找到共同点和折中方案"
        ),
        "boss", List.of(
            "总监/老板面更关注你的格局和思维方式：\n1. 不只讲技术细节，更要讲技术决策背后的业务思考\n2. 展现你对行业趋势的理解和对公司业务的认知\n3. 回答要体现系统性思维——从单点到体系\n4. 展示你如何平衡技术理想与商业现实\n5. 主动提问有深度的问题，展现你的战略思维",
            "Boss面的回答要点：\n- 每个回答都要回到'为业务创造了什么价值'这条主线上\n- 展现你的成长潜力而非仅仅是当前能力\n- 对于管理类问题，用实际经历而非理论来回答\n- 体现出你对成本、效率、质量三者平衡的理解"
        )
    );

    // ==================== 键盘模式检测库 ====================

    private static final List<String> KEYBOARD_PATTERNS = List.of(
            "asdfgh", "qwerty", "zxcvbn", "asdfghjkl", "qwertyuiop", "hjkl", "fdsa",
            "qazwsx", "wsxedc", "rfvtgb", "yhnujm", "qweasd", "zxcvasdf",
            "123456", "abcdef", "aaaaa", "bbbbb", "abcde", "qwert", "12345",
            "asdfg", "qwer", "zxcv", "poiuy", "lkjhg", "mnbvc", "uiop",
            "wasd", "ddddd", "ccccc", "fffff"
    );

    private static final List<String> COMMON_ENGLISH_WORDS = List.of(
            "the", "is", "are", "was", "can", "has", "and", "for", "not", "but",
            "this", "that", "with", "from", "have", "will", "would", "what", "when",
            "where", "which", "about", "because", "should", "could", "system", "data",
            "code", "test", "user", "service", "server", "client", "design", "project",
            "team", "work", "experience", "develop", "manage", "implement", "solution",
            "problem", "result", "example", "first", "second", "third", "finally",
            "framework", "database", "algorithm", "component", "function"
    );

    // ==================== 术语库 ====================

    private static final List<String> TECHNICAL_TERMS = List.of(
            // 通用技术术语
            "缓存", "分布式", "集群", "负载均衡", "高可用", "高并发", "微服务", "容器化",
            "数据库", "索引", "事务", "锁", "线程", "异步", "消息队列", "RPC",
            "API", "网关", "限流", "熔断", "降级", "幂等", "扩容", "监控",
            "日志", "链路追踪", "CI/CD", "DevOps", "敏捷", "重构", "设计模式", "算法",
            "时间复杂度", "空间复杂度", "单元测试", "集成测试", "压测", "性能优化",
            "JVM", "内存管理", "垃圾回收", "多线程", "并发编程", "IO", "网络编程",
            "Linux", "Shell", "Docker", "Kubernetes", "k8s", "Service Mesh",
            "TCP", "HTTP", "HTTPS", "WebSocket", "DNS", "反向代理", "CDN",
            "SQL", "NoSQL", "Redis", "MySQL", "PostgreSQL", "MongoDB", "Elasticsearch",
            "Spring", "Spring Boot", "Spring Cloud", "MyBatis", "Hibernate", "JPA",
            "RESTful", "GraphQL", "gRPC", "OAuth", "JWT", "SSO",
            "React", "Vue", "Angular", "TypeScript", "Webpack", "Vite", "Node.js",
            "敏捷开发", "Scrum", "Kanban", "站会", "迭代", "Sprint",
            "CAP", "BASE", "ACID", "最终一致性", "强一致性", "分布式事务",
            "安全", "XSS", "CSRF", "SQL注入", "加密", "OAuth2", "零信任"
    );

    private static final List<String> JAVA_TERMS = List.of(
            "Spring", "Spring Boot", "Spring Cloud", "MyBatis", "JVM", "GC", "多线程",
            "线程池", "锁", "volatile", "AOP", "IOC", "DI", "事务", "连接池",
            "Dubbo", "Zookeeper", "Nacos", "Sentinel", "Seata", "RocketMQ", "Kafka",
            "Netty", "CompletableFuture", "Stream", "Lambda", "Optional", "HashMap",
            "ConcurrentHashMap", "ArrayList", "LinkedList", "ThreadLocal", "CountDownLatch",
            "CyclicBarrier", "Semaphore", "CAS", "synchronized", "ReentrantLock"
    );

    private static final List<String> FRONTEND_TERMS = List.of(
            "React", "Vue", "Angular", "TypeScript", "JavaScript", "ES6", "CSS", "HTML",
            "Webpack", "Vite", "Babel", "ESLint", "Prettier", "SSR", "CSR", "SSG",
            "DOM", "Virtual DOM", "Fiber", "Hooks", "Redux", "MobX", "Zustand", "Pinia",
            "Tailwind", "Sass", "Less", "PostCSS", "响应式", "Flexbox", "Grid",
            "WebSocket", "PWA", "SPA", "MPA", "微前端", "组件化"
    );
}
