/**
 * ============================================================================
 * SMARTBANK - JEST SETUP FILE
 * ============================================================================
 * 
 * PURPOSE: Global setup that runs before ALL test suites.
 * 
 * WHAT THIS FILE DOES:
 *   - Provides browser API polyfills missing from jsdom
 *   - Sets up global test utilities
 *   - Configures default mock behaviors
 * 
 * WHEN TO ADD SOMETHING HERE:
 *   - A browser API that jsdom doesn't implement (e.g., matchMedia)
 *   - A global mock that ALL tests need (e.g., localStorage)
 *   - A polyfill for newer JS features in older Node versions
 * 
 * ============================================================================
 */

'use strict';

/**
 * ============================================================================
 * POLYFILL: window.matchMedia
 * ============================================================================
 * 
 * WHY: jsdom doesn't implement matchMedia, but many CSS-in-JS libraries
 * and responsive design code uses it. Without this polyfill, tests crash.
 * 
 * USAGE IN CODE: window.matchMedia('(min-width: 768px)')
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false;
      },
    };
  };
}

/**
 * ============================================================================
 * POLYFILL: localStorage (in-memory implementation)
 * ============================================================================
 * 
 * WHY: jsdom's localStorage implementation might be limited or missing.
 * This provides a consistent in-memory store for all tests.
 * 
 * USAGE IN CODE: localStorage.setItem('token', 'abc123')
 */
if (typeof window !== 'undefined' && !window.localStorage) {
  const localStorageMock = (() => {
    let store = {};

    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: jest.fn((index) => {
        return Object.keys(store)[index] || null;
      }),
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

/**
 * ============================================================================
 * POLYFILL: IntersectionObserver (for lazy loading, infinite scroll)
 * ============================================================================
 * 
 * WHY: jsdom doesn't implement IntersectionObserver, but components using
 * lazy loading or infinite scroll need it for rendering.
 */
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.elements = [];
    }
    observe(element) {
      this.elements.push(element);
    }
    unobserve(element) {
      this.elements = this.elements.filter((el) => el !== element);
    }
    disconnect() {
      this.elements = [];
    }
  };
}

/**
 * ============================================================================
 * GLOBAL CLEANUP
 * ============================================================================
 * 
 * WHY: Prevent tests from leaking state into each other.
 * afterEach runs after EVERY test in EVERY file.
 */
afterEach(() => {
  // Clear localStorage
  if (window.localStorage) {
    window.localStorage.clear();
  }

  // Clear document body (remove test DOM elements)
  if (document.body) {
    document.body.innerHTML = '';
  }

  // Clear all timers
  jest.clearAllTimers();
});

/**
 * ============================================================================
 * SUPPRESS NOISE
 * ============================================================================
 * 
 * WHY: During tests, we expect certain console output (error messages,
 * warnings). Suppressing known noise keeps test output readable.
 * 
 * WARNING: Don't suppress ALL console output - you might miss real issues.
 * Only suppress specific, expected messages.
 */
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress React act() warnings in tests
    if (typeof args[0] === 'string' && args[0].includes('act(...))')) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    // Suppress specific warnings during tests
    if (typeof args[0] === 'string' && args[0].includes('deprecated')) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
