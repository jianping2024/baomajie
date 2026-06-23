import { PrismaClient } from "@prisma/client";
import { listingCategories, listings } from "../src/catalog.seed";

const prisma = new PrismaClient();

const regionSeeds = [
  { slug: "lisboa", nameZh: "里斯本", nameLocal: "Lisboa" },
  { slug: "porto", nameZh: "波尔图", nameLocal: "Porto" },
  { slug: "faro", nameZh: "法鲁", nameLocal: "Faro" },
  { slug: "portugal", nameZh: "全国", nameLocal: "Portugal" },
  { slug: "algarve", nameZh: "阿尔加维", nameLocal: "Algarve" },
];

function resolveRegionSlug(city: string, region: string) {
  const normalized = `${city} ${region}`.toLowerCase();
  if (normalized.includes("faro") || normalized.includes("阿尔加维")) return "faro";
  if (normalized.includes("porto") || normalized.includes("波尔图")) return "porto";
  if (normalized.includes("portugal") || normalized.includes("全国")) return "portugal";
  return "lisboa";
}

async function main() {
  const country = await prisma.country.upsert({
    where: { code: "PT" },
    update: { nameZh: "葡萄牙", nameLocal: "Portugal" },
    create: {
      code: "PT",
      nameZh: "葡萄牙",
      nameLocal: "Portugal",
    },
  });

  const regionMap = new Map<string, string>();
  for (const region of regionSeeds) {
    const record = await prisma.region.upsert({
      where: {
        countryId_slug: {
          countryId: country.id,
          slug: region.slug,
        },
      },
      update: {
        nameZh: region.nameZh,
        nameLocal: region.nameLocal,
      },
      create: {
        countryId: country.id,
        slug: region.slug,
        nameZh: region.nameZh,
        nameLocal: region.nameLocal,
        regionType: "city",
      },
    });
    regionMap.set(region.slug, record.id);
  }

  const categoryMap = new Map<string, string>();
  for (const [index, category] of listingCategories.entries()) {
    const record = await prisma.category.upsert({
      where: {
        countryId_slug: {
          countryId: country.id,
          slug: category.slug,
        },
      },
      update: {
        nameZh: category.label,
        domain: "listings",
        sortOrder: index,
      },
      create: {
        countryId: country.id,
        slug: category.slug,
        nameZh: category.label,
        domain: "listings",
        sortOrder: index,
      },
    });
    categoryMap.set(category.slug, record.id);
  }

  for (const listing of listings) {
    const regionSlug = resolveRegionSlug(listing.city, listing.region);
    const regionId = regionMap.get(regionSlug) ?? regionMap.get("lisboa");
    const categoryId = categoryMap.get(listing.categorySlug);

    const record = await prisma.listing.upsert({
      where: {
        sourceType_sourceId: {
          sourceType: "legacy_seed",
          sourceId: listing.id,
        },
      },
      update: {
        title: listing.title,
        slug: listing.slug,
        summary: listing.summary,
        description: listing.description,
        featured: listing.featured,
        tags: listing.tags,
        relatedSlugs: listing.relatedSlugs,
        publishedAt: new Date(listing.publishedAt),
        updatedAt: new Date(listing.updatedAt),
        sourceUrl: listing.sourceUrl,
        sourceType: listing.sourceLabel.includes("编辑") ? "editorial" : "legacy_seed",
        status: "published",
        regionId,
        categoryId,
        contactMethodJson: {
          phone: listing.contact.phone,
          whatsapp: listing.contact.whatsapp,
          wechat: listing.contact.wechat,
          email: listing.contact.email,
          priceLabel: listing.priceLabel,
        },
      },
      create: {
        countryId: country.id,
        regionId,
        categoryId,
        title: listing.title,
        slug: listing.slug,
        summary: listing.summary,
        description: listing.description,
        featured: listing.featured,
        tags: listing.tags,
        relatedSlugs: listing.relatedSlugs,
        publishedAt: new Date(listing.publishedAt),
        sourceUrl: listing.sourceUrl,
        sourceType: listing.sourceLabel.includes("编辑") ? "editorial" : "legacy_seed",
        sourceId: listing.id,
        status: "published",
        contactMethodJson: {
          phone: listing.contact.phone,
          whatsapp: listing.contact.whatsapp,
          wechat: listing.contact.wechat,
          email: listing.contact.email,
          priceLabel: listing.priceLabel,
        },
      },
    });

    await prisma.listingMedia.deleteMany({ where: { listingId: record.id } });

    for (const [index, imageUrl] of listing.images.entries()) {
      const media = await prisma.media.create({
        data: {
          kind: "image",
          originalUrl: imageUrl,
          status: "active",
        },
      });

      await prisma.listingMedia.create({
        data: {
          listingId: record.id,
          mediaId: media.id,
          sortOrder: index,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
