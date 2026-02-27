import express from 'express';
import { changePasswordController, forgotPasswordController, getCurrentUser, initiateSignup, loginController, verifyOtpsAndSignup, logoutController, refreshController } from '../controllers/authController.js';
import { authLimiter, apiLimiter } from '../middleware/rateLimiter.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST api/auth/signup
// @desc    Register a new customer
// @access  Public
router.post('/signup/initiate', authLimiter, initiateSignup);
router.post('/signup/verify', authLimiter, verifyOtpsAndSignup);
router.post('/login', authLimiter, loginController);
router.post('/forgotpassword', authLimiter, forgotPasswordController);
router.post('/changepassword', authLimiter, changePasswordController);

// @route   POST api/auth/refresh
// @desc    Issue new access token using refresh token cookie
// @access  Public (uses refreshToken cookie)
router.post('/refresh', apiLimiter, refreshController);

// @route   POST api/auth/logout
// @desc    Clear auth cookies and invalidate refresh token
// @access  Public (reads refreshToken cookie directly, no auth needed)
router.post('/logout', logoutController);

// @route   GET api/auth/me
// @desc    Get current user with fresh permissions (for page refresh)
// @access  Private (requires auth token)
router.get('/me', protect, getCurrentUser);

export default router;