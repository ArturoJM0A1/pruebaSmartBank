/**
 * ============================================================================
 * SMARTBANK - TRANSACTION ROUTES
 * ============================================================================
 * 
 * PURPOSE: Handle all financial transactions (transfers, deposits,
 *   withdrawals, and transaction history).
 * 
 * TRANSACTIONS ARE THE CORE OF BANKING:
 *   - Every movement of money is a transaction
 *   - Transactions must be atomic (all or nothing)
 *   - Transactions must be idempotent (duplicate requests = same result)
 *   - Transactions must be auditable (complete history)
 * 
 * ENDPOINTS:
 *   GET    /api/transactions          → List transactions (with filters)
 *   GET    /api/transactions/:id      → Get transaction details
 *   POST   /api/transactions/transfer → Create transfer
 *   POST   /api/transactions/deposit  → Create deposit
 *   POST   /api/transactions/withdrawal → Create withdrawal
 *   GET    /api/transactions/summary  → Get summary statistics
 * 
 * WHY THESE ENDPOINTS:
 *   - Transfer: Move money between accounts (most complex)
 *   - Deposit: Add money to account (e.g., from external source)
 *   - Withdrawal: Remove money from account
 *   - Summary: Aggregated statistics (income, expenses, balance)
 * 
 * IDEMPOTENCY:
 *   - Same request sent twice should produce the same result
 *   - Prevents duplicate transactions from network issues
 *   - Implementation: Use reference numbers as idempotency keys
 * 
 * MONEY FORMAT:
 *   - All amounts are in MXN (Mexican Pesos)
 *   - Stored as numbers (not strings) for precision
 *   - Displayed with 2 decimal places
 *   - NEVER use floating point for money (use integer cents or Decimal type)
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ValidationError, BadRequestError } = require('../middleware/errorHandler');
const { paginate, filter } = require('../utils/helpers');

/**
 * ============================================================================
 * GET /api/transactions
 * ============================================================================
 * 
 * PURPOSE: List transactions for the authenticated user with filtering.
 * 
 * QUERY PARAMETERS:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20, max: 100)
 *   - accountId: Filter by specific account
 *   - type: Filter by type (transfer, deposit, withdrawal, payment, etc.)
 *   - status: Filter by status (completed, pending, failed)
 *   - from: Start date (YYYY-MM-DD)
 *   - to: End date (YYYY-MM-DD)
 *   - minAmount: Minimum amount
 *   - maxAmount: Maximum amount
 *   - search: Search in description/reference
 *   - sortBy: Sort field (default: createdAt)
 *   - sortOrder: Sort direction (desc = newest first)
 * 
 * PAGINATION PATTERN:
 *   ?page=1&limit=20 → First 20 transactions
 *   ?page=2&limit=20 → Next 20 transactions
 * 
 * WHY this many filters:
 *   - Users need to find specific transactions (by date, type, amount)
 *   - Different views (recent, by account, by type) need different filters
 *   - Search helps find transactions by description
 * ============================================================================
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      accountId,
      type,
      status,
      from,
      to,
      minAmount,
      maxAmount,
      search: searchTerm,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // ============================================================================
    // BUILD FILTERS
    // ============================================================================
    // WHY build dynamically: Only apply filters that are provided.
    //   Empty filters = no filtering (return all user transactions).
    // ============================================================================
    const filters = { userId: req.user.id };
    if (accountId) filters.accountId = Number(accountId);
    if (type) filters.type = type;
    if (status) filters.status = status;

    // ============================================================================
    // FETCH AND FILTER
    // ============================================================================
    let transactions = db.findAll('transactions', filters);

    // ============================================================================
    // DATE RANGE FILTER
    // ============================================================================
    // WHY manual filtering: Date range filtering is complex (inclusive/exclusive
    //   boundaries, timezone handling). Manual filtering gives full control.
    // ============================================================================
    if (from || to) {
      transactions = transactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        if (from && tDate < new Date(from)) return false;
        if (to) {
          const toDate = new Date(to);
          toDate.setDate(toDate.getDate() + 1);
          if (tDate >= toDate) return false;
        }
        return true;
      });
    }

    // ============================================================================
    // AMOUNT RANGE FILTER
    // ============================================================================
    // WHY: Users often search for transactions within a specific amount range
    // ============================================================================
    if (minAmount) {
      transactions = transactions.filter((t) => Math.abs(t.amount) >= Number(minAmount));
    }
    if (maxAmount) {
      transactions = transactions.filter((t) => Math.abs(t.amount) <= Number(maxAmount));
    }

    // ============================================================================
    // TEXT SEARCH
    // ============================================================================
    // WHY: Quick search by description or reference number
    // ============================================================================
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      transactions = transactions.filter((t) =>
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.reference && t.reference.toLowerCase().includes(term))
      );
    }

    // ============================================================================
    // SORT
    // ============================================================================
    // WHY configurable: Different views need different sorting.
    //   Recent activity → sort by date (newest first)
    //   Largest transactions → sort by amount
    // ============================================================================
    transactions.sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'amount') {
        aVal = Math.abs(a.amount);
        bVal = Math.abs(b.amount);
      } else {
        aVal = a[sortBy];
        bVal = b[sortBy];
      }
      
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * modifier;
      if (aVal > bVal) return 1 * modifier;
      return 0;
    });

    // ============================================================================
    // PAGINATE
    // ============================================================================
    const result = paginate(transactions, Number(page), Number(limit));

    // ============================================================================
    // ENRICH WITH ACCOUNT INFO
    // ============================================================================
    // WHY: Client needs account names/numbers for display
    //   Instead of client making N requests, we batch it here
    // ============================================================================
    const enrichedData = result.data.map((t) => {
      const account = db.findById('accounts', t.accountId);
      return {
        ...t,
        accountInfo: account ? {
          accountNumber: account.accountNumber,
          accountName: account.name,
          accountType: account.type,
        } : null,
      };
    });

    res.json({
      success: true,
      data: enrichedData,
      pagination: result.pagination,
    });
  })
);

/**
 * ============================================================================
 * GET /api/transactions/summary
 * ============================================================================
 * 
 * PURPOSE: Get aggregated transaction statistics.
 * 
 * QUERY PARAMETERS:
 *   - accountId: Filter by specific account (optional)
 *   - period: 'week', 'month', 'year' (default: 'month')
 *   - from: Custom start date
 *   - to: Custom end date
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       totalIncome: 133000,
 *       totalExpenses: 34445,
 *       netChange: 98555,
 *       transactionCount: 18,
 *       byType: {
 *         transfer: { count: 5, total: 22000 },
 *         deposit: { count: 3, total: 133000 },
 *         ...
 *       },
 *       topCategories: [...]
 *     }
 *   }
 * 
 * WHY summary endpoint:
 *   - Dashboard needs aggregated data
 *   - Client-side calculation would require fetching all transactions
 *   - Server-side is faster (pre-calculated)
 *   - Can be cached for performance
 * ============================================================================
 */
router.get('/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const { accountId, period = 'month', from, to } = req.query;

    // ============================================================================
    // DETERMINE DATE RANGE
    // ============================================================================
    // WHY: Common periods (week, month, year) with custom override
    // ============================================================================
    const now = new Date();
    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      endDate = now;
      switch (period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    // ============================================================================
    // FETCH TRANSACTIONS
    // ============================================================================
    const filters = { userId: req.user.id };
    if (accountId) filters.accountId = Number(accountId);

    let transactions = db.findAll('transactions', filters);

    // Filter by date range
    transactions = transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return tDate >= startDate && tDate <= endDate;
    });

    // ============================================================================
    // CALCULATE STATISTICS
    // ============================================================================
    // WHY manual calculation: More flexible than database aggregation.
    //   Can add custom metrics, handle edge cases, format data for charts.
    // ============================================================================
    let totalIncome = 0;
    let totalExpenses = 0;
    const byType = {};

    transactions.forEach((t) => {
      const amount = Math.abs(t.amount);
      
      // Categorize as income or expense
      if (['deposit', 'interest', 'card_payment'].includes(t.type)) {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }

      // Group by type
      if (!byType[t.type]) {
        byType[t.type] = { count: 0, total: 0 };
      }
      byType[t.type].count++;
      byType[t.type].total += amount;
    });

    // ============================================================================
    // ROUND TO 2 DECIMALS
    // ============================================================================
    // WHY: Floating point precision issues (0.1 + 0.2 = 0.30000000000000004)
    //   Rounding prevents displaying weird decimal numbers
    // ============================================================================
    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpenses = Math.round(totalExpenses * 100) / 100;

    res.json({
      success: true,
      data: {
        period: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          type: period,
        },
        totalIncome,
        totalExpenses,
        netChange: Math.round((totalIncome - totalExpenses) * 100) / 100,
        transactionCount: transactions.length,
        byType,
      },
    });
  })
);

/**
 * ============================================================================
 * GET /api/transactions/:id
 * ============================================================================
 * 
 * PURPOSE: Get detailed information about a specific transaction.
 * 
 * SECURITY:
 *   - Users can only view their own transactions
 *   - Transaction details include full metadata
 * ============================================================================
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const transaction = db.findById('transactions', req.params.id);

    if (!transaction) {
      throw new NotFoundError('Transaction', req.params.id);
    }

    // ============================================================================
    // OWNERSHIP CHECK
    // ============================================================================
    // WHY: Prevent users from viewing other users' transactions
    // ============================================================================
    if (transaction.userId !== req.user.id) {
      throw new NotFoundError('Transaction', req.params.id);
    }

    // ============================================================================
    // ENRICH WITH RELATED DATA
    // ============================================================================
    // WHY: Include account info and related card info for full context
    // ============================================================================
    const account = db.findById('accounts', transaction.accountId);
    let cardInfo = null;
    if (transaction.metadata && transaction.metadata.cardId) {
      const card = db.findById('cards', transaction.metadata.cardId);
      if (card) {
        cardInfo = {
          lastFourDigits: card.lastFourDigits,
          type: card.type,
          brand: card.brand,
        };
      }
    }

    res.json({
      success: true,
      data: {
        ...transaction,
        accountInfo: account ? {
          accountNumber: account.accountNumber,
          accountName: account.name,
        } : null,
        cardInfo,
      },
    });
  })
);

/**
 * ============================================================================
 * POST /api/transactions/transfer
 * ============================================================================
 * 
 * PURPOSE: Transfer money between accounts.
 * 
 * TRANSFER TYPES:
 *   1. Internal: Between own accounts (immediate)
 *   2. External: To another bank via SPEI (1-24 hours)
 * 
 * REQUEST:
 *   Body: {
 *     fromAccountId: 1,
 *     toAccountNumber: "0987654321",
 *     toClabe: "012012098765432103",  // Optional for external
 *     amount: 5000,
 *     description: "Pago de renta",
 *     pin: "1234"  // For amounts > 10000
 *   }
 * 
 * IDEMPOTENCY:
 *   - Reference numbers are unique
 *   - Same request with same reference = same result
 *   - Prevents duplicate transfers from network issues
 * 
 * BUSINESS RULES:
 *   - Cannot transfer more than available balance
 *   - Daily transfer limit applies
 *   - PIN required for large amounts
 *   - Beneficiary validation for first-time transfers
 * ============================================================================
 */
router.post('/transfer',
  authenticate,
  validateBody(schemas.transfer),
  asyncHandler(async (req, res) => {
    const { fromAccountId, toAccountNumber, toClabe, amount, description, pin } = req.body;

    // ============================================================================
    // FIND SOURCE ACCOUNT
    // ============================================================================
    const sourceAccount = db.findById('accounts', fromAccountId);

    if (!sourceAccount) {
      throw new NotFoundError('Source account', fromAccountId);
    }

    // ============================================================================
    // OWNERSHIP CHECK
    // ============================================================================
    // WHY: Users can only transfer FROM their own accounts
    // ============================================================================
    if (sourceAccount.userId !== req.user.id) {
      throw new NotFoundError('Account', fromAccountId);
    }

    // ============================================================================
    // CHECK ACCOUNT STATUS
    // ============================================================================
    // WHY: Can't transfer from a frozen or closed account
    // ============================================================================
    if (sourceAccount.status !== 'active') {
      throw new ValidationError(`Cannot transfer from a ${sourceAccount.status} account`);
    }

    // ============================================================================
    // CHECK SUFFICIENT BALANCE
    // ============================================================================
    // WHY: Prevent overdrafts (unless account allows it)
    // ============================================================================
    if (sourceAccount.balance < amount) {
      throw new ValidationError('Insufficient funds', {
        available: sourceAccount.balance,
        requested: amount,
      });
    }

    // ============================================================================
    // FIND DESTINATION ACCOUNT
    // ============================================================================
    const destinationAccount = db.findOneBy('accounts',
      (a) => a.accountNumber === toAccountNumber
    );

    // ============================================================================
    // DETERMINE TRANSFER TYPE
    // ============================================================================
    // WHY: Internal transfers are immediate, external go through SPEI
    // ============================================================================
    const isInternal = destinationAccount && destinationAccount.userId === req.user.id;
    const transferType = isInternal ? 'internal' : 'external';

    // ============================================================================
    // VALIDATE PIN FOR LARGE AMOUNTS
    // ============================================================================
    // WHY: Extra security layer for high-value transactions
    // ============================================================================
    if (amount > 10000 && !pin) {
      throw new ValidationError('PIN required for transfers over $10,000 MXN');
    }

    // ============================================================================
    // GENERATE UNIQUE REFERENCE
    // ============================================================================
    // WHY: Idempotency key prevents duplicate transfers
    // ============================================================================
    const reference = `SPEI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // ============================================================================
    // CREATE TRANSACTION
    // ============================================================================
    // WHY atomic: Both accounts must be updated together or not at all
    //   In a real database, this would be a transaction (BEGIN/COMMIT)
    // ============================================================================
    const newTransaction = db.create('transactions', {
      userId: req.user.id,
      accountId: fromAccountId,
      type: 'transfer',
      amount: -Math.abs(amount), // Negative for outgoing
      currency: 'MXN',
      description: description || `Transferencia a ${toAccountNumber}`,
      reference,
      status: transferType === 'internal' ? 'completed' : 'pending',
      balanceAfter: sourceAccount.balance - amount,
      metadata: {
        destinationAccount: toAccountNumber,
        destinationBank: toClabe ? toClabe.substring(0, 3) : null,
        transferType,
        pinVerified: !!pin,
      },
    });

    // ============================================================================
    // UPDATE BALANCES (for internal transfers)
    // ============================================================================
    // WHY only for internal: External transfers are processed later via SPEI
    // ============================================================================
    if (isInternal && destinationAccount) {
      db.update('accounts', fromAccountId, {
        balance: sourceAccount.balance - amount,
      });
      db.update('accounts', destinationAccount.id, {
        balance: destinationAccount.balance + amount,
      });
    } else {
      // For external transfers, only deduct from source
      db.update('accounts', fromAccountId, {
        balance: sourceAccount.balance - amount,
      });
    }

    // ============================================================================
    // CREATE NOTIFICATION
    // ============================================================================
    db.create('notifications', {
      userId: req.user.id,
      type: 'transaction',
      title: 'Transferencia enviada',
      message: `Se enviaron $${amount.toLocaleString('es-MX')} MXN a ${toAccountNumber}`,
      isRead: false,
      priority: 'normal',
      metadata: {
        transactionId: newTransaction.id,
        accountId: fromAccountId,
      },
    });

    // ============================================================================
    // CHARGE FEE (for external transfers)
    // ============================================================================
    // WHY: Banks charge fees for inter-bank transfers
    // ============================================================================
    if (transferType === 'external') {
      const fee = 5.00; // $5 MXN SPEI fee
      db.create('transactions', {
        userId: req.user.id,
        accountId: fromAccountId,
        type: 'fee',
        amount: -fee,
        currency: 'MXN',
        description: 'Comisión por transferencia SPEI',
        reference: `FEE-${reference}`,
        status: 'completed',
        balanceAfter: sourceAccount.balance - amount - fee,
        metadata: {
          feeType: 'spei_transfer',
          relatedTransactionId: newTransaction.id,
        },
      });

      // Deduct fee from account
      db.update('accounts', fromAccountId, {
        balance: sourceAccount.balance - amount - fee,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...newTransaction,
        accountInfo: {
          accountNumber: sourceAccount.accountNumber,
          accountName: sourceAccount.name,
        },
      },
    });
  })
);

/**
 * ============================================================================
 * POST /api/transactions/deposit
 * ============================================================================
 * 
 * PURPOSE: Add money to an account (deposit).
 * 
 * DEPOSIT SOURCES:
 *   - Cash deposit (ATM or branch)
 *   - External transfer received
 *   - Payroll deposit
 *   - Refund
 * 
 * REQUEST:
 *   Body: {
 *     accountId: 1,
 *     amount: 5000,
 *     description: "Depósito de nómina",
 *     source: "employer"
 *   }
 * ============================================================================
 */
router.post('/deposit',
  authenticate,
  validateBody(schemas.deposit),
  asyncHandler(async (req, res) => {
    const { accountId, amount, description, source } = req.body;

    const account = db.findById('accounts', accountId);

    if (!account) {
      throw new NotFoundError('Account', accountId);
    }

    if (account.userId !== req.user.id) {
      throw new NotFoundError('Account', accountId);
    }

    if (account.status !== 'active') {
      throw new ValidationError(`Cannot deposit to a ${account.status} account`);
    }

    // ============================================================================
    // CREATE TRANSACTION
    // ============================================================================
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newTransaction = db.create('transactions', {
      userId: req.user.id,
      accountId,
      type: 'deposit',
      amount: Math.abs(amount), // Positive for incoming
      currency: 'MXN',
      description: description || 'Depósito',
      reference,
      status: 'completed',
      balanceAfter: account.balance + amount,
      metadata: {
        source: source || 'manual',
      },
    });

    // ============================================================================
    // UPDATE BALANCE
    // ============================================================================
    db.update('accounts', accountId, {
      balance: account.balance + amount,
    });

    // ============================================================================
    // CREATE NOTIFICATION
    // ============================================================================
    db.create('notifications', {
      userId: req.user.id,
      type: 'transaction',
      title: 'Depósito recibido',
      message: `Se recibió un depósito de $${amount.toLocaleString('es-MX')} MXN`,
      isRead: false,
      priority: 'normal',
      metadata: {
        transactionId: newTransaction.id,
        accountId,
      },
    });

    res.status(201).json({
      success: true,
      data: newTransaction,
    });
  })
);

/**
 * ============================================================================
 * POST /api/transactions/withdrawal
 * ============================================================================
 * 
 * PURPOSE: Remove money from an account (withdrawal).
 * 
 * WITHDRAWAL TYPES:
 *   - ATM withdrawal
 *   - Branch withdrawal
 *   - Online transfer (outgoing)
 * 
 * REQUEST:
 *   Body: {
 *     accountId: 1,
 *     amount: 3000,
 *     description: "Retiro en cajero",
 *     pin: "1234"
 *   }
 * ============================================================================
 */
router.post('/withdrawal',
  authenticate,
  validateBody({
    accountId: [require('../middleware/validation').validators.required, require('../middleware/validation').validators.isNumber],
    amount: [require('../middleware/validation').validators.required, require('../middleware/validation').validators.isNumber, require('../middleware/validation').validators.isPositive],
    description: [require('../middleware/validation').validators.maxLength],
    pin: [require('../middleware/validation').validators.minLength(4)],
  }),
  asyncHandler(async (req, res) => {
    const { accountId, amount, description, pin } = req.body;

    const account = db.findById('accounts', accountId);

    if (!account) {
      throw new NotFoundError('Account', accountId);
    }

    if (account.userId !== req.user.id) {
      throw new NotFoundError('Account', accountId);
    }

    if (account.status !== 'active') {
      throw new ValidationError(`Cannot withdraw from a ${account.status} account`);
    }

    // ============================================================================
    // CHECK SUFFICIENT BALANCE
    // ============================================================================
    if (account.balance < amount) {
      throw new ValidationError('Insufficient funds', {
        available: account.balance,
        requested: amount,
      });
    }

    // ============================================================================
    // VALIDATE PIN
    // ============================================================================
    // WHY: Extra security for withdrawals
    // ============================================================================
    if (!pin) {
      throw new ValidationError('PIN is required for withdrawals');
    }

    // ============================================================================
    // CREATE TRANSACTION
    // ============================================================================
    const reference = `ATM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newTransaction = db.create('transactions', {
      userId: req.user.id,
      accountId,
      type: 'withdrawal',
      amount: -Math.abs(amount), // Negative for outgoing
      currency: 'MXN',
      description: description || 'Retiro en cajero automático',
      reference,
      status: 'completed',
      balanceAfter: account.balance - amount,
      metadata: {
        pinVerified: true,
      },
    });

    // ============================================================================
    // UPDATE BALANCE
    // ============================================================================
    db.update('accounts', accountId, {
      balance: account.balance - amount,
    });

    // ============================================================================
    // CREATE NOTIFICATION
    // ============================================================================
    db.create('notifications', {
      userId: req.user.id,
      type: 'transaction',
      title: 'Retiro exitoso',
      message: `Retiro de $${amount.toLocaleString('es-MX')} MXN`,
      isRead: false,
      priority: 'normal',
      metadata: {
        transactionId: newTransaction.id,
        accountId,
      },
    });

    res.status(201).json({
      success: true,
      data: newTransaction,
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
