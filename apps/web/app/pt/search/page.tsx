import Link from "next/link";
import { apiGet } from "@/lib/api";
import { filterListings, searchListings } from "@/lib/catalog";
import { ListingCard } from "@/lib/catalog-view";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type SearchResponse = ReturnType<typeof filterListings>;

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

async function getResults(searchParams: SearchParams): Promise<SearchResponse> {
  const q = first(searchParams.q) || first(searchParams.query) || "";
  const category = first(searchParams.category);
  const region = first(searchParams.region);
  const data = await apiGet<SearchResponse>(
    buildQuery("/v1/search", { q, category, region, limit: "24" }),
  );

  if (data) return data;

  return searchListings(q);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = first(params.q) || first(params.query) || "";
  const data = await getResults(params);

  return (
    <main className="content-shell">
      <header className="inner-hero">
        <div>
          <div className="section-kicker">搜索结果</div>
          <h1>{q ? `“${q}” 的结果` : "搜索葡萄牙生活问题"}</h1>
          <p>搜索先覆盖办事、找房、找工作、找服务和二手。后续再扩展到文章和指南。</p>
        </div>
        <form className="inline-search" action="/pt/search" method="get">
          <input name="q" type="search" placeholder="搜索关键词" defaultValue={q} />
          <button type="submit">搜索</button>
        </form>
      </header>

      <div className="search-summary">
        <span>共 {data.total} 条结果</span>
        <Link href="/pt/listings">去列表页</Link>
      </div>

      <section className="listing-grid">
        {data.items.length ? (
          data.items.map((item) => <ListingCard key={item.slug} item={item} />)
        ) : (
          <article className="empty-state">
            <h2>没有找到匹配内容</h2>
            <p>可以尝试换一个更具体的词，或者先从找房、找工作、找服务和办事指南开始。</p>
            <div className="empty-actions">
              <Link href="/pt/listings?category=guide">办事指南</Link>
              <Link href="/pt/listings?category=rent">找房</Link>
              <Link href="/pt/listings?category=jobs">找工作</Link>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}

