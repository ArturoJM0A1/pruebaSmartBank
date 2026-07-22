/**
 * ============================================================================
 * SMARTBANK - UTILITY HELPER FUNCTIONS
 * ============================================================================
 * 
 * PURPOSE: Shared utility functions used across the entire API layer.
 * These are "pure functions" - they take input, produce output, and have
 * NO side effects. This makes them easy to test, reuse, and reason about.
 * 
 * WHY a separate helpers file?
 *   - DRY principle: Don't Repeat Yourself. If you need pagination in 3
 *     routes, write it once here.
 *   - Testability: Pure functions are trivial to unit test.
 *   - Maintainability: Bug fix in paginate() fixes it everywhere.
 * 
 * ALTERNATIVES CONSIDERED:
 *   - lodash/underscore: Great libraries, but adding a dependency for a
 *     handful of functions is overkill. Also teaches students what the
 *     functions actually DO under the hood.
 *   - Built-in Array methods (map, filter, reduce): We USE these inside
 *     our helpers. Our helpers add banking-specific logic on top.
 * 
 * PATTERN: "Module pattern" - each function is exported individually so
 * consumers can import only what they need (tree-shaking friendly in
 * bundlers, clear dependency in Node.js).
 * ============================================================================
 */

'use strict';

/**
 * ============================================================================
 * PAGINATION HELPER
 * ============================================================================
 * 
 * WHY pagination matters:
 *   - Without it, fetching 10,000 transactions would return ALL of them
 *     in one response, killing memory and bandwidth.
 *   - Frontend UIs show 10-50 items per page; we only send what's needed.
 *   - Standard in virtually every REST API (GitHub, Stripe, Twitter).
 * 
 * PATTERN: "Offset-based pagination" (page + limit)
 *   - Page 1, Limit 10 → items 0-9
 *   - Page 2, Limit 10 → items 10-19
 *   - Simple to implement, good enough for most use cases.
 *   - ALTERNATIVE: "Cursor-based" (use last item's ID as starting point).
 *     Better for real-time feeds and large datasets, but more complex.
 * 
 * @param {Array} array - Full array of items to paginate
 * @param {number} page - Current page (1-indexed, human-friendly)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result with metadata
 * ============================================================================
 */
function paginate(array, page = 1, limit = 10) {
  // WHY clamp values: Prevent negative pages or zero/negative limits
  // from causing weird behavior or errors
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100); // Cap at 100 to prevent abuse

  const startIndex = (safePage - 1) * safeLimit;
  const endIndex = startIndex + safeLimit;

  // Slice doesn't throw if endIndex > length; it just returns to the end
  const items = array.slice(startIndex, endIndex);

  // WHY Math.ceil for total pages: If 25 items and limit is 10, we need 3 pages (not 2.5)
  const totalPages = Math.ceil(array.length / safeLimit);

  return {
    data: items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: array.length,
      totalPages,
      // WHY include these: Frontend can use them directly without calculation
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
      // Helpful for "jump to page" UIs
      nextPage: safePage < totalPages ? safePage + 1 : null,
      previousPage: safePage > 1 ? safePage - 1 : null,
    },
  };
}

/**
 * ============================================================================
 * DYNAMIC FILTERING HELPER
 * ============================================================================
 * 
 * WHY dynamic filtering:
 *   - Users can filter transactions by type, date range, amount range, etc.
 *   - Instead of writing a custom filter for every combination, this helper
 *     accepts a filter object and applies all conditions.
 * 
 * PATTERN: "Specification pattern" - each filter key is a specification
 * that items must satisfy.
 * 
 * SUPPORTED FILTER TYPES:
 *   - Exact match: { type: "transfer" } → matches type === "transfer"
 *   - Array match: { type: ["transfer", "deposit"] } → matches any in array
 *   - Range (gte/lte): { amount: { gte: 1000, lte: 5000 } }
 *   - Date range: { date: { from: "2024-01-01", to: "2024-12-31" } }
 *   - Partial string match: { description: "coffee" } → includes
 * 
 * @param {Array} array - Items to filter
 * @param {Object} filters - Filter conditions
 * @returns {Array} Filtered items
 * ============================================================================
 */
function filter(array, filters = {}) {
  // WHY Object.keys().length check: If no filters, return original array
  // (no copy needed = better performance)
  if (!filters || Object.keys(filters).length === 0) {
    return array;
  }

  return array.filter((item) => {
    // Every filter must match (AND logic) - this is the most intuitive
    // behavior for users: "show me transfers AND over $1000 AND this month"
    return Object.entries(filters).every(([key, value]) => {
      // Skip null/undefined/empty filters - treat as "no filter on this field"
      if (value === null || value === undefined || value === '') return true;

      const itemValue = item[key];

      // Handle null item values - if the item doesn't have this field,
      // it can't match any filter (except "is null" which we don't support)
      if (itemValue === null || itemValue === undefined) return false;

      // ARRAY MATCH: Check if item value is in the allowed values
      // Example: { type: ["transfer", "deposit"] } matches either type
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }

      // OBJECT RANGE: Handle { gte, lte, gt, lt, from, to } patterns
      // WHY this pattern: It's the same pattern used by MongoDB, Elasticsearch,
      // and many other systems, so it's familiar to developers.
      if (typeof value === 'object' && !(value instanceof Date)) {
        // GTE/LTE: For numeric comparisons (amounts, balances)
        if ('gte' in value && Number(itemValue) < Number(value.gte)) return false;
        if ('lte' in value && Number(itemValue) > Number(value.lte)) return false;
        if ('gt' in value && Number(itemValue) <= Number(value.gt)) return false;
        if ('lt' in value && Number(itemValue) >= Number(value.lt)) return false;

        // FROM/TO: For date comparisons
        // WHY separate from numeric: Date parsing is different and we need
        // to handle date-only strings (no time component)
        if ('from' in value) {
          const fromDate = new Date(value.from);
          const itemDate = new Date(itemValue);
          if (itemDate < fromDate) return false;
        }
        if ('to' in value) {
          const toDate = new Date(value.to);
          const itemDate = new Date(itemValue);
          // Add 1 day to 'to' to make it inclusive (end of that day)
          toDate.setDate(toDate.getDate() + 1);
          if (itemDate >= toDate) return false;
        }

        // PARTIAL MATCH: For string fields (search within a field)
        if ('contains' in value) {
          return String(itemValue).toLowerCase().includes(String(value.contains).toLowerCase());
        }

        // If we have an object filter but none of the above matched,
        // skip (don't reject) - this handles unknown filter operators gracefully
        return true;
      }

      // EXACT MATCH: Default behavior - strict equality
      // WHY strict (===): Prevents type coercion bugs like "5" == 5
      if (typeof itemValue === 'string' && typeof value === 'string') {
        return itemValue.toLowerCase() === value.toLowerCase();
      }

      return itemValue === value;
    });
  });
}

/**
 * ============================================================================
 * TEXT SEARCH HELPER
 * ============================================================================
 * 
 * WHY a custom search (not using a search engine):
 *   - For a mock API with <1000 items, a simple string search is fine.
 *   - Real apps would use Elasticsearch, Meilisearch, or PostgreSQL full-text.
 *   - This teaches the CONCEPT without external dependencies.
 * 
 * ALTERNATIVES FOR PRODUCTION:
 *   - PostgreSQL: CREATE INDEX ... USING tsvector for full-text search
 *   - Elasticsearch: Purpose-built for complex search, but adds infrastructure
 *   - Algolia: SaaS search, easy but costs money
 *   - Fuse.js: Client-side fuzzy search library
 * 
 * @param {Array} array - Items to search
 * @param {string} term - Search term
 * @param {Array} fields - Which fields to search in
 * @returns {Array} Matching items with relevance score
 * ============================================================================
 */
function search(array, term, fields = []) {
  // WHY early return: Avoids unnecessary processing, and prevents
  // toLowerCase() crash on null/undefined
  if (!term || term.trim() === '') return [];

  const searchTerm = term.toLowerCase().trim();

  // WHY scoring: Helps sort results by relevance. A match in the "name"
  // field might be more relevant than a match in "description".
  const results = array
    .map((item) => {
      let score = 0;
      const matchedFields = [];

      fields.forEach((field, index) => {
        const value = String(item[field] || '').toLowerCase();
        if (value.includes(searchTerm)) {
          // WHY this scoring: Earlier fields (name, title) get higher scores.
          // Exact match gets higher score than partial match.
          // This is a SIMPLIFIED version of TF-IDF scoring used by real
          // search engines.
          const fieldWeight = fields.length - index; // Higher weight for earlier fields
          const isExact = value === searchTerm;
          score += isExact ? fieldWeight * 10 : fieldWeight;
          matchedFields.push(field);
        }
      });

      return { item, score, matchedFields };
    })
    .filter((result) => result.score > 0); // Only include matches

  // WHY sort by score descending: Most relevant results first
  results.sort((a, b) => b.score - a.score);

  // WHY return items with metadata: The consumer might want to highlight
  // which fields matched (for search result highlighting in UI)
  return results.map((r) => ({
    ...r.item,
    _searchScore: r.score,
    _matchedFields: r.matchedFields,
  }));
}

/**
 * ============================================================================
 * DATE FORMATTING HELPER
 * ============================================================================
 * 
 * WHY custom formatting:
 *   - Intl.DateTimeFormat is powerful but verbose for common formats.
 *   - moment.js/date-fns are great but heavy dependencies.
 *   - For a banking app, we need consistent date formats for display
 *     and API responses.
 * 
 * ALTERNATIVES:
 *   - date-fns: Best modern alternative, tree-shakeable, immutable
 *   - dayjs: Tiny (2KB), moment-like API
 *   - Intl.DateTimeFormat: Built-in, no dependency, but verbose
 * 
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date string
 * ============================================================================
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  // WHY new Date(): Handles both Date objects and date strings
  const d = new Date(date);

  // WHY isNaN check: new Date('invalid') returns Invalid Date, and
  // getFullYear() would return NaN, causing weird output
  if (isNaN(d.getTime())) return 'Invalid Date';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // WHY +1: Months are 0-indexed
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  // WHY switch statement: Clear, readable, and easy to add new formats.
  // Alternative: Object lookup map, but switch is more explicit.
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'DD/MM/YYYY HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'MMMM YYYY':
      // WHY this format: Common in bank statements ("January 2024")
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${monthNames[d.getMonth()]} ${year}`;
    case 'ISO':
      return d.toISOString();
    default:
      return d.toLocaleDateString('es-MX'); // WHY es-MX: Mexican locale
  }
}

/**
 * ============================================================================
 * ACCOUNT NUMBER GENERATOR
 * ============================================================================
 * 
 * WHY realistic generation:
 *   - Mock data needs to look real for UI testing and demos.
 *   - Mexican bank account numbers follow specific patterns.
 * 
 * MEXICAN BANKING FORMAT:
 *   - CLABE (Clave Bancaria Estandarizada): 18 digits
 *     - Digits 1-3: Bank code (e.g., 002 = Banamex, 012 = BBVA)
 *     - Digits 4-6: Branch code
 *     - Digits 7-17: Account number
 *     - Digit 18: Check digit (Luhn algorithm)
 *   - Account numbers: Typically 10-16 digits depending on bank
 * 
 * @returns {Object} Generated account info
 * ============================================================================
 */
function generateAccountNumber() {
  // Common Mexican bank codes for realistic testing
  const bankCodes = ['002', '012', '014', '021', '060', '072'];

  // WHY pick random bank code: Simulates accounts from different banks
  const bankCode = bankCodes[Math.floor(Math.random() * bankCodes.length)];

  // Generate random digits for the account portion
  const accountDigits = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');

  // Simple check digit (not real Luhn, but looks realistic)
  // WHY fake check digit: Real Luhn implementation is complex and
  // unnecessary for mock data. The point is visual realism.
  const checkDigit = Math.floor(Math.random() * 10);

  return {
    accountNumber: accountDigits,
    clabe: `${bankCode}012${accountDigits}${checkDigit}`,
    bankCode,
  };
}

/**
 * ============================================================================
 * CARD NUMBER GENERATOR (Test Numbers)
 * ============================================================================
 * 
 * WHY test numbers:
 *   - Real card numbers are private and using them would be illegal.
 *   - Test numbers follow the same format but are flagged as test.
 *   - Major card networks publish test numbers for development.
 * 
 * CARD NUMBER STRUCTURE:
 *   - Digits 1-6: IIN (Issuer Identification Number) / BIN
 *   - Digits 7-15: Account identifier
 *   - Digit 16: Check digit (Luhn algorithm)
 * 
 * TEST IINs:
 *   - Visa: 4111 1111 1111 1111 (classic test number)
 *   - Mastercard: 5555 5555 5555 4444
 *   - We generate random but valid-looking numbers for variety
 * 
 * @returns {string} 16-digit test card number
 * ============================================================================
 */
function generateCardNumber() {
  // IINs that look like real Mexican bank cards
  const prefixes = [
    '4111',  // Visa test
    '4242',  // Visa test
    '5105',  // Mastercard test
    '5454',  // Mastercard test
    '4012',  // Visa (resembles BBVA Mexico cards)
    '4169',  // Visa (resembles Banorte cards)
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  // Generate remaining 12 digits
  const middle = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');

  // WHY simple check digit: Same reasoning as account numbers.
  // Real Luhn algorithm exists but adds complexity without benefit for mock data.
  const checkDigit = Math.floor(Math.random() * 10);

  const fullNumber = `${prefix}${middle}${checkDigit}`;

  // WHY formatted and raw: Display shows "4111 1111 1111 1111",
  // but storage uses "4111111111111111" (no spaces)
  return fullNumber;
}

/**
 * ============================================================================
 * AGE CALCULATOR
 * ============================================================================
 * 
 * WHY custom age calculation:
 *   - JavaScript doesn't have a built-in "calculate age" function.
 *   - Simple subtraction of years is WRONG (birthday hasn't occurred yet).
 *   - This handles the edge case correctly.
 * 
 * @param {Date|string} birthDate - Date of birth
 * @returns {number} Age in years
 * ============================================================================
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);

  // WHY this calculation:
  // 1. Get difference in years
  // 2. Subtract 1 if birthday hasn't occurred yet this year
  // This is the correct algorithm - simple year subtraction is wrong
  let age = today.getFullYear() - birth.getFullYear();

  // Check if birthday has occurred this year
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * ============================================================================
 * INPUT SANITIZATION
 * ============================================================================
 * 
 * WHY sanitize:
 *   - Prevents XSS (Cross-Site Scripting) if data is rendered in HTML.
 *   - Prevents injection attacks if used in queries.
 *   - Trims whitespace and normalizes input.
 * 
 * ALTERNATIVES:
 *   - DOMPurify: For HTML sanitization in browser environments
 *   - validator.js: More comprehensive validation library
 *   - Parameterized queries: Better for SQL injection (handled at DB level)
 * 
 * NOTE: This is BASIC sanitization. For a production banking app,
 * you'd use a dedicated sanitization library AND validate at the
 * database level.
 * 
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 * ============================================================================
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';

  return str
    .trim()                          // Remove leading/trailing whitespace
    .replace(/[<>]/g, '')           // Remove angle brackets (basic XSS prevention)
    .replace(/&/g, '&amp;')         // Escape ampersand
    .replace(/"/g, '&quot;')        // Escape double quotes
    .replace(/'/g, '&#x27;')        // Escape single quotes
    .replace(/\//g, '&#x2F;');      // Escape forward slash
}

/**
 * ============================================================================
 * MODULE EXPORTS
 * ============================================================================
 * 
 * WHY individual exports: Allows importing only what's needed.
 * 
 * Usage:
 *   const { paginate, filter } = require('./helpers');
 *   // vs importing everything (wastes memory for unused functions)
 * ============================================================================
 */
module.exports = {
  paginate,
  filter,
  search,
  formatDate,
  generateAccountNumber,
  generateCardNumber,
  calculateAge,
  sanitizeString,
};
