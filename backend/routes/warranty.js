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
    const existingWarranty = await Warranty.findByBillNumber(req.user.id, billNumber)
    if (existingWarranty) {
      return res.status(400).json({ error: 'Warranty already exists for this bill number' })
    }

    // Verify the sale exists
    if (saleId) {
      const sale = await Sale.findById(saleId, req.user.id)
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
      userId: req.user.id,
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
    const result = await Warranty.findAll(req.user.id, { q, status, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/warranty/:id - Get specific warranty
router.get('/:id', async (req, res) => {
  try {
    const warranty = await Warranty.findById(parseInt(req.params.id), req.user.id)
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' })
    }
    res.json(warranty)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/warranty/bill/:billNumber - Check if warranty exists for a bill
router.get('/bill/:billNumber', async (req, res) => {
  try {
    const warranty = await Warranty.findByBillNumber(req.user.id, req.params.billNumber)
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

    const warranty = await Warranty.findById(parseInt(req.params.id), req.user.id)
    if (!warranty) {
      return res.status(404).json({ error: 'Warranty not found' })
    }

    // Update fields
    let updatedData = { ...req.body }
    
    // Recalculate expiry date and status
    if (updatedData.warrantyEnabled && startDate && warrantyDuration) {
      const start = new Date(startDate)
      if (warrantyType === 'months') {
        start.setMonth(start.getMonth() + warrantyDuration)
      } else {
        start.setDate(start.getDate() + warrantyDuration)
      }
      const expiryDate = start

      if (new Date() > expiryDate) {
        updatedData.status = 'expired'
      } else {
        updatedData.status = 'active'
      }
      updatedData.expiryDate = expiryDate
    } else {
      updatedData.expiryDate = null
      updatedData.status = 'active'
    }

    const updated = await Warranty.updateWithExpiry(parseInt(req.params.id), req.user.id, updatedData)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/warranty/:id - Delete warranty
router.delete('/:id', async (req, res) => {
  try {
    const warranty = await Warranty.delete(parseInt(req.params.id), req.user.id)
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
    const stats = await Warranty.getStats(req.user.id)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
