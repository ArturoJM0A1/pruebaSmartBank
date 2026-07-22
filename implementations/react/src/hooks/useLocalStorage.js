/**
 * useLocalStorage - Persistent State Hook
 * 
 * WHY localStorage persistence?
 * - Survives page refreshes (unlike React state)
 * - User preferences, auth tokens, form drafts
 * - Lighter than backend storage for client-only data
 * 
 * SIDE EFFECTS to consider:
 * - localStorage is synchronous and blocking
 * - Limited to ~5MB per origin
 * - Only stores strings (must serialize/deserialize)
 * - Not available in SSR (Next.js, Gatsby) - check window
 * 
 * CLEANUP:
 * - Listen for 'storage' events (cross-tab sync)
 * - Handle quota exceeded errors
 * - Parse JSON safely with try/catch
 */
import { useState, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  // WHY lazy initializer?
  // localStorage access is expensive - only runs on first render
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Check if we're in browser (not SSR)
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      // WHY JSON.parse with fallback?
      // localStorage stores strings, but we want objects
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // WHY catch?
      // Corrupted data, storage full, private browsing quirks
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        setStoredValue(value);
        
        if (typeof window !== 'undefined') {
          // WHY value instanceof Function?
          // Allows functional updates like setState(prev => prev + 1)
          const valueToStore = value instanceof Function ? value(storedValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        // WHY catch here too?
        // Storage might be full or disabled
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
