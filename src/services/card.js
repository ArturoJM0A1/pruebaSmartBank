/**
 * ============================================================================
 * Card Service
 * ============================================================================
 * 
 * PURPOSE:
 * Manages bank card operations (debit, credit, prepaid).
 * Similar pattern to AccountService but with card-specific operations.
 * 
 * CARD OPERATIONS:
 * - View card details (masked)
 * - Block/unblock card
 * - Set spending limits
 * - View card transactions
 * - Request new card
 * 
 * SECURITY:
 * - Full card number is NEVER sent to the client
 * - Only last 4 digits are shown
 * - Card operations require additional authentication
 * 
 * RELATED CONCEPTS:
 * - PCI DSS compliance (Payment Card Industry Data Security Standard)
 * - Tokenization (replacing card number with a token)
 * - Card present vs card-not-present transactions
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';
import { PAGINATION } from '../constants/app.js';

const CardService = {
    /**
     * getAll - Get all cards for the current user
     * 
     * @param {Object} filters - Filter options (type, status)
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} { data: Card[], total: number }
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
        
        return apiService.get(ENDPOINTS.CARDS.BASE, params);
    },
    
    /**
     * getById - Get card details by ID
     * 
     * SECURITY: Returns masked card number (only last 4 digits)
     * 
     * @param {string} id - Card ID
     * @returns {Promise<Object>} Card object with masked number
     */
    async getById(id) {
        if (!id) {
            throw new Error('Card ID is required');
        }
        
        return apiService.get(ENDPOINTS.CARDS.BY_ID(id));
    },
    
    /**
     * block - Block a card immediately
     * 
     * WHY: Card blocking is time-critical:
     * - Lost/stolen card must be blocked ASAP
     * - No confirmation delays
     * - Takes effect immediately on the server
     * 
     * @param {string} id - Card ID
     * @param {string} reason - Block reason (lost, stolen, suspicious)
     * @returns {Promise<Object>} Updated card
     */
    async block(id, reason = 'lost') {
        if (!id) {
            throw new Error('Card ID is required');
        }
        
        return apiService.post(ENDPOINTS.CARDS.BLOCK(id), { reason });
    },
    
    /**
     * unblock - Unblock a card
     * 
     * WHY: Sometimes cards are blocked temporarily:
     * - Suspicious activity that was verified as legitimate
     * - User blocked it themselves and wants to unblock
     * 
     * @param {string} id - Card ID
     * @returns {Promise<Object>} Updated card
     */
    async unblock(id) {
        if (!id) {
            throw new Error('Card ID is required');
        }
        
        return apiService.post(ENDPOINTS.CARDS.UNBLOCK(id));
    },
    
    /**
     * updateLimits - Update card spending limits
     * 
     * WHY: Users might want to:
     * - Set daily spending limit
     * - Set monthly limit
     * - Limit international transactions
     * 
     * @param {string} id - Card ID
     * @param {Object} limits - New limits
     * @param {number} limits.daily - Daily limit
     * @param {number} limits.monthly - Monthly limit
     * @param {number} limits.single - Single transaction limit
     * @returns {Promise<Object>} Updated card
     */
    async updateLimits(id, limits) {
        if (!id) {
            throw new Error('Card ID is required');
        }
        
        return apiService.put(ENDPOINTS.CARDS.LIMITS(id), limits);
    },
    
    /**
     * getTransactions - Get card transaction history
     * 
     * @param {string} id - Card ID
     * @param {Object} filters - Filter options
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} { data: Transaction[], total: number }
     */
    async getTransactions(id, filters = {}, pagination = {}) {
        if (!id) {
            throw new Error('Card ID is required');
        }
        
        const params = {
            page: pagination.page || PAGINATION.DEFAULT_PAGE,
            limit: pagination.limit || PAGINATION.DEFAULT_LIMIT,
            ...filters,
        };
        
        return apiService.get(`${ENDPOINTS.CARDS.BY_ID(id)}/transactions`, params);
    },
    
    /**
     * requestNew - Request a new card
     * 
     * WHY: Users might need:
     * - Replacement for expired card
     * - Additional card (secondary user)
     * - Different card type upgrade
     * 
     * @param {Object} requestData - Card request data
     * @param {string} requestData.type - Card type (debit, credit)
     * @param {string} requestData.accountId - Linked account ID
     * @returns {Promise<Object>} Card request confirmation
     */
    async requestNew(requestData) {
        if (!requestData.type) {
            throw new Error('Card type is required');
        }
        
        if (!requestData.accountId) {
            throw new Error('Account ID is required');
        }
        
        return apiService.post(`${ENDPOINTS.CARDS.BASE}/request`, requestData);
    },
    
    /**
     * activate - Activate a new card
     * 
     * WHY: New cards arrive inactive for security.
     * User must activate before using.
     * 
     * @param {string} id - Card ID
     * @param {string} activationCode - Code from SMS/email
     * @returns {Promise<Object>} Activated card
     */
    async activate(id, activationCode) {
        if (!id) {
            throw new Error('Card ID is required');
        }
        
        if (!activationCode) {
            throw new Error('Activation code is required');
        }
        
        return apiService.post(`${ENDPOINTS.CARDS.BY_ID(id)}/activate`, {
            code: activationCode,
        });
    },
    
    /**
     * getSummary - Get card summary
     * 
     * WHY: Dashboard needs quick card info:
     * - Total cards
     * - Active/blocked count
     * - Total credit used
     * 
     * @returns {Promise<Object>} Card summary
     */
    async getSummary() {
        return apiService.get(`${ENDPOINTS.CARDS.BASE}/summary`);
    },
};

export default CardService;