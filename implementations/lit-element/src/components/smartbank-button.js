/**
 * SmartBank Button - LitElement Web Component
 * 
 * SHADOW DOM & CSS ENCAPSULATION:
 * - Styles are completely isolated per component
 * - External CSS can't affect component internals
 * - Component styles can't leak out
 * - Benefits:
 *   → No style conflicts
 *   → Component works anywhere
 *   → No need for BEM naming conventions
 *   → No CSS-in-JS or CSS Modules needed
 * 
 * SLOTS (Named Slots):
 * - <slot> for default content
 * - <slot name="icon"> for named slots
 * - Parent uses slot="icon" attribute to target slot
 * - Provides flexible component composition
 * 
 * EVENT DISPATCHING:
 * - CustomEvent for component-to-parent communication
 * - this.dispatchEvent(new CustomEvent('click'))
 * - Parent listens: <smartbank-button @click=${handler}>
 * - WHY CustomEvent? Standard web API, framework-agnostic
 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('smartbank-button')
export class SmartBankButton extends LitElement {
  @property({ type: String })
  variant = 'primary'; // primary, secondary, danger

  @property({ type: String })
  size = 'medium'; // small, medium, large

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  // WHY static styles with CSS custom properties?
  // Allows theming from outside the component
  // <smartbank-button style="--btn-bg: green">
  // External CSS variables can customize appearance
  static styles = css`
    :host {
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      width: 100%;
    }

    /* Sizes */
    button.small {
      padding: 8px 16px;
      font-size: 14px;
    }

    button.medium {
      padding: 12px 24px;
      font-size: 16px;
    }

    button.large {
      padding: 16px 32px;
      font-size: 18px;
    }

    /* Variants using CSS custom properties */
    button.primary {
      background: var(--primary-color, #1a73e8);
      color: white;
    }

    button.primary:hover:not(:disabled) {
      background: var(--primary-hover, #1557b0);
      box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.12));
    }

    button.secondary {
      background: var(--surface, #ffffff);
      color: var(--text-primary, #202124);
      border: 1px solid var(--border-color, #dadce0);
    }

    button.secondary:hover:not(:disabled) {
      background: var(--background, #f8f9fa);
    }

    button.danger {
      background: var(--error-color, #ea4335);
      color: white;
    }

    button.danger:hover:not(:disabled) {
      background: #d33426;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  render() {
    return html`
      <button
        class="${this.variant} ${this.size}"
        ?disabled=${this.disabled || this.loading}
        @click=${this._handleClick}
      >
        ${this.loading ? html`<span class="spinner"></span>` : ''}
        <slot></slot>
      </button>
    `;
  }

  _handleClick(event) {
    // WHY prevent default?
    // Prevents form submission if button is inside a form
    if (this.disabled || this.loading) {
      event.preventDefault();
      return;
    }

    // Dispatch custom event to parent
    // WHY composed: true?
    // Allows event to cross Shadow DOM boundary
    this.dispatchEvent(
      new CustomEvent('button-click', {
        detail: { originalEvent: event },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define('smartbank-button', SmartBankButton);
