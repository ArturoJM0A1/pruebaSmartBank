/**
 * SmartBank Input - LitElement Web Component
 * 
 * TWO-WAY BINDING in LitElement:
 * - Use @input event + property update
 * - Parent can listen: <smartbank-input @input-change=${handler}>
 * - OR use the value property: <smartbank-input .value=${state}>
 * 
 * LIT PROPERTY SYSTEM:
 * - .value: Sets JavaScript property directly
 * - value="x": Sets HTML attribute (always string)
 * - @property({ attribute: false }): Disable attribute mapping
 * 
 * ACCESSIBILITY (a11y):
 * - Labels associated with inputs (for/id)
 * - aria-describedby for error messages
 * - aria-invalid for invalid states
 * - Focus management for keyboard navigation
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('smartbank-input')
export class SmartBankInput extends LitElement {
  @property({ type: String })
  label = '';

  @property({ type: String })
  type = 'text';

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  value = '';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  required = false;

  // WHY @state instead of @property?
  // @state: Internal state, not exposed as attribute
  // @property: Exposed as HTML attribute
  // Error state should be managed internally
  @state()
  error = '';

  @state()
  touched = false;

  // Generate unique ID for label-input association
  static _idCounter = 0;
  _inputId = `smartbank-input-${++SmartBankInput._idCounter}`;

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: var(--text-primary, #202124);
    }

    .required {
      color: var(--error-color, #ea4335);
      margin-left: 2px;
    }

    input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color, #dadce0);
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: var(--primary-color, #1a73e8);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.2);
    }

    input.error {
      border-color: var(--error-color, #ea4335);
    }

    input:disabled {
      background: var(--background, #f8f9fa);
      cursor: not-allowed;
    }

    .error-message {
      display: block;
      color: var(--error-color, #ea4335);
      font-size: 14px;
      margin-top: 4px;
    }
  `;

  render() {
    return html`
      <label for="${this._inputId}">
        ${this.label}
        ${this.required ? html`<span class="required">*</span>` : ''}
      </label>
      <input
        id="${this._inputId}"
        type="${this.type}"
        .value=${this.value}
        placeholder="${this.placeholder}"
        ?disabled=${this.disabled}
        ?required=${this.required}
        class="${this.error ? 'error' : ''}"
        aria-invalid="${this.error ? 'true' : 'false'}"
        aria-describedby="${this.error ? `${this._inputId}-error` : ''}"
        @input=${this._handleInput}
        @blur=${this._handleBlur}
      />
      ${this.error
        ? html`
            <span class="error-message" id="${this._inputId}-error" role="alert">
              ${this.error}
            </span>
          `
        : ''}
    `;
  }

  _handleInput(event) {
    this.value = event.target.value;

    // Emit custom event for parent
    this.dispatchEvent(
      new CustomEvent('input-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );

    // Clear error on input
    if (this.error) {
      this.error = '';
    }
  }

  _handleBlur() {
    this.touched = true;

    // Validate on blur
    if (this.required && !this.value) {
      this.error = `${this.label} is required`;
    }

    this.dispatchEvent(
      new CustomEvent('input-blur', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  // WHY updated lifecycle?
  // Runs after every render
  // Can react to property changes
  updated(changedProperties) {
    if (changedProperties.has('value')) {
      // Property changed from outside
      // Update internal state if needed
    }
  }
}

customElements.define('smartbank-input', SmartBankInput);
