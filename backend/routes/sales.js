const express = require('express')
const Sale    = require('../models/Sale')
const Product = require('../models/Product')
const RawMaterial = require('../models/RawMaterial')
const Company = require('../models/Company')
const auth    = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/sales?q=&status=
router.get('/', async (req, res) => {
  try {
    const { q='', status='' } = req.query
    const filter = { userId: req.user._id }
    if (q) filter.$or = [
      { invoiceNo: new RegExp(q,'i') },
      { customerName: new RegExp(q,'i') },
    ]
    if (status) filter.status = status
    const list = await Sale.find(filter).sort({ createdAt: -1 })
    res.json(list)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/sales/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Sale.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/sales
router.post('/', async (req, res) => {
  try {
    const uid = req.user._id

    // Auto-generate invoice number
    const count = await Sale.countDocuments({ userId: uid })
    const co    = await Company.findOne({ userId: uid })
    const prefix = co?.invoicePrefix || 'INV'
    const invoiceNo = `${prefix}-${String(count + 1).padStart(4, '0')}`

    const {
      date, dueDate='', customerId=null, customerName='', customer={},
      billTo={}, shipTo={},
      items=[], sub=0, cgst=0, sgst=0, igst=0,
      discPct=0, discAmt=0, total=0, isIntra=true,
      status='unpaid', amountPaid=0, paymentDate='', paymentMethod='',
      notes='', terms='', declaration='',
      templateId='classic-tally', signature='',
      placeOfSupply='', hsnCode=''
    } = req.body

    const sale = await Sale.create({
      userId: uid, invoiceNo, date, dueDate,
      customerId: customerId || null, customerName, customer,
      billTo, shipTo,
      items, sub, cgst, sgst, igst, discPct, discAmt, total, isIntra,
      status, amountPaid, paymentDate, paymentMethod,
      notes, terms, declaration,
      templateId, signature,
      placeOfSupply, hsnCode
    })

    // Deduct stock for each linked product
    const bulkOps = items
      .filter(i => i.productId)
      .map(i => ({
        updateOne: {
          filter: { _id: i.productId, userId: uid },
          update: { $inc: { stock: -(i.qty || 0) } }
        }
      }))
    if (bulkOps.length) await Product.bulkWrite(bulkOps)
    // Clamp stock to 0
    await Product.updateMany({ userId: uid, stock: { $lt: 0 } }, { $set: { stock: 0 } })

    // Deduct raw materials based on BOM
    for (const item of items.filter(i => i.productId)) {
      const product = await Product.findOne({ _id: item.productId, userId: uid })
      if (product && product.rawMaterials && product.rawMaterials.length > 0) {
        for (const rm of product.rawMaterials) {
          if (rm.materialId) {
            const qtyNeeded = (rm.qty || 0) * (item.qty || 0)
            if (qtyNeeded > 0) {
              await RawMaterial.findByIdAndUpdate(rm.materialId, { $inc: { stock: -qtyNeeded } })
            }
          }
        }
      }
    }
    // Clamp raw material stock to 0
    await RawMaterial.updateMany({ userId: uid, stock: { $lt: 0 } }, { $set: { stock: 0 } })

    res.status(201).json(sale)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/sales/:id/payment - Update payment details
router.patch('/:id/payment', async (req, res) => {
  try {
    const { amountPaid, paymentDate, paymentMethod, status } = req.body
    const update = {}
    if (amountPaid !== undefined) update.amountPaid = amountPaid
    if (paymentDate !== undefined) update.paymentDate = paymentDate
    if (paymentMethod !== undefined) update.paymentMethod = paymentMethod
    if (status !== undefined) update.status = status

    const doc = await Sale.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { new: true }
    )
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/sales/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const doc = await Sale.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: req.body.status },
      { new: true }
    )
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, status: doc.status })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/sales/:id/duplicate - Duplicate an invoice
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Sale.findOne({ _id: req.params.id, userId: req.user._id })
    if (!original) return res.status(404).json({ error: 'Not found' })

    const uid = req.user._id
    const count = await Sale.countDocuments({ userId: uid })
    const co = await Company.findOne({ userId: uid })
    const prefix = co?.invoicePrefix || 'INV'
    const newInvoiceNo = `${prefix}-${String(count + 1).padStart(4, '0')}`

    const duplicate = await Sale.create({
      userId: uid,
      invoiceNo: newInvoiceNo,
      date: new Date().toISOString().split('T')[0],
      dueDate: original.dueDate,
      customerId: original.customerId,
      customerName: original.customerName,
      customer: original.customer,
      billTo: original.billTo,
      shipTo: original.shipTo,
      items: original.items,
      sub: original.sub,
      cgst: original.cgst,
      sgst: original.sgst,
      igst: original.igst,
      discPct: original.discPct,
      discAmt: original.discAmt,
      total: original.total,
      isIntra: original.isIntra,
      status: 'unpaid',
      amountPaid: 0,
      notes: original.notes,
      terms: original.terms,
      declaration: original.declaration,
      templateId: original.templateId,
      placeOfSupply: original.placeOfSupply,
      hsnCode: original.hsnCode
    })

    res.status(201).json(duplicate)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/sales/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Sale.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })

    // Restore raw materials when sale is deleted
    if (doc.items && doc.items.length > 0) {
      for (const item of doc.items.filter(i => i.productId)) {
        const product = await Product.findOne({ _id: item.productId, userId: req.user._id })
        if (product && product.rawMaterials && product.rawMaterials.length > 0) {
          for (const rm of product.rawMaterials) {
            if (rm.materialId) {
              const qtyToRestore = (rm.qty || 0) * (item.qty || 0)
              if (qtyToRestore > 0) {
                await RawMaterial.findByIdAndUpdate(rm.materialId, { $inc: { stock: qtyToRestore } })
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
