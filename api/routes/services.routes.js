/**
 * ============================================================================
 * SMARTBANK - BILL PAYMENT SERVICES ROUTES
 * ============================================================================
 * 
 * PURPOSE: Handle bill payments to service providers (utilities, phone, etc.).
 *   This is a MAJOR feature in Mexican banking apps ("Pago de Servicios").
 * 
 * MEXICAN CONTEXT:
 *   - CFE (electricity), Telmex (internet), Telcel (mobile), Sky (TV)
 *   - Users pay bills directly from their bank account
 *   - Payments can be one-time or recurring
 *   - Some providers support automatic payments
 * 
 * EXTERNAL API INTEGRATION PATTERN:
 *   - Real apps call external APIs (CFE, Telcel, etc.) to validate accounts
 *   - We SIMULATE this with seed data
 *   - In production, you'd use:
 *     - SOAP APIs (many Mexican providers still use SOAP)
 *     - REST APIs (newer providers)
 *     - Payment aggregators (OpenPay, Conekta)
 * 
 * ENDPOINTS:
 *   GET    /api/services                    → List available providers
 *   GET    /api/services/:providerId/validate/:accountNumber → Validate account
 *   POST   /api/services/pay                → Pay a bill
 *   GET    /api/services/history            → Payment history
 * 
 * WHY THESE ENDPOINTS:
 *   - List providers: User needs to see what they can pay
 *   - Validate account: Check if the account number is valid with the provider
 *   - Pay: Process the payment
 *   - History: View past payments
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');

/**
 * ============================================================================
 * GET /api/services
 * ============================================================================
 * 
 * PURPOSE: List all available service providers.
 * 
 * QUERY PARAMETERS:
 *   - category: Filter by category (electricity, phone, internet, etc.)
 * 
 * WHY list providers:
 *   - User needs to see what services they can pay
 *   - Different providers have different requirements
 *   - Provider info includes commission fees, payment methods, limits
 * ============================================================================
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { category } = req.query;

    const filters = { isActive: true };
    if (category) filters.category = category;

    const providers = db.findAll('serviceProviders', filters);

    res.json({
      success: true,
      data: providers,
    });
  })
);

/**
 * ============================================================================
 * GET /api/services/:providerId/validate/:accountNumber
 * ============================================================================
 * 
 * PURPOSE: Validate an account number with a service provider.
 * 
 * WHY validate before paying:
 *   - Confirms the account number exists at the provider
 *   - Returns the account holder's name for confirmation
 *   - Prevents paying the wrong account
 *   - Checks if there's a pending balance
 * 
 * SIMULATION:
 *   - In real apps, this calls the provider's API (CFE, Telcel, etc.)
 *   - We simulate with seed data
 *   - Real integration requires:
 *     - Provider API credentials
 *     - SOAP/REST client
 *     - Error handling for provider downtime
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       valid: true,
 *       accountHolder: "Juan Pérez García",
 *       pendingAmount: 850.00,
 *       dueDate: "2024-07-15",
 *       accountType: "Residencial"
 *     }
 *   }
 * ============================================================================
 */
router.get('/:providerId/validate/:accountNumber',
  authenticate,
  asyncHandler(async (req, res) => {
    const { providerId, accountNumber } = req.params;

    // ============================================================================
    // FIND PROVIDER
    // ============================================================================
    const provider = db.findById('serviceProviders', providerId);

    if (!provider) {
      throw new NotFoundError('Service provider', providerId);
    }

    if (!provider.isActive) {
      throw new ValidationError('This service provider is currently unavailable');
    }

    // ============================================================================
    // VALIDATE ACCOUNT NUMBER FORMAT
    // ============================================================================
    // WHY: First validate format before calling external API
    //   Saves API calls for obviously invalid numbers
    // ============================================================================
    if (accountNumber.length !== provider.accountNumberLength) {
      return res.json({
        success: true,
        data: {
          valid: false,
          message: `Account number must be ${provider.accountNumberLength} digits`,
        },
      });
    }

    // ============================================================================
    // SIMULATE PROVIDER API CALL
    // ============================================================================
    // WHY simulation: We can't call real CFE/Telcel APIs in a demo
    //   In production, this would be:
    //     const response = await axios.get(`https://api.cfe.mx/validate/${accountNumber}`);
    // 
    // REAL INTEGRATION CHALLENGES:
    //   - Provider APIs are often unreliable (downtime, slow responses)
    //   - Need retry logic with exponential backoff
    //   - Must handle provider errors gracefully
    //   - May need to cache responses (rate limiting from providers)
    // ============================================================================
    const isValidFormat = provider.accountNumberPattern
      ? new RegExp(provider.accountNumberPattern).test(accountNumber)
      : true;

    if (!isValidFormat) {
      return res.json({
        success: true,
        data: {
          valid: false,
          message: 'Invalid account number format',
        },
      });
    }

    // ============================================================================
    // SIMULATED VALIDATION RESPONSE
    // ============================================================================
    // WHY mock data: Simulates a successful validation
    //   In real app, this data comes from the provider API
    // ============================================================================
    const mockValidation = {
      valid: true,
      accountHolder: req.user.firstName + ' ' + req.user.lastName,
      pendingAmount: Math.floor(Math.random() * 2000) + 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      accountType: 'Residencial',
      providerName: provider.fullName,
    };

    res.json({
      success: true,
      data: mockValidation,
    });
  })
);

/**
 * ============================================================================
 * POST /api/services/pay
 * ============================================================================
 * 
 * PURPOSE: Pay a service bill.
 * 
 * REQUEST:
 *   Body: {
 *     providerId: 1,
 *     accountNumber: "1234567890",
 *     amount: 850.00,
 *     fromAccountId: 1,
 *     description: "Pago de luz CFE - Julio 2024"
 *   }
 * 
 * PAYMENT FLOW:
 *   1. Validate account with provider
 *   2. Check sufficient funds
 *   3. Deduct from user's account
 *   4. Create transaction record
 *   5. Submit payment to provider (simulated)
 *   6. Send confirmation notification
 * 
 * WHY two-step process:
 *   - Step 1: User selects provider and enters account number
 *   - Step 2: User confirms amount and pays
 *   - This prevents accidental payments
 * ============================================================================
 */
router.post('/pay',
  authenticate,
  asyncHandler(async (req, res) => {
    const { providerId, accountNumber, amount, fromAccountId, description } = req.body;

    // ============================================================================
    // VALIDATE INPUT
    // ============================================================================
    if (!providerId || !accountNumber || !amount || !fromAccountId) {
      throw new ValidationError('All fields are required');
    }

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    // ============================================================================
    // FIND PROVIDER
    // ============================================================================
    const provider = db.findById('serviceProviders', providerId);

    if (!provider) {
      throw new NotFoundError('Service provider', providerId);
    }

    if (!provider.isActive) {
      throw new ValidationError('This service provider is currently unavailable');
    }

    // ============================================================================
    // FIND SOURCE ACCOUNT
    // ============================================================================
    const account = db.findById('accounts', fromAccountId);

    if (!account || account.userId !== req.user.id) {
      throw new NotFoundError('Account', fromAccountId);
    }

    if (account.status !== 'active') {
      throw new ValidationError(`Cannot pay from a ${account.status} account`);
    }

    // ============================================================================
    // CHECK SUFFICIENT BALANCE
    // ============================================================================
    const totalAmount = amount + (provider.commission || 0);

    if (account.balance < totalAmount) {
      throw new ValidationError('Insufficient funds', {
        available: account.balance,
        required: totalAmount,
        commission: provider.commission || 0,
      });
    }

    // ============================================================================
    // CHECK PAYMENT LIMITS
    // ============================================================================
    if (amount > provider.maxAmount) {
      throw new ValidationError(`Maximum payment amount is $${provider.maxAmount} MXN`);
    }

    if (amount < provider.minAmount) {
      throw new ValidationError(`Minimum payment amount is $${provider.minAmount} MXN`);
    }

    // ============================================================================
    // CREATE TRANSACTION
    // ============================================================================
    const reference = `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newTransaction = db.create('transactions', {
      userId: req.user.id,
      accountId: fromAccountId,
      type: 'payment',
      amount: -totalAmount, // Negative for outgoing (including commission)
      currency: 'MXN',
      description: description || `Pago ${provider.name} - ${accountNumber}`,
      reference,
      status: 'completed',
      balanceAfter: account.balance - totalAmount,
      metadata: {
        providerId: provider.id,
        providerName: provider.fullName,
        accountNumber,
        serviceType: provider.category,
        commission: provider.commission || 0,
      },
    });

    // ============================================================================
    // UPDATE BALANCE
    // ============================================================================
    db.update('accounts', fromAccountId, {
      balance: account.balance - totalAmount,
    });

    // ============================================================================
    // CREATE NOTIFICATION
    // ============================================================================
    db.create('notifications', {
      userId: req.user.id,
      type: 'transaction',
      title: `Pago ${provider.name} procesado`,
      message: `Pago de $${amount.toLocaleString('es-MX')} MXN a ${provider.fullName}`,
      isRead: false,
      priority: 'normal',
      metadata: {
        transactionId: newTransaction.id,
        providerId: provider.id,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...newTransaction,
        provider: {
          id: provider.id,
          name: provider.name,
          fullName: provider.fullName,
        },
        commission: provider.commission || 0,
        totalPaid: totalAmount,
      },
    });
  })
);

/**
 * ============================================================================
 * GET /api/services/history
 * ============================================================================
 * 
 * PURPOSE: Get payment history for all service providers.
 * 
 * QUERY PARAMETERS:
 *   - providerId: Filter by specific provider
 *   - page, limit: Pagination
 *   - from, to: Date range
 * 
 * WHY separate from transactions:
 *   - Service payments have specific metadata (provider, account number)
 *   - Dedicated endpoint simplifies client code
 *   - Can be cached independently
 * ============================================================================
 */
router.get('/history',
  authenticate,
  asyncHandler(async (req, res) => {
    const { providerId, page = 1, limit = 20, from, to } = req.query;

    // ============================================================================
    // FETCH SERVICE PAYMENTS
    // ============================================================================
    // WHY filter by type='payment': Only service payments, not transfers/deposits
    // ============================================================================
    let payments = db.findAll('transactions', {
      userId: req.user.id,
      type: 'payment',
    });

    // Filter by provider if specified
    if (providerId) {
      payments = payments.filter(
        (p) => p.metadata && p.metadata.providerId === Number(providerId)
      );
    }

    // Filter by date range
    if (from || to) {
      payments = payments.filter((p) => {
        const pDate = new Date(p.createdAt);
        if (from && pDate < new Date(from)) return false;
        if (to) {
          const toDate = new Date(to);
          toDate.setDate(toDate.getDate() + 1);
          if (pDate >= toDate) return false;
        }
        return true;
      });
    }

    // Sort by date (newest first)
    payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ============================================================================
    // PAGINATE
    // ============================================================================
    const result = paginate(payments, Number(page), Number(limit));

    // ============================================================================
    // ENRICH WITH PROVIDER INFO
    // ============================================================================
    const enrichedData = result.data.map((p) => ({
      ...p,
      provider: p.metadata ? {
        id: p.metadata.providerId,
        name: p.metadata.providerName,
        accountNumber: p.metadata.accountNumber,
        serviceType: p.metadata.serviceType,
      } : null,
    }));

    res.json({
      success: true,
      data: enrichedData,
      pagination: result.pagination,
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
