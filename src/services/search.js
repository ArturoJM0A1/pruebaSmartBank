/**
 * ============================================================================
 * Search Service
 * ============================================================================
 * 
 * PURPOSE:
 * Global search functionality across the application.
 * Allows users to search accounts, transactions, beneficiaries, etc.
 * 
 * CLIENT vs SERVER SEARCH:
 * 
 * CLIENT-SIDE SEARCH:
 * - All data is loaded upfront
 * - Search happens in the browser (fast, no network)
 * - Limited to loaded data (can't search entire database)
 * - Good for: small datasets, autocomplete
 * 
 * SERVER-SIDE SEARCH:
 * - Search query sent to server
 * - Server searches database
 * - Returns matching results
 * - Good for: large datasets, complex queries
 * 
 * FOR SMARTBank: We use server-side search (financial data is large)
 * 
 * DEBOUNCING SEARCH:
 * - User types "CDMX"
 * - Without debounce: 4 API calls (C, CD, CDM, CDMX)
 * - With debounce (300ms): 1 API call (CDMX)
 * - Saves bandwidth and server load
 * 
 * RELATED CONCEPTS:
 * - Full-text search
 * - Fuzzy matching
 * - Search indexing (Elasticsearch, Algolia)
 * - Typeahead/Autocomplete
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';

const SearchService = {
    /**
     * globalSearch - Search across all resources
     * 
     * @param {string} term - Search term
     * @param {Object} options - Search options
     * @param {Array<string>} options.types - Resource types to search
     * @param {number} options.limit - Max results per type
     * @returns {Promise<Object>} Search results by type
     */
    async globalSearch(term, options = {}) {
        if (!term || term.trim().length < 2) {
            return {
                accounts: [],
                transactions: [],
                beneficiaries: [],
                cards: [],
            };
        }
        
        const params = {
            q: term.trim(),
            types: options.types || ['accounts', 'transactions', 'beneficiaries'],
            limit: options.limit || 10,
        };
        
        return apiService.get(ENDPOINTS.SEARCH.GLOBAL, params);
    },
    
    /**
     * searchAccounts - Search accounts specifically
     * 
     * @param {string} term - Search term (account number, name, etc.)
     * @returns {Promise<Array>} Matching accounts
     */
    async searchAccounts(term) {
        if (!term || term.trim().length < 2) {
            return [];
        }
        
        const response = await this.globalSearch(term, {
            types: ['accounts'],
            limit: 10,
        });
        
        return response.accounts || [];
    },
    
    /**
     * searchTransactions - Search transactions
     * 
     * @param {string} term - Search term (concept, amount, etc.)
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Matching transactions
     */
    async searchTransactions(term, filters = {}) {
        if (!term || term.trim().length < 2) {
            return [];
        }
        
        const response = await this.globalSearch(term, {
            types: ['transactions'],
            limit: 20,
        });
        
        return response.transactions || [];
    },
    
    /**
     * searchBeneficiaries - Search beneficiaries
     * 
     * @param {string} term - Search term (name, account, etc.)
     * @returns {Promise<Array>} Matching beneficiaries
     */
    async searchBeneficiaries(term) {
        if (!term || term.trim().length < 2) {
            return [];
        }
        
        const response = await this.globalSearch(term, {
            types: ['beneficiaries'],
            limit: 10,
        });
        
        return response.beneficiaries || [];
    },
    
    /**
     * getRecentSearches - Get user's recent searches
     * 
     * WHY: Show recent searches for quick re-search
     * 
     * @returns {Promise<Array>} Recent search terms
     */
    async getRecentSearches() {
        try {
            const response = await apiService.get('/search/recent');
            return response.recent || [];
        } catch {
            return [];
        }
    },
    
    /**
     * clearRecentSearches - Clear search history
     * 
     * @returns {Promise<void>}
     */
    async clearRecentSearches() {
        return apiService.delete('/search/recent');
    },
    
    /**
     * getSuggestions - Get search suggestions (autocomplete)
     * 
     * WHY: As user types, show suggestions before they finish typing.
     * Similar to Google's autocomplete.
     * 
     * @param {string} term - Partial search term
     * @returns {Promise<Array>} Suggestion strings
     */
    async getSuggestions(term) {
        if (!term || term.trim().length < 1) {
            return [];
        }
        
        try {
            const response = await apiService.get('/search/suggestions', {
                q: term.trim(),
                limit: 5,
            });
            return response.suggestions || [];
        } catch {
            return [];
        }
    },
};

export default SearchService;