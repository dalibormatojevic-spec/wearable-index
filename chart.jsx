// chart.jsx — scatter plot for wearable accuracy
// X-axis = score (R or sleep score). Y-axis = rank slot (top = best).
// Dots are HTML divs absolutely-positioned over an SVG axis layer
// so tooltips/pins compose naturally without foreignObject.

const { useEffect, useMemo, useRef, useState } = React;

function Chart({ rows, mode, fullRows, pinned, setPinned, hovered, setHovered }) {
  // rows: visible items (sorted high→low). fullRows: ALL items in current mode (for rank).
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 460 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      const r = wrapRef.current.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const valOf = (d) => (mode === "hr" ? d.r : d.score);

  // Axis domain based on visible rows only (zoom to data with a small pad).
  const { xMin, xMax, ticks } = useMemo(() => {
    // Sleep: fixed composite-score axis 30–80 (independent of selection).
    if (mode === "sleep") {
      return { xMin: 30, xMax: 80, ticks: [30, 40, 50, 60, 70, 80] };
    }
    if (!rows.length) {
      return mode === "hr"
        ? { xMin: 0.70, xMax: 1.00, ticks: [0.70, 0.80, 0.90, 1.00] }
        : { xMin: 30, xMax: 80, ticks: [30, 40, 50, 60, 70, 80] };
    }
    const vs = rows.map(valOf);
    let mn = Math.min(...vs);
    let mx = Math.max(...vs);
    if (mode === "hr") {
      // pad to nice 0.01 boundaries, but cap at 1.0
      mn = Math.max(0.50, Math.floor((mn - 0.01) * 100) / 100);
      mx = Math.min(1.00, Math.ceil((mx + 0.005) * 100) / 100);
      if (mx - mn < 0.04) mn = Math.max(0.50, mx - 0.04);
      const span = mx - mn;
      const step = span > 0.15 ? 0.05 : span > 0.06 ? 0.02 : 0.01;
      const ts = [];
      for (let v = Math.ceil(mn / step) * step; v <= mx + 1e-9; v += step) {
        ts.push(Math.round(v * 1000) / 1000);
      }
      if (ts[0] > mn + 1e-9) ts.unshift(Math.round(mn * 1000) / 1000);
      if (ts[ts.length - 1] < mx - 1e-9) ts.push(Math.round(mx * 1000) / 1000);
      return { xMin: mn, xMax: mx, ticks: ts };
    }
    mn = Math.floor(mn / 5) * 5;
    mx = Math.ceil(mx / 5) * 5;
    if (mx - mn < 10) mn = mx - 10;
    const step = (mx - mn) > 40 ? 10 : 5;
    const ts = [];
    for (let v = mn; v <= mx; v += step) ts.push(v);
    return { xMin: mn, xMax: mx, ticks: ts };
  }, [rows, mode]);

  // Layout
  const padL = 56, padR = 24, padT = 28, padB = 44;
  const innerW = Math.max(50, size.w - padL - padR);
  const innerH = Math.max(50, size.h - padT - padB);

  // Rank index within fullRows (so rank survives filtering)
  const fullRankByName = useMemo(() => {
    const sorted = [...fullRows].sort((a, b) => valOf(b) - valOf(a));
    const map = new Map();
    sorted.forEach((d, i) => map.set(d.name, i + 1));
    return map;
  }, [fullRows, mode]);

  // Y position = rank within the visible set (best at top, worst at bottom).
  // Dots only, no connecting line.
  const visRankByName = useMemo(() => {
    const sorted = [...rows].sort((a, b) => valOf(b) - valOf(a));
    const map = new Map();
    sorted.forEach((d, i) => map.set(d.name, i));
    return map;
  }, [rows, mode]);

  const xScale = (v) => padL + ((v - xMin) / (xMax - xMin || 1)) * innerW;
  const yScale = (name) => {
    const n = Math.max(1, rows.length);
    const idx = visRankByName.get(name) ?? 0; // 0 = best
    const inset = 26;
    const usable = Math.max(20, innerH - inset * 2);
    const t = n > 1 ? idx / (n - 1) : 0.5; // 0 (best) → top, 1 (worst) → bottom
    return padT + inset + t * usable;
  };

  const placed = rows.map((d) => {
    const v = valOf(d);
    return {
      d,
      v,
      x: xScale(v),
      y: yScale(d.name),
      rank: fullRankByName.get(d.name),
    };
  });

  // X tick formatter
  const fmt = (v) => (mode === "hr" ? v.toFixed(v === 1 ? 2 : 3).replace(/0$/, "0") : String(v));

  const onBgClick = () => {
    setPinned(null);
    setHovered(null);
  };

  return (
    <div className="chart" ref={wrapRef} onClick={onBgClick}>
      <svg
        className="chart-svg"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
      >
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="0.6" cy="0.6" r="0.6" fill="#cfccc1" />
          </pattern>
        </defs>
        {/* plot bg */}
        <rect
          x={padL}
          y={padT}
          width={innerW}
          height={innerH}
          fill="url(#dotgrid)"
          opacity="0.55"
        />
        {/* axes */}
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#1a1a1a" strokeWidth="1" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#1a1a1a" strokeWidth="1" />
        {/* x ticks */}
        {ticks.map((t, i) => {
          const tx = xScale(t);
          return (
            <g key={"x" + i}>
              <line x1={tx} y1={padT + innerH} x2={tx} y2={padT + innerH + 5} stroke="#1a1a1a" strokeWidth="1" />
              <text
                x={tx}
                y={padT + innerH + 20}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="#6b6b66"
              >
                {fmt(t)}
              </text>
            </g>
          );
        })}
        {/* axis label */}
        <text
          x={padL + innerW / 2}
          y={size.h - 6}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="#6b6b66"
          letterSpacing="0.06em"
        >
          {mode === "hr" ? "CORRELATION (R) →" : "SLEEP-STAGE SCORE →"}
        </text>
        <text
          x={14}
          y={padT + innerH / 2}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="#6b6b66"
          letterSpacing="0.06em"
          transform={`rotate(-90, 14, ${padT + innerH / 2})`}
        >
          RANK — WORST TO BEST
        </text>
      </svg>

      {/* dots layer */}
      <div className="chart-dots" onClick={(e) => e.stopPropagation()}>
        {placed.map(({ d, x, y, v, rank }) => {
          const color = window.BRAND_COLORS[d.brand] || "#333";
          const isPinned = pinned === d.name;
          const isHov = hovered === d.name;
          return (
            <button
              key={d.name}
              className={`dot ${isPinned ? "is-pinned" : ""} ${isHov ? "is-hov" : ""}`}
              style={{
                left: x,
                top: y,
                background: color,
                boxShadow: isPinned || isHov ? `0 0 0 2px rgba(0,0,0,0.08), 0 0 0 4px ${color}33` : "none",
              }}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered((h) => (h === d.name ? null : h))}
              onClick={(e) => {
                e.stopPropagation();
                setPinned(pinned === d.name ? null : d.name);
              }}
              aria-label={`${window.prettyName(d.name)} — ${v}`}
            />
          );
        })}
        {/* hover tooltip */}
        {hovered && (() => {
          const item = placed.find((p) => p.d.name === hovered);
          if (!item) return null;
          const right = item.x > size.w * 0.6;
          return (
            <div
              className="tip"
              style={{
                left: item.x + (right ? -12 : 12),
                top: item.y,
                transform: right ? "translate(-100%, -50%)" : "translate(0, -50%)",
              }}
            >
              <div className="tip-name">{window.prettyName(item.d.name)}</div>
              <div className="tip-meta">
                <span style={{ color: window.BRAND_COLORS[item.d.brand] }}>●</span>{" "}
                {item.d.brand} · #{item.rank} · {mode === "hr" ? "R " + item.v.toFixed(3) : item.v.toFixed(1)}
              </div>
            </div>
          );
        })()}
        {/* pinned card */}
        {pinned && (() => {
          const item = placed.find((p) => p.d.name === pinned);
          if (!item) return null;
          const right = item.x > size.w * 0.55;
          const badge = window.badgeFor(mode, item.v);
          return (
            <div
              className="pin-card"
              style={{
                left: item.x + (right ? -18 : 18),
                top: item.y - 20,
                transform: right ? "translate(-100%, 0)" : "translate(0, 0)",
                borderLeft: `3px solid ${window.BRAND_COLORS[item.d.brand]}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pin-eyebrow">#{item.rank} · {item.d.brand.toUpperCase()}</div>
              <div className="pin-title">{window.prettyName(item.d.name)}</div>
              <div className="pin-row">
                <span className={`bdg bdg-${badge.tone}`}>{badge.label}</span>
                <span className="pin-val">{mode === "hr" ? "R " + item.v.toFixed(3) : item.v.toFixed(1)}</span>
              </div>
              <a
                className="pin-link"
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Source study link → " + window.prettyName(item.d.name)); }}
              >
                View source study →
              </a>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

window.Chart = Chart;
