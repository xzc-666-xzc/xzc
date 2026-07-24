package com.interview.common.result;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.Data;

import java.util.Collections;
import java.util.List;

/**
 * 分页响应体
 * <p>
 * 统一封装分页查询的返回数据，包含记录列表和分页元信息。
 * 可通过 {@link #of(IPage)} 便捷地从 MyBatis-Plus 分页结果构建。
 *
 * <h3>JSON 序列化示例</h3>
 * <pre>{@code
 * {
 *   "records": [...],
 *   "total": 128,
 *   "page": 1,
 *   "pageSize": 10,
 *   "pages": 13
 * }
 * }</pre>
 *
 * @param <T> 记录类型
 */
@Data
public class PageResult<T> {

    /** 数据列表 */
    private List<T> records;

    /** 总记录数 */
    private Long total;

    /** 当前页码（从1开始） */
    private Long page;

    /** 每页大小 */
    private Long pageSize;

    /** 总页数 */
    private Long pages;

    /**
     * 从 MyBatis-Plus IPage 构建 PageResult
     */
    public static <T> PageResult<T> of(IPage<T> mpPage) {
        PageResult<T> r = new PageResult<>();
        r.records = mpPage.getRecords();
        r.total = mpPage.getTotal();
        r.page = mpPage.getCurrent();
        r.pageSize = mpPage.getSize();
        r.pages = mpPage.getPages();
        return r;
    }

    /**
     * 构建空的分页结果
     */
    public static <T> PageResult<T> empty(long page, long pageSize) {
        PageResult<T> r = new PageResult<>();
        r.records = Collections.emptyList();
        r.total = 0L;
        r.page = page;
        r.pageSize = pageSize;
        r.pages = 0L;
        return r;
    }

    /**
     * 从 List + 分页信息构建 PageResult（适用于非 MyBatis-Plus 场景）
     */
    public static <T> PageResult<T> of(List<T> records, long total, long page, long pageSize) {
        PageResult<T> r = new PageResult<>();
        r.records = records;
        r.total = total;
        r.page = page;
        r.pageSize = pageSize;
        r.pages = pageSize > 0 ? (total + pageSize - 1) / pageSize : 0;
        return r;
    }
}
