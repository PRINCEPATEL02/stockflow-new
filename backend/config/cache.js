/**
 * StockFlow Pro - In-Memory Cache Service
 * Uses node-cache for fast data caching to reduce database load
 */

const NodeCache = require('node-cache')

// Configure cache with standard TTL of 5 minutes
const cache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 60,
  useClones: false // Important: use false for performance, but be careful with mutable objects
})

// Cache keys prefix
const KEYS = {
  COMPANY: 'company:',
  DASHBOARD_STATS: 'dashboard:stats:',
  SALES_LIST: 'sales:list:',
  PRODUCTS_LIST: 'products:list:',
  CUSTOMERS_LIST: 'customers:list:',
  LOW_STOCK: 'products:lowstock:',
  RECENT_SALES: 'sales:recent:',
}

// Helper to generate cache key
const getKey = (prefix, userId, extra = '') => `${prefix}${userId}${extra ? ':' + extra : ''}`

// ==================== CACHE OPERATIONS ====================

/**
 * Get cached data
 */
const get = (key) => {
  try {
    return cache.get(key)
  } catch (err) {
    console.warn('Cache get error:', err.message)
    return null
  }
}

/**
 * Set cached data with optional TTL
 */
const set = (key, data, ttl = null) => {
  try {
    if (ttl) {
      return cache.set(key, data, ttl)
    }
    return cache.set(key, data)
  } catch (err) {
    console.warn('Cache set error:', err.message)
    return false
  }
}

/**
 * Delete cached data
 */
const del = (key) => {
  try {
    return cache.del(key)
  } catch (err) {
    console.warn('Cache delete error:', err.message)
    return 0
  }
}

/**
 * Delete all keys matching a pattern (by prefix)
 */
const delByPrefix = (prefix) => {
  try {
    const keys = cache.keys()
    const matchingKeys = keys.filter(k => k.startsWith(prefix))
    return cache.del(matchingKeys)
  } catch (err) {
    console.warn('Cache delete by prefix error:', err.message)
    return 0
  }
}

/**
 * Invalidate all user cache (when user logs out or data changes significantly)
 */
const invalidateUserCache = (userId) => {
  try {
    const keys = cache.keys()
    const userKeys = keys.filter(k => k.includes(`:${userId}:`) || k.endsWith(`:${userId}`))
    return cache.del(userKeys)
  } catch (err) {
    console.warn('Cache invalidate user error:', err.message)
    return 0
  }
}

// ==================== WRAPPER FUNCTIONS ====================

/**
 * Get or fetch data with caching
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch data if not cached
 * @param {number} ttl - Optional custom TTL in seconds
 */
const getOrFetch = async (key, fetcher, ttl = null) => {
  const cached = get(key)
  if (cached !== undefined) {
    console.log(`📦 Cache HIT: ${key}`)
    return cached
  }
  
  console.log(`🔄 Cache MISS: ${key}`)
  const data = await fetcher()
  set(key, data, ttl)
  return data
}

// Company cache helpers
const getCompany = (userId) => get(KEYS.COMPANY + userId)
const setCompany = (userId, data) => set(KEYS.COMPANY + userId, data, 600) // 10 min TTL
const invalidateCompany = (userId) => del(KEYS.COMPANY + userId)

// Dashboard stats cache helpers
const getDashboardStats = (userId) => get(KEYS.DASHBOARD_STATS + userId)
const setDashboardStats = (userId, data) => set(KEYS.DASHBOARD_STATS + userId, data, 120) // 2 min TTL
const invalidateDashboard = (userId) => del(KEYS.DASHBOARD_STATS + userId)

// Sales list cache helpers
const getSalesList = (userId, query = '') => get(getKey(KEYS.SALES_LIST, userId, query))
const setSalesList = (userId, query, data) => set(getKey(KEYS.SALES_LIST, userId, query), data, 60) // 1 min TTL
const invalidateSales = (userId) => delByPrefix(KEYS.SALES_LIST)

// Products list cache helpers
const getProductsList = (userId, query = '') => get(getKey(KEYS.PRODUCTS_LIST, userId, query))
const setProductsList = (userId, query, data) => set(getKey(KEYS.PRODUCTS_LIST, userId, query), data, 120) // 2 min TTL
const invalidateProducts = (userId) => delByPrefix(KEYS.PRODUCTS_LIST)

// Low stock cache helpers
const getLowStock = (userId) => get(KEYS.LOW_STOCK + userId)
const setLowStock = (userId, data) => set(KEYS.LOW_STOCK + userId, data, 300) // 5 min TTL

// ==================== CACHE STATS ====================

const getStats = () => {
  const stats = cache.getStats()
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) + '%' : '0%'
  }
}

module.exports = {
  cache,
  get,
  set,
  del,
  delByPrefix,
  invalidateUserCache,
  getOrFetch,
  getCompany,
  setCompany,
  invalidateCompany,
  getDashboardStats,
  setDashboardStats,
  invalidateDashboard,
  getSalesList,
  setSalesList,
  invalidateSales,
  getProductsList,
  setProductsList,
  invalidateProducts,
  getLowStock,
  setLowStock,
  getStats,
  KEYS
}