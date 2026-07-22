/**
 * Vue Router Configuration
 * 
 * VUE ROUTER features:
 * - Declarative route definitions
 * - Nested routes (children)
 * - Navigation guards (beforeEnter)
 * - Route parameters and query strings
 * - Lazy loading with dynamic imports
 * 
 * WHY lazy loading routes?
 * - Reduces initial bundle size
 * - Only loads code when route is visited
 * - Better first-paint performance
 * - Webpack/Vite handles the code splitting
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

// WHY lazy imports?
// () => import('./views/...') creates separate chunks
// Each page loads only when needed
const LoginForm = () => import('../components/LoginForm.vue');
const Dashboard = () => import('../components/Dashboard.vue');
const AccountList = () => import('../components/AccountList.vue');
const TransactionHistory = () => import('../components/TransactionHistory.vue');
const TransferForm = () => import('../components/TransferForm.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    // WHY meta fields?
    // Custom data attached to routes
    // Useful for breadcrumbs, permissions, page titles
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: AccountList,
    meta: { requiresAuth: true },
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: TransactionHistory,
    meta: { requiresAuth: true },
  },
  {
    path: '/transfer',
    name: 'Transfer',
    component: TransferForm,
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * NAVIGATION GUARD:
 * - Runs before each route navigation
 * - WHY global guard instead of per-route?
 *   → Single place to handle auth logic
 *   → DRY principle
 *   → Easy to add logging, analytics
 * 
 * to: target route
 * from: current route
 * next(): proceed navigation (not needed in Vue 3 router 4.x)
 */
router.beforeEach((to, from) => {
  const authStore = useAuthStore();
  
  // WHY check meta.requiresAuth?
  // Allows public routes (login, register) to be accessible
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }
  
  // Redirect to dashboard if already logged in and trying to access login
  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { name: 'Dashboard' };
  }
});

export default router;
