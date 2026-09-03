const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  res.json(user.cart || []);
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = [];
    for (const item of incoming) {
      const product = await Product.findById(item.product);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) continue;
      cart.push({ product: product._id, quantity, selected: item.selected !== false });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { cart }, { new: true }).populate('cart.product');
    res.json(user.cart);
  } catch (error) {
    res.status(400).json({ message: 'Unable to update cart' });
  }
});

module.exports = router;