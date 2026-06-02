// controls.jsx — hero card, mode switch, brand pills, chart toolbar, navigation

const { useState: useState_c, useMemo: useMemo_c } = React;

const HERO_LABELS = {
  hr: {
    Apple_chest: { name: "Apple Watch Chest Strap", sub: "The gold standard for consumer heart rate tracking accuracy." },
    GarminHRM_Pro_Plus: { name: "Garmin HRM-Pro Plus", sub: "Lab-grade chest strap accuracy with native multi-sport integration." },
    Polar_H10: { name: "Polar H10", sub: "Reference-quality ECG chest strap trusted by sports scientists." },
  },
  sleep: {
    AppleWatchUltra3: { name: "Apple Watch Ultra 3", sub: "Best-in-class sleep-stage agreement vs polysomnography." },
    EightSleepPod5: { name: "Eight Sleep Pod 5", sub: "Top-ranked under-mattress sensor for sleep-stage accuracy." },
  },
};

function HeroCard({ topRow, mode, totalVisible, totalAll, selectedRow, selectedBeats }) {
  if (!topRow) {
    return (
      <div className="hero hero-empty">
        <div className="hero-eyebrow">NO DEVICES SELECTED</div>
        <div className="hero-title">Activate brands to populate the index.</div>
        <div className="hero-sub">Pick a brand pill below or hit <code>ACTIVATE ALL</code>.</div>
      </div>
    );
  }
  const isSelected = !!selectedRow;
  const row = selectedRow || topRow;
  const v = mode === "hr" ? row.r : row.score;
  const valDisp = mode === "hr" ? v.toFixed(3) : v.toFixed(1);
  const valLbl = mode === "hr" ? "R SCORE" : "SLEEP SCORE";
  const override = (HERO_LABELS[mode] || {})[row.name];
  const displayName = override?.name || window.prettyName(row.name);
  const eyebrow = isSelected ? "SELECTED DEVICE" : "CURRENT TOP PICK";
  const displaySub = isSelected
    ? `${row.brand} · selected from the chart — click anywhere to return to the top pick.`
    : override?.sub
      || (mode === "hr"
        ? `Top correlation to ECG reference among ${totalVisible} selected device${totalVisible === 1 ? "" : "s"}.`
        : `Highest sleep-stage agreement among ${totalVisible} selected device${totalVisible === 1 ? "" : "s"}.`);
  const beatPct = isSelected && totalVisible > 0
    ? Math.round((selectedBeats / totalVisible) * 100)
    : 100;
  return (
    <div className="hero">
      <div className="hero-left">
        <div className="hero-eyebrow">{eyebrow}</div>
        <h1 className="hero-title">{displayName}</h1>
        <div className="hero-sub">{displaySub}</div>
      </div>
      <div className="hero-right">
        <div className="hero-stat">
          <div className="hero-val">{valDisp}</div>
          <div className="hero-cap">{valLbl}</div>
        </div>
        <div className="hero-divider" aria-hidden="true" />
        <div className="hero-stat">
          <div className="hero-val hero-val-small">{beatPct}%</div>
          <div className="hero-cap">{isSelected ? `BEATS ${selectedBeats} OF ${totalVisible}` : "BEATS SELECTED"}</div>
        </div>
      </div>
    </div>
  );
}

function ModePanel({ mode, setMode, hrSubMode, setHrSubMode }) {
  const HR_SUBS = ["Running", "Spinning", "Cycling", "Weightlifting"];
  return (
    <div className="panel">
      <div className="panel-title">INSTRUMENT MODE</div>
      <div className="mode-list">
        <button
          className={`mode-btn ${mode === "hr" ? "active" : ""}`}
          onClick={() => { setMode("hr"); setHrSubMode(null); }}
        >
          <span className="mode-icon">♥</span>
          <span className="mode-label">Heart Rate</span>
        </button>
        {mode === "hr" && (
          <div className="hr-subpills">
            {HR_SUBS.map((s) => (
              <button
                key={s}
                className={`hr-pill ${hrSubMode === s ? "active" : ""}`}
                onClick={() => setHrSubMode(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <button
          className={`mode-btn ${mode === "sleep" ? "active" : ""}`}
          onClick={() => setMode("sleep")}
        >
          <span className="mode-icon">☾</span>
          <span className="mode-label">Sleep</span>
        </button>
        <button
          className={`mode-btn ${mode === "steps" ? "active" : ""}`}
          onClick={() => setMode("steps")}
        >
          <span className="mode-icon">↗</span>
          <span className="mode-label">Steps</span>
        </button>
      </div>
    </div>
  );
}

function IndexGuide() {
  const items = [
    ["01", "Choose Metric", "Select heart rate, sleep, or battery performance metrics."],
    ["02", "Select Hardware", "Filter by brands like Apple, Garmin, or Whoop."],
    ["03", "Compare R-Score", "Higher correlation (closer to 1.0) means higher accuracy."],
    ["04", "View Reviews", "Click data points to link to specific video review deep-dives."],
  ];
  return (
    <div className="panel">
      <div className="panel-title">INDEX GUIDE</div>
      <ol className="guide">
        {items.map(([n, t, b]) => (
          <li key={n}>
            <span className="g-num">{n}</span>
            <div>
              <div className="g-title">{t}</div>
              <div className="g-body">{b}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ChartToolbar({ onActivateAll, onDeactivateAll, onTop10, isTop10 }) {
  return (
    <div className="toolbar">
      <div className="toolbar-actions">
        <button className="tb-text" onClick={onActivateAll}>ACTIVATE ALL</button>
        <button className="tb-text" onClick={onDeactivateAll}>DEACTIVATE ALL</button>
        <button className={`tb-btn ${isTop10 ? "is-on" : ""}`} onClick={onTop10}>TOP 10 ACCURACY</button>
      </div>
    </div>
  );
}

function BrandPill({ brand, devices, activeSet, onToggleBrand, onToggleDevice, mode }) {
  const [open, setOpen] = useState_c(false);
  const rootRef = React.useRef(null);
  const color = window.BRAND_COLORS[brand] || "#333";

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeCount = devices.filter((d) => activeSet.has(d.name)).length;
  const total = devices.length;
  const allOn = activeCount === total;
  const someOn = activeCount > 0 && !allOn;

  const vs = devices.map((d) => (mode === "hr" ? d.r : d.score));
  const best = vs.length ? Math.max(...vs) : 0;
  const badge = window.badgeFor(mode, best);

  return (
    <div ref={rootRef} className={`pill ${allOn ? "on" : someOn ? "partial" : "off"}`}>
      <button className="pill-main" onClick={() => onToggleBrand(brand)}>
        <span className="pill-swatch" style={{ background: color }} />
        <span className="pill-name">{brand.toUpperCase()}</span>
        <span className={`bdg bdg-${badge.tone}`}>{badge.label}</span>
        <span className="pill-count">{activeCount}/{total}</span>
      </button>
      <button
        className={`pill-chev ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Expand devices"
      >
        ⌄
      </button>
      {open && (
        <div className="pill-drawer">
          {devices
            .slice()
            .sort((a, b) => (mode === "hr" ? b.r - a.r : b.score - a.score))
            .map((d) => {
              const on = activeSet.has(d.name);
              const v = mode === "hr" ? d.r : d.score;
              const b = window.badgeFor(mode, v);
              return (
                <label key={d.name} className={`row ${on ? "on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggleDevice(d.name)}
                  />
                  <span className="row-name">{window.prettyName(d.name)}</span>
                  <span className={`bdg bdg-${b.tone} bdg-xs`}>{b.label}</span>
                  <span className="row-val">{mode === "hr" ? v.toFixed(3) : v.toFixed(1)}</span>
                </label>
              );
            })}
        </div>
      )}
    </div>
  );
}

function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <span className="topbar-meta">
          <span className="yt-badge" aria-hidden="true">
            <svg viewBox="0 0 28 20" width="20" height="15">
              <rect width="28" height="20" rx="5" fill="#FF0000" />
              <path d="M11 6 L20 10 L11 14 Z" fill="#fff" />
            </svg>
          </span>
          Featured on <b>The Quantified Scientist</b> — scientific wearable reviews from Vienna
        </span>
        <div className="topbar-actions">
          <a href="https://www.youtube.com/watch?v=oMVJP5WLxC4&t=566s" target="_blank" rel="noopener">Watch latest review →</a>
          <a className="topbar-cta" href="https://www.youtube.com/channel/UChNWxrTlmh4IRSevon1X93g/join" target="_blank" rel="noopener" style={{textDecoration:"none",color:"#fff"}}>BECOME A MEMBER</a>
        </div>
      </div>
    </div>
  );
}

function SiteHeader({ page, setPage }) {
  return (
    <header className="site-header">
      <div className="brand">
        <div className="brand-name">WEARABLE INDEX</div>
      </div>
      <nav className="nav">
        <a className={page === "research" ? "active" : ""} href="#" onClick={(e) => { e.preventDefault(); setPage("research"); }}>Research</a>
        <a className={page === "shop" ? "active" : ""} href="#" onClick={(e) => { e.preventDefault(); setPage("shop"); }}>Shop the Index</a>
        <a className={page === "youtube" ? "active" : ""} href="#" onClick={(e) => { e.preventDefault(); setPage("youtube"); }}>YouTube</a>
      </nav>
      <div className="header-side">
        <button className="hdr-ic" aria-label="Account">◌</button>
      </div>
    </header>
  );
}

function SiteFooter({ setPage }) {
  return (
    <footer className="foot">
      <div>
        © 2025 WEARABLE INDEX
        {" · "}
        <a href="#" onClick={(e) => { e.preventDefault(); setPage("privacy"); }}>Privacy Policy</a>
        {" · "}
        <a href="#" onClick={(e) => { e.preventDefault(); setPage("about"); }}>About</a>
        {" · "}
        <a href="#" onClick={(e) => { e.preventDefault(); setPage("contact"); }}>Contact</a>
      </div>
      <div className="foot-meta">
        <span><b>68</b> DATA POINTS</span>
        <span>·</span>
        <span><b>12</b> BRANDS</span>
        <span>·</span>
        <span>REVISED: MAY 29</span>
      </div>
    </footer>
  );
}

function PrivacyPage() {
  return (
    <main className="doc-page">
      <div className="doc-eyebrow">LEGAL</div>
      <h1 className="doc-title">Privacy Policy</h1>
      <p className="doc-updated">LAST UPDATED · MAY 2025</p>
      <div className="doc-rule"></div>
      <p className="lead">This site uses Google AdSense to display advertisements. AdSense uses cookies to serve ads based on your prior visits to this website or other websites. You may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google's Ads Settings</a>.</p>
      <p>This site contains affiliate links. If you click and make a purchase we may earn a small commission at no extra cost to you.</p>
      <p>This site does not collect, store or share any personal data from visitors.</p>
      <p>Third party links on this site are provided for convenience. We are not responsible for the content or privacy practices of those sites.</p>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="doc-page">
      <div className="doc-eyebrow">ABOUT</div>
      <h1 className="doc-title">About Wearable Index</h1>
      <div className="doc-rule"></div>
      <p className="lead">Wearable Index is an independent data visualization tool built to make scientific wearable accuracy data more accessible and interactive.</p>
      <p>All data is sourced from public research published by The Quantified Scientist on YouTube. This site is not affiliated with or endorsed by The Quantified Scientist.</p>
      <p>Built by an independent developer. For data corrections or partnership inquiries contact us at <a href="mailto:contact@wearableindex.io">contact@wearableindex.io</a></p>
    </main>
  );
}

function ContactPage() {
  return (
    <main className="doc-page">
      <div className="doc-eyebrow">CONTACT</div>
      <h1 className="doc-title">Contact</h1>
      <div className="doc-rule"></div>
      <p className="lead">For inquiries, data corrections or partnership requests reach out at:</p>
      <a className="doc-mail" href="mailto:contact@wearableindex.io">contact@wearableindex.io</a>
    </main>
  );
}

function ShopPage() {
  const GENI = "https://geni.us/thequantifiedscientist";
  const SHOP = [
    {
      section: "Heart Rate",
      items: [
        { name: "Polar H10 Chest Strap", desc: "The gold standard for HR accuracy.", url: GENI },
        { name: "Wahoo TICKR Heart Rate Monitor", desc: "Reliable optical-free chest strap for training zones.", url: GENI },
      ],
    },
    {
      section: "Sleep",
      items: [
        { name: "Eight Sleep Pod 5", desc: "Best in class sleep tracking.", url: "https://eight-sleep.ioym.net/TheQuantifiedScientist", code: "TQS" },
        { name: "Oura Ring 4", desc: "Finger-worn ring with strong sleep-stage agreement.", url: "https://ouraring.sjv.io/Oura4" },
        { name: "Whoop 5.0", desc: "Screen-free strap focused on recovery and sleep.", url: "https://join.whoop.com/QuantifiedScientist" },
      ],
    },
    {
      section: "Running & GPS",
      items: [
        { name: "Garmin Forerunner Series", desc: "Multisport GPS watches with full training metrics.", url: GENI },
      ],
    },
    {
      section: "Apps & Software",
      items: [
        { name: "Runna", desc: "Best running app — personalized training plans.", url: "https://web.runna.com/redeem?code=QUANT", code: "QUANT" },
        { name: "Strava Premium", desc: "20% off — segments, analysis and route planning.", url: "https://www.strava.com/subscribe/checkout?code=QUANTIFIEDSCIENTIST", code: "20% OFF" },
      ],
    },
    {
      section: "General",
      items: [
        { name: "Anything on Amazon", desc: "Start any Amazon purchase here to support the site.", url: GENI },
      ],
    },
  ];

  const hostOf = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  };

  return (
    <main className="shop-main">
      <div className="shop-head">
        <div className="shop-eyebrow">AFFILIATE PICKS</div>
        <h1 className="shop-title">Shop the Index</h1>
        <p className="shop-sub">
          If you find this useful, consider using these links when buying — it
          <b> supports the site at no extra cost to you.</b>
        </p>
      </div>
      {SHOP.map((sec) => (
        <section key={sec.section} className="shop-section">
          <div className="shop-section-head">
            <span className="shop-section-title">{sec.section.toUpperCase()}</span>
            <span className="shop-section-rule"></span>
            <span className="shop-section-count">{sec.items.length} ITEM{sec.items.length === 1 ? "" : "S"}</span>
          </div>
          <div className="shop-grid">
            {sec.items.map((it) => (
              <div key={it.name} className="shop-card">
                <div className="shop-card-top">
                  <div className="shop-card-name">{it.name}</div>
                  {it.code && <span className="shop-card-code">CODE {it.code}</span>}
                </div>
                <div className="shop-card-desc">{it.desc}</div>
                <div className="shop-card-foot">
                  <span className="shop-card-host">{hostOf(it.url)}</span>
                  <a className="shop-buy" href={it.url} target="_blank" rel="noopener sponsored">Buy now →</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="shop-disclaimer">
        Disclosure: the links above are affiliate links. If you buy through them, the site may earn a
        small commission — your price stays exactly the same. We only list hardware and software that
        appears in the accuracy index.
      </div>
    </main>
  );
}

function YouTubePage() {
  return (
    <main className="yt-page">
      <div className="yt-frame">
        <span className="yt-mark" aria-hidden="true">
          <svg viewBox="0 0 28 20" width="64" height="46">
            <rect width="28" height="20" rx="6" fill="#FF0000" />
            <path d="M11 6 L20 10 L11 14 Z" fill="#fff" />
          </svg>
        </span>
        <div className="yt-eyebrow">CHANNEL</div>
        <h1 className="yt-title">The Quantified Scientist</h1>
        <p className="yt-line">Scientific wearable reviews from Vienna</p>
        <a className="yt-watch" href="https://www.youtube.com/watch?v=oMVJP5WLxC4&t=566s" target="_blank" rel="noopener">Watch on YouTube →</a>
      </div>
    </main>
  );
}

function AdSlot({ size, label }) {
  return (
    <div className="ad" style={{ "--ad-w": size[0] + "px", "--ad-h": size[1] + "px" }}>
      <span>{size[0]}×{size[1]} · {label}</span>
    </div>
  );
}

Object.assign(window, { HeroCard, ModePanel, IndexGuide, ChartToolbar, BrandPill, TopBar, SiteHeader, SiteFooter, ShopPage, YouTubePage, PrivacyPage, AboutPage, ContactPage, AdSlot });
