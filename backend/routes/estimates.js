const express  = require('express')
const Estimate = require('../models/Estimate')
const Company  = require('../models/Company')
const auth     = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/estimates?q=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { q='', page = 1, limit = 50, status } = req.query
    const filter = { userId: req.user._id }
    
    // Search filter
    if (q) filter.$or = [
      { estimateNo: new RegExp(q,'i') },
      { customerName: new RegExp(q,'i') },
    ]
    if (status) filter.status = status
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const skip = (pageNum - 1) * limitNum
    
    // Field selection for list view
    const fieldList = '-items -customer -notes -terms'
    
    // Use lean() with aggregation to add first product name
    const list = await Estimate.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      { $project: {
        estimateNo: 1, date: 1, customerName: 1, total: 1, cgst: 1, sgst: 1, status: 1,
        customerId: 1, isIntra: 1, createdAt: 1,
        firstProduct: { $arrayElemAt: ['$items.productName', 0] }
      }}
    ])
    const total = await Estimate.countDocuments(filter)
    
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

// GET /api/estimates/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Estimate.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/estimates/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await Estimate.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })

    const {
      date, validTill, customerId, customerName, customer,
      items, sub, cgst, sgst, igst,
      discPct, discAmt, total, isIntra,
      status, notes, terms
    } = req.body

    // Update fields
    doc.date = date || doc.date
    doc.validTill = validTill || doc.validTill
    doc.customerId = customerId || doc.customerId
    doc.customerName = customerName || doc.customerName
    doc.customer = customer || doc.customer
    doc.items = items || doc.items
    doc.sub = sub ?? doc.sub
    doc.cgst = cgst ?? doc.cgst
    doc.sgst = sgst ?? doc.sgst
    doc.igst = igst ?? doc.igst
    doc.discPct = discPct ?? doc.discPct
    doc.discAmt = discAmt ?? doc.discAmt
    doc.total = total ?? doc.total
    doc.isIntra = isIntra ?? doc.isIntra
    doc.status = status || doc.status
    doc.notes = notes || doc.notes
    doc.terms = terms || doc.terms

    await doc.save()
    res.json(doc)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/estimates
router.post('/', async (req, res) => {
  try {
    const uid = req.user._id
    const count = await Estimate.countDocuments({ userId: uid })
    const co    = await Company.findOne({ userId: uid })
    const prefix = co?.estimatePrefix || 'EST'
    const estimateNo = `${prefix}-${String(count + 1).padStart(4, '0')}`

    const {
      date, validTill='', customerId=null, customerName='', customer={},
      items=[], sub=0, cgst=0, sgst=0, igst=0,
      discPct=0, discAmt=0, total=0, isIntra=true,
      status='pending', notes='', terms=''
    } = req.body

    const est = await Estimate.create({
      userId: uid, estimateNo, date, validTill,
      customerId: customerId || null, customerName, customer,
      items, sub, cgst, sgst, igst, discPct, discAmt, total, isIntra,
      status, notes, terms
    })
    res.status(201).json(est)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/estimates/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const doc = await Estimate.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: req.body.status },
      { new: true }
    )
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, status: doc.status })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/estimates/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Estimate.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
