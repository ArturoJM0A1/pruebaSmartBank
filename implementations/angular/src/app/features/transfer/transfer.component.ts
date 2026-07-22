/**
 * Transfer Component - Angular Multi-Step Form
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyFormatPipe],
  template: `
    <div class="transfer-form">
      <h1>Transfer Money</h1>

      <div class="step-indicator">
        @for (s of [1, 2, 3]; track s) {
          <div class="step" [class.active]="step() === s" [class.completed]="step() > s">
            <span class="step-number">{{ s }}</span>
            <span class="step-label">{{ s === 1 ? 'Accounts' : s === 2 ? 'Details' : 'Confirm' }}</span>
          </div>
        }
      </div>

      @if (result()) {
        <div class="transfer-result">
          <h2>{{ result()!.success ? 'Transfer Complete!' : 'Transfer Failed' }}</h2>
          @if (result()!.success) {
            <p>Transaction ID: {{ result()!.transactionId }}</p>
          } @else {
            <p class="error">{{ result()!.error }}</p>
          }
          <button (click)="resetForm()">New Transfer</button>
        </div>
      } @else if (step() === 1) {
        <h2>Select Accounts</h2>
        <p>Select source and destination accounts for the transfer.</p>
        <div class="step-actions">
          <button (click)="step.set(2)">Next</button>
        </div>
      } @else if (step() === 2) {
        <h2>Transfer Details</h2>
        <p>Enter the amount and description.</p>
        <div class="step-actions">
          <button (click)="step.set(1)">Back</button>
          <button (click)="step.set(3)">Review</button>
        </div>
      } @else {
        <h2>Confirm Transfer</h2>
        <div class="step-actions">
          <button (click)="step.set(2)">Back</button>
          <button (click)="confirmTransfer()" [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Processing...' : 'Confirm Transfer' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .transfer-form { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .step-indicator { display: flex; justify-content: center; margin-bottom: 40px; gap: 40px; }
    .step { display: flex; flex-direction: column; align-items: center; opacity: 0.5; }
    .step.active { opacity: 1; }
    .step.completed { opacity: 0.8; }
    .step-number {
      width: 36px; height: 36px; border-radius: 50%;
      background: #dadce0; display: flex; align-items: center;
      justify-content: center; font-weight: 600; margin-bottom: 8px;
    }
    .step.active .step-number { background: #1a73e8; color: white; }
    .step.completed .step-number { background: #34a853; color: white; }
    .step-actions { display: flex; gap: 12px; margin-top: 24px; }
    .step-actions button {
      flex: 1; padding: 12px 24px; border: none; border-radius: 8px;
      font-size: 16px; font-weight: 500; cursor: pointer;
      background: #1a73e8; color: white;
    }
    .step-actions button:disabled { background: #5f6368; cursor: not-allowed; }
    .transfer-result { text-align: center; padding: 40px; background: white; border-radius: 8px; }
  `],
})
export class TransferComponent {
  private api = inject(ApiService);

  step = signal(1);
  isSubmitting = signal(false);
  result = signal<{ success: boolean; transactionId?: string; error?: string } | null>(null);

  async confirmTransfer() {
    this.isSubmitting.set(true);
    try {
      const response = await this.api
        .post<{ id: string }>('/transfers', {})
        .toPromise();
      this.result.set({ success: true, transactionId: response?.id });
    } catch {
      this.result.set({ success: false, error: 'Transfer failed' });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetForm() {
    this.step.set(1);
    this.result.set(null);
  }
}
