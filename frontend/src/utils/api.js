import API_URL from '../config/api'

const BASE = API_URL + '/api'

const getToken  = ()  => localStorage.getItem('sf_token')
const setToken  = (t) => localStorage.setItem('sf_token', t)
const clearToken = () => localStorage.removeItem('sf_token')

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  
  // Handle authentication errors - redirect to login
  if (res.status === 401) {
    if (data.error === 'User not found' || data.error === 'No token — please login' || data.error === 'Invalid or expired token') {
      clearToken()
      localStorage.removeItem('sf_user')
      localStorage.removeItem('sf_company')
      window.location.href = '/'
      return
    }
    throw new Error(data.error || 'Authentication failed')
  }
  
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

const get   = (path)       => req('GET',    path)
const post  = (path, body) => req('POST',   path, body)
const put   = (path, body) => req('PUT',    path, body)
const patch = (path, body) => req('PATCH',   path, body)
const del   = (path)       => req('DELETE', path)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  register:        (d)  => post('/auth/register', d).then(r => { setToken(r.token); return r }),
  login:           (d)  => post('/auth/login',    d).then(r => { setToken(r.token); return r }),
  logout:          ()   => clearToken(),
  isLoggedIn:      ()   => !!getToken(),
  getStoredUser:   ()   => { try { return JSON.parse(localStorage.getItem('sf_user') || 'null') } catch { return null } },
  setStoredUser:   (u)   => localStorage.setItem('sf_user', JSON.stringify(u)),
  clearStoredUser: ()   => localStorage.removeItem('sf_user'),
  forgotPassword:  (d)  => post('/auth/forgot-password', d),
  resetPassword:   (token, d) => post(`/auth/reset-password/${token}`, d),
  changePassword:  (d)  => post('/auth/change-password', d),
  updateProfile:  (d)  => post('/auth/update-profile', d),
  getProfile:   ()   => get('/auth/me'),
}

// ── Company ───────────────────────────────────────────────────────────────────
export const company = {
  get:    ()    => get('/company'),
  update: (d)   => put('/company', d),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customers = {
  list:   (q='', type='', page=1, limit=100) => get(`/customers?q=${encodeURIComponent(q)}&type=${type}&page=${page}&limit=${limit}`),
  get:    (id)   => get(`/customers/${id}`),
  create: (d)    => post('/customers', d),
  update: (id,d) => put(`/customers/${id}`, d),
  remove: (id)   => del(`/customers/${id}`),
}

// ── Raw Materials ─────────────────────────────────────────────────────────────
export const rawMaterials = {
  list:        (q='') => get(`/rawmaterials${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get:         (id)   => get(`/rawmaterials/${id}`),
  create:      (d)    => post('/rawmaterials', d),
  update:      (id,d) => put(`/rawmaterials/${id}`, d),
  adjustStock: (id,d) => patch(`/rawmaterials/${id}/stock`, d),
  remove:      (id)   => del(`/rawmaterials/${id}`),
}

// ── Products ──────────────────────────────────────────────────────────────────
export const products = {
  list:        (q='', category='', page=1, limit=100) => get(`/products?q=${encodeURIComponent(q)}&category=${category}&page=${page}&limit=${limit}`),
  get:         (id)   => get(`/products/${id}`),
  create:      (d)    => post('/products', d),
  update:      (id,d) => put(`/products/${id}`, d),
  adjustStock: (id,d) => patch(`/products/${id}/stock`, d),
  remove:      (id)   => del(`/products/${id}`),
}

// ── Sales / Invoices ──────────────────────────────────────────────────────────
export const sales = {
  list:         (q='',status='', page=1, limit=50) => get(`/sales?q=${encodeURIComponent(q)}&status=${status}&page=${page}&limit=${limit}`),
  get:          (id)             => get(`/sales/${id}`),
  create:       (d)              => post('/sales', d),
  update:       (id,d)           => put(`/sales/${id}`, d),
  updateStatus: (id,s)           => patch(`/sales/${id}/status`, { status: s }),
  updatePayment:(id,d)           => patch(`/sales/${id}/payment`, d),
  duplicate:    (id)             => post(`/sales/${id}/duplicate`, {}),
  remove:       (id)              => del(`/sales/${id}`),
}

// ── Purchases ─────────────────────────────────────────────────────────────────
export const purchases = {
  list:   (q='', status='', page=1, limit=50) => get(`/purchases?q=${encodeURIComponent(q)}&status=${status}&page=${page}&limit=${limit}`),
  get:    (id)   => get(`/purchases/${id}`),
  create: (d)    => post('/purchases', d),
  remove: (id)   => del(`/purchases/${id}`),
}

// ── Estimates ─────────────────────────────────────────────────────────────────
export const estimates = {
  list:         (q='', page=1, limit=50) => get(`/estimates?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),
  get:          (id)   => get(`/estimates/${id}`),
  create:       (d)    => post('/estimates', d),
  update:       (id,d) => put(`/estimates/${id}`, d),
  updateStatus: (id,s) => patch(`/estimates/${id}/status`, { status: s }),
  duplicate:    (id)   => post(`/estimates/${id}/duplicate`, {}),
  remove:       (id)   => del(`/estimates/${id}`),
}

// ── Dashboard & Reports ───────────────────────────────────────────────────────
export const dashboard = { stats: () => get('/dashboard') }
export const reports   = { get: (period='month') => get(`/reports?period=${period}`) }
