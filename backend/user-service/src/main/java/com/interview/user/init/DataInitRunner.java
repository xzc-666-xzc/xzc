package com.interview.user.init;

import cn.hutool.crypto.digest.BCrypt;
import com.interview.common.entity.User;
import com.interview.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitRunner implements CommandLineRunner {

    private final UserService userService;

    @Override
    public void run(String... args) {
        final String defaultPwd = BCrypt.hashpw("06210726", BCrypt.gensalt());

        // 管理员
        if (!userService.existsByUsername("Gxzc")) {
            User admin = new User();
            admin.setUsername("Gxzc");
            admin.setPassword(defaultPwd);
            admin.setEmail("Gxzc@interview.com");
            admin.setRole("admin");
            admin.setStatus(1);
            admin.setInterviewStyle("friendly");
            admin.setVoiceSpeed("normal");
            userService.save(admin);
            log.info("默认管理员已创建: username=Gxzc");
        }

        // HR
        if (!userService.existsByUsername("Hxzc")) {
            User hr = new User();
            hr.setUsername("Hxzc");
            hr.setPassword(defaultPwd);
            hr.setEmail("Hxzc@interview.com");
            hr.setRole("hr");
            hr.setStatus(1);
            hr.setInterviewStyle("friendly");
            hr.setVoiceSpeed("normal");
            userService.save(hr);
            log.info("默认HR已创建: username=Hxzc");
        }

        // 普通用户
        if (!userService.existsByUsername("Xxzc")) {
            User candidate = new User();
            candidate.setUsername("Xxzc");
            candidate.setPassword(defaultPwd);
            candidate.setEmail("Xxzc@interview.com");
            candidate.setRole("candidate");
            candidate.setStatus(1);
            candidate.setInterviewStyle("friendly");
            candidate.setVoiceSpeed("normal");
            userService.save(candidate);
            log.info("默认求职者已创建: username=Xxzc");
        }

        log.info("默认账号初始化完成 — 密码均为 06210726");
    }
}
