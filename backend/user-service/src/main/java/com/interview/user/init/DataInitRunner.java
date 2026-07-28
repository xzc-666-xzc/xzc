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
        if (!userService.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(BCrypt.hashpw("admin123", BCrypt.gensalt()));
            admin.setEmail("admin@interview.com");
            admin.setRole("admin");
            admin.setStatus(1);
            admin.setInterviewStyle("friendly");
            admin.setVoiceSpeed("normal");
            userService.save(admin);
            log.info("默认管理员账号已创建: username=admin, password=admin123");
        }

        if (!userService.existsByUsername("demo")) {
            User demo = new User();
            demo.setUsername("demo");
            demo.setPassword(BCrypt.hashpw("demo123", BCrypt.gensalt()));
            demo.setEmail("demo@interview.com");
            demo.setRole("candidate");
            demo.setStatus(1);
            demo.setInterviewStyle("friendly");
            demo.setVoiceSpeed("normal");
            userService.save(demo);
            log.info("默认测试用户已创建: username=demo, password=demo123");
        }
    }
}