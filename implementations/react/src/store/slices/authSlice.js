/**
 * Auth Slice - Redux Toolkit
 * 
 * REDUX TOOLKIT features used:
 * 
 * 1. createSlice:
 *    - Automatically generates action creators
 *    - Uses Immer for immutable updates
 *    - Reduces boilerplate significantly
 * 
 * 2. Immer (under the hood):
 *    - "Mutate" state safely
 *    - Actual state is immutable (structural sharing)
 *    - Draft state is a Proxy object
 * 
 * STATE SHAPE:
 * - user: Current user object
 * - token: JWT authentication token
 * - isAuthenticated: Quick boolean check
 * - loading: Loading state for async operations
 * - error: Error message from failed operations
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// WHY createAsyncThunk?
// - Handles pending/fulfilled/rejected states automatically
// - Clean async logic separate from reducers
// - Integrates with RTK Query for caching (if using)
// 
// SYNTAX: createAsyncThunk(actionType, payloadCreator)
// - actionType: prefix for action types (e.g., 'auth/login')
// - payloadCreator: async function that returns data or throws error
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Store token for subsequent requests
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (err) {
      // WHY rejectWithValue?
      // Allows passing custom error payload to reducer
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    // WHY manual reducers alongside thunks?
    // Some actions don't need async logic
    // logout, clearError are synchronous
    logout(state) {
      // WHY state mutation is safe here?
      // Immer converts it to immutable update automatically
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  // WHY extraReducers?
  // Handles actions defined outside the slice (createAsyncThunk)
  // Pattern: builder.addCase(actionCreator, reducer)
  extraReducers: (builder) => {
    builder
      // Login pending
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Login fulfilled
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      // Login rejected
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
