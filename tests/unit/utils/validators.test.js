/**
 * ============================================================================
 * SMARTBANK - UNIT TESTS: Validators
 * ============================================================================
 * 
 * PURPOSE: Test all validation functions used across the SmartBank app.
 * 
 * WHY VALIDATE?
 *   - NEVER TRUST USER INPUT: Users can type anything. Validation is the
 *     first line of defense against bad data and security attacks.
 *   - FAIL FAST: Catch invalid data at the boundary (form submission),
 *     before it propagates through the system.
 *   - GOOD UX: Show clear error messages instead of cryptic crashes.
 * 
 * VALIDATION STRATEGIES:
 *   1. Client-side: Immediate feedback (this is what we test here).
 *   2. Server-side: Last line of defense (always validate again!).
 *   3. Database constraints: Final safety net.
 * 
 * ============================================================================
 */

'use strict';

/**
 * ============================================================================
 * EMAIL VALIDATION TESTS
 * ============================================================================
 * 
 * EMAIL FORMAT: local@domain.tld
 * - local: alphanumeric, dots, hyphens, underscores, plus
 * - @: required separator
 * - domain: alphanumeric, dots, hyphens
 * - .tld: 2-10 character extension
 * 
 * REGEX EXPLANATION:
 *   ^[a-zA-Z0-9._%+-]+  → local part (one or more valid chars)
 *   @                     → required @ symbol
 *   [a-zA-Z0-9.-]+       → domain name
 *   \.[a-zA-Z]{2,}$      → TLD (at least 2 chars)
 * ============================================================================
 */

describe('Email Validation', () => {
  // Helper function (would normally import from validators.js)
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  // WHAT: Valid emails should pass
  // WHY: These are the most common email formats users will enter.
  it('should accept valid email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('juan.perez@smartbank.com')).toBe(true);
    expect(isValidEmail('test+tag@gmail.com')).toBe(true);
    expect(isValidEmail('admin@sub.domain.org')).toBe(true);
    expect(isValidEmail('name123@domain.co')).toBe(true);
  });

  // WHAT: Invalid emails should fail
  // WHY: Catch formatting errors before they reach the database.
  it('should reject invalid email formats', () => {
    expect(isValidEmail('')).toBe(false);           // Empty
    expect(isValidEmail(null)).toBe(false);          // Null
    expect(isValidEmail(undefined)).toBe(false);     // Undefined
    expect(isValidEmail('user')).toBe(false);        // No @ or domain
    expect(isValidEmail('user@')).toBe(false);       // No domain
    expect(isValidEmail('@domain.com')).toBe(false); // No local part
    expect(isValidEmail('user@domain')).toBe(false); // No TLD
    expect(isValidEmail('user @domain.com')).toBe(false); // Space in local
    expect(isValidEmail('user@domain .com')).toBe(false); // Space in domain
  });

  // WHAT: Edge cases that might break validation
  // WHY: These catch regex bugs and boundary conditions.
  it('should handle edge cases', () => {
    expect(isValidEmail('a@b.co')).toBe(true);       // Minimal valid
    expect(isValidEmail('test@domain.toolongtld')).toBe(false); // TLD too long
    expect(isValidEmail('  user@example.com  ')).toBe(true); // Whitespace trimmed
  });
});

/**
 * ============================================================================
 * PASSWORD VALIDATION TESTS
 * ============================================================================
 * 
 * PASSWORD RULES (SmartBank standard):
 *   1. Minimum 8 characters
 *   2. At least 1 uppercase letter (A-Z)
 *   3. At least 1 lowercase letter (a-z)
 *   4. At least 1 number (0-9)
 *   5. At least 1 special character (!@#$%^&*)
 * 
 * WHY these rules?
 *   - Banking apps handle money. Weak passwords = stolen accounts.
 *   - These rules align with OWASP and NIST recommendations.
 *   - Balance: secure enough for banking, not so strict it annoys users.
 * ============================================================================
 */

describe('Password Validation', () => {
  function validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, errors: ['Password is required'] };
    }

    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  // WHAT: Strong password passes all rules
  it('should accept a strong password', () => {
    const result = validatePassword('SecureP@ss1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // WHAT: Too short password fails
  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Sh@1x');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  // WHAT: Missing uppercase fails
  it('should reject password without uppercase', () => {
    const result = validatePassword('securep@ss1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  // WHAT: Missing lowercase fails
  it('should reject password without lowercase', () => {
    const result = validatePassword('SECUREP@SS1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  // WHAT: Missing number fails
  it('should reject password without number', () => {
    const result = validatePassword('SecureP@ssword');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  // WHAT: Missing special character fails
  it('should reject password without special character', () => {
    const result = validatePassword('SecurePass1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  // WHAT: Empty/null password fails
  it('should reject empty or null password', () => {
    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword(null).valid).toBe(false);
    expect(validatePassword(undefined).valid).toBe(false);
  });
});

/**
 * ============================================================================
 * AMOUNT VALIDATION TESTS
 * ============================================================================
 * 
 * AMOUNT RULES:
 *   - Must be a number (not string, null, etc.)
 *   - Must be positive (no negative amounts for transfers)
 *   - Minimum: $1 MXN (can't transfer $0)
 *   - Maximum: $999,999.99 MXN (single transfer limit)
 *   - Max 2 decimal places (pesos don't have fractions beyond centavos)
 * ============================================================================
 */

describe('Amount Validation', () => {
  function validateAmount(amount, options = {}) {
    const { min = 1, max = 999999.99 } = options;

    if (amount === null || amount === undefined || amount === '') {
      return { valid: false, error: 'Amount is required' };
    }

    const num = Number(amount);

    if (isNaN(num)) {
      return { valid: false, error: 'Amount must be a number' };
    }

    if (num < min) {
      return { valid: false, error: `Amount must be at least $${min}` };
    }

    if (num > max) {
      return { valid: false, error: `Amount cannot exceed $${max.toLocaleString()}` };
    }

    // Check for more than 2 decimal places
    const decimalPart = String(amount).split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      return { valid: false, error: 'Amount cannot have more than 2 decimal places' };
    }

    return { valid: true, amount: num };
  }

  // WHAT: Valid amounts pass
  it('should accept valid amounts', () => {
    expect(validateAmount(100).valid).toBe(true);
    expect(validateAmount(1000.50).valid).toBe(true);
    expect(validateAmount(999999.99).valid).toBe(true);
    expect(validateAmount('500').valid).toBe(true); // String numbers
  });

  // WHAT: Minimum amount enforced
  it('should reject amounts below minimum', () => {
    expect(validateAmount(0).valid).toBe(false);
    expect(validateAmount(-100).valid).toBe(false);
  });

  // WHAT: Maximum amount enforced
  it('should reject amounts above maximum', () => {
    expect(validateAmount(1000000).valid).toBe(false);
    expect(validateAmount(9999999).valid).toBe(false);
  });

  // WHAT: Non-numeric input rejected
  it('should reject non-numeric input', () => {
    expect(validateAmount('abc').valid).toBe(false);
    expect(validateAmount(null).valid).toBe(false);
    expect(validateAmount(undefined).valid).toBe(false);
  });

  // WHAT: Too many decimal places rejected
  it('should reject amounts with more than 2 decimals', () => {
    expect(validateAmount(100.999).valid).toBe(false);
    expect(validateAmount(100.123).valid).toBe(false);
  });
});

/**
 * ============================================================================
 * CARD NUMBER VALIDATION TESTS
 * ============================================================================
 * 
 * CARD NUMBER RULES:
 *   - Must be exactly 16 digits
 *   - Must contain only numbers
 *   - Can include spaces (for display format "4111 1111 1111 1111")
 *   - Luhn algorithm check (optional, but good practice)
 * ============================================================================
 */

describe('Card Number Validation', () => {
  function isValidCardNumber(number) {
    if (!number || typeof number !== 'string') return false;

    // Remove spaces
    const cleaned = number.replace(/\s/g, '');

    // Must be 16 digits
    if (!/^\d{16}$/.test(cleaned)) return false;

    // Luhn algorithm check
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // WHAT: Valid card numbers pass Luhn check
  it('should accept valid Visa test number', () => {
    expect(isValidCardNumber('4111111111111111')).toBe(true);
  });

  it('should accept card number with spaces', () => {
    expect(isValidCardNumber('4111 1111 1111 1111')).toBe(true);
  });

  // WHAT: Invalid card numbers fail
  it('should reject card numbers that fail Luhn check', () => {
    expect(isValidCardNumber('1234567890123456')).toBe(false);
  });

  it('should reject card numbers with wrong length', () => {
    expect(isValidCardNumber('41111111')).toBe(false); // Too short
    expect(isValidCardNumber('41111111111111111111')).toBe(false); // Too long
  });

  it('should reject non-numeric card numbers', () => {
    expect(isValidCardNumber('abcd567890123456')).toBe(false);
  });

  it('should reject empty or null card numbers', () => {
    expect(isValidCardNumber('')).toBe(false);
    expect(isValidCardNumber(null)).toBe(false);
  });
});

/**
 * ============================================================================
 * ACCOUNT NUMBER VALIDATION TESTS
 * ============================================================================
 * 
 * ACCOUNT NUMBER RULES:
 *   - Mexican CLABE: exactly 18 digits
 *   - Regular account: 10-16 digits
 *   - Must contain only numbers
 * ============================================================================
 */

describe('Account Number Validation', () => {
  function isValidAccountNumber(number, type = 'account') {
    if (!number || typeof number !== 'string') return false;

    const cleaned = number.replace(/\s/g, '');

    if (type === 'clabe') {
      return /^\d{18}$/.test(cleaned);
    }

    return /^\d{10,16}$/.test(cleaned);
  }

  // WHAT: Valid CLABE (18 digits)
  it('should accept valid 18-digit CLABE', () => {
    expect(isValidAccountNumber('002123456789012345', 'clabe')).toBe(true);
  });

  it('should reject CLABE with wrong length', () => {
    expect(isValidAccountNumber('00212345678901234', 'clabe')).toBe(false); // 17 digits
    expect(isValidAccountNumber('0021234567890123456', 'clabe')).toBe(false); // 19 digits
  });

  // WHAT: Valid account numbers (10-16 digits)
  it('should accept valid account numbers', () => {
    expect(isValidAccountNumber('1234567890')).toBe(true); // 10 digits
    expect(isValidAccountNumber('1234567890123456')).toBe(true); // 16 digits
  });

  it('should reject account numbers with wrong length', () => {
    expect(isValidAccountNumber('123456789')).toBe(false); // 9 digits
    expect(isValidAccountNumber('12345678901234567')).toBe(false); // 17 digits
  });

  it('should reject non-numeric account numbers', () => {
    expect(isValidAccountNumber('abc1234567')).toBe(false);
  });
});
