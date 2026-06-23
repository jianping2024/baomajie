import Link from "next/link";
import { apiGet } from "@/lib/api";
import { categories, filterListings } from "@/lib/catalog";
import { ListingCard } from "@/lib/catalog-view";

export const dynamic = "force-dynamic";

type ListingsResponse = ReturnType<typeof filterListings>;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildQuery(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const stringified = query.toString();
  return stringified ? `${path}?${stringified}` : path;
}

async function getListings(searchParams: SearchParams): Promise<ListingsResponse> {
  const category = first(searchParams.category);
  const region = first(searchParams.region);
  const q = first(searchParams.q) || first(searchParams.query);
  const page = first(searchParams.page) || "1";
  const limit = first(searchParams.limit) || "12";

  const data = await apiGet<ListingsResponse>(
    buildQuery("/v1/listings", { category, region, query: q, page, limit }),
  );

  if (data) return data;

  return filterListings({
    category,
    region,
    query: q,
    page: Number(page) || 1,
    limit: Number(limit) || 12,
  });
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getListings(params);

  const activeCategory = first(params.category);

  return (
    <main className="content-shell">
      <header className="inner-hero">
        <div>
          <div className="section-kicker">公开列表</div>
          <h1>把葡萄牙生活问题拆成可操作的入口</h1>
          <p>
            这里承接找房、找工作、找服务、办事指南和二手闲置。先把问题分清，再引导到合适的人和内容。
          </p>
        </div>
        <form className="inline-search" action="/pt/search" method="get">
          <input name="q" type="search" placeholder="搜索税号、租房、装修、中文客服" defaultValue={first(params.q) || ""} />
          <button type="submit">搜索</button>
        </form>
      </header>

      <section className="filter-row" aria-label="分类筛选">
        <Link className={`filter-pill ${!activeCategory ? "active" : ""}`} href="/pt/listings">
          全部
        </Link>
        {categories.map((item) => (
          <Link
            key={item.slug}
            className={`filter-pill ${activeCategory === item.slug ? "active" : ""}`}
            href={`/pt/listings?category=${item.slug}`}
          >
            {item.label}
          </Link>
        ))}
      </section>

      <section className="list-layout">
        <div className="list-column">
          <div className="list-head">
            <h2>{data.total} 条结果</h2>
            <div className="list-meta">
              <span>{data.query ? `关键词：${data.query}` : "默认按最新和推荐排序"}</span>
              {data.category ? <span>分类：{data.category}</span> : null}
              {data.region ? <span>地区：{data.region}</span> : null}
            </div>
          </div>

          <div className="listing-grid">
            {data.items.map((item) => (
              <ListingCard key={item.slug} item={item} />
            ))}
          </div>

          <div className="pager">
            <span>
              第 {data.page} / {data.totalPages} 页
            </span>
            <div className="pager-actions">
              {data.page > 1 ? (
                <Link
                  href={buildQuery("/pt/listings", {
                    category: data.category || undefined,
                    region: data.region || undefined,
                    q: data.query || undefined,
                    page: String(data.page - 1),
                  })}
                >
                  上一页
                </Link>
              ) : null}
              {data.hasNextPage ? (
                <Link
                  href={buildQuery("/pt/listings", {
                    category: data.category || undefined,
                    region: data.region || undefined,
                    q: data.query || undefined,
                    page: String(data.page + 1),
                  })}
                >
                  下一页
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="list-sidebar">
          <div className="sidebar-panel">
            <div className="section-kicker">筛选建议</div>
            <h3>先按问题类型筛</h3>
            <p>找房、找工作、找服务和办事指南是首页最重要的四类流量入口。</p>
          </div>
          <div className="sidebar-panel">
            <div className="section-kicker">快捷入口</div>
            <div className="sidebar-links">
              <Link href="/pt/listings?category=rent">找房</Link>
              <Link href="/pt/listings?category=jobs">找工作</Link>
              <Link href="/pt/listings?category=services">找服务</Link>
              <Link href="/pt/search?q=%E7%A8%8E%E5%8F%B7">办事搜索</Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

