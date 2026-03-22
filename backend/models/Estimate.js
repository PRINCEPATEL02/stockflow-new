const { pool } = require('../config/db')

const estimateModel = {
  // Find all estimates for a user with pagination and search
  async findAll(userId, { q = '', status = '', page = 1, limit = 50 } = {}) {
    const conditions = ['user_id = $1']
    const params = [userId]
    let paramCount = 2

    // Search filter
    if (q) {
      conditions.push(`(estimate_no ILIKE $${paramCount} OR customer_name ILIKE $${paramCount})`)
      params.push(`%${q}%`)
      paramCount++
    }

    // Status filter
    if (status) {
      conditions.push(`status = $${paramCount}`)
      params.push(status)
      paramCount++
    }

    const whereClause = conditions.join(' AND ')
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM estimates WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results with first product
    const result = await pool.query(
      `SELECT id, user_id, estimate_no, date, customer_name, total, cgst, sgst, status, customer_id, is_intra, created_at,
              (items->0->>'productName') as first_product
       FROM estimates WHERE ${whereClause} 
       ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
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

  // Find estimate by ID
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM estimates WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0]
  },

  // Create estimate
  async create(data) {
    const { 
      userId, estimateNo, date, validTill = '', customerId = null, customerName = '', 
      customer = {}, items = [], sub = 0, cgst = 0, sgst = 0, igst = 0, 
      discPct = 0, discAmt = 0, total = 0, isIntra = true,
      status = 'pending', notes = '', terms = ''
    } = data

    const result = await pool.query(
      `INSERT INTO estimates (user_id, estimate_no, date, valid_till, customer_id, customer_name, customer, items, 
                          sub, cgst, sgst, igst, disc_pct, disc_amt, total, is_intra, status, notes, terms) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
       RETURNING *`,
      [userId, estimateNo, date, validTill, customerId, customerName, JSON.stringify(customer), 
       JSON.stringify(items), sub, cgst, sgst, igst, discPct, discAmt, total, isIntra, 
       status, notes, terms]
    )
    return result.rows[0]
  },

  // Update estimate
  async update(id, userId, data) {
    const { 
      date, validTill, customerId, customerName, customer, items, sub, cgst, sgst, 
      igst, discPct, discAmt, total, isIntra, status, notes, terms
    } = data

    const result = await pool.query(
      `UPDATE estimates 
       SET date = $1, valid_till = $2, customer_id = $3, customer_name = $4, customer = $5, items = $6, 
           sub = $7, cgst = $8, sgst = $9, igst = $10, disc_pct = $11, disc_amt = $12, total = $13, 
           is_intra = $14, status = $15, notes = $16, terms = $17, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $18 AND user_id = $19 
       RETURNING *`,
      [date, validTill, customerId, customerName, JSON.stringify(customer), JSON.stringify(items),
       sub, cgst, sgst, igst, discPct, discAmt, total, isIntra, status, notes, terms, id, userId]
    )
    return result.rows[0]
  },

  // Update status
  async updateStatus(id, userId, status) {
    const result = await pool.query(
      `UPDATE estimates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, id, userId]
    )
    return result.rows[0]
  },

  // Delete estimate
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM estimates WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )
    return result.rows[0]
  },

  // Count estimates
  async count(userId, filter = {}) {
    let query = 'SELECT COUNT(*) FROM estimates WHERE user_id = $1'
    const params = [userId]

    if (filter.status) {
      query += ' AND status = $2'
      params.push(filter.status)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count)
  }
}

module.exports = estimateModel
