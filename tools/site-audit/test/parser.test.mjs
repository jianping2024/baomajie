import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyUrl,
  extractContacts,
  parsePublicPage,
  parseSitemap,
} from "../src/parser.mjs";

const classifiedFixture = `<!doctype html>
<html>
<head>
  <link rel="canonical" href="https://www.baomajie.com/pt/jobs/4571/">
  <meta name="description" content="招聘寿司师傅 电话：966815503">
  <meta property="og:image" content="https://yp-img.baomajie.com/yp/logo/bailogo.png">
</head>
<body>
<script>
window._bmjPosterData={"title":"里斯本郊区招聘寿司师傅","description":"招聘岗位：寿司师傅\\r\\n薪资：面谈\\r\\n电话：966815503\\r\\n微信：worker_pt","tags":{"location":"里斯本","cost":"面谈"},"gridItems":[{"label":"地区","value":"里斯本"},{"label":"价格","value":"面谈"},{"label":"方式","value":"招全职"}],"methodText":"招全职","badge":"求职招聘","coverUrl":"","pageUrl":"https://www.baomajie.com/pt/jobs/4571/"};
</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"JobPosting","title":"里斯本郊区招聘寿司师傅","datePosted":"2026-06-23T13:37:12+01:00"}</script>
<main id="bmj-classified-detail-main" data-listing-id="4571" data-country="pt">
  <h1>里斯本郊区招聘寿司师傅</h1>
  <time class="bmj-time-local" data-publish-ts="1782218232"></time>
</main>
</body>
</html>`;

test("classifies supported URL templates", () => {
  assert.deepEqual(classifyUrl("https://www.baomajie.com/pt/jobs/4571/"), {
    type: "classified-detail",
    country: "pt",
    section: "jobs",
    id: "4571",
  });
  assert.equal(
    classifyUrl("https://www.baomajie.com/pt/news/media/125/").type,
    "news-media-detail",
  );
  assert.equal(classifyUrl("https://www.baomajie.com/pt/yellowpages/").type, "yellowpages-index");
});

test("parses sitemap entries for a single country", () => {
  const xml = `<urlset>
    <url><loc>https://www.baomajie.com/pt/</loc></url>
    <url><loc>https://www.baomajie.com/pt/jobs/4571/</loc><lastmod>2026-06-23</lastmod></url>
    <url><loc>https://www.baomajie.com/es/jobs/1/</loc></url>
  </urlset>`;
  const entries = parseSitemap(xml, "pt");
  assert.equal(entries.length, 2);
  assert.equal(entries[1].id, "4571");
  assert.equal(entries[1].lastmod, "2026-06-23");
});

test("parses classified details from stable structured signals", () => {
  const page = parsePublicPage(classifiedFixture, "https://www.baomajie.com/pt/jobs/4571/");
  assert.equal(page.sourceId, "4571");
  assert.equal(page.title, "里斯本郊区招聘寿司师傅");
  assert.equal(page.region, "里斯本");
  assert.equal(page.priceText, "面谈");
  assert.equal(page.methodText, "招全职");
  assert.deepEqual(page.contacts.phones, ["966815503"]);
  assert.deepEqual(page.contacts.wechat, ["worker_pt"]);
  assert.equal(page.validation.ok, true);
  assert.equal(page.parserSignals.posterData, true);
  assert.equal(page.parserSignals.jsonLd, true);
});

test("extracts and normalizes public contacts", () => {
  const contacts = extractContacts(
    "电话 +351 925 012 638，备用 966-815-503，微信：wangyongling08，邮箱 TEST@EXAMPLE.COM",
  );
  assert.deepEqual(contacts.phones, ["+351925012638", "966815503"]);
  assert.deepEqual(contacts.wechat, ["wangyongling08"]);
  assert.deepEqual(contacts.emails, ["test@example.com"]);
});

test("produces a stable content checksum", () => {
  const first = parsePublicPage(classifiedFixture, "https://www.baomajie.com/pt/jobs/4571/");
  const second = parsePublicPage(classifiedFixture, "https://www.baomajie.com/pt/jobs/4571/");
  assert.equal(first.contentChecksum, second.contentChecksum);
});

test("does not treat a yellow-pages business category as a price", () => {
  const html = `<!doctype html><html><head>
    <link rel="canonical" href="https://www.baomajie.com/pt/yellowpages/371/">
    </head><body>
    <script>window._bmjPosterData={"title":"浩大鞋业","description":"鞋类批发","tags":{"location":"维拉贡德","cost":"鞋类批发"},"gridItems":[{"label":"主营","value":"鞋类批发"},{"label":"地区","value":"维拉贡德"}],"badge":"黄页"};</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"浩大鞋业","description":"鞋类批发"}</script>
    <h1>浩大鞋业</h1></body></html>`;
  const page = parsePublicPage(html, "https://www.baomajie.com/pt/yellowpages/371/");
  assert.equal(page.priceText, null);
  assert.equal(page.serviceCategory, "鞋类批发");
});
