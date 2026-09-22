const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/mailer');
const { normalizePhone, createAndSendOtp, verifyOtp } = require('../utils/sms');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, city, location } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const normalizedPhone = normalizePhone(phone);
    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) return res.status(400).json({ message: 'Enter a valid phone number with country code.' });
    const verificationCode = String(crypto.randomInt(100000, 1000000));
    const user = new User({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      address,
      city,
      location,
      emailVerified: false,
      emailVerificationCodeHash: crypto.createHash('sha256').update(verificationCode).digest('hex'),
      emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      emailVerificationAttempts: 0
    });
    await user.save();

    try {
      await sendVerificationEmail(user, verificationCode);
    } catch (mailError) {
      await user.deleteOne();
      throw mailError;
    }

    res.status(201).json({ message: 'Account created. Check your email for the verification code.' });
  } catch (err) {
    res.status(503).json({ message: err.message || 'Unable to create account.' });
  }
});

router.post('/resend-email-verification', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email, emailVerified: false });
    if (!user) return res.status(404).json({ message: 'No unverified account found for this email.' });

    const verificationCode = String(crypto.randomInt(100000, 1000000));
    user.emailVerificationCodeHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
    user.emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.emailVerificationAttempts = 0;
    await user.save();
    await sendVerificationEmail(user, verificationCode);

    res.json({ message: 'A new verification code was sent to your email.' });
  } catch (err) {
    res.status(503).json({ message: err.message || 'Unable to send verification email.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.emailVerified) return res.status(403).json({ message: 'Please verify your email before signing in.' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, postalCode: user.postalCode, avatar: user.avatar, preferredPayment: user.preferredPayment, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-email-otp', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const user = await User.findOne({ email, emailVerified: false });
    if (!user || !user.emailVerificationCodeHash || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date() || user.emailVerificationAttempts >= 5) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }
    user.emailVerificationAttempts += 1;
    const valid = user.emailVerificationCodeHash === crypto.createHash('sha256').update(code).digest('hex');
    if (!valid) {
      await user.save();
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }
    user.emailVerified = true;
    user.emailVerificationCodeHash = '';
    user.emailVerificationExpiresAt = null;
    user.emailVerificationAttempts = 0;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.json({ message: 'Email verified.', token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to verify email address.' });
  }
});

router.post('/phone/request-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number with country code.' });
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'No account is registered with this phone number.' });
    await createAndSendOtp(phone);
    res.json({ message: 'Verification code sent.' });
  } catch (error) {
    console.error('Phone OTP request failed:', error.message);
    res.status(503).json({ message: error.message || 'Unable to send verification code.' });
  }
});

router.post('/phone/verify-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const user = await User.findOne({ phone });
    if (!user || !(await verifyOtp(phone, req.body.code))) return res.status(400).json({ message: 'Invalid or expired verification code.' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, postalCode: user.postalCode, avatar: user.avatar, preferredPayment: user.preferredPayment, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to verify phone number.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const fields = ['name', 'phone', 'address', 'city', 'postalCode', 'avatar', 'location', 'preferredPayment'];
    const updates = Object.fromEntries(fields.filter(field => req.body[field] !== undefined).map(field => [field, req.body[field]]));
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: 'Unable to update profile' });
  }
});

router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'nepkart-avatars' }, (error, value) => error ? reject(error) : resolve(value));
      stream.end(req.file.buffer);
    });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url }, { new: true }).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Profile image upload failed' });
  }
});

// Google OAuth - Redirect to Google consent
router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('Google sign in is not configured on the server')}`);
  }
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback';
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'select_account'
  });
  res.redirect(`${rootUrl}?${params.toString()}`);
});

// Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, error } = req.query;

  if (error || !code) {
    console.error('Google OAuth error param:', error);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error || 'Google authorization failed')}`);
  }

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback';
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to get Google token:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to exchange Google authorization token')}`);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();
    if (!profileRes.ok) throw new Error(profile.error_description || 'Google profile request failed');

    if (!profile.email) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No email associated with this Google account')}`);
    }

    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }]
    });

    if (user) {
      if (!user.googleId) user.googleId = profile.sub;
      if (profile.picture && !user.avatar) user.avatar = profile.picture;
      await user.save();
    } else {
      user = new User({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        googleId: profile.sub,
        avatar: profile.picture || '',
        role: 'user'
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.redirect(`${frontendUrl}/login?token=${token}`);
  } catch (err) {
    console.error('Google OAuth callback exception:', err);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('An error occurred during Google login')}`);
  }
});

// GitHub OAuth - Redirect to GitHub authorization
router.get('/github', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent('GitHub sign in is not configured on the server')}`);
  }
  const rootUrl = 'https://github.com/login/oauth/authorize';
  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback';
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: 'user:email'
  });
  res.redirect(`${rootUrl}?${params.toString()}`);
});

// GitHub OAuth Callback
router.get('/github/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, error } = req.query;

  if (error || !code) {
    console.error('GitHub OAuth error param:', error);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error || 'GitHub authorization failed')}`);
  }

  try {
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback';
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID || '',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '',
        code: String(code),
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to get GitHub token:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to exchange GitHub authorization token')}`);
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'NepKart-Ecommerce'
      }
    });
    const profile = await userRes.json();
    if (!userRes.ok) throw new Error(profile.message || 'GitHub profile request failed');

    let email = profile.email;
    if (!email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'NepKart-Ecommerce'
          }
        });
        const emails = await emailsRes.json();
        if (Array.isArray(emails)) {
          const primary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
          if (primary) email = primary.email;
        }
      } catch (emailErr) {
        console.warn('Failed to fetch GitHub emails list:', emailErr);
      }
    }

    if (!email) {
      email = `${profile.id}+${profile.login || 'github'}@users.noreply.github.com`;
    }

    const githubId = String(profile.id);
    let user = await User.findOne({
      $or: [{ githubId }, { email: email.toLowerCase() }]
    });

    if (user) {
      if (!user.githubId) user.githubId = githubId;
      if (profile.avatar_url && !user.avatar) user.avatar = profile.avatar_url;
      await user.save();
    } else {
      user = new User({
        name: profile.name || profile.login || 'GitHub User',
        email: email.toLowerCase(),
        githubId,
        avatar: profile.avatar_url || '',
        role: 'user'
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.redirect(`${frontendUrl}/login?token=${token}`);
  } catch (err) {
    console.error('GitHub OAuth callback exception:', err);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('An error occurred during GitHub login')}`);
  }
});

module.exports = router;
