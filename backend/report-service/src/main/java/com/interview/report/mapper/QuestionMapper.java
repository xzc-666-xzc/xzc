package com.interview.report.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.common.entity.Question;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {
}
