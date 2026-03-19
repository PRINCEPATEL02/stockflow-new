const mongoose = require('mongoose')

const companySchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name:            { type: String, default: '' },
  logo:            { type: String, default: '' },   // base64 or URL
  address:         { type: String, default: '' },
  state:           { type: String, default: '' },
  pincode:         { type: String, default: '' },
  gstin:           { type: String, default: '' },
  pan:             { type: String, default: '' },
  cin:             { type: String, default: '' },
  msme:            { type: String, default: '' },
  mobile:          { type: String, default: '' },
  email:           { type: String, default: '' },
  website:         { type: String, default: '' },
  bank:            { type: String, default: '' },
  accName:         { type: String, default: '' },
  accNo:           { type: String, default: '' },
  ifsc:            { type: String, default: '' },
  branch:          { type: String, default: '' },
  upi:             { type: String, default: '' },
  invoicePrefix:   { type: String, default: 'INV' },
  estimatePrefix:  { type: String, default: 'EST' },
  defaultTemplate:{ type: String, default: 'modern-violet' },
  defaultTerms:    { type: String, default: '' },
  footer:          { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Company', companySchema)
