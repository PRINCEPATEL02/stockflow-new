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
    
    // Use lean() for faster query
    const [list, total] = await Promise.all([
      Estimate.find(filter)
        .select(fieldList)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Estimate.countDocuments(filter)
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

// GET /api/estimates/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Estimate.findOne({ _id: req.params.id, userId: req.user._id })
    if (!doc) return res.status(404).json({ error: 'Not found' })
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
