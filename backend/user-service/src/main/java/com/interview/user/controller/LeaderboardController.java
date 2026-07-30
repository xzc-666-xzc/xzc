package com.interview.user.controller;

import com.interview.common.result.R;
import com.interview.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "排行榜接口", description = "求职者面试成绩排行榜")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class LeaderboardController {

    private final UserService userService;

    @Operation(summary = "获取排行榜")
    @GetMapping("/leaderboard")
    public R<List<Map<String, Object>>> getLeaderboard() {
        List<Map<String, Object>> leaderboard = userService.getLeaderboard();
        return R.ok(leaderboard);
    }
}
