# 宝马街具体技术实施规范

本文档将总体架构落实到具体工程选择。版本号是2026年6月23日的项目基线；正式创建项目时锁定补丁版本，并通过依赖升级流程维护。

## 1. 版本基线

| 层级 | 选择 | 基线 |
|---|---|---|
| Web/PWA | Next.js App Router | 16.2.x |
| UI运行时 | React | 19.x |
| Web语言 | TypeScript | 5.x，启用strict |
| Node运行时 | Node.js | 24 LTS |
| 包管理 | pnpm | 10.x |
| 后端 | NestJS + Fastify Adapter | 创建项目时的稳定主版本 |
| ORM | Prisma | 创建项目时的稳定主版本 |
| 后端运行时 | Node.js | 24 LTS |
| 数据库 | PostgreSQL | 18.x |
| 缓存/队列 | Redis Open Source | 8.x稳定版 |
| 搜索 | Meilisearch | 1.37.x |
| 管理后台 | Next.js独立应用 | 与Web端共享UI和API客户端 |
| 对象存储 | S3 API | AWS S3或Cloudflare R2 |
| 支付 | Stripe API | 账户固定API版本 |
| App封装 | Capacitor | 创建项目时的稳定主版本 |

选择规则：

- 生产环境只使用正式稳定版，不使用RC、beta或canary。
- `package.json`和`pnpm-lock.yaml`必须提交。
- Docker镜像固定到补丁版本或digest，禁止生产使用`latest`。
- 每月处理安全补丁，每季度评估主版本升级。

第一版不实现Stripe。支付依赖和数据库表可以保留设计，但不进入MVP开发、测试和上线范围。

## 2. 仓库形式

采用一个Git仓库，但前后端保持独立构建：

```text
baomajie/
├── apps/
│   ├── web/                    # Next.js网站和PWA
│   ├── api/                    # NestJS API、队列和定时任务
│   └── admin/                  # Next.js运营管理后台
├── packages/
│   ├── ui/                     # React共享组件
│   ├── api-client/             # OpenAPI生成的TS客户端
│   ├── config-eslint/
│   ├── config-typescript/
│   └── contracts/              # 前端共享枚举和API类型
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── terraform/              # 云资源配置，第二阶段启用
│   └── monitoring/
├── database/
│   ├── legacy-mapping/         # 新旧字段映射
│   └── fixtures/               # 非生产测试数据
├── scripts/
│   ├── migration/
│   └── maintenance/
├── docs/
├── compose.yaml
├── pnpm-workspace.yaml
└── Makefile
```

管理后台使用独立的`apps/admin`。它与`apps/web`共享`packages/ui`和自动生成的API客户端，但使用独立域名、权限、构建和部署。

## 3. 前端实现

### 3.1 Next.js边界

使用App Router。公开页面默认使用Server Components；只有需要浏览器状态或交互的部分使用Client Components。

```text
apps/web/src/
├── app/
│   ├── [country]/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── news/
│   │   │   ├── guides/
│   │   │   ├── listings/
│   │   │   └── services/
│   │   └── (app)/
│   │       └── app/
│   │           ├── publish/
│   │           ├── messages/
│   │           └── account/
│   ├── manifest.ts
│   ├── robots.ts
│   └── sitemap.ts
├── components/
├── features/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── i18n/
│   └── telemetry/
└── styles/
```

### 3.2 渲染策略

| 页面 | 策略 |
|---|---|
| 首页 | SSR加短期CDN缓存 |
| 资讯/指南详情 | ISR，发布或修改后按tag失效 |
| 分类列表 | SSR，查询参数参与缓存键 |
| 分类详情 | SSR或ISR，状态变化立即失效 |
| 服务商详情 | ISR，资质或评价变化后失效 |
| 登录、消息、个人中心 | 动态渲染，禁止缓存和索引 |

禁止在浏览器中直接访问数据库或Meilisearch。所有业务数据经NestJS API读取。

### 3.3 前端状态

- 服务端数据：优先由Server Components读取。
- 客户端请求和缓存：TanStack Query。
- 表单：React Hook Form。
- 校验：Zod，类型由OpenAPI schema生成或映射。
- 少量本地UI状态：React state/context。
- 不引入全局Redux，除非后续出现明确跨页面复杂状态。

### 3.4 UI技术

- Tailwind CSS。
- Radix UI或React Aria作为无样式交互基础。
- 自建`packages/ui`，不复制页面级样式。
- 图标使用Lucide，业务品牌图标单独维护SVG。
- 表单必须支持键盘、屏幕阅读器和错误提示关联。
- 断点以内容为准，至少验证360、390、768、1024和1440像素。

### 3.5 国际化

URL中保留国家，界面语言通过locale处理：

```text
/pt/zh/listings/...
/pt/pt/listings/...
```

如果初期只上线中文，可暂用`/pt/`，但路由和数据库不得假设一个国家只有一种语言。

推荐使用`next-intl`：

```text
messages/
├── zh-CN.json
├── pt-PT.json
└── en.json
```

内容翻译与界面翻译分开。文章和分类名称不能只存一组固定`name_zh/name_local`字段，进入多语言阶段后应迁移到翻译表。

## 4. 后端实现

后端正式采用NestJS、Fastify Adapter和Prisma，保持模块化单体。选型过程和Laravel对比见[技术栈职责、选型理由与后端决策](./technology-decisions.md)。

### 4.1 NestJS目录

使用模块化单体：

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    ├── modules/
    │   ├── identity/
    │   ├── geography/
    │   ├── content/
    │   ├── listings/
    │   ├── providers/
    │   ├── marketplace/
    │   ├── messaging/
    │   ├── trust/
    │   ├── billing/
    │   ├── media/
    │   ├── search/
    │   └── migration/
    ├── common/
    │   ├── auth/
    │   ├── database/
    │   ├── errors/
    │   ├── observability/
    │   └── validation/
    ├── app.module.ts
    └── main.ts
```

每个模块内部使用：

```text
domain/          状态枚举、值对象和领域规则
application/     用例、命令、查询和DTO
infrastructure/  Prisma、外部服务和BullMQ任务
presentation/    Controller、Guard、Pipe和Response Mapper
```

不要求形式化DDD，但禁止把核心业务规则全部写进Controller、Guard或Prisma middleware。

### 4.2 请求处理

```text
HTTP Request
  → Zod Pipe校验
  → Guard和Policy权限检查
  → Application Use Case
  → Prisma数据库事务
  → Domain Event写入outbox
  → Response DTO返回
```

Controller只负责协议适配，不负责复杂业务判断。

### 4.3 数据访问

- 常规写操作和查询使用Prisma Client。
- 复杂聚合、PostGIS和性能敏感查询允许使用参数化原生SQL。
- 后台报表使用专用Read Model。
- 禁止为所有表机械增加Repository接口。
- 跨多个聚合的写操作必须使用数据库事务。
- 外部HTTP调用不得放在数据库事务中。

## 5. 身份认证和会话

### 5.1 Web认证

浏览器端采用NestJS自建第一方Cookie会话：

- HttpOnly
- Secure
- SameSite=Lax
- CSRF token
- Session ID存Redis
- 密码使用Argon2id

不把长期JWT放在`localStorage`。

域名建议：

```text
www.baomajie.com       Next.js
api.baomajie.com       NestJS
admin.baomajie.com     Next.js Admin
```

Cookie domain可配置为`.baomajie.com`。CORS只允许明确的生产和预发布域名。

### 5.2 App认证

Capacitor原生容器使用短期access token加可轮换refresh token：

- access token：10至15分钟
- refresh token：30天，保存在系统Keychain/Keystore
- refresh token每次使用后轮换
- 服务端保存token family和撤销状态
- 检测重复使用并撤销整个token family

### 5.3 登录方式

MVP：

- 邮箱和密码
- 手机验证码视成本决定是否首发
- Google登录
- Apple登录在iOS上架前实现

微信登录必须先确认欧洲网站和App的开放平台条件，不作为首版硬依赖。

第一版不迁移旧用户和密码。旧站抓取内容统一归属系统导入主体，不能使用旧站账号登录或直接管理。

## 6. API协议

### 6.1 格式

API前缀：

```text
https://api.baomajie.com/v1
```

成功响应：

```json
{
  "data": {},
  "meta": {
    "request_id": "01J..."
  }
}
```

错误响应使用RFC 9457 Problem Details风格：

```json
{
  "type": "https://api.baomajie.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "提交的数据无效",
  "instance": "/v1/listings",
  "request_id": "01J...",
  "errors": {
    "title": ["标题不能为空"]
  }
}
```

### 6.2 分页

内容流和消息使用游标分页：

```text
GET /v1/listings?cursor=...&limit=20
```

后台报表允许页码分页。`limit`默认20，最大100。

### 6.3 幂等

以下接口要求`Idempotency-Key`：

- 创建订单
- 支付
- 接受报价
- 创建服务需求
- 客户端离线重试的发布接口

幂等结果在Redis保存24小时，支付结果同时持久化到数据库。

### 6.4 OpenAPI

- NestJS通过`@nestjs/swagger`生成并维护OpenAPI文档。
- CI检查OpenAPI格式和破坏性变更。
- 前端使用Orval或openapi-typescript生成客户端。
- 前端不得手写重复API类型。

## 7. PostgreSQL具体设计

### 7.1 基础配置

- 编码UTF-8。
- 时区UTC。
- 主键使用UUIDv7或ULID；由NestJS应用层统一生成。
- 金额使用`numeric(14,2)`，货币使用`char(3)`。
- 经纬度使用PostGIS `geography(Point,4326)`；启用PostGIS扩展。
- 大小写不敏感邮箱使用`citext`扩展或规范化字段。
- 动态但需查询的数据使用`jsonb`，核心字段不得塞入JSON。

### 7.2 索引原则

示例：

```sql
create index listings_feed_idx
  on listings (country_id, status, published_at desc)
  where deleted_at is null;

create index listings_category_region_idx
  on listings (country_id, category_id, region_id, published_at desc)
  where status = 'published' and deleted_at is null;

create unique index users_email_unique
  on users (lower(email))
  where email is not null and deleted_at is null;

create index service_requests_open_idx
  on service_requests (country_id, service_category_id, region_id, created_at desc)
  where status = 'open';
```

要求：

- 所有外键建立索引。
- 高频列表使用与过滤、排序顺序一致的复合索引。
- JSONB只有出现真实查询时才增加GIN索引。
- 生产慢查询阈值初始设为500毫秒。
- 上线前使用真实规模数据执行`EXPLAIN ANALYZE`。

### 7.3 状态

状态字段在TypeScript中使用字符串枚举或`as const`联合类型，数据库存短字符串。状态切换必须通过Use Case：

```text
draft → pending → published → expired
                 ↘ rejected
published → archived
```

禁止任意接口直接更新`status`。

### 7.4 多语言数据

推荐最终形式：

```text
articles
article_translations
  article_id
  locale
  title
  summary
  content
  slug
```

分类、服务名称和静态内容采用同类翻译表。首版可只写中文记录，但使用相同结构，避免以后大迁移。

## 8. 搜索

PostgreSQL是事实来源，Meilisearch只是可重建索引。

建立独立索引：

- `articles`
- `listings`
- `providers`
- `service_categories`

分类信息搜索文档示例：

```json
{
  "id": "01J...",
  "country": "PT",
  "locale": "zh-CN",
  "title": "里斯本餐馆招聘",
  "description_plain": "招聘熟手...",
  "category_ids": ["..."],
  "region_ids": ["..."],
  "price": 1200,
  "published_at": 1782200000,
  "is_promoted": false
}
```

同步采用Transactional Outbox：

1. 业务事务写入业务表和`outbox_events`。
2. 队列消费outbox。
3. 更新Meilisearch。
4. 失败自动重试。
5. 每晚执行抽样一致性检查。
6. 提供全量重建索引命令。

搜索结果返回ID后，由API根据需要批量补充权威字段。私密字段不得写入搜索索引。

## 9. Redis、队列和定时任务

Redis数据库或key前缀分开：

- cache
- session
- queue
- rate-limit

队列：

```text
critical       支付Webhook、账号安全
default        通知、搜索索引
media          图片处理、病毒扫描
migration      旧数据导入
low            统计和清理
```

使用BullMQ和Bull Board管理队列及失败任务。

重试原则：

- 网络类错误指数退避。
- 参数和权限错误不重试。
- 支付Webhook必须幂等。
- 超过重试次数进入failed jobs并告警。

定时任务：

- 每分钟：通知和轻量同步。
- 每小时：过期信息处理。
- 每日：搜索一致性、失效文件和数据质量检查。
- 每周：数据库恢复演练或备份验证。

## 10. 消息和实时能力

MVP采用：

- HTTP发送消息。
- SSE接收新消息和通知。
- Redis Pub/Sub分发在线事件。
- 离线用户通过邮件或Web Push提醒。

当并发和产品需求证明必要时，再使用NestJS WebSocket Gateway。消息必须先写PostgreSQL成功，再广播事件。

消息接口限制：

- 单条文本最大5000字符。
- 图片数量和大小限制。
- 用户维度和会话维度限流。
- 被拉黑关系阻止新消息。
- 删除采用用户侧隐藏或审核删除，不直接破坏审计链。

## 11. 文件和图片

上传流程：

```text
客户端请求上传凭证
  → API验证文件意图和权限
  → 客户端直传S3/R2临时区
  → 回调API确认上传
  → 队列检查MIME、病毒和EXIF
  → 生成多尺寸WebP/AVIF
  → 标记media为clean
  → 业务记录才能公开引用
```

图片尺寸建议：

- thumbnail：320px
- card：640px
- detail：1280px
- original：按类别决定是否保留

规则：

- 根据文件内容判断MIME，不信任扩展名。
- 公开图片和私密证件使用不同bucket或前缀。
- 私密文件只通过短期签名URL读取。
- 图片清除GPS和其他EXIF。
- 数据库只存对象key，不存固定CDN完整URL。

## 12. PWA和Capacitor

### 12.1 PWA

- `manifest.webmanifest`
- 192、512和maskable图标
- 独立显示模式
- Service Worker使用Workbox或Serwist
- 静态资源Cache First
- 公开API短期Network First
- 账号、消息、支付接口Network Only
- 离线发布仅保存草稿，不伪装提交成功

### 12.2 Push

- Web：VAPID Web Push。
- Android原生：Firebase Cloud Messaging。
- iOS原生：APNs，经统一通知服务发送。
- `push_subscriptions`保存设备、平台、token和最后活跃时间。
- token失效后自动删除。

### 12.3 App封装

Capacitor项目单独保留：

```text
apps/mobile/
├── capacitor.config.ts
├── ios/
└── android/
```

Web和原生通过适配层调用相机、推送和安全存储，业务组件不得直接散落调用Capacitor API。

## 13. 支付

状态：第一版不实施，作为后续商业化设计保留。

Stripe实现：

- Checkout或Payment Element。
- Billing管理订阅。
- Webhook作为支付状态权威来源。
- 前端跳转成功不能直接认定付款成功。
- Webhook事件ID建立唯一约束。
- 金额、货币和商品信息由服务端生成。
- 订单创建和Webhook处理必须幂等。

表：

```text
orders
order_items
payments
refunds
subscriptions
webhook_events
```

生产和测试Stripe账户、密钥和Webhook端点完全隔离。

## 14. 管理后台

独立Next.js管理后台承载：

- 用户和封禁
- 分类、地区和动态字段
- 资讯编辑
- 分类信息审核
- 服务商资质审核
- 举报和评价
- 订单及退款只读视图
- 数据导入任务
- 审计日志查询

后台要求：

- 独立`admin.baomajie.com`。
- 强制2FA。
- Cloudflare Access或IP/身份策略作为第二层保护。
- 敏感字段默认脱敏。
- 查看完整证件需额外权限并写审计日志。
- 批量操作必须二次确认。
- 后台只调用管理API，不允许直接连接数据库。
- 权限由NestJS Guard和Policy执行，前端隐藏按钮不能替代服务端授权。

## 15. 本地开发环境

使用Docker Compose启动基础服务：

```text
postgres
redis
meilisearch
minio
mailpit
clamav
```

Next.js和NestJS可在宿主机运行以获得更快热更新，也可全部容器化。

建议统一命令：

```text
make setup
make dev
make test
make lint
make migrate
make seed
make api-docs
```

`.env.example`只包含占位值。真实密钥不提交Git。

## 16. 部署拓扑

首阶段采用托管服务，避免过早引入Kubernetes：

```text
Cloudflare
  ├── www.baomajie.com → Next.js容器
  ├── api.baomajie.com → NestJS/Fastify容器
  └── admin.baomajie.com → Next.js Admin容器

应用网络
  ├── API容器 × 2
  ├── Queue Worker × 2
  ├── Scheduler × 1
  └── Next.js容器 × 2

托管数据服务
  ├── PostgreSQL主库
  ├── Redis
  ├── S3/R2
  └── Meilisearch Cloud或独立实例
```

初期可选择AWS、Hetzner加托管数据库，或支持欧盟区域的数据平台。个人数据和备份优先保存在欧盟区域。

不建议MVP使用：

- Kubernetes
- 多区域主动-主动数据库
- Kafka
- 微服务拆分
- 自建邮件服务器

## 17. CI/CD

每个Pull Request：

```text
前端：
- pnpm install --frozen-lockfile
- TypeScript检查
- ESLint
- 单元测试
- Next.js生产构建

后端：
- pnpm install --frozen-lockfile
- TypeScript检查
- ESLint
- Vitest
- Prisma schema和migration检查
- 数据库迁移测试
- OpenAPI一致性检查

通用：
- 依赖漏洞扫描
- secret扫描
- Docker镜像构建
```

合并主分支后：

1. 构建不可变镜像。
2. 推送镜像仓库。
3. 自动部署预发布。
4. 执行数据库迁移演练和E2E。
5. 人工批准生产部署。
6. 先执行向后兼容迁移。
7. 滚动更新应用。
8. 执行smoke test。
9. 失败自动停止并回滚应用镜像。

数据库迁移采用Expand/Contract：

1. 先添加兼容字段或表。
2. 发布同时兼容新旧结构的代码。
3. 后台回填。
4. 切换读取。
5. 后续版本删除旧字段。

## 18. 测试技术

### 前端

- Vitest：函数和组件单元测试。
- Testing Library：用户交互测试。
- Playwright：关键端到端流程。
- axe：自动可访问性检查。

### 后端

- Vitest。
- PostgreSQL测试数据库，不用SQLite替代核心集成测试。
- Supertest执行NestJS HTTP集成测试。
- Guard和Policy权限矩阵测试。
- Stripe和对象存储使用官方测试环境或协议级fake。

### 必须覆盖的E2E

1. 注册、验证、登录和退出。
2. 创建分类信息、提交审核、发布。
3. 提交服务需求。
4. 服务商报价。
5. 用户接受报价。
6. 双方发送消息。
7. 用户评价和举报。
8. 购买会员或置顶。
9. 管理员审核服务商资质。
10. 旧URL正确重定向。

目标不是追求统一覆盖率数字；支付、权限、状态机和迁移代码必须高覆盖。

## 19. 可观测性

每个请求生成`request_id`，贯穿：

- Cloudflare/Nginx
- Next.js
- NestJS
- 队列任务
- 外部服务调用

工具：

- Sentry：前后端异常和性能。
- OpenTelemetry：后续统一trace。
- Prometheus/Grafana或托管监控：基础指标。
- 结构化JSON日志。

告警：

- 5xx错误率
- 登录失败异常增长
- API P95超标
- 队列积压
- failed jobs
- 搜索同步延迟
- 数据库连接或存储空间
- 支付Webhook失败
- 图片处理失败

## 20. 备份和恢复

- PostgreSQL每日全量备份加持续WAL/PITR。
- 生产目标：RPO不超过15分钟，RTO不超过4小时。
- 对象存储启用版本控制或生命周期保护。
- Meilisearch无需作为唯一备份，可从PostgreSQL重建。
- Redis缓存无需备份；会话和队列根据部署方案设置持久化。
- 每季度执行完整恢复演练，并记录实际恢复时间。

## 21. 旧数据迁移程序

第一版只实现公开页面抓取。程序使用NestJS CLI/standalone application或独立Node.js CLI，不通过用户网页请求执行。

```text
Extract
  → 从公开HTML页面读取
Transform
  → 清洗手机号、地区、分类、HTML和图片地址
Validate
  → 必填、枚举、外键和重复检查
Load
  → 批量写入新库
Reconcile
  → 数量、校验值和抽样核对
```

技术要求：

- 每次导入有`import_job_id`。
- 按旧主键稳定排序和分批处理。
- 支持断点继续。
- 使用`legacy_mappings`保证幂等。
- 错误记录单独落表，不因单条坏数据终止全批。
- HTML通过白名单清洗。
- 图片下载后计算SHA-256去重。
- 禁止迁移程序直接发送通知和邮件。
- 测试迁移、全量迁移和最终增量使用同一套代码。

抓取公开网页只实现为独立适配器：

```text
PublicHtmlSource
```

`LegacyDatabaseSource`和`LegacyApiSource`接口只预留，不在第一版实现。`PublicHtmlSource`输出统一中间DTO，再进入Transform和Load流程。

## 22. 建议实施顺序

具体工程顺序：

1. 建立仓库、Compose和CI。
2. 建立NestJS模块骨架、Prisma和OpenAPI。
3. 建立PostgreSQL基础表、枚举和审计。
4. 实现公开页面抓取、清洗、去重和来源映射。
5. 实现地区、分类和公开分类信息模型。
6. 完成新版首页、列表和基础详情。
7. 接入Meilisearch和outbox。
8. 实现Cookie Session、CSRF、Guard和Policy权限。
9. 实现基础站内消息、拉黑和举报。
10. 实现媒体处理和PWA基础。
11. 完成公开数据全量抓取和灰度上线。
12. 后续再实现服务商认证、需求、报价和预约。
13. 后续再实现Stripe商业化。
14. 指标验证后再开始Capacitor原生封装。

## 23. 正式编码前仍需确定

已确认：

- 联系方式公开，并提供用户控制、限流、举报和风险提示。
- 服务商允许个人和企业。
- 第一版不实现支付。
- 第一版不迁移旧用户及密码。
- 第一版不接入旧数据库或只读API。
- 第一版包含基础站内消息。

仍需确定：

1. 新用户登录优先使用邮箱还是手机。
2. 葡萄牙语内容是否在MVP上线。
3. 分类信息默认有效期。
4. 公开联系方式具体支持电话、邮箱、微信和WhatsApp中的哪些类型。
5. 抓取覆盖哪些分类和最大历史范围。
6. 抓取内容的删除同步频率。

## 24. 官方技术依据

- Next.js当前文档和App Router：https://nextjs.org/docs
- NestJS文档：https://docs.nestjs.com/
- Prisma文档：https://www.prisma.io/docs
- PostgreSQL 18文档：https://www.postgresql.org/docs/18/
- Meilisearch文档：https://www.meilisearch.com/docs/
- Capacitor文档：https://capacitorjs.com/docs
