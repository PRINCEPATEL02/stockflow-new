const express = require('express')
const Warranty = require('../models/Warranty')
const Sale = require('../models/Sale')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// POST /api/warranty - Save warranty
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      contactNumber,
      billNumber,
      billDate,
      saleId,
      products,
      warrantyEnabled,
      warrantyDuration,
      warrantyType,
      startDate
    } = req.body

    // Check for duplicate warranty for same bill
    const existingWarranty = await Warranty.findOne({
      userId: req.user._id,
      billNumber
    })

    if (existingWarranty) {
      return res.status(400).json({ error: 'Warranty already exists for this bill number' })
    }

    // Verify the sale exists
    if (saleId) {
      const sale = await Sale.findOne({ _id: saleId, userId: req.user._id })
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' })
      }
    }

    // Calculate expiry date
    let expiryDate = null
    if (warrantyEnabled && startDate && warrantyDuration) {
      const start = new Date(startDate)
      if (warrantyType === 'months') {
        start.setMonth(start.getMonth() + warrantyDuration)
      } else {
        start.setDate(start.getDate() + warrantyDuration)
      }
      expiryDate = start
    }

    // Determine status
    let status = 'active'
    if (warrantyEnabled && expiryDate && new Date() > expiryDate) {
      status = 'expired'
    }

    const warranty = await Warranty.create({
      userId: req.user._id,
      customerName,
      contactNumber,
      billNumber,
      billDate,
      saleId: saleId || null,
      products: products || [],
      warrantyEnabled: warrantyEnabled || false,
      warrantyDuration: warrantyDuration || 0,
      warrantyType: warrantyType || 'days',
      startDate: warrantyEnabled ? startDate : null,
      expiryDate,
      status
    })

    res.status(201).json(warranty)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/warranty - Get all warranties with optional filters
router.get('/', async (req, res) => {
  try {
    const { q = '', status = '', page = 1, limit = 50 } = req.query
    const filter = { userId: req.user._id }

    // Search filter
    if (q) {
      filter.$or = [
        { customerName: new RegExp(q, 'i') },
        { billNumber: new RegExp(q, 'i') }
      ]
    }

    // Status filter
    if (status) {
      filter.status = status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const warranties = await Warranty.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Warranty.countDocuments(filter)

    // Add remaining days to each warranty
    const warrantiesWithRemainingDays = warranties.map(w => {
      const wObj = w.toObject()
      if (wObj.expiryDate) {
        const now = new Date()
        const expiry = new Date(wObj.expiryDate)
        const diffTime = expiry - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        wObj.remainingDays = diffDays > 0 ? diffDays : 0
        wObj.isExpired = diffDays <= 0
      } else {
        wObj.remainingDays = null
        wObj.isExpired = false
      }
      return wObj
    })

    res.json({
      warranties: warrantiesWithRemainingDays,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/warranty/:id - Get specific warranty
router.get('/:id', async (req, res) => {
  try {
    const warranty = await Warranty.findOne({ _id: req.params.id, userId: req.user._id })
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' })
    }

    const wObj = warranty.toObject()
    if (wObj.expiryDate) {
      const now = new Date()
      const expiry = new Date(wObj.expiryDate)
      const diffTime = expiry - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      wObj.remainingDays = diffDays > 0 ? diffDays : 0
      wObj.isExpired = diffDays <= 0
    } else {
      wObj.remainingDays = null
      wObj.isExpired = false
    }

    res.json(wObj)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/warranty/bill/:billNumber - Check if warranty exists for a bill
router.get('/bill/:billNumber', async (req, res) => {
  try {
    const warranty = await Warranty.findOne({
      userId: req.user._id,
      billNumber: req.params.billNumber
    })

    res.json({ exists: !!warranty, warranty })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/warranty/:id - Update warranty
router.patch('/:id', async (req, res) => {
  try {
    const {
      warrantyEnabled,
      warrantyDuration,
      warrantyType,
      startDate
    } = req.body

    const warranty = await Warranty.findOne({ _id: req.params.id, userId: req.user._id })
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' })
    }

    // Update fields
    if (warrantyEnabled !== undefined) warranty.warrantyEnabled = warrantyEnabled
    if (warrantyDuration !== undefined) warranty.warrantyDuration = warrantyDuration
    if (warrantyType !== undefined) warranty.warrantyType = warrantyType
    if (startDate !== undefined) warranty.startDate = warrantyEnabled ? startDate : null

    // Recalculate expiry date and status
    if (warranty.warrantyEnabled && warranty.startDate && warranty.warrantyDuration) {
      const start = new Date(warranty.startDate)
      if (warranty.warrantyType === 'months') {
        start.setMonth(start.getMonth() + warranty.warrantyDuration)
      } else {
        start.setDate(start.getDate() + warranty.warrantyDuration)
      }
      warranty.expiryDate = start

      if (new Date() > warranty.expiryDate) {
        warranty.status = 'expired'
      } else {
        warranty.status = 'active'
      }
    } else {
      warranty.expiryDate = null
      warranty.status = 'active'
    }

    await warranty.save()

    const wObj = warranty.toObject()
    if (wObj.expiryDate) {
      const now = new Date()
      const expiry = new Date(wObj.expiryDate)
      const diffTime = expiry - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      wObj.remainingDays = diffDays > 0 ? diffDays : 0
      wObj.isExpired = diffDays <= 0
    }

    res.json(warranty)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/warranty/:id - Delete warranty
router.delete('/:id', async (req, res) => {
  try {
    const warranty = await Warranty.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' })
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/warranty/stats/summary - Get warranty statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Warranty.countDocuments({ userId: req.user._id })
    const active = await Warranty.countDocuments({ userId: req.user._id, status: 'active' })
    const expired = await Warranty.countDocuments({ userId: req.user._id, status: 'expired' })

    // Get warranties expiring in next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiringSoon = await Warranty.countDocuments({
      userId: req.user._id,
      status: 'active',
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
    })

    res.json({
      total,
      active,
      expired,
      expiringSoon
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
