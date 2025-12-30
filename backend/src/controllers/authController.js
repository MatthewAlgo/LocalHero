/**
 * Authentication Controller
 * Handles user registration and login
 */

const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * Validation rules for registration
 */
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('companyName').optional().trim().isLength({ max: 100 })
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, companyName } = req.body;

    // Check if user exists
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = User.create({
      email,
      passwordHash,
      companyName
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.company_name,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.company_name,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
function getProfile(req, res) {
  const user = User.findById(req.user.id);
  const locationCount = User.getLocationCount(req.user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      companyName: user.company_name,
      plan: user.plan,
      createdAt: user.created_at
    },
    stats: {
      locationCount
    }
  });
}

/**
 * Update user profile
 * PUT /api/auth/me
 */
function updateProfile(req, res) {
  const { companyName } = req.body;

  const user = User.update(req.user.id, { companyName });

  res.json({
    message: 'Profile updated',
    user: {
      id: user.id,
      email: user.email,
      companyName: user.company_name,
      plan: user.plan
    }
  });
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  registerValidation,
  loginValidation
};
