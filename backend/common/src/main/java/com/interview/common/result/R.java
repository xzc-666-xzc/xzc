package com.interview.common.result;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 统一 API 响应封装
 *
 * <p>所有后端接口均使用此类作为返回值，确保前端收到格式一致的 JSON。
 *
 * <h3>响应格式</h3>
 * <pre>{@code
 * // 成功
 * {"code":20000, "message":"操作成功", "data":{...}, "timestamp":1721808600000}
 *
 * // 失败
 * {"code":40100, "message":"未登录", "data":null, "timestamp":1721808600000}
 *
 * // 参数校验失败（带字段级错误）
 * {"code":40001, "message":"参数校验失败", "errors":[{"field":"phone","message":"格式不正确"}], "data":null, "timestamp":1721808600000}
 * }</pre>
 *
 * @param <T> data 字段的类型
 * @see ResultCode
 * @see PageResult
 */
@Data
public class R<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 业务状态码（5位编码，详见 {@link ResultCode}） */
    private int code;

    /** 状态描述 */
    private String message;

    /** 业务数据 */
    private T data;

    /** 响应时间戳（毫秒） */
    private Long timestamp;

    /** 字段级错误详情（仅参数校验失败时填充） */
    private List<FieldError> errors;

    // ==================== 构造器 ====================

    public R() {
        this.timestamp = System.currentTimeMillis();
    }

    public R(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    public R(int code, String message, T data, List<FieldError> errors) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.errors = errors;
        this.timestamp = System.currentTimeMillis();
    }

    // ==================== 成功工厂方法 ====================

    /**
     * 操作成功（无 data）
     */
    public static <T> R<T> ok() {
        return new R<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getDefaultMessage(), null);
    }

    /**
     * 操作成功（带 data）
     */
    public static <T> R<T> ok(T data) {
        return new R<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getDefaultMessage(), data);
    }

    /**
     * 操作成功（自定义消息 + data）
     */
    public static <T> R<T> ok(String message, T data) {
        return new R<>(ResultCode.SUCCESS.getCode(), message, data);
    }

    /**
     * 创建成功（201）
     */
    public static <T> R<T> created(T data) {
        return new R<>(ResultCode.CREATED.getCode(), ResultCode.CREATED.getDefaultMessage(), data);
    }

    // ==================== 失败工厂方法 ====================

    /**
     * 失败（使用 ResultCode 枚举，消息为枚举默认值）
     */
    public static <T> R<T> fail(ResultCode resultCode) {
        return new R<>(resultCode.getCode(), resultCode.getDefaultMessage(), null);
    }

    /**
     * 失败（使用 ResultCode 枚举，自定义消息）
     */
    public static <T> R<T> fail(ResultCode resultCode, String message) {
        return new R<>(resultCode.getCode(), message, null);
    }

    /**
     * 失败（自定义 code + 自定义消息）——兼容旧代码
     */
    public static <T> R<T> fail(int code, String message) {
        return new R<>(code, message, null);
    }

    /**
     * 失败（自定义消息，code 默认为 INTERNAL_ERROR）——兼容旧代码
     */
    public static <T> R<T> fail(String message) {
        return new R<>(ResultCode.INTERNAL_ERROR.getCode(), message, null);
    }

    // ==================== 特定错误类型工厂 ====================

    /**
     * 未认证
     */
    public static <T> R<T> unauthorized(String message) {
        return new R<>(ResultCode.UNAUTHORIZED.getCode(), message, null);
    }

    /**
     * 无权限
     */
    public static <T> R<T> forbidden(String message) {
        return new R<>(ResultCode.FORBIDDEN.getCode(), message, null);
    }

    /**
     * 参数校验失败（带字段级错误详情）
     */
    public static <T> R<T> validationFailed(List<FieldError> errors) {
        R<T> r = new R<>();
        r.code = ResultCode.VALIDATION_FAILED.getCode();
        r.message = ResultCode.VALIDATION_FAILED.getDefaultMessage();
        r.data = null;
        r.errors = errors;
        r.timestamp = System.currentTimeMillis();
        return r;
    }

    /**
     * 参数校验失败（自定义消息 + 字段级错误详情）
     */
    public static <T> R<T> validationFailed(String message, List<FieldError> errors) {
        R<T> r = new R<>();
        r.code = ResultCode.VALIDATION_FAILED.getCode();
        r.message = message;
        r.data = null;
        r.errors = errors;
        r.timestamp = System.currentTimeMillis();
        return r;
    }

    // ==================== 内部类 ====================

    /**
     * 字段级校验错误
     */
    @Data
    public static class FieldError {
        private String field;
        private String message;

        public FieldError() {}

        public FieldError(String field, String message) {
            this.field = field;
            this.message = message;
        }

        public static FieldError of(String field, String message) {
            return new FieldError(field, message);
        }
    }
}
