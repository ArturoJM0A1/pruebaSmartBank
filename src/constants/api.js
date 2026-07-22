/**
 * ============================================================================
 * API Configuration Constants
 * ============================================================================
 * 
 * PURPOSE:
 * This file centralizes ALL API-related configuration in one place. This follows
 * the "Single Source of Truth" principle - if the API URL changes, you only
 * need to update it here, not search through dozens of files.
 * 
 * WHY CONSTANTS INSTEAD OF ENVIRONMENT VARIABLES?
 * - In vanilla JS (without build tools like Webpack/Vite), we can't use
 *   process.env like in Node.js or React
 * - Constants are tree-shakable and provide IDE autocompletion
 * - They're type-safe and catch typos at development time
 * - Alternative: Use a config.js that reads from window.ENV or data attributes
 * 
 * ALTERNATIVES:
 * - Environment variables (requires build tool like Webpack, Vite, Rollup)
 * - Config modules that load from /config endpoint at runtime
 * - Inline configuration (anti-pattern: hard to maintain)
 * - Global window object (anti-pattern: pollutes global scope)
 * 
 * RELATED CONCEPTS:
 * - DRY Principle (Don't Repeat Yourself)
 * - Configuration Management
 * - Dependency Injection (passing config instead of hardcoding)
 * ============================================================================
 */

/**
 * BASE_URL - The root URL for all API requests
 * 
 * WHY: Centralizing the base URL means:
 * 1. Easy to switch between environments (dev, staging, production)
 * 2. CORS only needs to be configured for one origin
 * 3. If the API moves, one line change fixes everything
 * 
 * In production, this might come from a config endpoint or environment variable
 */
export const BASE_URL = 'http://localhost:3000/api';

/**
 * TIMEOUT - Maximum time (in milliseconds) to wait for an API response
 * 
 * WHY 30 seconds?
 * - Most APIs should respond in 1-3 seconds
 * - 30s accounts for slow mobile connections and heavy operations
 * - Too long = bad UX (user stares at loading spinner)
 * - Too short = false failures on slow networks
 * 
 * This is used by our fetchWithTimeout utility in async.js
 * 30000ms = 30 seconds
 */
export const TIMEOUT = 30000;

/**
 * ENDPOINTS - All API endpoints organized by resource
 * 
 * WHY an object instead of string concatenation everywhere?
 * 1. IDE autocompletion: type ENDPOINTS. and see all options
 * 2. Single place to update if API structure changes
 * 3. Prevents typos in endpoint strings
 * 4. Makes it easy to version the API (add /v2/ prefix)
 * 
 * Structure follows RESTful conventions:
 * - GET /accounts - list
 * - GET /accounts/:id - single item
 * - POST /accounts - create
 * - PUT /accounts/:id - update
 * - DELETE /accounts/:id - delete
 */
export const ENDPOINTS = {
    // Authentication endpoints
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/auth/verify-email',
    },

    // User endpoints
    USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/update',
        SETTINGS: '/user/settings',
        CHANGE_PASSWORD: '/user/change-password',
        PREFERENCES: '/user/preferences',
    },

    // Account endpoints (banking accounts, not user accounts)
    ACCOUNTS: {
        BASE: '/accounts',
        BY_ID: (id) => `/accounts/${id}`,
        BALANCE: (id) => `/accounts/${id}/balance`,
        STATEMENT: (id) => `/accounts/${id}/statement`,
        TRANSACTIONS: (id) => `/accounts/${id}/transactions`,
    },

    // Card endpoints
    CARDS: {
        BASE: '/cards',
        BY_ID: (id) => `/cards/${id}`,
        BLOCK: (id) => `/cards/${id}/block`,
        UNBLOCK: (id) => `/cards/${id}/unblock`,
        LIMITS: (id) => `/cards/${id}/limits`,
    },

    // Transaction endpoints
    TRANSACTIONS: {
        BASE: '/transactions',
        BY_ID: (id) => `/transactions/${id}`,
        TRANSFER: '/transactions/transfer',
        DEPOSIT: '/transactions/deposit',
        WITHDRAW: '/transactions/withdraw',
        SUMMARY: '/transactions/summary',
    },

    // Beneficiary endpoints (people you can send money to)
    BENEFICIARIES: {
        BASE: '/beneficiaries',
        BY_ID: (id) => `/beneficiaries/${id}`,
    },

    // Notification endpoints
    NOTIFICATIONS: {
        BASE: '/notifications',
        BY_ID: (id) => `/notifications/${id}`,
        MARK_READ: (id) => `/notifications/${id}/read`,
        MARK_ALL_READ: '/notifications/read-all',
        UNREAD_COUNT: '/notifications/unread-count',
    },

    // Search endpoint
    SEARCH: {
        GLOBAL: '/search',
    },
};

/**
 * HTTP_METHODS - HTTP methods enum
 * 
 * WHY an enum object instead of raw strings?
 * 1. Prevents typos: ENDPOINTS.AUTH.LOGIN vs 'auht/login' (typo)
 * 2. IDE autocompletion and refactoring support
 * 3. Easy to search: find all usages of HTTP_METHODS.POST
 * 4. Can be extended with metadata if needed
 * 
 * HTTP Methods have specific semantics:
 * - GET: Read data (safe, idempotent, cacheable)
 * - POST: Create data (not idempotent)
 * - PUT: Replace entire resource (idempotent)
 * - PATCH: Partial update (not necessarily idempotent)
 * - DELETE: Remove data (idempotent)
 * 
 * IDEMPOTENT means: calling it multiple times produces the same result
 * Example: DELETE /accounts/123 - deleting the same account twice 
 * doesn't delete it twice (it's already gone)
 */
export const HTTP_METHODS = Object.freeze({
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
});

/**
 * REQUEST_STATUS - Track request states
 * 
 * WHY: UI needs to know if a request is pending, succeeded, or failed
 * to show appropriate loading spinners, success messages, or errors
 */
export const REQUEST_STATUS = Object.freeze({
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
});

/**
 * CONTENT_TYPES - Common content types
 * 
 * WHY: Different endpoints expect different content types
 * - JSON for most APIs
 * - FormData for file uploads
 * - URLSearchParams for some legacy APIs
 */
export const CONTENT_TYPES = Object.freeze({
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
});