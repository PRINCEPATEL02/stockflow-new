const express = require('express')
const Sale = require('../models/Sale')
const Product = require('../models/Product')
const RawMaterial = require('../models/RawMaterial')
const Company = require('../models/Company')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/sales?q=&status=&page=&limit=&fields=
router.get('/', async (req, res) => {
  try {
    const { q = '', status = '', page = 1, limit = 50 } = req.query
    const result = await Sale.findAll(req.user.id, { q, status, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/sales/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Sale.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/sales/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await Sale.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    const {
      date, dueDate, customerId, customerName, customer,
      billTo, shipTo,
      items, sub, cgst, sgst, igst,
      discPct, discAmt, total, isIntra,
      status, amountPaid, paymentDate, paymentMethod,
      notes, terms, declaration,
      templateId, signature,
      placeOfSupply, hsnCode
    } = req.body

    // If items changed, adjust stock
    if (items && JSON.stringify(items) !== JSON.stringify(doc.items)) {
      // Reverse old stock
      if (doc.items && doc.items.length > 0) {
        for (const item of doc.items.filter(i => i.productId)) {
          await Product.updateStock(item.productId, req.user.id, -(item.qty || 0))
        }
      }
      // Add new stock
      if (items.length > 0) {
        const updates = items
          .filter(i => i.productId)
          .map(i => ({ id: i.productId, delta: i.qty || 0 }))
        if (updates.length) await Product.bulkUpdateStock(updates)
      }
    }

    // Deduct raw materials based on BOM
    for (const item of items?.filter(i => i.productId) || []) {
      const product = await Product.findById(item.productId, req.user.id)
      if (product && product.raw_materials && product.raw_materials.length > 0) {
        for (const rm of product.raw_materials) {
          if (rm.materialId) {
            const qtyNeeded = (rm.qty || 0) * (item.qty || 0)
            if (qtyNeeded > 0) {
              await RawMaterial.updateStock(rm.materialId, req.user.id, -qtyNeeded)
            }
          }
        }
      }
    }
    // Clamp raw material stock to 0
    await RawMaterial.clampStock(req.user.id)

    const updated = await Sale.update(parseInt(req.params.id), req.user.id, {
      date: date || doc.date,
      dueDate: dueDate || doc.due_date,
      customerId: customerId || doc.customer_id,
      customerName: customerName || doc.customer_name,
      customer: customer || doc.customer,
      billTo: billTo || doc.bill_to,
      shipTo: shipTo || doc.ship_to,
      items: items || doc.items,
      sub: sub ?? doc.sub,
      cgst: cgst ?? doc.cgst,
      sgst: sgst ?? doc.sgst,
      igst: igst ?? doc.igst,
      discPct: discPct ?? doc.disc_pct,
      discAmt: discAmt ?? doc.disc_amt,
      total: total || doc.total,
      isIntra: isIntra ?? doc.is_intra,
      status: status || doc.status,
      amountPaid: amountPaid ?? doc.amount_paid,
      paymentDate: paymentDate || doc.payment_date,
      paymentMethod: paymentMethod || doc.payment_method,
      notes: notes || doc.notes,
      terms: terms || doc.terms,
      declaration: declaration || doc.declaration,
      templateId: templateId || doc.template_id,
      signature: signature || doc.signature,
      placeOfSupply: placeOfSupply || doc.place_of_supply,
      hsnCode: hsnCode || doc.hsn_code
    })
    res.json(updated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/sales
router.post('/', async (req, res) => {
  try {
    const uid = req.user.id

    // Auto-generate invoice number
    const count = await Sale.count(uid)
    const co = await Company.findByUserId(uid)
    const prefix = co?.invoice_prefix || 'INV'
    const invoiceNo = `${prefix}-${String(count + 1).padStart(4, '0')}`

    const {
      date, dueDate = '', customerId = null, customerName = '', customer = {},
      billTo = {}, shipTo = {},
      items = [], sub = 0, cgst = 0, sgst = 0, igst = 0,
      discPct = 0, discAmt = 0, total = 0, isIntra = true,
      status = 'unpaid', amountPaid = 0, paymentDate = '', paymentMethod = '',
      notes = '', terms = '', declaration = '',
      templateId = 'classic-tally', signature = '',
      placeOfSupply = '', hsnCode = ''
    } = req.body

    const sale = await Sale.create({
      userId: uid, invoiceNo, date, dueDate,
      customerId, customerName, customer,
      billTo, shipTo,
      items, sub, cgst, sgst, igst, discPct, discAmt, total, isIntra,
      status, amountPaid, paymentDate, paymentMethod,
      notes, terms, declaration,
      templateId, signature,
      placeOfSupply, hsnCode
    })

    // Deduct stock for each linked product
    const productUpdates = items
      .filter(i => i.productId)
      .map(i => ({ id: i.productId, delta: -(i.qty || 0) }))
    if (productUpdates.length) await Product.bulkUpdateStock(productUpdates)
    // Clamp stock to 0
    await Product.clampStock(uid)

    // Deduct raw materials based on BOM
    for (const item of items.filter(i => i.productId)) {
      const product = await Product.findById(item.productId, uid)
      if (product && product.raw_materials && product.raw_materials.length > 0) {
        for (const rm of product.raw_materials) {
          if (rm.materialId) {
            const qtyNeeded = (rm.qty || 0) * (item.qty || 0)
            if (qtyNeeded > 0) {
              await RawMaterial.updateStock(rm.materialId, uid, -qtyNeeded)
            }
          }
        }
      }
    }
    // Clamp raw material stock to 0
    await RawMaterial.clampStock(uid)

    res.status(201).json(sale)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/sales/:id/payment - Update payment details
router.patch('/:id/payment', async (req, res) => {
  try {
    const { amountPaid, paymentDate, paymentMethod, status } = req.body
    const doc = await Sale.updatePayment(parseInt(req.params.id), req.user.id, { amountPaid, paymentDate, paymentMethod, status })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/sales/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const doc = await Sale.updateStatus(parseInt(req.params.id), req.user.id, req.body.status)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, status: doc.status })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/sales/:id/duplicate - Duplicate an invoice
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Sale.findById(parseInt(req.params.id), req.user.id)
    if (!original) return res.status(404).json({ error: 'Not found' })

    const uid = req.user.id
    const count = await Sale.count(uid)
    const co = await Company.findByUserId(uid)
    const prefix = co?.invoice_prefix || 'INV'
    const newInvoiceNo = `${prefix}-${String(count + 1).padStart(4, '0')}`

    const duplicate = await Sale.create({
      userId: uid,
      invoiceNo: newInvoiceNo,
      date: new Date().toISOString().split('T')[0],
      dueDate: original.due_date,
      customerId: original.customer_id,
      customerName: original.customer_name,
      customer: original.customer,
      billTo: original.bill_to,
      shipTo: original.ship_to,
      items: original.items,
      sub: original.sub,
      cgst: original.cgst,
      sgst: original.sgst,
      igst: original.igst,
      discPct: original.disc_pct,
      discAmt: original.disc_amt,
      total: original.total,
      isIntra: original.is_intra,
      status: 'unpaid',
      amountPaid: 0,
      notes: original.notes,
      terms: original.terms,
      declaration: original.declaration,
      templateId: original.template_id,
      placeOfSupply: original.place_of_supply,
      hsnCode: original.hsn_code
    })

    res.status(201).json(duplicate)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/sales/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Sale.delete(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    // Restore raw materials when sale is deleted
    if (doc.items && doc.items.length > 0) {
      for (const item of doc.items.filter(i => i.productId)) {
        const product = await Product.findById(item.productId, req.user.id)
        if (product && product.raw_materials && product.raw_materials.length > 0) {
          for (const rm of product.raw_materials) {
            if (rm.materialId) {
              const qtyToRestore = (rm.qty || 0) * (item.qty || 0)
              if (qtyToRestore > 0) {
                await RawMaterial.updateStock(rm.materialId, req.user.id, qtyToRestore)
              }
            }
          }
        }
      }
    }

    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
