package com.interview.common.exception;

import com.interview.common.result.ResultCode;

/**
 * 业务异常
 * <p>
 * 所有业务逻辑层面的异常均使用此类抛出，由 {@link GlobalExceptionHandler} 统一捕获处理。
 * 支持直接传入 {@link ResultCode} 枚举以使用预定义的业务状态码和默认消息。
 *
 * <pre>{@code
 * // 使用 ResultCode（推荐）
 * throw new BusinessException(ResultCode.NOT_FOUND);
 * throw new BusinessException(ResultCode.NOT_FOUND, "面试记录不存在");
 *
 * // 兼容旧代码
 * throw new BusinessException(404, "资源不存在");
 * throw new BusinessException("默认500错误");
 * }</pre>
 *
 * @see ResultCode
 * @see GlobalExceptionHandler
 */
public class BusinessException extends RuntimeException {

    private final int code;

    // ==================== 新构造器（推荐，基于 ResultCode） ====================

    /**
     * 使用 ResultCode 定义的状态码和默认消息
     */
    public BusinessException(ResultCode resultCode) {
        super(resultCode.getDefaultMessage());
        this.code = resultCode.getCode();
    }

    /**
     * 使用 ResultCode 的状态码 + 自定义消息
     */
    public BusinessException(ResultCode resultCode, String customMessage) {
        super(customMessage);
        this.code = resultCode.getCode();
    }

    // ==================== 旧构造器（兼容） ====================

    /**
     * 自定义消息，code 默认为 500
     *
     * @deprecated 建议使用 {@link #BusinessException(ResultCode)}
     */
    @Deprecated
    public BusinessException(String message) {
        super(message);
        this.code = ResultCode.INTERNAL_ERROR.getCode();
    }

    /**
     * 自定义 code + 消息
     *
     * @deprecated 建议使用 {@link #BusinessException(ResultCode, String)}
     */
    @Deprecated
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
