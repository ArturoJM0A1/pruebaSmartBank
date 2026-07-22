/**
 * ============================================================================
 * SMARTBANK - ACCOUNT ROUTES
 * ============================================================================
 * 
 * PURPOSE: CRUD operations for bank accounts. Users can view their own
 *   accounts; admins can manage all accounts.
 * 
 * REST CONVENTIONS FOR ACCOUNTS:
 *   GET    /api/accounts          → List user's accounts
 *   GET    /api/accounts/:id      → Get account details
 *   GET    /api/accounts/:id/balance → Get current balance
 *   GET    /api/accounts/:id/statement → Get statement (date range)
 *   POST   /api/accounts          → Create new account
 *   PATCH  /api/accounts/:id      → Update account (partial)
 *   DELETE /api/accounts/:id      → Close/delete account
 * 
 * WHY THESE VERBS:
 *   - GET: Read-only, safe, idempotent (calling multiple times = same result)
 *   - POST: Creates new resource (not idempotent - calling twice creates two)
 *   - PATCH: Partial update (only changed fields)
 *   - DELETE: Remove resource (idempotent - deleting twice = same result)
 * 
 * WHY NOT PUT:
 *   - PUT requires sending the ENTIRE resource
 *   - PATCH only sends changed fields (more efficient)
 *   - For account updates (freeze/unfreeze), PATCH is more appropriate
 * 
 * DATA ISOLATION:
 *   - Regular users can ONLY see their own accounts
 *   - Admins can see ALL accounts
 *   - This is enforced by checkAccountOwnership middleware
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, authorize, checkAccountOwnership } = require('../middleware/auth');
const { validateBody, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ValidationError, ForbiddenError } = require('../middleware/errorHandler');
const { paginate, filter } = require('../utils/helpers');
const { generateAccountNumber } = require('../utils/helpers');

/**
 * ============================================================================
 * GET /api/accounts
 * ============================================================================
 * 
 * PURPOSE: List all accounts for the authenticated user (or all accounts for admin).
 * 
 * QUERY PARAMETERS:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - type: Filter by type (checking, savings)
 *   - status: Filter by status (active, frozen, closed)
 *   - sortBy: Sort field (default: createdAt)
 *   - sortOrder: Sort direction (asc, desc)
 * 
 * PAGINATION PATTERN:
 *   ?page=1&limit=10 → First 10 accounts
 *   ?page=2&limit=10 → Next 10 accounts
 * 
 * WHY pagination: Prevents returning thousands of records at once.
 *   Even though most users have 2-5 accounts, the pattern should be
 *   consistent across all list endpoints.
 * ============================================================================
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, type, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // ============================================================================
    // BUILD FILTERS
    // ============================================================================
    // WHY build filters object: Dynamic filtering based on query params.
    //   Only include filters that are actually provided.
    // ============================================================================
    const filters = {};
    if (req.user.role !== 'admin') {
      filters.userId = req.user.id; // WHY: Regular users only see their accounts
    }
    if (type) filters.type = type;
    if (status) filters.status = status;

    // ============================================================================
    // FETCH AND FILTER
    // ============================================================================
    let accounts = db.findAll('accounts', filters);

    // ============================================================================
    // SORT
    // ============================================================================
    // WHY configurable sorting: Different use cases need different order.
    //   Default to newest first (most recent activity).
    // ============================================================================
    accounts.sort((a, b) => {
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
    const result = paginate(accounts, Number(page), Number(limit));

    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * ============================================================================
 * GET /api/accounts/:id
 * ============================================================================
 * 
 * PURPOSE: Get detailed information about a specific account.
 * 
 * WHY include checkAccountOwnership:
 *   - Regular users can only view their own accounts
 *   - Admins can view any account
 *   - Prevents horizontal privilege escalation (user A viewing user B's account)
 * 
 * RESPONSE INCLUDES:
 *   - Account details (number, type, balance, status)
 *   - Recent transactions (last 5)
 *   - Linked cards
 * ============================================================================
 */
router.get('/:id',
  authenticate,
  checkAccountOwnership,
  asyncHandler(async (req, res) => {
    const account = req.targetAccount; // Attached by checkAccountOwnership middleware

    // ============================================================================
    // ENRICH RESPONSE
    // ============================================================================
    // WHY include related data: Saves client from making 3 separate API calls
    //   (get account, get transactions, get cards). This is called "eager loading"
    //   or "compound endpoint" pattern.
    // 
    // TRADE-OFF: More data per response vs. fewer requests.
    //   For mobile apps (slow networks), fewer requests usually wins.
    // ============================================================================
    const recentTransactions = db.findAll('transactions', { accountId: account.id })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const linkedCards = db.findAll('cards', { accountId: account.id });

    res.json({
      success: true,
      data: {
        ...account,
        recentTransactions,
        linkedCards,
      },
    });
  })
);

/**
 * ============================================================================
 * GET /api/accounts/:id/balance
 * ============================================================================
 * 
 * PURPOSE: Get real-time balance for an account.
 * 
 * WHY separate endpoint:
 *   - Balance is frequently requested (home screen refresh)
 *   - Separate endpoint allows caching (balance changes less often)
 *   - Lighter payload than full account details
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       accountId: 1,
 *       balance: 125450.75,
 *       currency: "MXN",
 *       lastUpdated: "2024-07-01T09:00:00.000Z"
 *     }
 *   }
 * ============================================================================
 */
router.get('/:id/balance',
  authenticate,
  checkAccountOwnership,
  asyncHandler(async (req, res) => {
    const account = req.targetAccount;

    res.json({
      success: true,
      data: {
        accountId: account.id,
        balance: account.balance,
        currency: account.currency,
        lastUpdated: account.updatedAt || account.createdAt,
      },
    });
  })
);

/**
 * ============================================================================
 * GET /api/accounts/:id/statement
 * ============================================================================
 * 
 * PURPOSE: Get account statement for a date range.
 * 
 * QUERY PARAMETERS:
 *   - from: Start date (YYYY-MM-DD)
 *   - to: End date (YYYY-MM-DD)
 *   - type: Filter by transaction type
 *   - page: Page number
 *   - limit: Items per page
 * 
 * WHY date range:
 *   - Users need to see transactions for specific periods
 *   - Monthly statements are common in banking
 *   - Allows custom date ranges for analysis
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       account: { ... },
 *       period: { from: "2024-07-01", to: "2024-07-31" },
 *       summary: { totalIncome, totalExpenses, netChange },
 *       transactions: [ ... ],
 *       pagination: { ... }
 *     }
 *   }
 * ============================================================================
 */
router.get('/:id/statement',
  authenticate,
  checkAccountOwnership,
  asyncHandler(async (req, res) => {
    const account = req.targetAccount;
    const { from, to, type, page = 1, limit = 50 } = req.query;

    // ============================================================================
    // BUILD DATE FILTER
    // ============================================================================
    // WHY default to current month: Most common use case is "show me this month"
    // ============================================================================
    const now = new Date();
    const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

    const filters = { accountId: account.id };
    if (type) filters.type = type;

    // ============================================================================
    // FETCH AND FILTER TRANSACTIONS
    // ============================================================================
    let transactions = db.findAll('transactions', filters);

    // Apply date range filter manually (more flexible than database filter)
    if (from || to) {
      transactions = transactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        if (from && tDate < new Date(from)) return false;
        if (to) {
          const toDate = new Date(to);
          toDate.setDate(toDate.getDate() + 1); // Include end date
          if (tDate >= toDate) return false;
        }
        return true;
      });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ============================================================================
    // CALCULATE SUMMARY
    // ============================================================================
    // WHY: Statement should include totals so users don't have to calculate manually
    // ============================================================================
    const totalIncome = transactions
      .filter((t) => ['deposit', 'transfer', 'interest'].includes(t.type) && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => ['withdrawal', 'payment', 'card_charge', 'fee', 'transfer'].includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // ============================================================================
    // PAGINATE
    // ============================================================================
    const result = paginate(transactions, Number(page), Number(limit));

    res.json({
      success: true,
      data: {
        account: {
          id: account.id,
          accountNumber: account.accountNumber,
          type: account.type,
          name: account.name,
        },
        period: {
          from: from || defaultFrom,
          to: to || defaultTo,
        },
        summary: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          netChange: Math.round((totalIncome - totalExpenses) * 100) / 100,
          transactionCount: transactions.length,
        },
        ...result,
      },
    });
  })
);

/**
 * ============================================================================
 * POST /api/accounts
 * ============================================================================
 * 
 * PURPOSE: Create a new bank account.
 * 
 * WHY admin only:
 *   - In real banking, account creation requires KYC (Know Your Customer)
 *   - Only bank employees can create accounts
 *   - Regular users can't create accounts on their own
 * 
 * REQUEST:
 *   Body: {
 *     userId: 2,
 *     type: "checking",
 *     name: "Cuenta de Nómina",
 *     currency: "MXN"
 *   }
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       id: 7,
 *       accountNumber: "0123456789",
 *       clabe: "002012012345678901",
 *       type: "checking",
 *       name: "Cuenta de Nómina",
 *       balance: 0,
 *       status: "active"
 *     }
 *   }
 * ============================================================================
 */
router.post('/',
  authenticate,
  authorize('admin'),
  validateBody(schemas.createAccount),
  asyncHandler(async (req, res) => {
    const { userId, type, name, currency = 'MXN' } = req.body;

    // ============================================================================
    // VERIFY TARGET USER EXISTS
    // ============================================================================
    // WHY: Can't create an account for a non-existent user
    // ============================================================================
    const targetUser = db.findById('users', userId);
    if (!targetUser) {
      throw new NotFoundError('User', userId);
    }

    // ============================================================================
    // GENERATE REALISTIC ACCOUNT NUMBERS
    // ============================================================================
    // WHY realistic: Mock data should look real for demo purposes
    // ============================================================================
    const accountData = generateAccountNumber();

    const newAccount = db.create('accounts', {
      userId,
      accountNumber: accountData.accountNumber,
      clabe: accountData.clabe,
      type,
      name,
      balance: 0, // WHY 0: New accounts start with zero balance
      currency,
      status: 'active',
      closedAt: null,
    });

    res.status(201).json({
      success: true,
      data: newAccount,
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/accounts/:id
 * ============================================================================
 * 
 * PURPOSE: Partially update an account (freeze, unfreeze, rename).
 * 
 * WHY PATCH (not PUT):
 *   - We only send fields that changed
 *   - Doesn't require sending the entire account object
 *   - More bandwidth-efficient, less error-prone
 * 
 * EXAMPLE UPDATES:
 *   - Freeze account: { status: "frozen" }
 *   - Unfreeze account: { status: "active" }
 *   - Rename account: { name: "New Name" }
 * 
 * WHO CAN UPDATE:
 *   - Admin: Any account (freeze, unfreeze, close)
 *   - User: Only their own accounts (rename only)
 * ============================================================================
 */
router.patch('/:id',
  authenticate,
  checkAccountOwnership,
  asyncHandler(async (req, res) => {
    const account = req.targetAccount;
    const updates = req.body;

    // ============================================================================
    // RESTRICT WHAT CAN BE UPDATED
    // ============================================================================
    // WHY whitelist fields: Prevents mass assignment attacks.
    //   User shouldn't be able to change userId, balance, or accountNumber.
    //   Only specific fields are allowed to be updated.
    // ============================================================================
    const allowedFields = ['name', 'status'];
    const allowedStatuses = ['active', 'frozen'];

    // If not admin, can only update name (not status)
    if (req.user.role !== 'admin') {
      if (updates.status) {
        throw new ForbiddenError('Only administrators can change account status');
      }
      allowedFields.splice(1); // Remove 'status' from allowed fields
    }

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Validate status if provided
    if (filteredUpdates.status && !allowedStatuses.includes(filteredUpdates.status)) {
      throw new ValidationError('Invalid status', {
        status: `Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    // ============================================================================
    // APPLY UPDATES
    // ============================================================================
    const updatedAccount = db.update('accounts', account.id, filteredUpdates);

    res.json({
      success: true,
      data: updatedAccount,
    });
  })
);

/**
 * ============================================================================
 * DELETE /api/accounts/:id
 * ============================================================================
 * 
 * PURPOSE: Close/delete a bank account.
 * 
 * WHY admin only:
 *   - Closing accounts is a significant financial operation
 *   - Requires verification of pending transactions
 *   - In real banking, this involves paperwork and waiting periods
 * 
 * WHY soft delete (set status to 'closed'):
 *   - Financial records must be preserved (legal requirement)
 *   - Can't truly delete transaction history
 *   - Account remains in database but is no longer accessible
 *   - "Hard delete" would break referential integrity
 * 
 * REQUEST:
 *   Body: { reason: "Customer request" } (optional)
 * ============================================================================
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const account = db.findById('accounts', req.params.id);

    if (!account) {
      throw new NotFoundError('Account', req.params.id);
    }

    // ============================================================================
    // CHECK FOR PENDING TRANSACTIONS
    // ============================================================================
    // WHY: Can't close an account with pending transactions.
    //   This prevents financial inconsistencies.
    // ============================================================================
    const pendingTransactions = db.findAll('transactions', {
      accountId: account.id,
      status: 'pending',
    });

    if (pendingTransactions.length > 0) {
      throw new ValidationError(
        'Cannot close account with pending transactions',
        { pendingCount: pendingTransactions.length }
      );
    }

    // ============================================================================
    // SOFT DELETE (Mark as closed)
    // ============================================================================
    // WHY not hard delete: Financial regulations require keeping records.
    //   The account is marked as closed but remains in the database.
    // ============================================================================
    db.update('accounts', account.id, {
      status: 'closed',
      closedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Account closed successfully',
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
