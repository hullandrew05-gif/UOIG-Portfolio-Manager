// Markdown renderer + helpers
// Supports: headings, paragraphs, lists, tables, blockquotes, callouts, code, bold, italic, wikilinks

window.AB_UTILS = (() => {
  const bySlug = (pages) => Object.fromEntries(pages.map(p => [p.slug, p]));

  // Find wikilinks [[slug]] or [[slug|label]]
  const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  function slugExists(slug, index) { return !!index[slug]; }

  // Collect backlinks: which pages link TO this slug
  function buildBacklinks(pages) {
    const bl = {};
    pages.forEach(p => {
      const matches = [...p.body.matchAll(WIKILINK_RE)];
      matches.forEach(m => {
        const target = m[1].trim();
        if (target === p.slug) return;
        (bl[target] = bl[target] || new Set()).add(p.slug);
      });
    });
    return Object.fromEntries(Object.entries(bl).map(([k, v]) => [k, [...v]]));
  }

  // Collect outgoing links per page (unique)
  function buildOutlinks(pages) {
    const ol = {};
    pages.forEach(p => {
      const set = new Set();
      [...p.body.matchAll(WIKILINK_RE)].forEach(m => {
        const t = m[1].trim();
        if (t !== p.slug) set.add(t);
      });
      ol[p.slug] = [...set];
    });
    return ol;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Inline formatting: bold, italic, code, wikilinks
  function inline(text, index, onNav) {
    // We'll tokenize in a single pass.
    const parts = [];
    let remaining = text;
    // Handle wikilinks first by splitting
    let i = 0;
    let match;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(text)) !== null) {
      if (match.index > i) parts.push({ t: "str", v: text.slice(i, match.index) });
      const slug = match[1].trim();
      const label = (match[2] || slug).trim();
      parts.push({ t: "link", slug, label });
      i = match.index + match[0].length;
    }
    if (i < text.length) parts.push({ t: "str", v: text.slice(i) });

    return parts.map((p, idx) => {
      if (p.t === "link") {
        const exists = slugExists(p.slug, index);
        const labelText = p.label.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        return (
          <span
            key={idx}
            className={"wikilink" + (exists ? "" : " broken")}
            onClick={(e) => { e.stopPropagation(); if (exists) onNav(p.slug); }}
            title={exists ? p.slug : `Missing: ${p.slug}`}
          >
            {p.label === p.slug ? labelText : p.label}
          </span>
        );
      }
      // parse bold/italic/code on string chunks
      return <InlineFormat key={idx} text={p.v} />;
    });
  }

  function InlineFormat({ text }) {
    // code first, then **bold**, then *italic*
    // Build segments recursively
    const CODE = /`([^`]+)`/;
    const BOLD = /\*\*([^*]+)\*\*/;
    const ITAL = /\*([^*]+)\*|_([^_]+)_/;

    const parseCode = (s) => {
      const out = [];
      let rest = s;
      while (true) {
        const m = rest.match(CODE);
        if (!m) { out.push({ t: "text", v: rest }); break; }
        const idx = m.index;
        if (idx > 0) out.push({ t: "text", v: rest.slice(0, idx) });
        out.push({ t: "code", v: m[1] });
        rest = rest.slice(idx + m[0].length);
      }
      return out;
    };
    const parseBold = (s) => {
      const out = [];
      let rest = s;
      while (true) {
        const m = rest.match(BOLD);
        if (!m) { out.push({ t: "text", v: rest }); break; }
        const idx = m.index;
        if (idx > 0) out.push({ t: "text", v: rest.slice(0, idx) });
        out.push({ t: "bold", v: m[1] });
        rest = rest.slice(idx + m[0].length);
      }
      return out;
    };
    const parseItal = (s) => {
      const out = [];
      let rest = s;
      while (true) {
        const m = rest.match(ITAL);
        if (!m) { out.push({ t: "text", v: rest }); break; }
        const idx = m.index;
        if (idx > 0) out.push({ t: "text", v: rest.slice(0, idx) });
        out.push({ t: "ital", v: m[1] || m[2] });
        rest = rest.slice(idx + m[0].length);
      }
      return out;
    };

    const render = (nodes, key = "") => nodes.map((n, i) => {
      const k = key + i;
      if (n.t === "text") return <React.Fragment key={k}>{n.v}</React.Fragment>;
      if (n.t === "code") return <code key={k}>{n.v}</code>;
      if (n.t === "bold") return <strong key={k}>{render(parseItal(n.v), k + "b")}</strong>;
      if (n.t === "ital") return <em key={k}>{n.v}</em>;
      return null;
    });

    // Pipeline: split on code first, then for text chunks split on bold, then italic
    const codeNodes = parseCode(text);
    const expanded = codeNodes.flatMap((n, i) => {
      if (n.t !== "text") return [n];
      return parseBold(n.v).flatMap((b, j) => {
        if (b.t !== "text") return [b];
        return parseItal(b.v);
      });
    });
    return <>{render(expanded)}</>;
  }

  // Block parser: returns array of block elements
  function renderMarkdown(md, index, onNav) {
    const lines = md.split("\n");
    const blocks = [];
    let i = 0;

    const flushPara = (buf) => {
      if (buf.length) blocks.push({ t: "p", text: buf.join(" ") });
    };

    while (i < lines.length) {
      const line = lines[i];
      // Heading
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { blocks.push({ t: "h", level: h[1].length, text: h[2] }); i++; continue; }

      // Horizontal rule
      if (/^---+\s*$/.test(line)) { blocks.push({ t: "hr" }); i++; continue; }

      // Callout: > [!kind] ...
      const callout = line.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
      if (callout) {
        const kind = callout[1].toLowerCase();
        const lines2 = [callout[2]];
        i++;
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          lines2.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        blocks.push({ t: "callout", kind, text: lines2.join("\n") });
        continue;
      }
      // Normal blockquote
      if (/^>\s?/.test(line)) {
        const lines2 = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          lines2.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        blocks.push({ t: "blockquote", text: lines2.join(" ") });
        continue;
      }

      // Table: line with | and next line all dashes/pipes
      if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s:\-|]*$/.test(lines[i + 1])) {
        const header = line.split("|").map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1 || s);
        // re-split cleanly
        const parse = (s) => s.split("|").map(x => x.trim()).filter((x, idx, arr) => !(idx === 0 && x === "") && !(idx === arr.length - 1 && x === ""));
        const head = parse(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|")) {
          rows.push(parse(lines[i]));
          i++;
        }
        blocks.push({ t: "table", head, rows });
        continue;
      }

      // List
      if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        const items = [];
        const ordered = /^\s*\d+\.\s+/.test(line);
        while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
          items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
          i++;
        }
        blocks.push({ t: ordered ? "ol" : "ul", items });
        continue;
      }

      // Blank line
      if (/^\s*$/.test(line)) { i++; continue; }

      // Paragraph — merge consecutive non-blank, non-block lines
      const buf = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) && !/^>/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s:\-|]*$/.test(lines[i + 1]))) {
        buf.push(lines[i]);
        i++;
      }
      flushPara(buf);
    }

    return blocks.map((b, idx) => {
      switch (b.t) {
        case "h": {
          const Tag = `h${b.level}`;
          const id = b.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          return <Tag key={idx} id={id} data-heading={b.level}>{inline(b.text, index, onNav)}</Tag>;
        }
        case "p":
          return <p key={idx}>{inline(b.text, index, onNav)}</p>;
        case "hr":
          return <hr key={idx} />;
        case "ul":
          return <ul key={idx}>{b.items.map((it, j) => <li key={j}>{inline(it, index, onNav)}</li>)}</ul>;
        case "ol":
          return <ol key={idx}>{b.items.map((it, j) => <li key={j}>{inline(it, index, onNav)}</li>)}</ol>;
        case "blockquote":
          return <blockquote key={idx}>{inline(b.text, index, onNav)}</blockquote>;
        case "callout":
          return (
            <div key={idx} className="callout" data-kind={b.kind}>
              <span className="callout-kind">{b.kind}</span>
              {b.text.split("\n").map((ln, j) => <div key={j}>{inline(ln, index, onNav)}</div>)}
            </div>
          );
        case "table":
          return (
            <table key={idx}>
              <thead><tr>{b.head.map((h, j) => <th key={j}>{inline(h, index, onNav)}</th>)}</tr></thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c, index, onNav)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          );
        default: return null;
      }
    });
  }

  // Extract first non-heading paragraph as excerpt
  function excerpt(body, maxLen = 140) {
    const lines = body.split("\n");
    for (const l of lines) {
      const t = l.trim();
      if (!t) continue;
      if (/^#{1,6}\s/.test(t)) continue;
      if (/^[>\-*|]/.test(t)) continue;
      if (/^\*\*.*\*\*\s*(·|$)/.test(t)) continue;  // skip bold metadata lines
      const clean = t.replace(/\[\[[^\]|]+\|?([^\]]*)\]\]/g, (_, a) => a || _).replace(/[*_`]/g, "");
      if (clean.length > 20) return clean.slice(0, maxLen) + (clean.length > maxLen ? "…" : "");
    }
    return "";
  }

  // Outline: headings in a body
  function outline(body) {
    const lines = body.split("\n");
    const heads = [];
    lines.forEach(l => {
      const m = l.match(/^(#{1,6})\s+(.*)$/);
      if (m && m[1].length >= 2 && m[1].length <= 3) {
        const text = m[2];
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        heads.push({ level: m[1].length, text, id });
      }
    });
    return heads;
  }

  // Relative date formatting
  function relDate(iso, todayIso = "2026-04-22") {
    const d = new Date(iso + "T00:00:00");
    const t = new Date(todayIso + "T00:00:00");
    const days = Math.round((d - t) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 0 && days <= 7) return `In ${days}d`;
    if (days < 0 && days >= -7) return `${-days}d ago`;
    if (days < 0 && days >= -30) return `${Math.abs(Math.round(days/7))}w ago`;
    if (days > 0) return `In ${Math.round(days/7)}w`;
    return iso.slice(5);
  }

  function fmtDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function courseColor(course) {
    // Stable hash → oklch hue
    if (!course) return "var(--ink-faint)";
    let h = 0;
    for (let i = 0; i < course.length; i++) h = (h * 31 + course.charCodeAt(i)) % 360;
    return `oklch(60% 0.1 ${h})`;
  }

  function typeLabel(t) {
    if (t === "course") return "section";
    return t;
  }

  return { buildBacklinks, buildOutlinks, bySlug, renderMarkdown, excerpt, outline, relDate, fmtDate, courseColor, typeLabel, WIKILINK_RE };
})();
