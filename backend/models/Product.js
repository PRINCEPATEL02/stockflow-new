const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  sku:         { type: String, default: '' },
  category:    { type: String, default: '' },
  unit:        { type: String, default: 'pcs' },
  price:       { type: Number, default: 0 },
  costPrice:   { type: Number, default: 0 },
  gstRate:     { type: Number, default: 18 },
  stock:       { type: Number, default: 0 },
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

module.exports = mongoose.model('Product', productSchema)
