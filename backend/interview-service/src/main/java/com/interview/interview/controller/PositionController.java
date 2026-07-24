package com.interview.interview.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.interview.common.entity.Position;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.R;
import com.interview.common.result.ResultCode;
import com.interview.interview.mapper.PositionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "岗位接口", description = "岗位列表与详情")
@RestController
@RequestMapping("/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionMapper positionMapper;

    @Operation(summary = "获取岗位列表")
    @GetMapping
    public R<List<Map<String, Object>>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Position> query = new LambdaQueryWrapper<Position>()
                .eq(Position::getStatus, 1)
                .orderByDesc(Position::getIsHot)
                .orderByDesc(Position::getCreatedAt);

        if (category != null && !category.isEmpty()) {
            query.eq(Position::getCategory, category);
        }
        if (keyword != null && !keyword.isEmpty()) {
            query.like(Position::getName, keyword);
        }

        List<Position> positions = positionMapper.selectList(query);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Position p : positions) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getId());
            item.put("name", p.getName());
            item.put("category", p.getCategory());
            item.put("description", p.getDescription());
            item.put("tags", p.getTags());
            item.put("hot", Integer.valueOf(1).equals(p.getIsHot()));
            result.add(item);
        }

        return R.ok(result);
    }

    @Operation(summary = "获取岗位详情")
    @GetMapping("/{id}")
    public R<Map<String, Object>> getById(@PathVariable String id) {
        Position position = positionMapper.selectById(id);
        if (position == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "岗位不存在");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", position.getId());
        result.put("name", position.getName());
        result.put("category", position.getCategory());
        result.put("description", position.getDescription());
        result.put("tags", position.getTags());
        result.put("hot", Integer.valueOf(1).equals(position.getIsHot()));

        return R.ok(result);
    }
}