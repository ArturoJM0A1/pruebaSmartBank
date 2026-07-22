/**
 * Transaction Slice - Redux Toolkit
 * 
 * NORMALIZED STATE:
 * - Store entities in a lookup table (object/map) instead of array
 * - WHY? O(1) lookups vs O(n) for arrays
 * - Easy updates: state.byId[id] = newData
 * - Easy deletions: delete state.byId[id]
 * 
 * PATTERN: { ids: [], byId: {} }
 * - ids: Array of IDs (for ordered iteration)
 * - byId: Object mapping ID to entity (for lookups)
 * 
 * SELECTORS:
 * - Derived state computed from store
 * - WHY separate selectors?
 *   Reusable across components
 *   Memoized to prevent unnecessary recalculation
 *   Single place to change if state shape changes
 */
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Fetch transactions with filters
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/transactions?${params}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Create transfer
export const createTransfer = createAsyncThunk(
  'transactions/createTransfer',
  async (transferData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transfers', transferData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    // Normalized state structure
    byId: {},
    ids: [],
    loading: false,
    creating: false,
    error: null,
    filters: {
      dateFrom: null,
      dateTo: null,
      minAmount: null,
      maxAmount: null,
      type: 'all',
    },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = {
        dateFrom: null,
        dateTo: null,
        minAmount: null,
        maxAmount: null,
        type: 'all',
      };
    },
    clearTransactionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.byId = {};
        state.ids = [];
        action.payload.forEach((tx) => {
          state.byId[tx.id] = tx;
          state.ids.push(tx.id);
        });
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTransfer.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTransfer.fulfilled, (state, action) => {
        state.creating = false;
        state.byId[action.payload.id] = action.payload;
        state.ids.unshift(action.payload.id);
      })
      .addCase(createTransfer.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearTransactionError } = transactionsSlice.actions;

// SELECTORS
const selectTransactionsState = (state) => state.transactions;
const selectTransactionsById = (state) => state.transactions.byId;
const selectTransactionIds = (state) => state.transactions.ids;

export const selectAllTransactions = createSelector(
  [selectTransactionsById, selectTransactionIds],
  (byId, ids) => ids.map((id) => byId[id])
);

export const selectFilteredTransactions = createSelector(
  [selectAllTransactions, selectTransactionsState],
  (transactions, { filters }) => {
    return transactions.filter((tx) => {
      if (filters.dateFrom && new Date(tx.date) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(tx.date) > new Date(filters.dateTo)) {
        return false;
      }
      if (filters.minAmount && tx.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount && tx.amount > filters.maxAmount) {
        return false;
      }
      return true;
    });
  }
);

export default transactionsSlice.reducer;
