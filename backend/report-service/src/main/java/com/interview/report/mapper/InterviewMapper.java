package com.interview.report.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.common.entity.Interview;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface InterviewMapper extends BaseMapper<Interview> {
}
