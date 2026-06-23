# 宝马街核心数据模型

## 1. 建模原则

- 主键统一使用ULID或UUID。
- 数据库存储UTC时间，展示时转换到用户时区。
- 国家、地区、分类和语言不写死在代码中。
- 公开数据和敏感数据分开存储。
- 业务记录采用状态机，不使用多个含义不清的布尔字段。
- 软删除仅用于需要恢复或审计的数据。
- 旧系统记录保留来源、原ID和校验值。
- 金额使用decimal或最小货币单位，禁止float。

## 2. 实体关系概览

```text
Country ──< Region
   │
   ├──< User
   ├──< Article
   ├──< Listing
   ├──< Organization ──< ProviderProfile ──< ProviderLicense
   └──< ServiceRequest ──< Quote ──< Appointment

User ──< Listing
User ──< ServiceRequest
User >──< Conversation ──< Message
User ──< Favorite
User ──< Review
User ──< Report

Category ──< Article
Category ──< Listing
Category >──< ProviderProfile

Media被用户、文章、分类信息、消息和资质文件引用
```

## 3. 国家和地区

### countries

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| code | char(2) | ISO国家代码 |
| name_zh | varchar | 中文名称 |
| name_local | varchar | 当地语言名称 |
| currency_code | char(3) | ISO货币代码 |
| timezone_default | varchar | 默认时区 |
| status | varchar | active、inactive |

### regions

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| country_id | uuid | 国家 |
| parent_id | uuid nullable | 上级地区 |
| type | varchar | region、district、city、parish |
| name_zh | varchar | 中文名称 |
| name_local | varchar | 当地名称 |
| slug | varchar | URL标识 |
| latitude | decimal nullable | 纬度 |
| longitude | decimal nullable | 经度 |
| status | varchar | 状态 |

约束：

- `country_id + parent_id + slug`唯一。
- 不允许地区父子结构形成循环。

## 4. 用户和身份

### users

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| email | varchar nullable | 邮箱 |
| phone_country_code | varchar nullable | 国际区号 |
| phone_number | varchar nullable | 手机号 |
| password_hash | varchar nullable | 密码Hash |
| display_name | varchar | 显示名称 |
| avatar_media_id | uuid nullable | 头像 |
| preferred_locale | varchar | 首选语言 |
| country_id | uuid nullable | 常用国家 |
| status | varchar | pending、active、suspended、deleted |
| last_login_at | timestamp nullable | 最后登录 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |
| deleted_at | timestamp nullable | 删除时间 |

约束：

- 规范化后的邮箱唯一。
- 国家区号和手机号组合唯一。
- 邮箱和手机号至少存在一个，第三方登录首次注册场景除外。

### user_identities

```text
id
user_id
provider              google、apple、wechat
provider_user_id
metadata_json
created_at
```

### user_roles

```text
user_id
role                  user、provider、editor、moderator、admin
created_at
```

### user_verifications

```text
id
user_id
type                  email、phone、identity
status                pending、verified、rejected、expired
verified_at
expires_at
metadata_json
```

## 5. 企业和服务商

### organizations

```text
id
owner_user_id
country_id
legal_name
display_name
tax_number_encrypted
registration_number
description
website
phone
email
status                draft、pending、verified、rejected、suspended
created_at
updated_at
```

### organization_members

```text
organization_id
user_id
role                  owner、manager、agent
status
created_at
```

### provider_profiles

```text
id
subject_type           individual、organization
user_id                个人服务商用户，企业服务商为空
organization_id
slug
headline
description
years_experience
languages_json
response_time_minutes
rating_average
review_count
completed_jobs_count
verification_level
status
created_at
updated_at
```

评分和数量字段是缓存值，真实数据以评价和订单记录为准。

### provider_licenses

```text
id
provider_profile_id
license_type
license_number_encrypted
issuing_authority
country_id
valid_from
valid_until
verification_status
document_media_id
verified_by
verified_at
```

### provider_services

```text
id
provider_profile_id
service_category_id
region_id
price_from
price_to
currency_code
price_unit
status
```

约束：

- `subject_type = individual`时必须存在`user_id`，`organization_id`为空。
- `subject_type = organization`时必须存在`organization_id`。

## 6. 分类和动态字段

### categories

```text
id
parent_id
domain                listing、service、article、event
name_zh
name_local
slug
icon
sort_order
status
```

### category_attribute_definitions

```text
id
category_id
attribute_key
label_zh
label_local
data_type             text、number、boolean、date、enum、json
options_json
is_required
is_filterable
sort_order
status
```

### tags

```text
id
name
slug
```

## 7. 分类信息

### listings

```text
id
owner_user_id
organization_id
country_id
region_id
category_id
title
slug
description
price_amount
currency_code
price_type            fixed、negotiable、monthly、hourly、free
condition_type
contact_method_json
status                draft、pending、published、rejected、expired、archived
moderation_reason
published_at
expires_at
view_count
favorite_count
source_type           native、legacy_import、crawler_import
source_id
source_url
created_at
updated_at
deleted_at
```

### listing_attribute_values

```text
id
listing_id
attribute_definition_id
value_text
value_number
value_boolean
value_date
value_json
```

每条记录只允许一种值字段有值。

### listing_media

```text
listing_id
media_id
sort_order
```

## 8. 资讯和办事指南

### articles

```text
id
author_user_id
country_id
region_id
category_id
article_type          news、guide、policy、opinion
title
slug
summary
content
cover_media_id
source_name
source_url
fact_check_status     unchecked、reviewed、verified、disputed
status                draft、review、published、archived
published_at
updated_at
```

### article_revisions

```text
id
article_id
editor_user_id
title
summary
content
change_note
created_at
```

### article_tags

```text
article_id
tag_id
```

政策和办事指南需要显示“最后核对日期”并保留修改记录。

## 9. 服务需求、匹配和报价

### service_requests

```text
id
requester_user_id
country_id
region_id
service_category_id
title
description
budget_min
budget_max
currency_code
preferred_language
urgency               flexible、normal、urgent
status                draft、open、matched、quoted、accepted、closed、expired
expires_at
created_at
updated_at
```

### service_request_answers

```text
id
service_request_id
question_key
answer_json
```

### provider_matches

```text
id
service_request_id
provider_profile_id
match_score
match_reason_json
status                suggested、notified、viewed、declined
created_at
```

### quotes

```text
id
service_request_id
provider_profile_id
amount
currency_code
description
estimated_duration
valid_until
status                sent、viewed、accepted、rejected、withdrawn、expired
created_at
updated_at
```

每个需求只能接受一个有效报价，除非业务规则明确允许多服务商协作。

### appointments

```text
id
service_request_id
quote_id
provider_profile_id
user_id
starts_at
ends_at
location_type         online、provider_location、customer_location
location_text
status                requested、confirmed、completed、cancelled、no_show
created_at
updated_at
```

## 10. 消息和通知

### conversations

```text
id
type                  listing、service_request、support
related_type
related_id
created_at
updated_at
```

### conversation_members

```text
conversation_id
user_id
last_read_message_id
muted_at
left_at
```

### messages

```text
id
conversation_id
sender_user_id
message_type          text、image、file、system
content
media_id
created_at
deleted_at
```

### notifications

```text
id
user_id
type
title
body
data_json
channel               in_app、email、push、sms
status                pending、sent、failed、read
sent_at
read_at
created_at
```

## 11. 收藏、评价、举报和审核

### favorites

```text
user_id
target_type           article、listing、provider
target_id
created_at
```

唯一约束：`user_id + target_type + target_id`。

### reviews

```text
id
reviewer_user_id
provider_profile_id
service_request_id
appointment_id
rating
content
status                pending、published、rejected、hidden
created_at
updated_at
```

只有发生过有效联系、报价或预约的用户可以评价。

### reports

```text
id
reporter_user_id
target_type
target_id
reason
description
status                open、reviewing、resolved、rejected
assigned_admin_id
resolution
created_at
resolved_at
```

### moderation_actions

```text
id
moderator_user_id
target_type
target_id
action
reason
before_json
after_json
created_at
```

## 12. 图片和文件

### media

```text
id
owner_user_id
disk
path
mime_type
size_bytes
width
height
visibility            public、private
checksum
scan_status           pending、clean、infected、failed
metadata_json
created_at
deleted_at
```

私密资质和身份文件不得使用公开URL。

## 13. 套餐、订单和支付

### plans

```text
id
country_id
name
billing_period        monthly、yearly、one_time
price_amount
currency_code
features_json
status
```

### subscriptions

```text
id
organization_id
plan_id
provider
provider_subscription_id
status
starts_at
ends_at
cancelled_at
created_at
updated_at
```

### orders

```text
id
buyer_user_id
organization_id
order_type
subtotal_amount
tax_amount
total_amount
currency_code
status
payment_status
provider_payment_id
created_at
updated_at
```

### lead_purchases

```text
id
provider_profile_id
service_request_id
order_id
price_amount
currency_code
access_granted_at
created_at
```

### listing_promotions

```text
id
listing_id
order_id
promotion_type
starts_at
ends_at
status
```

## 14. 数据迁移

### import_jobs

```text
id
source
type
status                queued、running、completed、failed、partial
started_at
completed_at
total_rows
success_rows
failed_rows
error_summary_json
created_at
```

### import_job_errors

```text
id
import_job_id
source_record_id
error_code
error_message
source_payload_json
created_at
```

### legacy_mappings

```text
id
source_system
entity_type
legacy_id
new_id
source_url
checksum
last_synced_at
created_at
```

唯一约束：`source_system + entity_type + legacy_id`。

## 15. 审计日志

### audit_logs

```text
id
actor_user_id
action
target_type
target_id
request_id
ip_hash
user_agent
before_json
after_json
created_at
```

支付、权限、认证、封禁和敏感数据访问必须写入审计日志。

## 16. 需要在数据审计后确认的问题

第一版已确认不迁移旧用户和密码，也不读取旧数据库。需要通过公开页面抓取确认：

1. 旧地区和分类能否从URL或页面稳定映射。
2. 公开图片是否可以稳定获取及排序。
3. 抓取内容统一关联系统导入主体。
4. 页面上的置顶和有效期标识能否可靠解析。
5. 页面删除后如何将新站记录标记为失效。
6. 公开联系方式的展示、举报和下架规则。
7. 重复信息如何通过旧ID、URL和内容校验值识别。
8. 旧URL如何映射到新URL。
