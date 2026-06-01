// controls.jsx — hero card, mode switch, brand pills, chart toolbar

const { useState: useState_c, useMemo: useMemo_c } = React;

// Curated display-name + tagline overrides for hero card top pick
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
  // When a device is pinned on the chart, the hero reflects that device instead
  // of the current top pick.
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

  // Close the device drawer when clicking anywhere outside this pill.
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
  const isActive = activeCount > 0;

  // Brand badge: determined by the highest-scoring device in this brand.
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
          <a href="#" onClick={(e) => e.preventDefault()}>Watch latest review →</a>
          <button className="topbar-cta" onClick={() => alert("Become a Member — placeholder")}>BECOME A MEMBER</button>
        </div>
      </div>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="brand">
        <div className="brand-name">WEARABLE INDEX</div>
      </div>
      <nav className="nav">
        <a className="active" href="#">Research</a>
        <a href="Shop the Index.html">Shop the Index</a>
        <a href="YouTube.html">YouTube</a>
      </nav>
      <div className="header-side">
        <button className="hdr-ic" aria-label="Account">◌</button>
      </div>
    </header>
  );
}

function AdSlot({ size, label }) {
  return (
    <div className="ad" style={{ "--ad-w": size[0] + "px", "--ad-h": size[1] + "px" }}>
      <span>{size[0]}×{size[1]} · {label}</span>
    </div>
  );
}

Object.assign(window, { HeroCard, ModePanel, IndexGuide, ChartToolbar, BrandPill, TopBar, SiteHeader, AdSlot });
