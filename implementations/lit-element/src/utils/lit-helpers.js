/**
 * LitElement Helper Utilities
 * 
 * DECORATORS in LitElement:
 * - @customElement('tag-name'): Register component
 * - @property(): Define reactive property
 * - @state(): Internal reactive state
 * - @query(): Query Shadow DOM element
 * - @queryAll(): Query multiple elements
 * - @queryAsync(): Query after render
 * 
 * MIXINS:
 * - Add shared functionality to multiple components
 * - TypeScript mixin pattern
 * - Like React's HOC or Vue's composables
 * - Examples: ConnectedMixin, LoadingMixin
 */

/**
 * Mixin for components that need API access
 * WHY mixin? Share HTTP logic across components
 * Alternative: Inheritance (limited in JS), Composition (functions)
 */
export function ApiMixin(Base) {
  return class ApiMixin extends Base {
    _apiBase = 'http://localhost:3000/api';

    async _fetch(path, options = {}) {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      const response = await fetch(`${this._apiBase}${path}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return response.json();
    }

    async _get(path) {
      return this._fetch(path);
    }

    async _post(path, data) {
      return this._fetch(path, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  };
}

/**
 * Format currency helper
 * WHY outside component? Pure function, no DOM dependency
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date helper
 */
export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
}

/**
 * Debounce helper
 * WHY standalone? Works with any context (components, event listeners)
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Event bus for cross-component communication
 * WHY? Web Components don't have built-in event system
 * Alternative: Custom events on document, state management library
 */
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this._listeners.get(event)?.forEach((cb) => cb(data));
  }
}

export const eventBus = new EventBus();
