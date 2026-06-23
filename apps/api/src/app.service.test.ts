import { strict as assert } from "node:assert";
import { after, before, describe, it } from "node:test";
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { AppService } from "./app.service";
import { PrismaService } from "./prisma/prisma.service";

config({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;

describe("AppService", () => {
  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("returns healthy status when database is reachable", async () => {
    const service = new AppService(prismaService);
    const health = await service.health();
    assert.equal(health.status, "ok");
    assert.equal(health.database, "ok");
  });

  it("returns home aggregation data", async () => {
    const service = new AppService(prismaService);
    const home = await service.getHome();
    assert.equal(home.hero.title, "来葡萄牙后先解决什么问题");
    assert.equal(home.problems.length, 4);
    assert.ok(home.solutions.length >= 1);
    assert.equal(home.services.length, 3);
    assert.ok(home.updates.length >= 1);
  });

  it("returns listings, detail and search results", async () => {
    const service = new AppService(prismaService);
    const listings = await service.listListings({ category: "rent", limit: 10 });
    assert.ok(listings.items.length >= 1);
    assert.equal(listings.items[0].categorySlug, "rent");

    const detail = await service.getListing("rent-checklist-lisbon");
    assert.ok(detail);
    assert.equal(detail?.item.title, "租房检查清单：看房前先问什么，签约前看什么");
    assert.ok(detail?.related.length && detail.related.length >= 1);

    const search = await service.searchListings({ query: "客服" });
    assert.ok(search.total >= 1);
    assert.ok(search.items.some((item) => item.slug === "lisbon-chinese-customer-service"));
  });
});
