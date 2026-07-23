package com.interview.common.result;

import lombok.Data;

@Data
public class R<T> {

    private int code;
    private String message;
    private T data;

    public R() {}

    public R(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> R<T> ok() {
        return new R<T>(200, "success", null);
    }

    public static <T> R<T> ok(T data) {
        return new R<T>(200, "success", data);
    }

    public static <T> R<T> ok(String message, T data) {
        return new R<T>(200, message, data);
    }

    public static <T> R<T> fail(int code, String message) {
        return new R<T>(code, message, null);
    }

    public static <T> R<T> fail(String message) {
        return new R<T>(500, message, null);
    }

    public static <T> R<T> unauthorized(String message) {
        return new R<T>(401, message, null);
    }

    public static <T> R<T> forbidden(String message) {
        return new R<T>(403, message, null);
    }
}