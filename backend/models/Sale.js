const { pool } = require('../config/db')

const saleModel = {
  // Find all sales for a user with pagination and search
  async findAll(userId, { q = '', status = '', page = 1, limit = 50 } = {}) {
    const conditions = ['user_id = $1']
    const params = [userId]
    let paramCount = 2

    // Search filter
    if (q) {
      conditions.push(`(invoice_no ILIKE $${paramCount} OR customer_name ILIKE $${paramCount})`)
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
      `SELECT COUNT(*) FROM sales WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results with first product
    const result = await pool.query(
      `SELECT id, user_id, invoice_no, date, customer_name, total, cgst, sgst, status, customer_id, is_intra, amount_paid, created_at,
              (items->0->>'productName') as first_product
       FROM sales WHERE ${whereClause} 
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

  // Find sale by ID
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM sales WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0]
  },

  // Create sale
  async create(data) {
    const { 
      userId, invoiceNo, date, dueDate = '', customerId = null, customerName = '', 
      customer = {}, billTo = {}, shipTo = {}, items = [], sub = 0, cgst = 0, 
      sgst = 0, igst = 0, discPct = 0, discAmt = 0, total = 0, isIntra = true,
      status = 'unpaid', amountPaid = 0, paymentDate = '', paymentMethod = '',
      notes = '', terms = '', declaration = '', templateId = 'classic-tally', 
      signature = '', placeOfSupply = '', hsnCode = ''
    } = data

    const result = await pool.query(
      `INSERT INTO sales (user_id, invoice_no, date, due_date, customer_id, customer_name, customer, bill_to, ship_to, items, 
                          sub, cgst, sgst, igst, disc_pct, disc_amt, total, is_intra, status, amount_paid, 
                          payment_date, payment_method, notes, terms, declaration, template_id, signature, 
                          place_of_supply, hsn_code) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29) 
       RETURNING *`,
      [userId, invoiceNo, date, dueDate, customerId, customerName, JSON.stringify(customer), 
       JSON.stringify(billTo), JSON.stringify(shipTo), JSON.stringify(items), sub, cgst, sgst, igst, 
       discPct, discAmt, total, isIntra, status, amountPaid, paymentDate, paymentMethod, 
       notes, terms, declaration, templateId, signature, placeOfSupply, hsnCode]
    )
    return result.rows[0]
  },

  // Update sale
  async update(id, userId, data) {
    const fields = [
      'date', 'dueDate', 'customerId', 'customerName', 'customer', 'billTo', 'shipTo',
      'items', 'sub', 'cgst', 'sgst', 'igst', 'discPct', 'discAmt', 'total', 'isIntra',
      'status', 'amountPaid', 'paymentDate', 'paymentMethod', 'notes', 'terms', 'declaration',
      'templateId', 'signature', 'placeOfSupply', 'hsnCode'
    ]

    let query = 'UPDATE sales SET '
    const params = []
    let paramCount = 1

    const fieldMap = {
      date: 'date', dueDate: 'due_date', customerId: 'customer_id', customerName: 'customer_name',
      customer: 'customer', billTo: 'bill_to', shipTo: 'ship_to', items: 'items',
      sub: 'sub', cgst: 'cgst', sgst: 'sgst', igst: 'igst', discPct: 'disc_pct',
      discAmt: 'disc_amt', total: 'total', isIntra: 'is_intra', status: 'status',
      amountPaid: 'amount_paid', paymentDate: 'payment_date', paymentMethod: 'payment_method',
      notes: 'notes', terms: 'terms', declaration: 'declaration', templateId: 'template_id',
      signature: 'signature', placeOfSupply: 'place_of_supply', hsnCode: 'hsn_code'
    }

    fields.forEach(field => {
      if (data[field] !== undefined) {
        const dbField = fieldMap[field]
        if (['customer', 'billTo', 'shipTo', 'items'].includes(dbField)) {
          query += `${dbField} = $${paramCount}, `
          params.push(JSON.stringify(data[field]))
        } else if (dbField === 'customer_id' && data[field] === null) {
          query += `${dbField} = NULL, `
        } else {
          query += `${dbField} = $${paramCount}, `
          params.push(data[field])
        }
        paramCount++
      }
    })

    query += 'updated_at = CURRENT_TIMESTAMP WHERE id = $' + paramCount + ' AND user_id = $' + (paramCount + 1) + ' RETURNING *'
    params.push(id, userId)

    const result = await pool.query(query, params)
    return result.rows[0]
  },

  // Update payment details
  async updatePayment(id, userId, data) {
    const { amountPaid, paymentDate, paymentMethod, status } = data
    
    let query = 'UPDATE sales SET '
    const params = []
    let paramCount = 1

    if (amountPaid !== undefined) {
      query += `amount_paid = $${paramCount}, `
      params.push(amountPaid)
      paramCount++
    }
    if (paymentDate !== undefined) {
      query += `payment_date = $${paramCount}, `
      params.push(paymentDate)
      paramCount++
    }
    if (paymentMethod !== undefined) {
      query += `payment_method = $${paramCount}, `
      params.push(paymentMethod)
      paramCount++
    }
    if (status !== undefined) {
      query += `status = $${paramCount}, `
      params.push(status)
      paramCount++
    }

    query += 'updated_at = CURRENT_TIMESTAMP WHERE id = $' + paramCount + ' AND user_id = $' + (paramCount + 1) + ' RETURNING *'
    params.push(id, userId)

    const result = await pool.query(query, params)
    return result.rows[0]
  },

  // Update status
  async updateStatus(id, userId, status) {
    const result = await pool.query(
      `UPDATE sales SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, id, userId]
    )
    return result.rows[0]
  },

  // Delete sale
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM sales WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )
    return result.rows[0]
  },

  // Count sales
  async count(userId, filter = {}) {
    let query = 'SELECT COUNT(*) FROM sales WHERE user_id = $1'
    const params = [userId]

    if (filter.status) {
      query += ' AND status = $2'
      params.push(filter.status)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count)
  },

  // Get sales totals
  async getTotalSales(userId) {
    const result = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE user_id = $1',
      [userId]
    )
    return parseFloat(result.rows[0].total)
  },

  // Get recent sales
  async findRecent(userId, limit = 6) {
    const result = await pool.query(
      `SELECT id, invoice_no, date, customer_name, total, status FROM sales 
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    )
    return result.rows
  },

  // Get sales by date range
  async findByDateRange(userId, startDate, endDate) {
    const result = await pool.query(
      'SELECT * FROM sales WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date ASC',
      [userId, startDate, endDate]
    )
    return result.rows
  }
}

module.exports = saleModel
