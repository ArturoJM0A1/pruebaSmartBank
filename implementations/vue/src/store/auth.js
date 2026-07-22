/**
 * Pinia Auth Store
 * 
 * PINIA vs VUEX:
 * 
 * Vuex (legacy):
 * - Mutations + Actions pattern
 * - Nested modules with namespaces
 * - More boilerplate
 * - Less TypeScript-friendly
 * 
 * Pinia (modern):
 * - No mutations (direct state modification in actions)
 * - Flat store structure (composable-style)
 * - Better TypeScript inference
 * - Official Vue state management
 * - Hot module replacement
 * - Devtools support
 * 
 * STORE PATTERNS:
 * - State: Reactive data (like component's data)
 * - Getters: Computed values (like component's computed)
 * - Actions: Methods (like component's methods, can be async)
 * - No mutations: Just modify state directly in actions
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';

// WHY Setup Store syntax (function) over Option Store syntax (object)?
// - Full TypeScript inference
// - Can use any Composition API features
// - More flexible and composable
// - Better for complex stores
export const useAuthStore = defineStore('auth', () => {
  // STATE (refs)
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);

  // GETTERS (computed)
  const isAuthenticated = computed(() => !!token.value);

  // ACTIONS (functions)
  async function login(credentials) {
    const response = await api.post('/auth/login', credentials);
    user.value = response.data.user;
    token.value = response.data.token;
    localStorage.setItem('token', response.data.token);
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  async function fetchProfile() {
    try {
      const response = await api.get('/auth/profile');
      user.value = response.data;
    } catch {
      logout();
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    fetchProfile,
  };
});
