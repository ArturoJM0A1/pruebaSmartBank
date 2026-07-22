/**
 * ============================================================================
 * Transaction Service
 * ============================================================================
 * 
 * PURPOSE:
 * Manages all financial transactions:
 * - Transfers between accounts
 * - Deposits
 * - Withdrawals
 * - Payments
 * - Transaction history
 * - Transaction summaries
 * 
 * KEY CONCEPTS:
 * 
 * 1. IDEMPOTENCY:
 *    - Idempotent operations produce the same result when called multiple times
 *    - Transfers should be idempotent (prevent double-spending)
 *    - Use idempotency keys: client generates unique ID, server checks for duplicates
 * 
 * 2. OPTIMISTIC UPDATES:
 *    - Update UI immediately before server confirms
 *    - If server fails, revert the UI change
 *    - Better UX (no loading spinner for every action)
 * 
 * 3. TRANSACTION STATES:
 *    - Pending: Processing
 *    - Completed: Successfully finished
 *    - Failed: Error occurred
 *    - Cancelled: User or system cancelled
 * 
 * 4. BUSINESS RULES:
 *    - Cannot transfer more than available balance
 *    - Cannot transfer to same account
 *    - Daily/monthly limits apply
 *    - Some transactions require additional verification
 * 
 * RELATED CONCEPTS:
 * - Double-entry bookkeeping
 * - ACID properties (Atomicity, Consistency, Isolation, Durability)
 * - Two-phase commit
 * - Saga pattern (distributed transactions)
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';
import { PAGINATION } from '../constants/app.js';
import { generateId } from '../utils/helpers.js';

const TransactionService = {
    /**
     * getAll - Get all transactions with filters
     * 
     * @param {Object} filters - Filter options
     * @param {string} filters.type - Transaction type
     * @param {string} filters.status - Transaction status
     * @param {string} filters.startDate - Start date
     * @param {string} filters.endDate - End date
     * @param {number} filters.minAmount - Minimum amount
     * @param {number} filters.maxAmount - Maximum amount
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} { data: Transaction[], total: number }
     */
    async getAll(filters = {}, pagination = {}) {
        const params = {
            page: pagination.page || PAGINATION.DEFAULT_PAGE,
            limit: pagination.limit || PAGINATION.DEFAULT_LIMIT,
            ...filters,
        };
        
        // Remove empty filters
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });
        
        return apiService.get(ENDPOINTS.TRANSACTIONS.BASE, params);
    },
    
    /**
     * getById - Get transaction details
     * 
     * @param {string} id - Transaction ID
     * @returns {Promise<Object>} Transaction object
     */
    async getById(id) {
        if (!id) {
            throw new Error('Transaction ID is required');
        }
        
        return apiService.get(ENDPOINTS.TRANSACTIONS.BY_ID(id));
    },
    
    /**
     * transfer - Make a transfer between accounts
     * 
     * WHY: Transfers are the most critical operation.
     * We use an idempotency key to prevent double transfers.
     * 
     * CONCEPT: Idempotency Key
     * - Client generates a unique ID for each transfer attempt
     * - If the same key is sent twice, server returns the first result
     * - Prevents accidental double-spending
     * 
     * @param {Object} data - Transfer data
     * @param {string} data.sourceAccountId - Source account
     * @param {string} data.destinationAccount - Destination account
     * @param {string} data.destinationClabe - Destination CLABE
     * @param {number} data.amount - Amount to transfer
     * @param {string} data.concept - Transfer description
     * @returns {Promise<Object>} Transaction confirmation
     */
    async transfer(data) {
        // Validate required fields
        if (!data.sourceAccountId) {
            throw new Error('Source account is required');
        }
        
        if (!data.destinationAccount && !data.destinationClabe) {
            throw new Error('Destination account or CLABE is required');
        }
        
        if (!data.amount || data.amount <= 0) {
            throw new Error('Valid amount is required');
        }
        
        // Generate idempotency key
        const idempotencyKey = generateId();
        
        // Add idempotency key to request
        const requestData = {
            ...data,
            idempotencyKey,
        };
        
        return apiService.post(ENDPOINTS.TRANSACTIONS.TRANSFER, requestData);
    },
    
    /**
     * deposit - Make a deposit
     * 
     * @param {Object} data - Deposit data
     * @param {string} data.accountId - Target account
     * @param {number} data.amount - Amount to deposit
     * @param {string} data.description - Deposit description
     * @returns {Promise<Object>} Transaction confirmation
     */
    async deposit(data) {
        if (!data.accountId) {
            throw new Error('Account ID is required');
        }
        
        if (!data.amount || data.amount <= 0) {
            throw new Error('Valid amount is required');
        }
        
        const idempotencyKey = generateId();
        
        return apiService.post(ENDPOINTS.TRANSACTIONS.DEPOSIT, {
            ...data,
            idempotencyKey,
        });
    },
    
    /**
     * withdraw - Make a withdrawal
     * 
     * @param {Object} data - Withdrawal data
     * @param {string} data.accountId - Source account
     * @param {number} data.amount - Amount to withdraw
     * @param {string} data.description - Withdrawal description
     * @returns {Promise<Object>} Transaction confirmation
     */
    async withdraw(data) {
        if (!data.accountId) {
            throw new Error('Account ID is required');
        }
        
        if (!data.amount || data.amount <= 0) {
            throw new Error('Valid amount is required');
        }
        
        const idempotencyKey = generateId();
        
        return apiService.post(ENDPOINTS.TRANSACTIONS.WITHDRAW, {
            ...data,
            idempotencyKey,
        });
    },
    
    /**
     * getSummary - Get transaction summary for a date range
     * 
     * WHY: Dashboard and reports need aggregated data:
     * - Total income
     * - Total expenses
     * - Net change
     * - Breakdown by category
     * 
     * @param {Object} dateRange - Date range
     * @param {string} dateRange.startDate - Start date
     * @param {string} dateRange.endDate - End date
     * @param {string} accountId - Optional account filter
     * @returns {Promise<Object>} Summary data
     */
    async getSummary(dateRange = {}, accountId = null) {
        const params = {};
        
        if (dateRange.startDate) {
            params.startDate = dateRange.startDate;
        }
        
        if (dateRange.endDate) {
            params.endDate = dateRange.endDate;
        }
        
        if (accountId) {
            params.accountId = accountId;
        }
        
        return apiService.get(ENDPOINTS.TRANSACTIONS.SUMMARY, params);
    },
    
    /**
     * cancel - Cancel a pending transaction
     * 
     * WHY: Users might want to cancel:
     * - Pending transfers
     * - Scheduled payments
     * - Mistakes
     * 
     * @param {string} id - Transaction ID
     * @param {string} reason - Cancellation reason
     * @returns {Promise<Object>} Updated transaction
     */
    async cancel(id, reason = '') {
        if (!id) {
            throw new Error('Transaction ID is required');
        }
        
        return apiService.post(`${ENDPOINTS.TRANSACTIONS.BY_ID(id)}/cancel`, {
            reason,
        });
    },
    
    /**
     * dispute - Dispute a transaction
     * 
     * WHY: Users might need to dispute:
     * - Unauthorized transactions
     * - Incorrect amounts
     * - Services not received
     * 
     * @param {string} id - Transaction ID
     * @param {Object} disputeData - Dispute details
     * @returns {Promise<Object>} Dispute confirmation
     */
    async dispute(id, disputeData) {
        if (!id) {
            throw new Error('Transaction ID is required');
        }
        
        return apiService.post(`${ENDPOINTS.TRANSACTIONS.BY_ID(id)}/dispute`, disputeData);
    },
    
    /**
     * getReceipt - Get transaction receipt
     * 
     * @param {string} id - Transaction ID
     * @returns {Promise<Blob>} Receipt PDF
     */
    async getReceipt(id) {
        if (!id) {
            throw new Error('Transaction ID is required');
        }
        
        const response = await fetch(
            `${apiService.baseUrl}${ENDPOINTS.TRANSACTIONS.BY_ID(id)}/receipt`,
            {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                },
            }
        );
        
        return response.blob();
    },
};

// Import getToken for getReceipt
import { getToken } from '../utils/storage.js';

export default TransactionService;