import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import customerModel from "../model/customerModel.js";
import jwt from "jsonwebtoken";
import generatePassword from "generate-password";
import { Resend } from "resend";
import redisClient from "../utils/redisClient.js";
import axios from "axios";

dotenv.config();

const BCRYPT_SALT_ROUNDS = 10;
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : { emails: { send: async () => { throw new Error("RESEND_API_KEY not configured"); } } };

/* =========================
   2FACTOR API HELPERS
========================= */

/**
 * Send OTP to phone via 2Factor API
 * @param {string} phone - Phone number with country code
 * @returns {string} sessionId for OTP verification
 */
const sendPhoneOtpVia2Factor = async (phone) => {
  try {
    const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${phone}/AUTOGEN`;
    const { data } = await axios.get(url);

    if (data.Status !== "Success") {
      throw new Error(`2Factor API error: ${data.Details || 'Unknown error'}`);
    }

    console.log(`[2Factor] OTP sent successfully to ${phone}, SessionId: ${data.Details}`);
    return data.Details; // sessionId
  } catch (error) {
    console.error('[2Factor] Failed to send OTP:', error.message);
    throw error;
  }
};

/**
 * Verify OTP with 2Factor API
 * @param {string} sessionId - Session ID from OTP send
 * @param {string} otp - OTP entered by user
 * @returns {boolean} true if OTP is valid
 */
const verifyPhoneOtpVia2Factor = async (sessionId, otp) => {
  try {
    const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;
    const { data } = await axios.get(url);

    const isValid = data.Status === "Success";
    console.log(`[2Factor] OTP verification result: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    return isValid;
  } catch (error) {
    console.error('[2Factor] Verification error:', error.message);
    return false;
  }
};

/* =========================
   EMAIL OTP GENERATOR
========================= */

const generateOTP = () => {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let otp = "";
  for (let i = 0; i < 6; i++) {
    const ran = Math.floor(Math.random() * 10);
    otp += arr[ran];
  }
  return otp;
};

/* =========================
   SIGNUP – STEP 1: INITIATE
========================= */

export const initiateSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      whatsapp,
      password,
      companyName,
      gstNumber,
      businessType,
      monthlyOrder,
      address,
      state,
      pincode,
      typeOfLoad,
      products,
      handlingCare,
      customerNetwork,
      averageLoadInDispatch,
      maxLoadInDispatch,
      maxLength,
      maxWidth,
      maxHeight,
      typeOfCustomers,
    } = req.body;

    console.log('[Signup] Received signup request:', { email, phone });

    // Validate required fields
    const required = {
      firstName,
      lastName,
      email,
      phone,
      password,
      whatsapp,
      companyName,
      gstNumber,
      businessType,
      monthlyOrder,
      address,
      state,
      pincode,
    };

    const missing = Object.entries(required)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key);

    if (missing.length) {
      return res.status(400).json({
        message: `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
      });
    }

    // Type safety: ensure email/phone are plain strings before hitting MongoDB
    if (typeof email !== 'string' || typeof phone !== 'string') {
      return res.status(400).json({ message: "Invalid input format." });
    }

    // Check if customer already exists
    const existingCustomer = await customerModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingCustomer) {
      if (existingCustomer.email === email) {
        return res.status(409).json({ message: "Email already registered." });
      }
      if (existingCustomer.phone === Number(phone)) {
        return res.status(409).json({ message: "Phone number already registered." });
      }
      return res.status(409).json({ message: "Customer already exists." });
    }

    // Generate email OTP
    const emailOtp = generateOTP();
    console.log('[Signup] Email OTP generated');

    // Send phone OTP via 2Factor
    let phoneSessionId = null;
    let phoneOtpSent = false;

    try {
      phoneSessionId = await sendPhoneOtpVia2Factor(phone);
      phoneOtpSent = true;
      console.log('[Signup] Phone OTP sent successfully via 2Factor');
    } catch (phoneError) {
      console.error('[Signup] Failed to send phone OTP:', phoneError.message);
      // Continue without phone OTP - we'll handle this gracefully
    }

    // Store signup data in Redis
    const redisPayload = {
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: Number(phone),
        whatsappNumber: Number(whatsapp),
        password,
        companyName: companyName.trim(),
        gstNumber: gstNumber.trim(),
        businessType: businessType?.trim() || "",
        monthlyOrder: Number(monthlyOrder),
        address: address.trim(),
        state: state.trim(),
        pincode: Number(pincode),
        typeOfLoad: typeOfLoad?.trim() || "",
        products: products?.trim() || "",
        handlingCare: handlingCare?.trim() || "",
        customerNetwork: customerNetwork?.trim() || "",
        averageLoadInDispatch: Number(averageLoadInDispatch) || 0,
        maxLoadInDispatch: Number(maxLoadInDispatch) || 0,
        maxLength: Number(maxLength) || 0,
        maxWidth: Number(maxWidth) || 0,
        maxHeight: Number(maxHeight) || 0,
        typeOfCustomers: typeOfCustomers?.trim() || "",
      },
      otps: {
        emailOtp,
        phoneSessionId,
        phoneOtpSent
      },
    };

    await redisClient.setEx(
      `pendingSignup:${email}`,
      600, // 10 minutes
      JSON.stringify(redisPayload)
    );

    // Send email OTP via Resend
    try {
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: email,
        subject: "Email Verification - Forus Logistics",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email Verification</h2>
            <p>Your email verification OTP is:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${emailOtp}</h1>
            <p>This OTP will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Forus Logistics - Freight Management System</p>
          </div>
        `,
      });

      console.log('[Resend] Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('[Resend] Failed to send email:', emailError);
      console.error('[Resend] Error details:', JSON.stringify(emailError, null, 2));

      // Return partial success if phone OTP was sent
      if (phoneOtpSent) {
        return res.status(200).json({
          message: "Phone OTP sent. Email delivery may be delayed - check spam folder.",
          warning: "Email delivery issue",
          phoneSessionId,
          phoneOtpRequired: true,
        });
      }

      // Both failed
      return res.status(500).json({
        message: "Failed to send verification codes. Please try again.",
      });
    }

    // Success response
    return res.status(200).json({
      message: phoneOtpSent
        ? "OTP sent to your email and phone. Please verify both to complete registration."
        : "OTP sent to your email. Please verify to complete registration.",
      phoneSessionId,
      phoneOtpRequired: phoneOtpSent,
    });

  } catch (error) {
    console.error('[Signup] Initiate Signup Error:', error);
    return res.status(500).json({ message: "Server error during signup initiation." });
  }
};

/* =========================
   SIGNUP – STEP 2: VERIFY
========================= */

export const verifyOtpsAndSignup = async (req, res) => {
  const { email, emailOtp, phoneOtp, phoneSessionId } = req.body;

  try {
    console.log('[Verify] Verification request:', { email, hasPhoneOtp: !!phoneOtp });

    // Retrieve pending signup data from Redis
    const redisData = await redisClient.get(`pendingSignup:${email}`);
    if (!redisData) {
      return res.status(400).json({
        message: "No pending verification found or OTP expired. Please restart signup."
      });
    }

    const { data, otps } = JSON.parse(redisData);

    // Verify email OTP
    if (otps.emailOtp !== emailOtp) {
      return res.status(400).json({ message: "Invalid email OTP." });
    }

    console.log('[Verify] Email OTP verified successfully');

    // Verify phone OTP if it was sent
    if (otps.phoneOtpSent && phoneSessionId) {
      if (!phoneOtp) {
        return res.status(400).json({
          message: "Phone OTP is required."
        });
      }

      const isValidPhoneOtp = await verifyPhoneOtpVia2Factor(phoneSessionId, phoneOtp);

      if (!isValidPhoneOtp) {
        return res.status(400).json({ message: "Invalid phone OTP." });
      }

      console.log('[Verify] Phone OTP verified successfully');
    }

    // Hash password
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create new customer
    const newCustomer = new customerModel({
      ...data,
      password: hashedPassword,
      isSubscribed: false,
      isTransporter: false,
      isAdmin: false,
      tokenAvailable: 10,
    });

    await newCustomer.save();
    console.log('[Verify] Customer saved successfully:', newCustomer.email);

    // Clean up Redis
    await redisClient.del(`pendingSignup:${email}`);

    // Prepare response (exclude password)
    const customerData = newCustomer.toObject();
    delete customerData.password;

    return res.status(201).json({
      message: "Customer registered successfully! You can now login.",
      customer: customerData,
    });

  } catch (error) {
    console.error('[Verify] Verification Error:', error);
    return res.status(500).json({
      message: "Server error during verification.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/* =========================
   LOGIN
========================= */

export const loginController = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: "Invalid input format." });
  }

  // Check JWT_SECRET configuration
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_key_change_this_to_a_secure_random_string_minimum_32_characters') {
    console.error("FATAL ERROR: JWT_SECRET is not properly configured.");
    return res.status(500).json({
      message: "Server configuration error: JWT_SECRET not properly set.",
      error: process.env.NODE_ENV === "development" ? "JWT_SECRET missing or using default value" : undefined
    });
  }

  const emailKey = email.toLowerCase().trim();
  const lockKey = `loginLock:${emailKey}`;
  const failKey = `loginFail:${emailKey}`;

  try {
    // --- Account lockout check ---
    const isLocked = await redisClient.get(lockKey);
    if (isLocked) {
      return res.status(429).json({
        message: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.",
      });
    }

    // Helper: count a failed attempt and lock if threshold reached
    const recordFailedAttempt = async () => {
      const attempts = await redisClient.incr(failKey);
      if (attempts === 1) await redisClient.expire(failKey, 900); // 15-min sliding window
      if (attempts >= 10) {
        await redisClient.set(lockKey, "1", { EX: 900 });
        await redisClient.del(failKey);
        return true; // locked
      }
      return false;
    };

    // Find customer by email
    const customer = await customerModel.findOne({ email: emailKey });

    if (!customer) {
      // Count the attempt even for non-existent emails (prevents user enumeration)
      const nowLocked = await recordFailedAttempt();
      if (nowLocked) {
        return res.status(429).json({
          message: "Account locked for 15 minutes due to too many failed attempts.",
        });
      }
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      const nowLocked = await recordFailedAttempt();
      if (nowLocked) {
        return res.status(429).json({
          message: "Account locked for 15 minutes due to too many failed attempts.",
        });
      }
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Successful login — clear fail counter
    await redisClient.del(failKey);

    // Increment sessionVersion (invalidates all previous sessions for this user)
    const updatedCustomer = await customerModel.findByIdAndUpdate(
      customer._id,
      { $inc: { sessionVersion: 1 } },
      { new: true }
    );
    const newSessionVersion = updatedCustomer.sessionVersion;

    // Create JWT payload
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
          formBuilder: true,
          dashboard: false,
          vendorApproval: false,
          userManagement: false,
        },
        sessionVersion: newSessionVersion,
      },
    };

    // Sign access token (short-lived)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    });

    // Sign refresh token (long-lived, separate secret)
    const refreshPayload = { userId: String(customer._id), sessionVersion: newSessionVersion };
    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    // Store hashed refresh token in Redis
    const hashedRefresh = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await redisClient.set(`refreshToken:${customer._id}`, hashedRefresh, { EX: 7 * 24 * 60 * 60 });

    const isProd = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    };

    res.cookie("authToken", accessToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    const customerData = customer.toObject ? customer.toObject() : { ...customer._doc };
    delete customerData.password;

    console.log("[Login] Successful login:", customer.email);

    return res.status(200).json({
      message: "Login successful!",
      customer: customerData,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Server error during login.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/* =========================
   LOGOUT
========================= */

export const logoutController = async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOpts = { httpOnly: true, secure: isProd, sameSite: isProd ? "None" : "Lax" };

  // Remove refresh token from Redis so it cannot be reused
  if (req.customer?._id) {
    await redisClient.del(`refreshToken:${req.customer._id}`);
  }

  res.clearCookie("authToken", cookieOpts);
  res.clearCookie("refreshToken", cookieOpts);
  return res.status(200).json({ message: "Logged out successfully." });
};

/* =========================
   REFRESH TOKEN
========================= */

export const refreshController = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided." });
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const { userId, sessionVersion } = decoded;

    // Validate the hashed token stored in Redis
    const stored = await redisClient.get(`refreshToken:${userId}`);
    const incoming = crypto.createHash("sha256").update(refreshToken).digest("hex");
    if (!stored || stored !== incoming) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    // Validate sessionVersion against DB
    const customer = await customerModel.findById(userId).select("-password");
    if (!customer) {
      return res.status(401).json({ message: "User not found." });
    }
    if (customer.sessionVersion !== sessionVersion) {
      return res.status(401).json({ message: "Session expired.", code: "SESSION_REPLACED" });
    }

    // Issue new access token with the same payload shape as login
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
          formBuilder: true,
          dashboard: false,
          vendorApproval: false,
          userManagement: false,
        },
        sessionVersion: customer.sessionVersion,
      },
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("authToken", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Token refreshed." });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */

export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Please provide your email address." });
    }

    const customer = await customerModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!customer) {
      console.log('[ForgotPassword] Attempt for non-existent email — returning generic response');
      // Return success anyway for security (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a new password has been sent.",
      });
    }

    // Generate new password
    const newPassword = generatePassword.generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true,
    });

    console.log(`[ForgotPassword] Temporary password generated and will be sent to ${email}`);

    // Hash and save new password
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    customer.password = hashedPassword;
    await customer.save();

    // Increment sessionVersion to invalidate all existing sessions after password reset
    await customerModel.findByIdAndUpdate(customer._id, { $inc: { sessionVersion: 1 } });

    const fullName = `${customer.firstName} ${customer.lastName}`;

    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #333;">Password Reset - Forus Logistics</h2>
        <p>Hello ${fullName},</p>
        <p>Your password has been reset as requested. Your new temporary password is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <code style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">${newPassword}</code>
        </div>
        <p><strong>Important:</strong> Please change this password immediately after logging in for security reasons.</p>
        <p>To change your password:</p>
        <ol>
          <li>Login with this temporary password</li>
          <li>Go to Account Settings</li>
          <li>Select "Change Password"</li>
          <li>Enter this temporary password and your new password</li>
        </ol>
        <p>If you didn't request a password reset, please contact our support team immediately.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply.<br>
          Forus Logistics - Freight Management System
        </p>
      </div>
    `;

    // Send email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "tech@foruselectric.com",
      to: customer.email,
      subject: "Your New Password - Forus Logistics",
      html: emailHtml,
    });

    console.log(`[ForgotPassword] Password reset email sent to ${email}`);

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please check your email.",
    });

  } catch (error) {
    console.error("[ForgotPassword] Error:", error);
    res.status(500).json({
      message: "Server error during password reset process.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/* =========================
   CHANGE PASSWORD
========================= */

export const changePasswordController = async (req, res) => {
  try {
    const { email, password, newpassword } = req.body;

    if (!email || !password || !newpassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, current password, and new password.",
      });
    }

    // Find user
    const user = await customerModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newpassword, salt);
    user.password = hashedPassword;
    await user.save();

    // Increment sessionVersion to invalidate all existing sessions after password change
    await customerModel.findByIdAndUpdate(user._id, { $inc: { sessionVersion: 1 } });

    const fullName = `${user.firstName} ${user.lastName}`;

    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #333;">Password Changed Successfully</h2>
        <p>Hello ${fullName},</p>
        <p>Your password has been changed successfully on ${new Date().toLocaleString()}.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <strong>⚠️ Security Notice:</strong>
          <p style="margin: 5px 0 0 0;">If this wasn't you, your account may be compromised. Please reset your password immediately.</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply.<br>
          Forus Logistics - Freight Management System
        </p>
      </div>
    `;

    // Send confirmation email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "tech@foruselectric.com",
      to: user.email,
      subject: "Password Changed - Forus Logistics",
      html: emailHtml,
    });

    console.log(`[ChangePassword] Password changed successfully for ${email}`);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });

  } catch (error) {
    console.error("[ChangePassword] Error:", error);
    res.status(500).json({
      message: "Server error during password change process.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/* =========================
   GET CURRENT USER (for permission refresh)
========================= */

/**
 * GET /api/auth/me
 * Returns fresh user data from database (used to refresh permissions on page load)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by the protect middleware with fresh data from DB
    const customer = req.user;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('[Auth] getCurrentUser - Returning fresh user data for:', customer.email);

    return res.status(200).json({
      success: true,
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
          formBuilder: true,
          dashboard: false,
          vendorApproval: false,
          userManagement: false,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] getCurrentUser Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
