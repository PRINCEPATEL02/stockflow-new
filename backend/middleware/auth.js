const jwt  = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'No token — please login' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(payload.id).select('-password')
    if (!req.user) {
      // Token is valid but user doesn't exist - clear token hint
      return res.status(401).json({ error: 'User not found - please login again' })
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
