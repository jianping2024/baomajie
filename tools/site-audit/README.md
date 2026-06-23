# 宝马街公开页面审计工具

该工具用于第一版步骤一，不写入生产数据库，只完成：

- Sitemap URL清点。
- 页面类型识别。
- 代表性页面抓取。
- 结构化字段解析。
- 联系方式提取。
- 字段覆盖率和解析结果报告。

## 安装

```bash
cd tools/site-audit
npm install
```

## 测试

```bash
npm test
```

## 执行公开页面审计

```bash
npm run audit
```

默认输出：

```text
artifacts/site-audit/audit-report.json
artifacts/site-audit/audit-summary.md
```

可选环境变量：

```text
BMJ_BASE_URL
BMJ_COUNTRY
BMJ_SAMPLE_PER_GROUP
BMJ_REQUEST_DELAY_MS
BMJ_AUDIT_OUTPUT
BMJ_USER_AGENT
```

工具只读取无需登录的公开页面，并默认在请求之间等待350毫秒。

## 执行导入标准化

离线 fixture 模式：

```bash
BMJ_SOURCE_MODE=fixtures npm run import
```

默认输出：

```text
artifacts/site-audit/import-bundle.json
```

在线模式仍然会读取公开站点：

```bash
npm run import
```
