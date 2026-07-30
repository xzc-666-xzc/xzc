// ============================================================
// 面试题库 — 按岗位、难度分级，支持随机抽取
// 题目来源：大厂面试真题、LeetCode、牛客网、实际企业面试题库
// ============================================================

export interface QuestionTemplate {
  id: string;
  content: string;
  tags: string[];
}

export interface PositionBank {
  positionId: string;
  positionName: string;
  levels: {
    [level: string]: QuestionTemplate[];
  };
}

// ============================================================
// 1. Java 后端开发 (~100题)
// ============================================================
const javaQuestions: PositionBank = {
  positionId: 'pos-java',
  positionName: 'Java后端开发',
  levels: {
    junior: [
      { id: 'java-j-1', content: '请解释Java面向对象的三大特性：封装、继承和多态，并各举一个实际开发中的例子。', tags: ['Java基础', 'OOP'] },
      { id: 'java-j-2', content: 'String、StringBuilder和StringBuffer的区别是什么？为什么String是不可变的？不可变有什么好处？', tags: ['Java基础', '字符串'] },
      { id: 'java-j-3', content: '什么是自动装箱和拆箱？在什么场景下会触发？会带来什么性能问题？', tags: ['Java基础', '包装类'] },
      { id: 'java-j-4', content: 'ArrayList和LinkedList的底层数据结构分别是什么？在头部插入、中间插入、随机访问三种场景下性能差异如何？', tags: ['集合', '数据结构'] },
      { id: 'java-j-5', content: 'HashMap的底层实现原理是什么？JDK 8中为什么引入红黑树？红黑树转换的阈值是多少？', tags: ['集合', 'HashMap'] },
      { id: 'java-j-6', content: '请解释Java异常体系：Error和Exception的区别，checked和unchecked异常分别是什么？', tags: ['异常处理'] },
      { id: 'java-j-7', content: '什么是Java反射机制？如何通过反射获取类的私有字段并修改其值？反射有什么性能开销？', tags: ['反射'] },
      { id: 'java-j-8', content: '== 和 equals() 的区别是什么？重写equals()时为什么必须重写hashCode()？', tags: ['Java基础'] },
      { id: 'java-j-9', content: '接口(interface)和抽象类(abstract class)有什么区别？JDK 8之后接口有哪些新特性？', tags: ['OOP'] },
      { id: 'java-j-10', content: 'final、finally、finalize分别是什么？finalize方法为什么不被推荐使用了？', tags: ['Java基础'] },
      { id: 'java-j-11', content: '什么是泛型？Java泛型的类型擦除是什么？如何通过反射绕过泛型检查？', tags: ['泛型'] },
      { id: 'java-j-12', content: '什么是Java的深拷贝和浅拷贝？如何实现一个深拷贝？', tags: ['Java基础'] },
      { id: 'java-j-13', content: '什么是内部类？静态内部类和非静态内部类有什么区别？匿名内部类如何使用？', tags: ['Java基础'] },
      { id: 'java-j-14', content: '请解释Java中的四种引用类型：强引用、软引用、弱引用、虚引用，以及它们的应用场景。', tags: ['引用', 'GC'] },
      { id: 'java-j-15', content: '什么是序列化(Serialization)？serialVersionUID的作用是什么？transient关键字有什么用？', tags: ['序列化'] },
      { id: 'java-j-16', content: '请讲解Java中的IO流体系：字节流和字符流的区别，以及NIO相比传统IO的优势。', tags: ['IO', 'NIO'] },
      { id: 'java-j-17', content: '什么是Java注解(Annotation)？元注解有哪些？如何自定义一个注解并使用反射解析？', tags: ['注解'] },
      { id: 'java-j-18', content: '如何理解Java中的this和super关键字？构造方法中调用this()和super()有什么限制？', tags: ['Java基础'] },
      { id: 'java-j-19', content: '什么是Java的动态代理？JDK动态代理和CGLIB代理有什么区别？分别适用于什么场景？', tags: ['代理', 'AOP'] },
      { id: 'java-j-20', content: '请解释Java中的Lambda表达式和方法引用。Lambda表达式是如何实现的？', tags: ['Lambda', '函数式编程'] },
      { id: 'java-j-21', content: 'Stream API中map和flatMap的区别是什么？collect方法有哪些常用Collector？', tags: ['Stream'] },
      { id: 'java-j-22', content: '如何正确地在遍历ArrayList时删除元素？为什么增强for循环中删除会抛出ConcurrentModificationException？', tags: ['集合'] },
      { id: 'java-j-23', content: 'Java中创建线程有哪几种方式？Runnable和Callable的区别是什么？', tags: ['多线程'] },
      { id: 'java-j-24', content: '请解释synchronized关键字的用法：修饰普通方法、静态方法、代码块，各自的锁对象是什么？', tags: ['多线程', '锁'] },
      { id: 'java-j-25', content: '什么是volatile关键字？它能保证原子性吗？什么场景下适合使用volatile？', tags: ['多线程'] },
    ],
    middle: [
      { id: 'java-m-1', content: 'Spring Boot的自动配置原理是什么？@SpringBootApplication注解包含了哪些注解？如何自定义一个Starter？', tags: ['Spring Boot'] },
      { id: 'java-m-2', content: '请讲解Spring IoC容器的初始化流程：BeanDefinition的加载、Bean的创建和依赖注入过程。', tags: ['Spring', 'IoC'] },
      { id: 'java-m-3', content: 'Spring AOP的实现原理是什么？JDK动态代理和CGLIB代理在Spring中是如何选择的？', tags: ['Spring', 'AOP'] },
      { id: 'java-m-4', content: 'Spring中事务的传播行为有哪些？@Transactional在什么情况下会失效？', tags: ['Spring', '事务'] },
      { id: 'java-m-5', content: 'MySQL索引的底层数据结构为什么选择B+树而不是B树或红黑树？联合索引的最左前缀原则是什么？', tags: ['MySQL', '索引'] },
      { id: 'java-m-6', content: '如何分析SQL执行计划？请解释EXPLAIN输出的各个字段含义，以及如何根据结果进行优化。', tags: ['MySQL', '优化'] },
      { id: 'java-m-7', content: 'MySQL的MVCC机制是如何实现的？不同事务隔离级别在MVCC下的表现有何不同？', tags: ['MySQL', 'MVCC'] },
      { id: 'java-m-8', content: 'Redis有哪些数据类型？各自适合什么场景？请说明String、Hash、List、Set、ZSet的底层实现。', tags: ['Redis'] },
      { id: 'java-m-9', content: '什么是缓存穿透、缓存击穿、缓存雪崩？各自的解决方案是什么？', tags: ['Redis', '缓存'] },
      { id: 'java-m-10', content: 'Redis的过期策略和内存淘汰策略有哪些？如何选择合适的策略？', tags: ['Redis'] },
      { id: 'java-m-11', content: '如何保证Redis和数据库的双写一致性？请分析先删缓存再更新DB和先更新DB再删缓存的优劣。', tags: ['Redis', '一致性'] },
      { id: 'java-m-12', content: 'JVM内存模型是什么样的？请说明堆、栈、方法区、程序计数器各自存储什么内容。', tags: ['JVM'] },
      { id: 'java-m-13', content: '请介绍常见的GC算法（标记-清除、标记-整理、复制算法）以及各代使用的垃圾回收器。', tags: ['JVM', 'GC'] },
      { id: 'java-m-14', content: 'ConcurrentHashMap在JDK 7和JDK 8中的实现有什么不同？如何保证线程安全的？', tags: ['并发', '集合'] },
      { id: 'java-m-15', content: '线程池的核心参数有哪些？线程池的工作流程是什么？如何合理配置线程池大小？', tags: ['线程池'] },
      { id: 'java-m-16', content: 'ThreadLocal的实现原理是什么？为什么会发生内存泄漏？如何解决？', tags: ['并发'] },
      { id: 'java-m-17', content: 'AQS（AbstractQueuedSynchronizer）的实现原理是什么？ReentrantLock是如何基于AQS实现的？', tags: ['并发', '锁'] },
      { id: 'java-m-18', content: 'synchronized和ReentrantLock的区别是什么？在什么场景下选择ReentrantLock？', tags: ['并发', '锁'] },
      { id: 'java-m-19', content: '请讲解微服务架构的核心组件：注册中心、配置中心、网关、负载均衡、限流熔断各自的作用。', tags: ['微服务'] },
      { id: 'java-m-20', content: 'Ribbon或Spring Cloud LoadBalancer的负载均衡策略有哪些？如何实现自定义负载均衡？', tags: ['微服务'] },
      { id: 'java-m-21', content: 'Sentinel或Hystrix的熔断降级原理是什么？熔断器的三种状态是如何切换的？', tags: ['熔断', '降级'] },
      { id: 'java-m-22', content: '消息队列在项目中解决了什么问题？如何保证消息的可靠投递和不重复消费？', tags: ['MQ'] },
      { id: 'java-m-23', content: '什么是分布式锁？用Redis实现分布式锁需要注意什么问题？Redisson的看门狗机制是什么？', tags: ['分布式', '锁'] },
      { id: 'java-m-24', content: 'MyBatis中#{}和${}的区别是什么？为什么推荐使用#{}？MyBatis的缓存机制是怎样的？', tags: ['MyBatis'] },
      { id: 'java-m-25', content: '设计模式中单例模式的几种实现方式（饿汉式、懒汉式、双重检查锁、静态内部类、枚举）各有什么优缺点？', tags: ['设计模式'] },
      { id: 'java-m-26', content: '请解释策略模式、观察者模式、模板方法模式，并举例说明在Spring框架中哪里用到了这些模式。', tags: ['设计模式'] },
      { id: 'java-m-27', content: '什么是CAP理论？在分布式系统中如何权衡一致性、可用性和分区容错性？', tags: ['分布式', 'CAP'] },
      { id: 'java-m-28', content: '请介绍BASE理论和最终一致性。与ACID有什么不同？', tags: ['分布式'] },
      { id: 'java-m-29', content: '如何设计一个全局唯一ID生成服务？请对比雪花算法、数据库号段、UUID等方案的优劣。', tags: ['分布式', 'ID生成'] },
      { id: 'java-m-30', content: '什么是OOM？如何排查OOM问题？请说明jmap、jstack、jstat等工具的使用场景。', tags: ['JVM', '故障排查'] },
    ],
    senior: [
      { id: 'java-s-1', content: '请设计一个支持千万级DAU的推送系统。需要考虑消息存储、实时推送、离线消息、多端同步、消息可靠性和延迟等。', tags: ['系统设计'] },
      { id: 'java-s-2', content: '从单体架构到微服务架构的演进路径是怎样的？什么时候应该做服务拆分？拆分的原则和粒度如何把控？', tags: ['架构演进'] },
      { id: 'java-s-3', content: '如何设计一个可靠的分布式事务方案？请深入对比2PC、TCC、Saga模式和本地消息表的实现原理、优缺点和适用场景。', tags: ['分布式事务'] },
      { id: 'java-s-4', content: '请深入分析CMS和G1垃圾回收器的原理和区别。什么场景下应该选择G1？如何调优G1的暂停时间？', tags: ['JVM', 'GC'] },
      { id: 'java-s-5', content: '在什么场景下会发生Full GC？如何通过GC日志分析判断Full GC的原因？你有哪些优化实践？', tags: ['JVM调优'] },
      { id: 'java-s-6', content: '如何实现一个高可用的配置中心？请分析Nacos、Apollo的实现原理，以及如何处理配置推送的实时性和一致性。', tags: ['配置中心'] },
      { id: 'java-s-7', content: '如何设计一个通用的分布式任务调度系统？需要考虑任务分片、故障转移、动态调度、幂等等问题。', tags: ['分布式', '调度'] },
      { id: 'java-s-8', content: '请设计一个支持海量数据的实时计算系统。如何选型Flink/Spark Streaming/Storm？各自的适用场景是什么？', tags: ['大数据', '实时计算'] },
      { id: 'java-s-9', content: '当线上系统出现CPU飙升到100%时，你的排查思路是什么？请说明你会使用哪些命令和工具，以及分析的步骤。', tags: ['故障排查', '性能'] },
      { id: 'java-s-10', content: '什么是服务网格(Service Mesh)？Istio的架构是怎样的？和Spring Cloud等传统微服务框架相比有哪些优劣？', tags: ['Service Mesh'] },
      { id: 'java-s-11', content: '如何设计一个支持多租户的SaaS平台？数据库隔离有哪些方案？如何保证租户间的数据安全和性能隔离？', tags: ['SaaS', '多租户'] },
      { id: 'java-s-12', content: '请深入分析MySQL的锁机制：全局锁、表锁、行锁、间隙锁、临键锁各自的使用场景和加锁规则。', tags: ['MySQL', '锁'] },
      { id: 'java-s-13', content: '如何处理数据库的分库分表？请说明垂直拆分和水平拆分的策略、分布式ID生成、跨库查询和分页等问题的解决方案。', tags: ['分库分表'] },
      { id: 'java-s-14', content: 'Redis Cluster的实现原理是什么？Gossip协议是如何工作的？Redis Cluster的故障转移流程是怎样的？', tags: ['Redis', '集群'] },
      { id: 'java-s-15', content: '如何设计一个高并发秒杀系统？请从限流、削峰、防超卖、性能优化等角度全面分析，并画出架构图。', tags: ['高并发', '系统设计'] },
      { id: 'java-s-16', content: '网络编程中select、poll、epoll的区别是什么？Netty是如何基于epoll实现高性能网络通信的？', tags: ['网络编程', 'Netty'] },
      { id: 'java-s-17', content: '什么是零拷贝(Zero Copy)？Java中的mmap和sendfile是如何实现零拷贝的？Kafka为什么这么快？', tags: ['零拷贝', '性能'] },
      { id: 'java-s-18', content: '如何进行技术选型？请以你实际经历过的项目为例，说明你是如何评估不同技术方案并做出最终决策的。', tags: ['技术选型'] },
      { id: 'java-s-19', content: '如何设计和实施一个完整的服务治理体系？包括服务注册发现、配置中心、限流熔断、链路追踪、日志收集和监控告警。', tags: ['服务治理'] },
      { id: 'java-s-20', content: '面对突发流量（如大促），你的全链路压测和容量规划方案是什么？请从接入层、应用层、数据层分别阐述。', tags: ['容量规划'] },
      { id: 'java-s-21', content: '什么是DDD（领域驱动设计）？请解释聚合根、实体、值对象、领域服务、限界上下文等核心概念并举例说明。', tags: ['DDD'] },
      { id: 'java-s-22', content: '如何实现一个可靠的数据同步系统？涉及异构数据源、增量同步、全量同步、数据校验和冲突解决等。', tags: ['数据同步'] },
      { id: 'java-s-23', content: '什么是响应式编程(Reactive Programming)？Spring WebFlux和Spring MVC有什么区别？什么场景适合用响应式？', tags: ['响应式'] },
      { id: 'java-s-24', content: '请讲解Kafka的架构设计：Topic、Partition、Consumer Group、ISR机制。如何保证消息的顺序性和不丢失？', tags: ['Kafka'] },
      { id: 'java-s-25', content: '容器化部署中，Java应用的JVM参数应该如何调优？如何合理设置容器的内存限制和JVM的堆大小？', tags: ['容器', 'JVM'] },
    ],
    expert: [
      { id: 'java-e-1', content: '作为技术负责人，你要带领团队从零搭建一个企业级微服务平台，请制定完整的技术蓝图，从组织架构、技术选型、交付流程三个维度展开。', tags: ['技术管理'] },
      { id: 'java-e-2', content: '请深入对比分析云原生技术栈：Kubernetes的核心概念、声明式API的设计理念、Operator模式，以及如何构建一个云原生Java应用。', tags: ['云原生'] },
      { id: 'java-e-3', content: '如何设计和实施一个企业级的灰度发布/蓝绿发布系统？涉及流量路由、回滚策略、监控验证和技术风险控制。', tags: ['发布系统'] },
      { id: 'java-e-4', content: '请分析大模型（LLM）对软件工程的影响：如何将AI能力集成到现有系统中？LangChain、Spring AI等框架的适用场景是什么？', tags: ['AI', 'LLM'] },
      { id: 'java-e-5', content: '如果你的系统需要从Oracle迁移到MySQL，你会如何规划和执行？请制定分阶段的迁移方案，包括数据迁移、SQL兼容性改造和性能验证。', tags: ['数据库迁移'] },
      { id: 'java-e-6', content: '如何构建一个企业级的可观测性平台？从指标(Metrics)、链路(Tracing)、日志(Logging)三个维度设计，并说明技术选型方案。', tags: ['可观测性'] },
      { id: 'java-e-7', content: '什么是混沌工程(Chaos Engineering)？如何设计和实施混沌实验来验证系统的韧性？请以你负责的系统为例说明。', tags: ['混沌工程'] },
      { id: 'java-e-8', content: '如何做好跨部门的技术协作？当业务方提出一个技术上难以实现的需求时，你作为技术Leader会如何沟通和推进？', tags: ['协作', '领导力'] },
      { id: 'java-e-9', content: '什么是平台工程(Platform Engineering)？如何构建一个高效的内部开发者平台(IDP)来提升研发效能？', tags: ['平台工程'] },
      { id: 'java-e-10', content: '请制定一份团队技术能力提升计划：如何建立技术氛围、推动Code Review文化、组织技术分享和制定成长路径。', tags: ['团队建设'] },
      { id: 'java-e-11', content: '请深入讲解Java模块化系统(JPMS)的设计思想，以及如何在大型项目中落地Java 9+的模块化。', tags: ['JPMS'] },
      { id: 'java-e-12', content: '什么是GraalVM？Native Image的编译原理是什么？什么场景适合使用GraalVM Native Image来提升Java应用的启动速度？', tags: ['GraalVM'] },
      { id: 'java-e-13', content: '如何设计和实施一个全链路压测系统？包括流量录制与回放、数据隔离、压测标记传递和风险控制。', tags: ['压测'] },
      { id: 'java-e-14', content: '请分析主流API网关（Kong/APISIX/Spring Cloud Gateway）的架构设计、性能对比和选型建议。', tags: ['API网关'] },
      { id: 'java-e-15', content: '面对一个已经运行多年、技术债务严重的老系统，你会如何制定重构策略？请阐述你的重构方法论和分阶段实施计划。', tags: ['重构', '技术债'] },
      { id: 'java-e-16', content: '请设计一个支持多数据中心的数据同步和灾备方案。如何保证数据一致性？如何做自动故障切换？', tags: ['灾备', '多活'] },
      { id: 'java-e-17', content: '如何做开源项目的选型和治理？当一个关键依赖的开源项目停止维护时，你的应对方案是什么？', tags: ['开源治理'] },
      { id: 'java-e-18', content: '请深入讲解Java的Project Loom（虚拟线程），它解决了什么问题？对现有的线程池模型和异步编程有什么影响？', tags: ['虚拟线程'] },
      { id: 'java-e-19', content: '如何从技术层面保障数据安全与合规（GDPR/个人信息保护法）？包括数据加密、脱敏、审计、数据生命周期管理等方面。', tags: ['数据安全'] },
      { id: 'java-e-20', content: '作为CTO/技术VP，你会如何制定公司的技术战略？如何平衡业务交付和技术创新的投入比例？', tags: ['技术战略'] },
    ],
  },
};

// ============================================================
// 2. 前端开发 (~100题)
// ============================================================
const feQuestions: PositionBank = {
  positionId: 'pos-fe',
  positionName: '前端开发',
  levels: {
    junior: [
      { id: 'fe-j-1', content: '请解释CSS盒模型，content-box和border-box的区别是什么？为什么很多CSS框架默认设置box-sizing: border-box？', tags: ['CSS'] },
      { id: 'fe-j-2', content: 'var、let和const的区别是什么？什么是变量提升(hoisting)和暂时性死区(TDZ)？', tags: ['JavaScript'] },
      { id: 'fe-j-3', content: '请讲解JavaScript中的事件冒泡和事件捕获机制。如何使用事件委托来优化性能？', tags: ['JavaScript', '事件'] },
      { id: 'fe-j-4', content: '什么是闭包(Closure)？闭包会导致什么问题？举三个闭包的实际应用场景。', tags: ['JavaScript'] },
      { id: 'fe-j-5', content: '请详细解释Flex布局：justify-content、align-items、align-content、flex-grow、flex-shrink、flex-basis各自的作用。', tags: ['CSS', '布局'] },
      { id: 'fe-j-6', content: 'JavaScript的原型链(Prototype Chain)是什么？ES6的class语法糖底层是如何实现的？', tags: ['JavaScript'] },
      { id: 'fe-j-7', content: '浏览器的同源策略是什么？跨域解决方案CORS的简单请求和复杂请求有什么区别？预检请求(Preflight)什么时候触发？', tags: ['浏览器', '跨域'] },
      { id: 'fe-j-8', content: '请解释JavaScript中的this指向规则：普通函数、箭头函数、call/apply/bind分别如何确定this？', tags: ['JavaScript'] },
      { id: 'fe-j-9', content: '什么是CSS的BFC（块级格式化上下文）？如何触发BFC？BFC能解决哪些布局问题？', tags: ['CSS'] },
      { id: 'fe-j-10', content: 'Cookie、LocalStorage和SessionStorage的区别是什么？各自的容量限制和使用场景是什么？', tags: ['浏览器', '存储'] },
      { id: 'fe-j-11', content: '什么是深拷贝和浅拷贝？请手动实现一个深拷贝函数，需要处理循环引用、Date、RegExp等特殊情况。', tags: ['JavaScript'] },
      { id: 'fe-j-12', content: '请解释JavaScript中的异步编程：回调、Promise、async/await的演进过程。Promise.all和Promise.race的区别是什么？', tags: ['JavaScript', '异步'] },
      { id: 'fe-j-13', content: '请说明HTML5新增了哪些语义化标签？使用语义化标签有什么好处？', tags: ['HTML5'] },
      { id: 'fe-j-14', content: '什么是响应式设计？请对比rem、em、vw/vh和媒体查询几种实现响应式方案的优劣。', tags: ['CSS', '响应式'] },
      { id: 'fe-j-15', content: 'Git中merge和rebase的区别是什么？在团队协作中推荐使用哪种策略？为什么？', tags: ['Git'] },
      { id: 'fe-j-16', content: '请解释ES6中的解构赋值、展开运算符和剩余参数，并举例说明它们的实际用途。', tags: ['ES6'] },
      { id: 'fe-j-17', content: '什么是伪类和伪元素？:nth-child和:nth-of-type的区别是什么？', tags: ['CSS'] },
      { id: 'fe-j-18', content: '移动端开发中如何解决1px边框问题？如何适配Retina高清屏？', tags: ['移动端'] },
      { id: 'fe-j-19', content: '什么是防抖(Debounce)和节流(Throttle)？请手写实现并说明适用场景。', tags: ['JavaScript'] },
      { id: 'fe-j-20', content: 'CSS中水平垂直居中有哪些实现方式？请至少列举5种并说明各自的适用场景。', tags: ['CSS'] },
      { id: 'fe-j-21', content: '请解释Event Loop机制：宏任务和微任务分别有哪些？它们的执行顺序是怎样的？', tags: ['JavaScript'] },
      { id: 'fe-j-22', content: '什么是HTTP缓存？强缓存和协商缓存分别通过哪些Header控制？cache-control的各个取值含义是什么？', tags: ['HTTP'] },
      { id: 'fe-j-23', content: '如何使用Chrome DevTools进行性能分析和内存泄漏排查？', tags: ['调试'] },
      { id: 'fe-j-24', content: '什么是Webpack的Loader和Plugin？两者的区别是什么？请举例说明常用的Loader和Plugin。', tags: ['构建工具'] },
      { id: 'fe-j-25', content: 'TypeScript中interface和type的区别是什么？什么时候用interface，什么时候用type？', tags: ['TypeScript'] },
    ],
    middle: [
      { id: 'fe-m-1', content: '请深入讲解React的虚拟DOM和Diff算法原理。React 18中Fiber架构解决了什么问题？', tags: ['React'] },
      { id: 'fe-m-2', content: 'React中useState、useEffect、useMemo、useCallback、useRef各自的使用场景是什么？useEffect的依赖数组为空、不传、传依赖有什么区别？', tags: ['React', 'Hooks'] },
      { id: 'fe-m-3', content: '请讲解Vue 3的响应式原理：Proxy相比Object.defineProperty有什么优势？ref和reactive的区别是什么？', tags: ['Vue'] },
      { id: 'fe-m-4', content: 'Vite为什么比Webpack快？请解释ES Module在开发阶段的优势和Vite的预构建机制。', tags: ['构建工具'] },
      { id: 'fe-m-5', content: '请讲解浏览器从输入URL到页面渲染的完整过程：DNS解析、TCP连接、HTTP请求、DOM解析、CSSOM构建、渲染树生成、Layout和Paint。', tags: ['浏览器'] },
      { id: 'fe-m-6', content: 'React中的状态管理方案选型：Context + useReducer、Zustand、Redux Toolkit、Jotai各自适合什么场景？', tags: ['React'] },
      { id: 'fe-m-7', content: '如何做前端性能优化？请从首屏加载、运行时性能、网络优化三个维度详细说明，并给出量化指标。', tags: ['性能优化'] },
      { id: 'fe-m-8', content: '请讲解HTTP/2的多路复用、头部压缩、服务器推送等特性，以及HTTP/3的QUIC协议改进。', tags: ['HTTP'] },
      { id: 'fe-m-9', content: '什么是XSS攻击和CSRF攻击？如何在前端层面防范这些安全威胁？CSP策略是什么？', tags: ['安全'] },
      { id: 'fe-m-10', content: '请讲解Webpack的打包原理：模块依赖图是如何构建的？代码分割(Code Splitting)和Tree Shaking的原理是什么？', tags: ['构建工具'] },
      { id: 'fe-m-11', content: 'JavaScript中的垃圾回收机制是怎样的？V8引擎的分代回收策略是什么？哪些操作容易导致内存泄漏？', tags: ['JavaScript', 'V8'] },
      { id: 'fe-m-12', content: '如何设计一个可复用的前端组件？请说明组件的封装原则、API设计、样式隔离和测试策略。', tags: ['组件设计'] },
      { id: 'fe-m-13', content: 'TypeScript的泛型如何使用？请举个高级泛型用法的例子（条件类型、映射类型、模板字面量类型）。', tags: ['TypeScript'] },
      { id: 'fe-m-14', content: '什么是CSS-in-JS？请对比styled-components、Emotion和CSS Modules的优劣。Tailwind CSS的原子化CSS思想有什么优势？', tags: ['CSS'] },
      { id: 'fe-m-15', content: '如何实现前端路由？请对比Hash路由和History路由的原理，以及React Router和Vue Router的实现差异。', tags: ['路由'] },
      { id: 'fe-m-16', content: '什么是前端国际化(i18n)？在大型项目中如何设计国际化方案？如何处理不同语言的排版差异？', tags: ['工程化'] },
      { id: 'fe-m-17', content: '请讲解Node.js的事件循环和浏览器事件循环的区别。Node.js中process.nextTick和setImmediate的优先级是怎样的？', tags: ['Node.js'] },
      { id: 'fe-m-18', content: '什么是BFF（Backend For Frontend）层？在什么场景下需要引入BFF？请设计一个BFF层的架构方案。', tags: ['架构'] },
      { id: 'fe-m-19', content: '如何做前端错误监控和性能监控？请设计一个完整的监控方案，包括错误捕获、性能数据上报、Source Map解析等。', tags: ['监控'] },
      { id: 'fe-m-20', content: '什么是WebAssembly？它在什么场景下能带来性能提升？前端中WebAssembly的典型应用有哪些？', tags: ['WebAssembly'] },
      { id: 'fe-m-21', content: '请解释Service Worker的原理和生命周期。PWA（渐进式Web应用）的核心技术有哪些？', tags: ['PWA'] },
      { id: 'fe-m-22', content: 'React 19/18中Suspense和Concurrent Mode的工作原理是什么？它们如何改善用户体验？', tags: ['React'] },
      { id: 'fe-m-23', content: '如何实现前端文件上传（大文件分片、断点续传、秒传）？请说明整体技术方案。', tags: ['实战'] },
      { id: 'fe-m-24', content: '什么是前端SDK设计？如何设计一个易用的第三方前端SDK？需要考虑哪些方面？', tags: ['SDK设计'] },
      { id: 'fe-m-25', content: '如何实现一个前端实时数据展示系统（如大屏可视化）？WebSocket、SSE和轮询各适合什么场景？', tags: ['实时'] },
      { id: 'fe-m-26', content: '请讲解CSS Grid布局和Flex布局的区别。什么布局用Grid更合适？复杂的网格布局如何实现？', tags: ['CSS'] },
      { id: 'fe-m-27', content: '什么是前端AST（抽象语法树）？Babel插件是如何工作的？如何用AST来做代码转换？', tags: ['编译'] },
      { id: 'fe-m-28', content: '如何在React中实现虚拟列表(Virtual List)？请说明固定高度和动态高度两种场景的实现方案。', tags: ['React', '虚拟列表'] },
      { id: 'fe-m-29', content: '请讲解Nginx在前端部署中的作用：反向代理、负载均衡、静态资源缓存、Gzip压缩等配置。', tags: ['部署'] },
      { id: 'fe-m-30', content: '前端的CI/CD流水线如何设计？从代码提交到自动构建、测试、部署的完整流程是怎样的？', tags: ['CI/CD'] },
    ],
    senior: [
      { id: 'fe-s-1', content: '请设计一个前端微服务（Micro Frontends）架构。对比qiankun、Module Federation、wujie等方案的优劣和适用场景。', tags: ['微前端'] },
      { id: 'fe-s-2', content: 'SSR（服务端渲染）和SSG（静态站点生成）的原理和选型：Next.js中的ISR是如何工作的？什么场景应该选择SSR/SSG/CSR？', tags: ['SSR'] },
      { id: 'fe-s-3', content: '请设计一个前端组件库的完整架构：包括组件设计规范、主题定制、按需加载、Tree Shaking、单元测试和文档生成。', tags: ['组件库'] },
      { id: 'fe-s-4', content: '如何在前端项目中实现一套完整的监控体系？包括错误监控（含SourceMap）、性能监控（FCP/LCP/TTI/CLS）、用户行为分析和报警策略。', tags: ['监控'] },
      { id: 'fe-s-5', content: '当一个中大型前端项目出现性能瓶颈时，你的排查和优化思路是什么？请结合具体案例说明完整的性能优化流程。', tags: ['性能优化'] },
      { id: 'fe-s-6', content: '如何设计一套适合大型团队的前端工程化体系？包括代码规范(ESLint/Prettier)、Git工作流、自动化测试、CI/CD和代码Review流程。', tags: ['工程化'] },
      { id: 'fe-s-7', content: '请深入比较React、Vue、Svelte和Solid.js的响应式原理和设计理念差异。分别适合什么场景？', tags: ['框架对比'] },
      { id: 'fe-s-8', content: '什么是前端低代码/无代码平台？请分析低代码平台的核心架构和技术难点，以及AI在低代码中的应用前景。', tags: ['低代码'] },
      { id: 'fe-s-9', content: '如何设计一个跨平台（Web/小程序/App）的前端技术方案？请对比Taro、uni-app、React Native、Flutter等方案。', tags: ['跨平台'] },
      { id: 'fe-s-10', content: '请设计一个前端网关层的架构方案，包括路由管理、权限控制、请求聚合、缓存策略和灰度发布。', tags: ['架构'] },
      { id: 'fe-s-11', content: '如何设计一个前端数据层？包括状态管理、数据缓存、请求去重、乐观更新和离线支持。', tags: ['数据层'] },
      { id: 'fe-s-12', content: '如何在大型前端项目中管理多环境配置和多主题方案？如何设计一个灵活的主题系统支持运行时切换？', tags: ['架构'] },
      { id: 'fe-s-13', content: '前端的安全性应该如何全面保障？从XSS/CSRF/CSP到依赖安全、数据加密、敏感信息保护等全面分析。', tags: ['安全'] },
      { id: 'fe-s-14', content: '什么是Web Components？和React/Vue组件有什么区别？是否适合作为企业级组件标准？', tags: ['Web Components'] },
      { id: 'fe-s-15', content: '请设计一个前端性能预算(Performance Budget)方案：如何制定性能指标阈值？如何集成到CI/CD中自动检测？', tags: ['性能'] },
      { id: 'fe-s-16', content: '在微前端架构中，如何处理公共依赖、样式隔离、JS沙箱、应用间通信和统一路由等核心问题？', tags: ['微前端'] },
      { id: 'fe-s-17', content: '如何做前端构建产物的分析和优化？请说明如何分析bundle体积、识别重复依赖、优化加载策略。', tags: ['构建优化'] },
      { id: 'fe-s-18', content: '什么是边缘计算(Edge Computing)？前端如何利用Edge Function来优化性能？比如在CDN边缘节点做AB测试、鉴权、地域重定向等。', tags: ['边缘计算'] },
      { id: 'fe-s-19', content: '如何设计一个前端自动化测试体系？单元测试、集成测试、E2E测试各占什么比例？选型Jest/Vitest/Playwright/Cypress的考量因素是什么？', tags: ['测试'] },
      { id: 'fe-s-20', content: '请设计一个前端灰度发布方案：如何控制灰度流量？如何处理版本兼容问题？出现问题时如何快速回滚？', tags: ['灰度发布'] },
      { id: 'fe-s-21', content: '如何做前端依赖管理？当依赖包出现安全漏洞时，你的处理流程是什么？如何平衡依赖升级的风险和收益？', tags: ['依赖管理'] },
      { id: 'fe-s-22', content: '什么是前端日志系统？如何设计前端日志的采集、上报、存储和查询方案？日志量和数据隐私如何平衡？', tags: ['日志'] },
      { id: 'fe-s-23', content: '请设计一个支持协同编辑的前端方案（如在线文档）。涉及OT算法或CRDT算法，以及光标同步和版本管理。', tags: ['协同编辑'] },
      { id: 'fe-s-24', content: '前端渲染引擎的演进：从jQuery到Virtual DOM到Signals（信号）。未来的前端响应式系统会朝什么方向发展？', tags: ['趋势'] },
      { id: 'fe-s-25', content: '如何利用AI辅助前端开发？包括代码生成（Copilot/v0）、自动化测试、UI设计转代码、智能重构等场景的实际应用。', tags: ['AI'] },
    ],
    expert: [
      { id: 'fe-e-1', content: '作为前端技术Leader，你如何制定前端技术发展路线？如何推动新技术落地并保证团队的稳定交付？', tags: ['技术管理'] },
      { id: 'fe-e-2', content: '如何从0搭建一个高效的前端团队？请说明你的招聘标准、梯队建设、技术培养和文化塑造方案。', tags: ['团队建设'] },
      { id: 'fe-e-3', content: '请设计一个企业级的前端基础设施平台：包括脚手架、组件库、监控平台、性能平台、发布平台等模块的完整架构。', tags: ['基础设施'] },
      { id: 'fe-e-4', content: '如何做前端技术架构的长期演进规划？面对快速变化的前端生态，如何判断哪些技术值得投入？', tags: ['架构规划'] },
      { id: 'fe-e-5', content: '在跨部门的大型项目中，前端如何与后端、产品、设计、QA高效协作？请分享你的协作方法论。', tags: ['协作'] },
      { id: 'fe-e-6', content: '如何建立前端代码质量度量体系？包括代码复杂度、重复率、测试覆盖率、技术债务量化等指标和相应的改进方案。', tags: ['质量'] },
      { id: 'fe-e-7', content: '当一个项目需要同时支持Web、小程序、App三端时，你会如何做技术选型和架构设计？请给出完整的对比分析和最终方案。', tags: ['多端'] },
      { id: 'fe-e-8', content: '如何做前端性能治理？当面对一个性能问题严重的存量项目，你的分阶段治理方案是什么？如何说服业务方投入资源做性能优化？', tags: ['性能治理'] },
      { id: 'fe-e-9', content: '请谈谈你对前端未来3-5年发展趋势的判断：哪些技术会消亡，哪些会成为主流？你如何帮助团队做好准备？', tags: ['趋势'] },
      { id: 'fe-e-10', content: '如何设计和落地前端领域的AI产品？比如智能UI生成、自动化测试用例生成、智能性能分析等场景的技术方案。', tags: ['AI'] },
      { id: 'fe-e-11', content: '大型前端项目的重构策略：如何对一个百万行代码级别的前端项目进行渐进式重构？技术选型迁移（如Vue转React）的完整方案。', tags: ['重构'] },
      { id: 'fe-e-12', content: '如何评估和提升前端研发效能？从需求到上线的全流程中，哪些环节可以优化？DORA指标在前端如何应用？', tags: ['研发效能'] },
      { id: 'fe-e-13', content: '前端安全的纵深防御体系：从开发阶段的安全编码、CI/CD阶段的安全扫描、运行时监控到应急响应的全链路方案。', tags: ['安全'] },
      { id: 'fe-e-14', content: 'Serverless在前端的应用：从SSR渲染、API BFF到边缘计算，前端如何充分利用Serverless架构提升效率和性能？', tags: ['Serverless'] },
      { id: 'fe-e-15', content: '作为技术负责人，如何做年度技术规划？如何向上汇报技术价值？如何向团队传递技术愿景？', tags: ['管理'] },
    ],
  },
};

// ============================================================
// 3. 产品经理 (~100题)
// ============================================================
const pmQuestions: PositionBank = {
  positionId: 'pos-pm',
  positionName: '产品经理',
  levels: {
    junior: [
      { id: 'pm-j-1', content: '什么是用户故事(User Story)？一个好的用户故事应该包含哪些要素？请举例说明。', tags: ['需求'] },
      { id: 'pm-j-2', content: 'PRD（产品需求文档）应该包含哪些核心内容？你认为一份好的PRD最重要的三个要素是什么？', tags: ['PRD'] },
      { id: 'pm-j-3', content: '什么是MVP（最小可行产品）？请以你熟悉的一款产品为例，说明你会如何定义它的MVP。', tags: ['MVP'] },
      { id: 'pm-j-4', content: '什么是用户画像(Persona)？如何创建有效的用户画像并指导产品决策？', tags: ['用户研究'] },
      { id: 'pm-j-5', content: '如何进行竞品分析？请列举你的分析框架和核心维度，并说明如何从竞品分析中提炼产品洞察。', tags: ['竞品分析'] },
      { id: 'pm-j-6', content: '什么是A/B测试？如何设计一个有效的A/B测试？样本量如何计算？如何判断结果是否显著？', tags: ['数据分析'] },
      { id: 'pm-j-7', content: '如何确定需求的优先级？请详细介绍KANO模型和RICE评分法，并对比它们的适用场景。', tags: ['优先级'] },
      { id: 'pm-j-8', content: '请描述一次你从用户反馈中发现需求并推动落地的完整过程，包括你的思考和决策逻辑。', tags: ['需求'] },
      { id: 'pm-j-9', content: '什么是用户体验五要素？请用一款你熟悉的产品分别阐述这五个层面的设计考量。', tags: ['UX'] },
      { id: 'pm-j-10', content: '产品经理如何进行用户访谈？访谈前、中、后分别需要做哪些准备和工作？', tags: ['用户研究'] },
      { id: 'pm-j-11', content: '什么是用户旅程地图(User Journey Map)？如何创建并利用它来发现产品改进机会？', tags: ['UX'] },
      { id: 'pm-j-12', content: '画一个你常用的产品的信息架构图，并说明你是如何判断信息层级和导航设计的。', tags: ['信息架构'] },
      { id: 'pm-j-13', content: '产品经理和项目经理的区别是什么？两者的工作边界在哪里？如何有效协作？', tags: ['角色认知'] },
      { id: 'pm-j-14', content: '什么是净推荐值(NPS)？如何设计和执行NPS调研？NPS的分数如何解读？', tags: ['指标'] },
      { id: 'pm-j-15', content: '如何写一份合格的产品周报？你会在周报中关注哪些核心数据和信息？', tags: ['沟通'] },
      { id: 'pm-j-16', content: '什么是敏捷开发？Scrum的各个角色和仪式是什么？产品经理在敏捷团队中的职责是什么？', tags: ['敏捷'] },
      { id: 'pm-j-17', content: '当开发说"这个需求做不了"时，你会怎么处理？请举例说明你的处理方式。', tags: ['沟通'] },
      { id: 'pm-j-18', content: '什么是用户留存率？如何计算？提升用户留存有哪些常用策略？', tags: ['增长'] },
      { id: 'pm-j-19', content: '产品上线前，你会如何进行验收？请列举你的上线Checklist。', tags: ['执行'] },
      { id: 'pm-j-20', content: '请解释C端产品和B端产品在设计理念上的核心差异。', tags: ['产品思维'] },
      { id: 'pm-j-21', content: '什么是用户场景(Scenario)？如何用场景驱动产品设计？请举例说明。', tags: ['设计方法'] },
      { id: 'pm-j-22', content: '如何进行有效的需求评审？你会邀请哪些角色参与？评审的流程是怎样的？', tags: ['评审'] },
      { id: 'pm-j-23', content: '什么是用户生命周期？不同阶段的运营策略有什么不同？', tags: ['运营'] },
      { id: 'pm-j-24', content: '产品经理需要关注哪些核心数据指标？请举例说明你会如何搭建产品的数据看板。', tags: ['数据'] },
      { id: 'pm-j-25', content: '什么是功能开关(Feature Flag)？在产品迭代中如何使用功能开关来降低发布风险？', tags: ['迭代'] },
    ],
    middle: [
      { id: 'pm-m-1', content: '请设计一款面向Z世代的社交产品。说明核心功能、差异化定位、商业模式和增长策略。', tags: ['产品设计'] },
      { id: 'pm-m-2', content: '什么是北极星指标？请以你熟悉的产品为例，分析它的北极星指标以及它是如何拆解到各团队的执行指标的。', tags: ['指标体系'] },
      { id: 'pm-m-3', content: '如何做产品路线图(Roadmap)？请说明你是如何平衡长期战略需求和短期业务目标的。', tags: ['规划'] },
      { id: 'pm-m-4', content: '请选一款你常用的产品，分析它的盈利模式（商业模式画布），并指出你认为可以改进的方向。', tags: ['商业分析'] },
      { id: 'pm-m-5', content: '如何用数据驱动产品决策？请分享一个你通过数据分析发现问题并推动产品改进的真实案例。', tags: ['数据分析'] },
      { id: 'pm-m-6', content: '什么是AARRR模型（海盗模型）？如何在不同阶段制定对应的产品策略？', tags: ['增长'] },
      { id: 'pm-m-7', content: '请分析短视频产品的核心竞争力是什么？抖音和视频号在产品策略上的差异是什么？', tags: ['产品分析'] },
      { id: 'pm-m-8', content: '你如何看待AI大模型对产品经理工作的影响？请举例说明AI在产品设计和运营中的应用场景。', tags: ['AI'] },
      { id: 'pm-m-9', content: '当老板、运营和用户对同一个需求有不同意见时，你会如何决策？请用实际的决策框架来说明。', tags: ['决策'] },
      { id: 'pm-m-10', content: '如何做产品定价？请介绍成本导向、竞争导向和价值导向三种定价策略，并分析各自的适用场景。', tags: ['定价'] },
      { id: 'pm-m-11', content: '什么是增长黑客(Growth Hacking)？请分享一个你印象深刻的增长案例，并分析其核心逻辑。', tags: ['增长'] },
      { id: 'pm-m-12', content: '如何做需求分析？从用户反馈、数据分析、竞品调研等多渠道获取需求后，你如何筛选和提炼有效需求？', tags: ['需求分析'] },
      { id: 'pm-m-13', content: '请详细分析一个你认为是失败的产品或功能，它为什么会失败？如果是你来做，会如何避免？', tags: ['产品分析'] },
      { id: 'pm-m-14', content: '什么是平台型产品？双边市场（如电商、外卖）的核心挑战是什么？如何解决冷启动问题？', tags: ['平台'] },
      { id: 'pm-m-15', content: '如何做好跨部门协作？当你需要推动一个涉及技术、运营、市场多部门的复杂项目时，你的策略是什么？', tags: ['协作'] },
      { id: 'pm-m-16', content: '在产品迭代中如何做减法？当产品功能越来越臃肿时，你怎么判断哪些功能该砍掉？', tags: ['产品策略'] },
      { id: 'pm-m-17', content: '请设计一个积分/会员体系。需要考虑用户分层、权益设计、成本控制和体验的平衡。', tags: ['会员体系'] },
      { id: 'pm-m-18', content: '什么是网络效应？如何利用网络效应来构建产品的竞争壁垒？请举例说明。', tags: ['竞争壁垒'] },
      { id: 'pm-m-19', content: '如何进行产品国际化(出海)？在面向不同国家和地区时，产品设计需要做哪些本地化调整？', tags: ['国际化'] },
      { id: 'pm-m-20', content: '如何做产品的舆情监控和用户反馈管理？当出现大量负面反馈时，你的应急处理流程是什么？', tags: ['运营'] },
      { id: 'pm-m-21', content: '什么是产品的"啊哈时刻"(Aha Moment)？如何找到并放大产品的啊哈时刻来驱动增长？', tags: ['增长'] },
      { id: 'pm-m-22', content: '请分析订阅制(SaaS)和一次性付费模式的优劣。什么样的产品适合订阅制？如何设计订阅套餐？', tags: ['商业模式'] },
      { id: 'pm-m-23', content: '如何做用户分群和精细化运营？RFM模型在实际业务中如何应用？', tags: ['用户运营'] },
      { id: 'pm-m-24', content: '什么是产品的技术债？产品经理需要关注技术债吗？你如何平衡功能交付和技术优化？', tags: ['技术债'] },
      { id: 'pm-m-25', content: '请分享一次你成功推动一个困难项目的经历。你遇到了哪些阻力？你是如何克服的？', tags: ['执行力'] },
      { id: 'pm-m-26', content: '在产品设计中如何平衡用户体验和商业利益？请举一个你实际遇到的例子来说明。', tags: ['权衡'] },
      { id: 'pm-m-27', content: '如何衡量一个功能的价值？功能上线后你会关注哪些指标来判断它的成功与否？', tags: ['效果评估'] },
      { id: 'pm-m-28', content: '什么是产品市场匹配(PMF)？如何判断你的产品是否达到了PMF？', tags: ['PMF'] },
      { id: 'pm-m-29', content: '如何管理上级的预期？当领导提出一个你认为不合理的需求时，你会如何沟通？', tags: ['向上管理'] },
      { id: 'pm-m-30', content: '什么是产品的病毒系数(Viral Coefficient)？如何让产品自然地产生口碑传播？', tags: ['增长'] },
    ],
    senior: [
      { id: 'pm-s-1', content: '如果让你负责一条全新的产品线，你需要哪些信息来制定产品战略？请描述你从0到1搭建产品体系的完整思路。', tags: ['产品战略'] },
      { id: 'pm-s-2', content: 'B端和C端产品的设计差异在哪里？如果你从C端产品转到B端产品，你会如何调整工作方式？', tags: ['B端'] },
      { id: 'pm-s-3', content: '大模型时代，SaaS产品的形态会发生什么变化？请具体分析AI Agent对传统SaaS的颠覆性影响。', tags: ['AI', 'SaaS'] },
      { id: 'pm-s-4', content: '如何搭建一个产品的数据指标体系？请从北极星指标开始，逐层拆解到各团队的执行指标和监控指标。', tags: ['指标体系'] },
      { id: 'pm-s-5', content: '什么是产品的护城河？在激烈的市场竞争中，如何构建可持续的竞争壁垒？', tags: ['竞争策略'] },
      { id: 'pm-s-6', content: '如何管理产品组合(Product Portfolio)？当资源有限时，如何在多个产品/功能之间做资源分配决策？', tags: ['产品组合'] },
      { id: 'pm-s-7', content: '一个大公司为什么要做创新业务？内部孵化和外部收购各有什么优劣？请分析大公司做创新的常见陷阱。', tags: ['创新'] },
      { id: 'pm-s-8', content: '如何做产品策略的复盘？请分享一个你主导的产品策略调整案例，说明背景、分析和结果。', tags: ['复盘'] },
      { id: 'pm-s-9', content: '在存量竞争的市场中，产品如何实现增长？请以电商或社交行业为例，分析增长瓶颈的突破策略。', tags: ['增长'] },
      { id: 'pm-s-10', content: '产品OKR应该如何制定？好的产品OKR和差的有什么区别？请举例说明。', tags: ['OKR'] },
      { id: 'pm-s-11', content: 'ToB产品的客户成功(CS)体系如何搭建？从售前、实施到售后，产品经理在其中扮演什么角色？', tags: ['客户成功'] },
      { id: 'pm-s-12', content: '什么是产品驱动的增长(PLG)？PLG和SLG（销售驱动增长）的适用场景各是什么？如何转型？', tags: ['PLG'] },
      { id: 'pm-s-13', content: '当用户的诉求与公司的商业目标冲突时，作为产品负责人你会如何权衡？请用实际案例说明。', tags: ['决策'] },
      { id: 'pm-s-14', content: '如何建立产品的用户反馈闭环？从反馈收集、分类、分析到落地改进，你的体系是怎样的？', tags: ['用户反馈'] },
      { id: 'pm-s-15', content: '产品经理如何提升商业思维？你平时会关注哪些商业信息？如何将商业洞察转化为产品策略？', tags: ['商业思维'] },
      { id: 'pm-s-16', content: '产品的数据隐私和合规问题：GDPR和中国个人信息保护法对产品设计有什么影响？如何平衡数据价值与合规？', tags: ['合规'] },
      { id: 'pm-s-17', content: '如何做好产品创新？请介绍一个你的产品创新方法论，并说明如何验证创新想法的可行性。', tags: ['创新'] },
      { id: 'pm-s-18', content: '在全球化产品的设计中，如何处理文化差异、法规差异和支付习惯差异？请分享你的国际化经验。', tags: ['国际化'] },
      { id: 'pm-s-19', content: '产品战略中的取舍艺术：当面临短期收入和长期用户价值的冲突时，你如何决策？', tags: ['战略'] },
      { id: 'pm-s-20', content: '如何用系统思维来做产品？请分析一个复杂的平台生态（如微信、淘宝）中各方参与者的利益关系和博弈。', tags: ['系统思维'] },
      { id: 'pm-s-21', content: '什么是产品市场调研的完整框架？如何通过定量和定性研究来验证产品假设？', tags: ['市场调研'] },
      { id: 'pm-s-22', content: '如何做产品的商业预测？当面对高度不确定的市场环境时，你如何做产品的战略规划？', tags: ['规划'] },
      { id: 'pm-s-23', content: '产品负责人和产品总监的核心能力差异是什么？从高级PM向产品Leader转型，最大的挑战是什么？', tags: ['职业发展'] },
      { id: 'pm-s-24', content: '如何管理一个10人以上的产品团队？你的管理理念和团队运作机制是怎样的？', tags: ['团队管理'] },
      { id: 'pm-s-25', content: '如何看待社区产品？社区的核心驱动力是什么？从冷启动到成熟期，不同阶段的运营策略是什么？', tags: ['社区'] },
    ],
    expert: [
      { id: 'pm-e-1', content: '作为产品VP/CPO，你如何定义公司的产品愿景？如何让整个组织对产品方向有清晰的理解和认同？', tags: ['领导力'] },
      { id: 'pm-e-2', content: '当公司战略发生重大调整时，你作为产品一号位如何带领团队应对？请分享一个你经历过的战略转型案例。', tags: ['战略转型'] },
      { id: 'pm-e-3', content: '如何构建一个优秀的产品文化？在你的理想中，什么样的产品文化和组织氛围最能激发创新？', tags: ['产品文化'] },
      { id: 'pm-e-4', content: 'AI时代产品经理的核心竞争力是什么？哪些产品工作会被AI替代？产品经理应该如何进化？', tags: ['AI'] },
      { id: 'pm-e-5', content: '如何打造一个产品驱动型组织？从组织架构、决策机制、激励机制到文化塑造，你的整体方案是什么？', tags: ['组织建设'] },
      { id: 'pm-e-6', content: '产品的商业化和用户体验的平衡：当一个决策可能在短期带来巨大商业利益但损害长期用户体验时，你如何做？', tags: ['决策'] },
      { id: 'pm-e-7', content: '什么是生态型产品？如何从一个工具产品逐步演化成平台和生态？请分析关键转折点和策略。', tags: ['生态'] },
      { id: 'pm-e-8', content: '如何做竞品防御和市场进攻？请分析在一个已经存在强势竞争对手的市场中，新产品的突围策略。', tags: ['竞争'] },
      { id: 'pm-e-9', content: '作为产品负责人，你如何向上管理和向下赋能？你与CEO/CTO/CMO的协作模式是怎样的？', tags: ['管理'] },
      { id: 'pm-e-10', content: '如何评估一个产品团队的健康度？你会看哪些指标来判断团队的产出质量和成长状态？', tags: ['团队'] },
      { id: 'pm-e-11', content: '在不确定性极高的创新业务中，如何平衡探索和交付？如何给团队设定合理的预期和目标？', tags: ['创新管理'] },
      { id: 'pm-e-12', content: '如何看待产品经理的边界？高级产品管理者是否需要懂技术、懂运营、懂市场？边界在哪里？', tags: ['认知'] },
      { id: 'pm-e-13', content: '如何从产品视角理解公司财务？毛利、LTV、CAC、ARPU等财务指标如何影响产品决策？', tags: ['财务'] },
      { id: 'pm-e-14', content: '请预测未来5年产品经理这个角色的演变趋势。AI-native的产品经理需要具备哪些新能力？', tags: ['趋势'] },
      { id: 'pm-e-15', content: '如何在组织内推动以用户为中心的文化？当数据驱动的结论和用户直觉相冲突时，你如何决策？', tags: ['文化'] },
    ],
  },
};

// ============================================================
// 4. HR-通用面试 (~100题)
// ============================================================
const hrQuestions: PositionBank = {
  positionId: 'pos-hr',
  positionName: 'HR-通用面试',
  levels: {
    junior: [
      { id: 'hr-j-1', content: '请做一下自我介绍，重点说说你的教育背景、工作经历和核心能力。', tags: ['自我介绍'] },
      { id: 'hr-j-2', content: '你为什么选择我们公司？你对这个行业和我们的业务有什么了解？', tags: ['求职动机'] },
      { id: 'hr-j-3', content: '你认为自己最大的优点和缺点分别是什么？请各举一个实际的例子来说明。', tags: ['自我认知'] },
      { id: 'hr-j-4', content: '请描述一次你在团队中遇到分歧的经历。你是如何处理分歧并达成共识的？结果如何？', tags: ['团队协作'] },
      { id: 'hr-j-5', content: '你未来3-5年的职业规划是什么？你希望在什么方向上发展？', tags: ['职业规划'] },
      { id: 'hr-j-6', content: '请描述一次你承受较大工作压力的经历。是什么原因造成的？你是如何调整和应对的？', tags: ['抗压能力'] },
      { id: 'hr-j-7', content: '你最喜欢什么样的工作氛围和团队文化？为什么？', tags: ['文化匹配'] },
      { id: 'hr-j-8', content: '请分享一次你快速学习一项新技能并应用到工作中的经历。', tags: ['学习能力'] },
      { id: 'hr-j-9', content: '业余时间你喜欢做什么？有哪些兴趣爱好？这些爱好对你有什么影响？', tags: ['个人特质'] },
      { id: 'hr-j-10', content: '你如何看待加班？你认为工作与生活应该如何平衡？', tags: ['工作态度'] },
      { id: 'hr-j-11', content: '请描述你在校期间或工作中最有成就感的一件事。', tags: ['成就'] },
      { id: 'hr-j-12', content: '你如何看待失败？请分享一次你经历的重大挫折以及你从中学到的经验。', tags: ['抗挫折'] },
      { id: 'hr-j-13', content: '你是如何做时间管理的？当多个任务同时出现时，你如何确定优先级？', tags: ['时间管理'] },
      { id: 'hr-j-14', content: '你最喜欢的一个老师/领导是谁？为什么？他们对你产生了什么影响？', tags: ['价值观'] },
      { id: 'hr-j-15', content: '你对自己的期望薪资是多少？你是如何得出这个数字的？', tags: ['薪资'] },
      { id: 'hr-j-16', content: '如果你入职后发现实际工作和你预期的不一样，你会怎么做？', tags: ['适应性'] },
      { id: 'hr-j-17', content: '你是更喜欢独立工作还是团队协作？为什么？', tags: ['工作偏好'] },
      { id: 'hr-j-18', content: '有没有什么事情是你曾经不擅长但现在变得很擅长的？你是如何做到的？', tags: ['成长'] },
      { id: 'hr-j-19', content: '请举一个你主动发现并解决问题的例子。你为什么要解决它？', tags: ['主动性'] },
      { id: 'hr-j-20', content: '你最近在读什么书？或者在学习什么新知识？', tags: ['学习'] },
      { id: 'hr-j-21', content: '怎样看待"先做人后做事"这句话？你是如何理解职业道德的？', tags: ['职业素养'] },
      { id: 'hr-j-22', content: '当你的个人价值观和公司要求发生冲突时，你会如何选择？', tags: ['价值观'] },
      { id: 'hr-j-23', content: '有没有你特别敬佩的公众人物？他身上什么特质最吸引你？', tags: ['价值观'] },
      { id: 'hr-j-24', content: '你如何看待工作中的重复性任务？你会如何对待这类工作？', tags: ['工作态度'] },
      { id: 'hr-j-25', content: '如果你是我们的面试官，你会录用你自己吗？为什么？', tags: ['自我认知'] },
    ],
    middle: [
      { id: 'hr-m-1', content: '请用STAR法则描述一个你主导的最成功的项目或任务。重点说明你在这个过程中的角色和贡献。', tags: ['STAR'] },
      { id: 'hr-m-2', content: '请描述一次你推动团队变革的经历。你是如何说服持不同意见的同事的？', tags: ['影响力'] },
      { id: 'hr-m-3', content: '当你面对一个完全陌生且没有明确指导的任务时，你如何确定方案并推进执行？', tags: ['自主性'] },
      { id: 'hr-m-4', content: '请分享一次你给同事提出建设性反馈的经历。你是如何表达和把控的？对方如何反应？', tags: ['反馈'] },
      { id: 'hr-m-5', content: '如果你的上级给了你一个你认为不合理的截止日期，你会如何沟通和处理？', tags: ['向上管理'] },
      { id: 'hr-m-6', content: '请描述一次你做出的不受欢迎但后来被证明是正确的决策。你当时是如何评估和坚持的？', tags: ['决策力'] },
      { id: 'hr-m-7', content: '在团队协作中，你遇到过最难的同事关系是什么？你是如何处理的？', tags: ['人际关系'] },
      { id: 'hr-m-8', content: '如果你的团队成员出现严重失误影响到项目进度，作为项目负责人你会怎么处理？', tags: ['管理'] },
      { id: 'hr-m-9', content: '如何在资源有限的情况下完成一个复杂的项目？请分享你的一次资源博弈经历。', tags: ['资源管理'] },
      { id: 'hr-m-10', content: '请描述一次你成功跨部门协调资源推动项目的经历。遇到过哪些阻力，你是如何解决的？', tags: ['跨部门协作'] },
      { id: 'hr-m-11', content: '当你需要向非专业人士解释一个复杂的技术或业务问题时，你的沟通策略是什么？', tags: ['沟通'] },
      { id: 'hr-m-12', content: '你如何看待"做完"和"做好"的区别？请举例说明。', tags: ['工作标准'] },
      { id: 'hr-m-13', content: '如果让你在3个月内将团队效率提升20%，你的思路和方案是什么？', tags: ['效率提升'] },
      { id: 'hr-m-14', content: '你有过带新人的经历吗？你是如何帮助新人快速融入和成长的？', tags: ['带教'] },
      { id: 'hr-m-15', content: '请描述一次你在信息不充分的情况下做出重要决策的经历。你如何权衡和降低风险？', tags: ['决策'] },
      { id: 'hr-m-16', content: '你如何看待竞争？当看到同事业绩比自己好时，你的心态和行动是什么？', tags: ['竞争意识'] },
      { id: 'hr-m-17', content: '如何衡量自己的工作产出和价值？你使用的评估方法或指标是什么？', tags: ['自我评估'] },
      { id: 'hr-m-18', content: '请分享一次你识别到潜在风险并提前规避的经历。', tags: ['风险意识'] },
      { id: 'hr-m-19', content: '在一个快速变化的业务环境中，你如何保持自己的知识更新和认知迭代？', tags: ['学习'] },
      { id: 'hr-m-20', content: '你是否有过"老板不在"时独立做重要决策的经历？是什么决策？结果如何？', tags: ['独立性'] },
      { id: 'hr-m-21', content: '面对一个质疑你专业能力的客户/同事，你的应对方式是什么？', tags: ['冲突管理'] },
      { id: 'hr-m-22', content: '在项目中当你和资深同事意见相左时，你如何处理？如果你的想法更优，你会怎么推动？', tags: ['沟通'] },
      { id: 'hr-m-23', content: '请谈谈你对"责任心"的理解，什么时候你会觉得一件事是"我的责任"？', tags: ['责任心'] },
      { id: 'hr-m-24', content: '如何管理多个利益相关方的期望？当各方期望冲突时，你的策略是什么？', tags: ['利益相关方'] },
      { id: 'hr-m-25', content: '如果你加入公司后发现现有的某些流程严重低效，你会如何推动改进？', tags: ['流程改进'] },
      { id: 'hr-m-26', content: '你如何看待"越级汇报"？在什么情况下你会选择越级沟通？', tags: ['职场规范'] },
      { id: 'hr-m-27', content: '请分享一次你在公开场合演讲或汇报的经历。你是如何准备的？效果如何？', tags: ['表达能力'] },
      { id: 'hr-m-28', content: '什么是你职业生涯中最重要的转折点？这个转折教会了你什么？', tags: ['职业发展'] },
      { id: 'hr-m-29', content: '你在做决策时更依赖数据还是直觉？为什么？请举例说明。', tags: ['决策风格'] },
      { id: 'hr-m-30', content: '如果你可以重新做一次职业选择，你会选择什么？为什么？', tags: ['自我认知'] },
    ],
    senior: [
      { id: 'hr-s-1', content: '请分享一次你从零组建团队的经历。你是如何选人、培养和塑造团队文化的？', tags: ['团队建设'] },
      { id: 'hr-s-2', content: '当公司战略方向调整时，你如何带领团队适应变化并保持战斗力？请举一个具体的案例。', tags: ['变革管理'] },
      { id: 'hr-s-3', content: '你如何衡量团队和个人的绩效？请分享你建立过的考核体系或OKR体系及其实际效果。', tags: ['绩效管理'] },
      { id: 'hr-s-4', content: '当团队中出现低绩效成员时，你的处理流程是什么？请分享一正一反两个案例。', tags: ['绩效改进'] },
      { id: 'hr-s-5', content: '你如何识别和培养团队中的高潜人才？你的人才梯队建设方案是什么？', tags: ['人才发展'] },
      { id: 'hr-s-6', content: '在招聘时，你最看重候选人什么特质？你是如何评估这些特质的？', tags: ['招聘'] },
      { id: 'hr-s-7', content: '如何设计一个有竞争力的薪酬和激励体系？物质激励和非物质激励如何平衡？', tags: ['薪酬激励'] },
      { id: 'hr-s-8', content: '请分享一次你推动组织文化变革的经历。遇到的最大阻力是什么？你是如何解决的？', tags: ['文化变革'] },
      { id: 'hr-s-9', content: '如何处理高管团队内部的矛盾和冲突？你的角色和策略是什么？', tags: ['高管关系'] },
      { id: 'hr-s-10', content: '在裁员或组织优化时，你的原则和沟通策略是什么？如何最大限度降低负面影响？', tags: ['组织优化'] },
      { id: 'hr-s-11', content: '如何提升组织的敏捷性和创新能力？在传统企业推动敏捷转型的关键成功因素是什么？', tags: ['组织敏捷'] },
      { id: 'hr-s-12', content: '请谈谈你对Diversity & Inclusion（多元化和包容性）的理解和实践。', tags: ['DEI'] },
      { id: 'hr-s-13', content: '如何设计一个有效的员工敬业度调查？拿到结果后你会如何推动改进？', tags: ['员工体验'] },
      { id: 'hr-s-14', content: '企业在不同发展阶段（初创、成长、成熟、转型）对人才的需求有什么不同？对应的HR策略应该怎么调整？', tags: ['HR战略'] },
      { id: 'hr-s-15', content: '如何建立组织的人才盘点机制？人才九宫格如何应用在梯队建设和继任者计划中？', tags: ['人才盘点'] },
      { id: 'hr-s-16', content: '领导力发展项目如何设计和落地？如何衡量领导力培训的ROI？', tags: ['领导力'] },
      { id: 'hr-s-17', content: '如何在企业并购或整合中做好文化和人员整合？请分享你的经验或方案。', tags: ['并购整合'] },
      { id: 'hr-s-18', content: '你如何看待远程办公和混合办公趋势？如何管理分布式团队的绩效和凝聚力？', tags: ['未来工作'] },
      { id: 'hr-s-19', content: '如何用数据驱动HR决策？请分享一个你用HR Analytics推动组织改进的案例。', tags: ['HR数据分析'] },
      { id: 'hr-s-20', content: '员工的心理健康问题日益受到关注，作为管理者你如何识别和支持有需要的员工？', tags: ['员工关怀'] },
      { id: 'hr-s-21', content: '如何建立组织的知识管理体系？如何避免核心人才离职带来的知识断层？', tags: ['知识管理'] },
      { id: 'hr-s-22', content: '请分享一次你处理复杂员工关系案例的经历（如劳动争议、性骚扰投诉等）。', tags: ['员工关系'] },
      { id: 'hr-s-23', content: '什么是组织诊断？你使用过哪些组织诊断工具（如麦肯锡7S、六个盒子等）？请分享一个案例。', tags: ['组织诊断'] },
      { id: 'hr-s-24', content: 'AI和自动化对人力资源管理的影响是什么？HR部门如何利用AI提升效率和决策质量？', tags: ['HR Tech'] },
      { id: 'hr-s-25', content: '作为高管，你如何在短期业绩压力和长期组织健康之间取得平衡？', tags: ['战略平衡'] },
    ],
    expert: [
      { id: 'hr-e-1', content: '作为CHO/HRVP，你如何将人力资源战略与公司业务战略对齐？请描述你的战略制定和落地方法论。', tags: ['HR战略'] },
      { id: 'hr-e-2', content: '请描述你参与过的最重大的一次组织变革。你扮演了什么角色？最大的挑战是什么？结果如何？', tags: ['组织变革'] },
      { id: 'hr-e-3', content: '你如何定义和塑造一个伟大的组织文化？请分享你的文化建设和传承的完整理念。', tags: ['组织文化'] },
      { id: 'hr-e-4', content: '面对Z世代员工和未来的工作方式，你认为组织和管理方式需要发生什么根本性变化？', tags: ['未来组织'] },
      { id: 'hr-e-5', content: '如何打造学习型组织？从理念到落地，你的完整方案是什么？', tags: ['学习型组织'] },
      { id: 'hr-e-6', content: '在董事会层面，你如何用数据和洞察来影响关键的人力资源决策？', tags: ['董事会'] },
      { id: 'hr-e-7', content: 'CEO和CHO的理想关系应该是怎样的？如果CEO对人力资源工作不理解或不重视，你会如何做？', tags: ['高管关系'] },
      { id: 'hr-e-8', content: '如何建立组织的ESG（环境、社会、治理）体系？人力资源在ESG中的角色和贡献是什么？', tags: ['ESG'] },
      { id: 'hr-e-9', content: '全球化组织中如何平衡全球统一性和本地灵活性？请分享跨文化管理的经验和挑战。', tags: ['全球化'] },
      { id: 'hr-e-10', content: '请谈谈你对"人力资源"这个职能未来10年演变趋势的判断。HR从业者需要做哪些准备？', tags: ['趋势'] },
      { id: 'hr-e-11', content: '如何定义和衡量"最佳雇主"？你会如何打造一个让员工引以为豪的组织？', tags: ['雇主品牌'] },
      { id: 'hr-e-12', content: '在高度不确定的VUCA时代，组织的韧性(Resilience)如何构建？HR在其中的独特价值是什么？', tags: ['组织韧性'] },
      { id: 'hr-e-13', content: '作为人力资源一号位，你的领导力哲学是什么？请用三个关键词概括并展开说明。', tags: ['领导力'] },
      { id: 'hr-e-14', content: '你对当前热议的"降本增效"有什么独特的看法？如何在降本的同时不损害员工信任和组织活力？', tags: ['降本增效'] },
      { id: 'hr-e-15', content: '如果你加入一家2000人的科技公司担任HR一号位，你前100天的行动方案是什么？', tags: ['百日计划'] },
    ],
  },
};

// ============================================================
// 5. JavaAgent开发工程师 (~100题) — 新增
// ============================================================
const javaAgentQuestions: PositionBank = {
  positionId: 'pos-java-agent',
  positionName: 'JavaAgent开发工程师',
  levels: {
    junior: [
      { id: 'ja-j-1', content: '什么是Java Agent？它的核心作用是什么？premain和agentmain有什么区别？', tags: ['Java Agent'] },
      { id: 'ja-j-2', content: '请解释Java字节码是什么。如何查看一个Java类的字节码？使用javap命令能看到什么信息？', tags: ['字节码'] },
      { id: 'ja-j-3', content: '什么是JVM的类加载机制？双亲委派模型是什么？如何打破双亲委派？', tags: ['类加载'] },
      { id: 'ja-j-4', content: 'Java的Instrumentation API提供了哪些核心能力？如何通过Instrumentation修改类的字节码？', tags: ['Instrumentation'] },
      { id: 'ja-j-5', content: '什么是Java的动态代理？JDK动态代理和CGLIB动态代理分别在什么层面工作？', tags: ['动态代理'] },
      { id: 'ja-j-6', content: '请解释JVM TI（JVM Tool Interface）是什么？它能做什么？与Java Agent的关系是什么？', tags: ['JVM TI'] },
      { id: 'ja-j-7', content: '什么是MANIFEST.MF文件？在Java Agent的打包中，需要配置哪些特殊的MANIFEST属性？', tags: ['Agent打包'] },
      { id: 'ja-j-8', content: 'Java中如何获取当前JVM运行时的信息？RuntimeMXBean可以获取哪些运行时数据？', tags: ['JVM'] },
      { id: 'ja-j-9', content: '请解释ClassLoader的findClass和loadClass的区别。自定义类加载器应该重写哪个方法？', tags: ['类加载'] },
      { id: 'ja-j-10', content: '什么是Java的SPI（Service Provider Interface）机制？它是如何工作的？和Java Agent有什么关联？', tags: ['SPI'] },
      { id: 'ja-j-11', content: '如何用ASM框架访问一个类的字节码？ClassReader、ClassVisitor和ClassWriter分别干什么？', tags: ['ASM'] },
      { id: 'ja-j-12', content: '什么是字节码指令？常见的字节码指令有哪些（如aload、invokevirtual、return等）？', tags: ['字节码'] },
      { id: 'ja-j-13', content: 'JVM的方法调用指令有哪几种？invokevirtual、invokespecial、invokestatic、invokeinterface、invokedynamic各用在什么场景？', tags: ['JVM'] },
      { id: 'ja-j-14', content: '什么是JVM的Attach机制？如何通过Attach API动态加载一个Agent到运行中的JVM？', tags: ['Attach'] },
      { id: 'ja-j-15', content: 'Java中ThreadMXBean可以获取哪些线程信息？如何检测死锁？', tags: ['线程监控'] },
      { id: 'ja-j-16', content: '什么是Java的安全管理器(SecurityManager)和访问控制器(AccessController)？它们如何保护JVM安全？', tags: ['安全'] },
      { id: 'ja-j-17', content: '请解释Java中字节码的Stack Map Frame是什么？为什么需要它？', tags: ['字节码'] },
      { id: 'ja-j-18', content: '什么是类验证(Class Verification)？JVM在加载类时验证哪些内容？', tags: ['类加载'] },
      { id: 'ja-j-19', content: '如何通过MBean（Managed Bean）暴露自定义的监控指标？JMX的基本概念和使用方式是什么？', tags: ['JMX'] },
      { id: 'ja-j-20', content: '什么是Java注解处理器(Annotation Processor)？它和Java Agent有什么区别？', tags: ['注解处理'] },
      { id: 'ja-j-21', content: '请解释Java中的Unsafe类。它提供了哪些底层操作能力？为什么叫Unsafe？', tags: ['Unsafe'] },
      { id: 'ja-j-22', content: '如何使用ByteBuddy框架创建一个简单的Java Agent？和直接使用ASM相比有什么优势？', tags: ['ByteBuddy'] },
      { id: 'ja-j-23', content: '什么是Java模块系统(JPMS)？在JDK 9+中开发Java Agent需要注意什么？', tags: ['JPMS'] },
      { id: 'ja-j-24', content: '如何监控Java应用的内存使用情况？MemoryMXBean和MemoryPoolMXBean可以获取哪些信息？', tags: ['内存监控'] },
      { id: 'ja-j-25', content: '什么是JVM的Tiered Compilation？C1和C2编译器有什么区别？如何监控编译情况？', tags: ['JIT'] },
    ],
    middle: [
      { id: 'ja-m-1', content: '请深入讲解ASM框架的核心设计：ClassVisitor的调用链模式、MethodVisitor的工作原理，以及如何在方法前后插入代码。', tags: ['ASM'] },
      { id: 'ja-m-2', content: 'ByteBuddy的AgentBuilder是如何简化Java Agent开发的？请写出一个完整的Agent拦截示例并说明注解和匹配规则。', tags: ['ByteBuddy'] },
      { id: 'ja-m-3', content: '如何使用Java Agent实现一个简单的方法耗时监控？请说明Transformer的实现细节和性能考量。', tags: ['APM'] },
      { id: 'ja-m-4', content: '什么是字节码增强中的"方法内联"问题？在AOP场景下，如何在方法调用链中正确传递上下文（如TraceId）？', tags: ['字节码增强'] },
      { id: 'ja-m-5', content: 'Javassist和ASM在字节码操作方式上有什么本质区别？各自适合什么场景？性能差异大吗？', tags: ['Javassist'] },
      { id: 'ja-m-6', content: '如何使用Java Agent实现热部署(Hot Swap)？和IDE的Hot Swap相比，Agent方案能做哪些额外的事情？', tags: ['热部署'] },
      { id: 'ja-m-7', content: '请讲解JVMTI Agent的开发和部署方式。用C/C++写的JVMTI Agent和用Java写的Java Agent各有什么优劣？', tags: ['JVMTI'] },
      { id: 'ja-m-8', content: '在Java Agent中如何优雅地处理ClassNotFoundException和NoClassDefFoundError？', tags: ['异常处理'] },
      { id: 'ja-m-9', content: '如何实现一个无侵入的分布式链路追踪(Tracing)Agent？请说明Span的创建、传播和上报的完整流程。', tags: ['链路追踪'] },
      { id: 'ja-m-10', content: '什么是OpenTelemetry？它的架构是怎样的？如何用Java Agent实现OpenTelemetry的自动探针？', tags: ['OpenTelemetry'] },
      { id: 'ja-m-11', content: 'APM系统中如何采集数据库操作的SQL和耗时？请说明JDBC层面的拦截原理和实现方案。', tags: ['APM', 'JDBC'] },
      { id: 'ja-m-12', content: '如何用Java Agent拦截HTTP请求（如Spring MVC/Servlet）并采集请求参数、响应状态和耗时？', tags: ['APM', 'HTTP'] },
      { id: 'ja-m-13', content: '在Java Agent中如何安全地处理字节码增强中的异常？如果Agent本身的代码抛出异常，会不会影响业务代码？', tags: ['安全性'] },
      { id: 'ja-m-14', content: '如何实现一个线程池监控Agent？监控活跃线程数、队列大小、拒绝策略触发次数等指标。', tags: ['线程池'] },
      { id: 'ja-m-15', content: 'Java Agent如何与Prometheus/Micrometer集成来暴露自定义Metrics？请描述完整的实现方案。', tags: ['Metrics'] },
      { id: 'ja-m-16', content: '什么是Retransform？在什么场景下需要对已经被加载的类进行Retransform？有什么限制？', tags: ['Retransform'] },
      { id: 'ja-m-17', content: '如何实现方法级别的熔断和限流Agent？参考Sentinel的设计，Agent层面如何做到无侵入的流量控制。', tags: ['熔断限流'] },
      { id: 'ja-m-18', content: 'ClassFileTransformer的transform方法有哪些参数？classfileBuffer和classBeingRedefined的含义是什么？', tags: ['Transformer'] },
      { id: 'ja-m-19', content: 'Java Agent中如何进行条件断点(conditional breakpoint)或日志注入？比如在特定条件下打印方法的入参和返回值。', tags: ['调试'] },
      { id: 'ja-m-20', content: '如何通过Agent实现Java应用的启动耗时分析？包括Bean加载时间、连接池初始化时间等。', tags: ['启动分析'] },
      { id: 'ja-m-21', content: '什么是字节码的Stack Map Frame？为什么在Java 7+中修改字节码时需要重新计算Stack Map Frame？', tags: ['字节码'] },
      { id: 'ja-m-22', content: '当多个Java Agent同时加载时，Agent的执行顺序是怎样的？如何解决Agent之间的冲突问题？', tags: ['Agent冲突'] },
      { id: 'ja-m-23', content: '如何使用Java Agent拦截RPC框架（如Dubbo/gRPC）的调用？请分析Consumer端和Provider端的拦截方案。', tags: ['RPC'] },
      { id: 'ja-m-24', content: '如何实现一个内存泄漏检测Agent？通过什么方式检测嫌疑对象的增长趋势并定位泄漏源头？', tags: ['内存泄漏'] },
      { id: 'ja-m-25', content: 'Java Agent开发中的类隔离问题：Agent依赖的第三方库如果和业务应用的版本冲突怎么办？有哪些隔离方案？', tags: ['类隔离'] },
      { id: 'ja-m-26', content: '如何用Agent实现一个简单的Idea Debug类似的功能：在不阻塞线程的情况下实时查看变量值？', tags: ['调试'] },
      { id: 'ja-m-27', content: '什么是ClassCircularityError和ClassFormatError？在字节码增强中如何避免这些错误？', tags: ['错误处理'] },
      { id: 'ja-m-28', content: 'Java Agent如何与Arthas的原理对比？Arthas的watch/trace/monitor命令在Agent层面分别是如何实现的？', tags: ['Arthas'] },
      { id: 'ja-m-29', content: '在Kotlin/Scala等JVM语言编写的应用中，Java Agent是否同样有效？可能会遇到什么额外的问题？', tags: ['多语言'] },
      { id: 'ja-m-30', content: '如何使用Java Agent实现自动化测试增强？比如自动Mock外部依赖、记录测试覆盖率等。', tags: ['测试'] },
    ],
    senior: [
      { id: 'ja-s-1', content: '请设计一个完整的APM Agent架构。从探针注入、数据采集、数据聚合到后端存储和前端展示，给出完整的技术方案。', tags: ['APM架构'] },
      { id: 'ja-s-2', content: 'SkyWalking的Java Agent是如何实现的？请深入分析其插件化架构、字节码增强策略和性能开销控制。', tags: ['SkyWalking'] },
      { id: 'ja-s-3', content: '在字节码增强中如何处理Lambda表达式和方法引用？Lambda的字节码实现方式对Agent有什么特殊挑战？', tags: ['Lambda'] },
      { id: 'ja-s-4', content: '如何确保Java Agent在极端场景下的稳定性和低性能开销？包括CPU开销、内存开销、GC压力的量化分析和优化策略。', tags: ['性能优化'] },
      { id: 'ja-s-5', content: '请设计Agent的类隔离方案。对比自定义ClassLoader、URLClassLoader和模块化隔离等多种方式，分析适用场景和实现细节。', tags: ['类隔离'] },
      { id: 'ja-s-6', content: '分布式场景下的Agent管理：如何统一管理数千个JVM实例上的Agent版本、配置和升级？', tags: ['Agent管理'] },
      { id: 'ja-s-7', content: '如何利用JVM TI + JVMTI实现比Java Instrumentation更底层的监控？比如监控对象分配、GC事件、锁竞争等。', tags: ['JVMTI'] },
      { id: 'ja-s-8', content: '什么是eBPF？和Java Agent相比，eBPF在内核层面做可观测性有什么优势和局限？两者如何互补？', tags: ['eBPF'] },
      { id: 'ja-s-9', content: '如何设计一个支持动态配置的Agent？Agent的拦截规则、采样率、日志级别等如何在不重启JVM的情况下动态调整？', tags: ['动态配置'] },
      { id: 'ja-s-10', content: '当Agent出现严重Bug导致业务应用不可用时，如何做到快速回滚或自动熔断？请设计容错和自保护机制。', tags: ['容错'] },
      { id: 'ja-s-11', content: 'Java Agent在容器化环境(K8s)中有什么特殊的挑战？如何与Sidecar模式结合？', tags: ['容器'] },
      { id: 'ja-s-12', content: '如何实现一个智能告警Agent？通过分析JVM指标和业务指标的趋势，提前预警潜在问题。', tags: ['智能告警'] },
      { id: 'ja-s-13', content: '请分析Java Agent在Serverless/FaaS场景中的适用性。冷启动问题如何通过Agent来优化？', tags: ['Serverless'] },
      { id: 'ja-s-14', content: '如何设计Agent的兼容性测试方案？面对成千上万个不同版本的框架和JVM组合，如何保证Agent的稳定性？', tags: ['测试'] },
      { id: 'ja-s-15', content: '如何用Java Agent实现自动化安全防护？比如SQL注入检测、敏感数据脱敏、命令执行拦截等。', tags: ['安全'] },
      { id: 'ja-s-16', content: 'Java Agent在金融/银行等强监管行业中的合规性考量。如何避免Agent被认定为"生产环境的后门"？', tags: ['合规'] },
      { id: 'ja-s-17', content: '什么是GraalVM Truffle框架？Java Agent对运行在GraalVM上的应用是否有效？Native Image的限制有哪些？', tags: ['GraalVM'] },
      { id: 'ja-s-18', content: '如何设计一个多语言的APM Agent系统？除了Java，还需要支持Go/Python/Node.js等语言时，Agent架构如何统一？', tags: ['多语言'] },
      { id: 'ja-s-19', content: '请设计一个流量回放Agent：录制生产环境的真实请求和响应，在测试环境中回放以验证系统行为。', tags: ['流量回放'] },
      { id: 'ja-s-20', content: '如何利用Java Agent实现混沌工程实验？比如模拟网络延迟、方法异常、资源耗尽等故障注入。', tags: ['混沌工程'] },
      { id: 'ja-s-21', content: 'Agent的性能开销如何量化？请设计一套完整的Benchmark方案，包括微基准测试和端到端性能测试。', tags: ['性能测试'] },
      { id: 'ja-s-22', content: '什么是Java Flight Recorder(JFR)？如何通过Agent扩展JFR事件来定制化监控？', tags: ['JFR'] },
      { id: 'ja-s-23', content: '如何用Agent实现自动化代码合规检查？比如检测不安全的API调用、过时的库使用等。', tags: ['代码合规'] },
      { id: 'ja-s-24', content: '请分析当前主流APM厂商（Datadog/Dynatrace/NewRelic）的Java Agent技术方案差异。你更认可哪种设计？', tags: ['竞品分析'] },
      { id: 'ja-s-25', content: 'Java Agent的插件化架构设计：如何让第三方开发者也能方便地为你的APM系统开发插件？API设计原则是什么？', tags: ['插件化'] },
    ],
    expert: [
      { id: 'ja-e-1', content: '如果要你从零设计一个商业级的APM产品，你的整体架构方案是什么？请涵盖Agent端、Collector端、存储端和UI端的完整设计。', tags: ['架构设计'] },
      { id: 'ja-e-2', content: '如何平衡Agent的功能丰富度和性能开销？当客户对性能SLA要求极严（如P99延迟增加不超过1%）时，你的优化策略是什么？', tags: ['性能'] },
      { id: 'ja-e-3', content: '请深入分析JVM的未来演进（Project Loom虚拟线程、Value Types等）对Java Agent开发可能带来的影响和机遇。', tags: ['JVM演进'] },
      { id: 'ja-e-4', content: '在云原生时代，传统的基于Agent的APM是否有被eBPF/Cilium等内核方案取代的趋势？请谈谈你的判断和理由。', tags: ['趋势'] },
      { id: 'ja-e-5', content: '作为Java Agent/APM团队的技术负责人，你的技术路线图是什么？未来12-24个月重点投入哪些技术方向？', tags: ['技术规划'] },
      { id: 'ja-e-6', content: '如何构建一个围绕开源APM（如SkyWalking/Pinpoint）的商业化产品？开源版本和商业版本的边界应该如何划分？', tags: ['开源商业化'] },
      { id: 'ja-e-7', content: 'Java Agent的安全攻防：如果有人恶意利用Agent的能力来注入后门或窃取数据，你的防护方案是什么？', tags: ['安全'] },
      { id: 'ja-e-8', content: '大规模生产环境中Agent的灰度发布和回滚机制如何设计？涉及百万级JVM实例时的发布策略。', tags: ['发布策略'] },
      { id: 'ja-e-9', content: 'Agent的智能化演进：如何利用AI/ML来提升APM的价值？比如智能根因分析、异常检测、自动调优等。', tags: ['AI'] },
      { id: 'ja-e-10', content: '请设计一个跨语言的统一可观测性Agent标准。从数据模型、传输协议到API规范，制定一套完整的技术标准。', tags: ['标准化'] },
      { id: 'ja-e-11', content: '如何看待Observability的未来？传统的Logging/Metrics/Tracing三支柱是否会被统一的可观测性模型取代？', tags: ['可观测性'] },
      { id: 'ja-e-12', content: '如果你的公司要收购一个APM产品，你的技术尽调清单是什么？你会重点评估哪些技术维度？', tags: ['技术尽调'] },
      { id: 'ja-e-13', content: 'Agent技术的伦理边界在哪里？在保护隐私和获取足够监控数据之间，你的原则和做法是什么？', tags: ['伦理'] },
      { id: 'ja-e-14', content: 'Java Agent领域的最前沿技术是什么？有哪个开源项目或论文让你印象最深刻？为什么？', tags: ['前沿'] },
      { id: 'ja-e-15', content: '请展望未来5年Java生态中"可观测性"的发展方向。OpenTelemetry会成为事实标准吗？Java Agent的角色会如何演变？', tags: ['趋势'] },
    ],
  },
};

// ============================================================
// 导出题库
// ============================================================
export const questionBanks: PositionBank[] = [
  javaQuestions,
  feQuestions,
  pmQuestions,
  hrQuestions,
  javaAgentQuestions,
];

// ============================================================
// 自我介绍（所有岗位通用第一题）
// ============================================================
export const SELF_INTRO_QUESTIONS: QuestionTemplate[] = [
  {
    id: 'intro-1',
    content: '你好！欢迎参加本次模拟面试。首先请做一个简单的自我介绍，重点说说你在相关领域的项目经验和技术栈。',
    tags: ['自我介绍'],
  },
  {
    id: 'intro-2',
    content: '欢迎来到模拟面试！请你先自我介绍一下，包括你的教育背景、工作经历以及你最擅长的技术方向。',
    tags: ['自我介绍'],
  },
  {
    id: 'intro-3',
    content: '面试开始！请用3-5分钟介绍一下你自己，重点突出你的核心竞争力和你最引以为豪的项目成果。',
    tags: ['自我介绍'],
  },
];

// ============================================================
// 题库抽题工具函数
// ============================================================

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
 */
export function getQuestionsForInterview(
  positionId: string,
  difficulty: string,
  count: number,
): QuestionTemplate[] {
  const bank = questionBanks.find((b) => positionId.startsWith(b.positionId));
  const defaultBank = questionBanks[0];

  const targetBank = bank || defaultBank;
  const levels = targetBank.levels;

  const levelOrder = ['junior', 'middle', 'senior', 'expert'];
  const targetLevelIdx = levelOrder.indexOf(difficulty);
  const startIdx = Math.max(0, targetLevelIdx - 1);

  const pool: QuestionTemplate[] = [];

  for (let i = startIdx; i <= targetLevelIdx + 1 && i < levelOrder.length; i++) {
    const levelQuestions = levels[levelOrder[i]];
    if (levelQuestions) {
      pool.push(...shuffle(levelQuestions));
    }
  }

  const selected: QuestionTemplate[] = [];
  const seen = new Set<string>();

  for (const q of pool) {
    if (selected.length >= count) break;
    if (!seen.has(q.id)) {
      seen.add(q.id);
      selected.push(q);
    }
  }

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

export function getSelfIntroQuestion(): QuestionTemplate {
  return SELF_INTRO_QUESTIONS[Math.floor(Math.random() * SELF_INTRO_QUESTIONS.length)];
}
