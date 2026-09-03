const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    price: { type: Number }
  }],
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String
  },
  status: { type: String, enum: ['pending','processing','shipped','delivered','cancelled'], default: 'pending' },
  subtotal: { type: Number },
  total: { type: Number },
  deliveryFee: { type: Number, default: 50 },
  payment: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
