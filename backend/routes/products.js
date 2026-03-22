const express = require('express')
const Product = require('../models/Product')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/products?q=&page=&limit=&category=
router.get('/', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 100, category } = req.query
    const result = await Product.findAll(req.user.id, { q, page: parseInt(page), limit: parseInt(limit), category })
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Product.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { name, sku = '', category = '', unit = 'pcs', price = 0, costPrice = 0, gstRate = 18, stock = 0, minStock = 5, description = '', rawMaterials = [] } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Product.create({ 
      userId: req.user.id, name: name.trim(), sku, category, unit, price, costPrice, gstRate, stock, minStock, description, rawMaterials 
    })
    res.status(201).json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, sku = '', category = '', unit = 'pcs', price = 0, costPrice = 0, gstRate = 18, stock = 0, minStock = 5, description = '', rawMaterials = [] } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await Product.update(parseInt(req.params.id), req.user.id, { 
      name: name.trim(), sku, category, unit, price, costPrice, gstRate, stock, minStock, description, rawMaterials 
    })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/products/:id/stock — quick stock adjustment
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta, value } = req.body
    const prod = await Product.findById(parseInt(req.params.id), req.user.id)
    if (!prod) return res.status(404).json({ error: 'Not found' })
    
    let newStock
    if (value !== undefined) {
      newStock = Math.max(0, Number(value))
    } else {
      newStock = Math.max(0, Number(prod.stock) + Number(delta || 0))
    }
    
    const updated = await Product.setStock(parseInt(req.params.id), req.user.id, newStock)
    res.json(updated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Product.delete(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
