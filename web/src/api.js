// Thin client for the FastAPI backend (proxied at /api in dev).
const j = (r) => { if (!r.ok) throw new Error(r.status); return r.json() }

export const getData = () => fetch('/api/data').then(j)
export const getSeries = (ticker, period) =>
  fetch(`/api/series/${encodeURIComponent(ticker)}?period=${period}`).then(j)
export const getFundSeries = (fund, period) =>
  fetch(`/api/fund-series/${fund}?period=${period}`).then(j)
export const postChat = (messages) =>
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  }).then(j)
