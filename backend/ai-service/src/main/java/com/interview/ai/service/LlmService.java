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

    @Value("${ai.llm.model:gpt-4o}")
    private String model;

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
                "max_tokens", 2000
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

                请从以下5个维度分别打分（0-100分）并给出评价：
                1. contentScore: 内容准确性 - 回答是否正确、专业
                2. logicScore: 逻辑条理性 - 表达是否清晰有条理
                3. depthScore: 专业深度 - 是否深入理解原理
                4. starScore: STAR法则 - 是否结构化表达
                5. expressionScore: 表达沟通 - 语言表达是否流畅得体

                请以JSON格式返回：
                {
                    "contentScore": 85,
                    "logicScore": 80,
                    "depthScore": 75,
                    "starScore": 82,
                    "expressionScore": 88,
                    "overallScore": 82,
                    "strengths": ["优点1", "优点2"],
                    "weaknesses": ["不足1", "不足2"],
                    "suggestions": ["建议1", "建议2"],
                    "referenceAnswer": "高分参考答案"
                }
                """, position, difficulty, question, answer);
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
