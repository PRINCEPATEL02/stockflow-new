const express = require('express')
const Purchase = require('../models/Purchase')
const Product = require('../models/Product')
const RawMaterial = require('../models/RawMaterial')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/purchases?q=&page=&limit=&status=
router.get('/', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 50, status } = req.query
    const result = await Purchase.findAll(req.user.id, { q, status, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/purchases/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Purchase.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/purchases
router.post('/', async (req, res) => {
  try {
    const uid = req.user.id
    const count = await Purchase.count(uid)
    const purchaseNo = `PUR-${String(count + 1).padStart(4, '0')}`

    const {
      date, supplierName = '', supplierGstin = '', billNo = '',
      items = [], sub = 0, cgst = 0, sgst = 0, igst = 0, total = 0,
      status = 'paid', notes = ''
    } = req.body

    const purchase = await Purchase.create({
      userId: uid, purchaseNo, date, supplierName, supplierGstin, billNo,
      items, sub, cgst, sgst, igst, total, status, notes
    })

    // Add stock for each linked raw material (itemType='raw') or product
    const rawUpdates = items
      .filter(i => i.rawMaterialId)
      .map(i => ({ id: i.rawMaterialId, delta: i.qty || 0 }))
    if (rawUpdates.length) await RawMaterial.bulkUpdateStock(rawUpdates)

    // fallback: also update product stock if productId set (backward compat)
    const prodUpdates = items
      .filter(i => i.productId && !i.rawMaterialId)
      .map(i => ({ id: i.productId, delta: i.qty || 0 }))
    if (prodUpdates.length) await Product.bulkUpdateStock(prodUpdates)

    res.status(201).json(purchase)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/purchases/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await Purchase.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    const {
      date, supplierName, supplierGstin, billNo,
      items, sub, cgst, sgst, igst, total,
      status, notes
    } = req.body

    // If items changed, adjust stock
    if (items && JSON.stringify(items) !== JSON.stringify(doc.items)) {
      // Reverse old stock
      if (doc.items && doc.items.length > 0) {
        for (const item of doc.items.filter(i => i.rawMaterialId)) {
          await RawMaterial.updateStock(item.rawMaterialId, req.user.id, -(item.qty || 0))
        }
        for (const item of doc.items.filter(i => i.productId && !i.rawMaterialId)) {
          await Product.updateStock(item.productId, req.user.id, -(item.qty || 0))
        }
      }
      // Add new stock
      if (items.length > 0) {
        const rawUpdates = items
          .filter(i => i.rawMaterialId)
          .map(i => ({ id: i.rawMaterialId, delta: i.qty || 0 }))
        if (rawUpdates.length) await RawMaterial.bulkUpdateStock(rawUpdates)

        const prodUpdates = items
          .filter(i => i.productId && !i.rawMaterialId)
          .map(i => ({ id: i.productId, delta: i.qty || 0 }))
        if (prodUpdates.length) await Product.bulkUpdateStock(prodUpdates)
      }
    }

    const updated = await Purchase.update(parseInt(req.params.id), req.user.id, {
      date: date || doc.date,
      supplierName: supplierName || doc.supplier_name,
      supplierGstin: supplierGstin || doc.supplier_gstin,
      billNo: billNo || doc.bill_no,
      items: items || doc.items,
      sub: sub ?? doc.sub,
      cgst: cgst ?? doc.cgst,
      sgst: sgst ?? doc.sgst,
      igst: igst ?? doc.igst,
      total: total || doc.total,
      status: status || doc.status,
      notes: notes || doc.notes
    })
    res.json(updated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Purchase.delete(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    // Reduce raw material stock when purchase is deleted
    if (doc.items && doc.items.length > 0) {
      for (const item of doc.items.filter(i => i.rawMaterialId)) {
        const qtyToReduce = item.qty || 0
        if (qtyToReduce > 0) {
          await RawMaterial.updateStock(item.rawMaterialId, req.user.id, -qtyToReduce)
        }
      }
      // Also reduce product stock if productId set
      for (const item of doc.items.filter(i => i.productId && !i.rawMaterialId)) {
        const qtyToReduce = item.qty || 0
        if (qtyToReduce > 0) {
          await Product.updateStock(item.productId, req.user.id, -qtyToReduce)
        }
      }
    }

    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
