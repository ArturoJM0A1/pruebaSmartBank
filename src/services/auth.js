/**
 * ============================================================================
 * Authentication Service
 * ============================================================================
 * 
 * PURPOSE:
 * Handles all authentication-related operations:
 * - Login/Logout
 * - Registration
 * - Token management
 * - Session validation
 * - Role-based access control
 * 
 * AUTHENTICATION PATTERNS:
 * 
 * 1. Session-based (Traditional):
 *    - Server stores session in memory/Redis
 *    - Client stores session ID in cookie
 *    - Server validates session on each request
 *    - Pros: Server has full control
 *    - Cons: Server-side memory, scaling issues
 * 
 * 2. Token-based (JWT - JSON Web Tokens):
 *    - Server generates signed token
 *    - Client stores token (localStorage or cookie)
 *    - Server validates token signature (stateless)
 *    - Pros: Scalable, stateless, works across domains
 *    - Cons: Token size, revocation difficulty
 * 
 * JWT STRUCTURE:
 * ┌─────────────────────────────────────────────────────┐
 * │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9              │
 * │ .                                                   │
 * │ eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIi  │
 * │ .                                                   │
 * │ SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c        │
 * └─────────────────────────────────────────────────────┘
 * 
 * Three parts (separated by dots):
 * 1. Header: Algorithm and token type
 * 2. Payload: Data (user ID, role, expiration)
 * 3. Signature: To verify token hasn't been tampered with
 * 
 * TOKEN STORAGE SECURITY:
 * - localStorage: Vulnerable to XSS (JavaScript can access it)
 * - httpOnly cookie: Not accessible to JS (more secure)
 * - For this demo, we use localStorage (simpler, good for learning)
 * - Production apps should use httpOnly cookies
 * 
 * RELATED CONCEPTS:
 * - OAuth 2.0 (third-party login: Google, Facebook)
 * - OpenID Connect (identity layer on OAuth)
 * - Multi-Factor Authentication (MFA)
 * - Single Sign-On (SSO)
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';
import { ROLES } from '../constants/app.js';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage.js';

/**
 * AuthService - Handles all authentication operations
 */
const AuthService = {
    /**
     * login - Authenticate user with email and password
     * 
     * FLOW:
     * 1. Send credentials to server
     * 2. Server validates and returns JWT token + user data
     * 3. Store token in localStorage
     * 4. Store user data in localStorage
     * 5. Return user data for UI
     * 
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} { user, token }
     */
    async login(email, password) {
        try {
            const response = await apiService.post(ENDPOINTS.AUTH.LOGIN, {
                email,
                password,
            });
            
            // Store token and user data
            setToken(response.token);
            setUser(response.user);
            
            return {
                user: response.user,
                token: response.token,
            };
            
        } catch (error) {
            // Re-throw with user-friendly message
            throw new Error(error.message || 'Error al iniciar sesión');
        }
    },
    
    /**
     * register - Create new user account
     * 
     * @param {Object} userData - User registration data
     * @param {string} userData.name - Full name
     * @param {string} userData.email - Email
     * @param {string} userData.phone - Phone number
     * @param {string} userData.password - Password
     * @returns {Promise<Object>} { user, token }
     */
    async register(userData) {
        try {
            const response = await apiService.post(ENDPOINTS.AUTH.REGISTER, userData);
            
            // Auto-login after registration
            setToken(response.token);
            setUser(response.user);
            
            return {
                user: response.user,
                token: response.token,
            };
            
        } catch (error) {
            throw new Error(error.message || 'Error al registrar usuario');
        }
    },
    
    /**
     * logout - End user session
     * 
     * WHY: Clear all stored auth data and redirect to login.
     * Even if the server call fails, we clear local data.
     * 
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Try to notify server (optional)
            await apiService.post(ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            // Ignore server errors - we still want to log out locally
            console.warn('Logout server call failed:', error);
        } finally {
            // Always clear local data
            removeToken();
            removeUser();
            
            // Dispatch logout event for components to react
            window.dispatchEvent(new CustomEvent('auth:logout'));
            
            // Redirect to login
            window.location.hash = '#/login';
        }
    },
    
    /**
     * refreshToken - Get a new JWT token before current expires
     * 
     * WHY: JWTs have an expiration time (usually 15-60 minutes).
     * Before they expire, we refresh to maintain the session.
     * 
     * STRATEGY: "Silent refresh"
     * - Check token expiration periodically
     * - If about to expire, request new token
     * - User doesn't notice anything
     * 
     * @returns {Promise<string>} New token
     */
    async refreshToken() {
        try {
            const currentToken = getToken();
            
            if (!currentToken) {
                throw new Error('No token to refresh');
            }
            
            const response = await apiService.post(ENDPOINTS.AUTH.REFRESH, {
                token: currentToken,
            });
            
            // Store new token
            setToken(response.token);
            
            return response.token;
            
        } catch (error) {
            // If refresh fails, user must login again
            removeToken();
            removeUser();
            throw error;
        }
    },
    
    /**
     * getCurrentUser - Get current user from stored data
     * 
     * @returns {Object|null} User object or null if not logged in
     */
    getCurrentUser() {
        return getUser();
    },
    
    /**
     * isAuthenticated - Check if user is logged in
     * 
     * CONCEPT: Token validation
     * - Check if token exists
     * - Optionally check if token is expired
     * 
     * @returns {boolean} True if user has valid token
     */
    isAuthenticated() {
        const token = getToken();
        const user = getUser();
        
        // Both token and user must exist
        if (!token || !user) {
            return false;
        }
        
        // Optionally check token expiration
        try {
            const payload = this.parseToken(token);
            const now = Math.floor(Date.now() / 1000);
            
            // If token is expired, not authenticated
            if (payload.exp && payload.exp < now) {
                removeToken();
                removeUser();
                return false;
            }
            
            return true;
        } catch (error) {
            // If we can't parse the token, it's invalid
            return false;
        }
    },
    
    /**
     * hasRole - Check if user has a specific role
     * 
     * WHY: Role-Based Access Control (RBAC)
     * - Different users see different features
     * - Admin sees admin panel, regular users don't
     * 
     * CONCEPT: Array.includes()
     * - User might have multiple roles
     * - Check if any of their roles match
     * 
     * @param {string} role - Role to check (e.g., 'admin')
     * @returns {boolean} True if user has the role
     */
    hasRole(role) {
        const user = getUser();
        
        if (!user) return false;
        
        // Handle both single role and multiple roles
        if (Array.isArray(user.roles)) {
            return user.roles.includes(role);
        }
        
        return user.role === role;
    },
    
    /**
     * isAdmin - Check if user is admin (convenience method)
     * 
     * @returns {boolean} True if user is admin
     */
    isAdmin() {
        return this.hasRole(ROLES.ADMIN);
    },
    
    /**
     * parseToken - Decode JWT payload (client-side only)
     * 
     * WHY: We can read JWT payload without verifying signature.
     * The payload is just base64-encoded, not encrypted.
     * 
     * SECURITY WARNING: 
     * - This only reads the data, doesn't verify it
     * - Server MUST verify the signature
     * - Never trust client-side JWT validation for security
     * 
     * @param {string} token - JWT token
     * @returns {Object} Decoded payload
     */
    parseToken(token) {
        try {
            // JWT has three parts separated by dots
            const parts = token.split('.');
            
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }
            
            // Decode the payload (second part)
            const payload = parts[1];
            
            // atob() decodes base64, then parse JSON
            const decoded = JSON.parse(atob(payload));
            
            return decoded;
            
        } catch (error) {
            throw new Error('Invalid token');
        }
    },
    
    /**
     * getTokenExpiration - Get token expiration time
     * 
     * @returns {Date|null} Expiration date or null
     */
    getTokenExpiration() {
        const token = getToken();
        
        if (!token) return null;
        
        try {
            const payload = this.parseToken(token);
            
            if (payload.exp) {
                // exp is in seconds, convert to milliseconds
                return new Date(payload.exp * 1000);
            }
            
            return null;
        } catch {
            return null;
        }
    },
    
    /**
     * isTokenExpired - Check if token is expired
     * 
     * @returns {boolean} True if token is expired
     */
    isTokenExpired() {
        const expiration = this.getTokenExpiration();
        
        if (!expiration) return true;
        
        return expiration < new Date();
    },
    
    /**
     * getTimeUntilExpiration - Get time until token expires
     * 
     * WHY: For silent refresh logic
     * 
     * @returns {number} Milliseconds until expiration, or 0 if expired
     */
    getTimeUntilExpiration() {
        const expiration = this.getTokenExpiration();
        
        if (!expiration) return 0;
        
        const now = Date.now();
        const expTime = expiration.getTime();
        
        return Math.max(0, expTime - now);
    },
    
    /**
     * forgotPassword - Request password reset
     * 
     * @param {string} email - User's email
     * @returns {Promise<void>}
     */
    async forgotPassword(email) {
        try {
            await apiService.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
        } catch (error) {
            throw new Error(error.message || 'Error al solicitar cambio de contraseña');
        }
    },
    
    /**
     * resetPassword - Reset password with token
     * 
     * @param {string} token - Reset token from email
     * @param {string} newPassword - New password
     * @returns {Promise<void>}
     */
    async resetPassword(token, newPassword) {
        try {
            await apiService.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
                token,
                password: newPassword,
            });
        } catch (error) {
            throw new Error(error.message || 'Error al restablecer contraseña');
        }
    },
    
    /**
     * verifyEmail - Verify email address
     * 
     * @param {string} verificationCode - Code from email
     * @returns {Promise<void>}
     */
    async verifyEmail(verificationCode) {
        try {
            await apiService.post(ENDPOINTS.AUTH.VERIFY_EMAIL, {
                code: verificationCode,
            });
        } catch (error) {
            throw new Error(error.message || 'Error al verificar correo');
        }
    },
};

export default AuthService;