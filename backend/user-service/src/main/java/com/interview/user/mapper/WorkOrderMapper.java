package com.interview.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.common.entity.WorkOrder;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WorkOrderMapper extends BaseMapper<WorkOrder> {
}
