/**
 * Auth Service - Angular
 * 
 * DEPENDENCY INJECTION (DI) in Angular:
 * - Services are injectable via constructor
 * - Angular's DI is hierarchical and modular
 * - providedIn: 'root' makes service a singleton
 * - No need to add to providers array
 * 
 * WHY DI over imports?
 * - Loose coupling: Service can be swapped for testing
 * - Single responsibility: Business logic separate from UI
 * - Reusability: Multiple components share same service
 * - Tree-shaking: Only included if actually used
 * 
 * HttpClient:
 * - Returns Observable (not Promise)
 * - Observable is lazy: won't make request until subscribed
 * - subscribe() triggers the actual HTTP call
 * - pipe() for operators (map, catchError, tap, etc.)
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';

// Angular 16+ signals for reactive state
// WHY signals over BehaviorSubject?
// - Simpler API (no subscribe, next, complete)
// - Automatic change detection integration
// - Better performance (granular updates)
// - The future of Angular state management

interface User {
  id: string;
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  // Signal-based state
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Computed values (derived state)
  // WHY computed? Auto-updates when signals change
  // Like Vue's computed or React's useMemo
  user = this._user.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  isAuthenticated = computed(() => !!this._token());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: { email: string; password: string }) {
    this._loading.set(true);
    this._error.set(null);

    // WHY pipe() with operators?
    // Observable pipeline for data transformation and error handling
    // tap: Side effect without modifying the stream
    // catchError: Handle errors and rethrow or transform
    return this.http
      .post<{ user: User; token: string }>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this._user.set(response.user);
          this._token.set(response.token);
          localStorage.setItem('token', response.token);
          this._loading.set(false);
        }),
        catchError((err) => {
          const message = err.error?.message || 'Login failed';
          this._error.set(message);
          this._loading.set(false);
          return throwError(() => new Error(message));
        })
      );
  }

  logout() {
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }
}
