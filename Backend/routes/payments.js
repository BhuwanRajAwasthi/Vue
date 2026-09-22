const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmation } = require('../utils/mailer');

const router = express.Router();

router.post('/esewa/initiate', requireAuth, async (req, res) => {
  const { items, shippingAddress } = req.body;
  const amount = Number(req.body.amount);
  const esewaSecret = String(process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q').replace(/^['"]|['"]$/g, '').trim();
  const esewaUrl = String(process.env.ESEWA_URL || 'https://rc.esewa.com.np/api/epay/main/v2/form').trim();

  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
  if (!esewaSecret || !esewaUrl) {
    return res.status(503).json({ message: 'eSewa is not configured. Set ESEWA_URL and ESEWA_SECRET in Backend/.env.' });
  }

  const orderItems = [];
  let subtotal = 0;
  for (const item of items || []) {
    const product = await Product.findById(item.product);
    if (!product) return res.status(400).json({ message: 'Product not found' });
    if (product.stock <= 0) return res.status(400).json({ message: `${product.title} is out of stock` });
    orderItems.push({
      product: product._id,
      title: product.title,
      image: product.image || (product.images && product.images[0]) || '',
      category: product.category || '',
      description: product.description || '',
      quantity: item.quantity,
      price: product.price,
      selectedSize: item.selectedSize || '',
      selectedColor: item.selectedColor || ''
    });
    subtotal += product.price * item.quantity;
  }

  const deliveryFee = 50;
  const total = subtotal + deliveryFee;
  if (!orderItems.length || Math.abs(total - amount) > 0.01) {
    return res.status(400).json({ message: 'Payment total does not match order' });
  }

  const order = await new Order({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    deliveryFee,
    total,
    payment: { method: 'esewa', status: 'pending' }
  }).save();

  const transactionUuid = `${order._id}-${Date.now()}`;
  const productCode = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
  const backendBase = process.env.BACKEND_URL || 'http://localhost:4000';
  const fields = {
    amount: amount.toFixed(2),
    tax_amount: '0',
    total_amount: amount.toFixed(2),
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: process.env.ESEWA_SUCCESS_URL || `${backendBase}/api/payments/esewa/success`,
    failure_url: process.env.ESEWA_FAILURE_URL || `${backendBase}/api/payments/esewa/failure`,
    signed_field_names: 'total_amount,transaction_uuid,product_code'
  };

  const message = fields.signed_field_names.split(',').map(key => `${key}=${fields[key]}`).join(',');
  fields.signature = crypto.createHmac('sha256', esewaSecret).update(message).digest('base64');

  res.json({
    orderId: order._id,
    action: esewaUrl,
    fields
  });
});

router.get('/esewa/success', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const encoded = String(req.query.data || '');
    if (!encoded) return res.redirect(`${frontendUrl}/cart?payment=failed`);

    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    const signedFields = String(decoded.signed_field_names || '').split(',').filter(Boolean);
    const message = signedFields.map(key => `${key}=${decoded[key]}`).join(',');
    const esewaSecret = String(process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q').replace(/^['"]|['"]$/g, '').trim();
    const signature = crypto.createHmac('sha256', esewaSecret).update(message).digest('base64');

    if (signature !== decoded.signature || decoded.status !== 'COMPLETE') {
      console.warn('eSewa verification signature or status failed', { signature, decodedSig: decoded.signature, status: decoded.status });
      return res.redirect(`${frontendUrl}/cart?payment=failed`);
    }

    const orderId = String(decoded.transaction_uuid || '').split('-')[0];
    const order = await Order.findById(orderId).populate('user').populate('items.product');
    const receivedAmount = Number(String(decoded.total_amount || '').replace(/,/g, ''));

    if (!order || Math.abs(receivedAmount - order.total) > 0.01) {
      console.warn('eSewa order not found or amount mismatch', { receivedAmount, orderTotal: order?.total });
      return res.redirect(`${frontendUrl}/cart?payment=failed`);
    }

    order.payment = {
      method: 'esewa',
      status: 'paid',
      transactionCode: decoded.transaction_code,
      transactionUuid: decoded.transaction_uuid
    };
    order.status = 'processing';
    await order.save();

    // Decrement inventory stock
    for (const it of order.items) {
      const pId = it.product?._id || it.product;
      await Product.findByIdAndUpdate(pId, { $inc: { stock: -it.quantity } });
    }

    // Remove purchased items from user's persistent database cart
    if (order.user) {
      const purchasedIds = order.items.map(it => it.product?._id || it.product);
      await User.findByIdAndUpdate(order.user._id, {
        $pull: { cart: { product: { $in: purchasedIds } } }
      });
    }

    sendOrderConfirmation(order, order.user).catch(err => console.error('Order email failed:', err.message));
    res.redirect(`${frontendUrl}/orders?payment=success&orderId=${order._id}`);
  } catch (error) {
    console.error('eSewa verification exception:', error.message);
    res.redirect(`${frontendUrl}/cart?payment=failed`);
  }
});

router.get('/esewa/failure', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/cart?payment=failed`);
});

module.exports = router;
