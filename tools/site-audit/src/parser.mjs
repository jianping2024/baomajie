import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

const CLASSIFIED_TYPES = new Set(["jobs", "rent", "used", "biz", "service"]);

export function normalizeWhitespace(value = "") {
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function classifyUrl(input) {
  const url = new URL(input);
  const parts = url.pathname.split("/").filter(Boolean);
  const country = parts[0] ?? null;
  const section = parts[1] ?? null;
  const id = parts[2] && /^\d+$/.test(parts[2]) ? parts[2] : null;

  if (!country) return { type: "unknown", country, section, id };
  if (parts.length === 1) return { type: "home", country, section: null, id: null };
  if (section === "publish") return { type: "publish", country, section, id: null };
  if (section === "yellowpages") {
    return { type: id ? "yellowpages-detail" : "yellowpages-index", country, section, id };
  }
  if (section === "local") {
    return { type: id ? "local-detail" : "local-index", country, section, id };
  }
  if (section === "news") {
    if (parts[2] === "media" && parts[3] && /^\d+$/.test(parts[3])) {
      return { type: "news-media-detail", country, section, id: parts[3] };
    }
    return { type: "news-index", country, section, id: null };
  }
  if (CLASSIFIED_TYPES.has(section)) {
    return { type: id ? "classified-detail" : "classified-index", country, section, id };
  }
  return { type: "unknown", country, section, id };
}

export function parseSitemap(xml, country = "pt") {
  const entries = [];
  const urlPattern = /<url>\s*<loc>([\s\S]*?)<\/loc>(?:\s*<lastmod>([\s\S]*?)<\/lastmod>)?\s*<\/url>/g;
  let match;
  while ((match = urlPattern.exec(xml)) !== null) {
    const url = decodeXml(match[1].trim());
    const classification = classifyUrl(url);
    if (classification.country !== country) continue;
    entries.push({
      url,
      lastmod: match[2]?.trim() ?? null,
      ...classification,
    });
  }
  return entries;
}

export function parsePublicPage(html, sourceUrl) {
  const $ = cheerio.load(html);
  const classification = classifyUrl(sourceUrl);
  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() ||
    $('meta[property="og:url"]').attr("content")?.trim() ||
    sourceUrl;
  const h1 = normalizeWhitespace($("h1").first().text());
  const metaDescription = normalizeWhitespace(
    $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "",
  );
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || null;
  const posterData = extractPosterData(html);
  const jsonLd = extractJsonLd($);
  const primaryJsonLd = jsonLd.find((item) => item?.["@type"] !== "BreadcrumbList") ?? null;
  const main = $("#bmj-classified-detail-main").first();
  const publishTime = $(".bmj-time-local").first();
  const description = normalizeWhitespace(
    posterData?.description ||
      primaryJsonLd?.description ||
      metaDescription,
  );
  const title = normalizeWhitespace(
    posterData?.title ||
      primaryJsonLd?.name ||
      primaryJsonLd?.title ||
      h1 ||
      $("title").text(),
  );
  const images = unique(
    [
      posterData?.coverUrl,
      primaryJsonLd?.image,
      primaryJsonLd?.thumbnailUrl,
      ogImage,
      ...$("main img")
        .map((_, element) => $(element).attr("src"))
        .get(),
    ].flatMap((value) => (Array.isArray(value) ? value : [value])),
  ).filter(isPublicContentImage);
  const contacts = extractContacts(description);
  const structured = extractStructuredFields(posterData, primaryJsonLd, classification);
  const id = main.attr("data-listing-id") || classification.id;
  const publishedAt = ["classified-detail"].includes(classification.type)
    ? primaryJsonLd?.datePosted ||
      primaryJsonLd?.datePublished ||
      timestampToIso(publishTime.attr("data-publish-ts")) ||
      posterData?.heroBadge ||
      null
    : primaryJsonLd?.datePublished || null;

  const result = {
    sourceUrl,
    canonical,
    pageType: classification.type,
    country: classification.country,
    section: classification.section,
    sourceId: id ?? null,
    title,
    description,
    categoryLabel:
      posterData?.badge ||
      breadcrumbCategory(jsonLd) ||
      sectionLabel(classification.section),
    region: structured.region,
    priceText: structured.priceText,
    serviceCategory: structured.serviceCategory,
    methodText: posterData?.methodText || structured.methodText,
    publishedAt,
    eventStartAt: classification.type === "local-detail" ? primaryJsonLd?.startDate || null : null,
    eventEndAt: classification.type === "local-detail" ? primaryJsonLd?.endDate || null : null,
    modifiedAt: primaryJsonLd?.dateModified || null,
    images,
    contacts,
    structuredDataType: primaryJsonLd?.["@type"] ?? null,
    parserSignals: {
      posterData: Boolean(posterData),
      jsonLd: Boolean(primaryJsonLd),
      classifiedMain: main.length > 0,
      h1: Boolean(h1),
      canonical: Boolean(canonical),
    },
  };

  result.contentChecksum = createHash("sha256")
    .update(
      JSON.stringify({
        canonical: result.canonical,
        title: result.title,
        description: result.description,
        images: result.images,
      }),
    )
    .digest("hex");

  result.validation = validateParsedPage(result);
  return result;
}

export function validateParsedPage(page) {
  const errors = [];
  const warnings = [];
  if (!page.canonical) errors.push("missing_canonical");
  if (!page.title) errors.push("missing_title");
  if (!page.sourceId && page.pageType.endsWith("-detail")) errors.push("missing_source_id");
  if (
    ["classified-detail", "yellowpages-detail", "local-detail"].includes(page.pageType) &&
    !page.description
  ) {
    errors.push("missing_description");
  }
  if (!page.parserSignals.jsonLd) warnings.push("missing_json_ld");
  if (!page.parserSignals.posterData && page.pageType !== "news-media-detail") {
    warnings.push("missing_poster_data");
  }
  if (page.images.length === 0) warnings.push("no_content_image");
  return { ok: errors.length === 0, errors, warnings };
}

export function extractContacts(text) {
  const value = normalizeWhitespace(text);
  const phoneMatches =
    value.match(/(?<!\d)(?:\+?351[\s.-]?)?(?:9\d{2}(?:[\s.-]?\d{3}){2})(?!\d)/g) ?? [];
  const phones = unique(phoneMatches.map((phone) => phone.replace(/[^\d+]/g, "")));
  const wechatMatches = [];
  for (const match of value.matchAll(/(?:微信|wechat|wx)\s*[：:=]?\s*([A-Za-z][A-Za-z0-9_-]{4,19})/gi)) {
    wechatMatches.push(match[1]);
  }
  const emailMatches = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const whatsapp = /whatsapp|WhatsApp|瓦次普/i.test(value) ? phones : [];
  return {
    phones,
    wechat: unique(wechatMatches),
    emails: unique(emailMatches.map((email) => email.toLowerCase())),
    whatsapp,
  };
}

function extractPosterData(html) {
  const marker = "window._bmjPosterData=";
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const jsonStart = html.indexOf("{", start + marker.length);
  if (jsonStart === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let jsonEnd = -1;
  for (let index = jsonStart; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        jsonEnd = index + 1;
        break;
      }
    }
  }
  if (jsonEnd === -1) return null;
  try {
    return JSON.parse(html.slice(jsonStart, jsonEnd));
  } catch {
    return null;
  }
}

function extractJsonLd($) {
  return $('script[type="application/ld+json"]')
    .map((_, element) => {
      try {
        return JSON.parse($(element).text());
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);
}

function extractStructuredFields(posterData, jsonLd, classification) {
  const gridItems = Array.isArray(posterData?.gridItems) ? posterData.gridItems : [];
  const byLabel = Object.fromEntries(
    gridItems.map((item) => [normalizeWhitespace(item.label), normalizeWhitespace(item.value)]),
  );
  return {
    region:
      byLabel["地区"] ||
      byLabel["区域"] ||
      jsonLd?.jobLocation?.address?.addressLocality ||
      jsonLd?.address?.addressLocality ||
      null,
    priceText: ["classified-detail", "local-detail"].includes(classification.type)
      ? byLabel["价格"] ||
        byLabel["费用"] ||
        posterData?.tags?.cost ||
        jsonLd?.offers?.price?.toString() ||
        null
      : null,
    serviceCategory:
      classification.type === "yellowpages-detail"
        ? byLabel["主营"] || posterData?.tags?.cost || null
        : null,
    methodText: byLabel["方式"] || null,
  };
}

function breadcrumbCategory(items) {
  const breadcrumb = items.find((item) => item?.["@type"] === "BreadcrumbList");
  return breadcrumb?.itemListElement?.[1]?.name ?? null;
}

function sectionLabel(section) {
  return {
    jobs: "求职招聘",
    rent: "房产租售",
    used: "二手买卖",
    biz: "生意转让",
    service: "便民服务",
    yellowpages: "黄页",
    local: "本地活动",
    news: "资讯",
  }[section] ?? null;
}

function timestampToIso(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return new Date(number * 1000).toISOString();
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function isPublicContentImage(url) {
  if (!url) return false;
  return !/\/(?:logo|icon)\//i.test(url) && !/bailogo|favicon/i.test(url);
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}
