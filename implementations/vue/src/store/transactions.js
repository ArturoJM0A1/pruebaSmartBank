/**
 * Pinia Transactions Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const filters = ref({
    dateFrom: null,
    dateTo: null,
    minAmount: null,
    maxAmount: null,
    type: 'all',
  });

  const filteredTransactions = computed(() => {
    return transactions.value.filter((tx) => {
      if (filters.value.dateFrom && new Date(tx.date) < new Date(filters.value.dateFrom)) {
        return false;
      }
      if (filters.value.dateTo && new Date(tx.date) > new Date(filters.value.dateTo)) {
        return false;
      }
      if (filters.value.minAmount && tx.amount < filters.value.minAmount) {
        return false;
      }
      if (filters.value.maxAmount && tx.amount > filters.value.maxAmount) {
        return false;
      }
      return true;
    });
  });

  async function fetchTransactions(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/transactions', { params });
      transactions.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch transactions';
    } finally {
      loading.value = false;
    }
  }

  async function createTransfer(transferData) {
    const response = await api.post('/transfers', transferData);
    transactions.value.unshift(response.data);
    return response.data;
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function clearFilters() {
    filters.value = {
      dateFrom: null,
      dateTo: null,
      minAmount: null,
      maxAmount: null,
      type: 'all',
    };
  }

  return {
    transactions,
    loading,
    error,
    filters,
    filteredTransactions,
    fetchTransactions,
    createTransfer,
    setFilters,
    clearFilters,
  };
});
