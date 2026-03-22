const express = require('express')
const Estimate = require('../models/Estimate')
const Company = require('../models/Company')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/estimates?q=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 50, status } = req.query
    const result = await Estimate.findAll(req.user.id, { q, status, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/estimates/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Estimate.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/estimates/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await Estimate.findById(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    const {
      date, validTill, customerId, customerName, customer,
      items, sub, cgst, sgst, igst,
      discPct, discAmt, total, isIntra,
      status, notes, terms
    } = req.body

    const updated = await Estimate.update(parseInt(req.params.id), req.user.id, {
      date: date || doc.date,
      validTill: validTill || doc.valid_till,
      customerId: customerId || doc.customer_id,
      customerName: customerName || doc.customer_name,
      customer: customer || doc.customer,
      items: items || doc.items,
      sub: sub ?? doc.sub,
      cgst: cgst ?? doc.cgst,
      sgst: sgst ?? doc.sgst,
      igst: igst ?? doc.igst,
      discPct: discPct ?? doc.disc_pct,
      discAmt: discAmt ?? doc.disc_amt,
      total: total ?? doc.total,
      isIntra: isIntra ?? doc.is_intra,
      status: status || doc.status,
      notes: notes || doc.notes,
      terms: terms || doc.terms
    })
    res.json(updated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/estimates
router.post('/', async (req, res) => {
  try {
    const uid = req.user.id
    const count = await Estimate.count(uid)
    const co = await Company.findByUserId(uid)
    const prefix = co?.estimate_prefix || 'EST'
    const estimateNo = `${prefix}-${String(count + 1).padStart(4, '0')}`

    const {
      date, validTill = '', customerId = null, customerName = '', customer = {},
      items = [], sub = 0, cgst = 0, sgst = 0, igst = 0,
      discPct = 0, discAmt = 0, total = 0, isIntra = true,
      status = 'pending', notes = '', terms = ''
    } = req.body

    const est = await Estimate.create({
      userId: uid, estimateNo, date, validTill,
      customerId, customerName, customer,
      items, sub, cgst, sgst, igst, discPct, discAmt, total, isIntra,
      status, notes, terms
    })
    res.status(201).json(est)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/estimates/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const doc = await Estimate.updateStatus(parseInt(req.params.id), req.user.id, req.body.status)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, status: doc.status })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/estimates/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Estimate.delete(parseInt(req.params.id), req.user.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
