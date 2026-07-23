package com.interview.ai.controller;

import com.interview.ai.service.LlmService;
import com.interview.ai.service.AsrService;
import com.interview.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.Map;

@Tag(name = "AI接口", description = "LLM生成题目、评测、ASR语音识别")
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final LlmService llmService;
    private final AsrService asrService;

    @Operation(summary = "生成面试题目")
    @PostMapping("/generate-question")
    public Mono<R<String>> generateQuestion(@RequestBody Map<String, Object> body) {
        String position = (String) body.getOrDefault("positionName", "Java开发");
        String difficulty = (String) body.getOrDefault("difficulty", "middle");
        String type = (String) body.getOrDefault("type", "technical");
        int index = (int) body.getOrDefault("questionIndex", 0);
        String conversation = (String) body.getOrDefault("conversation", "");

        return llmService.generateQuestion(position, difficulty, type, index, conversation)
                .map(R::ok)
                .defaultIfEmpty(R.fail("AI生成题目失败"));
    }

    @Operation(summary = "评估回答")
    @PostMapping("/evaluate")
    public Mono<R<String>> evaluateAnswer(@RequestBody Map<String, Object> body) {
        String question = (String) body.get("question");
        String answer = (String) body.get("answer");
        String position = (String) body.getOrDefault("positionName", "Java开发");
        String difficulty = (String) body.getOrDefault("difficulty", "middle");

        return llmService.evaluateAnswer(question, answer, position, difficulty)
                .map(R::ok)
                .defaultIfEmpty(R.fail("AI评估失败"));
    }

    @Operation(summary = "生成追问")
    @PostMapping("/follow-up")
    public Mono<R<String>> followUp(@RequestBody Map<String, Object> body) {
        String question = (String) body.get("question");
        String answer = (String) body.get("answer");
        String position = (String) body.getOrDefault("positionName", "Java开发");

        return llmService.generateFollowUp(question, answer, position)
                .map(R::ok)
                .defaultIfEmpty(R.fail("AI生成追问失败"));
    }

    @Operation(summary = "获取ASR临时Token")
    @PostMapping("/asr-token")
    public R<Map<String, String>> getAsrToken() {
        return R.ok(Map.of("token", asrService.getToken()));
    }

    @Operation(summary = "上传音频进行语音识别")
    @PostMapping("/speech-to-text")
    public R<Map<String, Object>> speechToText(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = asrService.speechToText(file);
        return R.ok(result);
    }
}
