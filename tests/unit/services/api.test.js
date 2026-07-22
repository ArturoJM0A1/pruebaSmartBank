/**
 * ============================================================================
 * SMARTBANK - UNIT TESTS: API Service
 * ============================================================================
 * 
 * PURPOSE: Test the API service layer that communicates with the backend.
 * 
 * WHY TEST THE API SERVICE?
 *   - It's the BRIDGE between frontend and backend. A bug here means
 *     wrong data, lost requests, or silent failures.
 *   - API calls are the most common source of runtime errors.
 *   - Testing ensures error handling works BEFORE a user sees a white screen.
 * 
 * API TESTING PATTERNS:
 *   - Mock fetch: Replace real HTTP calls with controlled responses.
 *   - Test HTTP methods: GET, POST, PUT, DELETE behave correctly.
 *   - Test error handling: 401, 404, 500 are handled gracefully.
 *   - Test edge cases: Network failure, timeout, malformed response.
 * 
 * ============================================================================
 */

'use strict';

const {
  mockFetchSuccess,
  mockFetchError,
  mockFetchNetworkError,
  mockFetchTimeout,
  setupFetchMock,
  teardownFetchMock,
} = require('../../mocks/mockFetch');

const { mockApiLoginSuccess, mockApiServerError } = require('../../mocks/mockData');

// ============================================================================
// API SERVICE IMPLEMENTATION (for testing purposes)
// ============================================================================
// In production, this would be imported from src/services/api.js
// Here we include a simplified version for testing.

const API_BASE_URL = 'https://api.smartbank.com/v1';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.error?.message || 'Request failed',
      code: errorData.error?.code || 'UNKNOWN_ERROR',
    };
  }

  return response.json();
}

async function apiGet(endpoint) {
  return apiRequest(endpoint, { method: 'GET' });
}

async function apiPost(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// TESTS
// ============================================================================

describe('API Service', () => {
  beforeEach(() => {
    setupFetchMock();
  });

  afterEach(() => {
    teardownFetchMock();
    localStorage.clear();
  });

  // WHAT: GET request returns data correctly
  // WHY: Most API calls are GET requests (fetching accounts, transactions).
  it('should make GET request and return data', async () => {
    const mockData = { accounts: [{ id: 1, balance: 5000 }] };
    global.fetch = mockFetchSuccess(mockData);

    const result = await apiGet('/accounts');

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/accounts'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  // WHAT: POST request sends data correctly
  // WHY: Transfers and form submissions use POST.
  it('should make POST request with correct body', async () => {
    const postData = { amount: 1000, toAccount: '1234567890' };
    const mockResponse = { success: true, transactionId: 'txn_123' };
    global.fetch = mockFetchSuccess(mockResponse);

    const result = await apiPost('/transfers', postData);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/transfers'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData),
      })
    );
  });

  // WHAT: 401 Unauthorized is handled correctly
  // WHY: Expired tokens must redirect to login, not crash the app.
  it('should throw error for 401 Unauthorized', async () => {
    global.fetch = mockFetchError(401, 'Token expired');

    await expect(apiGet('/profile')).rejects.toMatchObject({
      status: 401,
      message: 'Token expired',
    });
  });

  // WHAT: 404 Not Found is handled correctly
  // WHY: Users might bookmark deleted pages or APIs change.
  it('should throw error for 404 Not Found', async () => {
    global.fetch = mockFetchError(404, 'Resource not found');

    await expect(apiGet('/nonexistent')).rejects.toMatchObject({
      status: 404,
    });
  });

  // WHAT: 500 Server Error is handled correctly
  // WHY: Backend crashes shouldn't cause frontend errors.
  it('should throw error for 500 Server Error', async () => {
    global.fetch = mockFetchError(500, 'Internal server error');

    await expect(apiGet('/accounts')).rejects.toMatchObject({
      status: 500,
    });
  });

  // WHAT: Network failure is handled
  // WHY: No internet, DNS failure, CORS block all reject the Promise.
  it('should handle network errors', async () => {
    global.fetch = mockFetchNetworkError();

    await expect(apiGet('/accounts')).rejects.toThrow('Failed to fetch');
  });

  // WHAT: Auth token is included in requests
  // WHY: Authenticated endpoints require Bearer token.
  it('should include Authorization header when token exists', async () => {
    localStorage.setItem('token', 'test-jwt-token');
    global.fetch = mockFetchSuccess({ user: { id: 1 } });

    await apiGet('/profile');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      })
    );
  });

  // WHAT: Content-Type header is set correctly
  // WHY: Server needs to know we're sending JSON.
  it('should set Content-Type to application/json', async () => {
    global.fetch = mockFetchSuccess({});

    await apiPost('/test', { data: 'value' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
