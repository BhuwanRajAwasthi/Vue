const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
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
      if (product.stock <= 0) return res.status(400).json({ message: `${product.title} is out of stock` });
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > product.stock) {
        return res.status(400).json({ message: `${product.title} does not have enough stock` });
      }
      orderItems.push({
        product: product._id,
        title: product.title,
        image: product.image || (product.images && product.images[0]) || '',
        category: product.category || '',
        description: product.description || '',
        quantity: it.quantity,
        price: product.price,
        selectedSize: it.selectedSize || '',
        selectedColor: it.selectedColor || ''
      });
      subtotal += product.price * it.quantity;
    }
    const deliveryFee = 50;
    const total = subtotal + deliveryFee;
    const order = new Order({ user: req.user._id, items: orderItems, shippingAddress, payment, subtotal, deliveryFee, total });
    await order.save();

    // Decrement stock for ordered items
    for (const it of orderItems) {
      await Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } });
    }

    // Remove purchased items from user's persistent cart
    const purchasedIds = orderItems.map(it => it.product);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { cart: { product: { $in: purchasedIds } } }
    });

    // Populate order items for rich email confirmation
    const populatedOrder = await Order.findById(order._id).populate('items.product');
    sendOrderConfirmation(populatedOrder || order, req.user).catch(err => console.error('Order email failed:', err.message));

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
