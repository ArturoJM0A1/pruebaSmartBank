/**
 * Dashboard Component - Angular
 * 
 * OnInit / OnDestroy lifecycle hooks:
 * - ngOnInit: Initialize component (fetch data, set up subscriptions)
 * - ngOnDestroy: Clean up (unsubscribe, remove event listeners)
 * 
 * SUBSCRIPTION MANAGEMENT:
 * - Angular uses RxJS Observables
 * - Must unsubscribe to prevent memory leaks
 * - takeUntil, takeUntilDestroyed patterns
 * - Async pipe auto-unsubscribes (recommended)
 * 
 * WHY async pipe over manual subscription?
 * - Automatic unsubscribe (no memory leaks)
 * - Cleaner code (no ngAfterViewInit)
 * - Better change detection
 * - Handles loading/error states with | async
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe],
  template: `
    <div class="dashboard">
      @if (loading()) {
        <div class="loading-spinner">Loading dashboard...</div>
      } @else {
        <header class="dashboard-header">
          <h1>Welcome, {{ auth.user()?.name || 'User' }}</h1>
          <p class="dashboard-date">{{ today | date:'longDate' }}</p>
        </header>

        <section class="accounts-summary">
          <h2>Account Overview</h2>
          @if (accounts().length > 0) {
            <div class="account-cards">
              @for (account of accounts(); track account.id) {
                <div class="account-card">
                  <h3>{{ account.name }}</h3>
                  <p class="account-type">{{ account.type }}</p>
                  <p class="account-balance">{{ account.balance | currencyFormat }}</p>
                </div>
              }
            </div>
          } @else {
            <p class="empty-state">No accounts found.</p>
          }
        </section>

        <section class="recent-transactions">
          <h2>Recent Transactions</h2>
          @if (recentTransactions().length > 0) {
            <table class="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (tx of recentTransactions(); track tx.id) {
                  <tr>
                    <td>{{ tx.date | date:'mediumDate' }}</td>
                    <td>{{ tx.description }}</td>
                    <td [class]="tx.amount >= 0 ? 'positive' : 'negative'">
                      {{ tx.amount | currencyFormat }}
                    </td>
                    <td>
                      <span class="status-{{ tx.status }}">{{ tx.status }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="empty-state">No recent transactions.</p>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .dashboard-header {
      margin-bottom: 40px;
    }
    .dashboard-header h1 {
      font-size: 28px;
    }
    .dashboard-date {
      color: #5f6368;
    }
    section {
      margin-bottom: 40px;
    }
    section h2 {
      font-size: 20px;
      margin-bottom: 20px;
    }
    .account-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .account-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      padding: 24px;
    }
    .account-balance {
      font-size: 24px;
      font-weight: 600;
      color: #1a73e8;
      margin: 16px 0;
    }
    .account-type {
      color: #5f6368;
      text-transform: uppercase;
      font-size: 14px;
    }
    .transactions-table {
      width: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      border-collapse: collapse;
    }
    .transactions-table th,
    .transactions-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #dadce0;
    }
    .transactions-table th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .positive { color: #34a853; }
    .negative { color: #ea4335; }
    .status-completed {
      background: #e6f4ea;
      color: #34a853;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
    }
    .status-pending {
      background: #fef7e0;
      color: #e37400;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
    }
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 60px;
      color: #5f6368;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #5f6368;
      background: white;
      border-radius: 8px;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  today = new Date();
  loading = signal(true);
  accounts = signal<Account[]>([]);
  recentTransactions = signal<Transaction[]>([]);

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    // WHY forkJoin for parallel requests?
    // Executes multiple Observables in parallel
    // Emits when ALL complete
    // Better than sequential awaits for independent data
    this.api.get<Account[]>('/accounts').subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.get<Transaction[]>('/transactions?limit=5').subscribe({
      next: (txs) => this.recentTransactions.set(txs),
    });
  }
}
