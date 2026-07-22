/**
 * ============================================================================
 * SMARTBANK - ERROR HANDLING MIDDLEWARE
 * ============================================================================
 * 
 * PURPOSE: Centralized error handling for the entire API. Instead of each
 *   route handler having its own try/catch, we define errors once here
 *   and Express calls this automatically when an error is thrown/passed.
 * 
 * WHY centralized error handling:
 *   1. DRY: Error formatting logic in one place
 *   2. Consistency: All API errors follow the same format
 *   3. Security: Never expose internal error details to clients
 *   4. Logging: All errors logged in one place for monitoring
 *   5. Testing: Easy to test error scenarios
 * 
 * ERROR RESPONSE FORMAT:
 *   {
 *     success: false,
 *     error: {
 *       code: "VALIDATION_ERROR",
 *       message: "Human-readable message",
 *       details: [...] // Optional: field-level errors
 *     }
 *   }
 * 
 * WHY this format:
 *   - success: false makes it easy for clients to check status
 *   - code: Machine-readable error type (for i18n, conditional logic)
 *   - message: Human-readable (for display to users)
 *   - details: Optional structured data (for form validation errors)
 * 
 * ALTERNATIVES:
 *   - HTTP status codes only: Less informative, harder to handle client-side
 *   - Stack traces: Security risk! Never expose internals to clients
 *   - RFC 7807 (Problem Details): More formal, good for complex APIs
 * ============================================================================
 */

'use strict';

/**
 * ============================================================================
 * CUSTOM APPLICATION ERROR CLASS
 * ============================================================================
 * 
 * WHY extend Error:
 *   - Standard JavaScript error class
 *   - Stack traces work correctly
 *   - instanceof checks work
 * 
 * WHY add statusCode:
 *   - Maps directly to HTTP status codes
 *   - Default 500 (server error) if not specified
 *   - Allows throwing errors with specific HTTP codes:
 *       throw new AppError('Not found', 404)
 *       throw new AppError('Invalid input', 400)
 * 
 * WHY add code:
 *   - Machine-readable error identifier
 *   - Client can use this for conditional logic:
 *       if (error.code === 'INSUFFICIENT_FUNDS') { ... }
 *   - Independent of message (messages can change for i18n)
 * ============================================================================
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // WHY statusCode to HTTP status mapping:
    // 4xx = Client errors (user did something wrong)
    // 5xx = Server errors (something broke on our end)
    this.httpStatus = this._getHttpStatus(statusCode);
    this.code = code || this._getDefaultCode(statusCode);
    this.details = details;
    this.isOperational = true; // Distinguishes programming errors from operational errors
  }

  /**
   * Map numeric status code to human-readable HTTP status text
   * WHY: Some HTTP clients expect the status text, not just the code
   */
  _getHttpStatus(code) {
    const statuses = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return statuses[code] || 'Unknown Status';
  }

  /**
   * Generate default error code from status code
   * WHY: Provides a fallback code if none is specified
   */
  _getDefaultCode(code) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
    };
    return codes[code] || 'UNKNOWN_ERROR';
  }

  /**
   * Convert to plain object for JSON serialization
   * WHY: Error objects can have non-enumerable properties that
   *   JSON.stringify() skips. This ensures all data is included.
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        // WHY include statusCode: Clients can use it for programmatic handling
        // WHY include httpStatus: Human-readable status text
        statusCode: this.statusCode,
        httpStatus: this.httpStatus,
      },
    };
  }
}

/**
 * ============================================================================
 * PREDEFINED ERROR FACTORY FUNCTIONS
 * ============================================================================
 * 
 * WHY factory functions instead of throwing AppError directly:
 *   - Cleaner, more readable error creation
 *   - Consistent error messages and codes
 *   - Easy to update message format in one place
 * 
 * Usage:
 *   throw NotFoundError('User not found');
 *   throw ValidationError('Invalid email', [{ field: 'email', message: '...' }]);
 * ============================================================================
 */

function BadRequestError(message = 'Bad request', details = null) {
  return new AppError(message, 400, 'BAD_REQUEST', details);
}

function UnauthorizedError(message = 'Authentication required') {
  return new AppError(message, 401, 'UNAUTHORIZED');
}

function ForbiddenError(message = 'Access denied') {
  return new AppError(message, 403, 'FORBIDDEN');
}

function NotFoundError(resource = 'Resource', id = null) {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  return new AppError(message, 404, 'NOT_FOUND');
}

function ConflictError(message = 'Resource already exists') {
  return new AppError(message, 409, 'CONFLICT');
}

function ValidationError(message = 'Validation failed', details = null) {
  return new AppError(message, 422, 'VALIDATION_ERROR', details);
}

function RateLimitError(message = 'Too many requests') {
  return new AppError(message, 429, 'RATE_LIMITED');
}

function InternalError(message = 'Internal server error') {
  return new AppError(message, 500, 'INTERNAL_ERROR');
}

/**
 * ============================================================================
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * ============================================================================
 * 
 * WHY Express error handler has 4 parameters:
 *   Express recognizes error handlers by their signature: (err, req, res, next)
 *   If you omit any parameter, Express won't recognize it as an error handler.
 * 
 * WHY this is the LAST middleware:
 *   Express processes middleware in order. Error handlers must be at the end
 *   to catch errors from all previous middleware and routes.
 * 
 * HOW Express error handling works:
 *   1. Route/middleware calls next(error) or throws
 *   2. Express skips all normal middleware (no next() calls)
 *   3. Express finds the next error-handling middleware (4 params)
 *   4. This function receives the error and sends response
 * ============================================================================
 */
function errorHandler(err, req, res, _next) {
  // ============================================================================
  // LOG ERROR (Server-side only)
  // ============================================================================
  // WHY log here: Centralized logging makes it easy to set up monitoring
  //   (Sentry, DataDog, CloudWatch, etc.)
  // WHY NOT log client errors (4xx): They're expected behavior, not bugs.
  //   Logging every 404 would flood logs with noise.
  // ============================================================================
  const statusCode = err.statusCode || 500;
  
  if (statusCode >= 500) {
    // Server errors: Log full details for debugging
    console.error(`\n[ERROR] ${new Date().toISOString()}`);
    console.error(`  Status: ${statusCode}`);
    console.error(`  Message: ${err.message}`);
    console.error(`  Stack: ${err.stack}`);
    if (req) {
      console.error(`  Request: ${req.method} ${req.originalUrl}`);
      console.error(`  User: ${req.user ? req.user.id : 'unauthenticated'}`);
    }
  } else if (statusCode >= 400) {
    // Client errors: Log at warn level (not a bug, just bad input)
    console.warn(`[WARN] ${statusCode} - ${err.message} - ${req.method} ${req.originalUrl}`);
  }

  // ============================================================================
  // DETERMINE RESPONSE FORMAT
  // ============================================================================
  // WHY check for AppError: Custom errors have structured data.
  //   Unknown errors (generic Error, TypeError) need to be wrapped.
  // ============================================================================
  let errorResponse;

  if (err instanceof AppError) {
    // Operational error: Known, expected error with structured data
    errorResponse = err.toJSON();
  } else {
    // Programming error: Unexpected bug (null reference, syntax error, etc.)
    // WHY hide details: Stack traces could expose internal architecture,
    //   file paths, database queries, etc. This is a security best practice.
    errorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development'
          ? err.message  // Show details in development for debugging
          : 'An unexpected error occurred', // Hide details in production
        statusCode: 500,
        httpStatus: 'Internal Server Error',
        // WHY include stack only in development: Helps developers find the bug
        //   without exposing internals to end users
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    };
  }

  // ============================================================================
  // SEND RESPONSE
  // ============================================================================
  // WHY json(): Automatically sets Content-Type: application/json
  // WHY status(): Sets the HTTP status code
  // ============================================================================
  res.status(statusCode).json(errorResponse);
}

/**
 * ============================================================================
 * 404 HANDLER (Not Found)
 * ============================================================================
 * 
 * WHY separate from errorHandler:
 *   - This handles requests to non-existent routes
 *   - Error handler handles thrown errors within existing routes
 *   - Different concerns, different middleware
 * 
 * WHY placed after all routes:
 *   - Must be defined AFTER all route definitions
 *   - If no route matches, this catches the request
 * ============================================================================
 */
function notFoundHandler(req, res, _next) {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  errorHandler(error, req, res, _next);
}

/**
 * ============================================================================
 * ASYNC WRAPPER (Helper)
 * ============================================================================
 * 
 * WHY this wrapper:
 *   - Without it, every route needs try/catch:
 *       app.get('/users', async (req, res, next) => {
 *         try {
 *           const users = await db.findAll('users');
 *           res.json(users);
 *         } catch (err) {
 *           next(err); // Must pass to error handler
 *         }
 *       });
 *   - With wrapper:
 *       app.get('/users', asyncHandler(async (req, res) => {
 *         const users = await db.findAll('users');
 *         res.json(users);
 *       }));
 * 
 * ALTERNATIVES:
 *   - express-async-errors: Package that auto-wraps (adds side effects)
 *   - Try/catch in every route: Verbose but explicit
 * 
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler that catches errors
 * ============================================================================
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  // Factory functions
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
};
