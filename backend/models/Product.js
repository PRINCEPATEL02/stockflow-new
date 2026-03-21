const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:        { type: String, required: true, trim: true, index: true },
  sku:         { type: String, default: '', index: true },
  category:    { type: String, default: '', index: true },
  unit:        { type: String, default: 'pcs' },
  price:       { type: Number, default: 0 },
  costPrice:   { type: Number, default: 0 },
  gstRate:     { type: Number, default: 18 },
  stock:       { type: Number, default: 0, index: true },
  minStock:    { type: Number, default: 5 },
  description: { type: String, default: '' },
  // Bill of Materials — raw materials used to make this product
  rawMaterials: [{
    materialId:   { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
    materialName: { type: String, default: '' },
    qty:          { type: Number, default: 0 },
    unit:         { type: String, default: '' },
  }],
}, { timestamps: true })

// Compound indexes for efficient queries
productSchema.index({ userId: 1, category: 1 })
productSchema.index({ userId: 1, name: 1 })
productSchema.index({ userId: 1, stock: 1, minStock: 1 })
// Text index for full-text search (replaces slow regex)
productSchema.index({ name: 'text', sku: 'text', category: 'text' })

module.exports = mongoose.model('Product', productSchema)
