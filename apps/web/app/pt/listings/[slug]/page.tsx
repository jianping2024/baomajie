import Link from "next/link";
import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import { findListingBySlug, listings } from "@/lib/catalog";
import { ListingCard, formatDate } from "@/lib/catalog-view";

export const dynamic = "force-dynamic";

type ListingDetailResponse =
  | {
      item: (typeof listings)[number];
      related: (typeof listings)[number][];
    }
  | null;

async function getListing(slug: string): Promise<NonNullable<ListingDetailResponse>> {
  const data = await apiGet<ListingDetailResponse>(`/v1/listings/${slug}`);
  if (data) return data;

  const found = findListingBySlug(slug);
  if (!found) {
    notFound();
  }

  return {
    item: found,
    related: found.relatedSlugs
      .map((relatedSlug) => findListingBySlug(relatedSlug))
      .filter((candidate): candidate is (typeof listings)[number] => Boolean(candidate)),
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getListing(slug);

  return (
    <main className="content-shell detail-page">
      <nav className="crumbs" aria-label="面包屑">
        <Link href="/">首页</Link>
        <span>/</span>
        <Link href="/pt/listings">列表</Link>
        <span>/</span>
        <span>{data.item.title}</span>
      </nav>

      <section className="detail-hero">
        <div className={`detail-visual media-${data.item.categorySlug}`}>
          <span>{data.item.categoryLabel}</span>
          <strong>{data.item.city}</strong>
        </div>
        <div className="detail-copy">
          <div className="meta-row">
            <span className="tag">{data.item.city}</span>
            <span className="tag neutral">{data.item.categoryLabel}</span>
            {data.item.priceLabel ? <span className="tag">{data.item.priceLabel}</span> : null}
          </div>
          <h1>{data.item.title}</h1>
          <p className="detail-summary">{data.item.summary}</p>
          <div className="detail-meta">
            <span>发布时间：{formatDate(data.item.publishedAt)}</span>
            <span>更新：{formatDate(data.item.updatedAt)}</span>
            <span>{data.item.sourceLabel}</span>
          </div>
          <div className="detail-actions">
            <a href={data.item.sourceUrl} target="_blank" rel="noreferrer">
              查看原始来源
            </a>
            <Link href="/pt/search?q=%E5%91%A8%E6%8A%A5">继续搜索</Link>
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <div className="section-kicker">内容说明</div>
          <h2>为什么这条内容值得收录</h2>
          <p>{data.item.description}</p>
          <div className="tag-list">
            {data.item.tags.map((tag) => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
          </div>
        </article>

        <aside className="detail-panel contact-panel">
          <div className="section-kicker">公开联系方式</div>
          <h2>用户直接联系入口</h2>
          <ul className="contact-list">
            {data.item.contact.phone ? <li>电话：{data.item.contact.phone}</li> : null}
            {data.item.contact.whatsapp ? <li>WhatsApp：{data.item.contact.whatsapp}</li> : null}
            {data.item.contact.wechat ? <li>微信：{data.item.contact.wechat}</li> : null}
            {data.item.contact.email ? <li>邮箱：{data.item.contact.email}</li> : null}
          </ul>
          <p className="supporting-text">第一版先展示旧站公开联系方式，不做支付和站内撮合。</p>
        </aside>
      </section>

      <section className="detail-panel">
        <div className="section-kicker">相关内容</div>
        <h2>顺手还能看这些</h2>
        <div className="related-grid">
          {data.related.map((item) => (
            <ListingCard key={item.slug} item={item} compact />
          ))}
        </div>
      </section>
    </main>
  );
}
