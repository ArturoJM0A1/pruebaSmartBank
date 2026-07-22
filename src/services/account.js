/**
 * ============================================================================
 * Account Service
 * ============================================================================
 * 
 * PURPOSE:
 * Handles all bank account operations:
 * - List accounts
 * - Get account details
 * - Get balance
 * - Get statements
 * - Create/update/close accounts
 * 
 * SERVICE LAYER PATTERN:
 * - Each service handles one resource (accounts, cards, transactions)
 * - Services use the API service for HTTP calls
 * - Services contain business logic (validation, formatting)
 * - Components call services, not the API directly
 * 
 * SEPARATION OF CONCERNS:
 * - Component: Handles UI rendering and user interaction
 * - Service: Handles business logic and API calls
 * - API Service: Handles HTTP communication
 * 
 * This separation makes code:
 * - Easier to test (mock the service layer)
 * - Easier to maintain (change API without changing UI)
 * - Easier to reuse (same service in different components)
 * 
 * RELATED CONCEPTS:
 * - Repository Pattern (data access abstraction)
 * - Data Access Object (DAO)
 * - Active Record Pattern (ORM models)
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';
import { PAGINATION } from '../constants/app.js';

/**
 * AccountService - Manages bank account operations
 */
const AccountService = {
    /**
     * getAll - Get all accounts with optional filters and pagination
     * 
     * WHY: List views need:
     * - Filtering (by type, status, etc.)
     * - Pagination (not load all at once)
     * - Sorting (by balance, name, etc.)
     * 
     * @param {Object} filters - Filter options
     * @param {string} filters.type - Account type (checking, savings)
     * @param {string} filters.status - Account status (active, blocked)
     * @param {string} filters.search - Search term
     * @param {Object} pagination - Pagination options
     * @param {number} pagination.page - Page number
     * @param {number} pagination.limit - Items per page
     * @returns {Promise<Object>} { data: Account[], total: number, page: number }
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
        
        return apiService.get(ENDPOINTS.ACCOUNTS.BASE, params);
    },
    
    /**
     * getById - Get a single account by ID
     * 
     * @param {string} id - Account ID
     * @returns {Promise<Object>} Account object
     */
    async getById(id) {
        if (!id) {
            throw new Error('Account ID is required');
        }
        
        return apiService.get(ENDPOINTS.ACCOUNTS.BY_ID(id));
    },
    
    /**
     * getBalance - Get account balance
     * 
     * WHY: Balance might be a separate endpoint for:
     * - Caching (balance changes less frequently)
     * - Security (separate permission)
     * - Real-time updates (WebSocket connection)
     * 
     * @param {string} id - Account ID
     * @returns {Promise<Object>} { balance, availableBalance, currency }
     */
    async getBalance(id) {
        if (!id) {
            throw new Error('Account ID is required');
        }
        
        return apiService.get(ENDPOINTS.ACCOUNTS.BALANCE(id));
    },
    
    /**
     * getStatement - Get account statement for a date range
     * 
     * WHY: Statements show transaction history for a specific period.
     * Users typically need monthly statements.
     * 
     * @param {string} id - Account ID
     * @param {Object} dateRange - Date range
     * @param {string} dateRange.startDate - Start date (ISO string)
     * @param {string} dateRange.endDate - End date (ISO string)
     * @returns {Promise<Object>} Statement data
     */
    async getStatement(id, dateRange = {}) {
        if (!id) {
            throw new Error('Account ID is required');
        }
        
        const params = {};
        
        if (dateRange.startDate) {
            params.startDate = dateRange.startDate;
        }
        
        if (dateRange.endDate) {
            params.endDate = dateRange.endDate;
        }
        
        return apiService.get(ENDPOINTS.ACCOUNTS.STATEMENT(id), params);
    },
    
    /**
     * getTransactions - Get transactions for an account
     * 
     * @param {string} id - Account ID
     * @param {Object} filters - Filter options
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} { data: Transaction[], total: number }
     */
    async getTransactions(id, filters = {}, pagination = {}) {
        if (!id) {
            throw new Error('Account ID is required');
        }
        
        const params = {
            page: pagination.page || PAGINATION.DEFAULT_PAGE,
            limit: pagination.limit || PAGINATION.DEFAULT_LIMIT,
            ...filters,
        };
        
        return apiService.get(ENDPOINTS.ACCOUNTS.TRANSACTIONS(id), params);
    },
    
    /**
     * create - Create a new account (admin only)
     * 
     * WHY: Only admins can create accounts for users.
     * Regular users can't create their own accounts.
     * 
     * @param {Object} accountData - Account data
     * @param {string} accountData.userId - User ID
     * @param {string} accountData.type - Account type
     * @param {string} accountData.currency - Currency code
     * @returns {Promise<Object>} Created account
     */
    async create(accountData) {
        // Validate required fields
        if (!accountData.userId) {
            throw new Error('User ID is required');
        }
        
        if (!accountData.type) {
            throw new Error('Account type is required');
        }
        
        return apiService.post(ENDPOINTS.ACCOUNTS.BASE, accountData);
    },
    
    /**
     * update - Update account information
     * 
     * WHY: Some account properties can be updated:
     * - Nickname/alias
     * - Settings (notifications, limits)
     * - Status (admin only)
     * 
     * @param {string} id - Account ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} Updated account
     */
    async update(id, data) {
        if (!id) {
            throw new Error('Account ID is required');
        }
        
        return apiService.patch(ENDPOINTS.ACCOUNTS.BY_ID(id), data);
    },
    
    /**
     * close - Close an account (admin only)
     * 
     * WHY: Account closure is a sensitive operation:
     * - Must check for remaining balance
     * - Must check for pending transactions
     * - Must follow regulatory requirements
     * 
     * @param {string} id - Account ID
     * @param {string} reason - Closure reason
     * @returns {Promise<Object>} Closure confirmation
     */
    async close(id, reason = '') {
        if (!id) {
            throw new Error('Account ID is required');
        }
        
        return apiService.delete(ENDPOINTS.ACCOUNTS.BY_ID(id), { reason });
    },
    
    /**
     * getSummary - Get account summary across all accounts
     * 
     * WHY: Dashboard needs a quick overview:
     * - Total balance across all accounts
     * - Number of accounts
     * - Recent activity
     * 
     * @returns {Promise<Object>} Summary data
     */
    async getSummary() {
        return apiService.get(`${ENDPOINTS.ACCOUNTS.BASE}/summary`);
    },
    
    /**
     * block - Block an account
     * 
     * @param {string} id - Account ID
     * @param {string} reason - Block reason
     * @returns {Promise<Object>} Updated account
     */
    async block(id, reason) {
        return apiService.patch(ENDPOINTS.ACCOUNTS.BY_ID(id), {
            status: 'blocked',
            blockReason: reason,
        });
    },
    
    /**
     * unblock - Unblock an account
     * 
     * @param {string} id - Account ID
     * @returns {Promise<Object>} Updated account
     */
    async unblock(id) {
        return apiService.patch(ENDPOINTS.ACCOUNTS.BY_ID(id), {
            status: 'active',
        });
    },
};

export default AccountService;