/**
 * SmartBank Transaction List - LitElement Web Component
 * 
 * RENDERING LISTS in LitElement:
 * - Use .map() inside html`` template
 * - WHY not v-for or *ngFor?
 *   Web Components use standard JavaScript
 *   .map() is native and framework-agnostic
 * 
 * TEMPLATES in Lit:
 * - html`` tagged template literals
 * - lit-html handles efficient DOM updates
 * - Only updates what changes (similar to virtual DOM)
 * - Supports: conditionals, lists, events, bindings
 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('smartbank-transaction-list')
export class SmartBankTransactionList extends LitElement {
  @property({ type: Array })
  transactions = [];

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface, #ffffff);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }

    th {
      background: var(--background, #f8f9fa);
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-secondary, #5f6368);
    }

    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color, #dadce0);
    }

    tr:hover {
      background: var(--background, #f8f9fa);
    }

    .positive {
      color: var(--success-color, #34a853);
      font-weight: 500;
    }

    .negative {
      color: var(--error-color, #ea4335);
      font-weight: 500;
    }

    .status {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
    }

    .status-completed {
      background: #e6f4ea;
      color: #34a853;
    }

    .status-pending {
      background: #fef7e0;
      color: #e37400;
    }

    .status-failed {
      background: #fce8e6;
      color: #ea4335;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary, #5f6368);
    }

    .amount {
      font-weight: 500;
    }
  `;

  _formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  _formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  render() {
    // WHY guard clause instead of nested ternary?
    // More readable, early return pattern
    if (!this.transactions?.length) {
      return html`
        <div class="empty-state">
          <p>No transactions found.</p>
        </div>
      `;
    }

    return html`
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${this.transactions.map(
            (tx) => html`
              <tr>
                <td>${this._formatDate(tx.date)}</td>
                <td>${tx.description}</td>
                <td class="amount ${tx.amount >= 0 ? 'positive' : 'negative'}">
                  ${this._formatCurrency(tx.amount)}
                </td>
                <td>
                  <span class="status status-${tx.status}">${tx.status}</span>
                </td>
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }
}

customElements.define('smartbank-transaction-list', SmartBankTransactionList);
