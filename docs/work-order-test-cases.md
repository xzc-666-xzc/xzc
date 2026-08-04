# 问题反馈工单模块 — 测试用例

> 版本：v1.0  
> 日期：2026-08-04  
> 覆盖模块：工单 CRUD、状态流转、留言、附件、权限、转派

---

## 一、工单创建

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-C-001 | 正常创建工单 | 用户已登录 | POST `/work-orders`，填写 title/type/description/priority | 返回 200，status=DRAFT，返回 id |
| TC-C-002 | 标题为空 | 用户已登录 | title 为空提交 | 返回 400，"标题不能为空" |
| TC-C-003 | 标题超长 | 用户已登录 | title 超过 100 字符 | 返回 400，"标题长度1-100字符" |
| TC-C-004 | 描述过短 | 用户已登录 | description 少于 10 字符 | 返回 400，"描述长度10-5000字符" |
| TC-C-005 | 描述超长 | 用户已登录 | description 超过 5000 字符 | 返回 400，提示超长 |
| TC-C-006 | 类型为空 | 用户已登录 | type 字段为空 | 返回 400，"问题类型不能为空" |
| TC-C-007 | 优先级默认值 | 用户已登录 | 不传 priority | 默认值应为 "MEDIUM" |
| TC-C-008 | 未登录创建 | 无 Token | 不带 Token 请求 | 返回 401，"未登录或Token已过期" |

---

## 二、工单编辑（草稿状态）

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-E-001 | 编辑自己的草稿 | 用户 A 创建了 DRAFT 工单 | A 调用 PUT `/work-orders/{id}` 修改标题 | 返回 200，标题更新成功 |
| TC-E-002 | 编辑他人草稿 | 用户 B 登录 | B 调用 PUT 修改 A 的草稿 | 返回 403，"只能编辑自己的工单" |
| TC-E-003 | 编辑非草稿工单 | 工单状态为 PENDING | 提交人调用 PUT | 返回 400，"只有草稿状态的工单可以编辑" |
| TC-E-004 | 编辑不存在的工单 | — | PUT 不存在的 id | 返回 404，"工单不存在" |

---

## 三、状态流转

### 3.1 提交工单（DRAFT → PENDING）

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-S-001 | 提交人提交草稿 | 工单 status=DRAFT，提交人操作 | POST `/work-orders/{id}/submit` | 返回 200，status=PENDING；管理员收到通知；系统留言"用户提交了工单" |
| TC-S-002 | 非提交人提交 | 工单 status=DRAFT，非提交人操作 | 其他人调用 submit | 返回 403，"只有提交人本人可以提交工单" |
| TC-S-003 | 提交非草稿工单 | 工单 status=PENDING | 调用 submit | 返回 400，状态转移不合法 |

### 3.2 接单（PENDING → PROCESSING）

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-S-004 | 管理员接单 | 工单 status=PENDING，admin 操作 | POST `/work-orders/{id}/accept` | 返回 200，status=PROCESSING，assigneeId=admin；提交人收到通知 |
| TC-S-005 | 求职者接单 | 工单 status=PENDING，candidate 操作 | candidate 调用 accept | 返回 403，"只有管理员可以接单" |
| TC-S-006 | HR 接单 | 工单 status=PENDING，hr 操作 | hr 调用 accept | 返回 200，status=PROCESSING |
| TC-S-007 | 已处理工单接单 | 工单 status=PROCESSING | 管理员再次 accept | 返回 400，状态转移不合法 |

### 3.3 解决工单（PROCESSING → RESOLVED）

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-S-008 | 处理人标记已解决 | 工单 status=PROCESSING，assignee 操作 | POST，resolution ≥ 5 字符 | 返回 200，status=RESOLVED；提交人收到通知 |
| TC-S-009 | 非处理人标记解决 | 工单 status=PROCESSING，其他人操作 | 其他管理员调用 resolve | 返回 403 |
| TC-S-010 | 解决说明过短 | 工单 status=PROCESSING | resolution 少于 5 字符 | 返回 400，"解决说明长度5-2000字符" |

### 3.4 关闭工单（→ CLOSED）

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-S-011 | 提交人关闭已解决工单 | 工单 status=RESOLVED，提交人操作 | POST `/work-orders/{id}/close` | 返回 200，status=CLOSED |
| TC-S-012 | 管理员关闭待处理工单 | 工单 status=PENDING，admin 操作 | admin 调用 close | 返回 200，status=CLOSED |
| TC-S-013 | 求职者关闭待处理工单 | 工单 status=PENDING，candidate 操作 | candidate 调用 close | 返回 403 |
| TC-S-014 | 关闭已关闭工单 | 工单 status=CLOSED | 再次 close | 返回 400，状态转移不合法 |
| TC-S-015 | 管理员关闭处理中工单 | 工单 status=PROCESSING，admin 操作 | admin 调用 close | 返回 200，status=CLOSED |

### 3.5 转报（Escalate）

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-E-001 | 管理员转报工单 | 工单 PENDING/PROCESSING，admin 操作 | POST `/work-orders/{id}/escalate`，填写 escalatedTo + note | 返回 200；目标用户收到通知；系统留言记录 |
| TC-E-002 | 求职者转报 | candidate 操作 | candidate 调用 escalate | 返回 403，"只有管理员可以转报工单" |
| TC-E-003 | 目标用户为空 | 管理员操作 | escalatedTo 为 null | 返回 400，"转报目标不能为空" |

### 3.6 转派（Reassign — 仅 xzc 分支）

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-R-001 | 管理员转派处理中工单 | 工单 status=PROCESSING | POST `/work-orders/{id}/reassign`，assigneeId=另一管理员 | 返回 200，assigneeId 变更；新处理人收到通知 |
| TC-R-002 | 转派给求职者 | 工单 status=PROCESSING | assigneeId 为 candidate 用户 | 返回 400，"只能转派给管理员" |
| TC-R-003 | 转派非处理中工单 | 工单 status=PENDING | 调用 reassign | 返回 400，"只有处理中的工单可以转派" |
| TC-R-004 | 转派给不存在的用户 | admin 操作 | assigneeId 为不存在的 ID | 返回 404，"目标管理员不存在" |
| TC-R-005 | 求职者转派 | candidate 操作 | candidate 调用 reassign | 返回 403，"只有管理员可以转派工单" |

---

## 四、留言功能

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-M-001 | 正常发送留言 | 工单非 RESOLVED/CLOSED | POST `/work-orders/{id}/messages`，content 不为空 | 返回 201，返回 MessageVO |
| TC-M-002 | 内容为空 | — | content 为空 | 返回 400，"消息内容不能为空" |
| TC-M-003 | 已解决工单留言 | 工单 status=RESOLVED | 发送留言 | 返回 400，"工单已解决或已关闭，无法继续留言" |
| TC-M-004 | 已关闭工单留言 | 工单 status=CLOSED | 发送留言 | 返回 400，"工单已解决或已关闭，无法继续留言" |
| TC-M-005 | 获取留言列表 | 工单有 N 条留言 | GET `/work-orders/{id}/messages` | 返回分页数据，按时间升序 |
| TC-M-006 | 系统留言自动生成 | 触发状态变更 | submit/accept/resolve/reassign | 自动生成 SYSTEM 类型留言 |

---

## 五、附件功能

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-A-001 | 上传图片附件 | 工单存在 | POST multipart，上传 png 图片 | 返回 201，返回 AttachmentVO（含 fileUrl/thumbnailUrl） |
| TC-A-002 | 上传视频附件 | 工单存在 | 上传 mp4 视频 | 返回 201，fileType=VIDEO |
| TC-A-003 | 删除自己的附件 | 附件上传者操作 | DELETE `/work-orders/{id}/attachments/{attId}` | 返回 200 |
| TC-A-004 | 删除他人附件 | 非上传者操作 | 调用 DELETE | 返回 403 |
| TC-A-005 | 附件列表展示 | 工单详情页 | GET 工单详情 | attachments 包含所有附件信息 |

---

## 六、工单列表查询

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-L-001 | 管理员查看全部 | admin 登录 | GET `/work-orders` | 返回所有工单（不分提交人） |
| TC-L-002 | 求职者只看自己的 | candidate 登录 | GET `/work-orders` | 仅返回该用户提交的工单 |
| TC-L-003 | 按状态筛选 | — | GET `?status=PENDING` | 只返回 PENDING 状态 |
| TC-L-004 | 按类型筛选 | — | GET `?type=BUG_REPORT` | 只返回 BUG 上报 |
| TC-L-005 | 关键词搜索 | — | GET `?keyword=登录` | 标题包含"登录"的工单 |
| TC-L-006 | 分页查询 | — | GET `?page=1&pageSize=5` | 返回第 1 页，每页 5 条 |
| TC-L-007 | 按更新时间倒序 | — | 查询列表 | 最近更新的排最前 |
| TC-L-008 | 留言数量统计 | 工单有 N 条留言 | 查询列表 | messageCount 字段 = N |

---

## 七、工单详情

| 编号 | 用例名称 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| TC-D-001 | 提交人查看详情 | A 的工单，A 登录 | GET `/work-orders/{id}` | 返回完整详情含提交人信息 |
| TC-D-002 | 管理员查看详情 | admin 登录 | GET 任意工单 | 返回完整详情 |
| TC-D-003 | 非相关人查看 | C 的工单，D（candidate）查看 | D GET 工单 | 返回 403，"无权查看此工单" |
| TC-D-004 | 工单不存在 | — | GET 不存在的 id | 返回 404 |
| TC-D-005 | 含附件的工单详情 | 工单有 3 个附件 | GET 详情 | attachments 数组含 3 个元素 |

---

## 八、权限校验

| 编号 | 用例名称 | 操作步骤 | 预期结果 |
|---|---|---|---|
| TC-P-001 | admin 可接单 | admin 调用 accept | ✅ 成功 |
| TC-P-002 | hr 可接单 | hr 调用 accept | ✅ 成功 |
| TC-P-003 | teacher 可接单 | teacher 调用 accept | ✅ 成功 |
| TC-P-004 | candidate 不可接单 | candidate 调用 accept | ❌ 403 |
| TC-P-005 | admin 可转派 | admin 调用 reassign | ✅ 成功 |
| TC-P-006 | hr 可转派 | hr 调用 reassign | ✅ 成功 |
| TC-P-007 | 未登录操作 | 无 Token | ❌ 401 |

---

## 九、状态机边界测试

| 编号 | 用例名称 | 当前状态 | 目标操作 | 预期结果 |
|---|---|---|---|---|
| TC-SM-01 | DRAFT→PROCESSING 跳状态 | DRAFT | accept | ❌ 非法跳转 |
| TC-SM-02 | DRAFT→RESOLVED 跳状态 | DRAFT | resolve | ❌ 非法跳转 |
| TC-SM-03 | PENDING→RESOLVED 跳状态 | PENDING | resolve | ❌ 非法跳转 |
| TC-SM-04 | CLOSED→任何状态 | CLOSED | submit/accept/resolve/reassign | ❌ 全部非法 |
| TC-SM-05 | RESOLVED→PROCESSING 回退 | RESOLVED | accept | ❌ 不允许回退 |

---

## 十、端到端场景

### 场景 1：求职者完整工单流程

```
1. candidate 登录 → 创建工单（BUG_REPORT，描述登录报错）→ status=DRAFT
2. candidate 编辑工单补充截图 → 编辑成功
3. candidate 提交工单 → status=PENDING，管理员收到通知
4. admin 查看列表 → 看到该工单
5. admin 接单 → status=PROCESSING，assigneeId=admin，candidate 收到通知
6. admin 发送留言询问细节 → 留言成功
7. candidate 回复留言补充信息 → 留言成功
8. admin 标记已解决（附解决说明）→ status=RESOLVED，candidate 收到通知
9. candidate 确认后关闭 → status=CLOSED
10. 尝试留言 → ❌ "工单已解决或已关闭，无法继续留言"
```

### 场景 2：管理员转派

```
1. admin-A 接单 → status=PROCESSING
2. admin-A 将工单转派给 admin-B → assigneeId=admin-B，admin-B 收到通知
3. admin-B 继续处理并解决 → status=RESOLVED
```

### 场景 3：转报上级

```
1. 工单在 PENDING 状态
2. admin 发现该问题需上级处理 → escalate 给 super-admin
3. super-admin 收到通知，接单处理
```

### 场景 4：管理员直接关闭

```
1. 工单在 PENDING 状态
2. admin 判断该工单为无效/重复提交 → 直接关闭
3. status=CLOSED
```

### 场景 5：超时自动关闭（如有定时任务）

```
1. 工单 RESOLVED 超过 7 天未关闭
2. 定时任务触发 → 自动 CLOSED
```

---

## 十一、前端 UI 测试

| 编号 | 用例名称 | 操作 | 预期结果 |
|---|---|---|---|
| TC-UI-01 | 工单列表加载 | 进入 /work-orders | 列表显示，分页正常 |
| TC-UI-02 | 状态筛选下拉 | 选择"待处理" | 列表过滤为 PENDING |
| TC-UI-03 | 创建工单弹窗 | 点击"新建工单" | 表单弹出，字段完整 |
| TC-UI-04 | 工单详情页 | 点击某条工单 | 左侧元数据 + 右侧聊天区 |
| TC-UI-05 | 发送留言 Enter 键 | 输入消息后按 Enter | 消息发送 |
| TC-UI-06 | Shift+Enter 换行 | 输入中按 Shift+Enter | 换行不发送 |
| TC-UI-07 | 已解决工单留言禁用 | 查看 RESOLVED 工单 | 输入框替换为"不再支持留言" |
| TC-UI-08 | 操作按钮可见性-DRAFT | 提交人查看草稿 | 显示"提交工单"按钮 |
| TC-UI-09 | 操作按钮可见性-PENDING | 管理员查看 | 显示"接单处理""转报上级""关闭工单" |
| TC-UI-10 | 转派按钮可见性 | 管理员查看 PROCESSING 工单 | 显示"🔀 转派他人" |
| TC-UI-11 | 附件上传 | 工单详情页上传文件 | 附件列表更新 |
| TC-UI-12 | 附件预览 | 点击图片附件 | 新窗口打开原图 |

---

## 测试数据准备

```sql
-- 测试用户：candidate (test_user)、admin (Gxzc)、hr (Hxzc)
-- 测试工单类型：INTERVIEW_FAULT / FEATURE_SUGGESTION / BUG_REPORT
-- 测试优先级：LOW / MEDIUM / HIGH / URGENT
```

## 注意事项

1. 转派（reassign）功能仅在 `xzc` 分支，`main` 分支无此功能
2. 已解决/已关闭禁止留言需前后端双重校验
3. 所有状态变更都会生成系统留言记录
4. 附件上传需确保 OSS 服务可用
5. 通知功能依赖 NotificationService 正确配置
