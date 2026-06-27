// Reader view component
window.AB_READER = (function() {
  const { useMemo, useState } = React;
  const { renderMarkdown, outline, relDate } = window.AB_UTILS;

  // Lucide-style inline icons used in the Properties block
  const Icon = ({ kind }) => {
    const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
    switch (kind) {
      case "text":     return <svg {...common}><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>;
      case "date":     return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
      case "calendarSm": return <svg {...common} width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
      case "tag":      return <svg {...common}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
      case "list":     return <svg {...common}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
      case "link":     return <svg {...common} width="11" height="11"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71"/></svg>;
      case "plus":     return <svg {...common}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
      default:         return null;
    }
  };

  function Reader({ page, index, backlinks, outlinks, onNav, onBack }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(page.body);
    const [saveState, setSaveState] = useState(null); // null | 'saving' | 'saved' | 'error'
    const [saveMsg, setSaveMsg] = useState("");

    // Reset draft when the page changes.
    React.useEffect(() => {
      setDraft(page.body);
      setEditing(false);
      setSaveState(null);
    }, [page.slug]);

    const content = useMemo(() => renderMarkdown(editing ? draft : page.body, index, onNav), [editing, draft, page, index]);
    const heads = useMemo(() => outline(page.body), [page]);
    const bl = (backlinks[page.slug] || []).map(s => index[s]).filter(Boolean);
    const ol = (outlinks[page.slug] || []).map(s => index[s]).filter(Boolean);

    const save = async () => {
      setSaveState("saving");
      try {
        const resp = await fetch("/api/pages/" + encodeURIComponent(page.slug), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body: draft }),
        });
        if (!resp.ok) throw new Error(await resp.text());
        // Mutate the in-memory page so the reader reflects the new body without a full reload.
        page.body = draft;
        page.updated = new Date().toISOString().slice(0, 10);
        setSaveState("saved");
        setSaveMsg("Saved to " + (await resp.json()).path);
        setEditing(false);
        setTimeout(() => setSaveState(null), 2500);
      } catch (e) {
        setSaveState("error");
        setSaveMsg(String(e.message || e));
      }
    };

    const cancel = () => { setDraft(page.body); setEditing(false); setSaveState(null); };

    const typeMap = {
      course: "Section", concept: "Concept", entity: "Person / Entity",
      source: "Source", analysis: "Analysis", journal: "Journal", assignment: "Assignment"
    };

    const fmtDate = (iso) => {
      if (!iso) return "";
      const [y, m, d] = iso.split("-");
      return `${m}/${d}/${y}`;
    };
    const sources = (page.sources || []).map(s => {
      const slug = String(s).replace(/^\[\[|\]\]$/g, "").trim();
      return { slug, page: index[slug] };
    });

    return (
      <div className="reader">
        <div className="reader-breadcrumb">
          <button className="back" onClick={onBack}>← Library</button>
          <span className="crumb-sep">/</span>
          <span>{typeMap[page.type] || page.type}</span>
          {page.course && <><span className="crumb-sep">/</span><span>{page.course}</span></>}
          <span className="crumb-sep">/</span>
          <span>{page.slug}.md</span>
          <span style={{ flex: 1 }}/>
          {!editing && (
            <button className="back reader-edit-btn" onClick={() => setEditing(true)}>Edit</button>
          )}
          {editing && (
            <>
              <button className="back reader-edit-btn" onClick={cancel}>Cancel</button>
              <button className="back reader-edit-btn reader-edit-btn--primary" onClick={save} disabled={saveState === "saving"}>
                {saveState === "saving" ? "Saving…" : "Save"}
              </button>
            </>
          )}
          {saveState === "saved" && <span className="reader-save-flash">{saveMsg}</span>}
          {saveState === "error" && <span className="reader-save-flash reader-save-flash--error">{saveMsg}</span>}
        </div>

        <h1 className="properties-heading">{page.slug}</h1>
        <div className="properties">
          <div className="property">
            <span className="property-label"><Icon kind="text" /> title</span>
            <span className="property-value">{page.title}</span>
          </div>
          <div className="property">
            <span className="property-label"><Icon kind="text" /> type</span>
            <span className="property-value">{window.AB_UTILS.typeLabel(page.type)}</span>
          </div>
          {page.course && (
            <div className="property">
              <span className="property-label"><Icon kind="text" /> section</span>
              <span className="property-value">{page.course}</span>
            </div>
          )}
          {page.created && (
            <div className="property">
              <span className="property-label"><Icon kind="date" /> created</span>
              <span className="property-value property-value--date">
                <Icon kind="calendarSm" /> {fmtDate(page.created)}
                <span className="property-link-icon"><Icon kind="link" /></span>
              </span>
            </div>
          )}
          {page.updated && (
            <div className="property">
              <span className="property-label"><Icon kind="date" /> updated</span>
              <span className="property-value property-value--date">
                <Icon kind="calendarSm" /> {fmtDate(page.updated)}
                <span className="property-link-icon"><Icon kind="link" /></span>
              </span>
            </div>
          )}
          {page.tags && page.tags.length > 0 && (
            <div className="property">
              <span className="property-label"><Icon kind="tag" /> tags</span>
              <span className="property-value property-tags">
                {page.tags.map(t => (
                  <span key={t} className="property-tag">{t}<span className="property-tag-x">×</span></span>
                ))}
              </span>
            </div>
          )}
          {sources.length > 0 && (
            <div className="property">
              <span className="property-label"><Icon kind="list" /> sources</span>
              <span className="property-value property-sources">
                {sources.map(({ slug, page: p }) => (
                  <span key={slug} className="property-source">
                    <span className="wikilink" onClick={() => p && onNav(slug)}>{p ? p.title : slug}</span>
                    <span className="property-tag-x">×</span>
                  </span>
                ))}
              </span>
            </div>
          )}
          <div className="property property-add">
            <span className="property-label"><Icon kind="plus" /> Add property</span>
          </div>
        </div>

        {editing ? (
          <textarea
            className="reader-editor"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            autoFocus
          />
        ) : content}

        {/* Links section */}
        {(ol.length > 0 || bl.length > 0) && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--rule)" }}>
            {ol.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3>Links to</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13 }}>
                  {ol.map(p => (
                    <span key={p.slug} className="wikilink" onClick={() => onNav(p.slug)}>{p.title}</span>
                  ))}
                </div>
              </div>
            )}
            {bl.length > 0 && (
              <div>
                <h3>Backlinks ({bl.length})</h3>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>
                  {bl.map(p => (
                    <div key={p.slug} style={{ padding: "6px 0", borderBottom: "1px dotted var(--rule)" }}>
                      <span className="wikilink" onClick={() => onNav(p.slug)}>{p.title}</span>
                      <span style={{ color: "var(--ink-dim)", marginLeft: 8, fontSize: 11.5, fontFamily: "var(--font-mono)" }}>
                        {window.AB_UTILS.typeLabel(p.type)} · {relDate(p.updated)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function ReaderRail({ page, index, backlinks, outlinks, onNav }) {
    const heads = outline(page.body);
    const bl = (backlinks[page.slug] || []).map(s => index[s]).filter(Boolean).slice(0, 8);
    const ol = (outlinks[page.slug] || []).map(s => index[s]).filter(Boolean).slice(0, 10);

    return (
      <>
        <h4>Properties</h4>
        <div className="rail-block" style={{ padding: 0, background: "transparent", border: 0 }}>
          <div className="field">
            <div className="field-label">type</div>
            <div>{page.type}</div>
          </div>
          {page.course && (
            <div className="field">
              <div className="field-label">course</div>
              <div>{page.course}</div>
            </div>
          )}
          <div className="field">
            <div className="field-label">updated</div>
            <div>{relDate(page.updated)} · <span style={{ color: "var(--ink-dim)" }}>{page.updated}</span></div>
          </div>
          {page.tags && page.tags.length > 0 && (
            <div className="field">
              <div className="field-label">tags</div>
              <div>{page.tags.map(t => <span key={t} className="rail-tag">#{t}</span>)}</div>
            </div>
          )}
        </div>

        {heads.length > 0 && (
          <>
            <h4 style={{ marginTop: 18 }}>On this page</h4>
            <div className="rail-outline">
              {heads.map((h, i) => (
                <a key={i} className={"h" + h.level} onClick={() => {
                  const el = document.getElementById(h.id);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}>{h.text}</a>
              ))}
            </div>
          </>
        )}

        {ol.length > 0 && (
          <>
            <h4 style={{ marginTop: 18 }}>Links ({ol.length})</h4>
            <div>
              {ol.map(p => (
                <div key={p.slug} className="rail-link" onClick={() => onNav(p.slug)}>
                  <span className="rl-type">{window.AB_UTILS.typeLabel(p.type).slice(0, 4)}</span>
                  <span>{p.title}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {bl.length > 0 && (
          <>
            <h4 style={{ marginTop: 18 }}>Backlinks ({(window.AB_DATA.backlinks[page.slug] || []).length})</h4>
            <div>
              {bl.map(p => (
                <div key={p.slug} className="rail-link" onClick={() => onNav(p.slug)}>
                  <span className="rl-type">{window.AB_UTILS.typeLabel(p.type).slice(0, 4)}</span>
                  <span>{p.title}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  return { Reader, ReaderRail };
})();
