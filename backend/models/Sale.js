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
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  invoiceNo:    { type: String, required: true },
  date:         { type: String, required: true },
  dueDate:      { type: String, default: '' },
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customerName: { type: String, default: '' },
  customer:     { type: Object, default: {} },
  items:        [lineItemSchema],
  sub:          { type: Number, default: 0 },
  cgst:         { type: Number, default: 0 },
  sgst:         { type: Number, default: 0 },
  igst:         { type: Number, default: 0 },
  discPct:      { type: Number, default: 0 },
  discAmt:      { type: Number, default: 0 },
  total:        { type: Number, default: 0 },
  isIntra:      { type: Boolean, default: true },
  status:       { type: String, enum: ['unpaid','paid','partial','overdue'], default: 'unpaid' },
  notes:        { type: String, default: '' },
  terms:        { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Sale', saleSchema)
