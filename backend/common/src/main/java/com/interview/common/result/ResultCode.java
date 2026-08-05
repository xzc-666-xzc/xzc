package com.interview.common.result;

/**
 * 统一业务状态码枚举
 * <p>
 * 5位编码规则：第1位=HTTP状态大类，后4位=具体业务错误码
 * <pre>
 *   20000-29999: 成功
 *   40000-49999: 客户端错误
 *   50000-59999: 服务端错误
 * </pre>
 *
 * @see R
 */
public enum ResultCode {

    // ==================== 成功类 (2xxxx) ====================
    SUCCESS(20000, "操作成功"),
    CREATED(20100, "创建成功"),

    // ==================== 客户端错误 (4xxxx) ====================
    BAD_REQUEST(40000, "请求参数有误"),
    VALIDATION_FAILED(40001, "参数校验失败"),
    REQUEST_BODY_ERROR(40002, "请求体格式错误"),

    UNAUTHORIZED(40100, "未登录或Token已过期"),
    AUTH_FAILED(40101, "用户名或密码错误"),

    FORBIDDEN(40300, "权限不足"),

    NOT_FOUND(40400, "资源不存在"),

    CONFLICT(40900, "资源冲突"),
    PENDING_APPROVAL(40301, "账号待管理员审批"),
    RATE_LIMITED(42900, "请求过于频繁"),

    // ==================== 服务端错误 (5xxxx) ====================
    INTERNAL_ERROR(50000, "服务器内部错误"),
    SERVICE_UNAVAILABLE(50300, "服务暂不可用");

    private final int code;
    private final String defaultMessage;

    ResultCode(int code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public int getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    /**
     * 通过 code 值查找对应的枚举常量
     */
    public static ResultCode of(int code) {
        for (ResultCode rc : values()) {
            if (rc.code == code) {
                return rc;
            }
        }
        return INTERNAL_ERROR;
    }

    /**
     * 根据 HTTP 状态码映射到对应的业务码
     */
    public static ResultCode fromHttpStatus(int httpStatus) {
        return switch (httpStatus) {
            case 400 -> BAD_REQUEST;
            case 401 -> UNAUTHORIZED;
            case 403 -> FORBIDDEN;
            case 404 -> NOT_FOUND;
            case 409 -> CONFLICT;
            case 429 -> RATE_LIMITED;
            case 500 -> INTERNAL_ERROR;
            case 503 -> SERVICE_UNAVAILABLE;
            default -> INTERNAL_ERROR;
        };
    }
}
