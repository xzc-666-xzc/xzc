package com.interview.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.interview.common.entity.WorkOrderMessage;
import com.interview.common.exception.BusinessException;
import com.interview.common.result.ResultCode;
import com.interview.user.mapper.WorkOrderMessageMapper;
import com.interview.user.vo.MessageVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkOrderMessageService {

    private final WorkOrderMessageMapper messageMapper;

    public MessageVO sendMessage(Long orderId, Long senderId, String senderName,
                                  String senderRole, String content, String messageType) {
        WorkOrderMessage msg = new WorkOrderMessage();
        msg.setOrderId(orderId);
        msg.setSenderId(senderId);
        msg.setSenderName(senderName);
        msg.setSenderRole(senderRole);
        msg.setContent(content);
        msg.setMessageType(messageType != null ? messageType : "TEXT");
        messageMapper.insert(msg);
        return MessageVO.from(msg);
    }

    public void addSystemMessage(Long orderId, String content) {
        WorkOrderMessage msg = new WorkOrderMessage();
        msg.setOrderId(orderId);
        msg.setSenderId(0L);
        msg.setSenderName("系统");
        msg.setSenderRole("system");
        msg.setContent(content);
        msg.setMessageType("SYSTEM");
        messageMapper.insert(msg);
    }

    public Page<MessageVO> getMessages(Long orderId, int page, int pageSize) {
        IPage<WorkOrderMessage> iPage = messageMapper.selectPage(
            new Page<>(page, pageSize),
            new LambdaQueryWrapper<WorkOrderMessage>()
                .eq(WorkOrderMessage::getOrderId, orderId)
                .orderByAsc(WorkOrderMessage::getCreatedAt)
        );

        List<MessageVO> records = iPage.getRecords().stream()
            .map(MessageVO::from)
            .collect(Collectors.toList());

        Page<MessageVO> result = new Page<>(page, pageSize);
        result.setRecords(records);
        result.setTotal(iPage.getTotal());
        return result;
    }
}
