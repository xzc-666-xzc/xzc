# API 设计规范

> 多模态智能模拟面试评测平台  
> 版本：v1.0  
> 基准规范：RESTful API 设计 + 统一响应体 + 错误码体系

---

## 1. URL 命名规范

| 规则 | 说明 | 正确示例 | 错误示例 |
|------|------|---------|---------|
| 使用名词复数 | 资源名用复数 | `/api/interviews` | `/api/interview` |
| 全小写字母 | URL 统一小写 | `/api/user-profiles` | `/api/UserProfiles` |
| 连字符分隔 | 多单词用 `-` | `/api/wrong-book` | `/api/wrong_book` |
| 层级表示关系 | 体现资源嵌套 | `/api/interviews/101/evaluations` | `/api/getEvaluations` |
| 版本前缀 | 统一 `/api` 前缀 | `/api/users` | `/users` |

---

## 2. HTTP 方法语义

| 操作 | HTTP 方法 | URL 格式 | 示例 | 幂等性 |
|------|-----------|---------|------|--------|
| 查询列表 | `GET` | `/api/{资源名}` | `GET /api/interviews` | ✅ 是 |
| 查询详情 | `GET` | `/api/{资源名}/{id}` | `GET /api/interviews/101` | ✅ 是 |
| 创建资源 | `POST` | `/api/{资源名}` | `POST /api/interviews` | ❌ 否 |
| 全量更新 | `PUT` | `/api/{资源名}/{id}` | `PUT /api/interviews/101` | ✅ 是 |
| 部分更新 | `PATCH` | `/api/{资源名}/{id}` | `PATCH /api/interviews/101` | ✅ 是 |
| 删除资源 | `DELETE` | `/api/{资源名}/{id}` | `DELETE /api/interviews/101` | ✅ 是 |

**状态转换（RPC 风格子资源）**：对于暂停/恢复/完成等状态变更操作，使用 `POST /api/{资源名}/{id}/{动作}` 模式，如 `POST /api/interviews/101/complete`。

---

## 3. 统一请求体格式

### 3.1 字段命名

- 使用 **camelCase**（驼峰命名）：`candidateId`, `startTime`
- 布尔字段以 `is`/`has`/`can` 开头：`isActive`, `hasPermission`
- 时间字段使用 **ISO 8601** 格式：`"2026-07-28T14:00:00"`
- 枚举值使用 **UPPER_SNAKE_CASE**：`TECHNICAL`, `BEHAVIORAL`

### 3.2 Content-Type

- 请求：`Content-Type: application/json;charset=UTF-8`
- 文件上传：`multipart/form-data`
- 响应：`Content-Type: application/json;charset=UTF-8`

### 3.3 示例

```json
// POST /api/interviews
{
  "candidateId": 1001,
  "position": "Java开发工程师",
  "startTime": "2026-07-28T14:00:00",
  "duration": 60,
  "interviewType": "TECHNICAL",
  "description": "一面技术面试"
}
```

---

## 4. 统一响应体格式

### 4.1 成功响应

```json
{
  "code": 20000,
  "message": "操作成功",
  "data": { ... },
  "timestamp": 1721808600000
}
```

### 4.2 创建成功

```json
{
  "code": 20100,
  "message": "创建成功",
  "data": { "interviewId": "..." },
  "timestamp": 1721808600000
}
```

### 4.3 分页响应

```json
{
  "code": 20000,
  "message": "操作成功",
  "data": {
    "records": [ ... ],
    "total": 128,
    "page": 1,
    "pageSize": 10,
    "pages": 13
  },
  "timestamp": 1721808600000
}
```

### 4.4 参数校验失败

```json
{
  "code": 40001,
  "message": "参数校验失败",
  "data": null,
  "timestamp": 1721808600000,
  "errors": [
    { "field": "phone", "message": "手机号格式不正确" },
    { "field": "startTime", "message": "面试时间不能为空" }
  ]
}
```

### 4.5 业务错误

```json
{
  "code": 40400,
  "message": "面试不存在",
  "data": null,
  "timestamp": 1721808600000
}
```

---

## 5. 全局错误码体系

### 5.1 编码规则

5 位编码：`HTTP大类(1位) + 业务子类(4位)`  
例：`40101` = HTTP 401（未认证） + 01（密码错误）

### 5.2 完整对照表

| HTTP 状态码 | 业务码 | 含义 | 典型场景 |
|------------|--------|------|---------|
| 200 | `20000` | 操作成功 | 正常返回数据 |
| 201 | `20100` | 创建成功 | POST 请求成功创建资源 |
| 400 | `40000` | 请求参数有误 | 通用参数错误 |
| 400 | `40001` | 参数校验失败 | `@Valid` 字段校验不通过 |
| 400 | `40002` | 请求体格式错误 | JSON 解析失败 / 类型不匹配 |
| 401 | `40100` | 未登录或 Token 已过期 | Token 缺失或无效 |
| 401 | `40101` | 认证失败 | 用户名或密码错误 |
| 403 | `40300` | 权限不足 | 候选人访问面试官接口 |
| 404 | `40400` | 资源不存在 | 查询不存在的记录 |
| 409 | `40900` | 资源冲突 | 用户名已被注册 |
| 429 | `42900` | 请求过于频繁 | 触发限流（计划中） |
| 500 | `50000` | 服务器内部错误 | 数据库连接失败等未知异常 |
| 503 | `50300` | 服务暂不可用 | 微服务降级 / Feign 熔断 |

### 5.3 后端使用

```java
// 推荐方式：使用 ResultCode 枚举
throw new BusinessException(ResultCode.NOT_FOUND, "面试记录不存在");
throw new BusinessException(ResultCode.AUTH_FAILED, "用户名或密码错误");

// 成功返回
return R.ok(data);
return R.created(newResource);
return R.fail(ResultCode.FORBIDDEN);
```

---

## 6. 分页参数规范

### 6.1 请求参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `page` | Integer | 1 | 当前页码，从 1 开始 |
| `pageSize` | Integer | 10 | 每页记录数，最大 100 |
| `sort` | String | — | 排序字段名（驼峰） |
| `order` | String | desc | 排序方向：asc / desc |

### 6.2 示例

```
GET /api/interviews/history?page=1&pageSize=20&sort=createdAt&order=desc
```

### 6.3 后端实现

```java
// 使用 PageResult.of() 从 MyBatis-Plus IPage 构建
public PageResult<Map<String, Object>> getHistory(Long userId, int page, int pageSize) {
    IPage<Interview> pageResult = this.page(new Page<>(page, pageSize), queryWrapper);
    // ... 转换为 records
    return PageResult.of(records, pageResult.getTotal(), page, pageSize);
}

// Controller 返回
@GetMapping("/history")
public R<PageResult<Map<String, Object>>> getHistory(...) {
    return R.ok(interviewService.getHistory(userId, page, pageSize));
}
```

---

## 7. 鉴权规范

### 7.1 Token 传递

```
Authorization: Bearer <jwt_token>
```

### 7.2 网关鉴权流程

1. 客户端在 `Authorization` 头携带 Bearer Token
2. Gateway `AuthFilter` 解析 JWT，将用户信息注入请求头：
   - `X-User-Id` — 用户 ID
   - `X-Username` — 用户名
   - `X-Role` — 角色
3. 下游服务通过 `AuthUtil.getUserId(request)` 获取当前用户（优先读取 `X-User-Id`，兜底解析 Token）

### 7.3 鉴权失败响应

```json
{
  "code": 40100,
  "message": "未登录或Token已过期",
  "data": null,
  "timestamp": 1721808600000
}
```

### 7.4 白名单（无需鉴权）

| 端点 | 说明 |
|------|------|
| `POST /api/user/login` | 登录 |
| `POST /api/user/register` | 注册 |
| `GET /api/positions/**` | 岗位公开查询 |
| `POST /api/ai/asr-token` | ASR Token |

---

## 8. 后端公共模块结构

```
common/src/main/java/com/interview/common/
├── config/
│   ├── MybatisPlusConfig.java        # MyBatis-Plus 分页插件
│   └── MyMetaObjectHandler.java      # 时间字段自动填充
├── dto/
│   └── PageQuery.java                # 分页查询参数基类
├── entity/
│   ├── User.java
│   ├── Interview.java
│   ├── Question.java
│   ├── Answer.java
│   ├── Evaluation.java
│   ├── Position.java
│   └── WrongQuestion.java
├── exception/
│   ├── BusinessException.java        # 业务异常（支持 ResultCode）
│   └── GlobalExceptionHandler.java   # 全局异常处理器
├── result/
│   ├── R.java                        # 统一响应体
│   ├── ResultCode.java               # 业务状态码枚举
│   └── PageResult.java               # 分页响应体
└── util/
    ├── JwtUtil.java                  # JWT 工具
    └── AuthUtil.java                 # 认证工具（读取 X-User-*）
```

---

## 9. 服务端口与 API 前缀

| 服务 | 端口 | API 前缀 | 职责 |
|------|------|---------|------|
| `gateway` | 8080 | `/api/**` | 网关、鉴权、路由 |
| `user-service` | 9001 | `/api/user/**` | 用户认证与资料 |
| `interview-service` | 9002 | `/api/interviews/**`, `/api/positions/**` | 面试管理 |
| `ai-service` | 9003 | `/api/ai/**` | AI 能力（LLM + ASR） |
| `report-service` | 9004 | `/api/reports/**`, `/api/wrong-book/**` | 评测报告与错题本 |

---

## 10. 前端对接

### 10.1 TypeScript 类型

```typescript
// 与后端 R<T> 对应
interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  errors?: ValidationError[];
}

// 与后端 PageResult<T> 对应
interface PageData<T> {
  records: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

// 使用示例
const res = await interviewService.getHistory({ page: 1, pageSize: 10 });
const { records, total } = res.data.data as PageData<InterviewRecord>;
```

### 10.2 错误处理

响应拦截器自动处理 401xx 业务码（清除 Token → 跳转登录页）和 40300 权限不足。页面级 try-catch 中通过 `error.response?.data?.message` 获取错误消息展示。
