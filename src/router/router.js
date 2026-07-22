/**
 * ============================================================================
 * Simple SPA Router
 * ============================================================================
 * 
 * PURPOSE:
 * Client-side routing for Single Page Applications (SPA).
 * Instead of loading new HTML pages, we:
 * 1. Intercept navigation
 * 2. Update the URL
 * 3. Render the appropriate component
 * 
 * SPA ROUTING METHODS:
 * 
 * 1. HASH-BASED (#/login, #/dashboard):
 *    - Uses window.location.hash
 *    - Server doesn't see the hash
 *    - Simple to implement
 *    - Works with any server
 *    - Default for learning projects
 * 
 * 2. HISTORY API (/login, /dashboard):
 *    - Uses pushState/replaceState
 *    - Clean URLs (no #)
 *    - Requires server configuration (redirect all to index.html)
 *    - Used by: React Router, Vue Router, Angular Router
 * 
 * FOR THIS APP: We use hash-based routing (simpler)
 * 
 * ROUTER COMPARISON:
 * - React Router: Declarative, component-based
 * - Vue Router: Integrated with Vue, history mode
 * - Angular Router: Module-based, powerful guards
 * - Our Router: Simple, educational, hash-based
 * 
 * RELATED CONCEPTS:
 * - History API (pushState, replaceState, popstate event)
 * - Route guards (protecting routes)
 * - Lazy loading (load components on demand)
 * - Nested routes
 * - Route parameters
 * ============================================================================
 */

import { ROUTES } from '../constants/app.js';
import AuthService from '../services/auth.js';

/**
 * Router Class - Client-side routing
 * 
 * CONCEPT: Singleton pattern
 * - Only one router for the entire app
 * - All navigation goes through this
 */
class Router {
    constructor() {
        // Map of route patterns to handlers
        this.routes = new Map();
        
        // Current route information
        this.currentRoute = null;
        
        // Route guards
        this.beforeEachGuards = [];
        this.afterEachHooks = [];
        
        // 404 handler
        this.notFoundHandler = null;
        
        // Bind methods
        this.navigate = this.navigate.bind(this);
        this._handleHashChange = this._handleHashChange.bind(this);
    }
    
    /**
     * register - Register a route with its handler
     * 
     * WHY: Routes map URLs to components.
     * When user navigates to /dashboard, we render Dashboard component.
     * 
     * CONCEPT: Route parameters
     * - /account/:id matches /account/123
     * - :id is extracted as { id: '123' }
     * 
     * @param {string} path - Route path (e.g., '/dashboard', '/account/:id')
     * @param {Function|Object} handler - Component or render function
     */
    register(path, handler) {
        // Convert route pattern to regex
        // /account/:id → /^\/account\/([^\/]+)$/
        const paramNames = [];
        const regexStr = path.replace(/:([^/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        
        this.routes.set(path, {
            handler,
            regex: new RegExp(`^${regexStr}$`),
            paramNames,
        });
        
        return this; // Allow chaining
    }
    
    /**
     * beforeEach - Register a guard that runs before each navigation
     * 
     * WHY: Route guards protect routes:
     * - Auth guard: Redirect to login if not authenticated
     * - Role guard: Redirect if user doesn't have required role
     * - Unsaved changes: Warn before leaving
     * 
     * @param {Function} guard - (to, from, next) => void
     */
    beforeEach(guard) {
        this.beforeEachGuards.push(guard);
        return this;
    }
    
    /**
     * afterEach - Register a hook that runs after each navigation
     * 
     * WHY: Common post-navigation tasks:
     * - Scroll to top
     * - Track page views (analytics)
     * - Update document title
     * 
     * @param {Function} hook - (to, from) => void
     */
    afterEach(hook) {
        this.afterEachHooks.push(hook);
        return this;
    }
    
    /**
     * setNotFound - Set 404 handler
     * 
     * @param {Function} handler - Handler for unknown routes
     */
    setNotFound(handler) {
        this.notFoundHandler = handler;
        return this;
    }
    
    /**
     * start - Initialize the router
     * 
     * WHY: Called once when the app starts.
     * Sets up event listeners and handles initial route.
     */
    start() {
        // Listen for hash changes
        window.addEventListener('hashchange', this._handleHashChange);
        
        // Handle initial route
        this._handleHashChange();
        
        return this;
    }
    
    /**
     * stop - Stop the router
     * 
     * WHY: Cleanup when app is destroyed (rare in SPA)
     */
    stop() {
        window.removeEventListener('hashchange', this._handleHashChange);
    }
    
    /**
     * navigate - Programmatically navigate to a route
     * 
     * WHY: Sometimes we need to navigate without clicking a link:
     * - After login: navigate('/dashboard')
     * - After form submission: navigate('/success')
     * - Redirect: navigate('/login')
     * 
     * @param {string} path - Route path
     * @param {Object} params - Route parameters
     */
    navigate(path, params = {}) {
        // Build URL with parameters
        let url = path;
        
        // Replace :param placeholders with actual values
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, value);
        }
        
        // Update hash (triggers hashchange event)
        window.location.hash = `#${url}`;
    }
    
    /**
     * replace - Replace current route without adding to history
     * 
     * WHY: Some navigations shouldn't be in history:
     * - Redirects (don't want back button to go to redirect)
     * - Replacing current route
     * 
     * @param {string} path - Route path
     */
    replace(path) {
        window.location.replace(`#${path}`);
    }
    
    /**
     * back - Go back in history
     */
    back() {
        window.history.back();
    }
    
    /**
     * forward - Go forward in history
     */
    forward() {
        window.history.forward();
    }
    
    /**
     * getCurrentParams - Get current route parameters
     * 
     * @returns {Object} Route parameters
     */
    getCurrentParams() {
        if (!this.currentRoute) return {};
        return this.currentRoute.params;
    }
    
    /**
     * _handleHashChange - Handle hash change events
     * 
     * WHY: This is the core routing logic.
     * When the hash changes, we:
     * 1. Parse the new path
     * 2. Find matching route
     * 3. Run guards
     * 4. Render the component
     * 
     * @private
     */
    async _handleHashChange() {
        const hash = window.location.hash.slice(1) || '/';
        const previousRoute = this.currentRoute;
        
        // Parse path and query string
        const [path, queryString] = hash.split('?');
        const query = this._parseQueryString(queryString);
        
        // Find matching route
        const match = this._matchRoute(path);
        
        if (!match) {
            // No route found - 404
            if (this.notFoundHandler) {
                this.currentRoute = {
                    path,
                    params: {},
                    query,
                };
                
                await this._runGuards(previousRoute, this.currentRoute);
                this.notFoundHandler(this.currentRoute);
                this._runAfterHooks(previousRoute, this.currentRoute);
            }
            return;
        }
        
        const { route, params } = match;
        
        // Create route object
        const to = {
            path,
            params,
            query,
            matchedRoute: route,
        };
        
        // Run before guards
        const shouldProceed = await this._runGuards(previousRoute, to);
        
        if (!shouldProceed) {
            // Guard prevented navigation
            return;
        }
        
        // Update current route
        this.currentRoute = to;
        
        // Render the component
        try {
            if (typeof route.handler === 'function') {
                await route.handler(to);
            } else if (route.handler && typeof route.handler.render === 'function') {
                await route.handler.render(to);
            }
        } catch (error) {
            console.error('Error rendering route:', error);
        }
        
        // Run after hooks
        this._runAfterHooks(previousRoute, to);
    }
    
    /**
     * _matchRoute - Find route matching the path
     * 
     * CONCEPT: Pattern matching
     * - Convert route patterns to regex
     * - Test against current path
     * - Extract parameters
     * 
     * @private
     * @param {string} path - URL path
     * @returns {Object|null} Matched route with params
     */
    _matchRoute(path) {
        for (const [pattern, route] of this.routes) {
            const match = path.match(route.regex);
            
            if (match) {
                // Extract parameters
                const params = {};
                route.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                
                return { route, params };
            }
        }
        
        return null;
    }
    
    /**
     * _runGuards - Run before each guards
     * 
     * @private
     * @param {Object} from - Previous route
     * @param {Object} to - Next route
     * @returns {boolean} Whether to proceed
     */
    async _runGuards(from, to) {
        for (const guard of this.beforeEachGuards) {
            const result = await guard(to, from);
            
            if (result === false) {
                return false;
            }
            
            // If guard returns a path, redirect
            if (typeof result === 'string') {
                this.navigate(result);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * _runAfterHooks - Run after each hooks
     * 
     * @private
     * @param {Object} from - Previous route
     * @param {Object} to - Current route
     */
    _runAfterHooks(from, to) {
        this.afterEachHooks.forEach(hook => {
            try {
                hook(to, from);
            } catch (error) {
                console.error('Error in afterEach hook:', error);
            }
        });
    }
    
    /**
     * _parseQueryString - Parse query string to object
     * 
     * @private
     * @param {string} queryString - URL query string
     * @returns {Object} Parsed query parameters
     */
    _parseQueryString(queryString) {
        const params = {};
        
        if (!queryString) return params;
        
        const searchParams = new URLSearchParams(queryString);
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        
        return params;
    }
}

/**
 * Create and configure router instance
 */
const router = new Router();

/**
 * Auth Guard - Protect routes that require authentication
 * 
 * WHY: Not all routes are public.
 * - Dashboard: requires login
 * - Settings: requires login
 * - Login: no login required (would be redirect loop)
 */
router.beforeEach(async (to, from) => {
    // Public routes that don't require auth
    const publicRoutes = [
        ROUTES.LOGIN,
        ROUTES.REGISTER,
        ROUTES.FORGOT_PASSWORD,
        ROUTES.RESET_PASSWORD,
    ];
    
    const isPublic = publicRoutes.some(route => 
        to.path === route || to.path.startsWith(route)
    );
    
    // Check if user is authenticated
    const isAuthenticated = AuthService.isAuthenticated();
    
    // If route requires auth and user is not authenticated
    if (!isPublic && !isAuthenticated) {
        // Redirect to login
        return ROUTES.LOGIN;
    }
    
    // If user is authenticated and trying to access login
    if (isPublic && isAuthenticated && to.path === ROUTES.LOGIN) {
        // Redirect to dashboard
        return ROUTES.DASHBOARD;
    }
    
    // Proceed with navigation
    return true;
});

/**
 * After hook - Update document title and scroll position
 */
router.afterEach((to) => {
    // Update document title
    const routeTitle = to.path
        .split('/')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' - ');
    
    document.title = `${routeTitle || 'Home'} | SmartBank`;
    
    // Scroll to top
    window.scrollTo(0, 0);
});

export default router;