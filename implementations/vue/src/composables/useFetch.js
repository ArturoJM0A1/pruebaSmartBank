/**
 * useFetch Composable
 * 
 * COMPOSITION API REACTIVITY:
 * - watchEffect(): Automatically tracks dependencies
 *   → Runs immediately and re-runs when deps change
 *   → Like React's useEffect but automatic dependency tracking
 * 
 * - watch(): Explicit dependency watching
 *   → More control over when it runs
 *   → Can access old and new values
 *   → Like React's useEffect with explicit deps array
 * 
 * DATA FETCHING in Vue:
 * 1. useFetch (this): Simple, educational
 * 2. Vue Query / TanStack Query: Production-ready (caching, retries)
 * 3. useAsync composable: More control over async state
 * 4. Pinia actions: If state needs to be shared
 * 
 * WHY watchEffect for data fetching?
 * - Automatically re-fetches when URL changes
 * - No manual dependency array to maintain
 * - Cleanup handled via onCleanup
 */
import { ref, watchEffect, toValue } from 'vue';
import { api } from '../services/api';

export function useFetch(url) {
  const data = ref(null);
  const loading = ref(true);
  const error = ref(null);

  // WHY watchEffect instead of watch?
  // watchEffect auto-tracks reactive dependencies
  // When `url` ref changes, it re-runs automatically
  // No need to manually specify dependencies
  watchEffect(async (onCleanup) => {
    // WHY toValue()?
    // Handles ref, getter, or plain value uniformly
    // If url is a ref, toValue extracts its value
    const urlValue = toValue(url);
    
    // Reset state
    loading.value = true;
    error.value = null;

    // WHY abort controller?
    // Cancels previous request when url changes
    // Prevents race conditions (stale data overwriting fresh data)
    const controller = new AbortController();

    // Register cleanup
    // WHY onCleanup?
    // Runs before re-run or on component unmount
    // Similar to React's useEffect cleanup function
    onCleanup(() => {
      controller.abort();
    });

    try {
      const response = await api.get(urlValue, {
        signal: controller.signal,
      });
      data.value = response.data;
    } catch (err) {
      // WHY ignore aborted requests?
      // They're expected when url changes rapidly
      if (err.name !== 'AbortError') {
        error.value = err.response?.data?.message || err.message;
      }
    } finally {
      loading.value = false;
    }
  });

  async function refetch() {
    loading.value = true;
    error.value = null;
    try {
      const urlValue = toValue(url);
      const response = await api.get(urlValue);
      data.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
    } finally {
      loading.value = false;
    }
  }

  return {
    data,
    loading,
    error,
    refetch,
  };
}
