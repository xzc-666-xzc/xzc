package com.interview.common.enums;

import lombok.Getter;

@Getter
public enum WorkOrderType {

    INTERVIEW_FAULT("面试故障", "面试过程中遇到的技术问题"),
    FEATURE_SUGGESTION("功能建议", "对平台功能的改进建议"),
    BUG_REPORT("BUG上报", "平台使用中发现的程序缺陷");

    private final String label;
    private final String description;

    WorkOrderType(String label, String description) {
        this.label = label;
        this.description = description;
    }
}
