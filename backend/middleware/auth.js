const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Middleware to protect routes - expects JWT with user id
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // Attach user to request object
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    res.status(500).json({ error: 'Authentication error' })
  }
}

module.exports = auth
