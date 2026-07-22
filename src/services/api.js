/**
 * ============================================================================
 * API Service (HTTP Client)
 * ============================================================================
 * 
 * PURPOSE:
 * Centralized HTTP client that handles ALL communication with the backend.
 * Instead of calling fetch() directly everywhere, we use this service.
 * 
 * WHY A SERVICE LAYER?
 * 1. DRY: Don't repeat fetch configuration in every file
 * 2. Consistency: Same headers, error handling, auth everywhere
 * 3. Maintenance: Change API URL once, it updates everywhere
 * 4. Security: Auth token is attached automatically
 * 5. Testability: Can mock this service in tests
 * 
 * REQUEST/RESPONSE FLOW:
 * ┌─────────────────────────────────────────────────────┐
 * │ Component (e.g., LoginPage)                         │
 * │   │                                                 │
 * │   │ authService.login(email, password)              │
 * │   ▼                                                 │
 * │ Service (auth.js)                                   │
 * │   │                                                 │
 * │   │ apiService.post(ENDPOINTS.AUTH.LOGIN, data)     │
 * │   ▼                                                 │
 * │ API Service (api.js)                                │
 * │   │                                                 │
 * │   │ 1. Add auth token header                        │
 * │   │ 2. Stringify body                               │
 * │   │ 3. Call fetch()                                 │
 * │   │ 4. Handle response/error                        │
 * │   ▼                                                 │
 * │ Backend Server                                      │
 * └─────────────────────────────────────────────────────┘
 * 
 * FETCH API BASICS:
 * - fetch(url, options) returns a Promise<Response>
 * - Response has: .ok (boolean), .status (number), .json(), .text()
 * - Request options: method, headers, body, mode, credentials
 * 
 * HTTP STATUS CODES:
 * - 200: OK (success)
 * - 201: Created (resource created)
 * - 204: No Content (success, no body)
 * - 400: Bad Request (invalid input)
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (logged in but no permission)
 * - 404: Not Found
 * - 409: Conflict (duplicate, etc.)
 * - 422: Unprocessable Entity (validation error)
 * - 500: Internal Server Error
 * 
 * RELATED CONCEPTS:
 * - Promise chaining
 * - Async/Await
 * - Intercepting patterns (like Axios interceptors)
 * - Service Layer pattern
 * ============================================================================
 */

import { BASE_URL, TIMEOUT, HTTP_METHODS, ENDPOINTS } from '../constants/api.js';
import { getToken, removeToken, removeUser } from '../utils/storage.js';

/**
 * ============================================================================
 * INTERCEPTORS
 * ============================================================================
 * Functions that run before requests or after responses.
 * Similar to Axios interceptors but simpler.
 * ============================================================================
 */

/**
 * requestInterceptors - Functions that modify requests before sending
 * 
 * WHY: Common request modifications:
 * - Add auth token
 * - Add custom headers
 * - Log requests (debugging)
 * - Transform request body
 */
const requestInterceptors = [];

/**
 * responseInterceptors - Functions that process responses
 * 
 * WHY: Common response processing:
 * - Transform response data
 * - Log responses (debugging)
 * - Handle specific status codes globally
 */
const responseInterceptors = [];

/**
 * ============================================================================
 * API SERVICE CLASS
 * ============================================================================
 * Singleton pattern - only one instance needed for the entire app
 * ============================================================================
 */

class ApiService {
    /**
     * @param {string} baseUrl - Base URL for all API requests
     */
    constructor(baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
        this.timeout = TIMEOUT;
        
        // Bind methods to maintain correct 'this' context
        this.get = this.get.bind(this);
        this.post = this.post.bind(this);
        this.put = this.put.bind(this);
        this.patch = this.patch.bind(this);
        this.delete = this.delete.bind(this);
    }
    
    /**
     * Add a request interceptor
     * 
     * @param {Function} interceptor - (config) => modified config
     */
    addRequestInterceptor(interceptor) {
        requestInterceptors.push(interceptor);
    }
    
    /**
     * Add a response interceptor
     * 
     * @param {Function} interceptor - (response) => modified response
     */
    addResponseInterceptor(interceptor) {
        responseInterceptors.push(interceptor);
    }
    
    /**
     * GET request
     * 
     * WHY: GET requests are for reading data (should not modify server state).
     * Parameters are sent as query string: /api/users?page=1&limit=10
     * 
     * @param {string} endpoint - API endpoint (e.g., '/users')
     * @param {Object} params - Query parameters
     * @returns {Promise<any>} Response data
     */
    async get(endpoint, params = {}) {
        // Build query string from params object
        const queryString = this.buildQueryString(params);
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this._request(HTTP_METHODS.GET, url);
    }
    
    /**
     * POST request
     * 
     * WHY: POST requests create new resources or perform actions.
     * Body contains the data to send (JSON).
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @returns {Promise<any>} Response data
     */
    async post(endpoint, data = {}) {
        return this._request(HTTP_METHODS.POST, endpoint, { body: data });
    }
    
    /**
     * PUT request (full replacement)
     * 
     * WHY: PUT replaces the ENTIRE resource.
     * If you only want to update some fields, use PATCH instead.
     * 
     * Example:
     * PUT /users/123 { name: "John", email: "john@test.com", phone: "555" }
     * → Replaces ALL fields of user 123
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Complete resource data
     * @returns {Promise<any>} Response data
     */
    async put(endpoint, data = {}) {
        return this._request(HTTP_METHODS.PUT, endpoint, { body: data });
    }
    
    /**
     * PATCH request (partial update)
     * 
     * WHY: PATCH only sends the fields you want to change.
     * More efficient than PUT for small updates.
     * 
     * Example:
     * PATCH /users/123 { email: "new@test.com" }
     * → Only updates email, keeps everything else
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Partial data to update
     * @returns {Promise<any>} Response data
     */
    async patch(endpoint, data = {}) {
        return this._request(HTTP_METHODS.PATCH, endpoint, { body: data });
    }
    
    /**
     * DELETE request
     * 
     * WHY: DELETE removes a resource. Usually has no body.
     * 
     * @param {string} endpoint - API endpoint
     * @returns {Promise<any>} Response data
     */
    async delete(endpoint) {
        return this._request(HTTP_METHODS.DELETE, endpoint);
    }
    
    /**
     * _request - Internal method that handles all HTTP requests
     * 
     * This is the core method. All other methods (get, post, etc.) call this.
     * 
     * CONCEPT: Request/Response lifecycle
     * 1. Build the full URL
     * 2. Create request configuration
     * 3. Run request interceptors
     * 4. Make the fetch call
     * 5. Handle the response
     * 6. Run response interceptors
     * 7. Return data or throw error
     * 
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    async _request(method, endpoint, options = {}) {
        const { body, headers: customHeaders, params } = options;
        
        // Build full URL
        let url = `${this.baseUrl}${endpoint}`;
        
        // Add query params if provided
        if (params) {
            const queryString = this.buildQueryString(params);
            if (queryString) {
                url += `?${queryString}`;
            }
        }
        
        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        // Auto-attach auth token
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Merge custom headers
        if (customHeaders) {
            Object.assign(headers, customHeaders);
        }
        
        // Build request config
        let config = {
            method,
            headers,
        };
        
        // Add body for non-GET requests
        if (body && method !== HTTP_METHODS.GET) {
            config.body = JSON.stringify(body);
        }
        
        // Run request interceptors
        for (const interceptor of requestInterceptors) {
            config = await interceptor(config);
        }
        
        try {
            // Make the fetch call with timeout
            const response = await this.fetchWithTimeout(url, config);
            
            // Run response interceptors
            let processedResponse = response;
            for (const interceptor of responseInterceptors) {
                processedResponse = await interceptor(processedResponse);
            }
            
            // Handle different response types
            return await this.handleResponse(processedResponse);
            
        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Error de conexión. Verifica tu internet.');
            }
            
            // Handle timeout
            if (error.message.includes('timed out')) {
                throw new Error('Tiempo de espera agotado. Intenta de nuevo.');
            }
            
            throw error;
        }
    }
    
    /**
     * fetchWithTimeout - Fetch with automatic timeout
     * 
     * WHY: Prevents the app from hanging if the server doesn't respond.
     * Uses Promise.race() to race the fetch against a timeout.
     * 
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out after ${this.timeout}ms`);
            }
            
            throw error;
        }
    }
    
    /**
     * handleResponse - Process API response
     * 
     * WHY: Consistent response handling across the app.
     * Different status codes need different handling.
     * 
     * @param {Response} response - Fetch Response object
     * @returns {Promise<any>} Parsed response data
     */
    async handleResponse(response) {
        // Parse JSON response
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        // Handle successful responses
        if (response.ok) {
            return data;
        }
        
        // Handle error responses
        // Create error object with server message
        const error = new Error(data.message || data.error || 'Error del servidor');
        error.status = response.status;
        error.data = data;
        
        // Handle specific status codes
        switch (response.status) {
            case 401:
                // Unauthorized - token expired or invalid
                this.handleUnauthorized();
                break;
                
            case 403:
                // Forbidden - no permission
                error.message = 'No tienes permiso para realizar esta acción';
                break;
                
            case 404:
                error.message = 'Recurso no encontrado';
                break;
                
            case 422:
                // Validation error - extract field errors
                error.errors = data.errors || {};
                error.message = data.message || 'Error de validación';
                break;
                
            case 500:
                error.message = 'Error del servidor. Intenta más tarde.';
                break;
        }
        
        throw error;
    }
    
    /**
     * handleUnauthorized - Handle 401 responses
     * 
     * WHY: When the token is invalid/expired, we need to:
     * 1. Clear the stored token
     * 2. Clear user data
     * 3. Redirect to login
     * 
     * This is called "session management" or "auth recovery"
     */
    handleUnauthorized() {
        removeToken();
        removeUser();
        
        // Redirect to login
        // Using hash-based routing for SPA
        window.location.hash = '#/login';
        
        // Optionally show a toast notification
        window.dispatchEvent(new CustomEvent('auth:expired', {
            detail: { message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' }
        }));
    }
    
    /**
     * buildQueryString - Convert object to URL query string
     * 
     * WHY: fetch() doesn't have built-in query string support.
     * We need to manually build "key1=value1&key2=value2".
     * 
     * CONCEPT: Object.entries() + URLSearchParams
     * - Object.entries({a: 1, b: 2}) → [['a', 1], ['b', 2]]
     * - URLSearchParams builds properly encoded query strings
     * 
     * @param {Object} params - Query parameters
     * @returns {string} URL-encoded query string
     */
    buildQueryString(params) {
        const searchParams = new URLSearchParams();
        
        for (const [key, value] of Object.entries(params)) {
            // Skip null/undefined values
            if (value !== null && value !== undefined && value !== '') {
                searchParams.append(key, String(value));
            }
        }
        
        return searchParams.toString();
    }
    
    /**
     * upload - Upload file
     * 
     * WHY: File uploads need multipart/form-data, not JSON.
     * This method handles the special Content-Type.
     * 
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - FormData object with file
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<any>} Response data
     */
    async upload(endpoint, formData, onProgress = null) {
        const token = getToken();
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Don't set Content-Type for FormData - browser sets it with boundary
        
        const config = {
            method: 'POST',
            headers,
            body: formData,
        };
        
        // Note: Progress tracking requires XMLHttpRequest, not fetch
        // This is a simplified version
        const response = await fetch(`${this.baseUrl}${endpoint}`, config);
        return this.handleResponse(response);
    }
}

/**
 * Create and export a singleton instance
 * 
 * WHY singleton? We only need one API service instance for the entire app.
 * Multiple instances would be wasteful and could cause issues.
 */
const apiService = new ApiService();

export default apiService;