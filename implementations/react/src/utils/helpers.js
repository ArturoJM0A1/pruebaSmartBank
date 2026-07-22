/**
 * Shared Utilities - Adapted for React
 * 
 * CODE SHARING between implementations:
 * - Pure utility functions are framework-agnostic
 * - Same logic works in React, Vue, Angular, etc.
 * - WHY keep them separate per implementation?
 *   → Each framework may need slight adaptations
 *   → Import paths differ
 *   → Some utilities are framework-specific
 * 
 * In a real project, you might use a shared package:
 * - Monorepo with shared utilities package
 * - npm workspace packages
 * - Git submodules
 */

/**
 * Format a number as currency
 * WHY Intl.NumberFormat?
 * - Handles locale-specific formatting automatically
 * - Supports different currencies and languages
 * - Better than manual string manipulation
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a date for display
 * WHY Intl.DateTimeFormat?
 * - Locale-aware date formatting
 * - Consistent across browsers
 * - Customizable patterns
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 hours ago")
 * WHY relative time?
 * - More human-readable for recent events
 * - Common pattern in social media, banking apps
 * - Intl.RelativeTimeFormat handles pluralization
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(-count, interval.label);
    }
  }

  return 'just now';
}

/**
 * Truncate text with ellipsis
 * WHY? Prevents layout breaking with long strings
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a unique ID
 * WHY crypto.randomUUID()?
 * - Native browser API (no dependencies)
 * - Cryptographically secure
 * - Better than Math.random() for uniqueness
 * - Falls back to timestamp + random for older browsers
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Debounce a function
 * WHY utility version vs hook version?
 * - Hook version is for React components
 * - Utility version works anywhere (event listeners, etc.)
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Validate email format
 * WHY not use a library?
 * - Simple regex covers most cases
 * - Full validation requires a server check anyway
 * - No extra dependency for one function
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize input to prevent XSS
 * WHY? Never trust user input
 * - Escape HTML entities
 * - Prevent script injection
 */
export function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
