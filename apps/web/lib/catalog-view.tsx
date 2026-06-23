import Link from "next/link";
import type { ListingRecord } from "./catalog";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function ListingCard({
  item,
  compact = false,
}: {
  item: ListingRecord;
  compact?: boolean;
}) {
  return (
    <article className={`listing-card ${compact ? "compact" : ""}`}>
      <div className={`listing-media media-${item.categorySlug}`} aria-hidden="true">
        <span>{item.categoryLabel}</span>
      </div>
      <div className="listing-body">
        <div className="meta-row">
          <span className="tag">{item.city}</span>
          {item.priceLabel ? <span className="tag neutral">{item.priceLabel}</span> : null}
        </div>
        <h3>
          <Link href={`/pt/listings/${item.slug}`}>{item.title}</Link>
        </h3>
        <p>{item.summary}</p>
        <div className="listing-footer">
          <span>{formatDate(item.publishedAt)}</span>
          <span>{item.sourceLabel}</span>
        </div>
      </div>
    </article>
  );
}

