const { pool } = require('../config/db')

const customerModel = {
  // Find all customers for a user with pagination and search
  async findAll(userId, { q = '', page = 1, limit = 100, type = '' } = {}) {
    const conditions = ['user_id = $1']
    const params = [userId]
    let paramCount = 2

    // Search filter
    if (q) {
      conditions.push(`(name ILIKE $${paramCount} OR mobile ILIKE $${paramCount} OR gstin ILIKE $${paramCount})`)
      params.push(`%${q}%`)
      paramCount++
    }

    // Type filter
    if (type) {
      conditions.push(`type = $${paramCount}`)
      params.push(type)
      paramCount++
    }

    const whereClause = conditions.join(' AND ')
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM customers WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results
    const result = await pool.query(
      `SELECT * FROM customers WHERE ${whereClause} ORDER BY name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
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

  // Find customer by ID
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0]
  },

  // Create customer
  async create(data) {
    const { userId, name, mobile = '', email = '', address = '', state = '', gstin = '', type = 'customer' } = data
    const result = await pool.query(
      `INSERT INTO customers (user_id, name, mobile, email, address, state, gstin, type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [userId, name, mobile, email, address, state, gstin, type]
    )
    return result.rows[0]
  },

  // Update customer
  async update(id, userId, data) {
    const { name, mobile = '', email = '', address = '', state = '', gstin = '', type = 'customer' } = data
    const result = await pool.query(
      `UPDATE customers 
       SET name = $1, mobile = $2, email = $3, address = $4, state = $5, gstin = $6, type = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 AND user_id = $9 
       RETURNING *`,
      [name, mobile, email, address, state, gstin, type, id, userId]
    )
    return result.rows[0]
  },

  // Delete customer
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    return result.rows[0]
  },

  // Count customers
  async count(userId, filter = {}) {
    let query = 'SELECT COUNT(*) FROM customers WHERE user_id = $1'
    const params = [userId]

    if (filter.type) {
      query += ' AND type = $2'
      params.push(filter.type)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count)
  },

  // Get all customers for a user (no pagination)
  async findAllWithoutPagination(userId) {
    const result = await pool.query(
      'SELECT * FROM customers WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    )
    return result.rows
  }
}

module.exports = customerModel
