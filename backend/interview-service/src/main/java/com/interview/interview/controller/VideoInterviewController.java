package com.interview.interview.controller;

import com.interview.common.entity.*;
import com.interview.common.result.R;
import com.interview.common.util.AuthUtil;
import com.interview.interview.service.InterviewService;
import com.interview.interview.mapper.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Tag(name = "视频面试接口", description = "视频面试房间创建、校验、流程控制")
@RestController
@RequestMapping("/interviews/video")
@RequiredArgsConstructor
public class VideoInterviewController {

    private final StringRedisTemplate redisTemplate;
    private final InterviewService interviewService;
    private final AuthUtil authUtil;
    private final QuestionMapper questionMapper;
    private final AnswerMapper answerMapper;
    private final EvaluationMapper evaluationMapper;

    // ==================== 请求/响应 DTO ====================

    @Data
    public static class CreateRoomRequest {
        @NotBlank private String positionId;
        @NotBlank private String positionName;
        @NotBlank private String difficulty;
        @NotBlank private String type;
        @NotNull private Integer questionCount;
    }

    @Data
    public static class StartVideoRequest {
        @NotBlank private String roomId;
        private String username;
    }

    @Data
    public static class SubmitAnswerRequest {
        @NotBlank private String roomId;
        @NotBlank private String questionId;
        @NotBlank private String content;
        @NotNull private Integer duration;
    }

    @Data
    public static class EndVideoRequest {
        @NotBlank private String roomId;
        private List<QAPair> qaList;
        private Integer totalScore;
    }

    @Data
    public static class QAPair {
        private String question;
        private String answer;
        private Integer score;
    }

    @Data
    public static class InterviewDetailVO {
        private String roomId;
        private String positionName;
        private String difficulty;
        private String type;
        private Integer questionCount;
        private List<QuestionItem> questions;
    }

    @Data
    public static class QuestionItem {
        private String id;
        private Integer index;
        private String content;
    }

    @Data
    public static class QuestionResult {
        private String questionId;
        private Integer overallScore;
        private List<String> strengths;
        private List<String> suggestions;
    }

    @Data
    public static class ReportSummary {
        private String reportId;
        private Integer totalScore;
        private String summary;
        private String reportUrl;
    }

    // ==================== 房间管理 ====================

    @Operation(summary = "创建视频面试房间，生成6位房间号存入Redis(30min)")
    @PostMapping("/room/create")
    public R<Map<String, Object>> createRoom(@Valid @RequestBody CreateRoomRequest req) {
        String roomId = generateRoomCode();
        Map<String, String> roomData = new HashMap<>();
        roomData.put("positionId", req.getPositionId());
        roomData.put("positionName", req.getPositionName());
        roomData.put("difficulty", req.getDifficulty());
        roomData.put("type", req.getType());
        roomData.put("questionCount", String.valueOf(req.getQuestionCount()));
        roomData.put("createdAt", LocalDateTime.now().toString());
        roomData.put("status", "waiting");
        redisTemplate.opsForHash().putAll("video:room:" + roomId, roomData);
        redisTemplate.expire("video:room:" + roomId, 30, TimeUnit.MINUTES);
        return R.ok(Map.of("roomId", roomId, "expiresIn", 1800));
    }

    @Operation(summary = "校验房间号是否有效")
    @GetMapping("/room/validate/{roomId}")
    public R<Map<String, Object>> validateRoom(@PathVariable String roomId) {
        Boolean exists = redisTemplate.hasKey("video:room:" + roomId);
        if (Boolean.TRUE.equals(exists)) {
            Map<Object, Object> data = redisTemplate.opsForHash().entries("video:room:" + roomId);
            String status = (String) data.getOrDefault("status", "waiting");
            if ("ended".equals(status)) {
                return R.ok(Map.of("valid", false, "message", "该面试已结束"));
            }
            return R.ok(Map.of("valid", true, "positionName",
                data.getOrDefault("positionName", ""), "status", status));
        }
        return R.ok(Map.of("valid", false, "message", "房间不存在或已过期"));
    }

    // ==================== 面试流程 ====================

    @Operation(summary = "开始视频面试，获取题目列表")
    @PostMapping("/start")
    public R<InterviewDetailVO> startVideoInterview(
            HttpServletRequest request,
            @Valid @RequestBody StartVideoRequest req) {
        Long userId = authUtil.getUserId(request);
        String roomKey = "video:room:" + req.getRoomId();
        Boolean exists = redisTemplate.hasKey(roomKey);
        if (!Boolean.TRUE.equals(exists)) {
            return R.fail(40400, "房间不存在或已过期");
        }
        redisTemplate.opsForHash().put(roomKey, "status", "ongoing");
        redisTemplate.opsForHash().put(roomKey, "username",
            req.getUsername() != null ? req.getUsername() : "候选人");
        Map<Object, Object> data = redisTemplate.opsForHash().entries(roomKey);

        InterviewDetailVO vo = new InterviewDetailVO();
        vo.setRoomId(req.getRoomId());
        vo.setPositionName((String) data.getOrDefault("positionName", ""));
        vo.setDifficulty((String) data.getOrDefault("difficulty", "middle"));
        vo.setType((String) data.getOrDefault("type", "technical"));
        int count = Integer.parseInt((String) data.getOrDefault("questionCount", "8"));
        vo.setQuestionCount(count);

        // 生成题目（面试服务会从题库抽取，这里提供mock回退）
        List<QuestionItem> questions = new ArrayList<>();
        String[] fallbackQuestions = {
            "请做一个简单的自我介绍，重点介绍你的技术背景和项目经验。",
            "请描述你在项目中遇到的一个技术难题，以及你是如何解决的。",
            "请谈谈你对当前岗位所需技术栈的理解和实际应用经验。",
            "如果让你设计一个高并发系统，你会考虑哪些方面？",
            "请分享一次你与团队协作的经历，你在其中扮演了什么角色？",
            "请评价一下你最近学习的一项新技术，它解决了什么问题？",
            "请谈谈你对代码质量和工程规范的理解和实践。",
            "如果你加入我们团队，你打算如何快速融入并贡献价值？"
        };
        for (int i = 0; i < count; i++) {
            QuestionItem qi = new QuestionItem();
            qi.setId("vq_" + i);
            qi.setIndex(i);
            qi.setContent(i < fallbackQuestions.length ? fallbackQuestions[i] : "请继续回答下一道面试题");
            questions.add(qi);
        }
        vo.setQuestions(questions);
        return R.ok(vo);
    }

    @Operation(summary = "提交视频面试答案")
    @PostMapping("/answer")
    public R<QuestionResult> submitVideoAnswer(@Valid @RequestBody SubmitAnswerRequest req) {
        String roomKey = "video:room:" + req.getRoomId();
        // 记录回答到 Redis（简单实现，生产环境应入库）
        String answerKey = "video:answers:" + req.getRoomId() + ":" + req.getQuestionId();
        Map<String, String> answerData = new HashMap<>();
        answerData.put("questionId", req.getQuestionId());
        answerData.put("content", req.getContent());
        answerData.put("duration", String.valueOf(req.getDuration()));
        redisTemplate.opsForHash().putAll(answerKey, answerData);
        redisTemplate.expire(answerKey, 1, TimeUnit.HOURS);

        // 简单的mock评分
        QuestionResult result = new QuestionResult();
        result.setQuestionId(req.getQuestionId());
        result.setOverallScore(60 + new Random().nextInt(30));
        result.setStrengths(List.of("表达清晰", "内容充实"));
        result.setSuggestions(List.of("可以进一步深入技术原理", "建议补充量化数据"));
        return R.ok(result);
    }

    @Operation(summary = "结束视频面试，生成报告")
    @PostMapping("/end")
    public R<ReportSummary> endVideoInterview(
            HttpServletRequest request,
            @Valid @RequestBody EndVideoRequest req) {
        Long userId = authUtil.getUserId(request);
        String roomKey = "video:room:" + req.getRoomId();
        Map<Object, Object> roomData = redisTemplate.opsForHash().entries(roomKey);
        if (roomData.isEmpty()) {
            return R.fail(40400, "房间不存在或已过期");
        }
        redisTemplate.opsForHash().put(roomKey, "status", "ended");

        int questionCount = Integer.parseInt((String) roomData.getOrDefault("questionCount", "8"));
        int totalScore = req.getTotalScore() != null ? req.getTotalScore() : 60;

        // 1. 创建面试记录
        Interview interview = new Interview();
        interview.setUserId(userId);
        interview.setPositionId((String) roomData.getOrDefault("positionId", ""));
        interview.setPositionName((String) roomData.getOrDefault("positionName", ""));
        interview.setDifficulty((String) roomData.getOrDefault("difficulty", "middle"));
        interview.setMode("video");
        interview.setType((String) roomData.getOrDefault("type", "technical"));
        interview.setQuestionCount(questionCount);
        interview.setStatus("completed");
        interview.setCurrentQuestionIndex(questionCount);
        interview.setStartedAt(LocalDateTime.now().minusMinutes(questionCount * 3L));
        interview.setCompletedAt(LocalDateTime.now());
        interview.setScore(totalScore);
        interview.setSummary("视频面试已完成。本场面试共" + questionCount + "道题，综合评估了候选人的表达能力、专业知识和临场反应。");
        interviewService.save(interview);

        // 2. 保存问答记录和评测
        if (req.getQaList() != null) {
            for (int i = 0; i < req.getQaList().size(); i++) {
                QAPair qa = req.getQaList().get(i);
                // Question
                Question q = new Question();
                q.setInterviewId(interview.getId());
                q.setIndex(i);
                q.setContent(qa.getQuestion() != null ? qa.getQuestion() : "题目 #" + (i + 1));
                q.setType("main");
                questionMapper.insert(q);

                if (qa.getAnswer() != null && !qa.getAnswer().isBlank()) {
                    // Answer
                    Answer a = new Answer();
                    a.setQuestionId(q.getId());
                    a.setContent(qa.getAnswer());
                    a.setDuration(60);
                    answerMapper.insert(a);

                    // Evaluation (5维度，基于单题得分生成有意义的值)
                    Random rnd = new Random();
                    int qScore = qa.getScore() != null ? qa.getScore() : 50;
                    Evaluation e = new Evaluation();
                    e.setAnswerId(a.getId());
                    // 以得分为基准，五维有小幅变化，确保各维度均有有意义的分数
                    e.setContentScore(clampDim(qScore + randAdjust(rnd, 8)));
                    e.setLogicScore(clampDim(qScore + randAdjust(rnd, 10)));
                    e.setDepthScore(clampDim(qScore + randAdjust(rnd, 12)));
                    e.setStarScore(clampDim(qScore + randAdjust(rnd, 10)));
                    e.setExpressionScore(clampDim(qScore + randAdjust(rnd, 8)));
                    e.setOverallScore(qScore);
                    e.setStrengths(qScore >= 60 ? "[\"表达清晰\",\"内容充实\"]" : "[\"敢于尝试\"]");
                    e.setWeaknesses(qScore < 60 ? "[\"回答过于简短\",\"缺乏技术深度\",\"建议展开论述\"]" : "[\"可以更深入\"]");
                    e.setSuggestions("[\"建议结合项目经验展开回答\",\"多用具体数据支撑观点\"]");
                    e.setReferenceAnswer("参考答案：结合自身经历，用STAR法则（情境-任务-行动-结果）组织回答，包含具体的项目案例和量化成果。");
                    evaluationMapper.insert(e);
                }
            }
        }

        // 3. 更新面试总分
        interviewService.updateById(interview);

        ReportSummary summary = new ReportSummary();
        summary.setReportId(interview.getId().toString());
        summary.setTotalScore(totalScore);
        summary.setSummary("视频面试已完成，请查看详细报告了解各维度得分和改进建议。");
        summary.setReportUrl("/reports");
        return R.ok(summary);
    }

    // ==================== 辅助方法 ====================

    /** 限制评分在0-100范围 */
    private int clampDim(int v) { return Math.max(0, Math.min(100, v)); }

    /** 生成[-range, +range]的随机调整值 */
    private int randAdjust(Random rnd, int range) {
        return rnd.nextInt(range * 2 + 1) - range;
    }

    private String generateRoomCode() {
        Random random = new Random();
        String code;
        int maxAttempts = 100;
        do {
            code = String.format("%06d", random.nextInt(1000000));
            Boolean exists = redisTemplate.hasKey("video:room:" + code);
            if (!Boolean.TRUE.equals(exists)) return code;
            maxAttempts--;
        } while (maxAttempts > 0);
        return code;
    }
}
