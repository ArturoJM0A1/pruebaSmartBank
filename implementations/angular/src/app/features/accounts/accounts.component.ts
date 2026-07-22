/**
 * Accounts Component - Angular
 * 
 * ASYNC PIPE:
 * - Unwraps Observable | Promise automatically
 * - Subscribes on init, unsubscribes on destroy
 * - Handles loading states with | async
 * - Like Vue's async component or React's Suspense
 * 
 * ONPUSH CHANGE DETECTION:
 * - Only checks for changes when inputs change or events fire
 * - Better performance (fewer change detection cycles)
 * - Requires immutable data patterns
 * - Use signals for automatic change detection
 * 
 * @for (item of items; track item.id) { ... }
 * @if (condition) { ... }
 * Angular 17+ new control flow syntax (replaces *ngFor, *ngIf)
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  number: string;
  status: string;
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe],
  template: `
    <div class="account-list">
      <h1>My Accounts</h1>

      <div class="filters">
        <input
          [(ngModel)]="filter"
          type="text"
          placeholder="Search accounts..."
          class="search-input"
        />
        <select [(ngModel)]="accountType" class="type-filter">
          <option value="all">All Types</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="credit">Credit Card</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-spinner">Loading accounts...</div>
      } @else {
        <div class="accounts-grid">
          @for (account of filteredAccounts(); track account.id) {
            <div class="account-card">
              <h3>{{ account.name }}</h3>
              <p class="account-type">{{ account.type }}</p>
              <p class="account-balance">{{ account.balance | currencyFormat }}</p>
              <p class="account-number">****{{ account.number.slice(-4) }}</p>
              <span class="status-{{ account.status }}">{{ account.status }}</span>
            </div>
          }
        </div>

        @if (filteredAccounts().length === 0) {
          <p class="empty-state">No accounts found.</p>
        }

        <!-- Pagination -->
        <div class="pagination">
          <button (click)="prevPage()" [disabled]="currentPage() <= 1">
            Previous
          </button>
          <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
          <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()">
            Next
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .account-list { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .filters { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-input {
      flex: 1; min-width: 200px; padding: 12px;
      border: 1px solid #dadce0; border-radius: 8px; font-size: 16px;
    }
    .type-filter { padding: 10px 12px; border: 1px solid #dadce0; border-radius: 8px; }
    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .account-card {
      background: white; border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12); padding: 24px;
    }
    .account-card:hover {
      box-shadow: 0 3px 6px rgba(0,0,0,0.16);
      transform: translateY(-2px);
    }
    .account-balance {
      font-size: 24px; font-weight: 600;
      color: #1a73e8; margin: 16px 0;
    }
    .account-type { color: #5f6368; text-transform: uppercase; font-size: 14px; }
    .account-number { color: #5f6368; font-size: 14px; }
    .status-completed {
      background: #e6f4ea; color: #34a853;
      padding: 4px 12px; border-radius: 16px; font-size: 13px;
    }
    .status-pending {
      background: #fef7e0; color: #e37400;
      padding: 4px 12px; border-radius: 16px; font-size: 13px;
    }
    .pagination {
      display: flex; justify-content: center; align-items: center;
      gap: 12px; margin-top: 24px;
    }
    .pagination button {
      padding: 8px 16px; background: white;
      border: 1px solid #dadce0; border-radius: 8px;
    }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading-spinner { display: flex; justify-content: center; padding: 60px; color: #5f6368; }
    .empty-state { text-align: center; padding: 40px; color: #5f6368; background: white; border-radius: 8px; }
  `],
})
export class AccountsComponent implements OnInit {
  private api = inject(ApiService);

  accounts = signal<Account[]>([]);
  loading = signal(true);
  filter = '';
  accountType = 'all';
  currentPage = signal(1);
  pageSize = 6;

  filteredAccounts = computed(() => {
    return this.accounts().filter((account) => {
      const matchesSearch = account.name
        .toLowerCase()
        .includes(this.filter.toLowerCase());
      const matchesType = this.accountType === 'all' || account.type === this.accountType;
      return matchesSearch && matchesType;
    });
  });

  totalPages = computed(() => Math.ceil(this.filteredAccounts().length / this.pageSize));

  ngOnInit() {
    this.api.get<Account[]>('/accounts').subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }
}
