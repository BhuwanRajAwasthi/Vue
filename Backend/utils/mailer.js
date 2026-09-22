const nodemailer = require('nodemailer');

const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

async function sendOrderConfirmation(order, user) {
  if (!transporter || !user?.email) return;

  const orderDate = new Date(order.createdAt || Date.now());
  const deliveryEst = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const paymentLabel = order.payment?.method === 'esewa'
    ? 'eSewa Online Payment (PAID)'
    : 'Cash on Delivery (Pay when order arrives)';

  const itemsList = (order.items || []).map((it, idx) => {
    const title = it.product?.title || it.title || `Item #${idx + 1}`;
    const variant = [it.selectedSize ? `Size: ${it.selectedSize}` : '', it.selectedColor ? `Color: ${it.selectedColor}` : ''].filter(Boolean).join(', ');
    const price = Number(it.price || it.product?.price || 0);
    const lineTotal = price * Number(it.quantity || 1);
    return {
      title,
      variant,
      quantity: it.quantity || 1,
      price,
      lineTotal
    };
  });

  const itemsHtml = itemsList.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.title}</strong>
        ${item.variant ? `<br><span style="font-size: 12px; color: #6b7280;">${item.variant}</span>` : ''}
      </td>
      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Rs. ${item.price.toLocaleString()}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Rs. ${item.lineTotal.toLocaleString()}</td>
    </tr>
  `).join('');

  const itemsText = itemsList.map(item =>
    `- ${item.title} ${item.variant ? `(${item.variant}) ` : ''}x ${item.quantity} = Rs. ${item.lineTotal}`
  ).join('\n');

  const shipping = order.shippingAddress || {};
  const shippingText = `${shipping.fullName || user.name || ''}\n${shipping.address || ''}, ${shipping.city || ''}\nPhone: ${shipping.phone || ''}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #17221d; padding: 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #f4b942;">NepKart</h1>
        <p style="margin: 6px 0 0; color: #aebcaf; font-size: 14px;">Order Confirmation & Receipt</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Thank you for your order, ${user.name || 'valued customer'}!</h2>
        <p style="margin: 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.5;">
          We've received your order <strong>#${order._id}</strong> and are preparing it for delivery.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 13px;">Estimated Delivery:</span>
            <strong style="color: #065f46; font-size: 14px;">${deliveryEst}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 13px;">Payment Method:</span>
            <strong style="color: #111827; font-size: 13px;">${paymentLabel}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280; font-size: 13px;">Order Status:</span>
            <strong style="color: #1d4ed8; font-size: 13px; text-transform: uppercase;">${order.status || 'Processing'}</strong>
          </div>
        </div>

        <h3 style="margin: 0 0 12px; font-size: 16px; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f9fafb; color: #4b5563;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; color: #6b7280;">Subtotal:</td>
              <td style="padding: 10px; text-align: right;">Rs. ${Number(order.subtotal || (order.total - (order.deliveryFee || 50))).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; color: #6b7280;">Delivery Fee:</td>
              <td style="padding: 10px; text-align: right;">Rs. ${Number(order.deliveryFee || 50).toLocaleString()}</td>
            </tr>
            <tr style="font-size: 16px;">
              <td colspan="3" style="padding: 12px 10px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb;">Grand Total:</td>
              <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #065f46; border-top: 2px solid #e5e7eb;">Rs. ${Number(order.total).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #fdfdfc; border: 1px dashed #d1d5db; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Delivery Address</h4>
          <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.4;">
            <strong>${shipping.fullName || user.name || 'Recipient'}</strong><br>
            ${shipping.address || ''}, ${shipping.city || ''}<br>
            Phone: ${shipping.phone || ''}
          </p>
        </div>

        <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
          You can track this order anytime by logging into your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="color: #2563eb; text-decoration: underline;">NepKart Orders</a>.
        </p>
      </div>

      <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
        &copy; ${new Date().getFullYear()} NepKart. Everyday essentials, delivered with care.
      </div>
    </div>
  `;

  const text = `
Thank you for your order, ${user.name || 'valued customer'}!

Order #${order._id}
Estimated Delivery: ${deliveryEst}
Payment Method: ${paymentLabel}
Order Status: ${order.status || 'Processing'}

ITEMS ORDERED:
${itemsText}

Subtotal: Rs. ${Number(order.subtotal || (order.total - 50))}
Delivery Fee: Rs. ${Number(order.deliveryFee || 50)}
Grand Total: Rs. ${order.total}

DELIVERY ADDRESS:
${shippingText}

Track your order anytime at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders
`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: `Order Confirmed #${String(order._id).slice(-6)} - NepKart`,
    text,
    html
  });
}

async function sendVerificationEmail(user, code) {
  if (!transporter) {
    throw new Error('Email delivery is not configured. Add SMTP settings to Backend/.env.');
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: 'Verify your NepKart email address',
    text: `Hello ${user.name || 'there'}, your NepKart email verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Hello ${user.name || 'there'},</p><p>Your NepKart email verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p>`
  });
}

module.exports = { sendOrderConfirmation, sendVerificationEmail };
