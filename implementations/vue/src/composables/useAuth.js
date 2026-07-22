/**
 * useAuth Composable
 * 
 * COMPOSABLES vs OPTIONS API:
 * 
 * Options API (old way):
 * - Logic split across options: data, methods, computed, watch
 * - Hard to extract and reuse
 * - Related logic is separated
 * 
 * Composables (Composition API):
 * - All logic for a concern is together
 * - Reusable across components (like React hooks)
 * - Named with "use" prefix convention
 * - Return reactive state and methods
 * 
 * VUE REACTIVITY:
 * - ref(): primitive values (number, string, boolean)
 * - reactive(): objects and arrays
 * - computed(): derived values (cached)
 * - watch()/watchEffect(): side effects on changes
 * 
 * WHY composables over mixins?
 * - No name collisions
 * - Explicit dependencies
 * - Better TypeScript support
 * - Easier to trace data flow
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

export function useAuth() {
  const router = useRouter();
  const authStore = useAuthStore();
  
  // Local reactive state for the composable
  const loading = ref(false);
  const error = ref(null);

  // WHY computed instead of a method?
  // Computed is cached and only recalculates when dependencies change
  // Methods run every time they're called
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);

  async function login(credentials) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/auth/login', credentials);
      authStore.login(response.data);
      
      // WHY router.push instead of window.location?
      // Uses Vue Router's history management
      // Preserves SPA behavior (no full page reload)
      await router.push('/dashboard');
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    authStore.logout();
    router.push('/login');
  }

  return {
    // WHY expose computed refs?
    // Components can destructure without losing reactivity
    // In Vue 3, refs are automatically unwrapped in templates
    loading,
    error,
    isAuthenticated,
    user,
    login,
    logout,
  };
}
