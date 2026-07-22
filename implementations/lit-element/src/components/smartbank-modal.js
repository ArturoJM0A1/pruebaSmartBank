/**
 * SmartBank Modal - LitElement Web Component
 * 
 * ACCESSIBILITY in Web Components:
 * - Focus trap: Keep focus within modal when open
 * - Escape key: Close modal
 * - aria-modal: Indicates modal behavior
 * - role="dialog": Semantic meaning for screen readers
 * - aria-labelledby: Associates title with dialog
 * - Return focus: Return focus to trigger element when closed
 * 
 * WHY accessibility matters:
 * - Legal requirements (ADA, WCAG)
 * - Inclusive design benefits everyone
 * - Screen reader users need proper semantics
 * - Keyboard-only users need focus management
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('smartbank-modal')
export class SmartBankModal extends LitElement {
  @property({ type: Boolean, attribute: 'open' })
  isOpen = false;

  @property({ type: String })
  title = '';

  @state()
  _previousFocus = null;

  static styles = css`
    :host {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    }

    .overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .modal {
      background: var(--surface, #ffffff);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: auto;
      transform: translateY(-20px);
      transition: transform 0.2s;
    }

    .overlay.open .modal {
      transform: translateY(0);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #dadce0);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      color: var(--text-secondary, #5f6368);
    }

    .close-btn:hover {
      color: var(--text-primary, #202124);
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, #dadce0);
    }
  `;

  // Lifecycle: When added to DOM
  connectedCallback() {
    super.connectedCallback();
    // WHY bind in constructor?
    // Ensures correct `this` when used as event handler
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  // Lifecycle: When removed from DOM
  disconnectedCallback() {
    super.disconnectedCallback();
    // WHY remove event listener?
    // Prevents memory leaks
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  updated(changedProperties) {
    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        // WHY save previous focus?
        // Return focus to trigger element when modal closes
        this._previousFocus = document.activeElement;
        document.addEventListener('keydown', this._handleKeyDown);
        // Focus first focusable element
        requestAnimationFrame(() => {
          const firstFocusable = this.shadowRoot?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          firstFocusable?.focus();
        });
        document.body.style.overflow = 'hidden'; // Prevent background scroll
      } else {
        document.removeEventListener('keydown', this._handleKeyDown);
        // Return focus to previous element
        if (this._previousFocus) {
          this._previousFocus.focus();
          this._previousFocus = null;
        }
        document.body.style.overflow = '';
      }
    }
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape') {
      this._close();
    }
    // WHY focus trap?
    // Keeps Tab key cycling within modal
    // Prevents keyboard users from escaping the modal
    if (event.key === 'Tab') {
      this._trapFocus(event);
    }
  }

  _trapFocus(event) {
    const focusableElements = this.shadowRoot?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  _close() {
    this.dispatchEvent(
      new CustomEvent('modal-close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="overlay ${this.isOpen ? 'open' : ''}" @click=${this._close}>
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          @click=${(e) => e.stopPropagation()}
        >
          <div class="modal-header">
            <h2 id="modal-title">${this.title}</h2>
            <button class="close-btn" @click=${this._close} aria-label="Close">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('smartbank-modal', SmartBankModal);
