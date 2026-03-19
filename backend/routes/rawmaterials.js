const express     = require('express')
const RawMaterial = require('../models/RawMaterial')
const auth        = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/rawmaterials?q=
router.get('/', async (req, res) => {
  try {
    const q = req.query.q
    const filter = { userId: req.user._id }
    if (q) filter.$or = [
      { name: new RegExp(q, 'i') },
      { sku:  new RegExp(q, 'i') },
      { category: new RegExp(q, 'i') },
    ]
    const list = await RawMaterial.find(filter).sort({ name: 1 })
    res.json(list)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/rawmaterials/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await RawMaterial.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/rawmaterials
router.post('/', async (req, res) => {
  try {
    const { name, sku='', category='', unit='kg', costPrice=0, gstRate=18, stock=0, minStock=5, description='' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await RawMaterial.create({
      userId: req.user._id, name: name.trim(), sku, category, unit, costPrice, gstRate, stock, minStock, description
    })
    res.status(201).json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/rawmaterials/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, sku='', category='', unit='kg', costPrice=0, gstRate=18, stock=0, minStock=5, description='' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const doc = await RawMaterial.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name: name.trim(), sku, category, unit, costPrice, gstRate, stock, minStock, description },
      { new: true }
    )
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/rawmaterials/:id/stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta, value } = req.body
    const doc = await RawMaterial.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    doc.stock = value !== undefined
      ? Math.max(0, Number(value))
      : Math.max(0, doc.stock + Number(delta || 0))
    await doc.save()
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/rawmaterials/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await RawMaterial.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
