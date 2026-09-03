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
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: `NepKart order ${order._id} confirmed`,
    text: `Thank you ${user.name}. Your NepKart order ${order._id} for Rs. ${order.total} has been placed.`,
    html: `<p>Thank you ${user.name || 'for shopping with us'}.</p><p>Your NepKart order <strong>${order._id}</strong> for <strong>Rs. ${order.total}</strong> has been placed.</p>`
  });
}

module.exports = { sendOrderConfirmation };
