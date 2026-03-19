const express  = require('express')
const Customer = require('../models/Customer')
const auth     = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/customers?q=
router.get('/', async (req, res) => {
  try {
    const q = req.query.q
    const filter = { userId: req.user._id }
    if (q) filter.$or = [
      { name: new RegExp(q,'i') },
      { mobile: new RegExp(q,'i') },
      { gstin: new RegExp(q,'i') },
    ]
    const list = await Customer.find(filter).sort({ name: 1 })
    res.json(list)
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
