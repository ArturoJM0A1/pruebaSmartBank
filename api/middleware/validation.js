/**
 * ============================================================================
 * SMARTBANK - REQUEST VALIDATION MIDDLEWARE
 * ============================================================================
 * 
 * PURPOSE: Validates incoming request data (body, params, query) against
 *   defined schemas before route handlers process it.
 * 
 * WHY VALIDATION MATTERS:
 *   1. Security: Prevents injection attacks (SQL, XSS, etc.)
 *   2. Data Integrity: Ensures data matches expected format
 *   3. User Experience: Returns clear error messages for bad input
 *   4. API Contract: Enforces the API documentation promises
 *   5. Defense in Depth: Even if frontend validates, backend MUST too
 * 
 * WHERE TO VALIDATE:
 *   - Frontend: For UX (instant feedback, no network round-trip)
 *   - Backend: For security (NEVER trust client-side validation)
 *   - Both: Real apps validate on both sides independently
 * 
 * VALIDATION ALTERNATIVES:
 *   - Joi: Very popular, expressive syntax, heavy bundle size
 *   - Yup: Similar to Joi, smaller, TypeScript-friendly
 *   - Zod: Modern, TypeScript-first, tree-shakeable, great DX
 *   - express-validator: Middleware-based, integrates with Express
 *   - class-validator: Decorator-based (TypeScript classes)
 *   - Custom (THIS): Minimal, no dependencies, educational
 * 
 * WHY CUSTOM FOR THIS PROJECT:
 *   - No external dependencies to install
 *   - Students understand exactly what validation does
 *   - Easy to swap for Joi/Zod when ready for production
 *   - Patterns transfer to any validation library
 * ============================================================================
 */

'use strict';

const { ValidationError, BadRequestError } = require('./errorHandler');

// ============================================================================
// BUILT-IN VALIDATORS
// ============================================================================
// Each validator is a function that takes a value and returns:
//   - { valid: true } if valid
//   - { valid: false, message: "error message" } if invalid
// 
// WHY this format:
//   - Consistent interface for all validators
//   - Easy to compose (combine multiple validators)
//   - Clear error messages for API consumers
// ============================================================================

const validators = {
  /**
   * Check if value is present (not null, undefined, or empty string)
   * WHY first: Most fields need to be present. This is the most common check.
   */
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return { valid: false, message: 'This field is required' };
    }
    return { valid: true };
  },

  /**
   * Check minimum string length
   * WHY: Prevents too-short passwords, names, descriptions, etc.
   */
  minLength: (min) => (value) => {
    if (value && typeof value === 'string' && value.length < min) {
      return { valid: false, message: `Must be at least ${min} characters` };
    }
    return { valid: true };
  },

  /**
   * Check maximum string length
   * WHY: Prevents excessively long input that could cause storage issues
   *   or denial-of-service attacks (huge payloads)
   */
  maxLength: (max) => (value) => {
    if (value && typeof value === 'string' && value.length > max) {
      return { valid: false, message: `Must be no more than ${max} characters` };
    }
    return { valid: true };
  },

  /**
   * Validate email format
   * WHY regex instead of library: The regex is simplified but covers
   *   99% of real emails. For production, use a library or send a
   *   confirmation email (the only true email validation).
   * 
   * NOTE: RFC 5322 compliant email validation is extremely complex.
   *   This regex is intentionally simplified for practical use.
   */
  isEmail: (value) => {
    if (value && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, message: 'Must be a valid email address' };
      }
    }
    return { valid: true };
  },

  /**
   * Check if value is a valid number
   * WHY: Prevents string-to-number coercion issues
   *   "123abc" would become NaN in math operations
   */
  isNumber: (value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (isNaN(Number(value))) {
        return { valid: false, message: 'Must be a valid number' };
      }
    }
    return { valid: true };
  },

  /**
   * Check if number is positive (greater than 0)
   * WHY: Banking amounts, IDs, and quantities should never be negative
   *   (for the fields this is applied to)
   */
  isPositive: (value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Number(value) <= 0) {
        return { valid: false, message: 'Must be a positive number' };
      }
    }
    return { valid: true };
  },

  /**
   * Validate date format (YYYY-MM-DD)
   * WHY: Ensures consistent date format across the API
   *   ISO 8601 (YYYY-MM-DD) is the standard for APIs
   */
  isDate: (value) => {
    if (value && typeof value === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { valid: false, message: 'Must be a valid date (YYYY-MM-DD)' };
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { valid: false, message: 'Must be a valid date' };
      }
    }
    return { valid: true };
  },

  /**
   * Check if value is one of allowed values
   * WHY: Enums prevent invalid values (e.g., status can only be 'active' or 'blocked')
   */
  isIn: (allowedValues) => (value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (!allowedValues.includes(value)) {
        return {
          valid: false,
          message: `Must be one of: ${allowedValues.join(', ')}`,
        };
      }
    }
    return { valid: true };
  },

  /**
   * Validate against a regex pattern
   * WHY: Flexible validation for custom formats (CLABE, phone numbers, etc.)
   */
  matches: (pattern, message) => (value) => {
    if (value && typeof value === 'string') {
      if (!pattern.test(value)) {
        return { valid: false, message: message || 'Invalid format' };
      }
    }
    return { valid: true };
  },

  /**
   * Validate minimum numeric value
   * WHY: Enforce minimum amounts (e.g., minimum transfer amount)
   */
  min: (minValue) => (value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Number(value) < minValue) {
        return { valid: false, message: `Must be at least ${minValue}` };
      }
    }
    return { valid: true };
  },

  /**
   * Validate maximum numeric value
   * WHY: Enforce maximum amounts (e.g., daily transfer limits)
   */
  max: (maxValue) => (value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Number(value) > maxValue) {
        return { valid: false, message: `Must be no more than ${maxValue}` };
      }
    }
    return { valid: true };
  },
};

// ============================================================================
// SCHEMA VALIDATION ENGINE
// ============================================================================
// 
// HOW SCHEMAS WORK:
//   A schema is a plain object describing the expected shape of data.
//   Each field can have multiple validators applied in order.
// 
// SCHEMA FORMAT:
//   {
//     fieldName: [validator1, validator2, ...],
//     anotherField: [validator1],
//   }
// 
// Example:
//   {
//     email: [validators.required, validators.isEmail],
//     password: [validators.required, validators.minLength(8)],
//     amount: [validators.required, validators.isNumber, validators.isPositive],
//   }
// 
// WHY array of validators: Allows composition of multiple checks.
//   First failed validation stops processing (fail fast).
// ============================================================================

/**
 * Validate a value against an array of validators
 * 
 * @param {*} value - Value to validate
 * @param {Array} fieldValidators - Array of validator functions
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateField(value, fieldValidators) {
  const errors = [];

  for (const validator of fieldValidators) {
    const result = validator(value);
    if (!result.valid) {
      errors.push(result.message);
      // WHY break on first error: Fail fast is more efficient and
      //   gives clearer feedback (one error at a time)
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an entire object against a schema
 * 
 * @param {Object} data - Object to validate
 * @param {Object} schema - Schema definition
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateObject(data, schema) {
  const errors = {};
  let isValid = true;

  for (const [field, fieldValidators] of Object.entries(schema)) {
    const value = data[field];
    const result = validateField(value, fieldValidators);

    if (!result.valid) {
      isValid = false;
      errors[field] = result.errors[0]; // First error message
    }
  }

  return { valid: isValid, errors };
}

// ============================================================================
// MIDDLEWARE FACTORIES
// ============================================================================
// 
// WHY factory functions:
//   - Return middleware functions that can be applied to routes
//   - Accept schema as parameter (reusable across different schemas)
//   - Follow Express middleware pattern: (req, res, next)
// 
// USAGE:
//   app.post('/api/auth/register', validateBody(registerSchema), register);
//   app.get('/api/accounts/:id', validateParams({ id: [validators.required] }), getAccount);
//   app.get('/api/transactions', validateQuery({ page: [validators.isNumber] }), listTransactions);
// ============================================================================

/**
 * Validate request body against a schema
 * 
 * WHY body: POST, PUT, PATCH requests send data in the body.
 *   GET/DELETE requests typically don't have bodies.
 * 
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
function validateBody(schema) {
  return (req, res, next) => {
    // ============================================================================
    // CHECK: Does body exist?
    // ============================================================================
    // WHY: Some requests might not have a body (empty POST)
    //   We should handle this gracefully
    // ============================================================================
    if (!req.body || Object.keys(req.body).length === 0) {
      const hasRequiredFields = Object.values(schema).some(
        (validators) => validators.some((v) => v.name === '' || v === validators.required)
      );
      
      if (hasRequiredFields) {
        return next(new ValidationError('Request body is required'));
      }
      return next();
    }

    // ============================================================================
    // VALIDATE
    // ============================================================================
    const { valid, errors } = validateObject(req.body, schema);

    if (!valid) {
      // ============================================================================
      // FORMAT ERROR RESPONSE
      // ============================================================================
      // WHY this format:
      //   - success: false → Client knows request failed
      //   - error.code: Machine-readable error type
      //   - error.message: Human-readable summary
      //   - error.details: Field-level errors for form display
      // 
      // CLIENT USAGE:
      //   if (response.error.details) {
      //     // Show field errors in form
      //     Object.entries(response.error.details).forEach(([field, message]) => {
      //       showFieldError(field, message);
      //     });
      //   }
      // ============================================================================
      return next(
        new ValidationError('Validation failed', errors)
      );
    }

    next();
  };
}

/**
 * Validate URL parameters against a schema
 * 
 * WHY params validation:
 *   - URL params are always strings (even if they look like numbers)
 *   - Need to validate format (e.g., ID must be a number)
 *   - Prevents injection through URL manipulation
 * 
 * @param {Object} schema - Validation schema for URL params
 * @returns {Function} Express middleware
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { valid, errors } = validateObject(req.params, schema);

    if (!valid) {
      return next(new ValidationError('Invalid URL parameters', errors));
    }

    next();
  };
}

/**
 * Validate query string parameters against a schema
 * 
 * WHY query validation:
 *   - Query params control pagination, filtering, sorting
 *   - Need to validate ranges (page > 0, limit <= 100)
 *   - Prevents abuse (e.g., limit=999999)
 * 
 * @param {Object} schema - Validation schema for query params
 * @returns {Function} Express middleware
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { valid, errors } = validateObject(req.query, schema);

    if (!valid) {
      return next(new ValidationError('Invalid query parameters', errors));
    }

    next();
  };
}

// ============================================================================
// COMMONLY USED SCHEMAS
// ============================================================================
// WHY here: These are used across multiple routes. Centralizing them
//   ensures consistent validation and easy maintenance.
// ============================================================================

const schemas = {
  // Authentication schemas
  login: {
    email: [validators.required, validators.isEmail],
    password: [validators.required, validators.minLength(6)],
  },

  register: {
    email: [validators.required, validators.isEmail],
    password: [validators.required, validators.minLength(8)],
    firstName: [validators.required, validators.minLength(2), validators.maxLength(50)],
    lastName: [validators.required, validators.minLength(2), validators.maxLength(50)],
    phone: [validators.required, validators.matches(/^\+?[\d\s-]{10,15}$/, 'Must be a valid phone number')],
    dateOfBirth: [validators.required, validators.isDate],
  },

  // Account schemas
  createAccount: {
    type: [validators.required, validators.isIn(['checking', 'savings'])],
    name: [validators.required, validators.minLength(3), validators.maxLength(50)],
  },

  // Transaction schemas
  transfer: {
    fromAccountId: [validators.required, validators.isNumber, validators.isPositive],
    toAccountNumber: [validators.required, validators.minLength(8), validators.maxLength(18)],
    amount: [validators.required, validators.isNumber, validators.isPositive, validators.min(1)],
    description: [validators.maxLength(200)],
  },

  deposit: {
    accountId: [validators.required, validators.isNumber, validators.isPositive],
    amount: [validators.required, validators.isNumber, validators.isPositive, validators.min(1)],
    description: [validators.maxLength(200)],
  },

  // Card schemas
  updateCardLimit: {
    dailyLimit: [validators.isNumber, validators.isPositive],
    monthlyLimit: [validators.isNumber, validators.isPositive],
    singleTransactionLimit: [validators.isNumber, validators.isPositive],
  },

  // Beneficiary schemas
  createBeneficiary: {
    name: [validators.required, validators.minLength(2), validators.maxLength(100)],
    relationship: [validators.required, validators.isIn(['familia', 'amigo', 'trabajo', 'otro'])],
    bankCode: [validators.required, validators.minLength(3), validators.maxLength(3)],
    accountNumber: [validators.required, validators.minLength(8), validators.maxLength(18)],
    email: [validators.isEmail],
    phone: [validators.matches(/^\+?[\d\s-]{10,15}$/, 'Must be a valid phone number')],
  },

  // Pagination query params
  pagination: {
    page: [validators.isNumber, validators.min(1)],
    limit: [validators.isNumber, validators.min(1), validators.max(100)],
  },

  // Search query
  search: {
    q: [validators.required, validators.minLength(2), validators.maxLength(100)],
  },
};

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = {
  // Middleware factories
  validateBody,
  validateParams,
  validateQuery,

  // Validators (for custom schemas)
  validators,

  // Validation engine (for advanced use)
  validateField,
  validateObject,

  // Common schemas
  schemas,
};
