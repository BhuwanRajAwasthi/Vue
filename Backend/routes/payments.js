const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderConfirmation } = require('../utils/mailer');

const router = express.Router();

router.post('/esewa/initiate', requireAuth, async (req, res) => {
  const { items, shippingAddress } = req.body;
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  const orderItems = [];
  let subtotal = 0;
  for (const item of items || []) {
    const product = await Product.findById(item.product);
    if (!product) return res.status(400).json({ message: 'Product not found' });
    orderItems.push({ product: product._id, quantity: item.quantity, price: product.price });
    subtotal += product.price * item.quantity;
  }
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;
  if (!orderItems.length || Math.abs(total - amount) > 0.01) return res.status(400).json({ message: 'Payment total does not match order' });
  const order = await new Order({ user: req.user._id, items: orderItems, shippingAddress, subtotal, deliveryFee, total, payment: { method: 'esewa', status: 'pending' } }).save();
  sendOrderConfirmation(order, req.user).catch(err => console.error('Order email failed:', err.message));

  const transactionUuid = `${order._id}-${Date.now()}`;
  const productCode = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
  const fields = {
    amount: amount.toFixed(2),
    tax_amount: '0',
    total_amount: amount.toFixed(2),
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: process.env.ESEWA_SUCCESS_URL || 'http://localhost:5173/cart?payment=success',
    failure_url: process.env.ESEWA_FAILURE_URL || 'http://localhost:5173/cart?payment=failed',
    signed_field_names: 'total_amount,transaction_uuid,product_code'
  };
  const message = fields.signed_field_names.split(',').map(key => `${key}=${fields[key]}`).join(',');
  fields.signature = crypto.createHmac('sha256', process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q').update(message).digest('base64');

  res.json({ orderId: order._id,
    action: process.env.ESEWA_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    fields
  });
});

module.exports = router;
