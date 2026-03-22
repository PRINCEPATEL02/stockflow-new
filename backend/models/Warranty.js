const { pool } = require('../config/db')

const warrantyModel = {
  // Find all warranties for a user with pagination and search
  async findAll(userId, { q = '', status = '', page = 1, limit = 50 } = {}) {
    const conditions = ['user_id = $1']
    const params = [userId]
    let paramCount = 2

    // Search filter
    if (q) {
      conditions.push(`(customer_name ILIKE $${paramCount} OR bill_number ILIKE $${paramCount})`)
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
      `SELECT COUNT(*) FROM warranties WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results
    const result = await pool.query(
      `SELECT * FROM warranties WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    )

    // Add remaining days to each warranty
    const warranties = result.rows.map(w => {
      const warranty = { ...w }
      if (warranty.expiry_date) {
        const now = new Date()
        const expiry = new Date(warranty.expiry_date)
        const diffTime = expiry - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        warranty.remaining_days = diffDays > 0 ? diffDays : 0
        warranty.is_expired = diffDays <= 0
      } else {
        warranty.remaining_days = null
        warranty.is_expired = false
      }
      return warranty
    })

    return {
      warranties,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  },

  // Find warranty by ID
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM warranties WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0]
  },

  // Find warranty by bill number
  async findByBillNumber(userId, billNumber) {
    const result = await pool.query(
      'SELECT * FROM warranties WHERE user_id = $1 AND bill_number = $2',
      [userId, billNumber]
    )
    return result.rows[0]
  },

  // Create warranty
  async create(data) {
    const { 
      userId, customerName, contactNumber = '', billNumber, billDate, 
      saleId = null, products = [], warrantyEnabled = false, warrantyDuration = 0,
      warrantyType = 'days', startDate = null, expiryDate = null, status = 'active'
    } = data

    const result = await pool.query(
      `INSERT INTO warranties (user_id, customer_name, contact_number, bill_number, bill_date, sale_id, products, 
                          warranty_enabled, warranty_duration, warranty_type, start_date, expiry_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [userId, customerName, contactNumber, billNumber, billDate, saleId, JSON.stringify(products),
       warrantyEnabled, warrantyDuration, warrantyType, startDate, expiryDate, status]
    )
    return result.rows[0]
  },

  // Update warranty
  async update(id, userId, data) {
    const { 
      warrantyEnabled, warrantyDuration, warrantyType, startDate
    } = data

    let query = 'UPDATE warranties SET '
    const params = []
    let paramCount = 1

    if (warrantyEnabled !== undefined) {
      query += `warranty_enabled = $${paramCount}, `
      params.push(warrantyEnabled)
      paramCount++
    }
    if (warrantyDuration !== undefined) {
      query += `warranty_duration = $${paramCount}, `
      params.push(warrantyDuration)
      paramCount++
    }
    if (warrantyType !== undefined) {
      query += `warranty_type = $${paramCount}, `
      params.push(warrantyType)
      paramCount++
    }
    if (startDate !== undefined) {
      query += `start_date = $${paramCount}, `
      params.push(startDate)
      paramCount++
    }

    // Recalculate expiry date and status
    query += 'updated_at = CURRENT_TIMESTAMP WHERE id = $' + paramCount + ' AND user_id = $' + (paramCount + 1) + ' RETURNING *'
    params.push(id, userId)

    const result = await pool.query(query, params)
    return result.rows[0]
  },

  // Update warranty with expiry calculation
  async updateWithExpiry(id, userId, data) {
    const { 
      warrantyEnabled, warrantyDuration, warrantyType, startDate, expiryDate, status
    } = data

    const result = await pool.query(
      `UPDATE warranties 
       SET warranty_enabled = $1, warranty_duration = $2, warranty_type = $3, 
           start_date = $4, expiry_date = $5, status = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 AND user_id = $8 
       RETURNING *`,
      [warrantyEnabled, warrantyDuration, warrantyType, startDate, expiryDate, status, id, userId]
    )
    return result.rows[0]
  },

  // Delete warranty
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM warranties WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    return result.rows[0]
  },

  // Count warranties
  async count(userId, filter = {}) {
    let query = 'SELECT COUNT(*) FROM warranties WHERE user_id = $1'
    const params = [userId]

    if (filter.status) {
      query += ' AND status = $2'
      params.push(filter.status)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count)
  },

  // Get warranty statistics
  async getStats(userId) {
    const total = await this.count(userId)
    const active = await this.count(userId, { status: 'active' })
    const expired = await this.count(userId, { status: 'expired' })

    // Get warranties expiring in next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiringSoonResult = await pool.query(
      `SELECT COUNT(*) FROM warranties 
       WHERE user_id = $1 AND status = 'active' 
       AND expiry_date IS NOT NULL 
       AND expiry_date <= $2 AND expiry_date >= CURRENT_TIMESTAMP`,
      [userId, thirtyDaysFromNow]
    )
    const expiringSoon = parseInt(expiringSoonResult.rows[0].count)

    return { total, active, expired, expiringSoon }
  },

  // Check if warranty exists for a bill
  async existsByBillNumber(userId, billNumber) {
    const result = await pool.query(
      'SELECT id FROM warranties WHERE user_id = $1 AND bill_number = $2',
      [userId, billNumber]
    )
    return result.rows.length > 0
  }
}

module.exports = warrantyModel
