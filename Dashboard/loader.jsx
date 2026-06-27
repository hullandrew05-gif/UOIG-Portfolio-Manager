// Runtime loader that fetches wiki markdown files and populates window.AB_DATA.pages.
// Mounts a minimal YAML frontmatter parser — sufficient for the schema in CLAUDE.md:
//   title, type, created, updated, tags: [..], sources: [..], section (optional)
window.AB_LOADER = (function () {
  // Known sections — used as a fallback when frontmatter lacks an explicit `section:` field.
  // Matches tags case-insensitively.
  const KNOWN_SECTIONS = {
    ba365: "BA365",
    mgmt335: "MGMT335",
    uoig: "UOIG",
    recipes: "Recipes",
    recipe: "Recipes",
    personal: "Personal",
  };

  // Map folder → type when frontmatter omits it.
  const FOLDER_TO_TYPE = {
    concepts: "concept",
    entities: "entity",
    sources: "source",
    analyses: "analysis",
    journal: "journal",
    sections: "course", // keep internal type value for color/styling parity
    courses: "course",
  };

  function parseYamlValue(raw) {
    let v = raw.trim();
    if (v === "") return "";
    // Inline array: [a, "b", 'c']
    if (v.startsWith("[") && v.endsWith("]")) {
      const inner = v.slice(1, -1).trim();
      if (!inner) return [];
      // Split on commas not inside quotes
      const parts = [];
      let buf = "";
      let quote = null;
      for (const ch of inner) {
        if (quote) {
          if (ch === quote) quote = null;
          else buf += ch;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        } else if (ch === ",") {
          parts.push(buf.trim());
          buf = "";
        } else {
          buf += ch;
        }
      }
      if (buf.trim()) parts.push(buf.trim());
      return parts.map(p => p.replace(/^["']|["']$/g, ""));
    }
    // Quoted scalar
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    return v;
  }

  function parseFrontmatter(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { meta: {}, body: text };
    const meta = {};
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!kv) continue;
      meta[kv[1]] = parseYamlValue(kv[2]);
    }
    return { meta, body: m[2] };
  }

  function inferSection(meta, tags) {
    if (meta.section) return meta.section;
    for (const t of tags) {
      const key = String(t).toLowerCase();
      if (KNOWN_SECTIONS[key]) return KNOWN_SECTIONS[key];
    }
    return null;
  }

  function normalizeSources(raw) {
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : [raw];
    return list
      .map(s => String(s).replace(/^\[\[|\]\]$/g, "").trim())
      .filter(Boolean);
  }

  async function loadOne(relpath) {
    const resp = await fetch("/wiki/" + relpath);
    if (!resp.ok) throw new Error(`${relpath}: ${resp.status}`);
    const text = await resp.text();
    const { meta, body } = parseFrontmatter(text);
    const parts = relpath.split("/");
    const folder = parts.length > 1 ? parts[0] : null;
    const filename = parts[parts.length - 1];
    const slug = filename.replace(/\.md$/, "");
    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
    return {
      slug,
      title: meta.title || slug,
      type: meta.type || FOLDER_TO_TYPE[folder] || "concept",
      course: inferSection(meta, tags),
      tags,
      sources: normalizeSources(meta.sources),
      created: meta.created || meta.updated || "1970-01-01",
      updated: meta.updated || meta.created || "1970-01-01",
      body: body.replace(/^\s+|\s+$/g, ""),
    };
  }

  async function loadAll() {
    const manifest = window.AB_MANIFEST || [];
    const settled = await Promise.allSettled(manifest.map(loadOne));
    const pages = [];
    for (const r of settled) {
      if (r.status === "fulfilled") pages.push(r.value);
      else console.warn("loader:", r.reason);
    }
    // Preserve every other field on AB_DATA — seed provides queue/todos/assignments/activity
    // plus any widget mocks (calendarEvents, inbox, nowPlaying, activeProject).
    window.AB_DATA = window.AB_DATA || {};
    window.AB_DATA.pages = pages;
    if (!Array.isArray(window.AB_DATA.activity)) window.AB_DATA.activity = [];
    // Derive edges from body wikilinks (used by growth/hub stats)
    const WL = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    const slugs = new Set(pages.map(p => p.slug));
    const edges = [];
    for (const p of pages) {
      WL.lastIndex = 0;
      let m;
      while ((m = WL.exec(p.body)) !== null) {
        const target = m[1].trim().toLowerCase().replace(/\s+/g, "-");
        if (slugs.has(target) && target !== p.slug) {
          edges.push({ source: p.slug, target });
        }
      }
    }
    window.AB_DATA.edges = edges;
    return pages;
  }

  return { parseFrontmatter, parseYamlValue, loadOne, loadAll };
})();
