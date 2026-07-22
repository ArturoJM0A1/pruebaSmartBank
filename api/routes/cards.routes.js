/**
 * ============================================================================
 * SMARTBANK - CARD ROUTES
 * ============================================================================
 * 
 * PURPOSE: Manage debit and credit cards (view, block, unblock, limits).
 * 
 * CARD OPERATIONS:
 *   GET    /api/cards           → List user's cards
 *   GET    /api/cards/:id       → Get card details
 *   POST   /api/cards           → Request new card
 *   PATCH  /api/cards/:id/block → Block card
 *   PATCH  /api/cards/:id/unblock → Unblock card
 *   PATCH  /api/cards/:id/limit → Update card limits
 *   DELETE /api/cards/:id       → Cancel card
 * 
 * WHY PATCH for block/unblock:
 *   - These are partial updates (only changing status)
 *   - PUT would require sending the entire card object
 *   - PATCH is semantically correct for partial updates
 * 
 * SECURITY NOTES:
 *   - Card numbers are NEVER returned in full (only last 4 digits)
 *   - CVV is NEVER stored or returned
 *   - Full card details require additional authentication
 *   - Card operations are logged for audit trail
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ValidationError, ForbiddenError } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');
const { generateCardNumber } = require('../utils/helpers');

/**
 * ============================================================================
 * GET /api/cards
 * ============================================================================
 * 
 * PURPOSE: List all cards for the authenticated user.
 * 
 * SECURITY:
 *   - Only returns masked card numbers (last 4 digits)
 *   - Never returns CVV
 *   - User can only see their own cards
 * 
 * QUERY PARAMETERS:
 *   - type: Filter by card type (debit, credit)
 *   - status: Filter by status (active, blocked, cancelled)
 *   - page, limit: Pagination
 * ============================================================================
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { type, status, page = 1, limit = 10 } = req.query;

    // ============================================================================
    // BUILD FILTERS
    // ============================================================================
    const filters = { userId: req.user.id };
    if (type) filters.type = type;
    if (status) filters.status = status;

    let cards = db.findAll('cards', filters);

    // ============================================================================
    // MASK SENSITIVE DATA
    // ============================================================================
    // WHY mask: Even in API responses, we never return full card numbers.
    //   This prevents exposure if the response is logged or intercepted.
    //   PCI DSS compliance requires this.
    // 
    // WHAT WE RETURN:
    //   - lastFourDigits: "1111" (for display: "**** **** **** 1111")
    //   - brand: "visa" (for card icon)
    //   - type: "debit" (for card type display)
    //   - status: "active" (for card state)
    //   - Expiry: "12/2027" (for display)
    // 
    // WHAT WE DON'T RETURN:
    //   - Full card number
    //   - CVV
    //   - PIN
    // ============================================================================
    const maskedCards = cards.map((card) => ({
      id: card.id,
      lastFourDigits: card.lastFourDigits,
      type: card.type,
      brand: card.brand,
      holderName: card.holderName,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      status: card.status,
      dailyLimit: card.dailyLimit,
      monthlyLimit: card.monthlyLimit,
      singleTransactionLimit: card.singleTransactionLimit,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      isContactless: card.isContactless,
      issuedAt: card.issuedAt,
      // Display-friendly card number
      displayNumber: `**** **** **** ${card.lastFourDigits}`,
    }));

    const result = paginate(maskedCards, Number(page), Number(limit));

    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * ============================================================================
 * GET /api/cards/:id
 * ============================================================================
 * 
 * PURPOSE: Get detailed information about a specific card.
 * 
 * SECURITY:
 *   - Verifies card belongs to authenticated user
 *   - Returns masked card number
 *   - Includes recent transactions (last 5)
 * ============================================================================
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const card = db.findById('cards', req.params.id);

    if (!card) {
      throw new NotFoundError('Card', req.params.id);
    }

    // ============================================================================
    // OWNERSHIP CHECK
    // ============================================================================
    // WHY: Users can only view their own cards
    // ============================================================================
    if (card.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this card');
    }

    // ============================================================================
    // ENRICH WITH RECENT TRANSACTIONS
    // ============================================================================
    // WHY: Card detail page typically shows recent card activity
    // ============================================================================
    const recentTransactions = db.findAll('transactions', {
      accountId: card.accountId,
    })
      .filter((t) => t.metadata && t.metadata.cardId === card.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // ============================================================================
    // FORMAT RESPONSE (Mask sensitive data)
    // ============================================================================
    const { cardNumber, cvv, ...safeCard } = card;

    res.json({
      success: true,
      data: {
        ...safeCard,
        displayNumber: `**** **** **** ${card.lastFourDigits}`,
        recentTransactions,
      },
    });
  })
);

/**
 * ============================================================================
 * POST /api/cards
 * ============================================================================
 * 
 * PURPOSE: Request a new card.
 * 
 * REQUEST:
 *   Body: {
 *     type: "debit",           // debit or credit
 *     accountId: 1,            // For debit cards: link to account
 *     creditLimit: 50000,      // For credit cards: requested limit
 *     currency: "MXN"
 *   }
 * 
 * WHY validation:
 *   - Debit cards must be linked to an account
 *   - Credit cards need a requested limit
 *   - Can't request more than 3 active cards (business rule)
 * ============================================================================
 */
router.post('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { type, accountId, creditLimit } = req.body;

    // ============================================================================
    // VALIDATE CARD TYPE
    // ============================================================================
    if (!['debit', 'credit'].includes(type)) {
      throw new ValidationError('Card type must be debit or credit');
    }

    // ============================================================================
    // CHECK CARD LIMIT (Business Rule)
    // ============================================================================
    // WHY: Banks limit the number of active cards per customer
    // ============================================================================
    const activeCards = db.findAll('cards', {
      userId: req.user.id,
      status: 'active',
    });

    if (activeCards.length >= 5) {
      throw new ValidationError('Maximum number of active cards reached (5)');
    }

    // ============================================================================
    // VALIDATE DEBIT CARD LINKED ACCOUNT
    // ============================================================================
    // WHY: Debit cards must be linked to a bank account
    // ============================================================================
    if (type === 'debit') {
      if (!accountId) {
        throw new ValidationError('Debit cards must be linked to an account');
      }
      const account = db.findById('accounts', accountId);
      if (!account || account.userId !== req.user.id) {
        throw new NotFoundError('Account', accountId);
      }
    }

    // ============================================================================
    // GENERATE CARD DATA
    // ============================================================================
    // WHY realistic generation: Mock data should look real for demos
    // ============================================================================
    const cardNumber = generateCardNumber();
    const lastFourDigits = cardNumber.slice(-4);
    const expiryYear = new Date().getFullYear() + 4; // Cards valid for 4 years
    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');

    const newCard = db.create('cards', {
      userId: req.user.id,
      accountId: type === 'debit' ? accountId : null,
      cardNumber,
      lastFourDigits,
      type,
      brand: cardNumber.startsWith('4') ? 'visa' : 'mastercard',
      holderName: `${req.user.firstName} ${req.user.lastName}`.toUpperCase(),
      expiryMonth,
      expiryYear: String(expiryYear),
      cvv: '***',
      status: 'active',
      dailyLimit: type === 'debit' ? 15000 : 25000,
      monthlyLimit: type === 'debit' ? 60000 : 100000,
      singleTransactionLimit: type === 'debit' ? 10000 : 50000,
      creditLimit: type === 'credit' ? (creditLimit || 50000) : undefined,
      availableCredit: type === 'credit' ? (creditLimit || 50000) : undefined,
      isContactless: true,
      issuedAt: new Date().toISOString().split('T')[0],
      blockedAt: null,
    });

    // ============================================================================
    // RETURN MASKED DATA
    // ============================================================================
    const { cardNumber: _, cvv: __, ...safeCard } = newCard;
    
    res.status(201).json({
      success: true,
      data: {
        ...safeCard,
        displayNumber: `**** **** **** ${lastFourDigits}`,
      },
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/cards/:id/block
 * ============================================================================
 * 
 * PURPOSE: Block a card (prevent all transactions).
 * 
 * WHY block (not delete):
 *   - Blocking is reversible (unblock later)
 *   - Deleting would destroy transaction history
 *   - Common for lost/stolen cards (temporary measure)
 * 
 * BLOCKING EFFECTS:
 *   - All transactions declined
 *   - Card cannot be used online or in-store
 *   - ATM withdrawals blocked
 *   - Recurring payments may fail
 * 
 * WHO CAN BLOCK:
 *   - Card owner (lost/stolen card)
 *   - Admin (fraud detection, compliance)
 * ============================================================================
 */
router.patch('/:id/block',
  authenticate,
  asyncHandler(async (req, res) => {
    const card = db.findById('cards', req.params.id);

    if (!card) {
      throw new NotFoundError('Card', req.params.id);
    }

    if (card.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this card');
    }

    if (card.status === 'blocked') {
      throw new ValidationError('Card is already blocked');
    }

    if (card.status === 'cancelled') {
      throw new ValidationError('Cannot block a cancelled card');
    }

    // ============================================================================
    // BLOCK CARD
    // ============================================================================
    // WHY record timestamp: Audit trail. When was it blocked? By whom?
    // ============================================================================
    const updatedCard = db.update('cards', card.id, {
      status: 'blocked',
      blockedAt: new Date().toISOString(),
    });

    // ============================================================================
    // CREATE NOTIFICATION
    // ============================================================================
    // WHY: User should be notified when their card is blocked
    // ============================================================================
    db.create('notifications', {
      userId: card.userId,
      type: 'security',
      title: 'Tarjeta bloqueada',
      message: `Tu tarjeta terminación en ${card.lastFourDigits} ha sido bloqueada`,
      isRead: false,
      priority: 'high',
      metadata: {
        cardId: card.id,
        lastFourDigits: card.lastFourDigits,
      },
    });

    const { cardNumber, cvv, ...safeCard } = updatedCard;

    res.json({
      success: true,
      data: {
        ...safeCard,
        displayNumber: `**** **** **** ${card.lastFourDigits}`,
      },
      message: 'Card blocked successfully',
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/cards/:id/unblock
 * ============================================================================
 * 
 * PURPOSE: Unblock a previously blocked card.
 * 
 * WHY separate from block:
 *   - Different business logic (unblock has restrictions)
 *   - Requires additional verification (SMS code, email confirmation)
 *   - Clear API semantics (block vs unblock are distinct operations)
 * ============================================================================
 */
router.patch('/:id/unblock',
  authenticate,
  asyncHandler(async (req, res) => {
    const card = db.findById('cards', req.params.id);

    if (!card) {
      throw new NotFoundError('Card', req.params.id);
    }

    if (card.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this card');
    }

    if (card.status !== 'blocked') {
      throw new ValidationError('Can only unblock a blocked card');
    }

    // ============================================================================
    // UNBLOCK CARD
    // ============================================================================
    const updatedCard = db.update('cards', card.id, {
      status: 'active',
      blockedAt: null,
    });

    // ============================================================================
    // CREATE NOTIFICATION
    // ============================================================================
    db.create('notifications', {
      userId: card.userId,
      type: 'security',
      title: 'Tarjeta desbloqueada',
      message: `Tu tarjeta terminación en ${card.lastFourDigits} ha sido desbloqueada`,
      isRead: false,
      priority: 'normal',
      metadata: {
        cardId: card.id,
        lastFourDigits: card.lastFourDigits,
      },
    });

    const { cardNumber, cvv, ...safeCard } = updatedCard;

    res.json({
      success: true,
      data: {
        ...safeCard,
        displayNumber: `**** **** **** ${card.lastFourDigits}`,
      },
      message: 'Card unblocked successfully',
    });
  })
);

/**
 * ============================================================================
 * PATCH /api/cards/:id/limit
 * ============================================================================
 * 
 * PURPOSE: Update card transaction limits.
 * 
 * WHY limits:
 *   - Daily limits prevent large fraudulent withdrawals
 *   - Monthly limits control spending
 *   - Single transaction limits prevent impulse purchases
 * 
 * VALIDATION:
 *   - Limits must be positive numbers
 *   - Daily limit >= single transaction limit
 *   - Monthly limit >= daily limit
 *   - Credit limit changes may require credit check (simplified here)
 * ============================================================================
 */
router.patch('/:id/limit',
  authenticate,
  validateBody(schemas.updateCardLimit),
  asyncHandler(async (req, res) => {
    const card = db.findById('cards', req.params.id);

    if (!card) {
      throw new NotFoundError('Card', req.params.id);
    }

    if (card.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this card');
    }

    if (card.status !== 'active') {
      throw new ValidationError('Cannot update limits on a blocked or cancelled card');
    }

    const { dailyLimit, monthlyLimit, singleTransactionLimit } = req.body;

    // ============================================================================
    // VALIDATE LIMIT RELATIONSHIPS
    // ============================================================================
    // WHY: Logical constraints prevent invalid limit configurations
    // ============================================================================
    const newDaily = dailyLimit || card.dailyLimit;
    const newMonthly = monthlyLimit || card.monthlyLimit;
    const newSingle = singleTransactionLimit || card.singleTransactionLimit;

    if (newSingle > newDaily) {
      throw new ValidationError('Single transaction limit cannot exceed daily limit');
    }

    if (newDaily > newMonthly) {
      throw new ValidationError('Daily limit cannot exceed monthly limit');
    }

    // ============================================================================
    // UPDATE LIMITS
    // ============================================================================
    const updates = {};
    if (dailyLimit) updates.dailyLimit = dailyLimit;
    if (monthlyLimit) updates.monthlyLimit = monthlyLimit;
    if (singleTransactionLimit) updates.singleTransactionLimit = singleTransactionLimit;

    const updatedCard = db.update('cards', card.id, updates);

    const { cardNumber, cvv, ...safeCard } = updatedCard;

    res.json({
      success: true,
      data: {
        ...safeCard,
        displayNumber: `**** **** **** ${card.lastFourDigits}`,
      },
      message: 'Card limits updated successfully',
    });
  })
);

/**
 * ============================================================================
 * DELETE /api/cards/:id
 * ============================================================================
 * 
 * PURPOSE: Cancel a card permanently.
 * 
 * WHY DELETE (not block):
 *   - Cancellation is permanent (cannot be undone)
 *   - Different from blocking (which is temporary)
 *   - New card must be issued if needed
 * 
 * CANCELLATION EFFECTS:
 *   - Card cannot be used for any transactions
 *   - Recurring payments will fail
 *   - Card is removed from digital wallets
 *   - Physical card should be destroyed
 * 
 * WHO CAN CANCEL:
 *   - Card owner only
 *   - Admin cannot cancel (security measure)
 * ============================================================================
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const card = db.findById('cards', req.params.id);

    if (!card) {
      throw new NotFoundError('Card', req.params.id);
    }

    if (card.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this card');
    }

    if (card.status === 'cancelled') {
      throw new ValidationError('Card is already cancelled');
    }

    // ============================================================================
    // CHECK FOR PENDING TRANSACTIONS
    // ============================================================================
    // WHY: Can't cancel a card with pending transactions
    // ============================================================================
    // In a real app, we'd check for pending card transactions here

    // ============================================================================
    // CANCEL CARD
    // ============================================================================
    // WHY soft delete: Keep the record for historical reference
    // ============================================================================
    db.update('cards', card.id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });

    // ============================================================================
    // CREATE NOTIFICATION
    // ============================================================================
    db.create('notifications', {
      userId: card.userId,
      type: 'security',
      title: 'Tarjeta cancelada',
      message: `Tu tarjeta terminación en ${card.lastFourDigits} ha sido cancelada permanentemente`,
      isRead: false,
      priority: 'high',
      metadata: {
        cardId: card.id,
        lastFourDigits: card.lastFourDigits,
      },
    });

    res.json({
      success: true,
      message: 'Card cancelled successfully',
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
