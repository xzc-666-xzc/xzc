package com.interview.common.exception;

import com.interview.common.result.R;
import com.interview.common.result.ResultCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * <p>
 * 统一处理所有 Controller 层抛出的异常，返回标准的 {@link R} 格式 JSON 响应。
 * 位于 common 模块，被所有微服务共享。
 *
 * <h3>处理的异常类型</h3>
 * <ul>
 *   <li>{@link BindException} — @Valid 在 Controller 方法参数上校验失败</li>
 *   <li>{@link MethodArgumentNotValidException} — @Valid 在 @RequestBody 上校验失败</li>
 *   <li>{@link HttpMessageNotReadableException} — 请求体 JSON 格式错误</li>
 *   <li>{@link BusinessException} — 业务异常，根据 code 映射 HTTP 状态</li>
 *   <li>{@link Exception} — 未知异常，返回 500</li>
 * </ul>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ==================== 参数校验异常 ====================

    /**
     * @Valid + @RequestBody 校验失败（对应 @RequestBody 的 DTO）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public R<Void> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        List<R.FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(f -> R.FieldError.of(f.getField(), f.getDefaultMessage()))
                .collect(Collectors.toList());
        log.warn("参数校验失败(MethodArgumentNotValid): {}", errors);
        return R.validationFailed(errors);
    }

    /**
     * @Valid 在 Controller 方法参数上校验失败（对应 @RequestParam / @PathVariable 上的校验）
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public R<Void> handleBindException(BindException e) {
        List<R.FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(f -> R.FieldError.of(f.getField(), f.getDefaultMessage()))
                .collect(Collectors.toList());
        log.warn("参数校验失败(Bind): {}", errors);
        return R.validationFailed(errors);
    }

    // ==================== 请求体格式异常 ====================

    /**
     * 请求体 JSON 格式错误 / 类型不匹配
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public R<Void> handleHttpMessageNotReadable(HttpMessageNotReadableException e) {
        log.warn("请求体格式错误: {}", e.getMessage());
        return R.fail(ResultCode.REQUEST_BODY_ERROR, "请求体格式错误，请检查JSON格式");
    }

    // ==================== 业务异常 ====================

    /**
     * 业务异常 —— 根据业务码动态设置 HTTP 状态码
     * <p>
     * 映射规则：
     * <ul>
     *   <li>40100/40101 → HTTP 401</li>
     *   <li>40300 → HTTP 403</li>
     *   <li>40400 → HTTP 404</li>
     *   <li>40900 → HTTP 409</li>
     *   <li>40000-49999 其他 → HTTP 400</li>
     *   <li>其他 → HTTP 500</li>
     * </ul>
     */
    @ExceptionHandler(BusinessException.class)
    public R<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常 [code={}]: {}", e.getCode(), e.getMessage());

        HttpStatus httpStatus = mapHttpStatus(e.getCode());
        // 通过修改 response 的 HTTP 状态码（不是通过 @ResponseStatus）
        // 由于 @RestControllerAdvice 的 handler 返回 ResponseEntity 可以控制状态码
        return createResponseWithStatus(httpStatus, R.fail(e.getCode(), e.getMessage()));
    }

    // ==================== 未知异常 ====================

    /**
     * 未知异常 —— 兜底处理
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public R<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return R.fail(ResultCode.INTERNAL_ERROR);
    }

    // ==================== 辅助方法 ====================

    /**
     * 根据业务码映射 HTTP 状态码
     */
    private HttpStatus mapHttpStatus(int businessCode) {
        if (businessCode >= 40000 && businessCode < 50000) {
            // 客户端错误，根据前两位精确映射
            int httpClass = businessCode / 100;   // e.g. 401, 403, 404
            return switch (httpClass) {
                case 401 -> HttpStatus.UNAUTHORIZED;
                case 403 -> HttpStatus.FORBIDDEN;
                case 404 -> HttpStatus.NOT_FOUND;
                case 409 -> HttpStatus.CONFLICT;
                case 429 -> HttpStatus.TOO_MANY_REQUESTS;
                default -> HttpStatus.BAD_REQUEST;
            };
        }
        if (businessCode >= 50000 && businessCode < 60000) {
            if (businessCode == 50300) {
                return HttpStatus.SERVICE_UNAVAILABLE;
            }
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
        // 2xxxx 成功码不应作为异常抛出，但兜底返回 200
        return HttpStatus.OK;
    }

    /**
     * 创建带 HTTP 状态码的响应
     * <p>
     * 注意：Spring 的 @RestControllerAdvice 中，直接返回 R<T> 时会受 @ResponseStatus 控制。
     * 此处通过实际映射让 ExceptionHandler 的返回值能影响 HTTP 状态码。
     * 使用方式：直接通过 R 的字段控制，前端读取 response.status
     */
    @SuppressWarnings("rawtypes")
    private R<Void> createResponseWithStatus(HttpStatus status, R r) {
        // 在 Spring MVC 中，直接在 ExceptionHandler 方法上声明 @ResponseStatus 即可
        // 由于同一个方法要处理多种状态码，这里使用 HttpServletResponse 来设置
        jakarta.servlet.http.HttpServletResponse response =
                ((org.springframework.web.context.request.ServletRequestAttributes)
                        org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes())
                        .getResponse();
        if (response != null) {
            response.setStatus(status.value());
        }
        return r;
    }
}
