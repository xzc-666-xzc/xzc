package com.interview.ai.controller;

import com.interview.ai.service.LlmService;
import com.interview.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@Tag(name = "DeepSeek Chat", description = "DeepSeek 通用对话接口")
@RestController
@RequestMapping("/ai/chat")
@RequiredArgsConstructor
public class ChatController {

    private final LlmService llmService;

    @Operation(summary = "通用对话补全")
    @PostMapping("/completions")
    public Mono<R<String>> chat(@RequestBody Map<String, Object> body) {
        String message = (String) body.getOrDefault("message", "");
        String systemPrompt = (String) body.getOrDefault("systemPrompt",
                "你是一个专业的面试助手，请用中文回答。");

        return llmService.chat(message, systemPrompt)
                .map(R::ok)
                .defaultIfEmpty(R.fail("AI 调用失败"));
    }
}
