/**
 * ============================================================================
 * SMARTBANK - IN-MEMORY DATABASE
 * ============================================================================
 * 
 * PURPOSE: Provides a persistent (for the lifetime of the process) data store
 * that mimics a real database. All data lives in JavaScript objects/arrays
 * in memory. When the server restarts, data resets to seed values.
 * 
 * WHY IN-MEMORY (and when to use each alternative):
 * 
 *   1. IN-MEMORY (this implementation):
 *      ✅ Zero setup - no database to install/configure
 *      ✅ Fastest possible reads (array iteration)
 *      ✅ Perfect for development, demos, and learning
 *      ❌ Data lost on restart
 *      ❌ No concurrent access support
 *      ❌ Limited by available RAM
 *      WHEN TO USE: Prototyping, demos, unit tests, learning projects
 * 
 *   2. SQLite:
 *      ✅ Single file, zero server setup
 *      ✅ ACID compliant
 *      ✅ SQL support
 *      ❌ Limited concurrent writes
 *      ❌ Not suitable for high-traffic production
 *      WHEN TO USE: Local development, mobile apps, small tools
 * 
 *   3. PostgreSQL:
 *      ✅ Full-featured RDBMS
 *      ✅ JSON support, full-text search
 *      ✅ Scalable, battle-tested
 *      ❌ Requires server setup
 *      ❌ More complex configuration
 *      WHEN TO USE: Production applications, complex queries
 * 
 *   4. MongoDB:
 *      ✅ Flexible schema (JSON documents)
 *      ✅ Easy horizontal scaling
 *      ❌ No joins (manual or $lookup)
 *      ❌ Eventual consistency (default)
 *      WHEN TO USE: Rapid prototyping, document-heavy apps
 * 
 *   5. Redis:
 *      ✅ Extremely fast (in-memory like this!)
 *      ✅ Great for caching, sessions, real-time
 *      ❌ Limited data structures
 *      ❌ Data persistence requires configuration
 *      WHEN TO USE: Caching layer, session store, pub/sub
 * 
 * PATTERN: "Repository Pattern" - Each entity has CRUD methods.
 *   This abstracts the data layer from the route handlers.
 *   If you later switch from in-memory to PostgreSQL, only this file changes.
 * ============================================================================
 */

'use strict';

const seedData = require('../seeds/data');

// ============================================================================
// AUTO-INCREMENT ID GENERATOR
// ============================================================================
// WHY auto-increment: Simulates database primary key generation.
//   Real databases handle this automatically (SERIAL in PostgreSQL,
//   AUTO_INCREMENT in MySQL, ObjectId in MongoDB).
// 
// ALTERNATIVE: UUIDs (Universally Unique Identifiers)
//   - Pros: No coordination needed, can generate anywhere
//   - Cons: Larger, less human-readable, harder to debug
//   - WHEN TO USE: Distributed systems, client-generated IDs
// ============================================================================
const counters = {
  users: 0,
  accounts: 0,
  cards: 0,
  transactions: 0,
  beneficiaries: 0,
  notifications: 0,
  serviceProviders: 0,
};

function getNextId(entity) {
  if (!counters[entity]) counters[entity] = 0;
  counters[entity]++;
  return counters[entity];
}

// ============================================================================
// DATABASE STATE
// ============================================================================
// Deep clone seed data to avoid mutation of the original seed objects.
// WHY deep clone: If we modify arrays directly, the seed data module
//   would be affected across requires (modules are cached in Node.js).
//   Using JSON parse/stringify is a simple deep clone for plain objects.
// 
// ALTERNATIVE: structuredClone() (Node.js 17+) or lodash.cloneDeep()
// ============================================================================
let db = {
  users: JSON.parse(JSON.stringify(seedData.users)),
  accounts: JSON.parse(JSON.stringify(seedData.accounts)),
  cards: JSON.parse(JSON.stringify(seedData.cards)),
  transactions: JSON.parse(JSON.stringify(seedData.transactions)),
  beneficiaries: JSON.parse(JSON.stringify(seedData.beneficiaries)),
  notifications: JSON.parse(JSON.stringify(seedData.notifications)),
  serviceProviders: JSON.parse(JSON.stringify(seedData.serviceProviders)),
  userSettings: JSON.parse(JSON.stringify(seedData.userSettings)),
  blacklistedTokens: JSON.parse(JSON.stringify(seedData.blacklistedTokens)),
};

// Initialize counters based on existing seed data
// WHY: So new IDs don't conflict with seed data IDs
Object.keys(db).forEach((entity) => {
  if (Array.isArray(db[entity]) && db[entity].length > 0 && db[entity][0].id) {
    counters[entity] = Math.max(...db[entity].map((item) => item.id));
  }
});

// ============================================================================
// GENERIC CRUD OPERATIONS
// ============================================================================
// WHY generic operations:
//   - Reduces boilerplate (write CRUD once, use everywhere)
//   - Consistent behavior across all entities
//   - Easy to add cross-cutting concerns (logging, validation)
// 
// PATTERN: These functions are "data access layer" methods.
//   Routes call these instead of manipulating arrays directly.
// ============================================================================

/**
 * Find all items in an entity with optional filtering
 * 
 * WHY返回新数组: 使用 [...array] 创建浅拷贝，防止调用者意外修改数据库状态。
 * 这是不可变数据模式的基础——返回副本而不是原始引用。
 */
function findAll(entity, filters = {}) {
  if (!db[entity]) return [];
  let results = [...db[entity]];
  
  // Apply filters dynamically
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      results = results.filter((item) => {
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        if (typeof value === 'object' && value !== null) {
          // Range filters
          if ('gte' in value && Number(item[key]) < Number(value.gte)) return false;
          if ('lte' in value && Number(item[key]) > Number(value.lte)) return false;
          if ('gt' in value && Number(item[key]) <= Number(value.gt)) return false;
          if ('lt' in value && Number(item[key]) >= Number(value.lt)) return false;
          if ('from' in value) {
            if (new Date(item[key]) < new Date(value.from)) return false;
          }
          if ('to' in value) {
            const toDate = new Date(value.to);
            toDate.setDate(toDate.getDate() + 1);
            if (new Date(item[key]) >= toDate) return false;
          }
          if ('contains' in value) {
            return String(item[key]).toLowerCase().includes(String(value.contains).toLowerCase());
          }
          return true;
        }
        // String comparison (case-insensitive)
        if (typeof item[key] === 'string' && typeof value === 'string') {
          return item[key].toLowerCase() === value.toLowerCase();
        }
        return item[key] === value;
      });
    }
  });

  return results;
}

/**
 * Find a single item by its ID
 * 
 * WHY strict equality (===): Prevents type coercion bugs.
 *   item.id === 1 matches only number 1, not string "1".
 * 
 * @returns {Object|null} Found item or null
 */
function findById(entity, id) {
  if (!db[entity]) return null;
  return db[entity].find((item) => item.id === Number(id)) || null;
}

/**
 * Find items matching a custom predicate function
 * 
 * WHY this exists: Some queries are too complex for simple filters.
 *   Example: "find transactions where amount > 1000 AND type is transfer"
 *   The predicate function gives full control to the caller.
 * 
 * @param {string} entity - Entity name
 * @param {Function} predicate - Filter function (returns true to include)
 * @returns {Array} Matching items
 */
function findBy(entity, predicate) {
  if (!db[entity]) return [];
  return db[entity].filter(predicate);
}

/**
 * Find one item matching a custom predicate
 * 
 * @param {string} entity - Entity name
 * @param {Function} predicate - Filter function
 * @returns {Object|null} First matching item or null
 */
function findOneBy(entity, predicate) {
  if (!db[entity]) return null;
  return db[entity].find(predicate) || null;
}

/**
 * Create a new item
 * 
 * WHY:
 *   - Auto-generates ID
 *   - Adds createdAt timestamp
 *   - Returns the created item (not just the ID) for immediate use
 * 
 * @param {string} entity - Entity name
 *   @param {Object} data - Item data (without id, createdAt)
 * @returns {Object} Created item with id and timestamps
 */
function create(entity, data) {
  if (!db[entity]) {
    throw new Error(`Entity "${entity}" does not exist in database`);
  }

  const newItem = {
    id: getNextId(entity),
    ...data,
    createdAt: new Date().toISOString(),
  };

  db[entity].push(newItem);
  return { ...newItem }; // Return copy, not reference
}

/**
 * Update an existing item by ID
 * 
 * WHY partial update (PATCH behavior):
 *   - Only overwrites fields that are provided
 *   - Doesn't require sending the entire object
 *   - More efficient for bandwidth and less error-prone
 * 
 * @param {string} entity - Entity name
 * @param {number} id - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated item or null if not found
 */
function update(entity, id, updates) {
  if (!db[entity]) return null;

  const index = db[entity].findIndex((item) => item.id === Number(id));
  if (index === -1) return null;

  // Merge updates into existing item
  db[entity][index] = {
    ...db[entity][index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return { ...db[entity][index] }; // Return copy
}

/**
 * Delete an item by ID
 * 
 * WHY return boolean: Caller only needs to know if deletion succeeded.
 *   If they need the deleted item, they should fetch it first.
 * 
 * @param {string} entity - Entity name
 * @param {number} id - Item ID
 * @returns {boolean} True if deleted, false if not found
 */
function remove(entity, id) {
  if (!db[entity]) return false;

  const index = db[entity].findIndex((item) => item.id === Number(id));
  if (index === -1) return false;

  db[entity].splice(index, 1);
  return true;
}

/**
 * Count items in an entity with optional filters
 * 
 * WHY separate from findAll: Counting doesn't need to fetch/clone data.
 *   Much more efficient for pagination metadata.
 * 
 * @param {string} entity - Entity name
 * @param {Object} filters - Optional filters
 * @returns {number} Count of matching items
 */
function count(entity, filters = {}) {
  if (!Object.keys(filters).length) {
    return db[entity] ? db[entity].length : 0;
  }
  return findAll(entity, filters).length;
}

/**
 * Search across multiple fields in an entity
 * 
 * WHY entity-specific search: Different entities have different fields
 *   to search. This method accepts the search fields as a parameter.
 * 
 * @param {string} entity - Entity name
 * @param {string} term - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Array} Matching items
 */
function searchEntity(entity, term, fields = []) {
  if (!db[entity] || !term || !term.trim()) return [];

  const searchTerm = term.toLowerCase().trim();
  
  return db[entity].filter((item) =>
    fields.some((field) => {
      const value = String(item[field] || '').toLowerCase();
      return value.includes(searchTerm);
    })
  );
}

/**
 * Bulk create multiple items at once
 * 
 * WHY bulk operations:
 *   - More efficient than calling create() in a loop
 *   - All items are created atomically (either all succeed or all fail)
 *   - Useful for seeding or importing data
 * 
 * @param {string} entity - Entity name
 * @param {Array} items - Array of item data
 * @returns {Array} Created items with IDs
 */
function bulkCreate(entity, items) {
  if (!db[entity]) throw new Error(`Entity "${entity}" does not exist`);
  return items.map((item) => create(entity, item));
}

/**
 * Reset database to seed data
 * 
 * WHY this exists:
 *   - Useful for testing (each test starts with clean data)
 *   - Useful for development (reset after breaking changes)
 *   - NOT exposed via API (security risk!)
 * 
 * WARNING: This is a destructive operation. All changes since startup
 * will be lost.
 */
function resetDatabase() {
  db = {
    users: JSON.parse(JSON.stringify(seedData.users)),
    accounts: JSON.parse(JSON.stringify(seedData.accounts)),
    cards: JSON.parse(JSON.stringify(seedData.cards)),
    transactions: JSON.parse(JSON.stringify(seedData.transactions)),
    beneficiaries: JSON.parse(JSON.stringify(seedData.beneficiaries)),
    notifications: JSON.parse(JSON.stringify(seedData.notifications)),
    serviceProviders: JSON.parse(JSON.stringify(seedData.serviceProviders)),
    userSettings: JSON.parse(JSON.stringify(seedData.userSettings)),
    blacklistedTokens: [],
  };

  // Reset counters
  Object.keys(db).forEach((entity) => {
    if (Array.isArray(db[entity]) && db[entity].length > 0 && db[entity][0].id) {
      counters[entity] = Math.max(...db[entity].map((item) => item.id));
    } else {
      counters[entity] = 0;
    }
  });
}

/**
 * Get raw database state (for debugging)
 * 
 * WHY not exposed via API: This would be a massive security hole.
 *   Only available in server-side code for debugging purposes.
 * 
 * @returns {Object} Current database state
 */
function getDatabaseState() {
  return db;
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================
// WHY object export (not individual exports): All methods are logically
//   related (they're all database operations). Grouping them makes imports
//   cleaner: const db = require('./database'); db.findAll('users');
// 
// ALTERNATIVE: Individual exports would require importing each method:
//   const { findAll, findById, create } = require('./database');
//   This is fine too, but the grouped approach is more conventional for
//   database modules.
// ============================================================================

module.exports = {
  // CRUD operations
  findAll,
  findById,
  findBy,
  findOneBy,
  create,
  update,
  remove,
  count,
  searchEntity,
  bulkCreate,

  // Utility
  resetDatabase,
  getDatabaseState,

  // Entity-specific shortcuts (convenience)
  // These provide type-safe access to common queries
  findUserByEmail: (email) => findOneBy('users', (u) => u.email === email),
  findAccountsByUser: (userId) => findAll('accounts', { userId: Number(userId) }),
  findCardsByUser: (userId) => findAll('cards', { userId: Number(userId) }),
  findTransactionsByAccount: (accountId) => findAll('transactions', { accountId: Number(accountId) }),
  findTransactionsByUser: (userId) => findAll('transactions', { userId: Number(userId) }),
  findBeneficiariesByUser: (userId) => findAll('beneficiaries', { userId: Number(userId) }),
  findNotificationsByUser: (userId) => findAll('notifications', { userId: Number(userId) }),
  findSettingsByUser: (userId) => findOneBy('userSettings', (s) => s.userId === Number(userId)),
};
