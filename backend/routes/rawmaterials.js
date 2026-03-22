const express = require('express')
const RawMaterial = require('../models/RawMaterial')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/rawmaterials?q=
router.get('/', async (req, res) => {
  try {
    const q = req.query.q
    const list = await RawMaterial.findAll(req.user.id, { q })
    res.json(list)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/rawmaterials/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await RawMaterial.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/rawmaterials
router.post('/', async (req, res) => {
  try {
    const { name, sku = '', category = '', unit = 'kg', costPrice = 0, gstRate = 18, stock = 0, minStock = 5, description = '' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await RawMaterial.create({
      userId: req.user.id, name: name.trim(), sku, category, unit, costPrice, gstRate, stock, minStock, description
    })
    res.status(201).json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/rawmaterials/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, sku = '', category = '', unit = 'kg', costPrice = 0, gstRate = 18, stock = 0, minStock = 5, description = '' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await RawMaterial.update(parseInt(req.params.id), req.user.id, {
      name: name.trim(), sku, category, unit, costPrice, gstRate, stock, minStock, description
    })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/rawmaterials/:id/stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta, value } = req.body
    const doc = await RawMaterial.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    
    let newStock
    if (value !== undefined) {
      newStock = Math.max(0, Number(value))
    } else {
      newStock = Math.max(0, Number(doc.stock) + Number(delta || 0))
    }
    
    const updated = await RawMaterial.setStock(parseInt(req.params.id), req.user.id, newStock)
    res.json(updated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/rawmaterials/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await RawMaterial.delete(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
