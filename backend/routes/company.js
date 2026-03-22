const express = require('express')
const Company = require('../models/Company')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/company
router.get('/', async (req, res) => {
  try {
    const co = await Company.findByUserId(req.user.id)
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

    const co = await Company.upsert(req.user.id, update)
    res.json(co)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
