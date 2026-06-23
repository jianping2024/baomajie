import test from "node:test";
import assert from "node:assert/strict";
import { parsePublicPage } from "../src/parser.mjs";

function normalizeParsedPage(parsed) {
  const pageType = parsed.pageType;
  const canonicalUrl = parsed.canonical;
  const slug =
    pageType === "news-media-detail"
      ? ["news-media", parsed.sourceId].filter(Boolean).join("-")
      : [pageType.replace(/-detail$/, ""), parsed.section, parsed.sourceId]
          .filter(Boolean)
          .join("-");

  if (pageType === "news-media-detail") {
    return {
      crawlPage: { pageType, sourceId: parsed.sourceId, canonicalUrl },
      article: {
        articleType: "news",
        title: parsed.title,
        slug,
        summary: parsed.description || null,
      },
    };
  }

  return {
    crawlPage: { pageType, sourceId: parsed.sourceId, canonicalUrl },
    listing: {
      sourceType: "crawler_import",
      title: parsed.title,
      slug,
      description: parsed.description || null,
      regionName: parsed.region || null,
    },
  };
}

test("normalizes classified pages into listing-shaped records", () => {
  const html = `<!doctype html><html><head>
    <link rel="canonical" href="https://www.baomajie.com/pt/jobs/4571/">
    <meta name="description" content="招聘寿司师傅 电话：966815503">
    <meta property="og:image" content="https://yp-img.baomajie.com/yp/logo/bailogo.png">
  </head><body>
  <script>
  window._bmjPosterData={"title":"里斯本郊区招聘寿司师傅","description":"招聘岗位：寿司师傅\\r\\n薪资：面谈\\r\\n电话：966815503\\r\\n微信：worker_pt","tags":{"location":"里斯本","cost":"面谈"},"gridItems":[{"label":"地区","value":"里斯本"},{"label":"价格","value":"面谈"},{"label":"方式","value":"招全职"}],"methodText":"招全职","badge":"求职招聘","coverUrl":"","pageUrl":"https://www.baomajie.com/pt/jobs/4571/"};
  </script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"JobPosting","title":"里斯本郊区招聘寿司师傅","datePosted":"2026-06-23T13:37:12+01:00"}</script>
  <main id="bmj-classified-detail-main" data-listing-id="4571" data-country="pt">
    <h1>里斯本郊区招聘寿司师傅</h1>
  </main>
  </body></html>`;
  const parsed = parsePublicPage(html, "https://www.baomajie.com/pt/jobs/4571/");
  const normalized = normalizeParsedPage(parsed);
  assert.equal(normalized.crawlPage.pageType, "classified-detail");
  assert.equal(normalized.crawlPage.sourceId, "4571");
  assert.equal(normalized.listing.sourceType, "crawler_import");
  assert.equal(normalized.listing.slug, "classified-jobs-4571");
  assert.equal(normalized.listing.regionName, "里斯本");
});

test("normalizes news media pages into article-shaped records", () => {
  const html = `<!doctype html><html><head>
    <link rel="canonical" href="https://www.baomajie.com/pt/news/media/125/">
    <meta name="description" content="葡萄牙本地新闻摘要">
  </head><body>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"葡萄牙本地新闻摘要","datePublished":"2026-06-23T13:37:12+01:00"}</script>
  <h1>葡萄牙本地新闻摘要</h1>
  </body></html>`;
  const parsed = parsePublicPage(html, "https://www.baomajie.com/pt/news/media/125/");
  const normalized = normalizeParsedPage(parsed);
  assert.equal(normalized.crawlPage.pageType, "news-media-detail");
  assert.equal(normalized.article.articleType, "news");
  assert.equal(normalized.article.slug, "news-media-125");
});
