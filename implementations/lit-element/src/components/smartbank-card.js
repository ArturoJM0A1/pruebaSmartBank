/**
 * SmartBank Card - LitElement Web Component
 * 
 * LITELEMENT LIFECYCLE:
 * - constructor(): Called when element is created
 * - connectedCallback(): Added to DOM (like React's componentDidMount)
 * - disconnectedCallback(): Removed from DOM (like componentWillUnmount)
 * - updated(changedProperties): After render, when properties change
 * - firstUpdated(changedProperties): After first render only
 * 
 * REACTIVE PROPERTIES:
 * - @property(): Define component properties with types
 * - Properties trigger re-renders when changed
 * - Support: types, defaults, attributes, reflection
 * - WHY reactive? Web Components need explicit property tracking
 * 
 * SHADOW DOM:
 * - Encapsulated DOM tree for each component
 * - Styles don't leak out, external styles don't leak in
 * - Like React's CSS Modules but at the browser level
 * - Creates a "shadow root" that's part of the component
 * 
 * TEMPLATE LITERS:
 * - html`...`: Tagged template literal for HTML
 * - css`...`: Tagged template literal for CSS
 * - Both provide syntax highlighting and security
 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('smartbank-card')
export class SmartBankCard extends LitElement {
  // WHY @property decorator?
  // Declaratively defines reactive properties
  // Handles types, defaults, attribute mapping automatically
  // Triggers re-renders when value changes
  @property({ type: String })
  title = '';

  @property({ type: String })
  subtitle = '';

  @property({ type: Number })
  balance = 0;

  @property({ type: String })
  currency = 'USD';

  @property({ type: Boolean })
  highlighted = false;

  // WHY static styles?
  // Styles are scoped to Shadow DOM
  // Shared across all instances (better performance)
  // Can be defined as static getter for complex styles
  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .card {
      background: var(--card-bg, #ffffff);
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      padding: 24px;
      transition: all 0.2s ease-in-out;
      border: 2px solid transparent;
    }

    .card:hover {
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
      transform: translateY(-2px);
    }

    .card.highlighted {
      border-color: var(--primary-color, #1a73e8);
    }

    .card-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: var(--text-primary, #202124);
    }

    .card-subtitle {
      font-size: 14px;
      color: var(--text-secondary, #5f6368);
      margin: 0 0 16px 0;
      text-transform: uppercase;
    }

    .card-balance {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color, #1a73e8);
      margin: 0;
    }

    .slot-wrapper {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #dadce0);
    }
  `;

  // WHY render() method?
  // Returns HTML template for the component
  // Called automatically when properties change
  // Uses lit-html for efficient DOM updates
  // Only changes what's different (virtual DOM-like diffing)
  render() {
    // WHY formatBalance in render?
    // Recalculates when balance or currency changes
    // Could use @state for cached computation
    const formattedBalance = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    }).format(this.balance);

    return html`
      <div class="card ${this.highlighted ? 'highlighted' : ''}">
        <h3 class="card-title">${this.title}</h3>
        <p class="card-subtitle">${this.subtitle}</p>
        <p class="card-balance">${formattedBalance}</p>
        <!--
          WHY <slot>?
          Slot projection (like React's {children} or Vue's <slot>)
          Allows parent to inject content into component
          <smartbank-card><span>Custom content</span></smartbank-card>
        -->
        <div class="slot-wrapper">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// Register custom element
// WHY manual registration?
// - Ensures element is available when used
// - No build-time magic required
// - Works with any framework or vanilla JS
customElements.define('smartbank-card', SmartBankCard);
