package com.interview.common.dto;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;

/**
 * 分页查询请求参数基类
 * <p>
 * Controller 中的分页查询方法可使用此类统一分页参数命名。
 * 参数通过 Query String 传递，由 Spring MVC 自动绑定。
 * <pre>
 *   GET /api/interviews?current=1&size=20&sort=createdAt&order=desc
 * </pre>
 */
@Data
public class PageQuery {

    /** 当前页码，从1开始，默认1 */
    private Integer current = 1;

    /** 每页记录数，默认10，最大100 */
    private Integer size = 10;

    /** 排序字段名（数据库字段名，驼峰） */
    private String sort;

    /** 排序方向：asc / desc，默认 desc */
    private String order = "desc";

    /**
     * 将当前参数转换为 MyBatis-Plus Page 对象
     */
    public <T> Page<T> toMpPage() {
        return new Page<>(Math.max(1, current), Math.min(100, Math.max(1, size)));
    }
}
