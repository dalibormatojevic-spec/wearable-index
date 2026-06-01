// app.jsx — main Wearables Index app

const { useState, useEffect, useMemo, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#1a1a1a",
  "chartStyle": "scatter",
  "showAds": true,
  "badgeStyle": "outline",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = useState("research");

  // ── mode ─────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("hr");
  const [hrSubMode, setHrSubMode] = useState(null);
  const DATA = mode === "sleep" ? window.SLEEP_DATA : mode === "hr" ? window.HR_DATA : [];
  const valOf = (d) => (mode === "sleep" ? d.score : d.r);

  const chartMessage =
    mode === "steps"
      ? "Step Count data coming soon — check back after our next update"
      : mode === "hr" && hrSubMode && hrSubMode !== "Running"
        ? "Data coming soon — check back after our next update"
        : null;

  // ── per-mode active sets ─────────────────────────────────────────────────
  const top10Names = (rows, key) =>
    new Set([...rows].sort((a, b) => b[key] - a[key]).slice(0, 10).map((d) => d.name));
  const [activeByMode, setActiveByMode] = useState(() => ({
    hr: top10Names(window.HR_DATA, "r"),
    sleep: top10Names(window.SLEEP_DATA, "score"),
    steps: new Set(),
  }));
  const activeSet = activeByMode[mode] || new Set();
  const setActive = (next) =>
    setActiveByMode((prev) => ({ ...prev, [mode]: next instanceof Set ? next : new Set(next) }));

  // ── ui state ─────────────────────────────────────────────────────────────
  const [pinned, setPinned] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [search, setSearch] = useState("");
  const [isTop10, setIsTop10] = useState(true);

  useEffect(() => {
    if (!pinned) return;
    const onDocClick = (e) => {
      if (e.target.closest && e.target.closest(".pin-card, .dot")) return;
      setPinned(null);
    };
    const onKey = (e) => { if (e.key === "Escape") setPinned(null); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("n", String(activeSet.size));
    window.history.replaceState(null, "", "#" + params.toString());
  }, [mode, activeSet]);

  // ── derived ──────────────────────────────────────────────────────────────
  const byBrand = useMemo(() => {
    const map = new Map();
    DATA.forEach((d) => {
      if (!map.has(d.brand)) map.set(d.brand, []);
      map.get(d.brand).push(d);
    });
    return map;
  }, [DATA]);

  const brandOrder = useMemo(() => {
    const ordered = [...byBrand.entries()]
      .map(([b, devs]) => [b, Math.max(...devs.map(valOf))])
      .sort((a, b) => b[1] - a[1])
      .map(([b]) => b);
    return ordered.sort((a, b) => {
      const rank = (x) => (x === "Apple" ? -1 : x === "Other" ? 1 : 0);
      return rank(a) - rank(b);
    });
  }, [byBrand, mode]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DATA.filter((d) => activeSet.has(d.name))
      .filter((d) => !q || window.prettyName(d.name).toLowerCase().includes(q) || d.brand.toLowerCase().includes(q))
      .sort((a, b) => valOf(b) - valOf(a));
  }, [DATA, activeSet, search, mode]);

  const topRow = visibleRows[0] || null;

  const selectedRow = pinned && !chartMessage
    ? visibleRows.find((d) => d.name === pinned) || null
    : null;
  const selectedBeats = selectedRow
    ? visibleRows.filter((d) => valOf(d) < valOf(selectedRow)).length
    : 0;

  // ── actions ──────────────────────────────────────────────────────────────
  const activateAll = () => {
    setActive(new Set(DATA.map((d) => d.name)));
    setIsTop10(false);
  };
  const deactivateAll = () => {
    setActive(new Set());
    setIsTop10(false);
    setPinned(null);
  };
  const top10 = () => {
    if (isTop10) {
      activateAll();
      return;
    }
    const top = [...DATA].sort((a, b) => valOf(b) - valOf(a)).slice(0, 10);
    setActive(new Set(top.map((d) => d.name)));
    setIsTop10(true);
  };
  const toggleBrand = (brand) => {
    const devs = byBrand.get(brand) || [];
    const anyOn = devs.some((d) => activeSet.has(d.name));
    const next = new Set(activeSet);
    if (anyOn) devs.forEach((d) => next.delete(d.name));
    else devs.forEach((d) => next.add(d.name));
    setActive(next);
    setIsTop10(false);
  };
  const toggleDevice = (name) => {
    const next = new Set(activeSet);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setActive(next);
    setIsTop10(false);
  };
  const exportCsv = () => {
    const head = mode === "hr"
      ? ["rank", "device", "brand", "r_score", "badge"]
      : ["rank", "device", "brand", "score", "kappa", "sensitivity", "badge"];
    const lines = [head.join(",")];
    visibleRows.forEach((d, i) => {
      const v = valOf(d);
      const b = window.badgeFor(mode, v).label;
      if (mode === "hr") {
        lines.push([i + 1, window.prettyName(d.name), d.brand, v.toFixed(3), b].join(","));
      } else {
        lines.push([i + 1, window.prettyName(d.name), d.brand, v.toFixed(1), d.kappa, d.sensitivity, b].join(","));
      }
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wearables-index-${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPinned(null);
    setHovered(null);
    setSearch("");
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.density = t.density;
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.density, t.accent]);

  return (
    <div className="app">
      <TopBar />
      {t.showAds && (
        <div className="ad-wrap"><AdSlot size={[728, 90]} label="LEADERBOARD ADVERTISEMENT" /></div>
      )}
      <SiteHeader page={page} setPage={setPage} />

      {page === "research" && (
        <main className="main">
          <HeroCard
            topRow={chartMessage ? null : topRow}
            mode={mode}
            totalVisible={chartMessage ? 0 : visibleRows.length}
            totalAll={DATA.length}
            selectedRow={selectedRow}
            selectedBeats={selectedBeats}
          />
          <div className="content">
            <section className="chart-col">
              <div className="chart-head">
                <div>
                  <div className="ch-eyebrow">{mode === "hr" ? "HEART RATE ACCURACY" : mode === "sleep" ? "SLEEP-STAGE ACCURACY" : "STEP COUNT ACCURACY"}</div>
                  <div className="ch-sub">
                    {mode === "hr"
                      ? "Correlation (R) to ECG Reference Chest Strap during varied cycling & running."
                      : mode === "sleep"
                        ? "Composite agreement vs polysomnography — Cohen's κ × stage sensitivity, normalized 0–100."
                        : "Step-count agreement vs manual reference across walking & running protocols."}
                  </div>
                </div>
                <div className="ch-tools">
                  <button className="ch-ic" title="Reset zoom" onClick={() => { setPinned(null); setHovered(null); }}>❐</button>
                  <button className="ch-ic" title="Export CSV" onClick={exportCsv}>⬇</button>
                </div>
              </div>
              {chartMessage ? (
                <div className="chart chart-msg">
                  <div className="chart-msg-inner">
                    <span className="chart-msg-mark" aria-hidden="true">◷</span>
                    <p className="chart-msg-text">{chartMessage}</p>
                  </div>
                </div>
              ) : (
                <Chart
                  rows={visibleRows}
                  fullRows={DATA}
                  mode={mode}
                  pinned={pinned}
                  setPinned={setPinned}
                  hovered={hovered}
                  setHovered={setHovered}
                />
              )}
              <ChartToolbar
                onActivateAll={activateAll}
                onDeactivateAll={deactivateAll}
                onTop10={top10}
                isTop10={isTop10}
              />
              <div className="pills">
                {brandOrder.map((b) => (
                  <BrandPill
                    key={b}
                    brand={b}
                    devices={byBrand.get(b)}
                    activeSet={activeSet}
                    onToggleBrand={toggleBrand}
                    onToggleDevice={toggleDevice}
                    mode={mode}
                  />
                ))}
              </div>
            </section>
            <aside className="side">
              <ModePanel mode={mode} setMode={setMode} hrSubMode={hrSubMode} setHrSubMode={setHrSubMode} />
              <IndexGuide />
              {t.showAds && <AdSlot size={[300, 250]} label="ADVERTISEMENT" />}
            </aside>
          </div>
          <SiteFooter setPage={setPage} />
        </main>
      )}

      {page === "shop"    && <ShopPage    setPage={setPage} />}
      {page === "youtube" && <YouTubePage setPage={setPage} />}
      {page === "about"   && <AboutPage   setPage={setPage} />}
      {page === "contact" && <ContactPage setPage={setPage} />}
      {page === "privacy" && <PrivacyPage setPage={setPage} />}

      {t.showAds && <div className="ad-wrap ad-footer"><AdSlot size={[970, 90]} label="FOOTER BANNER ADVERTISEMENT" /></div>}

      <TweaksPanel>
        <TweakSection label="Display" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "regular"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakToggle
          label="Show ad placeholders"
          value={t.showAds}
          onChange={(v) => setTweak("showAds", v)}
        />
        <TweakSection label="Color" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={["#1a1a1a", "#1f4e8a", "#1f8a5b", "#b8860b"]}
          onChange={(v) => setTweak("accent", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
