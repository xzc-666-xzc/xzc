package com.interview.user.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 静态文件访问控制器 — 提供上传附件的访问
 */
@Tag(name = "文件访问", description = "上传附件的静态资源访问")
@RestController
@RequestMapping("/files")
public class FileController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Operation(summary = "访问上传文件")
    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(@RequestParam(required = false) String path,
                                               jakarta.servlet.http.HttpServletRequest request) {
        // 从完整请求路径中提取文件相对路径
        String fullPath = request.getRequestURI();
        String filePath = fullPath.substring(fullPath.indexOf("/files/") + 7);

        try {
            Path file = Paths.get(uploadDir, filePath).normalize();

            // 安全检查：防止路径穿越
            if (!file.startsWith(Paths.get(uploadDir).normalize())) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                // 根据扩展名猜测 Content-Type
                String contentType = determineContentType(filePath);
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getFileName() + "\"")
                    .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String determineContentType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".bmp")) return "image/bmp";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".ogg")) return "video/ogg";
        if (lower.endsWith(".mov")) return "video/quicktime";
        return "application/octet-stream";
    }
}
