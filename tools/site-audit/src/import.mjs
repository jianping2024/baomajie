import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { classifyUrl, parsePublicPage, parseSitemap } from "./parser.mjs";

const BASE_URL = process.env.BMJ_BASE_URL || "https://www.baomajie.com";
const COUNTRY = process.env.BMJ_COUNTRY || "pt";
const SAMPLE_PER_GROUP = Number(process.env.BMJ_IMPORT_SAMPLE_PER_GROUP || 2);
const OUTPUT_DIR = resolve(
  process.cwd(),
  process.env.BMJ_IMPORT_OUTPUT || "../../artifacts/site-audit",
);
const SOURCE_MODE = process.env.BMJ_SOURCE_MODE || "live";
const FIXTURE_DIR = resolve(
  process.cwd(),
  process.env.BMJ_FIXTURE_DIR || "./fixtures",
);
const USER_AGENT =
  process.env.BMJ_USER_AGENT || "Mozilla/5.0 (compatible; BaoMaJieMigrationImport/1.0)";
const REQUEST_DELAY_MS = Number(process.env.BMJ_REQUEST_DELAY_MS || 350);

const sitemapUrl = `${BASE_URL}/sitemap.xml`;
const startedAt = new Date().toISOString();

await mkdir(OUTPUT_DIR, { recursive: true });

const sitemapXml = await fetchText(sitemapUrl);
const entries = parseSitemap(sitemapXml, COUNTRY);
const sampleEntries = selectSamples(entries, SAMPLE_PER_GROUP);
const importJob = createImportJob(entries.length, sampleEntries.length);
const crawlPages = [];
const listings = [];
const articles = [];
const errors = [];

for (const [index, entry] of sampleEntries.entries()) {
  if (index > 0) await sleep(REQUEST_DELAY_MS);
  try {
    const html = await fetchText(entry.url);
    const parsed = parsePublicPage(html, entry.url);
    const normalized = normalizeParsedPage(parsed, entry);

    crawlPages.push(normalized.crawlPage);
    if (normalized.listing) listings.push(normalized.listing);
    if (normalized.article) articles.push(normalized.article);
  } catch (error) {
    errors.push({
      sourceUrl: entry.url,
      pageType: entry.type,
      error: error.message,
    });
  }
}

importJob.totalRows = crawlPages.length + listings.length + articles.length;
importJob.successRows = importJob.totalRows - errors.length;
importJob.failedRows = errors.length;
importJob.completedAt = new Date().toISOString();
importJob.status = errors.length === 0 ? "completed" : "partial";

const bundle = {
  generatedAt: new Date().toISOString(),
  startedAt,
  baseUrl: BASE_URL,
  country: COUNTRY,
  sitemapUrl,
  configuration: {
    samplePerGroup: SAMPLE_PER_GROUP,
    requestDelayMs: REQUEST_DELAY_MS,
    userAgent: USER_AGENT,
  },
  importJob,
  counts: {
    crawlPages: crawlPages.length,
    listings: listings.length,
    articles: articles.length,
    errors: errors.length,
  },
  crawlPages,
  listings,
  articles,
  errors,
};

await writeFile(
  resolve(OUTPUT_DIR, "import-bundle.json"),
  `${JSON.stringify(bundle, null, 2)}\n`,
  "utf8",
);

console.log(`Import bundle: ${resolve(OUTPUT_DIR, "import-bundle.json")}`);
console.log(`Pages: ${bundle.counts.crawlPages}, listings: ${bundle.counts.listings}, articles: ${bundle.counts.articles}`);

function normalizeParsedPage(parsed, entry) {
  const pageType = parsed.pageType || entry.type;
  const canonicalUrl = parsed.canonical || entry.url;
  const slug = buildSlug(pageType, parsed.section, parsed.sourceId);
  const crawlPage = {
    sourceUrl: parsed.sourceUrl,
    canonicalUrl,
    countryCode: parsed.country,
    pageType,
    section: parsed.section,
    sourceId: parsed.sourceId,
    contentChecksum: parsed.contentChecksum,
    fetchedAt: new Date().toISOString(),
    parsedAt: new Date().toISOString(),
    status: parsed.validation.ok ? "parsed" : "needs_review",
    payload: parsed,
  };

  if (pageType === "news-media-detail") {
    return {
      crawlPage,
      article: {
        countryCode: parsed.country,
        articleType: "news",
        title: parsed.title,
        slug,
        summary: parsed.description || null,
        content: null,
        sourceName: parsed.categoryLabel || "资讯",
        sourceUrl: canonicalUrl,
        publishedAt: parsed.publishedAt,
        sourceChecksum: parsed.contentChecksum,
      },
    };
  }

  if (pageType.endsWith("-detail")) {
    return {
      crawlPage,
      listing: {
        countryCode: parsed.country,
        categorySlug: resolveCategorySlug(parsed.section, pageType),
        title: parsed.title,
        slug,
        description: parsed.description || null,
        regionName: parsed.region || null,
        priceText: parsed.priceText || null,
        serviceCategory: parsed.serviceCategory || null,
        publishedAt: parsed.publishedAt,
        sourceType: "crawler_import",
        sourceId: parsed.sourceId || null,
        sourceUrl: canonicalUrl,
        contactMethodJson: parsed.contacts,
        contentChecksum: parsed.contentChecksum,
      },
    };
  }

  return { crawlPage };
}

function createImportJob(totalRows, sampleRows) {
  return {
    source: "baomajie_public_html",
    type: "page_import",
    status: "running",
    startedAt,
    completedAt: null,
    totalRows,
    successRows: sampleRows,
    failedRows: 0,
    errorSummaryJson: null,
  };
}

function resolveCategorySlug(section, pageType) {
  if (pageType === "yellowpages-detail") return "yellowpages";
  if (pageType === "local-detail") return "local";
  return section || "unknown";
}

function buildSlug(pageType, section, sourceId) {
  if (pageType === "news-media-detail") {
    return ["news-media", sourceId].filter(Boolean).join("-");
  }
  const parts = [pageType.replace(/-detail$/, ""), section, sourceId].filter(Boolean);
  return parts.join("-");
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

async function fetchText(url) {
  if (SOURCE_MODE === "fixtures") {
    return readFixture(url);
  }
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

async function readFixture(url) {
  const path = new URL(url).pathname;
  if (path === "/sitemap.xml") {
    return readFile(resolve(FIXTURE_DIR, "sitemap.xml"), "utf8");
  }
  const fixtureName = path
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .replace(/\//g, "-");
  return readFile(resolve(FIXTURE_DIR, `${fixtureName}.html`), "utf8");
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
