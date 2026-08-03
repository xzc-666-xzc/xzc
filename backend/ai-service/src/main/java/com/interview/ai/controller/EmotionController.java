package com.interview.ai.controller;

import com.interview.common.result.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@Tag(name = "情绪分析接口", description = "视频面试面部情绪分析 (Mock)")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class EmotionController {

    private static final List<String> EMOTIONS = List.of(
        "neutral", "happy", "focused", "nervous", "confident", "thinking"
    );
    private static final Random RND = new Random();

    @Data
    public static class EmotionRequest {
        @NotBlank private String imageBase64;
        private String roomId;
    }

    @Data
    public static class EmotionResult {
        private String emotion;
        private double confidence;
        private String timestamp;
    }

    @Operation(summary = "分析视频帧面部情绪 (Mock)")
    @PostMapping("/emotion")
    public R<EmotionResult> analyzeEmotion(@Valid @RequestBody EmotionRequest req) {
        EmotionResult result = new EmotionResult();
        result.setEmotion(EMOTIONS.get(RND.nextInt(EMOTIONS.size())));
        result.setConfidence(Math.round((0.5 + RND.nextDouble() * 0.45) * 100.0) / 100.0);
        result.setTimestamp(java.time.LocalDateTime.now().toString());
        return R.ok(result);
    }
}
