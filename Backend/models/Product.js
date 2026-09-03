const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  image: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  brand: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);