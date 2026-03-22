const { pool } = require('../config/db')

const companyModel = {
  // Find company by user ID
  async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM companies WHERE user_id = $1',
      [userId]
    )
    return result.rows[0]
  },

  // Create or update company
  async upsert(userId, data) {
    const fields = [
      'name', 'logo', 'address', 'state', 'pincode', 'gstin', 'pan', 'cin',
      'msme', 'mobile', 'email', 'website', 'bank', 'acc_name', 'acc_no',
      'ifsc', 'branch', 'upi', 'invoice_prefix', 'estimate_prefix',
      'default_template', 'default_terms', 'footer', 'declaration',
      'signature', 'terms_conditions'
    ]

    // Check if company exists
    const existing = await this.findByUserId(userId)

    if (existing) {
      // Update existing company
      let query = 'UPDATE companies SET '
      const params = []
      let paramCount = 1

      fields.forEach(field => {
        if (data[field] !== undefined) {
          query += `${this.toSnakeCase(field)} = $${paramCount}, `
          params.push(data[field])
          paramCount++
        }
      })

      query += 'updated_at = CURRENT_TIMESTAMP WHERE user_id = $' + paramCount + ' RETURNING *'
      params.push(userId)

      const result = await pool.query(query, params)
      return result.rows[0]
    } else {
      // Insert new company
      const fieldNames = fields.map(f => this.toSnakeCase(f))
      const fieldPlaceholders = fields.map((_, i) => `$${i + 2}`)
      
      const query = `
        INSERT INTO companies (user_id, ${fieldNames.join(', ')}) 
        VALUES ($1, ${fieldPlaceholders.join(', ')})
        RETURNING *
      `
      
      const params = [userId, ...fields.map(f => data[f] || '')]
      const result = await pool.query(query, params)
      return result.rows[0]
    }
  },

  // Update company
  async update(userId, data) {
    const fields = [
      'name', 'logo', 'address', 'state', 'pincode', 'gstin', 'pan', 'cin',
      'msme', 'mobile', 'email', 'website', 'bank', 'acc_name', 'acc_no',
      'ifsc', 'branch', 'upi', 'invoice_prefix', 'estimate_prefix',
      'default_template', 'default_terms', 'footer', 'declaration',
      'signature', 'terms_conditions'
    ]

    let query = 'UPDATE companies SET '
    const params = []
    let paramCount = 1

    fields.forEach(field => {
      if (data[field] !== undefined) {
        query += `${this.toSnakeCase(field)} = $${paramCount}, `
        params.push(data[field])
        paramCount++
      }
    })

    query += 'updated_at = CURRENT_TIMESTAMP WHERE user_id = $' + paramCount + ' RETURNING *'
    params.push(userId)

    const result = await pool.query(query, params)
    return result.rows[0]
  },

  // Helper to convert camelCase to snake_case
  toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase()
  },

  // Get all companies (for admin)
  async findAll() {
    const result = await pool.query('SELECT * FROM companies ORDER BY created_at DESC')
    return result.rows
  },

  // Delete company
  async delete(userId) {
    await pool.query('DELETE FROM companies WHERE user_id = $1', [userId])
  }
}

module.exports = companyModel
