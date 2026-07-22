/**
 * ============================================================================
 * SMARTBANK - INTEGRATION TEST: Transfer Flow
 * ============================================================================
 * 
 * PURPOSE: Test the complete transfer flow from start to finish.
 * 
 * INTEGRATION vs UNIT TESTING:
 *   - UNIT TEST: Tests ONE function in isolation.
 *     Example: "Does validateAmount(100) return true?"
 * 
 *   - INTEGRATION TEST: Tests MULTIPLE components working together.
 *     Example: "Does the transfer form validate input, call the API,
 *     update the balance, and show a success message?"
 * 
 *   - E2E TEST: Tests the ENTIRE application through the browser.
 *     Example: "Can a user log in, navigate to transfer, send money?"
 * 
 * WHY INTEGRATION TESTS?
 *   - Catch bugs at the BOUNDARIES between components.
   - Verify data flows correctly from form → service → store → UI.
 *   - Faster than E2E, more realistic than unit tests.
 * 
 * TRANSFER FLOW:
 *   1. User selects source account
 *   2. User enters destination (beneficiary or new account)
 *   3. User enters amount
 *   4. User confirms transfer
 *   5. System validates data
 *   6. System calls API
 *   7. System updates balance
 *   8. System shows success/error message
 * 
 * ============================================================================
 */

'use strict';

const {
  mockFetchSuccess,
  mockFetchError,
  setupFetchMock,
  teardownFetchMock,
} = require('../mocks/mockFetch');

const {
  mockAccounts,
  mockBeneficiaries,
  mockApiTransferSuccess,
  mockApiTransferInsufficientFunds,
} = require('../mocks/mockData');

// ============================================================================
// TRANSFER SERVICE (simplified for testing)
// ============================================================================

function validateTransferData(data) {
  const errors = [];

  if (!data.fromAccountId) {
    errors.push('Source account is required');
  }
  if (!data.toAccountNumber) {
    errors.push('Destination account is required');
  }
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  if (data.amount > 999999.99) {
    errors.push('Amount exceeds maximum transfer limit');
  }
  if (!data.concept || data.concept.trim().length < 3) {
    errors.push('Concept must be at least 3 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function executeTransfer(data) {
  // Step 1: Validate
  const validation = validateTransferData(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors, step: 'validation' };
  }

  // Step 2: Call API
  try {
    const response = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        errors: [result.error?.message || 'Transfer failed'],
        step: 'api',
      };
    }

    // Step 3: Return success
    return {
      success: true,
      transaction: result.data.transaction,
      newBalance: result.data.newBalance,
      step: 'complete',
    };
  } catch (error) {
    return {
      success: false,
      errors: ['Network error. Please check your connection.'],
      step: 'network',
    };
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Transfer Flow - Integration', () => {
  beforeEach(() => {
    setupFetchMock();
  });

  afterEach(() => {
    teardownFetchMock();
  });

  // WHAT: Complete successful transfer flow
  // WHY: The "happy path" must work end-to-end.
  it('should complete a successful transfer', async () => {
    global.fetch = mockFetchSuccess(mockApiTransferSuccess);

    const transferData = {
      fromAccountId: 'acc_001',
      toAccountNumber: '1111222233',
      toBankCode: '012',
      amount: 1000,
      concept: 'Pago de servicio',
    };

    const result = await executeTransfer(transferData);

    expect(result.success).toBe(true);
    expect(result.step).toBe('complete');
    expect(result.transaction).toBeDefined();
    expect(result.newBalance).toBeDefined();
  });

  // WHAT: Validation catches missing required fields
  // WHY: Bad data must be caught before reaching the API.
  it('should fail validation with missing fields', async () => {
    const incompleteData = {
      fromAccountId: 'acc_001',
      // Missing toAccountNumber
      amount: 1000,
      concept: 'Test',
    };

    const result = await executeTransfer(incompleteData);

    expect(result.success).toBe(false);
    expect(result.step).toBe('validation');
    expect(result.errors).toContain('Destination account is required');
  });

  // WHAT: Validation catches invalid amount
  it('should fail validation with invalid amount', async () => {
    const data = {
      fromAccountId: 'acc_001',
      toAccountNumber: '1111222233',
      amount: -500,
      concept: 'Test transfer',
    };

    const result = await executeTransfer(data);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Amount must be greater than 0');
  });

  // WHAT: Validation catches amount exceeding limit
  it('should fail validation with amount over limit', async () => {
    const data = {
      fromAccountId: 'acc_001',
      toAccountNumber: '1111222233',
      amount: 1000000,
      concept: 'Large transfer',
    };

    const result = await executeTransfer(data);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Amount exceeds maximum transfer limit');
  });

  // WHAT: API error (insufficient funds) is handled
  // WHY: Backend validation errors must be shown to user.
  it('should handle insufficient funds error', async () => {
    global.fetch = mockFetchSuccess(mockApiTransferInsufficientFunds, 400);

    const data = {
      fromAccountId: 'acc_001',
      toAccountNumber: '1111222233',
      amount: 100000,
      concept: 'Big transfer',
    };

    // Override the mock to return 400 status
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve(mockApiTransferInsufficientFunds),
    });

    const result = await executeTransfer(data);

    expect(result.success).toBe(false);
    expect(result.step).toBe('api');
    expect(result.errors[0]).toContain('insufficient');
  });

  // WHAT: Network error is handled gracefully
  // WHY: Offline users must see a helpful message, not a crash.
  it('should handle network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const data = {
      fromAccountId: 'acc_001',
      toAccountNumber: '1111222233',
      amount: 1000,
      concept: 'Test transfer',
    };

    const result = await executeTransfer(data);

    expect(result.success).toBe(false);
    expect(result.step).toBe('network');
    expect(result.errors[0]).toContain('Network error');
  });

  // WHAT: Short concept is rejected
  it('should reject concept shorter than 3 characters', async () => {
    const data = {
      fromAccountId: 'acc_001',
      toAccountNumber: '1111222233',
      amount: 1000,
      concept: 'AB', // Too short
    };

    const result = await executeTransfer(data);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Concept must be at least 3 characters');
  });
});
