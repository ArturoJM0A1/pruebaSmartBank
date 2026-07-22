/**
 * Angular Route Configuration
 * 
 * ANGULAR ROUTING:
 * - Declarative route definitions (similar to React Router)
 * - Supports: lazy loading, guards, resolvers, nested routes
 * - Functional guards (Angular 15+) replace class-based guards
 * 
 * LAZY LOADING in Angular:
 * - loadComponent: Lazy loads a standalone component
 * - loadChildren: Lazy loads a module (legacy)
 * - WHY lazy load? Reduces initial bundle size
 * - Angular automatically splits code at route boundaries
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts/accounts.component').then(
        (m) => m.AccountsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'transfer',
    loadComponent: () =>
      import('./features/transfer/transfer.component').then(
        (m) => m.TransferComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
