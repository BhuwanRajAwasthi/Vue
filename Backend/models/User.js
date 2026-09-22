const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: true },
  emailVerificationCodeHash: { type: String, default: '' },
  emailVerificationExpiresAt: { type: Date, default: null },
  emailVerificationAttempts: { type: Number, default: 0 },
  password: { type: String, required: false },
  googleId: { type: String, default: '' },
  githubId: { type: String, default: '' },
  avatar: { type: String, default: '' },
  preferredPayment: { type: String, enum: ['cash_on_delivery', 'esewa'], default: 'cash_on_delivery' },
  phone: { type: String, default: '' },
  otpHash: { type: String, default: '' },
  otpExpiresAt: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  location: {
    latitude: Number,
    longitude: Number
  },
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, min: 1, default: 1 },
    selected: { type: Boolean, default: true },
    selectedSize: { type: String, default: '' },
    selectedColor: { type: String, default: '' }
  }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
