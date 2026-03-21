const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:    { type: String, required: true, trim: true, index: true },
  mobile:  { type: String, default: '', index: true },
  email:   { type: String, default: '' },
  address: { type: String, default: '' },
  state:   { type: String, default: '', index: true },
  gstin:   { type: String, default: '' },
  type:    { type: String, enum: ['customer','supplier','both'], default: 'customer', index: true },
}, { timestamps: true })

// Compound index for efficient queries
customerSchema.index({ userId: 1, name: 1 })

module.exports = mongoose.model('Customer', customerSchema)
