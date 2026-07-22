/**
 * ============================================================================
 * Form Validation Utilities
 * ============================================================================
 * 
 * PURPOSE:
 * Client-side validation provides immediate feedback to users without
 * making a server request. Every validator returns a consistent format:
 * { valid: boolean, error: string | null }
 * 
 * CLIENT vs SERVER VALIDATION:
 * - Client: Quick feedback, better UX, but can be bypassed
 * - Server: Security, business rules, cannot be bypassed
 * - BOTH are required! Client validation is for UX, server for security
 * 
 * VALIDATION STRATEGY:
 * 1. Required field check (is it empty?)
 * 2. Format check (is it valid format?)
 * 3. Business rule check (does it meet requirements?)
 * 
 * REGEX (Regular Expressions):
 * - Pattern matching for strings
 * - /pattern/flags syntax
 * - Useful for format validation (email, phone, etc.)
 * - Can be hard to read, so we document them
 * 
 * RELATED CONCEPTS:
 * - Functional programming (each validator is a pure function)
 * - Single Responsibility (each function validates one thing)
 * - Composition (combine validators for complex rules)
 * ============================================================================
 */

import { VALIDATION_RULES } from '../constants/app.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

/**
 * ============================================================================
 * RESULT BUILDER
 * ============================================================================
 * Helper to create consistent validation results
 */

/**
 * Creates a validation result object
 * 
 * WHY a helper? Consistent structure across all validators.
 * The caller always knows what to expect: { valid, error }
 * 
 * @param {boolean} valid - Whether validation passed
 * @param {string|null} error - Error message if invalid
 * @returns {Object} Validation result
 */
function createResult(valid, error = null) {
    return { valid, error };
}

/**
 * The "success" result - reused for all passing validations
 * Using a constant avoids creating new objects each time (memory efficiency)
 */
const SUCCESS = createResult(true);

/**
 * ============================================================================
 * BASIC VALIDATORS
 * ============================================================================
 * Simple, reusable validators that check common constraints
 * ============================================================================
 */

/**
 * validateRequired - Check if a value is not empty
 * 
 * WHY: Most fields are required. This is the first check.
 * 
 * CONCEPT: Truthy/Falsy values in JavaScript
 * - Falsy values: '', null, undefined, 0, false, NaN
 * - We need to handle 0 separately (it's falsy but might be valid)
 * 
 * @param {*} value - Value to check
 * @returns {Object} Validation result
 */
export function validateRequired(value) {
    // Handle different types of "empty"
    if (value === null || value === undefined) {
        return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    }
    
    // For strings, check if empty after trimming whitespace
    if (typeof value === 'string' && value.trim() === '') {
        return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    }
    
    // For arrays, check if empty
    if (Array.isArray(value) && value.length === 0) {
        return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    }
    
    // For objects, check if empty
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
        return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    }
    
    return SUCCESS;
}

/**
 * validateMinLength - Check minimum string length
 * 
 * @param {string} value - String to check
 * @param {number} min - Minimum length
 * @returns {Object} Validation result
 */
export function validateMinLength(value, min) {
    if (!value) return SUCCESS; // Let validateRequired handle empty
    
    if (String(value).length < min) {
        return createResult(false, `Mínimo ${min} caracteres`);
    }
    return SUCCESS;
}

/**
 * validateMaxLength - Check maximum string length
 * 
 * @param {string} value - String to check
 * @param {number} max - Maximum length
 * @returns {Object} Validation result
 */
export function validateMaxLength(value, max) {
    if (!value) return SUCCESS;
    
    if (String(value).length > max) {
        return createResult(false, `Máximo ${max} caracteres`);
    }
    return SUCCESS;
}

/**
 * ============================================================================
 * FIELD-SPECIFIC VALIDATORS
 * ============================================================================
 * Validators for specific types of data (email, password, phone, etc.)
 * ============================================================================
 */

/**
 * validateEmail - Validate email address
 * 
 * REGEX BREAKDOWN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * ^           - Start of string
 * [^\s@]+     - One or more characters that are NOT whitespace or @
 * @           - Literal @ symbol
 * [^\s@]+     - One or more characters (domain name)
 * \.          - Literal dot (escaped with \)
 * [^\s@]+     - One or more characters (TLD like .com, .mx)
 * $           - End of string
 * 
 * This is a simple check. Full email validation would:
 * - Check domain exists (DNS lookup)
 * - Check email format per RFC 5322 (very complex)
 * - For SmartBank, this simple check is sufficient
 * 
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export function validateEmail(email) {
    if (!email) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    const trimmed = email.trim().toLowerCase();
    
    // Check length
    if (trimmed.length < VALIDATION_RULES.EMAIL.MIN_LENGTH) {
        return createResult(false, ERROR_MESSAGES.INVALID_EMAIL);
    }
    
    if (trimmed.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
        return createResult(false, ERROR_MESSAGES.INVALID_EMAIL);
    }
    
    // Check format with regex
    if (!VALIDATION_RULES.EMAIL.PATTERN.test(trimmed)) {
        return createResult(false, ERROR_MESSAGES.INVALID_EMAIL);
    }
    
    return SUCCESS;
}

/**
 * validatePassword - Validate password strength
 * 
 * WHY: Strong passwords protect user accounts.
 * Requirements:
 * - At least 8 characters
 * - One uppercase letter
 * - One lowercase letter
 * - One number
 * - One special character
 * 
 * REGEX PATTERNS:
 * - /[A-Z]/ - At least one uppercase letter
 * - /[a-z]/ - At least one lowercase letter
 * - /[0-9]/ - At least one digit
 * - /[!@#$%^&*]/ - At least one special character
 * 
 * CONCEPT: Lookahead assertions (?=...)
 * - (?=.*[A-Z]) means "somewhere ahead, there's an uppercase letter"
 * - The (?=...) pattern doesn't consume characters, just checks
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export function validatePassword(password) {
    if (!password) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    // Check minimum length
    if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
        return createResult(false, 
            `La contraseña debe tener al menos ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} caracteres`
        );
    }
    
    // Check maximum length (prevent DoS with huge passwords)
    if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
        return createResult(false, 
            `La contraseña no puede exceder ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} caracteres`
        );
    }
    
    // Check for uppercase
    if (VALIDATION_RULES.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        return createResult(false, 'La contraseña debe contener al menos una mayúscula');
    }
    
    // Check for lowercase
    if (VALIDATION_RULES.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        return createResult(false, 'La contraseña debe contener al menos una minúscula');
    }
    
    // Check for number
    if (VALIDATION_RULES.PASSWORD.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
        return createResult(false, 'La contraseña debe contener al menos un número');
    }
    
    // Check for special character
    if (VALIDATION_RULES.PASSWORD.REQUIRE_SPECIAL && 
        !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return createResult(false, 'La contraseña debe contener al menos un carácter especial');
    }
    
    return SUCCESS;
}

/**
 * validateName - Validate person's name
 * 
 * WHY: Names should only contain letters (and accents for Spanish).
 * Some names have spaces (María José) or hyphens (María-Jose).
 * 
 * @param {string} name - Name to validate
 * @returns {Object} Validation result
 */
export function validateName(name) {
    if (!name) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    const trimmed = name.trim();
    
    if (trimmed.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
        return createResult(false, 
            `El nombre debe tener al menos ${VALIDATION_RULES.NAME.MIN_LENGTH} caracteres`
        );
    }
    
    if (trimmed.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
        return createResult(false, 
            `El nombre no puede exceder ${VALIDATION_RULES.NAME.MAX_LENGTH} caracteres`
        );
    }
    
    // Check for letters only (including accented characters)
    if (!VALIDATION_RULES.NAME.PATTERN.test(trimmed)) {
        return createResult(false, 'El nombre solo debe contener letras');
    }
    
    return SUCCESS;
}

/**
 * validatePhone - Validate Mexican phone number
 * 
 * MEXICAN PHONE FORMAT:
 * - Mobile: 10 digits (e.g., 55 1234 5678)
 * - With country code: +52 55 1234 5678 (12 digits)
 * - Some numbers use spaces or dashes: 55-1234-5678
 * 
 * We accept various formats and validate the digit count
 * 
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
export function validatePhone(phone) {
    if (!phone) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    // Remove all non-digit characters for validation
    const digits = phone.replace(/\D/g, '');
    
    // Check if valid Mexican phone (10 digits, or 12 with country code)
    if (digits.length === 12 && digits.startsWith('52')) {
        return SUCCESS; // Valid with country code
    }
    
    if (digits.length === 10) {
        return SUCCESS; // Valid local format
    }
    
    return createResult(false, ERROR_MESSAGES.INVALID_PHONE);
}

/**
 * validateAmount - Validate monetary amount
 * 
 * WHY: Money validation is critical in banking apps.
 * - Must be positive
 * - Must be within limits
 * - Must have at most 2 decimal places
 * 
 * @param {number|string} amount - Amount to validate
 * @param {number} min - Minimum allowed amount
 * @param {number} max - Maximum allowed amount
 * @returns {Object} Validation result
 */
export function validateAmount(amount, min = VALIDATION_RULES.AMOUNT.MIN, max = VALIDATION_RULES.AMOUNT.MAX) {
    // Convert to number if string
    const num = Number(amount);
    
    if (amount === null || amount === undefined || amount === '') {
        return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    }
    
    if (isNaN(num)) {
        return createResult(false, ERROR_MESSAGES.INVALID_AMOUNT);
    }
    
    if (num < min) {
        return createResult(false, `El monto mínimo es $${min}`);
    }
    
    if (num > max) {
        return createResult(false, `El monto máximo es $${max}`);
    }
    
    // Check for too many decimal places
    const decimalPart = String(amount).split('.')[1];
    if (decimalPart && decimalPart.length > VALIDATION_RULES.AMOUNT.DECIMALS) {
        return createResult(false, `Máximo ${VALIDATION_RULES.AMOUNT.DECIMALS} decimales`);
    }
    
    return SUCCESS;
}

/**
 * validateAccountNumber - Validate bank account number
 * 
 * MEXICAN ACCOUNT FORMAT:
 * - 18 digits total
 * - Format: CLABE-like (bank code + branch + account)
 * 
 * @param {string} number - Account number to validate
 * @returns {Object} Validation result
 */
export function validateAccountNumber(number) {
    if (!number) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    const cleaned = String(number).replace(/\s/g, '');
    
    if (cleaned.length !== VALIDATION_RULES.ACCOUNT_NUMBER.LENGTH) {
        return createResult(false, 
            `La cuenta debe tener ${VALIDATION_RULES.ACCOUNT_NUMBER.LENGTH} dígitos`
        );
    }
    
    if (!VALIDATION_RULES.ACCOUNT_NUMBER.PATTERN.test(cleaned)) {
        return createResult(false, ERROR_MESSAGES.INVALID_ACCOUNT_NUMBER);
    }
    
    return SUCCESS;
}

/**
 * validateCLABE - Validate CLABE (Clave Bancaria Estandarizada)
 * 
 * CLABE FORMAT:
 * - 18 digits
 * - First 3 digits: Bank code
 * - Next 3 digits: Branch code
 * - Last 11 digits: Account number
 * - Last digit is a check digit
 * 
 * @param {string} clabe - CLABE to validate
 * @returns {Object} Validation result
 */
export function validateCLABE(clabe) {
    if (!clabe) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    const cleaned = String(clabe).replace(/\s/g, '');
    
    if (cleaned.length !== VALIDATION_RULES.CLABE.LENGTH) {
        return createResult(false, 
            `La CLABE debe tener ${VALIDATION_RULES.CLABE.LENGTH} dígitos`
        );
    }
    
    if (!VALIDATION_RULES.CLABE.PATTERN.test(cleaned)) {
        return createResult(false, ERROR_MESSAGES.INVALID_CLABE);
    }
    
    // Validate check digit (simplified)
    // Real validation would use the modulo 10 algorithm
    return SUCCESS;
}

/**
 * validateCardNumber - Validate card number using Luhn algorithm
 * 
 * LUHN ALGORITHM:
 * Used by credit cards, IMEI numbers, etc. to detect accidental errors.
 * 
 * How it works:
 * 1. Starting from the rightmost digit, double every second digit
 * 2. If doubled value > 9, subtract 9 (or add digits)
 * 3. Sum all digits
 * 4. If sum % 10 === 0, the number is valid
 * 
 * Example: 4532 0151 1283 036
 * - Check digit: 6
 * - Sum = 4+5+3+2+0+1+5+1+1+2+8+3+0+3 = 38
 * - 38 + 6 = 44 (not divisible by 10, invalid)
 * 
 * @param {string} number - Card number to validate
 * @returns {Object} Validation result
 */
export function validateCardNumber(number) {
    if (!number) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    const cleaned = String(number).replace(/\s/g, '');
    
    if (cleaned.length !== VALIDATION_RULES.CARD_NUMBER.LENGTH) {
        return createResult(false, 
            `El número de tarjeta debe tener ${VALIDATION_RULES.CARD_NUMBER.LENGTH} dígitos`
        );
    }
    
    if (!VALIDATION_RULES.CARD_NUMBER.PATTERN.test(cleaned)) {
        return createResult(false, ERROR_MESSAGES.INVALID_CARD_NUMBER);
    }
    
    // Luhn algorithm check
    let sum = 0;
    let isEven = false;
    
    // Loop from right to left
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    if (sum % 10 !== 0) {
        return createResult(false, 'Número de tarjeta inválido');
    }
    
    return SUCCESS;
}

/**
 * validateDate - Validate date
 * 
 * WHY: Dates must be:
 * - Valid (not NaN)
 * - Not in the future (for birth dates, past transactions)
 * - Not too far in the past
 * 
 * @param {Date|string} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateDate(date, options = {}) {
    const { allowFuture = false, allowPast = true } = options;
    
    if (!date) return createResult(false, ERROR_MESSAGES.REQUIRED_FIELD);
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return createResult(false, ERROR_MESSAGES.INVALID_DATE);
    }
    
    const now = new Date();
    
    if (!allowFuture && dateObj > now) {
        return createResult(false, 'La fecha no puede ser en el futuro');
    }
    
    if (!allowPast && dateObj < now) {
        return createResult(false, 'La fecha no puede ser en el pasado');
    }
    
    return SUCCESS;
}

/**
 * ============================================================================
 * FORM VALIDATOR
 * ============================================================================
 * Validates an entire form based on rules configuration
 * ============================================================================
 */

/**
 * validateForm - Validate multiple fields at once
 * 
 * WHY: Forms have multiple fields, each with their own rules.
 * This function validates all fields and returns all errors at once.
 * 
 * CONCEPT: Declarative validation
 * Instead of writing validation code for each form, you define rules:
 * const rules = {
 *   email: [validateRequired, validateEmail],
 *   password: [validateRequired, validatePassword],
 * };
 * 
 * @param {Object} fields - Field values { email: 'test@test.com', ... }
 * @param {Object} rules - Validation rules { email: [fn1, fn2], ... }
 * @returns {Object} { valid: boolean, errors: { field: 'error message', ... } }
 */
export function validateForm(fields, rules) {
    const errors = {};
    let isValid = true;
    
    // Iterate over each field in the rules
    for (const [fieldName, validators] of Object.entries(rules)) {
        const value = fields[fieldName];
        
        // Run each validator for this field
        for (const validator of validators) {
            const result = validator(value);
            
            if (!result.valid) {
                errors[fieldName] = result.error;
                isValid = false;
                break; // Stop at first error for this field
            }
        }
    }
    
    return { valid: isValid, errors };
}

/**
 * ============================================================================
 * PASSWORD MATCHING
 * ============================================================================
 */

/**
 * validatePasswordMatch - Check if two passwords match
 * 
 * WHY: Registration and password change forms need confirmation
 * 
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} Validation result
 */
export function validatePasswordMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
        return createResult(false, ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
    }
    return SUCCESS;
}

/**
 * ============================================================================
 * COMMON VALIDATION RULE SETS
 * ============================================================================
 * Pre-configured validator combinations for common scenarios
 * ============================================================================
 */

/**
 * Login form validation rules
 */
export const LOGIN_RULES = {
    email: [validateRequired, validateEmail],
    password: [validateRequired],
};

/**
 * Registration form validation rules
 */
export const REGISTER_RULES = {
    name: [validateRequired, validateName],
    email: [validateRequired, validateEmail],
    phone: [validateRequired, validatePhone],
    password: [validateRequired, validatePassword],
    confirmPassword: [validateRequired],
};

/**
 * Transfer form validation rules
 */
export const TRANSFER_RULES = {
    sourceAccount: [validateRequired, validateAccountNumber],
    destinationAccount: [validateRequired, validateAccountNumber],
    clabe: [validateRequired, validateCLABE],
    amount: [validateRequired, (v) => validateAmount(v, 1)],
    concept: [validateRequired, (v) => validateMaxLength(v, 200)],
};