/**
 * ============================================================================
 * User Service
 * ============================================================================
 * 
 * PURPOSE:
 * Manages user profile and settings operations:
 * - Profile management
 * - Settings/preferences
 * - Password changes
 * - Account settings
 * 
 * RELATED CONCEPTS:
 * - User Profile Pattern
 * - Settings Management
 * - User Preferences
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';
import { getUser, setUser } from '../utils/storage.js';

const UserService = {
    /**
     * getProfile - Get current user's profile
     * 
     * @returns {Promise<Object>} User profile data
     */
    async getProfile() {
        return apiService.get(ENDPOINTS.USER.PROFILE);
    },
    
    /**
     * updateProfile - Update user profile
     * 
     * @param {Object} data - Profile data to update
     * @param {string} data.name - Full name
     * @param {string} data.phone - Phone number
     * @param {string} data.avatar - Avatar URL
     * @returns {Promise<Object>} Updated profile
     */
    async updateProfile(data) {
        const response = await apiService.put(ENDPOINTS.USER.UPDATE, data);
        
        // Update local user data
        const currentUser = getUser();
        if (currentUser) {
            setUser({ ...currentUser, ...data });
        }
        
        return response;
    },
    
    /**
     * updateSettings - Update user settings
     * 
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Updated settings
     */
    async updateSettings(settings) {
        return apiService.put(ENDPOINTS.USER.SETTINGS, settings);
    },
    
    /**
     * changePassword - Change user password
     * 
     * WHY: Password changes require current password for security.
     * Even if someone has access to the session, they can't change
     * the password without knowing the current one.
     * 
     * @param {Object} data - Password data
     * @param {string} data.currentPassword - Current password
     * @param {string} data.newPassword - New password
     * @returns {Promise<void>}
     */
    async changePassword(data) {
        if (!data.currentPassword) {
            throw new Error('Current password is required');
        }
        
        if (!data.newPassword) {
            throw new Error('New password is required');
        }
        
        if (data.currentPassword === data.newPassword) {
            throw new Error('New password must be different from current');
        }
        
        return apiService.post(ENDPOINTS.USER.CHANGE_PASSWORD, data);
    },
    
    /**
     * getPreferences - Get user preferences
     * 
     * @returns {Promise<Object>} User preferences
     */
    async getPreferences() {
        return apiService.get(ENDPOINTS.USER.PREFERENCES);
    },
    
    /**
     * updatePreferences - Update user preferences
     * 
     * @param {Object} preferences - Preferences to update
     * @returns {Promise<Object>} Updated preferences
     */
    async updatePreferences(preferences) {
        return apiService.put(ENDPOINTS.USER.PREFERENCES, preferences);
    },
    
    /**
     * updateAvatar - Upload user avatar
     * 
     * WHY: Avatar upload uses FormData, not JSON.
     * 
     * @param {File} file - Image file
     * @returns {Promise<Object>} Updated profile with avatar URL
     */
    async updateAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        
        return apiService.upload(`${ENDPOINTS.USER.UPDATE}/avatar`, formData);
    },
    
    /**
     * deleteAvatar - Remove user avatar
     * 
     * @returns {Promise<void>}
     */
    async deleteAvatar() {
        return apiService.delete(`${ENDPOINTS.USER.UPDATE}/avatar`);
    },
    
    /**
     * getNotifications - Get notification preferences
     * 
     * @returns {Promise<Object>} Notification settings
     */
    async getNotificationSettings() {
        return apiService.get(`${ENDPOINTS.USER.SETTINGS}/notifications`);
    },
    
    /**
     * updateNotifications - Update notification preferences
     * 
     * @param {Object} settings - Notification settings
     * @returns {Promise<Object>} Updated settings
     */
    async updateNotificationSettings(settings) {
        return apiService.put(`${ENDPOINTS.USER.SETTINGS}/notifications`, settings);
    },
    
    /**
     * enableTwoFactor - Enable two-factor authentication
     * 
     * WHY: 2FA adds an extra layer of security.
     * Even if password is compromised, attacker needs the second factor.
     * 
     * @returns {Promise<Object>} QR code and secret for authenticator app
     */
    async enableTwoFactor() {
        return apiService.post(`${ENDPOINTS.USER.SETTINGS}/2fa/enable`);
    },
    
    /**
     * confirmTwoFactor - Confirm 2FA setup
     * 
     * @param {string} code - Code from authenticator app
     * @returns {Promise<Object>} Backup codes
     */
    async confirmTwoFactor(code) {
        return apiService.post(`${ENDPOINTS.USER.SETTINGS}/2fa/confirm`, { code });
    },
    
    /**
     * disableTwoFactor - Disable 2FA
     * 
     * @param {string} password - Current password for verification
     * @returns {Promise<void>}
     */
    async disableTwoFactor(password) {
        return apiService.post(`${ENDPOINTS.USER.SETTINGS}/2fa/disable`, { password });
    },
    
    /**
     * getActiveSessions - Get active login sessions
     * 
     * WHY: Security feature - users can see where they're logged in
     * and revoke suspicious sessions.
     * 
     * @returns {Promise<Array>} Active sessions
     */
    async getActiveSessions() {
        return apiService.get(`${ENDPOINTS.USER.SETTINGS}/sessions`);
    },
    
    /**
     * revokeSession - Revoke a specific session
     * 
     * @param {string} sessionId - Session to revoke
     * @returns {Promise<void>}
     */
    async revokeSession(sessionId) {
        return apiService.delete(`${ENDPOINTS.USER.SETTINGS}/sessions/${sessionId}`);
    },
    
    /**
     * revokeAllSessions - Revoke all sessions except current
     * 
     * @returns {Promise<void>}
     */
    async revokeAllSessions() {
        return apiService.delete(`${ENDPOINTS.USER.SETTINGS}/sessions`);
    },
};

export default UserService;