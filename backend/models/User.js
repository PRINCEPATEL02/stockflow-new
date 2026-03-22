const bcrypt = require('bcryptjs')
const { pool } = require('../config/db')

const userModel = {
  // Create a new user
  async create({ username, email, password, name }) {
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (username, email, password, name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, name, created_at`,
      [username.toLowerCase(), email?.toLowerCase() || '', hashedPassword, name]
    )
    return result.rows[0]
  },

  // Find user by username
  async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase()]
    )
    return result.rows[0]
  },

  // Find user by ID
  async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, name, reset_password_token, reset_password_expire, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0]
  },

  // Find user by email
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    return result.rows[0]
  },

  // Find user by username or email (for forgot password)
  async findByUsernameOrEmail(username, email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username?.toLowerCase(), email?.toLowerCase()]
    )
    return result.rows[0]
  },

  // Update password
  async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expire = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, username, email, name`,
      [hashedPassword, id]
    )
    return result.rows[0]
  },

  // Update reset token
  async updateResetToken(id, token, expire) {
    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expire = $2 WHERE id = $3',
      [token, expire, id]
    )
  },

  // Find user by reset token
  async findByResetToken(token) {
    const result = await pool.query(
      `SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expire > CURRENT_TIMESTAMP`,
      [token]
    )
    return result.rows[0]
  },

  // Update user profile
  async updateProfile(id, { username, email, password }) {
    let query = 'UPDATE users SET '
    const params = []
    let paramCount = 1

    if (username) {
      query += `username = $${paramCount}, `
      params.push(username.toLowerCase())
      paramCount++
    }
    if (email !== undefined) {
      query += `email = $${paramCount}, `
      params.push(email?.toLowerCase() || '')
      paramCount++
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      query += `password = $${paramCount}, `
      params.push(hashedPassword)
      paramCount++
    }

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, username, email, name`
    params.push(id)

    const result = await pool.query(query, params)
    return result.rows[0]
  },

  // Match password
  async matchPassword(user, plainPassword) {
    return bcrypt.compare(plainPassword, user.password)
  },

  // Get all users (for admin)
  async findAll() {
    const result = await pool.query(
      'SELECT id, username, email, name, created_at FROM users ORDER BY created_at DESC'
    )
    return result.rows
  },

  // Delete user
  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id])
  }
}

module.exports = userModel
