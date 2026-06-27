// Library list, CmdK search, and root App shell
window.AB_APP = (function() {
  const { useState, useMemo, useEffect, useRef } = React;
  const { excerpt, relDate } = window.AB_UTILS;

  // ====== LIBRARY ======
  function Library({ pages, activeType, setActiveType, activeCourse, setActiveCourse, sort, setSort, typeCounts, courseCounts, onNav }) {
    const filtered = useMemo(() => {
      let list = pages.filter(p => !p.hidden);
      if (activeType !== "all") list = list.filter(p => p.type === activeType);
      if (activeCourse !== "all") list = list.filter(p => p.course === activeCourse);
      if (sort === "updated") list = [...list].sort((a, b) => b.updated.localeCompare(a.updated));
      else if (sort === "created") list = [...list].sort((a, b) => b.created.localeCompare(a.created));
      else if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
      else if (sort === "course") list = [...list].sort((a, b) => (a.course || "").localeCompare(b.course || "") || a.title.localeCompare(b.title));
      return list;
    }, [pages, activeType, activeCourse, sort]);

    const types = [
      ["all", "All"],
      ["course", "Section"],
      ["concept", "Concept"],
      ["entity", "Person/Org"],
      ["source", "Source"],
      ["analysis", "Analysis"],
      ["journal", "Journal"],
    ];

    return (
      <>
        <div className="library-head">
          <h1>Library</h1>
          <div className="subtitle">{filtered.length} of {pages.filter(p => !p.hidden).length} pages · sorted by {sort}</div>
          <div className="filter-bar">
            {types.map(([k, label]) => {
              const count = k === "all" ? pages.filter(p => !p.hidden).length : typeCounts[k] || 0;
              if (count === 0 && k !== "all") return null;
              return (
                <button key={k} className="filter-chip" aria-pressed={activeType === k} onClick={() => setActiveType(k)}>
                  {label} <span className="count">{count}</span>
                </button>
              );
            })}
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="updated">Recently updated</option>
              <option value="created">Recently added</option>
              <option value="title">Title A–Z</option>
              <option value="course">Section</option>
            </select>
          </div>
        </div>
        <div className="library-list">
          {filtered.map(p => (
            <div key={p.slug} className="row" data-type={p.type} onClick={() => onNav(p.slug)}>
              <div className="r-type">{window.AB_UTILS.typeLabel(p.type)}</div>
              <div>
                <div className="r-title">{p.title}</div>
                <div className="r-excerpt">{excerpt(p.body, 150)}</div>
              </div>
              <div className="r-course">{p.course || "—"}</div>
              <div className="r-date">{relDate(p.updated)}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty">Nothing here yet. Try a different filter.</div>
          )}
        </div>
      </>
    );
  }

  function LibraryRail({ courseCounts, tagCounts, activeCourse, setActiveCourse, onNav, recents }) {
    return (
      <>
        <h4>Sections</h4>
        <div style={{ marginBottom: 18 }}>
          <button className="nav-item" aria-current={activeCourse === "all"} onClick={() => setActiveCourse("all")}>
            <span className="nav-dot" style={{ background: "var(--ink-faint)" }}></span>
            All sections
            <span className="count">{Object.values(courseCounts).reduce((a, b) => a + b, 0)}</span>
          </button>
          {Object.entries(courseCounts).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
            <button key={c} className="nav-item" aria-current={activeCourse === c} onClick={() => setActiveCourse(c)}>
              <span className="nav-dot" style={{ background: window.AB_UTILS.courseColor(c) }}></span>
              {c}
              <span className="count">{n}</span>
            </button>
          ))}
        </div>

        <h4>Top tags</h4>
        <div style={{ marginBottom: 18 }}>
          {Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t, n]) => (
            <span key={t} className="rail-tag">#{t} <span style={{ color: "var(--ink-faint)" }}>{n}</span></span>
          ))}
        </div>

        <h4>Recently opened</h4>
        <div>
          {recents.slice(0, 6).map(p => (
            <div key={p.slug} className="rail-link" onClick={() => onNav(p.slug)}>
              <span className="rl-type">{window.AB_UTILS.typeLabel(p.type).slice(0, 4)}</span>
              <span>{p.title}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  // ====== CMDK ======
  function CmdK({ pages, onNav, onClose }) {
    const [q, setQ] = useState("");
    const [sel, setSel] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const results = useMemo(() => {
      if (!q.trim()) return pages.filter(p => !p.hidden).slice(0, 12);
      const needle = q.toLowerCase();
      // score: title match > tag match > body match
      const scored = pages.filter(p => !p.hidden).map(p => {
        let score = 0;
        const t = p.title.toLowerCase();
        if (t === needle) score += 100;
        else if (t.startsWith(needle)) score += 50;
        else if (t.includes(needle)) score += 25;
        if ((p.slug || "").toLowerCase().includes(needle)) score += 10;
        if ((p.course || "").toLowerCase().includes(needle)) score += 8;
        (p.tags || []).forEach(tag => { if (tag.toLowerCase().includes(needle)) score += 6; });
        if (p.body.toLowerCase().includes(needle)) score += 3;
        return { p, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 12).map(x => x.p);
      return scored;
    }, [q, pages]);

    useEffect(() => { setSel(0); }, [q]);

    const onKey = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
      else if (e.key === "Enter" && results[sel]) { onNav(results[sel].slug); onClose(); }
      else if (e.key === "Escape") onClose();
    };

    return (
      <div className="cmdk-backdrop" onClick={onClose}>
        <div className="cmdk" onClick={e => e.stopPropagation()}>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Search your brain… titles, tags, sections, anything"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="cmdk-results">
            {results.length === 0 && <div className="cmdk-empty">No matches. Try a different query.</div>}
            {results.map((p, i) => (
              <div
                key={p.slug}
                className="cmdk-result"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={() => { onNav(p.slug); onClose(); }}
              >
                <div className="r-type">{window.AB_UTILS.typeLabel(p.type)}</div>
                <div>
                  <div className="r-title">{p.title}</div>
                </div>
                <div className="r-course">{p.course || ""}</div>
              </div>
            ))}
          </div>
          <div className="cmdk-foot">
            <span><span className="kbd">↑↓</span>navigate</span>
            <span><span className="kbd">↵</span>open</span>
            <span><span className="kbd">esc</span>close</span>
            <span style={{ marginLeft: "auto", color: "var(--ink-faint)" }}>Andrew Brain</span>
          </div>
        </div>
      </div>
    );
  }

  // ====== TWEAKS PANEL ======
  function TweaksPanel({ tweaks, setTweaks }) {
    return (
      <div className="tweaks">
        <h4>Tweaks</h4>
        <div className="tweaks-hint">Tune the feel of your brain.</div>
        <div className="tweak-row">
          <label>Theme</label>
          <div className="seg">
            {["light", "sepia", "dark"].map(t => (
              <button key={t} aria-pressed={tweaks.theme === t} onClick={() => setTweaks({ ...tweaks, theme: t })}>{t}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <label>Density</label>
          <div className="seg">
            {["cozy", "compact"].map(t => (
              <button key={t} aria-pressed={tweaks.density === t} onClick={() => setTweaks({ ...tweaks, density: t })}>{t}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <label>Accent</label>
          <div className="seg">
            {[["terracotta", 45], ["oxblood", 25], ["olive", 120], ["ink", 250]].map(([name, hue]) => (
              <button key={name} aria-pressed={tweaks.accent === name} onClick={() => setTweaks({ ...tweaks, accent: name })}>{name}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Normalize data.js shape into what the views expect
  function normalizeData(raw) {
    const pages = raw.pages;
    const index = window.AB_UTILS.bySlug(pages);

    // queue: turn rawUningested into queue with ids + kind
    const guessKind = (path) => {
      const ext = (path.split(".").pop() || "").toLowerCase();
      if (["pdf"].includes(ext)) return "pdf";
      if (["doc", "docx"].includes(ext)) return "docx";
      if (["md"].includes(ext)) return "md";
      if (["png", "jpg", "jpeg"].includes(ext)) return "img";
      return "txt";
    };
    const queue = (raw.rawUningested || []).map((r, i) => ({
      id: "q" + i,
      path: r.path,
      kind: guessKind(r.path),
      hint: r.note,
      captured: r.added,
      size: r.size,
      source: r.suggestedCourse,
      status: "raw",
    }));

    // todos: add id, pageTitle, course
    const todos = (raw.todos || []).map((t, i) => ({
      id: "t" + i,
      text: t.text,
      done: t.done,
      due: t.due,
      page: t.page,
      pageTitle: index[t.page]?.title || t.page,
      course: index[t.page]?.course || null,
    }));

    // assignments: add id and page link
    const assignments = (raw.assignments || []).map((a, i) => {
      // try to resolve a page: course slug or an assignment-specific page
      const courseSlug = a.course.toLowerCase();
      const page = index[courseSlug] ? courseSlug : pages[0].slug;
      return {
        id: "a" + i,
        course: a.course,
        title: a.title,
        due: a.due,
        points: a.points,
        priority: a.priority,
        page,
      };
    });

    // activity: array of {date, count} -> array of bucket values 0-4
    const acts = raw.activity || [];
    const activity = acts.map(a => {
      const n = a.count || 0;
      if (n === 0) return 0;
      if (n <= 2) return 1;
      if (n <= 5) return 2;
      if (n <= 12) return 3;
      return 4;
    });

    // growth: derive weekly bins (last 14w) + link count + top hub
    const weekly = new Array(14).fill(0);
    acts.forEach((a, i) => {
      // bucket into 14 weeks mapped from 60 days (roughly 4.3 days each)
      const bucket = Math.min(13, Math.floor((i / acts.length) * 14));
      weekly[bucket] += a.count;
    });
    // ensure final week reflects recent activity
    const linkCount = (raw.edges || []).length;

    // Degree per slug, in-links per slug (for orphan detection).
    const degree = {};
    const inDegree = {};
    (raw.edges || []).forEach(e => {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    });
    let hubSlug = null, hubDegree = 0;
    for (const [s, d] of Object.entries(degree)) {
      if (d > hubDegree) { hubDegree = d; hubSlug = s; }
    }
    const hub = hubSlug ? (index[hubSlug]?.title || hubSlug) : "—";

    // Top 5 hubs (by total degree).
    const topHubs = Object.entries(degree)
      .map(([s, d]) => ({ slug: s, degree: d, title: index[s]?.title || s }))
      .filter(x => index[x.slug] && !index[x.slug].hidden)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    // Orphans: visible pages with zero inbound edges.
    const orphans = pages.filter(p => !p.hidden && !inDegree[p.slug]).length;

    // Page counts by type and section.
    const typeCountsMap = {};
    const sectionCountsMap = {};
    pages.forEach(p => {
      if (p.hidden) return;
      typeCountsMap[p.type] = (typeCountsMap[p.type] || 0) + 1;
      if (p.course) sectionCountsMap[p.course] = (sectionCountsMap[p.course] || 0) + 1;
    });

    // Fresh-page counts via `updated` vs TODAY.
    const TODAY_ISO = "2026-04-22";
    const today = new Date(TODAY_ISO + "T00:00:00");
    const daysBack = (iso) => {
      if (!iso) return Infinity;
      return Math.round((today - new Date(iso + "T00:00:00")) / 86400000);
    };
    let thisWeek = 0, thisMonth = 0;
    pages.forEach(p => {
      if (p.hidden) return;
      const d = daysBack(p.updated);
      if (d >= 0 && d <= 7) thisWeek++;
      if (d >= 0 && d <= 30) thisMonth++;
    });

    return {
      pages, queue, todos, assignments, activity,
      growth: { weekly, linkCount, hub, hubDegree, topHubs, orphans, typeCounts: typeCountsMap, sectionCounts: sectionCountsMap, thisWeek, thisMonth },
      calendarEvents: raw.calendarEvents || [],
      inbox: raw.inbox || [],
      nowPlaying: raw.nowPlaying || null,
      activeProject: raw.activeProject || null,
      claudeSkills: raw.claudeSkills || [],
      uoigHoldings: raw.uoigHoldings || [],
    };
  }

  // ====== ROOT APP ======
  function App() {
    const raw = window.AB_DATA;
    const normalized = useMemo(() => normalizeData(raw), [raw]);
    const pages = normalized.pages;
    const index = window.AB_UTILS.bySlug(pages);
    const backlinks = useMemo(() => window.AB_UTILS.buildBacklinks(pages), [pages]);
    const outlinks = useMemo(() => window.AB_UTILS.buildOutlinks(pages), [pages]);
    raw.backlinks = backlinks;

    const [view, setView] = useState(() => localStorage.getItem("ab.view") || "home");
    const [current, setCurrent] = useState(null);
    const [recents, setRecents] = useState([]);
    const [activeType, setActiveType] = useState("all");
    const [activeCourse, setActiveCourse] = useState("all");
    const [sort, setSort] = useState("updated");
    const [cmdkOpen, setCmdkOpen] = useState(false);
    const [showTweaks, setShowTweaks] = useState(false);

    const [tweaks, setTweaks] = useState(() => {
      try { return JSON.parse(localStorage.getItem("ab.tweaks")) || { theme: "dark", density: "cozy", accent: "terracotta" }; }
      catch { return { theme: "dark", density: "cozy", accent: "terracotta" }; }
    });

    // persist
    useEffect(() => { localStorage.setItem("ab.view", view); }, [view]);
    useEffect(() => { localStorage.setItem("ab.tweaks", JSON.stringify(tweaks)); }, [tweaks]);

    // Apply theme / density / accent
    useEffect(() => {
      document.documentElement.dataset.theme = tweaks.theme;
      document.documentElement.dataset.density = tweaks.density;
      const hueMap = { terracotta: [58, 0.13, 45], oxblood: [48, 0.14, 25], olive: [52, 0.11, 120], ink: [45, 0.13, 250] };
      const [L, C, H] = hueMap[tweaks.accent] || hueMap.terracotta;
      document.documentElement.style.setProperty("--accent", `oklch(${L}% ${C} ${H})`);
      document.documentElement.style.setProperty("--accent-soft", `oklch(92% ${C * 0.25} ${H})`);
      document.documentElement.style.setProperty("--accent-ink", `oklch(42% ${C * 0.92} ${H - 5})`);
      if (tweaks.theme === "dark") {
        document.documentElement.style.setProperty("--accent", `oklch(72% ${C} ${H})`);
        document.documentElement.style.setProperty("--accent-soft", `oklch(32% ${C * 0.5} ${H})`);
        document.documentElement.style.setProperty("--accent-ink", `oklch(80% ${C} ${H})`);
      }
    }, [tweaks]);

    // Tweaks host integration
    useEffect(() => {
      const onMsg = (e) => {
        if (e.data?.type === "__activate_edit_mode") setShowTweaks(true);
        if (e.data?.type === "__deactivate_edit_mode") setShowTweaks(false);
      };
      window.addEventListener("message", onMsg);
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
      return () => window.removeEventListener("message", onMsg);
    }, []);

    const onNav = (slug) => {
      if (!index[slug]) return;
      setCurrent(slug);
      setView("reader");
      setRecents(r => [slug, ...r.filter(s => s !== slug)].slice(0, 10));
    };

    // Global keyboard
    useEffect(() => {
      const onKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdkOpen(true); }
        else if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); setCmdkOpen(true); }
        else if (e.key === "g" && document.activeElement.tagName !== "INPUT") {
          // vim-style: g then l/q/h/v
          const handler = (e2) => {
            if (e2.key === "l") setView("library");
            else if (e2.key === "q") setView("queue");
            else if (e2.key === "h") setView("home");
            window.removeEventListener("keydown", handler, true);
          };
          window.addEventListener("keydown", handler, true);
          setTimeout(() => window.removeEventListener("keydown", handler, true), 1500);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    const typeCounts = {};
    const courseCounts = {};
    const tagCounts = {};
    pages.forEach(p => {
      if (p.hidden) return;
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
      if (p.course) courseCounts[p.course] = (courseCounts[p.course] || 0) + 1;
      (p.tags || []).forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
    });

    const recentPages = recents.map(s => index[s]).filter(Boolean);

    const data = normalized;

    const cur = current ? index[current] : null;

    return (
      <div className="app" data-view={view}>
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark"></div>
            Andrew's Brain
          </div>
          <div className="top-nav">
            <button aria-current={view === "home"} onClick={() => setView("home")}>Hub</button>
            <button aria-current={view === "library"} onClick={() => setView("library")}>Library</button>
            <button aria-current={view === "uoig"} onClick={() => setView("uoig")}>UOIG</button>
          </div>
          <div className="spacer"></div>
          <button className="top-search" onClick={() => setCmdkOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/><path d="m9 9 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Search your brain…
            <span className="kbd">⌘K</span>
          </button>
        </div>

        {view !== "home" && view !== "uoig" && <aside className="sidebar">
          <div className="sidebar-title">Sections</div>
          <button className="nav-item" aria-current={activeCourse === "all" && view === "library"} onClick={() => { setActiveCourse("all"); setView("library"); }}>
            <span className="nav-dot" style={{ background: "var(--ink-faint)" }}></span>All
            <span className="count">{pages.filter(p => !p.hidden).length}</span>
          </button>
          {Object.entries(courseCounts).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
            <button key={c} className="nav-item" aria-current={activeCourse === c && view === "library"} onClick={() => { setActiveCourse(c); setView("library"); }}>
              <span className="nav-dot" style={{ background: window.AB_UTILS.courseColor(c) }}></span>{c}
              <span className="count">{n}</span>
            </button>
          ))}

          <div className="sidebar-title">Types</div>
          {["concept", "entity", "source", "analysis", "journal"].map(t => {
            const n = typeCounts[t] || 0;
            if (n === 0) return null;
            return (
              <button key={t} className="nav-item" aria-current={activeType === t && view === "library" && activeCourse === "all"} onClick={() => { setActiveType(t); setActiveCourse("all"); setView("library"); }}>
                <span className="nav-dot" style={{ background: `var(--type-color-${t})` }}></span>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="count">{n}</span>
              </button>
            );
          })}

          <div className="sidebar-title">Recents</div>
          {recentPages.slice(0, 5).map(p => (
            <button key={p.slug} className="nav-item" onClick={() => onNav(p.slug)}>
              <span className="nav-dot" style={{ background: `var(--type-color-${p.type})` }}></span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
            </button>
          ))}
          {recentPages.length === 0 && (
            <div style={{ padding: "4px 8px", color: "var(--ink-faint)", fontSize: 11.5 }}>Open a page to build history.</div>
          )}
        </aside>}

        <main className="main">
          {view === "home" && <window.AB_VIEWS.Home data={data} onNav={onNav} onGoto={setView} />}
          {view === "library" && (
            <Library
              pages={pages}
              activeType={activeType} setActiveType={setActiveType}
              activeCourse={activeCourse} setActiveCourse={setActiveCourse}
              sort={sort} setSort={setSort}
              typeCounts={typeCounts} courseCounts={courseCounts}
              onNav={onNav}
            />
          )}
          {view === "uoig" && <window.AB_VIEWS.Uoig data={data} />}
          {view === "graph" && <window.AB_GRAPH.GraphView pages={pages} outlinks={outlinks} onNav={onNav} growth={normalized.growth} />}
          {view === "reader" && cur && (
            <window.AB_READER.Reader
              page={cur} index={index}
              backlinks={backlinks} outlinks={outlinks}
              onNav={onNav} onBack={() => setView("library")}
            />
          )}
        </main>

        {cmdkOpen && <CmdK pages={pages} onNav={onNav} onClose={() => setCmdkOpen(false)} />}
        {showTweaks && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} />}
      </div>
    );
  }

  // Rail variants
  function HubRail({ data, onNav, setView }) {
    return (
      <>
        <h4>Keyboard shortcuts</h4>
        <div className="rail-block" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.9, color: "var(--ink-soft)" }}>
          <div><span style={{ color: "var(--ink)" }}>⌘K</span> · search</div>
          <div><span style={{ color: "var(--ink)" }}>/</span> · search</div>
          <div><span style={{ color: "var(--ink)" }}>g h</span> · hub</div>
          <div><span style={{ color: "var(--ink)" }}>g l</span> · library</div>
          <div><span style={{ color: "var(--ink)" }}>g q</span> · queue</div>
          <div><span style={{ color: "var(--ink)" }}>g v</span> · graph</div>
        </div>

        <h4 style={{ marginTop: 18 }}>Quick capture</h4>
        <div className="rail-block">
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8, lineHeight: 1.5 }}>
            Drop a thought, screenshot, or link. It lands in the Queue inbox.
          </div>
          <textarea placeholder="Type anything…" style={{ width: "100%", minHeight: 60, border: "1px solid var(--rule)", borderRadius: 4, padding: 6, fontFamily: "inherit", fontSize: 12.5, background: "var(--bg)", resize: "vertical" }}></textarea>
          <button className="btn primary" style={{ marginTop: 6, width: "100%" }}>Capture</button>
        </div>

        <h4 style={{ marginTop: 18 }}>Vault info</h4>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.7 }}>
          <div>📂 <code>~/Andrew-Brain</code></div>
          <div>Synced <span style={{ color: "var(--ink-dim)" }}>2 min ago</span></div>
          <div>{data.pages.filter(p => !p.hidden).length} pages · {data.growth.linkCount} links</div>
        </div>
      </>
    );
  }

  function QueueRail({ data, onNav }) {
    const today = "2026-04-22";
    const week = data.assignments.filter(a => {
      const d = Math.round((new Date(a.due+"T00:00:00") - new Date(today+"T00:00:00"))/86400000);
      return d >= 0 && d <= 14;
    }).sort((a,b)=>a.due.localeCompare(b.due));
    return (
      <>
        <h4>This week at a glance</h4>
        <div className="rail-block">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 10px", fontSize: 12.5 }}>
            <span style={{ color: "var(--ink-soft)" }}>Due in ≤3d</span><strong>{week.filter(a => (new Date(a.due)-new Date(today))/86400000 <= 3).length}</strong>
            <span style={{ color: "var(--ink-soft)" }}>Due this week</span><strong>{week.length}</strong>
            <span style={{ color: "var(--ink-soft)" }}>Inbox depth</span><strong>{data.queue.filter(q=>q.status==='raw').length}</strong>
            <span style={{ color: "var(--ink-soft)" }}>Open todos</span><strong>{data.todos.filter(t=>!t.done).length}</strong>
          </div>
        </div>

        <h4 style={{ marginTop: 18 }}>Ingestion tips</h4>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px" }}>A good ingested note has:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Type, section, tags in frontmatter</li>
            <li>≥2 outbound <code>[[wikilinks]]</code></li>
            <li>At least one <code>&gt; [!todo]</code> or <code>&gt; [!note]</code></li>
            <li>Source cited if applicable</li>
          </ul>
        </div>
      </>
    );
  }

  function GraphRail({ pages, outlinks, onNav, growth }) {
    // most-connected pages
    const degree = {};
    pages.forEach(p => { degree[p.slug] = (outlinks[p.slug] || []).length; });
    Object.values(outlinks).forEach(arr => arr.forEach(t => degree[t] = (degree[t] || 0) + 1));
    const top = Object.entries(degree)
      .map(([s, d]) => ({ p: window.AB_UTILS.bySlug(pages)[s], d }))
      .filter(x => x.p && !x.p.hidden)
      .sort((a, b) => b.d - a.d)
      .slice(0, 8);

    return (
      <>
        <h4>Most connected</h4>
        <div>
          {top.map(({ p, d }) => (
            <div key={p.slug} className="rail-link" onClick={() => onNav(p.slug)}>
              <span className="rl-type">{window.AB_UTILS.typeLabel(p.type).slice(0, 4)}</span>
              <span style={{ flex: 1 }}>{p.title}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)" }}>{d}</span>
            </div>
          ))}
        </div>

        <h4 style={{ marginTop: 18 }}>Growth</h4>
        <div className="rail-block">
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Pages per week, last 14 weeks</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 48 }}>
            {growth.weekly.slice(-14).map((v, i) => {
              const max = Math.max(...growth.weekly);
              return (
                <div key={i} title={`Week -${14-i}: ${v}`} style={{
                  flex: 1, height: `${(v/max)*100}%`, minHeight: 2,
                  background: i === 13 ? "var(--accent)" : "var(--rule-strong)",
                  borderRadius: 1
                }}></div>
              );
            })}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-dim)", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span>14w ago</span><span>now</span>
          </div>
        </div>
      </>
    );
  }

  return { App };
})();
