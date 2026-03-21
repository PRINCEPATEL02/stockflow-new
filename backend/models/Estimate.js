const mongoose = require('mongoose')

const lineItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, default: '' },
  qty:         { type: Number, default: 1 },
  unit:        { type: String, default: 'pcs' },
  price:       { type: Number, default: 0 },
  gstRate:     { type: Number, default: 18 },
}, { _id: false })

const estimateSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  estimateNo:   { type: String, required: true, index: true },
  date:         { type: String, required: true, index: true },
  validTill:    { type: String, default: '' },
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  customerName: { type: String, default: '', index: true },
  customer:     { type: Object, default: {} },
  items:        [lineItemSchema],
  sub:          { type: Number, default: 0 },
  cgst:         { type: Number, default: 0 },
  sgst:         { type: Number, default: 0 },
  igst:         { type: Number, default: 0 },
  discPct:      { type: Number, default: 0 },
  discAmt:      { type: Number, default: 0 },
  total:        { type: Number, default: 0, index: true },
  isIntra:      { type: Boolean, default: true },
  status:       { type: String, enum: ['pending','converted','expired'], default: 'pending', index: true },
  notes:        { type: String, default: '' },
  terms:        { type: String, default: '' },
}, { timestamps: true })

// Compound indexes for efficient queries
estimateSchema.index({ userId: 1, createdAt: -1 })
estimateSchema.index({ userId: 1, status: 1 })

module.exports = mongoose.model('Estimate', estimateSchema)
