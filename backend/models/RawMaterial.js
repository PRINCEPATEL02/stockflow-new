const { pool } = require('../config/db')

const rawMaterialModel = {
  // Find all raw materials for a user with search
  async findAll(userId, { q = '' } = {}) {
    let query = 'SELECT * FROM raw_materials WHERE user_id = $1'
    const params = [userId]

    if (q) {
      query += ' AND (name ILIKE $2 OR sku ILIKE $2 OR category ILIKE $2)'
      params.push(`%${q}%`)
    }

    query += ' ORDER BY name ASC'

    const result = await pool.query(query, params)
    return result.rows
  },

  // Find raw material by ID
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM raw_materials WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0]
  },

  // Create raw material
  async create(data) {
    const { 
      userId, name, sku = '', category = '', unit = 'kg', 
      costPrice = 0, gstRate = 18, stock = 0, minStock = 5, 
      description = '' 
    } = data

    const result = await pool.query(
      `INSERT INTO raw_materials (user_id, name, sku, category, unit, cost_price, gst_rate, stock, min_stock, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [userId, name, sku, category, unit, costPrice, gstRate, stock, minStock, description]
    )
    return result.rows[0]
  },

  // Update raw material
  async update(id, userId, data) {
    const { 
      name, sku = '', category = '', unit = 'kg', 
      costPrice = 0, gstRate = 18, stock = 0, minStock = 5, 
      description = '' 
    } = data

    const result = await pool.query(
      `UPDATE raw_materials 
       SET name = $1, sku = $2, category = $3, unit = $4, cost_price = $5, 
           gst_rate = $6, stock = $7, min_stock = $8, description = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 AND user_id = $11 
       RETURNING *`,
      [name, sku, category, unit, costPrice, gstRate, stock, minStock, description, id, userId]
    )
    return result.rows[0]
  },

  // Update stock
  async updateStock(id, userId, delta) {
    const result = await pool.query(
      `UPDATE raw_materials 
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
      `UPDATE raw_materials 
       SET stock = GREATEST(0, $1), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [value, id, userId]
    )
    return result.rows[0]
  },

  // Bulk update stock
  async bulkUpdateStock(updates) {
    for (const update of updates) {
      await pool.query(
        `UPDATE raw_materials SET stock = GREATEST(0, stock + $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [update.delta, update.id]
      )
    }
  },

  // Ensure stock is not negative
  async clampStock(userId) {
    await pool.query(
      `UPDATE raw_materials SET stock = 0 WHERE user_id = $1 AND stock < 0`,
      [userId]
    )
  },

  // Delete raw material
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM raw_materials WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    return result.rows[0]
  },

  // Count raw materials
  async count(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM raw_materials WHERE user_id = $1',
      [userId]
    )
    return parseInt(result.rows[0].count)
  },

  // Get all raw materials for a user (no filter)
  async findAllWithoutPagination(userId) {
    const result = await pool.query(
      'SELECT * FROM raw_materials WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    )
    return result.rows
  }
}

module.exports = rawMaterialModel
