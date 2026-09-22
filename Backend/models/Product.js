const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  stock: { type: Number, default: 0 },
  brand: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);