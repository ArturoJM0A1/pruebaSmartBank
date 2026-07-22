/**
 * ============================================================================
 * SMARTBANK - COMPREHENSIVE MOCK DATA
 * ============================================================================
 * 
 * PURPOSE: Centralized mock data for all tests in the SmartBank project.
 * 
 * TEST DATA STRATEGY:
 *   - FIXTURES: Static, pre-defined data that represents valid scenarios.
 *     Use when: testing rendering, display, formatting.
 *     Example: a fixed user object with known properties.
 * 
 *   - MOCKS: Objects that imitate real API responses or services.
 *     Use when: testing service calls, error handling, edge cases.
 *     Example: mockFetchSuccess() returns a mock Response object.
 * 
 *   - STUBS: Minimal implementations that replace real dependencies.
 *     Use when: isolating code from external systems.
 *     Example: a stub localStorage that stores values in memory.
 * 
 * WHY organize mocks separately?
 *   - Reusability: One mock user can be used across 50 tests.
 *   - Consistency: All tests use the same data shapes.
 *   - Maintainability: When API response shape changes, update once here.
 * 
 * NAMING CONVENTION:
 *   - mock[Entity] for individual objects (mockUser, mockAccount)
 *   - mock[Entity]List for arrays (mockTransactions, mockBeneficiaries)
 *   - mockApi[Endpoint] for API response mocks (mockApiLoginSuccess)
 * 
 * ============================================================================
 */

'use strict';

// ============================================================================
// USER MOCK DATA
// ============================================================================
// Represents a typical authenticated user in SmartBank.
// Fields follow the User model defined in the project's data layer.

const mockUser = {
  id: 'usr_123456789',
  email: 'usuario@smartbank.com',
  password: 'SecureP@ss123',
  firstName: 'Juan',
  lastName: 'Pérez García',
  phone: '+52 55 1234 5678',
  rfc: 'PEGJ850101ABC',
  curp: 'PEGJ850101HDFRR09',
  birthDate: '1985-01-15',
  role: 'user',
  avatar: 'https://ui-avatars.com/api/?name=Juan+Perez',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-06-20T14:22:00Z',
  isActive: true,
  preferences: {
    language: 'es-MX',
    currency: 'MXN',
    notifications: true,
    theme: 'light',
  },
};

const mockAdminUser = {
  ...mockUser,
  id: 'usr_admin_001',
  email: 'admin@smartbank.com',
  firstName: 'Admin',
  lastName: 'Sistema',
  role: 'admin',
};

// ============================================================================
// ACCOUNT MOCK DATA
// ============================================================================
// Represents bank accounts. In Mexican banking, accounts have:
//   - CLABE: 18-digit standardized bank code
//   - Account number: varies by bank (10-16 digits)
//   - Balance: current available balance
//   - Type: 'checking' (cuenta de cheques) or 'savings' (cuenta de ahorro)

const mockAccounts = [
  {
    id: 'acc_001',
    userId: 'usr_123456789',
    accountNumber: '1234567890',
    clabe: '002123456789012345',
    bankCode: '002',
    bankName: 'SmartBank',
    type: 'checking',
    name: 'Cuenta Principal',
    balance: 45250.75,
    currency: 'MXN',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'acc_002',
    userId: 'usr_123456789',
    accountNumber: '9876543210',
    clabe: '012987654321098765',
    bankCode: '012',
    bankName: 'BBVA',
    type: 'savings',
    name: 'Ahorro Vacaciones',
    balance: 125000.00,
    currency: 'MXN',
    isActive: true,
    createdAt: '2024-03-10T08:00:00Z',
  },
  {
    id: 'acc_003',
    userId: 'usr_123456789',
    accountNumber: '5555666677',
    clabe: '072555566667788990',
    bankCode: '072',
    bankName: 'Banorte',
    type: 'checking',
    name: 'Cuenta USD',
    balance: 2500.50,
    currency: 'USD',
    isActive: true,
    createdAt: '2024-05-01T12:00:00Z',
  },
];

// ============================================================================
// CARD MOCK DATA
// ============================================================================
// Mexican bank cards follow standard formats:
//   - Visa: starts with 4, 16 digits
//   - Mastercard: starts with 5, 16 digits
//   - Amex: starts with 3, 15 digits

const mockCards = [
  {
    id: 'card_001',
    userId: 'usr_123456789',
    accountId: 'acc_001',
    cardNumber: '4111111111111111',
    lastFourDigits: '1111',
    cardholderName: 'JUAN PEREZ GARCIA',
    expirationDate: '12/27',
    type: 'debit',
    brand: 'visa',
    isActive: true,
    dailyLimit: 15000.00,
    monthlyLimit: 100000.00,
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'card_002',
    userId: 'usr_123456789',
    accountId: 'acc_001',
    cardNumber: '5555555555554444',
    lastFourDigits: '4444',
    cardholderName: 'JUAN PEREZ GARCIA',
    expirationDate: '08/26',
    type: 'credit',
    brand: 'mastercard',
    isActive: true,
    dailyLimit: 25000.00,
    monthlyLimit: 150000.00,
    creditLimit: 50000.00,
    availableCredit: 35000.00,
    createdAt: '2024-02-15T14:30:00Z',
  },
];

// ============================================================================
// TRANSACTION MOCK DATA
// ============================================================================
// Transactions represent all financial movements.
// Types: 'transfer', 'deposit', 'withdrawal', 'payment', 'fee'
// Each transaction references source/target accounts.

const mockTransactions = [
  {
    id: 'txn_001',
    accountId: 'acc_001',
    type: 'transfer',
    amount: -2500.00,
    currency: 'MXN',
    description: 'Transferencia a María López',
    category: 'transfer',
    status: 'completed',
    counterparty: {
      name: 'María López',
      accountNumber: '1111222233',
      bank: 'BBVA',
    },
    createdAt: '2024-06-20T14:30:00Z',
    reference: 'REF-2024-001',
  },
  {
    id: 'txn_002',
    accountId: 'acc_001',
    type: 'deposit',
    amount: 15000.00,
    currency: 'MXN',
    description: 'Depósito de nómina',
    category: 'income',
    status: 'completed',
    counterparty: {
      name: 'Empresa XYZ S.A.',
      accountNumber: '9999888877',
      bank: 'SmartBank',
    },
    createdAt: '2024-06-18T09:00:00Z',
    reference: 'REF-2024-002',
  },
  {
    id: 'txn_003',
    accountId: 'acc_001',
    type: 'payment',
    amount: -1250.00,
    currency: 'MXN',
    description: 'Pago tarjeta de crédito',
    category: 'payment',
    status: 'completed',
    counterparty: {
      name: 'SmartBank Crédito',
      accountNumber: '5555444433',
      bank: 'SmartBank',
    },
    createdAt: '2024-06-15T16:45:00Z',
    reference: 'REF-2024-003',
  },
  {
    id: 'txn_004',
    accountId: 'acc_001',
    type: 'withdrawal',
    amount: -3000.00,
    currency: 'MXN',
    description: 'Retiro en cajero automático',
    category: 'withdrawal',
    status: 'completed',
    counterparty: {
      name: 'Cajero SmartBank',
      accountNumber: null,
      bank: 'SmartBank',
    },
    createdAt: '2024-06-14T11:20:00Z',
    reference: 'REF-2024-004',
  },
  {
    id: 'txn_005',
    accountId: 'acc_001',
    type: 'fee',
    amount: -89.00,
    currency: 'MXN',
    description: 'Comisión por mantenimiento',
    category: 'fee',
    status: 'completed',
    counterparty: {
      name: 'SmartBank',
      accountNumber: null,
      bank: 'SmartBank',
    },
    createdAt: '2024-06-01T00:00:00Z',
    reference: 'REF-2024-005',
  },
];

// ============================================================================
// BENEFICIARY MOCK DATA
// ============================================================================
// Beneficiaries are saved recipients for transfers.
// Users can save frequent recipients to avoid re-entering account details.

const mockBeneficiaries = [
  {
    id: 'ben_001',
    userId: 'usr_123456789',
    name: 'María López',
    accountNumber: '1111222233',
    clabe: '012111122223333444',
    bankCode: '012',
    bankName: 'BBVA',
    email: 'maria@email.com',
    phone: '+52 55 9876 5432',
    isFavorite: true,
    category: 'family',
    createdAt: '2024-02-10T10:00:00Z',
  },
  {
    id: 'ben_002',
    userId: 'usr_123456789',
    name: 'Carlos Rodríguez',
    accountNumber: '4444555566',
    clabe: '002444455556666777',
    bankCode: '002',
    bankName: 'SmartBank',
    email: 'carlos@email.com',
    phone: '+52 33 1234 5678',
    isFavorite: false,
    category: 'friend',
    createdAt: '2024-03-05T12:00:00Z',
  },
  {
    id: 'ben_003',
    userId: 'usr_123456789',
    name: 'Empresa XYZ S.A.',
    accountNumber: '9999888877',
    clabe: '060999988887766554',
    bankCode: '060',
    bankName: 'Banamex',
    email: 'pagos@xyz.com',
    phone: '+52 55 5555 1234',
    isFavorite: true,
    category: 'business',
    createdAt: '2024-01-20T08:00:00Z',
  },
];

// ============================================================================
// NOTIFICATION MOCK DATA
// ============================================================================
// Notifications represent in-app and push notifications.

const mockNotifications = [
  {
    id: 'notif_001',
    userId: 'usr_123456789',
    type: 'transaction',
    title: 'Transferencia exitosa',
    message: 'Se transfirieron $2,500.00 MXN a María López',
    isRead: false,
    createdAt: '2024-06-20T14:30:00Z',
    data: { transactionId: 'txn_001' },
  },
  {
    id: 'notif_002',
    userId: 'usr_123456789',
    type: 'security',
    title: 'Nuevo inicio de sesión',
    message: 'Se detectó un nuevo inicio de sesión desde Ciudad de México',
    isRead: true,
    createdAt: '2024-06-19T08:15:00Z',
    data: { ip: '189.203.100.50' },
  },
  {
    id: 'notif_003',
    userId: 'usr_123456789',
    type: 'promotion',
    title: 'Nueva tarjeta disponible',
    message: 'Solicita tu nueva tarjeta SmartBank Platinum con 2% de cashback',
    isRead: false,
    createdAt: '2024-06-18T10:00:00Z',
    data: null,
  },
];

// ============================================================================
// BILL PAYMENT MOCK DATA
// ============================================================================
// Represents utility bills and recurring payments.

const mockBillPayments = [
  {
    id: 'bill_001',
    userId: 'usr_123456789',
    accountId: 'acc_001',
    billerName: 'CFE (Comisión Federal de Electricidad)',
    billerCode: 'CFE001',
    accountNumber: '12345678901',
    amount: 850.00,
    dueDate: '2024-07-05',
    status: 'pending',
    isRecurring: true,
    lastPayment: '2024-06-05',
  },
  {
    id: 'bill_002',
    userId: 'usr_123456789',
    accountId: 'acc_001',
    billerName: 'Telmex',
    billerCode: 'TEL001',
    accountNumber: '5555123456',
    amount: 599.00,
    dueDate: '2024-07-10',
    status: 'pending',
    isRecurring: true,
    lastPayment: '2024-06-10',
  },
];

// ============================================================================
// API RESPONSE MOCKS
// ============================================================================
// These mimic the shape of responses from the SmartBank API.
// The API follows a consistent response format:
//   { success: true, data: {...} } for success
//   { success: false, error: { code: '...', message: '...' } } for errors

const mockApiLoginSuccess = {
  success: true,
  data: {
    user: mockUser,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-jwt-token',
    refreshToken: 'mock-refresh-token-abc123',
    expiresIn: 3600,
  },
};

const mockApiLoginError = {
  success: false,
  error: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Correo electrónico o contraseña incorrectos',
  },
};

const mockApiGetAccountsSuccess = {
  success: true,
  data: {
    accounts: mockAccounts,
    total: mockAccounts.length,
  },
};

const mockApiGetTransactionsSuccess = {
  success: true,
  data: {
    transactions: mockTransactions,
    pagination: {
      page: 1,
      limit: 10,
      totalItems: mockTransactions.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
};

const mockApiTransferSuccess = {
  success: true,
  data: {
    transaction: {
      id: 'txn_new_001',
      type: 'transfer',
      amount: -1000.00,
      status: 'completed',
      reference: 'REF-2024-NEW',
      createdAt: new Date().toISOString(),
    },
    newBalance: 44250.75,
  },
};

const mockApiTransferInsufficientFunds = {
  success: false,
  error: {
    code: 'TRANSFER_INSUFFICIENT_FUNDS',
    message: 'Saldo insuficiente para realizar la transferencia',
  },
};

const mockApiServerError = {
  success: false,
  error: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Error interno del servidor. Intenta más tarde.',
  },
};

const mockApiRateLimited = {
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.',
  },
};

// ============================================================================
// EDGE CASE DATA
// ============================================================================
// Edge cases are scenarios that are uncommon but valid.
// Testing edge cases prevents bugs in production.

const mockEmptyUser = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  role: 'user',
};

const mockTransactionWithSpecialChars = {
  id: 'txn_special',
  description: 'Pago <script>alert("xss")</script> & "injection"',
  amount: -100,
  currency: 'MXN',
};

const mockLargeTransaction = {
  id: 'txn_large',
  amount: 999999999.99,
  currency: 'MXN',
  description: 'Transferencia de monto extremadamente grande',
};

const mockNegativeAmountTransaction = {
  id: 'txn_negative',
  amount: -50000.00,
  currency: 'MXN',
  description: 'Retiro grande',
};

// ============================================================================
// TEST FIXTURES
// ============================================================================
// Fixtures are static data sets used to set up test scenarios.
// Unlike mocks, fixtures represent "happy path" data.

const fixtures = {
  user: mockUser,
  accounts: mockAccounts,
  cards: mockCards,
  transactions: mockTransactions,
  beneficiaries: mockBeneficiaries,
  notifications: mockNotifications,
  billPayments: mockBillPayments,
};

// ============================================================================
// MODULE EXPORTS
// ============================================================================
// We export individual items AND a grouped fixtures object.
// Individual exports: for when tests need specific data.
// Fixtures object: for when tests need a complete test setup.

module.exports = {
  // Individual mocks
  mockUser,
  mockAdminUser,
  mockAccounts,
  mockCards,
  mockTransactions,
  mockBeneficiaries,
  mockNotifications,
  mockBillPayments,

  // API response mocks
  mockApiLoginSuccess,
  mockApiLoginError,
  mockApiGetAccountsSuccess,
  mockApiGetTransactionsSuccess,
  mockApiTransferSuccess,
  mockApiTransferInsufficientFunds,
  mockApiServerError,
  mockApiRateLimited,

  // Edge cases
  mockEmptyUser,
  mockTransactionWithSpecialChars,
  mockLargeTransaction,
  mockNegativeAmountTransaction,

  // Grouped fixtures
  fixtures,
};
