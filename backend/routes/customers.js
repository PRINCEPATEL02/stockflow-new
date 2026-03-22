const express = require('express')
const Customer = require('../models/Customer')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/customers?q=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 100, type } = req.query
    const result = await Customer.findAll(req.user.id, { q, page: parseInt(page), limit: parseInt(limit), type })
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Customer.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, mobile = '', email = '', address = '', state = '', gstin = '', type = 'customer' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Customer.create({ userId: req.user.id, name: name.trim(), mobile, email, address, state, gstin, type })
    res.status(201).json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, mobile = '', email = '', address = '', state = '', gstin = '', type = 'customer' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Customer.update(parseInt(req.params.id), req.user.id, { name: name.trim(), mobile, email, address, state, gstin, type })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Customer.delete(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
