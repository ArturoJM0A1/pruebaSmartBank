/**
 * ============================================================================
 * SMARTBANK - AUTHENTICATION ROUTES
 * ============================================================================
 * 
 * PURPOSE: Handles user authentication (login, register, logout, refresh).
 *   These are the "gateway" routes - users must authenticate before
 *   accessing protected resources.
 * 
 * AUTH FLOW OVERVIEW:
 *   1. Register: Create account → Get confirmation
 *   2. Login: Email + Password → Get JWT token
 *   3. Use token: Include in Authorization header for all protected requests
 *   4. Refresh: When token expires → Get new token without re-entering password
 *   5. Logout: Invalidate current token
 * 
 * TOKEN LIFECYCLE:
 *   Register → Login → [Use API] → Token expires → Refresh → [Use API] → ... → Logout
 * 
 * WHY THESE ENDPOINTS:
 *   - POST for login/register (creates/authenticates state)
 *   - POST for logout (state change, not idempotent due to token invalidation)
 *   - POST for refresh (generates new token, could be GET but POST is more secure)
 *   - GET for /me (read-only, returns current user info)
 * 
 * SECURITY CONSIDERATIONS:
 *   - Passwords are hashed before storage (NEVER store plain text)
 *   - JWTs have expiration (limits damage from stolen tokens)
 *   - Rate limiting should be added (prevent brute force attacks)
 *   - Account lockout after failed attempts (prevent credential stuffing)
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { simpleHash } = require('../seeds/data');
const { authenticate } = require('../middleware/auth');
const { generateToken, generateRefreshToken, verifyToken, revokeToken } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { asyncHandler, UnauthorizedError, ConflictError, NotFoundError } = require('../middleware/errorHandler');

/**
 * ============================================================================
 * POST /api/auth/login
 * ============================================================================
 * 
 * PURPOSE: Authenticate user with email and password, return JWT token.
 * 
 * REQUEST:
 *   Body: { email: "user@email.com", password: "password123" }
 * 
 * RESPONSE (success):
 *   {
 *     success: true,
 *     data: {
 *       token: "eyJhbGciOi...",
 *       refreshToken: "eyJhbGciOi...",
 *       user: { id: 1, email: "...", role: "user", ... }
 *     }
 *   }
 * 
 * RESPONSE (failure):
 *   {
 *     success: false,
 *     error: { code: "UNAUTHORIZED", message: "Invalid email or password" }
 *   }
 * 
 * WHY "Invalid email or password" (not "User not found"):
 *   - SECURITY: Don't reveal whether an email exists
 *   - Prevents attackers from enumerating valid email addresses
 *   - Same error for wrong email AND wrong password
 * 
 * WHY return user object:
 *   - Client needs user info (name, role, avatar) immediately
 *   - Saves an extra API call to /auth/me
 * 
 * RATE LIMITING NOTE:
 *   - This endpoint SHOULD have rate limiting (e.g., 5 attempts per minute)
 *   - Implemented at the API gateway level or with express-rate-limit
 *   - Omitted here for simplicity but critical in production
 * ============================================================================
 */
router.post('/login',
  validateBody(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // ============================================================================
    // FIND USER BY EMAIL
    // ============================================================================
    // WHY use email (not username): Email is unique and universally understood.
    //   Usernames can be ambiguous (case sensitivity, similar names).
    // ============================================================================
    const user = db.findUserByEmail(email);

    if (!user) {
      // WHY same error as wrong password: Prevents email enumeration
      throw new UnauthorizedError('Invalid email or password');
    }

    // ============================================================================
    // VERIFY PASSWORD
    // ============================================================================
    // WHY compare hashes, not plain text: Even if database is compromised,
    //   attackers only get hashes, not passwords.
    // 
    // In production, use bcrypt.compare(password, user.password) which
    //   handles salt and timing-safe comparison automatically.
    // ============================================================================
    const hashedPassword = simpleHash(password);
    
    if (hashedPassword !== user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // ============================================================================
    // CHECK IF ACCOUNT IS ACTIVE
    // ============================================================================
    // WHY: Deactivated accounts shouldn't be able to login,
    //   even with correct credentials.
    // ============================================================================
    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated. Contact support.');
    }

    // ============================================================================
    // GENERATE TOKENS
    // ============================================================================
    // WHY return both tokens:
    //   - Access token: Used for API requests (short-lived)
    //   - Refresh token: Used to get new access tokens (long-lived)
    //   - Client stores both, uses access token for requests
    // ============================================================================
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // ============================================================================
    // FORMAT RESPONSE
    // ============================================================================
    // WHY exclude password: Never send password hash to client
    // ============================================================================
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: safeUser,
      },
    });
  })
);

/**
 * ============================================================================
 * POST /api/auth/register
 * ============================================================================
 * 
 * PURPOSE: Create a new user account.
 * 
 * REQUEST:
 *   Body: {
 *     email: "newuser@email.com",
 *     password: "securePassword123",
 *     firstName: "Juan",
 *     lastName: "Pérez",
 *     phone: "+52 55 1234 5678",
 *     dateOfBirth: "1990-01-15"
 *   }
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       token: "eyJhbGciOi...",
 *       refreshToken: "eyJhbGciOi...",
 *       user: { id: 4, email: "...", ... }
 *     }
 *   }
 * 
 * WHY auto-login after registration:
 *   - Better UX: User doesn't have to login immediately after registering
 *   - Returns tokens so they can start using the app right away
 *   - Alternative: Send confirmation email first (more secure but less convenient)
 * 
 * PASSWORD REQUIREMENTS:
 *   - Minimum 8 characters (enforced by validation schema)
 *   - Should be: uppercase, lowercase, number, special character
 *   - In production: Use password strength library (zxcvbn)
 * ============================================================================
 */
router.post('/register',
  validateBody(schemas.register),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, dateOfBirth } = req.body;

    // ============================================================================
    // CHECK IF EMAIL ALREADY EXISTS
    // ============================================================================
    // WHY: Duplicate emails would break the unique constraint.
    //   Check before creating to give a clear error message.
    // 
    // WHY use Conflict (409): HTTP standard for "resource already exists"
    // ============================================================================
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // ============================================================================
    // CREATE USER
    // ============================================================================
    // WHY hash password immediately: Never store plain text passwords.
    //   Even for a split second in memory, it's a risk.
    // ============================================================================
    const newUser = db.create('users', {
      email: email.toLowerCase(), // WHY lowercase: Emails are case-insensitive
      password: simpleHash(password),
      firstName,
      lastName,
      phone,
      dateOfBirth,
      role: 'user',         // WHY default to 'user': New registrations aren't admin
      isVerified: false,    // WHY false: Require email verification in production
      isActive: true,
      avatar: null,
      address: {},
    });

    // ============================================================================
    // CREATE DEFAULT SETTINGS
    // ============================================================================
    // WHY: New users need settings with sensible defaults
    //   so the app works immediately without configuration.
    // ============================================================================
    db.create('userSettings', {
      userId: newUser.id,
      language: 'es',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
        transactions: true,
        promotions: false,
        security: true,
        reminders: true,
      },
      security: {
        twoFactorEnabled: false,
        biometricEnabled: false,
        sessionTimeout: 30,
        loginNotifications: true,
      },
      display: {
        defaultAccount: null,
        showBalances: true,
        compactMode: false,
        dateFormat: 'DD/MM/YYYY',
      },
    });

    // ============================================================================
    // AUTO-LOGIN
    // ============================================================================
    // WHY: Better UX. User starts using the app immediately.
    //   In production, you might require email verification first.
    // ============================================================================
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: safeUser,
      },
    });
  })
);

/**
 * ============================================================================
 * POST /api/auth/logout
 * ============================================================================
 * 
 * PURPOSE: Invalidate the current token (simulate logout).
 * 
 * WHY token invalidation:
 *   - JWTs are stateless (can't be "expired" server-side)
 *   - To "logout", we add the token to a blacklist
 *   - Next request with this token will be rejected
 * 
 * WHY POST (not GET):
 *   - Logout changes server state (adds token to blacklist)
 *   - GET requests should be idempotent and safe (no side effects)
 *   - POST is appropriate for state-changing operations
 * 
 * WHY require authentication:
 *   - Can't invalidate a token if we don't know which one it is
 *   - Client must send the token to be invalidated
 * ============================================================================
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    // ============================================================================
    // ADD TOKEN TO BLACKLIST
    // ============================================================================
    // WHY: This is how we "invalidate" a JWT.
    //   In production, use Redis with TTL matching token expiry.
    //   Old blacklist entries expire automatically (no cleanup needed).
    // ============================================================================
    revokeToken(req.token);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * ============================================================================
 * POST /api/auth/refresh
 * ============================================================================
 * 
 * PURPOSE: Get a new access token using a refresh token.
 * 
 * WHY refresh tokens:
 *   - Access tokens are short-lived (15-30 min) for security
 *   - Refresh tokens are long-lived (7 days) for convenience
 *   - When access token expires, client uses refresh token
 *   - If refresh token is stolen, it can be revoked (unlike access token)
 * 
 * REQUEST:
 *   Body: { refreshToken: "eyJhbGciOi..." }
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       token: "eyJhbGciOi...",  // New access token
 *       refreshToken: "eyJhbGciOi..."  // New refresh token (rotation)
 *     }
 *   }
 * 
 * WHY token rotation:
 *   - Each refresh generates a new refresh token
 *   - Old refresh token is invalidated
 *   - Prevents reuse of stolen refresh tokens
 * ============================================================================
 */
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    // ============================================================================
    // VERIFY REFRESH TOKEN
    // ============================================================================
    try {
      const decoded = verifyToken(refreshToken);

      // ============================================================================
      // CHECK: Is this actually a refresh token?
      // ============================================================================
      // WHY: Access tokens and refresh tokens use the same signing key.
      //   We need to distinguish them by the 'type' claim.
      //   Without this check, someone could use an access token as a refresh token.
      // ============================================================================
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      // ============================================================================
      // FIND USER
      // ============================================================================
      const user = db.findById('users', decoded.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // ============================================================================
      // GENERATE NEW TOKENS (Rotation)
      // ============================================================================
      // WHY generate both: Issuing a new refresh token invalidates the old one.
      //   This is "refresh token rotation" - a security best practice.
      // ============================================================================
      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Blacklist old refresh token (optional but recommended)
      revokeToken(refreshToken);

      res.json({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }
      throw error;
    }
  })
);

/**
 * ============================================================================
 * GET /api/auth/me
 * ============================================================================
 * 
 * PURPOSE: Get current authenticated user's information.
 * 
 * WHY this endpoint:
 *   - Client needs to verify token is still valid
 *   - Client needs fresh user data (role, settings, etc.)
 *   - Common pattern: App checks auth on startup with this endpoint
 * 
 * WHY GET: Read-only operation, no side effects, idempotent
 * ============================================================================
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    // ============================================================================
    // FETCH FRESH USER DATA
    // ============================================================================
    // WHY fetch fresh (not from token): Token payload might be stale.
    //   User might have changed their name, role, or been deactivated.
    //   We need the current state from the database.
    // ============================================================================
    const user = db.findById('users', req.user.id);

    if (!user) {
      throw new NotFoundError('User');
    }

    const { password: _, ...safeUser } = user;

    // ============================================================================
    // INCLUDE SETTINGS
    // ============================================================================
    // WHY include settings: Client often needs user preferences on load.
    //   Saves an extra API call to /users/settings.
    // ============================================================================
    const settings = db.findSettingsByUser(user.id);

    res.json({
      success: true,
      data: {
        user: safeUser,
        settings,
      },
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
