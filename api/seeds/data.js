/**
 * ============================================================================
 * SMARTBANK - SEED DATA
 * ============================================================================
 * 
 * PURPOSE: Pre-populated data that simulates a real banking environment.
 * When the API server starts, it loads this data into the in-memory
 * database so developers can immediately interact with realistic data.
 * 
 * WHY seed data instead of generating random data?
 *   - Consistency: Everyone on the team sees the same data.
 *   - Realism: Manually crafted data looks and behaves like real data.
 *   - Debugging: When something breaks, you can reproduce it with known data.
 *   - Documentation: Seed data serves as documentation of data structures.
 * 
 * MEXICAN BANKING CONTEXT:
 *   - Currency: MXN (Mexican Peso)
 *   - Account format: CLABE (18 digits) for inter-bank transfers
 *   - Card format: 16 digits, Luhn-valid
 *   - Date format: DD/MM/YYYY (Mexican standard)
 *   - Names: Common Mexican names for realistic demos
 * 
 * ALTERNATIVES:
 *   - Faker.js: Generate random but realistic data. Great for large datasets
 *     but makes debugging harder (data changes each run).
 *   - Database migrations: For real apps, use Knex/Sequelize migrations.
 *   - Fixture files (JSON/YAML): External files loaded at startup.
 * 
 * PASSWORD HASHING:
 *   - We use a simple hash for demo purposes.
 *   - NEVER store plain text passwords. EVER. Even in demo apps.
 *   - In production, use bcrypt (recommended) or argon2.
 *   - The hash below is: bcrypt.hashSync('password123', 10) equivalent
 *     simulated with base64 for simplicity (NOT cryptographically secure)
 * ============================================================================
 */

'use strict';

// ============================================================================
// HELPER: Simple password "hash" for demo
// WHY this approach: Avoids needing bcrypt dependency for mock data.
//   bcrypt.hashSync('password123', 10) would be the real approach.
//   This simulates the behavior without external dependencies.
// ============================================================================
function simpleHash(password) {
  // This is NOT secure - it's just for demo purposes
  // Real apps MUST use bcrypt, argon2, or scrypt
  return Buffer.from(`hashed_${password}_smartbank_2024`).toString('base64');
}

// ============================================================================
// USERS
// ============================================================================
// WHY 3 users: Demonstrates multi-user scenarios (admin vs regular users)
//   without overwhelming the UI. Enough to test permissions and data isolation.
// 
// ROLES:
//   - admin: Full access to all features, user management
//   - user: Standard banking operations
//   - premium: User with premium benefits (lower fees, higher limits)
// ============================================================================

const users = [
  {
    id: 1,
    email: 'admin@smartbank.mx',
    password: simpleHash('admin123'),   // Admin password
    firstName: 'Carlos',
    lastName: 'Rodríguez Méndez',
    role: 'admin',
    phone: '+52 55 1234 5678',
    avatar: null,
    dateOfBirth: '1985-03-15',
    rfc: 'ROCM850315HBC',              // RFC: Registro Federal de Contribuyentes
    curp: 'ROCM850315MBCRRL01',        // CURP: Clave Única de Registro de Población
    address: {
      street: 'Av. Reforma',
      number: '255',
      neighborhood: 'Centro',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06000',
      country: 'México'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-06-15T10:30:00.000Z',
  },
  {
    id: 2,
    email: 'juan.perez@email.com',
    password: simpleHash('password123'),
    firstName: 'Juan',
    lastName: 'Pérez García',
    role: 'user',
    phone: '+52 33 9876 5432',
    avatar: null,
    dateOfBirth: '1990-07-22',
    rfc: 'PEGJ900722IJC',
    curp: 'PEGJ900722HJCRRS09',
    address: {
      street: 'Calle Independencia',
      number: '180',
      neighborhood: 'Jardines de Guadalupe',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44200',
      country: 'México'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-02-15T14:00:00.000Z',
    updatedAt: '2024-07-20T16:45:00.000Z',
  },
  {
    id: 3,
    email: 'maria.lopez@email.com',
    password: simpleHash('password123'),
    firstName: 'María',
    lastName: 'López Sánchez',
    role: 'premium',
    phone: '+52 81 5555 1234',
    avatar: null,
    dateOfBirth: '1988-11-08',
    rfc: 'LOSM881108QR1',
    curp: 'LOSM881108MDFRRS05',
    address: {
      street: 'Av. Constitución',
      number: '400',
      neighborhood: 'Centro',
      city: 'Monterrey',
      state: 'Nuevo León',
      zipCode: '64000',
      country: 'México'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-03-10T09:15:00.000Z',
    updatedAt: '2024-08-01T11:20:00.000Z',
  },
];

// ============================================================================
// ACCOUNTS
// ============================================================================
// WHY 6 accounts: Each user has a checking + savings account. This allows
//   testing:
//   - Account isolation (users only see their own accounts)
//   - Inter-account transfers
//   - Different account types with different behaviors
//   - Admin viewing all accounts
// 
// BALANCE RANGES: Realistic for Mexican banking
//   - Checking: $1,000 - $150,000 MXN
//   - Savings: $5,000 - $500,000 MXN
// ============================================================================

const accounts = [
  // Carlos (Admin) accounts
  {
    id: 1,
    userId: 1,
    accountNumber: '0123456789',
    clabe: '002012012345678901',
    type: 'checking',
    name: 'Cuenta Principal',
    balance: 125450.75,
    currency: 'MXN',
    status: 'active',
    openedAt: '2024-01-01T08:00:00.000Z',
    closedAt: null,
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    accountNumber: '0123456790',
    clabe: '002012012345678902',
    type: 'savings',
    name: 'Ahorro Retiro',
    balance: 487320.50,
    currency: 'MXN',
    status: 'active',
    openedAt: '2024-01-01T08:00:00.000Z',
    closedAt: null,
    createdAt: '2024-01-01T08:00:00.000Z',
  },

  // Juan (User) accounts
  {
    id: 3,
    userId: 2,
    accountNumber: '0987654321',
    clabe: '012012098765432103',
    type: 'checking',
    name: 'Cuenta Nómina',
    balance: 15230.00,
    currency: 'MXN',
    status: 'active',
    openedAt: '2024-02-15T14:00:00.000Z',
    closedAt: null,
    createdAt: '2024-02-15T14:00:00.000Z',
  },
  {
    id: 4,
    userId: 2,
    accountNumber: '0987654322',
    clabe: '012012098765432104',
    type: 'savings',
    name: 'Ahorro Vacaciones',
    balance: 45800.25,
    currency: 'MXN',
    status: 'active',
    openedAt: '2024-02-15T14:00:00.000Z',
    closedAt: null,
    createdAt: '2024-02-15T14:00:00.000Z',
  },

  // María (Premium) accounts
  {
    id: 5,
    userId: 3,
    accountNumber: '5678901234',
    clabe: '021012567890123405',
    type: 'checking',
    name: 'Cuenta Premium',
    balance: 89560.30,
    currency: 'MXN',
    status: 'active',
    openedAt: '2024-03-10T09:15:00.000Z',
    closedAt: null,
    createdAt: '2024-03-10T09:15:00.000Z',
  },
  {
    id: 6,
    userId: 3,
    accountNumber: '5678901235',
    clabe: '021012567890123406',
    type: 'savings',
    name: 'Inversiones',
    balance: 312450.80,
    currency: 'MXN',
    status: 'active',
    openedAt: '2024-03-10T09:15:00.000Z',
    closedAt: null,
    createdAt: '2024-03-10T09:15:00.000Z',
  },
];

// ============================================================================
// CARDS
// ============================================================================
// WHY 8 cards: Mix of debit and credit cards across users.
//   Tests:
//   - Card display in UI
//   - Card blocking/unblocking
//   - Credit limit management
//   - Card type-specific behavior
// 
// CARD TYPES:
//   - debit: Linked to checking account, spend what you have
//   - credit: Credit line from bank, pay later
// 
// LIMITS: Realistic for Mexican banking
//   - Debit: No limit (uses account balance)
//   - Credit: $10,000 - $150,000 MXN depending on user tier
// ============================================================================

const cards = [
  // Carlos cards
  {
    id: 1,
    userId: 1,
    accountId: 1,  // Linked to checking account
    cardNumber: '4111111111111111',
    lastFourDigits: '1111',
    type: 'debit',
    brand: 'visa',
    holderName: 'CARLOS RODRIGUEZ MENDEZ',
    expiryMonth: '12',
    expiryYear: '2027',
    cvv: '***', // WHY masked: Never store/display CVV in API responses
    status: 'active',
    dailyLimit: 50000,
    monthlyLimit: 200000,
    singleTransactionLimit: 25000,
    isContactless: true,
    issuedAt: '2024-01-15',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    accountId: null,  // Credit cards aren't linked to a specific account
    cardNumber: '5555555555554444',
    lastFourDigits: '4444',
    type: 'credit',
    brand: 'mastercard',
    holderName: 'CARLOS RODRIGUEZ MENDEZ',
    expiryMonth: '08',
    expiryYear: '2028',
    cvv: '***',
    status: 'active',
    dailyLimit: 30000,
    monthlyLimit: 150000,
    singleTransactionLimit: 75000,
    creditLimit: 100000,
    availableCredit: 87500,
    isContactless: true,
    issuedAt: '2024-02-01',
    createdAt: '2024-02-01T10:00:00.000Z',
  },

  // Juan cards
  {
    id: 3,
    userId: 2,
    accountId: 3,
    cardNumber: '4012888888881881',
    lastFourDigits: '1881',
    type: 'debit',
    brand: 'visa',
    holderName: 'JUAN PEREZ GARCIA',
    expiryMonth: '05',
    expiryYear: '2026',
    cvv: '***',
    status: 'active',
    dailyLimit: 15000,
    monthlyLimit: 60000,
    singleTransactionLimit: 10000,
    isContactless: false,
    issuedAt: '2024-02-20',
    createdAt: '2024-02-20T10:00:00.000Z',
  },
  {
    id: 4,
    userId: 2,
    accountId: null,
    cardNumber: '5105105105105100',
    lastFourDigits: '5100',
    type: 'credit',
    brand: 'mastercard',
    holderName: 'JUAN PEREZ GARCIA',
    expiryMonth: '11',
    expiryYear: '2027',
    cvv: '***',
    status: 'blocked',  // WHY blocked: Tests unblocking flow
    dailyLimit: 10000,
    monthlyLimit: 40000,
    singleTransactionLimit: 20000,
    creditLimit: 50000,
    availableCredit: 32000,
    isContactless: true,
    issuedAt: '2024-03-15',
    blockedAt: '2024-08-10T14:30:00.000Z',
    createdAt: '2024-03-15T10:00:00.000Z',
  },

  // María cards (Premium = higher limits)
  {
    id: 5,
    userId: 3,
    accountId: 5,
    cardNumber: '4169123456789012',
    lastFourDigits: '9012',
    type: 'debit',
    brand: 'visa',
    holderName: 'MARIA LOPEZ SANCHEZ',
    expiryMonth: '03',
    expiryYear: '2028',
    cvv: '***',
    status: 'active',
    dailyLimit: 75000,
    monthlyLimit: 300000,
    singleTransactionLimit: 40000,
    isContactless: true,
    issuedAt: '2024-03-20',
    createdAt: '2024-03-20T10:00:00.000Z',
  },
  {
    id: 6,
    userId: 3,
    accountId: null,
    cardNumber: '4242424242424242',
    lastFourDigits: '4242',
    type: 'credit',
    brand: 'visa',
    holderName: 'MARIA LOPEZ SANCHEZ',
    expiryMonth: '06',
    expiryYear: '2029',
    cvv: '***',
    status: 'active',
    dailyLimit: 50000,
    monthlyLimit: 250000,
    singleTransactionLimit: 100000,
    creditLimit: 200000,
    availableCredit: 145000,
    isContactless: true,
    issuedAt: '2024-04-01',
    createdAt: '2024-04-01T10:00:00.000Z',
  },
  {
    id: 7,
    userId: 3,
    accountId: 6,
    cardNumber: '4012001234567890',
    lastFourDigits: '7890',
    type: 'debit',
    brand: 'visa',
    holderName: 'MARIA LOPEZ SANCHEZ',
    expiryMonth: '09',
    expiryYear: '2027',
    cvv: '***',
    status: 'cancelled',
    dailyLimit: 10000,
    monthlyLimit: 40000,
    singleTransactionLimit: 15000,
    isContactless: false,
    issuedAt: '2024-03-10',
    cancelledAt: '2024-06-15T09:00:00.000Z',
    createdAt: '2024-03-10T10:00:00.000Z',
  },
  {
    id: 8,
    userId: 3,
    accountId: null,
    cardNumber: '5555555555552222',
    lastFourDigits: '2222',
    type: 'credit',
    brand: 'mastercard',
    holderName: 'MARIA LOPEZ SANCHEZ',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '***',
    status: 'active',
    dailyLimit: 80000,
    monthlyLimit: 400000,
    singleTransactionLimit: 150000,
    creditLimit: 300000,
    availableCredit: 278500,
    isContactless: true,
    issuedAt: '2024-05-01',
    createdAt: '2024-05-01T10:00:00.000Z',
  },
];

// ============================================================================
// TRANSACTIONS
// ============================================================================
// WHY 15+ transactions: Enough to demonstrate:
//   - Different transaction types
//   - Date range filtering
//   - Pagination
//   - Search functionality
//   - Balance calculations
// 
// TRANSACTION TYPES:
//   - transfer: Between accounts (internal or external)
//   - deposit: Money added to account
//   - withdrawal: Money removed from account
//   - payment: Bill payment
//   - card_charge: Purchase with card
//   - card_payment: Credit card payment
//   - interest: Interest earned on savings
//   - fee: Bank fees
// 
// MEXICAN CONTEXT:
//   - SPEI transfers: Mexico's electronic payment system
//   - OXXO payments: Cash payments at convenience stores
// ============================================================================

const transactions = [
  // Carlos transactions
  {
    id: 1,
    userId: 1,
    accountId: 1,
    type: 'deposit',
    amount: 50000.00,
    currency: 'MXN',
    description: 'Depósito de nómina',
    reference: 'NOM-2024-001',
    status: 'completed',
    balanceAfter: 75450.75,
    metadata: {
      source: 'employer',
      employerName: 'TechCorp México S.A. de C.V.',
    },
    createdAt: '2024-07-01T09:00:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    accountId: 1,
    type: 'transfer',
    amount: 5000.00,
    currency: 'MXN',
    description: 'Transferencia a Juan Pérez',
    reference: 'SPEI-2024-001',
    status: 'completed',
    balanceAfter: 70450.75,
    metadata: {
      destinationAccount: '0987654321',
      destinationBank: '012',
      destinationName: 'Juan Pérez García',
      speiKey: 'juan.perez@email.com',
    },
    createdAt: '2024-07-05T14:30:00.000Z',
  },
  {
    id: 3,
    userId: 1,
    accountId: 1,
    type: 'card_charge',
    amount: 1250.00,
    currency: 'MXN',
    description: 'Compra en Liverpool',
    reference: 'CARD-4111-001',
    status: 'completed',
    balanceAfter: 69200.75,
    metadata: {
      cardId: 1,
      merchant: 'Liverpool Polanco',
      merchantCategory: 'department_store',
      lastFourDigits: '1111',
    },
    createdAt: '2024-07-08T18:45:00.000Z',
  },
  {
    id: 4,
    userId: 1,
    accountId: 2,
    type: 'interest',
    amount: 3250.00,
    currency: 'MXN',
    description: 'Intereses ganados - Julio 2024',
    reference: 'INT-2024-07',
    status: 'completed',
    balanceAfter: 487320.50,
    metadata: {
      rate: 0.065, // 6.5% annual rate
      period: 'monthly',
    },
    createdAt: '2024-07-31T00:00:00.000Z',
  },
  {
    id: 5,
    userId: 1,
    accountId: 1,
    type: 'payment',
    amount: 850.00,
    currency: 'MXN',
    description: 'Pago de luz - CFE',
    reference: 'CFE-2024-07-001',
    status: 'completed',
    balanceAfter: 68350.75,
    metadata: {
      providerId: 1,
      providerName: 'CFE (Comisión Federal de Electricidad)',
      accountNumber: '12345678',
      serviceType: 'electricity',
    },
    createdAt: '2024-07-10T10:15:00.000Z',
  },
  {
    id: 6,
    userId: 1,
    accountId: 1,
    type: 'withdrawal',
    amount: 3000.00,
    currency: 'MXN',
    description: 'Retiro en cajero automático',
    reference: 'ATM-2024-001',
    status: 'completed',
    balanceAfter: 65350.75,
    metadata: {
      atmId: 'ATM-CDMX-042',
      location: 'Sucursal Reforma',
    },
    createdAt: '2024-07-12T16:00:00.000Z',
  },

  // Juan transactions
  {
    id: 7,
    userId: 2,
    accountId: 3,
    type: 'deposit',
    amount: 18000.00,
    currency: 'MXN',
    description: 'Depósito de nómina',
    reference: 'NOM-2024-002',
    status: 'completed',
    balanceAfter: 15230.00,
    metadata: {
      source: 'employer',
      employerName: 'Startup MX S.A. de C.V.',
    },
    createdAt: '2024-07-01T09:30:00.000Z',
  },
  {
    id: 8,
    userId: 2,
    accountId: 3,
    type: 'transfer',
    amount: 5000.00,
    currency: 'MXN',
    description: 'Recibido de Carlos Rodríguez',
    reference: 'SPEI-2024-001',
    status: 'completed',
    balanceAfter: 20230.00,
    metadata: {
      sourceAccount: '0123456789',
      sourceBank: '002',
      sourceName: 'Carlos Rodríguez Méndez',
      speiKey: 'admin@smartbank.mx',
    },
    createdAt: '2024-07-05T14:35:00.000Z',
  },
  {
    id: 9,
    userId: 2,
    accountId: 3,
    type: 'card_charge',
    amount: 450.00,
    currency: 'MXN',
    description: 'Compra en OXXO',
    reference: 'CARD-4012-001',
    status: 'completed',
    balanceAfter: 19780.00,
    metadata: {
      cardId: 3,
      merchant: 'OXXO Centro Guadalajara',
      merchantCategory: 'convenience_store',
      lastFourDigits: '1881',
    },
    createdAt: '2024-07-09T12:20:00.000Z',
  },
  {
    id: 10,
    userId: 2,
    accountId: 4,
    type: 'transfer',
    amount: 2000.00,
    currency: 'MXN',
    description: 'Transferencia a ahorro',
    reference: 'INT-2024-001',
    status: 'completed',
    balanceAfter: 45800.25,
    metadata: {
      destinationAccount: '0987654322',
      destinationType: 'savings',
    },
    createdAt: '2024-07-15T08:00:00.000Z',
  },
  {
    id: 11,
    userId: 2,
    accountId: 3,
    type: 'payment',
    amount: 650.00,
    currency: 'MXN',
    description: 'Pago de teléfono - Telcel',
    reference: 'TEL-2024-07-001',
    status: 'completed',
    balanceAfter: 19130.00,
    metadata: {
      providerId: 3,
      providerName: 'Telcel',
      accountNumber: '5512345678',
      serviceType: 'phone',
    },
    createdAt: '2024-07-18T11:00:00.000Z',
  },

  // María transactions
  {
    id: 12,
    userId: 3,
    accountId: 5,
    type: 'deposit',
    amount: 65000.00,
    currency: 'MXN',
    description: 'Depósito de nómina',
    reference: 'NOM-2024-003',
    status: 'completed',
    balanceAfter: 89560.30,
    metadata: {
      source: 'employer',
      employerName: 'Banco Azteca S.A.B. de C.V.',
    },
    createdAt: '2024-07-01T08:45:00.000Z',
  },
  {
    id: 13,
    userId: 3,
    accountId: 5,
    type: 'card_charge',
    amount: 15000.00,
    currency: 'MXN',
    description: 'Compra en Amazon México',
    reference: 'CARD-4242-001',
    status: 'completed',
    balanceAfter: 74560.30,
    metadata: {
      cardId: 6,
      merchant: 'Amazon México',
      merchantCategory: 'online_retail',
      lastFourDigits: '4242',
    },
    createdAt: '2024-07-11T20:30:00.000Z',
  },
  {
    id: 14,
    userId: 3,
    accountId: 5,
    type: 'payment',
    amount: 1200.00,
    currency: 'MXN',
    description: 'Pago de internet - Telmex',
    reference: 'TEL-2024-07-002',
    status: 'completed',
    balanceAfter: 73360.30,
    metadata: {
      providerId: 4,
      providerName: 'Telmex',
      accountNumber: '5598765432',
      serviceType: 'internet',
    },
    createdAt: '2024-07-20T09:15:00.000Z',
  },
  {
    id: 15,
    userId: 3,
    accountId: 6,
    type: 'transfer',
    amount: 10000.00,
    currency: 'MXN',
    description: 'Transferencia a inversión',
    reference: 'SPEI-2024-002',
    status: 'completed',
    balanceAfter: 312450.80,
    metadata: {
      destinationAccount: '5678901235',
      destinationType: 'savings',
    },
    createdAt: '2024-07-22T15:00:00.000Z',
  },
  {
    id: 16,
    userId: 3,
    accountId: 5,
    type: 'card_payment',
    amount: 8000.00,
    currency: 'MXN',
    description: 'Pago tarjeta de crédito',
    reference: 'CCP-2024-001',
    status: 'completed',
    balanceAfter: 81560.30,
    metadata: {
      cardId: 6,
      lastFourDigits: '4242',
      paymentType: 'minimum', // minimum, full, custom
    },
    createdAt: '2024-07-25T10:00:00.000Z',
  },
  {
    id: 17,
    userId: 3,
    accountId: 5,
    type: 'withdrawal',
    amount: 5000.00,
    currency: 'MXN',
    description: 'Retiro en cajero automático',
    reference: 'ATM-2024-002',
    status: 'completed',
    balanceAfter: 76560.30,
    metadata: {
      atmId: 'ATM-MTY-018',
      location: 'Sucursal Monterrey Centro',
    },
    createdAt: '2024-07-28T17:30:00.000Z',
  },
  {
    id: 18,
    userId: 1,
    accountId: 1,
    type: 'fee',
    amount: 45.00,
    currency: 'MXN',
    description: 'Comisión por transferencia SPEI',
    reference: 'FEE-2024-001',
    status: 'completed',
    balanceAfter: 65305.75,
    metadata: {
      feeType: 'spei_transfer',
    },
    createdAt: '2024-07-05T14:30:05.000Z',
  },
];

// ============================================================================
// BENEFICIARIES
// ============================================================================
// WHY 5 beneficiaries: Enough to test CRUD operations and beneficiary
//   selection in transfer forms. Represents different relationship types.
// ============================================================================

const beneficiaries = [
  {
    id: 1,
    userId: 2,
    name: 'Ana García López',
    relationship: 'familia',
    bankCode: '012',
    bankName: 'BBVA México',
    accountNumber: '0123456789012345',
    clabe: '012012012345678901',
    email: 'ana.garcia@email.com',
    phone: '+52 33 1111 2222',
    isVerified: true,
    nickname: 'Mamá',
    createdAt: '2024-03-01T10:00:00.000Z',
  },
  {
    id: 2,
    userId: 2,
    name: 'Roberto Pérez Sánchez',
    relationship: 'familia',
    bankCode: '072',
    bankName: 'Banorte',
    accountNumber: '9876543210987654',
    clabe: '072012987654321002',
    email: 'roberto.perez@email.com',
    phone: '+52 33 3333 4444',
    isVerified: true,
    nickname: 'Papá',
    createdAt: '2024-03-05T11:30:00.000Z',
  },
  {
    id: 3,
    userId: 3,
    name: 'Laura Martínez Rivera',
    relationship: 'amigo',
    bankCode: '002',
    bankName: 'Citibanamex',
    accountNumber: '5566778899001122',
    clabe: '002012556677889903',
    email: 'laura.martinez@email.com',
    phone: '+52 81 5555 6666',
    isVerified: true,
    nickname: 'Compañera de trabajo',
    createdAt: '2024-04-10T14:00:00.000Z',
  },
  {
    id: 4,
    userId: 3,
    name: 'Miguel Hernández Díaz',
    relationship: 'familia',
    bankCode: '060',
    bankName: 'Banregio',
    accountNumber: '1122334455667788',
    clabe: '060012112233445504',
    email: 'miguel.hernandez@email.com',
    phone: '+52 81 7777 8888',
    isVerified: false, // WHY false: Tests verification flow
    nickname: 'Hermano',
    createdAt: '2024-05-20T09:00:00.000Z',
  },
  {
    id: 5,
    userId: 1,
    name: 'Sofia Torres Morales',
    relationship: 'amigo',
    bankCode: '014',
    bankName: 'Santander México',
    accountNumber: '3344556677889900',
    clabe: '014012334455667705',
    email: 'sofia.torres@email.com',
    phone: '+52 55 9999 0000',
    isVerified: true,
    nickname: 'Socija',
    createdAt: '2024-06-15T16:45:00.000Z',
  },
];

// ============================================================================
// NOTIFICATIONS
// ============================================================================
// WHY 10+ notifications: Demonstrates:
//   - Different notification types
//   - Read/unread states
//   - Notification preferences
//   - Bulk operations (mark all as read)
// 
// NOTIFICATION TYPES:
//   - transaction: Money in/out
//   - security: Suspicious activity, login alerts
//   - promotion: Bank offers (common in Mexican banking apps)
//   - system: Maintenance, updates
//   - reminder: Payment due dates
// ============================================================================

const notifications = [
  {
    id: 1,
    userId: 1,
    type: 'transaction',
    title: 'Depósito recibido',
    message: 'Se recibió un depósito de $50,000.00 MXN en tu cuenta 0123456789',
    isRead: true,
    priority: 'normal',
    metadata: {
      transactionId: 1,
      accountId: 1,
    },
    createdAt: '2024-07-01T09:01:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    type: 'security',
    title: 'Inicio de sesión detectado',
    message: 'Se detectó un inicio de sesión desde Ciudad de México, México',
    isRead: true,
    priority: 'high',
    metadata: {
      ip: '189.203.45.67',
      device: 'Chrome 126.0',
      location: 'Ciudad de México',
    },
    createdAt: '2024-07-08T08:15:00.000Z',
  },
  {
    id: 3,
    userId: 2,
    type: 'transaction',
    title: 'Transferencia enviada',
    message: 'Se enviaron $5,000.00 MXN a Juan Pérez García',
    isRead: false,
    priority: 'normal',
    metadata: {
      transactionId: 2,
      accountId: 1,
    },
    createdAt: '2024-07-05T14:31:00.000Z',
  },
  {
    id: 4,
    userId: 2,
    type: 'reminder',
    title: 'Pago próximo a vencer',
    message: 'Tu pago de luz CFE vence en 3 días. Monto: $850.00 MXN',
    isRead: false,
    priority: 'high',
    metadata: {
      providerId: 1,
      dueDate: '2024-07-13',
      amount: 850.00,
    },
    createdAt: '2024-07-10T08:00:00.000Z',
  },
  {
    id: 5,
    userId: 2,
    type: 'promotion',
    title: 'Nueva tarjeta de crédito disponible',
    message: 'Como cliente precalificado, puedes obtener la tarjeta SmartBank Gold con 0% de intereses los primeros 3 meses',
    isRead: false,
    priority: 'low',
    metadata: {
      promotionId: 'PROMO-GOLD-001',
    },
    createdAt: '2024-07-15T12:00:00.000Z',
  },
  {
    id: 6,
    userId: 3,
    type: 'transaction',
    title: 'Pago de tarjeta procesado',
    message: 'Tu pago de $8,000.00 MXN fue procesado exitosamente',
    isRead: false,
    priority: 'normal',
    metadata: {
      transactionId: 16,
      cardLastFour: '4242',
    },
    createdAt: '2024-07-25T10:01:00.000Z',
  },
  {
    id: 7,
    userId: 3,
    type: 'security',
    title: 'Tarjeta bloqueada',
    message: 'Tu tarjeta terminación en 7890 ha sido bloqueada por tu solicitud',
    isRead: true,
    priority: 'high',
    metadata: {
      cardId: 7,
      lastFourDigits: '7890',
    },
    createdAt: '2024-06-15T09:01:00.000Z',
  },
  {
    id: 8,
    userId: 3,
    type: 'system',
    title: 'Mantenimiento programado',
    message: 'El sistema estará en mantenimiento el domingo 28 de julio de 2:00 AM a 6:00 AM (hora del centro)',
    isRead: false,
    priority: 'normal',
    metadata: {
      maintenanceDate: '2024-07-28',
      startTime: '02:00',
      endTime: '06:00',
    },
    createdAt: '2024-07-22T10:00:00.000Z',
  },
  {
    id: 9,
    userId: 1,
    type: 'promotion',
    title: 'SmartBank Inversiones',
    message: 'Invierte desde $1,000 MXN y obtén hasta 12% anual. ¡Conoce nuestros fondos!',
    isRead: false,
    priority: 'low',
    metadata: {
      promotionId: 'PROMO-INV-001',
    },
    createdAt: '2024-07-25T14:00:00.000Z',
  },
  {
    id: 10,
    userId: 3,
    type: 'transaction',
    title: 'Retiro exitoso',
    message: 'Retiro de $5,000.00 MXN en Cajero Automático Sucursal Monterrey Centro',
    isRead: true,
    priority: 'normal',
    metadata: {
      transactionId: 17,
      atmLocation: 'Sucursal Monterrey Centro',
    },
    createdAt: '2024-07-28T17:31:00.000Z',
  },
  {
    id: 11,
    userId: 2,
    type: 'transaction',
    title: 'Transferencia recibida',
    message: 'Recibiste $2,000.00 MXN en tu cuenta de ahorro',
    isRead: false,
    priority: 'normal',
    metadata: {
      transactionId: 10,
      accountId: 4,
    },
    createdAt: '2024-07-15T08:01:00.000Z',
  },
];

// ============================================================================
// SERVICE PROVIDERS
// ============================================================================
// WHY 5 providers: Common Mexican utility/service providers that users
//   would pay through their banking app. This is a major feature of
//   Mexican banking apps (pago de servicios).
// 
// MEXICAN CONTEXT:
//   - CFE: Electricity (monopoly, everyone pays this)
//   - Telmex: Landline/internet (major provider)
//   - Telcel: Mobile phone (dominant carrier)
//   - Sky: Satellite TV (common service)
//   - Gas natural: Natural gas (available in some cities)
// ============================================================================

const serviceProviders = [
  {
    id: 1,
    name: 'CFE',
    fullName: 'Comisión Federal de Electricidad',
    category: 'electricity',
    icon: 'bolt',
    color: '#FFD700',
    description: 'Pago de servicio eléctrico residencial',
    accountNumberLength: 10,   // CFE account numbers are 10 digits
    accountNumberPattern: '^\\d{10}$',
    commission: 0,              // WHY 0: CFE payments are typically free through banks
    isActive: true,
    supportedBanks: ['002', '012', '014', '060', '072'],
    paymentMethods: ['spei', 'card', 'oxxo'],
    maxAmount: 50000,
    minAmount: 50,
    processingTime: '24 hours',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Sky',
    fullName: 'Sky México',
    category: 'television',
    icon: 'tv',
    color: '#0066CC',
    description: 'Pago de suscripción de televisión por satélite',
    accountNumberLength: 12,
    accountNumberPattern: '^\\d{12}$',
    commission: 15.00,    // $15 MXN commission per payment
    isActive: true,
    supportedBanks: ['002', '012', '014', '060', '072'],
    paymentMethods: ['spei', 'card'],
    maxAmount: 5000,
    minAmount: 200,
    processingTime: 'Immediate',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Telcel',
    fullName: 'Telcel (América Móvil)',
    category: 'phone',
    icon: 'smartphone',
    color: '#0033A0',
    description: 'Pago de servicio telefónico móvil',
    accountNumberLength: 10,
    accountNumberPattern: '^55\\d{8}$',  // Mexican mobile numbers start with 55
    commission: 0,
    isActive: true,
    supportedBanks: ['002', '012', '014', '060', '072'],
    paymentMethods: ['spei', 'card', 'oxxo'],
    maxAmount: 10000,
    minAmount: 50,
    processingTime: 'Immediate',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 4,
    name: 'Telmex',
    fullName: 'Telmex (América Móvil)',
    category: 'internet',
    icon: 'wifi',
    color: '#E31837',
    description: 'Pago de servicio de internet y telefonía fija',
    accountNumberLength: 10,
    accountNumberPattern: '^\\d{10}$',
    commission: 10.00,
    isActive: true,
    supportedBanks: ['002', '012', '014', '060', '072'],
    paymentMethods: ['spei', 'card', 'oxxo'],
    maxAmount: 15000,
    minAmount: 100,
    processingTime: '24 hours',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 5,
    name: 'Gas Natural',
    fullName: 'Gas Natural México',
    category: 'gas',
    icon: 'flame',
    color: '#FF6600',
    description: 'Pago de servicio de gas natural',
    accountNumberLength: 8,
    accountNumberPattern: '^\\d{8}$',
    commission: 0,
    isActive: true,
    supportedBanks: ['002', '012', '014'],
    paymentMethods: ['spei', 'card'],
    maxAmount: 5000,
    minAmount: 30,
    processingTime: '48 hours',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// ============================================================================
// USER SETTINGS & PREFERENCES
// ============================================================================
// WHY separate settings from user object:
//   - Settings can change frequently without affecting core user data.
//   - Easier to implement "reset to defaults" feature.
//   - Can be cached separately for performance.
// 
// WHY Mexican-specific defaults:
//   - Currency: MXN (Mexican Peso)
//   - Locale: es-MX (Mexican Spanish)
//   - Timezone: America/Mexico_City
// ============================================================================

const userSettings = [
  {
    userId: 1,
    language: 'es',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: true,
      transactions: true,
      promotions: false,
      security: true,
      reminders: true,
    },
    security: {
      twoFactorEnabled: true,
      biometricEnabled: false,
      sessionTimeout: 30,  // minutes
      loginNotifications: true,
    },
    display: {
      defaultAccount: 1,
      showBalances: true,
      compactMode: false,
      dateFormat: 'DD/MM/YYYY',
    },
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-07-15T10:00:00.000Z',
  },
  {
    userId: 2,
    language: 'es',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      sms: false,
      transactions: true,
      promotions: true,
      security: true,
      reminders: true,
    },
    security: {
      twoFactorEnabled: false,
      biometricEnabled: true,
      sessionTimeout: 15,
      loginNotifications: true,
    },
    display: {
      defaultAccount: 3,
      showBalances: true,
      compactMode: true,
      dateFormat: 'DD/MM/YYYY',
    },
    createdAt: '2024-02-15T14:00:00.000Z',
    updatedAt: '2024-07-20T16:45:00.000Z',
  },
  {
    userId: 3,
    language: 'es',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    theme: 'auto',  // Follows system preference
    notifications: {
      email: true,
      push: true,
      sms: true,
      transactions: true,
      promotions: false,
      security: true,
      reminders: true,
    },
    security: {
      twoFactorEnabled: true,
      biometricEnabled: true,
      sessionTimeout: 60,
      loginNotifications: true,
    },
    display: {
      defaultAccount: 5,
      showBalances: true,
      compactMode: false,
      dateFormat: 'DD/MM/YYYY',
    },
    createdAt: '2024-03-10T09:15:00.000Z',
    updatedAt: '2024-08-01T11:20:00.000Z',
  },
];

// ============================================================================
// TOKENS (Blacklisted tokens for logout simulation)
// ============================================================================
// WHY store blacklisted tokens:
//   - JWTs can't be invalidated once issued (they're stateless).
//   - To implement logout, we store issued tokens and check against them.
//   - In production, use Redis for fast lookup with TTL matching token expiry.
// ============================================================================

const blacklistedTokens = [];

// ============================================================================
// MODULE EXPORTS
// ============================================================================
// WHY named exports: Allows importing specific datasets.
//   const { users, accounts } = require('./seeds/data');
//   vs importing everything (clearer dependency, potential tree-shaking)
// ============================================================================

module.exports = {
  users,
  accounts,
  cards,
  transactions,
  beneficiaries,
  notifications,
  serviceProviders,
  userSettings,
  blacklistedTokens,
  simpleHash,
};
