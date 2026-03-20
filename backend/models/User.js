const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:    { type: String, default: '', trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 4 },
  name:     { type: String, required: true, trim: true },
  // Password reset fields
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpire: { type: Date, default: null },
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

userSchema.set('toJSON', {
  transform: (_, obj) => { delete obj.password; return obj }
})

module.exports = mongoose.model('User', userSchema)
