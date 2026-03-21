const mongoose = require('mongoose')

const lineItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, default: '' },
  qty:         { type: Number, default: 1 },
  unit:        { type: String, default: 'pcs' },
  price:       { type: Number, default: 0 },
  gstRate:     { type: Number, default: 18 },
}, { _id: false })

const purchaseSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purchaseNo:    { type: String, required: true, index: true },
  date:          { type: String, required: true, index: true },
  supplierName:  { type: String, default: '', index: true },
  supplierGstin: { type: String, default: '' },
  billNo:        { type: String, default: '', index: true },
  items:         [lineItemSchema],
  sub:           { type: Number, default: 0 },
  cgst:          { type: Number, default: 0 },
  sgst:          { type: Number, default: 0 },
  igst:          { type: Number, default: 0 },
  total:         { type: Number, default: 0, index: true },
  status:        { type: String, enum: ['paid','unpaid','partial'], default: 'paid', index: true },
  notes:         { type: String, default: '' },
}, { timestamps: true })

// Compound indexes for efficient queries
purchaseSchema.index({ userId: 1, createdAt: -1 })
purchaseSchema.index({ userId: 1, supplierName: 1 })

module.exports = mongoose.model('Purchase', purchaseSchema)
