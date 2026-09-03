const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../utils/mailer');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress, payment } = req.body;
    let subtotal = 0;
    const orderItems = [];
    for (const it of items) {
      const product = await Product.findById(it.product);
      if (!product) return res.status(400).json({ message: 'Product not found' });
      orderItems.push({ product: product._id, quantity: it.quantity, price: product.price });
      subtotal += product.price * it.quantity;
    }
    const deliveryFee = 50;
    const total = subtotal + deliveryFee;
    const order = new Order({ user: req.user._id, items: orderItems, shippingAddress, payment, subtotal, deliveryFee, total });
    await order.save();
    sendOrderConfirmation(order, req.user).catch(err => console.error('Order email failed:', err.message));
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  if (req.user.role === 'admin') {
    const orders = await Order.find().populate('user').populate('items.product');
    return res.json(orders);
  }
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json(orders);
});

router.get('/:id', requireAuth, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product');
  if (!order) return res.status(404).json({ message: 'Not found' });
  if (req.user.role !== 'admin' && !order.user.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
  res.json(order);
});

router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(order);
});

module.exports = router;
