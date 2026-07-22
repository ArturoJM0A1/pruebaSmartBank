/**
 * ============================================================================
 * Notification Service
 * ============================================================================
 * 
 * PURPOSE:
 * Manages user notifications:
 * - List notifications
 * - Mark as read
 * - Delete notifications
 * - Get unread count
 * 
 * NOTIFICATION DELIVERY METHODS:
 * 
 * 1. POLLING:
 *    - Client periodically asks server for new notifications
 *    - Simple to implement
 *    - Wasteful (most requests return no new data)
 *    - Delay between notifications (polling interval)
 *    Example: setInterval(() => fetchNotifications(), 30000)
 * 
 * 2. WEBSOCKETS:
 *    - Full-duplex communication (client ↔ server)
 *    - Server pushes notifications instantly
 *    - More complex to implement
 *    - Requires persistent connection
 *    - Best real-time experience
 *    Example: socket.on('notification', handler)
 * 
 * 3. SERVER-SENT EVENTS (SSE):
 *    - Server pushes to client (one-way)
 *    - Simpler than WebSockets
 *    - Auto-reconnect built in
 *    - Good for notifications (only server needs to push)
 *    Example: EventSource('/api/notifications/stream')
 * 
 * FOR THIS APP: We use polling (simplest for learning)
 * PRODUCTION: Would use WebSockets or SSE
 * 
 * RELATED CONCEPTS:
 * - Pub/Sub pattern
 * - Real-time updates
 * - Push notifications (browser/mobile)
 * - Notification badges
 * ============================================================================
 */

import apiService from './api.js';
import { ENDPOINTS } from '../constants/api.js';
import { PAGINATION } from '../constants/app.js';

const NotificationService = {
    /**
     * getAll - Get all notifications with filters
     * 
     * @param {Object} filters - Filter options
     * @param {boolean} filters.unreadOnly - Only unread notifications
     * @param {string} filters.type - Notification type
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} { data: Notification[], total: number, unreadCount: number }
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
        
        return apiService.get(ENDPOINTS.NOTIFICATIONS.BASE, params);
    },
    
    /**
     * markAsRead - Mark a single notification as read
     * 
     * @param {string} id - Notification ID
     * @returns {Promise<Object>} Updated notification
     */
    async markAsRead(id) {
        if (!id) {
            throw new Error('Notification ID is required');
        }
        
        return apiService.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    },
    
    /**
     * markAllAsRead - Mark all notifications as read
     * 
     * WHY: Convenience action - user clicks "Mark all as read"
     * instead of clicking each notification individually.
     * 
     * @returns {Promise<void>}
     */
    async markAllAsRead() {
        return apiService.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },
    
    /**
     * delete - Delete a notification
     * 
     * @param {string} id - Notification ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        if (!id) {
            throw new Error('Notification ID is required');
        }
        
        return apiService.delete(ENDPOINTS.NOTIFICATIONS.BY_ID(id));
    },
    
    /**
     * getUnreadCount - Get count of unread notifications
     * 
     * WHY: Badge on notification bell shows unread count.
     * This endpoint is lightweight (returns just a number).
     * 
     * @returns {Promise<number>} Unread notification count
     */
    async getUnreadCount() {
        const response = await apiService.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
        return response.count;
    },
    
    /**
     * subscribe - Subscribe to notification updates (polling)
     * 
     * WHY: Polling checks for new notifications periodically.
     * Returns a function to stop polling when component unmounts.
     * 
     * CONCEPT: Cleanup function pattern
     * - Similar to React's useEffect cleanup
     * - Prevents memory leaks
     * 
     * @param {Function} callback - Called with new notifications
     * @param {number} interval - Polling interval in ms
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback, interval = 30000) {
        let isSubscribed = true;
        
        const poll = async () => {
            if (!isSubscribed) return;
            
            try {
                const count = await this.getUnreadCount();
                callback(count);
            } catch (error) {
                console.error('Notification poll error:', error);
            }
            
            if (isSubscribed) {
                setTimeout(poll, interval);
            }
        };
        
        // Start polling
        poll();
        
        // Return unsubscribe function
        return () => {
            isSubscribed = false;
        };
    },
    
    /**
     * create - Create a notification (admin/system use)
     * 
     * WHY: System needs to create notifications for:
     * - Transaction confirmations
 * - Security alerts
     * - Account changes
     * - Promotional messages
     * 
     * @param {Object} data - Notification data
     * @param {string} data.userId - Target user
     * @param {string} data.type - Notification type
     * @param {string} data.title - Notification title
     * @param {string} data.message - Notification message
     * @returns {Promise<Object>} Created notification
     */
    async create(data) {
        return apiService.post(ENDPOINTS.NOTIFICATIONS.BASE, data);
    },
    
    /**
     * deleteAll - Delete all notifications
     * 
     * @returns {Promise<void>}
     */
    async deleteAll() {
        return apiService.delete(ENDPOINTS.NOTIFICATIONS.BASE);
    },
};

export default NotificationService;