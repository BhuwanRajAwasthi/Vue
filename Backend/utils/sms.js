const crypto = require('crypto');
const Otp = require('../models/Otp');
const OTP_TTL_MS = 5 * 60 * 1000;

function normalizePhone(phone) {
  return String(phone || '').replace(/[\s()-]/g, '');
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function sendSms(phone, message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    throw new Error('SMS delivery is not configured. Add Twilio settings to Backend/.env.');
  }

  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM_NUMBER, Body: message }).toString()
  });

  if (!response.ok) throw new Error('The SMS provider rejected the OTP message.');
}

async function createAndSendOtp(phone) {
  const normalizedPhone = normalizePhone(phone);
  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await Otp.findOneAndUpdate(
    { phone: normalizedPhone },
    { codeHash: hashOtp(code), expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendSms(normalizedPhone, `Your NepKart verification code is ${code}. It expires in 5 minutes.`);
  } catch (error) {
    await Otp.deleteOne({ phone: normalizedPhone });
    throw error;
  }
}

async function verifyOtp(phone, code) {
  const normalizedPhone = normalizePhone(phone);
  const record = await Otp.findOne({ phone: normalizedPhone });
  if (!record || record.expiresAt.getTime() < Date.now() || record.attempts >= 5) return false;

  record.attempts += 1;
  const valid = record.codeHash === hashOtp(String(code || '').trim());
  if (valid || record.attempts >= 5) await record.deleteOne();
  else await record.save();
  return valid;
}

module.exports = { normalizePhone, createAndSendOtp, verifyOtp };