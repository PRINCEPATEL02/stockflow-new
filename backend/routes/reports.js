const express = require('express')
const Sale = require('../models/Sale')
const Purchase = require('../models/Purchase')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const uid = req.user.id
    const period = req.query.period || 'month'
    const now = new Date()

    // Build date filter for period
    let startDate, endDate
    if (period === 'month') {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      startDate = `${y}-${m}-01`
      endDate = `${y}-${m}-31`
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3)
      const months = [q * 3 + 1, q * 3 + 2, q * 3 + 3]
      const y = now.getFullYear()
      startDate = `${y}-${String(months[0]).padStart(2, '0')}-01`
      endDate = `${y}-${String(months[2]).padStart(2, '0')}-31`
    } else if (period === 'year') {
      const y = now.getFullYear()
      startDate = `${y}-01-01`
      endDate = `${y}-12-31`
    }

    const [fSales, fPurch] = await Promise.all([
      Sale.findByDateRange(uid, startDate, endDate),
      Purchase.findByDateRange(uid, startDate, endDate)
    ])

    const totSales = fSales.reduce((a, s) => a + parseFloat(s.total || 0), 0)
    const totPurch = fPurch.reduce((a, p) => a + parseFloat(p.total || 0), 0)
    const totCGST = fSales.reduce((a, s) => a + parseFloat(s.cgst || 0), 0)
    const totSGST = fSales.reduce((a, s) => a + parseFloat(s.sgst || 0), 0)
    const totIGST = fSales.reduce((a, s) => a + parseFloat(s.igst || 0), 0)

    // Top products by revenue
    const prodRev = {}
    fSales.forEach(s => {
      if (s.items) {
        s.items.forEach(item => {
          const n = item.productName || 'Unknown'
          prodRev[n] = (prodRev[n] || 0) + (item.qty || 0) * (item.price || 0)
        })
      }
    })
    const topProds = Object.entries(prodRev).sort((a, b) => b[1] - a[1]).slice(0, 6)

    // Top customers by revenue
    const custRev = {}
    fSales.forEach(s => {
      const n = s.customerName || 'Unknown'
      custRev[n] = (custRev[n] || 0) + parseFloat(s.total || 0)
    })
    const topCusts = Object.entries(custRev).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Monthly breakdown last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const lbl = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      
      const mStart = `${prefix}-01`
      const mEnd = `${prefix}-31`
      
      const ms = fSales
        .filter(s => s.date?.startsWith(prefix))
        .reduce((a, s) => a + parseFloat(s.total || 0), 0)
      const mp = fPurch
        .filter(p => p.date?.startsWith(prefix))
        .reduce((a, p) => a + parseFloat(p.total || 0), 0)
      
      months.push({ lbl, s: ms, p: mp, profit: ms - mp })
    }

    res.json({
      totSales,
      totPurch,
      profit: totSales - totPurch,
      totCGST,
      totSGST,
      totIGST,
      topProds,
      topCusts,
      months,
      invoiceCount: fSales.length
    })
  } catch (err) {
    console.error('Reports error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
