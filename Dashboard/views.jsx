// Queue / Growth / Home views
window.AB_VIEWS = (function() {
  const { useMemo, useState, useEffect, useRef } = React;
  const { relDate, fmtDate, excerpt, courseColor } = window.AB_UTILS;

  const TODAY = "2026-04-22";

  function daysBetween(a, b) {
    return Math.round((new Date(a + "T00:00:00") - new Date(b + "T00:00:00")) / 86400000);
  }

  function greetingForHour(h) {
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }

  // ====== HOME / HUB ======
  function Home({ data, onNav, onGoto }) {
    const { pages, assignments, activity, growth, calendarEvents, inbox, claudeSkills, uoigHoldings } = data;

    return (
      <div className="hud">
        <div className="hud-header">
          <div className="hud-greeting">
            {greetingForHour(new Date().getHours())}, <em>Andrew.</em>
          </div>
          <HudClock />
        </div>

        <QuickCapture />

        <div className="hud-grid">
          <div className="hud-col">
            <CalendarCard events={calendarEvents} assignments={assignments} />
            <IngestCard />
          </div>
          <div className="hud-col">
            <InboxCard messages={inbox} />
            <RecentPagesCard pages={pages} onNav={onNav} />
          </div>
          <div className="hud-col">
            <VaultVitalsCard pages={pages} growth={growth} activity={activity} onNav={onNav} />
            <ClaudeSkillsCard skills={claudeSkills} />
          </div>
        </div>
      </div>
    );
  }

  // ====== UOIG FINANCIALS ======
  function Uoig({ data }) {
    return (
      <div className="hud">
        <HoldingsCard holdings={data.uoigHoldings} />
      </div>
    );
  }

  // ---- Quick Capture --------------------------------------------------------
  // POSTs to /api/capture — the local server writes wiki/raw/{timestamp}-{slug}.md
  // and chokidar rebuilds the manifest, so the new file shows up on next reload.
  // Falls back to an in-memory queue entry if the API is unreachable.
  function QuickCapture() {
    const [text, setText] = useState("");
    const [flash, setFlash] = useState(null);
    const [flashKind, setFlashKind] = useState("ok");
    const inputRef = useRef(null);
    const isUrl = /^(https?:\/\/|www\.)/i.test(text.trim());
    const showFlash = (msg, kind = "ok") => {
      setFlash(msg);
      setFlashKind(kind);
      setTimeout(() => setFlash(null), 2400);
    };
    const submit = async () => {
      const v = text.trim();
      if (!v) return;
      setText("");
      try {
        const resp = await fetch("/api/capture", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: v }),
        });
        if (!resp.ok) throw new Error("status " + resp.status);
        const j = await resp.json();
        showFlash(`Saved · ${j.path}`, "ok");
      } catch (e) {
        // Fallback — in-memory queue item so nothing is lost locally.
        const item = {
          path: isUrl ? v : `raw/${Date.now()}-scratch.md`,
          note: v, added: new Date().toISOString().slice(0, 10),
          size: `${new Blob([v]).size}b`, suggestedCourse: null,
        };
        window.AB_DATA.rawUningested = [item, ...(window.AB_DATA.rawUningested || [])];
        showFlash("Saved (offline — server not reachable)", "warn");
      }
    };
    const onKey = (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
        e.preventDefault();
        submit();
      }
    };
    return (
      <div className="qc">
        <div className="qc-prompt">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        </div>
        <input
          ref={inputRef}
          className="qc-input"
          placeholder="Capture a thought, paste a link…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
        />
        {isUrl && <span className="qc-chip">LINK</span>}
        <button className="qc-btn" onClick={submit} disabled={!text.trim()}>
          Capture <span className="kbd">⏎</span>
        </button>
        {flash && <span className={"qc-flash qc-flash--" + flashKind}>{flash}</span>}
      </div>
    );
  }

  // MarketsCard + MarketRow removed — watchlist lives in its own card elsewhere in the app
  // (HoldingsCard is the UOIG-specific view).

  // Live-ticking clock. Uses the current wall time — day-of-year assumes TODAY constant so
  // the dashboard stays internally consistent with seed data.
  function HudClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
      const id = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(id);
    }, []);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const today = new Date(TODAY + "T00:00:00");
    const jan1 = new Date(today.getFullYear(), 0, 1);
    const doy = Math.floor((today - jan1) / 86400000) + 1;
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return (
      <div className="hud-clock">
        <div className="hud-clock-time"><span>{hh}</span>:<span>{mm}</span><sup>{ss}</sup></div>
        <div className="hud-clock-meta">{dayNames[today.getDay()]} · {monthNames[today.getMonth()]} {today.getDate()} · Day {doy} / 365</div>
      </div>
    );
  }

  function HudCard({ label, meta, children, className = "" }) {
    return (
      <div className={"hud-card " + className}>
        <div className="hud-card-head">
          <span className="hud-card-label">{label}</span>
          {meta != null && <span className="hud-card-meta">{meta}</span>}
        </div>
        {children}
      </div>
    );
  }

  // ---- Calendar -------------------------------------------------------------
  function CalendarCard({ events, assignments }) {
    const today = new Date(TODAY + "T00:00:00");
    const todayISO = TODAY;
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const [selectedISO, setSelectedISO] = useState(todayISO);
    const [showDone, setShowDone] = useState(false);

    const isoFromDate = (d) => d.toISOString().slice(0, 10);
    const shiftDay = (iso, delta) => {
      const d = new Date(iso + "T00:00:00");
      d.setDate(d.getDate() + delta);
      return isoFromDate(d);
    };
    const selectedDate = new Date(selectedISO + "T00:00:00");
    const isToday = selectedISO === todayISO;
    const prevISO = shiftDay(selectedISO, -1);
    const nextISO = shiftDay(selectedISO, 1);
    const labelFor = (iso) => {
      if (iso === todayISO) return "Today";
      if (iso === shiftDay(todayISO, 1)) return "Tomorrow";
      if (iso === shiftDay(todayISO, -1)) return "Yesterday";
      return dayNames[new Date(iso + "T00:00:00").getDay()];
    };

    // Merge assignments due on a date with that date's calendar events. Same-title events win.
    const buildAgenda = (iso) => {
      const evs = events.filter(e => e.date === iso);
      const titles = new Set(evs.map(e => e.title.toLowerCase().trim()));
      const asns = assignments
        .filter(a => a.due === iso && !titles.has(a.title.toLowerCase().trim()))
        .map(a => ({ id: "a:" + a.id, date: a.due, start: null, end: null, title: a.title, context: a.course, kind: "assignment" }));
      return [...asns, ...evs].sort((x, y) => (x.start || "").localeCompare(y.start || ""));
    };
    const agenda = buildAgenda(selectedISO);
    const prevAgenda = buildAgenda(prevISO);
    const nextAgenda = buildAgenda(nextISO);

    const toMin = (hhmm) => {
      if (!hhmm) return null;
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };
    const fmtCountdown = (mins) => {
      if (mins < 60) return `In ${mins} min`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m === 0 ? `In ${h}h` : `In ${h}h ${m}m`;
    };
    const fmtTimeRange = (e) => e.end ? `${e.start} – ${e.end}` : (e.start || "all-day");

    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    // "live" / "upcoming" / "past" only apply when the selected day IS today.
    const live = isToday ? agenda.find(e => {
      const s = toMin(e.start), en = toMin(e.end);
      return s != null && en != null && s <= nowMinutes && nowMinutes < en;
    }) : null;
    const upcoming = isToday ? agenda.filter(e => { const s = toMin(e.start); return s != null && s > nowMinutes; }) : [];
    const past = isToday ? agenda.filter(e => { const en = toMin(e.end) ?? toMin(e.start); return en != null && en <= nowMinutes && e !== live; }) : [];
    // On non-today days, the hero is just the day's first event; the rest fills "rest of day".
    const hero = isToday ? (live || upcoming[0] || null) : (agenda[0] || null);
    const restItems = isToday ? upcoming.filter(e => e !== hero) : agenda.filter(e => e !== hero);

    const openInChrome = () => {
      try { navigator.clipboard?.writeText(window.location.href); } catch (_) {}
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    };

    const headerMeta = (
      <span className="cal-head-meta">
        <span className="cal-month">{monthNames[today.getMonth()].slice(0,3).toUpperCase()} {today.getFullYear()}</span>
        <button className="cal-open-chrome" onClick={openInChrome} title="Open this dashboard in a new Chrome tab">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open in Chrome
        </button>
      </span>
    );

    const renderHero = () => {
      if (!hero) {
        if (isToday) {
          // Day's done — pivot to tomorrow.
          const next = nextAgenda.find(e => e.start) || nextAgenda[0];
          return (
            <div className="cal-hero cal-hero--done">
              <div className="cal-hero-status">Day's done</div>
              {next ? (
                <>
                  <div className="cal-hero-title">{next.title}</div>
                  <div className="cal-hero-meta">
                    Tomorrow{next.start ? ` · ${next.start}` : ""}
                    {next.context ? ` · ${next.context}` : ""}
                  </div>
                </>
              ) : (
                <div className="cal-hero-meta">Nothing on the calendar tomorrow either.</div>
              )}
            </div>
          );
        }
        return (
          <div className="cal-hero cal-hero--done">
            <div className="cal-hero-status">Nothing scheduled</div>
            <div className="cal-hero-meta">No events on this day.</div>
          </div>
        );
      }
      const heroIsLive = hero === live;
      let status;
      if (heroIsLive) {
        status = <>NOW{toMin(hero.end) != null && <> · ends {hero.end}</>}</>;
      } else if (isToday) {
        status = <>{fmtCountdown(toMin(hero.start) - nowMinutes)} · {fmtTimeRange(hero)}</>;
      } else {
        status = <>{fmtTimeRange(hero)}</>;
      }
      return (
        <div className="cal-hero" data-kind={hero.kind} data-live={heroIsLive || undefined}>
          <div className="cal-hero-status">{status}</div>
          <div className="cal-hero-title">{hero.title}</div>
          {hero.context && <div className="cal-hero-meta">{hero.context}</div>}
        </div>
      );
    };

    const stepDay = (delta) => {
      setSelectedISO(shiftDay(selectedISO, delta));
      setShowDone(false);
    };
    const goTo = (iso) => {
      setSelectedISO(iso);
      setShowDone(false);
    };

    return (
      <HudCard label="Calendar" meta={headerMeta}>
        <div className="cal-today-row">
          <button className="cal-nav-chev" onClick={() => stepDay(-1)} aria-label="Previous day">‹</button>
          <div className="cal-today">{dayNames[selectedDate.getDay()]}, <em>{monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}</em></div>
          <button className="cal-nav-chev" onClick={() => stepDay(1)} aria-label="Next day">›</button>
          {!isToday && (
            <button className="cal-today-jump" onClick={() => goTo(todayISO)}>Today</button>
          )}
        </div>

        {renderHero()}

        {restItems.length > 0 && (
          <div className="cal-rest">
            <div className="cal-rest-label">{isToday ? `Rest of today · ${restItems.length}` : `Also that day · ${restItems.length}`}</div>
            {restItems.map(e => (
              <div key={e.id} className="cal-mini" data-kind={e.kind}>
                <div className="cal-mini-time">{e.start || "all-day"}</div>
                <div className="cal-mini-title">{e.title}</div>
                {e.context && <div className="cal-mini-context">{e.context}</div>}
              </div>
            ))}
          </div>
        )}

        {isToday && past.length > 0 && (
          <div className="cal-done">
            <button className="cal-done-toggle" onClick={() => setShowDone(s => !s)}>
              {showDone ? "▾" : "▸"} {past.length} done today
            </button>
            {showDone && past.map(e => (
              <div key={e.id} className="cal-mini cal-mini--past">
                <div className="cal-mini-time">{e.start || "all-day"}</div>
                <div className="cal-mini-title">{e.title}</div>
                {e.context && <div className="cal-mini-context">{e.context}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="cal-nav-row">
          {prevAgenda.length > 0 && (
            <button className="cal-nav-link" onClick={() => goTo(prevISO)}>
              ← {labelFor(prevISO)}: {prevAgenda.slice(0, 2).map(e => e.title).join(", ")}
              {prevAgenda.length > 2 && ` +${prevAgenda.length - 2}`}
            </button>
          )}
          {nextAgenda.length > 0 && (
            <button className="cal-nav-link cal-nav-link--right" onClick={() => goTo(nextISO)}>
              → {labelFor(nextISO)}: {nextAgenda.slice(0, 2).map(e => e.title).join(", ")}
              {nextAgenda.length > 2 && ` +${nextAgenda.length - 2}`}
            </button>
          )}
        </div>
      </HudCard>
    );
  }

  // ---- Ingest (upload → raw/) ----------------------------------------------
  function IngestCard() {
    return (
      <HudCard label="Ingest" meta="RAW → WIKI">
        <IngestPane />
      </HudCard>
    );
  }

  function IngestPane() {
    const [flash, setFlash] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const PROMPT = "Ingest the newest file(s) in raw/ into the wiki. Follow the INGEST workflow in CLAUDE.md: read each file fully, confirm the section and key takeaways with me, then create the source page in wiki/sources/ with proper frontmatter, update any relevant entity/concept/section pages, cross-reference where it fits, and append an entry to wiki/log.md.";

    const upload = async (fileList) => {
      const arr = Array.from(fileList || []);
      if (arr.length === 0) return;
      setFlash({ kind: "ok", msg: `Uploading ${arr.length} file${arr.length > 1 ? "s" : ""}…` });
      let ok = 0, fail = 0;
      for (const f of arr) {
        try {
          const buf = await f.arrayBuffer();
          const resp = await fetch("/api/upload?filename=" + encodeURIComponent(f.name), {
            method: "POST",
            headers: { "content-type": f.type || "application/octet-stream" },
            body: buf,
          });
          if (!resp.ok) throw new Error((await resp.json()).error || "upload failed");
          ok++;
        } catch (e) {
          fail++;
          console.warn("upload failed:", f.name, e);
        }
      }
      setFlash({ kind: fail ? "warn" : "ok", msg: `${ok} uploaded to raw/${fail ? `, ${fail} failed` : ""}` });
      setTimeout(() => setFlash(null), 2500);
    };

    const onDrop = (e) => {
      e.preventDefault();
      setDragOver(false);
      upload(e.dataTransfer.files);
    };

    const copyPrompt = async () => {
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(PROMPT);
          ok = true;
        }
      } catch (_) { ok = false; }
      if (!ok) {
        const ta = document.createElement("textarea");
        ta.value = PROMPT;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
        document.body.removeChild(ta);
      }
      setFlash({
        kind: ok ? "ok" : "warn",
        msg: ok ? "Prompt copied. Paste into Claude Code." : "Copy blocked — select text manually.",
      });
      setTimeout(() => setFlash(null), 2400);
    };

    return (
      <div className="ingest">
        <div
          className={"ingest-drop" + (dragOver ? " ingest-drop--over" : "")}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div className="ingest-drop-text">
            <strong>Drop a file</strong> or click to browse
            <div className="ingest-drop-sub">Lands in <code>raw/</code> · PDF, DOCX, MD, EPUB, images · 25MB max</div>
          </div>
          <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => upload(e.target.files)} />
        </div>

        <div className="ingest-prompt">
          <div className="ingest-prompt-head">
            <span className="ingest-prompt-label">Ingest prompt</span>
            <button className="ingest-prompt-btn" onClick={copyPrompt}>Copy</button>
          </div>
          <div className="ingest-prompt-body">{PROMPT}</div>
        </div>

        {flash && <div className={"ingest-flash ingest-flash--" + flash.kind}>{flash.msg}</div>}
      </div>
    );
  }

  // ---- Inbox ----------------------------------------------------------------
  function InboxCard({ messages }) {
    const [tab, setTab] = useState("work");
    const fmtAge = (h) => h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
    const tabs = [
      { key: "work",     label: "Work" },
      { key: "personal", label: "Personal" },
      { key: "slack",    label: "Slack" },
    ];
    const countFor = (k) => messages.filter(m => m.category === k).length;
    const filtered = messages.filter(m => m.category === tab);
    const unreadForTab = filtered.length;
    return (
      <HudCard label="Inbox" meta={`${unreadForTab} UNREAD`}>
        <div className="inbox-tabs" role="tablist">
          {tabs.map(t => (
            <button
              key={t.key}
              className="inbox-tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="inbox-tab-count">{countFor(t.key)}</span>
            </button>
          ))}
        </div>
        <div className="inbox-list">
          {filtered.length === 0 && (
            <div className="inbox-empty">Nothing here. Enjoy the quiet.</div>
          )}
          {filtered.map(m => (
            <div key={m.id} className="inbox-row" onClick={() => {}}>
              <div className="inbox-avatar" style={{ background: courseColor(m.from) }}>{m.initials}</div>
              <div className="inbox-body">
                <div className="inbox-line1">
                  <span className="inbox-from">{m.from}</span>
                  {m.urgent && <span className="chip chip--urgent">URGENT</span>}
                </div>
                <div className="inbox-subject">{m.subject}</div>
                <div className="inbox-preview">{m.preview}</div>
              </div>
              <div className="inbox-age">{fmtAge(m.ageHours)}</div>
            </div>
          ))}
        </div>
      </HudCard>
    );
  }

  // ---- Recent Pages ---------------------------------------------------------
  function RecentPagesCard({ pages, onNav }) {
    const recents = pages
      .filter(p => !p.hidden)
      .slice()
      .sort((a, b) => (b.updated || "").localeCompare(a.updated || ""))
      .slice(0, 6);
    return (
      <HudCard label="Recent Pages" meta={`${recents.length} SHOWN`}>
        <div className="recent-list">
          {recents.map(p => (
            <div key={p.slug} className="recent-row" onClick={() => onNav(p.slug)}>
              <div className="recent-type">{window.AB_UTILS.typeLabel(p.type)}</div>
              <div className="recent-body">
                <div className="recent-title">{p.title}</div>
                {p.course && <div className="recent-course">{p.course}</div>}
              </div>
              <div className="recent-age">{relDate(p.updated)}</div>
            </div>
          ))}
        </div>
      </HudCard>
    );
  }

  // ---- UOIG Financials Holdings ---------------------------------------------
  function HoldingsCard({ holdings }) {
    const fmtAge = (h) => h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
    const thesisLabel = { intact: "INTACT", watch: "WATCH", revise: "REVISE", broken: "BROKEN" };
    const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0);
    const intactCount = holdings.filter(h => h.thesis === "intact").length;
    return (
      <HudCard className="holdings-card" label="UOIG Financials · Holdings" meta={`${holdings.length} NAMES · ${intactCount}/${holdings.length} INTACT · ${totalWeight.toFixed(1)}% WT`}>
        <div className="hold-list">
          {holdings.map(h => {
            const up = h.changePct >= 0;
            const sinceUp = h.sinceEntryPct >= 0;
            return (
              <div key={h.ticker} className="hold-row">
                <div className="hold-ident">
                  <div className="hold-ticker">{h.ticker}</div>
                  <div className="hold-name">{h.name}</div>
                  <div className="hold-weight">{h.weight.toFixed(1)}% wt</div>
                </div>
                <div className="hold-perf">
                  <div className="hold-price">{h.price.toFixed(2)}</div>
                  <div className={"hold-delta " + (up ? "mkt-delta--up" : "mkt-delta--down")}>
                    {up ? "▲" : "▼"} {Math.abs(h.changePct).toFixed(2)}%
                  </div>
                  <div className={"hold-since " + (sinceUp ? "hold-since--up" : "hold-since--down")}>
                    Since entry: {sinceUp ? "+" : ""}{h.sinceEntryPct.toFixed(1)}%
                  </div>
                </div>
                <div className={"hold-thesis hold-thesis--" + h.thesis}>
                  <div className="hold-thesis-chip">
                    <span className="hold-thesis-dot"></span>
                    {thesisLabel[h.thesis]}
                  </div>
                  <div className="hold-thesis-note">{h.thesisNote}</div>
                </div>
                <div className="hold-news">
                  <div className="hold-news-head">
                    <span className="hold-news-source">{h.news.source}</span>
                    <span className="hold-news-age">{fmtAge(h.news.ageHours)} ago</span>
                  </div>
                  <div className="hold-news-headline">{h.news.headline}</div>
                </div>
              </div>
            );
          })}
        </div>
      </HudCard>
    );
  }

  // ---- Claude Skills --------------------------------------------------------
  function ClaudeSkillsCard({ skills }) {
    const max = Math.max(1, ...skills.map(s => s.uses));
    const fmtAge = (d) => d === 0 ? "today" : d === 1 ? "1d ago" : `${d}d ago`;
    return (
      <HudCard label="Claude Skills" meta="TOP 5 · 30D" className="skills-card">
        <div className="skills-list">
          {skills.map(s => (
            <div key={s.name} className="skill-row" title={`/${s.name} · ${s.uses} invocations · last used ${fmtAge(s.lastUsedDaysAgo)}`}>
              <div className="skill-name">
                <span className="skill-slash">/</span>{s.name}
              </div>
              <div className="skill-bar-wrap">
                <div className="skill-bar" style={{ width: `${(s.uses / max) * 100}%` }}/>
              </div>
              <div className="skill-uses">{s.uses}</div>
            </div>
          ))}
        </div>
      </HudCard>
    );
  }

  // ---- Vault Vitals ---------------------------------------------------------
  function VaultVitalsCard({ pages, growth, activity, onNav }) {
    const visible = pages.filter(p => !p.hidden).length;
    const maxWeek = Math.max(1, ...growth.weekly);
    const last14 = growth.weekly.slice(-14);
    const typeEntries = Object.entries(growth.typeCounts || {}).sort((a, b) => b[1] - a[1]);
    const sectionEntries = Object.entries(growth.sectionCounts || {}).sort((a, b) => b[1] - a[1]);
    const typeMax = Math.max(1, ...typeEntries.map(([, n]) => n));
    const sectionMax = Math.max(1, ...sectionEntries.map(([, n]) => n));
    return (
      <HudCard label="Vault Vitals" meta={<span className="chip chip--live">LIVE</span>}>
        <div className="vault-topline">
          <div className="vault-topline-main">
            <div className="vault-big">
              <span className="vault-big-num">{visible}</span>
              <span className="vault-big-unit">PAGES</span>
            </div>
            <div className="vault-topline-subs">
              <div><strong>{growth.linkCount}</strong> links</div>
              <div><strong>{growth.orphans}</strong> orphans</div>
            </div>
          </div>
          <div className="vault-growth">
            <div className="vault-growth-row">
              <span className="vault-growth-num">+{growth.thisWeek}</span>
              <span className="vault-growth-lbl">this week</span>
            </div>
            <div className="vault-growth-row">
              <span className="vault-growth-num">+{growth.thisMonth}</span>
              <span className="vault-growth-lbl">this month</span>
            </div>
          </div>
        </div>

        <div className="vault-section">
          <div className="vault-section-head">Activity · 60 days</div>
          <ActivityHeatmap activity={activity} />
        </div>

        <div className="vault-section">
          <div className="vault-section-head">Pages per week · 14 weeks</div>
          <div className="vault-spark" aria-hidden>
            {last14.map((v, i) => (
              <div key={i} className="vault-spark-bar" data-current={i === last14.length - 1 || undefined} style={{ height: `${Math.max(6, (v / maxWeek) * 100)}%` }}/>
            ))}
          </div>
          <div className="vault-spark-axis"><span>14w ago</span><span>now</span></div>
        </div>

        <div className="vault-section">
          <div className="vault-section-head">By type</div>
          <div className="vault-bars">
            {typeEntries.map(([t, n]) => (
              <div key={t} className="vault-bar-row">
                <div className="vault-bar-label">{window.AB_UTILS.typeLabel(t)}</div>
                <div className="vault-bar-wrap">
                  <div className="vault-bar-fill" style={{ width: `${(n / typeMax) * 100}%`, background: `var(--type-color-${t}, var(--accent))` }}/>
                </div>
                <div className="vault-bar-num">{n}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vault-section">
          <div className="vault-section-head">By section</div>
          <div className="vault-bars">
            {sectionEntries.map(([s, n]) => (
              <div key={s} className="vault-bar-row">
                <div className="vault-bar-label">{s}</div>
                <div className="vault-bar-wrap">
                  <div className="vault-bar-fill" style={{ width: `${(n / sectionMax) * 100}%`, background: window.AB_UTILS.courseColor(s) }}/>
                </div>
                <div className="vault-bar-num">{n}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vault-section">
          <div className="vault-section-head">Most connected</div>
          <div className="vault-hubs">
            {(growth.topHubs || []).map(h => (
              <div key={h.slug} className="vault-hub-row" onClick={() => onNav?.(h.slug)}>
                <div className="vault-hub-title">{h.title}</div>
                <div className="vault-hub-deg">{h.degree}</div>
              </div>
            ))}
          </div>
        </div>
      </HudCard>
    );
  }

  function ActivityHeatmap({ activity }) {
    // activity: array of 60 numbers 0-4
    return (
      <div>
        <div className="heatmap">
          {activity.map((v, i) => (
            <div key={i} className="heat-cell" data-v={v} title={`${60 - i}d ago · ${v * 2} changes`}></div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", marginTop: 4 }}>
          <span>60d ago</span>
          <span>30d</span>
          <span>Today</span>
        </div>
      </div>
    );
  }

  // ====== QUEUE ======
  function Queue({ data, onNav, onIngest }) {
    const { queue, todos, assignments } = data;

    const raw = queue.filter(q => q.status === "raw");
    const processing = queue.filter(q => q.status === "processing");
    const openTodos = todos.filter(t => !t.done);
    const doneTodos = todos.filter(t => t.done);
    const [showDone, setShowDone] = useState(false);

    const upcomingAssignments = [...assignments]
      .filter(a => daysBetween(a.due, TODAY) >= -2)
      .sort((a, b) => a.due.localeCompare(b.due));

    return (
      <>
        <div className="queue-head">
          <h1>Queue</h1>
          <div className="subtitle">What needs ingesting, what's due, what to finish.</div>
        </div>
        <div className="queue-body">
          <div>
            <div className="queue-section">
              <h2>Inbox <span className="count-pill">{raw.length} raw</span></h2>
              <div className="hint">Captures from class, readings, and the commonplace book. Skim, tag, and promote.</div>
              {raw.map(item => (
                <div key={item.id} className="raw-item">
                  <div className="raw-icon">{item.kind.toUpperCase().slice(0,3)}</div>
                  <div className="raw-meta">
                    <div className="raw-path">{item.path}</div>
                    <div className="raw-sub">{item.hint}</div>
                    <div className="raw-tags">
                      <span>{item.captured}</span>
                      <span>·</span>
                      <span>{item.size}</span>
                      {item.source && <><span>·</span><span>from {item.source}</span></>}
                    </div>
                  </div>
                  <div className="raw-action">
                    <button className="btn primary" onClick={() => onIngest(item.id)}>Ingest</button>
                    <button className="btn">Skip</button>
                  </div>
                </div>
              ))}
              {processing.length > 0 && (
                <>
                  <h2 style={{ marginTop: 24 }}>In progress <span className="count-pill">{processing.length}</span></h2>
                  {processing.map(item => (
                    <div key={item.id} className="raw-item" style={{ borderColor: "var(--accent-soft)" }}>
                      <div className="raw-icon" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent-ink)" }}>{item.kind.toUpperCase().slice(0,3)}</div>
                      <div className="raw-meta">
                        <div className="raw-path">{item.path}</div>
                        <div className="raw-sub">{item.hint}</div>
                        <div className="raw-tags">
                          <span>{item.captured}</span>
                          <span>·</span>
                          <span style={{ color: "var(--accent-ink)" }}>{item.progress} drafted</span>
                        </div>
                      </div>
                      <div className="raw-action">
                        <button className="btn primary" onClick={() => item.target && onNav(item.target)}>Continue →</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div>
            <div className="queue-section">
              <h2>Due soon <span className="count-pill">{upcomingAssignments.length}</span></h2>
              <div className="hint">Assignments, exams, and deliverables across all classes.</div>
              {upcomingAssignments.map(a => {
                const d = daysBetween(a.due, TODAY);
                const dt = new Date(a.due + "T00:00:00");
                return (
                  <div key={a.id} className="assignment-item" onClick={() => onNav(a.page)}>
                    <div className="date-tile">
                      <div className="month">{dt.toLocaleDateString("en-US", { month: "short" })}</div>
                      <div className="day">{dt.getDate()}</div>
                      <div className="dow">{dt.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    </div>
                    <div>
                      <div className="a-course">{a.course}</div>
                      <div className="a-title">{a.title}</div>
                      <div className={"days-away" + (d <= 1 ? " urgent" : "")}>
                        {d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : d === 1 ? "Due tomorrow" : `In ${d} days`}
                      </div>
                    </div>
                    <div className="a-points">
                      {a.points ? <>{a.points}<span className="pts">pts</span></> : <span style={{ color: "var(--ink-dim)" }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="queue-section">
              <h2>Todos <span className="count-pill">{openTodos.length} open</span></h2>
              <div className="hint">Pulled from <code>&gt; [!todo]</code> callouts across your notes.</div>
              <div style={{ background: "var(--bg-raised)", border: "1px solid var(--rule)", borderRadius: 6 }}>
                {openTodos.map(t => (
                  <div key={t.id} className="todo-item" onClick={() => onNav(t.page)}>
                    <span className="todo-check" onClick={(e) => e.stopPropagation()}></span>
                    <div>
                      <div className="todo-text">{t.text}</div>
                      <div className="todo-page" style={{ marginTop: 2 }}>{t.pageTitle}{t.course ? ` · ${t.course}` : ""}</div>
                    </div>
                    {t.due && <span className={"todo-due" + (daysBetween(t.due, TODAY) <= 2 ? " urgent" : daysBetween(t.due, TODAY) <= 5 ? " soon" : "")}>{relDate(t.due)}</span>}
                  </div>
                ))}
                <div style={{ padding: "8px 12px", borderTop: "1px solid var(--rule)", fontSize: 12, color: "var(--ink-dim)" }}>
                  <button onClick={() => setShowDone(s => !s)} style={{ color: "var(--ink-soft)" }}>
                    {showDone ? "Hide" : "Show"} {doneTodos.length} completed
                  </button>
                </div>
                {showDone && doneTodos.map(t => (
                  <div key={t.id} className="todo-item done" onClick={() => onNav(t.page)}>
                    <span className="todo-check">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 5 L4 8 L9 2" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <div>
                      <div className="todo-text">{t.text}</div>
                      <div className="todo-page" style={{ marginTop: 2 }}>{t.pageTitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return { Home, Queue, Uoig };
})();
