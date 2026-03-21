const mongoose = require('mongoose')

const lineItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, default: '' },
  qty:         { type: Number, default: 1 },
  unit:        { type: String, default: 'pcs' },
  price:       { type: Number, default: 0 },
  gstRate:     { type: Number, default: 18 },
}, { _id: false })

const saleSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  invoiceNo:     { type: String, required: true, index: true },
  date:          { type: String, required: true, index: true },
  dueDate:       { type: String, default: '' },
  customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  customerName:  { type: String, default: '', index: true },
  customer:      { type: Object, default: {} },
  // Customer address details for billing
  billTo:        { type: Object, default: {} },   // Billing address
  shipTo:        { type: Object, default: {} },   // Shipping address
  items:         [lineItemSchema],
  sub:           { type: Number, default: 0 },
  cgst:          { type: Number, default: 0 },
  sgst:          { type: Number, default: 0 },
  igst:          { type: Number, default: 0 },
  discPct:       { type: Number, default: 0 },
  discAmt:       { type: Number, default: 0 },
  total:         { type: Number, default: 0, index: true },
  isIntra:       { type: Boolean, default: true },
  // Payment tracking
  status:        { type: String, enum: ['unpaid','paid','partial','overdue'], default: 'unpaid', index: true },
  amountPaid:    { type: Number, default: 0 },
  paymentDate:   { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  // Additional fields
  notes:         { type: String, default: '' },
  terms:         { type: String, default: '' },
  declaration:  { type: String, default: '' },
  // Template and signature
  templateId:    { type: String, default: 'classic-tally' },
  signature:     { type: String, default: '' },
  // Place of supply
  placeOfSupply: { type: String, default: '' },
  // HSN/SAC
  hsnCode:       { type: String, default: '' },
}, { timestamps: true })

// Compound indexes for efficient querying
saleSchema.index({ userId: 1, createdAt: -1 })
saleSchema.index({ userId: 1, status: 1 })
saleSchema.index({ userId: 1, date: -1 })
saleSchema.index({ userId: 1, customerName: 'text' })
saleSchema.index({ userId: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('Sale', saleSchema)
