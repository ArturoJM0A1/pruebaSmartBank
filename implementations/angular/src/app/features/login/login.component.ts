/**
 * Login Component - Angular
 * 
 * REACTIVE FORMS in Angular:
 * - FormBuilder: Creates form controls programmatically
 * - FormGroup: Groups related controls
 * - FormControl: Individual form field
 * - Validators: Built-in and custom validation
 * 
 * WHY Reactive Forms over Template-driven?
 * - More control: programmatic vs declarative
 * - Better testability: sync validation
 * - Better type safety: TypeScript integration
 * - Better for complex forms: dynamic fields, cross-field validation
 * 
 * ANGULAR change detection:
 * - Zone.js automatically detects async operations
 * - Triggers change detection after HTTP calls, timers, events
 * - OnPush: Manual change detection (better performance)
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>SmartBank Login</h1>

        <!--
          [formGroup] binds form to component
          (ngSubmit) handles form submission
          formControlName connects each input to a form control
        -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          @if (auth.error()) {
            <div class="error-banner" role="alert">
              {{ auth.error() }}
            </div>
          }

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              [class.input-error]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <span class="error-message">
                {{ getFieldError('email') }}
              </span>
            }
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              [class.input-error]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <span class="error-message">
                {{ getFieldError('password') }}
              </span>
            }
          </div>

          <div class="form-group checkbox">
            <label>
              <input type="checkbox" formControlName="rememberMe" />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            [disabled]="auth.loading()"
            class="btn-primary"
          >
            {{ auth.loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .login-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    .login-card h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #1a73e8;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #dadce0;
      border-radius: 8px;
      font-size: 16px;
    }
    .input-error {
      border-color: #ea4335 !important;
    }
    .error-message {
      display: block;
      color: #ea4335;
      font-size: 14px;
      margin-top: 4px;
    }
    .error-banner {
      background: #fce8e6;
      color: #ea4335;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }
    button {
      cursor: pointer;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      padding: 12px 24px;
    }
    .btn-primary {
      background: #1a73e8;
      color: white;
      width: 100%;
    }
    .btn-primary:disabled {
      background: #5f6368;
      cursor: not-allowed;
      opacity: 0.6;
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  auth = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(field: string): string {
    const control = this.loginForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${field} is required`;
    if (control.errors['email']) return 'Invalid email format';
    if (control.errors['minlength']) {
      return `Password must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.auth.login(this.loginForm.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {}, // Error handled in service
    });
  }
}
