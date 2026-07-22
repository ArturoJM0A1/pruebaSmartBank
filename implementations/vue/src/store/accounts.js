/**
 * Pinia Accounts Store
 * 
 * ACTIONS in Pinia:
 * - Methods that can modify state and be async
 * - No need for mutations (unlike Vuex)
 * - Directly modify state with full reactivity
 * - Can call other actions
 * 
 * GETTERS in Pinia:
 * - Computed properties on the store
 * - Cached until dependencies change
 * - Access state and other getters
 * - Useful for filtering, sorting, derived data
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';

export const useAccountStore = defineStore('accounts', () => {
  // State
  const accounts = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const totalBalance = computed(() => {
    return accounts.value.reduce((sum, account) => sum + account.balance, 0);
  });

  const accountsByType = computed(() => {
    return accounts.value.reduce((grouped, account) => {
      const type = account.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(account);
      return grouped;
    }, {});
  });

  const getAccountById = computed(() => {
    return (id) => accounts.value.find((account) => account.id === id);
  });

  // Actions
  async function fetchAccounts() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/accounts');
      accounts.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch accounts';
    } finally {
      loading.value = false;
    }
  }

  async function createAccount(accountData) {
    const response = await api.post('/accounts', accountData);
    accounts.value.push(response.data);
    return response.data;
  }

  async function updateAccount(id, accountData) {
    const response = await api.put(`/accounts/${id}`, accountData);
    const index = accounts.value.findIndex((a) => a.id === id);
    if (index !== -1) {
      accounts.value[index] = response.data;
    }
    return response.data;
  }

  async function deleteAccount(id) {
    await api.delete(`/accounts/${id}`);
    accounts.value = accounts.value.filter((a) => a.id !== id);
  }

  return {
    accounts,
    loading,
    error,
    totalBalance,
    accountsByType,
    getAccountById,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
});
