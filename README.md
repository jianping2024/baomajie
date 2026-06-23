# 宝马街平台

当前仓库处于第一版 **步骤三：基础工程** 阶段。

## 目录

- `apps/web`：Next.js 公开站点
- `apps/api`：NestJS API
- `prototype`：静态首页原型
- `docs`：产品与技术文档
- `tools/site-audit`：公开页面审计工具

## 前置要求

- Node.js 20.18+
- Docker Desktop 或 Docker Engine（用于 PostgreSQL、Redis、Meilisearch）

## 首次启动

复制环境变量并按文档初始化：

```bash
cp .env.example .env
make setup
```

`make setup` 会依次执行：

1. 安装依赖
2. 启动 Docker 基础服务
3. 等待 PostgreSQL / Redis / Meilisearch 就绪
4. 执行数据库迁移
5. 写入种子数据

## 日常开发

启动基础服务（若尚未运行）：

```bash
make db-up
```

分别启动 API 和 Web：

```bash
make dev-api
make dev-web
```

默认地址：

```text
Web:  http://localhost:3000
API:  http://localhost:4000/health
```

局域网访问 API 时：

```bash
HOST=0.0.0.0 npm run dev:api
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `make setup` | 首次初始化 |
| `make db-up` | 启动 Docker 服务 |
| `make db-down` | 停止 Docker 服务 |
| `make db-migrate` | 执行数据库迁移 |
| `make db-seed` | 重新写入种子数据 |
| `make test` | 运行 API 测试 |
| `make build` | 构建 Web 和 API |

## 基础服务

`docker compose up -d` 会启动：

| 服务 | 端口 | 用途 |
|---|---|---|
| PostgreSQL | 5433 | 主数据库 |
| Redis | 6379 | 缓存与队列（后续抓取任务） |
| Meilisearch | 7700 | 全文搜索（后续步骤接入） |

## 健康检查

API 健康检查会同时验证数据库连接：

```text
GET http://localhost:4000/health
```

期望返回：

```json
{
  "status": "ok",
  "service": "baomajie-api",
  "version": "0.1.0",
  "database": "ok"
}
```

## 原型页

首页视觉原型（独立于正式工程）：

```bash
cd prototype
npm start
```

然后打开 `http://localhost:3000`（若与 Web 端口冲突，请先停掉 `apps/web`）。
