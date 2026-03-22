const express = require('express')
const Sale = require('../models/Sale')
const Purchase = require('../models/Purchase')
const Customer = require('../models/Customer')
const Product = require('../models/Product')
const RawMaterial = require('../models/RawMaterial')
const Estimate = require('../models/Estimate')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const uid = req.user.id

    // Get raw materials stock first
    const rawMats = await RawMaterial.findAll(uid)
    const rawMatMap = {}
    rawMats.forEach(rm => { rawMatMap[rm.id] = rm })

    // Also return raw materials stock for dashboard
    const rawMaterialsStock = rawMats.map(rm => ({
      id: rm.id,
      name: rm.name,
      stock: rm.stock,
      unit: rm.unit
    })).sort((a, b) => a.stock - b.stock)

    // Calculate production capacity for each product
    const products = await Product.findAllWithoutPagination(uid)
    const productionCapacity = products.map(p => {
      let maxCanMake = Infinity
      let limitingMaterial = null
      let limitingQty = 0
      let limitingStock = 0
      
      if (p.raw_materials && p.raw_materials.length > 0) {
        p.raw_materials.forEach(rm => {
          // Try to match by materialId or by materialName
          let rawStock = null
          if (rm.materialId) {
            rawStock = rawMatMap[rm.materialId]
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
        id: p.id,
        name: p.name,
        canMake: maxCanMake,
        limitingMaterial,
        limitingQty: limitingQty || 0,
        limitingStock,
        unit: p.unit
      }
    }).filter(p => p.limitingMaterial).sort((a, b) => a.canMake - b.canMake)

    const [totSales, totPurch, custCount, prodCount, unpaidCount, pendEst, recentSales] =
      await Promise.all([
        Sale.getTotalSales(uid),
        Purchase.getTotalPurchases(uid),
        Customer.count(uid),
        Product.count(uid),
        Sale.count(uid, { status: 'unpaid' }),
        Estimate.count(uid, { status: 'pending' }),
        Sale.findRecent(uid, 6)
      ])

    // Last 6 months chart data
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const prefix = `${y}-${m}`
      const lbl = d.toLocaleDateString('en-IN', { month: 'short' })

      // Get sales and purchases for this month
      const allSales = await Sale.findByDateRange(uid, `${prefix}-01`, `${prefix}-31`)
      const allPurchases = await Purchase.findByDateRange(uid, `${prefix}-01`, `${prefix}-31`)
      
      const s = allSales.reduce((acc, s) => acc + parseFloat(s.total || 0), 0)
      const p = allPurchases.reduce((acc, p) => acc + parseFloat(p.total || 0), 0)
      
      months.push({ lbl, s, p })
    }

    res.json({ 
      totSales, 
      totPurch, 
      profit: totSales - totPurch, 
      custCount, 
      prodCount, 
      unpaidCount, 
      pendEst, 
      productionCapacity, 
      rawMaterialsStock, 
      recentSales, 
      months 
    })
  } catch (err) { 
    console.error('Dashboard error:', err)
    res.status(500).json({ error: err.message }) 
  }
})

module.exports = router
