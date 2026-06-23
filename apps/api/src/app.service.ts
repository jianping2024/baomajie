import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { listingCategories } from "./catalog.seed";
import { ListingWithRelations, mapListingToRecord } from "./listings/listing.mapper";
import { PrismaService } from "./prisma/prisma.service";

const listingInclude = {
  category: true,
  region: true,
  media: {
    include: { media: true },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.ListingInclude;

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async health() {
    let database: "ok" | "error" = "ok";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "error";
    }

    return {
      status: database === "ok" ? "ok" : "degraded",
      service: "baomajie-api",
      version: "0.1.0",
      database,
    };
  }

  async getHome() {
    const featured = await this.prisma.listing.findMany({
      where: { status: "published", deletedAt: null, featured: true },
      include: listingInclude,
      orderBy: [{ publishedAt: "desc" }],
      take: 2,
    });

    const updates = await this.prisma.listing.findMany({
      where: { status: "published", deletedAt: null },
      include: listingInclude,
      orderBy: [{ publishedAt: "desc" }],
      take: 4,
    });

    const solutions = featured.map((listing) => {
      const item = mapListingToRecord(listing as ListingWithRelations);
      return {
        tag: item.categoryLabel.replace("办事指南", "办事").replace("找房", "工具"),
        meta: `${item.region || item.city} · ${item.sourceLabel.replace("来源：", "来源：")}`,
        title: item.title,
        href: `/pt/listings/${item.slug}`,
      };
    });

    return {
      hero: {
        eyebrow: "Portugal 生活问题入口",
        title: "来葡萄牙后先解决什么问题",
        cities: ["Lisboa", "Porto", "Faro", "Braga", "Coimbra"],
      },
      problems: [
        { label: "居留、税号、开户", href: "/pt/listings?category=guide", tone: "warm" },
        { label: "找房、搬家、签约", href: "/pt/listings?category=rent", tone: "cool" },
        { label: "找工作、找兼职", href: "/pt/listings?category=jobs", tone: "gold" },
        { label: "找服务商", href: "/pt/listings?category=services", tone: "dark" },
      ],
      solutions:
        solutions.length > 0
          ? solutions
          : [
              {
                tag: "办事",
                meta: "里斯本 · 来源：guides/4812",
                title: "葡萄牙居留、税号和银行账户的办理顺序",
                href: "/pt/listings/tax-number-bank-account-order",
              },
            ],
      services: [
        { tag: "服务入口", title: "翻译、装修、会计、接送、清洁", href: "/pt/listings?category=services" },
        { tag: "广告位", title: "合作商家、置顶推荐、城市曝光", href: "/pt/listings?featured=1" },
        { tag: "订阅", title: "每周更新、专题提醒、本地摘要", href: "/pt/search?q=%E5%91%A8%E6%8A%A5" },
      ],
      updates: updates.map((listing) => {
        const item = mapListingToRecord(listing as ListingWithRelations);
        const tag = item.categoryLabel.replace("办事指南", "指南").replace("找工作", "工作").replace("找服务", "服务").replace("二手闲置", "二手").replace("找房", "找房");
        const metaParts = [item.city || item.region, item.priceLabel].filter(Boolean);
        return {
          tag,
          title: item.title,
          meta: metaParts.join(" · "),
          href: `/pt/listings/${item.slug}`,
        };
      }),
      cta: {
        title: "订阅更新，或提交合作",
      },
    };
  }

  async getCatalog() {
    const categories = await this.prisma.category.findMany({
      where: { status: "active" },
      orderBy: [{ sortOrder: "asc" }],
    });

    const records = await this.prisma.listing.findMany({
      where: { status: "published", deletedAt: null },
      include: listingInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    });

    return {
      categories:
        categories.length > 0
          ? categories.map((category) => ({
              slug: category.slug,
              label: category.nameZh,
              description: listingCategories.find((item) => item.slug === category.slug)?.description ?? "",
            }))
          : listingCategories,
      listings: records.map((listing) => mapListingToRecord(listing as ListingWithRelations)),
    };
  }

  async listListings(params: { query?: string; category?: string; region?: string; page?: number; limit?: number }) {
    const query = params.query?.trim() || "";
    const category = params.category?.trim().toLowerCase() || "";
    const region = params.region?.trim().toLowerCase() || "";
    const limit = Math.min(Math.max(Number(params.limit || 8), 1), 24);
    const page = Math.max(Number(params.page || 1), 1);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: "published",
      deletedAt: null,
      ...(category
        ? {
            category: {
              slug: category,
            },
          }
        : {}),
      ...(region
        ? {
            OR: [
              { region: { nameZh: { contains: region, mode: "insensitive" } } },
              { region: { nameLocal: { contains: region, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { summary: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { tags: { has: query } },
            ],
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      items: records.map((listing) => mapListingToRecord(listing as ListingWithRelations)),
      filters: {
        categories: listingCategories,
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

  async getListing(slug: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { slug, status: "published", deletedAt: null },
      include: listingInclude,
    });

    if (!listing) return null;

    const relatedRecords =
      listing.relatedSlugs.length > 0
        ? await this.prisma.listing.findMany({
            where: {
              slug: { in: listing.relatedSlugs },
              status: "published",
              deletedAt: null,
            },
            include: listingInclude,
          })
        : [];

    const relatedBySlug = new Map(relatedRecords.map((item) => [item.slug, item]));
    const related = listing.relatedSlugs
      .map((relatedSlug) => relatedBySlug.get(relatedSlug))
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
      .map((item) => mapListingToRecord(item as ListingWithRelations));

    return {
      item: mapListingToRecord(listing as ListingWithRelations),
      related,
    };
  }

  async searchListings(params: { query?: string; category?: string; region?: string; limit?: number }) {
    const query = params.query?.trim() || "";
    return this.listListings({
      query,
      category: params.category,
      region: params.region,
      page: 1,
      limit: params.limit ?? 12,
    });
  }
}
