const { pool } = require('../config/db')

const productModel = {
  // Find all products for a user with pagination and search
  async findAll(userId, { q = '', page = 1, limit = 100, category = '' } = {}) {
    const conditions = ['user_id = $1']
    const params = [userId]
    let paramCount = 2

    // Search filter
    if (q) {
      conditions.push(`(name ILIKE $${paramCount} OR sku ILIKE $${paramCount} OR category ILIKE $${paramCount})`)
      params.push(`%${q}%`)
      paramCount++
    }

    // Category filter
    if (category) {
      conditions.push(`category = $${paramCount}`)
      params.push(category)
      paramCount++
    }

    const whereClause = conditions.join(' AND ')
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results
    const result = await pool.query(
      `SELECT id, user_id, name, sku, category, unit, price, cost_price, gst_rate, stock, min_stock, description, raw_materials, created_at, updated_at 
       FROM products WHERE ${whereClause} ORDER BY name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    )

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  },

  // Find product by ID
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0]
  },

  // Create product
  async create(data) {
    const { 
      userId, name, sku = '', category = '', unit = 'pcs', price = 0, 
      costPrice = 0, gstRate = 18, stock = 0, minStock = 5, 
      description = '', rawMaterials = [] 
    } = data

    const result = await pool.query(
      `INSERT INTO products (user_id, name, sku, category, unit, price, cost_price, gst_rate, stock, min_stock, description, raw_materials) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [userId, name, sku, category, unit, price, costPrice, gstRate, stock, minStock, description, JSON.stringify(rawMaterials)]
    )
    return result.rows[0]
  },

  // Update product
  async update(id, userId, data) {
    const { 
      name, sku = '', category = '', unit = 'pcs', price = 0, 
      costPrice = 0, gstRate = 18, stock = 0, minStock = 5, 
      description = '', rawMaterials = [] 
    } = data

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, sku = $2, category = $3, unit = $4, price = $5, cost_price = $6, 
           gst_rate = $7, stock = $8, min_stock = $9, description = $10, raw_materials = $11, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $12 AND user_id = $13 
       RETURNING *`,
      [name, sku, category, unit, price, costPrice, gstRate, stock, minStock, description, JSON.stringify(rawMaterials), id, userId]
    )
    return result.rows[0]
  },

  // Update stock (for sales/purchases)
  async updateStock(id, userId, delta) {
    const result = await pool.query(
      `UPDATE products 
       SET stock = GREATEST(0, stock + $1), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [delta, id, userId]
    )
    return result.rows[0]
  },

  // Set stock to specific value
  async setStock(id, userId, value) {
    const result = await pool.query(
      `UPDATE products 
       SET stock = GREATEST(0, $1), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [value, id, userId]
    )
    return result.rows[0]
  },

  // Bulk update stock
  async bulkUpdateStock(updates) {
    // updates: [{ id, delta }]
    for (const update of updates) {
      await pool.query(
        `UPDATE products SET stock = GREATEST(0, stock + $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [update.delta, update.id]
      )
    }
  },

  // Ensure stock is not negative
  async clampStock(userId) {
    await pool.query(
      `UPDATE products SET stock = 0 WHERE user_id = $1 AND stock < 0`,
      [userId]
    )
  },

  // Delete product
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    return result.rows[0]
  },

  // Count products
  async count(userId, filter = {}) {
    let query = 'SELECT COUNT(*) FROM products WHERE user_id = $1'
    const params = [userId]

    if (filter.category) {
      query += ' AND category = $2'
      params.push(filter.category)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count)
  },

  // Get all products for a user (no pagination)
  async findAllWithoutPagination(userId) {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    )
    return result.rows
  },

  // Get products with low stock
  async findLowStock(userId) {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 AND stock <= min_stock ORDER BY stock ASC',
      [userId]
    )
    return result.rows
  }
}

module.exports = productModel
