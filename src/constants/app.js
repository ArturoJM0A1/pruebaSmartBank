/**
 * ============================================================================
 * Application Constants
 * ============================================================================
 * 
 * PURPOSE:
 * This file contains ALL application-wide constants that define the behavior
 * and structure of the SmartBank application. These are values that:
 * - Won't change during runtime
 * - Are used across multiple files
 * - Define business rules and application structure
 * 
 * WHY A SEPARATE FILE?
 * - Single Source of Truth: One place to define all app constants
 * - Easy Maintenance: Change a route name once, it updates everywhere
 * - Documentation: New developers can understand app structure by reading this
 * - Prevents Magic Strings/Numbers: No unexplained 'ADMIN' or 10 scattered in code
 * 
 * CONSTANTS vs ENUMS:
 * - Constants: Simple values (APP_NAME, TIMEOUT)
 * - Enums: Related sets of values that represent states/types
 *   (STATUS.ACTIVE, STATUS.INACTIVE)
 * - Object.freeze() makes enums immutable (can't accidentally change them)
 * 
 * RELATED CONCEPTS:
 * - DRY (Don't Repeat Yourself)
 * - Configuration Management
 * - Business Logic Centralization
 * ============================================================================
 */

/**
 * APP_NAME - Application display name
 * Used in: HTML title, login page, error messages, logs
 */
export const APP_NAME = 'SmartBank';

/**
 * APP_VERSION - Semantic version number
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes
 * - MINOR: New features (backward compatible)
 * - PATCH: Bug fixes
 */
export const APP_VERSION = '1.0.0';

/**
 * STORAGE_KEYS - Keys for localStorage/SessionStorage
 * 
 * WHY prefix all keys?
 * - Prevents collision with other apps on same domain
 * - Makes it easy to find all SmartBank data in DevTools
 * - Example: 'smartbank_token' vs generic 'token'
 * 
 * Security Note: Don't store sensitive data (passwords, full card numbers)
 * in localStorage - it's accessible to any JS running on the page (XSS risk)
 */
export const STORAGE_KEYS = Object.freeze({
    TOKEN: 'smartbank_token',
    USER: 'smartbank_user',
    PREFERENCES: 'smartbank_preferences',
    THEME: 'smartbank_theme',
    LANGUAGE: 'smartbank_language',
    LAST_SEARCH: 'smartbank_last_search',
    RECENT_ACCOUNTS: 'smartbank_recent_accounts',
});

/**
 * ROUTES - All application routes/paths
 * 
 * WHY centralized routes?
 * 1. Prevents typos: navigate(ROUTES.DASHBOARD) vs navigate('/dashbaord')
 * 2. Easy to refactor: change '/dashboard' to '/home' in one place
 * 3. Type-safe navigation (with JSDoc)
 * 4. Makes route structure visible at a glance
 * 
 * Naming Convention:
 * - Singular for detail views: /account/:id
 * - Plural for lists: /accounts
 * - Kebab-case for multi-word: /transaction-history
 */
export const ROUTES = Object.freeze({
    // Public routes (no auth required)
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',

    // Protected routes (auth required)
    DASHBOARD: '/dashboard',
    ACCOUNTS: '/accounts',
    ACCOUNT_DETAIL: '/account/:id',
    ACCOUNT_STATEMENT: '/account/:id/statement',
    CARDS: '/cards',
    CARD_DETAIL: '/card/:id',
    TRANSACTIONS: '/transactions',
    TRANSACTION_DETAIL: '/transaction/:id',
    TRANSFER: '/transfer',
    BENEFICIARIES: '/beneficiaries',
    NOTIFICATIONS: '/notifications',
    PROFILE: '/profile',
    SETTINGS: '/settings',

    // Admin routes
    ADMIN_USERS: '/admin/users',
    ADMIN_ACCOUNTS: '/admin/accounts',
    ADMIN_CARDS: '/admin/cards',
    ADMIN_SETTINGS: '/admin/settings',
});

/**
 * ROLES - User roles for authorization
 * 
 * WHY roles? Role-Based Access Control (RBAC):
 * - Different users see different features
 * - Admin can manage users, regular users can't
 * - Prevents unauthorized actions at the UI level
 * 
 * Note: Client-side roles are for UX only. Real security is enforced server-side.
 * A user could modify localStorage to set role='admin' - that's why the server
 * validates permissions on EVERY request.
 */
export const ROLES = Object.freeze({
    ADMIN: 'admin',
    USER: 'user',
    PREMIUM: 'premium',
    SUPPORT: 'support',
});

/**
 * ACCOUNT_TYPES - Types of bank accounts
 * 
 * Each type has different rules:
 * - CHECKING: No interest, unlimited transactions
 * - SAVINGS: Interest earned, limited monthly withdrawals
 * - INVESTMENT: Higher risk, potential returns
 * - LOAN: Negative balance (debt)
 */
export const ACCOUNT_TYPES = Object.freeze({
    CHECKING: 'checking',
    SAVINGS: 'savings',
    INVESTMENT: 'investment',
    LOAN: 'loan',
});

/**
 * CARD_TYPES - Types of payment cards
 * 
 * Key differences:
 * - DEBIT: Links directly to bank account, spend what you have
 * - CREDIT: Credit line from bank, spend now pay later
 * - PREPAID: Loaded with money beforehand, like a gift card
 */
export const CARD_TYPES = Object.freeze({
    DEBIT: 'debit',
    CREDIT: 'credit',
    PREPAID: 'prepaid',
});

/**
 * TRANSACTION_TYPES - Types of financial transactions
 * 
 * Each type has different:
 * - Validation rules
 * - UI display format
 * - Business logic (fees, limits)
 * - Required fields
 */
export const TRANSACTION_TYPES = Object.freeze({
    TRANSFER: 'transfer',
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    PAYMENT: 'payment',
    FEE: 'fee',
    INTEREST: 'interest',
    REFUND: 'refund',
});

/**
 * STATUS - Entity statuses
 * 
 * WHY multiple statuses?
 * - Accounts can be active, temporarily blocked, or closed
 * - Cards can be active, blocked, or pending activation
 * - Transactions can be pending, completed, or failed
 * 
 * Using a status object instead of strings:
 * - Prevents typos: STATUS.ACTIVE vs 'actve'
 * - IDE can suggest valid values
 * - Easy to find all status usages
 */
export const STATUS = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked',
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    SUSPENDED: 'suspended',
});

/**
 * PAGINATION - Default pagination settings
 * 
 * WHY define these?
 * - Consistent UX across all list views
 * - Prevents fetching too many records (performance)
 * - Server can enforce MAX_LIMIT for security
 * 
 * Pagination strategy:
 * - Page-based (offset/limit) - simpler, good for most cases
 * - Cursor-based (after/before) - better for real-time data
 */
export const PAGINATION = Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MIN_LIMIT: 5,
    PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
});

/**
 * DATE_FORMATS - Date format strings
 * 
 * WHY centralized formats?
 * - Consistent date display across the app
 * - Easy to change format globally
 * - Supports internationalization (i18n)
 * 
 * Using format strings compatible with date-fns or similar libraries
 * or our own formatDate function
 */
export const DATE_FORMATS = Object.freeze({
    SHORT: 'dd/MM/yyyy',           // 21/07/2026
    LONG: 'dd MMMM yyyy',          // 21 July 2026
    WITH_TIME: 'dd/MM/yyyy HH:mm', // 21/07/2026 14:30
    TIME_ONLY: 'HH:mm',            // 14:30
    ISO: 'yyyy-MM-dd',             // 2026-07-21 (for API calls)
    MONTH_YEAR: 'MMMM yyyy',       // July 2026
    RELATIVE: 'relative',          // "2 hours ago", "Yesterday"
});

/**
 * VALIDATION_RULES - Validation constraints
 * 
 * WHY centralized validation?
 * - Same rules on client and server (sync via shared constants)
 * - Easy to update: change password min length once
 * - Self-documenting: new devs see all rules at once
 * - Used by our validators.js utilities
 */
export const VALIDATION_RULES = Object.freeze({
    EMAIL: {
        MIN_LENGTH: 5,
        MAX_LENGTH: 254, // RFC 5321
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL: true,
        SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    },
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
        PATTERN: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]+$/,
    },
    PHONE: {
        // Mexican phone format: 10 digits, optionally with country code +52
        PATTERN: /^(\+52)?[\s-]?(\d{2}[\s-]?\d{4}[\s-]?\d{4}|\d{10})$/,
        MIN_LENGTH: 10,
        MAX_LENGTH: 13,
    },
    AMOUNT: {
        MIN: 0.01,
        MAX: 999999999.99,
        DECIMALS: 2,
    },
    ACCOUNT_NUMBER: {
        LENGTH: 18, // Mexican bank accounts use 18 digits
        PATTERN: /^\d{18}$/,
    },
    CLABE: {
        LENGTH: 18, // CLABE interbancaria is always 18 digits
        PATTERN: /^\d{18}$/,
    },
    CARD_NUMBER: {
        LENGTH: 16,
        PATTERN: /^\d{16}$/,
    },
    CVV: {
        LENGTH: 3,
        PATTERN: /^\d{3,4}$/,
    },
});

/**
 * CURRENCY - Currency configuration
 * 
 * WHY: Mexico uses MXN (Mexican Peso)
 * - Symbol for display: $
 * - Locale for formatting: es-MX
 * - Decimal separator: .
 * - Thousands separator: ,
 */
export const CURRENCY = Object.freeze({
    CODE: 'MXN',
    SYMBOL: '$',
    LOCALE: 'es-MX',
    DECIMAL_PLACES: 2,
});

/**
 * TOAST_DURATION - Toast notification timing (in milliseconds)
 * 
 * WHY these specific values?
 * - Success: 3 seconds (short, user acknowledged it)
 * - Error: 5 seconds (longer, user needs to read it)
 * - Warning: 4 seconds (medium)
 * - Info: 3 seconds (short)
 */
export const TOAST_DURATION = Object.freeze({
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
});

/**
 * BREAKPOINTS - Responsive design breakpoints
 * 
 * WHY: Consistent responsive behavior across components
 * - Mobile first approach
 * - Common breakpoints matching popular devices
 */
export const BREAKPOINTS = Object.freeze({
    MOBILE: 576,
    TABLET: 768,
    DESKTOP: 992,
    LARGE: 1200,
    XLARGE: 1400,
});

/**
 * KEY_CODES - Keyboard key codes for accessibility
 * 
 * WHY: Keyboard navigation is essential for accessibility
 * - Enter/Space to activate buttons
 * - Escape to close modals
 * - Arrow keys for navigation
 */
export const KEY_CODES = Object.freeze({
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    ARROW_UP: 38,
    ARROW_DOWN: 40,
    ARROW_LEFT: 37,
    ARROW_RIGHT: 39,
    TAB: 9,
});