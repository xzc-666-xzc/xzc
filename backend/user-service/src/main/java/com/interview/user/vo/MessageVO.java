package com.interview.user.vo;

import com.interview.common.entity.WorkOrderMessage;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageVO {

    private String id;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String content;
    private String messageType;
    private LocalDateTime createdAt;

    public static MessageVO from(WorkOrderMessage msg) {
        MessageVO vo = new MessageVO();
        vo.setId(msg.getId().toString());
        vo.setSenderId(msg.getSenderId());
        vo.setSenderName(msg.getSenderName());
        vo.setSenderRole(msg.getSenderRole());
        vo.setContent(msg.getContent());
        vo.setMessageType(msg.getMessageType());
        vo.setCreatedAt(msg.getCreatedAt());
        return vo;
    }
}
