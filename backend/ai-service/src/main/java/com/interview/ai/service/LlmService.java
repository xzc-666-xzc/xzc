package com.interview.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class LlmService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.llm.api-key:}")
    private String apiKey;

    @Value("${ai.llm.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${ai.llm.model:deepseek-chat}")
    private String model;

    @Value("${ai.llm.temperature:0.7}")
    private double defaultTemperature;

    @Value("${ai.llm.max-tokens:2048}")
    private int maxTokens;

    public LlmService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder().build();
    }

    /**
     * 调用LLM生成面试题目
     */
    public Mono<String> generateQuestion(String positionName, String difficulty,
                                          String type, int questionIndex,
                                          String previousConversation) {
        String prompt = buildQuestionPrompt(positionName, difficulty, type,
                questionIndex, previousConversation);

        return callLlm(prompt, "你是一位资深的" + positionName + "面试官。", 0.7);
    }

    /**
     * 调用LLM评估回答
     */
    public Mono<String> evaluateAnswer(String question, String answer,
                                        String positionName, String difficulty) {
        String prompt = buildEvaluatePrompt(question, answer, positionName, difficulty);

        return callLlm(prompt,
                "你是一位面试评测专家，擅长从多个维度分析面试回答质量。请以JSON格式输出评测结果。",
                0.3);
    }

    /**
     * 调用LLM生成追问
     */
    public Mono<String> generateFollowUp(String question, String answer,
                                          String positionName) {
        String prompt = buildFollowUpPrompt(question, answer, positionName);

        return callLlm(prompt,
                "你是一位犀利的面试官，善于从回答中发现漏洞并进行深度追问。",
                0.8);
    }

    /**
     * 通用对话（DeepSeek Chat）
     */
    public Mono<String> chat(String message, String systemPrompt) {
        return callLlm(message, systemPrompt, defaultTemperature);
    }

    /**
     * 通用LLM调用方法
     */
    private Mono<String> callLlm(String prompt, String systemPrompt, double temperature) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("AI API密钥未配置，使用模拟回复");
            return Mono.just("{}");
        }

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", temperature,
                "max_tokens", maxTokens
        );

        return webClient.post()
                .uri(baseUrl + "/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> {
                    try {
                        JsonNode node = objectMapper.readTree(response);
                        return node.path("choices").get(0)
                                .path("message").path("content").asText();
                    } catch (Exception e) {
                        log.error("解析LLM响应失败", e);
                        return "";
                    }
                })
                .onErrorResume(e -> {
                    log.error("LLM调用失败", e);
                    return Mono.just("");
                });
    }

    // ========== Prompt 构建方法 ==========

    private String buildQuestionPrompt(String position, String difficulty, String type,
                                        int index, String conversation) {
        return String.format("""
                你正在面试一位应聘【%s】岗位的候选人，难度等级为【%s】。
                这是第%d道题。面试类型为【%s】。

                之前的对话历史：
                %s

                请根据以上信息：
                1. 生成一道合适的面试题目
                2. 题目应循序渐進，体现当前难度的考察深度
                3. 如果是技术面，侧重专业知识；如果是HR面，侧重综合素质

                请直接输出题目内容，不要有其他描述。
                """, position, difficulty, index + 1, type, conversation);
    }

    private String buildEvaluatePrompt(String question, String answer,
                                        String position, String difficulty) {
        return String.format("""
                请对以下面试回答进行多维度评测：

                【岗位】%s
                【难度】%s
                【题目】%s
                【候选人回答】%s

                请从以下5个维度分别打分（0-100分）：
                1. contentScore: 内容准确性 - 回答是否正确、专业，技术点是否全面
                2. logicScore: 逻辑条理性 - 表达是否清晰有条理，论证是否层层递进
                3. depthScore: 专业深度 - 是否深入理解原理，能从源码/架构层面分析
                4. starScore: STAR法则 - 是否结构化表达（情境-任务-行动-结果）
                5. expressionScore: 表达沟通 - 语言表达是否流畅自然、自信得体

                【评分标准】
                - 95-100分：完美回答——内容全面准确、有深度、有量化数据、结构完整、表达精炼。只有真正无可挑剔的回答才给这个分数。
                - 85-94分：优秀——核心内容正确、有较好的深度和结构，但有少量瑕疵或遗漏。
                - 70-84分：良好——主要内容正确、有一定结构，但深度不足或缺少量化支撑。
                - 50-69分：一般——基本概念大致正确但表述笼统、结构松散、缺乏深度。
                - 25-49分：较差——内容明显不足、关键概念有误、逻辑混乱。
                - 0-24分：极差——几乎没有实质内容、完全答非所问、或核心知识点全部错误。

                【评语要求】
                - strengths: 至少3条具体的优点，要指出回答中具体哪里做得好，不要泛泛而谈
                - weaknesses: 至少3条真实的问题，要明确指出回答中缺了什么、哪里不对，语气真诚但建设性
                - suggestions: 至少3条可落地的改进建议，告诉候选人下次遇到类似问题具体该怎么做
                - referenceAnswer: 一段200-400字的高质量参考答案，体现该岗位%s级别的应有水平

                【重要原则】
                - 严格打分，不要手软——回答差就是差，可以给0分
                - 评语要具体、个性化，像真人面试官写的，不要模板化
                - 建议要有可操作性，不是"多学习多练习"这种空话

                请以JSON格式返回：
                {
                    "contentScore": 85,
                    "logicScore": 80,
                    "depthScore": 75,
                    "starScore": 82,
                    "expressionScore": 88,
                    "overallScore": 82,
                    "strengths": ["具体优点1", "具体优点2", "具体优点3"],
                    "weaknesses": ["具体不足1", "具体不足2", "具体不足3"],
                    "suggestions": ["可行建议1", "可行建议2", "可行建议3"],
                    "referenceAnswer": "高质量的参考答案"
                }

                只返回JSON，不要有其他内容。
                """, position, difficulty, question, answer, difficulty);
    }

    private String buildFollowUpPrompt(String question, String answer, String position) {
        return String.format("""
                你是一位【%s】面试官，候选人对以下问题的回答深度不足，需要追问。

                【原问题】%s
                【候选人回答】%s

                请生成一个犀利的追问，要求：
                1. 针对回答中的薄弱点进行深挖
                2. 保持面试的专业性和建设性
                3. 追问应给候选人施加适度压力

                请直接输出追问内容。
                """, position, question, answer);
    }
}
