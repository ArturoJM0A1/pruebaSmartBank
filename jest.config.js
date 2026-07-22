/**
 * ============================================================================
 * SMARTBANK - JEST CONFIGURATION
 * ============================================================================
 * 
 * PURPOSE: Configure Jest test runner for the SmartBank project.
 * 
 * KEY CONCEPTS:
 *   - testEnvironment: Which browser/Node environment to simulate
 *   - coverage: Code coverage reporting (what % of code is tested)
 *   - moduleNameMapper: Map module paths to mock implementations
 *   - setupFiles: Files that run before every test suite
 * 
 * JEST vs OTHER TESTERS:
 *   - Jest: Full-featured, built-in assertions, mocking, coverage. Best for most projects.
 *   - Mocha: Lightweight, bring your own assertions. More flexible but more setup.
 *   - Vitest: Jest-compatible, faster, ESM-native. Newer alternative.
 * 
 * ============================================================================
 */

module.exports = {
  // WHAT: The environment Jest runs tests in.
  // jsdom: Simulates a browser DOM in Node.js (for testing DOM manipulation)
  // node: For backend/server code (no DOM)
  // WHY jsdom: SmartBank is a frontend app that manipulates the DOM
  testEnvironment: 'jsdom',

  // WHAT: Directories where Jest looks for test files
  roots: ['<rootDir>/tests'],

  // WHAT: File patterns Jest considers to be test files
  // Jest runs files matching: **/*.test.js, **/*.spec.js, **/__tests__/**
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
  ],

  // WHAT: Module path aliases (maps import paths to actual files)
  // WHY: Allows `import helpers from '@/utils/helpers'` in tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/api/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    // Mock static assets that Jest can't process
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },

  // WHAT: Files that run before ALL test suites (global setup)
  // WHY: Set up global mocks, fetch polyfill, DOM environment
  setupFiles: [
    '<rootDir>/tests/setup.js',
  ],

  // WHAT: Files that run after Jest is installed in the environment
  // jest-fetch-mock patches fetch globally in the jsdom environment
  setupFilesAfterEnv: [
    'jest-fetch-mock',
  ],

  // WHAT: Code coverage configuration
  // WHY: Coverage tells us what % of our code is actually tested
  // Low coverage = risky code that might have hidden bugs
  collectCoverageFrom: [
    'src/**/*.js',
    'api/**/*.js',
    '!src/assets/**',
    '!src/styles/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],

  // WHAT: Directory where coverage reports are saved
  coverageDirectory: 'coverage',

  // WHAT: Minimum coverage thresholds - tests FAIL if below these
  // WHY: Enforces quality standards. Without thresholds, coverage can
  // silently drop as new untested code is added.
  coverageThreshold: {
    global: {
      branches: 60,    // 60% of if/else branches tested
      functions: 70,   // 70% of functions called in tests
      lines: 70,       // 70% of code lines executed
      statements: 70,  // 70% of statements executed
    },
  },

  // WHAT: Coverage report formats
  // text: console output (for CI)
  // lcov: HTML report (for local viewing)
  // json: machine-readable (for SonarQube)
  coverageReporters: ['text', 'lcov', 'json', 'json-summary'],

  // WHAT: Timeout for individual tests (ms)
  // WHY: Default 5000ms is usually enough; increase only if needed
  testTimeout: 10000,

  // WHAT: Whether to clean up mock calls between tests
  // true = each test starts with fresh mocks (isolated tests)
  clearMocks: true,

  // WHAT: Whether to collect coverage from all files, not just tested ones
  // true = shows untested code (more accurate coverage picture)
  collectCoverage: true,

  // WHAT: Transform configuration for non-JS files
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // WHAT: Files/directories to ignore during test discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/implementations/',
    '/coverage/',
    '/docs/',
  ],

  // WHAT: Verbose test output (shows individual test names)
  verbose: true,
};
