const { pool } = require('../config/db')

const purchaseModel = {
  // Find all purchases for a user with pagination and search
  async findAll(userId, { q = '', status = '', page = 1, limit = 50 } = {}) {
    const conditions = ['user_id = $1']
    const params = [userId]
    let paramCount = 2

    // Search filter
    if (q) {
      conditions.push(`(purchase_no ILIKE $${paramCount} OR supplier_name ILIKE $${paramCount} OR bill_no ILIKE $${paramCount})`)
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
      `SELECT COUNT(*) FROM purchases WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results with first product
    const result = await pool.query(
      `SELECT id, user_id, purchase_no, date, supplier_name, total, cgst, sgst, status, bill_no, created_at,
              (items->0->>'productName') as first_product
       FROM purchases WHERE ${whereClause} 
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

  // Find purchase by ID
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM purchases WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0]
  },

  // Create purchase
  async create(data) {
    const { 
      userId, purchaseNo, date, supplierName = '', supplierGstin = '', 
      billNo = '', items = [], sub = 0, cgst = 0, sgst = 0, igst = 0, 
      total = 0, status = 'paid', notes = ''
    } = data

    const result = await pool.query(
      `INSERT INTO purchases (user_id, purchase_no, date, supplier_name, supplier_gstin, bill_no, items, 
                          sub, cgst, sgst, igst, total, status, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [userId, purchaseNo, date, supplierName, supplierGstin, billNo, JSON.stringify(items),
       sub, cgst, sgst, igst, total, status, notes]
    )
    return result.rows[0]
  },

  // Update purchase
  async update(id, userId, data) {
    const { 
      date, supplierName, supplierGstin, billNo, items, sub, cgst, sgst, 
      igst, total, status, notes
    } = data

    const result = await pool.query(
      `UPDATE purchases 
       SET date = $1, supplier_name = $2, supplier_gstin = $3, bill_no = $4, items = $5, 
           sub = $6, cgst = $7, sgst = $8, igst = $9, total = $10, status = $11, notes = $12, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $13 AND user_id = $14 
       RETURNING *`,
      [date, supplierName, supplierGstin, billNo, JSON.stringify(items), sub, cgst, sgst, igst, 
       total, status, notes, id, userId]
    )
    return result.rows[0]
  },

  // Delete purchase
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM purchases WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )
    return result.rows[0]
  },

  // Count purchases
  async count(userId, filter = {}) {
    let query = 'SELECT COUNT(*) FROM purchases WHERE user_id = $1'
    const params = [userId]

    if (filter.status) {
      query += ' AND status = $2'
      params.push(filter.status)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count)
  },

  // Get purchases totals
  async getTotalPurchases(userId) {
    const result = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total FROM purchases WHERE user_id = $1',
      [userId]
    )
    return parseFloat(result.rows[0].total)
  },

  // Get purchases by date range
  async findByDateRange(userId, startDate, endDate) {
    const result = await pool.query(
      'SELECT * FROM purchases WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date ASC',
      [userId, startDate, endDate]
    )
    return result.rows
  }
}

module.exports = purchaseModel
