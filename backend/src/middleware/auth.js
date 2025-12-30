/**
 * Authentication Middleware
 * JWT-based authentication for API routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

/**
 * Generate a JWT token for a user
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Authentication middleware
 * Requires valid JWT in Authorization header
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      companyName: user.company_name,
      plan: user.plan
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token present, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = User.findById(decoded.userId);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        companyName: user.company_name,
        plan: user.plan
      };
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  next();
}

/**
 * Check if user owns a location
 */
function authorizeLocation(req, res, next) {
  const Location = require('../models/Location');
  const locationId = parseInt(req.params.locationId || req.params.id);

  if (isNaN(locationId)) {
    return res.status(400).json({ error: 'Invalid location ID' });
  }

  const location = Location.findById(locationId);

  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }

  if (location.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to access this location' });
  }

  req.location = location;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  authorizeLocation,
  JWT_SECRET
};
