import Link from "next/link";
export const dynamic = "force-dynamic";

type HomeData = {
  hero: {
    eyebrow: string;
    title: string;
    cities: string[];
  };
  problems: Array<{
    label: string;
    href: string;
    tone: string;
  }>;
  solutions: Array<{
    tag: string;
    meta: string;
    title: string;
    href: string;
  }>;
  services: Array<{
    tag: string;
    title: string;
    href: string;
  }>;
  updates: Array<{
    tag: string;
    title: string;
    meta: string;
    href: string;
  }>;
  cta: {
    title: string;
  };
};

const fallbackHomeData: HomeData = {
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
  solutions: [
    {
      tag: "办事",
      meta: "里斯本 · 来源：guides/4812",
      title: "葡萄牙居留、税号和银行账户的办理顺序",
      href: "/pt/listings/tax-number-bank-account-order",
    },
    {
      tag: "工具",
      meta: "波尔图 · 来源：tools/4551",
      title: "租房检查清单：看房前先问什么，签约前看什么",
      href: "/pt/listings/rent-checklist-lisbon",
    },
  ],
  services: [
    { tag: "服务入口", title: "翻译、装修、会计、接送、清洁", href: "/pt/listings?category=services" },
    { tag: "广告位", title: "合作商家、置顶推荐、城市曝光", href: "/pt/listings?featured=1" },
    { tag: "订阅", title: "每周更新、专题提醒、本地摘要", href: "/pt/search?q=%E5%91%A8%E6%8A%A5" },
  ],
  updates: [
    {
      tag: "工作",
      title: "招聘中文客服，远程/里斯本均可",
      meta: "里斯本 · 来源：jobs/4930",
      href: "/pt/listings/lisbon-chinese-customer-service",
    },
    {
      tag: "找房",
      title: "Alameda 附近一居室，步行到地铁",
      meta: "里斯本 · €1,200/月",
      href: "/pt/listings/alameda-one-bedroom",
    },
    {
      tag: "服务",
      title: "装修翻新、清洁保洁、移民陪办",
      meta: "里斯本 / 波尔图 · 可微信沟通",
      href: "/pt/listings/translator-accountant-cleaning",
    },
    {
      tag: "二手",
      title: "带票二手电器、餐桌、婴儿用品",
      meta: "来源：used/4500",
      href: "/pt/listings/used-electronics-dining-table",
    },
  ],
  cta: {
    title: "订阅更新，或提交合作",
  },
};

async function getHomeData(): Promise<HomeData> {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:4000";
  try {
    const response = await fetch(`${baseUrl}/v1/home`, {
      cache: "no-store",
    });
    if (!response.ok) return fallbackHomeData;
    return (await response.json()) as HomeData;
  } catch {
    return fallbackHomeData;
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">宝马街</span>
          <span className="brand-sub">Portugal</span>
        </div>
        <nav className="desktop-nav" aria-label="主导航">
          <a href="#problems">问题入口</a>
          <a href="#solutions">解决方案</a>
          <a href="#services">服务与广告</a>
          <a href="#updates">最新内容</a>
        </nav>
        <button className="primary-btn">订阅更新</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">{data.hero.eyebrow}</div>
          <h1>{data.hero.title}</h1>
          <form className="hero-search" action="/pt/search" method="get">
            <input name="q" type="search" placeholder="搜索税号、租房、开户、工作、服务" />
            <button type="submit">搜索</button>
          </form>
          <div className="city-chips" aria-label="热门城市">
            {data.hero.cities.map((city) => (
              <a key={city} href="#updates">
                {city}
              </a>
            ))}
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-sky" />
          <div className="hero-city city-a" />
          <div className="hero-city city-b" />
          <div className="hero-city city-c" />
          <div className="hero-badge">
            <strong>Lisboa / Porto / Faro</strong>
            <span>问题、清单、服务、更新</span>
          </div>
        </div>
      </section>

      <section className="section" id="problems">
        <div className="section-head">
          <div>
            <div className="section-kicker">问题入口</div>
            <h2>先解决这些问题</h2>
          </div>
        </div>
        <div className="problem-grid">
            {data.problems.map((item) => (
              <article key={item.label} className={`problem-card ${item.tone}`}>
                <span>入口</span>
                <strong>{item.label}</strong>
                <Link href={item.href}>进入</Link>
              </article>
            ))}
        </div>
      </section>

      <section className="section split" id="solutions">
        <div>
          <div className="section-head">
            <div>
              <div className="section-kicker">解决方案</div>
              <h2>内容和工具</h2>
            </div>
          </div>
          <div className="solution-list">
            {data.solutions.map((item, index) => (
              <article key={`${item.tag}-${index}`} className="solution-card">
                <div className={`solution-swatch ${index === 0 ? "swatch-blue" : "swatch-gold"}`} />
                <div className="solution-body">
                  <div className="meta-row">
                    <span className={`tag ${index === 0 ? "" : "neutral"}`}>{item.tag}</span>
                    <span className="meta">{item.meta}</span>
                  </div>
                  <h3>
                    <Link href={item.href}>{item.title}</Link>
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="subscription-card">
          <div className="section-kicker">订阅入口</div>
          <h3>每周更新、政策提醒、找房变化</h3>
          <button className="ghost-btn">订阅周报</button>
        </aside>
      </section>

      <section className="section" id="services">
        <div className="section-head">
          <div>
            <div className="section-kicker">服务与广告</div>
            <h2>服务、广告、订阅</h2>
          </div>
        </div>
        <div className="service-grid">
          {data.services.map((item) => (
            <article key={item.tag} className="service-card">
              <span>{item.tag}</span>
              <h3>
                <Link href={item.href}>{item.title}</Link>
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="updates">
        <div className="section-head">
          <div>
            <div className="section-kicker">最新内容</div>
            <h2>正在被解决的问题</h2>
          </div>
        </div>
        <div className="feed-grid">
          {data.updates.map((item) => (
            <article key={item.title} className="feed-card">
              <div className={`feed-image image-${item.tag === "工作" ? "purple" : item.tag === "找房" ? "green" : item.tag === "服务" ? "orange" : "navy"}`} />
              <div className="feed-body">
                <div className="meta-row">
                  <span className="tag">{item.tag}</span>
                  <span className="meta">{item.meta}</span>
                </div>
                <h3>
                  <Link href={item.href}>{item.title}</Link>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta" id="contact">
        <div>
          <div className="section-kicker">订阅与合作</div>
          <h2>{data.cta.title}</h2>
        </div>
        <button className="primary-btn">订阅每周更新</button>
      </section>

      <nav className="mobile-nav" aria-label="底部导航">
        <a href="#">首页</a>
        <a href="#problems">问题</a>
        <a href="#contact" className="mobile-primary">订阅</a>
        <a href="#services">服务</a>
        <a href="#updates">内容</a>
      </nav>
    </main>
  );
}
