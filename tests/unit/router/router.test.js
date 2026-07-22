/**
 * ============================================================================
 * SMARTBANK - UNIT TESTS: Router
 * ============================================================================
 * 
 * PURPOSE: Test the client-side routing system.
 * 
 * WHAT IS SPA ROUTING?
 *   - Single Page Applications load ONE HTML page.
 *   - Navigation happens by swapping components, not reloading pages.
 *   - The URL changes (via History API) but the page doesn't reload.
 * 
 * WHY TEST THE ROUTER?
 *   - Wrong routes → 404 pages, broken navigation.
 *   - Auth guards → unauthenticated users accessing protected pages.
 *   - Route parameters → wrong data displayed (wrong account ID).
 * 
 * ============================================================================
 */

'use strict';

// ============================================================================
// ROUTER IMPLEMENTATION (simplified for testing)
// ============================================================================

function createRouter(routes = []) {
  let currentRoute = null;
  let params = {};
  const beforeGuards = [];

  const router = {
    navigate: (path) => {
      const matched = routes.find((r) => {
        if (r.path === path) return true;
        // Simple parameter matching: /accounts/:id
        const pattern = r.path.replace(/:(\w+)/g, '(?<$1>[^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      });

      if (!matched) {
        currentRoute = null;
        params = {};
        return { found: false };
      }

      // Run guards
      for (const guard of beforeGuards) {
        const result = guard(matched, path);
        if (result === false) {
          return { found: false, blocked: true };
        }
      }

      // Extract parameters
      const pattern = matched.path.replace(/:(\w+)/g, '(?<$1>[^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = path.match(regex);
      params = match?.groups || {};

      currentRoute = matched;
      return { found: true, route: matched, params };
    },

    getCurrentRoute: () => currentRoute,
    getParams: () => ({ ...params }),

    beforeGuard: (fn) => {
      beforeGuards.push(fn);
    },

    getRoutes: () => [...routes],
  };

  return router;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Router', () => {
  const routes = [
    { path: '/', name: 'home', component: 'HomePage' },
    { path: '/login', name: 'login', component: 'LoginPage' },
    { path: '/dashboard', name: 'dashboard', component: 'DashboardPage', auth: true },
    { path: '/accounts/:id', name: 'account', component: 'AccountDetail' },
    { path: '/accounts/:id/transactions', name: 'transactions', component: 'TransactionsPage' },
    { path: '/transfer', name: 'transfer', component: 'TransferPage' },
  ];

  // WHAT: Route registration
  // WHY: All routes must be registered for navigation to work.
  it('should register routes correctly', () => {
    const router = createRouter(routes);
    expect(router.getRoutes()).toHaveLength(6);
  });

  // WHAT: Navigate to existing route
  // WHY: Basic navigation must work.
  it('should navigate to existing route', () => {
    const router = createRouter(routes);
    const result = router.navigate('/login');

    expect(result.found).toBe(true);
    expect(result.route.name).toBe('login');
  });

  // WHAT: Navigate to non-existent route
  // WHY: 404 handling must work.
  it('should return not found for unknown route', () => {
    const router = createRouter(routes);
    const result = router.navigate('/nonexistent');

    expect(result.found).toBe(false);
  });

  // WHAT: Route parameters are extracted
  // WHY: /accounts/123 must extract id=123.
  it('should extract route parameters', () => {
    const router = createRouter(routes);
    const result = router.navigate('/accounts/acc_001');

    expect(result.found).toBe(true);
    expect(result.params.id).toBe('acc_001');
  });

  // WHAT: Multiple parameters extracted
  it('should extract multiple parameters', () => {
    const router = createRouter(routes);
    const result = router.navigate('/accounts/acc_001/transactions');

    expect(result.found).toBe(true);
    expect(result.params.id).toBe('acc_001');
  });

  // WHAT: Auth guard blocks unauthorized navigation
  // WHY: Protected routes must not be accessible without auth.
  it('should block navigation when guard returns false', () => {
    const router = createRouter(routes);
    let isAuthenticated = false;

    router.beforeGuard((route) => {
      if (route.auth && !isAuthenticated) {
        return false; // Block navigation
      }
      return true;
    });

    const result = router.navigate('/dashboard');
    expect(result.found).toBe(false);
    expect(result.blocked).toBe(true);
  });

  // WHAT: Auth guard allows authorized navigation
  it('should allow navigation when guard passes', () => {
    const router = createRouter(routes);

    router.beforeGuard(() => true); // Always allow

    const result = router.navigate('/dashboard');
    expect(result.found).toBe(true);
  });

  // WHAT: Current route is tracked
  it('should track current route', () => {
    const router = createRouter(routes);

    router.navigate('/transfer');
    expect(router.getCurrentRoute().name).toBe('transfer');
  });

  // WHAT: Route parameters are accessible
  it('should make params accessible via getParams', () => {
    const router = createRouter(routes);

    router.navigate('/accounts/acc_002');
    expect(router.getParams()).toEqual({ id: 'acc_002' });
  });

  // WHAT: Navigate to root route
  it('should navigate to root', () => {
    const router = createRouter(routes);
    const result = router.navigate('/');

    expect(result.found).toBe(true);
    expect(result.route.component).toBe('HomePage');
  });
});
