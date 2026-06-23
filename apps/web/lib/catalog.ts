export type ListingCategorySlug = "guide" | "rent" | "jobs" | "services" | "used";

export type ListingRecord = {
  id: string;
  slug: string;
  title: string;
  categorySlug: ListingCategorySlug;
  categoryLabel: string;
  city: string;
  region: string;
  summary: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  sourceLabel: string;
  sourceUrl: string;
  featured: boolean;
  priceLabel?: string;
  contact: {
    phone?: string;
    whatsapp?: string;
    wechat?: string;
    email?: string;
  };
  tags: string[];
  relatedSlugs: string[];
  images: string[];
};

export const categories: Array<{
  slug: ListingCategorySlug;
  label: string;
  description: string;
}> = [
  { slug: "guide", label: "办事指南", description: "税号、居留、开户、流程说明" },
  { slug: "rent", label: "找房", description: "出租、合租、搬家、签约" },
  { slug: "jobs", label: "找工作", description: "招聘、兼职、远程岗位" },
  { slug: "services", label: "找服务", description: "翻译、装修、会计、接送" },
  { slug: "used", label: "二手闲置", description: "家具、电器、生活用品" },
];

export const listings: ListingRecord[] = [
  {
    id: "bmj-1001",
    slug: "tax-number-bank-account-order",
    title: "葡萄牙居留、税号和银行账户的办理顺序",
    categorySlug: "guide",
    categoryLabel: "办事指南",
    city: "Lisboa",
    region: "里斯本大区",
    summary: "新到葡萄牙后，先办什么、后办什么，哪些材料要一次备齐。",
    description:
      "这条内容整理了中国人落地葡萄牙后最常见的办事顺序：先拿税号，再做住址证明准备，随后再处理银行账户、居留材料和长期生活所需的基础文件。适合第一次落地的人先按清单推进，避免反复跑腿。",
    publishedAt: "2026-06-18T09:00:00.000Z",
    updatedAt: "2026-06-21T09:10:00.000Z",
    sourceLabel: "来源：旧站公开信息",
    sourceUrl: "https://www.baomajie.com/pt/guides/4812/",
    featured: true,
    tags: ["税号", "居留", "银行", "开户", "办事清单"],
    contact: { whatsapp: "+351 910 000 101", wechat: "bmj-guide-pt" },
    relatedSlugs: ["rent-checklist-lisbon", "lisbon-chinese-customer-service"],
    images: ["/images/pt-guide-1.jpg", "/images/pt-guide-2.jpg"],
  },
  {
    id: "bmj-1002",
    slug: "rent-checklist-lisbon",
    title: "租房检查清单：看房前先问什么，签约前看什么",
    categorySlug: "rent",
    categoryLabel: "找房",
    city: "Lisboa",
    region: "里斯本",
    summary: "从押金、合同、房东身份到水电网，避免踩坑的完整清单。",
    description:
      "这条内容更像一个落地后的租房检查表：是否允许报税、是否包含家具、押金和中介费怎么算、合同是否可登记、哪类房源更适合家庭或单人居住。它适合做找房入口页，也适合引导到后续服务。",
    publishedAt: "2026-06-19T11:25:00.000Z",
    updatedAt: "2026-06-22T08:20:00.000Z",
    sourceLabel: "来源：旧站公开信息",
    sourceUrl: "https://www.baomajie.com/pt/rent/4551/",
    featured: true,
    priceLabel: "€1,200/月",
    tags: ["租房", "签约", "押金", "看房", "水电网"],
    contact: { phone: "+351 210 000 201", whatsapp: "+351 910 000 201" },
    relatedSlugs: ["alameda-one-bedroom", "used-electronics-dining-table"],
    images: ["/images/pt-rent-1.jpg", "/images/pt-rent-2.jpg"],
  },
  {
    id: "bmj-1003",
    slug: "lisbon-chinese-customer-service",
    title: "招聘中文客服，远程 / 里斯本均可",
    categorySlug: "jobs",
    categoryLabel: "找工作",
    city: "Lisboa",
    region: "里斯本",
    summary: "面向懂中文和基础英语的人，支持远程或到岗。",
    description:
      "中文客服岗位，主要处理客户咨询、消息回复、简单订单跟进和内部协作。适合希望在葡萄牙找一份可远程或本地到岗工作的用户。信息公开联系电话，方便直接联系。",
    publishedAt: "2026-06-20T07:30:00.000Z",
    updatedAt: "2026-06-22T12:15:00.000Z",
    sourceLabel: "来源：旧站公开信息",
    sourceUrl: "https://www.baomajie.com/pt/jobs/4930/",
    featured: true,
    priceLabel: "€1,500 - €1,900/月",
    tags: ["招聘", "客服", "中文", "远程", "兼职"],
    contact: { phone: "+351 910 000 301", email: "jobs@example.com" },
    relatedSlugs: ["translator-accountant-cleaning", "alameda-one-bedroom"],
    images: ["/images/pt-job-1.jpg", "/images/pt-job-2.jpg"],
  },
  {
    id: "bmj-1004",
    slug: "alameda-one-bedroom",
    title: "Alameda 附近一居室，步行到地铁",
    categorySlug: "rent",
    categoryLabel: "找房",
    city: "Lisboa",
    region: "里斯本",
    summary: "适合单人或情侣，交通方便，周边生活设施齐全。",
    description:
      "该房源位于 Alameda 附近，步行可达地铁站，适合刚落地葡萄牙、想优先解决通勤与生活便利性的用户。房源公开联系方式，可直接咨询看房时间和合同细节。",
    publishedAt: "2026-06-21T13:05:00.000Z",
    updatedAt: "2026-06-22T09:00:00.000Z",
    sourceLabel: "来源：旧站公开信息",
    sourceUrl: "https://www.baomajie.com/pt/rent/4552/",
    featured: false,
    priceLabel: "€1,200/月",
    tags: ["一居室", "地铁", "里斯本", "合租", "家具"],
    contact: { phone: "+351 910 000 202", whatsapp: "+351 910 000 202" },
    relatedSlugs: ["rent-checklist-lisbon", "used-electronics-dining-table"],
    images: ["/images/pt-rent-3.jpg"],
  },
  {
    id: "bmj-1005",
    slug: "translator-accountant-cleaning",
    title: "翻译、装修、会计、接送、清洁服务",
    categorySlug: "services",
    categoryLabel: "找服务",
    city: "Lisboa / Porto",
    region: "葡萄牙",
    summary: "针对在葡萄牙生活的华人，聚合高频本地服务入口。",
    description:
      "服务类内容聚合了翻译陪同、税务会计、装修施工、机场接送和清洁保洁等高频需求。适合作为商业入口页，将流量导向服务商、广告和后续订阅。",
    publishedAt: "2026-06-19T15:40:00.000Z",
    updatedAt: "2026-06-22T10:00:00.000Z",
    sourceLabel: "来源：旧站公开信息",
    sourceUrl: "https://www.baomajie.com/pt/service/4522/",
    featured: true,
    tags: ["翻译", "装修", "会计", "接送", "清洁"],
    contact: { whatsapp: "+351 910 000 401", wechat: "bmj-service-pt" },
    relatedSlugs: ["tax-number-bank-account-order", "lisbon-chinese-customer-service"],
    images: ["/images/pt-service-1.jpg", "/images/pt-service-2.jpg"],
  },
  {
    id: "bmj-1006",
    slug: "used-electronics-dining-table",
    title: "带票二手电器、餐桌、婴儿用品",
    categorySlug: "used",
    categoryLabel: "二手闲置",
    city: "Lisboa",
    region: "里斯本",
    summary: "搬家、换房、刚到葡萄牙时常用的二手转让信息。",
    description:
      "这条内容适合做二手入口：电器、桌椅、婴儿用品、收纳和小件家具。强调公开来源、公开联系方式和基本核验提示，帮助用户快速判断能不能接手。",
    publishedAt: "2026-06-22T06:50:00.000Z",
    updatedAt: "2026-06-22T12:40:00.000Z",
    sourceLabel: "来源：旧站公开信息",
    sourceUrl: "https://www.baomajie.com/pt/used/4500/",
    featured: false,
    priceLabel: "价格面议",
    tags: ["二手", "家具", "电器", "婴儿用品", "搬家"],
    contact: { phone: "+351 910 000 501", whatsapp: "+351 910 000 501" },
    relatedSlugs: ["alameda-one-bedroom", "rent-checklist-lisbon"],
    images: ["/images/pt-used-1.jpg", "/images/pt-used-2.jpg"],
  },
  {
    id: "bmj-1007",
    slug: "porto-lisboa-weekly-insider",
    title: "每周葡萄牙生活更新：政策、找房、工作、服务",
    categorySlug: "guide",
    categoryLabel: "办事指南",
    city: "Portugal",
    region: "全国",
    summary: "给在葡萄牙生活的中国人看的周报式入口。",
    description:
      "这是一条适合首页和搜索页承接的总结型内容，聚合本周最值得注意的政策变化、找房趋势、招聘信息和服务更新。它可以作为订阅流量的核心承接内容。",
    publishedAt: "2026-06-17T09:10:00.000Z",
    updatedAt: "2026-06-22T07:10:00.000Z",
    sourceLabel: "来源：编辑整理",
    sourceUrl: "https://www.baomajie.com/pt/news/media/125/",
    featured: false,
    tags: ["周报", "政策", "订阅", "找房", "工作"],
    contact: { email: "weekly@example.com" },
    relatedSlugs: ["tax-number-bank-account-order", "translator-accountant-cleaning"],
    images: ["/images/pt-weekly-1.jpg"],
  },
  {
    id: "bmj-1008",
    slug: "faro-family-settlement-checklist",
    title: "法鲁家庭落地清单：学校、住址、医保和交通",
    categorySlug: "guide",
    categoryLabel: "办事指南",
    city: "Faro",
    region: "阿尔加维",
    summary: "面向家庭用户的落地问题入口，覆盖孩子上学和日常生活。",
    description:
      "面向带孩子落地葡萄牙的家庭，重点讨论住址证明、学校、医保、交通和日常生活安排。内容适合和服务商入口、订阅提醒结合呈现。",
    publishedAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-21T14:20:00.000Z",
    sourceLabel: "来源：编辑整理",
    sourceUrl: "https://www.baomajie.com/pt/guides/4820/",
    featured: false,
    tags: ["家庭", "学校", "医保", "交通", "法鲁"],
    contact: { whatsapp: "+351 910 000 601" },
    relatedSlugs: ["tax-number-bank-account-order", "rent-checklist-lisbon"],
    images: ["/images/pt-family-1.jpg"],
  },
];

export function findListingBySlug(slug: string) {
  return listings.find((item) => item.slug === slug);
}

export function filterListings(params: {
  query?: string;
  category?: string;
  region?: string;
  limit?: number;
  page?: number;
}) {
  const query = params.query?.trim().toLowerCase() || "";
  const category = params.category?.trim().toLowerCase() || "";
  const region = params.region?.trim().toLowerCase() || "";
  const limit = Math.min(Math.max(Number(params.limit || 12), 1), 24);
  const page = Math.max(Number(params.page || 1), 1);

  const filtered = listings.filter((item) => {
    const matchesQuery =
      !query ||
      [item.title, item.summary, item.description, item.tags.join(" "), item.city, item.region]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesCategory = !category || item.categorySlug === category;
    const matchesRegion = !region || [item.city, item.region].join(" ").toLowerCase().includes(region);
    return matchesQuery && matchesCategory && matchesRegion;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });

  const total = sorted.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);

  return {
    items,
    filters: {
      categories,
    },
    page,
    limit,
    total,
    totalPages,
    query,
    category,
    region,
    hasNextPage: page < totalPages,
  };
}

export function searchListings(query: string) {
  return filterListings({ query, page: 1, limit: 24 });
}

