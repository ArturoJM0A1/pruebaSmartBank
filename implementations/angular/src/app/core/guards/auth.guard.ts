/**
 * Auth Guard - Angular (Functional Guard)
 * 
 * ROUTE GUARDS in Angular:
 * - Control access to routes based on conditions
 * - canActivate: Can user access this route?
 * - canDeactivate: Can user leave this route?
 * - canActivateChild: Can user access child routes?
 * 
 * FUNCTIONAL GUARDS (Angular 15+):
 * - Replaces class-based CanActivate interface
 * - Simpler, more testable, better tree-shaking
 * - Can inject services via inject()
 * - Returns boolean | UrlTree | Observable<boolean | UrlTree>
 * 
 * WHY functional over class guards?
 * - Less boilerplate
 * - Better TypeScript inference
 * - Easier to test (plain functions)
 * - Better for lazy loading
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // WHY UrlTree instead of navigating imperatively?
  // UrlTree is declarative - Angular handles the redirect
  // Better for router analytics and debugging
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
