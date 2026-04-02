const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
}

const signAccessToken = (userId, tokenVersion) => {
  return jwt.sign({ sub: userId, tokenVersion, type: 'access' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ai-task-platform',
    audience: 'ai-task-platform-users',
  });
};

const signRefreshToken = (userId, tokenVersion) => {
  return jwt.sign({ sub: userId, tokenVersion, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'ai-task-platform',
    audience: 'ai-task-platform-users',
  });
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });

  if (existingUser) {
    const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  const user = await User.create({ username, email, password });

  const accessToken = signAccessToken(user._id, user.tokenVersion);
  const refreshToken = signRefreshToken(user._id, user.tokenVersion);

  logger.info({ userId: user._id, username }, 'User registered');

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user,
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
    },
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    logger.warn({ email }, 'Failed login attempt');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = signAccessToken(user._id, user.tokenVersion);
  const refreshToken = signRefreshToken(user._id, user.tokenVersion);

  logger.info({ userId: user._id, email }, 'User logged in');

  return res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
    },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      issuer: 'ai-task-platform',
      audience: 'ai-task-platform-users',
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  if (decoded.type !== 'refresh') {
    return res.status(401).json({ success: false, message: 'Invalid token type' });
  }

  const user = await User.findById(decoded.sub).select('+tokenVersion');
  if (!user || !user.isActive || user.tokenVersion !== decoded.tokenVersion) {
    return res.status(401).json({ success: false, message: 'Token invalidated' });
  }

  const newAccessToken = signAccessToken(user._id, user.tokenVersion);
  const newRefreshToken = signRefreshToken(user._id, user.tokenVersion);

  return res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN,
    },
  });
};

const logout = async (req, res) => {
  await req.user.invalidateTokens();
  logger.info({ userId: req.user._id }, 'User logged out, tokens invalidated');
  return res.json({ success: true, message: 'Logged out successfully' });
};

const me = async (req, res) => {
  return res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, refresh, logout, me };
