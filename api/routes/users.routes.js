/**
 * ============================================================================
 * SMARTBANK - USER ROUTES
 * ============================================================================
 * 
 * PURPOSE: User profile management, settings, and preferences.
 *   These routes handle personal data management and customization.
 * 
 * ENDPOINTS:
 *   GET    /api/users/profile      → Get current user profile
 *   PUT    /api/users/profile      → Update profile (full replace)
 *   PATCH  /api/users/settings     → Update settings (partial)
 *   PUT    /api/users/password     → Change password
 *   GET    /api/users/preferences  → Get preferences
 *   PATCH  /api/users/preferences  → Update preferences
 * 
 * GDPR CONSIDERATIONS:
 *   - Right to Access: Users can view all their data (GET profile)
 *   - Right to Rectification: Users can update their data (PUT profile)
 *   - Right to Erasure: Users can request account deletion
 *   - Data Portability: Users can export their data
 *   - Consent: Users control what data is collected/used
 * 
 * MEXICAN DATA PROTECTION (LFPDPPP):
 *   - Ley Federal de Protección de Datos Personales
 *   - Requires consent for data collection
 *   - Users can access, rectify, and cancel their data
 *   - Similar to GDPR but with some differences
 * 
 * PUT vs PATCH:
 *   - PUT /profile: Full replacement (all fields required)
 *   - PATCH /settings: Partial update (only changed fields)
 *   - We use PUT for profile (comprehensive update)
 *   - We use PATCH for settings (frequent small changes)
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { simpleHash } = require('../seeds/data');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, NotFoundError, ValidationError, UnauthorizedError } = require('../middleware/errorHandler');

/**
 * ============================================================================
 * GET /api/users/profile
 * ============================================================================
 * 
 * PURPOSE: Get the authenticated user's full profile.
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       id: 2,
 *       email: "juan.perez@email.com",
 *       firstName: "Juan",
 *       lastName: "Pérez García",
 *       role: "user",
 *       phone: "+52 33 9876 5432",
 *       dateOfBirth: "1990-07-22",
 *       rfc: "PEGJ900722IJC",
 *       curp: "PEGJ900722HJCRRS09",
 *       address: { ... },
 *       isVerified: true,
 *       createdAt: "2024-02-15T14:00:00.000Z"
 *     }
 *   }
 * 
 * WHY include RFC/CURP:
 *   - Mexican tax ID (RFC) and population ID (CURP) are required for banking
 *   - Users need to see/update their official IDs
 *   - Used for KYC (Know Your Customer) compliance
 * ============================================================================
 */
router.get('/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = db.findById('users', req.user.id);

    if (!user) {
      throw new NotFoundError('User');
    }

    // ============================================================================
    // EXCLUDE SENSITIVE FIELDS
    // ============================================================================
    // WHY: Never expose password hash, even to the user themselves
    //   (they might copy it thinking it's their password)
    // ============================================================================
    const { password, ...safeUser } = user;

    res.json({
      success: true,
      data: safeUser,
    });
  })
);

/**
 * ============================================================================
 * PUT /api/users/profile
 * ============================================================================
 * 
 * PURPOSE: Update the authenticated user's profile.
 * 
 * WHY PUT (full replacement):
 *   - Profile updates are comprehensive (name, phone, address, etc.)
 *   - PUT semantics: "Here's the complete new version"
 *   - Requires ALL fields (even unchanged ones)
 *   - Prevents partial updates that might leave inconsistent state
 * 
 * RESTRICTED FIELDS:
 *   - id: Cannot change (primary key)
 *   - email: Requires separate verification flow
 *   - role: Cannot self-promote to admin
 *   - password: Use dedicated /password endpoint
 *   - isVerified: Only admin can verify
 * 
 * REQUEST:
 *   Body: {
 *     firstName: "Juan Carlos",
 *     lastName: "Pérez García",
 *     phone: "+52 33 9999 8888",
 *     dateOfBirth: "1990-07-22",
 *     rfc: "PEGJ900722IJC",
 *     curp: "PEGJ900722HJCRRS09",
 *     address: {
 *       street: "Av. Independencia",
 *       number: "200",
 *       neighborhood: "Centro",
 *       city: "Guadalajara",
 *       state: "Jalisco",
 *       zipCode: "44200",
 *       country: "México"
 *     }
 *   }
 * ============================================================================
 */
router.put('/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = db.findById('users', req.user.id);

    if (!user) {
      throw new NotFoundError('User');
    }

    // ============================================================================
    // EXTRACT AND VALIDATE FIELDS
    // ============================================================================
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      rfc,
      curp,
      address,
    } = req.body;

    // ============================================================================
    // BUILD UPDATES (only allowed fields)
    // ============================================================================
    // WHY whitelist: Prevents mass assignment attacks
    //   User shouldn't be able to change their role, verification status, etc.
    // ============================================================================
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
    if (rfc !== undefined) updates.rfc = rfc;
    if (curp !== undefined) updates.curp = curp;
    if (address) updates.address = address;

    // ============================================================================
    // UPDATE USER
    // ============================================================================
    const updatedUser = db.update('users', user.id, updates);

    const { password, ...safeUser } = updatedUser;

    res.json({
      success: true,
      data: safeUser,
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/users/settings
 * ============================================================================
 * 
 * PURPOSE: Update user settings (notifications, security, display).
 * 
 * WHY PATCH (not PUT):
 *   - Settings are updated frequently (theme toggle, notification prefs)
 *   - PATCH allows partial updates (change one setting without sending all)
 *   - More bandwidth efficient
 *   - Better UX (instant feedback)
 * 
 * SETTINGS STRUCTURE:
 *   {
 *     notifications: {
 *       email: true,
 *       push: true,
 *       sms: false,
 *       transactions: true,
 *       promotions: false,
 *       security: true,
 *       reminders: true
 *     },
 *     security: {
 *       twoFactorEnabled: false,
 *       biometricEnabled: true,
 *       sessionTimeout: 30,
 *       loginNotifications: true
 *     },
 *     display: {
 *       defaultAccount: 1,
 *       showBalances: true,
 *       compactMode: false,
 *       dateFormat: "DD/MM/YYYY"
 *     }
 *   }
 * ============================================================================
 */
router.patch('/settings',
  authenticate,
  asyncHandler(async (req, res) => {
    // ============================================================================
    // FIND OR CREATE SETTINGS
    // ============================================================================
    // WHY find-or-create: New users might not have settings yet
    //   (created during registration but edge cases exist)
    // ============================================================================
    let settings = db.findSettingsByUser(req.user.id);

    if (!settings) {
      // Create default settings
      settings = db.create('userSettings', {
        userId: req.user.id,
        language: 'es',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
          transactions: true,
          promotions: false,
          security: true,
          reminders: true,
        },
        security: {
          twoFactorEnabled: false,
          biometricEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true,
        },
        display: {
          defaultAccount: null,
          showBalances: true,
          compactMode: false,
          dateFormat: 'DD/MM/YYYY',
        },
      });
    }

    // ============================================================================
    // MERGE UPDATES
    // ============================================================================
    // WHY deep merge: Settings are nested objects
    //   Simple spread wouldn't work: { ...old, ...new } would replace entire sections
    //   Deep merge preserves unchanged nested values
    // ============================================================================
    const updates = { ...req.body };
    
    // Deep merge for nested objects
    if (updates.notifications) {
      updates.notifications = { ...settings.notifications, ...updates.notifications };
    }
    if (updates.security) {
      updates.security = { ...settings.security, ...updates.security };
    }
    if (updates.display) {
      updates.display = { ...settings.display, ...updates.display };
    }

    const updatedSettings = db.update('userSettings', settings.id, updates);

    res.json({
      success: true,
      data: updatedSettings,
    });
  })
);

/**
 * ============================================================================
 * PUT /api/users/password
 * ============================================================================
 * 
 * PURPOSE: Change user's password.
 * 
 * SECURITY:
 *   - Requires current password (prevents unauthorized changes)
 *   - New password must meet complexity requirements
 *   - Old token is invalidated (optional, for high security)
 * 
 * REQUEST:
 *   Body: {
 *     currentPassword: "oldPassword123",
 *     newPassword: "newPassword456",
 *     confirmPassword: "newPassword456"
 *   }
 * 
 * WHY require current password:
 *   - Even if someone steals a session, they can't change password
 *   - Prevents unauthorized account takeover
 *   - Standard security practice
 * 
 * WHY invalidate old token:
 *   - If attacker has stolen token, they lose access after password change
 *   - User must login again with new password
 *   - Optional but recommended for banking apps
 * ============================================================================
 */
router.put('/password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ============================================================================
    // VALIDATE INPUT
    // ============================================================================
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current and new passwords are required');
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError('New passwords do not match');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    // ============================================================================
    // VERIFY CURRENT PASSWORD
    // ============================================================================
    // WHY: Prevents unauthorized password changes
    // ============================================================================
    const user = db.findById('users', req.user.id);
    const hashedCurrentPassword = simpleHash(currentPassword);

    if (hashedCurrentPassword !== user.password) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // ============================================================================
    // UPDATE PASSWORD
    // ============================================================================
    // WHY hash immediately: Never store plain text passwords
    // ============================================================================
    db.update('users', user.id, {
      password: simpleHash(newPassword),
    });

    // ============================================================================
    // OPTIONAL: INVALIDATE ALL TOKENS
    // ============================================================================
    // WHY: If attacker has stolen a token, they lose access
    //   In production, you'd blacklist all tokens for this user
    //   and require re-authentication on all devices
    // ============================================================================
    // In a real app: await invalidateAllUserTokens(user.id);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  })
);

/**
 * ============================================================================
 * GET /api/users/preferences
 * ============================================================================
 * 
 * PURPOSE: Get user preferences (language, theme, timezone, etc.).
 * 
 * WHY separate from settings:
 *   - Preferences are UI/display related
 *   - Settings include security and notifications
 *   - Different update frequencies (preferences change often)
 *   - Easier to cache independently
 * 
 * PREFERENCES:
 *   - Language: es, en
 *   - Currency: MXN, USD
 *   - Timezone: America/Mexico_City, etc.
 *   - Theme: light, dark, auto
 *   - Date format: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
 * ============================================================================
 */
router.get('/preferences',
  authenticate,
  asyncHandler(async (req, res) => {
    let settings = db.findSettingsByUser(req.user.id);

    if (!settings) {
      // Return defaults if no settings exist
      settings = {
        language: 'es',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
        theme: 'light',
        dateFormat: 'DD/MM/YYYY',
      };
    }

    res.json({
      success: true,
      data: {
        language: settings.language,
        currency: settings.currency,
        timezone: settings.timezone,
        theme: settings.theme,
        dateFormat: settings.display ? settings.display.dateFormat : 'DD/MM/YYYY',
      },
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/users/preferences
 * ============================================================================
 * 
 * PURPOSE: Update user preferences (partial update).
 * 
 * WHY PATCH:
 *   - Users typically change one preference at a time (theme, language)
 *   - PATCH allows partial updates
 *   - More efficient than PUT (don't need to send all preferences)
 * 
 * EXAMPLE:
 *   PATCH /api/users/preferences
 *   Body: { theme: "dark" }
 * 
 * Only changes the theme, leaves everything else unchanged.
 * ============================================================================
 */
router.patch('/preferences',
  authenticate,
  asyncHandler(async (req, res) => {
    let settings = db.findSettingsByUser(req.user.id);

    if (!settings) {
      // Create default settings first
      settings = db.create('userSettings', {
        userId: req.user.id,
        language: 'es',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
          transactions: true,
          promotions: false,
          security: true,
          reminders: true,
        },
        security: {
          twoFactorEnabled: false,
          biometricEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true,
        },
        display: {
          defaultAccount: null,
          showBalances: true,
          compactMode: false,
          dateFormat: 'DD/MM/YYYY',
        },
      });
    }

    // ============================================================================
    // UPDATE ONLY PROVIDED PREFERENCES
    // ============================================================================
    const { language, currency, timezone, theme, dateFormat } = req.body;

    const updates = {};
    if (language) updates.language = language;
    if (currency) updates.currency = currency;
    if (timezone) updates.timezone = timezone;
    if (theme) updates.theme = theme;

    // Handle display preferences separately
    if (dateFormat) {
      updates.display = { ...settings.display, dateFormat };
    }

    const updatedSettings = db.update('userSettings', settings.id, updates);

    res.json({
      success: true,
      data: {
        language: updatedSettings.language,
        currency: updatedSettings.currency,
        timezone: updatedSettings.timezone,
        theme: updatedSettings.theme,
        dateFormat: updatedSettings.display ? updatedSettings.display.dateFormat : 'DD/MM/YYYY',
      },
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
