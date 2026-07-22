/**
 * Auth Interceptor - Angular
 * 
 * HTTP INTERCEPTORS:
 * - Function that intercepts HTTP requests/responses
 * - Attach auth token to every outgoing request
 * - Handle 401 responses globally
 * 
 * WHY functional interceptor (Angular 15+)?
 * - Replaces class-based HttpInterceptor
 * - Simpler API, better performance
 * - Uses inject() for DI
 * - Can be composed and tested more easily
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getToken();
  
  // Clone request to add auth header
  // WHY clone? HttpClient requests are immutable
  // Must clone to modify (can't mutate original)
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Pass modified request and intercept response
  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
