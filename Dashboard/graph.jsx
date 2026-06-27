// Force-directed graph view
window.AB_GRAPH = (function() {
  const { useMemo, useRef, useEffect, useState } = React;

  function Graph({ pages, outlinks, onNav, focusSlug, showLabels }) {
    const svgRef = useRef(null);
    const [hoverSlug, setHoverSlug] = useState(null);
    const nodesRef = useRef([]);
    const linksRef = useRef([]);
    const rafRef = useRef(null);

    const graph = useMemo(() => {
      const visible = pages.filter(p => !p.hidden);
      const nodes = visible.map((p, i) => ({
        id: p.slug,
        title: p.title,
        type: p.type,
        course: p.course,
        // seed positions in a grid
        x: 400 + (Math.cos(i * 0.73) * (120 + (i % 9) * 25)),
        y: 300 + (Math.sin(i * 0.73) * (120 + (i % 9) * 22)),
        vx: 0, vy: 0,
        degree: 0,
      }));
      const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
      const links = [];
      visible.forEach(p => {
        (outlinks[p.slug] || []).forEach(target => {
          if (byId[target]) {
            links.push({ source: p.slug, target });
            byId[p.slug].degree++;
            byId[target].degree++;
          }
        });
      });
      return { nodes, links, byId };
    }, [pages, outlinks]);

    // Run simple force sim
    useEffect(() => {
      const { nodes, links, byId } = graph;
      let iter = 0;
      const maxIter = 400;
      const W = 800, H = 500;

      const step = () => {
        const k = 40; // ideal spring length
        const charge = -180;
        const linkStrength = 0.08;
        const centerStrength = 0.008;

        // repulsion
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist2 = dx * dx + dy * dy + 0.01;
            const dist = Math.sqrt(dist2);
            const f = charge / dist2;
            const fx = (dx / dist) * f;
            const fy = (dy / dist) * f;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }
        // spring
        links.forEach(l => {
          const a = byId[l.source], b = byId[l.target];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
          const f = (dist - k) * linkStrength;
          const fx = (dx / dist) * f, fy = (dy / dist) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        });
        // center gravity
        nodes.forEach(n => {
          n.vx += (W/2 - n.x) * centerStrength;
          n.vy += (H/2 - n.y) * centerStrength;
          // damping
          n.vx *= 0.82; n.vy *= 0.82;
          n.x += n.vx; n.y += n.vy;
        });

        // Update DOM
        if (nodesRef.current) {
          nodesRef.current.forEach((el, i) => {
            if (el) el.setAttribute("transform", `translate(${nodes[i].x.toFixed(1)}, ${nodes[i].y.toFixed(1)})`);
          });
        }
        if (linksRef.current) {
          linksRef.current.forEach((el, i) => {
            if (!el) return;
            const l = links[i];
            const a = byId[l.source], b = byId[l.target];
            el.setAttribute("x1", a.x.toFixed(1));
            el.setAttribute("y1", a.y.toFixed(1));
            el.setAttribute("x2", b.x.toFixed(1));
            el.setAttribute("y2", b.y.toFixed(1));
          });
        }

        iter++;
        if (iter < maxIter) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafRef.current);
    }, [graph]);

    const typeColor = (t) => `var(--type-color-${t})`;

    // Highlight connected nodes
    const connected = useMemo(() => {
      if (!hoverSlug) return null;
      const c = new Set([hoverSlug]);
      const linkSet = new Set();
      graph.links.forEach((l, i) => {
        if (l.source === hoverSlug) { c.add(l.target); linkSet.add(i); }
        if (l.target === hoverSlug) { c.add(l.source); linkSet.add(i); }
      });
      return { nodes: c, links: linkSet };
    }, [hoverSlug, graph]);

    nodesRef.current = [];
    linksRef.current = [];

    return (
      <svg ref={svgRef} viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
        {graph.links.map((l, i) => {
          const a = graph.byId[l.source], b = graph.byId[l.target];
          return (
            <line
              key={i}
              ref={el => linksRef.current[i] = el}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              className={"graph-link" + (connected && connected.links.has(i) ? " highlight" : "")}
              strokeWidth={connected && connected.links.has(i) ? 1.2 : 0.6}
            />
          );
        })}
        {graph.nodes.map((n, i) => {
          const r = Math.max(3.5, Math.min(10, 3.5 + Math.sqrt(n.degree) * 1.4));
          const isHover = hoverSlug === n.id;
          const dim = connected && !connected.nodes.has(n.id);
          return (
            <g
              key={n.id}
              ref={el => nodesRef.current[i] = el}
              transform={`translate(${n.x}, ${n.y})`}
              className={"graph-node" + (isHover ? " highlight" : "") + (dim ? " dim" : "") + (showLabels || isHover ? " show-label" : "")}
              onMouseEnter={() => setHoverSlug(n.id)}
              onMouseLeave={() => setHoverSlug(null)}
              onClick={() => onNav(n.id)}
            >
              <circle
                r={r}
                fill={typeColor(n.type)}
                stroke="var(--bg)"
                strokeWidth="1.5"
                fillOpacity="0.85"
              />
              <text y={r + 10}>{n.title}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  function GraphView({ pages, outlinks, onNav, growth }) {
    const [showLabels, setShowLabels] = useState(false);
    const visible = pages.filter(p => !p.hidden);

    // type breakdown
    const typeCount = {};
    visible.forEach(p => { typeCount[p.type] = (typeCount[p.type] || 0) + 1; });

    // Growth sparkline (last 14 entries)
    const growthData = growth.weekly.slice(-14);
    const maxG = Math.max(...growthData);

    // orphans
    const linked = new Set();
    Object.values(outlinks).forEach(arr => arr.forEach(t => linked.add(t)));
    Object.entries(outlinks).forEach(([k, v]) => { if (v.length > 0) linked.add(k); });
    const orphans = visible.filter(p => !linked.has(p.slug) && (outlinks[p.slug] || []).length === 0).length;

    return (
      <div className="graph-wrap">
        <div className="graph-head">
          <h1>Brain Graph</h1>
          <div className="subtitle">How your knowledge is connecting. Click a node to open, hover to focus.</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="graph-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: "var(--type-color-course)" }}></span> section</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "var(--type-color-concept)" }}></span> concept</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "var(--type-color-entity)" }}></span> person / org</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "var(--type-color-source)" }}></span> source</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: "var(--type-color-analysis)" }}></span> analysis</div>
            </div>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--ink-soft)", cursor: "pointer" }}>
              <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
              Show all labels
            </label>
          </div>
        </div>

        <div className="graph-canvas">
          <Graph pages={pages} outlinks={outlinks} onNav={onNav} showLabels={showLabels} />
        </div>

        <div className="graph-stats">
          <div className="stat-tile">
            <div className="stat-label">Total pages</div>
            <div className="stat-value">{visible.length}</div>
            <Sparkline data={growthData} />
          </div>
          <div className="stat-tile">
            <div className="stat-label">Wiki-links</div>
            <div className="stat-value">{growth.linkCount}</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
              {(growth.linkCount / visible.length).toFixed(1)} avg per page
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Strongest hub</div>
            <div className="stat-value" style={{ fontSize: 16, lineHeight: 1.2 }}>{growth.hub}</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
              {growth.hubDegree} connections
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Orphans</div>
            <div className="stat-value">{orphans}</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
              {orphans === 0 ? "Fully connected" : "No inbound links"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Sparkline({ data }) {
    const W = 120, H = 22;
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * H}`).join(" ");
    return (
      <svg className="stat-sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.2" />
        <polyline points={`0,${H} ${pts} ${W},${H}`} fill="var(--accent)" fillOpacity="0.1" stroke="none" />
      </svg>
    );
  }

  return { GraphView };
})();
