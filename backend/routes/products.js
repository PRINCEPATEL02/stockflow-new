const express = require('express')
const Product = require('../models/Product')
const auth    = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/products?q=
router.get('/', async (req, res) => {
  try {
    const q = req.query.q
    const filter = { userId: req.user._id }
    if (q) filter.$or = [
      { name: new RegExp(q,'i') },
      { sku: new RegExp(q,'i') },
      { category: new RegExp(q,'i') },
    ]
    const list = await Product.find(filter).sort({ name: 1 })
    res.json(list)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Product.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { name, sku='', category='', unit='pcs', price=0, costPrice=0, gstRate=18, stock=0, minStock=5, description='', rawMaterials=[] } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Product.create({ userId: req.user._id, name: name.trim(), sku, category, unit, price, costPrice, gstRate, stock, minStock, description, rawMaterials })
    res.status(201).json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, sku='', category='', unit='pcs', price=0, costPrice=0, gstRate=18, stock=0, minStock=5, description='', rawMaterials=[] } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name: name.trim(), sku, category, unit, price, costPrice, gstRate, stock, minStock, description, rawMaterials },
      { new: true }
    )
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/products/:id/stock — quick stock adjustment
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta, value } = req.body
    const prod = await Product.findOne({ _id: req.params.id, userId: req.user._id })
    if (!prod) return res.status(404).json({ error: 'Not found' })
    prod.stock = value !== undefined
      ? Math.max(0, Number(value))
      : Math.max(0, prod.stock + Number(delta || 0))
    await prod.save()
    res.json(prod)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
