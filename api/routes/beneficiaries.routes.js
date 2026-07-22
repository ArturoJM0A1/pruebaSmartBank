/**
 * ============================================================================
 * SMARTBANK - BENEFICIARY ROUTES
 * ============================================================================
 * 
 * PURPOSE: Manage saved beneficiaries (frequent transfer recipients).
 *   Beneficiaries are people or businesses you transfer money to regularly.
 * 
 * WHAT IS A BENEFICIARY:
 *   - A saved recipient for bank transfers
 *   - Stores account details so you don't re-enter them each time
 *   - Can be verified (account exists) or unverified
 *   - Has a nickname for easy identification
 * 
 * REST CONVENTIONS:
 *   GET    /api/beneficiaries              → List user's beneficiaries
 *   POST   /api/beneficiaries              → Add new beneficiary
 *   PUT    /api/beneficiaries/:id          → Update beneficiary (full replace)
 *   DELETE /api/beneficiaries/:id          → Remove beneficiary
 *   GET    /api/beneficiaries/:id/validate → Validate beneficiary account
 * 
 * PUT vs PATCH:
 *   - PUT: Replace the ENTIRE resource (all fields required)
 *   - PATCH: Partial update (only changed fields)
 *   - We use PUT for beneficiaries because updates typically change
 *     multiple fields at once (name, bank, account number)
 * 
 * SECURITY:
 *   - Users can only manage their own beneficiaries
 *   - Beneficiary accounts should be validated before first transfer
 *   - Suspicious beneficiaries (newly added, high amounts) may trigger alerts
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../middleware/errorHandler');

/**
 * ============================================================================
 * GET /api/beneficiaries
 * ============================================================================
 * 
 * PURPOSE: List all beneficiaries for the authenticated user.
 * 
 * QUERY PARAMETERS:
 *   - relationship: Filter by relationship (familia, amigo, trabajo, otro)
 *   - bankCode: Filter by bank
 *   - verified: Filter by verification status
 * 
 * WHY include verification status:
 *   - Users need to know which beneficiaries have been verified
 *   - Unverified beneficiaries may have restricted transfer limits
 * ============================================================================
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { relationship, bankCode, verified } = req.query;

    const filters = { userId: req.user.id };
    if (relationship) filters.relationship = relationship;
    if (bankCode) filters.bankCode = bankCode;
    if (verified !== undefined) filters.isVerified = verified === 'true';

    const beneficiaries = db.findAll('beneficiaries', filters);

    res.json({
      success: true,
      data: beneficiaries,
    });
  })
);

/**
 * ============================================================================
 * POST /api/beneficiaries
 * ============================================================================
 * 
 * PURPOSE: Add a new beneficiary.
 * 
 * REQUEST:
 *   Body: {
 *     name: "Ana García López",
 *     relationship: "familia",
 *     bankCode: "012",
 *     accountNumber: "0123456789012345",
 *     clabe: "012012012345678901",
 *     email: "ana@email.com",
 *     phone: "+52 33 1111 2222",
 *     nickname: "Mamá"
 *   }
 * 
 * DUPLICATE CHECK:
 *   - Prevents adding the same beneficiary twice
 *   - Checked by CLABE/account number + bank combination
 * ============================================================================
 */
router.post('/',
  authenticate,
  validateBody(schemas.createBeneficiary),
  asyncHandler(async (req, res) => {
    const { name, relationship, bankCode, accountNumber, clabe, email, phone, nickname } = req.body;

    // ============================================================================
    // CHECK FOR DUPLICATE
    // ============================================================================
    // WHY: Prevents accidental duplicate entries
    //   Same bank + account number = same beneficiary
    // ============================================================================
    const existingBeneficiary = db.findOneBy('beneficiaries',
      (b) =>
        b.userId === req.user.id &&
        b.bankCode === bankCode &&
        b.accountNumber === accountNumber
    );

    if (existingBeneficiary) {
      throw new ConflictError('This beneficiary already exists');
    }

    // ============================================================================
    // FIND BANK NAME
    // ============================================================================
    // WHY: Store bank name for display (avoids lookup on every request)
    // ============================================================================
    const bankNames = {
      '002': 'Citibanamex',
      '012': 'BBVA México',
      '014': 'Santander México',
      '060': 'Banregio',
      '072': 'Banorte',
    };

    // ============================================================================
    // CREATE BENEFICIARY
    // ============================================================================
    const newBeneficiary = db.create('beneficiaries', {
      userId: req.user.id,
      name,
      relationship,
      bankCode,
      bankName: bankNames[bankCode] || 'Otro banco',
      accountNumber,
      clabe: clabe || null,
      email: email || null,
      phone: phone || null,
      isVerified: false, // WHY false: New beneficiaries start unverified
      nickname: nickname || null,
    });

    res.status(201).json({
      success: true,
      data: newBeneficiary,
    });
  })
);

/**
 * ============================================================================
 * PUT /api/beneficiaries/:id
 * ============================================================================
 * 
 * PURPOSE: Update an existing beneficiary (full replacement).
 * 
 * WHY PUT (not PATCH):
 *   - Beneficiary updates typically change multiple fields
 *   - PUT semantics: "Here's the complete new version of this resource"
 *   - Requires sending ALL fields (even unchanged ones)
 *   - Alternative: Use PATCH for partial updates (more bandwidth efficient)
 * 
 * REQUEST:
 *   Body: {
 *     name: "Ana García López de Pérez",
 *     relationship: "familia",
 *     bankCode: "012",
 *     accountNumber: "0123456789012345",
 *     clabe: "012012012345678901",
 *     email: "ana.nuevo@email.com",
 *     phone: "+52 33 2222 3333",
 *     nickname: "Mamá actualizado"
 *   }
 * 
 * SECURITY:
 *   - Users can only update their own beneficiaries
 *   - Changing account number may require re-verification
 * ============================================================================
 */
router.put('/:id',
  authenticate,
  validateBody(schemas.createBeneficiary),
  asyncHandler(async (req, res) => {
    const beneficiary = db.findById('beneficiaries', req.params.id);

    if (!beneficiary) {
      throw new NotFoundError('Beneficiary', req.params.id);
    }

    if (beneficiary.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this beneficiary');
    }

    const { name, relationship, bankCode, accountNumber, clabe, email, phone, nickname } = req.body;

    // ============================================================================
    // CHECK FOR DUPLICATE (with different ID)
    // ============================================================================
    const duplicate = db.findOneBy('beneficiaries',
      (b) =>
        b.userId === req.user.id &&
        b.id !== beneficiary.id &&
        b.bankCode === bankCode &&
        b.accountNumber === accountNumber
    );

    if (duplicate) {
      throw new ConflictError('Another beneficiary with this account already exists');
    }

    // ============================================================================
    // CHECK IF ACCOUNT NUMBER CHANGED
    // ============================================================================
    // WHY: If account number changes, beneficiary needs re-verification
    // ============================================================================
    const accountChanged = beneficiary.accountNumber !== accountNumber;

    const bankNames = {
      '002': 'Citibanamex',
      '012': 'BBVA México',
      '014': 'Santander México',
      '060': 'Banregio',
      '072': 'Banorte',
    };

    const updatedBeneficiary = db.update('beneficiaries', beneficiary.id, {
      name,
      relationship,
      bankCode,
      bankName: bankNames[bankCode] || 'Otro banco',
      accountNumber,
      clabe: clabe || null,
      email: email || null,
      phone: phone || null,
      isVerified: accountChanged ? false : beneficiary.isVerified, // Re-verify if account changed
      nickname: nickname || null,
    });

    res.json({
      success: true,
      data: updatedBeneficiary,
    });
  })
);

/**
 * ============================================================================
 * DELETE /api/beneficiaries/:id
 * ============================================================================
 * 
 * PURPOSE: Remove a beneficiary.
 * 
 * WHY soft check (not hard delete):
 *   - Beneficiaries with pending transfers shouldn't be deleted
 *   - Would break referential integrity in transaction history
 *   - We allow deletion but warn about pending transfers
 * 
 * WHO CAN DELETE:
 *   - Beneficiary owner only
 *   - Admin cannot delete (security measure)
 * ============================================================================
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const beneficiary = db.findById('beneficiaries', req.params.id);

    if (!beneficiary) {
      throw new NotFoundError('Beneficiary', req.params.id);
    }

    if (beneficiary.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this beneficiary');
    }

    // ============================================================================
    // CHECK FOR PENDING TRANSFERS
    // ============================================================================
    // WHY: Warn user about pending transfers to this beneficiary
    // ============================================================================
    const pendingTransfers = db.findAll('transactions', {
      userId: req.user.id,
      type: 'transfer',
      status: 'pending',
    }).filter((t) =>
      t.metadata &&
      t.metadata.destinationAccount === beneficiary.accountNumber
    );

    if (pendingTransfers.length > 0) {
      throw new ValidationError(
        'Cannot delete beneficiary with pending transfers',
        { pendingCount: pendingTransfers.length }
      );
    }

    // ============================================================================
    // DELETE BENEFICIARY
    // ============================================================================
    db.remove('beneficiaries', beneficiary.id);

    res.json({
      success: true,
      message: 'Beneficiary removed successfully',
    });
  })
);

/**
 * ============================================================================
 * GET /api/beneficiaries/:id/validate
 * ============================================================================
 * 
 * PURPOSE: Validate a beneficiary's account with their bank.
 * 
 * WHY validate:
 *   - Confirms the account number exists at the destination bank
 *   - Returns the account holder's name for verification
 *   - Prevents transfers to wrong accounts
 *   - Required before first transfer (security measure)
 * 
 * SIMULATION:
 *   - In real apps, calls the destination bank's API (via SPEI)
 *   - We simulate with mock validation
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       valid: true,
 *       accountHolder: "Ana García López",
 *       bankName: "BBVA México",
 *       accountType: "Cuenta de Cheques"
 *     }
 *   }
 * ============================================================================
 */
router.get('/:id/validate',
  authenticate,
  asyncHandler(async (req, res) => {
    const beneficiary = db.findById('beneficiaries', req.params.id);

    if (!beneficiary) {
      throw new NotFoundError('Beneficiary', req.params.id);
    }

    if (beneficiary.userId !== req.user.id) {
      throw new ForbiddenError('You do not have access to this beneficiary');
    }

    // ============================================================================
    // SIMULATE BANK VALIDATION
    // ============================================================================
    // WHY simulation: Can't call real bank APIs in demo
    //   Real integration uses SPEI (Mexico's interbank transfer system)
    // ============================================================================
    const isValid = beneficiary.accountNumber.length >= 8;

    if (isValid) {
      // Mark as verified
      db.update('beneficiaries', beneficiary.id, {
        isVerified: true,
      });

      res.json({
        success: true,
        data: {
          valid: true,
          accountHolder: beneficiary.name,
          bankName: beneficiary.bankName,
          accountType: 'Cuenta de Cheques',
          clabe: beneficiary.clabe,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          valid: false,
          message: 'Invalid account number',
        },
      });
    }
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
