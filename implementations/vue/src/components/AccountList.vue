<!--
  AccountList - Vue Component
  
  V-FOR and KEY:
  - v-for="item in items" :key="item.id"
  - WHY key? Same reason as React - efficient DOM updates
  - Vue uses key to track node identity during reordering
  - Without key, Vue uses "in-place patch" (can cause bugs)
  
  TRANSITIONS in Vue:
  - Built-in <Transition> and <TransitionGroup> components
  - Animate elements entering/leaving the DOM
  - Easier than React's transition libraries
  - Works with v-if, v-show, dynamic components
-->
<script setup>
import { ref, computed, watch } from 'vue';
import { useFetch } from '../composables/useFetch';
import { useDebounce } from '../composables/useDebounce';
import { formatCurrency } from '../utils/helpers';

const filter = ref('');
const accountType = ref('all');

// Debounce the filter for API calls
const debouncedFilter = useDebounce(filter, 300);

// Re-fetch when debounced filter or type changes
const { data: accounts, loading, error } = useFetch(
  computed(() =>
    `/accounts?search=${debouncedFilter.value}&type=${accountType.value}`
  )
);

// WHY computed for filtered list?
// Automatically recalculates when dependencies change
// Cached: only recalculates when accounts, filter, or type changes
const filteredAccounts = computed(() => {
  if (!accounts.value) return [];
  return accounts.value.filter((account) => {
    const matchesSearch = account.name
      .toLowerCase()
      .includes(debouncedFilter.value.toLowerCase());
    const matchesType = accountType.value === 'all' || account.type === accountType.value;
    return matchesSearch && matchesType;
  });
});

// Pagination state
const currentPage = ref(1);
const pageSize = ref(6);

const totalPages = computed(() => Math.ceil(filteredAccounts.value.length / pageSize.value));

const paginatedAccounts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredAccounts.value.slice(start, start + pageSize.value);
});

// Reset to page 1 when filters change
watch([debouncedFilter, accountType], () => {
  currentPage.value = 1;
});

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}
</script>

<template>
  <div class="account-list">
    <h1>My Accounts</h1>

    <!-- Filter controls -->
    <div class="filters">
      <!--
        v-model creates two-way binding
        typing in input updates filter ref automatically
      -->
      <input
        v-model="filter"
        type="text"
        placeholder="Search accounts..."
        class="search-input"
      />
      <select v-model="accountType" class="type-filter">
        <option value="all">All Types</option>
        <option value="checking">Checking</option>
        <option value="savings">Savings</option>
        <option value="credit">Credit Card</option>
      </select>
    </div>

    <div v-if="loading" class="loading-spinner">
      Loading accounts...
    </div>

    <div v-else-if="error" class="error-message">
      Error: {{ error }}
    </div>

    <template v-else>
      <!--
        <TransitionGroup> for list animations
        Vue provides built-in transition support
        Much easier than React's approach
      -->
      <div class="accounts-grid">
        <div
          v-for="account in paginatedAccounts"
          :key="account.id"
          class="account-card"
        >
          <h3>{{ account.name }}</h3>
          <p class="account-type">{{ account.type }}</p>
          <p class="account-balance">{{ formatCurrency(account.balance) }}</p>
          <p class="account-number">****{{ account.number.slice(-4) }}</p>
          <span :class="'status-' + account.status">{{ account.status }}</span>
        </div>
      </div>

      <p v-if="filteredAccounts.length === 0" class="empty-state">
        No accounts found matching your criteria.
      </p>

      <!-- Pagination -->
      <div class="pagination">
        <button :disabled="currentPage <= 1" @click="prevPage">
          Previous
        </button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button :disabled="currentPage >= totalPages" @click="nextPage">
          Next
        </button>
      </div>
    </template>
  </div>
</template>
