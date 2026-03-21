const mongoose = require('mongoose')

const rawMaterialSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  sku:         { type: String, default: '' },
  category:    { type: String, default: '' },
  unit:        { type: String, default: 'kg' },
  costPrice:   { type: Number, default: 0 },
  gstRate:     { type: Number, default: 18 },
  stock:       { type: Number, default: 0 },
  minStock:    { type: Number, default: 5 },
  description: { type: String, default: '' },
}, { timestamps: true })

// Compound indexes for efficient queries
rawMaterialSchema.index({ userId: 1, category: 1 })
rawMaterialSchema.index({ userId: 1, stock: 1 })
rawMaterialSchema.index({ name: 'text', sku: 'text' })

module.exports = mongoose.model('RawMaterial', rawMaterialSchema)
