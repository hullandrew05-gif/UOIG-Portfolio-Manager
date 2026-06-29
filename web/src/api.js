// Thin client for the FastAPI backend.
// Same-origin by default (single-container deploy); set VITE_API_BASE to point at
// a remote backend (e.g. the Vercel frontend talking to the Render backend).
// credentials:'include' sends the session cookie on every call — required when the
// frontend and backend are on different origins (and harmless same-origin).
const BASE = import.meta.env.VITE_API_BASE || ''
const j = (r) => { if (!r.ok) throw new Error(r.status); return r.json() }
const get = (path) => fetch(`${BASE}${path}`, { credentials: 'include' }).then(j)
const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(j)

export const getData = () => get('/api/data')
export const getSeries = (ticker, period) =>
  get(`/api/series/${encodeURIComponent(ticker)}?period=${period}`)
export const getFundSeries = (fund, period) =>
  get(`/api/fund-series/${fund}?period=${period}`)
export const getStock = (ticker) => get(`/api/stock/${encodeURIComponent(ticker)}`)
export const searchTickers = (q) => get(`/api/search?q=${encodeURIComponent(q)}`)
export const getQuote = (ticker) => get(`/api/quote/${encodeURIComponent(ticker)}`)
export const getPredictions = (ticker) => get(`/api/predictions/${encodeURIComponent(ticker)}`)
export const getThesis = (ticker) => get(`/api/thesis/${encodeURIComponent(ticker)}`)
export const postChat = (messages, context) => post('/api/chat', { messages, context })

// ---- auth (WorkOS) ----
// The login redirect is a full navigation (Google consent can't be fetched).
export const getMe = () => get('/api/auth/me')
export const logout = () => post('/api/auth/logout')
export const loginUrl = () => `${BASE}/api/auth/login`
export const sendInvite = (email, roleSlug) => post('/api/auth/invite', { email, role_slug: roleSlug })
export const passwordLogin = (email, password) => post('/api/auth/password-login', { email, password })
export const requestPasswordReset = (email) => post('/api/auth/password-reset', { email })
export const confirmPasswordReset = (token, password) => post('/api/auth/password-reset/confirm', { token, password })
export const verifyEmail = (code, pendingToken) => post('/api/auth/verify-email', { code, pendingToken })
