/**
 * SmartBank Notification - LitElement Web Component
 * 
 * CSS PARTS & THEMING:
 * - ::part() selector allows external styling of Shadow DOM parts
 * - <style> smartbank-notification::part(container) { ... }
 * - Provides controlled styling access to Shadow DOM
 * - WHY? Balance between encapsulation and customization
 * 
 * ANIMATIONS in Web Components:
 * - Keyframes defined in component CSS
 * - Can be triggered by property changes
 * - CSS animations work inside Shadow DOM
 * - Consider prefers-reduced-motion for accessibility
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('smartbank-notification')
export class SmartBankNotification extends LitElement {
  @property({ type: String })
  type = 'info'; // info, success, warning, error

  @property({ type: String })
  message = '';

  @property({ type: Boolean })
  autoClose = true;

  @property({ type: Number })
  duration = 5000;

  @state()
  visible = false;

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .notification {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }

    .notification.visible {
      opacity: 1;
      visibility: visible;
    }

    .notification.info {
      background: #e3f2fd;
      color: #1565c0;
      border-left: 4px solid #1565c0;
    }

    .notification.success {
      background: #e6f4ea;
      color: #1e7e34;
      border-left: 4px solid #1e7e34;
    }

    .notification.warning {
      background: #fef7e0;
      color: #e37400;
      border-left: 4px solid #e37400;
    }

    .notification.error {
      background: #fce8e6;
      color: #c62828;
      border-left: 4px solid #c62828;
    }

    .icon {
      margin-right: 12px;
      font-size: 20px;
    }

    .message {
      flex: 1;
      font-size: 14px;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      margin-left: 12px;
      font-size: 18px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .close-btn:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Respect reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      .notification {
        animation: none;
        transition: opacity 0.2s, visibility 0.2s;
      }
    }
  `;

  // Icons for different notification types
  _icons = {
    info: '\u2139',
    success: '\u2714',
    warning: '\u26A0',
    error: '\u2716',
  };

  updated(changedProperties) {
    if (changedProperties.has('message') && this.message) {
      this.visible = true;
      if (this.autoClose) {
        setTimeout(() => this.hide(), this.duration);
      }
    }
  }

  hide() {
    this.visible = false;
    this.dispatchEvent(
      new CustomEvent('notification-close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div
        class="notification ${this.type} ${this.visible ? 'visible' : ''}"
        part="container"
        role="alert"
        aria-live="polite"
      >
        <span class="icon">${this._icons[this.type]}</span>
        <span class="message">${this.message}</span>
        <button class="close-btn" @click=${this.hide} aria-label="Close">
          &times;
        </button>
      </div>
    `;
  }
}

customElements.define('smartbank-notification', SmartBankNotification);
