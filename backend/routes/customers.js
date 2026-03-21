const express  = require('express')
const Customer = require('../models/Customer')
const auth     = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/customers?q=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { q='', page = 1, limit = 100, type } = req.query
    const filter = { userId: req.user._id }
    
    // Search filter
    if (q) filter.$or = [
      { name: new RegExp(q,'i') },
      { mobile: new RegExp(q,'i') },
      { gstin: new RegExp(q,'i') },
    ]
    if (type) filter.type = type
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 100))
    const skip = (pageNum - 1) * limitNum
    
    // Use lean() for faster query
    const [list, total] = await Promise.all([
      Customer.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Customer.countDocuments(filter)
    ])
    
    res.json({
      data: list,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Customer.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, mobile='', email='', address='', state='', gstin='', type='customer' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Customer.create({ userId: req.user._id, name: name.trim(), mobile, email, address, state, gstin, type })
    res.status(201).json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, mobile='', email='', address='', state='', gstin='', type='customer' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name: name.trim(), mobile, email, address, state, gstin, type },
      { new: true }
    )
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
