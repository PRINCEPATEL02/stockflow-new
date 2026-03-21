const mongoose = require('mongoose')

const productWarrantySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, default: '' },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
}, { _id: false })

const warrantySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Customer details
  customerName: { type: String, required: true },
  contactNumber: { type: String, default: '' },
  
  // Bill details
  billNumber: { type: String, required: true },
  billDate: { type: String, required: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
  
  // Products
  products: [productWarrantySchema],
  
  // Warranty details
  warrantyEnabled: { type: Boolean, default: false },
  warrantyDuration: { type: Number, default: 0 },
  warrantyType: { type: String, enum: ['days', 'months'], default: 'days' },
  startDate: { type: Date, default: null },
  expiryDate: { type: Date, default: null },
  
  // Status
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
}, { timestamps: true })

// Index for efficient queries
warrantySchema.index({ userId: 1, billNumber: 1 }, { unique: true })
warrantySchema.index({ userId: 1, status: 1 })
warrantySchema.index({ userId: 1, customerName: 'text', billNumber: 'text' })

// Virtual for remaining days
warrantySchema.virtual('remainingDays').get(function() {
  if (!this.expiryDate) return null
  const now = new Date()
  const expiry = new Date(this.expiryDate)
  const diffTime = expiry - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Method to calculate expiry date
warrantySchema.methods.calculateExpiryDate = function() {
  if (!this.startDate || !this.warrantyEnabled || !this.warrantyDuration) {
    return null
  }
  
  const start = new Date(this.startDate)
  if (this.warrantyType === 'months') {
    start.setMonth(start.getMonth() + this.warrantyDuration)
  } else {
    start.setDate(start.getDate() + this.warrantyDuration)
  }
  
  return start
}

// Pre-save middleware to set expiry date and status
warrantySchema.pre('save', function(next) {
  if (this.warrantyEnabled && this.startDate && this.warrantyDuration) {
    this.expiryDate = this.calculateExpiryDate()
    
    // Update status based on expiry
    if (this.expiryDate && new Date() > this.expiryDate) {
      this.status = 'expired'
    } else {
      this.status = 'active'
    }
  } else {
    this.expiryDate = null
    this.status = 'active'
  }
  next()
})

module.exports = mongoose.model('Warranty', warrantySchema)
