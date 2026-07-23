// ============================================================
// 面试题库 — 按岗位、难度分级，支持随机抽取
// ============================================================

export interface QuestionTemplate {
  id: string;
  content: string;
  tags: string[];
}

export interface PositionBank {
  positionId: string;       // 匹配岗位ID前缀
  positionName: string;
  levels: {
    [level: string]: QuestionTemplate[];  // junior | middle | senior | expert
  };
}

// ==================== Java 后端开发 ====================
const javaQuestions: PositionBank = {
  positionId: 'pos-java',
  positionName: 'Java后端开发',
  levels: {
    junior: [
      { id: 'java-j-1', content: '请解释Java中面向对象的三大特性：封装、继承和多态，并各举一个实际开发中的例子。', tags: ['Java基础', 'OOP'] },
      { id: 'java-j-2', content: '请说明Java中String、StringBuilder和StringBuffer的区别，以及各自的适用场景。', tags: ['Java基础', '字符串'] },
      { id: 'java-j-3', content: '什么是Java的自动装箱和拆箱？在使用过程中需要注意哪些问题？', tags: ['Java基础', '包装类'] },
      { id: 'java-j-4', content: '请讲解Java中ArrayList和LinkedList的底层实现原理，以及在什么场景下选择使用哪一个。', tags: ['集合', '数据结构'] },
      { id: 'java-j-5', content: '请解释Java异常体系中的checked exception和unchecked exception的区别，以及如何处理。', tags: ['异常处理'] },
      { id: 'java-j-6', content: '什么是Java中的反射机制？它有哪些应用场景和潜在的性能问题？', tags: ['反射', 'Java基础'] },
      { id: 'java-j-7', content: '请解释==和equals()的区别，并说明在自定义对象中如何正确重写equals()和hashCode()。', tags: ['Java基础', '对象比较'] },
      { id: 'java-j-8', content: '请说明接口(interface)和抽象类(abstract class)的区别，在项目设计中如何选择？', tags: ['OOP', '设计'] },
    ],
    middle: [
      { id: 'java-m-1', content: '请详细介绍Spring Boot的自动配置原理，以及如何自定义一个Starter。', tags: ['Spring Boot', '自动配置'] },
      { id: 'java-m-2', content: '请讲解MySQL中索引的底层数据结构（B+树），并分析联合索引的最左前缀原则。', tags: ['MySQL', '索引'] },
      { id: 'java-m-3', content: '请介绍Redis的常用数据类型及其底层实现，以及缓存穿透、击穿、雪崩的解决方案。', tags: ['Redis', '缓存'] },
      { id: 'java-m-4', content: '请讲解Spring中事务的传播机制和隔离级别，以及@Transactional注解的失效场景。', tags: ['Spring', '事务'] },
      { id: 'java-m-5', content: '请介绍JVM的内存模型（堆、栈、方法区等），以及常见的GC算法和垃圾回收器。', tags: ['JVM', 'GC'] },
      { id: 'java-m-6', content: '请说明如何设计一个高并发的秒杀系统，需要关注哪些核心问题和解决方案？', tags: ['高并发', '系统设计'] },
      { id: 'java-m-7', content: '请解释微服务架构中服务间通信的方式（RPC vs HTTP vs MQ），各自的优缺点和适用场景。', tags: ['微服务', '通信'] },
      { id: 'java-m-8', content: '请讲解分布式锁的实现方案（Redis、Zookeeper），以及如何解决锁的续期和可重入问题。', tags: ['分布式', '锁'] },
      { id: 'java-m-9', content: '请说明消息队列在项目中的使用场景，如何保证消息的可靠投递和幂等消费？', tags: ['MQ', '可靠性'] },
      { id: 'java-m-10', content: '请介绍常用的设计模式（单例、工厂、策略、观察者等），并举例说明在你的项目中如何使用。', tags: ['设计模式', '实战'] },
      { id: 'java-m-11', content: '请讲解MySQL的MVCC机制是如何实现事务隔离的，以及不同隔离级别下的表现。', tags: ['MySQL', 'MVCC'] },
      { id: 'java-m-12', content: '请说明ConcurrentHashMap在JDK 8中的实现原理，以及它是如何保证线程安全的。', tags: ['并发', '集合'] },
    ],
    senior: [
      { id: 'java-s-1', content: '请从架构层面分析一个高并发系统的演进路径：从单体到微服务，从单库到分库分表。重点说明每个阶段的决策依据和技术选型。', tags: ['架构演进', '系统设计'] },
      { id: 'java-s-2', content: '请深入讲解JVM调优的完整思路：如何分析GC日志、选择垃圾回收器、调整堆大小和新生代比例，以及遇到过什么实际调优案例。', tags: ['JVM调优', '性能优化'] },
      { id: 'java-s-3', content: '请设计一个支持千万级DAU的推送系统，需要考虑消息存储、实时推送、离线消息、多端同步等，画出架构图并说明关键技术选型。', tags: ['系统设计', '推送'] },
      { id: 'java-s-4', content: '如何设计和实施一个完整的服务治理体系？包括服务注册发现、配置中心、限流熔断、链路追踪、日志收集、监控告警等方面。', tags: ['服务治理', '微服务'] },
      { id: 'java-s-5', content: '请讲解分布式事务的几种解决方案（2PC、TCC、Saga、本地消息表），对比其优缺点并给出选型建议。', tags: ['分布式事务', '一致性'] },
      { id: 'java-s-6', content: '如何做技术选型和架构评审？请以你经历过的实际项目为例，说明你是如何评估不同技术方案的。', tags: ['技术选型', '架构评审'] },
      { id: 'java-s-7', content: '请深入分析ThreadLocal的内存泄漏问题：原理是什么？如何避免？在什么场景下使用ThreadLocal是正确的？', tags: ['并发', '内存管理'] },
      { id: 'java-s-8', content: '请设计一个通用的数据同步方案，能够支持不同数据源之间的实时和离线同步，如何处理数据冲突和一致性校验？', tags: ['数据同步', '架构'] },
    ],
    expert: [
      { id: 'java-e-1', content: '如果你是技术负责人，要带领团队从零搭建一个企业级微服务平台，你将如何制定技术蓝图和里程碑计划？请从组织、技术、流程三个维度展开。', tags: ['技术管理', '规划'] },
      { id: 'java-e-2', content: '请比较Service Mesh（如Istio）与传统微服务框架（如Spring Cloud）的架构差异，什么场景下适合引入Service Mesh？', tags: ['Service Mesh', '架构'] },
      { id: 'java-e-3', content: '如何设计一个支持多租户的SaaS平台架构？请分析数据库隔离方案（独立数据库/共享数据库独立Schema/共享表）、数据安全和性能隔离等问题。', tags: ['SaaS', '多租户'] },
      { id: 'java-e-4', content: '请深入分析DDD（领域驱动设计）的核心概念（聚合根、领域事件、限界上下文），并结合实际项目说明如何在微服务拆分中落地DDD。', tags: ['DDD', '架构设计'] },
      { id: 'java-e-5', content: '在面对突发流量（如大促活动）时，你的整体应对策略是什么？请从容量评估、弹性伸缩、限流降级、应急预案等角度全面阐述。', tags: ['高可用', '容量规划'] },
    ],
  },
};

// ==================== 前端开发 ====================
const feQuestions: PositionBank = {
  positionId: 'pos-fe',
  positionName: '前端开发',
  levels: {
    junior: [
      { id: 'fe-j-1', content: '请解释CSS盒模型，以及box-sizing: border-box和content-box的区别。', tags: ['CSS', '基础'] },
      { id: 'fe-j-2', content: '请说明var、let和const的区别，以及什么是变量提升（hoisting）？', tags: ['JavaScript', '基础'] },
      { id: 'fe-j-3', content: '请讲解JavaScript中的事件冒泡和事件捕获机制，以及如何使用事件委托。', tags: ['JavaScript', '事件'] },
      { id: 'fe-j-4', content: '请解释什么是闭包（Closure），举一个闭包的实际应用场景。', tags: ['JavaScript', '闭包'] },
      { id: 'fe-j-5', content: '请说明Flex布局中justify-content和align-items的常用取值及效果。', tags: ['CSS', '布局'] },
      { id: 'fe-j-6', content: '请讲解JavaScript中的原型链(prototype chain)是什么，以及ES6的class语法糖是如何实现的。', tags: ['JavaScript', '原型'] },
      { id: 'fe-j-7', content: '什么是浏览器的同源策略？如何解决跨域问题（CORS、JSONP、代理）？', tags: ['浏览器', '跨域'] },
      { id: 'fe-j-8', content: '请解释Git中merge和rebase的区别，以及在团队协作中的最佳实践。', tags: ['Git', '协作'] },
    ],
    middle: [
      { id: 'fe-m-1', content: '请深入讲解React的虚拟DOM和Diff算法原理，以及React 18中Fiber架构的改进。', tags: ['React', '虚拟DOM'] },
      { id: 'fe-m-2', content: '请说明TypeScript中interface和type的区别，以及泛型的使用场景和约束。', tags: ['TypeScript', '类型系统'] },
      { id: 'fe-m-3', content: '请讲解Webpack或Vite的打包原理，如何做性能优化（代码分割、Tree Shaking、懒加载）。', tags: ['构建工具', '性能优化'] },
      { id: 'fe-m-4', content: '请介绍React中状态管理方案（useState/useReducer/Context vs Zustand/Redux）的选型思路。', tags: ['React', '状态管理'] },
      { id: 'fe-m-5', content: '请详细讲解浏览器从输入URL到页面渲染的完整过程，以及每个阶段的性能优化点。', tags: ['浏览器', '渲染原理'] },
      { id: 'fe-m-6', content: '请分析前端常见的性能瓶颈，以及如何使用Lighthouse和Performance API进行性能分析和优化。', tags: ['性能优化', '工具'] },
      { id: 'fe-m-7', content: '请讲解HTTP/2和HTTP/3的主要改进，以及这些改进对前端开发的影响。', tags: ['HTTP', '网络'] },
      { id: 'fe-m-8', content: '如何在大型前端项目中管理CSS？请对比CSS Modules、Styled-Components、Tailwind CSS等方案。', tags: ['CSS', '工程化'] },
      { id: 'fe-m-9', content: '请讲解前端安全中的XSS和CSRF攻击原理，以及防范措施。', tags: ['安全', '前端'] },
      { id: 'fe-m-10', content: '请说明React中useMemo、useCallback和React.memo的使用场景和性能优化原理。', tags: ['React', 'Hooks'] },
    ],
    senior: [
      { id: 'fe-s-1', content: '请设计一个前端组件库的架构方案，包括组件设计规范、主题定制、按需加载、单元测试和文档生成。', tags: ['组件库', '架构'] },
      { id: 'fe-s-2', content: '如何设计和实现一个前端微服务（Micro Frontends）架构？请分析qiankun、Module Federation等方案的优劣。', tags: ['微前端', '架构'] },
      { id: 'fe-s-3', content: '请深入分析SSR（服务端渲染）的原理和实现方案（Next.js/Nuxt），什么场景下需要SSR？如何权衡SSR和CSR？', tags: ['SSR', '渲染'] },
      { id: 'fe-s-4', content: '如何搭建一个高效的前端工程化体系？包括CI/CD流水线、自动化测试、代码规范、监控告警等。', tags: ['工程化', 'DevOps'] },
      { id: 'fe-s-5', content: '请设计一个前端埋点和监控系统，包括错误监控、性能监控、用户行为分析，如何做到无侵入和数据准确？', tags: ['监控', '埋点'] },
      { id: 'fe-s-6', content: '面对首屏加载缓慢的问题，你的排查和优化思路是什么？请结合具体案例说明。', tags: ['性能优化', '首屏'] },
    ],
    expert: [
      { id: 'fe-e-1', content: '作为前端团队的技术Leader，你将如何制定前端技术发展路线？如何推动新技术落地并保证团队的技术成长？', tags: ['技术管理', '规划'] },
      { id: 'fe-e-2', content: '请比较各大前端框架（React/Vue/Angular/Svelte）的设计理念和适用场景，如何为公司级项目做框架选型？', tags: ['框架对比', '技术选型'] },
      { id: 'fe-e-3', content: '请设计一个跨平台（Web/iOS/Android）的前端技术方案，对比React Native、Flutter、Taro等方案的优劣。', tags: ['跨平台', '架构'] },
    ],
  },
};

// ==================== 产品经理 ====================
const pmQuestions: PositionBank = {
  positionId: 'pos-pm',
  positionName: '产品经理',
  levels: {
    junior: [
      { id: 'pm-j-1', content: '请解释什么是用户故事（User Story）？如何编写一个好的用户故事？', tags: ['需求分析', '用户故事'] },
      { id: 'pm-j-2', content: '请说明PRD（产品需求文档）通常包含哪些核心内容？你认为一份好的PRD最重要的三点是什么？', tags: ['PRD', '文档'] },
      { id: 'pm-j-3', content: '你如何定义产品的MVP（最小可行产品）？请以你熟悉的产品为例说明。', tags: ['MVP', '产品规划'] },
      { id: 'pm-j-4', content: '请讲解用户画像（Persona）是什么，以及如何创建和使用用户画像来指导产品决策。', tags: ['用户研究', '用户画像'] },
      { id: 'pm-j-5', content: '如何进行竞品分析？请列举你的分析框架和核心维度。', tags: ['竞品分析', '方法论'] },
      { id: 'pm-j-6', content: '请解释什么是A/B测试，以及在产品迭代中如何设计和评估A/B测试。', tags: ['数据分析', 'A/B测试'] },
      { id: 'pm-j-7', content: '如何确定需求的优先级？请介绍你使用过的优先级排序方法（如KANO模型、RICE评分等）。', tags: ['需求管理', '优先级'] },
      { id: 'pm-j-8', content: '请描述一次你从用户反馈中发现需求并推动落地的完整过程。', tags: ['用户反馈', '落地执行'] },
    ],
    middle: [
      { id: 'pm-m-1', content: '请设计一款面向大学生的在线学习平台，包括核心功能模块、商业模式和增长策略。', tags: ['产品设计', '商业思维'] },
      { id: 'pm-m-2', content: '如何制定产品的北极星指标？请举例说明什么是好的北极星指标。', tags: ['指标体系', '增长'] },
      { id: 'pm-m-3', content: '请讲解用户体验五要素（战略层、范围层、结构层、框架层、表现层），并举例说明在项目中如何应用。', tags: ['UX', '设计理论'] },
      { id: 'pm-m-4', content: '如何处理开发和产品之间的矛盾？当开发说"这个需求做不了"时，你会怎么做？', tags: ['沟通', '协作'] },
      { id: 'pm-m-5', content: '请介绍一个你主导的产品功能从0到1的全过程，重点说明需求发现、方案设计、数据验证三个环节。', tags: ['产品全流程', '实战'] },
      { id: 'pm-m-6', content: '如何用数据驱动产品决策？请举例说明你如何使用数据分析来优化产品功能。', tags: ['数据分析', '决策'] },
      { id: 'pm-m-7', content: '请分析一款你常用产品的商业模式和盈利方式，如果你来做，你会如何改进？', tags: ['商业分析', '产品思维'] },
      { id: 'pm-m-8', content: '如何做好一次有效的用户访谈？请说明你的访谈准备、执行和分析流程。', tags: ['用户研究', '访谈'] },
    ],
    senior: [
      { id: 'pm-s-1', content: '如果你负责一条新的产品线，你需要哪些信息来制定产品战略？请描述你从0到1搭建产品体系的完整思路。', tags: ['产品战略', '体系搭建'] },
      { id: 'pm-s-2', content: '如何在B端和C端产品之间做权衡？请分析B端和C端产品设计和运营的核心差异。', tags: ['B端', 'C端'] },
      { id: 'pm-s-3', content: '请分析一个你认为是失败的知名产品案例，说明失败的核心原因以及你会如何避免。', tags: ['产品分析', '失败案例'] },
      { id: 'pm-s-4', content: '如何搭建产品的数据指标体系？请说明如何从业务目标拆解到具体的监控指标。', tags: ['指标体系', '数据'] },
      { id: 'pm-s-5', content: '如何处理多方利益冲突？例如老板想加功能A、运营想要功能B、用户反馈想要功能C，但资源只够做一个。', tags: ['决策', '权衡'] },
    ],
    expert: [
      { id: 'pm-e-1', content: '作为产品负责人，你如何定义产品的长期愿景和短期目标？如何让团队对产品方向有清晰的共识？', tags: ['产品愿景', '领导力'] },
      { id: 'pm-e-2', content: '请分析一个行业变革（如AI大模型对SaaS产品的影响），你作为产品Leader会如何调整产品策略来应对？', tags: ['行业分析', '策略'] },
      { id: 'pm-e-3', content: '如何从0组建和培养一支高效的产品团队？请说明你的招聘标准、培养体系和团队文化。', tags: ['团队建设', '管理'] },
    ],
  },
};

// ==================== HR 通用 ====================
const hrQuestions: PositionBank = {
  positionId: 'pos-hr',
  positionName: 'HR-通用面试',
  levels: {
    junior: [
      { id: 'hr-j-1', content: '请描述一次你在团队中遇到冲突的经历，你是如何处理的？结果如何？', tags: ['团队协作', '冲突处理'] },
      { id: 'hr-j-2', content: '请举一个具体的例子说明你是如何快速学习一项新技能的。', tags: ['学习能力', '成长'] },
      { id: 'hr-j-3', content: '请分享一次你承受较大工作压力的经历，你是如何应对的？', tags: ['抗压能力', '情绪管理'] },
      { id: 'hr-j-4', content: '你认为自己最大的优点和缺点是什么？请各举一个实际的例子。', tags: ['自我认知', '反思'] },
      { id: 'hr-j-5', content: '为什么选择我们公司？你对这个岗位有什么了解？', tags: ['求职动机', '职业规划'] },
      { id: 'hr-j-6', content: '请描述你的职业规划：未来3-5年你想达到什么目标？', tags: ['职业规划', '目标'] },
      { id: 'hr-j-7', content: '你喜欢什么样的工作环境和团队氛围？请用过去的经历来说明。', tags: ['工作偏好', '文化匹配'] },
      { id: 'hr-j-8', content: '请描述一次你主动承担责任超出你职责范围的经历，你为什么要这样做？', tags: ['主动性', '责任感'] },
    ],
    middle: [
      { id: 'hr-m-1', content: '请分享一次你推动团队变革的经历。你是如何说服持不同意见的同事的？', tags: ['影响力', '变革推动'] },
      { id: 'hr-m-2', content: '请用STAR法则描述你最有成就感的一个项目或任务。', tags: ['STAR', '成就'] },
      { id: 'hr-m-3', content: '当你同时面对多个紧急任务时，你是如何确定优先级和分配时间的？', tags: ['时间管理', '优先级'] },
      { id: 'hr-m-4', content: '请举一个例子说明你是如何给同事提出建设性反馈的。对方如何反应？', tags: ['反馈', '沟通'] },
      { id: 'hr-m-5', content: '请描述一次你做出的不受欢迎但正确的决策。你是如何评估和执行的？', tags: ['决策力', '勇气'] },
      { id: 'hr-m-6', content: '如果你的上级给了你一个你认为不合理的任务，你会怎么处理？', tags: ['向上管理', '沟通'] },
      { id: 'hr-m-7', content: '请分享一个你在没有明确指导的情况下独立完成的任务。你如何确定方向和方案？', tags: ['自主性', '解决问题'] },
      { id: 'hr-m-8', content: '请描述一次失败的经历，你从中学到了什么？如果重来你会怎么做？', tags: ['失败', '成长'] },
    ],
    senior: [
      { id: 'hr-s-1', content: '请分享一个你从零组建团队的经历。你是如何选人、培养和建立团队文化的？', tags: ['团队建设', '领导力'] },
      { id: 'hr-s-2', content: '当公司战略方向调整时，你是如何带领团队适应变化的？请举一个具体的例子。', tags: ['变革管理', '适应性'] },
      { id: 'hr-s-3', content: '请描述一个你推动跨部门合作的案例，遇到了哪些困难，你是如何解决的？', tags: ['跨部门协作', '影响力'] },
      { id: 'hr-s-4', content: '你如何衡量团队的成功？请分享你建立过的团队绩效考核体系或OKR体系。', tags: ['绩效管理', 'OKR'] },
      { id: 'hr-s-5', content: '当团队出现绩效不佳的成员时，你的处理流程是什么？请分享一个具体的案例。', tags: ['绩效改进', '管理'] },
      { id: 'hr-s-6', content: '请分享一次你成功争取到关键资源（预算、人力、时间）的经历，你是如何说服决策者的？', tags: ['资源争取', '说服力'] },
    ],
    expert: [
      { id: 'hr-e-1', content: '作为高层管理者，你如何平衡短期业绩压力和长期战略投入之间的关系？请举实际案例。', tags: ['战略思维', '平衡'] },
      { id: 'hr-e-2', content: '请描述你经历过的最大的一次组织变革，你扮演了什么角色？学到了什么？', tags: ['组织变革', '领导力'] },
      { id: 'hr-e-3', content: '你认为一个优秀的组织文化是什么样的？你如何在自己的团队或公司中践行这些理念？', tags: ['组织文化', '价值观'] },
    ],
  },
};

// ==================== 导出题库 ====================
export const questionBanks: PositionBank[] = [
  javaQuestions,
  feQuestions,
  pmQuestions,
  hrQuestions,
];

// ==================== 自我介绍（所有岗位通用第一题） ====================
export const SELF_INTRO_QUESTIONS: QuestionTemplate[] = [
  {
    id: 'intro-1',
    content: '你好！欢迎参加本次模拟面试。首先请做一个简单的自我介绍，重点说说你在相关领域的项目经验和技术栈。',
    tags: ['自我介绍', '综合'],
  },
  {
    id: 'intro-2',
    content: '欢迎来到模拟面试！请你先自我介绍一下，包括你的教育背景、工作经历以及你最擅长的技术方向。',
    tags: ['自我介绍', '综合'],
  },
  {
    id: 'intro-3',
    content: '面试开始！请用3-5分钟介绍一下你自己，重点突出你的核心竞争力和你最引以为豪的项目成果。',
    tags: ['自我介绍', '综合'],
  },
];

// ==================== 题库抽题工具函数 ====================

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 根据岗位ID和难度获取题目列表
 * @param positionId 岗位ID（如 pos-java-middle）
 * @param difficulty 难度等级 (junior/middle/senior/expert)
 * @param count 需要的题目数量（不含第一题自我介绍）
 * @returns 题目数组，顺序由易到难
 */
export function getQuestionsForInterview(
  positionId: string,
  difficulty: string,
  count: number,
): QuestionTemplate[] {
  // 找到匹配的题库
  const bank = questionBanks.find((b) => positionId.startsWith(b.positionId));
  const defaultBank = questionBanks[0]; // fallback: Java

  const targetBank = bank || defaultBank;
  const levels = targetBank.levels;

  // 定义难度递进：根据目标难度选择相应的题目池
  const levelOrder = ['junior', 'middle', 'senior', 'expert'];
  const targetLevelIdx = levelOrder.indexOf(difficulty);
  const startIdx = Math.max(0, targetLevelIdx - 1); // 从低一级开始

  const pool: QuestionTemplate[] = [];

  // 按难度递进收集题目：由易到难
  for (let i = startIdx; i <= targetLevelIdx + 1 && i < levelOrder.length; i++) {
    const levelQuestions = levels[levelOrder[i]];
    if (levelQuestions) {
      pool.push(...shuffle(levelQuestions));
    }
  }

  // 去重并取所需数量
  const selected: QuestionTemplate[] = [];
  const seen = new Set<string>();

  for (const q of pool) {
    if (selected.length >= count) break;
    if (!seen.has(q.id)) {
      seen.add(q.id);
      selected.push(q);
    }
  }

  // 如果题目不够，从所有级别中补充
  if (selected.length < count) {
    const allQuestions = shuffle(Object.values(levels).flat());
    for (const q of allQuestions) {
      if (selected.length >= count) break;
      if (!seen.has(q.id)) {
        seen.add(q.id);
        selected.push(q);
      }
    }
  }

  return selected;
}

/**
 * 获取随机自我介绍题目
 */
export function getSelfIntroQuestion(): QuestionTemplate {
  return SELF_INTRO_QUESTIONS[Math.floor(Math.random() * SELF_INTRO_QUESTIONS.length)];
}
