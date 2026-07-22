/**
 * useFetch - Custom Hook for Data Fetching
 * 
 * WHY hooks over class lifecycle for data fetching?
 * - Classes: componentDidMount, componentDidUpdate, componentWillUnmount
 *   → Split related logic across lifecycle methods
 *   → "Logic groups" are scattered
 * 
 * - Hooks: useEffect combines related logic
 *   → Related cleanup lives with setup
 *   → Easier to extract and reuse
 * 
 * DATA FETCHING PATTERNS in React:
 * 1. useEffect + useState: Simple, but has race condition risks
 * 2. useReducer + useEffect: Better for complex state machines
 * 3. React Query / SWR: Best for production (caching, deduplication, retries)
 * 4. RTK Query: If already using Redux (best DX for SmartBank)
 * 
 * This hook is educational - in production, use RTK Query or React Query
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WHY useCallback here?
  // Allows refetching from child components without causing infinite loops
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(url, options);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      // WHY finally?
      // Ensures loading is always set to false, even on error
      // Prevents UI from being stuck in loading state
      setLoading(false);
    }
  }, [url]); // WHY dependency on url?
  // When url changes, we need to re-fetch

  // WHY empty dependency array for initial fetch?
  // We only want to fetch on mount and when url changes
  useEffect(() => {
    let cancelled = false;
    
    // WHY cancelled flag?
    // Prevents state updates on unmounted components (memory leak)
    // React 18 helps with this, but it's still best practice
    fetchData().then(() => {
      if (cancelled) {
        // In real code, you'd reset state here
        // setData(null);
      }
    });
    
    // WHY cleanup function?
    // Runs before next effect or on unmount
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
