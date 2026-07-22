/**
 * ============================================================================
 * SMARTBANK - NOTIFICATION ROUTES
 * ============================================================================
 * 
 * PURPOSE: Manage user notifications (list, mark as read, delete).
 * 
 * NOTIFICATION TYPES:
 *   - transaction: Money movements (deposits, transfers, withdrawals)
 *   - security: Login alerts, card blocks, suspicious activity
 *   - promotion: Bank offers, new products, campaigns
 *   - system: Maintenance, updates, policy changes
 *   - reminder: Payment due dates, account renewals
 * 
 * REAL-TIME PATTERNS (For Production):
 *   1. WebSocket:
 *      - Full duplex communication (server can push to client)
 *      - Best for chat, live updates, gaming
 *      - Complex to implement and scale
 * 
 *   2. Server-Sent Events (SSE):
 *      - Server pushes to client (one-way)
 *      - Simpler than WebSocket
 *      - Good for notifications, live feeds
 *      - Built on HTTP (easier to proxy/cache)
 * 
 *   3. Polling:
 *      - Client periodically requests new notifications
 *      - Simplest to implement
 *      - Wastes bandwidth (most requests return nothing)
 *      - Good for low-frequency updates
 * 
 *   4. Push Notifications:
 *      - Firebase Cloud Messaging (FCM) for Android
 *      - Apple Push Notification Service (APNs) for iOS
 *      - Requires device token registration
 *      - Works when app is closed
 * 
 * THIS IMPLEMENTATION:
 *   - Uses polling pattern (client polls /unread-count)
 *   - Simple and educational
 *   - Easy to upgrade to WebSocket/SSE later
 * 
 * ENDPOINTS:
 *   GET    /api/notifications              → List notifications
 *   PATCH  /api/notifications/:id/read     → Mark as read
 *   PATCH  /api/notifications/read-all     → Mark all as read
 *   DELETE /api/notifications/:id          → Delete notification
 *   GET    /api/notifications/unread-count → Get unread count
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');

/**
 * ============================================================================
 * GET /api/notifications
 * ============================================================================
 * 
 * PURPOSE: List all notifications for the authenticated user.
 * 
 * QUERY PARAMETERS:
 *   - type: Filter by type (transaction, security, promotion, etc.)
 *   - isRead: Filter by read status ('true' or 'false')
 *   - page, limit: Pagination
 *   - sortBy: Sort field (default: createdAt)
 *   - sortOrder: Sort direction (default: desc = newest first)
 * 
 * WHY filter by isRead:
 *   - Users often want to see only unread notifications
 *   - "Mark all as read" works alongside this filter
 * ============================================================================
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const {
      type,
      isRead,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // ============================================================================
    // BUILD FILTERS
    // ============================================================================
    const filters = { userId: req.user.id };
    if (type) filters.type = type;
    if (isRead !== undefined) filters.isRead = isRead === 'true';

    let notifications = db.findAll('notifications', filters);

    // ============================================================================
    // SORT
    // ============================================================================
    // WHY default newest first: Users care most about recent notifications
    // ============================================================================
    notifications.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * modifier;
      if (aVal > bVal) return 1 * modifier;
      return 0;
    });

    // ============================================================================
    // PAGINATE
    // ============================================================================
    const result = paginate(notifications, Number(page), Number(limit));

    // ============================================================================
    // INCLUDE UNREAD COUNT
    // ============================================================================
    // WHY: Client needs unread count for badge display
    //   Including it in the list response saves an extra API call
    // ============================================================================
    const unreadCount = db.findAll('notifications', {
      userId: req.user.id,
      isRead: false,
    }).length;

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      unreadCount,
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/notifications/:id/read
 * ============================================================================
 * 
 * PURPOSE: Mark a single notification as read.
 * 
 * WHY PATCH (not PUT):
 *   - We're only changing one field (isRead)
 *   - PATCH is semantically correct for partial updates
 *   - PUT would require sending the entire notification object
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: { ...updated notification... }
 *   }
 * ============================================================================
 */
router.patch('/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = db.findById('notifications', req.params.id);

    if (!notification) {
      throw new NotFoundError('Notification', req.params.id);
    }

    if (notification.userId !== req.user.id) {
      throw new NotFoundError('Notification', req.params.id);
    }

    // ============================================================================
    // MARK AS READ
    // ============================================================================
    // WHY update timestamp: Track when notification was read (useful for analytics)
    // ============================================================================
    const updated = db.update('notifications', notification.id, {
      isRead: true,
      readAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/notifications/read-all
 * ============================================================================
 * 
 * PURPOSE: Mark all notifications as read.
 * 
 * WHY batch operation:
 *   - "Mark all as read" is a common user action
 *   - More efficient than marking each one individually
 *   - Single API call vs. N calls
 * 
 * IMPLEMENTATION:
 *   - Find all unread notifications for the user
 *   - Update each one's isRead flag
 *   - Return count of updated notifications
 * ============================================================================
 */
router.patch('/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    // ============================================================================
    // FIND ALL UNREAD NOTIFICATIONS
    // ============================================================================
    const unreadNotifications = db.findAll('notifications', {
      userId: req.user.id,
      isRead: false,
    });

    // ============================================================================
    // MARK EACH AS READ
    // ============================================================================
    // WHY loop instead of bulk update:
    //   - Our in-memory DB doesn't support bulk updates
    //   - In production (SQL), use: UPDATE notifications SET isRead = true WHERE ...
    //   - More efficient than individual updates
    // ============================================================================
    const readAt = new Date().toISOString();
    let updatedCount = 0;

    unreadNotifications.forEach((notification) => {
      db.update('notifications', notification.id, {
        isRead: true,
        readAt,
      });
      updatedCount++;
    });

    res.json({
      success: true,
      data: {
        updatedCount,
        message: `${updatedCount} notifications marked as read`,
      },
    });
  })
);

/**
 * ============================================================================
 * DELETE /api/notifications/:id
 * ============================================================================
 * 
 * PURPOSE: Delete a notification.
 * 
 * WHY DELETE (not archive):
 *   - Simpler for demo purposes
 *   - In production, you might archive instead of delete
 *   - Archiving preserves history for analytics
 * 
 * WHO CAN DELETE:
 *   - Notification owner only
 *   - Admin cannot delete user notifications
 * ============================================================================
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = db.findById('notifications', req.params.id);

    if (!notification) {
      throw new NotFoundError('Notification', req.params.id);
    }

    if (notification.userId !== req.user.id) {
      throw new NotFoundError('Notification', req.params.id);
    }

    db.remove('notifications', notification.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  })
);

/**
 * ============================================================================
 * GET /api/notifications/unread-count
 * ============================================================================
 * 
 * PURPOSE: Get the count of unread notifications.
 * 
 * WHY separate endpoint:
 *   - Badge display needs just the count (not full notification list)
 *   - Lightweight response (fast, cacheable)
 *   - Client can poll this endpoint periodically
 *   - Used for "You have 3 new notifications" badge
 * 
 * POLLING STRATEGY:
 *   - Client polls this endpoint every 30-60 seconds
 *   - If count > 0, show badge
 *   - If count changes, fetch full notification list
 *   - WebSocket/SSE would be more efficient for real-time
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       unreadCount: 5,
 *       lastChecked: "2024-07-28T17:30:00.000Z"
 *     }
 *   }
 * ============================================================================
 */
router.get('/unread-count',
  authenticate,
  asyncHandler(async (req, res) => {
    const unreadCount = db.findAll('notifications', {
      userId: req.user.id,
      isRead: false,
    }).length;

    res.json({
      success: true,
      data: {
        unreadCount,
        lastChecked: new Date().toISOString(),
      },
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
