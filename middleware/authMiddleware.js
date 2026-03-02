// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import customerModel from '../model/customerModel.js';
import redisClient from '../utils/redisClient.js';

export const protect = async (req, res, next) => {
  let token;

  // 1️⃣ Try Authorization header: "Bearer <token>"
  //    Skip empty / literal "undefined" values — these come from legacy frontend
  //    code that calls Cookies.get('authToken') on the now-httpOnly cookie.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const candidate = req.headers.authorization.split(' ')[1];
    if (candidate && candidate !== 'undefined' && candidate !== 'null' && candidate.length > 10) {
      token = candidate;
    }
  }

  // 2️⃣ If no token yet, try cookies: authToken=<token>
  if (!token) {
    // If you use cookie-parser, this will work:
    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    } else if (req.headers.cookie) {
      // Manual parse in case cookie-parser isn't used
      const rawCookie = req.headers.cookie; // "authToken=xxx; otherCookie=yyy"
      const parts = rawCookie.split(';').map((c) => c.trim());
      for (const part of parts) {
        const [name, ...rest] = part.split('=');
        if (name === 'authToken') {
          token = rest.join('=');
          break;
        }
      }
    }
  }

  // 3️⃣ If still no token → 401
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    // Get JWT_SECRET at runtime
    const JWT_SECRET = process.env.JWT_SECRET;

    if (
      !JWT_SECRET ||
      JWT_SECRET ===
      'your_jwt_secret_key_change_this_to_a_secure_random_string_minimum_32_characters'
    ) {
      console.error('FATAL ERROR: JWT_SECRET is not properly configured.');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET not set',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.customer || !decoded.customer._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token structure',
      });
    }

    const customer = await customerModel
      .findById(decoded.customer._id)
      .select('-password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    // Single-session enforcement: compare JWT sessionVersion with DB sessionVersion
    // Guard: only enforce if the JWT actually contains sessionVersion (backward compatible)
    if (
      decoded.customer.sessionVersion !== undefined &&
      decoded.customer.sessionVersion !== customer.sessionVersion
    ) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. You have been logged in on another device.',
        code: 'SESSION_REPLACED',
      });
    }

    // Backward + new-code compatible
    req.customer = customer;
    req.user = customer; // so /api/users/me using req.user works

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid',
      });
    }

    if (error.name === 'TokenExpiredError') {
      // Silent refresh: try the refreshToken cookie before returning 401.
      // This covers every protected route — the frontend never has to implement
      // a retry loop; the new authToken cookie is set transparently.
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        try {
          const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
          const refreshDecoded = jwt.verify(refreshToken, refreshSecret);
          const { userId, sessionVersion } = refreshDecoded;

          // Validate hashed refresh token stored in Redis
          const stored = await redisClient.get(`refreshToken:${userId}`);
          const incoming = crypto.createHash('sha256').update(refreshToken).digest('hex');
          if (stored && stored === incoming) {
            const customer = await customerModel.findById(userId).select('-password');
            if (customer && customer.sessionVersion === sessionVersion) {
              // Issue a new short-lived access token
              const payload = {
                customer: {
                  _id: customer._id,
                  email: customer.email,
                  phone: customer.phone,
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  companyName: customer.companyName,
                  gstNumber: customer.gstNumber,
                  businessType: customer.businessType,
                  monthlyOrder: customer.monthlyOrder,
                  address: customer.address,
                  state: customer.state,
                  pincode: customer.pincode,
                  tokenAvailable: customer.tokenAvailable,
                  isSubscribed: customer.isSubscribed,
                  isTransporter: customer.isTransporter,
                  isAdmin: customer.isAdmin,
                  adminPermissions: customer.adminPermissions || {
                    formBuilder: true, dashboard: false,
                    vendorApproval: false, userManagement: false,
                  },
                  sessionVersion: customer.sessionVersion,
                },
              };
              const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '15m',
              });
              const isProd = process.env.NODE_ENV === 'production';
              res.cookie('authToken', newAccessToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
              });
              req.customer = customer;
              req.user = customer;
              console.log(`[protect] Silent refresh for ${customer.email} — new authToken issued`);
              return next();
            }
          }
        } catch (_) {
          // Refresh token also expired or invalid — fall through to 401
        }
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token has expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token processing failed',
    });
  }
};
