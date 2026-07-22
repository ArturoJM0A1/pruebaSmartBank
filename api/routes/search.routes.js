/**
 * ============================================================================
 * SMARTBANK - GLOBAL SEARCH ROUTE
 * ============================================================================
 * 
 * PURPOSE: Search across multiple entities (accounts, cards, transactions,
 *   beneficiaries) with a single query.
 * 
 * WHY GLOBAL SEARCH:
 *   - Users expect "one search bar to find everything"
 *   - Reduces navigation complexity
 *   - Improves discoverability of features
 *   - Common in modern banking apps
 * 
 * SEARCH STRATEGIES:
 *   1. CLIENT-SIDE SEARCH:
 *      - All data sent to client, filtered locally
 *      - Pros: Fast, no network latency, works offline
 *      - Cons: Large initial payload, limited by client memory
 *      - WHEN TO USE: Small datasets (< 1000 items)
 * 
 *   2. SERVER-SIDE SEARCH:
 *      - Query sent to server, filtered on server
 *      - Pros: Handles large datasets, centralized logic
 *      - Cons: Network latency, server load
 *      - WHEN TO USE: Large datasets, multiple clients
 * 
 *   3. FULL-TEXT SEARCH ENGINE:
 *      - Dedicated search infrastructure (Elasticsearch, Meilisearch)
 *      - Pros: Fast, ranked results, fuzzy matching, typo tolerance
 *      - Cons: Additional infrastructure, complexity, cost
 *      - WHEN TO USE: Production apps with complex search needs
 * 
 * THIS IMPLEMENTATION:
 *   - Server-side search (educational, shows the pattern)
 *   - Simple string matching (no full-text engine)
 *   - Returns results grouped by entity type
 *   - Easy to upgrade to Elasticsearch later
 * 
 * ENDPOINT:
 *   GET /api/search?q=term
 * 
 * RESPONSE:
 *   {
 *     success: true,
 *     data: {
 *       query: "Juan",
 *       results: {
 *         accounts: [...],
 *         cards: [...],
 *         transactions: [...],
 *         beneficiaries: [...]
 *       },
 *       totalResults: 12
 *     }
 *   }
 * ============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

/**
 * ============================================================================
 * GET /api/search
 * ============================================================================
 * 
 * PURPOSE: Global search across all user entities.
 * 
 * QUERY PARAMETERS:
 *   - q: Search term (required, minimum 2 characters)
 *   - types: Comma-separated entity types to search (default: all)
 *            Options: accounts, cards, transactions, beneficiaries
 * 
 * SEARCH FIELDS PER ENTITY:
 *   - Accounts: accountNumber, clabe, name
 *   - Cards: lastFourDigits, holderName, brand
 *   - Transactions: description, reference, amount
 *   - Beneficiaries: name, accountNumber, email, nickname
 * 
 * WHY search multiple fields:
 *   - Users might search by different criteria
 *   - "1234" could match account number, card last four, or transaction reference
 *   - "Juan" could match a beneficiary name or transaction description
 * 
 * WHY return grouped results:
 *   - Client needs to know which type each result is
 *   - Enables type-specific rendering (different icons, actions)
 *   - Allows "See all accounts" / "See all transactions" links
 * ============================================================================
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { q, types } = req.query;

    // ============================================================================
    // VALIDATE SEARCH TERM
    // ============================================================================
    // WHY minimum 2 characters: Single-character searches return too many
    //   irrelevant results. Also prevents accidental searches from just
    //   pressing enter.
    // ============================================================================
    if (!q || q.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters');
    }

    const searchTerm = q.trim().toLowerCase();
    const searchTypes = types ? types.split(',') : ['accounts', 'cards', 'transactions', 'beneficiaries'];

    // ============================================================================
    // SEARCH ACROSS ENTITIES
    // ============================================================================
    // WHY search each entity separately:
    //   - Different entities have different search fields
    //   - Can optimize per-entity (indexing in production)
    //   - Results are naturally grouped by type
    // ============================================================================
    const results = {};

    // ============================================================================
    // SEARCH ACCOUNTS
    // ============================================================================
    // WHY search accountNumber, clabe, and name:
    //   - Users might remember part of their account number
    //   - CLABE is used for inter-bank transfers
    //   - Account name (e.g., "Cuenta Nómina") is memorable
    // ============================================================================
    if (searchTypes.includes('accounts')) {
      const userAccounts = db.findAll('accounts', { userId: req.user.id });
      results.accounts = userAccounts.filter((account) => {
        const searchable = [
          account.accountNumber,
          account.clabe,
          account.name,
          account.type,
        ].join(' ').toLowerCase();
        return searchable.includes(searchTerm);
      }).map((account) => ({
        id: account.id,
        type: 'account',
        title: account.name,
        subtitle: `****${account.accountNumber.slice(-4)} - ${account.type === 'checking' ? 'Cuenta de Cheques' : 'Ahorro'}`,
        amount: account.balance,
        currency: account.currency,
        status: account.status,
      }));
    }

    // ============================================================================
    // SEARCH CARDS
    // ============================================================================
    // WHY search lastFourDigits and holderName:
    //   - Users often refer to cards by last 4 digits ("my card ending in 1111")
    //   - Holder name matches if searching for a person
    // ============================================================================
    if (searchTypes.includes('cards')) {
      const userCards = db.findAll('cards', { userId: req.user.id });
      results.cards = userCards.filter((card) => {
        const searchable = [
          card.lastFourDigits,
          card.holderName,
          card.brand,
          card.type,
          `**** **** **** ${card.lastFourDigits}`,
        ].join(' ').toLowerCase();
        return searchable.includes(searchTerm);
      }).map((card) => ({
        id: card.id,
        type: 'card',
        title: `${card.brand.toUpperCase()} ${card.type === 'debit' ? 'Débito' : 'Crédito'}`,
        subtitle: `**** **** **** ${card.lastFourDigits}`,
        status: card.status,
        cardType: card.type,
      }));
    }

    // ============================================================================
    // SEARCH TRANSACTIONS
    // ============================================================================
    // WHY search description, reference, and amount:
    //   - Description is the most searchable field ("pago luz", "transferencia")
    //   - Reference numbers help find specific transactions
    //   - Amount helps when user remembers "that $5000 transaction"
    // ============================================================================
    if (searchTypes.includes('transactions')) {
      const userTransactions = db.findAll('transactions', { userId: req.user.id });
      results.transactions = userTransactions.filter((transaction) => {
        const searchable = [
          transaction.description,
          transaction.reference,
          String(Math.abs(transaction.amount)),
          transaction.type,
        ].join(' ').toLowerCase();
        return searchable.includes(searchTerm);
      }).slice(0, 20) // Limit to 20 results (transactions can be numerous)
      .map((transaction) => ({
        id: transaction.id,
        type: 'transaction',
        title: transaction.description,
        subtitle: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        transactionType: transaction.type,
        date: transaction.createdAt,
      }));
    }

    // ============================================================================
    // SEARCH BENEFICIARIES
    // ============================================================================
    // WHY search name, accountNumber, email, nickname:
    //   - Users search by beneficiary name ("mamá", "Ana")
    //   - Account number if they remember part of it
    //   - Nickname is often more memorable than full name
    // ============================================================================
    if (searchTypes.includes('beneficiaries')) {
      const userBeneficiaries = db.findAll('beneficiaries', { userId: req.user.id });
      results.beneficiaries = userBeneficiaries.filter((beneficiary) => {
        const searchable = [
          beneficiary.name,
          beneficiary.accountNumber,
          beneficiary.email,
          beneficiary.nickname,
          beneficiary.bankName,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(searchTerm);
      }).map((beneficiary) => ({
        id: beneficiary.id,
        type: 'beneficiary',
        title: beneficiary.nickname || beneficiary.name,
        subtitle: `${beneficiary.bankName} - ${beneficiary.accountNumber.slice(-4)}`,
        relationship: beneficiary.relationship,
        isVerified: beneficiary.isVerified,
      }));
    }

    // ============================================================================
    // CALCULATE TOTAL RESULTS
    // ============================================================================
    // WHY: Client needs total count for "Found X results" display
    // ============================================================================
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    res.json({
      success: true,
      data: {
        query: q,
        results,
        totalResults,
        searchedTypes: searchTypes,
      },
    });
  })
);

// ============================================================================
// MODULE EXPORTS
// ============================================================================
module.exports = router;
