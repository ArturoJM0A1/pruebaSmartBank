/**
 * Angular Bootstrap
 * 
 * ANGULAR BOOTSTRAPPING:
 * - Angular apps start by bootstrapping a root component
 * - bootstrapApplication() for standalone components (modern)
 * - platformBrowserDynamic().bootstrapModule() for NgModule (legacy)
 * 
 * STANDALONE COMPONENTS (Angular 14+):
 * - No need for NgModules to declare components
 * - Each component declares its own dependencies
 * - Better tree-shaking and lazy loading
 * - The future of Angular development
 * 
 * WHY standalone is better:
 * - Less boilerplate (no NgModule)
 * - Easier to understand dependencies
 * - Better IDE support
 * - Faster compilation
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    // WHY provideRouter instead of RouterModule.forRoot?
    // Standalone approach: tree-shakeable, better performance
    provideRouter(routes),
    
    // WHY withInterceptors?
    // Modern Angular HTTP client with functional interceptors
    // Replaces class-based HttpInterceptor (deprecated)
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch((err) => console.error(err));

/**
 * ANGULAR ARCHITECTURE overview:
 * - Components: UI building blocks (like React/Vue components)
 * - Services: Business logic (Dependency Injection)
 * - Modules: Organize code (declining with standalone)
 * - Decorators: Metadata that defines behavior (@Component, @Injectable)
 * - RxJS: Reactive programming (Observables)
 * - Change Detection: Zone.js triggers re-renders
 */
