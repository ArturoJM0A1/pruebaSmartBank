/**
 * Redux Store Configuration
 * 
 * REDUX vs CONTEXT vs ZUSTAND - When to use each:
 * 
 * 1. React Context:
 *    - Built-in, no extra dependencies
 *    - Good for: theme, locale, auth (low-frequency updates)
 *    - Bad for: high-frequency updates (causes re-renders)
 *    - No middleware, no devtools
 * 
 * 2. Zustand:
 *    - Tiny (~1kb), simple API
 *    - Good for: medium complexity, quick prototypes
 *    - Built-in devtools, middleware
 *    - No boilerplate
 * 
 * 3. Redux Toolkit (this implementation):
 *    - Industry standard, battle-tested
 *    - Good for: large apps, complex state, team projects
 *    - Devtools, middleware, time-travel debugging
 *    - Predictable state updates
 *    - RTK Query for data fetching
 * 
 * REDUX TOOLKIT improvements over classic Redux:
 * - createSlice: Reduces boilerplate by 50%+
 * - Immer: Write "mutating" logic that's actually immutable
 * - createAsyncThunk: Built-in async action patterns
 * - configureStore: Sensible defaults + middleware
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import accountsReducer from './slices/accountSlice';
import transactionsReducer from './slices/transactionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountsReducer,
    transactions: transactionsReducer,
  },
  // WHY devTools check?
  // Disable in production for security and performance
  devTools: import.meta.env.DEV,
  // WHY middleware customization?
  // Add custom middleware for logging, analytics, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // WHY serializableCheck false for auth?
      // We store Date objects, functions, etc.
      // In production, be more selective
      serializableCheck: false,
    }),
});

// TypeScript types (if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
