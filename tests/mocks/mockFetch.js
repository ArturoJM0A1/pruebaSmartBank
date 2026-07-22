/**
 * ============================================================================
 * SMARTBANK - FETCH MOCK UTILITIES
 * ============================================================================
 * 
 * PURPOSE: Provide easy-to-use helpers for mocking the browser's fetch API.
 * 
 * WHY MOCK FETCH?
 *   - Unit tests should be FAST and DETERMINISTIC. Real HTTP calls are:
 *     * Slow (network latency)
 *     * Unreliable (server might be down)
 *     * Non-deterministic (same request can return different results)
 *     * Forbidden in CI (no internet in GitHub Actions)
 *   - Mocking fetch lets us control EXACTLY what responses our code receives.
 * 
 * MOCKING STRATEGIES (from simple to complex):
 *   1. Manual mock (what we use): Replace window.fetch with a custom function.
 *      Simple, no dependencies, full control.
 *   2. jest-fetch-mock: Third-party library that adds convenience methods
 *      like fetch.mockResponseOnce(). Already in our package.json.
 *   3. msw (Mock Service Worker): Intercepts network at the service worker level.
 *      Most realistic but complex. Best for integration/E2E tests.
 *   4. nock (Node.js only): Intercepts HTTP at the Node.js level.
 *      Good for backend testing, not browser code.
 * 
 * JEST FETCH MOCKS:
 *   Jest doesn't have built-in fetch mocking. We use one of:
 *   - global.fetch = jest.fn() (manual)
 *   - jest-fetch-mock (library, already installed)
 *   - whatwg-fetch polyfill + mock
 * 
 * ============================================================================
 */

'use strict';

/**
 * ============================================================================
// mockFetchSuccess - Creates a mock fetch that returns a successful response
 * ============================================================================
 * 
 * WHY this structure?
 *   - fetch() returns a Promise<Response>, not the JSON directly.
 *   - Response has .ok (boolean), .status (number), .json() (method).
 *   - Our mock must replicate this EXACT shape for our code to work.
 * 
 * @param {Object|Array} data - The response body (will be JSON-serialized)
 * @param {number} status - HTTP status code (default: 200)
 * @returns {jest.Mock} A mock fetch function
 * 
 * USAGE:
 *   global.fetch = mockFetchSuccess({ user: { id: 1 } });
 *   const response = await fetch('/api/user');
 *   const data = await response.json(); // { user: { id: 1 } }
 * ============================================================================
 */
function mockFetchSuccess(data, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: getStatusText(status),
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone: () => ({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    }),
  });
}

/**
 * ============================================================================
 * mockFetchError - Creates a mock fetch that returns an error response
 * ============================================================================
 * 
 * WHY test errors?
 *   - Error handling is often more critical than success handling.
 *   - Users see error messages; if those are broken, trust is lost.
 *   - Network errors, 401s, 500s all need specific handling.
 * 
 * @param {number} status - HTTP error status code (400, 401, 404, 500, etc.)
 * @param {string} message - Error message
 * @returns {jest.Mock} A mock fetch function
 * 
 * USAGE:
 *   global.fetch = mockFetchError(401, 'Unauthorized');
 *   // Our API service should handle this and throw/reject appropriately
 * ============================================================================
 */
function mockFetchError(status = 500, message = 'Internal Server Error') {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: getStatusText(status),
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve({
      success: false,
      error: { code: getErrorCode(status), message },
    }),
    text: () => Promise.resolve(JSON.stringify({ error: { message } })),
    clone: () => ({
      ok: false,
      status,
      json: () => Promise.resolve({ error: { message } }),
    }),
  });
}

/**
 * ============================================================================
 * mockFetchNetworkError - Simulates a complete network failure
 * ============================================================================
 * 
 * WHY test network errors?
 *   - Unlike HTTP errors (404, 500), network errors reject the Promise.
 *   - This happens when: no internet, DNS failure, CORS block, timeout.
 *   - Code must handle BOTH rejected Promises AND error responses.
 * 
 * @returns {jest.Mock} A mock fetch that rejects
 * 
 * USAGE:
 *   global.fetch = mockFetchNetworkError();
 *   // fetch() will reject with TypeError: Failed to fetch
 * ============================================================================
 */
function mockFetchNetworkError() {
  return jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

/**
 * ============================================================================
 * mockFetchTimeout - Simulates a request timeout
 * ============================================================================
 * 
 * WHY test timeouts?
 *   - Banking apps must handle slow connections gracefully.
 *   - User should see "timeout" message, not a frozen screen.
 *   - AbortController is the modern way to handle timeouts.
 * 
 * @param {number} delay - Milliseconds before timeout (default: 30000)
 * @returns {jest.Mock} A mock fetch that rejects after delay
 * 
 * USAGE:
 *   global.fetch = mockFetchTimeout(5000); // 5 second timeout
 * ============================================================================
 */
function mockFetchTimeout(delay = 30000) {
  return jest.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      }, delay);
    });
  });
}

/**
 * ============================================================================
 * setupFetchMock / teardownFetchMock - Lifecycle helpers
 * ============================================================================
 * 
 * WHY setup/teardown?
 *   - Tests must be ISOLATED. One test's mock shouldn't affect another.
 *   - Jest runs tests in parallel; global.fetch must be restored after each.
 *   - setupFetchMock() stores the original; teardownFetchMock() restores it.
 * 
 * PATTERN: "Save and restore" (common in testing)
 *   1. Save original value
 *   2. Replace with mock
 *   3. Run test
 *   4. Restore original value
 * ============================================================================
 */
let originalFetch;

function setupFetchMock() {
  originalFetch = global.fetch;
}

function teardownFetchMock() {
  if (originalFetch !== undefined) {
    global.fetch = originalFetch;
  } else {
    delete global.fetch;
  }
  originalFetch = undefined;
}

/**
 * ============================================================================
 * HELPER: Get HTTP status text from status code
 * ============================================================================
 * 
 * WHY: Response objects have statusText alongside status.
 * Example: { status: 404, statusText: 'Not Found' }
 * ============================================================================
 */
function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return statusTexts[status] || 'Unknown';
}

/**
 * ============================================================================
 * HELPER: Get error code from HTTP status
 * ============================================================================
 * 
 * WHY: Our API uses custom error codes, not raw HTTP statuses.
 * Example: 401 → 'AUTH_TOKEN_EXPIRED', 404 → 'RESOURCE_NOT_FOUND'
 * ============================================================================
 */
function getErrorCode(status) {
  const errorCodes = {
    400: 'VALIDATION_ERROR',
    401: 'AUTH_TOKEN_EXPIRED',
    403: 'FORBIDDEN',
    404: 'RESOURCE_NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  return errorCodes[status] || 'UNKNOWN_ERROR';
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = {
  mockFetchSuccess,
  mockFetchError,
  mockFetchNetworkError,
  mockFetchTimeout,
  setupFetchMock,
  teardownFetchMock,
};
