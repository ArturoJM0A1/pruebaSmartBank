/**
 * ============================================================================
 * General Utility / Helper Functions
 * ============================================================================
 * 
 * PURPOSE:
 * This file contains pure functions that perform common tasks. Pure functions:
 * - Always return the same output for the same input
 * - Don't modify external state (no side effects)
 * - Are easy to test and reason about
 * 
 * WHY UTILITY FUNCTIONS?
 * 1. DRY: Write once, use everywhere
 * 2. Consistency: Same formatting across the entire app
 * 3. Testability: Pure functions are easy to unit test
 * 4. Readability: formatCurrency(amount) is clearer than toLocaleString logic
 * 
 * ORGANIZATION:
 * - Keep related functions together
 * - Export each function individually for tree-shaking
 * - No dependencies on other files (pure utilities)
 * ============================================================================
 */

import { CURRENCY, DATE_FORMATS } from '../constants/app.js';

/**
 * ============================================================================
 * FORMATTING FUNCTIONS
 * ============================================================================
 * These functions transform raw data into human-readable formats.
 * They're used in UI components to display data consistently.
 * ============================================================================
 */

/**
 * formatCurrency - Format a number as currency
 * 
 * WHY: Direct number display looks unprofessional:
 * - Bad: 1234567.89
 * - Good: $1,234,567.89 MXN
 * 
 * CONCEPT: Intl.NumberFormat (Internationalization API)
 * - Built-in browser API for formatting numbers, dates, currencies
 * - Locale-aware: uses comma/dot for thousands based on region
 * - Much better than manual string manipulation
 * 
 * @param {number} amount - The amount to format
 * @param {string} currency - ISO 4217 currency code (default: 'MXN')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = CURRENCY.CODE) {
    // Handle null/undefined/NaN
    if (amount === null || amount === undefined || isNaN(amount)) {
        return `${CURRENCY.SYMBOL}0.00`;
    }

    return new Intl.NumberFormat(CURRENCY.LOCALE, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
        maximumFractionDigits: CURRENCY.DECIMAL_PLACES,
    }).format(amount);
}

/**
 * formatDate - Format a date based on format type
 * 
 * WHY: Dates come in many formats (ISO strings, timestamps, Date objects).
 * This function handles all input types and formats consistently.
 * 
 * CONCEPT: Date parsing and construction
 * - new Date() can accept strings, timestamps, or Date objects
 * - We normalize all inputs to a Date object first
 * - Then format using Intl.DateTimeFormat or manual formatting
 * 
 * @param {Date|string|number} date - The date to format
 * @param {string} format - Format type ('short', 'long', 'full', 'iso')
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
    // Normalize input to Date object
    // If it's already a Date, use it. Otherwise, parse it.
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
        return '--';
    }

    const options = {
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        long: { day: 'numeric', month: 'long', year: 'numeric' },
        full: { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        },
        iso: null, // Handle separately
        monthYear: { month: 'long', year: 'numeric' },
    };

    if (format === 'iso') {
        return dateObj.toISOString().split('T')[0];
    }

    return new Intl.DateTimeFormat('es-MX', options[format] || options.short)
        .format(dateObj);
}

/**
 * formatDateTime - Format date with time
 * 
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date and time
 */
export function formatDateTime(date) {
    return formatDate(date, 'full');
}

/**
 * formatAccountNumber - Mask account number, showing only last 4 digits
 * 
 * WHY: Security! Never display full account numbers in the UI.
 * - Last 4 digits are enough for user to identify the account
 * - Prevents shoulder surfing (someone looking at your screen)
 * - Follows PCI-DSS guidelines for data masking
 * 
 * CONCEPT: String slicing and padding
 * - .slice(-4) gets last 4 characters
 * - .padStart() fills remaining characters with a placeholder
 * 
 * @param {string} number - Full account number
 * @returns {string} Masked account number (e.g., "**** **** **** 1234")
 */
export function formatAccountNumber(number) {
    if (!number) return '****';
    
    // Convert to string and ensure we have the full number
    const str = String(number);
    
    // Show last 4 digits, mask the rest
    const lastFour = str.slice(-4);
    const masked = '*'.repeat(Math.max(0, str.length - 4));
    
    // Format in groups of 4 for readability
    const full = masked + lastFour;
    return full.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * formatCardNumber - Mask card number (PCI compliance)
 * 
 * WHY: Card numbers are highly sensitive. PCI-DSS requires:
 * - Only show last 4 digits
 * - Never store full card numbers in logs
 * - Mask in UI, APIs, and database
 * 
 * @param {string} number - Full card number (16 digits)
 * @returns {string} Masked card (e.g., "**** **** **** 1234")
 */
export function formatCardNumber(number) {
    if (!number) return '**** **** **** ****';
    
    const str = String(number).replace(/\s/g, '');
    const lastFour = str.slice(-4);
    
    return `**** **** **** ${lastFour}`;
}

/**
 * formatCLABE - Mask CLABE (Mexican interbank code)
 * 
 * WHY: CLABE is 18 digits, used for interbank transfers.
 * Same security principles as card numbers.
 * 
 * @param {string} clabe - Full CLABE
 * @returns {string} Masked CLABE
 */
export function formatCLABE(clabe) {
    if (!clabe) return '******************';
    
    const str = String(clabe);
    const lastFour = str.slice(-4);
    const masked = '*'.repeat(Math.max(0, str.length - 4));
    
    return masked + lastFour;
}

/**
 * formatPhone - Format Mexican phone number
 * 
 * WHY: Mexican phone numbers are 10 digits (or 12 with country code +52)
 * Formatting makes them readable: 55 1234 5678
 * 
 * @param {string} phone - Phone number (10+ digits)
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle country code
    let digits = cleaned;
    if (digits.startsWith('52') && digits.length > 10) {
        digits = digits.slice(2);
    }
    
    // Format as XX XXXX XXXX
    if (digits.length === 10) {
        return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
    
    // Return cleaned if can't format
    return digits;
}

/**
 * formatPercentage - Format number as percentage
 * 
 * @param {number} value - The percentage value (e.g., 0.15 for 15%)
 * @param {boolean} isDecimal - If true, value is decimal (0.15), else whole number (15)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, isDecimal = false) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    
    const percentage = isDecimal ? value * 100 : value;
    return `${percentage.toFixed(2)}%`;
}

/**
 * ============================================================================
 * STRING UTILITIES
 * ============================================================================
 * These functions manipulate strings for display purposes.
 * ============================================================================
 */

/**
 * truncate - Truncate text with ellipsis
 * 
 * WHY: Long text breaks UI layouts. Truncation with ellipsis indicates
 * there's more content (user can click to see full text).
 * 
 * CONCEPT: Short-circuit evaluation with || (OR)
 * - str.slice(0, maxLength) returns substring
 * - Adding '...' only if we actually truncated
 * 
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated string with ellipsis
 */
export function truncate(str, maxLength = 50) {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
}

/**
 * capitalize - Capitalize first letter of string
 * 
 * WHY: User names, categories, statuses look better capitalized.
 * 
 * CONCEPT: Destructuring with slice
 * - str[0] gets first character
 * - .toUpperCase() makes it uppercase
 * - .slice(1) gets the rest of the string
 * 
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * generateId - Generate a unique ID
 * 
 * WHY: We sometimes need unique IDs on the client side:
 * - Temporary IDs for optimistic updates
 * - DOM element IDs
 * - Key generation for lists
 * 
 * CONCEPT: 
 * - Math.random() generates pseudo-random numbers (0 to 1)
 * - toString(36) converts to base-36 (a-z, 0-9) for shorter strings
 * - .slice(2) removes the "0." prefix
 * - Combining multiple random strings increases uniqueness
 * 
 * NOTE: This is NOT cryptographically secure. For real IDs,
 * use crypto.randomUUID() (modern browsers) or UUID library.
 * 
 * @returns {string} Unique ID string
 */
export function generateId() {
    // Modern approach using crypto API (most secure)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback: combine random strings for better uniqueness
    return 'id_' + Date.now().toString(36) + '_' + 
           Math.random().toString(36).substr(2, 9) +
           Math.random().toString(36).substr(2, 9);
}

/**
 * ============================================================================
 * FUNCTION UTILITIES (Higher-Order Functions)
 * ============================================================================
 * These functions take functions as arguments and return new functions.
 * This is a key concept in functional programming.
 * ============================================================================
 */

/**
 * debounce - Delay function execution until after a pause
 * 
 * WHY: When typing in a search box, you don't want to search on every keystroke.
 * Debouncing waits until the user stops typing (e.g., 300ms pause) before
 * executing the search.
 * 
 * CONCEPT: CLOSURES
 * A closure is a function that remembers the variables from its outer scope,
 * even after the outer function has finished executing.
 * 
 * How this works:
 * 1. debounce(fn, delay) is called, creating `timeoutId` variable
 * 2. Returns a new function (the debounced version)
 * 3. When the debounced function is called, it remembers `timeoutId`
 * 4. Each call clears the previous timeout and sets a new one
 * 5. Only after the delay passes without new calls, `fn` executes
 * 
 * VISUAL TIMELINE:
 * Keystroke 1: Clear timeout, set new timeout (300ms)
 * Keystroke 2 (100ms later): Clear timeout, set new timeout (300ms)
 * Keystroke 3 (200ms later): Clear timeout, set new timeout (300ms)
 * ...user stops typing...
 * 300ms after last keystroke: Execute fn()
 * 
 * @param {Function} fn - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
    // This is the closure: timeoutId persists across calls
    let timeoutId;
    
    // Return a new function that "closes over" timeoutId
    return function debounced(...args) {
        // Clear previous timeout (cancel pending execution)
        clearTimeout(timeoutId);
        
        // Set new timeout
        // Arrow function preserves `this` context from caller
        timeoutId = setTimeout(() => {
            // Apply the original function with correct context and arguments
            fn.apply(this, args);
        }, delay);
    };
}

/**
 * throttle - Limit function execution frequency
 * 
 * WHY: Some events fire very rapidly (scroll, resize, mousemove).
 * Throttling ensures the function runs at most once every X milliseconds.
 * 
 * DIFFERENCE FROM DEBOUNCE:
 * - Debounce: Waits until activity stops, then runs once
 * - Throttle: Runs immediately, then ignores calls for X ms
 * 
 * Example: Scroll event fires 100 times per second
 * - Without throttle: 100 function calls per second (expensive!)
 * - With throttle (200ms): 5 function calls per second
 * 
 * CONCEPT: Closures (same as debounce)
 * - `lastCall` variable persists across calls
 * - Tracks when the function was last executed
 * 
 * @param {Function} fn - The function to throttle
 * @param {number} limit - Minimum milliseconds between executions
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
    let lastCall = 0;
    let timeoutId;
    
    return function throttled(...args) {
        const now = Date.now();
        const timeUntilNext = limit - (now - lastCall);
        
        if (timeUntilNext <= 0) {
            // Enough time has passed, execute immediately
            clearTimeout(timeoutId);
            lastCall = now;
            fn.apply(this, args);
        } else if (!timeoutId) {
            // Schedule execution for the remaining time
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                timeoutId = null;
                fn.apply(this, args);
            }, timeUntilNext);
        }
    };
}

/**
 * sleep - Promise-based delay
 * 
 * WHY: Sometimes you need to wait in async code:
 * - Delayed animations
 * - Polling with intervals
 * - Testing with artificial delays
 * 
 * CONCEPT: Promises and async/await
 * - A Promise represents a future value
 * - setTimeout calls resolve() after the delay
 * - Can be used with: await sleep(1000) in async functions
 * 
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Resolves after the delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * ============================================================================
 * DATA TRANSFORMATION UTILITIES
 * ============================================================================
 */

/**
 * groupBy - Group array of objects by a key
 * 
 * WHY: Often need to group data (transactions by month, accounts by type)
 * 
 * CONCEPT: reduce() accumulator pattern
 * - reduce() iterates through array, building a single result
 * - The accumulator (acc) starts as an empty object
 * - Each iteration adds to the accumulator
 * 
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        // Get the grouping key (can be string or function)
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        
        // Initialize group array if it doesn't exist
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        
        // Add item to the group
        groups[groupKey].push(item);
        
        return groups;
    }, {}); // Initial value: empty object
}

/**
 * sortBy - Sort array of objects by a key
 * 
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted array (new array, doesn't mutate original)
 */
export function sortBy(array, key, direction = 'asc') {
    // .slice() creates a copy so we don't mutate the original
    return [...array].sort((a, b) => {
        let valueA = a[key];
        let valueB = b[key];
        
        // Handle string comparison
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        // Compare based on direction
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * chunk - Split array into chunks
 * 
 * WHY: Pagination, batch processing, displaying items in grid rows
 * 
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export function chunk(array, size = 10) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * uniqueBy - Remove duplicates by a key
 * 
 * WHY: API responses might have duplicate items
 * 
 * CONCEPT: Map data structure
 * - Map stores key-value pairs with any type as key
 * - More efficient than Object for non-string keys
 * 
 * @param {Array} array - Array with potential duplicates
 * @param {string} key - Key to check for uniqueness
 * @returns {Array} Array without duplicates
 */
export function uniqueBy(array, key) {
    const seen = new Map();
    return array.filter(item => {
        const val = item[key];
        if (seen.has(val)) return false;
        seen.set(val, true);
        return true;
    });
}

/**
 * pick - Select specific keys from an object
 * 
 * WHY: When sending data to API, you might want to exclude certain fields
 * (like passwords, internal IDs, timestamps)
 * 
 * CONCEPT: Object destructuring and computed property names
 * 
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to pick
 * @returns {Object} New object with only selected keys
 */
export function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * omit - Exclude specific keys from an object
 * 
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Keys to omit
 * @returns {Object} New object without omitted keys
 */
export function omit(obj, keys) {
    return Object.keys(obj).reduce((result, key) => {
        if (!keys.includes(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * flatten - Flatten nested object to dot notation
 * 
 * WHY: Some APIs expect flat objects, or we need to search nested values
 * 
 * CONCEPT: Recursion
 * - Function calls itself with smaller input
 * - Base case: value is not an object
 * - Recursive case: flatten the nested object
 * 
 * @param {Object} obj - Nested object
 * @param {string} prefix - Current path prefix
 * @returns {Object} Flattened object
 */
export function flatten(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, key) => {
        const pre = prefix ? prefix + '.' : '';
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Recurse into nested object
            Object.assign(acc, flatten(obj[key], pre + key));
        } else {
            acc[pre + key] = obj[key];
        }
        
        return acc;
    }, {});
}

/**
 * ============================================================================
 * MATH UTILITIES
 * ============================================================================
 */

/**
 * roundTo - Round number to specified decimal places
 * 
 * WHY: JavaScript floating point math is imprecise:
 * - 0.1 + 0.2 = 0.30000000000000004 (not 0.3!)
 * - For currency, we need exact decimal places
 * 
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
export function roundTo(num, decimals = 2) {
    return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * clamp - Restrict number to a range
 * 
 * WHY: Prevent values from going below minimum or above maximum
 * - Input fields: prevent negative amounts
 * - Progress bars: keep 0-100%
 * 
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped number
 */
export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}