const express     = require('express')
const Purchase    = require('../models/Purchase')
const Product     = require('../models/Product')
const RawMaterial = require('../models/RawMaterial')
const auth        = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/purchases?q=&page=&limit=&status=
router.get('/', async (req, res) => {
  try {
    const { q='', page = 1, limit = 50, status } = req.query
    const filter = { userId: req.user._id }
    
    // Search filter
    if (q) filter.$or = [
      { purchaseNo: new RegExp(q,'i') },
      { supplierName: new RegExp(q,'i') },
      { billNo: new RegExp(q,'i') },
    ]
    if (status) filter.status = status
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const skip = (pageNum - 1) * limitNum
    
    // Field selection for list view
    const fieldList = '-items -notes'
    
    // Use lean() for faster query
    const [list, total] = await Promise.all([
      Purchase.find(filter)
        .select(fieldList)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Purchase.countDocuments(filter)
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

// GET /api/purchases/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Purchase.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/purchases
router.post('/', async (req, res) => {
  try {
    const uid = req.user._id
    const count = await Purchase.countDocuments({ userId: uid })
    const purchaseNo = `PUR-${String(count + 1).padStart(4, '0')}`

    const {
      date, supplierName='', supplierGstin='', billNo='',
      items=[], sub=0, cgst=0, sgst=0, igst=0, total=0,
      status='paid', notes=''
    } = req.body

    const purchase = await Purchase.create({
      userId: uid, purchaseNo, date, supplierName, supplierGstin, billNo,
      items, sub, cgst, sgst, igst, total, status, notes
    })

    // Add stock for each linked raw material (itemType='raw') or product
    const rawOps = items
      .filter(i => i.rawMaterialId)
      .map(i => ({
        updateOne: {
          filter: { _id: i.rawMaterialId, userId: uid },
          update: { $inc: { stock: i.qty || 0 } }
        }
      }))
    if (rawOps.length) await RawMaterial.bulkWrite(rawOps)

    // fallback: also update product stock if productId set (backward compat)
    const bulkOps = items
      .filter(i => i.productId && !i.rawMaterialId)
      .map(i => ({
        updateOne: {
          filter: { _id: i.productId, userId: uid },
          update: { $inc: { stock: i.qty || 0 } }
        }
      }))
    if (bulkOps.length) await Product.bulkWrite(bulkOps)

    res.status(201).json(purchase)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Purchase.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })

    // Reduce raw material stock when purchase is deleted
    if (doc.items && doc.items.length > 0) {
      for (const item of doc.items.filter(i => i.rawMaterialId)) {
        const qtyToReduce = item.qty || 0
        if (qtyToReduce > 0) {
          await RawMaterial.findByIdAndUpdate(item.rawMaterialId, { $inc: { stock: -qtyToReduce } })
        }
      }
      // Also reduce product stock if productId set
      for (const item of doc.items.filter(i => i.productId && !i.rawMaterialId)) {
        const qtyToReduce = item.qty || 0
        if (qtyToReduce > 0) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -qtyToReduce } })
        }
      }
    }

    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
