/**
 * Account Slice - Redux Toolkit
 * 
 * ASYNC THUNKS for data fetching:
 * - createAsyncThunk handles loading/error states
 * - Each thunk has 3 states: pending, fulfilled, rejected
 * - WHY separate loading/error per operation?
 *   → Multiple operations can run simultaneously
 *   → Each shows its own loading/error state
 *   → Better UX than global loading flag
 * 
 * LOADING STATES pattern:
 * - accounts.loading: Initial fetch
 * - accounts.creating: Creating new account
 * - accounts.updating: Updating account details
 * - accounts.deleting: Deleting account
 * 
 * This granularity prevents UI conflicts:
 * - Can show "Saving..." while list is still visible
 * - Can retry failed deletion without losing list data
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Fetch all accounts
export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Create new account
export const createAccount = createAsyncThunk(
  'accounts/create',
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts', accountData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Update account
export const updateAccount = createAsyncThunk(
  'accounts/update',
  async ({ id, ...accountData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/accounts/${id}`, accountData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Delete account
export const deleteAccount = createAsyncThunk(
  'accounts/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/accounts/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    items: [],
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
  },
  reducers: {
    clearAccountError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create account
      .addCase(createAccount.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.creating = false;
        state.items.push(action.payload);
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      // Update account
      .addCase(updateAccount.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.items.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // Delete account
      .addCase(deleteAccount.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const { clearAccountError } = accountsSlice.actions;
export default accountsSlice.reducer;
