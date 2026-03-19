const express  = require('express')
const Sale     = require('../models/Sale')
const Purchase = require('../models/Purchase')
const auth     = require('../middleware/auth')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const uid    = req.user._id
    const period = req.query.period || 'month'
    const now    = new Date()

    // Build date regex for period filter
    let dateRegex = null
    if (period === 'month') {
      const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0')
      dateRegex = new RegExp(`^${y}-${m}`)
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3)
      const months = [q*3+1, q*3+2, q*3+3].map(n => String(n).padStart(2,'0'))
      dateRegex = new RegExp(`^${now.getFullYear()}-(${months.join('|')})`)
    } else if (period === 'year') {
      dateRegex = new RegExp(`^${now.getFullYear()}`)
    }

    const sFilter = { userId: uid, ...(dateRegex ? { date: dateRegex } : {}) }
    const pFilter = { userId: uid, ...(dateRegex ? { date: dateRegex } : {}) }

    const [fSales, fPurch] = await Promise.all([
      Sale.find(sFilter),
      Purchase.find(pFilter),
    ])

    const totSales = fSales.reduce((a, s) => a + s.total, 0)
    const totPurch = fPurch.reduce((a, p) => a + p.total, 0)
    const totCGST  = fSales.reduce((a, s) => a + s.cgst,  0)
    const totSGST  = fSales.reduce((a, s) => a + s.sgst,  0)
    const totIGST  = fSales.reduce((a, s) => a + s.igst,  0)

    // Top products by revenue
    const prodRev = {}
    fSales.forEach(s => s.items.forEach(item => {
      const n = item.productName || 'Unknown'
      prodRev[n] = (prodRev[n] || 0) + (item.qty || 0) * (item.price || 0)
    }))
    const topProds = Object.entries(prodRev).sort((a,b) => b[1]-a[1]).slice(0, 6)

    // Top customers by revenue
    const custRev = {}
    fSales.forEach(s => {
      const n = s.customerName || 'Unknown'
      custRev[n] = (custRev[n] || 0) + s.total
    })
    const topCusts = Object.entries(custRev).sort((a,b) => b[1]-a[1]).slice(0, 5)

    // Monthly breakdown last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const prefix = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const lbl = d.toLocaleDateString('en-IN', { month:'short', year:'2-digit' })
      const ms = fSales.filter(s => s.date?.startsWith(prefix)).reduce((a,s) => a+s.total, 0)
      const mp = fPurch.filter(p => p.date?.startsWith(prefix)).reduce((a,p) => a+p.total, 0)
      months.push({ lbl, s: ms, p: mp, profit: ms - mp })
    }

    res.json({
      totSales, totPurch, profit: totSales - totPurch,
      totCGST, totSGST, totIGST,
      topProds, topCusts, months,
      invoiceCount: fSales.length
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
