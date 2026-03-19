const express = require('express')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const Company = require('../models/Company')
const auth    = require('../middleware/auth')

const router = express.Router()

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body
    if (!username?.trim() || !password?.trim())
      return res.status(400).json({ error: 'Username and password are required' })

    const exists = await User.findOne({ username: username.trim().toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Username already taken' })

    const user = await User.create({ username: username.trim().toLowerCase(), password, name: name?.trim() || username.trim() })

    // Auto-create empty company profile
    await Company.create({ userId: user._id })

    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, username: user.username, name: user.name } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username?.trim() || !password?.trim())
      return res.status(400).json({ error: 'Username and password are required' })

    const user = await User.findOne({ username: username.trim().toLowerCase() })
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: 'Invalid username or password' })

    // Ensure company profile exists
    await Company.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { upsert: true, new: true }
    )

    const token = signToken(user)
    res.json({ token, user: { id: user._id, username: user.username, name: user.name } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  res.json({ id: req.user._id, username: req.user.username, name: req.user.name, createdAt: req.user.createdAt })
})

module.exports = router
