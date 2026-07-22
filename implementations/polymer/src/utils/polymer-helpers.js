/**
 * Polymer Helper Utilities
 * 
 * POLYMER vs LIT migration path:
 * 
 * 1. DOM module → ES module:
 *    Polymer: <dom-module id="x"><template>...</template></dom-module>
 *    Lit: export class X extends LitElement { render() { return html`...` } }
 * 
 * 2. Properties:
 *    Polymer: static get properties() { return { x: { type: String } } }
 *    Lit: @property({ type: String }) x = '';
 * 
 * 3. Computed properties:
 *    Polymer: x: { computed: '_computeY(a, b)' }
 *    Lit: get computedValue() { return this.a + this.b; }
 * 
 * 4. Observers:
 *    Polymer: x: { observer: '_onXChange' }
 *    Lit: updated(changed) { if (changed.has('x')) {...} }
 * 
 * 5. Event handling:
 *    Polymer: on-click="_handler"
 *    Lit: @click=${this.handler}
 * 
 * 6. Template binding:
 *    Polymer: [[expression]] (one-way), {{expression}} (two-way)
 *    Lit: ${expression} (one-way)
 * 
 * 7. Conditional rendering:
 *    Polymer: <div if="[[condition]]">...</div>
 *    Lit: ${condition ? html`<div>...</div>` : ''}
 * 
 * 8. List rendering:
 *    Polymer: <dom-repeat items="[[items]]"><template>...</template></dom-repeat>
 *    Lit: ${items.map(item => html`...`)}
 * 
 * 9. Data binding:
 *    Polymer: <input value="{{text::input}}">
 *    Lit: <input .value=${this.text} @input=${this.handler}>
 * 
 * 10. Child component:
 *     Polymer: <smart-bank-card title="[[name]]">
 *     Lit: <smartbank-card .title=${this.name}>
 */

// Shared formatting utilities
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
}

/**
 * Polymer Behaviors (legacy pattern):
 * - Define shared functionality as plain objects
 * - Include in component via behaviors: [BehaviorName]
 * - Modern alternative: ES modules, mixins
 * 
 * Example behavior:
 * export const FormValidationBehavior = {
 *   validate: function() { ... },
 *   _showError: function(field, message) { ... },
 * };
 */
export const FormValidationBehavior = {
  validateField(value, rules) {
    for (const rule of rules) {
      if (rule.required && !value) {
        return rule.message || 'This field is required';
      }
      if (rule.minLength && value.length < rule.minLength) {
        return `Must be at least ${rule.minLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || 'Invalid format';
      }
    }
    return null;
  },
};

/**
 * Polymer async utilities
 * Polymer had built-in async methods:
 * - this.async(fn, delay): setTimeout wrapper
 * - this.debounce(name, fn, delay): Named debounce
 * - this.throttle(name, fn, delay): Named throttle
 * 
 * Modern equivalent: Standard JS setTimeout, custom debounce/throttle
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit = 300) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
