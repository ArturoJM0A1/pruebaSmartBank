/**
 * useDebounce - Debounce Hook for Performance Optimization
 * 
 * WHY debounce in React?
 * - Prevents excessive API calls during rapid user input
 * - Reduces unnecessary re-renders from frequent state updates
 * - Improves perceived performance for search/filter operations
 * 
 * HOW it works:
 * - User types "hello" quickly
 * - Without debounce: 5 API calls (h, he, hel, hell, hello)
 * - With debounce (300ms): 1 API call (hello)
 * 
 * PERFORMANCE PATTERN:
 * - Debounce: Wait for pause in activity (search-as-you-type)
 * - Throttle: Limit execution rate (scroll handlers, resize)
 * - RequestAnimationFrame: Visual updates (animations, smooth scrolling)
 */
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // WHY setTimeout + clear?
    // Each keystroke resets the timer
    // Only fires after user stops typing for `delay` milliseconds
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // WHY cleanup function?
    // Clears previous timeout when value changes
    // Prevents multiple timeouts from stacking up
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * USAGE EXAMPLE:
 * 
 * function SearchInput({ onSearch }) {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 500);
 * 
 *   // This effect only fires after 500ms of no typing
 *   useEffect(() => {
 *     if (debouncedQuery) {
 *       onSearch(debouncedQuery);
 *     }
 *   }, [debouncedQuery, onSearch]);
 * 
 *   return (
 *     <input
 *       value={query}
 *       onChange={(e) => setQuery(e.target.value)}
 *       placeholder="Search accounts..."
 *     />
 *   );
 * }
 */
