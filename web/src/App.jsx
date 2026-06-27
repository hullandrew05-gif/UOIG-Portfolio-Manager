import React from 'react'
import { getData, getSeries, getFundSeries, postChat } from './api.js'

// Parse a design CSS string into a React style object (keeps styles verbatim).
function s(css) {
  const o = {}
  String(css).split(';').forEach((d) => {
    const i = d.indexOf(':')
    if (i < 0) return
    const k = d.slice(0, i).trim()
    if (!k) return
    o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = d.slice(i + 1).trim()
  })
  return o
}

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.mainRef = React.createRef()
    this.chatRef = React.createRef()
    this.state = {
      data: null, error: null,
      view: 'dashboard', fund: null, period: 'YTD',
      ticker: null, sector: null, prevView: 'dashboard',
      sortKey: 'w', sortDir: 'desc', query: '',
      chat: [], input: '', loading: false,
      series: {},  // cache: key -> {dates, values/close, ...}
    }
  }

  componentDidMount() {
    getData()
      .then((data) => {
        const keys = Object.keys(data.funds)
        this.setState({ data, fund: keys[0] || 'all' }, this._ensureSeries)
      })
      .catch(() => this.setState({ error: 'Could not reach the API. Is the backend running on :8000?' }))
  }

  componentDidUpdate(_p, prev) {
    if (prev.view !== this.state.view && this.mainRef.current) this.mainRef.current.scrollTop = 0
    if (prev.view !== this.state.view || prev.fund !== this.state.fund ||
        prev.period !== this.state.period || prev.ticker !== this.state.ticker) this._ensureSeries()
    const pl = (prev.chat && prev.chat.length) || 0
    if (this.chatRef.current && (pl !== this.state.chat.length || prev.loading !== this.state.loading))
      this.chatRef.current.scrollTop = this.chatRef.current.scrollHeight
  }

  // ---------- data shaping ----------
  get funds() {
    const out = {}
    const f = this.state.data.funds
    Object.keys(f).forEach((k) => {
      const c = { ...f[k] }
      c.ret = Object.fromEntries(Object.entries(f[k].ret || {}).map(([p, v]) => [p, (v || 0) * 100]))
      c.bret = Object.fromEntries(Object.entries(f[k].bret || {}).map(([p, v]) => [p, (v || 0) * 100]))
      c.tag = f[k].name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
      out[k] = c
    })
    return out
  }
  get fundKeys() { return Object.keys(this.state.data.funds) }
  get allH() { return this.state.data.holdings }
  get byT() { const m = {}; this.allH.forEach((h) => (m[h.t] = h)); return m }
  get total() { return this.fundKeys.reduce((s2, k) => s2 + (this.funds[k].aum || 0), 0) }

  _blend(getter) {
    const t = this.total || 1
    return this.fundKeys.reduce((s2, k) => s2 + (getter(this.funds[k]) || 0) * (this.funds[k].aum || 0), 0) / t
  }
  _aggSectors() {
    const agg = {}
    this.allH.forEach((h) => {
      const a = agg[h.s] || (agg[h.s] = { name: h.s, count: 0, holdings: [], wSum: 0, wret: 0, wByFund: {} })
      a.count++; a.holdings.push(h); a.wSum += h.w; a.wret += h.w * h.mtd
      a.wByFund[h.fund] = (a.wByFund[h.fund] || 0) + h.w
    })
    Object.values(agg).forEach((a) => {
      a.ret = a.wSum ? a.wret / a.wSum : 0
      a.dollar = this.fundKeys.reduce((s2, k) => s2 + (a.wByFund[k] || 0) / 100 * this.funds[k].aum, 0)
      a.share = this.total ? a.dollar / this.total * 100 : 0
    })
    return agg
  }
  _fundSectors(fk) {
    const hs = fk === 'all' ? this.allH : this.allH.filter((h) => h.fund === fk)
    const m = {}; let tot = 0
    hs.forEach((h) => { m[h.s] = (m[h.s] || 0) + h.w; tot += h.w })
    return Object.keys(m).map((name) => ({ name, w: m[name], pct: tot ? m[name] / tot * 100 : 0 }))
      .sort((a, b) => b.w - a.w)
  }

  // ---------- formatting ----------
  _num(n) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
  _sign(x, d) { return (x >= 0 ? '+' : '') + Number(x).toFixed(d === undefined ? 2 : d) }
  _col(x) { return x >= 0 ? '#21d07a' : '#ff5666' }

  // ---------- navigation ----------
  _go(view) { this.setState({ view }) }
  _openStock(t, from) { this.setState({ view: 'stock', ticker: t, prevView: from || this.state.view }) }
  _openSector(name, from) { this.setState({ view: 'sector', sector: name, prevView: from || this.state.view }) }

  // ---------- series fetching ----------
  _ensureSeries() {
    if (!this.state.data) return
    const { view, fund, period, ticker } = this.state
    const need = []
    if (view === 'dashboard') need.push(['fund', fund, period])
    if (view === 'stock' && ticker) {
      need.push(['stk', ticker, period])
      const f = this.byT[ticker]; if (f) need.push(['fund', f.fund, period])
    }
    need.forEach(([kind, id, per]) => {
      const key = `${kind}:${id}:${per}`
      if (this.state.series[key]) return
      const p = kind === 'stk' ? getSeries(id, per)
        : id === 'all' ? Promise.all(this.fundKeys.map((k) => getFundSeries(k, per))).then((arr) => ({ multi: arr }))
          : getFundSeries(id, per)
      p.then((res) => this.setState((st) => ({ series: { ...st.series, [key]: res } }))).catch(() => {})
    })
  }

  // ---------- charts ----------
  _chart(key, lines, h) {
    const w = 900, all = []
    lines.forEach((l) => l.values.forEach((v) => all.push(v)))
    if (!all.length) all.push(0, 1)
    const min = Math.min.apply(null, all), max = Math.max.apply(null, all), span = (max - min) || 1
    const Y = (v) => +(h - 6 - ((v - min) / span) * (h - 12)).toFixed(2)
    const X = (i, n) => +((i / ((n - 1) || 1)) * w).toFixed(2)
    const grid = [0.16, 0.40, 0.66, 0.92].map((f, gi) =>
      React.createElement('line', { key: 'g' + gi, x1: 0, y1: +(h * f).toFixed(1), x2: w, y2: +(h * f).toFixed(1), style: { stroke: '#16203a', strokeWidth: 1 } }))
    const defs = [], paths = []
    lines.forEach((l, li) => {
      const n = l.values.length; if (!n) return
      const d = l.values.map((v, i) => (i ? 'L' : 'M') + X(i, n) + ',' + Y(v)).join(' ')
      if (l.area) {
        const gid = key + '-g' + li
        defs.push(React.createElement('linearGradient', { key: 'd' + li, id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, [
          React.createElement('stop', { key: 'a', offset: '0', style: { stopColor: l.color, stopOpacity: 0.26 } }),
          React.createElement('stop', { key: 'b', offset: '1', style: { stopColor: l.color, stopOpacity: 0 } }),
        ]))
        paths.push(React.createElement('path', { key: 'ar' + li, d: d + (' L' + w + ',' + h + ' L0,' + h + ' Z'), style: { fill: 'url(#' + gid + ')', stroke: 'none' } }))
      }
      paths.push(React.createElement('path', { key: 'ln' + li, d, style: { fill: 'none', stroke: l.color, strokeWidth: l.width || 2, strokeDasharray: l.dash || 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } }))
    })
    return React.createElement('svg', { viewBox: '0 0 ' + w + ' ' + h, preserveAspectRatio: 'none', style: { width: '100%', height: h + 'px', display: 'block' } },
      [React.createElement('defs', { key: 'defs' }, defs)].concat(grid).concat(paths))
  }
  _donut(arr) {
    const cols = ['#5a93f9', '#6aa6ff', '#8ea8f2', '#21d07a', '#f4a531', '#c06fd6']
    const top = arr.slice(0, 5), other = arr.slice(5).reduce((s2, x) => s2 + x.pct, 0)
    const segs = top.map((x, i) => ({ c: cols[i], pct: x.pct })); if (other > 0.1) segs.push({ c: '#3a4a6a', pct: other })
    let acc = 0
    const stops = segs.map((sg) => { const a = acc, b = acc + sg.pct; acc = b; return sg.c + ' ' + a.toFixed(1) + '% ' + b.toFixed(1) + '%' }).join(', ')
    return React.createElement('div', { style: { width: '108px', height: '108px', borderRadius: '50%', background: 'conic-gradient(' + stops + ')', position: 'relative', flex: '0 0 auto' } },
      React.createElement('div', { style: { position: 'absolute', inset: '17px', borderRadius: '50%', background: '#0e1422', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }, [
        React.createElement('span', { key: 'a', style: { fontFamily: "'IBM Plex Mono'", fontSize: '16px', color: '#e8edf7' } }, String(arr.length)),
        React.createElement('span', { key: 'b', style: { fontSize: '8px', color: '#6b7794', textTransform: 'uppercase', letterSpacing: '.06em' } }, 'sectors'),
      ]))
  }
  _icon(name, active) {
    const mk = (children, fill) => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16', style: fill ? { fill: 'currentColor' } : { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } }, children)
    if (name === 'dash') return mk([React.createElement('rect', { key: 1, x: 1, y: 1, width: 6, height: 6, rx: 1 }), React.createElement('rect', { key: 2, x: 9, y: 1, width: 6, height: 6, rx: 1 }), React.createElement('rect', { key: 3, x: 1, y: 9, width: 6, height: 6, rx: 1 }), React.createElement('rect', { key: 4, x: 9, y: 9, width: 6, height: 6, rx: 1 })], true)
    if (name === 'funds') return mk([React.createElement('rect', { key: 1, x: 1, y: 8, width: 3.4, height: 7, rx: 1 }), React.createElement('rect', { key: 2, x: 6.3, y: 4, width: 3.4, height: 11, rx: 1 }), React.createElement('rect', { key: 3, x: 11.6, y: 1, width: 3.4, height: 14, rx: 1 })], true)
    if (name === 'stocks') return mk([React.createElement('polyline', { key: 1, points: '1,11 5.5,6.5 9,9 15,2.5' })], false)
    if (name === 'sectors') return mk([React.createElement('circle', { key: 1, cx: 8, cy: 8, r: 6, style: { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } }), React.createElement('path', { key: 2, d: 'M8 2 A6 6 0 0 1 13.2 8 L8 8 Z', style: { fill: 'currentColor', stroke: 'none' } })], false)
    return null
  }

  // ---------- claude (stub via /api/chat) ----------
  _fmt(text) {
    return String(text).split('\n').map((ln, li) => (
      <span key={li}>
        {ln.split(/(\*\*[^*]+\*\*)/g).map((p, pi) => /^\*\*[^*]+\*\*$/.test(p)
          ? <b key={pi} style={{ color: '#fff', fontWeight: 600 }}>{p.slice(2, -2)}</b> : p)}
        {li < String(text).split('\n').length - 1 ? <br /> : null}
      </span>
    ))
  }
  async _send(text) {
    const q = (text != null ? text : this.state.input).trim()
    if (!q || this.state.loading) return
    const chat = this.state.chat.concat([{ role: 'user', content: q }])
    this.setState({ chat, input: '', loading: true })
    try {
      const res = await postChat(chat)
      this.setState((st) => ({ chat: st.chat.concat([{ role: 'assistant', content: res.reply || '(no response)' }]), loading: false }))
    } catch (e) {
      this.setState((st) => ({ chat: st.chat.concat([{ role: 'assistant', content: '⚠ Could not reach the assistant.' }]), loading: false }))
    }
  }

  _rowVM(h, from) {
    const ctb = (h.w / 100) * h.mtd
    const fund = this.funds[h.fund] || {}
    return {
      t: h.t, n: h.n, s: h.s, fundTag: fund.tag || h.fund, fundColor: fund.color || '#5a93f9',
      wStr: h.w.toFixed(1) + '%', pxStr: this._num(h.px),
      dayStr: this._sign(h.chg) + '%', dayColor: this._col(h.chg),
      mtdStr: this._sign(h.mtd, 1) + '%', mtdColor: this._col(h.mtd),
      peStr: h.pe ? h.pe.toFixed(1) : '—',
      ctbStr: this._sign(ctb, 2), ctbColor: this._col(ctb),
      open: () => this._openStock(h.t, from),
    }
  }

  render() {
    if (this.state.error) return <div style={s('color:#ff5666;font-family:sans-serif;padding:40px;')}>{this.state.error}</div>
    if (!this.state.data) return <div style={s("color:#6b7794;font-family:'IBM Plex Mono';padding:40px;")}>Loading terminal…</div>
    const v = this.renderVals()
    const F = this.funds
    return (
      <div style={s("height:100vh;width:100%;display:flex;flex-direction:column;background:#070a12;color:#e8edf7;font-family:'IBM Plex Sans',sans-serif;overflow:hidden;")}>
        {/* HEADER */}
        <div style={s('height:48px;flex:0 0 48px;display:flex;align-items:center;gap:14px;padding:0 16px;background:#0a0f1a;border-bottom:1px solid #1d2840;')}>
          <div style={s('display:flex;align-items:center;gap:10px;cursor:pointer;')} onClick={() => this._go('dashboard')}>
            <div style={s('width:22px;height:22px;transform:rotate(45deg);background:linear-gradient(135deg,#5a93f9,#3a6fd0);border-radius:5px;')}></div>
            <div style={s("font:600 14px 'IBM Plex Sans';color:#e8edf7;")}>University Endowment <span style={s('color:#5d6a85;font-weight:400;font-size:12.5px;')}>· Investments Office</span></div>
          </div>
          <div onClick={() => this._go('stocks')} style={s('display:flex;align-items:center;gap:8px;background:#0e1422;border:1px solid #1d2840;border-radius:7px;padding:7px 11px;width:320px;margin-left:10px;cursor:pointer;')}>
            <svg width="13" height="13" viewBox="0 0 16 16" style={{ fill: 'none', stroke: '#5d6a85', strokeWidth: 1.6 }}><circle cx="7" cy="7" r="4.5"></circle><line x1="11" y1="11" x2="14.5" y2="14.5" style={{ strokeLinecap: 'round' }}></line></svg>
            <span style={s('font-size:11.5px;color:#5d6a85;')}>Search ticker, fund, sector…</span>
            <span style={s("margin-left:auto;font-family:'IBM Plex Mono';font-size:10px;color:#3c465e;border:1px solid #1d2840;border-radius:3px;padding:1px 5px;")}>⌘K</span>
          </div>
          <div style={s('flex:1;')}></div>
          <div style={s("display:flex;align-items:center;gap:7px;font-family:'IBM Plex Mono';font-size:11px;color:#9aa7c2;")}><span style={s('width:7px;height:7px;border-radius:50%;background:#21d07a;animation:pulseDot 2s infinite;')}></span>MARKETS OPEN</div>
          <div style={s("font-family:'IBM Plex Mono';font-size:11px;color:#6b7794;")}>{v.asOf}</div>
          <div style={s("width:28px;height:28px;border-radius:50%;background:#13203a;border:1px solid #24345a;display:flex;align-items:center;justify-content:center;font:600 10.5px 'IBM Plex Sans';color:#9aa7c2;")}>PM</div>
        </div>

        {/* BODY */}
        <div style={s('flex:1;display:flex;min-height:0;')}>
          {/* NAV RAIL */}
          <div style={s('width:54px;flex:0 0 54px;background:#0a0f1a;border-right:1px solid #1d2840;display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:5px;')}>
            {v.nav.map((item) => (
              <div key={item.key} onClick={item.on} title={item.label} className="dc-hover" style={{ ...s('width:40px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;'), background: item.bg, color: item.color }}>{item.icon}</div>
            ))}
          </div>

          {/* MAIN */}
          <div ref={this.mainRef} style={s('flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;')}>
            {v.isDashboard && this._renderDashboard(v)}
            {v.isStocks && this._renderStocks(v)}
            {v.isSectors && this._renderSectors(v)}
            {v.isStock && v.stk && this._renderStock(v)}
            {v.isSector && v.sec && this._renderSector(v)}
          </div>

          {/* CLAUDE DOCK */}
          <div style={s('flex:0 0 322px;border-left:1px solid #241f3e;background:#0b0d1d;display:flex;flex-direction:column;min-height:0;')}>
            <div style={s('display:flex;align-items:center;justify-content:space-between;padding:13px 14px;border-bottom:1px solid #241f3e;background:linear-gradient(180deg,#140f2c,#0b0d1d);flex:0 0 auto;')}>
              <div style={s("display:flex;align-items:center;gap:8px;font:600 11px 'IBM Plex Sans';letter-spacing:.08em;text-transform:uppercase;color:#c3b9ff;")}><span style={s('font-size:15px;')}>✦</span>Ask Claude</div>
              <span onClick={() => this.setState({ chat: [] })} style={s('font-size:9px;color:#7a6fb5;border:1px solid #2c2550;border-radius:5px;padding:3px 8px;cursor:pointer;')}>CLEAR</span>
            </div>
            <div style={s('padding:9px 13px;border-bottom:1px solid #1a1730;display:flex;align-items:center;gap:7px;flex:0 0 auto;')}><span style={s('font-size:8.5px;color:#7a6fb5;text-transform:uppercase;letter-spacing:.06em;')}>Context</span><span style={s('font-size:9.5px;color:#c3b9ff;background:#15112c;border:1px solid #2c2550;border-radius:5px;padding:3px 9px;')}>{v.ctxLabel}</span></div>
            <div ref={this.chatRef} style={s('flex:1;padding:14px 13px;display:flex;flex-direction:column;gap:11px;overflow-y:auto;min-height:0;')}>
              {v.chatEmpty && (
                <div style={s('display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;margin:auto 0;color:#6b7794;padding:0 6px;')}>
                  <span style={s('font-size:24px;color:#5a4fd6;')}>✦</span>
                  <div style={s("font:600 12.5px 'IBM Plex Sans';color:#b8aef0;")}>Your research co-pilot</div>
                  <div style={s('font-size:11px;line-height:1.55;')}>Ask anything about a fund, holding, or sector. (Stubbed — live model coming in Phase D.)</div>
                </div>
              )}
              {v.chatMsgs.map((m) => (
                <div key={m.key} style={{ ...s('padding:9px 11px;font-size:11.5px;line-height:1.55;white-space:pre-wrap;'), alignSelf: m.align, maxWidth: m.maxw, background: m.bg, border: '1px solid ' + m.border, borderRadius: m.radius, color: m.color }}>{m.body}</div>
              ))}
              {v.loading && (
                <div style={s('align-self:flex-start;display:flex;align-items:center;gap:7px;color:#7a6fb5;font-size:10.5px;')}><span style={s('display:flex;gap:3px;')}><span style={s('width:5px;height:5px;border-radius:50%;background:#7a6fb5;animation:pulseDot 1.4s infinite;')}></span><span style={s('width:5px;height:5px;border-radius:50%;background:#7a6fb5;animation:pulseDot 1.4s infinite .2s;')}></span><span style={s('width:5px;height:5px;border-radius:50%;background:#7a6fb5;animation:pulseDot 1.4s infinite .4s;')}></span></span>Claude is analyzing…</div>
              )}
            </div>
            <div style={s('padding:11px 13px;border-top:1px solid #241f3e;flex:0 0 auto;')}>
              <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;')}>
                {v.suggestions.map((sg, i) => (<span key={i} onClick={sg.on} style={s('padding:5px 10px;border:1px solid #2c2550;border-radius:20px;font-size:9.5px;color:#a99fd0;background:#120f24;cursor:pointer;')}>{sg.text}</span>))}
              </div>
              <div style={s('display:flex;align-items:flex-end;gap:8px;background:#0a0f1a;border:1px solid #2c2550;border-radius:10px;padding:8px 10px;')}>
                <input value={v.input} onChange={(e) => this.setState({ input: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send() } }} placeholder={'Ask about ' + v.ctxShort + '…'} style={s("flex:1;background:transparent;border:none;outline:none;color:#e8edf7;font:400 11.5px 'IBM Plex Sans';")} />
                <span onClick={() => this._send()} style={{ ...s('width:27px;height:27px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;cursor:pointer;flex:0 0 auto;'), background: v.sendBg }}>↑</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- view renderers ----------
  _renderDashboard(v) {
    return (
      <div style={s('padding:16px;display:flex;flex-direction:column;gap:13px;')}>
        <div style={s('display:flex;align-items:center;justify-content:space-between;')}>
          <div style={s('display:flex;background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:3px;gap:2px;')}>
            {v.fundTabs.map((t) => (<span key={t.k} onClick={t.on} style={{ ...s("padding:7px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'IBM Plex Sans';"), fontWeight: t.weight, background: t.bg, color: t.color }}>{t.label}</span>))}
          </div>
          <div style={s('display:flex;align-items:center;gap:3px;background:#0e1422;border:1px solid #1d2840;border-radius:8px;padding:3px;')}>
            {v.periods.map((p) => (<span key={p.k} onClick={p.on} style={{ ...s("padding:5px 10px;border-radius:5px;cursor:pointer;font-size:10px;font-family:'IBM Plex Mono';"), fontWeight: p.weight, background: p.bg, color: p.color }}>{p.k}</span>))}
          </div>
        </div>
        {/* hero */}
        <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:17px;display:flex;flex-direction:column;')}>
          <div style={s('display:flex;justify-content:space-between;align-items:flex-start;')}>
            <div>
              <div style={s("font:500 10.5px 'IBM Plex Sans';text-transform:uppercase;letter-spacing:.09em;color:#6b7794;")}>{v.heroTitle}</div>
              <div style={s("font-family:'IBM Plex Mono';font-size:36px;font-weight:500;color:#e8edf7;margin-top:5px;letter-spacing:-.01em;")}>{v.heroValue}</div>
              <div style={{ ...s("font-family:'IBM Plex Mono';font-size:13px;margin-top:3px;"), color: v.heroRetColor }}>{v.heroRetText}</div>
            </div>
            <div style={s("display:flex;flex-direction:column;gap:5px;align-items:flex-end;font:500 10.5px 'IBM Plex Sans';")}>
              {v.heroLegend.map((l, i) => (<span key={i} style={{ color: l.color }}>{l.mark} {l.label}</span>))}
            </div>
          </div>
          <div style={s('height:184px;margin-top:10px;')}>{v.heroChartEl}</div>
          <div style={s("display:flex;justify-content:space-between;font-family:'IBM Plex Mono';font-size:9px;color:#4a5573;margin-top:6px;")}>{v.xLabels.map((x, i) => (<span key={i}>{x}</span>))}</div>
        </div>
        {/* stat tiles */}
        <div style={s('display:grid;grid-template-columns:repeat(6,1fr);gap:11px;')}>
          {v.heroStats.map((st2, i) => (
            <div key={i} style={s('background:#0e1422;border:1px solid #1d2840;border-radius:8px;padding:11px 13px;')}>
              <div style={s("font:600 8.5px 'IBM Plex Sans';letter-spacing:.07em;text-transform:uppercase;color:#6b7794;")}>{st2.l}</div>
              <div style={{ ...s("font-family:'IBM Plex Mono';font-size:19px;margin-top:6px;"), color: st2.c }}>{st2.v}</div>
              <div style={s('font-size:9px;color:#5d6a85;margin-top:2px;')}>{st2.sub}</div>
            </div>
          ))}
        </div>
        {/* lower */}
        <div style={s('display:grid;grid-template-columns:1fr 360px;gap:13px;')}>
          <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;display:flex;flex-direction:column;overflow:hidden;')}>
            <div style={s('display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #1d2840;')}><span style={s("font:600 10.5px 'IBM Plex Sans';letter-spacing:.08em;text-transform:uppercase;color:#7e8aa6;")}>{v.dashTitle}</span><span style={s("font-family:'IBM Plex Mono';font-size:9.5px;color:#5d6a85;")}>{v.dashCount}</span></div>
            <div style={s("display:grid;grid-template-columns:62px 1fr 50px 54px 84px 66px 66px;gap:8px;padding:8px 14px;border-bottom:1px solid #1d2840;font:600 8.5px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;color:#6b7794;")}><span>Ticker</span><span>Name</span><span style={s('text-align:right;')}>Fund</span><span style={s('text-align:right;')}>Wt</span><span style={s('text-align:right;')}>Price</span><span style={s('text-align:right;')}>Day</span><span style={s('text-align:right;')}>Contrib</span></div>
            {v.dashHoldings.map((r) => (
              <div key={r.t} onClick={r.open} className="dc-row" style={s('display:grid;grid-template-columns:62px 1fr 50px 54px 84px 66px 66px;gap:8px;align-items:center;padding:7.5px 14px;border-bottom:1px solid #131c2f;font-size:11px;cursor:pointer;')}>
                <span style={s("font-family:'IBM Plex Mono';font-weight:600;color:#e8edf7;")}>{r.t}</span>
                <span style={s('color:#9aa7c2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{r.n}</span>
                <span style={{ ...s("text-align:right;font:500 9px 'IBM Plex Mono';"), color: r.fundColor }}>{r.fundTag}</span>
                <span style={s("font-family:'IBM Plex Mono';text-align:right;color:#cdd6e8;")}>{r.wStr}</span>
                <span style={s("font-family:'IBM Plex Mono';text-align:right;color:#cdd6e8;")}>{r.pxStr}</span>
                <span style={{ ...s("font-family:'IBM Plex Mono';text-align:right;"), color: r.dayColor }}>{r.dayStr}</span>
                <span style={{ ...s("font-family:'IBM Plex Mono';text-align:right;"), color: r.ctbColor }}>{r.ctbStr}</span>
              </div>
            ))}
            <div onClick={() => this._go('stocks')} className="dc-row" style={s("padding:9px 14px;border-top:1px solid #1d2840;font-family:'IBM Plex Mono';font-size:9.5px;color:#5a93f9;text-align:center;cursor:pointer;")}>{v.dashMoreText}</div>
          </div>
          <div style={s('display:flex;flex-direction:column;gap:13px;')}>
            <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:13px;')}>
              <div style={s("font:600 9.5px 'IBM Plex Sans';letter-spacing:.09em;text-transform:uppercase;color:#7e8aa6;margin-bottom:11px;")}>Sector Mix</div>
              <div style={s('display:flex;align-items:center;gap:15px;')}>
                {v.donutEl}
                <div style={s('flex:1;display:flex;flex-direction:column;gap:7px;font-size:10px;')}>
                  {v.donutLegend.map((d, i) => (<div key={i} onClick={d.on} style={s('display:flex;align-items:center;gap:7px;cursor:pointer;')}><span style={{ ...s('width:8px;height:8px;border-radius:2px;'), background: d.color }}></span><span style={s('flex:1;color:#9aa7c2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{d.name}</span><span style={s("font-family:'IBM Plex Mono';color:#cdd6e8;")}>{d.pct}</span></div>))}
                </div>
              </div>
            </div>
            <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:13px;flex:1;')}>
              <div style={s("font:600 9.5px 'IBM Plex Sans';letter-spacing:.09em;text-transform:uppercase;color:#7e8aa6;margin-bottom:11px;")}>{v.contribTitle}</div>
              <div style={s('display:flex;flex-direction:column;gap:9px;')}>
                {v.contribRows.map((c, i) => (<div key={i} style={s('display:flex;align-items:center;gap:9px;')}><span style={s("width:48px;font-family:'IBM Plex Mono';font-size:11px;color:#cdd6e8;")}>{c.t}</span><div style={s('flex:1;height:7px;background:#13203a;border-radius:4px;overflow:hidden;display:flex;')}><div style={{ ...s('height:100%;'), width: c.w, background: c.color, marginLeft: c.alignRight ? 'auto' : undefined }}></div></div><span style={{ ...s("width:42px;text-align:right;font-family:'IBM Plex Mono';font-size:10px;"), color: c.color }}>{c.v}</span></div>))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  _renderStocks(v) {
    return (
      <div style={s('padding:16px;display:flex;flex-direction:column;gap:13px;')}>
        <div style={s('display:flex;align-items:center;justify-content:space-between;')}>
          <div><div style={s("font:600 17px 'IBM Plex Sans';color:#e8edf7;")}>All Holdings</div><div style={s("font-family:'IBM Plex Mono';font-size:10.5px;color:#6b7794;margin-top:3px;")}>{v.stocksCount}</div></div>
          <div style={s('display:flex;align-items:center;gap:8px;background:#0e1422;border:1px solid #1d2840;border-radius:8px;padding:8px 12px;width:280px;')}>
            <svg width="13" height="13" viewBox="0 0 16 16" style={{ fill: 'none', stroke: '#5d6a85', strokeWidth: 1.6 }}><circle cx="7" cy="7" r="4.5"></circle><line x1="11" y1="11" x2="14.5" y2="14.5" style={{ strokeLinecap: 'round' }}></line></svg>
            <input value={v.query} onChange={(e) => this.setState({ query: e.target.value })} placeholder="Filter by ticker, name, sector…" style={s("flex:1;background:transparent;border:none;outline:none;color:#e8edf7;font:400 11.5px 'IBM Plex Sans';")} />
          </div>
        </div>
        <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;overflow:hidden;')}>
          <div style={s("display:grid;grid-template-columns:74px 1fr 150px 64px 70px 92px 72px 72px 60px;gap:8px;padding:9px 14px;border-bottom:1px solid #1d2840;font:600 8.5px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;color:#6b7794;")}>
            {v.stocksHead.map((h, i) => (<span key={i} onClick={h.on} style={{ ...s('cursor:pointer;'), textAlign: h.align, color: h.color }}>{h.label}{h.caret}</span>))}
          </div>
          {v.stocksRows.map((r) => (
            <div key={r.t} onClick={r.open} className="dc-row" style={s('display:grid;grid-template-columns:74px 1fr 150px 64px 70px 92px 72px 72px 60px;gap:8px;align-items:center;padding:7.5px 14px;border-bottom:1px solid #131c2f;font-size:11px;cursor:pointer;')}>
              <span style={s("font-family:'IBM Plex Mono';font-weight:600;color:#e8edf7;")}>{r.t}</span>
              <span style={s('color:#9aa7c2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{r.n}</span>
              <span style={s('color:#6b7794;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{r.s}</span>
              <span style={{ ...s("text-align:right;font:500 9px 'IBM Plex Mono';"), color: r.fundColor }}>{r.fundTag}</span>
              <span style={s("font-family:'IBM Plex Mono';text-align:right;color:#cdd6e8;")}>{r.wStr}</span>
              <span style={s("font-family:'IBM Plex Mono';text-align:right;color:#cdd6e8;")}>{r.pxStr}</span>
              <span style={{ ...s("font-family:'IBM Plex Mono';text-align:right;"), color: r.dayColor }}>{r.dayStr}</span>
              <span style={{ ...s("font-family:'IBM Plex Mono';text-align:right;"), color: r.mtdColor }}>{r.mtdStr}</span>
              <span style={s("font-family:'IBM Plex Mono';text-align:right;color:#7e8aa6;")}>{r.peStr}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  _renderSectors(v) {
    return (
      <div style={s('padding:16px;display:flex;flex-direction:column;gap:13px;')}>
        <div><div style={s("font:600 17px 'IBM Plex Sans';color:#e8edf7;")}>Sectors</div><div style={s("font-family:'IBM Plex Mono';font-size:10.5px;color:#6b7794;margin-top:3px;")}>Allocation across the combined endowment · click to drill in</div></div>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:13px;')}>
          {v.sectorCards.map((c) => (
            <div key={c.name} onClick={c.on} style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:15px;cursor:pointer;')}>
              <div style={s('display:flex;justify-content:space-between;align-items:flex-start;')}><span style={s("font:600 13px 'IBM Plex Sans';color:#e8edf7;max-width:165px;")}>{c.name}</span><span style={s("font-family:'IBM Plex Mono';font-size:18px;color:#e8edf7;")}>{c.shareStr}</span></div>
              <div style={s('display:flex;justify-content:space-between;align-items:center;margin-top:6px;')}><span style={s("font-family:'IBM Plex Mono';font-size:10px;color:#6b7794;")}>{c.count} holdings</span><span style={{ ...s("font-family:'IBM Plex Mono';font-size:11px;"), color: c.retColor }}>MTD {c.ret}</span></div>
              <div style={s('margin-top:12px;height:6px;border-radius:4px;background:#13203a;overflow:hidden;display:flex;')}><div style={{ ...s('background:#5a93f9;height:100%;'), width: c.gPct }}></div><div style={{ ...s('background:#f4a531;height:100%;'), width: c.vPct }}></div></div>
              <div style={s("display:flex;justify-content:space-between;font-family:'IBM Plex Mono';font-size:8px;color:#5d6a85;margin-top:5px;")}><span>{v.fundAName} {c.gPctLbl}</span><span>{v.fundBName} {c.vPctLbl}</span></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  _renderStock(v) {
    const stk = v.stk
    return (
      <div style={s('padding:16px;display:flex;flex-direction:column;gap:13px;')}>
        <div onClick={() => this._go(this.state.prevView || 'dashboard')} style={s("display:inline-flex;align-items:center;gap:6px;font:500 11px 'IBM Plex Sans';color:#6b7794;cursor:pointer;width:fit-content;")}>‹ {v.stkBackLabel}</div>
        <div style={s('display:flex;justify-content:space-between;align-items:flex-start;')}>
          <div>
            <div style={s('display:flex;align-items:center;gap:11px;')}>
              <span style={s("font-family:'IBM Plex Mono';font-size:26px;font-weight:600;color:#e8edf7;")}>{stk.t}</span>
              <span style={{ ...s("font:600 9px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;border-radius:5px;padding:3px 8px;"), color: stk.fundColor, border: '1px solid ' + stk.fundColor }}>{stk.fundLabel}</span>
              <span onClick={() => this._openSector(stk.s, 'stock')} style={s('font-size:10px;color:#9aa7c2;background:#13203a;border-radius:5px;padding:4px 9px;cursor:pointer;')}>{stk.s}</span>
            </div>
            <div style={s("font:400 14px 'IBM Plex Sans';color:#9aa7c2;margin-top:6px;")}>{stk.n}</div>
          </div>
          <div style={s('text-align:right;')}>
            <div style={s("font-family:'IBM Plex Mono';font-size:28px;font-weight:500;color:#e8edf7;")}>{stk.pxStr}</div>
            <div style={{ ...s("font-family:'IBM Plex Mono';font-size:13px;margin-top:2px;"), color: stk.dayColor }}>{stk.dayArrow} {stk.dayStr} today</div>
          </div>
        </div>
        <div style={s('display:grid;grid-template-columns:1fr 320px;gap:13px;')}>
          <div style={s('display:flex;flex-direction:column;gap:13px;')}>
            <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:15px;')}>
              <div style={s('display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;')}>
                <span style={s("font:600 10px 'IBM Plex Sans';letter-spacing:.08em;text-transform:uppercase;color:#7e8aa6;")}>Price · vs {stk.benchShort}</span>
                <div style={s('display:flex;align-items:center;gap:3px;background:#0a0f1a;border:1px solid #1d2840;border-radius:8px;padding:3px;')}>{v.periods.map((p) => (<span key={p.k} onClick={p.on} style={{ ...s("padding:4px 9px;border-radius:5px;cursor:pointer;font-size:10px;font-family:'IBM Plex Mono';"), fontWeight: p.weight, background: p.bg, color: p.color }}>{p.k}</span>))}</div>
              </div>
              <div style={s('height:200px;')}>{v.stkChartEl}</div>
              <div style={s('margin-top:12px;')}><div style={s("display:flex;justify-content:space-between;font-family:'IBM Plex Mono';font-size:10px;color:#6b7794;margin-bottom:5px;")}><span>52W Low {stk.loStr}</span><span>52W High {stk.hiStr}</span></div><div style={s('height:6px;border-radius:4px;background:linear-gradient(90deg,#1d2840,#2a3a5c);position:relative;')}><div style={{ ...s('position:absolute;top:-3px;width:3px;height:12px;border-radius:2px;background:#e8edf7;'), left: stk.rangePos }}></div></div></div>
            </div>
            <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:11px;')}>
              {v.stkStats.map((st2, i) => (<div key={i} style={s('background:#0e1422;border:1px solid #1d2840;border-radius:8px;padding:11px 13px;')}><div style={s("font:600 8.5px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;color:#6b7794;")}>{st2.l}</div><div style={{ ...s("font-family:'IBM Plex Mono';font-size:16px;margin-top:6px;"), color: st2.c }}>{st2.v}</div></div>))}
            </div>
            <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:15px;')}>
              <div style={s("font:600 10px 'IBM Plex Sans';letter-spacing:.08em;text-transform:uppercase;color:#7e8aa6;margin-bottom:9px;")}>About</div>
              <div style={s("font:400 12.5px/1.6 'IBM Plex Sans';color:#b8c2d8;")}>{stk.descr}</div>
            </div>
          </div>
          <div style={s('display:flex;flex-direction:column;gap:13px;')}>
            <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;padding:15px;')}>
              <div style={s("font:600 10px 'IBM Plex Sans';letter-spacing:.08em;text-transform:uppercase;color:#7e8aa6;margin-bottom:13px;")}>Position in {stk.fundLabel}</div>
              <div style={s('display:flex;flex-direction:column;gap:13px;')}>
                <div style={s('display:flex;justify-content:space-between;align-items:baseline;')}><span style={s('font-size:11px;color:#9aa7c2;')}>Portfolio weight</span><span style={s("font-family:'IBM Plex Mono';font-size:17px;color:#e8edf7;")}>{v.stkPos.weightStr}</span></div>
                <div style={s('display:flex;justify-content:space-between;align-items:baseline;')}><span style={s('font-size:11px;color:#9aa7c2;')}>Est. position value</span><span style={s("font-family:'IBM Plex Mono';font-size:17px;color:#e8edf7;")}>{v.stkPos.valueStr}</span></div>
                <div style={s('display:flex;justify-content:space-between;align-items:baseline;')}><span style={s('font-size:11px;color:#9aa7c2;')}>Est. shares</span><span style={s("font-family:'IBM Plex Mono';font-size:15px;color:#cdd6e8;")}>{v.stkPos.sharesStr}</span></div>
                <div style={s('display:flex;justify-content:space-between;align-items:baseline;')}><span style={s('font-size:11px;color:#9aa7c2;')}>Contribution MTD</span><span style={{ ...s("font-family:'IBM Plex Mono';font-size:15px;"), color: v.stkPos.contribColor }}>{v.stkPos.contribStr}</span></div>
              </div>
            </div>
            <div style={s('background:linear-gradient(180deg,#140f2c,#0c0d1f);border:1px solid #241f3e;border-radius:9px;padding:15px;')}>
              <div style={s("display:flex;align-items:center;gap:7px;font:600 10px 'IBM Plex Sans';letter-spacing:.08em;text-transform:uppercase;color:#c3b9ff;margin-bottom:11px;")}><span style={s('font-size:13px;')}>✦</span>Ask Claude about {stk.t}</div>
              <div style={s('display:flex;flex-direction:column;gap:7px;')}>
                {v.stkAskChips.map((a, i) => (<div key={i} onClick={a.on} style={s('font-size:11px;color:#cdc6ee;background:#15112c;border:1px solid #2c2550;border-radius:7px;padding:9px 11px;cursor:pointer;')}>{a.text}</div>))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  _renderSector(v) {
    const sec = v.sec
    return (
      <div style={s('padding:16px;display:flex;flex-direction:column;gap:13px;')}>
        <div onClick={() => this._go('sectors')} style={s("display:inline-flex;align-items:center;gap:6px;font:500 11px 'IBM Plex Sans';color:#6b7794;cursor:pointer;width:fit-content;")}>‹ Sectors</div>
        <div style={s('display:flex;justify-content:space-between;align-items:flex-start;')}>
          <div><div style={s("font:600 22px 'IBM Plex Sans';color:#e8edf7;")}>{sec.name}</div></div>
          <div style={s('text-align:right;')}><div style={s("font-family:'IBM Plex Mono';font-size:24px;color:#e8edf7;")}>{sec.shareStr}</div><div style={{ ...s("font-family:'IBM Plex Mono';font-size:11px;margin-top:2px;"), color: sec.retColor }}>MTD {sec.ret}</div></div>
        </div>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:11px;')}>
          <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:8px;padding:13px;')}><div style={s("font:600 8.5px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;color:#6b7794;")}>Holdings</div><div style={s("font-family:'IBM Plex Mono';font-size:18px;color:#e8edf7;margin-top:5px;")}>{sec.count}</div></div>
          <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:8px;padding:13px;')}><div style={s("font:600 8.5px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;color:#6b7794;")}>{v.fundAName} Wt</div><div style={s("font-family:'IBM Plex Mono';font-size:18px;color:#5a93f9;margin-top:5px;")}>{sec.gWStr}</div></div>
          <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:8px;padding:13px;')}><div style={s("font:600 8.5px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;color:#6b7794;")}>{v.fundBName} Wt</div><div style={s("font-family:'IBM Plex Mono';font-size:18px;color:#f4a531;margin-top:5px;")}>{sec.vWStr}</div></div>
        </div>
        <div style={s('background:#0e1422;border:1px solid #1d2840;border-radius:9px;overflow:hidden;')}>
          <div style={s("padding:10px 14px;border-bottom:1px solid #1d2840;font:600 10px 'IBM Plex Sans';letter-spacing:.08em;text-transform:uppercase;color:#7e8aa6;")}>Holdings in {sec.name}</div>
          <div style={s("display:grid;grid-template-columns:74px 1fr 64px 70px 92px 72px 72px;gap:8px;padding:8px 14px;border-bottom:1px solid #1d2840;font:600 8.5px 'IBM Plex Sans';letter-spacing:.06em;text-transform:uppercase;color:#6b7794;")}><span>Ticker</span><span>Name</span><span style={s('text-align:right;')}>Fund</span><span style={s('text-align:right;')}>Wt</span><span style={s('text-align:right;')}>Price</span><span style={s('text-align:right;')}>Day</span><span style={s('text-align:right;')}>MTD</span></div>
          {v.secRows.map((r) => (
            <div key={r.t} onClick={r.open} className="dc-row" style={s('display:grid;grid-template-columns:74px 1fr 64px 70px 92px 72px 72px;gap:8px;align-items:center;padding:7.5px 14px;border-bottom:1px solid #131c2f;font-size:11px;cursor:pointer;')}>
              <span style={s("font-family:'IBM Plex Mono';font-weight:600;color:#e8edf7;")}>{r.t}</span>
              <span style={s('color:#9aa7c2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;')}>{r.n}</span>
              <span style={{ ...s("text-align:right;font:500 9px 'IBM Plex Mono';"), color: r.fundColor }}>{r.fundTag}</span>
              <span style={s("font-family:'IBM Plex Mono';text-align:right;color:#cdd6e8;")}>{r.wStr}</span>
              <span style={s("font-family:'IBM Plex Mono';text-align:right;color:#cdd6e8;")}>{r.pxStr}</span>
              <span style={{ ...s("font-family:'IBM Plex Mono';text-align:right;"), color: r.dayColor }}>{r.dayStr}</span>
              <span style={{ ...s("font-family:'IBM Plex Mono';text-align:right;"), color: r.mtdColor }}>{r.mtdStr}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---------- view-model ----------
  renderVals() {
    const st = this.state, F = this.funds, keys = this.fundKeys
    const fundA = keys[0], fundB = keys[1]
    const v = {}
    v.asOf = 'AS OF ' + String(st.data.asOf).slice(0, 10)
    v.isDashboard = st.view === 'dashboard'; v.isStocks = st.view === 'stocks'
    v.isSectors = st.view === 'sectors'; v.isStock = st.view === 'stock'; v.isSector = st.view === 'sector'
    v.fundAName = F[fundA].name; v.fundBName = F[fundB].name

    const navDef = [['dash', 'Dashboard', 'dashboard'], ['funds', 'Funds', 'dashboard'], ['stocks', 'Stocks', 'stocks'], ['sectors', 'Sectors', 'sectors']]
    const activeMap = { dashboard: ['dash', 'funds'], stocks: ['stocks'], sectors: ['sectors'], stock: ['stocks'], sector: ['sectors'] }
    v.nav = navDef.map(([id, label, go]) => {
      const active = (activeMap[st.view] || []).indexOf(id) >= 0
      return { key: id, label, icon: this._icon(id, active), bg: active ? '#13203a' : 'transparent', color: active ? '#5a93f9' : '#5d6a85', on: () => this._go(go) }
    })
    v.periods = ['1M', '3M', '6M', 'YTD', '1Y', '5Y'].map((p) => ({ k: p, bg: p === st.period ? '#13203a' : 'transparent', color: p === st.period ? '#cdd6e8' : '#6b7794', weight: p === st.period ? 600 : 500, on: () => this.setState({ period: p }) }))

    v.fundTabs = [['all', 'All Funds'], [fundA, F[fundA].name], [fundB, F[fundB].name]].map(([k, label]) => ({ k, label, bg: st.fund === k ? '#1b2c4d' : 'transparent', color: st.fund === k ? '#fff' : '#9aa7c2', weight: st.fund === k ? 600 : 500, on: () => this.setState({ fund: k }) }))

    const per = st.period, fk = st.fund
    const xl = { '1M': ['4W', '3W', '2W', '1W', 'NOW'], '3M': ['APR', 'MAY', 'JUN'], '6M': ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'], 'YTD': ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'], '1Y': ['JUL', 'SEP', 'NOV', 'JAN', 'MAR', 'JUN'], '5Y': ["'21", "'22", "'23", "'24", "'25", "'26"] }
    v.xLabels = xl[per] || []

    const fseries = st.series[`fund:${fk}:${per}`]
    if (fk === 'all') {
      v.heroTitle = 'Total Endowment · Net Asset Value'
      v.heroValue = '$' + this.total.toFixed(2) + 'M'
      const r = this._blend((f) => f.ret[per])
      const gain = this.total - this.total / (1 + r / 100)
      v.heroRetColor = this._col(r)
      v.heroRetText = (r >= 0 ? '▲' : '▼') + ' ' + this._sign(r, 1) + '% ' + per + ' · ' + this._sign(gain, 2) + 'M · blended α ' + this._sign(this._blend((f) => f.alpha), 1) + '% vs policy'
      const lines = []
      if (fseries && fseries.multi) fseries.multi.forEach((m, i) => lines.push({ values: m.fund.values, color: F[keys[i]].color, area: i === 0, width: 2 }))
      v.heroChartEl = this._chart('heroAll' + per, lines, 184)
      v.heroLegend = keys.map((k) => ({ mark: '●', label: F[k].name, color: F[k].color }))
      v.heroStats = [
        { l: 'Blended α', v: this._sign(this._blend((f) => f.alpha), 1) + '%', sub: 'vs policy', c: '#21d07a' },
        { l: 'Beta', v: this._blend((f) => f.beta).toFixed(2), sub: '3Y', c: '#cdd6e8' },
        { l: 'Sharpe', v: this._blend((f) => f.sharpe).toFixed(2), sub: 'risk-adj', c: '#cdd6e8' },
        { l: 'Volatility', v: this._blend((f) => f.vol).toFixed(1) + '%', sub: 'ann σ', c: '#cdd6e8' },
        { l: 'Fwd P/E', v: this._blend((f) => f.pe).toFixed(1), sub: 'wtd', c: '#cdd6e8' },
        { l: 'Div Yield', v: this._blend((f) => f.dy).toFixed(1) + '%', sub: 'ttm', c: '#cdd6e8' },
      ]
    } else {
      const f = F[fk]
      v.heroTitle = f.long; v.heroValue = '$' + f.aum.toFixed(2) + 'M'
      const r = f.ret[per] || 0, gain = f.aum - f.aum / (1 + r / 100)
      v.heroRetColor = this._col(r)
      v.heroRetText = (r >= 0 ? '▲' : '▼') + ' ' + this._sign(r, 1) + '% ' + per + ' · ' + this._sign(gain, 2) + 'M · α ' + this._sign(f.alpha, 1) + '% vs ' + f.benchShort
      const lines = []
      if (fseries && fseries.fund) {
        lines.push({ values: fseries.fund.values, color: f.color, area: true })
        if (fseries.bench && fseries.bench.values.length) lines.push({ values: fseries.bench.values, color: '#5d6a85', width: 1.4, dash: '4 4' })
      }
      v.heroChartEl = this._chart('hero' + fk + per, lines, 184)
      v.heroLegend = [{ mark: '●', label: f.name, color: f.color }, { mark: '┄', label: f.benchShort, color: '#5d6a85' }]
      v.heroStats = [
        { l: 'Alpha', v: this._sign(f.alpha, 1) + '%', sub: 'vs ' + f.benchShort, c: '#21d07a' },
        { l: 'Beta', v: (f.beta || 0).toFixed(2), sub: '3Y daily', c: '#cdd6e8' },
        { l: 'Sharpe', v: (f.sharpe || 0).toFixed(2), sub: 'risk-adj', c: '#cdd6e8' },
        { l: 'Volatility', v: (f.vol || 0).toFixed(1) + '%', sub: 'ann σ', c: '#cdd6e8' },
        { l: 'Fwd P/E', v: (f.pe || 0).toFixed(1), sub: 'wtd avg', c: '#cdd6e8' },
        { l: 'Div Yield', v: (f.dy || 0).toFixed(1) + '%', sub: 'ttm', c: '#cdd6e8' },
      ]
    }

    const dashSrc = fk === 'all' ? this.allH : this.allH.filter((h) => h.fund === fk)
    const dashSorted = dashSrc.slice().sort((a, b) => b.w - a.w)
    v.dashHoldings = dashSorted.slice(0, 10).map((h) => this._rowVM(h, 'dashboard'))
    v.dashTitle = fk === 'all' ? 'Top Holdings' : F[fk].name + ' Holdings'
    v.dashCount = dashSrc.length + ' positions'
    v.dashMoreText = 'View all ' + dashSrc.length + ' positions →'

    const fsec = this._fundSectors(fk)
    v.donutEl = this._donut(fsec)
    const dcols = ['#5a93f9', '#6aa6ff', '#8ea8f2', '#21d07a', '#f4a531']
    v.donutLegend = fsec.slice(0, 5).map((x, i) => ({ name: x.name, pct: x.pct.toFixed(0) + '%', color: dcols[i], on: () => this._openSector(x.name, 'dashboard') }))

    const contribs = dashSrc.map((h) => ({ t: h.t, c: (h.w / 100) * h.mtd })).sort((a, b) => b.c - a.c)
    const pick = contribs.slice(0, 3).concat(contribs.slice(-1))
    const maxAbs = Math.max.apply(null, pick.map((p) => Math.abs(p.c))) || 1
    v.contribTitle = 'Contributors · MTD'
    v.contribRows = pick.map((p) => ({ t: p.t, v: this._sign(p.c, 2), color: this._col(p.c), w: (Math.abs(p.c) / maxAbs * 100).toFixed(0) + '%', alignRight: p.c < 0 }))

    // stocks list
    const q = (st.query || '').toLowerCase()
    let rows = this.allH.filter((h) => !q || h.t.toLowerCase().indexOf(q) >= 0 || h.n.toLowerCase().indexOf(q) >= 0 || (h.s || '').toLowerCase().indexOf(q) >= 0)
    const dir = st.sortDir === 'asc' ? 1 : -1
    const keyf = { t: (h) => h.t, n: (h) => h.n, s: (h) => h.s || '', w: (h) => h.w, px: (h) => h.px, chg: (h) => h.chg, mtd: (h) => h.mtd, pe: (h) => h.pe || 0 }
    const kf = keyf[st.sortKey] || keyf.w
    rows = rows.slice().sort((a, b) => { const x = kf(a), y = kf(b); return typeof x === 'string' ? x.localeCompare(y) * dir : (x - y) * dir })
    v.stocksRows = rows.map((h) => this._rowVM(h, 'stocks'))
    v.stocksCount = rows.length + ' of ' + this.allH.length + ' holdings · both funds'
    v.query = st.query || ''
    const heads = [['t', 'Ticker', 'left'], ['n', 'Name', 'left'], ['s', 'Sector', 'left'], ['', 'Fund', 'right'], ['w', 'Wt', 'right'], ['px', 'Price', 'right'], ['chg', 'Day', 'right'], ['mtd', 'MTD', 'right'], ['pe', 'P/E', 'right']]
    v.stocksHead = heads.map(([k, label, align]) => ({ label, align, color: (k && k === st.sortKey) ? '#cdd6e8' : '#6b7794', caret: (k && k === st.sortKey) ? (st.sortDir === 'asc' ? ' ↑' : ' ↓') : '', on: k ? () => this.setState((s2) => ({ sortKey: k, sortDir: (s2.sortKey === k && s2.sortDir === 'desc') ? 'asc' : 'desc' })) : () => {} }))

    // sectors list
    const agg = this._aggSectors()
    v.sectorCards = Object.values(agg).filter((a) => a.count > 0).sort((a, b) => b.share - a.share).map((a) => {
      const gd = (a.wByFund[fundA] || 0) / 100 * F[fundA].aum, vd = (a.wByFund[fundB] || 0) / 100 * F[fundB].aum
      const tot = gd + vd || 1, gp = gd / tot * 100, vp = vd / tot * 100
      return { name: a.name, shareStr: a.share.toFixed(1) + '%', count: a.count, ret: this._sign(a.ret, 1) + '%', retColor: this._col(a.ret), gPct: gp.toFixed(0) + '%', vPct: vp.toFixed(0) + '%', gPctLbl: gp.toFixed(0) + '%', vPctLbl: vp.toFixed(0) + '%', on: () => this._openSector(a.name, 'sectors') }
    })

    // stock detail
    if (st.view === 'stock' && this.byT[st.ticker]) {
      const h = this.byT[st.ticker], f = F[h.fund]
      const sseries = st.series[`stk:${st.ticker}:${per}`]
      v.stk = { t: h.t, n: h.n, s: h.s, fundLabel: f.name, fundColor: f.color, benchShort: f.benchShort, pxStr: '$' + this._num(h.px), dayStr: this._sign(h.chg) + '%', dayColor: this._col(h.chg), dayArrow: h.chg >= 0 ? '▲' : '▼', descr: h.desc, loStr: h.lo != null ? '$' + h.lo : '—', hiStr: h.hi != null ? '$' + h.hi : '—', rangePos: (h.lo != null && h.hi != null) ? Math.max(0, Math.min(100, (h.px - h.lo) / ((h.hi - h.lo) || 1) * 100)).toFixed(0) + '%' : '50%' }
      const lines = []
      if (sseries && sseries.close) lines.push({ values: sseries.close, color: f.color, area: true })
      const bs = (st.series[`fund:${h.fund}:${per}`] || {}).bench
      if (bs && bs.values && bs.values.length) lines.push({ values: bs.values, color: '#5d6a85', width: 1.4, dash: '4 4' })
      v.stkChartEl = this._chart('stk' + h.t + per, lines, 200)
      v.stkStats = [
        { l: 'Market Cap', v: h.mc != null ? '$' + (h.mc >= 1000 ? (h.mc / 1000).toFixed(2) + 'T' : h.mc.toFixed(0) + 'B') : '—', c: '#cdd6e8' },
        { l: 'Fwd P/E', v: h.pe ? h.pe.toFixed(1) : '—', c: '#cdd6e8' },
        { l: 'Price / Book', v: h.pb ? h.pb.toFixed(1) : '—', c: '#cdd6e8' },
        { l: 'Div Yield', v: h.dy != null ? h.dy.toFixed(2) + '%' : '—', c: '#cdd6e8' },
        { l: 'Beta (3Y)', v: h.beta != null ? h.beta.toFixed(2) : '—', c: '#cdd6e8' },
        { l: 'MTD', v: this._sign(h.mtd, 1) + '%', c: this._col(h.mtd) },
        { l: 'Day', v: this._sign(h.chg) + '%', c: this._col(h.chg) },
        { l: '52W Range', v: (h.lo != null ? '$' + h.lo + '–' + h.hi : '—'), c: '#cdd6e8' },
      ]
      const val = (h.w / 100) * f.aum, ctb = (h.w / 100) * h.mtd
      v.stkPos = { weightStr: h.w.toFixed(1) + '%', valueStr: '$' + val.toFixed(2) + 'M', sharesStr: Math.round(val * 1e6 / h.px).toLocaleString('en-US'), contribStr: this._sign(ctb, 2) + ' pp', contribColor: this._col(ctb) }
      v.stkBackLabel = st.prevView === 'stocks' ? 'All Holdings' : (st.prevView === 'sector' ? (st.sector || 'Sector') : 'Dashboard')
      v.stkAskChips = [
        { text: 'What’s the bull and bear case for ' + h.t + '?', on: () => this._send('What’s the bull and bear case for ' + h.t + '?') },
        { text: 'Is the ' + (h.pe ? h.pe.toFixed(0) : '') + 'x P/E justified?', on: () => this._send('Is ' + h.t + '’s P/E justified given its growth and risk?') },
        { text: 'How does it fit the ' + f.name + ' mandate?', on: () => this._send('How does ' + h.t + ' fit the ' + f.name + ' mandate?') },
      ]
    }

    // sector detail
    if (st.view === 'sector' && agg[st.sector]) {
      const a = agg[st.sector]
      v.sec = { name: a.name, shareStr: a.share.toFixed(1) + '%', count: a.count, ret: this._sign(a.ret, 1) + '%', retColor: this._col(a.ret), gWStr: (a.wByFund[fundA] || 0).toFixed(1) + '%', vWStr: (a.wByFund[fundB] || 0).toFixed(1) + '%' }
      v.secRows = a.holdings.slice().sort((x, y) => y.w - x.w).map((h) => this._rowVM(h, 'sector'))
    }

    // claude dock
    let ctxLabel = 'Portfolio', ctxShort = 'the portfolio', sugg = []
    if (st.view === 'stock' && this.byT[st.ticker]) { const h = this.byT[st.ticker]; ctxLabel = h.t + ' · ' + h.n.slice(0, 16); ctxShort = h.t; sugg = ['What’s driving ' + h.t + ' today?', 'Summarize the bull vs bear case', 'What are the key risks to watch?'] }
    else if (st.view === 'sector' && agg[st.sector]) { ctxLabel = 'Sector · ' + st.sector; ctxShort = st.sector; sugg = ['What’s our outlook on ' + st.sector + '?', 'Are we over- or under-weight here?', 'Which holding has the most upside?'] }
    else { const lbl = fk === 'all' ? 'Combined' : F[fk].name; ctxLabel = lbl + ' · ' + per; ctxShort = 'this fund'; sugg = ['Why are we beating the benchmark?', 'Compare the two funds’ risk', 'Where is our biggest concentration?'] }
    v.ctxLabel = ctxLabel; v.ctxShort = ctxShort
    v.suggestions = sugg.map((t) => ({ text: t, on: () => this._send(t) }))
    v.chatEmpty = st.chat.length === 0 && !st.loading
    v.chatMsgs = st.chat.map((m, i) => { const user = m.role === 'user'; return { body: user ? m.content : this._fmt(m.content), align: user ? 'flex-end' : 'flex-start', maxw: user ? '86%' : '95%', bg: user ? '#13203a' : '#15112c', border: user ? '#13203a' : '#2a2350', radius: user ? '11px 11px 3px 11px' : '11px 11px 11px 3px', color: user ? '#cdd6e8' : '#d7d2f0', key: i } })
    v.loading = st.loading; v.input = st.input || ''
    v.sendBg = (st.input && st.input.trim() && !st.loading) ? '#5a4fd6' : '#2c2550'
    return v
  }
}
