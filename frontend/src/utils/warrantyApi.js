const API_URL = '/api'

// Get auth token
const getToken = () => localStorage.getItem('token')

// Common fetch options
const fetchOptions = (method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  }
  if (body) {
    options.body = JSON.stringify(body)
  }
  return options
}

// POST /api/warranty - Save warranty
export const createWarranty = async (warrantyData) => {
  const res = await fetch(`${API_URL}/warranty`, fetchOptions('POST', warrantyData))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create warranty')
  return data
}

// GET /api/warranty - Get all warranties
export const getWarranties = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}/warranty?${queryString}`, fetchOptions('GET'))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch warranties')
  return data
}

// GET /api/warranty/:id - Get specific warranty
export const getWarrantyById = async (id) => {
  const res = await fetch(`${API_URL}/warranty/${id}`, fetchOptions('GET'))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch warranty')
  return data
}

// GET /api/warranty/bill/:billNumber - Check if warranty exists
export const checkWarrantyByBill = async (billNumber) => {
  const res = await fetch(`${API_URL}/warranty/bill/${billNumber}`, fetchOptions('GET'))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to check warranty')
  return data
}

// PATCH /api/warranty/:id - Update warranty
export const updateWarranty = async (id, updates) => {
  const res = await fetch(`${API_URL}/warranty/${id}`, fetchOptions('PATCH', updates))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update warranty')
  return data
}

// DELETE /api/warranty/:id - Delete warranty
export const deleteWarranty = async (id) => {
  const res = await fetch(`${API_URL}/warranty/${id}`, fetchOptions('DELETE'))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to delete warranty')
  return data
}

// GET /api/warranty/stats/summary - Get warranty statistics
export const getWarrantyStats = async () => {
  const res = await fetch(`${API_URL}/warranty/stats/summary`, fetchOptions('GET'))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch warranty stats')
  return data
}

export default {
  createWarranty,
  getWarranties,
  getWarrantyById,
  checkWarrantyByBill,
  updateWarranty,
  deleteWarranty,
  getWarrantyStats
}
