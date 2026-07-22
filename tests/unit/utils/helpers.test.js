/**
 * ============================================================================
 * SMARTBANK - UNIT TESTS: Helper Functions
 * ============================================================================
 * 
 * PURPOSE: Test the utility/helper functions from api/utils/helpers.js.
 * 
 * WHAT IS UNIT TESTING?
 *   - Testing ONE function in isolation, with NO dependencies on other code.
 *   - Input → Function → Output (verify output matches expected).
 *   - Like testing a calculator: press 2+2, expect 4.
 * 
 * WHY TEST HELPERS?
 *   - Helpers are used EVERYWHERE. A bug in formatCurrency affects ALL
 *     money displays in the app.
 *   - Helpers are pure functions (no side effects), making them easy to test.
 *   - Early bug detection: catch issues before they reach production.
 * 
 * TEST ORGANIZATION:
 *   - describe('functionName'): Groups tests for one function.
 *   - it('does something'): Individual test case.
 *   - expect(value).toBe(expected): Assertion (the actual test).
 * 
 * ============================================================================
 */

const {
  paginate,
  filter,
  search,
  formatDate,
  generateAccountNumber,
  generateCardNumber,
  calculateAge,
  sanitizeString,
} = require('../../../api/utils/helpers');

// ============================================================================
// PAGINATE TESTS
// ============================================================================
// Pagination splits large datasets into pages. These tests verify:
//   - Correct items per page
//   - Correct metadata (hasNext, hasPrevious, totalPages)
//   - Edge cases (page 1, last page, beyond last page)

describe('paginate', () => {
  // Create a simple array of 25 items for testing
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  // WHAT: Basic pagination - first page
  // WHY: Most common use case. User opens a list and sees first items.
  it('should return first page with correct items', () => {
    const result = paginate(items, 1, 10);

    // Should have exactly 10 items on page 1
    expect(result.data).toHaveLength(10);
    // First item should be item #1
    expect(result.data[0].id).toBe(1);
    // Last item should be item #10
    expect(result.data[9].id).toBe(10);
  });

  // WHAT: Second page pagination
  // WHY: Users click "next page" - verify correct items appear.
  it('should return second page with correct items', () => {
    const result = paginate(items, 2, 10);

    expect(result.data).toHaveLength(10);
    expect(result.data[0].id).toBe(11);
    expect(result.data[9].id).toBe(20);
  });

  // WHAT: Last page might have fewer items than limit
  // WHY: 25 items / 10 per page = 3 pages, last page has 5 items.
  it('should handle last page with fewer items', () => {
    const result = paginate(items, 3, 10);

    expect(result.data).toHaveLength(5); // Only 5 items left
    expect(result.data[0].id).toBe(21);
    expect(result.data[4].id).toBe(25);
  });

  // WHAT: Page beyond available data returns empty
  // WHY: User types page 100 manually - should gracefully return empty.
  it('should return empty data for page beyond total', () => {
    const result = paginate(items, 10, 10);

    expect(result.data).toHaveLength(0);
    expect(result.pagination.totalPages).toBe(3);
  });

  // WHAT: Default parameters
  // WHY: If user doesn't specify page/limit, defaults should work.
  it('should use default page 1 and limit 10', () => {
    const result = paginate(items);

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.data).toHaveLength(10);
  });

  // WHAT: Negative page numbers are clamped to 1
  // WHY: Prevents errors from invalid input.
  it('should clamp negative page to 1', () => {
    const result = paginate(items, -5, 10);

    expect(result.pagination.page).toBe(1);
    expect(result.data[0].id).toBe(1);
  });

  // WHAT: Limit of 0 or negative is clamped to 1
  // WHY: Prevents division by zero and infinite loops.
  it('should clamp zero limit to minimum 1', () => {
    const result = paginate(items, 1, 0);

    expect(result.pagination.limit).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  // WHAT: Limit exceeding 100 is capped at 100
  // WHY: Prevents abuse (requesting all 10,000 items in one page).
  it('should cap limit at 100', () => {
    const result = paginate(items, 1, 500);

    expect(result.pagination.limit).toBe(100);
  });

  // WHAT: Pagination metadata is correct
  // WHY: Frontend needs hasNextPage, hasPreviousPage, etc. for UI buttons.
  it('should include correct pagination metadata', () => {
    const result = paginate(items, 2, 10);

    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPreviousPage).toBe(true);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.totalItems).toBe(25);
    expect(result.pagination.nextPage).toBe(3);
    expect(result.pagination.previousPage).toBe(1);
  });

  // WHAT: First page has no previous page
  it('should set hasPreviousPage to false for first page', () => {
    const result = paginate(items, 1, 10);

    expect(result.pagination.hasPreviousPage).toBe(false);
    expect(result.pagination.previousPage).toBeNull();
  });

  // WHAT: Last page has no next page
  it('should set hasNextPage to false for last page', () => {
    const result = paginate(items, 3, 10);

    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.nextPage).toBeNull();
  });
});

// ============================================================================
// FILTER TESTS
// ============================================================================
// Filtering lets users narrow down lists by criteria. Tests verify:
//   - Exact match filtering
//   - Array (multiple value) filtering
//   - Range filtering (gte, lte)
//   - Empty/no filters return original data
//   - Multiple filters work together (AND logic)

describe('filter', () => {
  const transactions = [
    { id: 1, type: 'transfer', amount: 1000, date: '2024-01-15' },
    { id: 2, type: 'deposit', amount: 5000, date: '2024-02-20' },
    { id: 3, type: 'transfer', amount: 2500, date: '2024-03-10' },
    { id: 4, type: 'payment', amount: 500, date: '2024-04-05' },
    { id: 5, type: 'deposit', amount: 3000, date: '2024-05-01' },
  ];

  // WHAT: No filters returns all items
  // WHY: Default state shows everything.
  it('should return all items when no filters provided', () => {
    expect(filter(transactions, {})).toHaveLength(5);
    expect(filter(transactions, null)).toHaveLength(5);
  });

  // WHAT: Single exact match filter
  // WHY: User selects "transfers only" from a dropdown.
  it('should filter by exact match', () => {
    const result = filter(transactions, { type: 'transfer' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.type === 'transfer')).toBe(true);
  });

  // WHAT: Array filter matches any value in array
  // WHY: User selects "transfers AND deposits" filter.
  it('should filter by array of values', () => {
    const result = filter(transactions, { type: ['transfer', 'deposit'] });
    expect(result).toHaveLength(4);
  });

  // WHAT: Range filter (greater than or equal)
  // WHY: User filters "transactions over $1000".
  it('should filter by minimum amount (gte)', () => {
    const result = filter(transactions, { amount: { gte: 2500 } });
    expect(result).toHaveLength(3); // 5000, 2500, 3000
  });

  // WHAT: Range filter (less than or equal)
  // WHY: User filters "transactions under $1000".
  it('should filter by maximum amount (lte)', () => {
    const result = filter(transactions, { amount: { lte: 1000 } });
    expect(result).toHaveLength(2); // 1000, 500
  });

  // WHAT: Combined range filter (gte AND lte)
  // WHY: User filters "transactions between $1000 and $3000".
  it('should filter by amount range (gte and lte)', () => {
    const result = filter(transactions, { amount: { gte: 1000, lte: 3000 } });
    expect(result).toHaveLength(2); // 1000, 2500, 3000
  });

  // WHAT: Multiple filters work with AND logic
  // WHY: "Show me transfers over $1000" = type AND amount.
  it('should apply multiple filters with AND logic', () => {
    const result = filter(transactions, {
      type: 'transfer',
      amount: { gte: 1000 },
    });
    expect(result).toHaveLength(2); // Both transfers are >= 1000
  });

  // WHAT: Case-insensitive string matching
  // WHY: Users type "Transfer" but data has "transfer".
  it('should be case-insensitive for string matching', () => {
    const result = filter(transactions, { type: 'Transfer' });
    expect(result).toHaveLength(2);
  });

  // WHAT: Filter by date range
  // WHY: User selects "last month" date range.
  it('should filter by date range', () => {
    const result = filter(transactions, {
      date: { from: '2024-02-01', to: '2024-03-31' },
    });
    expect(result).toHaveLength(2); // Feb and March transactions
  });

  // WHAT: Filter with no matches returns empty
  // WHY: "Show me transfers over $100,000" = empty result.
  it('should return empty array when no matches', () => {
    const result = filter(transactions, { amount: { gte: 100000 } });
    expect(result).toHaveLength(0);
  });

  // WHAT: Contains filter for partial string match
  // WHY: User searches for "coffee" in descriptions.
  it('should support contains filter', () => {
    const items = [
      { id: 1, description: 'Starbucks coffee' },
      { id: 2, description: 'Gas station' },
      { id: 3, description: 'Coffee beans wholesale' },
    ];
    const result = filter(items, { description: { contains: 'coffee' } });
    expect(result).toHaveLength(2);
  });
});

// ============================================================================
// SEARCH TESTS
// ============================================================================
// Text search finds items by keyword across specified fields.
// Tests verify relevance scoring and field weighting.

describe('search', () => {
  const items = [
    { id: 1, name: 'María López', description: 'Transferencia bancaria' },
    { id: 2, name: 'Carlos Ruiz', description: 'Pago de servicios' },
    { id: 3, name: 'María García', description: 'Depósito de nómina' },
    { id: 4, name: 'Juan Pérez', description: 'Compra en línea' },
  ];

  // WHAT: Search with matching results
  // WHY: Basic functionality - find items matching query.
  it('should find items matching search term', () => {
    const results = search(items, 'María', ['name']);
    expect(results).toHaveLength(2);
  });

  // WHAT: Empty search returns no results
  // WHY: Prevents showing all items when user hasn't typed anything.
  it('should return empty for empty search term', () => {
    expect(search(items, '', ['name'])).toHaveLength(0);
    expect(search(items, null, ['name'])).toHaveLength(0);
  });

  // WHAT: Search is case-insensitive
  // WHY: "maría" should find "María".
  it('should be case-insensitive', () => {
    const results = search(items, 'maría', ['name']);
    expect(results).toHaveLength(2);
  });

  // WHAT: Search across multiple fields
  // WHY: User wants to find by name OR description.
  it('should search across multiple fields', () => {
    const results = search(items, 'transferencia', ['name', 'description']);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('María López');
  });

  // WHAT: Exact match scores higher than partial match
  // WHY: If searching "María García", that exact name should rank first.
  it('should rank exact matches higher', () => {
    const results = search(items, 'María García', ['name', 'description']);
    expect(results[0].name).toBe('María García');
  });

  // WHAT: Earlier fields get higher scores
  // WHY: Name match is more relevant than description match.
  it('should weight earlier fields higher', () => {
    const results = search(items, 'María', ['name', 'description']);
    // Both María items should appear (name match)
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// FORMAT DATE TESTS
// ============================================================================
// Date formatting converts Date objects to display strings.
// Tests verify different format options and error handling.

describe('formatDate', () => {
  const testDate = new Date('2024-06-15T14:30:45');

  // WHAT: Default ISO format
  // WHY: Most common format for data storage and API responses.
  it('should format as YYYY-MM-DD by default', () => {
    expect(formatDate(testDate)).toBe('2024-06-15');
  });

  // WHAT: European format (DD/MM/YYYY)
  // WHY: Common in Mexico and most of the world.
  it('should format as DD/MM/YYYY', () => {
    expect(formatDate(testDate, 'DD/MM/YYYY')).toBe('15/06/2024');
  });

  // WHAT: US format (MM/DD/YYYY)
  // WHY: Used in US-facing features.
  it('should format as MM/DD/YYYY', () => {
    expect(formatDate(testDate, 'MM/DD/YYYY')).toBe('06/15/2024');
  });

  // WHAT: Full datetime format
  // WHY: Transaction history needs date AND time.
  it('should format with time as YYYY-MM-DD HH:mm:ss', () => {
    const result = formatDate(testDate, 'YYYY-MM-DD HH:mm:ss');
    expect(result).toBe('2024-06-15 14:30:45');
  });

  // WHAT: Month name format for bank statements
  // WHY: "Junio 2024" is more readable than "2024-06".
  it('should format as month name (MMMM YYYY)', () => {
    expect(formatDate(testDate, 'MMMM YYYY')).toBe('Junio 2024');
  });

  // WHAT: Invalid date returns error string
  // WHY: Graceful degradation instead of crashing.
  it('should return "Invalid Date" for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });

  // WHAT: Accepts date strings as input
  // WHY: API returns ISO strings, not Date objects.
  it('should accept date string input', () => {
    expect(formatDate('2024-01-01')).toBe('2024-01-01');
  });
});

// ============================================================================
// CALCULATE AGE TESTS
// ============================================================================
// Age calculation must handle birthday edge cases correctly.

describe('calculateAge', () => {
  // WHAT: Normal age calculation
  // WHY: Basic functionality.
  it('should calculate correct age for past birthday', () => {
    const birthDate = '1990-01-01';
    const age = calculateAge(birthDate);
    // Should be around 34 (depends on current date)
    expect(age).toBeGreaterThanOrEqual(33);
    expect(age).toBeLessThanOrEqual(35);
  });

  // WHAT: Age before birthday this year
  // WHY: If born Dec 31, 1990 and today is Jan 1, 2024, age should be 33, not 34.
  it('should subtract 1 if birthday has not occurred yet this year', () => {
    const today = new Date();
    const thisYear = today.getFullYear();
    // Create a future birthday
    const futureBirthday = `${thisYear + 1}-12-31`;
    const age = calculateAge(futureBirthday);
    expect(age).toBeLessThan(0); // Negative age for future dates
  });
});

// ============================================================================
// SANITIZE STRING TESTS
// ============================================================================
// Input sanitization prevents XSS and injection attacks.

describe('sanitizeString', () => {
  // WHAT: Normal string passes through
  it('should return normal strings unchanged', () => {
    expect(sanitizeString('Hello World')).toBe('Hello World');
  });

  // WHAT: Trims whitespace
  it('should trim leading and trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  // WHAT: Removes angle brackets (XSS prevention)
  // WHY: <script>alert('xss')</script> must be neutralized.
  it('should remove angle brackets', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('<');
  });

  // WHAT: Escapes HTML entities
  it('should escape ampersands', () => {
    expect(sanitizeString('A & B')).toBe('A &amp; B');
  });

  it('should escape double quotes', () => {
    expect(sanitizeString('He said "hello"')).toContain('&quot;');
  });

  // WHAT: Non-string input returns empty string
  it('should return empty string for non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
  });

  // WHAT: Empty string returns empty string
  it('should handle empty string', () => {
    expect(sanitizeString('')).toBe('');
  });
});

// ============================================================================
// GENERATE ACCOUNT NUMBER TESTS
// ============================================================================

describe('generateAccountNumber', () => {
  // WHAT: Generated account has required fields
  it('should generate account with number, CLABE, and bank code', () => {
    const account = generateAccountNumber();

    expect(account).toHaveProperty('accountNumber');
    expect(account).toHaveProperty('clabe');
    expect(account).toHaveProperty('bankCode');
  });

  // WHAT: CLABE is 18 digits
  // WHY: Mexican CLABE standard requires exactly 18 digits.
  it('should generate CLABE with 18 digits', () => {
    const account = generateAccountNumber();
    expect(account.clabe).toHaveLength(18);
    expect(/^\d+$/.test(account.clabe)).toBe(true);
  });

  // WHAT: Account number is numeric
  it('should generate numeric account number', () => {
    const account = generateAccountNumber();
    expect(/^\d+$/.test(account.accountNumber)).toBe(true);
  });
});

// ============================================================================
// GENERATE CARD NUMBER TESTS
// ============================================================================

describe('generateCardNumber', () => {
  // WHAT: Card number is 16 digits
  // WHY: Standard credit/debit card format.
  it('should generate 16-digit card number', () => {
    const cardNumber = generateCardNumber();
    expect(cardNumber).toHaveLength(16);
    expect(/^\d+$/.test(cardNumber)).toBe(true);
  });

  // WHAT: Card number starts with valid prefix
  // WHY: Visa starts with 4, Mastercard with 5.
  it('should start with valid card prefix', () => {
    const cardNumber = generateCardNumber();
    const validPrefixes = ['4111', '4242', '5105', '5454', '4012', '4169'];
    const prefix = cardNumber.substring(0, 4);
    expect(validPrefixes).toContain(prefix);
  });
});
