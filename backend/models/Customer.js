const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:    { type: String, required: true, trim: true },
  mobile:  { type: String, default: '' },
  email:   { type: String, default: '' },
  address: { type: String, default: '' },
  state:   { type: String, default: '' },
  gstin:   { type: String, default: '' },
  type:    { type: String, enum: ['customer','supplier','both'], default: 'customer' },
}, { timestamps: true })

module.exports = mongoose.model('Customer', customerSchema)
