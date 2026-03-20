const express = require('express')
const Company = require('../models/Company')
const auth    = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/company
router.get('/', async (req, res) => {
  try {
    const co = await Company.findOne({ userId: req.user._id })
    res.json(co || {})
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/company
router.put('/', async (req, res) => {
  try {
    const allowed = ['name','logo','address','state','pincode','gstin','pan','cin','msme',
      'mobile','email','website','bank','accName','accNo','ifsc','branch','upi',
      'invoicePrefix','estimatePrefix','defaultTemplate','defaultTerms','footer',
      'declaration','signature','termsConditions']

    const update = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })

    const co = await Company.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    )
    res.json(co)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
