-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameLocal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameLocal" TEXT,
    "regionType" TEXT NOT NULL DEFAULT 'city',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "parentCategoryId" TEXT,
    "domain" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameLocal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "organizationId" TEXT,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "priceAmount" DECIMAL(12,2),
    "currencyCode" VARCHAR(3),
    "priceType" TEXT DEFAULT 'fixed',
    "conditionType" TEXT,
    "contactMethodJson" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'published',
    "moderationReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "contentChecksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT,
    "originalUrl" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingMedia" (
    "listingId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingMedia_pkey" PRIMARY KEY ("listingId","mediaId")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT,
    "categoryId" TEXT,
    "articleType" TEXT NOT NULL DEFAULT 'news',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "factCheckStatus" TEXT NOT NULL DEFAULT 'unchecked',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlPage" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "categoryId" TEXT,
    "articleId" TEXT,
    "pageType" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "contentChecksum" TEXT,
    "httpStatus" INTEGER,
    "fetchedAt" TIMESTAMP(3),
    "parsedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'fetched',
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorSummaryJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJobError" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "sourcePayloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportJobError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyMapping" (
    "id" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "newId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "checksum" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Region_countryId_regionType_idx" ON "Region"("countryId", "regionType");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryId_slug_key" ON "Region"("countryId", "slug");

-- CreateIndex
CREATE INDEX "Category_countryId_domain_idx" ON "Category"("countryId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "Category_countryId_slug_key" ON "Category"("countryId", "slug");

-- CreateIndex
CREATE INDEX "Listing_countryId_status_publishedAt_idx" ON "Listing"("countryId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Listing_countryId_categoryId_regionId_publishedAt_idx" ON "Listing"("countryId", "categoryId", "regionId", "publishedAt");

-- CreateIndex
CREATE INDEX "Listing_countryId_featured_publishedAt_idx" ON "Listing"("countryId", "featured", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_sourceType_sourceId_key" ON "Listing"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_countryId_slug_key" ON "Listing"("countryId", "slug");

-- CreateIndex
CREATE INDEX "ListingMedia_mediaId_sortOrder_idx" ON "ListingMedia"("mediaId", "sortOrder");

-- CreateIndex
CREATE INDEX "Article_countryId_articleType_publishedAt_idx" ON "Article"("countryId", "articleType", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Article_countryId_slug_key" ON "Article"("countryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CrawlPage_sourceUrl_key" ON "CrawlPage"("sourceUrl");

-- CreateIndex
CREATE INDEX "CrawlPage_countryId_pageType_idx" ON "CrawlPage"("countryId", "pageType");

-- CreateIndex
CREATE INDEX "CrawlPage_countryId_sourceId_idx" ON "CrawlPage"("countryId", "sourceId");

-- CreateIndex
CREATE INDEX "ImportJobError_importJobId_errorCode_idx" ON "ImportJobError"("importJobId", "errorCode");

-- CreateIndex
CREATE INDEX "LegacyMapping_entityType_newId_idx" ON "LegacyMapping"("entityType", "newId");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyMapping_sourceSystem_entityType_legacyId_key" ON "LegacyMapping"("sourceSystem", "entityType", "legacyId");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingMedia" ADD CONSTRAINT "ListingMedia_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingMedia" ADD CONSTRAINT "ListingMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJobError" ADD CONSTRAINT "ImportJobError_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
