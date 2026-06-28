// Thin client for the FastAPI backend.
// Same-origin by default (single-container deploy); set VITE_API_BASE to point
// at a remote backend (e.g. when the frontend later moves to Vercel).
const BASE = import.meta.env.VITE_API_BASE || ''
const j = (r) => { if (!r.ok) throw new Error(r.status); return r.json() }

export const getData = () => fetch(`${BASE}/api/data`).then(j)
export const getSeries = (ticker, period) =>
  fetch(`${BASE}/api/series/${encodeURIComponent(ticker)}?period=${period}`).then(j)
export const getFundSeries = (fund, period) =>
  fetch(`${BASE}/api/fund-series/${fund}?period=${period}`).then(j)
export const getStock = (ticker) =>
  fetch(`${BASE}/api/stock/${encodeURIComponent(ticker)}`).then(j)
export const searchTickers = (q) =>
  fetch(`${BASE}/api/search?q=${encodeURIComponent(q)}`).then(j)
export const getQuote = (ticker) =>
  fetch(`${BASE}/api/quote/${encodeURIComponent(ticker)}`).then(j)
export const getPredictions = (ticker) =>
  fetch(`${BASE}/api/predictions/${encodeURIComponent(ticker)}`).then(j)
export const getThesis = (ticker) =>
  fetch(`${BASE}/api/thesis/${encodeURIComponent(ticker)}`).then(j)
export const postChat = (messages, context) =>
  fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  }).then(j)

// ---- auth (WorkOS) ----
// Same-origin requests send the session cookie automatically. The login redirect
// is a full navigation (Google consent can't be fetched), so it's not here.
export const getMe = () => fetch(`${BASE}/api/auth/me`).then(j)
export const logout = () =>
  fetch(`${BASE}/api/auth/logout`, { method: 'POST' }).then(j)
export const loginUrl = () => `${BASE}/api/auth/login`
