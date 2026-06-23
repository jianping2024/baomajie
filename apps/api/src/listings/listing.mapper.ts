import type { Category, Listing, ListingMedia, Media, Region } from "@prisma/client";
import type { ListingCategorySlug, ListingRecord } from "../catalog.seed";

type ContactMethodJson = {
  phone?: string;
  whatsapp?: string;
  wechat?: string;
  email?: string;
  priceLabel?: string;
};

export type ListingWithRelations = Listing & {
  category: Category | null;
  region: Region | null;
  media: Array<ListingMedia & { media: Media }>;
};

const categorySlugSet = new Set<ListingCategorySlug>(["guide", "rent", "jobs", "services", "used"]);

function toCategorySlug(slug: string | undefined): ListingCategorySlug {
  if (slug && categorySlugSet.has(slug as ListingCategorySlug)) {
    return slug as ListingCategorySlug;
  }
  return "guide";
}

export function mapListingToRecord(listing: ListingWithRelations): ListingRecord {
  const contact = (listing.contactMethodJson ?? {}) as ContactMethodJson;

  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    categorySlug: toCategorySlug(listing.category?.slug),
    categoryLabel: listing.category?.nameZh ?? "未分类",
    city: listing.region?.nameLocal ?? listing.region?.nameZh ?? "",
    region: listing.region?.nameZh ?? "",
    summary: listing.summary ?? "",
    description: listing.description ?? "",
    publishedAt: listing.publishedAt?.toISOString() ?? listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    sourceLabel: listing.sourceType === "editorial" ? "来源：编辑整理" : "来源：旧站公开信息",
    sourceUrl: listing.sourceUrl,
    featured: listing.featured,
    priceLabel: contact.priceLabel,
    contact: {
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      wechat: contact.wechat,
      email: contact.email,
    },
    tags: listing.tags,
    relatedSlugs: listing.relatedSlugs,
    images: listing.media
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.media.originalUrl ?? item.media.storageKey ?? "")
      .filter(Boolean),
  };
}
