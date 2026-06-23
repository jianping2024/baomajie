# 第一版步骤一：公开页面审计与测试报告

执行日期：2026年6月23日

状态：已完成

## 1. 目标

步骤一的目标是确认现有宝马街葡萄牙站：

- 有哪些公开页面类型。
- 哪些字段可以稳定提取。
- URL和旧记录ID能否用于去重。
- 哪些结构化信号比CSS选择器更可靠。
- 第一版抓取器需要处理哪些数据质量问题。

本阶段未写入生产数据库，也未绕过登录、验证码或访问权限。

## 2. 已交付内容

### 审计工具

- [工具说明](../tools/site-audit/README.md)
- [页面解析器](../tools/site-audit/src/parser.mjs)
- [现场审计程序](../tools/site-audit/src/audit.mjs)
- [单元测试](../tools/site-audit/test/parser.test.mjs)

### 现场结果

- [审计摘要](../artifacts/site-audit/audit-summary.md)
- [完整JSON报告](../artifacts/site-audit/audit-report.json)

## 3. Sitemap审计结果

葡萄牙站Sitemap共发现1043个公开URL。

| 页面类型 | 数量 |
|---|---:|
| 首页 | 1 |
| 分类列表 | 5 |
| 分类信息详情 | 204 |
| 黄页列表 | 1 |
| 黄页详情 | 400 |
| 本地活动列表 | 1 |
| 本地活动详情 | 6 |
| 资讯索引及筛选URL | 344 |
| 资讯媒体详情 | 80 |
| 发布页 | 1 |
| 合计 | 1043 |

分类信息详情按栏目统计：

| 栏目 | 数量 |
|---|---:|
| 求职招聘 | 123 |
| 房产租售 | 48 |
| 二手买卖 | 6 |
| 生意转让 | 24 |
| 便民服务 | 8 |

说明：栏目统计包含对应列表页，因此五类详情合计仍为204。

## 4. 已识别页面模板

### 4.1 分类信息

栏目：

- jobs
- rent
- used
- biz
- service

稳定信号：

- URL中的栏目和数字ID。
- `main#bmj-classified-detail-main`。
- `data-listing-id`。
- `window._bmjPosterData`。
- JSON-LD。
- canonical。
- `time[data-publish-ts]`。

### 4.2 黄页

稳定信号：

- `/pt/yellowpages/{id}/`。
- `window._bmjPosterData`，场景为`yellowpages`。
- `LocalBusiness` JSON-LD。
- canonical。

黄页中的`tags.cost`实际可能是主营类别，不是价格。解析器已经将其映射为`serviceCategory`。

### 4.3 本地活动

稳定信号：

- `/pt/local/{id}/`。
- `window._bmjPosterData`，场景为`local_event`。
- `Event` JSON-LD。
- `startDate`和`endDate`。
- canonical。

活动日期必须保存为`eventStartAt/eventEndAt`，不能当成内容发布时间。

### 4.4 资讯媒体

稳定信号：

- `/pt/news/media/{id}/`。
- `MediaObject` JSON-LD。
- canonical。
- 标题和描述Meta。

该页面类型与普通新闻文章不同，更接近媒体、工具或资源目录。

### 4.5 首页、列表和发布页

这些页面没有内容记录ID，但可以用于：

- 发现分类。
- 检查首页模块。
- 验证分页和筛选。
- 识别发布流程。

第一版导入时，Sitemap作为URL发现入口，详情页作为内容权威来源。

## 5. 字段映射

| 新字段 | 首选来源 | 降级来源 | 可靠性判断 |
|---|---|---|---|
| sourceUrl | 抓取请求URL | 无 | 高 |
| canonical | canonical link | og:url、请求URL | 高 |
| sourceId | data-listing-id、URL ID | URL ID | 高 |
| section | URL路径 | Poster scene | 高 |
| title | PosterData title | JSON-LD、h1、title | 高 |
| description | PosterData description | JSON-LD、meta description | 高 |
| categoryLabel | PosterData badge | Breadcrumb、URL栏目 | 高 |
| region | gridItems地区 | JSON-LD地址 | 中高 |
| priceText | gridItems价格/费用 | tags.cost、JSON-LD offer | 中 |
| serviceCategory | 黄页gridItems主营 | 黄页tags.cost | 中高 |
| methodText | PosterData methodText | gridItems方式 | 中高 |
| publishedAt | datePosted、data-publish-ts | Poster heroBadge | 分类信息高 |
| eventStartAt | Event startDate | 无 | 活动高 |
| modifiedAt | dateModified | Sitemap lastmod | 中高 |
| images | Poster coverUrl、JSON-LD image | main图片、og:image | 中 |
| phone | 正文正则提取 | 无 | 中 |
| wechat | 正文带标签提取 | 无 | 中 |
| email | 正文正则提取 | 无 | 中 |
| checksum | 标准化内容SHA-256 | 无 | 高 |

## 6. 测试结果

### 6.1 单元测试

命令：

```bash
cd tools/site-audit
npm test
```

结果：

```text
测试总数：6
通过：6
失败：0
```

覆盖内容：

- URL模板分类。
- Sitemap国家过滤。
- 分类详情解析。
- 电话、微信和邮箱提取。
- 内容校验值稳定性。
- 黄页主营类别不被错误映射为价格。

### 6.2 现场样本测试

命令：

```bash
BMJ_SAMPLE_PER_GROUP=2 BMJ_REQUEST_DELAY_MS=400 npm run audit
```

结果：

```text
Sitemap葡萄牙URL：1043
请求样本：27
结构验证通过：27
结构验证失败：0
验证通过率：100%
重复来源键：0
```

样本包括：

- 首页。
- 五类分类列表。
- 五类分类详情，每类两条。
- 黄页列表和两条详情。
- 本地活动列表和两条详情。
- 资讯索引和两条媒体详情。
- 发布页。

### 6.3 详情样本覆盖

16条详情样本：

| 字段 | 覆盖 |
|---|---:|
| sourceId | 16/16 |
| title | 16/16 |
| description | 16/16 |
| categoryLabel | 16/16 |
| region | 14/16 |

缺少地区的两条是资讯媒体目录页面，该页面类型本身不要求地区。

“100%通过”表示满足当前结构校验，不代表所有正文语义和联系方式均已人工核对。正式全量抓取前还需要扩大人工抽样。

## 7. 已发现的数据问题

### 7.1 很多分类信息没有内容图片

现场样本中，多条招聘、租房和二手信息只有默认站点Logo。解析器会过滤Logo，前端必须设计无图卡片。

### 7.2 联系方式主要存在于正文

电话和微信没有统一字段，常见情况：

- 电话直接写在正文。
- 电话包含空格或国家区号。
- 微信号由中文标签标记。
- 部分页面没有公开联系方式。

联系方式提取只能作为中等可靠字段，并需要人工抽样和用户举报机制。

### 7.3 页面类型语义不同

- 黄页的“cost”可能代表主营类别。
- 活动的日期是开始和结束日期。
- 资讯媒体页面是资源目录，不是普通新闻文章。

所有页面不能使用一个通用字段映射强行处理。

### 7.4 Sitemap包含查询参数页面

资讯栏目存在大量`news?type=...`形式URL。正式抓取时需要：

- canonical去重。
- 查询参数白名单。
- 避免重复抓取相同内容视图。

### 7.5 抓取内容没有真实新账号归属

第一版不迁移旧用户，因此：

- 所有抓取内容归属系统导入主体。
- 未认领信息不能接收站内消息。
- 只能显示原本公开的联系方式。
- 必须提供来源说明、举报和申请下架。

## 8. 抓取建议

### URL发现

优先级：

1. Sitemap。
2. 分类列表增量发现。
3. 首页最新信息。

### 内容解析

优先级：

1. `window._bmjPosterData`。
2. JSON-LD。
3. canonical和Meta。
4. 稳定DOM属性。
5. CSS文本选择器。

### 去重

使用两层唯一键：

```text
source_system + page_type + source_id
canonical
```

内容变化通过SHA-256校验值判断。

### 请求策略

- 明确User-Agent。
- 默认单域名低并发。
- 请求间隔至少350至500毫秒。
- 429和5xx指数退避。
- 不绕过验证码和访问控制。
- 抓取任务和网站API使用独立队列。

## 9. 步骤一结论

步骤一通过，具备进入步骤二的条件。

关键结论：

- Sitemap可以作为首版URL清单来源。
- 分类、黄页、本地活动和资讯媒体需要独立解析器。
- 公开详情的标题、正文、分类和来源ID可以稳定取得。
- 联系方式可提取，但不能视为完全结构化数据。
- 无图信息占比较高，新首页必须有高质量无图卡片。
- 抓取内容必须使用系统导入主体，并保留认领和下架机制。

下一步进入：首页原型和设计系统。首页以Expatica Portugal为主要参考，同时加入宝马街分类信息、发布入口、公开联系方式和防诈骗特点。

