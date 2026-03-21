const express  = require('express')
const Sale     = require('../models/Sale')
const Purchase = require('../models/Purchase')
const Customer = require('../models/Customer')
const Product  = require('../models/Product')
const RawMaterial = require('../models/RawMaterial')
const Estimate = require('../models/Estimate')
const auth     = require('../middleware/auth')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const uid = req.user._id

    // Get raw materials stock first
    const rawMats = await RawMaterial.find({ userId: uid }).select('_id name stock unit').lean()
    const rawMatMap = {}
    rawMats.forEach(rm => { rawMatMap[rm._id.toString()] = rm })

    // Also return raw materials stock for dashboard
    const rawMaterialsStock = rawMats.map(rm => ({
      _id: rm._id,
      name: rm.name,
      stock: rm.stock,
      unit: rm.unit
    })).sort((a, b) => a.stock - b.stock)

    // Calculate production capacity for each product
    const products = await Product.find({ userId: uid }).select('name stock minStock unit rawMaterials').lean()
    const productionCapacity = products.map(p => {
      let maxCanMake = Infinity
      let limitingMaterial = null
      let limitingQty = 0
      let limitingStock = 0
      
      if (p.rawMaterials && p.rawMaterials.length > 0) {
        p.rawMaterials.forEach(rm => {
          // Try to match by materialId (ObjectId) or by materialName
          let rawStock = null
          if (rm.materialId) {
            rawStock = rawMatMap[rm.materialId.toString()]
          }
          if (!rawStock && rm.materialName) {
            // Fallback: match by name
            rawStock = rawMats.find(mat => mat.name.toLowerCase() === rm.materialName.toLowerCase())
          }
          if (rawStock && rm.qty > 0) {
            const canMake = Math.floor(rawStock.stock / rm.qty)
            if (canMake < maxCanMake) {
              maxCanMake = canMake
              limitingMaterial = rawStock.name
              limitingQty = rm.qty
              limitingStock = rawStock.stock
            }
          }
        })
      } else {
        // No BOM - show finished product stock
        maxCanMake = p.stock || 0
        limitingMaterial = 'Finished Stock'
      }
      
      if (maxCanMake === Infinity) maxCanMake = 0
      
      return {
        _id: p._id,
        name: p.name,
        canMake: maxCanMake,
        limitingMaterial,
        limitingQty: limitingQty || 0,
        limitingStock,
        unit: p.unit
      }
    }).filter(p => p.limitingMaterial).sort((a, b) => a.canMake - b.canMake)

    const [totSalesArr, totPurchArr, custCount, prodCount, unpaidCount, pendEst, recentSales] =
      await Promise.all([
        Sale.aggregate([{ $match: { userId: uid } }, { $group: { _id: null, v: { $sum: '$total' } } }]),
        Purchase.aggregate([{ $match: { userId: uid } }, { $group: { _id: null, v: { $sum: '$total' } } }]),
        Customer.countDocuments({ userId: uid }),
        Product.countDocuments({ userId: uid }),
        Sale.countDocuments({ userId: uid, status: { $ne: 'paid' } }),
        Estimate.countDocuments({ userId: uid, status: 'pending' }),
        Sale.find({ userId: uid }).sort({ createdAt: -1 }).limit(6)
                .select('invoiceNo date customerName total status').lean(),
      ])

    const totSales = totSalesArr[0]?.v || 0
    const totPurch = totPurchArr[0]?.v || 0

    // Last 6 months chart data
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const prefix = `${y}-${m}`
      const lbl = d.toLocaleDateString('en-IN', { month: 'short' })

      const [sArr, pArr] = await Promise.all([
        Sale.aggregate([
          { $match: { userId: uid, date: { $regex: `^${prefix}` } } },
          { $group: { _id: null, v: { $sum: '$total' } } }
        ]),
        Purchase.aggregate([
          { $match: { userId: uid, date: { $regex: `^${prefix}` } } },
          { $group: { _id: null, v: { $sum: '$total' } } }
        ]),
      ])
      months.push({ lbl, s: sArr[0]?.v || 0, p: pArr[0]?.v || 0 })
    }

    res.json({ totSales, totPurch, profit: totSales - totPurch, custCount, prodCount, unpaidCount, pendEst, productionCapacity, rawMaterialsStock, recentSales, months })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
