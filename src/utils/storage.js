/**
 * ============================================================================
 * LocalStorage Wrapper
 * ============================================================================
 * 
 * PURPOSE:
 * Provides a safe, type-safe interface to browser storage with:
 * - Error handling (storage can throw when full or disabled)
 * - JSON serialization/deserialization
 * - Namespace prefixing (prevent conflicts)
 * - Type-specific getters (getUser, getToken, etc.)
 * 
 * WHY A WRAPPER?
 * 1. Raw localStorage only stores strings (need JSON.parse/stringify)
 * 2. localStorage can throw (quota exceeded, private browsing)
 * 3. We need consistent key naming (smartbank_ prefix)
 * 4. Type-safe accessors prevent typos and add autocompletion
 * 
 * STORAGE ALTERNATIVES:
 * ┌─────────────────┬──────────────┬──────────────┬──────────────┐
 * │ Feature         │ localStorage │ sessionStorage │ IndexedDB  │
 * ├─────────────────┼──────────────┼──────────────┼──────────────┤
 * │ Lifetime        │ Forever      │ Tab session  │ Forever      │
 * │ Size            │ ~5-10MB      │ ~5-10MB      │ ~50MB+       │
 * │ Sync tabs       │ Yes          │ No           │ Yes          │
 * │ Structured data │ No (strings) │ No (strings) │ Yes          │
 * │ Async           │ No (sync)    │ No (sync)    │ Yes          │
 * │ Search          │ No           │ No           │ Yes          │
 * │ Performance     │ Good         │ Good         │ Better (async)│
 * └─────────────────┴──────────────┴──────────────┴──────────────┘
 * 
 * SECURITY CONSIDERATIONS:
 * - localStorage is accessible to ANY JavaScript on the page
 * - XSS attacks can steal data from localStorage
 * - NEVER store passwords, full card numbers, or sensitive PII
 * - For auth tokens, consider httpOnly cookies (not accessible to JS)
 * - Use encryption for sensitive data if storing in localStorage
 * 
 * COOKIES vs localStorage:
 * - Cookies: Sent with every HTTP request, httpOnly flag prevents JS access
 * - localStorage: Only sent when explicitly included in fetch/axios
 * - For auth tokens: httpOnly cookies are more secure
 * - For preferences/themes: localStorage is fine
 * 
 * RELATED CONCEPTS:
 * - Web Storage API
 * - Session Management
 * - XSS (Cross-Site Scripting) prevention
 * - Data privacy regulations (GDPR, LGPD)
 * ============================================================================
 */

import { STORAGE_KEYS } from '../constants/app.js';

/**
 * isAvailable - Check if localStorage is available
 * 
 * WHY: Some browsers disable localStorage in:
 * - Private/Incognito mode (some browsers)
 * - When storage quota is exceeded
 * - When user has disabled cookies/storage
 * - In sandboxed iframes
 * 
 * We check by trying to set and remove a test value
 * 
 * @returns {boolean} True if localStorage is available
 */
export function isAvailable() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        // SecurityError: access denied
        // QuotaExceededError: storage full
        return false;
    }
}

/**
 * get - Get item from localStorage with JSON parsing
 * 
 * WHY: localStorage.getItem() returns a string (or null).
 * We need to parse JSON for objects/arrays.
 * 
 * CONCEPT: Nullish coalescing (??) and optional chaining (?.)
 * - item ?? defaultValue: returns defaultValue if item is null/undefined
 * - JSON.parse(null) returns null, so we handle that
 * 
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed value or default
 */
function get(key, defaultValue = null) {
    if (!isAvailable()) return defaultValue;
    
    try {
        const item = localStorage.getItem(key);
        
        // If item doesn't exist, return default
        if (item === null) return defaultValue;
        
        // Try to parse as JSON
        return JSON.parse(item);
    } catch (error) {
        console.warn(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * set - Set item in localStorage with JSON serialization
 * 
 * WHY: localStorage.setItem() only accepts strings.
 * We need to stringify objects/arrays.
 * 
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} True if successful
 */
function set(key, value) {
    if (!isAvailable()) return false;
    
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Error writing to localStorage key "${key}":`, error);
        // Common error: QuotaExceededError when storage is full
        return false;
    }
}

/**
 * remove - Remove item from localStorage
 * 
 * @param {string} key - Storage key
 */
function remove(key) {
    if (!isAvailable()) return;
    
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error);
    }
}

/**
 * clear - Clear all SmartBank data from localStorage
 * 
 * WHY: Used on logout to prevent data leakage
 * Note: This only clears SmartBank keys, not other apps' data
 * 
 * CONCEPT: Object.values() returns array of object's values
 */
function clear() {
    if (!isAvailable()) return;
    
    try {
        // Remove all SmartBank keys
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.warn('Error clearing localStorage:', error);
    }
}

/**
 * ============================================================================
 * TOKEN MANAGEMENT
 * ============================================================================
 * Auth tokens (JWT) are stored for maintaining user sessions
 * ============================================================================
 */

/**
 * getToken - Get authentication token
 * 
 * @returns {string|null} Auth token or null
 */
export function getToken() {
    return get(STORAGE_KEYS.TOKEN, null);
}

/**
 * setToken - Store authentication token
 * 
 * SECURITY NOTE: In production, consider using httpOnly cookies instead.
 * localStorage tokens are vulnerable to XSS attacks.
 * httpOnly cookies can't be accessed by JavaScript at all.
 * 
 * @param {string} token - JWT token
 */
export function setToken(token) {
    set(STORAGE_KEYS.TOKEN, token);
}

/**
 * removeToken - Remove authentication token
 * Called on logout
 */
export function removeToken() {
    remove(STORAGE_KEYS.TOKEN);
}

/**
 * ============================================================================
 * USER DATA MANAGEMENT
 * ============================================================================
 */

/**
 * getUser - Get stored user data
 * 
 * @returns {Object|null} User object or null
 */
export function getUser() {
    return get(STORAGE_KEYS.USER, null);
}

/**
 * setUser - Store user data
 * 
 * @param {Object} user - User object
 */
export function setUser(user) {
    set(STORAGE_KEYS.USER, user);
}

/**
 * removeUser - Remove stored user data
 */
export function removeUser() {
    remove(STORAGE_KEYS.USER);
}

/**
 * ============================================================================
 * PREFERENCES MANAGEMENT
 * ============================================================================
 */

/**
 * getPreferences - Get user preferences
 * 
 * @returns {Object} Preferences object with defaults
 */
export function getPreferences() {
    return get(STORAGE_KEYS.PREFERENCES, {
        language: 'es',
        theme: 'light',
        notifications: true,
        emailNotifications: true,
        smsNotifications: false,
        compactMode: false,
        currency: 'MXN',
    });
}

/**
 * setPreferences - Store user preferences
 * 
 * @param {Object} prefs - Preferences object
 */
export function setPreferences(prefs) {
    const current = getPreferences();
    set(STORAGE_KEYS.PREFERENCES, { ...current, ...prefs });
}

/**
 * ============================================================================
 * THEME MANAGEMENT
 * ============================================================================
 */

/**
 * getTheme - Get current theme
 * 
 * @returns {string} Theme name ('light' or 'dark')
 */
export function getTheme() {
    return get(STORAGE_KEYS.THEME, 'light');
}

/**
 * setTheme - Set theme
 * 
 * @param {string} theme - Theme name
 */
export function setTheme(theme) {
    set(STORAGE_KEYS.THEME, theme);
    // Also apply to document for CSS
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * ============================================================================
 * CONVENIENCE METHODS
 * ============================================================================
 */

/**
 * getLastSearch - Get last search term
 * 
 * @returns {string} Last search term
 */
export function getLastSearch() {
    return get(STORAGE_KEYS.LAST_SEARCH, '');
}

/**
 * setLastSearch - Store last search term
 * 
 * @param {string} term - Search term
 */
export function setLastSearch(term) {
    set(STORAGE_KEYS.LAST_SEARCH, term);
}

/**
 * getRecentAccounts - Get recently accessed accounts
 * 
 * @returns {Array} Array of recent account IDs
 */
export function getRecentAccounts() {
    return get(STORAGE_KEYS.RECENT_ACCOUNTS, []);
}

/**
 * addRecentAccount - Add account to recent list
 * 
 * WHY: Quick access to frequently used accounts
 * Keeps only the last 5 accounts
 * 
 * @param {string} accountId - Account ID to add
 */
export function addRecentAccount(accountId) {
    const recent = getRecentAccounts().filter(id => id !== accountId);
    recent.unshift(accountId); // Add to beginning
    set(STORAGE_KEYS.RECENT_ACCOUNTS, recent.slice(0, 5)); // Keep only 5
}

/**
 * STORAGE_INFO - Storage usage information
 * 
 * WHY: Useful for debugging and showing users their storage usage
 */
export function getStorageInfo() {
    if (!isAvailable()) {
        return { available: false };
    }
    
    let totalSize = 0;
    const itemSizes = {};
    
    for (const key of Object.values(STORAGE_KEYS)) {
        const value = localStorage.getItem(key);
        if (value) {
            const size = new Blob([value]).size;
            itemSizes[key] = size;
            totalSize += size;
        }
    }
    
    return {
        available: true,
        used: totalSize,
        usedFormatted: formatBytes(totalSize),
        items: itemSizes,
    };
}

/**
 * formatBytes - Format bytes to human readable
 * 
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Export all functions for convenience
 */
export default {
    isAvailable,
    getToken,
    setToken,
    removeToken,
    getUser,
    setUser,
    removeUser,
    getPreferences,
    setPreferences,
    getTheme,
    setTheme,
    getLastSearch,
    setLastSearch,
    getRecentAccounts,
    addRecentAccount,
    clear,
    getStorageInfo,
};