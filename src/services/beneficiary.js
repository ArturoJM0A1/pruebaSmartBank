/**
 * ============================================================================
 * Beneficiary Service
 * ============================================================================
 * 
 * PURPOSE:
 * Manages beneficiary operations (people you can send money to).
 * Beneficiaries are saved recipients for quick transfers.
 * 
 * WHAT IS A BENEFICIARY?
 * - A person or entity you frequently send money to
 * - Saved with their account details (name, account, CLABE)
 * - Makes transfers faster (don't re-enter details each time)
 * 
 * CRUD OPERATIONS:
 * - Create: Add new beneficiary
 * - Read: List/view beneficiaries
 * - Update: Edit beneficiary details
 * - Delete: Remove beneficiary
 * 
 * RELATED CONCEPTS:
 * - Contact lists
 * - Address books
 * - Favorites/Bookmarks
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';
import { PAGINATION } from '../constants/app.js';

const BeneficiaryService = {
    /**
     * getAll - Get all beneficiaries
     * 
     * @param {Object} filters - Filter options
     * @param {string} filters.search - Search by name or account
     * @param {string} filters.bank - Filter by bank
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} { data: Beneficiary[], total: number }
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
        
        return apiService.get(ENDPOINTS.BENEFICIARIES.BASE, params);
    },
    
    /**
     * getById - Get beneficiary by ID
     * 
     * @param {string} id - Beneficiary ID
     * @returns {Promise<Object>} Beneficiary object
     */
    async getById(id) {
        if (!id) {
            throw new Error('Beneficiary ID is required');
        }
        
        return apiService.get(ENDPOINTS.BENEFICIARIES.BY_ID(id));
    },
    
    /**
     * create - Add a new beneficiary
     * 
     * @param {Object} data - Beneficiary data
     * @param {string} data.name - Beneficiary name
     * @param {string} data.accountNumber - Bank account number
     * @param {string} data.clabe - CLABE interbancaria
     * @param {string} data.bank - Bank name/code
     * @param {string} data.email - Optional email
     * @param {string} data.phone - Optional phone
     * @returns {Promise<Object>} Created beneficiary
     */
    async create(data) {
        // Validate required fields
        if (!data.name) {
            throw new Error('Beneficiary name is required');
        }
        
        if (!data.accountNumber && !data.clabe) {
            throw new Error('Account number or CLABE is required');
        }
        
        return apiService.post(ENDPOINTS.BENEFICIARIES.BASE, data);
    },
    
    /**
     * update - Update beneficiary details
     * 
     * @param {string} id - Beneficiary ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} Updated beneficiary
     */
    async update(id, data) {
        if (!id) {
            throw new Error('Beneficiary ID is required');
        }
        
        return apiService.put(ENDPOINTS.BENEFICIARIES.BY_ID(id), data);
    },
    
    /**
     * delete - Remove a beneficiary
     * 
     * @param {string} id - Beneficiary ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        if (!id) {
            throw new Error('Beneficiary ID is required');
        }
        
        return apiService.delete(ENDPOINTS.BENEFICIARIES.BY_ID(id));
    },
    
    /**
     * search - Search beneficiaries
     * 
     * WHY: Quick search when making a transfer
     * 
     * @param {string} term - Search term
     * @returns {Promise<Array>} Matching beneficiaries
     */
    async search(term) {
        if (!term || term.length < 2) {
            return [];
        }
        
        const response = await this.getAll({ search: term }, { limit: 10 });
        return response.data;
    },
    
    /**
     * getFrequent - Get most frequently used beneficiaries
     * 
     * WHY: Show frequent recipients first for quick access
     * 
     * @param {number} limit - Number of beneficiaries to return
     * @returns {Promise<Array>} Frequent beneficiaries
     */
    async getFrequent(limit = 5) {
        return apiService.get(`${ENDPOINTS.BENEFICIARIES.BASE}/frequent`, {
            limit,
        });
    },
};

export default BeneficiaryService;