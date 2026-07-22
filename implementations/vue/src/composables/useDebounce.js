/**
 * useDebounce Composable
 * 
 * VUE REACTIVITY SYSTEM:
 * - Vue's reactivity is proxy-based (Vue 3)
 * - Changes to reactive data trigger DOM updates
 * - Computed properties cache and update efficiently
 * - Watchers let you run code on specific data changes
 * 
 * WHY this debounce works differently from React's?
 * - Vue's watch() has built-in flush timing options
 * - Can flush: 'pre' (before DOM), 'post' (after DOM), 'sync' (immediate)
 * - For debouncing, we use setTimeout like React
 * 
 * PERFORMANCE in Vue:
 * - Vue batches DOM updates automatically
 * - Multiple reactive changes in same tick → single DOM update
 * - nextTick() lets you wait for DOM update
 */
import { ref, watch } from 'vue';

export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value);

  // WHY watch() instead of watchEffect()?
  // watch() gives us access to old and new values
  // watchEffect() doesn't provide previous value
  // We need to clear previous timeout on each change
  watch(
    value,
    (newValue, oldValue) => {
      // WHY clear previous timeout?
      // Each change resets the debounce timer
      // Only the last change fires after delay
      const timer = setTimeout(() => {
        debouncedValue.value = newValue;
      }, delay);

      // Cleanup: return a function to clear timeout
      // Vue automatically calls this before next run
      return () => clearTimeout(timer);
    },
    { immediate: true }
  );

  return debouncedValue;
}

/**
 * USAGE in Vue:
 * 
 * <script setup>
 * import { ref } from 'vue';
 * import { useDebounce } from '../composables/useDebounce';
 * 
 * const searchQuery = ref('');
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * 
 * // Watch the debounced value to trigger API calls
 * watch(debouncedQuery, (newQuery) => {
 *   if (newQuery) {
 *     fetchResults(newQuery);
 *   }
 * });
 * </script>
 * 
 * <template>
 *   <input v-model="searchQuery" placeholder="Search..." />
 * </template>
 */
