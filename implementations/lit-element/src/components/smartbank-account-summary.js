/**
 * SmartBank Account Summary - LitElement Web Component
 * 
 * COMPUTED PROPERTIES in LitElement:
 * - Lit doesn't have built-in computed properties like Vue
 * - Use getter methods with caching
 * - OR compute in render() (recalculates each render)
 * - OR use @state with manual update in updated()
 * 
 * LIFECYCLE for data:
 * - connectedCallback: Fetch initial data
 * - updated: React to property changes
 * - disconnectedCleanup: Cancel subscriptions
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('smartbank-account-summary')
export class SmartBankAccountSummary extends LitElement {
  @property({ type: Object })
  account = null;

  @state()
  _transactions = [];

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .summary {
      background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
      color: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
    }

    .account-name {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .account-type {
      font-size: 14px;
      opacity: 0.8;
      text-transform: uppercase;
      margin: 0 0 24px 0;
    }

    .balance-label {
      font-size: 14px;
      opacity: 0.8;
      margin: 0 0 8px 0;
    }

    .balance-amount {
      font-size: 40px;
      font-weight: 700;
      margin: 0 0 24px 0;
    }

    .account-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 4px;
    }

    .detail-value {
      font-size: 16px;
      font-weight: 500;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
      background: rgba(255, 255, 255, 0.2);
    }
  `;

  // WHY computed getter?
  // Recalculates only when account changes
  // Cached by JavaScript engine
  get _formattedBalance() {
    if (!this.account) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(this.account.balance);
  }

  get _maskedAccountNumber() {
    if (!this.account?.number) return '****';
    return '****' + this.account.number.slice(-4);
  }

  render() {
    if (!this.account) {
      return html`<div class="summary"><p>No account selected</p></div>`;
    }

    return html`
      <div class="summary">
        <h2 class="account-name">${this.account.name}</h2>
        <p class="account-type">${this.account.type}</p>
        <p class="balance-label">Available Balance</p>
        <p class="balance-amount">${this._formattedBalance}</p>
        <div class="account-details">
          <div class="detail-item">
            <span class="detail-label">Account Number</span>
            <span class="detail-value">${this._maskedAccountNumber}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status</span>
            <span class="status-badge">${this.account.status}</span>
          </div>
        </div>
      </div>
      <slot></slot>
    `;
  }
}

customElements.define('smartbank-account-summary', SmartBankAccountSummary);
