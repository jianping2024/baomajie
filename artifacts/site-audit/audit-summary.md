# 宝马街公开页面审计结果

- 生成时间：2026-06-23T12:58:49.542Z
- 国家：pt
- Sitemap URL：https://www.baomajie.com/sitemap.xml
- 葡萄牙公开URL总数：1043
- 样本通过：27/27
- 样本验证率：100.0%

## URL类型统计

| 类型 | 数量 |
|---|---:|
| classified-detail | 204 |
| classified-index | 5 |
| home | 1 |
| local-detail | 6 |
| local-index | 1 |
| news-index | 344 |
| news-media-detail | 80 |
| publish | 1 |
| yellowpages-detail | 400 |
| yellowpages-index | 1 |

## 样本字段覆盖率

| 字段 | 存在 | 覆盖率 |
|---|---:|---:|
| canonical | 27/27 | 100.0% |
| sourceId | 16/27 | 59.3% |
| title | 27/27 | 100.0% |
| description | 27/27 | 100.0% |
| categoryLabel | 25/27 | 92.6% |
| region | 14/27 | 51.8% |
| priceText | 12/27 | 44.4% |
| serviceCategory | 2/27 | 7.4% |
| publishedAt | 11/27 | 40.7% |
| eventStartAt | 2/27 | 7.4% |
| modifiedAt | 2/27 | 7.4% |
| images | 6/27 | 22.2% |

说明：不同页面类型本来就不具备所有字段。例如首页没有sourceId，资讯媒体页不一定有发布时间，黄页不一定有价格。

## 样本结果

| 页面类型 | 栏目 | ID | 结果 | 标题或错误 |
|---|---|---:|---|---|
| home | — | — | 通过 | 葡萄牙华人分类信息 |
| yellowpages-index | yellowpages | — | 通过 | 葡萄牙华人黄页 |
| local-index | local | — | 通过 | 葡萄牙华人本地活动 |
| news-index | news | — | 通过 | 葡萄牙华人资讯 |
| news-index | news | — | 通过 | 注意！今天下午波尔图市中心大范围封路 |
| publish | publish | — | 通过 | 发布信息 |
| classified-index | jobs | — | 通过 | 葡萄牙华人求职招聘 |
| classified-index | rent | — | 通过 | 葡萄牙华人房产租售 |
| classified-index | used | — | 通过 | 葡萄牙华人二手买卖 |
| classified-index | biz | — | 通过 | 葡萄牙华人生意转让 |
| classified-index | service | — | 通过 | 葡萄牙华人便民服务 |
| classified-detail | jobs | 4571 | 通过 | 里斯本郊区招聘寿司师傅 |
| classified-detail | jobs | 4570 | 通过 | 里斯本市区餐馆招熟手跑堂及暑假工 |
| classified-detail | biz | 4562 | 通过 | 有意向合伙开店的联系+931 464 0… |
| classified-detail | biz | 4553 | 通过 | 🔥 Lisboa 餐饮店转让｜Anjos 地铁附近 |
| classified-detail | rent | 4551 | 通过 | Arroios地铁口… |
| classified-detail | rent | 4543 | 通过 | 里斯本地铁红线附近单人房间出租环境安静 |
| classified-detail | service | 4522 | 通过 | 中国人装修团队接单中 |
| classified-detail | service | 2030 | 通过 | 2025年7月前过期葡萄牙Longa欧盟卡换发 |
| classified-detail | used | 4500 | 通过 | 收购造冰机和咖啡机 |
| classified-detail | used | 4478 | 通过 | 2023年8月 Opel Astra 高配自动挡一手车 |
| yellowpages-detail | yellowpages | 663 | 通过 | REN 甜品屋 |
| yellowpages-detail | yellowpages | 464 | 通过 | 恒诚会计事务所 |
| local-detail | local | 45 | 通过 | 2026北京“归国小精英”研学夏令营 |
| local-detail | local | 35 | 通过 | 【2026夏令营】14天深耕大湾区：香港、珠海、广州研学之旅火热报名中！ |
| news-media-detail | news | 125 | 通过 | BABELL |
| news-media-detail | news | 53 | 通过 | 邮寄委托书 |

## 去重稳定性

- 来源键：27/27唯一
- 样本内重复来源键：0
- 内容校验值：27/27唯一

## 结论

- Sitemap可以作为公开URL发现入口。
- 分类详情优先读取`window._bmjPosterData`和JSON-LD，DOM作为降级方案。
- 所有导入记录必须保存canonical、来源ID、抓取时间和内容校验值。
- 联系方式主要存在于正文中，需要独立提取并在重新展示时实施限流和风险提示。
