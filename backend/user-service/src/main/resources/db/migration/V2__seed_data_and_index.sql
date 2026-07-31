-- ============================================================
-- V2: 种子数据 + 错题本复合索引
-- 幂等设计: 新增环境插入数据, 已有环境自动跳过
-- ============================================================

-- 初始化岗位数据 (INSERT IGNORE: 主键冲突时跳过, 可重复执行)
INSERT IGNORE INTO t_position (id, name, category, description, tags, is_hot) VALUES
('pos-java-middle', 'Java后端开发', '技术岗', '涵盖Java核心、Spring框架、微服务、数据库等知识点', '["Java","Spring Boot","MySQL","Redis","微服务"]', 1),
('pos-pm-junior', '产品经理', '产品岗', '需求分析、PRD撰写、用户研究、数据分析等核心能力', '["需求分析","PRD","用户研究","数据分析"]', 1),
('pos-fe-middle', '前端开发', '技术岗', 'React/Vue框架、TypeScript、工程化、性能优化等', '["React","TypeScript","Vite","性能优化"]', 0),
('pos-hr-general', 'HR-通用面试', '综合岗', '行为面试、STAR法则、沟通表达、综合素质评估', '["行为面试","STAR","沟通","综合素质"]', 0),
('pos-java-agent', 'JavaAgent开发工程师', '技术岗', 'Java Agent、字节码增强、JVM TI、APM、性能监控、动态插桩等技术方向', '["Java Agent","字节码","JVM","APM","ASM","ByteBuddy"]', 1);

-- 添加错题本复合索引 (幂等: 先检查后创建)
SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 't_wrong_question'
       AND index_name = 'idx_user_reviewed') = 0,
    'CREATE INDEX idx_user_reviewed ON t_wrong_question(user_id, reviewed)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
