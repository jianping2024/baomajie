import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { classifyUrl, parsePublicPage, parseSitemap } from "./parser.mjs";

const BASE_URL = process.env.BMJ_BASE_URL || "https://www.baomajie.com";
const COUNTRY = process.env.BMJ_COUNTRY || "pt";
const SAMPLE_PER_GROUP = Number(process.env.BMJ_SAMPLE_PER_GROUP || 2);
const OUTPUT_DIR = resolve(
  process.cwd(),
  process.env.BMJ_AUDIT_OUTPUT || "../../artifacts/site-audit",
);
const USER_AGENT =
  process.env.BMJ_USER_AGENT || "Mozilla/5.0 (compatible; BaoMaJieMigrationAudit/1.0)";
const REQUEST_DELAY_MS = Number(process.env.BMJ_REQUEST_DELAY_MS || 350);

const sitemapUrl = `${BASE_URL}/sitemap.xml`;
const fetchedAt = new Date().toISOString();

await mkdir(OUTPUT_DIR, { recursive: true });
const sitemapXml = await fetchText(sitemapUrl);
const entries = parseSitemap(sitemapXml, COUNTRY);
const inventory = summarizeInventory(entries);
const sampleEntries = selectSamples(entries, SAMPLE_PER_GROUP);
const samples = [];

for (const [index, entry] of sampleEntries.entries()) {
  if (index > 0) await sleep(REQUEST_DELAY_MS);
  try {
    const html = await fetchText(entry.url);
    samples.push({
      ...parsePublicPage(html, entry.url),
      sitemapLastmod: entry.lastmod,
      http: { ok: true },
    });
  } catch (error) {
    samples.push({
      sourceUrl: entry.url,
      pageType: entry.type,
      section: entry.section,
      sourceId: entry.id,
      sitemapLastmod: entry.lastmod,
      http: { ok: false, error: error.message },
      validation: { ok: false, errors: ["fetch_failed"], warnings: [] },
    });
  }
}

const successful = samples.filter((sample) => sample.validation?.ok);
const fieldCoverage = calculateCoverage(successful);
const duplicateCheck = checkDuplicateStability(successful);
const report = {
  generatedAt: new Date().toISOString(),
  fetchedAt,
  baseUrl: BASE_URL,
  country: COUNTRY,
  sitemapUrl,
  configuration: {
    samplePerGroup: SAMPLE_PER_GROUP,
    requestDelayMs: REQUEST_DELAY_MS,
    userAgent: USER_AGENT,
  },
  inventory,
  sampleSummary: {
    requested: samples.length,
    valid: successful.length,
    invalid: samples.length - successful.length,
    validationRate:
      samples.length === 0 ? 0 : Number((successful.length / samples.length).toFixed(4)),
  },
  fieldCoverage,
  duplicateCheck,
  samples,
};

await writeFile(
  resolve(OUTPUT_DIR, "audit-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
await writeFile(resolve(OUTPUT_DIR, "audit-summary.md"), renderMarkdown(report), "utf8");

console.log(`Audit report: ${resolve(OUTPUT_DIR, "audit-report.json")}`);
console.log(`Summary: ${resolve(OUTPUT_DIR, "audit-summary.md")}`);
console.log(
  `Sitemap PT URLs: ${inventory.total}; samples valid: ${successful.length}/${samples.length}`,
);

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

function summarizeInventory(entries) {
  const byType = {};
  const bySection = {};
  for (const entry of entries) {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
    const key = entry.section || "root";
    bySection[key] = (bySection[key] || 0) + 1;
  }
  return { total: entries.length, byType, bySection };
}

function selectSamples(entries, perGroup) {
  const groups = new Map();
  for (const entry of entries) {
    const classification = classifyUrl(entry.url);
    const sampleable = new Set([
      "home",
      "classified-index",
      "classified-detail",
      "yellowpages-index",
      "yellowpages-detail",
      "local-index",
      "local-detail",
      "news-index",
      "news-media-detail",
      "publish",
    ]);
    if (!sampleable.has(classification.type)) continue;
    const key =
      classification.type === "classified-detail" ||
      classification.type === "classified-index"
        ? `${classification.type}:${classification.section}`
        : classification.type;
    const group = groups.get(key) || [];
    if (group.length < perGroup) {
      group.push(entry);
      groups.set(key, group);
    }
  }
  return [...groups.values()].flat();
}

function calculateCoverage(samples) {
  const fields = [
    "canonical",
    "sourceId",
    "title",
    "description",
    "categoryLabel",
    "region",
    "priceText",
    "serviceCategory",
    "publishedAt",
    "eventStartAt",
    "modifiedAt",
    "images",
  ];
  return Object.fromEntries(
    fields.map((field) => {
      const present = samples.filter((sample) => {
        const value = sample[field];
        return Array.isArray(value) ? value.length > 0 : value !== null && value !== "";
      }).length;
      return [
        field,
        {
          present,
          total: samples.length,
          rate: samples.length === 0 ? 0 : Number((present / samples.length).toFixed(4)),
        },
      ];
    }),
  );
}

function checkDuplicateStability(samples) {
  const sourceKeys = samples.map((sample) => `${sample.pageType}:${sample.sourceId || sample.canonical}`);
  const checksums = samples.map((sample) => sample.contentChecksum).filter(Boolean);
  return {
    uniqueSourceKeys: new Set(sourceKeys).size,
    sourceKeyCount: sourceKeys.length,
    duplicateSourceKeys: sourceKeys.length - new Set(sourceKeys).size,
    uniqueChecksums: new Set(checksums).size,
    checksumCount: checksums.length,
  };
}

function renderMarkdown(report) {
  const inventoryLines = Object.entries(report.inventory.byType)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `| ${type} | ${count} |`)
    .join("\n");
  const coverageLines = Object.entries(report.fieldCoverage)
    .map(
      ([field, coverage]) =>
        `| ${field} | ${coverage.present}/${coverage.total} | ${(coverage.rate * 100).toFixed(1)}% |`,
    )
    .join("\n");
  const sampleLines = report.samples
    .map(
      (sample) =>
        `| ${sample.pageType} | ${sample.section || "—"} | ${sample.sourceId || "—"} | ${sample.validation?.ok ? "通过" : "失败"} | ${sample.title || sample.http?.error || "—"} |`,
    )
    .join("\n");

  return `# 宝马街公开页面审计结果

- 生成时间：${report.generatedAt}
- 国家：${report.country}
- Sitemap URL：${report.sitemapUrl}
- 葡萄牙公开URL总数：${report.inventory.total}
- 样本通过：${report.sampleSummary.valid}/${report.sampleSummary.requested}
- 样本验证率：${(report.sampleSummary.validationRate * 100).toFixed(1)}%

## URL类型统计

| 类型 | 数量 |
|---|---:|
${inventoryLines}

## 样本字段覆盖率

| 字段 | 存在 | 覆盖率 |
|---|---:|---:|
${coverageLines}

说明：不同页面类型本来就不具备所有字段。例如首页没有sourceId，资讯媒体页不一定有发布时间，黄页不一定有价格。

## 样本结果

| 页面类型 | 栏目 | ID | 结果 | 标题或错误 |
|---|---|---:|---|---|
${sampleLines}

## 去重稳定性

- 来源键：${report.duplicateCheck.uniqueSourceKeys}/${report.duplicateCheck.sourceKeyCount}唯一
- 样本内重复来源键：${report.duplicateCheck.duplicateSourceKeys}
- 内容校验值：${report.duplicateCheck.uniqueChecksums}/${report.duplicateCheck.checksumCount}唯一

## 结论

- Sitemap可以作为公开URL发现入口。
- 分类详情优先读取\`window._bmjPosterData\`和JSON-LD，DOM作为降级方案。
- 所有导入记录必须保存canonical、来源ID、抓取时间和内容校验值。
- 联系方式主要存在于正文中，需要独立提取并在重新展示时实施限流和风险提示。
`;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
