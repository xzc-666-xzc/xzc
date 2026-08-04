package com.interview.user.service;

import com.interview.common.entity.WorkOrderAttachment;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import com.interview.user.mapper.WorkOrderAttachmentMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

/**
 * 文件存储服务
 * - 开发/Docker环境：本地文件系统存储（挂载卷）
 * - 生产环境：配置 OSS 后可切换为阿里云 OSS
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OssService {

    private final WorkOrderAttachmentMapper attachmentMapper;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.url-prefix:/api/files}")
    private String urlPrefix;

    // 允许的图片类型
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"
    );

    // 允许的视频类型
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
        "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    );

    // 文件大小限制
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10MB
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100MB

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            log.info("文件上传目录已初始化: {}", Paths.get(uploadDir).toAbsolutePath());
        } catch (IOException e) {
            log.error("无法创建上传目录: {}", uploadDir, e);
        }
    }

    /**
     * 上传附件
     */
    public WorkOrderAttachment uploadAttachment(MultipartFile file,
                                                  Long orderId,
                                                  Long uploaderId) {
        // 1. 校验
        validateFile(file);

        // 2. 确定文件类型
        String fileType = determineFileType(file.getContentType());

        // 3. 生成存储路径
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String originalName = file.getOriginalFilename();
        String ext = getFileExtension(originalName);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String relativePath = String.format("work-orders/%d/%s/%s.%s",
            orderId, date, uuid, ext);

        // 4. 保存到本地文件系统
        Path targetPath = Paths.get(uploadDir, relativePath);
        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("文件已保存: {}", targetPath.toAbsolutePath());
        } catch (IOException e) {
            log.error("文件保存失败: {}", targetPath, e);
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "文件上传失败，请稍后重试");
        }

        // 5. 生成访问 URL
        String fileUrl = urlPrefix + "/" + relativePath;

        // 6. 保存附件记录
        WorkOrderAttachment attachment = new WorkOrderAttachment();
        attachment.setOrderId(orderId);
        attachment.setFileName(originalName);
        attachment.setFileType(fileType);
        attachment.setFileSize(file.getSize());
        attachment.setFileUrl(fileUrl);
        attachment.setFileKey(relativePath);
        attachment.setMimeType(file.getContentType());
        attachment.setUploaderId(uploaderId);
        attachment.setThumbnailUrl(fileType.equals("IMAGE") ? fileUrl : null);

        attachmentMapper.insert(attachment);
        return attachment;
    }

    /**
     * 删除附件
     */
    public void deleteAttachment(Long attachmentId, Long operatorId) {
        WorkOrderAttachment attachment = attachmentMapper.selectById(attachmentId);
        if (attachment == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "附件不存在");
        }
        if (!attachment.getUploaderId().equals(operatorId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能删除自己上传的附件");
        }

        // 从文件系统删除
        try {
            Path filePath = Paths.get(uploadDir, attachment.getFileKey());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("文件删除失败（已忽略）: {}", attachment.getFileKey(), e);
        }

        // 从数据库删除
        attachmentMapper.deleteById(attachmentId);
    }

    // ==================== 私有辅助方法 ====================

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "文件不能为空");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "无法识别文件类型");
        }

        boolean isImage = ALLOWED_IMAGE_TYPES.contains(contentType);
        boolean isVideo = ALLOWED_VIDEO_TYPES.contains(contentType);

        if (!isImage && !isVideo) {
            throw new BusinessException(ResultCode.BAD_REQUEST,
                "不支持的文件类型（支持：JPEG/PNG/GIF/WebP/BMP/MP4/WebM/OGG/MOV）");
        }

        long maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (file.getSize() > maxSize) {
            String limit = isImage ? "10MB" : "100MB";
            throw new BusinessException(ResultCode.BAD_REQUEST,
                "文件大小超过限制（" + (isImage ? "图片" : "视频") + "最大 " + limit + "）");
        }
    }

    private String determineFileType(String contentType) {
        if (ALLOWED_IMAGE_TYPES.contains(contentType)) return "IMAGE";
        if (ALLOWED_VIDEO_TYPES.contains(contentType)) return "VIDEO";
        return "FILE";
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "bin";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
