/**
 * ============================================================================
 * SMARTBANK - AUTHENTICATION MIDDLEWARE
 * ============================================================================
 * 
 * PURPOSE: Protects routes by verifying user identity and checking permissions.
 *   Every protected route must pass through this middleware before processing.
 * 
 * AUTHENTICATION FLOW:
 *   1. Client sends request with JWT in Authorization header
 *   2. Middleware extracts and verifies the token
 *   3. If valid, attaches user info to req.user (downstream handlers use it)
 *   4. If invalid, returns 401 Unauthorized
 * 
 * JWT (JSON Web Token) STRUCTURE:
 *   Header.Payload.Signature
 *   
 *   Header: { "alg": "HS256", "typ": "JWT" }
 *   Payload: { "userId": 1, "email": "...", "role": "user", "iat": ..., "exp": ... }
 *   Signature: HMAC-SHA256(header + payload, secret)
 *   
 *   WHY JWT:
 *     - Stateless: Server doesn't need to store session data
 *     - Scalable: Works across multiple servers without shared state
 *     - Self-contained: Payload carries user info (no DB lookup needed for basic info)
 *   
 *   JWT ALTERNATIVES:
 *     - Session cookies: Server-side session storage, simpler but requires shared state
 *     - OAuth 2.0: Third-party authentication (Google, Facebook), more complex
 *     - API Keys: Simple but less secure, no expiration by default
 *     - SAML: Enterprise SSO, XML-based, complex
 * 
 * WHY JWT is good for THIS demo:
 *   - Simple to implement and understand
 *   - No external dependencies (we use jsonwebtoken)
 *   - Demonstrates real auth concepts
 * 
 * SECURITY NOTES:
 *   - In production, use HTTPS (tokens transmitted in headers)
 *   - Use shorter token expiry (15-30 min) + refresh tokens
 *   - Store tokens securely (httpOnly cookies, not localStorage)
 *   - Validate token on EVERY request (this middleware does that)
 * ============================================================================
 */

'use strict';

const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { UnauthorizedError, ForbiddenError } = require('./errorHandler');

// ============================================================================
// CONFIGURATION
// ============================================================================
// WHY a simple secret: This is a demo. In production:
//   - Use a long, random string (256+ bits)
//   - Store in environment variables, never in code
//   - Rotate periodically
// 
// WHY 24h expiry: Long enough for demo convenience, short enough to be
//   realistic. Real apps use 15-30 min for access tokens.
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'smartbank-dev-secret-key-2024';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_EXPIRY = '7d';

// ============================================================================
// TOKEN GENERATION
// ============================================================================
// WHY generate here (not in routes): Keeps token logic centralized.
//   If we change the signing algorithm or secret, only this file changes.
// ============================================================================

/**
 * Generate an access token for a user
 * 
 * WHY include these claims:
 *   - userId: Core identifier (used to fetch full user data)
 *   - email: Useful for display without DB lookup
 *   - role: For authorization checks (avoids DB lookup on every request)
 *   - iat: Issued At - when the token was created
 *   - exp: Expiration - when the token expires (JWT standard claim)
 * 
 * @param {Object} user - User object from database
 * @returns {string} Signed JWT token
 */
function generateToken(user) {
  // WHY pick only needed fields: Don't include sensitive data like
  //   password hash, full address, etc. in the token (it's readable by anyone)
  const payload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'smartbank-api',     // WHY issuer: Identifies who created the token
    audience: 'smartbank-client', // WHY audience: Identifies who should use it
  });
}

/**
 * Generate a refresh token
 * 
 * WHY separate tokens:
 *   - Access token: Short-lived (15-30 min), used for API calls
 *   - Refresh token: Long-lived (7 days), used only to get new access tokens
 *   - If access token is stolen, damage is limited (expires quickly)
 *   - If refresh token is stolen, attacker can get new access tokens
 *     (but refresh tokens should be stored more securely)
 * 
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
}

/**
 * Verify and decode a JWT token
 * 
 * WHY separate function: Used by both middleware and token refresh endpoint.
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'smartbank-api',
    audience: 'smartbank-client',
  });
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
// 
// WHY middleware pattern:
//   - Separates concerns: Auth logic separate from route logic
//   - Reusable: Apply to any route that needs authentication
//   - Composable: Chain with other middleware (validation, authorization)
// 
// Express middleware signature: (req, res, next)
//   - req: Request object (we add req.user)
//   - res: Response object (we send 401 if unauthorized)
//   - next: Function to call next middleware (or error handler)
// ============================================================================

/**
 * Main authentication middleware
 * 
 * HOW IT WORKS:
 *   1. Extract token from Authorization header
 *   2. Verify token signature and expiry
 *   3. Check if token is blacklisted (logged out)
 *   4. Fetch user from database (to get current role/status)
 *   5. Attach user to req.user for downstream use
 * 
 * HEADER FORMAT: Authorization: Bearer <token>
 *   WHY "Bearer": OAuth 2.0 standard. The client "bears" (carries) the token.
 *   Alternative: "Basic" (base64 encoded username:password), "Digest" (hash-based)
 */
function authenticate(req, res, next) {
  try {
    // ============================================================================
    // STEP 1: Extract token from header
    // ============================================================================
    // WHY check for header first: If no header, no point in verifying
    // WHY split on space: "Bearer token123" → ["Bearer", "token123"]
    // ============================================================================
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authentication token provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization header format. Use: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // ============================================================================
    // STEP 2: Verify token
    // ============================================================================
    // jwt.verify() checks:
    //   - Signature is valid (token hasn't been tampered with)
    //   - Expiration hasn't passed
    //   - Issuer and audience match
    // 
    // If any check fails, it throws a JsonWebTokenError or TokenExpiredError
    // ============================================================================
    const decoded = verifyToken(token);

    // ============================================================================
    // STEP 3: Check if token is blacklisted (for logout)
    // ============================================================================
    // WHY blacklist: JWTs can't be invalidated once issued (that's the point
    //   of being stateless). To "log out" a token, we maintain a blacklist.
    //   In production, use Redis with TTL matching token expiry.
    // ============================================================================
    const blacklisted = db.findBy('blacklistedTokens', 
      (bt) => bt.token === token
    );

    if (blacklisted.length > 0) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // ============================================================================
    // STEP 4: Fetch current user from database
    // ============================================================================
    // WHY fetch from DB instead of using token payload:
    //   - Token payload might be stale (user changed role, was deactivated)
    //   - Need to verify user still exists and is active
    //   - Trade-off: Extra DB query per request vs. stale data
    // 
    // OPTIMIZATION NOTE: For high-traffic APIs, you might:
    //   - Cache user data in Redis with TTL matching token expiry
    //   - Use shorter-lived tokens with refresh token rotation
    //   - Accept some staleness for performance
    // ============================================================================
    const user = db.findById('users', decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // ============================================================================
    // STEP 5: Attach user to request
    // ============================================================================
    // WHY req.user: Convention in Express. All downstream middleware and
    //   route handlers can access the authenticated user via req.user.
    // 
    // WHY exclude password: Never expose password hash in request context.
    //   Even if middleware is bypassed somehow, the hash isn't accessible.
    // ============================================================================
    const { password: _, ...safeUser } = user;
    req.user = safeUser;
    req.token = token;

    // ============================================================================
    // STEP 6: Call next middleware
    // ============================================================================
    // WHY next(): Without this, the request would hang forever.
    //   Express needs to know this middleware is done processing.
    // ============================================================================
    next();
  } catch (error) {
    // ============================================================================
    // ERROR HANDLING
    // ============================================================================
    // WHY catch here: Middleware errors need to be passed to the error handler.
    //   If we don't catch, Express would crash with an unhandled error.
    // 
    // Why check error type: Different errors need different status codes
    //   - JsonWebTokenError: Invalid token → 401
    //   - TokenExpiredError: Expired token → 401
    //   - AppError: Our custom errors (already have correct status code)
    //   - Other: Unknown error → 500
    // ============================================================================
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    next(error);
  }
}

/**
 * ============================================================================
 * OPTIONAL AUTHENTICATION
 * ============================================================================
 * 
 * WHY optional auth:
 *   - Some routes work for both authenticated and unauthenticated users
 *   - Example: Public product listings (more info for logged-in users)
 *   - If token is present, attach user. If not, continue without user.
 * 
 * USAGE: app.get('/products', optionalAuth, getProducts);
 * ============================================================================
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      const user = db.findById('users', decoded.userId);
      
      if (user && user.isActive) {
        const { password: _, ...safeUser } = user;
        req.user = safeUser;
        req.token = token;
      } else {
        req.user = null;
      }
    } catch {
      // Invalid token - continue without user (don't fail)
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================
// 
// WHY RBAC:
//   - Different users have different permissions
//   - Admin can manage all accounts, regular users can only see their own
//   - Prevents privilege escalation attacks
// 
// HOW IT WORKS:
//   - Must be used AFTER authenticate middleware (needs req.user)
//   - Checks if user's role is in the allowed roles list
//   - If not, returns 403 Forbidden
// 
// ROLE HIERARCHY:
//   - admin: Full access to everything
//   - premium: Enhanced features (higher limits, priority support)
//   - user: Basic banking operations
// 
// ALTERNATIVES:
//   - Attribute-Based Access Control (ABAC): More granular (checks user attributes)
//   - Access Control Lists (ACL): Per-resource permissions
//   - Policy-Based: Rules engine (Open Policy Agent)
// ============================================================================
function authorize(...allowedRoles) {
  return (req, res, next) => {
    // ============================================================================
    // CHECK: Is user authenticated?
    // ============================================================================
    // WHY check req.user: If authenticate middleware wasn't called before,
    //   req.user won't exist. This is a safety check.
    // ============================================================================
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // ============================================================================
    // CHECK: Does user have required role?
    // ============================================================================
    // WHY includes() on allowedRoles: We check if the user's role is
    //   IN the list of allowed roles. This allows multiple roles:
    //     authorize('admin', 'premium') → both admin and premium can access
    // ============================================================================
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
}

/**
 * ============================================================================
 * ACCOUNT OWNERSHIP CHECK
 * ============================================================================
 * 
 * WHY separate from authorize:
 *   - Authorization checks role (admin vs user)
 *   - Ownership checks if the user OWNS the specific resource
 *   - A regular user can access their OWN accounts, but not others'
 *   - An admin can access ANY account
 * 
 * USAGE:
 *   app.get('/accounts/:id', authenticate, checkAccountOwnership, getAccount);
 * 
 * HOW IT WORKS:
 *   - Looks up the account by ID from URL params
 *   - Checks if account.userId matches req.user.id
 *   - Admins bypass this check (they can access any account)
 * ============================================================================
 */
function checkAccountOwnership(req, res, next) {
  try {
    const accountId = Number(req.params.id);
    const account = db.findById('accounts', accountId);

    if (!account) {
      return next(new (require('./errorHandler').NotFoundError)('Account', accountId));
    }

    // Admins can access any account
    if (req.user.role === 'admin') {
      req.targetAccount = account; // Attach for downstream use
      return next();
    }

    // Regular users can only access their own accounts
    if (account.userId !== req.user.id) {
      return next(new ForbiddenError('You do not have access to this account'));
    }

    req.targetAccount = account;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * ============================================================================
 * TOKEN REVOCATION (Blacklisting)
 * ============================================================================
 * 
 * WHY this exists:
 *   - JWTs can't be invalidated once issued (that's by design)
 *   - For logout, we add the token to a blacklist
 *   - On every request, middleware checks the blacklist
 * 
 * PRODUCTION CONSIDERATIONS:
 *   - Use Redis for blacklist (fast lookups, automatic TTL expiry)
 *   - Keep blacklist small (only recent tokens, old ones expire naturally)
 *   - Consider token fingerprinting for additional security
 * ============================================================================
 */
function revokeToken(token) {
  const db = require('../models/database');
  db.create('blacklistedTokens', {
    token,
    revokedAt: new Date().toISOString(),
  });
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = {
  // Middleware
  authenticate,
  optionalAuth,
  authorize,
  checkAccountOwnership,
  
  // Token utilities
  generateToken,
  generateRefreshToken,
  verifyToken,
  revokeToken,
  
  // Constants
  JWT_SECRET,
  JWT_EXPIRY,
};
